"use client";

import React, { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import {
  Image as ImageIcon,
  Sparkles,
  Eye,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
} from "lucide-react";

export default function ThumbnailStudioPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("How I Built a $10K/Month Micro-SaaS in 30 Days");
  const [previewSurface, setPreviewSurface] = useState<"home" | "search" | "sidebar">("home");

  const [hasImage, setHasImage] = useState(false);

  const handleTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl.trim()) {
      setHasImage(true);
    }
  };

  return (
    <Shell
      title="Thumbnail Studio & Multi-Surface Simulator"
      subtitle="Preview thumbnail readability across YouTube desktop feed, mobile cards, and recommended sidebars"
    >
      {/* Input Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Thumbnail & Title Preview Setup
        </h3>

        <form onSubmit={handleTest} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold">Thumbnail Image URL:</label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... (paste direct image link or YouTube thumbnail)"
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold">Paired Video Title:</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Video title to test pairing..."
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Surface Simulation:</span>
              <div className="flex rounded-lg bg-white/5 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewSurface("home")}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    previewSurface === "home" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Desktop Home Feed
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSurface("search")}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    previewSurface === "search" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Search Results
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSurface("sidebar")}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    previewSurface === "sidebar" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Watch Sidebar Card
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-pulse-600 text-white font-semibold text-xs shadow-md"
            >
              Update Preview
            </button>
          </div>
        </form>
      </div>

      {/* Surface Preview Simulation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Simulated YouTube Browsing Surface
          </h3>
          <span className="text-xs text-muted-foreground">
            Simulated environment • Non-proprietary layout
          </span>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/10 flex items-center justify-center bg-black/50 min-h-[320px]">
          {/* Surface: Desktop Home Card */}
          {previewSurface === "home" && (
            <div className="w-full max-w-sm rounded-xl overflow-hidden bg-card border border-white/10 shadow-2xl flex flex-col group">
              <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-muted-foreground text-xs flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8" />
                    <span>Paste image URL above to render preview</span>
                  </div>
                )}
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                  14:28
                </span>
              </div>
              <div className="p-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 shrink-0 font-bold text-white text-xs flex items-center justify-center">
                  C
                </div>
                <div className="space-y-1 min-w-0">
                  <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                    {title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Creator Channel Name • 128K views • 2 days ago
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Surface: Search Result Card */}
          {previewSurface === "search" && (
            <div className="w-full max-w-2xl rounded-xl p-3 bg-card border border-white/10 shadow-2xl flex flex-col sm:flex-row gap-4">
              <div className="relative aspect-video w-full sm:w-64 rounded-lg bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                  14:28
                </span>
              </div>
              <div className="space-y-2 py-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">
                  {title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Creator Channel Name • 128K views • 2 days ago
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  This simulated view allows you to judge whether your thumbnail contrast separates cleanly against horizontal search result cards.
                </p>
              </div>
            </div>
          )}

          {/* Surface: Sidebar Recommended Card */}
          {previewSurface === "sidebar" && (
            <div className="w-full max-w-xs rounded-xl p-2.5 bg-card border border-white/10 shadow-2xl flex gap-3">
              <div className="relative aspect-video w-36 rounded-md bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}
                <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-bold text-white">
                  14:28
                </span>
              </div>
              <div className="min-w-0 space-y-1">
                <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-tight">
                  {title}
                </h4>
                <p className="text-[10px] text-muted-foreground truncate">
                  Channel Name
                </p>
                <p className="text-[10px] text-muted-foreground">
                  128K views
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composition Principles Card */}
      <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Thumbnail Contrast & Readability Checklist
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Mobile Focal Separation
            </span>
            <p>
              Does the primary focal point (face or key object) remain clearly recognizable when scaled down to sidebar dimensions (36px width)?
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Text Legibility & Rule of 3
            </span>
            <p>
              Avoid more than 3–4 words on thumbnail canvas. High-contrast outlines or color separation prevent text blending into background.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Curiosity Title Synergy
            </span>
            <p>
              The thumbnail should never duplicate the title word-for-word. It should present the visual question that the title completes.
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}
