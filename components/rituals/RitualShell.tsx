"use client";

import { ReactNode, useEffect } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, buttonVariants } from "@/components/os/kit";

/** Full-screen, calm, one-step-at-a-time ritual frame. */
export function RitualShell({
  kicker,
  kickerIcon: KIcon,
  steps,
  current,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  onClose,
  children,
  hideFooter,
  busy,
}: {
  kicker: string;
  kickerIcon: LucideIcon;
  steps: { key: string; label: string }[];
  current: number;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: ReactNode;
  nextDisabled?: boolean;
  onClose: () => void;
  children: ReactNode;
  hideFooter?: boolean;
  busy?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={kicker} className="fixed inset-0 z-[70] flex flex-col bg-background">
      {/* top bar */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium">
          <KIcon className="h-3.5 w-3.5" /> {kicker}
        </span>
        <div className="mx-2 hidden flex-1 items-center gap-1 sm:flex" aria-label="Progress">
          {steps.map((s, i) => (
            <div key={s.key} className="flex flex-1 flex-col gap-1" title={s.label}>
              <div className={cn("h-1 rounded-full transition-colors", i < current ? "bg-primary" : i === current ? "bg-primary/60" : "bg-muted")} />
            </div>
          ))}
        </div>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground sm:ml-0">
          {Math.min(current + 1, steps.length)}/{steps.length} · {steps[current]?.label}
        </span>
        <button onClick={onClose} aria-label="Close" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="h-1 bg-muted sm:hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${((current + 1) / steps.length) * 100}%` }} />
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto">
        <div key={current} className="os-rise mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </div>
      </div>

      {/* footer */}
      {!hideFooter && (
        <div className="shrink-0 border-t border-border bg-background/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2">
            <button onClick={onBack} disabled={!onBack || current === 0} className={buttonVariants({ variant: "ghost" })}>
              <ArrowLeft /> Back
            </button>
            <button onClick={onNext} disabled={nextDisabled || busy} className={cn(buttonVariants({ size: "lg" }), "min-w-[9rem]")}>
              {nextLabel} {typeof nextLabel === "string" && <ArrowRight />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StepTitle({ title, hint }: { title: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {hint && <p className="mt-2 text-sm text-muted-foreground sm:text-base">{hint}</p>}
    </div>
  );
}

/** 1–5 tap scale with emoji faces. */
export function FaceScale({
  value,
  onChange,
  faces = ["😫", "😕", "😐", "🙂", "🤩"],
  labels,
}: {
  value?: number;
  onChange: (v: number) => void;
  faces?: string[];
  labels?: string[];
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {faces.map((f, i) => {
        const v = i + 1;
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border py-3 transition",
              active ? "os-pop border-primary bg-primary/5 shadow-xs" : "border-border hover:bg-accent",
            )}
          >
            <span className={cn("text-2xl transition", !active && value != null && "opacity-50 grayscale")}>{f}</span>
            {labels && <span className="text-[11px] text-muted-foreground">{labels[i]}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Row of choice buttons (decisions on leftovers etc). */
export function ChoiceRow<T extends string>({
  value,
  options,
  onChange,
}: {
  value?: T;
  options: { value: T; label: string; tone?: "danger" | "success" }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium transition",
            value === o.value
              ? o.tone === "danger"
                ? "border-danger bg-danger-soft text-danger"
                : o.tone === "success"
                  ? "border-success bg-success-soft text-success"
                  : "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
