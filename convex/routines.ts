/**
 * Routines (module E): short checklists triggered by one anchor and tracked
 * as ONE unit — completed, partial or minimum. Each step can be marked as
 * part of the minimum version for bad days. Dates are client-local YYYY-MM-DD.
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, awardXp, mondayOf, revokeXp, ritualStreak, XP, ymdUtc } from "./os";

const kindValidator = v.union(
  v.literal("morning"),
  v.literal("startup"),
  v.literal("shutdown"),
  v.literal("evening"),
  v.literal("weekly"),
  v.literal("custom"),
);
const stepValidator = v.object({
  id: v.string(),
  text: v.string(),
  minutes: v.optional(v.number()),
  minimum: v.optional(v.boolean()),
});

type Step = { id: string; text: string; minutes?: number; minimum?: boolean };
type Kind = Doc<"routines">["kind"];

const sid = (i: number) => `s${Date.now().toString(36)}${i}${Math.random().toString(36).slice(2, 6)}`;

/** Research-backed starter routines (Newport shutdown, Sunsama start-up…). */
const DEFAULTS: { name: string; kind: Kind; anchor: string; steps: Omit<Step, "id">[] }[] = [
  {
    name: "Start-up",
    kind: "startup",
    anchor: "When I sit down at my desk to start work",
    steps: [
      { text: "Review today's calendar and the week plan", minutes: 2 },
      { text: "Process the inbox — a decision for every item", minutes: 5 },
      { text: "Pick today's Top 3 (one delivery, one revenue)", minutes: 4, minimum: true },
      { text: "Set one if-then plan for the biggest distraction", minutes: 2, minimum: true },
    ],
  },
  {
    name: "Shutdown",
    kind: "shutdown",
    anchor: "When I finish my last work block",
    steps: [
      { text: "Empty the inbox into your lists", minutes: 2 },
      { text: "Review open lists and date anything urgent", minutes: 2 },
      { text: "Check the calendar for the next 2 weeks", minutes: 1 },
      { text: "Decide every leftover: tomorrow, backlog or drop", minutes: 2, minimum: true },
      { text: "Write a ready-to-resume note (where I stopped, next step)", minutes: 1, minimum: true },
      { text: "Write one progress line for today", minutes: 1 },
      { text: "Say “shutdown complete” — and close the laptop", minutes: 1, minimum: true },
    ],
  },
  {
    name: "Morning",
    kind: "morning",
    anchor: "When I get out of bed",
    steps: [
      { text: "Drink a glass of water", minutes: 1, minimum: true },
      { text: "Move for 5 minutes", minutes: 5, minimum: true },
      { text: "No phone for the first 30 minutes" },
    ],
  },
  {
    name: "Evening",
    kind: "evening",
    anchor: "When I finish dinner",
    steps: [
      { text: "Lay out tomorrow's clothes and glance at the plan", minutes: 3 },
      { text: "Screens off — wind down", minimum: true },
      { text: "Read for 10 minutes", minutes: 10 },
    ],
  },
];

const plannedMin = (steps: Step[]) => steps.reduce((s, x) => s + (x.minutes ?? 0), 0);

function cleanSteps(steps: Step[]): Step[] {
  return steps
    .map((s, i) => ({
      id: s.id || sid(i),
      text: s.text.trim(),
      minutes: s.minutes != null && s.minutes > 0 ? Math.min(240, Math.round(s.minutes)) : undefined,
      minimum: s.minimum || undefined,
    }))
    .filter((s) => s.text);
}

type RunStatus = "full" | "min" | "partial" | null;
const runStatus = (r: Doc<"routineRuns"> | undefined): RunStatus =>
  !r ? null : r.completed ? (r.minimum ? "min" : "full") : r.doneStepIds.length ? "partial" : null;

async function ownRoutine(ctx: QueryCtx | MutationCtx, id: Id<"routines">) {
  const userId = await requireUser(ctx);
  const r = await ctx.db.get(id);
  if (!r || r.userId !== userId) throw new ConvexError("Routine not found.");
  return { userId, routine: r };
}

async function runsSince(ctx: QueryCtx | MutationCtx, userId: Id<"users">, from: string) {
  const runs = await ctx.db
    .query("routineRuns")
    .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", from))
    .collect();
  const by = new Map<string, Map<string, Doc<"routineRuns">>>();
  for (const r of runs) {
    if (!by.has(r.routineId)) by.set(r.routineId, new Map());
    by.get(r.routineId)!.set(r.date, r);
  }
  return by;
}

