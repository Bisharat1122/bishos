"use client";

import { useMemo } from "react";
import { ConvexError } from "convex/values";
import { fmtYmd, addDaysYmd } from "@/lib/day";

/** A readable message from a Convex mutation error (ConvexError or Error). */
export function errMsg(e: unknown): string {
  if (e instanceof ConvexError) return typeof e.data === "string" ? e.data : JSON.stringify(e.data);
  const m = e instanceof Error ? e.message : String(e);
  // "[CONVEX M(goals:create)] [Request ID: …] Server Error Uncaught Error: msg at handler…"
  const cleaned = m.replace(/^\[CONVEX[^\]]*\]\s*/, "").replace(/\[Request ID:[^\]]*\]\s*/, "").replace(/^Server Error\s*/, "");
  const unc = /Uncaught (?:Convex)?Error:\s*([\s\S]*?)(?:\s+at\s|\n|$)/.exec(cleaned);
  return (unc ? unc[1] : cleaned).trim() || "Something went wrong.";
}

/** Client timezone offset (minutes, as Date#getTimezoneOffset) for server windows. */
export function useTz() {
  return useMemo(() => new Date().getTimezoneOffset(), []);
}

export type BlockType = "maker" | "manager" | "admin" | "routine" | "free";
export type DayType = "focus" | "buffer" | "free";

/** Block types → token colours (chart-1..4 + success for free). */
export const BLOCK_TYPES: Record<BlockType, { label: string; hint: string; color: string }> = {
  maker: { label: "Maker", hint: "Deep work in half-day units", color: "var(--chart-1)" },
  manager: { label: "Manager", hint: "Calls, meetings, office hours", color: "var(--chart-3)" },
  admin: { label: "Admin", hint: "Buffer: email, finance, processes", color: "var(--chart-2)" },
  routine: { label: "Routine", hint: "Rituals, workouts, reviews", color: "var(--chart-4)" },
  free: { label: "Free", hint: "Protected rest — no work", color: "var(--success)" },
};
export const BLOCK_TYPE_KEYS = Object.keys(BLOCK_TYPES) as BlockType[];

export const DAY_TYPES: Record<DayType, { label: string; tone: "info" | "warning" | "success"; hint: string }> = {
  focus: { label: "Focus", tone: "info", hint: "Revenue + delivery work" },
  buffer: { label: "Buffer", tone: "warning", hint: "Prep, admin, catch-up" },
  free: { label: "Free", tone: "success", hint: "No work, midnight to midnight" },
};

/** "Oct 19 – 25" / "Oct 27 – Nov 2". */
export function fmtRange(start: string, end: string) {
  const a = fmtYmd(start, { month: "short", day: "numeric" });
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const b = sameMonth ? fmtYmd(end, { day: "numeric" }) : fmtYmd(end, { month: "short", day: "numeric" });
  return `${a} – ${b}`;
}

export const weekRange = (weekStart: string) => fmtRange(weekStart, addDaysYmd(weekStart, 6));

export function fmtMonth(period: string) {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** YYYY-MM ± n */
export function shiftMonth(period: string, n: number) {
  const [y, m] = period.split("-").map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

export const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

/** Short relative time for a timestamp. */
export function ago(ms?: number) {
  if (!ms) return "never";
  const d = Math.floor((Date.now() - ms) / 86_400_000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 14) return `${d} days ago`;
  if (d < 60) return `${Math.round(d / 7)} weeks ago`;
  return `${Math.round(d / 30)} months ago`;
}

/** Human label for a review period. */
export function periodLabel(kind: "weekly" | "monthly" | "quarterly" | "annual", periodKey: string, start: string, end: string, cycleName?: string) {
  if (kind === "weekly") return `Week of ${fmtRange(start, end)}`;
  if (kind === "monthly") return fmtMonth(periodKey);
  if (kind === "annual") return periodKey;
  return cycleName ? `${cycleName} · ${fmtRange(start, end)}` : `${/^\d{4}-Q\d$/.test(periodKey) ? periodKey : "12-week cycle"} · ${fmtRange(start, end)}`;
}
