import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";
import { rangeValidator, resolveRange, RangeKey } from "./range";

const typeValidator = v.union(
  v.literal("task"),
  v.literal("goal"),
  v.literal("project"),
  v.literal("note"),
  v.literal("habit"),
  v.literal("lifeArea"),
  v.literal("section"),
  v.literal("challenge"),
);

/** Log a new momentum moment (repeatable — same item can be added many times). */
export const add = mutation({
  args: {
    type: typeValidator,
    itemId: v.string(),
    titleSnapshot: v.string(),
    why: v.optional(v.string()),
    impact: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return ctx.db.insert("momentum", {
      userId,
      type: args.type,
      itemId: args.itemId,
      titleSnapshot: args.titleSnapshot.slice(0, 200),
      why: args.why?.slice(0, 1000),
      impact: Math.max(1, Math.min(5, Math.round(args.impact))),
      createdAt: Date.now(),
    });
  },
});

/** List momentum entries, newest first, optionally filtered by type and range. */
export const list = query({
  args: {
    type: v.optional(typeValidator),
    range: v.optional(rangeValidator),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    let rows = await ctx.db
      .query("momentum")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    if (args.type) rows = rows.filter((r) => r.type === args.type);
    if (args.range) {
      const { from, to } = resolveRange(args.range as RangeKey, args.start, args.end);
      rows = rows.filter((r) => r.createdAt >= from && r.createdAt < to);
    }
    return rows;
  },
});

/** How many times a specific item has moved the needle (for the pin button badge). */
export const countForItem = query({
  args: { itemId: v.string() },
  handler: async (ctx, { itemId }) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("momentum")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.filter((r) => r.itemId === itemId).length;
  },
});

export const remove = mutation({
  args: { id: v.id("momentum") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (row && row.userId === userId) await ctx.db.delete(id);
  },
});

/** Compact stats for the dashboard tile over a window. */
export const rangeStats = query({
  args: { range: rangeValidator, start: v.optional(v.number()), end: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("momentum")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    const { from, to } = resolveRange(args.range as RangeKey, args.start, args.end);
    const inRange = rows.filter((r) => r.createdAt >= from && r.createdAt < to);
    const avgImpact = inRange.length
      ? Math.round((inRange.reduce((s, r) => s + r.impact, 0) / inRange.length) * 10) / 10
      : 0;
    return {
      count: inRange.length,
      totalAll: rows.length,
      avgImpact,
      recent: inRange.slice(0, 5),
    };
  },
});
