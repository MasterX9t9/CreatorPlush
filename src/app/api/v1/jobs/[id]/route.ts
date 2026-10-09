import { NextRequest, NextResponse } from "next/server";
import { jobQueue } from "@/lib/workers/queue";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;

  const job = jobQueue.getJob(jobId);

  if (!job) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "JOB_NOT_FOUND",
          message: `Job with ID '${jobId}' not found.`,
          status: 404,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: job.id,
      type: job.type,
      state: job.state,
      progress: job.progress,
      createdAt: job.createdAt,
      startedAt: job.startedAt || null,
      completedAt: job.completedAt || null,
      result: job.result || null,
      error: job.error || null,
    },
  });
}
