import { NextRequest, NextResponse } from "next/server";
import { getEffectiveYouTubeProvider } from "@/lib/providers/youtube/youtube.provider";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");

  if (!q || q.trim() === "") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_QUERY",
          message: "A channel search query ('q') parameter is required.",
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  const maxResults = Math.min(
    parseInt(searchParams.get("maxResults") || "12", 10),
    30
  );

  try {
    const provider = await getEffectiveYouTubeProvider(request);
    const result = await provider.searchChannels(q, maxResults);

    return NextResponse.json({
      success: true,
      data: result.items,
      metadata: result.attribution,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to search channels";
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
