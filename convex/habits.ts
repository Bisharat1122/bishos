import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

const DAY = 24 * 60 * 60 * 1000;
const ymd = (ts: number) => new Date(ts).toISOString().slice(0, 10);

const frequencyValidator = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("custom"),
);

/** Consecutive-day streak ending today (or yesterday if today not yet done). */
export function computeStreak(dates: Set<string>): number {
  const now = Date.now();
  let cursor = now;
  if (!dates.has(ymd(now))) {
    if (dates.has(ymd(now - DAY))) cursor = now - DAY;
    else return 0;
  }
  let streak = 0;
  while (dates.has(ymd(cursor))) {
    streak++;
    cursor -= DAY;
  }
  return streak;
}

/** Habits with today's status, streak, and a 7-day trail. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [habits, completions] = await Promise.all([
      ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId)).collect(),
    ]);

    const byHabit = new Map<string, Set<string>>();
    for (const c of completions) {
      if (!byHabit.has(c.habitId)) byHabit.set(c.habitId, new Set());
      byHabit.get(c.habitId)!.add(c.date);
    }

    const today = ymd(Date.now());
    const last7 = Array.from({ length: 7 }, (_, i) => ymd(Date.now() - (6 - i) * DAY));

    return habits.map((h) => {
      const dates = byHabit.get(h._id) ?? new Set<string>();
      return {
        ...h,
        completedToday: dates.has(today),
        streak: computeStreak(dates),
        trail: last7.map((d) => ({ date: d, done: dates.has(d) })),
      };
    });
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    frequency: frequencyValidator,
    target: v.optional(v.string()),
    lifeAreaId: v.id("lifeAreas"),
    sectionId: v.optional(v.id("sections")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return ctx.db.insert("habits", { ...args, userId, streak: 0 });
  },
});

/** Toggle today's completion for a habit and refresh its streak. */
export const toggleToday = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const today = ymd(Date.now());

    const existing = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", id))
      .filter((q) => q.eq(q.field("date"), today))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.insert("habitCompletions", { userId, habitId: id, date: today });
    }

    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", id))
      .collect();
    const dates = new Set(completions.map((c) => c.date));
    const lastCompletedAt = completions.length
      ? Math.max(...completions.map((c) => new Date(c.date).getTime()))
      : undefined;
    await ctx.db.patch(id, { streak: computeStreak(dates), lastCompletedAt });
  },
});

export const remove = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, { id }) => {
    await requireUser(ctx);
    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", id))
      .collect();
    for (const c of completions) await ctx.db.delete(c._id);
    await ctx.db.delete(id);
  },
});
