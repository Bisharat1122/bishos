/**
 * The week plan: Weekly Big 3 (objectives, not a schedule), a protected Free
 * Day, notes, and the frozen execution score written at the weekly review.
 * Also: hours by Life Area for a window (target vs planned vs actual).
 *
 * Time windows: focus sessions are timestamps, so queries take an optional
 * `tz` = the client's `new Date().getTimezoneOffset()` (minutes) to find the
 * local midnight of each day.
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, awardXp, revokeXp, XP, mondayOf, weekday, diffDays } from "./os";
import { isActiveCycleGoal } from "./goals";
import { currentCycle, cycleState, loadExecData, weekExecution } from "./cycles";
import { loadTemplate, upsertDayType, DayType } from "./idealWeek";

/** XP for completing one Weekly Big 3 outcome (twice a daily Top-3 task). */
export const BIG3_XP = XP.top3Task * 2;

const big3Validator = v.array(
  v.object({ text: v.string(), done: v.boolean(), goalId: v.optional(v.id("goals")) }),
);
const dayTypeValidator = v.union(v.literal("focus"), v.literal("buffer"), v.literal("free"));

export async function getPlan(ctx: QueryCtx | MutationCtx, userId: Id<"users">, weekStart: string) {
  return ctx.db
    .query("weekPlans")
    .withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekStart", weekStart))
    .first();
}

async function ensurePlan(ctx: MutationCtx, userId: Id<"users">, weekStart: string): Promise<Doc<"weekPlans">> {
  const ws = mondayOf(weekStart);
  const p = await getPlan(ctx, userId, ws);
  if (p) return p;
  const id = await ctx.db.insert("weekPlans", { userId, weekStart: ws, big3: [] });
  return (await ctx.db.get(id))!;
}

/** Local-midnight ms of a ymd given the client's timezone offset. */
export const localMs = (ymd: string, tz = 0) => Date.parse(`${ymd}T00:00:00Z`) + tz * 60_000;

/**
 * Hours by Life Area over [startDate, endDate]:
 * - target  = lifeAreas.weeklyHoursTarget × weeks
 * - planned = scheduleBlocks (not skipped)
 * - actual  = focusSessions (area via session → task → project) + done blocks
 *             WITHOUT a focusSessionId (those with one are already a session).
 */
export async function computeHours(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  startDate: string,
  endDate: string,
  tz = 0,
) {
  const weeks = (diffDays(startDate, endDate) + 1) / 7;
  const startMs = localMs(startDate, tz);
  const endMs = localMs(addDays(endDate, 1), tz);
  const [areas, blocks, focus, tasks, projects] = await Promise.all([
    ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db
      .query("scheduleBlocks")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", startDate).lte("date", endDate))
      .collect(),
    ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
  ]);
  const taskArea = new Map<string, string>(tasks.map((t) => [t._id, t.lifeAreaId]));
  const projectArea = new Map<string, string>(projects.map((p) => [p._id, p.lifeAreaId]));
  const resolve = (x: { lifeAreaId?: string; taskId?: string; projectId?: string }) =>
    x.lifeAreaId ?? (x.taskId && taskArea.get(x.taskId)) ?? (x.projectId && projectArea.get(x.projectId)) ?? "none";

  const planned = new Map<string, number>();
  const actual = new Map<string, number>();
  const bump = (m: Map<string, number>, k: string, min: number) => m.set(k, (m.get(k) ?? 0) + min);
  for (const b of blocks) {
    const min = Math.max(0, b.endMin - b.startMin);
    if (b.status !== "skipped") bump(planned, resolve(b), min);
    if (b.status === "done" && !b.focusSessionId) bump(actual, resolve(b), min);
  }
  for (const s of focus) {
    if (s.startTime < startMs || s.startTime >= endMs) continue;
    bump(actual, resolve(s), s.duration / 60);
  }
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const rows = areas
    .filter((a) => !a.archived || planned.has(a._id) || actual.has(a._id))
    .sort((a, b) => a.order - b.order)
    .map((a) => ({
      areaId: a._id as string,
      name: a.name,
      color: a.color,
      order: a.order,
      targetH: r1((a.weeklyHoursTarget ?? 0) * weeks),
      plannedH: r1((planned.get(a._id) ?? 0) / 60),
      actualH: r1((actual.get(a._id) ?? 0) / 60),
    }));
  if (planned.has("none") || actual.has("none")) {
    rows.push({
      areaId: "none",
      name: "Unassigned",
      color: undefined,
      order: 999,
      targetH: 0,
      plannedH: r1((planned.get("none") ?? 0) / 60),
      actualH: r1((actual.get("none") ?? 0) / 60),
    });
  }
  const sum = (k: "targetH" | "plannedH" | "actualH") => r1(rows.reduce((a, r) => a + r[k], 0));
  return { rows, totals: { targetH: sum("targetH"), plannedH: sum("plannedH"), actualH: sum("actualH") }, weeks };
}

