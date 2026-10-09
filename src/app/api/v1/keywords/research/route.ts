import { NextRequest, NextResponse } from "next/server";
import { youtubeProvider } from "@/lib/providers/youtube/youtube.provider";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");

  if (!q || !q.trim()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_KEYWORD",
          message: "Keyword parameter ('q') is required.",
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  try {
    const searchRes = await youtubeProvider.searchVideos({
      q: q.trim(),
      maxResults: 20,
    });

    const videos = searchRes.items;
    const totalViews = videos.reduce((acc, v) => acc + v.viewCount, 0);
    const avgViews = videos.length > 0 ? Math.round(totalViews / videos.length) : 0;

    // Competition assessment
    const highViewVideos = videos.filter((v) => v.viewCount > 200000).length;
    let competitionLevel: "Low" | "Medium" | "High" = "Medium";
    if (highViewVideos > 8) competitionLevel = "High";
    else if (highViewVideos < 3) competitionLevel = "Low";

    // Opportunity score: 0 to 100
    // Higher if avgViews is strong and competition is low/medium
    let baseScore = 60;
    if (avgViews > 50000) baseScore += 20;
    if (competitionLevel === "Low") baseScore += 15;
    if (competitionLevel === "High") baseScore -= 15;
    const opportunityScore = Math.max(10, Math.min(baseScore, 95));

    // Extract suggested long-tail queries
    const relatedTerms = [
      `${q.trim()} for beginners`,
      `how to ${q.trim()}`,
      `best ${q.trim()} 2026`,
      `${q.trim()} tutorial`,
      `${q.trim()} mistakes to avoid`,
    ];

    return NextResponse.json({
      success: true,
      data: {
        keyword: q.trim(),
        averageViews: avgViews,
        competitionLevel,
        opportunityScore,
        sampleResultsCount: videos.length,
        topVideos: videos.slice(0, 8),
        relatedTerms,
      },
      metadata: searchRes.attribution,
    });
  } catch (error: any) {
    const msg = error?.message || "Failed to research keyword";
    const isQuota = msg.includes("YOUTUBE_QUOTA_EXCEEDED");
    return NextResponse.json(
      {
        success: false,
        error: {
          code: isQuota ? "YOUTUBE_QUOTA_EXCEEDED" : "KEYWORD_ERROR",
          message: msg,
          status: isQuota ? 429 : 500,
        },
      },
      { status: isQuota ? 429 : 500 }
    );
  }
}
