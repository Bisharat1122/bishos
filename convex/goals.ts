import { v, ConvexError } from "convex/values";
import { query, mutation, action, QueryCtx, MutationCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { getSettings, addDays } from "./os";
import { callOpenRouter } from "./openrouter";

const timeframeValidator = v.union(
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("yearly"),
  v.literal("custom"),
);

// ── Life OS goal model validators ──
const levelValidator = v.union(v.literal("annual"), v.literal("cycle"));
const goalTypeValidator = v.union(v.literal("outcome"), v.literal("learning"));
const goalStatusValidator = v.union(
  v.literal("active"),
  v.literal("backlog"),
  v.literal("achieved"),
  v.literal("dropped"),
);
const keyResultValidator = v.object({
  title: v.string(),
  current: v.number(),
  target: v.number(),
  unit: v.string(),
});
const woopValidator = v.object({
  wish: v.optional(v.string()),
  outcome: v.optional(v.string()),
  obstacle: v.optional(v.string()),
  plan: v.optional(v.string()),
});
const tacticInputValidator = v.object({
  title: v.string(),
  weeklyTarget: v.number(),
  ifThen: v.optional(v.string()),
});

type Metric = { current: number; target: number; unit: string } | undefined;
type KeyResult = { title: string; current: number; target: number; unit: string };

/** Metric-driven when a target is set, else KR-driven, else milestone-driven. */
function computeProgress(
  milestones: { done: boolean }[],
  metric?: Metric,
  keyResults?: KeyResult[],
): number {
  if (metric && metric.target > 0) {
    return Math.max(0, Math.min(100, Math.round((metric.current / metric.target) * 100)));
  }
  const krs = (keyResults ?? []).filter((k) => k.target > 0);
  if (krs.length) {
    const avg = krs.reduce((a, k) => a + Math.min(1, Math.max(0, k.current / k.target)), 0) / krs.length;
    return Math.round(avg * 100);
  }
  if (milestones.length === 0) return 0;
  return Math.round(
    (milestones.filter((m) => m.done).length / milestones.length) * 100,
  );
}

/** 0–1 KR completion (used for suggested grades). */
export function krRatio(kr: KeyResult): number {
  if (!kr.target) return 0;
  return Math.max(0, Math.min(1, kr.current / kr.target));
}

/** Is this goal an ACTIVE 12-week goal inside `cycleId`? */
export function isActiveCycleGoal(g: Doc<"goals">, cycleId?: Id<"cycles">) {
  return (
    g.level === "cycle" &&
    !!g.cycleId &&
    (cycleId === undefined || g.cycleId === cycleId) &&
    (g.goalStatus ?? "active") === "active"
  );
}

/**
 * Enforce the active 12-week goal cap (settings.maxActiveGoals, default 3).
 * `adding` = how many goals are about to become active in the cycle.
 */
export async function assertGoalCap(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  cycleId: Id<"cycles">,
  opts: { excludeGoalId?: Id<"goals">; adding?: number } = {},
) {
  const settings = await getSettings(ctx, userId);
  const max = settings.maxActiveGoals;
  const inCycle = await ctx.db
    .query("goals")
    .withIndex("by_cycle", (q) => q.eq("cycleId", cycleId))
    .collect();
  const active = inCycle.filter(
    (g) => g.userId === userId && g._id !== opts.excludeGoalId && isActiveCycleGoal(g, cycleId),
  );
  if (active.length + (opts.adding ?? 1) > max) {
    throw new ConvexError(
      `Goal cap reached: this cycle already has ${active.length} of ${max} active 12-week goals. ` +
        `Finish, drop or move one to the backlog first (or raise the cap in Settings).`,
    );
  }
}

async function ownGoal(ctx: QueryCtx | MutationCtx, userId: Id<"users">, id: Id<"goals">) {
  const goal = await ctx.db.get(id);
  if (!goal || goal.userId !== userId) throw new ConvexError("Goal not found.");
  return goal;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return goals.map((g) => ({
      ...g,
      milestoneTotal: g.milestones.length,
      milestoneDone: g.milestones.filter((m) => m.done).length,
    }));
  },
});

