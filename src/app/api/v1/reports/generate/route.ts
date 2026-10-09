import { NextRequest, NextResponse } from "next/server";
import { generateChannelAuditReport } from "@/lib/reports/generator";
import { prisma } from "@/lib/db";

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
            message: "The 'channelId' property is required in the request body.",
            status: 400,
          },
        },
        { status: 400 }
      );
    }

    // Generate empirical report
    const report = await generateChannelAuditReport(channelId.trim());

    // If workspace provided and exists, persist to database
    if (workspaceId) {
      try {
        const workspaceExists = await prisma.workspace.findUnique({
          where: { id: workspaceId },
        });

        if (workspaceExists) {
          await prisma.report.create({
            data: {
              workspaceId,
              title: `Audit Report: ${report.channel.title}`,
              reportType: "CHANNEL_AUDIT",
              dateRange: "Recent 30 Uploads",
              jsonData: report as any,
            },
          });
        }
      } catch (dbErr) {
        console.warn("Could not persist report to database, returning memory report:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: report,
      metadata: report.attribution,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Report generation failed";
    const isQuota = errorMessage.includes("YOUTUBE_QUOTA_EXCEEDED");
    const isMissingKey = errorMessage.includes("API Key is missing");
    const isNotFound = errorMessage.includes("was not found");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: isNotFound
            ? "CHANNEL_NOT_FOUND"
            : isQuota
            ? "YOUTUBE_QUOTA_EXCEEDED"
            : isMissingKey
            ? "MISSING_YOUTUBE_API_KEY"
            : "REPORT_FAILED",
          message: errorMessage,
          status: isNotFound ? 404 : isQuota ? 429 : isMissingKey ? 500 : 502,
        },
      },
      { status: isNotFound ? 404 : isQuota ? 429 : isMissingKey ? 500 : 502 }
    );
  }
}
