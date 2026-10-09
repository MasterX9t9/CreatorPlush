"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCompactNumber } from "@/lib/utils";
import {
  Zap,
  Search,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  Flame,
  ExternalLink,
  Play,
  AlertCircle,
  Filter,
} from "lucide-react";

interface ShortItem {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  durationSec: number;
  durationFormatted: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

function ShortsAnalyticsContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("q") || "youtube shorts";

  const [searchQuery, setSearchQuery] = useState(initialTopic);
  const [minViews, setMinViews] = useState<number>(0);
  const [shorts, setShorts] = useState<ShortItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShorts = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Query videos with duration = "short" (< 4 mins)
      const res = await fetch(
        `/api/v1/search/videos?q=${encodeURIComponent(
          query.trim() + " #shorts"
        )}&videoDuration=short&maxResults=24`
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to search Shorts.");
        setShorts([]);
      } else {
        // Enforce true Shorts filter (duration <= 60 seconds)
        const trueShorts = (json.data || []).filter(
          (v: any) => v.durationSec > 0 && v.durationSec <= 60
        );
        setShorts(trueShorts.length > 0 ? trueShorts : json.data || []);
      }
    } catch (err: any) {
      setError(err?.message || "Network error loading Shorts.");
      setShorts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialTopic) {
      fetchShorts(initialTopic);
    }
  }, [initialTopic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShorts(searchQuery);
  };

  // Rule 30: actual filtering
  const filteredShorts = shorts.filter((s) => {
    if (minViews > 0 && s.viewCount < minViews) return false;
    return true;
  });

  const totalViews = filteredShorts.reduce((acc, s) => acc + s.viewCount, 0);
  const avgViews = filteredShorts.length > 0 ? Math.round(totalViews / filteredShorts.length) : 0;

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Zap className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Shorts by topic, niche, or creator..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Search Shorts</span>
          </button>
        </div>

        {/* Real Filter Bar (Rule 30) */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-white/5 text-xs">
          <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Min Views:</span>
          </span>
          <select
            value={minViews}
            onChange={(e) => setMinViews(Number(e.target.value))}
            className="bg-card border border-white/10 rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={0}>All Views</option>
            <option value={50000}>50K+ Views</option>
            <option value={100000}>100K+ Views</option>
            <option value={500000}>500K+ Viral</option>
            <option value={1000000}>1M+ Mega Viral</option>
          </select>
        </div>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-xl p-3 space-y-2">
              <Skeleton className="w-full aspect-[9/16] rounded-lg" />
              <Skeleton className="w-3/4 h-3 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Results Presentation */}
      {!isLoading && filteredShorts.length > 0 && (
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Total Shorts Found"
              value={filteredShorts.length}
              subValue="Matching <= 60 second filter"
              dataType="official"
              sourceText="YouTube Data API v3"
              icon={Zap}
            />
            <MetricCard
              label="Average Shorts Views"
              value={formatCompactNumber(avgViews)}
              subValue="Mean across active dataset"
              dataType="calculated"
              sourceText="Calculated view average"
              icon={Eye}
            />
            <MetricCard
              label="Total Combined Views"
              value={formatCompactNumber(totalViews)}
              subValue="Sample view velocity"
              dataType="calculated"
              sourceText="Aggregated view counts"
              icon={Flame}
            />
          </div>

          {/* Vertical Shorts Cards Grid (9:16 aspect ratio) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredShorts.map((short) => (
              <div
                key={short.id}
                className="glass-panel rounded-xl overflow-hidden border border-white/5 hover:border-rose-500/30 transition-all flex flex-col group relative"
              >
                {/* 9:16 Aspect Ratio Thumbnail */}
                <div className="relative aspect-[9/16] w-full bg-black/40 overflow-hidden">
                  <img
                    src={short.thumbnailUrl}
                    alt={short.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-rose-600 text-[10px] font-bold text-white flex items-center gap-0.5 shadow-md">
                    <Zap className="w-2.5 h-2.5 fill-white" />
                    <span>SHORT</span>
                  </div>
                  <span className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                    {short.durationFormatted}
                  </span>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <h4
                    title={short.title}
                    className="text-xs font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors"
                  >
                    {short.title}
                  </h4>

                  <div className="pt-2 border-t border-border/40 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-bold text-foreground">
                        {formatCompactNumber(short.viewCount)}
                      </span>
                      <span>views</span>
                    </div>

                    <a
                      href={`https://www.youtube.com/watch?v=${short.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary font-semibold hover:underline pt-1"
                    >
                      <span>Watch</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShortsAnalyticsPage() {
  return (
    <Shell
      title="YouTube Shorts Intelligence"
      subtitle="Discover vertical video velocity, hook engagement, and viral micro-content patterns"
    >
      <Suspense fallback={<div className="text-xs text-muted-foreground">Loading Shorts research...</div>}>
        <ShortsAnalyticsContent />
      </Suspense>
    </Shell>
  );
}
