import { NextRequest, NextResponse } from "next/server";
import { getEffectiveYouTubeProvider } from "@/lib/providers/youtube/youtube.provider";

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
    const provider = await getEffectiveYouTubeProvider(request);
    const channel = await provider.getChannel(channelId);

    if (!channel) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CHANNEL_NOT_FOUND",
            message: `No YouTube channel found with ID: ${channelId}`,
            status: 404,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: channel,
      metadata: channel.attribution,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to fetch channel details";
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
