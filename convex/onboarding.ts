import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";
import { getSettings } from "./os";

/** What's set up so far — drives the onboarding checklist on Today. */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [settings, areas, compass, cycles, habits, routines, metrics, pillars, learning, idealWeek] = await Promise.all([
      getSettings(ctx, userId),
      ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("compass").withIndex("by_user", (q) => q.eq("userId", userId)).first(),
      ctx.db.query("cycles").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("routines").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("metrics").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("contentPillars").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("learningAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("idealWeek").withIndex("by_user", (q) => q.eq("userId", userId)).first(),
    ]);
    const steps = [
      { key: "areas", label: "Set up your Life Areas", href: "/today?setup=1", done: areas.some((a) => a.standard || a.weeklyHoursTarget != null) },
      { key: "compass", label: "Write your purpose & vision", href: "/compass", done: !!compass?.purpose || !!compass?.vision },
      { key: "cycle", label: "Start a 12-week cycle (≤3 goals)", href: "/goals", done: cycles.length > 0 },
      { key: "week", label: "Design your Ideal Week", href: "/week", done: !!idealWeek },
      { key: "routines", label: "Turn on start-up & shutdown routines", href: "/routines", done: routines.length > 0 },
      { key: "habits", label: "Add 1–3 keystone habits", href: "/habits", done: habits.length > 0 },
      { key: "scorecard", label: "Pick your weekly founder numbers", href: "/scorecard", done: metrics.length > 0 },
      { key: "pillars", label: "Define content pillars", href: "/content", done: pillars.length > 0 },
      { key: "learning", label: "Create a learning area", href: "/learning", done: learning.length > 0 },
    ];
    return {
      onboarded: !!settings.onboardedAt,
      areas: areas.sort((a, b) => a.order - b.order),
      steps,
      doneCount: steps.filter((s) => s.done).length,
    };
  },
});

/** Create or update the Life Areas from the setup wizard (match by name). */
export const setupAreas = mutation({
  args: {
    areas: v.array(
      v.object({
        name: v.string(),
        kind: v.union(v.literal("business"), v.literal("personal")),
        standard: v.optional(v.string()),
        weeklyHoursTarget: v.optional(v.number()),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { areas }) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("lifeAreas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    let order = existing.length;
    for (const a of areas) {
      const name = a.name.trim();
      if (!name) continue;
      const match = existing.find((e) => e.name.trim().toLowerCase() === name.toLowerCase());
      if (match) {
        await ctx.db.patch(match._id, {
          kind: a.kind,
          standard: a.standard ?? match.standard,
          weeklyHoursTarget: a.weeklyHoursTarget ?? match.weeklyHoursTarget,
          color: match.color ?? a.color,
          icon: match.icon ?? a.icon,
          description: match.description ?? a.description,
          archived: false,
        });
      } else {
        await ctx.db.insert("lifeAreas", {
          userId,
          name,
          kind: a.kind,
          standard: a.standard,
          weeklyHoursTarget: a.weeklyHoursTarget,
          color: a.color,
          icon: a.icon,
          description: a.description,
          order: order++,
        });
      }
    }
  },
});

export const finish = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const doc = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (doc) await ctx.db.patch(doc._id, { onboardedAt: Date.now() });
    else await ctx.db.insert("userSettings", { userId, onboardedAt: Date.now() });
  },
});
