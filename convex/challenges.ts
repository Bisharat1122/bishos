import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

const kpiTypeValidator = v.union(v.literal("number"), v.literal("checkbox"), v.literal("text"));
const statusValidator = v.union(v.literal("active"), v.literal("completed"), v.literal("archived"));

/** All challenges for the list view, with light section/day counts. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return Promise.all(
      challenges.map(async (c) => {
        const [sections, days] = await Promise.all([
          ctx.db.query("challengeSections").withIndex("by_challenge", (q) => q.eq("challengeId", c._id)).collect(),
          ctx.db.query("challengeDays").withIndex("by_challenge", (q) => q.eq("challengeId", c._id)).collect(),
        ]);
        return { ...c, sectionCount: sections.length, dayCount: days.length };
      }),
    );
  },
});

/** Challenge meta + its sections (ordered). */
export const get = query({
  args: { id: v.id("challenges") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(id);
    if (!c || c.userId !== userId) return null;
    const sections = (
      await ctx.db.query("challengeSections").withIndex("by_challenge", (q) => q.eq("challengeId", id)).collect()
    ).sort((a, b) => a.order - b.order);
    return { ...c, sections };
  },
});

/** Create a challenge with its sections (+ each section's KPI defs) and pick habits. */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    outcome: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    primaryLifeAreaId: v.optional(v.id("lifeAreas")),
    sections: v.array(
      v.object({
        name: v.string(),
        icon: v.optional(v.string()),
        kpis: v.optional(
          v.array(v.object({ name: v.string(), type: kpiTypeValidator, unit: v.optional(v.string()), target: v.optional(v.number()) })),
        ),
      }),
    ),
    habitIds: v.optional(v.array(v.id("habits"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    // Auto-create a Life Area named after the challenge — every task inside the
    // challenge defaults to it (see challengeDays.addTask via primaryLifeAreaId).
    const areas = await ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const lifeAreaId = await ctx.db.insert("lifeAreas", {
      userId,
      name: args.name,
      icon: args.icon,
      color: args.color,
      order: areas.length,
    });
    const challengeId = await ctx.db.insert("challenges", {
      userId,
      name: args.name,
      description: args.description,
      outcome: args.outcome,
      color: args.color,
      icon: args.icon,
      primaryLifeAreaId: lifeAreaId,
      status: "active",
      startDate: Date.now(),
      pinned: false,
    });

    let sOrder = 0;
    for (const s of args.sections) {
      const sectionId = await ctx.db.insert("challengeSections", {
        userId,
        challengeId,
        name: s.name,
        icon: s.icon,
        order: sOrder++,
      });
      let kOrder = 0;
      for (const k of s.kpis ?? []) {
        await ctx.db.insert("challengeKpiDefs", {
          userId,
          challengeId,
          sectionId,
          name: k.name,
          type: k.type,
          unit: k.unit,
          target: k.target,
          order: kOrder++,
        });
      }
    }

    // Link selected global habits into this challenge.
    for (const habitId of args.habitIds ?? []) {
      const h = await ctx.db.get(habitId);
      if (h && h.userId === userId) await ctx.db.patch(habitId, { challengeId });
    }

    return challengeId;
  },
});

