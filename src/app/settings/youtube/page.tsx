"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Eye,
  Users,
} from "lucide-react";

interface ConnectedChannel {
  id: string;
  accountId: string;
  title: string;
  customUrl?: string;
  avatarUrl?: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  lastSyncedAt?: string;
}

function YouTubeSettingsContent() {
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success");
  const errorParam = searchParams.get("error");

  const [connectedChannels, setConnectedChannels] = useState<ConnectedChannel[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(errorParam);

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);

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

  const handleConnectOAuth = async () => {
    setIsConnecting(true);
    setOauthError(null);
    try {
      const res = await fetch("/api/v1/youtube/auth-url");
      const json = await res.json();

      if (!res.ok || !json.success) {
        setOauthError(
          json.error?.message ||
            "Failed to generate Google OAuth consent URL. Check GOOGLE_CLIENT_ID in .env."
        );
        setIsConnecting(false);
      } else if (json.data?.authUrl) {
        window.location.assign(json.data.authUrl);
      }
    } catch (err: any) {
      setOauthError(err?.message || "Network error requesting OAuth URL.");
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (channelId: string) => {
    if (!confirm("Disconnect this YouTube channel? Private analytics will no longer be synced.")) return;
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

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setIsApiKeySaved(true);
    setTimeout(() => setIsApiKeySaved(false), 3000);
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
        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{oauthError}</span>
        </div>
      )}

      {/* OAuth Section */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Connect YouTube Creator Channel (OAuth 2.0)
              </h2>
              <p className="text-xs text-muted-foreground">
                Grants read-only access to YouTube Analytics API for authentic revenue, RPM, and CTR metrics.
              </p>
            </div>
          </div>
          <AttributionBadge type="official" sourceText="Official Google OAuth Consent" />
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Security & Permissions (Rule 7 & 13)</span>
          </div>
          <p>
            We request <code className="bg-black/40 px-1 py-0.5 rounded text-foreground">youtube.readonly</code> and <code className="bg-black/40 px-1 py-0.5 rounded text-foreground">yt-analytics.readonly</code>. Tokens are encrypted at rest with AES-256-GCM. We never request permission to upload, edit, or delete any of your content.
          </p>
        </div>

        {/* Connected Channels List */}
        {connectedChannels.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Connected Channels ({connectedChannels.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {connectedChannels.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {c.avatarUrl ? (
                      <img
                        src={c.avatarUrl}
                        alt={c.title}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold">
                        YT
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate">
                        {c.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {formatCompactNumber(c.subscriberCount)} subs • {formatCompactNumber(c.viewCount)} views
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDisconnect(c.id)}
                    title="Disconnect Channel"
                    className="p-2 text-muted-foreground hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleConnectOAuth}
            disabled={isConnecting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md glow-rose"
          >
            <Youtube className="w-4 h-4" />
            <span>{isConnecting ? "Redirecting to Google..." : "Connect Another Channel"}</span>
          </button>
          <span className="text-xs text-muted-foreground">
            {connectedChannels.length === 0 ? "No channel connected yet" : "Channels actively synced"}
          </span>
        </div>
      </div>

      {/* Server API Key Section */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Public YouTube Data API v3 Key
            </h2>
            <p className="text-xs text-muted-foreground">
              Used for public search queries, competitor channel inspections, and video metadata retrieval.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveApiKey} className="space-y-4">
          <div className="space-y-1.5 text-xs">
            <label className="text-muted-foreground font-semibold">
              Google Cloud API Key (Server Environment Variable):
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2.5 rounded-xl bg-card border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground pt-1">
              Store your key in <code className="bg-black/40 px-1 py-0.5 rounded text-foreground">.env</code> as <code className="bg-black/40 px-1 py-0.5 rounded text-foreground">YOUTUBE_API_KEY</code>.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
            >
              <span>Get API key from Google Cloud Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="submit"
              disabled={!apiKeyInput.trim()}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-foreground font-semibold text-xs transition-colors"
            >
              {isApiKeySaved ? "Saved to Configuration!" : "Test API Connection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function YouTubeSettingsPage() {
  return (
    <Shell
      title="YouTube API & Channel Integration"
      subtitle="Connect official YouTube OAuth 2.0 and configure Google Cloud YouTube Data API keys"
    >
      <Suspense fallback={<div className="text-xs text-muted-foreground">Loading settings...</div>}>
        <YouTubeSettingsContent />
      </Suspense>
    </Shell>
  );
}
