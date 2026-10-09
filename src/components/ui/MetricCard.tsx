import React from "react";
import { cn } from "@/lib/utils";
import { MetricDataType } from "@/lib/types";
import { AttributionBadge } from "./AttributionBadge";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  dataType: MetricDataType;
  sourceText?: string;
  icon?: LucideIcon;
  change?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function MetricCard({
  label,
  value,
  subValue,
  dataType,
  sourceText,
  icon: Icon,
  change,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-xl p-5 border transition-all hover:border-white/20 relative group",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <AttributionBadge type={dataType} sourceText={sourceText} />
          {Icon && (
            <div className="p-1.5 rounded-lg bg-white/5 text-muted-foreground group-hover:text-foreground transition-colors">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </div>
        {change && (
          <span
            className={cn(
              "text-xs font-semibold px-1.5 py-0.5 rounded",
              change.isPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400"
            )}
          >
            {change.isPositive ? "+" : ""}
            {change.value}
          </span>
        )}
      </div>

      {subValue && (
        <div className="mt-1 text-xs text-muted-foreground">
          {subValue}
        </div>
      )}
    </div>
  );
}