export const get = query({
  // Plain string so a malformed /goals/<id> URL returns null ("not found") instead of throwing.
  args: { id: v.string() },
  handler: async (ctx, { id: rawId }) => {
    const userId = await requireUser(ctx);
    const id = ctx.db.normalizeId("goals", rawId);
    if (!id) return null;
    const goal = await ctx.db.get(id);
    if (!goal || goal.userId !== userId) return null;
    return goal;
  },
});

/** Foreign ids sent by the client must belong to the caller. */
async function assertOwnedRefs(ctx: MutationCtx, userId: Id<"users">, ids: (string | undefined | null)[]) {
  for (const id of ids) {
    if (!id) continue;
    const doc = (await ctx.db.get(id as Id<"goals">)) as { userId?: Id<"users"> } | null;
    if (!doc || doc.userId !== userId) throw new ConvexError("Linked item not found.");
  }
}

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    lifeAreaId: v.id("lifeAreas"),
    sectionId: v.optional(v.id("sections")),
    projectId: v.optional(v.id("projects")),
    timeframe: timeframeValidator,
    deadline: v.optional(v.number()),
    // ── Life OS (all optional, additive) ──
    level: v.optional(levelValidator),
    cycleId: v.optional(v.id("cycles")),
    parentGoalId: v.optional(v.id("goals")),
    goalType: v.optional(goalTypeValidator),
    goalStatus: v.optional(goalStatusValidator),
    reasons: v.optional(v.array(v.string())),
    keyResults: v.optional(v.array(keyResultValidator)),
    woop: v.optional(woopValidator),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await assertOwnedRefs(ctx, userId, [args.lifeAreaId, args.sectionId, args.projectId, args.cycleId, args.parentGoalId]);
    let goalStatus = args.goalStatus;
    if (args.level && !goalStatus) {
      goalStatus = args.level === "cycle" && !args.cycleId ? "backlog" : "active";
    }
    if (args.level === "cycle" && args.cycleId && goalStatus === "active") {
      await assertGoalCap(ctx, userId, args.cycleId);
    }
    return ctx.db.insert("goals", {
      userId,
      ...args,
      goalStatus,
      tags: [],
      milestones: [],
      progress: computeProgress([], undefined, args.keyResults),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("goals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    timeframe: v.optional(timeframeValidator),
    deadline: v.optional(v.union(v.number(), v.null())),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    sectionId: v.optional(v.union(v.id("sections"), v.null())),
    projectId: v.optional(v.union(v.id("projects"), v.null())),
    progress: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    smart: v.optional(
      v.object({
        specific: v.optional(v.string()),
        measurable: v.optional(v.string()),
        achievable: v.optional(v.string()),
        relevant: v.optional(v.string()),
        timeBound: v.optional(v.string()),
      }),
    ),
    metric: v.optional(
      v.object({ current: v.number(), target: v.number(), unit: v.string() }),
    ),
    // ── Life OS (all optional, additive; null clears) ──
    level: v.optional(v.union(levelValidator, v.null())),
    cycleId: v.optional(v.union(v.id("cycles"), v.null())),
    parentGoalId: v.optional(v.union(v.id("goals"), v.null())),
    goalType: v.optional(v.union(goalTypeValidator, v.null())),
    goalStatus: v.optional(v.union(goalStatusValidator, v.null())),
    reasons: v.optional(v.array(v.string())),
    keyResults: v.optional(v.array(keyResultValidator)),
    woop: v.optional(woopValidator),
    grade: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const goal = await ownGoal(ctx, userId, id);
    const r = rest as Record<string, unknown>;
    await assertOwnedRefs(ctx, userId, [r.lifeAreaId, r.sectionId, r.projectId, r.cycleId, r.parentGoalId] as (string | undefined | null)[]);
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) patch[k] = val === null ? undefined : val;

    // Cap: block the change if it would make one more active cycle goal.
    const next = { ...goal, ...patch } as Doc<"goals">;
    if (isActiveCycleGoal(next) && !isActiveCycleGoal(goal, next.cycleId)) {
      await assertGoalCap(ctx, userId, next.cycleId!, { excludeGoalId: id });
    }
    if (rest.grade != null) patch.grade = Math.max(0, Math.min(1, rest.grade));

    // metric / KR change recomputes progress against current milestones
    if (rest.metric !== undefined || rest.keyResults !== undefined) {
      patch.progress = computeProgress(
        goal.milestones,
        rest.metric ?? goal.metric,
        rest.keyResults ?? goal.keyResults,
      );
    }
    await ctx.db.patch(id, patch);
  },
});

