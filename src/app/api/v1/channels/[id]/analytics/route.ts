import { NextRequest, NextResponse } from "next/server";
import { youtubeProvider } from "@/lib/providers/youtube/youtube.provider";
import { estimateRevenueRange } from "@/lib/algorithms/revenue";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let channelInput = params.id;

  if (!channelInput) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_CHANNEL_ID",
          message: "Channel identifier (handle, URL, or ID) is required.",
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  try {
    // 1. Resolve authentic channel profile using resilient URL/handle parsing
    const channel = await youtubeProvider.getChannel(channelInput);
    if (!channel) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CHANNEL_NOT_FOUND",
            message: `Could not find any YouTube channel matching: "${channelInput}". Please check the channel link, handle, or ID.`,
            status: 404,
          },
        },
        { status: 404 }
      );
    }

    // 2. Fetch recent videos with canonical channel.id and compute outliers
    const { videos, channelMedianViews } =
      await youtubeProvider.getChannelVideosWithOutliers(channel.id, 30);

    const shorts = videos.filter((v) => v.isShort);
    const longForm = videos.filter((v) => !v.isShort);

    const totalViewsInSample = videos.reduce((acc, v) => acc + v.viewCount, 0);
    const avgViews = videos.length > 0 ? Math.round(totalViewsInSample / videos.length) : 0;

    const shortsTotalViews = shorts.reduce((acc, v) => acc + v.viewCount, 0);
    const shortsAvgViews = shorts.length > 0 ? Math.round(shortsTotalViews / shorts.length) : 0;

    const longFormTotalViews = longForm.reduce((acc, v) => acc + v.viewCount, 0);
    const longFormAvgViews = longForm.length > 0 ? Math.round(longFormTotalViews / longForm.length) : 0;

    // Outlier distribution
    const outliersCount = videos.filter(
      (v) => (v.outlierAnalysis?.multiplier || 1.0) >= 2.0
    ).length;
    const megaOutliersCount = videos.filter(
      (v) => (v.outlierAnalysis?.multiplier || 1.0) >= 5.0
    ).length;
    const outlierPercentage =
      videos.length > 0 ? Math.round((outliersCount / videos.length) * 100) : 0;

    // Upload Cadence Calculation
    let uploadsPerWeek = 0;
    if (videos.length >= 2) {
      const timestamps = videos.map((v) => new Date(v.publishedAt).getTime());
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      const weeksSpan = Math.max((maxTime - minTime) / (1000 * 3600 * 24 * 7), 1);
      uploadsPerWeek = Number((videos.length / weeksSpan).toFixed(1));
    }

    // Subscriber Reach Ratio
    const reachRatio =
      channel.subscriberCount > 0
        ? Number(((avgViews / channel.subscriberCount) * 100).toFixed(1))
        : 0;

    // Dominant Category & Top Recurring Keywords
    const categoryCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};

    videos.forEach((v) => {
      if (v.categoryName) {
        categoryCounts[v.categoryName] = (categoryCounts[v.categoryName] || 0) + 1;
      }
      (v.tags || []).forEach((t) => {
        const norm = t.trim().toLowerCase();
        if (norm.length > 2) {
          tagCounts[norm] = (tagCounts[norm] || 0) + 1;
        }
      });
    });

    const dominantCategory = Object.entries(categoryCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || "General";

    const topKeywords = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag, count]) => ({ tag, count }));

    // Monthly revenue estimation based on velocity
    const estimatedMonthlyViews = Math.max(avgViews * (uploadsPerWeek > 0 ? uploadsPerWeek * 4 : 4), 1000);
    const revenueEstimate = estimateRevenueRange(estimatedMonthlyViews, "default");

    // Top videos sorted by view count
    const topVideos = [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 6);

    return NextResponse.json({
      success: true,
      data: {
        channel,
        medianViews: channelMedianViews,
        averageViews: avgViews,
        sampleVideoCount: videos.length,
        shortsCount: shorts.length,
        longFormCount: longForm.length,
        shortsAvgViews,
        longFormAvgViews,
        uploadsPerWeek,
        reachRatio,
        dominantCategory,
        topKeywords,
        outliersCount,
        megaOutliersCount,
        outlierPercentage,
        revenueEstimate,
        topVideos,
        recentVideos: videos.slice(0, 12),
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