// ─────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────

export const get = query({
  args: { weekStart: v.string() },
  handler: async (ctx, { weekStart }) => {
    const userId = await requireUser(ctx);
    const ws = mondayOf(weekStart);
    return (await getPlan(ctx, userId, ws)) ?? { weekStart: ws, big3: [], freeDay: undefined, notes: undefined, executionScore: undefined, reviewedAt: undefined };
  },
});

/** Hours by area for a week (or any window when endDate is given). */
export const hoursByArea = query({
  args: { weekStart: v.string(), endDate: v.optional(v.string()), tz: v.optional(v.number()) },
  handler: async (ctx, { weekStart, endDate, tz }) => {
    const userId = await requireUser(ctx);
    return computeHours(ctx, userId, weekStart, endDate ?? addDays(weekStart, 6), tz ?? 0);
  },
});

/**
 * The /week aggregate: plan, a 7-day strip from `days` (+ Ideal Week
 * defaults), this week's tactics + execution score, hours by area.
 */
export const week = query({
  args: { weekStart: v.string(), today: v.string(), tz: v.optional(v.number()) },
  handler: async (ctx, { weekStart: rawWs, today, tz }) => {
    const userId = await requireUser(ctx);
    const weekStart = mondayOf(rawWs);
    const weekEnd = addDays(weekStart, 6);
    const [plan, template, dayRows, blocks, tasks, cur] = await Promise.all([
      getPlan(ctx, userId, weekStart),
      loadTemplate(ctx, userId),
      ctx.db
        .query("days")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", weekStart).lte("date", weekEnd))
        .collect(),
      ctx.db
        .query("scheduleBlocks")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", weekStart).lte("date", weekEnd))
        .collect(),
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      currentCycle(ctx, userId, today),
    ]);
    const taskById = new Map(tasks.map((t) => [t._id as string, t]));

    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const wd = weekday(date);
      const row = dayRows.find((r) => r.date === date);
      const tpl = template.days.find((d) => d.weekday === wd);
      const top3 = (row?.top3 ?? []).map((id) => taskById.get(id)).filter(Boolean) as Doc<"tasks">[];
      const dayBlocks = blocks.filter((b) => b.date === date);
      const plannedTasks = tasks.filter((t) => t.plannedFor === date);
      return {
        date,
        weekday: wd,
        dayType: (row?.dayType ?? tpl?.dayType ?? "focus") as DayType,
        dayTypeSet: !!row?.dayType,
        theme: row?.intention || tpl?.theme,
        isFreeDay: plan?.freeDay === date,
        top3: top3.map((t) => ({ _id: t._id, title: t.title, done: t.status === "done" })),
        top3Count: top3.length,
        top3Done: top3.filter((t) => t.status === "done").length,
        startupAt: row?.startupAt,
        shutdownAt: row?.shutdownAt,
        dayScore: row?.dayScore,
        plannedMin: dayBlocks.filter((b) => b.status !== "skipped").reduce((a, b) => a + (b.endMin - b.startMin), 0),
        doneMin: dayBlocks.filter((b) => b.status === "done").reduce((a, b) => a + (b.endMin - b.startMin), 0),
        blocks: dayBlocks.length,
        tasksPlanned: plannedTasks.length,
        tasksDone: plannedTasks.filter((t) => t.status === "done").length,
        tasksCompleted: tasks.filter((t) => t.completedAt && t.completedAt >= localMs(date, tz) && t.completedAt < localMs(addDays(date, 1), tz)).length,
      };
    });

    // Tactics of the current cycle's active goals for this week.
    let tactics: (ReturnType<typeof weekExecution>["items"][number] & { goalTitle: string })[] = [];
    let execution: { score: number | null; achieved: number; target: number } = { score: null, achieved: 0, target: 0 };
    let cycle = null;
    let goals: { _id: Id<"goals">; title: string }[] = [];
    if (cur.cycle) {
      const st = cycleState(cur.cycle, today);
      const all = await ctx.db.query("goals").withIndex("by_cycle", (q) => q.eq("cycleId", cur.cycle!._id)).collect();
      const active = all.filter((g) => g.userId === userId && isActiveCycleGoal(g, cur.cycle!._id));
      goals = active.map((g) => ({ _id: g._id, title: g.title }));
      const data = await loadExecData(ctx, userId, active.map((g) => g._id));
      const ex = weekExecution(data, weekStart);
      execution = { score: ex.score, achieved: ex.achieved, target: ex.target };
      tactics = ex.items.map((i) => ({ ...i, goalTitle: active.find((g) => g._id === i.goalId)?.title ?? "" }));
      const wn = Math.floor(diffDays(cur.cycle.startDate, weekStart) / 7) + 1;
      cycle = { _id: cur.cycle._id, name: cur.cycle.name, state: st, weekNumber: wn };
    }

    return {
      weekStart,
      weekEnd,
      plan: plan ?? { weekStart, big3: [], freeDay: undefined, notes: undefined, executionScore: undefined, reviewedAt: undefined },
      days,
      tactics,
      execution,
      cycle,
      goals,
      hours: await computeHours(ctx, userId, weekStart, weekEnd, tz ?? 0),
      templateIsDefault: template.isDefault,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────

/** Create/update the plan for a week. `freeDay: null` clears it. */
export const upsert = mutation({
  args: {
    weekStart: v.string(),
    big3: v.optional(big3Validator),
    freeDay: v.optional(v.union(v.string(), v.null())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { weekStart, big3, freeDay, notes }) => {
    const userId = await requireUser(ctx);
    const plan = await ensurePlan(ctx, userId, weekStart);
    const patch: Partial<Doc<"weekPlans">> = {};
    if (big3 !== undefined) {
      patch.big3 = big3
        .map((b) => ({ text: b.text.trim().slice(0, 200), done: b.done, goalId: b.goalId }))
        .filter((b) => b.text)
        .slice(0, 5);
    }
    if (notes !== undefined) patch.notes = notes;
    await ctx.db.patch(plan._id, patch);
    if (freeDay !== undefined) await applyFreeDay(ctx, userId, plan, freeDay);
    return plan._id;
  },
});

/** Short stable hash of a string (djb2) for XP keys. */
function textKey(text: string): string {
  let h = 5381;
  for (const ch of text.trim().toLowerCase()) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
  return (h >>> 0).toString(36);
}

/** Check / uncheck one Big 3 outcome (XP awarded once, revoked on undo). */
export const toggleBig3 = mutation({
  args: { weekStart: v.string(), index: v.number(), date: v.optional(v.string()) },
  handler: async (ctx, { weekStart, index, date }) => {
    const userId = await requireUser(ctx);
    const plan = await ensurePlan(ctx, userId, weekStart);
    const item = plan.big3[index];
    if (!item) return { done: false, xp: 0, allDone: false };
    const big3 = plan.big3.map((b, i) => (i === index ? { ...b, done: !b.done } : b));
    await ctx.db.patch(plan._id, { big3 });
    // Key by the outcome's text (not its position) so reordering/deleting
    // items never moves XP onto the wrong outcome.
    const key = `big3-${plan.weekStart}-${textKey(item.text)}`;
    let xp = 0;
    if (!item.done) {
      if (await awardXp(ctx, userId, key, BIG3_XP, `Weekly Big 3: ${item.text}`, date ?? plan.weekStart)) xp = BIG3_XP;
    } else await revokeXp(ctx, userId, key);
    return { done: !item.done, xp, allDone: big3.length > 0 && big3.every((b) => b.done) };
  },
});

async function applyFreeDay(ctx: MutationCtx, userId: Id<"users">, plan: Doc<"weekPlans">, date: string | null) {
  const prev = plan.freeDay;
  if (date && (date < plan.weekStart || date > addDays(plan.weekStart, 6))) {
    throw new ConvexError("The Free Day must be inside this week.");
  }
  await ctx.db.patch(plan._id, { freeDay: date ?? undefined });
  if (prev && prev !== date) {
    const row = await ctx.db
      .query("days")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", prev))
      .first();
    if (row?.dayType === "free") await upsertDayType(ctx, userId, prev, undefined);
  }
  if (date) await upsertDayType(ctx, userId, date, "free");
}

/** Pick (or clear) the protected Free Day; mirrors days.dayType = "free". */
export const setFreeDay = mutation({
  args: { weekStart: v.string(), date: v.union(v.string(), v.null()) },
  handler: async (ctx, { weekStart, date }) => {
    const userId = await requireUser(ctx);
    const plan = await ensurePlan(ctx, userId, weekStart);
    await applyFreeDay(ctx, userId, plan, date);
  },
});

/**
 * Set one day's type (focus / buffer / free / null = template default). Only
 * writes `days.dayType` — the days table is owned by the core Day module.
 * Keeps the week plan's protected Free Day in sync.
 */
export const setDayType = mutation({
  args: { date: v.string(), dayType: v.union(dayTypeValidator, v.null()) },
  handler: async (ctx, { date, dayType }) => {
    const userId = await requireUser(ctx);
    await upsertDayType(ctx, userId, date, dayType ?? undefined);
    const plan = await getPlan(ctx, userId, mondayOf(date));
    if (dayType === "free" && (!plan || !plan.freeDay)) {
      const p = plan ?? (await ensurePlan(ctx, userId, date));
      await ctx.db.patch(p._id, { freeDay: date });
    } else if (dayType !== "free" && plan?.freeDay === date) {
      await ctx.db.patch(plan._id, { freeDay: undefined });
    }
  },
});

/** Freeze a week's execution score (called by the weekly review). */
export async function freezeWeek(ctx: MutationCtx, userId: Id<"users">, weekStart: string, today: string) {
  const plan = await ensurePlan(ctx, userId, weekStart);
  const { cycle } = await currentCycle(ctx, userId, today);
  let score: number | null = null;
  if (cycle) {
    const goals = await ctx.db.query("goals").withIndex("by_cycle", (q) => q.eq("cycleId", cycle._id)).collect();
    const active = goals.filter((g) => g.userId === userId && isActiveCycleGoal(g, cycle._id));
    const data = await loadExecData(ctx, userId, active.map((g) => g._id));
    const ex = weekExecution(data, plan.weekStart);
    score = ex.score;
    // Snapshot logs for tactics with no entry so history stays honest.
    for (const it of ex.items) {
      if (it.kind !== "tactic") continue;
      const has = data.logs.some((l) => l.tacticId === it.id && l.weekStart === plan.weekStart);
      if (!has) {
        await ctx.db.insert("tacticLogs", {
          userId,
          tacticId: it.id as Id<"tactics">,
          goalId: it.goalId,
          weekStart: plan.weekStart,
          done: 0,
          target: it.target,
        });
      }
    }
  }
  await ctx.db.patch(plan._id, { executionScore: score ?? undefined, reviewedAt: Date.now() });
  return score;
}