/** History (last 30 days), consistency % and forgiving streak for one routine. */
function routineStats(routine: Doc<"routines">, runs: Map<string, Doc<"routineRuns">>, today: string) {
  let start = ymdUtc(routine._creationTime);
  for (const d of runs.keys()) if (d < start) start = d;
  if (start > today) start = today;

  const history = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(today, i - 29);
    return { date, status: runStatus(runs.get(date)), beforeStart: date < start };
  });
  const completedDays = new Set([...runs.values()].filter((r) => r.completed).map((r) => r.date));

  if (routine.kind === "weekly") {
    // Weekly routine: consistency + streak counted in weeks.
    const weeks = Array.from({ length: 8 }, (_, i) => addDays(mondayOf(today), -7 * (7 - i)));
    const doneWeek = (wk: string) => [...completedDays].some((d) => d >= wk && d <= addDays(wk, 6));
    const counted = weeks.filter((wk) => addDays(wk, 6) >= start && (wk !== mondayOf(today) || doneWeek(wk)));
    const done = counted.filter(doneWeek).length;
    let streak = 0;
    for (let i = weeks.length - 1; i >= 0; i--) {
      const wk = weeks[i];
      if (doneWeek(wk)) streak++;
      else if (wk === mondayOf(today)) continue;
      else break;
    }
    return { history, consistency: counted.length ? Math.round((done / counted.length) * 100) : 0, streak, unit: "weeks" as const };
  }

  const winFloor = addDays(today, -29);
  let denom = 0;
  let num = 0;
  for (let d = start > winFloor ? start : winFloor; d <= today; d = addDays(d, 1)) {
    const done = completedDays.has(d);
    if (d === today && !done) continue;
    denom++;
    if (done) num++;
  }
  const { streak } = ritualStreak(completedDays, new Set(), today, 2);
  return { history, consistency: denom ? Math.round((num / denom) * 100) : 0, streak, unit: "days" as const };
}

function shape(routine: Doc<"routines">, run: Doc<"routineRuns"> | undefined) {
  const steps = routine.steps as Step[];
  const minimumIds = steps.filter((s) => s.minimum).map((s) => s.id);
  const doneStepIds = run?.doneStepIds ?? [];
  return {
    ...routine,
    plannedMin: plannedMin(steps),
    minimumMin: plannedMin(steps.filter((s) => s.minimum)),
    minimumIds,
    run: run
      ? { _id: run._id, doneStepIds, completed: run.completed, minimum: !!run.minimum, durationSec: run.durationSec ?? null }
      : null,
    status: (run?.completed ? (run.minimum ? "min" : "done") : doneStepIds.length ? "partial" : "todo") as
      | "done"
      | "min"
      | "partial"
      | "todo",
    doneSteps: steps.filter((s) => doneStepIds.includes(s.id)).length,
    totalSteps: steps.length,
  };
}

/** All routines with today's run, 30-day history, consistency and streak. */
export const list = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const routines = await ctx.db.query("routines").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const runs = await runsSince(ctx, userId, addDays(today, -400));
    return routines
      .sort((a, b) => a.order - b.order)
      .map((r) => {
        const mine = runs.get(r._id) ?? new Map<string, Doc<"routineRuns">>();
        return { ...shape(r, mine.get(today)), ...routineStats(r, mine, today) };
      });
  },
});

/**
 * Today/lead API: active routines with the given day's run status
 * (status: todo | partial | done | min), steps and streak.
 */
export const forDay = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    const routines = await ctx.db.query("routines").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const runs = await runsSince(ctx, userId, addDays(date, -120));
    return routines
      .filter((r) => r.active)
      .sort((a, b) => a.order - b.order)
      .map((r) => {
        const mine = runs.get(r._id) ?? new Map<string, Doc<"routineRuns">>();
        const s = routineStats(r, mine, date);
        return { ...shape(r, mine.get(date)), streak: s.streak, consistency: s.consistency };
      });
  },
});

/** Insert the four starter routines when the user has none. Idempotent. */
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.query("routines").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (existing) return 0;
    let order = 0;
    for (const d of DEFAULTS) {
      await ctx.db.insert("routines", {
        userId,
        name: d.name,
        kind: d.kind,
        anchor: d.anchor,
        steps: d.steps.map((s, i) => ({ ...s, id: sid(i) })),
        active: true,
        order: order++,
      });
    }
    return DEFAULTS.length;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    kind: kindValidator,
    anchor: v.optional(v.string()),
    steps: v.optional(v.array(stepValidator)),
  },
  handler: async (ctx, { name, kind, anchor, steps }) => {
    const userId = await requireUser(ctx);
    if (!name.trim()) throw new ConvexError("Give the routine a name.");
    const all = await ctx.db.query("routines").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return ctx.db.insert("routines", {
      userId,
      name: name.trim(),
      kind,
      anchor: anchor?.trim() || undefined,
      steps: cleanSteps(steps ?? []),
      active: true,
      order: all.reduce((m, r) => Math.max(m, r.order), -1) + 1,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("routines"),
    name: v.optional(v.string()),
    kind: v.optional(kindValidator),
    anchor: v.optional(v.union(v.string(), v.null())),
    steps: v.optional(v.array(stepValidator)),
    active: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ownRoutine(ctx, id);
    const patch: Partial<Doc<"routines">> = {};
    if (rest.name !== undefined && rest.name.trim()) patch.name = rest.name.trim();
    if (rest.kind !== undefined) patch.kind = rest.kind;
    if (rest.anchor !== undefined) patch.anchor = rest.anchor?.trim() || undefined;
    if (rest.steps !== undefined) patch.steps = cleanSteps(rest.steps);
    if (rest.active !== undefined) patch.active = rest.active;
    if (rest.order !== undefined) patch.order = rest.order;
    await ctx.db.patch(id, patch);
  },
});

