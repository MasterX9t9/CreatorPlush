import { NextRequest, NextResponse } from "next/server";
import { youtubeProvider } from "@/lib/providers/youtube/youtube.provider";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");

  if (!q || q.trim() === "") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_QUERY",
          message: "A search query ('q') parameter is required.",
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  const maxResults = Math.min(
    parseInt(searchParams.get("maxResults") || "20", 10),
    50
  );
  const pageToken = searchParams.get("pageToken") || undefined;
  const order = (searchParams.get("order") as any) || "relevance";
  const videoDuration = (searchParams.get("videoDuration") as any) || "any";
  const publishedAfter = searchParams.get("publishedAfter") || undefined;
  const publishedBefore = searchParams.get("publishedBefore") || undefined;

  try {
    const result = await youtubeProvider.searchVideos({
      q,
      maxResults,
      pageToken,
      order,
      videoDuration,
      publishedAfter,
      publishedBefore,
    });

    return NextResponse.json({
      success: true,
      data: result.items,
      metadata: result.attribution,
      pagination: {
        nextPageToken: result.nextPageToken,
        totalResults: result.totalResults,
        hasMore: Boolean(result.nextPageToken),
      },
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to search YouTube videos";
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
