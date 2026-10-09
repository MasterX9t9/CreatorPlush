"use client";

import React, { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import {
  Bot,
  Sparkles,
  Send,
  Database,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Video,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Array<{ id: string; type: string; metric: string; value: string | number }>;
  model?: string;
}

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your CreatorPulse AI Strategist. Unlike generic chatbots, I operate under strict anti-hallucination rules: all statistics, outlier metrics, and content gap analyses are grounded exclusively in retrieved YouTube records.",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [groundingTopic, setGroundingTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputPrompt.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage.content,
          topicQuery: groundingTopic.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "AI Analysis unavailable.");
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: json.data.answer,
            citations: json.data.citations,
            model: json.data.modelUsed,
          },
        ]);
      }
    } catch (err: any) {
      setError(err?.message || "Network error querying AI provider.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Shell
      title="Grounded AI Creator Assistant"
      subtitle="Data-grounded creator intelligence that cites verified YouTube records and forbids hallucinated statistics"
    >
      {/* Grounding Context Controls */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Database className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">Grounding Source:</span>
          <span>Retrieve live YouTube records for topic:</span>
        </div>
        <input
          type="text"
          value={groundingTopic}
          onChange={(e) => setGroundingTopic(e.target.value)}
          placeholder="Topic (e.g. 'productivity apps', 'coding tutorials')..."
          className="w-full sm:w-64 px-3 py-1.5 rounded-lg bg-card border border-white/10 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Chat Messages Log */}
      <div className="space-y-4 min-h-[400px]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                m.role === "user"
                  ? "bg-primary text-white ml-12"
                  : "glass-panel border border-white/5 text-foreground"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {/* Citations section if provided */}
              {m.citations && m.citations.length > 0 && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Grounded Record Citations ({m.citations.length})
                    </span>
                    <AttributionBadge type="ai_derived" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {m.citations.map((c, i) => (
                      <a
                        key={i}
                        href={`https://www.youtube.com/watch?v=${c.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Video className="w-3 h-3 text-primary" />
                        <span>Video ID: {c.id}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="glass-panel p-4 rounded-xl border border-white/5 text-xs text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>Retrieving validated records and generating grounded analysis...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSend} className="sticky bottom-4 pt-2">
        <div className="flex gap-3 glass-panel p-2 rounded-2xl border border-white/10 shadow-2xl">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask about content strategy, competitor gaps, or outlier video patterns..."
            className="flex-1 bg-transparent px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </form>
    </Shell>
  );
}
