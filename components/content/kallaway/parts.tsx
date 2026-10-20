"use client";

import { ReactNode, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, Info, Lightbulb } from "lucide-react";
import { CheckCircle, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import type { LintIssue } from "@/lib/kallaway";
import { errMsg } from "../model";

/** Run an AI action and keep loading / error / data for an AiBox. */
export function useAiTask<T>() {
  const [state, setState] = useState<{ loading: boolean; error: string | null; data: T | null } | null>(null);
  const run = async (fn: () => Promise<T>) => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await fn();
      setState({ loading: false, error: null, data });
    } catch (e) {
      setState({ loading: false, error: errMsg(e), data: null });
    }
  };
  return { state, run, clear: () => setState(null) };
}

export const copyText = (text: string) => {
  void navigator.clipboard
    ?.writeText(text)
    .then(() => toast("Copied"))
    .catch(() => toast("Couldn't copy", { tone: "warning" }));
};

/** A tickable checklist row: round check + label + hint. */
export function CheckRow({
  checked,
  onToggle,
  label,
  hint,
  aside,
  className,
  ariaLabel,
}: {
  checked: boolean;
  onToggle: () => void;
  label: ReactNode;
  hint?: ReactNode;
  aside?: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    // The round check is the keyboard/screen-reader control; the row is a
    // bigger mouse target for the same toggle.
    <div onClick={onToggle} className={cn("flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/50", className)}>
      <span className="mt-px">
        <CheckCircle size="sm" checked={checked} onClick={onToggle} label={ariaLabel ?? (typeof label === "string" ? label : undefined)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm leading-tight", checked && "text-muted-foreground")}>{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{hint}</span>}
      </span>
      {aside}
    </div>
  );
}

/** Toggle chip (single or multi select). `action` = a one-shot button, not a toggle. */
export function Pill({
  on,
  onClick,
  children,
  title,
  className,
  action,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  action?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={action ? undefined : on}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
        on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-ring/60 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** A selectable card (archetype, hook format, structure). */
export function PickCard({
  on,
  onClick,
  title,
  sub,
  children,
  badge,
}: {
  on: boolean;
  onClick: () => void;
  title: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors",
        on ? "border-foreground bg-accent/60 ring-1 ring-foreground" : "border-border hover:border-ring/60 hover:bg-accent/40",
      )}
    >
      <span className="flex w-full items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
        {badge}
        {on && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      </span>
      {sub && <span className="text-[11px] leading-snug text-muted-foreground">{sub}</span>}
      {children}
    </button>
  );
}

const NOTE_TONE = {
  info: { cls: "bg-info-soft text-info", icon: Info },
  warning: { cls: "bg-warning-soft text-warning", icon: AlertTriangle },
  success: { cls: "bg-success-soft text-success", icon: CheckCircle2 },
  muted: { cls: "bg-muted text-muted-foreground", icon: Lightbulb },
} as const;

/** Soft coloured note (meaning only: info / warning / success). */
export function Note({
  tone = "muted",
  icon,
  children,
  className,
}: {
  tone?: keyof typeof NOTE_TONE;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  const t = NOTE_TONE[tone];
  const I = icon ?? t.icon;
  return (
    <div className={cn("flex items-start gap-2 rounded-lg px-3 py-2 text-xs leading-relaxed", t.cls, className)}>
      <I className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Small sub-heading inside a step. */
export function SubHead({ children, hint, right, className }: { children: ReactNode; hint?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-3 gap-y-1", className)}>
      <div className="min-w-0">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</h4>
        {hint && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

const LINT_ICON = { warn: AlertTriangle, tip: Lightbulb, good: CheckCircle2 } as const;
const LINT_TONE = { warn: "text-warning", tip: "text-info", good: "text-success" } as const;

/** Linter output as warn / tip / good rows. */
export function LintList({ issues, className }: { issues: LintIssue[]; className?: string }) {
  if (!issues.length) return null;
  const order = { warn: 0, tip: 1, good: 2 } as const;
  return (
    <ul className={cn("space-y-1", className)}>
      {[...issues]
        .sort((a, b) => order[a.kind] - order[b.kind])
        .map((i, n) => {
          const I = LINT_ICON[i.kind];
          return (
            <li key={n} className="flex items-start gap-2 text-xs leading-snug">
              <I className={cn("mt-px h-3.5 w-3.5 shrink-0", LINT_TONE[i.kind])} aria-hidden />
              <span className="min-w-0">{i.text}</span>
            </li>
          );
        })}
    </ul>
  );
}

/** Tiny "n / total" counter with meaning colour once the target is met. */
export function Count({ n, of, target, className }: { n: number; of?: number; target?: number; className?: string }) {
  const met = n >= (target ?? of ?? Infinity);
  return (
    <span className={cn("text-[11px] font-medium tabular-nums", met ? "text-success" : "text-muted-foreground", className)}>
      {n}
      {of != null && `/${of}`}
    </span>
  );
}