export const addMilestone = mutation({
  args: { id: v.id("goals"), text: v.string() },
  handler: async (ctx, { id, text }) => {
    const userId = await requireUser(ctx);
    const goal = await ctx.db.get(id);
    if (!goal || goal.userId !== userId) return;
    const milestones = [...goal.milestones, { text, done: false }];
    await ctx.db.patch(id, { milestones, progress: computeProgress(milestones, goal.metric, goal.keyResults) });
  },
});

export const toggleMilestone = mutation({
  args: { id: v.id("goals"), index: v.number() },
  handler: async (ctx, { id, index }) => {
    const userId = await requireUser(ctx);
    const goal = await ctx.db.get(id);
    if (!goal || goal.userId !== userId || !goal.milestones[index]) return;
    const milestones = goal.milestones.map((m, i) =>
      i === index ? { ...m, done: !m.done } : m,
    );
    await ctx.db.patch(id, { milestones, progress: computeProgress(milestones, goal.metric, goal.keyResults) });
  },
});

export const removeMilestone = mutation({
  args: { id: v.id("goals"), index: v.number() },
  handler: async (ctx, { id, index }) => {
    const userId = await requireUser(ctx);
    const goal = await ctx.db.get(id);
    if (!goal || goal.userId !== userId) return;
    const milestones = goal.milestones.filter((_, i) => i !== index);
    await ctx.db.patch(id, { milestones, progress: computeProgress(milestones, goal.metric, goal.keyResults) });
  },
});

export const remove = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const goal = await ctx.db.get(id);
    if (!goal || goal.userId !== userId) return;
    // Life OS: a goal's tactics (and their weekly logs) go with it.
    const tactics = await ctx.db.query("tactics").withIndex("by_goal", (q) => q.eq("goalId", id)).collect();
    for (const t of tactics) {
      const logs = await ctx.db.query("tacticLogs").withIndex("by_tactic", (q) => q.eq("tacticId", t._id)).collect();
      for (const l of logs) await ctx.db.delete(l._id);
      await ctx.db.delete(t._id);
    }
    await ctx.db.delete(id);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Life OS — 12-week goals (key results = lag, tactics = lead)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Create a goal with its key results and tactics in one go (used by the
 * "new 12-week goal" composer). Cap enforced for active cycle goals.
 */
export const createWithPlan = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    lifeAreaId: v.id("lifeAreas"),
    level: levelValidator,
    cycleId: v.optional(v.id("cycles")),
    parentGoalId: v.optional(v.id("goals")),
    goalType: v.optional(goalTypeValidator),
    goalStatus: v.optional(goalStatusValidator),
    reasons: v.optional(v.array(v.string())),
    keyResults: v.optional(v.array(keyResultValidator)),
    woop: v.optional(woopValidator),
    tactics: v.optional(v.array(tacticInputValidator)),
  },
  handler: async (ctx, { tactics, ...args }) => {
    const userId = await requireUser(ctx);
    const title = args.title.trim();
    if (!title) throw new ConvexError("Give the goal a title.");
    const area = await ctx.db.get(args.lifeAreaId);
    if (!area || area.userId !== userId) throw new ConvexError("Pick a life area.");
    const goalStatus =
      args.goalStatus ?? (args.level === "cycle" && !args.cycleId ? "backlog" : "active");
    let deadline: number | undefined;
    if (args.level === "cycle" && args.cycleId) {
      const cycle = await ctx.db.get(args.cycleId);
      if (!cycle || cycle.userId !== userId) throw new ConvexError("Cycle not found.");
      if (goalStatus === "active") await assertGoalCap(ctx, userId, args.cycleId);
      deadline = Date.parse(`${cycle.endDate}T12:00:00Z`);
    }
    const id = await ctx.db.insert("goals", {
      userId,
      ...args,
      title,
      goalStatus,
      timeframe: args.level === "annual" ? "yearly" : "custom",
      deadline,
      reasons: (args.reasons ?? []).map((r) => r.trim()).filter(Boolean),
      tags: [],
      milestones: [],
      progress: computeProgress([], undefined, args.keyResults),
    });
    let order = 0;
    for (const t of tactics ?? []) {
      if (!t.title.trim()) continue;
      await ctx.db.insert("tactics", {
        userId,
        goalId: id,
        title: t.title.trim(),
        weeklyTarget: Math.max(1, Math.round(t.weeklyTarget)),
        ifThen: t.ifThen?.trim() || undefined,
        active: true,
        order: order++,
      });
    }
    return id;
  },
});

