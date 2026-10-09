import { MetricAttribution } from "@/lib/types";

export interface PublishTimingAnalysis {
  publishedAt: string;
  dayOfWeek: string;
  hourUtc: number;
  timeFormattedUtc: string;
  isWeekend: boolean;
  windowRating: "PRIME" | "MODERATE" | "INDEXING_OFFPEAK";
  windowSummary: string;
  recommendations: string[];
  attribution: MetricAttribution;
}

export interface TagIntelligence {
  totalTags: number;
  tags: string[];
  characterCount: number;
  titleMatches: string[];
  hiddenDiscoveryTags: string[];
  hashtags: string[];
  seoDensityScore: number; // 0 to 100
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Evaluates the publication timing and optimal scheduling window for a YouTube video.
 */
export function analyzePublishTiming(
  publishedAtIso: string,
  durationSec: number = 0
): PublishTimingAnalysis {
  const date = new Date(publishedAtIso);
  const dayIndex = date.getUTCDay();
  const dayOfWeek = DAYS_OF_WEEK[dayIndex];
  const hourUtc = date.getUTCHours();
  const minuteUtc = date.getUTCMinutes();
  const timeFormattedUtc = `${String(hourUtc).padStart(2, "0")}:${String(minuteUtc).padStart(2, "0")} UTC`;
  const isWeekend = dayIndex === 0 || dayIndex === 6;

  let windowRating: "PRIME" | "MODERATE" | "INDEXING_OFFPEAK" = "MODERATE";
  let windowSummary = "";
  const recommendations: string[] = [];

  // Optimal YouTube windows:
  // - Weekdays: 14:00 - 20:00 UTC (US morning/afternoon, EU evening)
  // - Weekends: 12:00 - 18:00 UTC
  // - Off-peak: 00:00 - 08:00 UTC (good for long videos > 1hr to process before peak viewing)
  if (isWeekend && hourUtc >= 12 && hourUtc <= 18) {
    windowRating = "PRIME";
    windowSummary = "Prime Weekend Viewing Window (High active viewership across US/EU)";
  } else if (!isWeekend && hourUtc >= 14 && hourUtc <= 20) {
    windowRating = "PRIME";
    windowSummary = "Prime Weekday Afternoon Window (Optimal peak engagement for general audiences)";
  } else if (hourUtc >= 0 && hourUtc <= 7) {
    windowRating = "INDEXING_OFFPEAK";
    windowSummary = "Early Morning / Pre-Index Window (Ideal for long videos to encode HD/4K before peak hours)";
  } else {
    windowRating = "MODERATE";
    windowSummary = "Standard Publishing Window";
  }

  // Recommendations based on duration & timing
  if (durationSec > 3600) {
    recommendations.push(
      "For long-form / deep-dive content (> 1 hour), publishing 2-4 hours before the regional peak (or overnight) ensures 1080p/4K processing finishes before subscribers click."
    );
  } else if (durationSec > 0 && durationSec <= 60) {
    recommendations.push(
      "For YouTube Shorts, optimal spikes often align with commute & evening leisure slots (12:00 PM – 3:00 PM and 7:00 PM – 10:00 PM local time)."
    );
  }

  if (dayOfWeek === "Thursday" || dayOfWeek === "Friday") {
    recommendations.push(
      "Thursday/Friday uploads maximize momentum into high-traffic weekend viewing cycles."
    );
  }

  return {
    publishedAt: publishedAtIso,
    dayOfWeek,
    hourUtc,
    timeFormattedUtc,
    isWeekend,
    windowRating,
    windowSummary,
    recommendations,
    attribution: {
      source: "internal_calculation",
      dataType: "calculated",
      timestamp: new Date().toISOString(),
      confidence: 0.9,
    },
  };
}

/**
 * Analyzes video tags, description hashtags, and SEO keyword alignment.
 */
export function analyzeTagIntelligence(
  title: string,
  description: string,
  tags: string[] = []
): TagIntelligence {
  const normalizedTitle = title.toLowerCase();
  const characterCount = tags.join(",").length;

  const titleMatches: string[] = [];
  const hiddenDiscoveryTags: string[] = [];

  tags.forEach((tag) => {
    const norm = tag.toLowerCase().trim();
    if (normalizedTitle.includes(norm)) {
      titleMatches.push(tag);
    } else {
      hiddenDiscoveryTags.push(tag);
    }
  });

  // Extract hashtags from description (#example)
  const hashtagRegex = /#([\w\u00C0-\u024F\u4e00-\u9fa5]+)/g;
  const matches = description.match(hashtagRegex) || [];
  const hashtags = Array.from(new Set(matches)).slice(0, 20);

  // Calculate SEO Density Score (0 - 100)
  // Considers: tag count (ideal 15-30), char count (ideal 250-450), title synergy (at least 2-3 matches)
  let score = 0;
  if (tags.length >= 10 && tags.length <= 40) score += 35;
  else if (tags.length > 0) score += 20;

  if (characterCount >= 200 && characterCount <= 480) score += 35;
  else if (characterCount > 0) score += 20;

  if (titleMatches.length >= 2) score += 30;
  else if (titleMatches.length === 1) score += 15;

  const seoDensityScore = Math.min(100, Math.max(0, score));

  return {
    totalTags: tags.length,
    tags,
    characterCount,
    titleMatches,
    hiddenDiscoveryTags,
    hashtags,
    seoDensityScore,
  };
}
