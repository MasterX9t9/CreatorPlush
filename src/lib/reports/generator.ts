import { youtubeProvider, YouTubeChannelItem, YouTubeVideoItem } from "@/lib/providers/youtube/youtube.provider";
import { estimateRevenueRange } from "@/lib/algorithms/revenue";
import { MetricAttribution } from "@/lib/types";

export interface ChannelAuditReport {
  reportId: string;
  generatedAt: string;
  channel: {
    id: string;
    title: string;
    customUrl?: string;
    subscriberCount: number;
    viewCount: number;
    videoCount: number;
    avgViewsPerVideo?: number;
  };
  metrics: {
    sampleVideoCount: number;
    channelMedianViews: number;
    outlierCount: number;
    outlierPercentage: number;
    maxMultiplier: number;
    estimatedMonthlyRevenue: {
      min: number;
      max: number;
      rpmMin: number;
      rpmMax: number;
    };
  };
  topOutliers: Array<{
    id: string;
    title: string;
    actualViews: number;
    expectedViews: number;
    multiplier: number;
    tier: string;
    publishedAt: string;
  }>;
  dataBackedTakeaways: string[];
  attribution: MetricAttribution;
}

/**
 * Generates an empirical Channel Audit Report from real YouTube data.
 * Adheres strictly to Rule 34 and Rule 19 of AGENTS.md.
 */
export async function generateChannelAuditReport(channelId: string): Promise<ChannelAuditReport> {
  const channel = await youtubeProvider.getChannel(channelId);
  if (!channel) {
    throw new Error(`Report generation failed: Channel with ID '${channelId}' was not found.`);
  }

  const { videos, channelMedianViews } = await youtubeProvider.getChannelVideosWithOutliers(channelId, 30);

  if (videos.length === 0) {
    throw new Error(`Report generation failed: No public videos found for channel '${channel.title}'.`);
  }

  // Calculate Outliers
  const outlierVideos = videos
    .filter((v) => (v.outlierAnalysis?.multiplier || 1) >= 2.0)
    .sort((a, b) => (b.outlierAnalysis?.multiplier || 0) - (a.outlierAnalysis?.multiplier || 0));

  const maxMultiplier = outlierVideos.length > 0
    ? outlierVideos[0].outlierAnalysis?.multiplier || 1
    : 1;

  const outlierPercentage = Number(((outlierVideos.length / videos.length) * 100).toFixed(1));

  // Estimate Revenue
  const revRange = estimateRevenueRange(channel.viewCount, "default");

  // Generate Data-Backed Takeaways based on retrieved videos
  const takeaways: string[] = [];

  takeaways.push(
    `The channel's baseline expected video performance is ${channelMedianViews.toLocaleString()} views (calculated historical median).`
  );

  if (outlierVideos.length > 0) {
    takeaways.push(
      `${outlierPercentage}% of recently analyzed videos broke out as statistical outliers (>=2.0x baseline). Top breakout: "${outlierVideos[0].title}" achieving ${outlierVideos[0].outlierAnalysis?.multiplier}x normal views.`
    );
  } else {
    takeaways.push(
      `Recent uploads show consistent view distribution near the median without high-variance breakouts (>=2.0x).`
    );
  }

  const shortCount = videos.filter((v) => v.isShort).length;
  if (shortCount > 0) {
    takeaways.push(
      `Content mix includes ${shortCount} Shorts (${Math.round((shortCount / videos.length) * 100)}% of recent uploads).`
    );
  }

  const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    reportId,
    generatedAt: new Date().toISOString(),
    channel: {
      id: channel.id,
      title: channel.title,
      customUrl: channel.customUrl,
      subscriberCount: channel.subscriberCount,
      viewCount: channel.viewCount,
      videoCount: channel.videoCount,
      avgViewsPerVideo: channel.avgViewsPerVideo,
    },
    metrics: {
      sampleVideoCount: videos.length,
      channelMedianViews,
      outlierCount: outlierVideos.length,
      outlierPercentage,
      maxMultiplier,
      estimatedMonthlyRevenue: {
        min: revRange.monthlyRevenueMin,
        max: revRange.monthlyRevenueMax,
        rpmMin: revRange.rpmMin,
        rpmMax: revRange.rpmMax,
      },
    },
    topOutliers: outlierVideos.slice(0, 5).map((v) => ({
      id: v.id,
      title: v.title,
      actualViews: v.outlierAnalysis?.actualViews || v.viewCount,
      expectedViews: v.outlierAnalysis?.expectedViews || channelMedianViews,
      multiplier: v.outlierAnalysis?.multiplier || 1,
      tier: v.outlierAnalysis?.tier || "normal",
      publishedAt: v.publishedAt,
    })),
    dataBackedTakeaways: takeaways,
    attribution: {
      source: "internal_calculation",
      dataType: "calculated",
      timestamp: new Date().toISOString(),
      confidence: 0.95,
    },
  };
}