/** Move a routine up/down in the list. */
export const move = mutation({
  args: { id: v.id("routines"), dir: v.union(v.literal("up"), v.literal("down")) },
  handler: async (ctx, { id, dir }) => {
    const { userId } = await ownRoutine(ctx, id);
    const all = (await ctx.db.query("routines").withIndex("by_user", (q) => q.eq("userId", userId)).collect()).sort(
      (a, b) => a.order - b.order,
    );
    const i = all.findIndex((r) => r._id === id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= all.length) return;
    const reordered = [...all];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
    for (let k = 0; k < reordered.length; k++) if (reordered[k].order !== k) await ctx.db.patch(reordered[k]._id, { order: k });
  },
});

export const remove = mutation({
  args: { id: v.id("routines") },
  handler: async (ctx, { id }) => {
    const { userId } = await ownRoutine(ctx, id);
    const runs = await ctx.db.query("routineRuns").withIndex("by_routine", (q) => q.eq("routineId", id)).collect();
    for (const r of runs) {
      await revokeXp(ctx, userId, `routine-${id}-${r.date}`);
      await ctx.db.delete(r._id);
    }
    await ctx.db.delete(id);
  },
});

async function getRun(ctx: MutationCtx, routineId: Id<"routines">, date: string) {
  return ctx.db
    .query("routineRuns")
    .withIndex("by_routine", (q) => q.eq("routineId", routineId))
    .filter((q) => q.eq(q.field("date"), date))
    .first();
}

/** Tick / untick one step for a day. */
export const toggleStep = mutation({
  args: { id: v.id("routines"), date: v.string(), stepId: v.string() },
  handler: async (ctx, { id, date, stepId }) => {
    const { userId, routine } = await ownRoutine(ctx, id);
    if (!routine.steps.some((s) => s.id === stepId)) return;
    const run = await getRun(ctx, id, date);
    if (!run) {
      await ctx.db.insert("routineRuns", { userId, routineId: id, date, doneStepIds: [stepId], completed: false });
      return;
    }
    const has = run.doneStepIds.includes(stepId);
    await ctx.db.patch(run._id, {
      doneStepIds: has ? run.doneStepIds.filter((s) => s !== stepId) : [...run.doneStepIds, stepId],
    });
  },
});

/**
 * Complete the routine for a day (full, or the minimum version). Awards
 * XP.routine once per routine per day (key routine-<id>-<date>).
 */
export const complete = mutation({
  args: {
    id: v.id("routines"),
    date: v.string(),
    minimum: v.optional(v.boolean()),
    durationSec: v.optional(v.number()),
  },
  handler: async (ctx, { id, date, minimum, durationSec }) => {
    const { userId, routine } = await ownRoutine(ctx, id);
    const run = await getRun(ctx, id, date);
    const prev = run?.doneStepIds ?? [];
    const ids = minimum
      ? [...new Set([...prev, ...routine.steps.filter((s) => s.minimum).map((s) => s.id)])]
      : routine.steps.map((s) => s.id);
    const patch = {
      doneStepIds: ids,
      completed: true,
      minimum: !!minimum,
      completedAt: Date.now(),
      ...(durationSec != null && durationSec > 0 ? { durationSec: Math.round(durationSec) } : {}),
    };
    if (run) await ctx.db.patch(run._id, patch);
    else await ctx.db.insert("routineRuns", { userId, routineId: id, date, ...patch });
    const awarded = await awardXp(ctx, userId, `routine-${id}-${date}`, XP.routine, `Routine: ${routine.name}`, date);
    return { xp: awarded ? XP.routine : 0 };
  },
});

/** Undo a completion (keeps ticked steps, revokes the XP). */
export const uncomplete = mutation({
  args: { id: v.id("routines"), date: v.string() },
  handler: async (ctx, { id, date }) => {
    const { userId } = await ownRoutine(ctx, id);
    const run = await getRun(ctx, id, date);
    if (run) await ctx.db.patch(run._id, { completed: false, minimum: undefined, completedAt: undefined });
    await revokeXp(ctx, userId, `routine-${id}-${date}`);
  },
});

/** Clear all ticks for a day (start over). */
export const resetDay = mutation({
  args: { id: v.id("routines"), date: v.string() },
  handler: async (ctx, { id, date }) => {
    const { userId } = await ownRoutine(ctx, id);
    const run = await getRun(ctx, id, date);
    if (run) await ctx.db.delete(run._id);
    await revokeXp(ctx, userId, `routine-${id}-${date}`);
  },
});
