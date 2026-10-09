import { NextRequest, NextResponse } from "next/server";
import { youtubeProvider } from "@/lib/providers/youtube/youtube.provider";
import { estimateRevenueRange } from "@/lib/algorithms/revenue";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const channelId = params.id;

  if (!channelId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_CHANNEL_ID",
          message: "Channel ID parameter is required.",
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  try {
    const channel = await youtubeProvider.getChannel(channelId);
    if (!channel) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CHANNEL_NOT_FOUND",
            message: `Channel not found with ID: ${channelId}`,
            status: 404,
          },
        },
        { status: 404 }
      );
    }

    const { videos, channelMedianViews } =
      await youtubeProvider.getChannelVideosWithOutliers(channelId, 30);

    const shorts = videos.filter((v) => v.isShort);
    const longForm = videos.filter((v) => !v.isShort);

    const totalViewsInSample = videos.reduce((acc, v) => acc + v.viewCount, 0);
    const avgViews = videos.length > 0 ? Math.round(totalViewsInSample / videos.length) : 0;

    const outliersCount = videos.filter(
      (v) => (v.outlierAnalysis?.multiplier || 1.0) >= 2.0
    ).length;
    const outlierPercentage =
      videos.length > 0 ? Math.round((outliersCount / videos.length) * 100) : 0;

    // Approximate monthly views based on recent velocity
    const estimatedMonthlyViews = Math.max(avgViews * 4, 1000);
    const revenueEstimate = estimateRevenueRange(estimatedMonthlyViews, "default");

    // Top videos sorted by viewCount
    const topVideos = [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        channel,
        medianViews: channelMedianViews,
        averageViews: avgViews,
        sampleVideoCount: videos.length,
        shortsCount: shorts.length,
        longFormCount: longForm.length,
        outlierPercentage,
        revenueEstimate,
        topVideos,
        recentVideos: videos.slice(0, 10),
      },
      metadata: {
        source: "internal_calculation",
        dataType: "calculated",
        timestamp: new Date().toISOString(),
        confidence: 0.95,
      },
    });
  } catch (error: any) {
    const msg = error?.message || "Failed to compile channel analytics";
    const isQuota = msg.includes("YOUTUBE_QUOTA_EXCEEDED");
    return NextResponse.json(
      {
        success: false,
        error: {
          code: isQuota ? "YOUTUBE_QUOTA_EXCEEDED" : "ANALYTICS_ERROR",
          message: msg,
          status: isQuota ? 429 : 500,
        },
      },
      { status: isQuota ? 429 : 500 }
    );
  }
}
