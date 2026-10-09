import { describe, it, expect } from "vitest";
import {
  analyzePublishTiming,
  analyzeTagIntelligence,
} from "../../lib/algorithms/timing";

describe("Timing & Tag Intelligence Algorithms", () => {
  describe("analyzePublishTiming", () => {
    it("correctly identifies weekday prime viewing window (14:00 - 20:00 UTC)", () => {
      // 2026-10-08 was a Thursday, 16:30 UTC
      const result = analyzePublishTiming("2026-10-08T16:30:00Z", 600);
      expect(result.dayOfWeek).toBe("Thursday");
      expect(result.isWeekend).toBe(false);
      expect(result.hourUtc).toBe(16);
      expect(result.windowRating).toBe("PRIME");
      expect(result.windowSummary).toContain("Prime Weekday Afternoon");
      expect(result.recommendations.some((r) => r.includes("Thursday/Friday"))).toBe(true);
    });

    it("identifies weekend prime viewing window", () => {
      // 2026-10-10 is a Saturday, 14:00 UTC
      const result = analyzePublishTiming("2026-10-10T14:00:00Z", 720);
      expect(result.dayOfWeek).toBe("Saturday");
      expect(result.isWeekend).toBe(true);
      expect(result.windowRating).toBe("PRIME");
      expect(result.windowSummary).toContain("Prime Weekend");
    });

    it("identifies early morning pre-indexing window for long videos", () => {
      // 2026-10-06 is a Tuesday, 04:00 UTC, 4000 seconds (> 1 hour)
      const result = analyzePublishTiming("2026-10-06T04:00:00Z", 4000);
      expect(result.windowRating).toBe("INDEXING_OFFPEAK");
      expect(result.recommendations.some((r) => r.includes("long-form"))).toBe(true);
    });
  });

  describe("analyzeTagIntelligence", () => {
    it("partitions tags into title matches and hidden discovery tags", () => {
      const title = "How to Build a Modern Next.js 14 Web Application in 2026";
      const description = "Check out this guide on web dev! #nextjs #coding #tutorial";
      const tags = [
        "Next.js",
        "next.js 14",
        "React",
        "web application",
        "software engineering",
        "full stack dev",
      ];

      const result = analyzeTagIntelligence(title, description, tags);

      expect(result.totalTags).toBe(6);
      expect(result.titleMatches).toContain("Next.js");
      expect(result.titleMatches).toContain("web application");
      expect(result.hiddenDiscoveryTags).toContain("software engineering");
      expect(result.hiddenDiscoveryTags).toContain("React");
      expect(result.hashtags).toContain("#nextjs");
      expect(result.hashtags).toContain("#coding");
      expect(result.hashtags).toContain("#tutorial");
      expect(result.seoDensityScore).toBeGreaterThan(0);
      expect(result.characterCount).toBeGreaterThan(0);
    });

    it("handles empty tags gracefully without crashing", () => {
      const result = analyzeTagIntelligence("Minimalist Video", "No description", []);
      expect(result.totalTags).toBe(0);
      expect(result.tags).toEqual([]);
      expect(result.characterCount).toBe(0);
      expect(result.titleMatches).toEqual([]);
      expect(result.hiddenDiscoveryTags).toEqual([]);
      expect(result.hashtags).toEqual([]);
      expect(result.seoDensityScore).toBe(0);
    });
  });
});
