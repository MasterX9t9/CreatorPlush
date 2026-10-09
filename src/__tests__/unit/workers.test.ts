import { describe, it, expect, vi } from "vitest";
import { JobQueueEngine } from "@/lib/workers/queue";

describe("Job Queue Worker Engine Unit Tests", () => {
  it("enqueues jobs with initial QUEUED state and tracks real state progression", async () => {
    const queue = new JobQueueEngine();

    // Register a mock handler
    queue.registerHandler("CHANNEL_SYNC", async (job, updateProgress) => {
      updateProgress(50);
      return { success: true, processedChannel: (job.payload as any).channelId };
    });

    const job = queue.enqueue("CHANNEL_SYNC", { channelId: "UC_test_123" });

    expect(job.id.startsWith("job_")).toBe(true);
    expect(job.state).toBe("QUEUED");
    expect(job.progress).toBe(0);

    // Wait briefly for queue event loop step
    await new Promise((resolve) => setTimeout(resolve, 50));

    const updatedJob = queue.getJob(job.id);
    expect(updatedJob).toBeDefined();
    expect(updatedJob?.state).toBe("COMPLETED");
    expect(updatedJob?.progress).toBe(100);
    expect(updatedJob?.result?.processedChannel).toBe("UC_test_123");
    expect(updatedJob?.completedAt).toBeDefined();
  });

  it("handles worker execution failures gracefully and stores error reason", async () => {
    const queue = new JobQueueEngine();

    queue.registerHandler("OUTLIER_SCAN", async () => {
      throw new Error("Simulated YouTube Quota Exceeded");
    });

    const job = queue.enqueue("OUTLIER_SCAN", { channelId: "UC_error_ch" });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const failedJob = queue.getJob(job.id);
    expect(failedJob?.state).toBe("FAILED");
    expect(failedJob?.error).toContain("Simulated YouTube Quota Exceeded");
    expect(failedJob?.completedAt).toBeDefined();
  });

  it("fails jobs when no handler is registered for the given job type", async () => {
    const queue = new JobQueueEngine();

    const job = queue.enqueue("UNKNOWN_TASK" as any, {});

    await new Promise((resolve) => setTimeout(resolve, 50));

    const failedJob = queue.getJob(job.id);
    expect(failedJob?.state).toBe("FAILED");
    expect(failedJob?.error).toContain("No worker handler registered");
  });
});
