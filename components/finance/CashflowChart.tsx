"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { cn } from "@/components/os/kit";
import { fmtMonth, type Money } from "./lib";

export type CashflowPoint = { month: string; income: number; expense: number; net: number };

/**
 * 12-month cashflow: income vs expense columns (paired) and a net line, all on
 * ONE money axis (net can dip below zero). Hover / focus a month for exact
 * numbers; click to jump the month picker there. A table view carries every
 * value without relying on colour.
 *
 * Colours: income = chart-2 (teal), expense = chart-5 (rose), net = foreground
 * ink. Validated with the dataviz palette checker (CVD ΔE ≥ 8 light + dark).
 */
const INCOME = "var(--chart-2)";
const EXPENSE = "var(--chart-5)";
const NET = "var(--foreground)";

/** Width of the chart box. `remountKey` re-attaches the observer when the box remounts (table ↔ chart). */
function useWidth(remountKey?: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0].contentRect.width;
      if (cw > 0) setW(cw);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [remountKey]);
  return [ref, w] as const;
}

function niceStep(span: number) {
  if (span <= 0) return 1;
  const raw = span / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}

/** Column path: 4px rounded data-end, square at the baseline. */
function colPath(x: number, w: number, yTop: number, yBase: number) {
  const h = yBase - yTop;
  if (h <= 0.5) return "";
  const r = Math.min(4, w / 2, h);
  return `M${x},${yBase} L${x},${yTop + r} Q${x},${yTop} ${x + r},${yTop} L${x + w - r},${yTop} Q${x + w},${yTop} ${x + w},${yTop + r} L${x + w},${yBase} Z`;
}

