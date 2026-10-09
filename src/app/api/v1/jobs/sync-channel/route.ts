import { NextRequest, NextResponse } from "next/server";
import { jobQueue } from "@/lib/workers/queue";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { channelId, workspaceId } = body;

    if (!channelId || typeof channelId !== "string" || !channelId.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_CHANNEL_ID",
            message: "The 'channelId' parameter is required.",
            status: 400,
          },
        },
        { status: 400 }
      );
    }

    const job = jobQueue.enqueue("CHANNEL_SYNC", {
      channelId: channelId.trim(),
      workspaceId,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          jobId: job.id,
          type: job.type,
          state: job.state,
          progress: job.progress,
          createdAt: job.createdAt,
          message: "Channel synchronization job queued successfully.",
        },
      },
      { status: 202 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "QUEUE_ERROR",
          message: error?.message || "Failed to enqueue synchronization job",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
