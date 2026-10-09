"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  Search,
  Users,
  Eye,
  Flame,
  Zap,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Play,
  AlertCircle,
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
  };
  medianViews: number;
  averageViews: number;
  sampleVideoCount: number;
  shortsCount: number;
  longFormCount: number;
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

  const fetchAnalytics = async (channelId: string) => {
    if (!channelId.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/channels/${encodeURIComponent(channelId.trim())}/analytics`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to load channel analytics.");
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

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
            placeholder="Enter Channel ID to inspect full analytics (e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw)..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !channelInput.trim()}
          className="px-6 py-3 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Generate Analytics</span>
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
          title="Analyze Any YouTube Creator"
          description="Enter a channel ID above to calculate historical medians, analyze Shorts vs long-form distribution, evaluate outlier breakout percentages, and view transparent revenue estimates."
          icon={BarChart3}
        />
      )}

      {/* Analytics Presentation */}
      {!isLoading && data && (
        <div className="space-y-6">
          {/* Channel Header Profile */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={data.channel.avatarUrl}
                alt={data.channel.title}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">
                    {data.channel.title}
                  </h2>
                  <AttributionBadge type="official" sourceText="YouTube Data API v3" />
                </div>
                {data.channel.customUrl && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {data.channel.customUrl} • Channel ID: {data.channel.id}
                  </p>
                )}
                <p className="text-xs text-muted-foreground pt-1 line-clamp-1 max-w-xl">
                  {data.channel.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`https://www.youtube.com/channel/${data.channel.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-foreground transition-colors"
              >
                <span>View on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={`/research/outliers?channelId=${data.channel.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-pulse-600 text-xs font-semibold text-white transition-colors"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Inspect Outliers</span>
              </a>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Subscribers"
              value={formatCompactNumber(data.channel.subscriberCount)}
              subValue="Official YouTube subscriber count"
              dataType="official"
              sourceText="YouTube Data API v3"
              icon={Users}
            />
            <MetricCard
              label="Catalog Median Views"
              value={formatCompactNumber(data.medianViews)}
              subValue="Historical expected baseline E(v)"
              dataType="calculated"
              sourceText="Statistical median of analyzed uploads"
              icon={TrendingUp}
            />
            <MetricCard
              label="Outlier Rate"
              value={`${data.outlierPercentage}%`}
              subValue="Uploads performing at >= 2.0x median"
              dataType="calculated"
              sourceText="Outlier multiplier calculation"
              icon={Flame}
            />
            <MetricCard
              label="Est. Monthly Revenue"
              value={`$${data.revenueEstimate.monthlyRevenueMin} – $${data.revenueEstimate.monthlyRevenueMax}`}
              subValue={`RPM range: $${data.revenueEstimate.rpmMin} – $${data.revenueEstimate.rpmMax}`}
              dataType="estimated"
              sourceText="Industry benchmark range estimate"
              icon={DollarSign}
            />
          </div>

          {/* Format Distribution: Shorts vs Long-Form */}
          <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Catalog Format Distribution</span>
              <AttributionBadge type="calculated" />
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-muted-foreground block text-[11px]">Total Sample Analyzed</span>
                <span className="font-bold text-foreground text-base">
                  {data.sampleVideoCount} uploads
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-muted-foreground block text-[11px]">Long-Form Videos</span>
                <span className="font-bold text-foreground text-base">
                  {data.longFormCount} ({data.sampleVideoCount > 0 ? Math.round((data.longFormCount / data.sampleVideoCount) * 100) : 0}%)
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-muted-foreground block text-[11px]">YouTube Shorts</span>
                <span className="font-bold text-foreground text-base">
                  {data.shortsCount} ({data.sampleVideoCount > 0 ? Math.round((data.shortsCount / data.sampleVideoCount) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Top Videos Table */}
          <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                Top Performing Uploads (Sample)
              </h3>
              <AttributionBadge type="official" />
            </div>

            <div className="divide-y divide-border/40">
              {data.topVideos.map((video) => (
                <div
                  key={video.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-16 aspect-video rounded-md object-cover bg-black/40 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 title={video.title} className="font-semibold text-foreground truncate">
                        {video.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(video.publishedAt).toLocaleDateString()} • {video.durationFormatted}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 sm:text-right">
                    <div>
                      <span className="font-bold text-foreground block">
                        {formatCompactNumber(video.viewCount)} views
                      </span>
                      {video.outlierAnalysis && (
                        <span className="text-[10px] font-semibold text-rose-400">
                          {video.outlierAnalysis.multiplier}x Outlier
                        </span>
                      )}
                    </div>

                    <a
                      href={`https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
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
      subtitle="Exhaustive performance audit, median benchmarks, and format velocity"
    >
      <Suspense fallback={<div className="text-xs text-muted-foreground">Loading channel telemetry...</div>}>
        <ChannelAnalyticsContent />
      </Suspense>
    </Shell>
  );
}
