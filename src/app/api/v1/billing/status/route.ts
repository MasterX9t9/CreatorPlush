import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkUsageLimit, getCurrentPeriodKey, PLAN_LIMITS } from "@/lib/billing/usage";
import { PlanTier } from "@prisma/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  let workspaceId = searchParams.get("workspaceId");

  try {
    if (!workspaceId) {
      const firstWs = await prisma.workspace.findFirst({
        include: { subscription: true },
      });
      if (firstWs) {
        workspaceId = firstWs.id;
      }
    }

    if (!workspaceId) {
      return NextResponse.json({
        success: true,
        data: {
          tier: "FREE",
          status: "active",
          limits: PLAN_LIMITS.FREE,
          usage: {
            searches: { current: 0, limit: PLAN_LIMITS.FREE.searchesPerMonth },
            aiRequests: { current: 0, limit: PLAN_LIMITS.FREE.aiRequestsPerMonth },
            trackedChannels: { current: 0, limit: PLAN_LIMITS.FREE.maxTrackedChannels },
          },
          periodKey: getCurrentPeriodKey(),
        },
      });
    }

    const sub = await prisma.subscription.findUnique({
      where: { workspaceId },
    });

    const tier: PlanTier = sub?.status === "active" ? sub.tier : "FREE";
    const limits = PLAN_LIMITS[tier];

    const [searchesCheck, aiCheck, trackedCheck] = await Promise.all([
      checkUsageLimit(workspaceId, "searches"),
      checkUsageLimit(workspaceId, "ai_requests"),
      checkUsageLimit(workspaceId, "tracked_channels"),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        workspaceId,
        tier,
        status: sub?.status || "active",
        currentPeriodEnd: sub?.currentPeriodEnd || null,
        limits,
        usage: {
          searches: { current: searchesCheck.current, limit: searchesCheck.limit, allowed: searchesCheck.allowed },
          aiRequests: { current: aiCheck.current, limit: aiCheck.limit, allowed: aiCheck.allowed },
          trackedChannels: { current: trackedCheck.current, limit: trackedCheck.limit, allowed: trackedCheck.allowed },
        },
        periodKey: getCurrentPeriodKey(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DB_ERROR",
          message: error?.message || "Failed to retrieve billing status",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
