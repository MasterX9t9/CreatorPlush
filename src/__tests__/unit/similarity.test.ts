import { describe, it, expect } from "vitest";
import {
  calculateChannelSimilarity,
  calculateVideoSimilarity,
  ChannelMetrics,
  VideoMetrics,
} from "@/lib/algorithms/similarity";

describe("Similarity Algorithm Unit Tests", () => {
  it("computes high similarity for closely matched channels in the same niche and scale", () => {
    const channelA: ChannelMetrics = {
      id: "ch-1",
      title: "Tech Odyssey",
      category: "Technology",
      subscriberCount: 250000,
      viewCount: 15000000,
      videoCount: 120,
      tags: ["tech", "gadgets", "reviews", "smartphones"],
      uploadFrequencyWeekly: 2,
    };

    const channelB: ChannelMetrics = {
      id: "ch-2",
      title: "Tech Gadget Realm",
      category: "Technology",
      subscriberCount: 280000,
      viewCount: 16800000,
      videoCount: 140,
      tags: ["tech", "smartphones", "hardware", "reviews"],
      uploadFrequencyWeekly: 2,
    };

    const result = calculateChannelSimilarity(channelA, channelB);

    expect(result.overallScore).toBeGreaterThanOrEqual(65);
    expect(result.similarityTier).toBe("HIGH");
    expect(result.breakdown.sizeSimilarity).toBeGreaterThanOrEqual(90);
    expect(result.formula).toContain("0.30*(TopicOverlap)");
    expect(result.attribution.dataType).toBe("calculated");
  });

  it("computes low similarity for channels with divergent scales and unrelated topics", () => {
    const channelTech: ChannelMetrics = {
      id: "ch-tech",
      title: "Python Coding Tutorials",
      category: "Education",
      subscriberCount: 5000,
      viewCount: 150000,
      videoCount: 25,
      tags: ["python", "programming", "software"],
      uploadFrequencyWeekly: 1,
    };

    const channelCooking: ChannelMetrics = {
      id: "ch-cooking",
      title: "Grandma Gourmet Kitchen",
      category: "Food",
      subscriberCount: 3000000,
      viewCount: 450000000,
      videoCount: 650,
      tags: ["recipes", "baking", "comfort food"],
      uploadFrequencyWeekly: 4,
    };

    const result = calculateChannelSimilarity(channelTech, channelCooking);

    expect(result.overallScore).toBeLessThan(40);
    expect(result.similarityTier).toBe("LOW");
    expect(result.breakdown.topicOverlap).toBe(0);
    expect(result.breakdown.sizeSimilarity).toBeLessThanOrEqual(20);
  });

  it("calculates video similarity based on keyword overlap, duration, and engagement", () => {
    const videoA: VideoMetrics = {
      id: "vid-1",
      title: "Building an AI SaaS with Next.js in 2026",
      durationSec: 900, // 15 mins
      viewCount: 50000,
      likeCount: 2500, // 5% like rate
      tags: ["ai", "saas", "nextjs", "coding"],
    };

    const videoB: VideoMetrics = {
      id: "vid-2",
      title: "Full Stack AI SaaS Application Tutorial",
      durationSec: 960, // 16 mins
      viewCount: 42000,
      likeCount: 2100, // 5% like rate
      tags: ["ai", "saas", "fullstack", "tutorial"],
    };

    const result = calculateVideoSimilarity(videoA, videoB);

    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.breakdown.durationMatch).toBeGreaterThan(90);
    expect(result.breakdown.engagementMatch).toBeGreaterThan(90);
    expect(result.attribution.source).toBe("internal_calculation");
  });
});
