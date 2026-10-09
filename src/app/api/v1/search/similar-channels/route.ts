import { NextRequest, NextResponse } from "next/server";
import { youtubeProvider } from "@/lib/providers/youtube/youtube.provider";
import { calculateChannelSimilarity, ChannelMetrics } from "@/lib/algorithms/similarity";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get("channelId");
  const maxResults = Math.min(
    parseInt(searchParams.get("maxResults") || "10", 10),
    25
  );

  if (!channelId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_CHANNEL_ID",
          message: "The 'channelId' query parameter is required.",
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch target channel details
    const target = await youtubeProvider.getChannel(channelId);
    if (!target) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CHANNEL_NOT_FOUND",
            message: `Target channel with ID '${channelId}' was not found.`,
            status: 404,
          },
        },
        { status: 404 }
      );
    }

    // 2. Discover candidate peers by querying topic keywords from title & description
    const searchTerms = `${target.title} ${target.description.slice(0, 100)}`;
    const candidateSearchResult = await youtubeProvider.searchChannels(searchTerms, maxResults + 5);

    // 3. Transform target into ChannelMetrics
    const targetMetrics: ChannelMetrics = {
      id: target.id,
      title: target.title,
      subscriberCount: target.subscriberCount,
      viewCount: target.viewCount,
      videoCount: target.videoCount,
      tags: target.title.split(/\s+/),
    };

    // 4. Compute similarity scores for all candidate channels (excluding self)
    const similarChannels = candidateSearchResult.items
      .filter((candidate) => candidate.id !== target.id)
      .slice(0, maxResults)
      .map((candidate) => {
        const candidateMetrics: ChannelMetrics = {
          id: candidate.id,
          title: candidate.title,
          subscriberCount: candidate.subscriberCount,
          viewCount: candidate.viewCount,
          videoCount: candidate.videoCount,
          tags: candidate.title.split(/\s+/),
        };

        const similarity = calculateChannelSimilarity(targetMetrics, candidateMetrics);

        return {
          channel: candidate,
          similarity,
        };
      })
      .sort((a, b) => b.similarity.overallScore - a.similarity.overallScore);

    return NextResponse.json({
      success: true,
      data: {
        targetChannel: target,
        similarChannels,
      },
      metadata: {
        source: "internal_calculation",
        dataType: "calculated",
        timestamp: new Date().toISOString(),
        confidence: 0.9,
      },
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to find similar channels";
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
