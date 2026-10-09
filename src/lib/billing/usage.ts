import { prisma } from "@/lib/db";
import { PlanTier } from "@prisma/client";

export interface PlanLimits {
  searchesPerMonth: number;
  aiRequestsPerMonth: number;
  maxTrackedChannels: number;
  maxApiKeys: number;
  maxWebhooks: number;
  canExportCsv: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: {
    searchesPerMonth: 50,
    aiRequestsPerMonth: 10,
    maxTrackedChannels: 3,
    maxApiKeys: 1,
    maxWebhooks: 1,
    canExportCsv: true,
  },
  CREATOR: {
    searchesPerMonth: 500,
    aiRequestsPerMonth: 100,
    maxTrackedChannels: 25,
    maxApiKeys: 3,
    maxWebhooks: 5,
    canExportCsv: true,
  },
  PRO: {
    searchesPerMonth: 5000,
    aiRequestsPerMonth: 500,
    maxTrackedChannels: 100,
    maxApiKeys: 10,
    maxWebhooks: 25,
    canExportCsv: true,
  },
  AGENCY: {
    searchesPerMonth: 999999,
    aiRequestsPerMonth: 2000,
    maxTrackedChannels: 500,
    maxApiKeys: 50,
    maxWebhooks: 100,
    canExportCsv: true,
  },
};

/**
 * Returns current year-month string (e.g. "2026-10") for usage period bucket
 */
export function getCurrentPeriodKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Checks server-side usage limit for a given metric conforming to Rule 45 of AGENTS.md.
 */
export async function checkUsageLimit(
  workspaceId: string,
  metric: "searches" | "ai_requests" | "tracked_channels"
): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  tier: PlanTier;
  periodKey: string;
}> {
  const periodKey = getCurrentPeriodKey();

  // 1. Fetch workspace subscription tier
  const sub = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  const tier: PlanTier = sub?.status === "active" ? sub.tier : "FREE";
  const limits = PLAN_LIMITS[tier];

  // 2. Fetch current usage record
  let current = 0;

  if (metric === "tracked_channels") {
    current = await prisma.trackedChannel.count({
      where: { workspaceId },
    });
    const limit = limits.maxTrackedChannels;
    return {
      allowed: current < limit,
      current,
      limit,
      tier,
      periodKey,
    };
  }

  const usageRecord = await prisma.usageRecord.findUnique({
    where: {
      workspaceId_metric_periodDate: {
        workspaceId,
        metric,
        periodDate: periodKey,
      },
    },
  });

  current = usageRecord?.count || 0;
  const limit = metric === "searches" ? limits.searchesPerMonth : limits.aiRequestsPerMonth;

  return {
    allowed: current < limit,
    current,
    limit,
    tier,
    periodKey,
  };
}

/**
 * Records an incremental usage event in the database for the active workspace.
 */
export async function recordUsageEvent(
  workspaceId: string,
  metric: string,
  incrementBy = 1
): Promise<number> {
  const periodKey = getCurrentPeriodKey();

  const record = await prisma.usageRecord.upsert({
    where: {
      workspaceId_metric_periodDate: {
        workspaceId,
        metric,
        periodDate: periodKey,
      },
    },
    create: {
      workspaceId,
      metric,
      periodDate: periodKey,
      count: incrementBy,
    },
    update: {
      count: {
        increment: incrementBy,
      },
    },
  });

  return record.count;
}
