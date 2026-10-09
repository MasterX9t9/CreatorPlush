import React from "react";
import { cn } from "@/lib/utils";
import { MetricDataType } from "@/lib/types";
import { ShieldCheck, Calculator, Sparkles, HelpCircle } from "lucide-react";

interface AttributionBadgeProps {
  type: MetricDataType;
  sourceText?: string;
  className?: string;
  showIcon?: boolean;
}

export function AttributionBadge({
  type,
  sourceText,
  className,
  showIcon = true,
}: AttributionBadgeProps) {
  switch (type) {
    case "official":
      return (
        <span
          title={sourceText || "Official YouTube data from authorized API"}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
            className
          )}
        >
          {showIcon && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
          Official
        </span>
      );

    case "calculated":
      return (
        <span
          title={sourceText || "Calculated from verified public data using documented formula"}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20",
            className
          )}
        >
          {showIcon && <Calculator className="w-3 h-3 text-blue-400" />}
          Calculated
        </span>
      );

    case "estimated":
      return (
        <span
          title={sourceText || "Estimated benchmark range based on public industry models"}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20",
            className
          )}
        >
          {showIcon && <HelpCircle className="w-3 h-3 text-amber-400" />}
          Estimated
        </span>
      );

    case "ai_derived":
      return (
        <span
          title={sourceText || "AI recommendation based on retrieved data"}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20",
            className
          )}
        >
          {showIcon && <Sparkles className="w-3 h-3 text-purple-400" />}
          AI Derived
        </span>
      );

    default:
      return null;
  }
}
