"use client";

import React, { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCompactNumber } from "@/lib/utils";
import {
  Users,
  Search,
  Flame,
  Radio,
  Bookmark,
  ExternalLink,
  Eye,
  BarChart2,
  Video,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

interface ChannelResult {
  id: string;
  title: string;
  customUrl?: string;
  description: string;
  avatarUrl: string;
  bannerUrl?: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  avgViewsPerVideo?: number;
}

export default function ChannelDiscoveryPage() {
  const [query, setQuery] = useState("");
  const [minSubs, setMinSubs] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(
        `/api/v1/search/channels?q=${encodeURIComponent(query.trim())}&maxResults=18`
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to search channels.");
        setChannels([]);
      } else {
        setChannels(json.data || []);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected network error occurred.");
      setChannels([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Rule 30: actual filtering
  const filteredChannels = channels.filter((c) => {
    if (minSubs > 0 && c.subscriberCount < minSubs) return false;
    return true;
  });

  return (
    <Shell
      title="YouTube Channel Discovery"
      subtitle="Discover and benchmark creators, subscriber velocity, and catalog statistics"
    >
      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search YouTube creators or topics (e.g. 'SaaS founders', 'productivity', 'Unreal Engine 5')..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Querying YouTube API...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Creators</span>
              </>
            )}
          </button>
        </div>

        {/* Real Filter Controls (Rule 30) */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-white/5 text-xs">
          <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
            Subscriber Filter:
          </span>
          <select
            value={minSubs}
            onChange={(e) => setMinSubs(Number(e.target.value))}
            className="bg-card border border-white/10 rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={0}>All Sizes</option>
            <option value={1000}>1K+ Subscribers</option>
            <option value={10000}>10K+ Subscribers</option>
            <option value={50000}>50K+ Subscribers</option>
            <option value={100000}>100K+ Subscribers</option>
            <option value={1000000}>1M+ Mega Creators</option>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="w-3/4 h-4 rounded" />
                  <Skeleton className="w-1/2 h-3 rounded" />
                </div>
              </div>
              <Skeleton className="w-full h-12 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Initial Empty State */}
      {!isLoading && !hasSearched && (
        <EmptyState
          title="Search YouTube Creators"
          description="Enter keywords above to find verified YouTube channels. Data reflects official subscriber counts, lifetime views, and calculated views-per-video benchmarks."
          icon={Users}
        />
      )}

      {/* Zero results state */}
      {!isLoading && hasSearched && filteredChannels.length === 0 && !error && (
        <EmptyState
          title="No Channels Found"
          description="Try broader keywords or lowering the minimum subscriber threshold."
          icon={Users}
        />
      )}

      {/* Results Grid */}
      {!isLoading && filteredChannels.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Found <strong className="text-foreground">{filteredChannels.length}</strong> verified creators
            </span>
            <AttributionBadge type="official" sourceText="YouTube Data API v3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredChannels.map((c) => (
              <div
                key={c.id}
                className="glass-panel rounded-xl p-5 border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={c.avatarUrl}
                      alt={c.title}
                      className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3
                        title={c.title}
                        className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors"
                      >
                        {c.title}
                      </h3>
                      {c.customUrl && (
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          {c.customUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-[10px] text-muted-foreground block">Subs</span>
                      <span className="font-bold text-foreground">
                        {formatCompactNumber(c.subscriberCount)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-[10px] text-muted-foreground block">Views</span>
                      <span className="font-bold text-foreground">
                        {formatCompactNumber(c.viewCount)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-[10px] text-muted-foreground block">Videos</span>
                      <span className="font-bold text-foreground">
                        {c.videoCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                  <a
                    href={`/research/outliers?channelId=${c.id}`}
                    className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>Viral Outliers</span>
                  </a>

                  <a
                    href={`https://www.youtube.com/channel/${c.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
}
