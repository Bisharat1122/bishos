import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

const DAY = 24 * 60 * 60 * 1000;

/** The "complete" step key marks a finished daily ritual (drives the streak). */
const COMPLETE_KEY = "complete";

function localYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Today's flow progress + whether the check-in is already done (auto-ticks). */
export const today = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    const [flow, checkin] = await Promise.all([
      ctx.db
        .query("dailyFlow")
        .withIndex("by_date", (q) => q.eq("userId", userId).eq("date", date))
        .first(),
      ctx.db
        .query("dailyCheckIns")
        .withIndex("by_date", (q) => q.eq("userId", userId).eq("date", date))
        .first(),
    ]);
    return { done: flow?.done ?? [], checkInDone: !!checkin };
  },
});

export const completeStep = mutation({
  args: { date: v.string(), key: v.string() },
  handler: async (ctx, { date, key }) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("dailyFlow")
      .withIndex("by_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();
    if (existing) {
      if (!existing.done.includes(key)) await ctx.db.patch(existing._id, { done: [...existing.done, key] });
    } else {
      await ctx.db.insert("dailyFlow", { userId, date, done: [key] });
    }
  },
});

export const uncompleteStep = mutation({
  args: { date: v.string(), key: v.string() },
  handler: async (ctx, { date, key }) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("dailyFlow")
      .withIndex("by_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();
    if (existing) await ctx.db.patch(existing._id, { done: existing.done.filter((k) => k !== key) });
  },
});

export const reset = mutation({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("dailyFlow")
      .withIndex("by_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();
    if (existing) await ctx.db.patch(existing._id, { done: [] });
  },
});

/** Consecutive-day streak of finished rituals (days whose `done` includes
 * the "complete" step), ending today or yesterday. */
export const streak = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("dailyFlow")
      .withIndex("by_date", (q) => q.eq("userId", userId))
      .collect();
    const completed = new Set(rows.filter((r) => r.done.includes(COMPLETE_KEY)).map((r) => r.date));
    const now = Date.now();
    let cursor = now;
    if (!completed.has(localYmd(new Date(now)))) {
      if (completed.has(localYmd(new Date(now - DAY)))) cursor = now - DAY;
      else return 0;
    }
    let streak = 0;
    while (completed.has(localYmd(new Date(cursor)))) {
      streak++;
      cursor -= DAY;
    }
    return streak;
  },
});
