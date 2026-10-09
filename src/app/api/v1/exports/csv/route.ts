import { NextRequest, NextResponse } from "next/server";
import { generateCsvWithMetadata, CsvColumn, ExportMetadata } from "@/lib/export/csv";
import { youtubeProvider, YouTubeVideoItem } from "@/lib/providers/youtube/youtube.provider";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const exportType = searchParams.get("type") || "outliers";
  const channelId = searchParams.get("channelId");
  const query = searchParams.get("q") || "";
  const workspaceId = searchParams.get("workspaceId") || "default_workspace";

  const nowIso = new Date().toISOString();

  try {
    if (exportType === "outliers") {
      if (!channelId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "MISSING_CHANNEL_ID",
              message: "The 'channelId' parameter is required for outlier CSV exports.",
              status: 400,
            },
          },
          { status: 400 }
        );
      }

      const { videos, channelMedianViews } = await youtubeProvider.getChannelVideosWithOutliers(
        channelId,
        50
      );

      const columns: CsvColumn<YouTubeVideoItem>[] = [
        { header: "Video ID", accessor: (v) => v.id },
        { header: "Title", accessor: (v) => v.title },
        { header: "Published At", accessor: (v) => v.publishedAt },
        { header: "Duration", accessor: (v) => v.durationFormatted },
        { header: "Is Short", accessor: (v) => v.isShort },
        { header: "Views", accessor: (v) => v.viewCount },
        { header: "Expected Views", accessor: (v) => v.outlierAnalysis?.expectedViews || channelMedianViews },
        { header: "Multiplier", accessor: (v) => `${v.outlierAnalysis?.multiplier || 1}x` },
        { header: "Outlier Tier", accessor: (v) => v.outlierAnalysis?.tier || "normal" },
        { header: "Likes", accessor: (v) => v.likeCount },
        { header: "Comments", accessor: (v) => v.commentCount },
      ];

      const metadata: ExportMetadata = {
        generatedAt: nowIso,
        dataSource: "youtube_data_api",
        dateRange: "Recent 50 uploads",
        workspaceId,
        filters: { channelId, channelMedianViews },
      };

      const csvString = generateCsvWithMetadata(videos, columns, metadata);

      return new NextResponse(csvString, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="creatorpulse-outliers-${channelId}-${Date.now()}.csv"`,
        },
      });
    }

    if (exportType === "search") {
      if (!query.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "MISSING_QUERY",
              message: "The 'q' search parameter is required for search CSV exports.",
              status: 400,
            },
          },
          { status: 400 }
        );
      }

      const searchRes = await youtubeProvider.searchVideos({ q: query, maxResults: 30 });

      const columns: CsvColumn<YouTubeVideoItem>[] = [
        { header: "Video ID", accessor: (v) => v.id },
        { header: "Title", accessor: (v) => v.title },
        { header: "Channel Title", accessor: (v) => v.channelTitle },
        { header: "Channel ID", accessor: (v) => v.channelId },
        { header: "Published At", accessor: (v) => v.publishedAt },
        { header: "Duration", accessor: (v) => v.durationFormatted },
        { header: "Views", accessor: (v) => v.viewCount },
        { header: "Likes", accessor: (v) => v.likeCount },
        { header: "Comments", accessor: (v) => v.commentCount },
      ];

      const metadata: ExportMetadata = {
        generatedAt: nowIso,
        dataSource: "youtube_data_api",
        dateRange: "Search query results",
        workspaceId,
        filters: { query },
      };

      const csvString = generateCsvWithMetadata(searchRes.items, columns, metadata);

      return new NextResponse(csvString, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="creatorpulse-search-${Date.now()}.csv"`,
        },
      });
    }

    if (exportType === "swipe") {
      const items = await prisma.swipeItem.findMany({
        where: workspaceId !== "default_workspace" ? { workspaceId } : undefined,
        orderBy: { createdAt: "desc" },
        take: 200,
      });

      const columns: CsvColumn<any>[] = [
        { header: "Item ID", accessor: (s) => s.id },
        { header: "Type", accessor: (s) => s.itemType },
        { header: "Title", accessor: (s) => s.title },
        { header: "YouTube URL", accessor: (s) => s.youtubeUrl || "" },
        { header: "Channel Title", accessor: (s) => s.channelTitle || "" },
        { header: "Views at Save", accessor: (s) => s.viewCountAtSave?.toString() || "" },
        { header: "Outlier Multiplier", accessor: (s) => s.outlierMultiplier ? `${s.outlierMultiplier}x` : "" },
        { header: "Tags", accessor: (s) => (s.tags || []).join("; ") },
        { header: "Saved At", accessor: (s) => s.createdAt.toISOString() },
      ];

      const metadata: ExportMetadata = {
        generatedAt: nowIso,
        dataSource: "postgresql_database",
        dateRange: "All saved swipe items",
        workspaceId,
      };

      const csvString = generateCsvWithMetadata(items, columns, metadata);

      return new NextResponse(csvString, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="creatorpulse-swipefile-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_EXPORT_TYPE",
          message: `Export type '${exportType}' is not supported. Use 'outliers', 'search', or 'swipe'.`,
          status: 400,
        },
      },
      { status: 400 }
    );
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to generate CSV export";
    const isQuota = errorMessage.includes("YOUTUBE_QUOTA_EXCEEDED");
    const isMissingKey = errorMessage.includes("API Key is missing");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: isQuota
            ? "YOUTUBE_QUOTA_EXCEEDED"
            : isMissingKey
            ? "MISSING_YOUTUBE_API_KEY"
            : "EXPORT_FAILED",
          message: errorMessage,
          status: isQuota ? 429 : isMissingKey ? 500 : 502,
        },
      },
      { status: isQuota ? 429 : isMissingKey ? 500 : 502 }
    );
  }
}
