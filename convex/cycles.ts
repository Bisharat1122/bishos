/**
 * 12-week cycles ("12 Week Year"). A cycle starts on a Monday and runs 84 days.
 * Week N = floor(diffDays(start, today) / 7) + 1, clamped to 1..12; the 7 days
 * after week 12 are the "week 13" buffer (review + recharge).
 *
 * Also hosts the shared execution-score helpers used by tactics / weekPlans /
 * periodicReviews:  score = Σ min(done, target) / Σ target over the tactics of
 * the cycle's ACTIVE goals, plus habits linked to those goals (completions that
 * week excluding "skip" vs weeklyTarget ?? 7).
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, diffDays, mondayOf, weekday, getSettings } from "./os";
import { assertGoalCap, isActiveCycleGoal, krRatio } from "./goals";

export const CYCLE_WEEKS = 12;
export const CYCLE_DAYS = 84;

export type CyclePhase = "planned" | "running" | "buffer" | "ended" | "done";

/** Where a cycle stands on `today`. */
export function cycleState(cycle: Doc<"cycles">, today: string) {
  const d = diffDays(cycle.startDate, today);
  const rawWeek = Math.floor(d / 7) + 1;
  let phase: CyclePhase;
  if (cycle.status === "done") phase = "done";
  else if (d < 0) phase = "planned";
  else if (rawWeek <= CYCLE_WEEKS) phase = "running";
  else if (rawWeek === CYCLE_WEEKS + 1) phase = "buffer";
  else phase = "ended";
  const week = Math.max(1, Math.min(CYCLE_WEEKS, rawWeek));
  const elapsed = Math.max(0, Math.min(CYCLE_DAYS, d + 1));
  return {
    phase,
    week,
    rawWeek,
    pct: d < 0 ? 0 : Math.round((elapsed / CYCLE_DAYS) * 100),
    daysLeft: Math.max(0, diffDays(today, cycle.endDate)),
    startsIn: d < 0 ? -d : 0,
    weekStart: addDays(cycle.startDate, (week - 1) * 7),
  };
}

export const cycleWeekStarts = (cycle: Doc<"cycles">) =>
  Array.from({ length: CYCLE_WEEKS }, (_, i) => addDays(cycle.startDate, i * 7));

export async function listCycles(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const all = await ctx.db.query("cycles").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
  return all.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

/** The cycle the cockpit shows: the latest started-but-not-closed one, else the next planned one. */
export async function currentCycle(ctx: QueryCtx | MutationCtx, userId: Id<"users">, today: string) {
  const all = await listCycles(ctx, userId);
  const open = all.filter((c) => c.status !== "done");
  const started = open.filter((c) => c.startDate <= today).sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  const planned = open.filter((c) => c.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  return { cycle: started ?? planned ?? null, next: started ? planned ?? null : null, all };
}

export async function cycleGoalsOf(ctx: QueryCtx | MutationCtx, userId: Id<"users">, cycleId: Id<"cycles">) {
  const goals = await ctx.db.query("goals").withIndex("by_cycle", (q) => q.eq("cycleId", cycleId)).collect();
  return goals.filter((g) => g.userId === userId);
}

// ─────────────────────────────────────────────────────────────────────────
// Execution score
// ─────────────────────────────────────────────────────────────────────────

export type ExecData = {
  tactics: Doc<"tactics">[];
  logs: Doc<"tacticLogs">[];
  habits: Doc<"habits">[];
  completions: Doc<"habitCompletions">[];
};

export type ExecItem = {
  kind: "tactic" | "habit";
  id: string;
  goalId: Id<"goals">;
  title: string;
  done: number;
  target: number;
  ifThen?: string;
};

/** Load every tactic/log/habit/completion relevant to these goals. */
export async function loadExecData(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  goalIds: Id<"goals">[],
): Promise<ExecData> {
  const set = new Set<string>(goalIds);
  if (!set.size) return { tactics: [], logs: [], habits: [], completions: [] };
  const [tactics, logs, habits, completions] = await Promise.all([
    ctx.db.query("tactics").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("tacticLogs").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId)).collect(),
  ]);
  const myTactics = tactics.filter((t) => set.has(t.goalId)).sort((a, b) => a.order - b.order);
  const tacticIds = new Set<string>(myTactics.map((t) => t._id));
  const myHabits = habits.filter(
    (h) => h.goalId && set.has(h.goalId) && (h.habitStatus ?? "active") === "active",
  );
  const habitIds = new Set<string>(myHabits.map((h) => h._id));
  return {
    tactics: myTactics,
    logs: logs.filter((l) => tacticIds.has(l.tacticId)),
    habits: myHabits,
    completions: completions.filter((c) => habitIds.has(c.habitId)),
  };
}

