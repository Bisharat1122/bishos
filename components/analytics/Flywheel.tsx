"use client";

import { ArrowRight, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { compact, money, fmtInt, seq } from "./primitives";

export type FlowStage = { key: string; label: string; value: number; prev: number; money: boolean };

/**
 * Founder flywheel as a left-to-right flow: content → attention → leads →
 * pipeline → revenue. Each stage shows its count, the change vs the previous
 * period and the conversion from the stage before it (bar = that %).
 * Stage order is ordinal, so the top strip steps one hue light → dark.
 */
export function Flywheel({ stages, currency }: { stages: FlowStage[]; currency: string }) {
  const conv = stages.map((s, i) => {
    // Views per piece is a rate, not a conversion (different units), so it gets its own line.
    if (i === 0 || s.money || s.key === "views") return null;
    const p = stages[i - 1].value;
    return p > 0 ? (s.value / p) * 100 : null;
  });
  // Biggest relative drop between consecutive count stages (only when both have data).
  let worst = -1;
  conv.forEach((c, i) => {
    if (c != null && c < 100 && stages[i - 1].value > 0 && (worst < 0 || c < (conv[worst] ?? 101))) worst = i;
  });
  const won = stages.find((s) => s.key === "won");
  const revenue = stages.find((s) => s.key === "revenue");
  const n = stages.length;

  return (
    <ol className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 md:grid-cols-4 xl:grid-cols-7" aria-label="Founder flywheel stages">
      {stages.map((s, i) => {
        const c = conv[i];
        const delta = s.value - s.prev;
        const value = s.money ? money(s.value, currency) : compact(s.value);
        const fullValue = s.money ? money(s.value, currency, true) : fmtInt(s.value);
        return (
          <li key={s.key} className="relative">
            <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background/60">
              <span className="h-1 w-full" style={{ background: seq(30 + Math.round((70 * i) / Math.max(1, n - 1))) }} aria-hidden />
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <span className="tabular-nums">{i + 1}.</span> {s.label}
                  </span>
                  {i === worst && (
                    <span className="rounded bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-warning">Biggest drop</span>
                  )}
                </div>
                <p className="text-2xl font-semibold leading-none tracking-tight" title={fullValue}>
                  {value}
                </p>
                <p className={cn("flex items-center gap-1 text-[11px]", delta > 0 ? "text-success" : delta < 0 ? "text-warning" : "text-muted-foreground")}>
                  {delta > 0 ? <ArrowUp className="h-3 w-3" aria-hidden /> : delta < 0 ? <ArrowDown className="h-3 w-3" aria-hidden /> : <Minus className="h-3 w-3" aria-hidden />}
                  <span className="tabular-nums">
                    {delta === 0 ? "No change" : `${delta > 0 ? "+" : "−"}${s.money ? money(Math.abs(delta), currency) : compact(Math.abs(delta))}`}
                  </span>
                  <span className="text-muted-foreground">vs prev</span>
                </p>
                <div className="mt-auto pt-1">
                  {i === 0 ? (
                    <p className="text-[11px] text-muted-foreground">Where the flywheel starts</p>
                  ) : s.key === "views" ? (
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-semibold tabular-nums text-foreground">{stages[0].value > 0 ? compact(s.value / stages[0].value) : "—"}</span> avg per piece
                    </p>
                  ) : s.money ? (
                    <p className="text-[11px] text-muted-foreground">
                      {won && won.value > 0 && revenue ? (
                        <>
                          <span className="font-semibold tabular-nums text-foreground">{money(revenue.value / won.value, currency)}</span> avg per deal
                        </>
                      ) : (
                        "From won deals"
                      )}
                    </p>
                  ) : (
                    <>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-semibold tabular-nums text-foreground">{c == null ? "—" : `${c >= 10 ? Math.round(c) : c.toFixed(1)}%`}</span> of{" "}
                        {stages[i - 1].label.toLowerCase()}
                      </p>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-muted" aria-hidden>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, c ?? 0)}%`, background: "var(--chart-1)" }} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            {i < n - 1 && (
              <span
                className="absolute -right-2 top-1/2 z-10 hidden size-4 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground xl:flex"
                aria-hidden
              >
                <ArrowRight className="h-2.5 w-2.5" />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
