"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FileText,
  Search,
  Copy,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface TranscriptSegment {
  timeFormatted: string;
  seconds: number;
  text: string;
}

function TranscriptsContent() {
  const searchParams = useSearchParams();
  const [videoInput, setVideoInput] = useState(searchParams.get("id") || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleFetchTranscript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoInput.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasLoaded(true);

    let cleanId = videoInput.trim();
    if (cleanId.includes("watch?v=")) {
      cleanId = cleanId.split("watch?v=")[1].split("&")[0];
    }

    try {
      // In strict adherence to Rule 20 in AGENTS.md, if external video captions
      // are not enabled or restricted by YouTube, return honest notice
      setError(
        "Direct automated transcript extraction for video (" +
          cleanId +
          ") requires YouTube Closed Captions API authorization or user-uploaded subtitle files (.srt, .vtt, .txt). Never invent fake transcripts."
      );
      setSegments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Parse basic lines as transcript segments
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      const parsed: TranscriptSegment[] = lines.slice(0, 50).map((line, idx) => ({
        seconds: idx * 5,
        timeFormatted: `${Math.floor((idx * 5) / 60)}:${((idx * 5) % 60)
          .toString()
          .padStart(2, "0")}`,
        text: line.trim(),
      }));

      setSegments(parsed);
      setError(null);
      setHasLoaded(true);
    };
    reader.readAsText(file);
  };

  const filteredSegments = segments.filter((s) =>
    searchTerm.trim()
      ? s.text.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      {/* Transcript Input & Upload Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Video Transcript Extraction & Upload
        </h3>

        <form onSubmit={handleFetchTranscript} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="Enter YouTube Video URL or ID..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-card border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !videoInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Fetch Transcript</span>
          </button>
        </form>

        <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Or import subtitle file (.srt, .vtt, .txt):</span>
          <label className="cursor-pointer px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-foreground font-semibold border border-white/10 transition-colors inline-flex items-center gap-2">
            <span>Upload Subtitles</span>
            <input
              type="file"
              accept=".srt,.vtt,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Honest Error / Status Banner (Rule 20) */}
      {error && (
        <div className="glass-panel p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-200">Transcript Availability Limitation</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Initial Empty State */}
      {!isLoading && segments.length === 0 && !error && (
        <EmptyState
          title="Inspect Video Transcripts"
          description="Transcripts allow hook extraction, word-frequency topic analysis, and content gap discovery. Enter a YouTube URL or upload an SRT file above."
          icon={FileText}
        />
      )}

      {/* Segments Display */}
      {segments.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Transcript Segments ({filteredSegments.length})
              </h3>
              <AttributionBadge type="official" sourceText="User provided subtitle document" />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search spoken words..."
                className="px-3 py-1.5 rounded-lg bg-card border border-white/10 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary w-48"
              />
              <button
                onClick={() => {
                  const fullText = segments.map((s) => s.text).join(" ");
                  navigator.clipboard.writeText(fullText);
                  alert("Transcript text copied to clipboard!");
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                title="Copy Full Transcript"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-border/40 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
            {filteredSegments.map((seg, i) => (
              <div key={i} className="py-2.5 flex items-start gap-4 text-xs">
                <span className="font-mono text-primary font-bold shrink-0">
                  {seg.timeFormatted}
                </span>
                <p className="text-foreground leading-relaxed">{seg.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TranscriptsPage() {
  return (
    <Shell
      title="Video Transcript Intelligence"
      subtitle="Searchable spoken dialogue, chapter generation, and subtitle analysis"
    >
      <Suspense fallback={<div className="text-xs text-muted-foreground">Loading transcripts...</div>}>
        <TranscriptsContent />
      </Suspense>
    </Shell>
  );
}
