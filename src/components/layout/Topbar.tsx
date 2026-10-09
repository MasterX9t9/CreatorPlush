"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Search,
  Globe,
  Youtube,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  LogOut,
  User,
  Settings,
  LogIn,
  Key,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";

interface TopbarProps {
  title?: string;
  subtitle?: string;
}

export function Topbar({
  title = "Intelligence Hub",
  subtitle = "Real-time YouTube channel and video performance",
}: TopbarProps) {
  const { user, workspace, isAuthenticated, logout } = useAuth();
  const [locale, setLocale] = useState<"en" | "km">("en");
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [quotaUsed, setQuotaUsed] = useState<number>(0);

  useEffect(() => {
    fetch("/api/v1/youtube/quota")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setQuotaUsed(json.data.usedUnits);
        }
      })
      .catch(() => {});
  }, []);

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
          <span className="font-semibold text-foreground">{quotaUsed} / 10,000 units</span>
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

        {/* User Account / Session Profile */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold border border-white/20 shadow-sm">
                {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-2xl p-2 border border-white/10 z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-white/5 space-y-0.5">
                  <p className="text-xs font-bold text-foreground truncate">
                    {user.name || user.email.split("@")[0]}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate font-mono">
                    {user.email}
                  </p>
                  {workspace && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/20 text-primary uppercase">
                        {workspace.planTier}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {workspace.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="py-1">
                  <Link
                    href="/settings/workspace"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Workspace Settings</span>
                  </Link>
                  <Link
                    href="/settings/youtube"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Youtube className="w-3.5 h-3.5 text-rose-400" />
                    <span>Connected Channels</span>
                  </Link>
                  <Link
                    href="/settings/api-keys"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>API Keys & BYOK</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-white/5">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-rose-500/20 text-rose-300 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-foreground transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/signup"
              className="px-3 py-1.5 rounded-xl bg-primary hover:bg-pulse-600 text-white text-xs font-semibold shadow-sm transition-all hidden sm:inline-flex"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
