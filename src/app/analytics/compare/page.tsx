"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  Users,
  Eye,
  Film,
  DollarSign,
  TrendingUp,
  Search,
  Scale,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { ChannelSimilarityResult } from "@/lib/algorithms/similarity";
import { clientFetch } from "@/lib/client-api";

interface ChannelDetails {
  id: string;
  title: string;
  customUrl?: string;
  avatarUrl: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  avgViewsPerVideo?: number;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const initialChA = searchParams.get("ch1") || "";
  const initialChB = searchParams.get("ch2") || "";

  const [channelAQuery, setChannelAQuery] = useState(initialChA);
  const [channelBQuery, setChannelBQuery] = useState(initialChB);

  const [channelA, setChannelA] = useState<ChannelDetails | null>(null);
  const [channelB, setChannelB] = useState<ChannelDetails | null>(null);
  const [similarity, setSimilarity] = useState<ChannelSimilarityResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolveChannel(query: string): Promise<ChannelDetails | null> {
    if (!query.trim()) return null;

    // 1. Direct channel resolution supporting handles, normal URLs, video links, and IDs
    try {
      const res = await clientFetch(`/api/v1/channels/${encodeURIComponent(query.trim())}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch {
      // Fall through
    }

    // 2. Search fallback by channel name
    try {
      const searchRes = await clientFetch(
        `/api/v1/search/channels?q=${encodeURIComponent(query.trim())}&maxResults=1`
      );
      const searchJson = await searchRes.json();
      if (searchJson.success && searchJson.data?.length > 0) {
        return searchJson.data[0];
      }
    } catch {
      // Fall through
    }

    return null;
  }

  async function handleCompare(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!channelAQuery.trim() || !channelBQuery.trim()) {
      setError("Please specify two channels to compare.");
      return;
    }

    setLoading(true);
    setError(null);
    setChannelA(null);
    setChannelB(null);
    setSimilarity(null);

    try {
      const [resA, resB] = await Promise.all([
        resolveChannel(channelAQuery),
        resolveChannel(channelBQuery),
      ]);

      if (!resA) {
        setError(`Could not find YouTube channel for "${channelAQuery}".`);
        setLoading(false);
        return;
      }

      if (!resB) {
        setError(`Could not find YouTube channel for "${channelBQuery}".`);
        setLoading(false);
        return;
      }

      setChannelA(resA);
      setChannelB(resB);

      // Now fetch similarity score
      const simRes = await fetch(
        `/api/v1/search/similar-channels?channelId=${encodeURIComponent(resA.id)}&maxResults=10`
      );
      const simJson = await simRes.json();
      if (simJson.success && simJson.data?.similarChannels) {
        const match = simJson.data.similarChannels.find(
          (sc: any) => sc.channel.id === resB.id
        );
        if (match) {
          setSimilarity(match.similarity);
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during comparison.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialChA && initialChB) {
      handleCompare();
    }
  }, [initialChA, initialChB]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Channel Benchmark & Comparison
            </h1>
            <AttributionBadge type="calculated" sourceText="internal_calculation" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Head-to-head empirical metrics, upload velocity, scale ratios, and algorithmic similarity.
          </p>
        </div>
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleCompare}
        className="rounded-xl border border-border bg-card p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Channel A (URL, @Handle, or Name)
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="e.g. '@LegendMangaReels', channel URL, or UC..."
                value={channelAQuery}
                onChange={(e) => setChannelAQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Channel B (URL, @Handle, or Name)
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="e.g. '@Dave2D', channel URL, or UC..."
                value={channelBQuery}
                onChange={(e) => setChannelBQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Comparing Channels...
              </>
            ) : (
              <>
                <Scale className="h-4 w-4" />
                Run Benchmark
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to compare</p>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {channelA && channelB && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Channel Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Channel A Summary */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={channelA.avatarUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"}
                  alt={channelA.title}
                  className="h-12 w-12 rounded-full border border-border object-cover"
                />
                <div>
                  <h3 className="font-semibold text-foreground text-base">{channelA.title}</h3>
                  <p className="text-xs text-muted-foreground">{channelA.customUrl || channelA.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Subscribers</p>
                  <p className="text-sm font-bold text-foreground">
                    {Number(channelA.subscriberCount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                  <p className="text-sm font-bold text-foreground">
                    {Number(channelA.viewCount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Videos</p>
                  <p className="text-sm font-bold text-foreground">
                    {Number(channelA.videoCount).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Channel B Summary */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={channelB.avatarUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"}
                  alt={channelB.title}
                  className="h-12 w-12 rounded-full border border-border object-cover"
                />
                <div>
                  <h3 className="font-semibold text-foreground text-base">{channelB.title}</h3>
                  <p className="text-xs text-muted-foreground">{channelB.customUrl || channelB.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Subscribers</p>
                  <p className="text-sm font-bold text-foreground">
                    {Number(channelB.subscriberCount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                  <p className="text-sm font-bold text-foreground">
                    {Number(channelB.viewCount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Videos</p>
                  <p className="text-sm font-bold text-foreground">
                    {Number(channelB.videoCount).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Similarity & Comparison Matrix */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Direct Peer Similarity Breakdown
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Formula: 0.30*(Topic) + 0.30*(SizeTier) + 0.20*(EngagementRatio) + 0.20*(Cadence)
                </p>
              </div>

              {similarity && (
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      similarity.similarityTier === "HIGH"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : similarity.similarityTier === "MEDIUM"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {similarity.similarityTier} SIMILARITY
                  </span>
                  <span className="text-xl font-black text-foreground">
                    {similarity.overallScore} / 100
                  </span>
                </div>
              )}
            </div>

            {/* Breakdown bars */}
            {similarity && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-lg border border-border bg-background space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Topic & Tag Overlap</p>
                  <p className="text-lg font-bold text-foreground">
                    {similarity.breakdown.topicOverlap}%
                  </p>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${similarity.breakdown.topicOverlap}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-background space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Subscriber Scale Match</p>
                  <p className="text-lg font-bold text-foreground">
                    {similarity.breakdown.sizeSimilarity}%
                  </p>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${similarity.breakdown.sizeSimilarity}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-background space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Views/Sub Ratio Match</p>
                  <p className="text-lg font-bold text-foreground">
                    {similarity.breakdown.engagementSimilarity}%
                  </p>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${similarity.breakdown.engagementSimilarity}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-background space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Publishing Cadence</p>
                  <p className="text-lg font-bold text-foreground">
                    {similarity.breakdown.cadenceSimilarity}%
                  </p>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${similarity.breakdown.cadenceSimilarity}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Direct Side-by-Side Metric Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Metric</th>
                    <th className="py-3 px-4">{channelA.title}</th>
                    <th className="py-3 px-4">{channelB.title}</th>
                    <th className="py-3 px-4">Ratio / Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 px-4 font-medium text-muted-foreground">
                      Subscribers
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {Number(channelA.subscriberCount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {Number(channelB.subscriberCount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-muted-foreground">
                      {channelB.subscriberCount > 0
                        ? `${(channelA.subscriberCount / channelB.subscriberCount).toFixed(2)}x`
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-muted-foreground">
                      Total Views
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {Number(channelA.viewCount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {Number(channelB.viewCount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-muted-foreground">
                      {channelB.viewCount > 0
                        ? `${(channelA.viewCount / channelB.viewCount).toFixed(2)}x`
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-muted-foreground">
                      Avg Views / Video
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {Number(channelA.avgViewsPerVideo || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {Number(channelB.avgViewsPerVideo || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-muted-foreground">
                      {(channelB.avgViewsPerVideo || 0) > 0
                        ? `${((channelA.avgViewsPerVideo || 0) / (channelB.avgViewsPerVideo || 1)).toFixed(2)}x`
                        : "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!channelA && !channelB && !loading && !error && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Scale className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold text-foreground">
            No Channels Selected for Comparison
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            Enter two channel names or channel IDs above to compare audience scale, video output, and discover their mathematical similarity.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Shell>
      <Suspense
        fallback={
          <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading comparison engine...
          </div>
        }
      >
        <CompareContent />
      </Suspense>
    </Shell>
  );
}
