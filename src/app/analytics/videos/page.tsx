"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCompactNumber } from "@/lib/utils";
import { estimateRevenueRange } from "@/lib/algorithms/revenue";
import {
  Video,
  Search,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Flame,
  AlertCircle,
  Smile,
  Frown,
  HelpCircle,
  Lightbulb,
  Loader2,
  Tag,
  Calendar,
  Hash,
  Copy,
  Check,
  Bookmark,
  Sparkles,
  Layers,
  Languages,
  Subtitles,
  Tv,
  CheckCircle2,
  Info,
} from "lucide-react";

interface VideoIntelligenceData {
  video: {
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
    tags?: string[];
    categoryId?: string;
    categoryName?: string;
    defaultAudioLanguage?: string;
    defaultLanguage?: string;
    hasCaptions?: boolean;
    definition?: string;
    licensedContent?: boolean;
    attribution: any;
  };
  timing: {
    publishedAt: string;
    dayOfWeek: string;
    hourUtc: number;
    timeFormattedUtc: string;
    isWeekend: boolean;
    windowRating: "PRIME" | "MODERATE" | "INDEXING_OFFPEAK";
    windowSummary: string;
    recommendations: string[];
    attribution: any;
  };
  tagIntelligence: {
    totalTags: number;
    tags: string[];
    characterCount: number;
    titleMatches: string[];
    hiddenDiscoveryTags: string[];
    hashtags: string[];
    seoDensityScore: number;
  };
  metrics: {
    daysSincePublish: number;
    viewsPerDay: number;
    engagementRate: number;
    likeRate: number;
    commentRate: number;
    likesPerComment: number;
  };
}

interface SentimentData {
  disabled: boolean;
  message?: string;
  sampleCount: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  sentimentScore: number;
  topThemes: string[];
  viewerRequests: string[];
  commonQuestions: string[];
  recentSample?: Array<{ id: string; author: string; text: string; likeCount: number }>;
}

