"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { formatCompactNumber } from "@/lib/utils";
import { estimateRevenueRange } from "@/lib/algorithms/revenue";
import {
  Users,
  Eye,
  TrendingUp,
  DollarSign,
  Flame,
  Search,
  Sparkles,
  Youtube,
  ArrowRight,
  ShieldCheck,
  Compass,
  Radio,
  Bookmark,
  Calendar,
  AlertCircle,
  RefreshCw,
  Plus,
  Loader2,
  ExternalLink,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

interface ConnectedChannel {
  id: string;
  accountId: string;
  title: string;
  customUrl?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  avgViewsPerVideo?: number;
  medianViews?: number;
  lastSyncedAt?: string;
}

interface RecentVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  viewCount: number;
  publishedAt: string;
  durationFormatted: string;
  isShort: boolean;
  outlierAnalysis?: { multiplier: number; tier: string };
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<"7d" | "28d" | "90d" | "365d">("28d");
  const [connectedChannels, setConnectedChannels] = useState<ConnectedChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Quick connect form state
  const [quickHandle, setQuickHandle] = useState<string>("");
  const [isQuickConnecting, setIsQuickConnecting] = useState<boolean>(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);

  // Channel videos & outliers
  const [channelVideos, setChannelVideos] = useState<RecentVideo[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(false);

  // Syncing state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const fetchConnectedChannels = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/youtube/connected-channels");
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setConnectedChannels(json.data);
        if (json.data.length > 0 && !selectedChannelId) {
          setSelectedChannelId(json.data[0].id);
        }
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectedChannels();
  }, []);

  const activeChannel =
    connectedChannels.find((c) => c.id === selectedChannelId) ||
    connectedChannels[0] ||
    null;

  // Fetch recent videos & outliers for the active connected channel
  useEffect(() => {
    if (!activeChannel) {
      setChannelVideos([]);
      return;
    }

    const fetchVideos = async () => {
      setIsLoadingVideos(true);
      try {
        const res = await fetch(
          `/api/v1/channels/${encodeURIComponent(activeChannel.id)}/analytics`
        );
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setChannelVideos(json.data.recentVideos || []);
        }
      } catch {
        // Ignored
      } finally {
        setIsLoadingVideos(false);
      }
    };

    fetchVideos();
  }, [activeChannel?.id]);

  const handleQuickConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickHandle.trim()) return;

    setIsQuickConnecting(true);
    setQuickError(null);
    setQuickSuccess(null);

    try {
      const res = await fetch("/api/v1/youtube/connected-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelInput: quickHandle.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setQuickError(
          json.error?.message ||
            "Could not connect channel. Please verify the handle or URL."
        );
      } else {
        setQuickSuccess(`Channel "${json.data.title}" successfully connected!`);
        setQuickHandle("");
        await fetchConnectedChannels();
        setSelectedChannelId(json.data.id);
        setTimeout(() => setQuickSuccess(null), 4000);
      }
    } catch (err: any) {
      setQuickError(err?.message || "Network error connecting channel.");
    } finally {
      setIsQuickConnecting(false);
    }
  };

  const handleSyncActive = async () => {
    if (!activeChannel) return;
    setIsSyncing(true);
    try {
      const res = await fetch("/api/v1/youtube/connected-channels/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: activeChannel.id }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setConnectedChannels((prev) =>
          prev.map((c) => (c.id === activeChannel.id ? { ...c, ...json.data } : c))
        );
      }
    } catch {
      // Ignored
    } finally {
      setIsSyncing(false);
    }
  };

  const revenueEst = activeChannel
    ? estimateRevenueRange(activeChannel.viewCount, "default")
    : null;

  return (
    <Shell
      title="Creator Overview"
      subtitle="Comprehensive channel analytics, growth telemetry, and research alerts"
    >
      {/* Date Range Selector & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Timeframe:
          </span>
          <div className="flex rounded-lg bg-card border border-white/5 p-1 gap-1">
            {(["7d", "28d", "90d", "365d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  dateRange === range
                    ? "bg-primary text-white shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/research/search"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search YouTube</span>
          </Link>
          <Link
            href="/research/outliers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card hover:bg-white/5 border border-white/10 text-xs font-semibold text-foreground transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Find Outliers</span>
          </Link>
        </div>
      </div>

      {/* ACTIVE CONNECTED CHANNEL BANNER */}
      {activeChannel ? (
        <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg bg-gradient-to-r from-card via-card to-primary/5">
          <div className="flex items-center gap-4 min-w-0">
            {activeChannel.avatarUrl ? (
              <img
                src={activeChannel.avatarUrl}
                alt={activeChannel.title}
                className="w-14 h-14 rounded-full object-cover border-2 border-primary/40 shrink-0 bg-black/40 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                YT
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                  {activeChannel.title}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Connected
                </span>
                <AttributionBadge type="official" sourceText="YouTube Data API v3" />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{activeChannel.customUrl || activeChannel.id}</span>
                <span>•</span>
                <span>{activeChannel.videoCount} uploads</span>
                {activeChannel.lastSyncedAt && (
                  <>
                    <span>•</span>
                    <span>
                      Synced {new Date(activeChannel.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* If multiple connected channels, show dropdown selector */}
            {connectedChannels.length > 1 && (
              <select
                value={activeChannel.id}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-card border border-white/10 text-xs text-foreground focus:outline-none"
              >
                {connectedChannels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleSyncActive}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-foreground transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-primary" : "text-muted-foreground"}`}
              />
              <span>{isSyncing ? "Syncing..." : "Sync Channel"}</span>
            </button>

            <Link
              href={`/analytics/channels?id=${activeChannel.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-pulse-600 text-xs font-semibold text-white transition-all shadow-md"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Full Analytics</span>
            </Link>

            <Link
              href="/settings/youtube"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Manage</span>
            </Link>
          </div>
        </div>
      ) : (
        /* DISCONNECTED STATE & INLINE QUICK-CONNECT */
        <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-primary bg-gradient-to-r from-primary/10 via-card to-card space-y-4 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/15 text-primary">
                  <Youtube className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-foreground">
                  Connect Your YouTube Channel for Official Intelligence
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your channel to populate your dashboard with authentic subscriber metrics, lifetime view counts, recent uploads, and statistical median outliers.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground shrink-0">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> Live YouTube Data API v3
              </span>
            </div>
          </div>

          {quickSuccess && (
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{quickSuccess}</span>
            </div>
          )}

          {quickError && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{quickError}</span>
            </div>
          )}

          {/* Inline Quick Connect Form */}
          <form onSubmit={handleQuickConnect} className="flex flex-col sm:flex-row gap-3 pt-1">
            <input
              type="text"
              value={quickHandle}
              onChange={(e) => setQuickHandle(e.target.value)}
              placeholder="Paste YouTube handle or URL (e.g. '@LegendMangaReels')..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-white/10 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary shadow-sm font-mono"
            />
            <button
              type="submit"
              disabled={isQuickConnecting || !quickHandle.trim()}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
            >
              {isQuickConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isQuickConnecting ? "Connecting..." : "Connect Channel"}</span>
            </button>
            <Link
              href="/settings/youtube"
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
            >
              <span>Settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </form>
        </div>
      )}

      {/* Core Metrics Grid - 100% REAL DATA FROM CONNECTED CHANNEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Subscribers"
          value={
            activeChannel
              ? formatCompactNumber(activeChannel.subscriberCount)
              : "Not connected"
          }
          subValue={
            activeChannel
              ? "Official count via YouTube Data API v3"
              : "Connect channel to display"
          }
          dataType="official"
          sourceText="YouTube Data API v3"
          icon={Users}
        />
        <MetricCard
          label="Total Channel Views"
          value={
            activeChannel
              ? formatCompactNumber(activeChannel.viewCount)
              : "Not connected"
          }
          subValue={
            activeChannel
              ? "Official lifetime views count"
              : "Connect channel to display"
          }
          dataType="official"
          sourceText="YouTube Data API v3"
          icon={Eye}
        />
        <MetricCard
          label="Est. Monthly Revenue"
          value={
            activeChannel && revenueEst
              ? `$${revenueEst.monthlyRevenueMin} – $${revenueEst.monthlyRevenueMax}`
              : "Unavailable"
          }
          subValue="Calculated from public views & RPM model"
          dataType="estimated"
          sourceText="Benchmark RPM range ($2.0–$5.5)"
          icon={DollarSign}
        />
        <MetricCard
          label="Avg Views / Upload"
          value={
            activeChannel
              ? formatCompactNumber(
                  activeChannel.avgViewsPerVideo ||
                    (activeChannel.videoCount > 0
                      ? Math.round(activeChannel.viewCount / activeChannel.videoCount)
                      : 0)
                )
              : "Not calculated"
          }
          subValue={
            activeChannel?.medianViews
              ? `Channel median: ${formatCompactNumber(activeChannel.medianViews)} views`
              : "Benchmark across channel uploads"
          }
          dataType="calculated"
          sourceText="Calculated from channel uploads"
          icon={TrendingUp}
        />
      </div>

      {/* RECENT UPLOADS & OUTLIER SIGNALS (WHEN CONNECTED) */}
      {activeChannel && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                Recent Uploads & Outlier Performance
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evaluates your recent videos against your channel median baseline (
                {formatCompactNumber(activeChannel.medianViews || 0)} views) to surface breakout performers.
              </p>
            </div>
            <Link
              href={`/research/outliers?channelId=${activeChannel.id}`}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>Explore Outlier Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoadingVideos ? (
            <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading recent upload telemetry...</span>
            </div>
          ) : channelVideos.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-white/10 text-center text-xs text-muted-foreground">
              No recent uploads synced yet. Click &ldquo;Sync Channel&rdquo; above to load your latest video metrics.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {channelVideos.slice(0, 4).map((v) => {
                const multiplier = v.outlierAnalysis?.multiplier || 1.0;
                const isOutlier = multiplier >= 2.0;

                return (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-xl bg-card border border-white/10 space-y-2.5 flex flex-col justify-between hover:border-white/20 transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40 border border-white/10">
                        <img
                          src={v.thumbnailUrl}
                          alt={v.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                          {v.durationFormatted}
                        </span>
                        {isOutlier && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold text-[10px] flex items-center gap-0.5 shadow-md">
                            <Flame className="w-3 h-3" />
                            <span>{multiplier}x Outlier</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
                        {v.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-white/5">
                      <span className="font-bold text-foreground">
                        {formatCompactNumber(v.viewCount)} views
                      </span>
                      <Link
                        href={`/analytics/videos?id=${v.id}`}
                        className="text-primary hover:underline font-semibold flex items-center gap-0.5"
                      >
                        <span>Deep Dive</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Discovery & Feature Launchpads */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Active Research Engines
          </h2>
          <span className="text-xs text-muted-foreground">
            Powered by live YouTube Data API
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/research/outliers"
            className="glass-panel p-5 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Statistical Outlier Detection
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Filter videos performing at 2x, 5x, 10x, or 20x+ above channel baseline using verified historical median formulas.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-primary gap-1">
              <span>Inspect Outlier Engine</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/research/niches"
            className="glass-panel p-5 rounded-xl border border-white/5 hover:border-primary/30 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Niche & Keyword Intelligence
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Evaluate competition density, average search velocity, and monetization RPM potential for emerging niches.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-primary gap-1">
              <span>Explore Niches</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/ai"
            className="glass-panel p-5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Grounded AI Creator Assistant
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate content pillars, analyze title hooks, and find competitive gaps grounded strictly on retrieved records.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-primary gap-1">
              <span>Open AI Strategist</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </Shell>
  );
}
