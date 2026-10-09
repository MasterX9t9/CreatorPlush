import { NextRequest, NextResponse } from "next/server";
import { youtubeProvider } from "@/lib/providers/youtube/youtube.provider";
import { calculateVideoSimilarity, VideoMetrics } from "@/lib/algorithms/similarity";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get("videoId");
  const maxResults = Math.min(
    parseInt(searchParams.get("maxResults") || "10", 10),
    25
  );

  if (!videoId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_VIDEO_ID",
          message: "The 'videoId' query parameter is required.",
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch target video details
    const target = await youtubeProvider.getVideo(videoId);
    if (!target) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VIDEO_NOT_FOUND",
            message: `Target video with ID '${videoId}' was not found.`,
            status: 404,
          },
        },
        { status: 404 }
      );
    }

    // 2. Discover candidate peers by querying topic keywords from title
    const searchTerms = target.title;
    const candidateSearchResult = await youtubeProvider.searchVideos({
      q: searchTerms,
      maxResults: maxResults + 5,
    });

    // 3. Transform target into VideoMetrics
    const targetMetrics: VideoMetrics = {
      id: target.id,
      title: target.title,
      durationSec: target.durationSec,
      viewCount: target.viewCount,
      likeCount: target.likeCount,
      tags: target.title.split(/\s+/),
    };

    // 4. Compute similarity scores for all candidate videos (excluding self)
    const similarVideos = candidateSearchResult.items
      .filter((candidate) => candidate.id !== target.id)
      .slice(0, maxResults)
      .map((candidate) => {
        const candidateMetrics: VideoMetrics = {
          id: candidate.id,
          title: candidate.title,
          durationSec: candidate.durationSec,
          viewCount: candidate.viewCount,
          likeCount: candidate.likeCount,
          tags: candidate.title.split(/\s+/),
        };

        const similarity = calculateVideoSimilarity(targetMetrics, candidateMetrics);

        return {
          video: candidate,
          similarity,
        };
      })
      .sort((a, b) => b.similarity.overallScore - a.similarity.overallScore);

    return NextResponse.json({
      success: true,
      data: {
        targetVideo: target,
        similarVideos,
      },
      metadata: {
        source: "internal_calculation",
        dataType: "calculated",
        timestamp: new Date().toISOString(),
        confidence: 0.9,
      },
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to find similar videos";
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
