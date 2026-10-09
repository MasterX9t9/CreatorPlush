import { NextRequest, NextResponse } from "next/server";
import { youtubeProvider } from "@/lib/providers/youtube/youtube.provider";
import { channelRepository, ConnectedChannelRecord } from "@/lib/repositories/channel-repository";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceSlug = searchParams.get("workspace") || "default";

  try {
    const connectedChannels = await channelRepository.getConnectedChannels(workspaceSlug);

    return NextResponse.json({
      success: true,
      data: connectedChannels,
      metadata: {
        source: "youtube_data_api",
        dataType: "official",
        timestamp: new Date().toISOString(),
        confidence: 1.0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "REPOSITORY_ERROR",
          message: error?.message || "Failed to load connected channels.",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelInput, workspaceSlug = "default" } = body;

    if (!channelInput || typeof channelInput !== "string" || !channelInput.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Please provide a YouTube channel handle, URL, or Channel ID.",
            status: 400,
          },
        },
        { status: 400 }
      );
    }

    // 1. Resolve authentic channel profile using YouTube Data API v3
    const channel = await youtubeProvider.getChannel(channelInput.trim());

    if (!channel) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CHANNEL_NOT_FOUND",
            message: `Could not find any YouTube channel matching "${channelInput.trim()}". Please verify the channel handle (e.g. '@LegendMangaReels') or channel URL.`,
            status: 404,
          },
        },
        { status: 404 }
      );
    }

    // 2. Fetch recent uploads with statistical outlier baselines
    let medianViews = 0;
    let syncedVideosCount = 0;
    try {
      const outlierData = await youtubeProvider.getChannelVideosWithOutliers(channel.id, 20);
      medianViews = outlierData.channelMedianViews;
      syncedVideosCount = outlierData.videos.length;
    } catch (videoErr) {
      console.warn("Could not sync channel videos immediately:", videoErr);
    }

    // 3. Save channel using repository (Prisma PostgreSQL + fallback)
    const channelRecord: ConnectedChannelRecord = {
      id: channel.id,
      accountId: `yt_${channel.id}`,
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
    };

    const savedChannel = await channelRepository.saveConnectedChannel(
      channelRecord,
      workspaceSlug
    );

    return NextResponse.json({
      success: true,
      data: {
        ...savedChannel,
        syncedVideosCount,
      },
      metadata: channel.attribution,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CHANNEL_CONNECTION_ERROR",
          message: error?.message || "Failed to connect YouTube channel.",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_CHANNEL_ID",
          message: "channelId parameter is required for disconnection.",
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  try {
    await channelRepository.disconnectChannel(channelId);

    return NextResponse.json({
      success: true,
      data: { disconnectedChannelId: channelId },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DISCONNECT_FAILED",
          message: error?.message || "Could not decouple channel.",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
