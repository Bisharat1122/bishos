"use client";

import { useEffect, useState } from "react";

/**
 * Local-day helpers for the Life OS. Every Life OS `date` is a LOCAL
 * "YYYY-MM-DD" string; weeks start on Monday.
 */

export const DAY = 24 * 60 * 60 * 1000;

export function ymdOf(d: Date | number): string {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

export const todayYmd = () => ymdOf(new Date());

/** Local midnight Date for a ymd. */
export function dateOf(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDaysYmd(ymd: string, n: number): string {
  const d = dateOf(ymd);
  d.setDate(d.getDate() + n);
  return ymdOf(d);
}

export function diffDaysYmd(a: string, b: string): number {
  return Math.round((dateOf(b).getTime() - dateOf(a).getTime()) / DAY);
}

/** 0 = Sunday … 6 = Saturday */
export const weekdayOf = (ymd: string) => dateOf(ymd).getDay();

export function mondayOf(ymd: string): string {
  const wd = weekdayOf(ymd);
  return addDaysYmd(ymd, wd === 0 ? -6 : 1 - wd);
}

export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysYmd(weekStart, i));
}

export function fmtYmd(ymd: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) {
  return dateOf(ymd).toLocaleDateString(undefined, opts);
}

/** "Today" / "Tomorrow" / "Yesterday" / "in 3 days" / "Mon, Oct 21". */
export function relDay(ymd: string, today = todayYmd()): string {
  const n = diffDaysYmd(today, ymd);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 1 && n < 7) return fmtYmd(ymd, { weekday: "long" });
  if (n < -1 && n > -7) return `${-n} days ago`;
  return fmtYmd(ymd, { month: "short", day: "numeric" });
}

export function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function clockLabel(min: number): string {
  let h = Math.floor(min / 60);
  const m = min % 60;
  const ap = h < 12 || h === 24 ? "am" : "pm";
  h = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h}:${String(m).padStart(2, "0")}${ap}` : `${h}${ap}`;
}

/** "08:30" → 510 */
export function parseClock(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export const minToClock = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Today's local ymd that re-renders at midnight. */
export function useToday(): string {
  const [t, setT] = useState(todayYmd);
  useEffect(() => {
    const id = setInterval(() => {
      const n = todayYmd();
      setT((p) => (p === n ? p : n));
    }, 30_000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/** Current minute-of-day, ticking each 30s. */
export function useNowMin(): number {
  const get = () => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  };
  const [m, setM] = useState(get);
  useEffect(() => {
    const id = setInterval(() => setM(get()), 30_000);
    return () => clearInterval(id);
  }, []);
  return m;
}
