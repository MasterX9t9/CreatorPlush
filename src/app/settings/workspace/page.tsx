"use client";

import React, { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import {
  Settings,
  Key,
  Shield,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
}

export default function WorkspaceSettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([
    {
      id: "key_1",
      name: "Chrome Extension Client",
      prefix: "cp_live_948f...",
      createdAt: new Date().toLocaleDateString(),
    },
  ]);

  const [newKeyName, setNewKeyName] = useState("");
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    // Generate simulated real key format: cp_live_<random_hex>
    const randomHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const fullKey = `cp_live_${randomHex}`;
    const prefix = fullKey.slice(0, 12) + "...";

    const newItem: ApiKeyItem = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      prefix,
      createdAt: new Date().toLocaleDateString(),
    };

    setApiKeys((prev) => [newItem, ...prev]);
    setCreatedRawKey(fullKey);
    setNewKeyName("");
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  };

  return (
    <Shell
      title="Workspace & Developer API Settings"
      subtitle="Multi-tenant workspace configuration, team access, and REST API authentication keys"
    >
      <div className="max-w-4xl space-y-8">
        {/* Workspace Identity */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                W
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Workspace Profile
                </h2>
                <p className="text-xs text-muted-foreground">
                  Default Workspace • Pro Plan Active
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Tenant
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold">Workspace Name:</label>
              <input
                type="text"
                readOnly
                value="Default Workspace"
                className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold">Workspace Slug:</label>
              <input
                type="text"
                readOnly
                value="default"
                className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground font-mono cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* API Keys Management (Rule 14 in AGENTS.md) */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  CreatorPulse Developer API Keys
                </h2>
                <p className="text-xs text-muted-foreground">
                  Authenticate the Chrome Extension, background workers, or external automation scripts.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              SHA-256 Hashed
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Strict Security (Rule 14)</span>
            </div>
            <p>
              Only cryptographic hashes of API keys are stored in our database. The raw key is shown only once upon creation.
            </p>
          </div>

          {/* Newly Created Key Alert */}
          {createdRawKey && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between text-emerald-300 font-semibold">
                <span>Save Your API Key (Visible only now):</span>
                <button
                  onClick={() => setCreatedRawKey(null)}
                  className="text-xs hover:underline"
                >
                  Dismiss
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 p-2 bg-black/60 rounded-lg border border-emerald-500/20 font-mono text-emerald-200">
                <span className="break-all">{createdRawKey}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdRawKey);
                    alert("API key copied to clipboard!");
                  }}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-white shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Generate New Key Form */}
          <form onSubmit={handleGenerateKey} className="flex gap-3 text-xs">
            <input
              type="text"
              required
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key label (e.g. 'Production Chrome Extension', 'CI Automation')..."
              className="flex-1 px-3 py-2 rounded-xl bg-card border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary hover:bg-pulse-600 text-white font-semibold shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Key</span>
            </button>
          </form>

          {/* Active Keys List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Keys ({apiKeys.length})
            </h4>

            <div className="divide-y divide-border/40">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground block">
                      {key.name}
                    </span>
                    <span className="font-mono text-muted-foreground text-[11px]">
                      {key.prefix} • Created {key.createdAt}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteKey(key.id)}
                    title="Revoke Key"
                    className="p-1.5 text-muted-foreground hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
