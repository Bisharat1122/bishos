"use client";

import { addDaysYmd, fmtYmd, mondayOf } from "@/lib/day";
import { cn } from "@/lib/utils";
import { KIND_LABEL, type HabitKind } from "./util";

export type HeatRecord = { date: string; kind: HabitKind; repaired: boolean };

/**
 * Habit heatmap: one column per Mon–Sun week, ending this week.
 *  done/stretch = solid · min = lighter · skip = outlined dot · repaired = ring
 */
export function HabitHeatmap({
  records,
  today,
  weeks = 12,
  start,
  cell = 12,
  onCell,
  showLegend = false,
  showDays = true,
  className,
}: {
  records: HeatRecord[];
  today: string;
  weeks?: number;
  start?: string; // first tracked day (earlier cells render faint)
  cell?: number;
  onCell?: (date: string, rect: DOMRect) => void;
  showLegend?: boolean;
  showDays?: boolean;
  className?: string;
}) {
  const map = new Map(records.map((r) => [r.date, r]));
  const first = addDaysYmd(mondayOf(today), -7 * (weeks - 1));
  const cols = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => addDaysYmd(first, w * 7 + d)));
  const gap = cell >= 14 ? 4 : 3;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {showDays && (
          <div className="flex shrink-0 flex-col text-[9px] leading-none text-muted-foreground" style={{ gap }}>
            {["M", "", "W", "", "F", "", "S"].map((l, i) => (
              <span key={i} className="flex items-center" style={{ height: cell }}>
                {l}
              </span>
            ))}
          </div>
        )}
        <div className="flex" style={{ gap }}>
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col" style={{ gap }}>
              {col.map((date) => {
                const r = map.get(date);
                const future = date > today;
                const before = !!start && date < start && !r;
                const label = `${fmtYmd(date)} · ${r ? KIND_LABEL[r.kind] + (r.repaired ? " (repaired)" : "") : future ? "upcoming" : before ? "before start" : "not logged"}`;
                const content = (
                  <span
                    className={cn(
                      "relative flex items-center justify-center rounded-[3px] transition-colors",
                      future && "bg-transparent",
                      !future && before && "bg-muted/40",
                      !future && !before && !r && "bg-muted",
                      r?.kind === "done" && "bg-success",
                      r?.kind === "stretch" && "bg-success",
                      r?.kind === "min" && "bg-success/45",
                      r?.kind === "skip" && "bg-transparent",
                      r?.repaired && "ring-2 ring-info ring-offset-1 ring-offset-card",
                      date === today && !r && "outline outline-1 outline-offset-1 outline-ring/60",
                    )}
                    style={{ width: cell, height: cell }}
                  >
                    {r?.kind === "skip" && (
                      <span className="rounded-full border-[1.5px] border-muted-foreground" style={{ width: cell * 0.55, height: cell * 0.55 }} />
                    )}
                    {r?.kind === "stretch" && <span className="rounded-full bg-background/80" style={{ width: cell * 0.3, height: cell * 0.3 }} />}
                  </span>
                );
                return onCell && !future ? (
                  <button
                    key={date}
                    type="button"
                    title={label}
                    aria-label={label}
                    onClick={(e) => onCell(date, (e.currentTarget as HTMLElement).getBoundingClientRect())}
                    className="rounded-[3px] outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {content}
                  </button>
                ) : (
                  <span key={date} title={label}>
                    {content}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {showLegend && <HeatLegend className="mt-2" />}
    </div>
  );
}

export function HeatLegend({ className }: { className?: string }) {
  const item = (node: React.ReactNode, label: string) => (
    <span className="inline-flex items-center gap-1.5">
      {node}
      {label}
    </span>
  );
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground", className)}>
      {item(<span className="size-2.5 rounded-[3px] bg-success" />, "Done")}
      {item(<span className="size-2.5 rounded-[3px] bg-success/45" />, "2-min")}
      {item(
        <span className="flex size-2.5 items-center justify-center rounded-[3px] bg-success">
          <span className="size-1 rounded-full bg-background/80" />
        </span>,
        "Stretch",
      )}
      {item(
        <span className="flex size-2.5 items-center justify-center">
          <span className="size-1.5 rounded-full border border-muted-foreground" />
        </span>,
        "Skip",
      )}
      {item(<span className="size-2.5 rounded-[3px] bg-muted ring-2 ring-info ring-offset-1 ring-offset-card" />, "Repaired")}
      {item(<span className="size-2.5 rounded-[3px] bg-muted" />, "Not logged")}
    </div>
  );
}
