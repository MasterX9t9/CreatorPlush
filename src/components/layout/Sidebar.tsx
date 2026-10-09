"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  LayoutDashboard,
  Search,
  Users,
  Flame,
  KeyRound,
  Compass,
  BarChart3,
  Video,
  Zap,
  DollarSign,
  Type,
  Image as ImageIcon,
  FileText,
  Bot,
  Bookmark,
  Radio,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  Youtube,
  Shield,
  Layers,
  Scale,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "Research Engine",
    items: [
      { label: "YouTube Search", href: "/research/search", icon: Search },
      { label: "Channel Discovery", href: "/research/channels", icon: Users },
      { label: "Viral Outliers", href: "/research/outliers", icon: Flame, badge: "Core" },
      { label: "Keyword Intelligence", href: "/research/keywords", icon: KeyRound },
      { label: "Niche Finder", href: "/research/niches", icon: Compass },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Channel Analytics", href: "/analytics/channels", icon: BarChart3 },
      { label: "Channel Benchmark", href: "/analytics/compare", icon: Scale },
      { label: "Video Analytics", href: "/analytics/videos", icon: Video },
      { label: "Shorts Analytics", href: "/analytics/shorts", icon: Zap },
      { label: "Revenue & RPM", href: "/analytics/revenue", icon: DollarSign },
    ],
  },
  {
    title: "Content & AI",
    items: [
      { label: "Title Analyzer", href: "/content/titles", icon: Type },
      { label: "Thumbnail Studio", href: "/content/thumbnails", icon: ImageIcon },
      { label: "Transcripts", href: "/content/transcripts", icon: FileText },
      { label: "AI Creator Assistant", href: "/ai", icon: Bot, badge: "Grounded" },
    ],
  },
  {
    title: "Library & Tracking",
    items: [
      { label: "Swipe File", href: "/library/swipe", icon: Bookmark },
      { label: "Competitor Tracker", href: "/tracking/competitors", icon: Radio },
      { label: "Alerts & Triggers", href: "/tracking/alerts", icon: Bell },
    ],
  },
  {
    title: "Settings & System",
    items: [
      { label: "Connected Channels", href: "/settings/youtube", icon: Youtube },
      { label: "API Keys & BYOK", href: "/settings/api-keys", icon: KeyRound, badge: "BYOK" },
      { label: "Workspace & API", href: "/settings/workspace", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, workspace } = useAuth();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-xl flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border/80 gap-3">
        <div className="w-9 h-9 rounded-xl gradient-pulse flex items-center justify-center text-white font-black text-lg glow-rose shadow-md">
          CP
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
            CreatorPulse
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            YouTube Creator Intelligence
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {navSections.map((section) => {
          const isCollapsed = collapsedSections[section.title];
          return (
            <div key={section.title} className="space-y-1">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <span>{section.title}</span>
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 pt-1">
                  {section.items.map((item) => {
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                          isActive
                            ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={cn(
                              "w-4 h-4 transition-colors",
                              isActive
                                ? "text-primary"
                                : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground border border-white/10 group-hover:border-white/20">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Workspace Footer Indicator */}
      <div className="p-3 border-t border-border/80 bg-background/50">
        <Link
          href={isAuthenticated ? "/settings/workspace" : "/login"}
          className="flex items-center justify-between p-2 rounded-lg bg-card border border-white/5 hover:border-white/10 transition-colors block"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">
              {workspace ? workspace.name[0].toUpperCase() : "G"}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-foreground truncate">
                {workspace ? workspace.name : "Free Guest Workspace"}
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-emerald-400" />
                <span>{workspace ? `${workspace.planTier} Tier` : "Sign In to Save Data"}</span>
              </div>
            </div>
          </div>
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
        </Link>
      </div>
    </aside>
  );
}
