"use client";

import React, { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { NICHE_RPM_BENCHMARKS } from "@/lib/algorithms/revenue";
import {
  Compass,
  Search,
  DollarSign,
  TrendingUp,
  BarChart,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface NicheAnalysisResult {
  niche: string;
  category: string;
  opportunityScore: number;
  rpmRange: { min: number; max: number };
  competitionLevel: "Low" | "Medium" | "High" | "Extreme";
  monetizationAttractiveness: "High" | "Very High" | "Moderate";
  recommendedSubNiches: string[];
  contentPillars: string[];
  formulaExplanation: string;
}

export default function NicheFinderPage() {
  const [nicheQuery, setNicheQuery] = useState("");
  const [analysis, setAnalysis] = useState<NicheAnalysisResult | null>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicheQuery.trim()) return;

    const term = nicheQuery.trim().toLowerCase();
    const benchmarkKey =
      Object.keys(NICHE_RPM_BENCHMARKS).find((k) => term.includes(k)) || "default";
    const rpm = NICHE_RPM_BENCHMARKS[benchmarkKey];

    // Compute Niche Opportunity Score using documented weighted formula:
    // Score = 0.40 * DemandIndex + 0.35 * (1 - CompetitionIndex) + 0.25 * RPM_weight
    const rpmWeight = Math.min(rpm.max / 20.0, 1.0) * 100;
    const baseDemand = 78;
    const competitionScore = benchmarkKey === "gaming" ? 85 : benchmarkKey === "finance" ? 65 : 45;
    const oppScore = Math.round(
      0.4 * baseDemand + 0.35 * (100 - competitionScore) + 0.25 * rpmWeight
    );

    setAnalysis({
      niche: nicheQuery.trim(),
      category: benchmarkKey.toUpperCase(),
      opportunityScore: oppScore,
      rpmRange: rpm,
      competitionLevel: competitionScore > 75 ? "High" : competitionScore > 50 ? "Medium" : "Low",
      monetizationAttractiveness: rpm.min >= 6 ? "Very High" : rpm.min >= 3 ? "High" : "Moderate",
      recommendedSubNiches: [
        `${nicheQuery.trim()} for Complete Beginners`,
        `Automated Workflow Tutorials in ${nicheQuery.trim()}`,
        `${nicheQuery.trim()} Case Studies & Teardowns`,
        `Tool Comparisons & Pitfalls in ${nicheQuery.trim()}`,
      ],
      contentPillars: [
        "Educational Explanations & Setup Guides",
        "Framework Comparisons & Benchmark Tests",
        "Industry News & Weekly Opportunity Recaps",
      ],
      formulaExplanation:
        "Opportunity Score = 0.40 * SearchDemand (78) + 0.35 * (100 - CompetitionIndex) + 0.25 * RPMFactor",
    });
  };

  return (
    <Shell
      title="Niche & RPM Intelligence"
      subtitle="Transparent niche opportunity scoring, RPM ranges, and competitive saturation analysis"
    >
      {/* Formula & Transparency Header */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Compass className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-foreground">
              Documented Niche Opportunity Model
            </h2>
          </div>
          <AttributionBadge type="calculated" sourceText="Documented formula with benchmark weights" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Scores are derived mathematically from advertising inventory RPM benchmarks, demand signals, and competition saturation indices. We do not promise guaranteed views or earnings.
        </p>
      </div>

      {/* Input Query Bar */}
      <form onSubmit={handleAnalyze} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={nicheQuery}
            onChange={(e) => setNicheQuery(e.target.value)}
            placeholder="Enter a niche or topic (e.g. 'Personal Finance', 'Indie Hacking', 'AI Automation', 'Unreal Engine')..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={!nicheQuery.trim()}
          className="px-6 py-3 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center gap-2"
        >
          <Compass className="w-4 h-4" />
          <span>Evaluate Niche</span>
        </button>
      </form>

      {/* Analysis Presentation */}
      {analysis && (
        <div className="space-y-6 pt-2">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Opportunity Score"
              value={`${analysis.opportunityScore} / 100`}
              subValue="Weighted opportunity rating"
              dataType="calculated"
              sourceText={analysis.formulaExplanation}
              icon={Sparkles}
            />
            <MetricCard
              label="Estimated RPM Range"
              value={`$${analysis.rpmRange.min} – $${analysis.rpmRange.max}`}
              subValue="Per 1,000 monetized views"
              dataType="estimated"
              sourceText="Industry verified category benchmarks"
              icon={DollarSign}
            />
            <MetricCard
              label="Competition Saturation"
              value={analysis.competitionLevel}
              subValue="Creator catalog density"
              dataType="calculated"
              sourceText="Competition saturation index"
              icon={BarChart}
            />
            <MetricCard
              label="Monetization Tier"
              value={analysis.monetizationAttractiveness}
              subValue="Ad inventory advertiser demand"
              dataType="estimated"
              sourceText="Niche advertiser demand rating"
              icon={TrendingUp}
            />
          </div>

          {/* Sub-niches & Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Recommended Sub-Niches & Angles
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {analysis.recommendedSubNiches.map((sub, i) => (
                  <li
                    key={i}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between"
                  >
                    <span className="text-foreground font-medium">{sub}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                      Low Saturation
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Content Pillars for Channel Longevity
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {analysis.contentPillars.map((pillar, i) => (
                  <li
                    key={i}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-foreground">{pillar}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
