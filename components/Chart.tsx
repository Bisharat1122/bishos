"use client";

import { useEffect, useRef, useState } from "react";

const PALETTE = [
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#8b5cf6", "#f59e0b", "#ec4899",
];
export function categoryColor(color: string | undefined, index: number) {
  return color || PALETTE[index % PALETTE.length];
}

/** Measure container width so the SVG renders in crisp pixel coords (and on resize). */
function useWidth() {
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
  }, []);
  return [ref, w] as const;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

export type Segment = { name: string; value: number; color?: string };
export type Item = { label: string; sub?: string; color?: string; hours: number };
export type Bar = { label: string; segments: Segment[]; items?: Item[]; total?: number };

/** Stacked bar chart by category, with gridlines, axis, legend, and a rich
 * hover tooltip listing the tasks/sections worked on in that bar. */
export function BarChart({
  data,
  height = 230,
  unit = "",
}: {
  data: Bar[];
  height?: number;
  unit?: string;
}) {
  const [ref, W] = useWidth();
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const pad = { l: 34, r: 10, t: 12, b: 26 };
  const cw = Math.max(10, W - pad.l - pad.r);
  const ch = height - pad.t - pad.b;

  const totals = data.map((d) => d.segments.reduce((s, x) => s + x.value, 0));
  const max = niceMax(Math.max(0, ...totals));
  const n = Math.max(1, data.length);
  const slot = cw / n;
  const bw = Math.min(46, slot * 0.62);

  const legend: { name: string; color: string }[] = [];
  data.forEach((d) =>
    d.segments.forEach((s, i) => {
      if (s.value > 0 && !legend.find((l) => l.name === s.name))
        legend.push({ name: s.name, color: categoryColor(s.color, legend.length + i) });
    }),
  );
  const colorOf = (name: string, fallback?: string) =>
    legend.find((l) => l.name === name)?.color ?? categoryColor(fallback, 0);

  const gridY = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.ceil(n / 9);

  function onMove(i: number, e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ i, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const hovered = hover ? data[hover.i] : null;

  return (
    <div ref={ref} className="relative w-full">
      {totals.every((t) => t === 0) ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border" style={{ height }}>
          <span className="text-sm text-muted-foreground">No data in this range yet.</span>
        </div>
      ) : (
        <svg width={W} height={height}>
          {gridY.map((g) => {
            const y = pad.t + ch * (1 - g);
            return (
              <g key={g}>
                <line x1={pad.l} y1={y} x2={pad.l + cw} y2={y} stroke="hsl(var(--border))" strokeWidth={1} opacity={0.5} />
                <text x={pad.l - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">
                  {Math.round(max * g)}{unit}
                </text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const x = pad.l + i * slot + (slot - bw) / 2;
            let yCursor = pad.t + ch;
            return (
              <g key={i}>
                {d.segments
                  .filter((s) => s.value > 0)
                  .map((s, j) => {
                    const h = (s.value / max) * ch;
                    yCursor -= h;
                    return (
                      <rect
                        key={j}
                        x={x}
                        y={yCursor}
                        width={bw}
                        height={Math.max(0, h)}
                        rx={3}
                        fill={colorOf(s.name, s.color)}
                        opacity={hover && hover.i !== i ? 0.45 : 1}
                      />
                    );
                  })}
                {i % labelEvery === 0 && (
                  <text x={x + bw / 2} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                    {d.label}
                  </text>
                )}
                {/* hover hit area spanning the whole column */}
                <rect
                  x={pad.l + i * slot}
                  y={pad.t}
                  width={slot}
                  height={ch}
                  fill="transparent"
                  onMouseEnter={(e) => onMove(i, e)}
                  onMouseMove={(e) => onMove(i, e)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>
      )}

      {/* rich tooltip */}
      {hover && hovered && (
        <div
          className="pointer-events-none absolute z-30 w-56 rounded-xl border border-border bg-card p-3 shadow-xl"
          style={{ left: Math.min(hover.x + 12, Math.max(0, W - 232)), top: Math.max(0, hover.y - 8) }}
        >
          <p className="mb-1.5 flex items-center justify-between text-sm font-semibold">
            <span>{hovered.label}</span>
            <span className="text-muted-foreground">{totals[hover.i].toFixed(1)}{unit}</span>
          </p>
          {hovered.items && hovered.items.length > 0 ? (
            <div className="space-y-1">
              {hovered.items.map((it, k) => (
                <div key={k} className="flex items-start gap-1.5 text-xs">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-sm" style={{ background: it.color || "#6b7280" }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-foreground">{it.label}</span>
                    {it.sub && <span className="block truncate text-muted-foreground">{it.sub}</span>}
                  </span>
                  <span className="shrink-0 text-muted-foreground">{it.hours.toFixed(1)}{unit}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No tasks logged for this bar.</p>
          )}
        </div>
      )}

      {legend.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {legend.map((l) => (
            <span key={l.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
              {l.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Line chart for trends (e.g. energy/mood over time). */
export function LineChart({
  data,
  height = 160,
  max,
  unit = "",
}: {
  data: { label: string; value: number }[];
  height?: number;
  max?: number;
  unit?: string;
}) {
  const [ref, W] = useWidth();
  const pad = { l: 28, r: 10, t: 12, b: 22 };
  const cw = Math.max(10, W - pad.l - pad.r);
  const ch = height - pad.t - pad.b;
  const top = max ?? niceMax(Math.max(1, ...data.map((d) => d.value)));
  const n = Math.max(1, data.length);
  const x = (i: number) => pad.l + (n === 1 ? cw / 2 : (cw * i) / (n - 1));
  const y = (v: number) => pad.t + ch * (1 - v / top);
  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const labelEvery = Math.ceil(n / 8);

  return (
    <div ref={ref} className="w-full">
      {data.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border" style={{ height }}>
          <span className="text-sm text-muted-foreground">No data yet.</span>
        </div>
      ) : (
        <svg width={W} height={height}>
          {[0, 0.5, 1].map((g) => {
            const yy = pad.t + ch * (1 - g);
            return (
              <g key={g}>
                <line x1={pad.l} y1={yy} x2={pad.l + cw} y2={yy} stroke="hsl(var(--border))" strokeWidth={1} opacity={0.5} />
                <text x={pad.l - 6} y={yy + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">
                  {Math.round(top * g)}{unit}
                </text>
              </g>
            );
          })}
          <polyline points={pts} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(d.value)} r={3} fill="hsl(var(--primary))">
                <title>{d.label}: {d.value}{unit}</title>
              </circle>
              {i % labelEvery === 0 && (
                <text x={x(i)} y={height - 6} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                  {d.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
