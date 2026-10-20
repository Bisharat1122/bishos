"use client";

import { ReactNode } from "react";
import { Briefcase, ChevronLeft, ChevronRight, Layers, User } from "lucide-react";
import { Chip, Segmented, buttonVariants, cn } from "@/components/os/kit";
import { addMonthsYm, fmtMonth, type Money, type Scope, type ScopeFilter } from "./lib";

/** All / Personal / Business. */
export function ScopeSwitch({
  value,
  onChange,
  size = "sm",
  allowAll = true,
}: {
  value: ScopeFilter;
  onChange: (s: ScopeFilter) => void;
  size?: "sm" | "md";
  allowAll?: boolean;
}) {
  const opts: { value: ScopeFilter; label: string; icon: typeof Layers }[] = [
    ...(allowAll ? [{ value: "all" as const, label: "All", icon: Layers }] : []),
    { value: "personal", label: "Personal", icon: User },
    { value: "business", label: "Business", icon: Briefcase },
  ];
  return <Segmented size={size} value={value} onChange={onChange} options={opts} />;
}

/** Personal / Business only (for forms). */
export function ScopePick({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  return (
    <Segmented
      size="sm"
      value={value}
      onChange={onChange}
      options={[
        { value: "personal", label: "Personal", icon: User },
        { value: "business", label: "Business", icon: Briefcase },
      ]}
    />
  );
}

export function ScopeChip({ scope, className }: { scope: Scope | "both"; className?: string }) {
  if (scope === "both") return null;
  const I = scope === "business" ? Briefcase : User;
  return (
    <Chip tone="muted" className={cn("gap-1", className)}>
      <I className="h-3 w-3" aria-hidden />
      {scope === "business" ? "Business" : "Personal"}
    </Chip>
  );
}

/** ‹ October 2026 › with a "This month" reset. */
export function MonthPicker({ value, onChange, current }: { value: string; onChange: (m: string) => void; current: string }) {
  return (
    <div className="inline-flex items-center gap-1">
      <button type="button" aria-label="Previous month" onClick={() => onChange(addMonthsYm(value, -1))} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[8.5rem] text-center text-sm font-medium tabular-nums">{fmtMonth(value)}</span>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => onChange(addMonthsYm(value, 1))}
        disabled={value >= current}
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {value !== current && (
        <button type="button" onClick={() => onChange(current)} className={buttonVariants({ variant: "outline", size: "sm" })}>
          This month
        </button>
      )}
    </div>
  );
}

/** A stat tile: label, value, optional delta line. */
export function StatTile({
  label,
  value,
  sub,
  tone,
  icon: Icon,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "success" | "warning" | "danger" | "info";
  icon?: typeof Layers;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-xl border border-border bg-card p-4 shadow-card", className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
        {label}
      </div>
      <div
        title={typeof value === "string" || typeof value === "number" ? String(value) : undefined}
        className={cn(
          "mt-2 truncate text-xl font-semibold leading-none tracking-tight sm:text-2xl",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
          tone === "info" && "text-info",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 truncate text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

/** "+12% vs Sep" with direction-aware colour (up can be good or bad). */
export function Delta({ cur, prev, goodWhenUp, label }: { cur: number; prev: number; goodWhenUp: boolean; label: string }) {
  if (prev <= 0 && cur <= 0) return <span>Nothing logged yet</span>;
  if (prev <= 0) return <span>First month with data</span>;
  const p = Math.round(((cur - prev) / prev) * 100);
  if (p === 0) return <span>Same as {label}</span>;
  const good = p > 0 === goodWhenUp;
  return (
    <span>
      <span className={cn("font-medium", good ? "text-success" : "text-warning")}>
        {p > 0 ? "▲" : "▼"} {Math.abs(p)}%
      </span>{" "}
      vs {label}
    </span>
  );
}

/** Budget tone: green → warning at 80% → danger above 100%. */
export function budgetTone(pct: number): "success" | "warning" | "danger" {
  if (pct > 100) return "danger";
  if (pct >= 80) return "warning";
  return "success";
}

const FILL: Record<string, string> = { success: "bg-success", warning: "bg-warning", danger: "bg-danger" };

/**
 * Bullet bar: the track spans max(budget, spent); the fill is what you spent
 * (tone by % used) and a tick marks the budget line.
 */
export function BudgetBar({ spent, budget, className }: { spent: number; budget: number; className?: string }) {
  const scale = Math.max(budget, spent, 1);
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const tone = budgetTone(pct);
  return (
    <div className={cn("relative h-2 w-full rounded-full bg-muted", className)} role="img" aria-label={`${Math.round(pct)}% of budget used`}>
      <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", FILL[tone])} style={{ width: `${Math.min(100, (spent / scale) * 100)}%` }} />
      {spent > budget && budget > 0 && (
        <span className="absolute -top-1 h-4 w-0.5 rounded-full bg-foreground" style={{ left: `calc(${(budget / scale) * 100}% - 1px)` }} aria-hidden />
      )}
    </div>
  );
}

/** Signed amount text: +1,200 (income) / −45 (expense) / 300 (transfer). */
export function SignedAmount({ type, amount, money, className }: { type: "income" | "expense" | "transfer"; amount: number; money: Money; className?: string }) {
  return (
    <span className={cn("whitespace-nowrap font-semibold tabular-nums", type === "income" && "text-success", className)}>
      {type === "income" ? "+" : type === "expense" ? "−" : ""}
      {money.fmt(amount)}
    </span>
  );
}

export function SkeletonGrid({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-24" />
      ))}
    </div>
  );
}
