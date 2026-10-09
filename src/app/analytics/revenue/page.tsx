"use client";

import React, { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import {
  NICHE_RPM_BENCHMARKS,
  estimateRevenueRange,
} from "@/lib/algorithms/revenue";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Calculator,
  Lock,
  ArrowRight,
  Info,
} from "lucide-react";
import Link from "next/link";

export default function RevenueAnalyticsPage() {
  const [monthlyViews, setMonthlyViews] = useState<number>(250000);
  const [selectedNiche, setSelectedNiche] = useState<string>("tech");

  const revenueEst = estimateRevenueRange(monthlyViews, selectedNiche);

  // Annual range
  const annualMin = revenueEst.monthlyRevenueMin * 12;
  const annualMax = revenueEst.monthlyRevenueMax * 12;

  // Daily range
  const dailyMin = Math.round(revenueEst.monthlyRevenueMin / 30);
  const dailyMax = Math.round(revenueEst.monthlyRevenueMax / 30);

  return (
    <Shell
      title="Revenue & RPM Modeling Engine"
      subtitle="Transparent monetization forecasting, ad inventory RPM brackets, and AdSense models"
    >
      {/* Strict Anti-Fake Data Warning Banner (Rule 18) */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-gradient-to-r from-card via-card to-amber-950/15 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-foreground">
              Official vs Estimated Revenue Rules
            </h2>
          </div>
          <AttributionBadge type="estimated" sourceText="Probabilistic advertiser inventory range" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          In strict compliance with Rule 18 in <code className="text-foreground">AGENTS.md</code>, we never fabricate exact cents (e.g. $1,421.39) for public channels. Public analytics display transparent <strong className="text-foreground">bracket ranges ($Min – $Max)</strong>. Exact AdSense payouts require an authorized YouTube Analytics API connection.
        </p>
      </div>

      {/* Interactive Modeling Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Channel Revenue Simulation Inputs
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Monthly Views Slider & Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-foreground">
                Estimated Monthly Views:
              </label>
              <span className="font-bold text-primary text-sm">
                {formatCompactNumber(monthlyViews)} views / mo
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={5000000}
              step={10000}
              value={monthlyViews}
              onChange={(e) => setMonthlyViews(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
              <span>1K views</span>
              <span>1M views</span>
              <span>5M views</span>
            </div>
          </div>

          {/* Niche Selector */}
          <div className="space-y-2">
            <label className="font-semibold text-foreground">
              Content Category & Advertiser Niche:
            </label>
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-card border border-white/10 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="finance">Finance & Investing (High CPM: $8.0 – $22.0)</option>
              <option value="tech">Technology, AI & Software ($4.5 – $12.0)</option>
              <option value="business">Business, Entrepreneurship & Marketing ($6.0 – $16.0)</option>
              <option value="education">Education & Tutorial Content ($3.5 – $8.5)</option>
              <option value="lifestyle">Lifestyle, Vlogging & Fitness ($2.0 – $6.0)</option>
              <option value="gaming">Gaming & Live Streaming ($1.5 – $4.0)</option>
              <option value="entertainment">Entertainment & Commentary ($1.8 – $4.5)</option>
              <option value="default">General / Broad Audience ($2.0 – $5.5)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calculated Revenue Brackets Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Estimated Revenue Projections (Bracket Model)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Estimated Daily Revenue"
            value={`$${dailyMin} – $${dailyMax}`}
            subValue="Average day based on 30-day view pacing"
            dataType="estimated"
            sourceText="dailyViews * (RPM / 1000)"
            icon={DollarSign}
          />
          <MetricCard
            label="Estimated Monthly Revenue"
            value={`$${revenueEst.monthlyRevenueMin} – $${revenueEst.monthlyRevenueMax}`}
            subValue={`Based on ${formatCompactNumber(monthlyViews)} monthly views`}
            dataType="estimated"
            sourceText="monthlyViews * (RPM / 1000)"
            icon={TrendingUp}
          />
          <MetricCard
            label="Estimated Annual Run Rate"
            value={`$${formatCompactNumber(annualMin)} – $${formatCompactNumber(annualMax)}`}
            subValue="12-month baseline annualized"
            dataType="estimated"
            sourceText="monthlyRevenue * 12"
            icon={DollarSign}
          />
          <MetricCard
            label="Niche RPM Benchmark"
            value={`$${revenueEst.rpmMin} – $${revenueEst.rpmMax}`}
            subValue="Revenue per 1,000 monetized views"
            dataType="calculated"
            sourceText="Industry benchmark dataset"
            icon={Calculator}
          />
        </div>
      </div>

      {/* Connect Channel Callout for Real AdSense Data */}
      <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-card to-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400" />
            <h4 className="text-sm font-bold text-foreground">
              Want Exact Real-Time AdSense Payouts?
            </h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Connect your own YouTube channel via OAuth 2.0 to stream real daily AdSense revenue, playback-based CPM, and geographic RPM from YouTube Analytics.
          </p>
        </div>

        <Link
          href="/settings/youtube"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-pulse-600 text-white font-semibold text-xs transition-all shadow-md shrink-0"
        >
          <span>Connect Channel</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Shell>
  );
}
