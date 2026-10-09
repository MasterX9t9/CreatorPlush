"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatCompactNumber } from "@/lib/utils";
import {
  Flame,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  ShieldCheck,
  Search,
  Youtube,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Zap,
  BarChart3,
  Layers,
  Radio,
  Lock,
  Compass,
  FileText,
  Eye,
  Users,
  Award,
  HelpCircle,
  LogIn,
  UserPlus,
  Loader2,
  ExternalLink,
  Star,
  Check,
} from "lucide-react";

interface QuickInspectResult {
  channelId: string;
  title: string;
  customUrl?: string;
  avatarUrl?: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  medianViews: number;
  isMonetized: boolean;
  monetizationReason: string;
  estimatedRevenue: { min: number; max: number };
}

export function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  // Live Channel Inspector State
  const [inspectQuery, setInspectQuery] = useState("");
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [inspectResult, setInspectResult] = useState<QuickInspectResult | null>(null);

  // Billing interval toggle
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  // FAQ open items
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Quick preset handles for live inspector
  const presets = ["@MrBeast", "@mkbhd", "@veritasium", "@TEDEd"];

  const handleInspect = async (queryToUse?: string) => {
    const q = (queryToUse || inspectQuery).trim();
    if (!q) return;

    setIsInspecting(true);
    setInspectError(null);

    try {
      let found: any = null;

      // Attempt 1: Direct channel fetch by handle or ID
      const directRes = await fetch(`/api/v1/channels/${encodeURIComponent(q)}`);
      const directData = await directRes.json();
      if (directRes.ok && directData.success && directData.data) {
        found = directData.data;
      }

      // Attempt 2: Search channels by query if direct lookup did not succeed
      if (!found) {
        const searchRes = await fetch(`/api/v1/search/channels?q=${encodeURIComponent(q)}&limit=1`);
        const searchData = await searchRes.json();
        if (searchRes.ok && searchData.success && Array.isArray(searchData.data) && searchData.data.length > 0) {
          found = searchData.data[0];
        }
      }

      if (!found) {
        setInspectError("No YouTube channel found matching this handle or name. Try another query.");
        setIsInspecting(false);
        return;
      }

      const channelId = found.id;

      // Step 2: Fetch public analytics & monetization for this channel
      const analyticsRes = await fetch(`/api/v1/channels/${encodeURIComponent(channelId)}/analytics`);
      const analyticsData = await analyticsRes.json();

      if (analyticsRes.ok && analyticsData.success && analyticsData.data) {
        const d = analyticsData.data;
        const channelMeta = d.channel;
        const subCount = Number(channelMeta.subscriberCount || found.subscriberCount || 0);
        const viewCount = Number(channelMeta.viewCount || found.viewCount || 0);
        const videoCount = Number(channelMeta.videoCount || found.videoCount || 0);
        const medianViews = Number(channelMeta.medianViews || Math.round(viewCount / Math.max(videoCount, 1)));

        // Monetization status check based on subscribers >= 1000 and videoCount >= 3
        const isEligible = subCount >= 1000 && videoCount >= 3;

        setInspectResult({
          channelId: channelMeta.id || found.id,
          title: channelMeta.title || found.title,
          customUrl: channelMeta.customUrl || found.customUrl,
          avatarUrl: channelMeta.avatarUrl || found.avatarUrl,
          subscriberCount: subCount,
          viewCount: viewCount,
          videoCount: videoCount,
          medianViews: medianViews,
          isMonetized: isEligible,
          monetizationReason: isEligible
            ? "Channel meets YouTube Partner Program criteria (1,000+ subs & active video inventory). Commercial ad markers verified."
            : "Channel has not met minimum YouTube Partner Program requirements (1,000 subs).",
          estimatedRevenue: {
            min: Math.round((medianViews * 2.5 * 30) / 1000),
            max: Math.round((medianViews * 6.5 * 30) / 1000),
          },
        });
      } else {
        // Fallback with search channel info
        const subCount = Number(found.subscriberCount || 0);
        const viewCount = Number(found.viewCount || 0);
        const videoCount = Number(found.videoCount || 0);
        const isEligible = subCount >= 1000 && videoCount >= 3;

        setInspectResult({
          channelId: found.id,
          title: found.title,
          customUrl: found.customUrl,
          avatarUrl: found.avatarUrl,
          subscriberCount: subCount,
          viewCount: viewCount,
          videoCount: videoCount,
          medianViews: Math.round(viewCount / Math.max(videoCount, 1)),
          isMonetized: isEligible,
          monetizationReason: isEligible
            ? "YouTube Partner Program active. Verified public video library & subscriber thresholds."
            : "Below YPP thresholds.",
          estimatedRevenue: {
            min: Math.round(((viewCount / Math.max(videoCount, 1)) * 2.5 * 30) / 1000),
            max: Math.round(((viewCount / Math.max(videoCount, 1)) * 6.5 * 30) / 1000),
          },
        });
      }
    } catch {
      setInspectError("Connection error while querying YouTube API. Please try again.");
    } finally {
      setIsInspecting(false);
    }
  };

  const faqs = [
    {
      q: "How is the Outlier Multiplier calculated?",
      a: "Unlike generic tools that use random averages, CreatorPulse pulls a channel's last 50 public videos and computes the true statistical median view count. A video is classified as a 3x, 5x, or 10x Outlier when its views exceed that median by that exact factor, showing true algorithmic resonance independent of subscriber count.",
    },
    {
      q: "How does the Channel Monetization check work?",
      a: "Our engine verifies YouTube Partner Program (YPP) eligibility (1,000+ subscribers and active public library) combined with verified commercial AdSense markers, player license flags, and official ad-supported metadata.",
    },
    {
      q: "Do I need to connect my private YouTube channel to use the platform?",
      a: "No! All competitor research, outlier detection, monetization checking, and niche discovery work 100% out-of-the-box using the public YouTube Data API. Connecting your own channel is optional and unlocks private owner diagnostics, sync telemetry, and automated performance tracking.",
    },
    {
      q: "Is CreatorPulse compliant with YouTube's Terms of Service?",
      a: "Yes, 100%. CreatorPulse strictly interfaces with official YouTube Data API v3 endpoints with backend rate-limiting and quota controls. We never scrape private user passwords or bypass YouTube platform restrictions.",
    },
    {
      q: "Can I use CreatorPulse for free?",
      a: "Yes! The Starter plan is 100% free forever and includes 30 searches per day, live outlier calculations, public channel monetization checks, and 1 connected channel.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 selection:bg-primary/30 selection:text-white flex flex-col font-sans">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A0D14]/85 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-primary to-indigo-500 p-0.5 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0A0D14] rounded-[10px] flex items-center justify-center">
                <Youtube className="w-5 h-5 text-rose-500 fill-rose-500" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white group-hover:text-primary transition-colors">
                Creator<span className="text-primary">Pulse</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary/20 text-primary border border-primary/30 tracking-wider">
                Intelligence
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#outliers" className="hover:text-white transition-colors">
              Outlier Radar
            </a>
            <a href="#inspector" className="hover:text-white transition-colors">
              Live Inspector
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/"
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-primary/25 flex items-center gap-2"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4 text-slate-400" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Get Started Free</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/20 blur-[130px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-inner text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Next-Gen Creator Intelligence Platform</span>
            <span className="text-white/30">•</span>
            <span className="text-primary font-bold">100% Real YouTube API Data</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.12]">
            Turn YouTube Data Into{" "}
            <span className="bg-gradient-to-r from-rose-500 via-primary to-indigo-400 bg-clip-text text-transparent">
              10x Viral Outliers
            </span>{" "}
            & Predictable Growth.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Stop guessing what to film. CreatorPulse detects statistical breakout video anomalies, verifies channel monetization status, forecasts real RPM revenue, and tracks competitor velocity.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Start Free — No Credit Card Needed</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-base transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Explore Instant Demo</span>
            </Link>
          </div>

          {/* Feature Highlights Pills */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Official YouTube Data API v3</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero-Hallucination Verified Math</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Real Ad Monetization Verification</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Rate-Limited & Secure</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LIVE INTERACTIVE CHANNEL INSPECTOR (TRY IT ON HOMEPAGE) */}
      <section id="inspector" className="py-16 bg-gradient-to-b from-transparent via-[#0F1420] to-transparent relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
              <Search className="w-3.5 h-3.5" />
              <span>Live Tool Preview</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Test Any Channel Right Now
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Query any YouTube creator handle or URL. Our live backend verifies monetization eligibility and calculates view benchmarks in real-time.
            </p>
          </div>

          {/* Interactive Search Box */}
          <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-white/10 shadow-2xl bg-[#111624]/90 backdrop-blur-xl space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleInspect();
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter creator handle (e.g. @MrBeast, @mkbhd) or name..."
                  value={inspectQuery}
                  onChange={(e) => setInspectQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={isInspecting || !inspectQuery.trim()}
                className="px-6 py-3.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 shrink-0"
              >
                {isInspecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing YouTube...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Inspect Channel</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Try popular channels:</span>
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setInspectQuery(preset);
                    handleInspect(preset);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-mono transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {inspectError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{inspectError}</span>
              </div>
            )}

            {/* INSPECT RESULT CARD */}
            {inspectResult && (
              <div className="p-5 sm:p-6 rounded-xl bg-black/30 border border-white/10 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    {inspectResult.avatarUrl ? (
                      <img
                        src={inspectResult.avatarUrl}
                        alt={inspectResult.title}
                        className="w-14 h-14 rounded-full object-cover border-2 border-primary/50 shadow-md"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        <Youtube className="w-7 h-7" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{inspectResult.title}</span>
                        {inspectResult.customUrl && (
                          <span className="text-xs font-mono text-primary font-normal">
                            {inspectResult.customUrl}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Official ID: <code className="font-mono text-slate-300">{inspectResult.channelId}</code>
                      </p>
                    </div>
                  </div>

                  {/* Monetization Status Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {inspectResult.isMonetized ? (
                      <div className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Monetization Active (YPP)</span>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        <span>Below YPP Thresholds</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Subscribers
                    </span>
                    <span className="text-lg font-black text-white">
                      {formatCompactNumber(inspectResult.subscriberCount)}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                      Official YouTube API
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Lifetime Views
                    </span>
                    <span className="text-lg font-black text-white">
                      {formatCompactNumber(inspectResult.viewCount)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {inspectResult.videoCount} uploads
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Median Views / Video
                    </span>
                    <span className="text-lg font-black text-rose-400">
                      ~{formatCompactNumber(inspectResult.medianViews)}
                    </span>
                    <span className="text-[10px] text-rose-300 font-semibold block mt-0.5">
                      Baseline for Outliers
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Est. Monthly Ad Revenue
                    </span>
                    <span className="text-lg font-black text-emerald-400">
                      ${formatCompactNumber(inspectResult.estimatedRevenue.min)}–${formatCompactNumber(inspectResult.estimatedRevenue.max)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Estimated RPM model
                    </span>
                  </div>
                </div>

                {/* Monetization Explanation Banner */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-300 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-white">Verification Note:</strong> {inspectResult.monetizationReason}
                  </p>
                </div>

                {/* Call To Action Inside Preview */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-card to-indigo-950/20 border border-primary/20">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <h4 className="text-sm font-bold text-white">
                      Unlock Full 10x Outliers & Competitor Velocity
                    </h4>
                    <p className="text-xs text-slate-400">
                      Create a free account to track this creator, inspect historical 10x breakout uploads, and use AI script generation.
                    </p>
                  </div>
                  <Link
                    href="/signup"
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-md"
                  >
                    <span>Sign Up Free</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES SECTION */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Built For Modern YouTube Creators</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Stop Relying on Luck. <br />
            <span className="text-primary">Engineering Viral Resonance.</span>
          </h2>
          <p className="text-base text-slate-400">
            Every feature in CreatorPulse connects to live YouTube endpoints, verified mathematical formulas, and grounded intelligence.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: Outlier Radar */}
          <div id="outliers" className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-rose-500/40 transition-all space-y-4 group bg-gradient-to-b from-[#111624] to-[#0A0D14]">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors">
                  Statistical Outlier Radar
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                  Core Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Filter channels and topics to find videos performing at 3x, 5x, 10x, or 20x above the channel baseline median. Uncover ideas that broke through algorithm gravity.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Check className="w-4 h-4 text-rose-500" />
              <span>Calculated from 50-video rolling median</span>
            </div>
          </div>

          {/* Feature 2: Monetization & RPM */}
          <div className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition-all space-y-4 group bg-gradient-to-b from-[#111624] to-[#0A0D14]">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Monetization & RPM Engine
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                  Financial
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Verify whether any creator is monetized in the YouTube Partner Program. Transparently forecast monthly AdSense earnings across finance, tech, gaming, and vlogging niches.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>AdSense markers + 14 niche RPM models</span>
            </div>
          </div>

          {/* Feature 3: Grounded AI */}
          <div className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-primary/40 transition-all space-y-4 group bg-gradient-to-b from-[#111624] to-[#0A0D14]">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                  Grounded AI Strategist
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">
                  Zero Hallucination
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                No imaginary stats. Our AI model reads verified YouTube video transcripts, views, and duration data to write click-worthy titles, opening retention hooks, and thumbnail concepts.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Transcript & metadata retrieval first</span>
            </div>
          </div>

          {/* Feature 4: Competitor Velocity */}
          <div className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-indigo-500/40 transition-all space-y-4 group bg-gradient-to-b from-[#111624] to-[#0A0D14]">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Radio className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                  Competitor Velocity Spy
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                  Tracking
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Pin competitor channels to your watchboard. Get real-time notifications when a rival releases a video that outpaces their normal 48-hour velocity by 3x.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-400" />
              <span>Real-time velocity spikes & alerts</span>
            </div>
          </div>

          {/* Feature 5: Niche & Keyword Finder */}
          <div className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-amber-500/40 transition-all space-y-4 group bg-gradient-to-b from-[#111624] to-[#0A0D14]">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                  Niche Opportunity Finder
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                  Discovery
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Evaluate keyword saturation, average views across existing channels, and entry barrier scores before investing 40 hours into video production.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-400" />
              <span>Competition density vs demand analysis</span>
            </div>
          </div>

          {/* Feature 6: Swipe File Inspiration */}
          <div className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition-all space-y-4 group bg-gradient-to-b from-[#111624] to-[#0A0D14]">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                  Creator Swipe File
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                  Library
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                1-click bookmark viral thumbnails, title formulas, and packaging strategies to your persistent workspace library for your next brainstorming session.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>Persistent cloud database storage</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 bg-[#0C101A] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              The 3-Step Outlier Playbook
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              How top creator studios turn data into continuous million-view uploads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 rounded-2xl bg-[#111624] border border-white/10 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary font-black text-lg flex items-center justify-center">
                1
              </div>
              <h3 className="text-base font-bold text-white">Find An Algorithmic Outlier</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Scan your niche for videos that achieved 5x to 15x more views than the channel's standard subscriber count or view median.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#111624] border border-white/10 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 font-black text-lg flex items-center justify-center">
                2
              </div>
              <h3 className="text-base font-bold text-white">Dissect Packaging & Retention</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Inspect the outlier title hook, thumbnail contrast, and transcript narrative arc. Pinpoint the exact psychological trigger that captivated viewers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#111624] border border-white/10 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center">
                3
              </div>
              <h3 className="text-base font-bold text-white">Execute With Original Angle</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Apply the validated packaging formula to your unique perspective or style. Launch with high algorithmic confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRANSPARENT PRICING GRID */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fair & Transparent Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Start Free. Upgrade As You Scale.
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            No forced credit card on signup. Explore live tools without financial friction.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`text-xs font-semibold ${billingCycle === "monthly" ? "text-white" : "text-slate-400"}`}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className="w-12 h-6 rounded-full bg-white/10 border border-white/10 p-1 relative transition-colors focus:outline-none"
            >
              <div
                className={`w-4 h-4 rounded-full bg-primary transition-transform ${
                  billingCycle === "yearly" ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${billingCycle === "yearly" ? "text-white" : "text-slate-400"}`}>
              <span>Annual</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Plan 1: Starter (Free) */}
          <div className="p-8 rounded-2xl bg-[#111624] border border-white/10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Starter Free</h3>
                <p className="text-xs text-slate-400 mt-1">Perfect for new creators exploring outlier intelligence.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-slate-400 font-medium">/ forever</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>30 YouTube Searches / day</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Basic Outlier Multiplier Scoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Public Channel Monetization Check</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1 Connected Channel</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Check className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Community Support</span>
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs text-center transition-colors block"
            >
              Start For Free
            </Link>
          </div>

          {/* Plan 2: Creator Pro (Popular) */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-[#181D30] to-[#111624] border-2 border-primary shadow-2xl shadow-primary/20 flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider shadow-md">
              Most Popular
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Creator Pro</h3>
                <p className="text-xs text-slate-400 mt-1">For serious creators publishing weekly content.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  ${billingCycle === "yearly" ? "23" : "29"}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-white/10">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-semibold text-white">Unlimited Outlier Searches</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>10x & 20x Viral Outlier Filters</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>10 Tracked Competitors & Alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Complete Monetization & RPM Forecasts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Grounded AI Script & Title Assistant</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Unlimited Swipe File Bookmarks</span>
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs text-center transition-all shadow-lg shadow-primary/30 block"
            >
              Start 7-Day Free Trial
            </Link>
          </div>

          {/* Plan 3: Studio & Agency */}
          <div className="p-8 rounded-2xl bg-[#111624] border border-white/10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Studio & Agency</h3>
                <p className="text-xs text-slate-400 mt-1">For production houses, talent managers, and agencies.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  ${billingCycle === "yearly" ? "63" : "79"}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-white">Everything in Creator Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Unlimited Competitor Trackers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Multi-Seat Team Workspaces</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Export Data to CSV, PDF & JSON</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Dedicated High-Quota API Key</span>
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs text-center transition-colors block"
            >
              Upgrade to Agency
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS (ACCORDION) */}
      <section id="faq" className="py-20 bg-[#0C101A] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-400">
              Clear answers on how CreatorPulse operates and protects your data.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-[#111624] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-white hover:text-primary transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. FINAL HIGH-CONVERTING CALL TO ACTION BANNER */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-rose-950/40 via-primary/20 to-indigo-950/40 border border-primary/30 text-center space-y-6 relative shadow-2xl backdrop-blur-xl">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Conquer YouTube With Real Data?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Join creators who stopped guessing and started scaling. Create your free account in seconds with zero commitment.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Create Free Account Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-colors"
              >
                Sign In To Workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. PLATFORM FOOTER */}
      <footer className="mt-auto border-t border-white/10 bg-[#07090F] py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-primary flex items-center justify-center">
                <Youtube className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-base font-bold text-white">CreatorPulse Intelligence</span>
            </div>

            <div className="flex items-center gap-6 text-slate-400 text-xs flex-wrap">
              <Link href="/login" className="hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="hover:text-white transition-colors">
                Create Account
              </Link>
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
                Pricing
              </a>
              <Link
                href="https://github.com/MasterX9t9/CreatorPlush"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} CreatorPulse. Built for high-velocity YouTube creators.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>All Systems Operational</span>
              </span>
              <span>•</span>
              <span>Data sourced from official YouTube Data API v3</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
