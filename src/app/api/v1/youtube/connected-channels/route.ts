import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: "default" },
      include: {
        youtubeAccounts: {
          include: {
            channels: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const connectedChannels = workspace.youtubeAccounts.flatMap((acc) =>
      acc.channels.map((ch) => ({
        id: ch.id,
        accountId: acc.id,
        title: ch.title,
        customUrl: ch.customUrl,
        avatarUrl: ch.avatarUrl,
        subscriberCount: Number(ch.subscriberCount),
        viewCount: Number(ch.viewCount),
        videoCount: ch.videoCount,
        lastSyncedAt: ch.lastSyncedAt,
      }))
    );

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
          code: "DATABASE_QUERY_ERROR",
          message: error?.message || "Failed to load connected channels.",
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
    await prisma.channel.delete({
      where: { id: channelId },
    });

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
