import { describe, it, expect, beforeEach } from "vitest";
import { channelRepository, ConnectedChannelRecord } from "../../lib/repositories/channel-repository";

describe("Channel Repository & Connection Workflow", () => {
  const testChannel: ConnectedChannelRecord = {
    id: "UC_test_channel_123",
    accountId: "yt_test_account_123",
    title: "Test Anime & Manga Channel",
    customUrl: "@testanime",
    avatarUrl: "https://example.com/avatar.jpg",
    subscriberCount: 50000,
    viewCount: 1200000,
    videoCount: 45,
    avgViewsPerVideo: 26666,
    medianViews: 22000,
  };

  it("saves and retrieves a connected channel", async () => {
    const saved = await channelRepository.saveConnectedChannel(testChannel, "default");
    expect(saved.id).toBe(testChannel.id);
    expect(saved.title).toBe(testChannel.title);

    const channels = await channelRepository.getConnectedChannels("default");
    const found = channels.find((c) => c.id === testChannel.id);
    expect(found).toBeDefined();
    expect(found?.subscriberCount).toBe(50000);
    expect(found?.viewCount).toBe(1200000);
  });

  it("updates channel metrics on synchronization", async () => {
    const updated = await channelRepository.updateChannelMetrics(testChannel.id, {
      subscriberCount: 55000,
      viewCount: 1350000,
      medianViews: 24500,
    });

    expect(updated).not.toBeNull();
    expect(updated?.subscriberCount).toBe(55000);
    expect(updated?.viewCount).toBe(1350000);
    expect(updated?.medianViews).toBe(24500);
  });

  it("disconnects and removes the channel from the workspace", async () => {
    await channelRepository.disconnectChannel(testChannel.id);
    const channels = await channelRepository.getConnectedChannels("default");
    const found = channels.find((c) => c.id === testChannel.id);
    expect(found).toBeUndefined();
  });
});
