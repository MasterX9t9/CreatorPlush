import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";

export interface ConnectedChannelRecord {
  id: string;
  accountId: string;
  title: string;
  customUrl?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  description?: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  avgViewsPerVideo?: number;
  medianViews?: number;
  lastSyncedAt?: string;
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".data");
const LOCAL_STORAGE_FILE = path.join(LOCAL_STORAGE_DIR, "connected-channels.json");

function readLocalChannels(): ConnectedChannelRecord[] {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_FILE)) return [];
    const content = fs.readFileSync(LOCAL_STORAGE_FILE, "utf-8");
    return JSON.parse(content) || [];
  } catch {
    return [];
  }
}

function writeLocalChannels(channels: ConnectedChannelRecord[]): void {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(channels, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to write local channel fallback store:", err);
  }
}

export class ChannelRepository {
  /**
   * Retrieves all connected channels for a workspace.
   * Tries PostgreSQL via Prisma first, falls back to persistent local storage if DB is offline.
   */
  async getConnectedChannels(workspaceSlug: string = "default"): Promise<ConnectedChannelRecord[]> {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { slug: workspaceSlug },
        include: {
          youtubeAccounts: {
            include: {
              channels: true,
            },
          },
        },
      });

      if (workspace && workspace.youtubeAccounts.length > 0) {
        return workspace.youtubeAccounts.flatMap((acc) =>
          acc.channels.map((ch) => ({
            id: ch.id,
            accountId: acc.id,
            title: ch.title,
            customUrl: ch.customUrl || undefined,
            avatarUrl: ch.avatarUrl || undefined,
            bannerUrl: ch.bannerUrl || undefined,
            description: ch.description || undefined,
            subscriberCount: Number(ch.subscriberCount),
            viewCount: Number(ch.viewCount),
            videoCount: ch.videoCount,
            avgViewsPerVideo: ch.avgViewsPerVideo || undefined,
            medianViews: ch.medianViews || undefined,
            lastSyncedAt: ch.lastSyncedAt?.toISOString(),
          }))
        );
      }
    } catch {
      // PostgreSQL is offline or unreachable; fall through to persistent local fallback
    }

    return readLocalChannels();
  }

  /**
   * Connects and saves a channel.
   * Tries PostgreSQL via Prisma first, falls back to persistent local storage if DB is offline.
   */
  async saveConnectedChannel(
    channel: ConnectedChannelRecord,
    workspaceSlug: string = "default"
  ): Promise<ConnectedChannelRecord> {
    // 1. Always attempt PostgreSQL persistence
    try {
      let workspace = await prisma.workspace.findUnique({
        where: { slug: workspaceSlug },
      });

      if (!workspace) {
        workspace = await prisma.workspace.create({
          data: { name: "Default Workspace", slug: workspaceSlug },
        });
      }

      const emailIdentifier = channel.customUrl
        ? `${channel.customUrl.replace(/^@/, "")}@channel.youtube.com`
        : `${channel.id}@channel.youtube.com`;

      const ytAccount = await prisma.youTubeAccount.upsert({
        where: {
          workspaceId_googleId: {
            workspaceId: workspace.id,
            googleId: channel.id,
          },
        },
        update: {
          channelId: channel.id,
          email: emailIdentifier,
        },
        create: {
          workspaceId: workspace.id,
          googleId: channel.id,
          email: emailIdentifier,
          channelId: channel.id,
          accessToken: "connected_via_data_api",
          refreshToken: "connected_via_data_api",
          tokenExpiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
          scopes: ["https://www.googleapis.com/auth/youtube.readonly"],
        },
      });

      await prisma.channel.upsert({
        where: { id: channel.id },
        update: {
          youtubeAccountId: ytAccount.id,
          title: channel.title,
          customUrl: channel.customUrl || null,
          description: channel.description || null,
          avatarUrl: channel.avatarUrl || null,
          bannerUrl: channel.bannerUrl || null,
          subscriberCount: BigInt(channel.subscriberCount),
          viewCount: BigInt(channel.viewCount),
          videoCount: channel.videoCount,
          avgViewsPerVideo: channel.avgViewsPerVideo || null,
          medianViews: channel.medianViews || null,
          lastSyncedAt: new Date(),
        },
        create: {
          id: channel.id,
          youtubeAccountId: ytAccount.id,
          title: channel.title,
          customUrl: channel.customUrl || null,
          description: channel.description || null,
          avatarUrl: channel.avatarUrl || null,
          bannerUrl: channel.bannerUrl || null,
          subscriberCount: BigInt(channel.subscriberCount),
          viewCount: BigInt(channel.viewCount),
          videoCount: channel.videoCount,
          avgViewsPerVideo: channel.avgViewsPerVideo || null,
          medianViews: channel.medianViews || null,
          lastSyncedAt: new Date(),
        },
      });
    } catch {
      // PostgreSQL is offline in this environment; maintain local file persistence
    }

    // 2. Persist in local storage so it survives server restarts even without active PostgreSQL
    const existing = readLocalChannels();
    const updated = existing.filter((c) => c.id !== channel.id);
    const savedRecord = {
      ...channel,
      lastSyncedAt: new Date().toISOString(),
    };
    updated.unshift(savedRecord);
    writeLocalChannels(updated);

    return savedRecord;
  }

  /**
   * Updates an existing connected channel's metrics upon synchronization.
   */
  async updateChannelMetrics(
    channelId: string,
    updates: Partial<ConnectedChannelRecord>
  ): Promise<ConnectedChannelRecord | null> {
    try {
      await prisma.channel.update({
        where: { id: channelId },
        data: {
          subscriberCount: updates.subscriberCount !== undefined ? BigInt(updates.subscriberCount) : undefined,
          viewCount: updates.viewCount !== undefined ? BigInt(updates.viewCount) : undefined,
          videoCount: updates.videoCount,
          avgViewsPerVideo: updates.avgViewsPerVideo,
          medianViews: updates.medianViews,
          lastSyncedAt: new Date(),
        },
      });
    } catch {
      // PostgreSQL is offline; update local storage
    }

    const existing = readLocalChannels();
    const index = existing.findIndex((c) => c.id === channelId);
    if (index === -1) return null;

    existing[index] = {
      ...existing[index],
      ...updates,
      lastSyncedAt: new Date().toISOString(),
    };
    writeLocalChannels(existing);

    return existing[index];
  }

  /**
   * Disconnects a channel from the workspace.
   */
  async disconnectChannel(channelId: string): Promise<void> {
    try {
      await prisma.youTubeAccount.deleteMany({
        where: { channelId },
      });
      await prisma.channel.delete({
        where: { id: channelId },
      }).catch(async () => {
        await prisma.channel.update({
          where: { id: channelId },
          data: { youtubeAccountId: null },
        });
      });
    } catch {
      // Ignore DB errors
    }

    const existing = readLocalChannels();
    const filtered = existing.filter((c) => c.id !== channelId);
    writeLocalChannels(filtered);
  }
}

export const channelRepository = new ChannelRepository();
