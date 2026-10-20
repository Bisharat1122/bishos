"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  useWidth,
  useChartNav,
  niceMax,
  labelStep,
  topRounded,
  compact,
  Tip,
  Legend,
  type LegendItem,
  type TipRow,
} from "./primitives";

export type Series = { key: string; label: string; color: string; values: (number | null)[] };

const PAD = { l: 36, r: 12, t: 10, b: 24 };
const AXIS_TEXT = "fill-muted-foreground text-[10px] tabular-nums";

/** Rough rendered width of a short label (digits/letters at `size` px). */
const textW = (s: string, size: number) => Math.ceil(s.length * size * 0.6);
function lastIndexOf(vals: (number | null)[]) {
  for (let i = vals.length - 1; i >= 0; i--) if (vals[i] != null) return i;
  return -1;
}
/** Left padding that fits the widest y tick label. */
const padFor = (labels: string[]) => Math.max(26, Math.min(84, Math.max(...labels.map((s) => textW(s, 10))) + 10));

// ─────────────────────────────────────────────────────────────────────────
// Columns — stacked or grouped, with an optional target line
// ─────────────────────────────────────────────────────────────────────────

export function Columns({
  labels,
  titles,
  series,
  mode = "stack",
  height = 200,
  fmt = (n) => compact(n),
  target,
  targetLabel = "Target",
  yMax,
  ariaLabel,
  showLegend = true,
  totalLabel = "Total",
  extraTip,
}: {
  labels: string[];
  titles: string[];
  series: Series[];
  mode?: "stack" | "group";
  height?: number;
  fmt?: (n: number) => string;
  target?: number | null;
  targetLabel?: string;
  yMax?: number;
  ariaLabel: string;
  showLegend?: boolean;
  totalLabel?: string;
  extraTip?: (i: number) => TipRow[];
}) {
  const [ref, W] = useWidth();
  const n = labels.length;
  const nav = useChartNav(n);
  const totals = labels.map((_, i) => series.reduce((s, se) => s + (se.values[i] ?? 0), 0));
  const peak = mode === "stack" ? Math.max(0, ...totals) : Math.max(0, ...series.flatMap((s) => s.values.map((v) => v ?? 0)));
  const max = yMax ?? niceMax(Math.max(peak, target ?? 0) * 1.05);
  const ticks = [0, 0.5, 1];
  // Paddings sized from the real labels, so money/hour ticks never clip.
  const pad = {
    ...PAD,
    l: padFor(ticks.map((g) => fmt(max * g))),
    r: target ? Math.max(PAD.r, textW(fmt(target), 10) + 10) : PAD.r,
  };
  const cw = Math.max(10, W - pad.l - pad.r);
  const ch = height - pad.t - pad.b;
  const y = (v: number) => pad.t + ch * (1 - Math.min(v, max) / max);
  const slot = cw / Math.max(1, n);
  const step = labelStep(n, cw);

  const active = nav.active;
  const onPointer = (e: React.PointerEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const i = Math.floor((e.clientX - rect.left - pad.l) / slot);
    nav.setActive(i >= 0 && i < n ? i : null);
  };

  const legend: LegendItem[] = series.map((s) => ({ label: s.label, color: s.color }));
  if (target) legend.push({ label: targetLabel, color: "var(--foreground)", shape: "line" });

  return (
    <div className="min-w-0">
      <div
        ref={ref}
        className="relative w-full rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        role="group"
        aria-roledescription="chart"
        aria-label={`${ariaLabel}. Use arrow keys to read each week.`}
        {...nav.focusProps}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={() => nav.setActive(null)}
      >
        <svg width={W} height={height} className="block" aria-hidden>
          {ticks.map((g) => (
            <g key={g}>
              <line x1={pad.l} x2={pad.l + cw} y1={y(max * g)} y2={y(max * g)} stroke="var(--border)" strokeWidth={1} />
              <text x={pad.l - 6} y={y(max * g) + 3} textAnchor="end" className={AXIS_TEXT}>
                {fmt(max * g)}
              </text>
            </g>
          ))}
          {labels.map((lab, i) => {
            const cx = pad.l + i * slot + slot / 2;
            const dim = active != null && active !== i;
            let bars: ReactNode;
            if (mode === "stack") {
              const bw = Math.max(2, Math.min(24, slot * 0.66));
              let cursor = y(0);
              const segs = series.map((s, j) => ({ s, j, v: s.values[i] ?? 0 })).filter((x) => x.v > 0);
              bars = segs.map(({ s, v }, k) => {
                const h = (Math.min(v, max) / max) * ch;
                const top = cursor - h;
                const isTop = k === segs.length - 1;
                const drawH = Math.max(0, h - (isTop ? 0 : 2)); // 2px surface gap between segments
                const yTop = isTop ? top : top + 2;
                cursor = top;
                return isTop ? (
                  <path key={s.key} d={topRounded(cx - bw / 2, yTop, bw, drawH)} fill={s.color} />
                ) : (
                  <rect key={s.key} x={cx - bw / 2} y={yTop} width={bw} height={drawH} fill={s.color} />
                );
              });
            } else {
              const m = series.length;
              const bw = Math.max(2, Math.min(14, (slot * 0.74 - (m - 1) * 2) / m));
              const groupW = m * bw + (m - 1) * 2;
              bars = series.map((s, j) => {
                const v = s.values[i];
                if (!v || v <= 0) return null;
                const h = (Math.min(v, max) / max) * ch;
                return <path key={s.key} d={topRounded(cx - groupW / 2 + j * (bw + 2), y(0) - h, bw, h)} fill={s.color} />;
              });
            }
            return (
              <g key={i} opacity={dim ? 0.4 : 1} style={{ transition: "opacity 120ms" }}>
                {bars}
                {i % step === 0 && (
                  <text x={cx} y={height - 7} textAnchor="middle" className={AXIS_TEXT}>
                    {lab}
                  </text>
                )}
              </g>
            );
          })}
          {target ? (
            <g>
              <line x1={pad.l} x2={pad.l + cw} y1={y(target)} y2={y(target)} stroke="var(--foreground)" strokeOpacity={0.6} strokeWidth={1.5} />
              <text x={pad.l + cw + 4} y={y(target) + 3} className="fill-foreground text-[10px] font-medium tabular-nums">
                {fmt(target)}
              </text>
            </g>
          ) : null}
          {active != null && (
            <rect x={pad.l + active * slot} y={pad.t} width={slot} height={ch} fill="var(--foreground)" opacity={0.04} />
          )}
        </svg>
        {active != null && (
          <Tip
            x={pad.l + active * slot + slot / 2}
            width={W}
            title={titles[active]}
            rows={[
              ...series
                .filter((s) => !(mode === "stack" && s.values[active] == null))
                .map((s) => ({ label: s.label, value: s.values[active] == null ? "—" : fmt(s.values[active]!), color: s.color })),
              ...(mode === "stack" && series.filter((s) => s.values[active] != null).length > 1
                ? [{ label: totalLabel, value: fmt(totals[active]), bold: true }]
                : []),
              ...(target ? [{ label: targetLabel, value: fmt(target), color: "var(--foreground)", bold: false }] : []),
              ...(extraTip ? extraTip(active) : []),
            ]}
          />
        )}
      </div>
      {showLegend && (series.length > 1 || target) && <Legend items={legend} className="mt-2" />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Lines — multi-series with crosshair, optional area wash + reference line
// ─────────────────────────────────────────────────────────────────────────

export function Lines({
  labels,
  titles,
  series,
  height = 200,
  yMin = 0,
  yMax,
  fmt = (n) => compact(n),
  refLine,
  area,
  ariaLabel,
  endLabel = true,
  showLegend = true,
}: {
  labels: string[];
  titles: string[];
  series: Series[];
  height?: number;
  yMin?: number;
  yMax?: number;
  fmt?: (n: number) => string;
  refLine?: { value: number; label: string } | null;
  area?: boolean;
  ariaLabel: string;
  endLabel?: boolean;
  showLegend?: boolean;
}) {
  const [ref, W] = useWidth();
  const n = labels.length;
  const nav = useChartNav(n);
  const single = series.length === 1;
  const all = series.flatMap((s) => s.values.filter((v): v is number => v != null));
  const max = yMax ?? niceMax(Math.max(...all, refLine?.value ?? 0, yMin + 1) * 1.05);
  const ticks = [0, 0.5, 1].map((g) => yMin + (max - yMin) * g);
  const lastI = single ? lastIndexOf(series[0].values) : -1;
  const endText = single && endLabel && lastI === n - 1 ? fmt(series[0].values[lastI]!) : "";
  // Paddings sized from the real labels (ticks on the left, end value / reference on the right).
  const pad = {
    ...PAD,
    l: padFor(ticks.map(fmt)),
    r: Math.max(14, endText ? textW(endText, 11) + 14 : 0, refLine ? textW(refLine.label, 10) + 8 : 0),
  };
  const cw = Math.max(10, W - pad.l - pad.r);
  const ch = height - pad.t - pad.b;
  const x = (i: number) => pad.l + (n <= 1 ? cw / 2 : (cw * i) / (n - 1));
  const y = (v: number) => pad.t + ch * (1 - (Math.max(yMin, Math.min(v, max)) - yMin) / (max - yMin));
  const step = labelStep(n, cw);
  const active = nav.active;
  // Drop the end label when it would sit on top of the reference label.
  const endClash = !!(endText && refLine && Math.abs(y(series[0].values[lastI]!) - y(refLine.value)) < 13);

  const onPointer = (e: React.PointerEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || !n) return;
    const mx = e.clientX - rect.left;
    const i = n <= 1 ? 0 : Math.round(((mx - pad.l) / cw) * (n - 1));
    nav.setActive(Math.max(0, Math.min(n - 1, i)));
  };

  /** Path with gaps at nulls. */
  const pathOf = (vals: (number | null)[]) => {
    let d = "";
    let pen = false;
    vals.forEach((v, i) => {
      if (v == null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${x(i)},${y(v)}`;
      pen = true;
    });
    return d;
  };
  const areaOf = (vals: (number | null)[]) => {
    // Area wash per contiguous run.
    const runs: [number, number][] = [];
    let s = -1;
    vals.forEach((v, i) => {
      if (v != null && s < 0) s = i;
      if ((v == null || i === vals.length - 1) && s >= 0) {
        runs.push([s, v == null ? i - 1 : i]);
        s = -1;
      }
    });
    return runs
      .filter(([a, b]) => b > a)
      .map(([a, b]) => {
        let d = `M${x(a)},${y(yMin)}`;
        for (let i = a; i <= b; i++) d += `L${x(i)},${y(vals[i]!)}`;
        return `${d}L${x(b)},${y(yMin)}Z`;
      })
      .join("");
  };
  return (
    <div className="min-w-0">
      <div
        ref={ref}
        className="relative w-full rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        role="group"
        aria-roledescription="chart"
        aria-label={`${ariaLabel}. Use arrow keys to read each week.`}
        {...nav.focusProps}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={() => nav.setActive(null)}
      >
        <svg width={W} height={height} className="block" aria-hidden>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={pad.l + cw} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" className={AXIS_TEXT}>
                {fmt(t)}
              </text>
            </g>
          ))}
          {labels.map((lab, i) =>
            i % step === 0 ? (
              <text key={i} x={x(i)} y={height - 7} textAnchor="middle" className={AXIS_TEXT}>
                {lab}
              </text>
            ) : null,
          )}
          {refLine && (
            <g>
              <line x1={pad.l} x2={pad.l + cw} y1={y(refLine.value)} y2={y(refLine.value)} stroke="var(--foreground)" strokeOpacity={0.5} strokeWidth={1.5} />
              <text x={pad.l + cw + 4} y={y(refLine.value) + 3} className="fill-foreground text-[10px] font-medium">
                {refLine.label}
              </text>
            </g>
          )}
          {area && single && <path d={areaOf(series[0].values)} fill={series[0].color} opacity={0.1} />}
          {series.map((s) => (
            <path key={s.key} d={pathOf(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {/* isolated points (a value with null neighbours) still need a mark */}
          {series.map((s) =>
            s.values.map((v, i) =>
              v != null && s.values[i - 1] == null && s.values[i + 1] == null ? (
                <circle key={`${s.key}${i}`} cx={x(i)} cy={y(v)} r={3} fill={s.color} />
              ) : null,
            ),
          )}
          {single &&
            endLabel &&
            (() => {
              const li = lastI;
              if (li < 0 || active != null) return null;
              const v = series[0].values[li]!;
              return (
                <g>
                  <circle cx={x(li)} cy={y(v)} r={4} fill={series[0].color} stroke="var(--card)" strokeWidth={2} />
                  {endText && !endClash && (
                    <text x={x(li) + 8} y={y(v) + 3} className="fill-foreground text-[11px] font-semibold tabular-nums">
                      {fmt(v)}
                    </text>
                  )}
                </g>
              );
            })()}
          {active != null && (
            <g>
              <line x1={x(active)} x2={x(active)} y1={pad.t} y2={pad.t + ch} stroke="var(--foreground)" strokeOpacity={0.35} strokeWidth={1} />
              {series.map((s) =>
                s.values[active] != null ? (
                  <circle key={s.key} cx={x(active)} cy={y(s.values[active]!)} r={4.5} fill={s.color} stroke="var(--card)" strokeWidth={2} />
                ) : null,
              )}
            </g>
          )}
        </svg>
        {active != null && (
          <Tip
            x={x(active)}
            width={W}
            title={titles[active]}
            rows={[
              ...series.map((s) => ({ label: s.label, value: s.values[active] == null ? "No data" : fmt(s.values[active]!), color: s.color })),
              ...(refLine ? [{ label: "Reference", value: refLine.label, bold: false }] : []),
            ]}
          />
        )}
      </div>
      {showLegend && series.length > 1 && <Legend items={series.map((s) => ({ label: s.label, color: s.color, shape: "line" as const }))} className="mt-2" />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sparkline — de-emphasis line, current period accented
// ─────────────────────────────────────────────────────────────────────────

export function Sparkline({ values, height = 30, className }: { values: (number | null)[]; height?: number; className?: string }) {
  const [ref, W] = useWidth();
  const ok = values.filter((v): v is number => v != null);
  const n = values.length;
  const max = Math.max(1, ...ok);
  const min = Math.min(0, ...ok);
  const x = (i: number) => 3 + (n <= 1 ? (W - 6) / 2 : ((W - 6) * i) / (n - 1));
  const y = (v: number) => 3 + (height - 6) * (1 - (v - min) / (max - min || 1));
  let d = "";
  let pen = false;
  values.forEach((v, i) => {
    if (v == null) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${x(i)},${y(v)}`;
    pen = true;
  });
  let li = -1;
  for (let i = n - 1; i >= 0; i--)
    if (values[i] != null) {
      li = i;
      break;
    }
  return (
    <div ref={ref} className={cn("w-full", className)} aria-hidden>
      <svg width={W} height={height} className="block">
        {ok.length > 0 ? (
          <>
            <path d={d} fill="none" stroke="var(--muted-foreground)" strokeOpacity={0.7} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
            {li >= 0 && <circle cx={x(li)} cy={y(values[li]!)} r={3} fill="var(--foreground)" stroke="var(--card)" strokeWidth={1.5} />}
          </>
        ) : (
          <line x1={3} x2={W - 3} y1={height - 4} y2={height - 4} stroke="var(--border)" strokeWidth={1} />
        )}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HBars — labelled horizontal bars (values always visible as text)
// ─────────────────────────────────────────────────────────────────────────

export type HBarRow = {
  key: string;
  label: string;
  value: number;
  display: string;
  sub?: string;
  color?: string;
  target?: number | null;
  targetDisplay?: string;
  status?: ReactNode;
};

export function HBars({ rows, max, color = "var(--chart-1)", className }: { rows: HBarRow[]; max?: number; color?: string; className?: string }) {
  const top = max ?? Math.max(1, ...rows.map((r) => Math.max(r.value, r.target ?? 0)));
  return (
    <ul className={cn("space-y-2.5", className)}>
      {rows.map((r) => {
        const w = Math.max(0, Math.min(100, (r.value / top) * 100));
        const tw = r.target ? Math.min(100, (r.target / top) * 100) : null;
        return (
          <li key={r.key} className="group">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="min-w-0 truncate font-medium text-foreground" title={r.label}>
                {r.label}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {r.status}
                <span className="font-semibold tabular-nums">{r.display}</span>
                {r.targetDisplay && <span className="tabular-nums text-muted-foreground">/ {r.targetDisplay}</span>}
              </span>
            </div>
            <div className="relative mt-1 h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out group-hover:brightness-110"
                style={{ width: `${w}%`, background: r.color ?? color }}
              />
              {tw != null && (
                <span
                  className="absolute -top-1 h-4 w-0.5 rounded-full bg-foreground/70"
                  style={{ left: `calc(${tw}% - 1px)` }}
                  title={r.targetDisplay ? `Target ${r.targetDisplay}` : "Target"}
                  aria-hidden
                />
              )}
            </div>
            {r.sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{r.sub}</p>}
          </li>
        );
      })}
    </ul>
  );
}
