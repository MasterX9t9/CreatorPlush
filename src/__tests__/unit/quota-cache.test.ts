import { describe, it, expect, beforeEach } from "vitest";
import { quotaCache } from "../../lib/cache/quota-cache";

describe("Quota & Cache System (Rule 23)", () => {
  beforeEach(() => {
    quotaCache.clear();
  });

  it("records quota units correctly", () => {
    const initial = quotaCache.getQuota().usedUnits;
    quotaCache.recordQuota(100); // 100 for search query
    expect(quotaCache.getQuota().usedUnits).toBe(initial + 100);

    quotaCache.recordQuota(1); // 1 for video details
    expect(quotaCache.getQuota().usedUnits).toBe(initial + 101);
  });

  it("stores and retrieves cached items with valid TTL", () => {
    const data = { title: "Test Video", views: 50000 };
    quotaCache.set("video_123", data, 60, "youtube_data_api");

    const cached = quotaCache.get<typeof data>("video_123");
    expect(cached).not.toBeNull();
    expect(cached?.value.title).toBe("Test Video");
    expect(cached?.source).toBe("youtube_data_api");
    expect(cached?.createdAt).toBeDefined();
    expect(cached?.expiresAt).toBeDefined();
  });

  it("returns null for non-existent keys", () => {
    expect(quotaCache.get("missing_key")).toBeNull();
  });
});
