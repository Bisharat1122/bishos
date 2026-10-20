/**
 * Tactics = lead measures for a 12-week goal (what you DO each week).
 * Weekly logs live in `tacticLogs` (one row per tactic × weekStart).
 * Execution score = Σ min(done, target) / Σ target (see cycles.ts helpers).
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { awardXp, revokeXp, XP, mondayOf } from "./os";
import { isActiveCycleGoal } from "./goals";
import { currentCycle, cycleHistory, cycleState, loadExecData, weekExecution } from "./cycles";

async function ownTactic(ctx: MutationCtx, userId: Id<"users">, id: Id<"tactics">) {
  const t = await ctx.db.get(id);
  if (!t || t.userId !== userId) throw new ConvexError("Tactic not found.");
  return t;
}

/** Tactics of one goal with the given week's done/target. */
export const forGoal = query({
  args: { goalId: v.id("goals"), weekStart: v.string() },
  handler: async (ctx, { goalId, weekStart }) => {
    const userId = await requireUser(ctx);
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== userId) return [];
    const tactics = await ctx.db.query("tactics").withIndex("by_goal", (q) => q.eq("goalId", goalId)).collect();
    const out = [];
    for (const t of tactics.sort((a, b) => a.order - b.order)) {
      const logs = await ctx.db.query("tacticLogs").withIndex("by_tactic", (q) => q.eq("tacticId", t._id)).collect();
      const log = logs.find((l) => l.weekStart === weekStart);
      out.push({ ...t, done: log?.done ?? 0, target: log?.target ?? t.weeklyTarget });
    }
    return out;
  },
});

