import { describe, it, expect } from "vitest";
import { analyzeCommentSentiment, CommentInput } from "@/lib/algorithms/sentiment";

describe("Comment Sentiment Algorithm Unit Tests", () => {
  it("correctly identifies positive comments, themes, and calculated percentages", () => {
    const comments: CommentInput[] = [
      {
        id: "c1",
        author: "Alice",
        text: "This was an amazing tutorial, thanks so much for the clarity!",
        likeCount: 45,
        publishedAt: "2026-10-01T12:00:00Z",
      },
      {
        id: "c2",
        author: "Bob",
        text: "Brilliant explanation. Really helpful and inspiring breakdown.",
        likeCount: 20,
        publishedAt: "2026-10-01T12:05:00Z",
      },
      {
        id: "c3",
        author: "Charlie",
        text: "I watched this video today.",
        likeCount: 2,
        publishedAt: "2026-10-01T12:10:00Z",
      },
      {
        id: "c4",
        author: "Dave",
        text: "Terrible audio quality, completely useless.",
        likeCount: 0,
        publishedAt: "2026-10-01T12:15:00Z",
      },
    ];

    const result = analyzeCommentSentiment(comments);

    expect(result.sampleCount).toBe(4);
    expect(result.positivePct).toBe(50); // 2 of 4
    expect(result.negativePct).toBe(25); // 1 of 4
    expect(result.neutralPct).toBe(25); // 1 of 4
    expect(result.sentimentScore).toBe(25); // (2 - 1) / 4 * 100
    expect(result.formula).toContain("sentimentScore");
    expect(result.attribution.dataType).toBe("calculated");
  });

  it("extracts viewer requests and questions accurately", () => {
    const comments: CommentInput[] = [
      {
        id: "c1",
        author: "Viewer1",
        text: "Can you please make a video on deployment with Docker?",
        likeCount: 15,
        publishedAt: "2026-10-02T10:00:00Z",
      },
      {
        id: "c2",
        author: "Viewer2",
        text: "How do you handle database migrations in production?",
        likeCount: 8,
        publishedAt: "2026-10-02T10:30:00Z",
      },
    ];

    const result = analyzeCommentSentiment(comments);

    expect(result.viewerRequests.some((r) => r.includes("Docker"))).toBe(true);
    expect(result.commonQuestions.some((q) => q.includes("migrations"))).toBe(true);
  });

  it("handles empty comments array safely without errors", () => {
    const result = analyzeCommentSentiment([]);

    expect(result.sampleCount).toBe(0);
    expect(result.positivePct).toBe(0);
    expect(result.sentimentScore).toBe(0);
  });
});
