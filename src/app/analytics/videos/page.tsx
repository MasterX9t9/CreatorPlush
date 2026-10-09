"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import { estimateRevenueRange } from "@/lib/algorithms/revenue";
import {
  Video,
  Search,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Flame,
  AlertCircle,
  FileText,
} from "lucide-react";

interface VideoDetails {
  id: string;
  title: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnailUrl: string;
  durationFormatted: string;
  durationSec: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagementRate: number;
  viewsPerDay: number;
}

function VideoAnalyticsContent() {
  const searchParams = useSearchParams();
  const initialVideoId = searchParams.get("id") || "";

  const [videoInput, setVideoInput] = useState(initialVideoId);
  const [videoData, setVideoData] = useState<VideoDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideo = async (videoId: string) => {
    if (!videoId.trim()) return;

    // Extract ID if full URL pasted
    let cleanId = videoId.trim();
    if (cleanId.includes("watch?v=")) {
      cleanId = cleanId.split("watch?v=")[1].split("&")[0];
    } else if (cleanId.includes("youtu.be/")) {
      cleanId = cleanId.split("youtu.be/")[1].split("?")[0];
    }

    setIsLoading(true);
    setError(null);

    try {
      // Query video via search endpoint
      const res = await fetch(`/api/v1/search/videos?q=${encodeURIComponent(cleanId)}&maxResults=1`);
      const json = await res.json();

      if (!res.ok || !json.success || !json.data || json.data.length === 0) {
        setError("Could not find video details for ID: " + cleanId);
        setVideoData(null);
      } else {
        const item = json.data[0];
        const publishedDate = new Date(item.publishedAt);
        const daysSincePublish = Math.max(
          (Date.now() - publishedDate.getTime()) / (1000 * 3600 * 24),
          1
        );
        const viewsPerDay = Math.round(item.viewCount / daysSincePublish);
        const engagementRate =
          item.viewCount > 0
            ? Number((((item.likeCount + item.commentCount) / item.viewCount) * 100).toFixed(2))
            : 0;

        setVideoData({
          id: item.id,
          title: item.title,
          channelTitle: item.channelTitle,
          channelId: item.channelId,
          publishedAt: item.publishedAt,
          thumbnailUrl: item.thumbnailUrl,
          durationFormatted: item.durationFormatted,
          durationSec: item.durationSec,
          viewCount: item.viewCount,
          likeCount: item.likeCount,
          commentCount: item.commentCount,
          engagementRate,
          viewsPerDay,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load video intelligence.");
      setVideoData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialVideoId) {
      fetchVideo(initialVideoId);
    }
  }, [initialVideoId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideo(videoInput);
  };

  const revenueEst = videoData
    ? estimateRevenueRange(videoData.viewCount, "default")
    : null;

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            placeholder="Paste YouTube Video URL or Video ID (e.g. 'dQw4w9WgXcQ')..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !videoInput.trim()}
          className="px-6 py-3 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center gap-2"
        >
          <Video className="w-4 h-4" />
          <span>Analyze Video</span>
        </button>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Initial Empty State */}
      {!isLoading && !videoData && !error && (
        <EmptyState
          title="Video Performance Intelligence"
          description="Enter any public YouTube video link or identifier to extract authentic view statistics, engagement ratios, daily velocity, and revenue benchmarks."
          icon={Video}
        />
      )}

      {/* Video Intelligence Presentation */}
      {!isLoading && videoData && (
        <div className="space-y-6">
          {/* Main Video Hero */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start gap-6">
            <img
              src={videoData.thumbnailUrl}
              alt={videoData.title}
              className="w-full md:w-72 aspect-video rounded-xl object-cover bg-black/40 border border-white/10 shadow-lg shrink-0"
            />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                  {videoData.durationFormatted}
                </span>
                <AttributionBadge type="official" sourceText="YouTube Data API v3" />
              </div>

              <h2 className="text-base font-bold text-foreground leading-snug">
                {videoData.title}
              </h2>

              <p className="text-xs text-muted-foreground">
                Channel: <strong className="text-foreground">{videoData.channelTitle}</strong> • Published on {new Date(videoData.publishedAt).toLocaleDateString()}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href={`https://www.youtube.com/watch?v=${videoData.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-foreground transition-colors"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={`/research/outliers?channelId=${videoData.channelId}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-pulse-600 text-xs font-semibold text-white transition-colors"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Channel Outliers</span>
                </a>
              </div>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Views"
              value={formatCompactNumber(videoData.viewCount)}
              subValue="Official public view counter"
              dataType="official"
              sourceText="YouTube Data API v3"
              icon={Eye}
            />
            <MetricCard
              label="Views / Day"
              value={formatCompactNumber(videoData.viewsPerDay)}
              subValue="Calculated from publication date"
              dataType="calculated"
              sourceText="viewCount / daysSincePublish"
              icon={TrendingUp}
            />
            <MetricCard
              label="Engagement Rate"
              value={`${videoData.engagementRate}%`}
              subValue={`${formatCompactNumber(videoData.likeCount)} likes • ${formatCompactNumber(videoData.commentCount)} comments`}
              dataType="calculated"
              sourceText="(likes + comments) / views"
              icon={ThumbsUp}
            />
            <MetricCard
              label="Est. Ad Revenue"
              value={`$${revenueEst?.monthlyRevenueMin} – $${revenueEst?.monthlyRevenueMax}`}
              subValue="Industry RPM bracket model"
              dataType="estimated"
              sourceText="Benchmark RPM ($2.0–$5.5)"
              icon={DollarSign}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideoAnalyticsPage() {
  return (
    <Shell
      title="Video Deep-Dive Intelligence"
      subtitle="View velocity, duration, engagement ratios, and revenue models"
    >
      <Suspense fallback={<div className="text-xs text-muted-foreground">Loading video intelligence...</div>}>
        <VideoAnalyticsContent />
      </Suspense>
    </Shell>
  );
}
