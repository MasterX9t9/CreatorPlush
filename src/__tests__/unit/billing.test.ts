import { describe, it, expect } from "vitest";
import { PLAN_LIMITS, getCurrentPeriodKey } from "@/lib/billing/usage";
import { generateApiKey, hashApiKey, generateHmacSignature } from "@/lib/crypto";

describe("Billing & Plan Limits Unit Tests", () => {
  it("enforces tiered quota limits according to Rule 45", () => {
    expect(PLAN_LIMITS.FREE.searchesPerMonth).toBe(50);
    expect(PLAN_LIMITS.FREE.aiRequestsPerMonth).toBe(10);
    expect(PLAN_LIMITS.FREE.maxTrackedChannels).toBe(3);

    expect(PLAN_LIMITS.CREATOR.searchesPerMonth).toBe(500);
    expect(PLAN_LIMITS.CREATOR.aiRequestsPerMonth).toBe(100);

    expect(PLAN_LIMITS.PRO.searchesPerMonth).toBeGreaterThanOrEqual(5000);
    expect(PLAN_LIMITS.AGENCY.searchesPerMonth).toBeGreaterThan(100000);
  });

  it("produces standard YYYY-MM period key for bucket aggregation", () => {
    const key = getCurrentPeriodKey();
    expect(key).toMatch(/^\d{4}-\d{2}$/);
  });

  it("generates high-entropy API keys and verifies SHA-256 hash match", () => {
    const { rawKey, keyHash, keyPrefix } = generateApiKey("cp_live");

    expect(rawKey.startsWith("cp_live_")).toBe(true);
    expect(keyPrefix.startsWith("cp_live_")).toBe(true);
    expect(keyHash).toBe(hashApiKey(rawKey));
  });

  it("computes reproducible HMAC-SHA256 signatures for webhooks", () => {
    const secret = "test_secret_key";
    const payload = JSON.stringify({ event: "channel.outlier_detected", count: 1 });

    const sig1 = generateHmacSignature(payload, secret);
    const sig2 = generateHmacSignature(payload, secret);

    expect(sig1).toBe(sig2);
    expect(sig1.length).toBe(64); // SHA-256 hex string length
  });
});
