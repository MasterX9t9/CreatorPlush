"use client";

import React, { useState } from "react";
import {
  Bell,
  Search,
  Globe,
  Youtube,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

interface TopbarProps {
  title?: string;
  subtitle?: string;
}

export function Topbar({
  title = "Intelligence Hub",
  subtitle = "Real-time YouTube channel and video performance",
}: TopbarProps) {
  const [locale, setLocale] = useState<"en" | "km">("en");
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Context */}
      <div>
        <h1 className="text-base font-semibold text-foreground tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      {/* Action & Status Badges */}
      <div className="flex items-center gap-3">
        {/* Real YouTube Quota & Status Pill */}
        <div
          title="Official YouTube Data API v3 daily quota consumption"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs font-medium text-muted-foreground"
        >
          <Cpu className="w-3.5 h-3.5 text-primary" />
          <span>API Quota:</span>
          <span className="font-semibold text-foreground">0 / 10,000 units</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Channel Status */}
        <Link
          href="/settings/youtube"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition-colors"
        >
          <Youtube className="w-3.5 h-3.5 text-rose-500" />
          <span>Channel Sync</span>
        </Link>

        {/* Language Selector (en / km) */}
        <div className="relative">
          <button
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="uppercase font-semibold">{locale}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {isLangMenuOpen && (
            <div className="absolute right-0 mt-2 w-36 glass-panel rounded-lg shadow-xl p-1 text-xs border border-white/10 z-50">
              <button
                onClick={() => {
                  setLocale("en");
                  setIsLangMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/10 flex items-center justify-between"
              >
                <span>English (US)</span>
                {locale === "en" && <CheckCircle2 className="w-3 h-3 text-primary" />}
              </button>
              <button
                onClick={() => {
                  setLocale("km");
                  setIsLangMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/10 flex items-center justify-between"
              >
                <span>ភាសាខ្មែរ (Khmer)</span>
                {locale === "km" && <CheckCircle2 className="w-3 h-3 text-primary" />}
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          title="System notifications"
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors relative"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold border border-white/10">
          U
        </div>
      </div>
    </header>
  );
}
