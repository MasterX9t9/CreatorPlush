"use client";

import React, { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Bookmark,
  Plus,
  Trash2,
  ExternalLink,
  Tag,
  Video,
  Type,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface SwipeItem {
  id: string;
  title: string;
  itemType: "VIDEO" | "CHANNEL" | "THUMBNAIL" | "TITLE" | "HOOK" | "TRANSCRIPT";
  externalId?: string;
  thumbnailUrl?: string;
  url?: string;
  notes?: string;
  tags?: Array<{ id: string; name: string }>;
  createdAt: string;
}

export default function SwipeFilePage() {
  const [items, setItems] = useState<SwipeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New item modal/form states
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"VIDEO" | "TITLE" | "HOOK" | "THUMBNAIL">("VIDEO");
  const [newUrl, setNewUrl] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/swipefile/items");
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to load swipe file library.");
      } else {
        setItems(json.data || []);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch saved swipe items.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/swipefile/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          itemType: newType,
          url: newUrl.trim() || undefined,
          notes: newNotes.trim() || undefined,
          tags: [newType.toLowerCase()],
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsAdding(false);
        setNewTitle("");
        setNewUrl("");
        setNewNotes("");
        fetchItems(); // Reload live database items
      } else {
        alert(json.error?.message || "Could not save item.");
      }
    } catch (err: any) {
      alert(err?.message || "Network error saving item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this item from your Swipe File?")) return;
    try {
      const res = await fetch(`/api/v1/swipefile/items?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setItems((prev) => prev.filter((it) => it.id !== id));
      } else {
        alert(json.error?.message || "Could not delete item.");
      }
    } catch (err: any) {
      alert(err?.message || "Network error deleting item.");
    }
  };

  return (
    <Shell
      title="Creator Swipe File Library"
      subtitle="Persistent research archive for viral hooks, thumbnails, titles, and competitor videos"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Saved Research Items ({items.length})
          </h2>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-pulse-600 text-white font-semibold text-xs transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Save New Swipe Item</span>
        </button>
      </div>

      {/* Creation Modal / Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="glass-panel p-6 rounded-2xl border border-primary/30 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Add Item to Swipe File
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold">Title / Headline:</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. 'Viral Curiosity Hook from Veritasium'..."
                className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold">Item Type:</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="VIDEO">Video Reference</option>
                <option value="TITLE">Title Framework</option>
                <option value="HOOK">Intro Hook Script</option>
                <option value="THUMBNAIL">Thumbnail Concept</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-muted-foreground font-semibold">URL Link (optional):</label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-muted-foreground font-semibold">Strategic Notes / Why it worked:</label>
            <textarea
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Document the psychology, framing, or pacing..."
              className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
              disabled={isSubmitting || !newTitle.trim()}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white text-xs font-semibold shadow-md"
            >
              {isSubmitting ? "Persisting..." : "Save to Database"}
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

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-xl p-4 space-y-3">
              <Skeleton className="w-3/4 h-5 rounded" />
              <Skeleton className="w-full h-12 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && !error && (
        <EmptyState
          title="Your Swipe File is Empty"
          description="In strict adherence to Rule 40 in AGENTS.md, items you save are committed directly to PostgreSQL. Click above to save your first viral video, title, or hook."
          icon={Bookmark}
          actionText="Save First Item"
          onAction={() => setIsAdding(true)}
        />
      )}

      {/* Swipe Items Grid */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="glass-panel rounded-xl p-5 border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                    {item.itemType}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Delete item"
                    className="text-muted-foreground hover:text-rose-400 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-foreground leading-snug">
                  {item.title}
                </h3>

                {item.notes && (
                  <p className="text-xs text-muted-foreground leading-relaxed italic bg-white/5 p-2 rounded-lg border border-white/5">
                    &ldquo;{item.notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                  >
                    <span>View Reference</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
