import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";
import { getSettings } from "./os";

/** Settings with defaults applied. */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return getSettings(ctx, userId);
  },
});

export const update = mutation({
  args: {
    capacityMin: v.optional(v.number()),
    outreachQuota: v.optional(v.number()),
    meetingsGoal: v.optional(v.number()),
    contentWeeklyTarget: v.optional(v.number()),
    maxActiveGoals: v.optional(v.number()),
    maxActiveProjects: v.optional(v.number()),
    maxNewHabits: v.optional(v.number()),
    annualIncome: v.optional(v.number()),
    currency: v.optional(v.string()),
    freeWeekday: v.optional(v.number()),
    reviewWeekday: v.optional(v.number()),
    workHoursCap: v.optional(v.number()),
    celebrate: v.optional(v.boolean()),
    onboardedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(args)) if (val !== undefined) patch[k] = val;
    const doc = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (doc) await ctx.db.patch(doc._id, patch);
    else await ctx.db.insert("userSettings", { userId, ...patch });
  },
});
