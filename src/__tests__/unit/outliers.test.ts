import { describe, it, expect } from "vitest";
import {
  calculateMedian,
  calculateExpectedViews,
  calculateOutlierScore,
} from "../../lib/algorithms/outliers";

describe("Outlier Algorithm", () => {
  it("calculates accurate median on odd and even distributions", () => {
    expect(calculateMedian([100, 200, 300])).toBe(200);
    expect(calculateMedian([100, 200, 300, 400])).toBe(250);
    expect(calculateMedian([500, 100, 200])).toBe(200);
    expect(calculateMedian([])).toBe(0);
  });

  it("calculates expected views based on channel history", () => {
    const historicalViews = [1000, 1500, 1200, 1800, 900];
    const expected = calculateExpectedViews(historicalViews);
    expect(expected).toBe(1200);
  });

  it("assigns correct outlier tier based on multiplier", () => {
    // Normal: multiplier < 2.0x
    const normal = calculateOutlierScore(1500, 1000);
    expect(normal.multiplier).toBe(1.5);
    expect(normal.tier).toBe("normal");

    // 2x Outlier: 2.0x - 4.99x
    const twoX = calculateOutlierScore(2500, 1000);
    expect(twoX.multiplier).toBe(2.5);
    expect(twoX.tier).toBe("2x");

    // 5x Outlier: 5.0x - 9.99x
    const fiveX = calculateOutlierScore(6200, 1000);
    expect(fiveX.multiplier).toBe(6.2);
    expect(fiveX.tier).toBe("5x");

    // 10x Outlier: 10.0x - 19.99x
    const tenX = calculateOutlierScore(12500, 1000);
    expect(tenX.multiplier).toBe(12.5);
    expect(tenX.tier).toBe("10x");

    // 20x+ Outlier
    const twentyX = calculateOutlierScore(25000, 1000);
    expect(twentyX.multiplier).toBe(25.0);
    expect(twentyX.tier).toBe("20x_plus");
  });

  it("prevents division by zero safely", () => {
    const result = calculateOutlierScore(500, 0);
    expect(result.expectedViews).toBe(1);
    expect(result.multiplier).toBe(500);
    expect(result.tier).toBe("20x_plus");
  });
});
