import { NextResponse } from "next/server";
import { youtubeProvider } from "@/lib/providers/youtube/youtube.provider";

export async function GET() {
  const quota = youtubeProvider.getQuotaStatus();
  return NextResponse.json({
    success: true,
    data: quota,
    metadata: {
      source: "internal_calculation",
      dataType: "official",
      timestamp: new Date().toISOString(),
      confidence: 1.0,
    },
  });
}
