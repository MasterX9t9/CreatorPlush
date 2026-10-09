import { youtubeProvider } from "@/lib/providers/youtube/youtube.provider";
import { prisma } from "@/lib/db";
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatcher";

export type JobState = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface Job<T = any, R = any> {
  id: string;
  type: "CHANNEL_SYNC" | "OUTLIER_SCAN" | "REPORT_GENERATE";
  payload: T;
  state: JobState;
  progress: number; // 0 to 100
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: R;
}

export type JobHandler<T = any, R = any> = (
  job: Job<T, R>,
  updateProgress: (pct: number) => void
) => Promise<R>;

export class JobQueueEngine {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processing = false;

  constructor() {
    this.registerDefaultHandlers();
  }

  registerHandler<T, R>(type: string, handler: JobHandler<T, R>) {
    this.handlers.set(type, handler);
  }

  enqueue<T, R = any>(type: Job["type"], payload: T): Job<T, R> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job: Job<T, R> = {
      id,
      type,
      payload,
      state: "QUEUED",
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(id, job);
    // Trigger async queue execution without blocking caller
    setTimeout(() => this.processQueue(), 10);
    return job;
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  getAllJobs(): Job[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    try {
      const jobList = Array.from(this.jobs.values());
      for (const job of jobList) {
        if (job.state === "QUEUED") {
          job.state = "PROCESSING";
          job.startedAt = new Date().toISOString();
          job.progress = 10;

          const handler = this.handlers.get(job.type);
          if (!handler) {
            job.state = "FAILED";
            job.error = `No worker handler registered for job type '${job.type}'.`;
            job.completedAt = new Date().toISOString();
            continue;
          }

          try {
            const result = await handler(job, (pct: number) => {
              job.progress = Math.min(100, Math.max(0, pct));
            });

            job.state = "COMPLETED";
            job.progress = 100;
            job.result = result;
            job.completedAt = new Date().toISOString();
          } catch (err: any) {
            job.state = "FAILED";
            job.error = err?.message || "Job execution failed";
            job.completedAt = new Date().toISOString();
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private registerDefaultHandlers() {
    // 1. Channel Synchronization Worker
    this.registerHandler("CHANNEL_SYNC", async (job, updateProgress) => {
      const { channelId, workspaceId } = (job.payload || {}) as {
        channelId?: string;
        workspaceId?: string;
      };
      if (!channelId) throw new Error("Missing channelId in payload");

      updateProgress(20);
      const channel = await youtubeProvider.getChannel(channelId);
      if (!channel) throw new Error(`Channel ${channelId} not found on YouTube`);

      updateProgress(50);

      // Persist snapshot if DB is available
      try {
        await prisma.channel.upsert({
          where: { id: channel.id },
          create: {
            id: channel.id,
            title: channel.title,
            customUrl: channel.customUrl,
            description: channel.description,
            avatarUrl: channel.avatarUrl,
            subscriberCount: BigInt(channel.subscriberCount),
            viewCount: BigInt(channel.viewCount),
            videoCount: channel.videoCount,
            avgViewsPerVideo: channel.avgViewsPerVideo,
            lastSyncedAt: new Date(),
          },
          update: {
            title: channel.title,
            subscriberCount: BigInt(channel.subscriberCount),
            viewCount: BigInt(channel.viewCount),
            videoCount: channel.videoCount,
            avgViewsPerVideo: channel.avgViewsPerVideo,
            lastSyncedAt: new Date(),
          },
        });

        // Insert historical snapshot
        await prisma.channelSnapshot.create({
          data: {
            channelId: channel.id,
            subscribers: BigInt(channel.subscriberCount),
            views: BigInt(channel.viewCount),
            videosCount: channel.videoCount,
            source: "youtube_data_api",
          },
        });

        updateProgress(80);

        // Check alerts if workspaceId is associated
        if (workspaceId) {
          const activeAlerts = await prisma.alert.findMany({
            where: { workspaceId, targetId: channelId, isActive: true },
          });

          for (const alert of activeAlerts) {
            if (alert.triggerType === "SUB_MILESTONE") {
              const cond = (alert.condition || {}) as any;
              const threshold = cond.targetSubscribers || 100000;
              if (channel.subscriberCount >= threshold) {
                await prisma.notification.create({
                  data: {
                    workspaceId,
                    title: `Milestone reached: ${channel.title}`,
                    message: `${channel.title} has reached ${Number(channel.subscriberCount).toLocaleString()} subscribers!`,
                    type: "MILESTONE",
                    linkUrl: `/analytics/channels?id=${channel.id}`,
                  },
                });

                await dispatchWebhookEvent(
                  "channel.sub_milestone",
                  { channelId: channel.id, subscribers: channel.subscriberCount },
                  workspaceId
                );
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn("DB snapshot record skipped:", dbErr);
      }

      updateProgress(100);
      return {
        syncedChannelId: channel.id,
        subscribers: channel.subscriberCount,
        viewCount: channel.viewCount,
        timestamp: new Date().toISOString(),
      };
    });

    // 2. Outlier Scanning Worker
    this.registerHandler("OUTLIER_SCAN", async (job, updateProgress) => {
      const { channelId, workspaceId, thresholdMultiplier = 3.0 } = (job.payload || {}) as {
        channelId?: string;
        workspaceId?: string;
        thresholdMultiplier?: number;
      };
      if (!channelId) throw new Error("Missing channelId in payload");

      updateProgress(25);
      const { videos, channelMedianViews } = await youtubeProvider.getChannelVideosWithOutliers(
        channelId,
        25
      );

      updateProgress(60);
      const breakoutVideos = videos.filter(
        (v) => (v.outlierAnalysis?.multiplier || 0) >= thresholdMultiplier
      );

      if (breakoutVideos.length > 0 && workspaceId) {
        try {
          for (const v of breakoutVideos) {
            await prisma.notification.create({
              data: {
                workspaceId,
                title: `Outlier Alert: ${v.title.slice(0, 50)}...`,
                message: `Video broke out at ${v.outlierAnalysis?.multiplier}x normal views (${v.viewCount.toLocaleString()} vs median ${channelMedianViews.toLocaleString()}).`,
                type: "OUTLIER",
                linkUrl: `/analytics/videos?id=${v.id}`,
              },
            });
          }

          await dispatchWebhookEvent(
            "channel.outlier_detected",
            {
              channelId,
              breakoutCount: breakoutVideos.length,
              topMultiplier: breakoutVideos[0].outlierAnalysis?.multiplier,
            },
            workspaceId
          );
        } catch (dbErr) {
          console.warn("Alert notification insert skipped:", dbErr);
        }
      }

      updateProgress(100);
      return {
        channelId,
        channelMedianViews,
        breakoutsFound: breakoutVideos.length,
        breakouts: breakoutVideos.map((v) => ({
          id: v.id,
          title: v.title,
          views: v.viewCount,
          multiplier: v.outlierAnalysis?.multiplier,
        })),
      };
    });
  }
}

export const jobQueue = new JobQueueEngine();
