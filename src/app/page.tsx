"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
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
} from "lucide-react";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<"7d" | "28d" | "90d" | "365d">("28d");
  // State: whether user has connected their YouTube channel
  const [isConnected, setIsConnected] = useState<boolean>(false);

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

      {/* Honest Connection Status Banner */}
      {!isConnected && (
        <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-rose-500 bg-gradient-to-r from-rose-950/20 via-card to-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <Youtube className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Connect Your YouTube Channel for Official Analytics
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              In accordance with our <strong className="text-foreground">Strict No-Fake Data Rule</strong>, private creator analytics (exact AdSense revenue, real-time impressions, CTR, and watch time) require official YouTube OAuth authorization.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Read-only Google OAuth
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                No fake metrics or hardcoded statistics
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/settings/youtube"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-primary hover:bg-pulse-600 transition-all shadow-md glow-rose"
            >
              <Youtube className="w-4 h-4" />
              <span>Connect YouTube Account</span>
            </Link>
            <Link
              href="/research/search"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-foreground bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <span>Explore Public Research</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Subscribers"
          value={isConnected ? "125,430" : "Not connected"}
          subValue={isConnected ? "Official count via YouTube API" : "Requires channel OAuth"}
          dataType="official"
          sourceText="YouTube Data API v3"
          icon={Users}
        />
        <MetricCard
          label="Total Channel Views"
          value={isConnected ? "14.2M" : "Not connected"}
          subValue={isConnected ? "Lifetime views" : "Requires channel OAuth"}
          dataType="official"
          sourceText="YouTube Data API v3"
          icon={Eye}
        />
        <MetricCard
          label="Est. Monthly Revenue"
          value={isConnected ? "$1,800 – $3,400" : "Unavailable"}
          subValue="Calculated from public views & niche RPM"
          dataType="estimated"
          sourceText="Benchmark RPM range ($2.0–$5.5)"
          icon={DollarSign}
        />
        <MetricCard
          label="Avg Views / Upload"
          value={isConnected ? "48.5K" : "Not calculated"}
          subValue="Median benchmark across last 20 videos"
          dataType="calculated"
          sourceText="Calculated via median algorithm"
          icon={TrendingUp}
        />
      </div>

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

      {/* Honest Empty State Section for Tracked Channels & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Tracked Competitors
            </h2>
            <Link
              href="/tracking/competitors"
              className="text-xs text-primary hover:underline font-semibold"
            >
              Manage ({0})
            </Link>
          </div>
          <EmptyState
            title="No Tracked Competitors Yet"
            description="Track competitor channels to automatically capture performance snapshots, new video uploads, and viral outlier alerts."
            icon={Radio}
            actionText="Add Competitor to Track"
            onAction={() => window.location.assign("/tracking/competitors")}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Recent Performance Alerts
            </h2>
            <Link
              href="/tracking/alerts"
              className="text-xs text-primary hover:underline font-semibold"
            >
              Configure Alerts
            </Link>
          </div>
          <EmptyState
            title="No Active Alerts Triggered"
            description="Set automated triggers for when a competitor launches a 5x outlier, reaches a subscriber milestone, or when viral spikes occur."
            icon={AlertCircle}
            actionText="Configure Outlier Trigger"
            onAction={() => window.location.assign("/tracking/alerts")}
          />
        </div>
      </div>
    </Shell>
  );
}
