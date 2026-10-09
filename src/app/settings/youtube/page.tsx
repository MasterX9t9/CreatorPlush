"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { formatCompactNumber } from "@/lib/utils";
import {
  Youtube,
  ShieldCheck,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Lock,
  Trash2,
  RefreshCw,
  BarChart3,
  Loader2,
  Plus,
  Radio,
  ArrowRight,
  Info,
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
  medianViews?: number;
  lastSyncedAt?: string;
}

function YouTubeSettingsContent() {
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success");
  const errorParam = searchParams.get("error");

  const [connectedChannels, setConnectedChannels] = useState<ConnectedChannel[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);

  // Manual connect state
  const [channelInput, setChannelInput] = useState("");
  const [isConnectingManual, setIsConnectingManual] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  // Syncing state per channel ID
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncedId, setSyncedId] = useState<string | null>(null);

  // OAuth state
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(errorParam);

  const fetchChannels = async () => {
    setIsLoadingChannels(true);
    try {
      const res = await fetch("/api/v1/youtube/connected-channels");
      const json = await res.json();
      if (res.ok && json.success) {
        setConnectedChannels(json.data || []);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoadingChannels(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleConnectChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelInput.trim()) return;

    setIsConnectingManual(true);
    setManualError(null);
    setManualSuccess(null);

    try {
      const res = await fetch("/api/v1/youtube/connected-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelInput: channelInput.trim() }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setManualError(
          json.error?.message ||
            "Failed to connect YouTube channel. Please verify the handle or URL."
        );
      } else {
        setManualSuccess(
          `Successfully connected "${json.data.title}"! Synced ${json.data.syncedVideosCount || 0} recent videos.`
        );
        setChannelInput("");
        fetchChannels();
        setTimeout(() => setManualSuccess(null), 5000);
      }
    } catch (err: any) {
      setManualError(err?.message || "Network error while connecting channel.");
    } finally {
      setIsConnectingManual(false);
    }
  };

  const handleSyncChannel = async (channelId: string) => {
    setSyncingId(channelId);
    setSyncedId(null);

    try {
      const res = await fetch("/api/v1/youtube/connected-channels/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setConnectedChannels((prev) =>
          prev.map((c) =>
            c.id === channelId
              ? {
                  ...c,
                  subscriberCount: json.data.subscriberCount,
                  viewCount: json.data.viewCount,
                  videoCount: json.data.videoCount,
                  medianViews: json.data.medianViews,
                  lastSyncedAt: json.data.lastSyncedAt,
                }
              : c
          )
        );
        setSyncedId(channelId);
        setTimeout(() => setSyncedId(null), 3000);
      } else {
        alert(json.error?.message || "Failed to synchronize channel.");
      }
    } catch (err: any) {
      alert(err?.message || "Sync network error.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleConnectOAuth = async () => {
    setIsConnectingOAuth(true);
    setOauthError(null);
    try {
      const res = await fetch("/api/v1/youtube/auth-url");
      const json = await res.json();

      if (!res.ok || !json.success) {
        setOauthError(
          json.error?.message ||
            "Google OAuth requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET configured in your .env file."
        );
        setIsConnectingOAuth(false);
      } else if (json.data?.authUrl) {
        window.location.assign(json.data.authUrl);
      }
    } catch (err: any) {
      setOauthError(err?.message || "Network error requesting OAuth consent URL.");
      setIsConnectingOAuth(false);
    }
  };

  const handleDisconnect = async (channelId: string, title: string) => {
    if (!confirm(`Disconnect "${title}"? This channel will be unlinked from your workspace.`)) return;
    try {
      const res = await fetch(
        `/api/v1/youtube/connected-channels?channelId=${channelId}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (res.ok && json.success) {
        setConnectedChannels((prev) => prev.filter((c) => c.id !== channelId));
      } else {
        alert(json.error?.message || "Failed to disconnect channel.");
      }
    } catch (err: any) {
      alert(err?.message || "Network error.");
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Callback Status Banners */}
      {successParam && (
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>YouTube channel successfully authenticated and connected via OAuth 2.0!</span>
        </div>
      )}

      {oauthError && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">{oauthError}</span>
            <p className="text-[11px] text-rose-200/80">
              Tip: You can instantly connect and track any channel below using your channel handle (e.g. <code>@LegendMangaReels</code>) powered by your active YouTube API key without needing OAuth setup!
            </p>
          </div>
        </div>
      )}

      {/* 1. INSTANT CHANNEL CONNECTION BY HANDLE OR URL */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Connect YouTube Channel (Instant Official Sync)
              </h2>
              <p className="text-xs text-muted-foreground">
                Link your channel to track official subscribers, view counts, median outlier baselines, and upload timing.
              </p>
            </div>
          </div>
          <AttributionBadge type="official" sourceText="YouTube Data API v3" />
        </div>

        {manualSuccess && (
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{manualSuccess}</span>
          </div>
        )}

        {manualError && (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{manualError}</span>
          </div>
        )}

        <form onSubmit={handleConnectChannel} className="space-y-3">
          <label className="text-xs font-semibold text-foreground block">
            Channel Handle, Channel URL, or Channel ID:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              placeholder="e.g. '@LegendMangaReels', 'https://youtube.com/@...', or 'UC...'"
              className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs shadow-sm font-mono"
            />
            <button
              type="submit"
              disabled={isConnectingManual || !channelInput.trim()}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
            >
              {isConnectingManual ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isConnectingManual ? "Connecting Channel..." : "Connect Channel"}</span>
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Automatically queries YouTube Data API v3, caches the catalog, syncs recent uploads, and calculates median benchmarks.
          </p>
        </form>
      </div>

      {/* 2. CONNECTED CHANNELS CATALOG */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              Active Connected Channels
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Channels actively linked to this workspace. Stats are cached and updated with real YouTube provenance.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-foreground">
            {connectedChannels.length} Linked
          </span>
        </div>

        {isLoadingChannels ? (
          <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Loading connected channels...</span>
          </div>
        ) : connectedChannels.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-white/10 text-center space-y-2">
            <Youtube className="w-8 h-8 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-bold text-foreground">No channels connected yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Enter your YouTube channel handle above (e.g. <code>@LegendMangaReels</code>) to instantly link your channel and populate your Creator Overview dashboard with authentic metrics.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {connectedChannels.map((c) => {
              const isSyncing = syncingId === c.id;
              const isSynced = syncedId === c.id;

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-card border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-white/20"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {c.avatarUrl ? (
                      <img
                        src={c.avatarUrl}
                        alt={c.title}
                        className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0 bg-black/40"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        YT
                      </div>
                    )}
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {c.title}
                        </h4>
                        {c.customUrl && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {c.customUrl}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {formatCompactNumber(c.subscriberCount)} subs
                        </span>
                        <span>•</span>
                        <span>{formatCompactNumber(c.viewCount)} views</span>
                        <span>•</span>
                        <span>{c.videoCount} uploads</span>
                        {c.lastSyncedAt && (
                          <>
                            <span>•</span>
                            <span className="text-[11px] text-muted-foreground">
                              Synced {new Date(c.lastSyncedAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                    <button
                      onClick={() => handleSyncChannel(c.id)}
                      disabled={isSyncing}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isSynced
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                          : "bg-white/5 hover:bg-white/10 border-white/10 text-foreground"
                      }`}
                      title="Fetch fresh subscriber and view counts"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          isSyncing ? "animate-spin text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <span>{isSyncing ? "Syncing..." : isSynced ? "Synced!" : "Sync Now"}</span>
                    </button>

                    <Link
                      href={`/analytics/channels?id=${c.id}`}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Deep Analytics</span>
                    </Link>

                    <button
                      onClick={() => handleDisconnect(c.id, c.title)}
                      title="Disconnect Channel"
                      className="p-2 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. GOOGLE OAUTH 2.0 ADVANCED SECTION */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Advanced: Google OAuth 2.0 (Private Studio Analytics)
              </h2>
              <p className="text-xs text-muted-foreground">
                Required only if you wish to inspect private creator AdSense revenue reports, Impressions, and CTR.
              </p>
            </div>
          </div>
          <AttributionBadge type="official" sourceText="Google OAuth 2.0" />
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Token Security (Rules 7 & 13)</span>
          </div>
          <p>
            Scopes requested: <code className="bg-black/40 px-1 py-0.5 rounded text-foreground">youtube.readonly</code> and <code className="bg-black/40 px-1 py-0.5 rounded text-foreground">yt-analytics.readonly</code>. OAuth refresh tokens are encrypted at rest with AES-256-GCM.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleConnectOAuth}
            disabled={isConnectingOAuth}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-foreground font-semibold text-xs transition-colors"
          >
            {isConnectingOAuth ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Youtube className="w-4 h-4 text-rose-500" />
            )}
            <span>{isConnectingOAuth ? "Contacting Google..." : "Connect with Google OAuth 2.0"}</span>
          </button>

          <span className="text-[11px] text-muted-foreground">
            Requires <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in <code>.env</code>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function YouTubeSettingsPage() {
  return (
    <Shell
      title="YouTube Channel & API Integration"
      subtitle="Connect official YouTube channels by handle, sync subscriber metrics, or authorize Google OAuth 2.0"
    >
      <Suspense fallback={<div className="text-xs text-muted-foreground">Loading settings...</div>}>
        <YouTubeSettingsContent />
      </Suspense>
    </Shell>
  );
}
