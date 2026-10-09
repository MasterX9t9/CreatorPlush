import { NextRequest, NextResponse } from "next/server";
import { aiProvider } from "@/lib/providers/ai/ai.provider";
import { youtubeProvider } from "@/lib/providers/youtube/youtube.provider";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, channelId, topicQuery } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PROMPT",
            message: "User prompt is required.",
            status: 400,
          },
        },
        { status: 400 }
      );
    }

    // Step 1: Retrieve genuine data context from YouTube provider if channelId or topicQuery provided
    let groundedVideos: Array<{ id: string; title: string; views: number; outlierMultiplier?: number }> = [];
    let groundedChannels: Array<{ id: string; title: string; views: number; subs: number }> = [];

    if (channelId) {
      try {
        const channelData = await youtubeProvider.getChannel(channelId);
        if (channelData) {
          groundedChannels.push({
            id: channelData.id,
            title: channelData.title,
            views: channelData.viewCount,
            subs: channelData.subscriberCount,
          });
        }
        const outlierData = await youtubeProvider.getChannelVideosWithOutliers(channelId, 15);
        groundedVideos = outlierData.videos.map((v) => ({
          id: v.id,
          title: v.title,
          views: v.viewCount,
          outlierMultiplier: v.outlierAnalysis?.multiplier,
        }));
      } catch {
        // Proceed with available data
      }
    } else if (topicQuery) {
      try {
        const searchData = await youtubeProvider.searchVideos({ q: topicQuery, maxResults: 10 });
        groundedVideos = searchData.items.map((v) => ({
          id: v.id,
          title: v.title,
          views: v.viewCount,
        }));
      } catch {
        // Proceed with available data
      }
    }

    // Step 2: Call AI Provider with strict grounded context
    const aiResult = await aiProvider.generateGroundedAnalysis(prompt, {
      channels: groundedChannels,
      videos: groundedVideos,
    });

    return NextResponse.json({
      success: true,
      data: aiResult,
      metadata: {
        source: "ai_inference",
        dataType: "ai_derived",
        timestamp: new Date().toISOString(),
        confidence: groundedVideos.length > 0 ? 0.9 : 0.6,
      },
    });
  } catch (error: any) {
    const msg = error?.message || "AI Analysis unavailable.";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: msg.includes("GEMINI_API_KEY") ? "MISSING_AI_KEY" : "AI_ERROR",
          message: msg,
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