/** Move a goal between backlog / active / achieved / dropped (cap enforced). */
export const setGoalStatus = mutation({
  args: {
    id: v.id("goals"),
    goalStatus: goalStatusValidator,
    cycleId: v.optional(v.id("cycles")),
  },
  handler: async (ctx, { id, goalStatus, cycleId }) => {
    const userId = await requireUser(ctx);
    const goal = await ownGoal(ctx, userId, id);
    const patch: Partial<Doc<"goals">> = { goalStatus };
    const targetCycle = cycleId ?? goal.cycleId;
    if (goalStatus === "active" && goal.level === "cycle") {
      if (!targetCycle) throw new ConvexError("Start a 12-week cycle first, then activate this goal.");
      const cycle = await ctx.db.get(targetCycle);
      if (!cycle || cycle.userId !== userId) throw new ConvexError("Cycle not found.");
      await assertGoalCap(ctx, userId, targetCycle, { excludeGoalId: id });
      patch.cycleId = targetCycle;
      patch.deadline = Date.parse(`${cycle.endDate}T12:00:00Z`);
    }
    await ctx.db.patch(id, patch);
  },
});

/**
 * Convert a legacy goal (no `level`) into the Life OS model. As a cycle goal it
 * joins `cycleId` when there's room under the cap, otherwise the backlog.
 */
export const convert = mutation({
  args: {
    id: v.id("goals"),
    level: levelValidator,
    cycleId: v.optional(v.id("cycles")),
    goalType: v.optional(goalTypeValidator),
  },
  handler: async (ctx, { id, level, cycleId, goalType }) => {
    const userId = await requireUser(ctx);
    const goal = await ownGoal(ctx, userId, id);
    // Legacy milestones become a starting key result when there are none yet.
    const keyResults =
      goal.keyResults ??
      (goal.metric && goal.metric.target > 0
        ? [{ title: goal.title, current: goal.metric.current, target: goal.metric.target, unit: goal.metric.unit }]
        : goal.milestones.length
          ? [{ title: "Milestones done", current: goal.milestones.filter((m) => m.done).length, target: goal.milestones.length, unit: "milestones" }]
          : undefined);
    if (level === "annual") {
      await ctx.db.patch(id, { level, goalStatus: "active", goalType: goalType ?? goal.goalType, keyResults, timeframe: "yearly" });
      return "active" as const;
    }
    let status: "active" | "backlog" = "backlog";
    let deadline = goal.deadline;
    if (cycleId) {
      const cycle = await ctx.db.get(cycleId);
      if (!cycle || cycle.userId !== userId) throw new ConvexError("Cycle not found.");
      const settings = await getSettings(ctx, userId);
      const inCycle = await ctx.db.query("goals").withIndex("by_cycle", (q) => q.eq("cycleId", cycleId)).collect();
      const activeCount = inCycle.filter((g) => g.userId === userId && g._id !== id && isActiveCycleGoal(g, cycleId)).length;
      if (activeCount < settings.maxActiveGoals) {
        status = "active";
        deadline = Date.parse(`${cycle.endDate}T12:00:00Z`);
      }
    }
    await ctx.db.patch(id, {
      level,
      cycleId: status === "active" ? cycleId : undefined,
      goalStatus: status,
      goalType: goalType ?? goal.goalType ?? "outcome",
      keyResults,
      deadline,
    });
    return status;
  },
});

