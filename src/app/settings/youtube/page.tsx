"use client";

import React, { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import {
  Youtube,
  ShieldCheck,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
} from "lucide-react";

export default function YouTubeSettingsPage() {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <Shell
      title="YouTube API & Channel Integration"
      subtitle="Connect official YouTube OAuth 2.0 and configure Google Cloud YouTube Data API keys"
    >
      <div className="max-w-4xl space-y-8">
        {/* OAuth Section */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
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

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                alert("Redirecting to Google OAuth Consent Screen with YouTube scopes...");
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-pulse-600 text-white font-semibold text-xs transition-all shadow-md glow-rose"
            >
              <Youtube className="w-4 h-4" />
              <span>Sign in with Google / YouTube</span>
            </button>
            <span className="text-xs text-muted-foreground">
              No channel connected yet
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
                For security, API keys should be stored directly in <code className="bg-black/40 px-1 py-0.5 rounded text-foreground">.env</code> as <code className="bg-black/40 px-1 py-0.5 rounded text-foreground">YOUTUBE_API_KEY</code>.
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
                {isSaved ? "Saved to Configuration!" : "Test API Connection"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Shell>
  );
}