function VideoAnalyticsContent() {
  const searchParams = useSearchParams();
  const initialVideoId = searchParams.get("id") || "";

  const [videoInput, setVideoInput] = useState(initialVideoId);
  const [data, setData] = useState<VideoIntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTagTab, setActiveTagTab] = useState<
    "all" | "titleMatches" | "hidden" | "hashtags"
  >("all");
  const [copiedAllTags, setCopiedAllTags] = useState(false);
  const [copiedSingleTag, setCopiedSingleTag] = useState<string | null>(null);

  const [isSavingSwipe, setIsSavingSwipe] = useState(false);
  const [swipeSaved, setSwipeSaved] = useState(false);
  const [swipeError, setSwipeError] = useState<string | null>(null);

  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState<string | null>(null);

  const extractCleanVideoId = (input: string): string => {
    let clean = input.trim();
    if (clean.includes("watch?v=")) {
      clean = clean.split("watch?v=")[1].split("&")[0];
    } else if (clean.includes("youtu.be/")) {
      clean = clean.split("youtu.be/")[1].split("?")[0];
    } else if (clean.includes("youtube.com/shorts/")) {
      clean = clean.split("youtube.com/shorts/")[1].split("?")[0];
    }
    return clean;
  };

  const fetchVideo = async (inputStr: string) => {
    if (!inputStr.trim()) return;

    let targetId = extractCleanVideoId(inputStr);

    setIsLoading(true);
    setError(null);
    setSwipeSaved(false);
    setSwipeError(null);

    try {
      // If user typed a search phrase instead of an 11-char ID or URL, search first
      const isLikelyId = /^[\w-]{11}$/.test(targetId);
      if (!isLikelyId) {
        const searchRes = await fetch(
          `/api/v1/search/videos?q=${encodeURIComponent(inputStr.trim())}&maxResults=1`
        );
        const searchJson = await searchRes.json();
        if (searchJson.success && searchJson.data && searchJson.data.length > 0) {
          targetId = searchJson.data[0].id;
        } else {
          throw new Error(`Could not find any YouTube video matching: "${inputStr.trim()}"`);
        }
      }

      // Query full video intelligence route
      const res = await fetch(`/api/v1/videos/${targetId}`);
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        setError(json.error?.message || `Could not find video details for ID: ${targetId}`);
        setData(null);
      } else {
        setData(json.data);
        fetchSentiment(targetId);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load video intelligence.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSentiment = async (videoId: string) => {
    setSentimentLoading(true);
    setSentimentError(null);
    try {
      const res = await fetch(`/api/v1/videos/${videoId}/comments/sentiment`);
      const json = await res.json();
      if (json.success && json.data) {
        setSentimentData(json.data);
      } else {
        setSentimentError(json.error?.message || "Failed to analyze comments");
      }
    } catch (err: any) {
      setSentimentError(err?.message || "Error analyzing comments");
    } finally {
      setSentimentLoading(false);
    }
  };

  useEffect(() => {
    if (initialVideoId) {
      fetchVideo(initialVideoId);
    }
  }, [initialVideoId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideo(videoInput);
  };

  const handleCopyAllTags = () => {
    if (!data?.tagIntelligence?.tags?.length) return;
    const tagString = data.tagIntelligence.tags.join(", ");
    navigator.clipboard.writeText(tagString);
    setCopiedAllTags(true);
    setTimeout(() => setCopiedAllTags(false), 2500);
  };

  const handleCopySingleTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedSingleTag(tag);
    setTimeout(() => setCopiedSingleTag(null), 2000);
  };

  const handleSaveToSwipeFile = async () => {
    if (!data) return;
    setIsSavingSwipe(true);
    setSwipeError(null);

    try {
      const payload = {
        title: data.video.title,
        itemType: "VIDEO",
        externalId: data.video.id,
        thumbnailUrl: data.video.thumbnailUrl,
        url: `https://www.youtube.com/watch?v=${data.video.id}`,
        notes: `Category: ${data.video.categoryName || "General"} | Views: ${data.video.viewCount} | Tags: ${(data.video.tags || []).slice(0, 10).join(", ")}`,
        tags: (data.video.tags || []).slice(0, 6),
      };

      const res = await fetch("/api/v1/swipefile/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSwipeSaved(true);
        setTimeout(() => setSwipeSaved(false), 4000);
      } else {
        setSwipeError(json.error?.message || "Failed to save item to Swipe File.");
      }
    } catch (err: any) {
      setSwipeError(err?.message || "Error saving item to database.");
    } finally {
      setIsSavingSwipe(false);
    }
  };

  const video = data?.video;
  const timing = data?.timing;
  const tagIntelligence = data?.tagIntelligence;
  const metrics = data?.metrics;

  const revenueEst = video
    ? estimateRevenueRange(video.viewCount, "default")
    : null;

  // Selected tag list based on active tab
  const displayedTags = tagIntelligence
    ? activeTagTab === "all"
      ? tagIntelligence.tags
      : activeTagTab === "titleMatches"
      ? tagIntelligence.titleMatches
      : activeTagTab === "hidden"
      ? tagIntelligence.hiddenDiscoveryTags
      : tagIntelligence.hashtags
    : [];

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            placeholder="Paste YouTube Video URL, Video ID, or search topic (e.g. '0zT8A2GxGOg')..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !videoInput.trim()}
          className="px-6 py-3 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Video className="w-4 h-4" />
          )}
          <span>{isLoading ? "Analyzing..." : "Analyze Video"}</span>
        </button>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Initial Empty State */}
      {!isLoading && !data && !error && (
        <EmptyState
          title="Video Performance & Secret Metadata Intelligence"
          description="Enter any YouTube video link or identifier to reveal hidden video tags, SEO keywords, publishing timing windows, velocity metrics, and audience sentiments."
          icon={Video}
        />
      )}

      {/* Video Intelligence Presentation */}
      {!isLoading && data && video && timing && tagIntelligence && metrics && (
        <div className="space-y-6">
          {/* Main Video Hero & Technical DNA */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col lg:flex-row items-start gap-6">
            <div className="relative shrink-0 w-full lg:w-80">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full aspect-video rounded-xl object-cover bg-black/40 border border-white/10 shadow-lg"
              />
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[11px] font-bold text-white tracking-wide border border-white/10">
                {video.durationFormatted}
              </span>
            </div>

            <div className="flex-1 space-y-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                  {video.categoryName || "General"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-muted-foreground uppercase border border-white/5">
                  {video.definition?.toUpperCase() || "HD"}
                </span>
                {video.hasCaptions && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Subtitles className="w-3 h-3" /> Captions Included
                  </span>
                )}
                {video.defaultAudioLanguage && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    <Languages className="w-3 h-3" /> Audio: {video.defaultAudioLanguage}
                  </span>
                )}
                <AttributionBadge type="official" sourceText="YouTube Data API v3" />
              </div>

              <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                {video.title}
              </h2>

              <p className="text-xs text-muted-foreground">
                Channel: <strong className="text-foreground">{video.channelTitle}</strong> • Published on {new Date(video.publishedAt).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-foreground transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Watch on YouTube</span>
                </a>

                <a
                  href={`/research/outliers?channelId=${video.channelId}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/15 hover:bg-primary/25 border border-primary/30 text-xs font-semibold text-primary transition-colors"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Channel Outliers</span>
                </a>

                <button
                  type="button"
                  onClick={handleSaveToSwipeFile}
                  disabled={isSavingSwipe}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    swipeSaved
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-foreground"
                  }`}
                >
                  {isSavingSwipe ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : swipeSaved ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span>{swipeSaved ? "Saved to Swipe File!" : "Save to Swipe File"}</span>
                </button>
              </div>

              {swipeError && (
                <p className="text-[11px] text-rose-400 mt-1">{swipeError}</p>
              )}
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Views"
              value={formatCompactNumber(video.viewCount)}
              subValue="Official public view counter"
              dataType="official"
              sourceText="YouTube Data API v3"
              icon={Eye}
            />
            <MetricCard
              label="Views / Day Velocity"
              value={formatCompactNumber(metrics.viewsPerDay)}
              subValue={`${metrics.daysSincePublish} days since publication`}
              dataType="calculated"
              sourceText="viewCount / daysSincePublish"
              icon={TrendingUp}
            />
            <MetricCard
              label="Engagement Rate"
              value={`${metrics.engagementRate}%`}
              subValue={`${formatCompactNumber(video.likeCount)} likes • ${formatCompactNumber(video.commentCount)} comments`}
              dataType="calculated"
              sourceText="(likes + comments) / views"
              icon={ThumbsUp}
            />
            <MetricCard
              label="Est. Ad Revenue"
              value={`$${revenueEst?.monthlyRevenueMin} – $${revenueEst?.monthlyRevenueMax}`}
              subValue="Industry RPM bracket model"
              dataType="estimated"
              sourceText="Benchmark RPM ($2.0–$5.5)"
              icon={DollarSign}
            />
          </div>

          {/* Additional Engagement Breakdown Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                Like-to-View Rate
              </span>
              <p className="text-lg font-bold text-foreground">{metrics.likeRate}%</p>
              <p className="text-[11px] text-muted-foreground">
                Percentage of viewers who pressed thumbs up
              </p>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                Comment Rate
              </span>
              <p className="text-lg font-bold text-foreground">{metrics.commentRate}%</p>
              <p className="text-[11px] text-muted-foreground">
                Discussion depth: 1 comment per every{" "}
                {metrics.commentRate > 0
                  ? Math.round(100 / metrics.commentRate)
                  : "N/A"}{" "}
                views
              </p>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                Likes Per Comment
              </span>
              <p className="text-lg font-bold text-foreground">
                {metrics.likesPerComment > 0 ? `${metrics.likesPerComment}x` : "N/A"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Ratio of passive upvotes to active comments
              </p>
            </div>
          </div>

          {/* 1. PUBLISH TIMING & UPLOAD SCHEDULE ANALYSIS */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Publish Timing & Upload Schedule Analysis
                  </h3>
                  <AttributionBadge type="calculated" sourceText="internal_calculation" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reveals exact publication timestamp, active viewer audience windows, and algorithmic scheduling strategy.
                </p>
              </div>

              {/* Timing Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    timing.windowRating === "PRIME"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : timing.windowRating === "INDEXING_OFFPEAK"
                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {timing.windowRating === "PRIME"
                    ? "★ Prime Audience Window"
                    : timing.windowRating === "INDEXING_OFFPEAK"
                    ? "⚙ Pre-Index Window"
                    : "Standard Window"}
                </span>
              </div>
            </div>

            {/* Window Assessment Description */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">
                  {timing.windowSummary}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Published on <strong>{timing.dayOfWeek}</strong> at{" "}
                  <strong>{timing.timeFormattedUtc}</strong> (
                  {timing.isWeekend ? "Weekend" : "Weekday"}).
                </p>
              </div>
            </div>

            {/* 3 Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Exact Publish Timestamp</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    Day: <strong className="text-foreground">{timing.dayOfWeek}</strong>
                  </p>
                  <p>
                    Time (UTC): <strong className="text-foreground">{timing.timeFormattedUtc}</strong>
                  </p>
                  <p>
                    Local Time:{" "}
                    <strong className="text-foreground">
                      {new Date(timing.publishedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Global Peak Alignment</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    Weekday Peak: <span className="text-foreground">14:00 – 20:00 UTC</span>
                  </p>
                  <p>
                    Weekend Peak: <span className="text-foreground">12:00 – 18:00 UTC</span>
                  </p>
                  <p>
                    Status:{" "}
                    <strong
                      className={
                        timing.windowRating === "PRIME"
                          ? "text-emerald-400"
                          : "text-foreground"
                      }
                    >
                      {timing.windowRating === "PRIME"
                        ? "Aligned with peak viewer overlap"
                        : "Uploaded outside peak hours"}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Format Strategy</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    Duration:{" "}
                    <strong className="text-foreground">
                      {video.durationFormatted} ({video.isShort ? "Short" : "Long-Form"})
                    </strong>
                  </p>
                  <p>
                    Encoding Need:{" "}
                    <span className="text-foreground">
                      {video.durationSec > 3600
                        ? "High (Requires 2-4h pre-indexing)"
                        : "Fast processing"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendations & Playbook */}
            {timing.recommendations.length > 0 && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  Scheduling Playbook & Strategy Takeaways
                </h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-5">
                  {timing.recommendations.map((rec, i) => (
                    <li key={i} className="text-foreground/90">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 2. HIDDEN VIDEO TAGS & KEYWORD INTELLIGENCE */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    Hidden Video Tags & SEO Keyword Intelligence
                  </h3>
                  <AttributionBadge type="official" sourceText="YouTube Data API snippet.tags" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Exposes secret backend keywords embedded in the YouTube upload metadata for discovery and search ranking.
                </p>
              </div>

              {/* Copy All Tags Action */}
              {tagIntelligence.tags.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyAllTags}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                    copiedAllTags
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-foreground"
                  }`}
                >
                  {copiedAllTags ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span>{copiedAllTags ? "All Tags Copied!" : "Copy All Tags"}</span>
                </button>
              )}
            </div>

            {/* Tag Capacity & SEO Density Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                  Total Hidden Tags
                </span>
                <p className="text-xl font-bold text-foreground">
                  {tagIntelligence.totalTags} Tags
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Target benchmark: 15–30 targeted keywords
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                  Metadata Character Volume
                </span>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-bold text-foreground">
                    {tagIntelligence.characterCount}
                  </p>
                  <span className="text-xs text-muted-foreground">/ 500 max chars</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-1">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.min(100, (tagIntelligence.characterCount / 500) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                  SEO Density Score
                </span>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-foreground">
                    {tagIntelligence.seoDensityScore} / 100
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      tagIntelligence.seoDensityScore >= 70
                        ? "bg-emerald-500/10 text-emerald-400"
                        : tagIntelligence.seoDensityScore >= 40
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {tagIntelligence.seoDensityScore >= 70
                      ? "Optimal"
                      : tagIntelligence.seoDensityScore >= 40
                      ? "Moderate"
                      : "Sparse"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Weighted by tag volume, character coverage, and title synergy
                </p>
              </div>
            </div>

            {/* Tag Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setActiveTagTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTagTab === "all"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                All Tags ({tagIntelligence.totalTags})
              </button>

              <button
                type="button"
                onClick={() => setActiveTagTab("titleMatches")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTagTab === "titleMatches"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                Title Match Keywords ({tagIntelligence.titleMatches.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTagTab("hidden")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTagTab === "hidden"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                Hidden Discovery Keywords ({tagIntelligence.hiddenDiscoveryTags.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTagTab("hashtags")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTagTab === "hashtags"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                Description Hashtags ({tagIntelligence.hashtags.length})
              </button>
            </div>

            {/* Tag Pills Presentation */}
            {displayedTags.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {displayedTags.map((tag, idx) => {
                    const isTitleMatch = tagIntelligence.titleMatches.includes(tag);
                    const isCopied = copiedSingleTag === tag;

                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => handleCopySingleTag(tag)}
                        title="Click to copy individual keyword"
                        className={`group px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                          isTitleMatch
                            ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                            : "bg-white/5 border-white/10 text-foreground hover:bg-white/10"
                        }`}
                      >
                        {tag.startsWith("#") ? (
                          <Hash className="w-3 h-3 text-muted-foreground shrink-0" />
                        ) : (
                          <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
                        )}
                        <span>{tag}</span>
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-60 text-muted-foreground shrink-0 transition-opacity" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground italic">
                  Tip: Click any individual keyword tag above to copy it directly to your clipboard.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-white/10 bg-white/5 text-center text-xs text-muted-foreground">
                {activeTagTab === "all"
                  ? "No video tags were attached to this upload on YouTube. Video discovery relies on title, description, and automated transcript speech recognition."
                  : activeTagTab === "titleMatches"
                  ? "None of the video tags directly match phrases found in the title."
                  : activeTagTab === "hidden"
                  ? "No hidden discovery tags exist outside of title keywords."
                  : "No description hashtags (#) were detected in this video's description."}
              </div>
            )}
          </div>

          {/* 3. COMMENT & AUDIENCE SENTIMENT SECTION */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Audience & Comment Sentiment Analysis
                  </h3>
                  <AttributionBadge type="calculated" sourceText="internal_calculation" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Analyzes public comment threads to extract viewer feedback, questions, and content requests.
                </p>
              </div>

              {sentimentData && !sentimentData.disabled && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Sample:</span>
                  <span className="font-bold text-foreground">
                    {sentimentData.sampleCount} Comments
                  </span>
                </div>
              )}
            </div>

            {sentimentLoading && (
              <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Extracting public comments and analyzing sentiment...</span>
              </div>
            )}

            {sentimentError && (
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 text-xs">
                {sentimentError}
              </div>
            )}

            {sentimentData?.disabled && (
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-muted-foreground">
                Comments are disabled or restricted for this video on YouTube.
              </div>
            )}

            {sentimentData && !sentimentData.disabled && !sentimentLoading && (
              <div className="space-y-6">
                {/* Sentiment Distribution Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Smile className="w-3.5 h-3.5" /> Positive {sentimentData.positivePct}%
                    </span>
                    <span className="text-muted-foreground">
                      Neutral {sentimentData.neutralPct}%
                    </span>
                    <span className="text-rose-400 flex items-center gap-1">
                      <Frown className="w-3.5 h-3.5" /> Negative {sentimentData.negativePct}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden flex bg-white/5">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${sentimentData.positivePct}%` }}
                    />
                    <div
                      className="bg-muted-foreground/30 h-full transition-all"
                      style={{ width: `${sentimentData.neutralPct}%` }}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all"
                      style={{ width: `${sentimentData.negativePct}%` }}
                    />
                  </div>
                </div>

                {/* Top Recurring Themes */}
                {sentimentData.topThemes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                      Frequent Discussion Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {sentimentData.topThemes.map((theme, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-foreground font-medium"
                        >
                          #{theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grid for Requests & Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Viewer Requests */}
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      Content Ideas & Viewer Requests
                    </h4>
                    {sentimentData.viewerRequests.length > 0 ? (
                      <ul className="space-y-2 text-xs text-muted-foreground">
                        {sentimentData.viewerRequests.map((req, i) => (
                          <li key={i} className="border-l-2 border-amber-400/50 pl-2 text-foreground/90">
                            &ldquo;{req}&rdquo;
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        No specific content requests detected in the sampled comments.
                      </p>
                    )}
                  </div>

                  {/* Common Questions */}
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-400" />
                      Audience Inquiries & Questions
                    </h4>
                    {sentimentData.commonQuestions.length > 0 ? (
                      <ul className="space-y-2 text-xs text-muted-foreground">
                        {sentimentData.commonQuestions.map((q, i) => (
                          <li key={i} className="border-l-2 border-blue-400/50 pl-2 text-foreground/90">
                            &ldquo;{q}&rdquo;
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        No common audience questions detected in the sample.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideoAnalyticsPage() {
  return (
    <Shell
      title="Video Deep-Dive Intelligence"
      subtitle="Expose secret video tags, SEO keywords, publishing timing windows, and engagement velocity"
    >
      <Suspense fallback={<div className="text-xs text-muted-foreground">Loading video intelligence...</div>}>
        <VideoAnalyticsContent />
      </Suspense>
    </Shell>
  );
}
