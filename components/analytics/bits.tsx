"use client";

import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtYmd } from "@/lib/day";

// ─────────────────────────────────────────────────────────────────────────
// 60-day short-form lab: 8 weekly columns, done vs ramp target
// ─────────────────────────────────────────────────────────────────────────

export type Lab = {
  brand: "personal" | "company";
  start: string;
  week: number;
  weeks: { n: number; start: string; target: number; done: number }[];
  total: number;
  target: number;
};

export function LabProgress({ labs }: { labs: Lab[] }) {
  return (
    <div className="space-y-5">
      {labs.map((lab) => {
        const color = lab.brand === "personal" ? "var(--chart-1)" : "var(--chart-2)";
        const top = Math.max(7, ...lab.weeks.map((w) => w.done));
        const status = lab.week < 1 ? `starts ${fmtYmd(lab.start, { month: "short", day: "numeric" })}` : lab.week > 8 ? "finished" : `week ${lab.week} of 8`;
        return (
          <div key={lab.brand}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2.5 rounded-sm" style={{ background: color }} aria-hidden />
                {lab.brand === "personal" ? "Personal brand" : "Company"} · <span className="text-muted-foreground">{status}</span>
              </span>
              <span className="tabular-nums">
                <span className="font-semibold">{lab.total}</span>
                <span className="text-muted-foreground"> / {lab.target} shorts shipped</span>
              </span>
            </div>
            <ol className="mt-2 grid grid-cols-8 gap-1.5" aria-label={`${lab.brand} lab weekly progress`}>
              {lab.weeks.map((w) => {
                const cur = w.n === lab.week;
                const hit = w.done >= w.target;
                return (
                  <li key={w.n} className="flex flex-col items-center gap-1" title={`Week ${w.n}: ${w.done} of ${w.target}`}>
                    <div className="relative flex h-16 w-full max-w-7 items-end overflow-hidden rounded-md bg-muted">
                      {/* target level */}
                      <span className="absolute inset-x-0 h-0.5 bg-foreground/50" style={{ bottom: `calc(${(w.target / top) * 100}% - 1px)` }} aria-hidden />
                      <span
                        className="w-full rounded-t-[4px] transition-[height] duration-500"
                        style={{ height: `${(Math.min(w.done, top) / top) * 100}%`, background: color }}
                      />
                    </div>
                    <span className={cn("text-[10px] tabular-nums", cur ? "font-semibold text-foreground" : "text-muted-foreground")}>
                      {w.done}/{w.target}
                    </span>
                    <span className={cn("text-[10px]", cur ? "font-semibold text-foreground" : "text-muted-foreground")}>
                      {cur ? "now" : `W${w.n}`}
                      {hit && !cur ? <span className="sr-only"> (target hit)</span> : null}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="h-0.5 w-3.5 rounded-full bg-foreground/50" aria-hidden /> Weekly ramp target (3 → 5 → 7 shorts)
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 3-second hold distribution (Kallaway: ≥70% banger, <50% problem)
// ─────────────────────────────────────────────────────────────────────────

export function HoldBar({ hold }: { hold: { low: number; mid: number; high: number; n: number } }) {
  const parts = [
    { key: "low", label: "Under 50%: fix the hook", value: hold.low, color: "var(--danger)" },
    { key: "mid", label: "50–69%: okay", value: hold.mid, color: "var(--warning)" },
    { key: "high", label: "70%+: banger", value: hold.high, color: "var(--success)" },
  ];
  if (!hold.n) return <p className="text-xs text-muted-foreground">Add a 3-second hold % to your published videos to see this.</p>;
  return (
    <div>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={parts.map((p) => `${p.label}: ${p.value}`).join(", ")}>
        {parts
          .filter((p) => p.value > 0)
          .map((p) => (
            <span key={p.key} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(p.value / hold.n) * 100}%`, background: p.color }} />
          ))}
      </div>
      <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-3">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: p.color }} aria-hidden />
            <span className="font-semibold tabular-nums text-foreground">{p.value}</span>
            <span className="truncate">{p.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 12-week goals: key-result progress vs time elapsed (bullet bars)
// ─────────────────────────────────────────────────────────────────────────

export type GoalCard = {
  _id: string;
  title: string;
  pct: number;
  elapsedPct: number;
  krs: { title: string; current: number; target: number; unit: string; pct: number }[];
};

export function GoalBullets({ goals }: { goals: GoalCard[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {goals.map((g) => {
        const onPace = g.pct >= g.elapsedPct - 5;
        return (
          <li key={g._id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/goals/${g._id}`} className="min-w-0 text-sm font-medium leading-snug hover:underline">
                {g.title}
              </Link>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                  onPace ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
                )}
              >
                {onPace ? <CheckCircle2 className="h-3 w-3" aria-hidden /> : <AlertTriangle className="h-3 w-3" aria-hidden />}
                {onPace ? "On pace" : "Behind pace"}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">Key results</span>
              <span>
                <span className="font-semibold tabular-nums">{g.pct}%</span>
                <span className="text-muted-foreground"> · {g.elapsedPct}% of cycle elapsed</span>
              </span>
            </div>
            <div className="relative mt-1 h-2 w-full rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, g.pct)}%`, background: "var(--chart-1)" }} />
              <span className="absolute -top-1 h-4 w-0.5 rounded-full bg-foreground/70" style={{ left: `calc(${Math.min(100, g.elapsedPct)}% - 1px)` }} aria-hidden />
            </div>
            {g.krs.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {g.krs.slice(0, 4).map((k, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-2 text-[11px]">
                    <span className="min-w-0 truncate text-muted-foreground">{k.title}</span>
                    <span className="shrink-0 tabular-nums">
                      {k.current.toLocaleString()} / {k.target.toLocaleString()} {k.unit} <span className="text-muted-foreground">({k.pct}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
