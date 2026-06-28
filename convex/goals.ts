import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

const timeframeValidator = v.union(
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("yearly"),
  v.literal("custom"),
);

type Metric = { current: number; target: number; unit: string } | undefined;

/** Metric-driven when a target is set, else milestone-driven. */
function computeProgress(
  milestones: { done: boolean }[],
  metric?: Metric,
): number {
  if (metric && metric.target > 0) {
    return Math.max(0, Math.min(100, Math.round((metric.current / metric.target) * 100)));
  }
  if (milestones.length === 0) return 0;
  return Math.round(
    (milestones.filter((m) => m.done).length / milestones.length) * 100,
  );
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
  args: { id: v.id("goals") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const goal = await ctx.db.get(id);
    if (!goal || goal.userId !== userId) return null;
    return goal;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    lifeAreaId: v.id("lifeAreas"),
    sectionId: v.optional(v.id("sections")),
    projectId: v.optional(v.id("projects")),
    timeframe: timeframeValidator,
    deadline: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return ctx.db.insert("goals", {
      userId,
      ...args,
      tags: [],
      milestones: [],
      progress: 0,
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
  },
  handler: async (ctx, { id, ...rest }) => {
    await requireUser(ctx);
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) patch[k] = val === null ? undefined : val;
    // metric change recomputes progress against current milestones
    if (rest.metric !== undefined) {
      const goal = await ctx.db.get(id);
      patch.progress = computeProgress(goal?.milestones ?? [], rest.metric);
    }
    await ctx.db.patch(id, patch);
  },
});

export const addMilestone = mutation({
  args: { id: v.id("goals"), text: v.string() },
  handler: async (ctx, { id, text }) => {
    await requireUser(ctx);
    const goal = await ctx.db.get(id);
    if (!goal) return;
    const milestones = [...goal.milestones, { text, done: false }];
    await ctx.db.patch(id, { milestones, progress: computeProgress(milestones, goal.metric) });
  },
});

export const toggleMilestone = mutation({
  args: { id: v.id("goals"), index: v.number() },
  handler: async (ctx, { id, index }) => {
    await requireUser(ctx);
    const goal = await ctx.db.get(id);
    if (!goal || !goal.milestones[index]) return;
    const milestones = goal.milestones.map((m, i) =>
      i === index ? { ...m, done: !m.done } : m,
    );
    await ctx.db.patch(id, { milestones, progress: computeProgress(milestones, goal.metric) });
  },
});

export const removeMilestone = mutation({
  args: { id: v.id("goals"), index: v.number() },
  handler: async (ctx, { id, index }) => {
    await requireUser(ctx);
    const goal = await ctx.db.get(id);
    if (!goal) return;
    const milestones = goal.milestones.filter((_, i) => i !== index);
    await ctx.db.patch(id, { milestones, progress: computeProgress(milestones, goal.metric) });
  },
});

export const remove = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, { id }) => {
    await requireUser(ctx);
    await ctx.db.delete(id);
  },
});