export function CashflowChart({
  data,
  money,
  selected,
  onSelect,
  height = 240,
}: {
  data: CashflowPoint[];
  money: Money;
  selected?: string;
  onSelect?: (month: string) => void;
  height?: number;
}) {
  const [table, setTable] = useState(false);
  const [ref, W] = useWidth(table);
  const [hover, setHover] = useState<number | null>(null);

  const empty = data.every((d) => d.income === 0 && d.expense === 0);
  const pad = { l: 48, r: 8, t: 10, b: 24 };
  const cw = Math.max(10, W - pad.l - pad.r);
  const ch = height - pad.t - pad.b;

  const hi = Math.max(0, ...data.map((d) => Math.max(d.income, d.expense, d.net)));
  const lo = Math.min(0, ...data.map((d) => d.net));
  const step = niceStep(hi - lo || 1);
  const top = Math.max(step, Math.ceil(hi / step) * step);
  const bottom = Math.floor(lo / step) * step;
  const span = top - bottom || 1;
  const y = (v: number) => pad.t + ch * (1 - (v - bottom) / span);
  const ticks: number[] = [];
  for (let t = bottom; t <= top + step / 2; t += step) ticks.push(Math.round(t * 100) / 100);

  const n = Math.max(1, data.length);
  const slot = cw / n;
  const gap = 2;
  const bw = Math.max(3, Math.min(14, (slot * 0.66 - gap) / 2));
  const cx = (i: number) => pad.l + i * slot + slot / 2;
  const labelEvery = slot < 30 ? 2 : 1;
  const zeroY = y(0);

  const linePts = data.map((d, i) => `${cx(i)},${y(d.net)}`).join(" ");
  const hv = hover != null ? data[hover] : null;

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: INCOME }} aria-hidden /> Income
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: EXPENSE }} aria-hidden /> Expenses
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 rounded-full" style={{ background: NET }} aria-hidden /> Net
          </span>
        </div>
        <button
          type="button"
          onClick={() => setTable((t) => !t)}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-pressed={table}
        >
          {table ? <BarChart3 className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
          {table ? "Chart" : "Table"}
        </button>
      </div>

      {table ? (
        <div className="max-h-[260px] overflow-auto rounded-lg border border-border scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-medium">Month</th>
                <th className="px-3 py-2 text-right font-medium">Income</th>
                <th className="px-3 py-2 text-right font-medium">Expenses</th>
                <th className="px-3 py-2 text-right font-medium">Net</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[...data].reverse().map((d) => (
                <tr key={d.month} className={cn("border-b border-border last:border-0", d.month === selected && "bg-muted/60")}>
                  <td className="px-3 py-1.5">{fmtMonth(d.month, "short")}</td>
                  <td className="px-3 py-1.5 text-right">{money.fmt(d.income)}</td>
                  <td className="px-3 py-1.5 text-right">{money.fmt(d.expense)}</td>
                  <td className={cn("px-3 py-1.5 text-right font-medium", d.net < 0 && "text-warning")}>{money.fmt(d.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={ref} className="relative w-full">
          {empty ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border px-4 text-center" style={{ height }}>
              <span className="text-sm text-muted-foreground">Your 12-month cashflow appears here once you log income and expenses.</span>
            </div>
          ) : (
            <svg width={W} height={height} role="img" aria-label="Income, expenses and net per month for the last 12 months">
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={pad.l} y1={y(t)} x2={pad.l + cw} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
                  <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
                    {money.compact(t)}
                  </text>
                </g>
              ))}
              {bottom < 0 && <line x1={pad.l} y1={zeroY} x2={pad.l + cw} y2={zeroY} stroke="var(--muted-foreground)" strokeOpacity={0.5} strokeWidth={1} />}

              {data.map((d, i) => {
                const x0 = cx(i) - bw - gap / 2;
                const x1 = cx(i) + gap / 2;
                const dim = hover != null && hover !== i;
                const isSel = d.month === selected;
                return (
                  <g key={d.month} opacity={dim ? 0.45 : 1}>
                    {isSel && <rect x={pad.l + i * slot + 1} y={pad.t} width={slot - 2} height={ch} rx={6} fill="var(--muted)" opacity={0.7} />}
                    <path d={colPath(x0, bw, y(d.income), zeroY)} fill={INCOME} />
                    <path d={colPath(x1, bw, y(d.expense), zeroY)} fill={EXPENSE} />
                    {i % labelEvery === 0 && (
                      <text
                        x={cx(i)}
                        y={height - 7}
                        textAnchor="middle"
                        className={cn("text-[10px]", isSel ? "fill-foreground font-semibold" : "fill-muted-foreground")}
                      >
                        {fmtMonth(d.month, "tiny")}
                      </text>
                    )}
                  </g>
                );
              })}

              <polyline points={linePts} fill="none" stroke={NET} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {data.map((d, i) => (
                <circle key={d.month} cx={cx(i)} cy={y(d.net)} r={hover === i ? 5 : 4} fill={NET} stroke="var(--card)" strokeWidth={2} />
              ))}

              {/* hit areas: whole month column, focusable */}
              {data.map((d, i) => (
                <rect
                  key={d.month}
                  x={pad.l + i * slot}
                  y={pad.t}
                  width={slot}
                  height={ch}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`${fmtMonth(d.month)}: income ${money.fmt(d.income)}, expenses ${money.fmt(d.expense)}, net ${money.fmt(d.net)}`}
                  className={cn("outline-none", onSelect && "cursor-pointer")}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  onClick={() => onSelect?.(d.month)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect?.(d.month);
                    }
                  }}
                />
              ))}
            </svg>
          )}

          {hv && hover != null && !empty && (
            <div
              className="pointer-events-none absolute z-30 w-48 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-raised"
              style={{ left: Math.min(Math.max(0, cx(hover) + 12), Math.max(0, W - 200)), top: 4 }}
            >
              <p className="mb-1.5 text-sm font-semibold">{fmtMonth(hv.month)}</p>
              <div className="space-y-1 text-xs">
                <Row swatch={INCOME} label="Income" value={money.fmt(hv.income)} />
                <Row swatch={EXPENSE} label="Expenses" value={money.fmt(hv.expense)} />
                <Row swatch={NET} line label="Net" value={money.fmt(hv.net)} strong />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ swatch, label, value, line, strong }: { swatch: string; label: string; value: string; line?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={line ? "h-0.5 w-2.5 rounded-full" : "size-2 rounded-sm"} style={{ background: swatch }} aria-hidden />
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", strong && "font-semibold")}>{value}</span>
    </div>
  );
}
