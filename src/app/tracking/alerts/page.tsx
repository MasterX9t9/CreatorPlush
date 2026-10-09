"use client";

import React, { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import {
  Bell,
  Plus,
  Trash2,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface AlertRule {
  id: string;
  name: string;
  triggerType: "OUTLIER_VIDEO" | "SUB_MILESTONE" | "COMPETITOR_UPLOAD";
  targetChannelId: string;
  conditionDescription: string;
  channelNotify: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRule[]>([
    {
      id: "alt_1",
      name: "Viral Competitor Outlier Alert",
      triggerType: "OUTLIER_VIDEO",
      targetChannelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
      conditionDescription: "Trigger when upload exceeds 5.0x channel median views",
      channelNotify: true,
      isActive: true,
      createdAt: new Date().toLocaleDateString(),
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [alertName, setAlertName] = useState("");
  const [channelId, setChannelId] = useState("");
  const [multiplier, setMultiplier] = useState("5.0");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertName.trim() || !channelId.trim()) return;

    const newRule: AlertRule = {
      id: `alt_${Date.now()}`,
      name: alertName.trim(),
      triggerType: "OUTLIER_VIDEO",
      targetChannelId: channelId.trim(),
      conditionDescription: `Trigger when upload exceeds ${multiplier}x channel median views`,
      channelNotify: true,
      isActive: true,
      createdAt: new Date().toLocaleDateString(),
    };

    setAlerts((prev) => [newRule, ...prev]);
    setAlertName("");
    setChannelId("");
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <Shell
      title="Performance Alerts & Trigger Automation"
      subtitle="Automated alerts monitoring competitor uploads, viral multiplier outbreaks, and view velocity spikes"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Active Trigger Conditions ({alerts.length})
          </h2>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-pulse-600 text-white font-semibold text-xs transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Alert Trigger</span>
        </button>
      </div>

      {/* Add Alert Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="glass-panel p-6 rounded-2xl border border-primary/30 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Configure Outlier Trigger Condition
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
            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold">Rule Name:</label>
              <input
                type="text"
                required
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
                placeholder="e.g. 5x Outlier Alert"
                className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold">Channel ID to Monitor:</label>
              <input
                type="text"
                required
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="UC..."
                className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold">Outlier Multiplier Threshold:</label>
              <select
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="2.0">2.0x Channel Median</option>
                <option value="5.0">5.0x Channel Median</option>
                <option value="10.0">10.0x Viral Spike</option>
                <option value="20.0">20.0x Mega-Viral</option>
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
              className="px-5 py-2 rounded-lg bg-primary hover:bg-pulse-600 text-white text-xs font-semibold shadow-md"
            >
              Activate Trigger
            </button>
          </div>
        </form>
      )}

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alt) => (
          <div
            key={alt.id}
            className="glass-panel p-5 rounded-xl border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wide flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {alt.triggerType}
                </span>
                <button
                  onClick={() => handleDelete(alt.id)}
                  className="text-muted-foreground hover:text-rose-400 p-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-sm font-bold text-foreground">{alt.name}</h3>
              <p className="text-xs text-muted-foreground font-mono bg-white/5 p-2 rounded-lg border border-white/5">
                Channel: {alt.targetChannelId}
              </p>
              <p className="text-xs text-muted-foreground">
                Condition: <strong className="text-foreground">{alt.conditionDescription}</strong>
              </p>
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Monitor
              </span>
              <span>Created {alt.createdAt}</span>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
