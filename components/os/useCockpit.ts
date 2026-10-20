"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { dateOf, mondayOf, useToday } from "@/lib/day";

/**
 * Keep the last loaded value while a query re-subscribes (Convex returns
 * `undefined` whenever args change — e.g. when the coarse clock ticks), so
 * screens never flash back to skeletons.
 */
export function useStable<T>(value: T | undefined): T | undefined {
  const ref = useRef<T | undefined>(value);
  if (value !== undefined) ref.current = value;
  return value ?? ref.current;
}

/**
 * Coarse "now", aligned to fixed clock boundaries (every 5 min by default).
 * Every component that asks for the same interval gets the SAME value, so
 * queries using it share one cached subscription (instant page switches)
 * instead of each page re-fetching with a slightly different timestamp.
 */
export function useCoarseNow(everyMs = 5 * 60 * 1000) {
  const align = () => Math.floor(Date.now() / everyMs) * everyMs;
  const [now, setNow] = useState(align);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const next = align() + everyMs;
      t = setTimeout(() => {
        setNow(align());
        schedule();
      }, Math.max(1000, next - Date.now() + 50));
    };
    setNow(align());
    schedule();
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [everyMs]);
  return now;
}

/** Args for every "today" query: local date, local midnight, coarse now. */
export function useDayArgs() {
  const date = useToday();
  const now = useCoarseNow();
  return { date, dayStart: dateOf(date).getTime(), now };
}

export function useCockpit(enabled = true) {
  const args = useDayArgs();
  const data = useStable(useQuery(api.today.cockpit, enabled ? args : "skip"));
  return { args: { ...args, weekStart: mondayOf(args.date) }, data };
}
