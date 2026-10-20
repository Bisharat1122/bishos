"use client";

/**
 * Analytics primitives — lean inline-SVG building blocks (no chart library).
 *
 * Dataviz rules applied everywhere:
 *  - colour only for meaning: categorical series use var(--chart-1..5) in fixed
 *    order; sequential = one hue light→dark; status tokens only for good/bad;
 *  - text never wears the series colour (labels use text tokens, a swatch or
 *    line-key carries identity);
 *  - every chart has a hover/focus tooltip AND a table view, so no value is
 *    gated behind colour or hover;
 *  - thin marks, hairline solid gridlines, light AND dark via tokens.
 */

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Table2, ChartLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtYmd } from "@/lib/day";

// ─────────────────────────────────────────────────────────────────────────
// Colour roles
// ─────────────────────────────────────────────────────────────────────────

export const CAT = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"] as const;
/** De-emphasis gray for context series ("planned", "missed", "Other"). */
export const GRAY = "color-mix(in oklab, var(--muted-foreground) 50%, var(--card))";
/** Sequential step of one hue (0–100 = share of the hue over the card surface). */
export const seq = (p: number, hue = "var(--chart-1)") => `color-mix(in oklab, ${hue} ${p}%, var(--card))`;

// ─────────────────────────────────────────────────────────────────────────
// Formatting
// ─────────────────────────────────────────────────────────────────────────

