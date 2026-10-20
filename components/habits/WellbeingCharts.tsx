"use client";

import { useEffect, useRef, useState } from "react";
import { fmtYmd } from "@/lib/day";
import { cn } from "@/lib/utils";

function useWidth(initial = 600) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(initial);
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

function Placeholder({ height, text }: { height: number; text: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-border px-4 text-center" style={{ height }}>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

function Tip({ x, y, w, children }: { x: number; y: number; w: number; children: React.ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute z-20 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-raised"
      style={{ left: Math.min(Math.max(4, x - 60), Math.max(4, w - 128)), top: Math.max(0, y - 58), width: 124 }}
    >
      {children}
    </div>
  );
}

type TrendPoint = { date: string; energy: number | null; mood: number | null };
const SERIES = [
  { key: "energy" as const, label: "Energy", color: "var(--chart-1)" },
  { key: "mood" as const, label: "Mood", color: "var(--chart-2)" },
];

/** Energy + mood (1–5) over 30 days, one shared axis, gaps where no check-in. */
export function TrendChart({ data, height = 190 }: { data: TrendPoint[]; height?: number }) {
  const [ref, W] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 22, r: 8, t: 10, b: 22 };
  const cw = Math.max(10, W - pad.l - pad.r);
  const ch = height - pad.t - pad.b;
  const n = data.length;
  const x = (i: number) => pad.l + (n <= 1 ? cw / 2 : (cw * i) / (n - 1));
  const y = (v: number) => pad.t + ch * (1 - (v - 1) / 4);
  const has = data.some((d) => d.energy != null || d.mood != null);

  const path = (k: "energy" | "mood") => {
    let p = "";
    let pen = false;
    data.forEach((d, i) => {
      const v = d[k];
      if (v == null) {
        pen = false;
        return;
      }
      p += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
      pen = true;
    });
    return p;
  };

  const hv = hover != null ? data[hover] : null;
  return (
    <div ref={ref} className="relative w-full">
      <div className="mb-2 flex gap-4 text-xs text-muted-foreground">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      {!has ? (
        <Placeholder height={height} text="Your trend appears after a few morning check-ins." />
      ) : (
        <svg width={W} height={height} className="block max-w-full" role="img" aria-label="Energy and mood over the last 30 days">
          {[1, 3, 5].map((g) => (
            <g key={g}>
              <line x1={pad.l} x2={pad.l + cw} y1={y(g)} y2={y(g)} stroke="var(--border)" strokeWidth={1} />
              <text x={pad.l - 6} y={y(g) + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">
                {g}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % 7 === (n - 1) % 7 ? (
              <text key={d.date} x={x(i)} y={height - 6} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                {fmtYmd(d.date, { month: "short", day: "numeric" })}
              </text>
            ) : null,
          )}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ch} stroke="var(--muted-foreground)" strokeWidth={1} opacity={0.35} />}
          {SERIES.map((s) => (
            <g key={s.key}>
              <path d={path(s.key)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {data.map((d, i) =>
                d[s.key] != null ? (
                  <circle key={i} cx={x(i)} cy={y(d[s.key]!)} r={hover === i ? 5 : 3.5} fill={s.color} stroke="var(--card)" strokeWidth={2} />
                ) : null,
              )}
            </g>
          ))}
          <rect
            x={pad.l}
            y={pad.t}
            width={cw}
            height={ch}
            fill="transparent"
            onMouseMove={(e) => {
              const r = ref.current?.getBoundingClientRect();
              if (!r) return;
              const mx = e.clientX - r.left;
              setHover(Math.max(0, Math.min(n - 1, Math.round(((mx - pad.l) / cw) * (n - 1)))));
            }}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}
      {hv && hover != null && (
        <Tip x={x(hover)} y={pad.t + 40} w={W}>
          <p className="font-medium">{fmtYmd(hv.date)}</p>
          {hv.energy == null && hv.mood == null ? (
            <p className="text-muted-foreground">No check-in</p>
          ) : (
            <p className="tabular-nums text-muted-foreground">
              Energy {hv.energy ?? "–"} · Mood {hv.mood ?? "–"}
            </p>
          )}
        </Tip>
      )}
    </div>
  );
}

/** Average energy per weekday (Mon → Sun). */
export function WeekdayBars({ data, height = 150 }: { data: { weekday: number; energy: number | null; count: number }[]; height?: number }) {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const best = Math.max(0, ...data.map((d) => d.energy ?? 0));
  if (!data.some((d) => d.energy != null)) return <Placeholder height={height} text="Needs a couple of weeks of check-ins." />;
  return (
    <div className="flex items-end gap-1.5" style={{ height }} role="img" aria-label="Average energy by weekday">
      {data.map((d) => (
        <div key={d.weekday} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${names[d.weekday]}: ${d.energy ?? "–"} avg energy (${d.count} check-ins)`}>
          <span className="text-[10px] tabular-nums text-muted-foreground">{d.energy ?? "–"}</span>
          <div className="flex w-full flex-1 items-end justify-center">
            <div
              className={cn("w-full max-w-8 rounded-t", d.energy != null && d.energy === best ? "bg-chart-1" : "bg-chart-1/45")}
              style={{ height: `${((d.energy ?? 0) / 5) * 100}%`, minHeight: d.energy ? 3 : 0 }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{names[d.weekday].slice(0, 2)}</span>
        </div>
      ))}
    </div>
  );
}

/** Sleep hours (x) vs energy (y) for each check-in. */
export function SleepScatter({ pairs, height = 170 }: { pairs: { date: string; sleep: number; energy: number }[]; height?: number }) {
  const [ref, W] = useWidth(300);
  const [hover, setHover] = useState<number | null>(null);
  // Keep the measured wrapper mounted so the ResizeObserver attaches on first render.
  if (pairs.length < 3)
    return (
      <div ref={ref} className="w-full">
        <Placeholder height={height} text="Add sleep hours + energy to your check-ins to see the link." />
      </div>
    );
  const pad = { l: 22, r: 10, t: 10, b: 22 };
  const cw = Math.max(10, W - pad.l - pad.r);
  const ch = height - pad.t - pad.b;
  const lo = Math.floor(Math.min(4, ...pairs.map((p) => p.sleep)));
  const hi = Math.ceil(Math.max(10, ...pairs.map((p) => p.sleep)));
  const x = (s: number) => pad.l + ((s - lo) / (hi - lo)) * cw;
  const y = (e: number) => pad.t + ch * (1 - (e - 1) / 4);
  const jitter = (i: number) => (((i * 37) % 7) - 3) * 0.04;
  const ticks = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((t) => (hi - lo > 6 ? t % 2 === 0 : true));
  const hv = hover != null ? pairs[hover] : null;
  return (
    <div ref={ref} className="relative w-full">
      <svg width={W} height={height} className="block max-w-full" role="img" aria-label="Sleep hours versus energy">
        {[1, 3, 5].map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={pad.l + cw} y1={y(g)} y2={y(g)} stroke="var(--border)" strokeWidth={1} />
            <text x={pad.l - 6} y={y(g) + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">
              {g}
            </text>
          </g>
        ))}
        {ticks.map((t) => (
          <text key={t} x={x(t)} y={height - 6} textAnchor="middle" className="fill-muted-foreground text-[9px]">
            {t}h
          </text>
        ))}
        <line x1={x(7)} x2={x(7)} y1={pad.t} y2={pad.t + ch} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeWidth={1} opacity={0.4} />
        {pairs.map((p, i) => (
          <circle
            key={p.date}
            cx={x(p.sleep)}
            cy={y(p.energy + jitter(i))}
            r={hover === i ? 6 : 4.5}
            fill="var(--chart-1)"
            fillOpacity={0.75}
            stroke="var(--card)"
            strokeWidth={2}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {hv && hover != null && (
        <Tip x={x(hv.sleep)} y={y(hv.energy)} w={W}>
          <p className="font-medium">{fmtYmd(hv.date)}</p>
          <p className="tabular-nums text-muted-foreground">
            {hv.sleep}h sleep · energy {hv.energy}
          </p>
        </Tip>
      )}
    </div>
  );
}

const hourLabel = (h: number) => (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`);

/** Focus minutes by start hour — the user's own curve. */
export function FocusHours({ byHour, topHours, height = 150 }: { byHour: { hour: number; minutes: number; sessions: number }[]; topHours: number[]; height?: number }) {
  const withData = byHour.filter((b) => b.minutes > 0);
  if (!withData.length) return <Placeholder height={height} text="Run a few focus sessions to see your best hours." />;
  const first = Math.min(6, ...withData.map((b) => b.hour));
  const last = Math.max(22, ...withData.map((b) => b.hour));
  const slice = byHour.slice(first, last + 1);
  const max = Math.max(1, ...slice.map((b) => b.minutes));
  const top = new Set(topHours);
  return (
    <div role="img" aria-label="Focus minutes by hour of day">
      <div className="flex items-end gap-[2px]" style={{ height }}>
        {slice.map((b) => (
          <div
            key={b.hour}
            className="flex h-full min-w-0 flex-1 items-end"
            title={`${hourLabel(b.hour)}: ${b.minutes} min focus · ${b.sessions} session${b.sessions === 1 ? "" : "s"}`}
          >
            <div
              className={cn("w-full rounded-t-[3px]", top.has(b.hour) ? "bg-chart-1" : "bg-chart-1/35")}
              style={{ height: `${(b.minutes / max) * 100}%`, minHeight: b.minutes ? 2 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[2px]">
        {slice.map((b) => (
          <span key={b.hour} className="min-w-0 flex-1 text-center text-[9px] text-muted-foreground">
            {b.hour % 3 === 0 ? hourLabel(b.hour) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export { hourLabel };
