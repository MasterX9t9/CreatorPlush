import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, HelpCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = HelpCircle,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-xl p-8 text-center flex flex-col items-center justify-center border border-white/5",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-pulse-600 transition-colors shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
