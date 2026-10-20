"use client";

import { useEffect, useRef, useState } from "react";
import { fmtYmd } from "@/lib/day";
import { useWidth, seq, Tip } from "./primitives";

export type HeatCell = { date: string; score: number | null; ritual: boolean; free: boolean; future: boolean };

/** Sequential steps (one hue, light → dark) for the day score. */
const STEPS = [
  { min: 0, max: 19, label: "0–19", fill: seq(16) },
  { min: 20, max: 39, label: "20–39", fill: seq(34) },
  { min: 40, max: 59, label: "40–59", fill: seq(55) },
  { min: 60, max: 79, label: "60–79", fill: seq(76) },
  { min: 80, max: 100, label: "80–100", fill: seq(100) },
];
const stepOf = (s: number) => STEPS.find((x) => s <= x.max) ?? STEPS[STEPS.length - 1];
const NONE = "var(--muted)";
const DOW = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

/**
 * Calendar heatmap: columns are Monday-weeks, rows Mon → Sun, colour = day
 * score (one hue). Free days are outlined, empty days are muted. Hover or
 * arrow keys read each day; the most recent week is always in view.
 */
export function Heatmap({ cells, weeks, ariaLabel }: { cells: HeatCell[]; weeks: number; ariaLabel: string }) {
  const [ref, W] = useWidth();
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const left = 30;
  const top = 18;
  const gap = 3;
  const fit = Math.floor((W - left) / weeks) - gap;
  const cell = Math.max(10, Math.min(24, fit));
  const gridW = left + weeks * (cell + gap);
  const height = top + 7 * (cell + gap);
  const svgW = Math.max(W, gridW);

  // Keep the most recent weeks visible when the grid overflows (phones, 1y).
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [svgW, weeks]);

  const pos = (i: number) => ({ col: Math.floor(i / 7), row: i % 7 });
  const xy = (i: number) => {
    const { col, row } = pos(i);
    return { x: left + col * (cell + gap), y: top + row * (cell + gap) };
  };

  // Month labels at the first week whose Monday starts a new month.
  const months: { col: number; label: string }[] = [];
  for (let c = 0; c < weeks; c++) {
    const d = cells[c * 7]?.date;
    if (!d) continue;
    const prev = c > 0 ? cells[(c - 1) * 7]?.date : null;
    const lastCol = months.length ? months[months.length - 1].col : -99;
    // New month, and far enough from the previous label not to collide.
    if ((!prev || prev.slice(5, 7) !== d.slice(5, 7)) && c - lastCol >= 3) months.push({ col: c, label: fmtYmd(d, { month: "short" }) });
  }
  const monthStep = cell + gap < 14 ? 2 : 1;

  const lastPast = (() => {
    for (let i = cells.length - 1; i >= 0; i--) if (!cells[i].future) return i;
    return cells.length - 1;
  })();

  const onKey = (e: React.KeyboardEvent) => {
    const cur = active ?? lastPast;
    let next = cur;
    if (e.key === "ArrowRight") next = cur + 7;
    else if (e.key === "ArrowLeft") next = cur - 7;
    else if (e.key === "ArrowDown") next = cur + 1;
    else if (e.key === "ArrowUp") next = cur - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = lastPast;
    else if (e.key === "Escape") {
      setActive(null);
      return;
    } else return;
    e.preventDefault();
    setActive(Math.max(0, Math.min(lastPast, next)));
  };

  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left - left) / (cell + gap));
    const row = Math.floor((e.clientY - rect.top - top) / (cell + gap));
    if (col < 0 || col >= weeks || row < 0 || row > 6) return setActive(null);
    const i = col * 7 + row;
    setActive(cells[i] && !cells[i].future ? i : null);
  };

  const a = active != null ? cells[active] : null;
  const scrollX = scroller.current?.scrollLeft ?? 0;

  return (
    <div ref={ref} className="min-w-0">
      <div className="relative">
        <div ref={scroller} className="overflow-x-auto scrollbar-thin">
          <div
            role="group"
            aria-roledescription="chart"
            aria-label={`${ariaLabel}. Use arrow keys to read each day.`}
            tabIndex={0}
            onKeyDown={onKey}
            onFocus={() => setActive((x) => x ?? lastPast)}
            onBlur={() => setActive(null)}
            className="w-max rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <svg width={svgW} height={height} className="block" onPointerMove={onPointer} onPointerDown={onPointer} onPointerLeave={() => setActive(null)} aria-hidden>
              {months
                .filter((_, k) => k % monthStep === 0)
                .map((m) => (
                  <text key={m.col} x={left + m.col * (cell + gap)} y={11} className="fill-muted-foreground text-[10px]">
                    {m.label}
                  </text>
                ))}
              {DOW.map((d, r) =>
                d ? (
                  <text key={r} x={0} y={top + r * (cell + gap) + cell / 2 + 3} className="fill-muted-foreground text-[10px]">
                    {d}
                  </text>
                ) : null,
              )}
              {cells.map((c, i) => {
                if (c.future) return null;
                const { x, y } = xy(i);
                const hasScore = c.score != null;
                const fill = hasScore ? stepOf(c.score!).fill : c.free ? "transparent" : NONE;
                return (
                  <rect
                    key={c.date}
                    x={c.free && !hasScore ? x + 0.75 : x}
                    y={c.free && !hasScore ? y + 0.75 : y}
                    width={c.free && !hasScore ? cell - 1.5 : cell}
                    height={c.free && !hasScore ? cell - 1.5 : cell}
                    rx={3}
                    fill={fill}
                    stroke={c.free && !hasScore ? "var(--muted-foreground)" : active === i ? "var(--foreground)" : "none"}
                    strokeOpacity={c.free && !hasScore ? 0.6 : 1}
                    strokeWidth={1.5}
                  />
                );
              })}
              {active != null &&
                (() => {
                  const { x, y } = xy(active);
                  return <rect x={x - 1.5} y={y - 1.5} width={cell + 3} height={cell + 3} rx={4} fill="none" stroke="var(--foreground)" strokeWidth={1.5} />;
                })()}
            </svg>
          </div>
        </div>
        {a && active != null && (
          <Tip
            x={xy(active).x + cell / 2 - scrollX}
            width={W}
            top={Math.min(height - 70, xy(active).y + cell + 6)}
            title={fmtYmd(a.date, { weekday: "long", month: "short", day: "numeric" })}
            rows={[
              { label: "day score", value: a.score == null ? "Not logged" : `${a.score}/100`, color: a.score == null ? undefined : stepOf(a.score).fill },
              { label: "start-up or shutdown", value: a.ritual ? "Ritual done" : "No ritual", bold: false },
              ...(a.free ? [{ label: "protected rest", value: "Free day", bold: false }] : []),
            ]}
          />
        )}
      </div>
      {/* Scale legend: sequential, with the numeric bins as text */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span>Day score</span>
          {STEPS.map((s) => (
            <span key={s.label} className="flex items-center gap-1 whitespace-nowrap">
              <span className="size-3 rounded-[3px]" style={{ background: s.fill }} aria-hidden />
              <span className="tabular-nums">{s.label}</span>
            </span>
          ))}
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap">
          <span className="size-3 rounded-[3px]" style={{ background: NONE }} aria-hidden /> Not logged
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap">
          <span className="size-3 rounded-[3px] border-[1.5px] border-muted-foreground/60" aria-hidden /> Free day
        </span>
      </div>
    </div>
  );
}
