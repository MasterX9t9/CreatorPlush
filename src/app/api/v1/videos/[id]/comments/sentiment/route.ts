import { NextRequest, NextResponse } from "next/server";
import { youtubeProvider } from "@/lib/providers/youtube/youtube.provider";
import { analyzeCommentSentiment } from "@/lib/algorithms/sentiment";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const videoId = params.id;

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

  try {
    const commentsData = await youtubeProvider.getVideoComments(videoId, 50);

    if (commentsData.disabled) {
      return NextResponse.json({
        success: true,
        data: {
          videoId,
          disabled: true,
          message: "Comments are disabled or restricted for this video on YouTube.",
          sampleCount: 0,
          positivePct: 0,
          neutralPct: 0,
          negativePct: 0,
          sentimentScore: 0,
          topThemes: [],
          viewerRequests: [],
          commonQuestions: [],
          formula: "N/A (Comments disabled)",
        },
        metadata: commentsData.attribution,
      });
    }

    const sentimentResult = analyzeCommentSentiment(commentsData.comments);

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        disabled: false,
        ...sentimentResult,
        recentSample: commentsData.comments.slice(0, 8),
      },
      metadata: sentimentResult.attribution,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to analyze video comments";
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
