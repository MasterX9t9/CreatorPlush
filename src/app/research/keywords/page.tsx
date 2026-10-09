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
  KeyRound,
  Search,
  Sparkles,
  BarChart,
  Eye,
  ExternalLink,
  Flame,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface KeywordData {
  keyword: string;
  averageViews: number;
  competitionLevel: "Low" | "Medium" | "High";
  opportunityScore: number;
  sampleResultsCount: number;
  topVideos: Array<{
    id: string;
    title: string;
    channelTitle: string;
    viewCount: number;
    thumbnailUrl: string;
    publishedAt: string;
    durationFormatted: string;
  }>;
  relatedTerms: string[];
}

function KeywordResearchContent() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get("q") || "";

  const [inputKeyword, setInputKeyword] = useState(initialKeyword);
  const [data, setData] = useState<KeywordData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKeyword = async (term: string) => {
    if (!term.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/keywords/research?q=${encodeURIComponent(term.trim())}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to research keyword.");
        setData(null);
      } else {
        setData(json.data);
      }
    } catch (err: any) {
      setError(err?.message || "Network error researching keyword.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialKeyword) {
      fetchKeyword(initialKeyword);
    }
  }, [initialKeyword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKeyword(inputKeyword);
  };

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={inputKeyword}
            onChange={(e) => setInputKeyword(e.target.value)}
            placeholder="Enter search term or keyword (e.g. 'Next.js tutorial', 'indie hacker', 'Figma tips')..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !inputKeyword.trim()}
          className="px-6 py-3 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>Research Keyword</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      )}

      {/* Initial Empty State */}
      {!isLoading && !data && !error && (
        <EmptyState
          title="YouTube Keyword Opportunity Engine"
          description="Analyze search volume velocity, creator competition concentration, and long-tail query alternatives grounded on actual YouTube search queries."
          icon={KeyRound}
        />
      )}

      {/* Results Presentation */}
      {!isLoading && data && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Opportunity Score"
              value={`${data.opportunityScore} / 100`}
              subValue="Demand vs competitor density ratio"
              dataType="calculated"
              sourceText="Calculated from search results views"
              icon={Sparkles}
            />
            <MetricCard
              label="Competition Level"
              value={data.competitionLevel}
              subValue="Based on top video view saturation"
              dataType="calculated"
              sourceText="Calculated from top video views"
              icon={BarChart}
            />
            <MetricCard
              label="Avg Views for Keyword"
              value={formatCompactNumber(data.averageViews)}
              subValue={`Across top ${data.sampleResultsCount} search results`}
              dataType="calculated"
              sourceText="Official YouTube views average"
              icon={Eye}
            />
          </div>

          {/* Long-tail Keywords Recommendations */}
          <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Related Long-Tail Opportunities
              </h3>
              <AttributionBadge type="calculated" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {data.relatedTerms.map((term, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between gap-2 text-xs hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => {
                    setInputKeyword(term);
                    fetchKeyword(term);
                  }}
                >
                  <span className="font-medium text-foreground truncate">{term}</span>
                  <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Top Ranking Videos */}
          <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                Top Ranking YouTube Results for &ldquo;{data.keyword}&rdquo;
              </h3>
              <AttributionBadge type="official" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.topVideos.map((video) => (
                <div
                  key={video.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-bold text-white">
                        {video.durationFormatted}
                      </span>
                    </div>

                    <h4
                      title={video.title}
                      className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors"
                    >
                      {video.title}
                    </h4>

                    <p className="text-[11px] text-muted-foreground truncate">
                      {video.channelTitle}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-bold text-foreground">
                      {formatCompactNumber(video.viewCount)} views
                    </span>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="w-3 h-3" />
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

export default function KeywordResearchPage() {
  return (
    <Shell
      title="YouTube Keyword Intelligence"
      subtitle="Evaluate search velocity, competition levels, and high-opportunity long-tail topics"
    >
      <Suspense fallback={<div className="text-xs text-muted-foreground">Loading keyword data...</div>}>
        <KeywordResearchContent />
      </Suspense>
    </Shell>
  );
}
