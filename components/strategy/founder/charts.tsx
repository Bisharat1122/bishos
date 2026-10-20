"use client";

/**
 * Compact chart primitives for Founder HQ. Inline SVG / divs, Syncora tokens
 * only (colour = meaning), responsive width, fixed height (no layout shift).
 * Every chart carries an aria-label; the numbers are always printed next to it.
 */
import { cn, type MeterTone } from "@/components/os/kit";

const TEXT: Record<MeterTone, string> = {
  primary: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  sprint: "text-sprint",
};
const BG: Record<MeterTone, string> = {
  primary: "bg-foreground",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  sprint: "bg-sprint",
};

/** Tone for "more is better" progress against a target. */
export function floorTone(value: number, target: number): MeterTone {
  if (target <= 0) return "primary";
  return value >= target ? "success" : "primary";
}

/** Tone for a ceiling (hours cap): calm under 85%, info near it, warning at/over it. */
export function ceilingTone(value: number, cap: number): MeterTone {
  if (cap <= 0) return "primary";
  const p = value / cap;
  return p >= 1 ? "warning" : p >= 0.85 ? "info" : "primary";
}

/**
 * Bullet chart: a performance bar against a target marker. The band up to the
 * target is shaded so "how far to go" reads without colour.
 */
export function BulletBar({
  value,
  target,
  max,
  tone,
  label,
  className,
  thick,
}: {
  value: number;
  target: number | null | undefined;
  max?: number;
  tone?: MeterTone;
  label: string;
  className?: string;
  thick?: boolean;
}) {
  const t = target ?? 0;
  const top = Math.max(max ?? 0, t * 1.2, value, 1);
  const vp = Math.min(100, (Math.max(0, value) / top) * 100);
  const tp = Math.min(100, (t / top) * 100);
  const k = tone ?? (t ? floorTone(value, t) : "primary");
  return (
    <div role="img" aria-label={label} className={cn("relative w-full py-1", className)}>
      <div className={cn("relative w-full overflow-hidden rounded-full bg-muted", thick ? "h-2.5" : "h-2")}>
        {t > 0 && <div className="absolute inset-y-0 left-0 bg-muted-foreground/15" style={{ width: `${tp}%` }} />}
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out", BG[k])}
          style={{ width: `${vp}%` }}
        />
      </div>
      {t > 0 && (
        <span
          aria-hidden
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
          style={{ left: `${tp}%` }}
        />
      )}
    </div>
  );
}

/** Responsive sparkline (fills its width) with an optional dashed target line. */
export function TrendLine({
  values,
  target,
  tone = "info",
  height = 28,
  label,
  className,
  floorZero = true,
}: {
  values: (number | null)[];
  target?: number | null;
  tone?: MeterTone;
  height?: number;
  label: string;
  className?: string;
  floorZero?: boolean;
}) {
  const pts = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v != null);
  const n = Math.max(2, values.length);
  const pad = 3;
  const all = [...pts.map((p) => p.v), ...(target != null ? [target] : [])];
  const max = all.length ? Math.max(...all) : 1;
  const min = floorZero ? Math.min(0, ...all) : Math.min(...all);
  const span = max - min || 1;
  const x = (i: number) => (i / (n - 1)) * 100;
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - 2 * pad);
  const last = pts[pts.length - 1];
  const line = pts.map((p) => `${x(p.i)},${y(p.v)}`).join(" ");
  return (
    <div role="img" aria-label={label} className={cn("relative w-full", TEXT[tone], className)} style={{ height }}>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {target != null && (
          <line
            x1={0}
            x2={100}
            y1={y(target)}
            y2={y(target)}
            className="stroke-muted-foreground/60"
            strokeDasharray="3 3"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {pts.length > 1 ? (
          <>
            <polygon points={`${x(pts[0].i)},${height} ${line} ${x(last.i)},${height}`} fill="currentColor" fillOpacity={0.12} />
            <polyline
              points={line}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : (
          <line
            x1={0}
            x2={100}
            y1={height - pad}
            y2={height - pad}
            className="stroke-muted-foreground/40"
            strokeDasharray="3 3"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {last && (
        <span
          aria-hidden
          className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current"
          style={{ left: `${x(last.i)}%`, top: y(last.v) }}
        />
      )}
    </div>
  );
}

/**
 * Weekly bars (oldest → newest). With a target, weeks that hit it are success;
 * otherwise non-zero weeks use `barClass`. The last bar is this (unfinished) week.
 */
export function WeekBars({
  values,
  target,
  height = 28,
  titles,
  barClass = "bg-chart-1/70",
  label,
  className,
}: {
  values: number[];
  target?: number | null;
  height?: number;
  titles?: string[];
  barClass?: string;
  label: string;
  className?: string;
}) {
  const max = Math.max(1, target ?? 0, ...values);
  const last = values.length - 1;
  return (
    <div role="img" aria-label={label} className={cn("relative w-full", className)} style={{ height }}>
      <div className="flex h-full items-end gap-[3px]">
        {values.map((v, i) => {
          const hit = target != null && target > 0 && v >= target;
          return (
            <div
              key={i}
              title={titles?.[i]}
              className={cn(
                "flex-1 rounded-[3px] transition-[height] duration-500",
                v <= 0 ? "bg-muted" : hit ? "bg-success" : barClass,
                i === last && v > 0 && "opacity-80",
              )}
              style={{ height: `${v > 0 ? Math.max(14, (v / max) * 100) : 10}%` }}
            />
          );
        })}
      </div>
      {target != null && target > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/60"
          style={{ bottom: `${(target / max) * 100}%` }}
        />
      )}
    </div>
  );
}

/** Pipeline shape: one segment per stage, sized by deal count, later stages darker. */
export function StageStrip({
  stages,
  label,
  height = 10,
}: {
  stages: { key: string; label: string; count: number }[];
  label: string;
  height?: number;
}) {
  const n = stages.length;
  const any = stages.some((s) => s.count > 0);
  return (
    <div role="img" aria-label={label} className="flex w-full gap-px overflow-hidden rounded-full bg-muted" style={{ height }}>
      {any &&
        stages.map((s, i) =>
          s.count > 0 ? (
            <div
              key={s.key}
              title={`${s.label}: ${s.count}`}
              className="h-full bg-chart-1"
              style={{ flexGrow: s.count, opacity: 0.35 + (0.65 * (i + 1)) / n }}
            />
          ) : null,
        )}
    </div>
  );
}
