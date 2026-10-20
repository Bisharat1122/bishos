"use client";

import { ReactNode } from "react";
import { Sparkles, X } from "lucide-react";
import { buttonVariants, cn } from "@/components/os/kit";

/** Container for an AI proposal: nothing is saved until the user accepts. */
export function AiBox({
  title,
  loading,
  error,
  onClose,
  onRetry,
  children,
  className,
}: {
  title: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onRetry?: () => void;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("os-rise rounded-xl border border-border bg-muted/30 p-3", className)}>
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className={cn("h-3.5 w-3.5 text-muted-foreground", loading && "animate-pulse")} />
        <span className="text-xs font-semibold">{title}</span>
        <span className="text-[11px] text-muted-foreground">· AI proposal, nothing saved until you accept</span>
        <button aria-label="Dismiss" onClick={onClose} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "ml-auto size-7")}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      ) : error ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
          <span className="min-w-0 flex-1">{error}</span>
          {onRetry && (
            <button onClick={onRetry} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}>
              Try again
            </button>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
