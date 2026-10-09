import { NextRequest, NextResponse } from "next/server";
import { youtubeProvider } from "@/lib/providers/youtube/youtube.provider";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get("channelId");
  const threshold = searchParams.get("threshold") || "2x"; // "2x", "5x", "10x", "20x_plus"

  if (!channelId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_CHANNEL_ID",
          message: "Please specify a channelId parameter to analyze statistical outliers.",
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  try {
    const result = await youtubeProvider.getChannelVideosWithOutliers(channelId, 30);

    // Filter by requested threshold if requested
    let filteredVideos = result.videos;
    if (threshold === "2x") {
      filteredVideos = filteredVideos.filter(
        (v) => (v.outlierAnalysis?.multiplier || 0) >= 2.0
      );
    } else if (threshold === "5x") {
      filteredVideos = filteredVideos.filter(
        (v) => (v.outlierAnalysis?.multiplier || 0) >= 5.0
      );
    } else if (threshold === "10x") {
      filteredVideos = filteredVideos.filter(
        (v) => (v.outlierAnalysis?.multiplier || 0) >= 10.0
      );
    } else if (threshold === "20x_plus") {
      filteredVideos = filteredVideos.filter(
        (v) => (v.outlierAnalysis?.multiplier || 0) >= 20.0
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        channelId,
        channelMedianViews: result.channelMedianViews,
        totalAnalyzed: result.videos.length,
        outlierCount: filteredVideos.length,
        videos: filteredVideos,
      },
      metadata: result.attribution,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to analyze outliers";
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
            : "EXTERNAL_API_ERROR",
          message: errorMessage,
          status: isQuota ? 429 : isMissingKey ? 500 : 502,
        },
      },
      { status: isQuota ? 429 : isMissingKey ? 500 : 502 }
    );
  }
}
