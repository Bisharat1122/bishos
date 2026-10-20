/**
 * Shared optimistic updates for the highest-traffic clicks. The UI flips at
 * once; Convex replaces the guess with the real result when the mutation
 * lands (and rolls it back automatically if the mutation fails).
 */
import type { OptimisticLocalStore } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type Status = Doc<"tasks">["status"];

/** Set one task's status in every live cockpit + task-list result. */
export function patchTaskStatus(store: OptimisticLocalStore, id: Id<"tasks">, status: Status | ((cur: Status) => Status)) {
  const next = (t: Doc<"tasks">) => (typeof status === "function" ? status(t.status) : status);
  const fix = (list: Doc<"tasks">[]) => list.map((t) => (t._id === id ? { ...t, status: next(t) } : t));
  for (const { args, value } of store.getAllQueries(api.today.cockpit)) {
    if (!value) continue;
    store.setQuery(api.today.cockpit, args, {
      ...value,
      top3: fix(value.top3),
      planned: fix(value.planned),
      scheduledToday: fix(value.scheduledToday),
      dueToday: fix(value.dueToday),
    });
  }
  const list = store.getQuery(api.tasks.list, {});
  if (list) store.setQuery(api.tasks.list, {}, fix(list));
}

type HabitKind = "done" | "min" | "stretch" | "skip" | "clear";

/** Show a habit check-in at once on Today (strip + cockpit). */
export function patchHabitLog(store: OptimisticLocalStore, id: Id<"habits">, date: string, kind: HabitKind) {
  const k = kind === "clear" ? null : kind;
  const live = store.getQuery(api.habits.today, { date });
  if (live) store.setQuery(api.habits.today, { date }, live.map((h) => (h._id === id ? { ...h, kind: k, done: !!k && k !== "skip" } : h)));
  for (const { args, value } of store.getAllQueries(api.today.cockpit)) {
    if (!value || args.date !== date) continue;
    store.setQuery(api.today.cockpit, args, { ...value, habits: value.habits.map((h) => (h._id === id ? { ...h, kind: k } : h)) });
  }
}
