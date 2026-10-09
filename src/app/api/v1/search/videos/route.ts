import { NextRequest, NextResponse } from "next/server";
import { getEffectiveYouTubeProvider } from "@/lib/providers/youtube/youtube.provider";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";

export async function GET(request: NextRequest) {
  // 1. Rate limiting protection (30 search queries/min per IP)
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`search_${clientIp}`, 30, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TOO_MANY_REQUESTS",
          message: `Search rate limit reached. Please wait ${rateLimit.resetSeconds} seconds before searching again.`,
          status: 429,
        },
      },
      {
        status: 429,
        headers: { "Retry-After": rateLimit.resetSeconds.toString() },
      }
    );
  }

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

  // Detect if query is a direct YouTube video URL (costs 1 unit vs 100 units for search)
  function extractVideoId(query: string): string | null {
    const trimmed = query.trim();
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
    const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    return null;
  }

  const directVideoId = extractVideoId(q);

  try {
    const provider = await getEffectiveYouTubeProvider(request);

    if (directVideoId) {
      const directVideo = await provider.getVideo(directVideoId);
      if (directVideo) {
        return NextResponse.json({
          success: true,
          data: [directVideo],
          metadata: directVideo.attribution,
          pagination: {
            totalResults: 1,
            hasMore: false,
          },
        });
      }
    }

    // Check if query is a channel URL or handle (e.g. @LegendMangaReels or https://www.youtube.com/@...)
    const isChannelQuery =
      q.includes("youtube.com/@") ||
      q.includes("youtube.com/channel/") ||
      q.trim().startsWith("@");

    if (isChannelQuery) {
      const ch = await provider.getChannel(q);
      if (ch) {
        const { videos } = await provider.getChannelVideosWithOutliers(ch.id, maxResults);
        return NextResponse.json({
          success: true,
          data: videos,
          metadata: {
            source: "youtube_data_api",
            dataType: "official",
            timestamp: new Date().toISOString(),
            confidence: 1.0,
          },
          pagination: {
            totalResults: videos.length,
            hasMore: false,
          },
        });
      }
    }

    const result = await provider.searchVideos({
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
