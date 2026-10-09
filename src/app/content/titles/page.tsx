"use client";

import React, { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AttributionBadge } from "@/components/ui/AttributionBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  Type,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

interface TitleEvaluation {
  title: string;
  charCount: number;
  wordCount: number;
  overallScore: number;
  lengthStatus: "optimal" | "short" | "long";
  emotionalTone: string;
  hasCuriosityHook: boolean;
  hasPowerWords: boolean;
  strengths: string[];
  weaknesses: string[];
  alternativeTitles: string[];
}

function evaluateTitleText(title: string): TitleEvaluation {
  const chars = title.length;
  const words = title.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const powerWordList = [
    "secret", "revealed", "how to", "why", "stop", "never", "best", "worst",
    "insane", "truth", "every", "simple", "proven", "mistake", "step-by-step"
  ];
  const curiosityHooks = ["why", "how", "what happened", "the reason", "don't", "truth"];

  const lower = title.toLowerCase();
  const hasPower = powerWordList.some((pw) => lower.includes(pw));
  const hasCuriosity = curiosityHooks.some((hook) => lower.includes(hook));

  let score = 50;

  // Length scoring (45 - 65 chars is ideal for mobile truncation)
  let lengthStatus: "optimal" | "short" | "long" = "optimal";
  if (chars >= 40 && chars <= 65) {
    score += 25;
    lengthStatus = "optimal";
  } else if (chars < 40) {
    score += 15;
    lengthStatus = "short";
  } else {
    score += 10;
    lengthStatus = "long";
  }

  if (hasPower) score += 15;
  if (hasCuriosity) score += 10;

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (chars >= 40 && chars <= 65) {
    strengths.push("Ideal length (40–65 chars) prevents truncation on YouTube mobile app.");
  } else if (chars > 65) {
    weaknesses.push(`Length (${chars} characters) will likely be truncated on mobile feed cards (cutoff ~60 chars).`);
  } else {
    weaknesses.push(`Short title (${chars} chars) leaves room for an additional curiosity or specificity hook.`);
  }

  if (hasPower) {
    strengths.push("Contains high-impact action or curiosity phrasing that stimulates click intent.");
  } else {
    weaknesses.push("Lacks emotional trigger words (e.g. 'Why', 'Mistake', 'Secret', 'Proven').");
  }

  if (words.some((w) => w === w.toUpperCase() && w.length > 2)) {
    strengths.push("Strategic uppercase emphasis draws visual attention in browse feed.");
  }

  const alternativeTitles = [
    `Why ${title.replace(/how to /i, "")} (And What to Do Instead)`,
    `The Truth About ${title.replace(/the /i, "")}`,
    `Stop Making This Mistake With ${words.slice(0, 3).join(" ")}`,
  ];

  return {
    title,
    charCount: chars,
    wordCount,
    overallScore: Math.min(score, 98),
    lengthStatus,
    emotionalTone: hasCuriosity ? "High Curiosity & Urgency" : "Informative / Descriptive",
    hasCuriosityHook: hasCuriosity,
    hasPowerWords: hasPower,
    strengths,
    weaknesses,
    alternativeTitles,
  };
}

export default function TitleAnalyzerPage() {
  const [inputTitle, setInputTitle] = useState("");
  const [evaluation, setEvaluation] = useState<TitleEvaluation | null>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTitle.trim()) return;
    setEvaluation(evaluateTitleText(inputTitle.trim()));
  };

  return (
    <Shell
      title="YouTube Title Intelligence"
      subtitle="Lexical, mobile-truncation, curiosity hook, and power-word evaluation"
    >
      {/* Title Input Form */}
      <form onSubmit={handleAnalyze} className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Type className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              placeholder="Paste or write your video title (e.g. 'Why 99% of Developers Fail at Solo SaaS')..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!inputTitle.trim()}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-pulse-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyze Title</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Character count: <strong className="text-foreground">{inputTitle.length}</strong> (Recommended: 45–65 characters)</span>
          <AttributionBadge type="calculated" sourceText="Lexical & UX mobile layout heuristics" />
        </div>
      </form>

      {/* Analysis Presentation */}
      {evaluation && (
        <div className="space-y-6 pt-2">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Title Quality Score"
              value={`${evaluation.overallScore} / 100`}
              subValue="Lexical curiosity & clarity score"
              dataType="calculated"
              sourceText="Based on mobile length and power words"
              icon={Sparkles}
            />
            <MetricCard
              label="Character Length"
              value={`${evaluation.charCount} chars`}
              subValue={evaluation.lengthStatus === "optimal" ? "Safe from mobile truncation" : "May truncate on mobile"}
              dataType="calculated"
              sourceText="YouTube feed card character limits"
              icon={Type}
            />
            <MetricCard
              label="Emotional Tone"
              value={evaluation.hasCuriosityHook ? "High Curiosity" : "Descriptive"}
              subValue={evaluation.emotionalTone}
              dataType="calculated"
              sourceText="Curiosity & power pattern analysis"
              icon={Lightbulb}
            />
            <MetricCard
              label="Power Words"
              value={evaluation.hasPowerWords ? "Detected" : "None"}
              subValue={evaluation.hasPowerWords ? "Action trigger present" : "Consider adding strong verbs"}
              dataType="calculated"
              sourceText="Vocabulary trigger catalog"
              icon={CheckCircle2}
            />
          </div>

          {/* Strengths & Weaknesses Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Detected Strengths
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-300">
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Improvement Opportunities
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {evaluation.weaknesses.map((w, i) => (
                  <li key={i} className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-300">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Alternative Variations */}
          <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              Alternative Title Frameworks to Test
            </h3>
            <div className="space-y-2">
              {evaluation.alternativeTitles.map((alt, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between gap-4 text-xs"
                >
                  <span className="font-medium text-foreground">{alt}</span>
                  <button
                    onClick={() => {
                      setInputTitle(alt);
                      setEvaluation(evaluateTitleText(alt));
                    }}
                    className="inline-flex items-center gap-1 text-primary font-semibold hover:underline shrink-0"
                  >
                    <span>Use & Re-evaluate</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