export const update = mutation({
  args: {
    id: v.id("challenges"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    outcome: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    primaryLifeAreaId: v.optional(v.id("lifeAreas")),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(id);
    if (!c || c.userId !== userId) return;
    await ctx.db.patch(id, rest);
  },
});

export const setStatus = mutation({
  args: { id: v.id("challenges"), status: statusValidator },
  handler: async (ctx, { id, status }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(id);
    if (!c || c.userId !== userId) return;
    await ctx.db.patch(id, { status });
  },
});

/** Delete a challenge and everything it owns; unlink reused tasks/habits. */
export const remove = mutation({
  args: { id: v.id("challenges") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(id);
    if (!c || c.userId !== userId) return;

    for (const table of ["challengeSections", "challengeGoals", "challengeKpiDefs", "challengeKpiValues", "challengeDays", "challengeDayHabits"] as const) {
      const rows = await ctx.db.query(table).withIndex("by_challenge", (q) => q.eq("challengeId", id)).collect();
      for (const r of rows) await ctx.db.delete(r._id);
    }

    // Unlink reused entities.
    const tasks = await ctx.db.query("tasks").withIndex("by_challenge", (q) => q.eq("challengeId", id)).collect();
    for (const t of tasks) await ctx.db.patch(t._id, { challengeId: undefined, challengeSectionId: undefined, challengeDayId: undefined });
    const habits = await ctx.db.query("habits").withIndex("by_challenge", (q) => q.eq("challengeId", id)).collect();
    for (const h of habits) await ctx.db.patch(h._id, { challengeId: undefined });

    await ctx.db.delete(id);
  },
});

/** Habits linked to this challenge + global habits available to add. */
export const habitOptions = query({
  args: { id: v.id("challenges") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(id);
    if (!c || c.userId !== userId) return { linked: [], available: [] };
    const habits = await ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return {
      linked: habits.filter((h) => h.challengeId === id).map((h) => ({ _id: h._id, title: h.title })),
      available: habits.filter((h) => !h.challengeId).map((h) => ({ _id: h._id, title: h.title })),
    };
  },
});

export const linkHabit = mutation({
  args: { id: v.id("challenges"), habitId: v.id("habits") },
  handler: async (ctx, { id, habitId }) => {
    const userId = await requireUser(ctx);
    const h = await ctx.db.get(habitId);
    if (!h || h.userId !== userId) return;
    await ctx.db.patch(habitId, { challengeId: id });
  },
});

export const unlinkHabit = mutation({
  args: { habitId: v.id("habits") },
  handler: async (ctx, { habitId }) => {
    const userId = await requireUser(ctx);
    const h = await ctx.db.get(habitId);
    if (!h || h.userId !== userId) return;
    await ctx.db.patch(habitId, { challengeId: undefined });
  },
});

/** Create a new global habit already linked to this challenge. */
export const createHabit = mutation({
  args: { id: v.id("challenges"), title: v.string() },
  handler: async (ctx, { id, title }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(id);
    if (!c || c.userId !== userId) throw new Error("Challenge not found");
    let areaId = c.primaryLifeAreaId;
    if (!areaId) {
      const first = await ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).first();
      areaId = first?._id;
    }
    if (!areaId) throw new Error("Create a Life Area first — habits need one.");
    return ctx.db.insert("habits", {
      userId,
      title,
      frequency: "daily",
      lifeAreaId: areaId,
      challengeId: id,
      streak: 0,
    });
  },
});

/**
 * Cross-day overview for the challenge home: totals + per-section rollups.
 */
export const overview = query({
  args: { id: v.id("challenges") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(id);
    if (!c || c.userId !== userId) return null;

    const [sections, days, tasks, habits, sessions] = await Promise.all([
      ctx.db.query("challengeSections").withIndex("by_challenge", (q) => q.eq("challengeId", id)).collect(),
      ctx.db.query("challengeDays").withIndex("by_challenge", (q) => q.eq("challengeId", id)).collect(),
      ctx.db.query("tasks").withIndex("by_challenge", (q) => q.eq("challengeId", id)).collect(),
      ctx.db.query("habits").withIndex("by_challenge", (q) => q.eq("challengeId", id)).collect(),
      ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);

    const taskById = new Map(tasks.map((t) => [t._id as string, t]));
    // Focus per section (join focus → task → section).
    const focusBySection = new Map<string, number>();
    let focusTotal = 0;
    for (const s of sessions) {
      if (!s.taskId) continue;
      const t = taskById.get(s.taskId as string);
      if (!t || t.challengeId !== id) continue;
      focusTotal += s.duration;
      if (t.challengeSectionId) focusBySection.set(t.challengeSectionId as string, (focusBySection.get(t.challengeSectionId as string) ?? 0) + s.duration);
    }

    const tasksBySection = new Map<string, { done: number; total: number }>();
    for (const t of tasks) {
      const key = (t.challengeSectionId as string) ?? "none";
      const cur = tasksBySection.get(key) ?? { done: 0, total: 0 };
      cur.total++;
      if (t.status === "done") cur.done++;
      tasksBySection.set(key, cur);
    }

    // Habit checks = global completions of this challenge's habits on the
    // challenge's day-dates (single source of truth = habitCompletions).
    const dayDates = new Set(days.map((d) => d.date));
    const habitIds = new Set(habits.map((h) => h._id as string));
    const completions = await ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId)).collect();
    const habitChecks = completions.filter((c) => habitIds.has(c.habitId as string) && dayDates.has(c.date)).length;

    // Average end-of-day energy across journaled days.
    const energies = days.map((d) => d.journal?.energy).filter((n): n is number => n != null);
    const avgEnergy = energies.length ? Math.round((energies.reduce((a, n) => a + n, 0) / energies.length) * 10) / 10 : null;

    return {
      challenge: c,
      sections: sections.sort((a, b) => a.order - b.order).map((s) => ({
        _id: s._id,
        name: s.name,
        icon: s.icon,
        focusHours: Math.round(((focusBySection.get(s._id as string) ?? 0) / 3600) * 10) / 10,
        tasksDone: tasksBySection.get(s._id as string)?.done ?? 0,
        tasksTotal: tasksBySection.get(s._id as string)?.total ?? 0,
      })),
      totals: {
        days: days.length,
        focusHours: Math.round((focusTotal / 3600) * 10) / 10,
        tasksDone: tasks.filter((t) => t.status === "done").length,
        tasksTotal: tasks.length,
        habitChecks,
        habitCount: habits.length,
        avgEnergy,
      },
    };
  },
});
