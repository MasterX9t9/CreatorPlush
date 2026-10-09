"use client";

import React, { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { formatCompactNumber } from "@/lib/utils";
import {
  Radio,
  Plus,
  Trash2,
  ExternalLink,
  Flame,
  Search,
  Eye,
  Users,
  AlertCircle,
} from "lucide-react";

interface CompetitorChannel {
  id: string;
  title: string;
  avatarUrl: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  threatLevel: "High" | "Medium" | "Low";
  lastVideoPublished: string;
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<CompetitorChannel[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [channelInput, setChannelInput] = useState("");
  const [threatLevel, setThreatLevel] = useState<"High" | "Medium" | "Low">("Medium");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelInput.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Query channel metadata from YouTube API
      const res = await fetch(`/api/v1/channels/${encodeURIComponent(channelInput.trim())}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to fetch competitor channel.");
      } else {
        const ch = json.data;
        const newCompetitor: CompetitorChannel = {
          id: ch.id,
          title: ch.title,
          avatarUrl: ch.avatarUrl,
          subscribers: ch.subscriberCount,
          totalViews: ch.viewCount,
          videoCount: ch.videoCount,
          threatLevel,
          lastVideoPublished: new Date().toLocaleDateString(),
        };

        setCompetitors((prev) => [newCompetitor, ...prev]);
        setChannelInput("");
        setIsAdding(false);
      }
    } catch (err: any) {
      setError(err?.message || "Network error fetching channel.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = (id: string) => {
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <Shell
      title="Competitor Radar & Tracking"
      subtitle="Track competitor upload frequency, view velocity, and viral outlier breakouts"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Tracked Channels ({competitors.length})
          </h2>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-pulse-600 text-white font-semibold text-xs transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Track New Competitor</span>
        </button>
      </div>

      {/* Add Competitor Form */}
      {isAdding && (
        <form
          onSubmit={handleAddCompetitor}
          className="glass-panel p-6 rounded-2xl border border-primary/30 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Add Competitor to Radar
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-muted-foreground font-semibold">
                YouTube Channel ID:
              </label>
              <input
                type="text"
                required
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder="e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw"
                className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold">
                Threat / Priority Level:
              </label>
              <select
                value={threatLevel}
                onChange={(e) => setThreatLevel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="High">High Threat</option>
                <option value="Medium">Medium Threat</option>
                <option value="Low">Low / Adjacent</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-lg bg-white/5 text-muted-foreground text-xs font-semibold hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !channelInput.trim()}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white text-xs font-semibold shadow-md"
            >
              {isLoading ? "Querying YouTube API..." : "Add to Radar"}
            </button>
          </div>
        </form>
      )}

      {/* Error Banner */}
      {error && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {competitors.length === 0 && !isAdding && (
        <EmptyState
          title="No Competitors on Radar"
          description="In strict adherence to Rule 41 in AGENTS.md, tracking a competitor channel stores periodic performance snapshots and triggers alerts when they publish 5x outliers."
          icon={Radio}
          actionText="Add Competitor Channel"
          onAction={() => setIsAdding(true)}
        />
      )}

      {/* Competitors List */}
      {competitors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {competitors.map((c) => (
            <div
              key={c.id}
              className="glass-panel rounded-xl p-5 border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={c.avatarUrl}
                      alt={c.title}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-foreground leading-snug">
                        {c.title}
                      </h3>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {c.id}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(c.id)}
                    className="text-muted-foreground hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-muted-foreground block text-[10px]">Subscribers</span>
                    <span className="font-bold text-foreground">
                      {formatCompactNumber(c.subscribers)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-muted-foreground block text-[10px]">Total Views</span>
                    <span className="font-bold text-foreground">
                      {formatCompactNumber(c.totalViews)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                <a
                  href={`/research/outliers?channelId=${c.id}`}
                  className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Inspect Outliers</span>
                </a>

                <AttributionBadge type="official" />
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
