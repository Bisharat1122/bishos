import { v } from "convex/values";

const DAY = 24 * 60 * 60 * 1000;

/** Validator for the dashboard / module range filter. */
export const rangeValidator = v.union(
  v.literal("today"),
  v.literal("week"),
  v.literal("month"),
  v.literal("custom"),
);

export type RangeKey = "today" | "week" | "month" | "custom";

/**
 * Resolve a range key (+ optional custom bounds) to a [from, to) millisecond
 * window. Shared by Momentum and the dashboard overview so every module reads
 * the same window. `to` is exclusive.
 */
export function resolveRange(range: RangeKey, start?: number, end?: number): { from: number; to: number } {
  const now = Date.now();
  const day0 = new Date(now);
  day0.setHours(0, 0, 0, 0);

  if (range === "today") {
    const from = day0.getTime();
    return { from, to: from + DAY };
  }
  if (range === "week") {
    const ws = new Date(day0);
    ws.setDate(ws.getDate() - ws.getDay());
    const from = ws.getTime();
    return { from, to: from + 7 * DAY };
  }
  if (range === "month") {
    const from = new Date(day0.getFullYear(), day0.getMonth(), 1).getTime();
    const to = new Date(day0.getFullYear(), day0.getMonth() + 1, 1).getTime();
    return { from, to };
  }
  // custom
  return { from: start ?? day0.getTime(), to: (end ?? now) + DAY };
}