export const fmtInt = (n: number) => Math.round(n).toLocaleString();
export function compact(n: number): string {
  const a = Math.abs(n);
  const s = a >= 1e6 ? `${+(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `${+(a / 1e3).toFixed(1)}K` : `${+a.toFixed(a < 10 && a % 1 ? 1 : 0)}`;
  return n < 0 ? `-${s}` : s;
}
export function money(n: number, currency: string, full = false): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: full ? "standard" : "compact",
      maximumFractionDigits: full ? 0 : 1,
    }).format(n);
  } catch {
    return `${currency} ${full ? fmtInt(n) : compact(n)}`;
  }
}
/** "Oct 13" — short x-axis label for a week (its Monday). */
export const wkLabel = (ymd: string) => fmtYmd(ymd, { month: "short", day: "numeric" });
/** "Week of Oct 13" — tooltip title. */
export const wkTitle = (ymd: string) => `Week of ${fmtYmd(ymd, { month: "short", day: "numeric", year: "numeric" })}`;

// ─────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────

// Measure before paint so the first frame already has the right width (no overflow flash).
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Container width (crisp pixel-space SVG). 0 until measured (layout effect, before paint). */
export function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = (cw: number) => cw > 0 && setW(Math.round(cw));
    measure(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => measure(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/**
 * Keyboard + pointer index for a chart: one tab stop, arrows move between
 * data positions, Escape clears. Same tooltip on focus as on hover.
 */
export function useChartNav(n: number) {
  const [active, setActive] = useState<number | null>(null);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!n) return;
    let next: number | null = active;
    if (e.key === "ArrowRight") next = active == null ? n - 1 : Math.min(n - 1, active + 1);
    else if (e.key === "ArrowLeft") next = active == null ? n - 1 : Math.max(0, active - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else if (e.key === "Escape") next = null;
    else return;
    e.preventDefault();
    setActive(next);
  };
  return {
    active,
    setActive,
    focusProps: {
      tabIndex: 0,
      onKeyDown,
      onFocus: () => setActive((a) => a ?? n - 1),
      onBlur: () => setActive(null),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Scales
// ─────────────────────────────────────────────────────────────────────────

export function niceMax(v: number) {
  if (!(v > 0)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 3 ? 3 : n <= 4 ? 4 : n <= 5 ? 5 : n <= 6 ? 6 : n <= 8 ? 8 : 10;
  return step * pow;
}

/** Which x labels to print for n slots at width w (min ~52px apart). */
export const labelStep = (n: number, w: number, minGap = 52) => Math.max(1, Math.ceil(n / Math.max(1, Math.floor(w / minGap))));

/** Rounded-top bar path (4px data-end, square at the baseline). */
export function topRounded(x: number, y: number, w: number, h: number, r = 4) {
  const rr = Math.max(0, Math.min(r, h, w / 2));
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

// ─────────────────────────────────────────────────────────────────────────
// Tooltip, legend, card, table
// ─────────────────────────────────────────────────────────────────────────

export type TipRow = { label: string; value: string; color?: string; bold?: boolean };

/** Tooltip anchored beside x (flips side past the midline so it never covers the mark). */
export function Tip({ x, width, title, rows, top = 4, note }: { x: number; width: number; title: string; rows: TipRow[]; top?: number; note?: string }) {
  const tw = Math.min(208, width - 8);
  const left = x > width / 2 ? Math.max(0, x - 14 - tw) : Math.min(width - tw, x + 14);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute z-30 rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-raised"
      style={{ left, top, width: tw }}
    >
      <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
      <div className="mt-1 space-y-0.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {r.color ? <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: r.color }} aria-hidden /> : <span className="w-3 shrink-0" />}
            <span className={cn("tabular-nums text-foreground", r.bold === false ? "font-medium" : "font-semibold")}>{r.value}</span>
            <span className="min-w-0 truncate text-muted-foreground">{r.label}</span>
          </div>
        ))}
      </div>
      {note && <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}

export type LegendItem = { label: string; color: string; shape?: "rect" | "line" | "outline" };

export function Legend({ items, className }: { items: LegendItem[]; className?: string }) {
  if (!items.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1", className)} aria-label="Legend">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {it.shape === "line" ? (
            <span className="h-0.5 w-3.5 rounded-full" style={{ background: it.color }} aria-hidden />
          ) : it.shape === "outline" ? (
            <span className="size-2.5 rounded-sm border-[1.5px]" style={{ borderColor: it.color }} aria-hidden />
          ) : (
            <span className="size-2.5 rounded-sm" style={{ background: it.color }} aria-hidden />
          )}
          {it.label}
        </li>
      ))}
    </ul>
  );
}

export type TableData = { columns: string[]; rows: (string | number | null)[][] };

export function DataTable({ data, caption }: { data: TableData; caption: string }) {
  return (
    <div className="max-h-[300px] overflow-auto rounded-lg border border-border scrollbar-thin">
      <table className="w-full text-left text-xs">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-muted">
          <tr>
            {data.columns.map((c, i) => (
              <th key={i} scope="col" className={cn("whitespace-nowrap px-3 py-2 font-medium text-muted-foreground", i > 0 && "text-right")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((cell, j) =>
                j === 0 ? (
                  <th key={j} scope="row" className="whitespace-nowrap px-3 py-1.5 font-medium">
                    {cell ?? "—"}
                  </th>
                ) : (
                  <td key={j} className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">
                    {cell ?? "—"}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A chart card: title + one-line hint + "Table" toggle (the accessible twin
 * of every chart) + optional link to the module.
 */
export function ChartCard({
  title,
  hint,
  href,
  hrefLabel = "Open",
  table,
  children,
  className,
  stat,
}: {
  title: ReactNode;
  hint?: ReactNode;
  href?: string;
  hrefLabel?: string;
  table?: TableData | null;
  children: ReactNode;
  className?: string;
  stat?: ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  const caption = typeof title === "string" ? title : "Chart data";
  return (
    <section className={cn("flex min-w-0 flex-col rounded-xl border border-border bg-card text-card-foreground shadow-card", className)}>
      <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {table && table.rows.length > 0 && (
            <button
              type="button"
              onClick={() => setAsTable((v) => !v)}
              aria-pressed={asTable}
              title={asTable ? "Show chart" : "Show as table"}
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {asTable ? <ChartLine className="h-4 w-4" aria-hidden /> : <Table2 className="h-4 w-4" aria-hidden />}
              <span className="sr-only">{asTable ? "Show chart" : "Show as table"}</span>
            </button>
          )}
          {href && (
            <Link
              href={href}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {hrefLabel} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </div>
      </div>
      {stat && <div className="px-4 pt-2 sm:px-5">{stat}</div>}
      <div className="flex-1 p-4 pt-3 sm:px-5 sm:pb-5">{asTable && table ? <DataTable data={table} caption={caption} /> : children}</div>
    </section>
  );
}

/** Inline headline numbers inside a chart card. */
export function StatRow({ items }: { items: { label: string; value: ReactNode; sub?: ReactNode }[] }) {
  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map((it) => (
        <div key={it.label} className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{it.label}</dt>
          <dd className="text-lg font-semibold leading-tight tracking-tight">
            {it.value}
            {it.sub && <span className="ml-1 text-xs font-normal text-muted-foreground">{it.sub}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Empty state sized exactly like the chart it replaces (no layout shift). */
export function ChartEmpty({ height, title, hint, href, cta }: { height: number; title: string; hint?: string; href?: string; cta?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 text-center" style={{ minHeight: height }}>
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>}
      {href && cta && (
        <Link href={href} className="mt-1 inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90">
          {cta} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
