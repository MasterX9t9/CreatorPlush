"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCompactNumber } from "@/lib/utils";
import {
  BarChart3,
  Search,
  Users,
  Eye,
  Flame,
  DollarSign,
  TrendingUp,
  ExternalLink,
  AlertCircle,
  Calendar,
  Tag,
  Scale,
  Bookmark,
  CheckCircle2,
  Loader2,
  Sparkles,
  Layers,
  Film,
  Hash,
  ArrowRight,
  Info,
  Tv,
} from "lucide-react";

interface AnalyticsData {
  channel: {
    id: string;
    title: string;
    customUrl?: string;
    description: string;
    avatarUrl: string;
    bannerUrl?: string;
    subscriberCount: number;
    viewCount: number;
    videoCount: number;
    publishedAt?: string;
    country?: string;
  };
  medianViews: number;
  averageViews: number;
  sampleVideoCount: number;
  shortsCount: number;
  longFormCount: number;
  shortsAvgViews: number;
  longFormAvgViews: number;
  uploadsPerWeek: number;
  reachRatio: number;
  dominantCategory: string;
  topKeywords: Array<{ tag: string; count: number }>;
  outliersCount: number;
  megaOutliersCount: number;
  outlierPercentage: number;
  revenueEstimate: {
    monthlyRevenueMin: number;
    monthlyRevenueMax: number;
    rpmMin: number;
    rpmMax: number;
    currency: string;
  };
  topVideos: Array<{
    id: string;
    title: string;
    thumbnailUrl: string;
    viewCount: number;
    publishedAt: string;
    durationFormatted: string;
    isShort: boolean;
    outlierAnalysis?: { multiplier: number; tier: string };
  }>;
  recentVideos: Array<{
    id: string;
    title: string;
    thumbnailUrl: string;
    viewCount: number;
    publishedAt: string;
    durationFormatted: string;
    isShort: boolean;
    outlierAnalysis?: { multiplier: number; tier: string };
  }>;
}

function ChannelAnalyticsContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [channelInput, setChannelInput] = useState(initialId);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab filter for videos: 'all' | 'outliers' | 'longForm' | 'shorts'
  const [videoFilter, setVideoFilter] = useState<"all" | "outliers" | "longForm" | "shorts">("all");

  // Save to swipe file state
  const [isSavingSwipe, setIsSavingSwipe] = useState(false);
  const [swipeSaved, setSwipeSaved] = useState(false);
  const [swipeError, setSwipeError] = useState<string | null>(null);

  const fetchAnalytics = async (inputStr: string) => {
    if (!inputStr.trim()) return;
    setIsLoading(true);
    setError(null);
    setSwipeSaved(false);
    setSwipeError(null);

    try {
      const res = await fetch(`/api/v1/channels/${encodeURIComponent(inputStr.trim())}/analytics`);
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        setError(json.error?.message || "Could not find channel analytics for this link or ID.");
        setData(null);
      } else {
        setData(json.data);
      }
    } catch (err: any) {
      setError(err?.message || "Network error querying channel analytics.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      fetchAnalytics(initialId);
    }
  }, [initialId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics(channelInput);
  };

  const handleSaveToSwipeFile = async () => {
    if (!data) return;
    setIsSavingSwipe(true);
    setSwipeError(null);

    try {
      const payload = {
        title: data.channel.title,
        itemType: "CHANNEL",
        externalId: data.channel.id,
        thumbnailUrl: data.channel.avatarUrl,
        url: data.channel.customUrl
          ? `https://www.youtube.com/${data.channel.customUrl}`
          : `https://www.youtube.com/channel/${data.channel.id}`,
        notes: `Category: ${data.dominantCategory} | Subs: ${data.channel.subscriberCount} | Median Views: ${data.medianViews} | Cadence: ${data.uploadsPerWeek}/wk`,
        tags: [data.dominantCategory, ...(data.topKeywords || []).slice(0, 4).map((k) => k.tag)],
      };

      const res = await fetch("/api/v1/swipefile/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSwipeSaved(true);
        setTimeout(() => setSwipeSaved(false), 4000);
      } else {
        setSwipeError(json.error?.message || "Failed to save channel to Swipe File.");
      }
    } catch (err: any) {
      setSwipeError(err?.message || "Error saving item to database.");
    } finally {
      setIsSavingSwipe(false);
    }
  };

  // Filter video list based on active tab
  const displayedVideos = data
    ? videoFilter === "all"
      ? data.recentVideos
      : videoFilter === "outliers"
      ? data.recentVideos.filter((v) => (v.outlierAnalysis?.multiplier || 1.0) >= 2.0)
      : videoFilter === "longForm"
      ? data.recentVideos.filter((v) => !v.isShort)
      : data.recentVideos.filter((v) => v.isShort)
    : [];

  return (
    <div className="space-y-6">
      {/* Search Input Bar - Supports normal links, @handles, video links, and channel IDs */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
            placeholder="Paste any YouTube Channel URL (e.g. 'youtube.com/@handle'), Handle, Video link, or Channel ID..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !channelInput.trim()}
          className="px-6 py-3 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center gap-2 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BarChart3 className="w-4 h-4" />
          )}
          <span>{isLoading ? "Analyzing..." : "Analyze Channel"}</span>
        </button>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="w-48 h-5 rounded" />
              <Skeleton className="w-32 h-4 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Empty State before search */}
      {!isLoading && !data && !error && (
        <EmptyState
          title="Creator Channel Performance Intelligence"
          description="Paste any YouTube channel link (e.g. 'https://www.youtube.com/@LegendMangaReels'), video URL, or channel ID to reveal real subscriber statistics, upload cadence, median view baselines, Shorts vs long-form ratios, and viral outliers."
          icon={BarChart3}
        />
      )}

      {/* Analytics Presentation */}
      {!isLoading && data && (
        <div className="space-y-6">
          {/* Channel Header Profile Card */}
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-lg">
            {/* Optional Banner Backdrop */}
            {data.channel.bannerUrl && (
              <div
                className="w-full h-32 md:h-44 bg-cover bg-center border-b border-white/10 relative"
                style={{ backgroundImage: `url(${data.channel.bannerUrl})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              </div>
            )}

            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start md:items-center gap-4 min-w-0">
                <img
                  src={data.channel.avatarUrl}
                  alt={data.channel.title}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-primary/40 shadow-xl shrink-0 bg-black/40"
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg md:text-xl font-bold text-foreground truncate">
                      {data.channel.title}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                      {data.dominantCategory}
                    </span>
                    <AttributionBadge type="official" sourceText="YouTube Data API v3" />
                  </div>

                  <p className="text-xs text-muted-foreground font-mono">
                    {data.channel.customUrl || `@${data.channel.title.toLowerCase().replace(/\s+/g, "")}`} • {data.channel.videoCount} Total Uploads
                  </p>

                  {data.channel.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 max-w-2xl pt-0.5">
                      {data.channel.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
                <a
                  href={`https://www.youtube.com/channel/${data.channel.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-foreground transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </a>

                <Link
                  href={`/research/outliers?channelId=${data.channel.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Outliers</span>
                </Link>

                <Link
                  href={`/analytics/compare?ch1=${data.channel.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-colors"
                >
                  <Scale className="w-3.5 h-3.5 text-blue-400" />
                  <span>Compare</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSaveToSwipeFile}
                  disabled={isSavingSwipe}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    swipeSaved
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-foreground"
                  }`}
                >
                  {isSavingSwipe ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : swipeSaved ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span>{swipeSaved ? "Saved to Library!" : "Save to Swipe"}</span>
                </button>
              </div>
            </div>

            {swipeError && (
              <div className="px-6 pb-4 text-[11px] text-rose-400">{swipeError}</div>
            )}
          </div>

          {/* Primary Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Subscribers"
              value={formatCompactNumber(data.channel.subscriberCount)}
              subValue="Official public count"
              dataType="official"
              sourceText="YouTube Data API v3"
              icon={Users}
            />
            <MetricCard
              label="Lifetime Views"
              value={formatCompactNumber(data.channel.viewCount)}
              subValue={`~${formatCompactNumber(data.averageViews)} avg views per upload`}
              dataType="official"
              sourceText="YouTube Data API v3"
              icon={Eye}
            />
            <MetricCard
              label="Upload Cadence"
              value={`${data.uploadsPerWeek} / week`}
              subValue={
                data.uploadsPerWeek >= 4
                  ? "High velocity production"
                  : data.uploadsPerWeek >= 1
                  ? "Consistent weekly schedule"
                  : "Periodic release schedule"
              }
              dataType="calculated"
              sourceText="Sample publishing timeline"
              icon={Calendar}
            />
            <MetricCard
              label="Catalog Median Baseline"
              value={formatCompactNumber(data.medianViews)}
              subValue="Expected normal views E(v)"
              dataType="calculated"
              sourceText="Statistical median of uploads"
              icon={TrendingUp}
            />
          </div>

          {/* Format & Audience Intelligence Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Format Performance */}
            <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1.5">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold flex items-center justify-between">
                <span>Format Power Ratio</span>
                <Film className="w-3.5 h-3.5 text-primary" />
              </span>
              <p className="text-base font-bold text-foreground">
                {data.longFormCount > 0 && data.shortsCount > 0
                  ? data.longFormAvgViews >= data.shortsAvgViews
                    ? "Long-Form Dominant"
                    : "Shorts Dominant"
                  : data.longFormCount > 0
                  ? "100% Long-Form"
                  : "100% Shorts"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Long: {formatCompactNumber(data.longFormAvgViews)} avg • Shorts: {formatCompactNumber(data.shortsAvgViews)} avg
              </p>
            </div>

            {/* Subscriber Reach Ratio */}
            <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1.5">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold flex items-center justify-between">
                <span>Audience Reach Ratio</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              <p className="text-base font-bold text-foreground">{data.reachRatio}%</p>
              <p className="text-[11px] text-muted-foreground">
                {data.reachRatio >= 50
                  ? "High algorithmic / browse discovery"
                  : "Core subscriber viewing baseline"}
              </p>
            </div>

            {/* Outlier Breakthrough Rate */}
            <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1.5">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold flex items-center justify-between">
                <span>Viral Outlier Rate</span>
                <Flame className="w-3.5 h-3.5 text-rose-400" />
              </span>
              <p className="text-base font-bold text-foreground">
                {data.outlierPercentage}% of uploads
              </p>
              <p className="text-[11px] text-muted-foreground">
                {data.outliersCount} breakouts (≥2x) • {data.megaOutliersCount} viral hits (≥5x)
              </p>
            </div>

            {/* Est Monthly Revenue */}
            <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1.5">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold flex items-center justify-between">
                <span>Est. Monthly Ad Revenue</span>
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <p className="text-base font-bold text-foreground">
                ${data.revenueEstimate.monthlyRevenueMin} – ${data.revenueEstimate.monthlyRevenueMax}
              </p>
              <p className="text-[11px] text-muted-foreground">
                RPM benchmark: ${data.revenueEstimate.rpmMin} – ${data.revenueEstimate.rpmMax}
              </p>
            </div>
          </div>

          {/* Channel Niche & Focus Keywords Cloud */}
          {data.topKeywords && data.topKeywords.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span>Channel Specialization & Top Focus Keywords</span>
                </h3>
                <span className="text-xs text-muted-foreground">
                  Extracted from recent upload metadata
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {data.topKeywords.map((k, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-foreground flex items-center gap-1.5"
                  >
                    <Hash className="w-3 h-3 text-muted-foreground" />
                    <span>{k.tag}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 text-muted-foreground font-bold">
                      {k.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Uploads Explorer & Outlier Highlighting */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Recent Upload Performance & Outliers
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Benchmarks recent uploads against the channel&apos;s expected baseline of{" "}
                  <strong className="text-foreground">
                    {formatCompactNumber(data.medianViews)} views
                  </strong>
                  .
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setVideoFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    videoFilter === "all"
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({data.recentVideos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVideoFilter("outliers")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    videoFilter === "outliers"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  <span>Outliers ({data.outliersCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVideoFilter("longForm")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    videoFilter === "longForm"
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Long-Form ({data.longFormCount})
                </button>
                <button
                  type="button"
                  onClick={() => setVideoFilter("shorts")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    videoFilter === "shorts"
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Shorts ({data.shortsCount})
                </button>
              </div>
            </div>

            {/* Video Cards Grid */}
            {displayedVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedVideos.map((video) => {
                  const multiplier = video.outlierAnalysis?.multiplier || 1.0;
                  const isOutlier = multiplier >= 2.0;

                  return (
                    <div
                      key={video.id}
                      className="p-3.5 rounded-xl bg-card border border-white/10 space-y-2.5 flex flex-col justify-between hover:border-white/20 transition-all group"
                    >
                      <div className="space-y-2">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40 border border-white/10">
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white tracking-wide">
                            {video.durationFormatted}
                          </span>
                          {isOutlier && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold text-[10px] flex items-center gap-0.5 shadow-md">
                              <Flame className="w-3 h-3" />
                              <span>{multiplier}x Outlier</span>
                            </span>
                          )}
                        </div>

                        <h4
                          title={video.title}
                          className="text-xs font-semibold text-foreground line-clamp-2 leading-snug"
                        >
                          {video.title}
                        </h4>
                      </div>

                      <div className="space-y-1.5 pt-1 border-t border-white/5 text-[11px] text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">
                            {formatCompactNumber(video.viewCount)} views
                          </span>
                          <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <Link
                            href={`/analytics/videos?id=${video.id}`}
                            className="text-primary hover:underline font-semibold flex items-center gap-1 text-[11px]"
                          >
                            <span>Inspect Video</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>

                          <a
                            href={`https://www.youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-muted-foreground hover:text-foreground"
                            title="Open on YouTube"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-white/10 text-center text-xs text-muted-foreground">
                No uploads found for the selected filter tab.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChannelAnalyticsPage() {
  return (
    <Shell
      title="Creator Channel Intelligence"
      subtitle="Exhaustive performance audit, median baselines, upload cadence, and format velocity"
    >
      <Suspense fallback={<div className="text-xs text-muted-foreground">Loading channel telemetry...</div>}>
        <ChannelAnalyticsContent />
      </Suspense>
    </Shell>
  );
}