/** Quick +/− or set on one key result's current value. */
export const setKeyResult = mutation({
  args: {
    id: v.id("goals"),
    index: v.number(),
    current: v.optional(v.number()),
    delta: v.optional(v.number()),
  },
  handler: async (ctx, { id, index, current, delta }) => {
    const userId = await requireUser(ctx);
    const goal = await ownGoal(ctx, userId, id);
    const krs = [...(goal.keyResults ?? [])];
    const kr = krs[index];
    if (!kr) return null;
    const value = Math.max(0, current ?? kr.current + (delta ?? 0));
    krs[index] = { ...kr, current: Math.round(value * 100) / 100 };
    await ctx.db.patch(id, { keyResults: krs, progress: computeProgress(goal.milestones, goal.metric, krs) });
    return { reached: kr.current < kr.target && krs[index].current >= kr.target };
  },
});

/** Everything linked to a goal: projects, tasks, habits, tactics, parent/children. */
export const links = query({
  // Plain string (see `get`): a malformed id yields null instead of an error.
  args: { id: v.string(), weekStart: v.optional(v.string()) },
  handler: async (ctx, { id: rawId, weekStart }) => {
    const userId = await requireUser(ctx);
    const id = ctx.db.normalizeId("goals", rawId);
    if (!id) return null;
    const goal = await ctx.db.get(id);
    if (!goal || goal.userId !== userId) return null;
    const [projects, tasks, habits, tactics, allGoals, logs] = await Promise.all([
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("tasks").withIndex("by_goal", (q) => q.eq("goalId", id)).collect(),
      ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("tactics").withIndex("by_goal", (q) => q.eq("goalId", id)).collect(),
      ctx.db.query("goals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("tacticLogs").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const linkedProjects = projects.filter((p) => p.goalId === id || goal.projectId === p._id);
    const linkedHabits = habits.filter((h) => h.goalId === id);
    const wk = weekStart ?? null;
    const cycle = goal.cycleId ? await ctx.db.get(goal.cycleId) : null;
    // weekly history for each tactic across the cycle
    const weeks: string[] = [];
    if (cycle) for (let i = 0; i < 12; i++) weeks.push(addDays(cycle.startDate, i * 7));
    return {
      cycle: cycle && cycle.userId === userId ? cycle : null,
      parent: goal.parentGoalId ? allGoals.find((g) => g._id === goal.parentGoalId) ?? null : null,
      children: allGoals.filter((g) => g.parentGoalId === id),
      projects: linkedProjects.map((p) => ({ _id: p._id, title: p.title, status: p.status, progress: p.progress })),
      tasks: tasks
        .filter((t) => t.userId === userId)
        .sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0) || b._creationTime - a._creationTime)
        .slice(0, 40)
        .map((t) => ({ _id: t._id, title: t.title, status: t.status, plannedFor: t.plannedFor })),
      taskCounts: {
        total: tasks.length,
        done: tasks.filter((t) => t.status === "done").length,
      },
      habits: linkedHabits.map((h) => ({ _id: h._id, title: h.title, weeklyTarget: h.weeklyTarget, habitStatus: h.habitStatus })),
      tactics: tactics
        .sort((a, b) => a.order - b.order)
        .map((t) => {
          const mine = logs.filter((l) => l.tacticId === t._id);
          const cur = wk ? mine.find((l) => l.weekStart === wk) : undefined;
          return {
            ...t,
            done: cur?.done ?? 0,
            target: cur?.target ?? t.weeklyTarget,
            history: weeks.map((w) => {
              const l = mine.find((x) => x.weekStart === w);
              return { weekStart: w, done: l?.done ?? 0, target: l?.target ?? t.weeklyTarget };
            }),
          };
        }),
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// AI helpers (return proposals only — the user confirms in the UI)
// ─────────────────────────────────────────────────────────────────────────

function parseJsonLoose(text: string): unknown {
  const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

/**
 * Interactive WOOP coach. Given the goal and the current WOOP draft, the coach
 * asks ONE probing question for `step` and offers a suggested answer.
 */
export const aiWoop = action({
  args: {
    goalId: v.id("goals"),
    step: v.union(v.literal("wish"), v.literal("outcome"), v.literal("obstacle"), v.literal("plan")),
    woop: woopValidator,
    reply: v.optional(v.string()), // the user's answer to the previous coach question
  },
  handler: async (ctx, { goalId, step, woop, reply }): Promise<{ question: string; suggestion: string }> => {
    const goal = await ctx.runQuery(api.goals.get, { id: goalId });
    if (!goal) throw new ConvexError("Goal not found.");
    const guide: Record<string, string> = {
      wish: "WISH: a challenging but feasible wish for this 12-week goal, in one sentence.",
      outcome: "OUTCOME: the single best outcome of fulfilling the wish, vividly imagined, in one or two sentences.",
      obstacle: "OBSTACLE: the main INNER obstacle (a habit, emotion, belief or behaviour of mine) that could stop me — not external circumstances.",
      plan: "PLAN: one if-then plan: 'If <obstacle moment>, then I will <specific action>.'",
    };
    const text = await callOpenRouter([
      {
        role: "system",
        content:
          "You are a warm, concise WOOP coach (Gabriele Oettingen's mental contrasting + implementation intentions) for Bish, a near-solo startup founder. " +
          "Reply ONLY with JSON: {\"question\": \"one short probing question\", \"suggestion\": \"a draft answer in first person\"}.",
      },
      {
        role: "user",
        content:
          `Goal: ${goal.title}\nType: ${goal.goalType ?? "outcome"}\nReasons: ${(goal.reasons ?? []).join("; ") || "-"}\n` +
          `Key results: ${(goal.keyResults ?? []).map((k) => `${k.title} ${k.current}/${k.target} ${k.unit}`).join("; ") || "-"}\n` +
          `Current WOOP draft: ${JSON.stringify(woop)}\n` +
          (reply ? `My answer to your last question: ${reply}\n` : "") +
          `Coach me on this step → ${guide[step]}`,
      },
    ]);
    const parsed = parseJsonLoose(text) as { question?: unknown; suggestion?: unknown } | null;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return {
        question: typeof parsed.question === "string" ? parsed.question : "",
        suggestion: typeof parsed.suggestion === "string" ? parsed.suggestion : "",
      };
    }
    return { question: "", suggestion: text.trim().slice(0, 600) };
  },
});

/** Suggest 3 lead-measure tactics (with weekly targets) for a goal draft. */
export const aiTactics = action({
  args: {
    title: v.string(),
    goalType: v.optional(goalTypeValidator),
    keyResult: v.optional(v.string()),
    area: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ title: string; weeklyTarget: number; ifThen?: string }[]> => {
    if (!(await ctx.auth.getUserIdentity())) throw new ConvexError("Not authenticated");
    const text = await callOpenRouter([
      {
        role: "system",
        content:
          "You design 12 Week Year lead measures (tactics) for a near-solo founder. Tactics are actions fully under his control, " +
          "repeated weekly. Reply ONLY with a JSON array of 3 objects: {\"title\": string, \"weeklyTarget\": number (1-20), \"ifThen\": \"If <cue>, then <action>\"}.",
      },
      {
        role: "user",
        content: `Goal: ${args.title}\nType: ${args.goalType ?? "outcome"}\nKey result (lag): ${args.keyResult ?? "-"}\nLife area: ${args.area ?? "-"}`,
      },
    ]);
    const parsed = parseJsonLoose(text);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((x): x is { title: string; weeklyTarget?: unknown; ifThen?: unknown } => !!x && typeof x.title === "string")
        .slice(0, 3)
        .map((x) => ({
          title: x.title.slice(0, 120),
          weeklyTarget: Math.max(1, Math.min(50, Math.round(Number(x.weeklyTarget) || 3))),
          ifThen: typeof x.ifThen === "string" ? x.ifThen.slice(0, 200) : undefined,
        }));
    }
    return text
      .split("\n")
      .map((l) => l.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
      .filter((l) => l.length > 3)
      .slice(0, 3)
      .map((title) => ({ title: title.slice(0, 120), weeklyTarget: 3 }));
  },
});
