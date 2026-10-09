"use client";

import React from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { DashboardView } from "./DashboardView";
import { LandingPage } from "@/components/landing/LandingPage";
import { Youtube } from "lucide-react";

export function AuthenticatedRoot() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0D14] flex flex-col items-center justify-center text-white gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 via-primary to-indigo-500 p-0.5 shadow-2xl shadow-primary/30 animate-pulse">
            <div className="w-full h-full bg-[#0A0D14] rounded-[14px] flex items-center justify-center">
              <Youtube className="w-8 h-8 text-rose-500 fill-rose-500" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <span>Opening Workspace...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <DashboardView />;
  }

  return <LandingPage />;
}
