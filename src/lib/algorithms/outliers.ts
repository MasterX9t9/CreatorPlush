import { OutlierAnalysis, OutlierTier } from "../types";

/**
 * Calculates the statistical median of a numerical array.
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculates expected views for a video based on channel historical benchmarks.
 *
 * Formula:
 * E(v) = Median(Historical views of channel videos with matching format in same cohort)
 */
export function calculateExpectedViews(historicalVideoViews: number[]): number {
  if (historicalVideoViews.length === 0) {
    return 1; // Prevent division by zero
  }
  const median = calculateMedian(historicalVideoViews);
  return Math.max(median, 1);
}

/**
 * Calculates the Outlier Multiplier and assigns an Outlier Tier.
 *
 * Formula:
 * Multiplier M = actualViews / expectedViews
 *
 * Tiers:
 * - < 2.0x: "normal"
 * - 2.0x - 4.99x: "2x"
 * - 5.0x - 9.99x: "5x"
 * - 10.0x - 19.99x: "10x"
 * - >= 20.0x: "20x_plus"
 */
export function calculateOutlierScore(
  actualViews: number,
  expectedViews: number
): OutlierAnalysis {
  const safeExpected = Math.max(expectedViews, 1);
  const multiplier = Number((actualViews / safeExpected).toFixed(2));

  let tier: OutlierTier = "normal";
  if (multiplier >= 20.0) {
    tier = "20x_plus";
  } else if (multiplier >= 10.0) {
    tier = "10x";
  } else if (multiplier >= 5.0) {
    tier = "5x";
  } else if (multiplier >= 2.0) {
    tier = "2x";
  }

  // Confidence increases with more sample data and non-trivial numbers
  const confidence = expectedViews > 10 ? 0.95 : 0.6;

  return {
    actualViews,
    expectedViews: Math.round(safeExpected),
    multiplier,
    tier,
    confidence,
    formula: "actualViews / median(channel_historical_views)",
  };
}
