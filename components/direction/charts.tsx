"use client";

/**
 * Direction charts — execution ring, 12-week bars, sparkline and the Wheel of
 * Life radar. Inline SVG/CSS on Syncora tokens only (works in light + dark).
 */
import { useState } from "react";
import { Ring, toneForPct, cn } from "@/components/os/kit";

/** Big execution-score ring (≥85% = success). */
export function ExecRing({
  score,
  size = 132,
  label = "this week",
  sub,
}: {
  score: number | null;
  size?: number;
  label?: string;
  sub?: React.ReactNode;
}) {
  const value = score ?? 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <Ring value={value} size={size} stroke={Math.round(size / 11)} tone={score === null ? "primary" : toneForPct(value)}>
        <div className="text-center">
          <div className="text-[2rem] font-semibold leading-none tracking-tight tabular-nums" style={{ fontSize: size / 4.2 }}>
            {score === null ? "—" : `${value}`}
            {score !== null && <span className="text-base font-medium text-muted-foreground">%</span>}
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        </div>
      </Ring>
      {sub && <div className="text-center text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export type HistoryPoint = { week: number; weekStart: string; score: number | null; isCurrent?: boolean; isFuture?: boolean; frozen?: boolean };

/** 12-week execution bars with the 85% bar line. Hover a bar for its value. */
export function ExecBars({ points, height = 84, className }: { points: HistoryPoint[]; height?: number; className?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const hp = hover !== null ? points[hover] : null;
  return (
    <div className={cn("w-full", className)}>
      <div className="relative" style={{ height }}>
        {/* 85% reference line */}
        <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-success/60" style={{ bottom: `${0.85 * height}px` }}>
          <span className="absolute -top-2 right-0 rounded bg-card px-1 text-[9px] font-medium text-muted-foreground">85%</span>
        </div>
        <div className="absolute inset-0 flex items-end gap-[3px]">
          {points.map((p, i) => {
            const h = p.score === null ? 0 : Math.max(3, (p.score / 100) * height);
            return (
              <button
                type="button"
                key={p.week}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`Week ${p.week}: ${p.score === null ? "no score" : `${p.score}%`}`}
                className="group relative flex h-full flex-1 items-end justify-center outline-none"
              >
                {p.score === null ? (
                  <span className={cn("w-full rounded-t-[4px] border border-dashed border-border", p.isFuture ? "h-2" : "h-1")} />
                ) : (
                  <span
                    className={cn(
                      "w-full rounded-t-[4px] transition-[height] duration-700 ease-out",
                      p.score >= 85 ? "bg-success" : "bg-primary/70",
                      p.isCurrent && "ring-2 ring-ring ring-offset-1 ring-offset-card",
                      hover === i && "opacity-80",
                    )}
                    style={{ height: h }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-1 flex gap-[3px]">
        {points.map((p) => (
          <span key={p.week} className={cn("flex-1 text-center text-[9px] tabular-nums text-muted-foreground", p.isCurrent && "font-semibold text-foreground")}>
            {p.week}
          </span>
        ))}
      </div>
      <p className="mt-1 h-4 text-[11px] text-muted-foreground">
        {hp
          ? `Week ${hp.week}: ${hp.score === null ? (hp.isFuture ? "upcoming" : "no tactics") : `${hp.score}%`}${hp.frozen ? " · frozen at review" : ""}`
          : "Weekly execution · hover a bar"}
      </p>
    </div>
  );
}

/** Tiny trend line (null = gap). */
export function Spark({ values, width = 96, height = 24, className }: { values: (number | null)[]; width?: number; height?: number; className?: string }) {
  const n = values.length;
  if (!n) return null;
  const x = (i: number) => (n === 1 ? width / 2 : (i / (n - 1)) * (width - 4) + 2);
  const y = (v: number) => height - 2 - (Math.max(0, Math.min(100, v)) / 100) * (height - 4);
  const segs: string[] = [];
  let cur = "";
  values.forEach((v, i) => {
    if (v === null) {
      if (cur) segs.push(cur);
      cur = "";
      return;
    }
    cur += `${cur ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
  });
  if (cur) segs.push(cur);
  const lastIdx = values.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop();
  return (
    <svg width={width} height={height} className={cn("overflow-visible text-foreground", className)} aria-hidden>
      <line x1={0} x2={width} y1={y(85)} y2={y(85)} className="stroke-success/50" strokeDasharray="2 3" strokeWidth={1} />
      {segs.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {lastIdx !== undefined && values[lastIdx] !== null && (
        <circle cx={x(lastIdx)} cy={y(values[lastIdx] as number)} r={3} className="fill-foreground stroke-card" strokeWidth={2} />
      )}
    </svg>
  );
}

/**
 * Wheel of Life radar: one axis per area (1–10), this month (solid) vs the
 * comparison month (dashed). Falls back to bars below 3 areas.
 */
export function RadarChart({
  axes,
  current,
  previous,
  currentLabel = "This month",
  previousLabel = "Last month",
  size = 300,
}: {
  axes: { id: string; name: string }[];
  current: Record<string, number | undefined>;
  previous?: Record<string, number | undefined>;
  currentLabel?: string;
  previousLabel?: string;
  size?: number;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const n = axes.length;
  const hasPrev = !!previous && axes.some((a) => previous[a.id] !== undefined);
  if (n < 3) {
    return (
      <div className="space-y-2">
        {axes.map((a) => (
          <div key={a.id} className="flex items-center gap-2 text-sm">
            <span className="w-32 truncate">{a.name}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-chart-1" style={{ width: `${((current[a.id] ?? 0) / 10) * 100}%` }} />
            </div>
            <span className="w-6 text-right tabular-nums">{current[a.id] ?? "—"}</span>
          </div>
        ))}
      </div>
    );
  }
  const pad = 56;
  const vb = size + pad * 2;
  const c = vb / 2;
  const R = size / 2;
  const angle = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  const pt = (i: number, v: number) => {
    const r = (Math.max(0, Math.min(10, v)) / 10) * R;
    return [c + Math.cos(angle(i)) * r, c + Math.sin(angle(i)) * r] as const;
  };
  const poly = (vals: Record<string, number | undefined>) =>
    axes.map((a, i) => pt(i, vals[a.id] ?? 0).map((x) => x.toFixed(1)).join(",")).join(" ");
  const hoverAxis = axes.find((a) => a.id === hover);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${vb} ${vb}`} className="mx-auto block h-auto w-full max-w-[420px]" role="img" aria-label="Wheel of Life radar">
        {[2, 4, 6, 8, 10].map((ring) => (
          <polygon
            key={ring}
            points={axes.map((_, i) => pt(i, ring).join(",")).join(" ")}
            className="fill-none stroke-border"
            strokeWidth={ring === 10 ? 1.2 : 0.8}
          />
        ))}
        {axes.map((a, i) => {
          const [x, y] = pt(i, 10);
          return <line key={a.id} x1={c} y1={c} x2={x} y2={y} className="stroke-border" strokeWidth={0.8} />;
        })}
        {hasPrev && (
          <polygon points={poly(previous!)} className="fill-none" stroke="var(--chart-3)" strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" />
        )}
        <polygon
          points={poly(current)}
          fill="color-mix(in oklab, var(--chart-1) 18%, transparent)"
          stroke="var(--chart-1)"
          strokeWidth={2}
          strokeLinejoin="round"
          className="transition-all duration-500"
        />
        {axes.map((a, i) => {
          const v = current[a.id];
          if (v === undefined) return null;
          const [x, y] = pt(i, v);
          return <circle key={a.id} cx={x} cy={y} r={4.5} fill="var(--chart-1)" className="stroke-card" strokeWidth={2} />;
        })}
        {axes.map((a, i) => {
          const [x, y] = pt(i, 11.6);
          const anchor = Math.abs(x - c) < 8 ? "middle" : x > c ? "start" : "end";
          const label = a.name.length > 16 ? `${a.name.slice(0, 15)}…` : a.name;
          return (
            <g key={a.id} onMouseEnter={() => setHover(a.id)} onMouseLeave={() => setHover(null)} className="cursor-default">
              <rect x={x - 50} y={y - 12} width={100} height={24} fill="transparent" />
              <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="fill-muted-foreground text-[12px] font-medium">
                {label}
              </text>
              <text x={x} y={y + 14} textAnchor={anchor} dominantBaseline="middle" className="fill-foreground text-[12px] font-semibold tabular-nums">
                {current[a.id] ?? "–"}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ background: "var(--chart-1)" }} /> {currentLabel}
        </span>
        {hasPrev && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed" style={{ borderColor: "var(--chart-3)" }} /> {previousLabel}
          </span>
        )}
      </div>
      <p className="mt-1 h-4 text-center text-[11px] text-muted-foreground">
        {hoverAxis
          ? `${hoverAxis.name}: ${current[hoverAxis.id] ?? "not rated"}${hasPrev ? ` (was ${previous![hoverAxis.id] ?? "—"})` : ""}`
          : ""}
      </p>
    </div>
  );
}
