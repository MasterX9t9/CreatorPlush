import { describe, it, expect } from "vitest";
import { estimateRevenueRange } from "../../lib/algorithms/revenue";

describe("Revenue & RPM Estimator", () => {
  it("computes estimated revenue bracket for a given monthly views count", () => {
    // 100,000 views in finance niche (RPM $8.0 - $22.0)
    // Min: 100 * 8 = 800
    // Max: 100 * 22 = 2200
    const est = estimateRevenueRange(100000, "finance");

    expect(est.isOfficial).toBe(false);
    expect(est.currency).toBe("USD");
    expect(est.rpmMin).toBe(8.0);
    expect(est.rpmMax).toBe(22.0);
    expect(est.monthlyRevenueMin).toBe(800);
    expect(est.monthlyRevenueMax).toBe(2200);
  });

  it("falls back to default niche benchmark if unknown niche provided", () => {
    const est = estimateRevenueRange(50000, "unknown_niche");
    expect(est.rpmMin).toBe(2.0);
    expect(est.rpmMax).toBe(5.5);
    expect(est.monthlyRevenueMin).toBeGreaterThan(0);
    expect(est.monthlyRevenueMax).toBeGreaterThan(est.monthlyRevenueMin);
  });
});
