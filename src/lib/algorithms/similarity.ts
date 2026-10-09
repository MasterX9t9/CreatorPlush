import { MetricAttribution } from "@/lib/types";

export interface ChannelMetrics {
  id: string;
  title: string;
  category?: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  tags?: string[];
  uploadFrequencyWeekly?: number;
}

export interface ChannelSimilarityResult {
  targetChannelId: string;
  candidateChannelId: string;
  candidateTitle: string;
  overallScore: number; // 0 - 100
  similarityTier: "HIGH" | "MEDIUM" | "LOW";
  breakdown: {
    sizeSimilarity: number;       // 0 - 100 (subscribers scale)
    engagementSimilarity: number; // 0 - 100 (views/sub ratio)
    cadenceSimilarity: number;    // 0 - 100 (upload frequency)
    topicOverlap: number;         // 0 - 100 (shared keywords/category)
  };
  formula: string;
  attribution: MetricAttribution;
}

export interface VideoMetrics {
  id: string;
  title: string;
  durationSec: number;
  viewCount: number;
  likeCount: number;
  tags?: string[];
}

export interface VideoSimilarityResult {
  targetVideoId: string;
  candidateVideoId: string;
  candidateTitle: string;
  overallScore: number; // 0 - 100
  breakdown: {
    titleKeywordOverlap: number; // 0 - 100
    durationMatch: number;        // 0 - 100
    engagementMatch: number;      // 0 - 100
  };
  formula: string;
  attribution: MetricAttribution;
}

/**
 * Tokenizes text into lowercase word tokens, stripping common English stopwords.
 */
function tokenize(text: string): Set<string> {
  const stopwords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "is", "are", "was", "how", "what", "why", "video",
    "youtube", "new", "my", "your", "this", "that", "it", "from", "as"
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !stopwords.has(w));

  return new Set(words);
}

/**
 * Calculates Jaccard similarity between two token sets.
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach((item) => {
    if (setB.has(item)) intersection++;
  });
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Compares two channels using documented statistical parameters:
 * S = 0.30 * TopicOverlap + 0.30 * SizeSimilarity + 0.20 * EngagementSimilarity + 0.20 * CadenceSimilarity
 */
export function calculateChannelSimilarity(
  target: ChannelMetrics,
  candidate: ChannelMetrics
): ChannelSimilarityResult {
  // 1. Topic & Category Overlap (Weight 0.30)
  const targetTokens = tokenize(`${target.title} ${target.category || ""} ${(target.tags || []).join(" ")}`);
  const candidateTokens = tokenize(`${candidate.title} ${candidate.category || ""} ${(candidate.tags || []).join(" ")}`);
  const topicJaccard = jaccardSimilarity(targetTokens, candidateTokens);
  const topicScore = Math.round(topicJaccard * 100);

  // 2. Size / Tier Similarity (Weight 0.30)
  // Uses log10 ratio to compare orders of magnitude
  const subTarget = Math.max(1, target.subscriberCount);
  const subCandidate = Math.max(1, candidate.subscriberCount);
  const logDiff = Math.abs(Math.log10(subTarget) - Math.log10(subCandidate));
  // If log diff is 0 (same order of magnitude), score is 100. If diff is >= 2 orders of mag, score approaches 0.
  const sizeScore = Math.max(0, Math.round((1 - Math.min(logDiff / 2, 1)) * 100));

  // 3. Engagement / Avg Views per Sub Ratio (Weight 0.20)
  const ratioA = subTarget > 0 ? target.viewCount / subTarget : 0;
  const ratioB = subCandidate > 0 ? candidate.viewCount / subCandidate : 0;
  const maxRatio = Math.max(ratioA, ratioB, 1);
  const minRatio = Math.min(ratioA, ratioB);
  const engagementScore = Math.round((minRatio / maxRatio) * 100);

  // 4. Cadence / Upload Frequency (Weight 0.20)
  const freqA = target.uploadFrequencyWeekly ?? 1;
  const freqB = candidate.uploadFrequencyWeekly ?? 1;
  const maxFreq = Math.max(freqA, freqB, 0.1);
  const minFreq = Math.min(freqA, freqB);
  const cadenceScore = Math.round((minFreq / maxFreq) * 100);

  // Overall Weighted Score
  const rawScore = 0.30 * topicScore + 0.30 * sizeScore + 0.20 * engagementScore + 0.20 * cadenceScore;
  const overallScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  const similarityTier: "HIGH" | "MEDIUM" | "LOW" =
    overallScore >= 70 ? "HIGH" : overallScore >= 40 ? "MEDIUM" : "LOW";

  return {
    targetChannelId: target.id,
    candidateChannelId: candidate.id,
    candidateTitle: candidate.title,
    overallScore,
    similarityTier,
    breakdown: {
      topicOverlap: topicScore,
      sizeSimilarity: sizeScore,
      engagementSimilarity: engagementScore,
      cadenceSimilarity: cadenceScore,
    },
    formula: "Score = 0.30*(TopicOverlap) + 0.30*(SizeTier) + 0.20*(EngagementRatio) + 0.20*(CadenceMatch)",
    attribution: {
      source: "internal_calculation",
      dataType: "calculated",
      timestamp: new Date().toISOString(),
      confidence: 0.9,
    },
  };
}

/**
 * Compares two videos based on keyword overlap, duration, and engagement.
 * Score = 0.45 * KeywordOverlap + 0.30 * DurationMatch + 0.25 * EngagementMatch
 */
export function calculateVideoSimilarity(
  target: VideoMetrics,
  candidate: VideoMetrics
): VideoSimilarityResult {
  // 1. Keyword Overlap (Weight 0.45)
  const targetTokens = tokenize(`${target.title} ${(target.tags || []).join(" ")}`);
  const candidateTokens = tokenize(`${candidate.title} ${(candidate.tags || []).join(" ")}`);
  const keywordJaccard = jaccardSimilarity(targetTokens, candidateTokens);
  const keywordScore = Math.round(keywordJaccard * 100);

  // 2. Duration Match (Weight 0.30)
  // Relative difference in length
  const durTarget = Math.max(1, target.durationSec);
  const durCandidate = Math.max(1, candidate.durationSec);
  const durRatio = Math.min(durTarget, durCandidate) / Math.max(durTarget, durCandidate);
  const durationScore = Math.round(durRatio * 100);

  // 3. Engagement / Like-to-View Ratio Match (Weight 0.25)
  const engA = target.viewCount > 0 ? (target.likeCount / target.viewCount) : 0;
  const engB = candidate.viewCount > 0 ? (candidate.likeCount / candidate.viewCount) : 0;
  const maxEng = Math.max(engA, engB, 0.001);
  const minEng = Math.min(engA, engB);
  const engagementScore = Math.round((minEng / maxEng) * 100);

  const rawScore = 0.45 * keywordScore + 0.30 * durationScore + 0.25 * engagementScore;
  const overallScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    targetVideoId: target.id,
    candidateVideoId: candidate.id,
    candidateTitle: candidate.title,
    overallScore,
    breakdown: {
      titleKeywordOverlap: keywordScore,
      durationMatch: durationScore,
      engagementMatch: engagementScore,
    },
    formula: "Score = 0.45*(KeywordOverlap) + 0.30*(DurationMatch) + 0.25*(EngagementMatch)",
    attribution: {
      source: "internal_calculation",
      dataType: "calculated",
      timestamp: new Date().toISOString(),
      confidence: 0.92,
    },
  };
}
