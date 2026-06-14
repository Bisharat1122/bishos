// Minimal date helpers for the Tasks calendar — no external dependency.

export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(d: Date | number): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date | number, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d: Date | number, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

/** Week starts on Sunday. */
export function startOfWeek(d: Date | number): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

export function isSameDay(a: Date | number, b: Date | number): boolean {
  const x = new Date(a);
  const y = new Date(b);
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
}

export function isToday(d: Date | number): boolean {
  return isSameDay(d, new Date());
}

/** 6×7 grid of days covering the month that contains `d` (Sun-first). */
export function monthMatrix(d: Date | number): Date[] {
  const first = new Date(d);
  first.setDate(1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function fmtDay(d: Date | number): string {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function fmtMonthYear(d: Date | number): string {
  return new Date(d).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function fmtRange(a: Date, b: Date): string {
  const sameMonth = a.getMonth() === b.getMonth();
  const left = a.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const right = b.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });
  return `${left} – ${right}`;
}