export const create = mutation({
  args: {
    goalId: v.id("goals"),
    title: v.string(),
    weeklyTarget: v.number(),
    ifThen: v.optional(v.string()),
  },
  handler: async (ctx, { goalId, title, weeklyTarget, ifThen }) => {
    const userId = await requireUser(ctx);
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== userId) throw new ConvexError("Goal not found.");
    if (!title.trim()) throw new ConvexError("Give the tactic a name.");
    const existing = await ctx.db.query("tactics").withIndex("by_goal", (q) => q.eq("goalId", goalId)).collect();
    return ctx.db.insert("tactics", {
      userId,
      goalId,
      title: title.trim(),
      weeklyTarget: Math.max(1, Math.round(weeklyTarget)),
      ifThen: ifThen?.trim() || undefined,
      active: true,
      order: existing.length ? Math.max(...existing.map((t) => t.order)) + 1 : 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tactics"),
    title: v.optional(v.string()),
    weeklyTarget: v.optional(v.number()),
    ifThen: v.optional(v.union(v.string(), v.null())),
    active: v.optional(v.boolean()),
    order: v.optional(v.number()),
    // When the target changes, re-snapshot this week's log target too.
    weekStart: v.optional(v.string()),
  },
  handler: async (ctx, { id, weekStart, ...rest }) => {
    const userId = await requireUser(ctx);
    await ownTactic(ctx, userId, id);
    const patch: Record<string, unknown> = {};
    if (rest.title !== undefined) patch.title = rest.title.trim() || undefined;
    if (rest.weeklyTarget !== undefined) patch.weeklyTarget = Math.max(1, Math.round(rest.weeklyTarget));
    if (rest.ifThen !== undefined) patch.ifThen = rest.ifThen?.trim() || undefined;
    if (rest.active !== undefined) patch.active = rest.active;
    if (rest.order !== undefined) patch.order = rest.order;
    if (patch.title === undefined) delete patch.title;
    await ctx.db.patch(id, patch);
    if (rest.weeklyTarget !== undefined && weekStart) {
      const logs = await ctx.db.query("tacticLogs").withIndex("by_tactic", (q) => q.eq("tacticId", id)).collect();
      const log = logs.find((l) => l.weekStart === weekStart);
      if (log) await ctx.db.patch(log._id, { target: Math.max(1, Math.round(rest.weeklyTarget)) });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("tactics") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await ownTactic(ctx, userId, id);
    const logs = await ctx.db.query("tacticLogs").withIndex("by_tactic", (q) => q.eq("tacticId", id)).collect();
    for (const l of logs) await ctx.db.delete(l._id);
    await ctx.db.delete(id);
  },
});

/**
 * +/− a tactic for a week. XP is awarded per repetition up to the weekly
 * target (key `tactic-<id>-<weekStart>-<n>`) and revoked when undone, so
 * toggling can't farm XP.
 */
export const logTactic = mutation({
  args: {
    tacticId: v.id("tactics"),
    weekStart: v.string(),
    delta: v.number(),
    date: v.optional(v.string()), // client-local day for the XP ledger
  },
  handler: async (ctx, { tacticId, weekStart, delta, date }) => {
    const userId = await requireUser(ctx);
    const t = await ownTactic(ctx, userId, tacticId);
    const ws = mondayOf(weekStart);
    const logs = await ctx.db.query("tacticLogs").withIndex("by_tactic", (q) => q.eq("tacticId", tacticId)).collect();
    const log = logs.find((l) => l.weekStart === ws);
    const before = log?.done ?? 0;
    const target = log?.target ?? t.weeklyTarget;
    const step = Math.sign(delta) * Math.min(20, Math.abs(Math.round(delta)));
    const after = Math.max(0, Math.min(99, before + step));
    if (after === before) return { done: before, target, xp: 0, hitTarget: false };

    if (log) await ctx.db.patch(log._id, { done: after });
    else await ctx.db.insert("tacticLogs", { userId, tacticId, goalId: t.goalId, weekStart: ws, done: after, target });

    let xp = 0;
    if (after > before) {
      for (let n = before + 1; n <= Math.min(after, target); n++) {
        const ok = await awardXp(ctx, userId, `tactic-${tacticId}-${ws}-${n}`, XP.tactic, `Tactic: ${t.title}`, date ?? ws);
        if (ok) xp += XP.tactic;
      }
    } else {
      for (let n = before; n > after; n--) await revokeXp(ctx, userId, `tactic-${tacticId}-${ws}-${n}`);
    }
    return { done: after, target, xp, hitTarget: before < target && after >= target };
  },
});

/** This week's execution score across the current cycle's active goals. */
export const execution = query({
  args: { weekStart: v.string(), today: v.string() },
  handler: async (ctx, { weekStart, today }) => {
    const userId = await requireUser(ctx);
    const { cycle } = await currentCycle(ctx, userId, today);
    if (!cycle) return { score: null, achieved: 0, target: 0, items: [], cycle: null };
    const state = cycleState(cycle, today);
    // Nothing to execute before the cycle starts — don't show a 0% score for it.
    if (state.phase === "planned") return { score: null, achieved: 0, target: 0, items: [], cycle: { _id: cycle._id, name: cycle.name, state } };
    const goals = await ctx.db.query("goals").withIndex("by_cycle", (q) => q.eq("cycleId", cycle._id)).collect();
    const active = goals.filter((g) => g.userId === userId && isActiveCycleGoal(g, cycle._id));
    const data = await loadExecData(ctx, userId, active.map((g) => g._id));
    const exec = weekExecution(data, mondayOf(weekStart));
    return {
      ...exec,
      items: exec.items.map((i) => ({ ...i, goalTitle: active.find((g) => g._id === i.goalId)?.title ?? "" })),
      cycle: { _id: cycle._id, name: cycle.name, state },
    };
  },
});

/** 12-week execution history for the current (or given) cycle. */
export const history = query({
  args: { today: v.string(), cycleId: v.optional(v.id("cycles")) },
  handler: async (ctx, { today, cycleId }) => {
    const userId = await requireUser(ctx);
    let cycle = cycleId ? await ctx.db.get(cycleId) : (await currentCycle(ctx, userId, today)).cycle;
    if (cycle && cycle.userId !== userId) cycle = null;
    if (!cycle) return [];
    const goals = await ctx.db.query("goals").withIndex("by_cycle", (q) => q.eq("cycleId", cycle!._id)).collect();
    // For closed cycles keep every goal that was in it (not only active ones).
    const pick = goals.filter((g) => g.userId === userId && (cycle!.status === "done" || isActiveCycleGoal(g, cycle!._id)));
    const data = await loadExecData(ctx, userId, pick.map((g) => g._id));
    return cycleHistory(ctx, userId, cycle, data, today);
  },
});
