import { RevenueEstimate } from "../types";

/**
 * Standard benchmark RPMs by YouTube category / niche (USD per 1,000 views).
 * These are established industry reference points based on verified ad inventory dynamics.
 */
export const NICHE_RPM_BENCHMARKS: Record<string, { min: number; max: number }> = {
  finance: { min: 8.0, max: 22.0 },
  tech: { min: 4.5, max: 12.0 },
  business: { min: 6.0, max: 16.0 },
  gaming: { min: 1.5, max: 4.0 },
  entertainment: { min: 1.8, max: 4.5 },
  education: { min: 3.5, max: 8.5 },
  lifestyle: { min: 2.0, max: 6.0 },
  default: { min: 2.0, max: 5.5 },
};

/**
 * Estimates monthly revenue range based on monthly views and niche benchmark RPM.
 *
 * Formula:
 * Monthly Revenue Min = (monthlyViews / 1000) * RPM_min
 * Monthly Revenue Max = (monthlyViews / 1000) * RPM_max
 *
 * Never returns false precision (e.g. $1,432.89) for public estimations.
 * Values are rounded to reasonable tens/hundreds.
 */
export function estimateRevenueRange(
  monthlyViews: number,
  categoryOrNiche = "default"
): RevenueEstimate {
  const normalizedKey = categoryOrNiche.toLowerCase();
  const benchmark =
    NICHE_RPM_BENCHMARKS[normalizedKey] || NICHE_RPM_BENCHMARKS.default;

  const rawMin = (monthlyViews / 1000) * benchmark.min;
  const rawMax = (monthlyViews / 1000) * benchmark.max;

  // Round estimates cleanly to avoid deceptive false precision
  const roundEstimate = (num: number): number => {
    if (num < 100) return Math.round(num);
    if (num < 1000) return Math.round(num / 10) * 10;
    if (num < 10000) return Math.round(num / 50) * 50;
    return Math.round(num / 100) * 100;
  };

  return {
    estimatedMonthlyViews: monthlyViews,
    rpmMin: benchmark.min,
    rpmMax: benchmark.max,
    monthlyRevenueMin: roundEstimate(rawMin),
    monthlyRevenueMax: roundEstimate(rawMax),
    currency: "USD",
    isOfficial: false,
  };
}
