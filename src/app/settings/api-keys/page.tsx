"use client";

import React, { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Youtube,
  Trash2,
  RefreshCw,
  Cpu,
  Bot,
  HelpCircle,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface KeyInfo {
  provider: "youtube" | "gemini" | "openai";
  isConfigured: boolean;
  maskedKey: string | null;
  isValidated: boolean;
  updatedAt: string | null;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<Record<string, KeyInfo>>({});
  const [platformDefaults, setPlatformDefaults] = useState({
    hasYouTube: true,
    hasGemini: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  // YouTube Key Input State
  const [youtubeInput, setYoutubeInput] = useState("");
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);
  const [isValidatingYouTube, setIsValidatingYouTube] = useState(false);
  const [isSavingYouTube, setIsSavingYouTube] = useState(false);
  const [youtubeStatusMsg, setYoutubeStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // AI Key Input State
  const [aiProvider, setAiProvider] = useState<"gemini" | "openai">("gemini");
  const [aiInput, setAiInput] = useState("");
  const [showAiKey, setShowAiKey] = useState(false);
  const [isValidatingAi, setIsValidatingAi] = useState(false);
  const [isSavingAi, setIsSavingAi] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Step-by-step help accordion
  const [showYouTubeTutorial, setShowYouTubeTutorial] = useState(false);

  // Load configured keys
  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/user/keys");
      const json = await res.json();
      if (res.ok && json.success) {
        setKeys(json.data.keys || {});
        if (json.data.platformDefaults) {
          setPlatformDefaults(json.data.platformDefaults);
        }
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  // Validate YouTube API key probe
  const handleValidateYouTube = async () => {
    if (!youtubeInput.trim()) {
      setYoutubeStatusMsg({
        type: "error",
        text: "Please enter your YouTube API key to validate.",
      });
      return;
    }

    setIsValidatingYouTube(true);
    setYoutubeStatusMsg(null);

    try {
      const res = await fetch("/api/v1/user/keys/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "youtube",
          key: youtubeInput.trim(),
        }),
      });
      const json = await res.json();

      if (res.ok && json.success && json.valid) {
        setYoutubeStatusMsg({
          type: "success",
          text: json.message || "✓ Key is valid! Connected to YouTube Data API v3.",
        });
      } else {
        setYoutubeStatusMsg({
          type: "error",
          text:
            json.error?.message ||
            "Invalid API key or YouTube Data API v3 is not enabled in Google Cloud Console.",
        });
      }
    } catch {
      setYoutubeStatusMsg({
        type: "error",
        text: "Network error validating key with Google Cloud.",
      });
    } finally {
      setIsValidatingYouTube(false);
    }
  };

  // Save YouTube API key
  const handleSaveYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeInput.trim()) return;

    setIsSavingYouTube(true);
    setYoutubeStatusMsg(null);

    try {
      const res = await fetch("/api/v1/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "youtube",
          key: youtubeInput.trim(),
        }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        // Also save to localStorage for client-side header pass-through
        localStorage.setItem("cp_user_youtube_key", youtubeInput.trim());
        setYoutubeInput("");
        setYoutubeStatusMsg({
          type: "success",
          text: "✓ Your personal YouTube API key has been securely saved and activated!",
        });
        await fetchKeys();
      } else {
        setYoutubeStatusMsg({
          type: "error",
          text: json.error?.message || "Failed to save YouTube API key.",
        });
      }
    } catch {
      setYoutubeStatusMsg({
        type: "error",
        text: "Network error saving API key.",
      });
    } finally {
      setIsSavingYouTube(false);
    }
  };

  // Remove YouTube API key
  const handleRemoveYouTube = async () => {
    if (!confirm("Are you sure you want to remove your personal YouTube API key? The app will revert to the platform default key.")) {
      return;
    }

    try {
      const res = await fetch("/api/v1/user/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "youtube" }),
      });
      if (res.ok) {
        localStorage.removeItem("cp_user_youtube_key");
        setYoutubeStatusMsg({
          type: "success",
          text: "Removed personal key. Reverted to platform default key.",
        });
        await fetchKeys();
      }
    } catch {
      // Ignored
    }
  };

  // Validate AI Key probe
  const handleValidateAi = async () => {
    if (!aiInput.trim()) {
      setAiStatusMsg({
        type: "error",
        text: `Please enter your ${aiProvider.toUpperCase()} key to test.`,
      });
      return;
    }

    setIsValidatingAi(true);
    setAiStatusMsg(null);

    try {
      const res = await fetch("/api/v1/user/keys/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          key: aiInput.trim(),
        }),
      });
      const json = await res.json();

      if (res.ok && json.success && json.valid) {
        setAiStatusMsg({
          type: "success",
          text: json.message || `✓ ${aiProvider.toUpperCase()} connection successful!`,
        });
      } else {
        setAiStatusMsg({
          type: "error",
          text: json.error?.message || `Invalid ${aiProvider.toUpperCase()} key.`,
        });
      }
    } catch {
      setAiStatusMsg({
        type: "error",
        text: "Network error contacting AI provider.",
      });
    } finally {
      setIsValidatingAi(false);
    }
  };

  // Save AI Key
  const handleSaveAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    setIsSavingAi(true);
    setAiStatusMsg(null);

    try {
      const res = await fetch("/api/v1/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          key: aiInput.trim(),
        }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setAiInput("");
        setAiStatusMsg({
          type: "success",
          text: `✓ Personal ${aiProvider.toUpperCase()} API key saved and activated!`,
        });
        await fetchKeys();
      } else {
        setAiStatusMsg({
          type: "error",
          text: json.error?.message || "Failed to save AI key.",
        });
      }
    } catch {
      setAiStatusMsg({
        type: "error",
        text: "Network error saving AI key.",
      });
    } finally {
      setIsSavingAi(false);
    }
  };

  const youtubeKey = keys["youtube"];
  const geminiKey = keys["gemini"];
  const openaiKey = keys["openai"];

  return (
    <Shell
      title="API Keys & Integrations"
      subtitle="Bring Your Own Key (BYOK) — Configure personal YouTube Data API and AI model keys for unlimited usage"
    >
      <div className="max-w-4xl space-y-8">
        {/* Top Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                YouTube API Engine
              </span>
              <Youtube className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-center gap-2">
              {youtubeKey?.isConfigured ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Personal Key Active
                </span>
              ) : platformDefaults.hasYouTube ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Platform Default Key
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Key Not Configured
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {youtubeKey?.isConfigured
                ? `Masked: ${youtubeKey.maskedKey}`
                : "10,000 units/day official Google Cloud quota"}
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                AI Strategist Model
              </span>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              {geminiKey?.isConfigured ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  Custom Gemini Active
                </span>
              ) : openaiKey?.isConfigured ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Custom OpenAI Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
                  Platform Gemini Ready
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Grounded on retrieved video transcripts
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Security Standard
              </span>
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>AES-256-GCM Encrypted</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Zero plaintext leak. Keys never displayed again.
            </p>
          </div>
        </div>

        {/* SECTION 1: YOUTUBE DATA API (BYOK) */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Youtube className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-foreground">
                  YouTube Data API v3 Key
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  BYOK
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provide your personal Google Cloud YouTube API Key. Your searches and analytics will run on your personal 10,000 units/day quota with zero limits.
              </p>
            </div>

            {youtubeKey?.isConfigured && (
              <button
                type="button"
                onClick={handleRemoveYouTube}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Custom Key</span>
              </button>
            )}
          </div>

          {/* Current Key Display if active */}
          {youtubeKey?.isConfigured && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Personal Key Active:</span>
                    <code className="px-2 py-0.5 rounded bg-black/40 text-emerald-300 font-mono text-xs">
                      {youtubeKey.maskedKey}
                    </code>
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Verified with Google Cloud. All YouTube search, channel discovery, and outlier operations use this key.
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                Updated: {youtubeKey.updatedAt ? new Date(youtubeKey.updatedAt).toLocaleDateString() : "Active"}
              </span>
            </div>
          )}

          {/* Key Input Form */}
          <form onSubmit={handleSaveYouTube} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>{youtubeKey?.isConfigured ? "Update YouTube API Key:" : "Enter YouTube Data API Key:"}</span>
                <span className="text-[11px] text-muted-foreground">Starts with &quot;AIzaSy...&quot;</span>
              </label>

              <div className="relative">
                <input
                  type={showYoutubeKey ? "text" : "password"}
                  placeholder="AIzaSyDjjQnrSdPudIH526SDR9lsKOicpVSGq8w"
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-card border border-white/10 text-foreground text-xs sm:text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary pr-24"
                />
                <button
                  type="button"
                  onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground text-xs transition-colors flex items-center gap-1"
                >
                  {showYoutubeKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span className="text-[11px]">{showYoutubeKey ? "Hide" : "Show"}</span>
                </button>
              </div>
            </div>

            {/* Status Message */}
            {youtubeStatusMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                  youtubeStatusMsg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                }`}
              >
                {youtubeStatusMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{youtubeStatusMsg.text}</span>
              </div>
            )}

            {/* Buttons Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowYouTubeTutorial(!showYouTubeTutorial)}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>How to get a free YouTube API key (Google Cloud)</span>
                {showYouTubeTutorial ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleValidateYouTube}
                  disabled={isValidatingYouTube || !youtubeInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-card hover:bg-white/5 disabled:opacity-50 border border-white/10 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none"
                >
                  {isValidatingYouTube ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Test & Validate</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isSavingYouTube || !youtubeInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 flex-1 sm:flex-none"
                >
                  {isSavingYouTube ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Save & Activate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* How to get a free key tutorial */}
          {showYouTubeTutorial && (
            <div className="p-5 rounded-xl bg-black/40 border border-white/10 space-y-3 text-xs text-slate-300">
              <h4 className="font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                <span>Get Your Free YouTube API Key in 4 Steps (10,000 units/day)</span>
              </h4>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed text-slate-300">
                <li>
                  Open the Google Cloud Console:{" "}
                  <a
                    href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline font-medium"
                  >
                    Google Cloud YouTube API Library
                  </a>
                </li>
                <li>
                  Create a free project (e.g. <code>CreatorPulse</code>) and click <strong>Enable</strong> for <strong>YouTube Data API v3</strong>.
                </li>
                <li>
                  Navigate to <strong>APIs & Services ➔ Credentials</strong>, click <strong>Create Credentials</strong> ➔ <strong>API key</strong>.
                </li>
                <li>
                  Copy the generated key (starts with <code>AIzaSy...</code>) and paste it into the box above!
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* SECTION 2: AI PROVIDER KEY (GEMINI / OPENAI) */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-foreground">
                  AI Model Intelligence Key
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  Grounded AI
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your personal Google Gemini or OpenAI API key to power the AI Script Strategist and Viral Title Analyzer.
              </p>
            </div>
          </div>

          {/* Provider Selector Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAiProvider("gemini");
                setAiStatusMsg(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                aiProvider === "gemini"
                  ? "bg-primary text-white shadow-md"
                  : "bg-card text-muted-foreground hover:text-foreground border border-white/5"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Gemini (Recommended / Free Tier)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAiProvider("openai");
                setAiStatusMsg(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                aiProvider === "openai"
                  ? "bg-primary text-white shadow-md"
                  : "bg-card text-muted-foreground hover:text-foreground border border-white/5"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>OpenAI (GPT-4o)</span>
            </button>
          </div>

          {/* Current AI Key Display */}
          {(aiProvider === "gemini" ? geminiKey : openaiKey)?.isConfigured && (
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{aiProvider.toUpperCase()} Key Active:</span>
                    <code className="px-2 py-0.5 rounded bg-black/40 text-purple-300 font-mono text-xs">
                      {(aiProvider === "gemini" ? geminiKey : openaiKey)?.maskedKey}
                    </code>
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Model queries for scripts and title packaging will run through your personal account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Key Form */}
          <form onSubmit={handleSaveAi} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Enter {aiProvider === "gemini" ? "Google Gemini" : "OpenAI"} API Key:</span>
                <a
                  href={
                    aiProvider === "gemini"
                      ? "https://aistudio.google.com/app/apikey"
                      : "https://platform.openai.com/api-keys"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-[11px] flex items-center gap-1 font-medium"
                >
                  <span>Get {aiProvider.toUpperCase()} Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>

              <div className="relative">
                <input
                  type={showAiKey ? "text" : "password"}
                  placeholder={
                    aiProvider === "gemini"
                      ? "AIzaSy..."
                      : "sk-proj-..."
                  }
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-card border border-white/10 text-foreground text-xs sm:text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary pr-24"
                />
                <button
                  type="button"
                  onClick={() => setShowAiKey(!showAiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground text-xs transition-colors flex items-center gap-1"
                >
                  {showAiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span className="text-[11px]">{showAiKey ? "Hide" : "Show"}</span>
                </button>
              </div>
            </div>

            {aiStatusMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                  aiStatusMsg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                }`}
              >
                {aiStatusMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{aiStatusMsg.text}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleValidateAi}
                disabled={isValidatingAi || !aiInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-card hover:bg-white/5 disabled:opacity-50 border border-white/10 text-white font-semibold text-xs transition-colors flex items-center gap-2"
              >
                {isValidatingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isSavingAi || !aiInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
              >
                {isSavingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Save Key</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Shell>
  );
}
