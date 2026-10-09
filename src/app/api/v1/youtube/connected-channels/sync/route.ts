import { NextRequest, NextResponse } from "next/server";
import { youtubeProvider } from "@/lib/providers/youtube/youtube.provider";
import { channelRepository } from "@/lib/repositories/channel-repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId } = body;

    if (!channelId || typeof channelId !== "string" || !channelId.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "The 'channelId' parameter is required for synchronization.",
            status: 400,
          },
        },
        { status: 400 }
      );
    }

    const cleanId = channelId.trim();

    // 1. Fetch fresh channel metrics
    const channel = await youtubeProvider.getChannel(cleanId);
    if (!channel) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CHANNEL_NOT_FOUND",
            message: `Could not find YouTube channel: ${cleanId}`,
            status: 404,
          },
        },
        { status: 404 }
      );
    }

    // 2. Fetch fresh recent videos and calculate median outlier baseline
    let medianViews = 0;
    let syncedVideosCount = 0;
    try {
      const outlierData = await youtubeProvider.getChannelVideosWithOutliers(cleanId, 25);
      medianViews = outlierData.channelMedianViews;
      syncedVideosCount = outlierData.videos.length;
    } catch (vidErr) {
      console.warn("Could not sync fresh videos during channel sync:", vidErr);
    }

    // 3. Update Channel in repository
    const updatedChannel = await channelRepository.updateChannelMetrics(cleanId, {
      title: channel.title,
      customUrl: channel.customUrl,
      avatarUrl: channel.avatarUrl,
      bannerUrl: channel.bannerUrl,
      description: channel.description,
      subscriberCount: channel.subscriberCount,
      viewCount: channel.viewCount,
      videoCount: channel.videoCount,
      avgViewsPerVideo: channel.avgViewsPerVideo,
      medianViews: medianViews > 0 ? medianViews : undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...(updatedChannel || channel),
        syncedVideosCount,
      },
      metadata: channel.attribution,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SYNC_ERROR",
          message: error?.message || "Failed to synchronize channel.",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