/** A habit's weekly target for the execution score. */
export const habitWeeklyTarget = (h: Doc<"habits">) => h.weeklyTarget ?? (h.frequency === "weekly" ? 1 : 7);

/** Execution score for one week (optionally one goal). */
export function weekExecution(data: ExecData, weekStart: string, goalId?: string) {
  // Things created after the week ended don't count against it (14h tz slack).
  const weekEndMs = Date.parse(`${addDays(weekStart, 7)}T00:00:00Z`) + 14 * 3600_000;
  const weekEnd = addDays(weekStart, 6);
  const items: ExecItem[] = [];
  for (const t of data.tactics) {
    if (goalId && t.goalId !== goalId) continue;
    const log = data.logs.find((l) => l.tacticId === t._id && l.weekStart === weekStart);
    if (!log && (!t.active || t._creationTime > weekEndMs)) continue;
    items.push({
      kind: "tactic",
      id: t._id,
      goalId: t.goalId,
      title: t.title,
      done: log?.done ?? 0,
      target: log?.target ?? t.weeklyTarget,
      ifThen: t.ifThen,
    });
  }
  for (const h of data.habits) {
    if (goalId && h.goalId !== goalId) continue;
    if (h._creationTime > weekEndMs) continue;
    if (h.startedOn && h.startedOn > weekEnd) continue;
    const done = data.completions.filter(
      (c) => c.habitId === h._id && c.date >= weekStart && c.date <= weekEnd && c.kind !== "skip",
    ).length;
    items.push({ kind: "habit", id: h._id, goalId: h.goalId!, title: h.title, done, target: habitWeeklyTarget(h), ifThen: h.anchor });
  }
  let target = 0;
  let achieved = 0;
  for (const it of items) {
    if (it.target <= 0) continue;
    target += it.target;
    achieved += Math.min(it.done, it.target);
  }
  return { score: target ? Math.round((achieved / target) * 100) : null, achieved, target, items };
}

/** 12-point history (frozen weekPlans scores win over live ones). */
export async function cycleHistory(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  cycle: Doc<"cycles">,
  data: ExecData,
  today: string,
) {
  const thisMonday = mondayOf(today);
  const plans = await ctx.db.query("weekPlans").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
  return cycleWeekStarts(cycle).map((weekStart, i) => {
    const future = weekStart > thisMonday;
    const plan = plans.find((p) => p.weekStart === weekStart);
    const live = future ? null : weekExecution(data, weekStart).score;
    const frozen = plan?.executionScore;
    return {
      week: i + 1,
      weekStart,
      score: future ? null : frozen ?? live,
      frozen: frozen !== undefined,
      isCurrent: weekStart === thisMonday,
      isFuture: future,
    };
  });
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

// ─────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────

/** All cycles with their state and goal counts. */
export const list = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const all = await listCycles(ctx, userId);
    const out = [];
    for (const c of all) {
      const goals = await cycleGoalsOf(ctx, userId, c._id);
      const graded = goals.filter((g) => g.grade !== undefined);
      out.push({
        ...c,
        state: cycleState(c, today),
        goalCount: goals.length,
        avgGrade: graded.length ? graded.reduce((a, g) => a + (g.grade ?? 0), 0) / graded.length : null,
      });
    }
    return out;
  },
});

export const get = query({
  args: { id: v.id("cycles"), today: v.string() },
  handler: async (ctx, { id, today }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(id);
    if (!c || c.userId !== userId) return null;
    return { ...c, state: cycleState(c, today) };
  },
});

/** The current cycle (for Today widgets etc.): cycle + week number + phase. */
export const current = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const { cycle, next } = await currentCycle(ctx, userId, today);
    if (!cycle) return null;
    return { ...cycle, state: cycleState(cycle, today), next };
  },
});

/** Suggested start for a new cycle: this Monday if the week just began, else next Monday. */
export const suggestStart = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    await requireUser(ctx);
    const thisMonday = mondayOf(today);
    const nextMonday = addDays(thisMonday, 7);
    const wd = weekday(today);
    return { thisMonday, nextMonday, suggested: wd === 1 || wd === 2 ? thisMonday : nextMonday };
  },
});

/**
 * The /goals cockpit aggregate: current cycle + week, active goal cards with
 * this week's tactics and a 12-week trend, the execution score + history, and
 * the annual / someday / legacy goal lists.
 */
