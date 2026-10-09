import { NextRequest, NextResponse } from "next/server";
import { getEffectiveYouTubeProvider } from "@/lib/providers/youtube/youtube.provider";
import { analyzePublishTiming, analyzeTagIntelligence } from "@/lib/algorithms/timing";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let videoId = params.id;

  if (!videoId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_VIDEO_ID",
          message: "The video ID parameter is required.",
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  // Clean URL if passed as ID
  if (videoId.includes("watch?v=")) {
    videoId = videoId.split("watch?v=")[1].split("&")[0];
  } else if (videoId.includes("youtu.be/")) {
    videoId = videoId.split("youtu.be/")[1].split("?")[0];
  }

  try {
    const provider = await getEffectiveYouTubeProvider(request);
    const video = await provider.getVideo(videoId);

    if (!video) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VIDEO_NOT_FOUND",
            message: `Could not find YouTube video with ID: ${videoId}`,
            status: 404,
          },
        },
        { status: 404 }
      );
    }

    // Run timing and tag intelligence algorithms
    const timing = analyzePublishTiming(video.publishedAt, video.durationSec);
    const tagIntelligence = analyzeTagIntelligence(
      video.title,
      video.description,
      video.tags || []
    );

    // Calculate velocity and ratio insights
    const publishedDate = new Date(video.publishedAt);
    const daysSincePublish = Math.max(
      (Date.now() - publishedDate.getTime()) / (1000 * 3600 * 24),
      1
    );
    const viewsPerDay = Math.round(video.viewCount / daysSincePublish);
    const engagementRate =
      video.viewCount > 0
        ? Number(
            (((video.likeCount + video.commentCount) / video.viewCount) * 100).toFixed(
              2
            )
          )
        : 0;
    const likeRate =
      video.viewCount > 0
        ? Number(((video.likeCount / video.viewCount) * 100).toFixed(2))
        : 0;
    const commentRate =
      video.viewCount > 0
        ? Number(((video.commentCount / video.viewCount) * 100).toFixed(2))
        : 0;
    const likesPerComment =
      video.commentCount > 0
        ? Number((video.likeCount / video.commentCount).toFixed(1))
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        video,
        timing,
        tagIntelligence,
        metrics: {
          daysSincePublish: Math.round(daysSincePublish),
          viewsPerDay,
          engagementRate,
          likeRate,
          commentRate,
          likesPerComment,
        },
      },
      metadata: video.attribution,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to retrieve video intelligence";
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
