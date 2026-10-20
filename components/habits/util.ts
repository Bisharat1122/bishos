import { ConvexError } from "convex/values";

/** Friendly message from a Convex mutation error (ConvexError data reaches the client). */
export function errText(err: unknown, fallback = "Something went wrong — try again."): string {
  if (err instanceof ConvexError) return String(err.data);
  if (err instanceof Error && err.message && !/Server Error/i.test(err.message)) {
    // Strip Convex's "[CONVEX M(x)] [Request ID: …]" prefix + stack noise.
    const m = /Uncaught (?:Convex)?Error: ([^\n]+)/.exec(err.message);
    return m ? m[1] : err.message.split("\n")[0];
  }
  return fallback;
}

export type HabitKind = "done" | "min" | "stretch" | "skip";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "any";

export const TIME_OF_DAY: { value: TimeOfDay; label: string; hint: string }[] = [
  { value: "morning", label: "Morning", hint: "Before noon" },
  { value: "afternoon", label: "Afternoon", hint: "Noon – 6pm" },
  { value: "evening", label: "Evening", hint: "After 6pm" },
  { value: "any", label: "Anytime", hint: "Whenever the cue happens" },
];

export const KIND_LABEL: Record<HabitKind, string> = {
  done: "Done",
  min: "2-min version",
  stretch: "Stretch",
  skip: "Reserve skip",
};

/** Current part of the day (for "now" highlighting). */
export function timeOfDayNow(d = new Date()): TimeOfDay {
  const h = d.getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

export const isDone = (k: HabitKind | null | undefined) => !!k && k !== "skip";

/** Safe localStorage helpers (private mode / blocked storage never throw). */
export function lsGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function lsSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: n < 100 ? 2 : 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(n < 100 ? 2 : 0)}`;
  }
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
