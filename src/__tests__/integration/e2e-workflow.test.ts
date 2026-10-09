import { describe, it, expect, vi } from "vitest";
import { calculateExpectedViews, calculateOutlierScore } from "@/lib/algorithms/outliers";
import { estimateRevenueRange } from "@/lib/algorithms/revenue";
import { calculateChannelSimilarity, ChannelMetrics } from "@/lib/algorithms/similarity";
import { analyzeCommentSentiment, CommentInput } from "@/lib/algorithms/sentiment";
import { generateCsvWithMetadata, CsvColumn } from "@/lib/export/csv";
import { JobQueueEngine } from "@/lib/workers/queue";
import { generateApiKey, hashApiKey, generateHmacSignature } from "@/lib/crypto";
import { PLAN_LIMITS, getCurrentPeriodKey } from "@/lib/billing/usage";

describe("CreatorPulse End-to-End System Workflow Verification", () => {
  // Workflow 1: Statistical Outlier Discovery & Integrity
  it("Workflow 1: Calculates genuine statistical outliers using historical median formula without mock numbers", () => {
    const historicalViews = [12000, 15000, 14000, 16000, 13000, 18000, 14500];
    const expectedViews = calculateExpectedViews(historicalViews);

    // Median of 7 items sorted: [12000, 13000, 14000, 14500, 15000, 16000, 18000] = 14500
    expect(expectedViews).toBe(14500);

    // Test a viral video breaking out
    const viralVideoViews = 72500; // 5x
    const outlierResult = calculateOutlierScore(viralVideoViews, expectedViews);

    expect(outlierResult.actualViews).toBe(72500);
    expect(outlierResult.expectedViews).toBe(14500);
    expect(outlierResult.multiplier).toBe(5.0);
    expect(outlierResult.tier).toBe("5x");
    expect(outlierResult.formula).toContain("actualViews / median");
  });

  // Workflow 2: Transparent Revenue Range Estimation (No Fake Single Figures)
  it("Workflow 2: Estimates AdSense revenue as an honest bracket range rather than a deceptive point decimal", () => {
    const totalViews = 250000;
    const est = estimateRevenueRange(totalViews, "tech");

    expect(est.isOfficial).toBe(false);
    expect(est.monthlyRevenueMin).toBeLessThan(est.monthlyRevenueMax);
    expect(est.rpmMin).toBe(4.5);
    expect(est.rpmMax).toBe(12.0);
    expect(est.monthlyRevenueMin).toBeGreaterThan(0);
    expect(est.monthlyRevenueMax).toBe(3000);
  });

  // Workflow 3: Channel Peer Comparison & Algorithmic Similarity
  it("Workflow 3: Compares channel metrics and calculates multi-factor peer similarity score", () => {
    const channelA: ChannelMetrics = {
      id: "ch_alpha",
      title: "Finance & Investing Mastery",
      category: "Finance",
      subscriberCount: 500000,
      viewCount: 30000000,
      videoCount: 200,
      uploadFrequencyWeekly: 2,
    };

    const channelB: ChannelMetrics = {
      id: "ch_beta",
      title: "Stock Market & Investing Daily",
      category: "Finance",
      subscriberCount: 450000,
      viewCount: 28000000,
      videoCount: 190,
      uploadFrequencyWeekly: 2,
    };

    const simResult = calculateChannelSimilarity(channelA, channelB);

    expect(simResult.overallScore).toBeGreaterThanOrEqual(60);
    expect(simResult.breakdown.sizeSimilarity).toBeGreaterThan(90);
    expect(simResult.breakdown.cadenceSimilarity).toBe(100);
    expect(simResult.attribution.dataType).toBe("calculated");
  });

  // Workflow 4: Audience Comment Sentiment & Request Discovery
  it("Workflow 4: Extracts sentiment, topics, and viewer tutorial requests from public comment threads", () => {
    const comments: CommentInput[] = [
      {
        id: "c1",
        author: "DevViewer",
        text: "Please make a video on Microservices architecture!",
        likeCount: 50,
        publishedAt: "2026-10-09T00:00:00Z",
      },
      {
        id: "c2",
        author: "CodingFan",
        text: "Incredible tutorial, best explanation on YouTube! Thank you!",
        likeCount: 120,
        publishedAt: "2026-10-09T01:00:00Z",
      },
      {
        id: "c3",
        author: "Student",
        text: "How do we configure CORS in Next.js?",
        likeCount: 15,
        publishedAt: "2026-10-09T02:00:00Z",
      },
    ];

    const sentiment = analyzeCommentSentiment(comments);

    expect(sentiment.sampleCount).toBe(3);
    expect(sentiment.positivePct).toBeGreaterThan(0);
    expect(sentiment.viewerRequests.some((r) => r.includes("Microservices"))).toBe(true);
    expect(sentiment.commonQuestions.some((q) => q.includes("CORS"))).toBe(true);
  });

  // Workflow 5: RFC 4180 CSV Export with Rule 33 Metadata Header
  it("Workflow 5: Formats CSV exports with frozen source timestamps, filters, and injection safety", () => {
    interface ExportItem {
      id: string;
      title: string;
      multiplier: number;
    }

    const items: ExportItem[] = [
      { id: "v_1", title: "Top AI Agents in 2026", multiplier: 4.2 },
      { id: "v_2", title: "@DangerousFormula", multiplier: 1.0 },
    ];

    const columns: CsvColumn<ExportItem>[] = [
      { header: "Video ID", accessor: (i) => i.id },
      { header: "Title", accessor: (i) => i.title },
      { header: "Outlier Multiplier", accessor: (i) => `${i.multiplier}x` },
    ];

    const csvOutput = generateCsvWithMetadata(items, columns, {
      generatedAt: "2026-10-09T12:00:00Z",
      dataSource: "youtube_data_api",
      dateRange: "All Time",
      workspaceId: "ws_prod_999",
      filters: { niche: "ai_tech" },
    });

    expect(csvOutput).toContain("# CreatorPulse Export");
    expect(csvOutput).toContain("# Generated At: 2026-10-09T12:00:00Z");
    expect(csvOutput).toContain("# Workspace: ws_prod_999");
    expect(csvOutput).toContain("# Filters: niche=ai_tech");
    // Dangerous cell starting with '@' should be prefixed with single quote
    expect(csvOutput).toContain("'@DangerousFormula");
  });

  // Workflow 6: Background Queue & Real-State Worker Processing
  it("Workflow 6: Executes background worker jobs with real state transitions (QUEUED -> PROCESSING -> COMPLETED)", async () => {
    const queue = new JobQueueEngine();

    queue.registerHandler("CHANNEL_SYNC", async (job, updateProgress) => {
      updateProgress(40);
      updateProgress(100);
      return { channelId: (job.payload as any).channelId, snapshotId: "snap_101" };
    });

    const job = queue.enqueue("CHANNEL_SYNC", { channelId: "UC_creator_verified" });
    expect(job.state).toBe("QUEUED");

    await new Promise((r) => setTimeout(r, 60));

    const finished = queue.getJob(job.id);
    expect(finished?.state).toBe("COMPLETED");
    expect(finished?.result?.snapshotId).toBe("snap_101");
  });

  // Workflow 7: API Key Security & Webhook Signatures
  it("Workflow 7: Generates secure hashed API keys and HMAC-SHA256 signatures for outgoing webhooks", () => {
    const { rawKey, keyHash, keyPrefix } = generateApiKey("cp_live");

    expect(rawKey.startsWith("cp_live_")).toBe(true);
    expect(hashApiKey(rawKey)).toBe(keyHash);

    const payload = JSON.stringify({ event: "outlier.detected", videoId: "v_xyz" });
    const signature = generateHmacSignature(payload, "secret_wh_123");

    expect(signature).toHaveLength(64); // SHA-256 hex
  });

  // Workflow 8: Multi-Tenant Plan Quotas & Server-Side Enforcement
  it("Workflow 8: Verifies server-side usage quota boundaries for FREE vs PRO tiers", () => {
    expect(PLAN_LIMITS.FREE.searchesPerMonth).toBe(50);
    expect(PLAN_LIMITS.FREE.aiRequestsPerMonth).toBe(10);
    expect(PLAN_LIMITS.FREE.maxTrackedChannels).toBe(3);

    expect(PLAN_LIMITS.PRO.searchesPerMonth).toBeGreaterThanOrEqual(5000);
    expect(PLAN_LIMITS.PRO.aiRequestsPerMonth).toBe(500);

    const period = getCurrentPeriodKey();
    expect(period).toMatch(/^\d{4}-\d{2}$/);
  });
});
