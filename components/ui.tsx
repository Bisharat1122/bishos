"use client";

import { ReactNode, useEffect, useState } from "react";
import { Inbox, Maximize2, Minimize2, Plus, Sparkles, X } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";
import { ProfileButton } from "./ProfileButton";
import { FocusTimerPill } from "./focus/FocusTimerPill";
import { DayButton } from "./rituals/RitualHost";
import { CaptureButton } from "./os/CaptureButton";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 text-card-foreground shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** bishOS mark + wordmark. */
export function Logo({ showWordmark = true, className }: { showWordmark?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="h-4 w-4" />
      </span>
      {showWordmark && <span className="text-[17px] font-semibold tracking-tight text-foreground">bishOS</span>}
    </span>
  );
}

export function Topbar({ action }: { title?: string; action?: ReactNode }) {
  const [fs, setFs] = useState(false);

  useEffect(() => {
    const onChange = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    // Some browsers (iOS Safari) don't implement the Fullscreen API — never throw.
    if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:px-6 lg:px-8">
      <GlobalSearch />

      {/* Right-aligned actions */}
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <DayButton />
        <CaptureButton />
        {action}
        <FocusTimerPill />
        <button
          onClick={toggleFullscreen}
          title={fs ? "Exit full screen" : "Full screen"}
          aria-label={fs ? "Exit full screen" : "Full screen"}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-muted-foreground")}
        >
          {fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
        <NotificationBell />
        <ProfileButton />
      </div>
    </header>
  );
}

/** A primary "Add" button intended for the Topbar `action` slot. */
export function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} aria-label={label} className={buttonVariants()}>
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/** Centered modal dialog. */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  variant = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  variant?: "default" | "primary";
}) {
  return (
    <Card className={cn("flex flex-col gap-3 p-4", variant === "primary" && "bg-muted/50")}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground">
            {icon}
          </span>
        )}
      </div>
      <div className="text-[1.625rem] font-semibold leading-none tracking-tight tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

/** Lightweight CSS bar chart. */
export function WeeklyBars({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-48 items-end justify-between gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-full w-full items-end justify-center">
            <div
              className="w-full max-w-[2.5rem] rounded-md bg-chart-1 transition-all"
              style={{ height: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="h-5 w-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {hint && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
