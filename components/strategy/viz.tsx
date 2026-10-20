"use client";

/**
 * Small visual + form primitives for the strategy screens. Tokens only
 * (success/danger/chart-*), so everything works in light and dark.
 */
import { ReactNode, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, inputClass, type MeterTone } from "@/components/os/kit";
import { onTrack } from "./lib";

const STROKE: Record<MeterTone, string> = {
  primary: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  sprint: "text-sprint",
};

/** Trend line with an optional dashed target and on/off-track colour. */
export function Sparkline({
  values,
  target,
  direction = "up",
  width = 96,
  height = 28,
  className,
  tone,
  label,
}: {
  values: (number | null)[];
  target?: number | null;
  direction?: "up" | "down";
  width?: number;
  height?: number;
  className?: string;
  tone?: MeterTone;
  label?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const pts = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v != null);
  if (!pts.length) {
    return (
      <svg width={width} height={height} className={cn("text-muted-foreground/40", className)} aria-label={label ?? "No data yet"}>
        <line x1={2} y1={height - 4} x2={width - 2} y2={height - 4} stroke="currentColor" strokeDasharray="3 3" strokeWidth={1.5} />
      </svg>
    );
  }
  const pad = 3;
  const n = Math.max(2, values.length);
  const all = [...pts.map((p) => p.v), ...(target != null ? [target] : [])];
  const max = Math.max(...all);
  const min = Math.min(0, ...all);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (width - 2 * pad)) / (n - 1);
  const y = (v: number) => height - pad - ((v - min) / span) * (height - 2 * pad);
  const last = pts[pts.length - 1];
  const t: MeterTone = tone ?? (target != null ? (onTrack(last.v, target, direction) ? "success" : "danger") : "info");
  const line = pts.map((p) => `${x(p.i)},${y(p.v)}`).join(" ");
  const area = `${x(pts[0].i)},${height - pad} ${line} ${x(last.i)},${height - pad}`;
  return (
    <svg width={width} height={height} className={cn(STROKE[t], className)} role="img" aria-label={label ?? "Trend"}>
      <defs>
        <linearGradient id={`sg${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.22} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      {target != null && (
        <line
          x1={pad}
          x2={width - pad}
          y1={y(target)}
          y2={y(target)}
          className="stroke-muted-foreground/50"
          strokeDasharray="2 3"
          strokeWidth={1}
        />
      )}
      {pts.length > 1 && <polygon points={area} fill={`url(#sg${gid})`} />}
      {pts.length > 1 && (
        <polyline points={line} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      )}
      <circle cx={x(last.i)} cy={y(last.v)} r={2.6} fill="currentColor" />
    </svg>
  );
}

/** Semicircle gauge 0–100 (offer value score). */
export function Gauge({
  value,
  tone = "primary",
  size = 200,
  label,
  sub,
}: {
  value: number;
  tone?: MeterTone;
  size?: number;
  label?: ReactNode;
  sub?: ReactNode;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = size * 0.4;
  const cx = size / 2;
  const cy = size * 0.52;
  const sw = size * 0.075;
  const len = Math.PI * r;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const ang = Math.PI * (1 - v / 100);
  const nx = cx + (r - sw * 1.6) * Math.cos(ang);
  const ny = cy - (r - sw * 1.6) * Math.sin(ang);
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.58} viewBox={`0 0 ${size} ${size * 0.58}`} className={STROKE[tone]} role="img" aria-label={`Score ${Math.round(v)} of 100`}>
        <path d={arc} fill="none" className="stroke-muted" strokeWidth={sw} strokeLinecap="round" />
        <path
          d={arc}
          fill="none"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - v / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        {[0, 25, 50, 75, 100].map((t) => {
          const a = Math.PI * (1 - t / 100);
          const r1 = r + sw * 0.9;
          const r2 = r + sw * 1.3;
          return (
            <line
              key={t}
              x1={cx + r1 * Math.cos(a)}
              y1={cy - r1 * Math.sin(a)}
              x2={cx + r2 * Math.cos(a)}
              y2={cy - r2 * Math.sin(a)}
              className="stroke-muted-foreground/50"
              strokeWidth={1.5}
            />
          );
        })}
        <line x1={cx} y1={cy} x2={nx} y2={ny} className="stroke-foreground transition-all duration-700" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={sw * 0.55} className="fill-foreground" />
      </svg>
      <div className="-mt-1 text-center">
        <div className="text-3xl font-semibold tabular-nums tracking-tight">{Math.round(v)}</div>
        {label && <div className={cn("text-xs font-semibold uppercase tracking-wide", STROKE[tone])}>{label}</div>}
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

/** Tiny vertical bars (e.g. weekly cadence) with an optional target line. */
export function MiniBars({
  values,
  target,
  height = 44,
  labels,
  className,
}: {
  values: number[];
  target?: number;
  height?: number;
  labels?: string[];
  className?: string;
}) {
  const max = Math.max(1, target ?? 0, ...values);
  return (
    <div className={cn("relative", className)}>
      <div className="flex items-end gap-1" style={{ height }}>
        {values.map((v, i) => {
          const hit = target != null && target > 0 ? v >= target : v > 0;
          return (
            <div
              key={i}
              title={labels?.[i] ? `${labels[i]}: ${v}` : String(v)}
              className={cn("flex-1 rounded-sm transition-[height] duration-500", hit ? "bg-success" : v > 0 ? "bg-chart-1/70" : "bg-muted")}
              style={{ height: `${Math.max(6, (v / max) * 100)}%` }}
            />
          );
        })}
      </div>
      {target != null && target > 0 && (
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/50"
          style={{ bottom: `${(target / max) * height}px` }}
        />
      )}
    </div>
  );
}

/** Big KPI tile used in cockpit strips. */
export function Kpi({
  label,
  value,
  sub,
  tone,
  icon: Icon,
  href,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "success" | "warning" | "danger" | "info";
  icon?: LucideIcon;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
      </div>
      <div
        className={cn(
          "mt-2 truncate text-[1.7rem] font-semibold leading-none tracking-tight tabular-nums",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
          tone === "info" && "text-info",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 truncate text-xs text-muted-foreground">{sub}</div>}
    </>
  );
  const cls = cn("block min-w-0 rounded-xl border border-border bg-card p-4 shadow-card", href && "transition-colors hover:border-ring/60", className);
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/**
 * Clickable board/list card (same look as the kit `ItemCard`) that also works
 * from the keyboard: focusable, Enter/Space activate it. Keys pressed on a
 * nested control (a menu or button inside the card) are left to that control.
 */
export function CardButton({
  children,
  onClick,
  className,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "cursor-pointer rounded-lg border border-border bg-card p-3 text-sm shadow-card outline-none transition-colors hover:border-ring/60 hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** "Open →" deep link used in card headers. */
export function DeepLink({ href, children = "Open" }: { href: string; children?: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
      {children}
      <ArrowUpRight className="h-3 w-3" />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Autosaving fields (save on blur when changed)
// ─────────────────────────────────────────────────────────────────────────

export function AutoText({
  value,
  onSave,
  placeholder,
  multiline,
  rows = 3,
  className,
  ariaLabel,
}: {
  value: string | undefined;
  onSave: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState(value ?? "");
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value ?? "");
  }, [value]);
  const commit = () => {
    focused.current = false;
    if (draft !== (value ?? "")) onSave(draft);
  };
  const common = {
    value: draft,
    placeholder,
    "aria-label": ariaLabel,
    onFocus: () => (focused.current = true),
    onBlur: commit,
  };
  return multiline ? (
    <textarea
      {...common}
      rows={rows}
      onChange={(e) => setDraft(e.target.value)}
      className={cn(inputClass, "w-full resize-y py-2 leading-relaxed", className)}
    />
  ) : (
    <input
      {...common}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className={cn(inputClass, "h-9 w-full", className)}
    />
  );
}

export function AutoNumber({
  value,
  onSave,
  placeholder,
  className,
  ariaLabel,
  min,
  autoFocus,
}: {
  value: number | undefined | null;
  onSave: (v: number | null) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  min?: number;
  autoFocus?: boolean;
}) {
  const [draft, setDraft] = useState(value == null ? "" : String(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value == null ? "" : String(value));
  }, [value]);
  const commit = () => {
    focused.current = false;
    const t = draft.trim();
    const next = t === "" ? null : Number(t);
    if (next != null && !Number.isFinite(next)) {
      setDraft(value == null ? "" : String(value));
      return;
    }
    if (next !== (value ?? null)) onSave(next);
  };
  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      autoFocus={autoFocus}
      value={draft}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onFocus={() => (focused.current = true)}
      onBlur={commit}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className={cn(inputClass, "h-9 w-full tabular-nums", className)}
    />
  );
}

/**
 * Same look as the kit `Field`, but a <div> instead of a <label>. Use it around
 * button groups (ChipPicker, Segmented, ListEditor): a <label> forwards clicks
 * on its text to the first nested button, silently toggling a chip/segment.
 */
export function FieldGroup({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

/**
 * Wrap a kit `Segmented` that sits inside a <form> (belt and braces: its
 * buttons are type="button" now, but this also blocks any untyped child).
 */
export function NoSubmit({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className} onClick={(e) => e.preventDefault()}>
      {children}
    </div>
  );
}

/** Multi-select chips (channels, states…). */
export function ChipPicker({
  options,
  value,
  onChange,
  className,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={cn(
              "h-7 rounded-full border px-3 text-xs font-medium transition-colors",
              on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/** Labelled 1–10 slider. */
export function ScoreSlider({
  label,
  hint,
  value,
  onChange,
  onCommit,
  invert,
  min = 1,
  max = 10,
  step = 1,
  suffix,
}: {
  label: ReactNode;
  hint?: ReactNode;
  value: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
  invert?: boolean; // higher = worse (time, effort)
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const good = invert ? value <= (max + min) / 2 - 1 : value >= (max + min) / 2 + 1;
  const bad = invert ? value >= (max + min) / 2 + 2 : value <= (max + min) / 2 - 2;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className={cn("text-sm font-semibold tabular-nums", good && "text-success", bad && "text-danger")}>
          {value}
          {suffix ?? `/${max}`}
        </span>
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        onBlur={onCommit}
        className="mt-1.5 w-full accent-[var(--foreground)]"
        aria-label={typeof label === "string" ? label : undefined}
      />
    </div>
  );
}
