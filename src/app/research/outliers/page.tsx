"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCompactNumber } from "@/lib/utils";
import {
  Flame,
  Search,
  Calculator,
  ExternalLink,
  HelpCircle,
  Eye,
  TrendingUp,
  Info,
  Play,
  Layers,
} from "lucide-react";
import { clientFetch } from "@/lib/client-api";

interface OutlierVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  durationFormatted: string;
  isShort: boolean;
  viewCount: number;
  outlierAnalysis?: {
    actualViews: number;
    expectedViews: number;
    multiplier: number;
    tier: string;
    confidence: number;
    formula: string;
  };
}

function OutliersContent() {
  const searchParams = useSearchParams();
  const initialChannelId = searchParams.get("channelId") || "";

  const [channelInput, setChannelInput] = useState(initialChannelId);
  const [threshold, setThreshold] = useState<"2x" | "5x" | "10x" | "20x_plus">("2x");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [channelMedian, setChannelMedian] = useState<number | null>(null);
  const [outlierVideos, setOutlierVideos] = useState<OutlierVideo[]>([]);
  const [hasQueried, setHasQueried] = useState(false);

  const fetchOutliers = React.useCallback(async (channelId: string) => {
    if (!channelId.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasQueried(true);

    try {
      const res = await clientFetch(
        `/api/v1/outliers?channelId=${encodeURIComponent(
          channelId.trim()
        )}&threshold=${threshold}`
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to analyze channel outliers.");
        setOutlierVideos([]);
        setChannelMedian(null);
      } else {
        setOutlierVideos(json.data.videos || []);
        setChannelMedian(json.data.channelMedianViews || 0);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected network error occurred.");
      setOutlierVideos([]);
      setChannelMedian(null);
    } finally {
      setIsLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    if (initialChannelId) {
      fetchOutliers(initialChannelId);
    }
  }, [initialChannelId, fetchOutliers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOutliers(channelInput);
  };

  return (
    <Shell
      title="Statistical Outlier Detection Engine"
      subtitle="Pure mathematical outlier identification comparing actual video views against channel median baseline"
    >
      {/* Mathematical Formula Explanation Card (Rule 17) */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-gradient-to-r from-card via-card to-rose-950/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Calculator className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-foreground tracking-tight">
              Transparent Outlier Algorithm
            </h2>
          </div>
          <AttributionBadge type="calculated" sourceText="Median-ratio statistical formula" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground pt-1">
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <span className="font-semibold text-foreground block mb-1">
              1. Expected Views E(v)
            </span>
            <span>
              E(v) = Median(Historical catalog view counts). Uses median rather than mean to prevent viral skewing.
            </span>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <span className="font-semibold text-foreground block mb-1">
              2. Outlier Multiplier (M)
            </span>
            <span>
              M = Actual Video Views / E(v). A video with 100K views on a 20K median channel has M = 5.0x.
            </span>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <span className="font-semibold text-foreground block mb-1">
              3. Discrete Tiers
            </span>
            <span>
              Grouped into 2x, 5x, 10x, and 20x+ viral breakouts. No fabricated &ldquo;AI magic scores&rdquo;.
            </span>
          </div>
        </div>
      </div>

      {/* Channel ID Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              placeholder="Paste YouTube Channel URL (e.g. 'youtube.com/@handle'), @handle, Video link, or Channel ID..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm font-mono text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !channelInput.trim()}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Computing Medians...</span>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Analyze Outliers</span>
              </>
            )}
          </button>
        </div>

        {/* Threshold Selector Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-card/60 border border-white/5 w-fit text-xs">
          <span className="text-muted-foreground font-semibold px-2 uppercase tracking-wider text-[11px]">
            Threshold:
          </span>
          {(
            [
              { id: "2x", label: "2x+ Outliers" },
              { id: "5x", label: "5x+ Outliers" },
              { id: "10x", label: "10x+ Outliers" },
              { id: "20x_plus", label: "20x+ Viral Outliers" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setThreshold(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                threshold === tab.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-3">
          <Info className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-xl overflow-hidden p-4 space-y-3">
              <Skeleton className="w-full aspect-video rounded-lg" />
              <Skeleton className="w-3/4 h-4 rounded" />
              <Skeleton className="w-1/2 h-3 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State before search */}
      {!isLoading && !hasQueried && (
        <EmptyState
          title="Inspect Any YouTube Channel's Outliers"
          description="Enter a channel ID above to retrieve recent uploads, calculate the channel's baseline median views, and identify genuine viral outliers."
          icon={Flame}
        />
      )}

      {/* No outliers found under selected threshold */}
      {!isLoading && hasQueried && outlierVideos.length === 0 && !error && (
        <EmptyState
          title="No Outliers Meeting Threshold"
          description={`None of the analyzed uploads met the ${threshold} threshold above the baseline median of ${channelMedian ? formatCompactNumber(channelMedian) : "0"} views. Try selecting the 2x+ threshold.`}
          icon={Flame}
        />
      )}

      {/* Outlier Video Grid */}
      {!isLoading && outlierVideos.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl glass-panel border border-white/5 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold">
                Baseline Median: {formatCompactNumber(channelMedian || 0)} views
              </div>
              <span className="text-muted-foreground">
                Found <strong className="text-foreground">{outlierVideos.length}</strong> videos performing at {threshold} or above
              </span>
            </div>
            <AttributionBadge type="calculated" sourceText="Outlier score calculated from official public views" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {outlierVideos.map((video) => {
              const multiplier = video.outlierAnalysis?.multiplier || 1.0;
              return (
                <div
                  key={video.id}
                  className="glass-panel rounded-xl overflow-hidden border border-white/5 hover:border-rose-500/30 transition-all flex flex-col group"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full bg-black/40 overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Play className="w-8 h-8" />
                      </div>
                    )}

                    {/* Outlier Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-rose-600/90 text-white font-black text-xs shadow-md flex items-center gap-1 backdrop-blur-sm">
                      <Flame className="w-3.5 h-3.5 fill-white" />
                      <span>{multiplier}x OUTLIER</span>
                    </div>

                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white tracking-wide">
                      {video.isShort ? "SHORT" : video.durationFormatted}
                    </span>
                  </div>

                  {/* Body & Stats */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <h3
                      title={video.title}
                      className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors"
                    >
                      {video.title}
                    </h3>

                    <div className="pt-2 border-t border-border/40 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Actual Views:</span>
                        <span className="font-bold text-foreground">
                          {formatCompactNumber(video.viewCount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Channel Median:</span>
                        <span className="font-medium text-muted-foreground">
                          {formatCompactNumber(channelMedian || 0)}
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <a
                          href={`https://www.youtube.com/watch?v=${video.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Watch on YouTube</span>
                        </a>

                        <AttributionBadge type="calculated" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Shell>
  );
}

export default function OutliersPage() {
  return (
    <Suspense
      fallback={
        <Shell
          title="Statistical Outlier Detection Engine"
          subtitle="Loading Outlier Telemetry Engine..."
        >
          <div className="glass-panel p-8 text-center text-xs text-muted-foreground rounded-xl">
            Initializing outlier calculation pipeline...
          </div>
        </Shell>
      }
    >
      <OutliersContent />
    </Suspense>
  );
}