export const cockpit = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const settings = await getSettings(ctx, userId);
    const [{ cycle, next, all }, goals, areas] = await Promise.all([
      currentCycle(ctx, userId, today),
      ctx.db.query("goals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const thisMonday = mondayOf(today);
    const area = (id: Id<"lifeAreas">) => {
      const a = areas.find((x) => x._id === id);
      return a ? { _id: a._id, name: a.name, color: a.color, order: a.order } : null;
    };

    const activeGoals = cycle ? goals.filter((g) => isActiveCycleGoal(g, cycle._id)) : [];
    const data = await loadExecData(ctx, userId, activeGoals.map((g) => g._id));
    const state = cycle ? cycleState(cycle, today) : null;
    const weeks = cycle ? cycleWeekStarts(cycle) : [];
    // In the buffer week we still show the last real week's tactics.
    const scoreWeek = state && state.phase !== "planned" ? (state.phase === "running" ? thisMonday : weeks[11]) : thisMonday;

    const goalCards = activeGoals.map((g) => {
      const cur = weekExecution(data, scoreWeek, g._id);
      const tacticLogs = data.tactics
        .filter((t) => t.goalId === g._id)
        .map((t) => {
          const log = data.logs.find((l) => l.tacticId === t._id && l.weekStart === scoreWeek);
          return { ...t, done: log?.done ?? 0, target: log?.target ?? t.weeklyTarget };
        });
      return {
        ...g,
        area: area(g.lifeAreaId),
        weekScore: cur.score,
        tactics: tacticLogs,
        habits: cur.items.filter((i) => i.kind === "habit"),
        trend: weeks.map((w) => (w > thisMonday ? null : weekExecution(data, w, g._id).score)),
      };
    });

    const history = cycle ? await cycleHistory(ctx, userId, cycle, data, today) : [];
    const exec = weekExecution(data, scoreWeek);
    const past = history.filter((h) => h.score !== null && !h.isCurrent).map((h) => h.score as number);

    const pastCycles = [];
    for (const c of all.filter((c) => c.status === "done").slice(0, 6)) {
      const cg = goals.filter((g) => g.cycleId === c._id);
      const graded = cg.filter((g) => g.grade !== undefined);
      pastCycles.push({
        _id: c._id,
        name: c.name,
        startDate: c.startDate,
        endDate: c.endDate,
        goals: cg.map((g) => ({ _id: g._id, title: g.title, grade: g.grade, goalStatus: g.goalStatus })),
        avgGrade: graded.length ? graded.reduce((a, g) => a + (g.grade ?? 0), 0) / graded.length : null,
      });
    }

    const withArea = (g: Doc<"goals">) => ({ ...g, area: area(g.lifeAreaId) });
    return {
      today,
      thisMonday,
      scoreWeek,
      maxActiveGoals: settings.maxActiveGoals,
      cycle: cycle && state ? { ...cycle, state } : null,
      nextCycle: next,
      goals: goalCards,
      execution: exec,
      history,
      avgExecution: avg(past),
      annual: goals
        .filter((g) => g.level === "annual" && g.goalStatus !== "dropped")
        .map((g) => ({ ...withArea(g), children: goals.filter((c) => c.parentGoalId === g._id).length })),
      backlog: goals.filter((g) => g.level === "cycle" && g.goalStatus === "backlog").map(withArea),
      // Cycle goals that are active but in a closed / other cycle (stragglers).
      stragglers: goals
        .filter((g) => g.level === "cycle" && (g.goalStatus ?? "active") === "active" && (!cycle || g.cycleId !== cycle._id))
        .map(withArea),
      finished: cycle
        ? goals
            .filter((g) => g.cycleId === cycle._id && (g.goalStatus === "achieved" || g.goalStatus === "dropped"))
            .map(withArea)
        : [],
      legacy: goals
        .filter((g) => !g.level)
        .map((g) => ({
          ...withArea(g),
          milestoneDone: g.milestones.filter((m) => m.done).length,
          milestoneTotal: g.milestones.length,
        })),
      pastCycles,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────

const krValidator = v.object({ title: v.string(), current: v.number(), target: v.number(), unit: v.string() });

function assertNoOverlap(all: Doc<"cycles">[], start: string, end: string, ignore: (string | undefined)[]) {
  for (const c of all) {
    if (c.status === "done" || ignore.includes(c._id)) continue;
    if (start <= c.endDate && c.startDate <= end) {
      throw new ConvexError(`"${c.name}" (${c.startDate} → ${c.endDate}) overlaps these dates. Close it first or pick a later start.`);
    }
  }
}

/**
 * Launch a 12-week cycle with its goals (≤ cap), key results and tactics in one
 * step. Existing goals (annual/backlog/legacy) can be brought in by id.
 */
export const launch = mutation({
  args: {
    name: v.string(),
    theme: v.optional(v.string()),
    startDate: v.string(),
    today: v.string(),
    closePreviousId: v.optional(v.id("cycles")),
    goals: v.array(
      v.object({
        goalId: v.optional(v.id("goals")),
        title: v.string(),
        lifeAreaId: v.id("lifeAreas"),
        goalType: v.union(v.literal("outcome"), v.literal("learning")),
        reasons: v.array(v.string()),
        parentGoalId: v.optional(v.id("goals")),
        keyResults: v.array(krValidator),
        tactics: v.array(v.object({ title: v.string(), weeklyTarget: v.number(), ifThen: v.optional(v.string()) })),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const settings = await getSettings(ctx, userId);
    if (args.goals.length > settings.maxActiveGoals) {
      throw new ConvexError(`Pick at most ${settings.maxActiveGoals} goals for one cycle — focus is the point.`);
    }
    const startDate = mondayOf(args.startDate);
    const endDate = addDays(startDate, CYCLE_DAYS - 1);
    const all = await listCycles(ctx, userId);

    if (args.closePreviousId) {
      const prev = await ctx.db.get(args.closePreviousId);
      if (prev && prev.userId === userId && prev.status !== "done") {
        await ctx.db.patch(prev._id, { status: "done" });
        for (const g of await cycleGoalsOf(ctx, userId, prev._id)) {
          if ((g.goalStatus ?? "active") === "active" && !args.goals.some((x) => x.goalId === g._id)) {
            const graded = g.grade ?? (g.keyResults?.length ? g.keyResults.reduce((a, k) => a + krRatio(k), 0) / g.keyResults.length : 0);
            await ctx.db.patch(g._id, { goalStatus: graded >= 0.7 ? "achieved" : "backlog", grade: g.grade ?? Math.round(graded * 100) / 100 });
          }
        }
      }
    }
    assertNoOverlap(all, startDate, endDate, [args.closePreviousId]);

    const cycleId = await ctx.db.insert("cycles", {
      userId,
      name: args.name.trim() || `Cycle starting ${startDate}`,
      theme: args.theme?.trim() || undefined,
      startDate,
      endDate,
      status: startDate <= args.today ? "active" : "planned",
    });
    const deadline = Date.parse(`${endDate}T12:00:00Z`);

    for (const g of args.goals) {
      const krs = g.keyResults.filter((k) => k.title.trim());
      const progress = krs.length
        ? Math.round((krs.reduce((a, k) => a + krRatio(k), 0) / krs.length) * 100)
        : 0;
      const fields = {
        title: g.title.trim() || "Untitled goal",
        lifeAreaId: g.lifeAreaId,
        level: "cycle" as const,
        cycleId,
        goalStatus: "active" as const,
        goalType: g.goalType,
        reasons: g.reasons.map((r) => r.trim()).filter(Boolean),
        parentGoalId: g.parentGoalId,
        keyResults: krs,
        deadline,
        progress,
      };
      let goalId: Id<"goals">;
      if (g.goalId) {
        const existing = await ctx.db.get(g.goalId);
        if (!existing || existing.userId !== userId) throw new ConvexError("Goal not found.");
        // An annual goal brought in stays annual; the cycle goal becomes its child.
        if (existing.level === "annual") {
          goalId = await ctx.db.insert("goals", {
            userId,
            ...fields,
            parentGoalId: existing._id,
            timeframe: "custom",
            tags: [],
            milestones: [],
          });
        } else {
          goalId = existing._id;
          await ctx.db.patch(goalId, fields);
        }
      } else {
        goalId = await ctx.db.insert("goals", { userId, ...fields, timeframe: "custom", tags: [], milestones: [] });
      }
      const existingTactics = await ctx.db.query("tactics").withIndex("by_goal", (q) => q.eq("goalId", goalId)).collect();
      let order = existingTactics.length;
      for (const t of g.tactics) {
        if (!t.title.trim()) continue;
        await ctx.db.insert("tactics", {
          userId,
          goalId,
          title: t.title.trim(),
          weeklyTarget: Math.max(1, Math.round(t.weeklyTarget)),
          ifThen: t.ifThen?.trim() || undefined,
          active: true,
          order: order++,
        });
      }
    }
    // Belt and braces: the final count must respect the cap.
    const final = (await cycleGoalsOf(ctx, userId, cycleId)).filter((g) => isActiveCycleGoal(g, cycleId));
    if (final.length > settings.maxActiveGoals) {
      throw new ConvexError(`Goal cap reached (${settings.maxActiveGoals}).`);
    }
    return cycleId;
  },
});

/** Create an empty cycle (goals can be added afterwards). */
export const create = mutation({
  args: { name: v.string(), theme: v.optional(v.string()), startDate: v.string(), today: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const startDate = mondayOf(args.startDate);
    const endDate = addDays(startDate, CYCLE_DAYS - 1);
    assertNoOverlap(await listCycles(ctx, userId), startDate, endDate, []);
    return ctx.db.insert("cycles", {
      userId,
      name: args.name.trim() || `Cycle starting ${startDate}`,
      theme: args.theme?.trim() || undefined,
      startDate,
      endDate,
      status: startDate <= args.today ? "active" : "planned",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("cycles"),
    name: v.optional(v.string()),
    theme: v.optional(v.string()),
    startDate: v.optional(v.string()),
    today: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, theme, startDate, today }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(id);
    if (!c || c.userId !== userId) throw new ConvexError("Cycle not found.");
    const patch: Partial<Doc<"cycles">> = {};
    if (name !== undefined) patch.name = name.trim() || c.name;
    if (theme !== undefined) patch.theme = theme.trim() || undefined;
    if (startDate) {
      const s = mondayOf(startDate);
      const e = addDays(s, CYCLE_DAYS - 1);
      assertNoOverlap(await listCycles(ctx, userId), s, e, [id]);
      patch.startDate = s;
      patch.endDate = e;
      if (today && c.status !== "done") patch.status = s <= today ? "active" : "planned";
      const deadline = Date.parse(`${e}T12:00:00Z`);
      for (const g of await cycleGoalsOf(ctx, userId, id)) await ctx.db.patch(g._id, { deadline });
    }
    await ctx.db.patch(id, patch);
  },
});

/**
 * Close a cycle: record each goal's 0–1 grade and what happens next
 * (achieved, dropped, or carried to the backlog).
 */
export const close = mutation({
  args: {
    id: v.id("cycles"),
    grades: v.array(
      v.object({
        goalId: v.id("goals"),
        grade: v.number(),
        outcome: v.union(v.literal("achieved"), v.literal("dropped"), v.literal("carry")),
      }),
    ),
  },
  handler: async (ctx, { id, grades }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(id);
    if (!c || c.userId !== userId) throw new ConvexError("Cycle not found.");
    const goals = await cycleGoalsOf(ctx, userId, id);
    for (const g of goals) {
      const gr = grades.find((x) => x.goalId === g._id);
      if (gr) {
        await ctx.db.patch(g._id, {
          grade: Math.max(0, Math.min(1, gr.grade)),
          goalStatus: gr.outcome === "carry" ? "backlog" : gr.outcome,
        });
      } else if ((g.goalStatus ?? "active") === "active") {
        const ratio = g.keyResults?.length ? g.keyResults.reduce((a, k) => a + krRatio(k), 0) / g.keyResults.length : 0;
        await ctx.db.patch(g._id, {
          grade: g.grade ?? Math.round(ratio * 100) / 100,
          goalStatus: (g.grade ?? ratio) >= 0.7 ? "achieved" : "backlog",
        });
      }
    }
    await ctx.db.patch(id, { status: "done" });
  },
});

/** Delete a cycle (e.g. created by mistake). Its goals move to the backlog. */
export const remove = mutation({
  args: { id: v.id("cycles") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(id);
    if (!c || c.userId !== userId) return;
    for (const g of await cycleGoalsOf(ctx, userId, id)) {
      await ctx.db.patch(g._id, {
        cycleId: undefined,
        goalStatus: (g.goalStatus ?? "active") === "active" ? "backlog" : g.goalStatus,
      });
    }
    await ctx.db.delete(id);
  },
});

/** Reactivate a closed cycle's leftover active goal into the current cycle (cap enforced). */
export const moveGoalHere = mutation({
  args: { goalId: v.id("goals"), cycleId: v.id("cycles") },
  handler: async (ctx, { goalId, cycleId }) => {
    const userId = await requireUser(ctx);
    const g = await ctx.db.get(goalId);
    const c = await ctx.db.get(cycleId);
    if (!g || g.userId !== userId || !c || c.userId !== userId) throw new ConvexError("Not found.");
    await assertGoalCap(ctx, userId, cycleId, { excludeGoalId: goalId });
    await ctx.db.patch(goalId, {
      level: "cycle",
      cycleId,
      goalStatus: "active",
      deadline: Date.parse(`${c.endDate}T12:00:00Z`),
    });
  },
});
