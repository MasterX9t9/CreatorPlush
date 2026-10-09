"use client";

import React, { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCompactNumber } from "@/lib/utils";
import {
  Search,
  Filter,
  Flame,
  Clock,
  Eye,
  ExternalLink,
  Bookmark,
  Sparkles,
  AlertCircle,
  Play,
} from "lucide-react";
import Image from "next/image";
import { clientFetch } from "@/lib/client-api";

interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  durationSec: number;
  durationFormatted: string;
  isShort: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  attribution: {
    source: any;
    dataType: any;
    timestamp: string;
    confidence: number;
  };
}

export default function YouTubeSearchPage() {
  const [query, setQuery] = useState("");
  const [duration, setDuration] = useState<"any" | "short" | "medium" | "long">("any");
  const [sortOrder, setSortOrder] = useState<"relevance" | "viewCount" | "date">("relevance");
  const [minViews, setMinViews] = useState<number>(0);
  const [onlyShorts, setOnlyShorts] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        videoDuration: duration,
        order: sortOrder,
        maxResults: "24",
      });

      const res = await clientFetch(`/api/v1/search/videos?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to search YouTube videos.");
        setResults([]);
      } else {
        setResults(json.data || []);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected network error occurred.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enforce Real Filter Rule (Rule 30): actually filter the dataset
  const filteredResults = results.filter((item) => {
    if (minViews > 0 && item.viewCount < minViews) return false;
    if (onlyShorts && !item.isShort) return false;
    return true;
  });

  return (
    <Shell
      title="YouTube Search Engine"
      subtitle="Official YouTube Data API queries with real view statistics and duration metadata"
    >
      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search YouTube videos (e.g., 'notion templates', 'solo founder', 'game dev')..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Searching API...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>

        {/* Real Filter Controls (Rule 30) */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-card/40 border border-white/5 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Duration Selector */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Duration:</span>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as any)}
              className="bg-card border border-white/10 rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="any">Any Length</option>
              <option value="short">Short (&lt; 4 min)</option>
              <option value="medium">Medium (4 - 20 min)</option>
              <option value="long">Long (&gt; 20 min)</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Sort By:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-card border border-white/10 rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="relevance">Relevance</option>
              <option value="viewCount">Most Views</option>
              <option value="date">Latest Uploads</option>
            </select>
          </div>

          {/* Minimum Views Filter */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Min Views:</span>
            <select
              value={minViews}
              onChange={(e) => setMinViews(Number(e.target.value))}
              className="bg-card border border-white/10 rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={0}>All</option>
              <option value={10000}>10K+</option>
              <option value={50000}>50K+</option>
              <option value={100000}>100K+</option>
              <option value={500000}>500K+</option>
            </select>
          </div>

          {/* Only Shorts Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={onlyShorts}
              onChange={(e) => setOnlyShorts(e.target.checked)}
              className="rounded bg-card border-white/10 text-primary focus:ring-primary"
            />
            <span>Shorts Only</span>
          </label>
        </div>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-200">YouTube Data API Notification</p>
            <p className="leading-relaxed">{error}</p>
            {error.includes("API Key is missing") && (
              <p className="text-[11px] text-muted-foreground pt-1">
                Configure your official Google API key in <code className="bg-black/40 px-1 py-0.5 rounded text-foreground">.env</code> as <code className="bg-black/40 px-1 py-0.5 rounded text-foreground">YOUTUBE_API_KEY</code>.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-xl overflow-hidden p-3 space-y-3">
              <Skeleton className="w-full aspect-video rounded-lg" />
              <Skeleton className="w-3/4 h-4 rounded" />
              <Skeleton className="w-1/2 h-3 rounded" />
              <div className="flex justify-between pt-2">
                <Skeleton className="w-16 h-3 rounded" />
                <Skeleton className="w-12 h-3 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State before search */}
      {!isLoading && !hasSearched && (
        <EmptyState
          title="Ready to Research"
          description="Enter keywords above to query the official YouTube Data API. Results feature real video views, duration tags, and calculated performance metrics."
          icon={Search}
        />
      )}

      {/* Empty state when query returned 0 matches */}
      {!isLoading && hasSearched && filteredResults.length === 0 && !error && (
        <EmptyState
          title="No Matching Videos Found"
          description="Try adjusting your keywords or clearing the active minimum views and duration filters."
          icon={Search}
        />
      )}

      {/* Video Results Grid */}
      {!isLoading && filteredResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing <strong className="text-foreground">{filteredResults.length}</strong> official YouTube videos
            </span>
            <AttributionBadge type="official" sourceText="YouTube Data API v3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredResults.map((item) => (
              <div
                key={item.id}
                className="glass-panel rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all flex flex-col group"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video w-full bg-black/40 overflow-hidden">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Play className="w-8 h-8" />
                    </div>
                  )}

                  {/* Duration Badge */}
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white tracking-wide">
                    {item.isShort ? "SHORT" : item.durationFormatted}
                  </span>
                </div>

                {/* Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3
                      title={item.title}
                      className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors"
                    >
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate font-medium">
                      {item.channelTitle}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/40 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatCompactNumber(item.viewCount)} views
                      </span>
                      <span>
                        {new Date(item.publishedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={`https://www.youtube.com/watch?v=${item.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Watch</span>
                      </a>

                      <a
                        href={`/research/outliers?channelId=${item.channelId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                      >
                        <Flame className="w-3 h-3 text-rose-500" />
                        <span>Outliers</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
}
