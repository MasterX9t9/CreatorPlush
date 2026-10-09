import { describe, it, expect } from "vitest";
import { evaluateChannelMonetization } from "../../lib/algorithms/monetization";

describe("Monetization Evaluation Algorithm", () => {
  it("correctly identifies monetized partner channel exceeding YPP requirements", () => {
    const result = evaluateChannelMonetization({
      subscriberCount: 60900,
      viewCount: 9912402,
      videoCount: 126,
      recentVideosSample: [
        { viewCount: 45000, durationSec: 1200, isShort: false },
        { viewCount: 32000, durationSec: 900, isShort: false },
      ],
      monthlyRevenueMin: 1200,
      monthlyRevenueMax: 3500,
    });

    expect(result.isMonetized).toBe(true);
    expect(result.status).toBe("MONETIZED");
    expect(result.statusLabel).toContain("Monetized");
    expect(result.criteria.subscribers.passed).toBe(true);
    expect(result.criteria.estimatedWatchHours.passed).toBe(true);
    expect(result.revenueStreams.inStreamAds).toBe(true);
    expect(result.annualEstimate.min).toBe(14400);
    expect(result.annualEstimate.max).toBe(42000);
  });

  it("identifies unmonetized channel below the 1,000 subscriber threshold", () => {
    const result = evaluateChannelMonetization({
      subscriberCount: 350,
      viewCount: 15000,
      videoCount: 12,
      recentVideosSample: [],
    });

    expect(result.isMonetized).toBe(false);
    expect(result.status).toBe("NOT_MONETIZED");
    expect(result.criteria.subscribers.passed).toBe(false);
    expect(result.criteria.subscribers.progressPct).toBe(35);
    expect(result.revenueStreams.inStreamAds).toBe(false);
  });

  it("identifies channel with 1K subs but low watch velocity as ELIGIBLE_PENDING", () => {
    const result = evaluateChannelMonetization({
      subscriberCount: 1200,
      viewCount: 5000,
      videoCount: 4,
      recentVideosSample: [
        { viewCount: 200, durationSec: 60, isShort: false },
      ],
    });

    expect(result.isMonetized).toBe(false);
    expect(result.status).toBe("ELIGIBLE_PENDING");
    expect(result.criteria.subscribers.passed).toBe(true);
    expect(result.criteria.estimatedWatchHours.passed).toBe(false);
  });
});
