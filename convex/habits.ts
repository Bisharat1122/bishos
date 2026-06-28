import { v } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
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

/** UTC day-number for a YYYY-MM-DD string (DST-safe consecutiveness). */
const dayIndex = (d: string) => Math.floor(Date.parse(`${d}T00:00:00Z`) / DAY);

/** Longest consecutive-day run ever achieved — the lifetime best streak. */
export function computeBestStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0;
  const idx = [...dates].map(dayIndex).sort((a, b) => a - b);
  let best = 1;
  let run = 1;
  for (let i = 1; i < idx.length; i++) {
    run = idx[i] - idx[i - 1] === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
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
    const last30 = new Set(Array.from({ length: 30 }, (_, i) => ymd(Date.now() - i * DAY)));

    return habits.map((h) => {
      const dates = byHabit.get(h._id) ?? new Set<string>();
      let done30 = 0;
      for (const d of dates) if (last30.has(d)) done30++;
      return {
        ...h,
        completedToday: dates.has(today),
        streak: computeStreak(dates),
        bestStreak: computeBestStreak(dates),
        total: dates.size,
        rate30: Math.round((done30 / 30) * 100),
        trail: last7.map((d) => ({ date: d, done: dates.has(d) })),
      };
    });
  },
});

/** Full per-habit analytics for its individual page. */
export const detail = query({
  args: { id: v.id("habits") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) return null;

    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", id))
      .collect();
    const dates = new Set(completions.map((c) => c.date));
    const completedDates = [...dates].sort();

    const today = ymd(Date.now());
    const last30 = new Set(Array.from({ length: 30 }, (_, i) => ymd(Date.now() - i * DAY)));
    let done30 = 0;
    for (const d of dates) if (last30.has(d)) done30++;

    // Earliest of creation / first completion → how long we've been tracking.
    const firstMs = completedDates.length
      ? Math.min(habit._creationTime, Date.parse(`${completedDates[0]}T00:00:00Z`))
      : habit._creationTime;
    const daysTracked = Math.max(1, Math.floor((Date.now() - firstMs) / DAY) + 1);

    // Completions per month for the last 6 months.
    const base = new Date();
    const monthly = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(base.getFullYear(), base.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return {
        label: d.toLocaleDateString(undefined, { month: "short" }),
        count: completedDates.filter((x) => x.startsWith(key)).length,
      };
    });

    return {
      habit,
      completedDates,
      completedToday: dates.has(today),
      currentStreak: computeStreak(dates),
      bestStreak: computeBestStreak(dates),
      total: dates.size,
      daysTracked,
      rate30: Math.round((done30 / 30) * 100),
      rateAll: Math.round((dates.size / daysTracked) * 100),
      monthly,
    };
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
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return ctx.db.insert("habits", { ...args, userId, streak: 0 });
  },
});

export const update = mutation({
  args: {
    id: v.id("habits"),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    frequency: v.optional(frequencyValidator),
    target: v.optional(v.union(v.string(), v.null())),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    sectionId: v.optional(v.union(v.id("sections"), v.null())),
    projectId: v.optional(v.union(v.id("projects"), v.null())),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) return;
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      patch[k] = val === null ? undefined : val;
    }
    await ctx.db.patch(id, patch);
  },
});

/** Recompute and persist a habit's streak from its completion set. */
async function refreshStreak(ctx: MutationCtx, id: Id<"habits">) {
  const completions = await ctx.db
    .query("habitCompletions")
    .withIndex("by_habit", (q) => q.eq("habitId", id))
    .collect();
  const dates = new Set(completions.map((c) => c.date));
  const lastCompletedAt = completions.length
    ? Math.max(...completions.map((c) => Date.parse(`${c.date}T00:00:00Z`)))
    : undefined;
  await ctx.db.patch(id, { streak: computeStreak(dates), lastCompletedAt });
}

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

    if (existing) await ctx.db.delete(existing._id);
    else await ctx.db.insert("habitCompletions", { userId, habitId: id, date: today });

    await refreshStreak(ctx, id);
  },
});

/** Toggle a specific day's completion (backfill/correct from the heatmap).
 * Future dates are rejected. */
export const toggleDate = mutation({
  args: { id: v.id("habits"), date: v.string() },
  handler: async (ctx, { id, date }) => {
    const userId = await requireUser(ctx);
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) return;
    if (date > ymd(Date.now())) return; // no marking the future

    const existing = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", id))
      .filter((q) => q.eq(q.field("date"), date))
      .first();

    if (existing) await ctx.db.delete(existing._id);
    else await ctx.db.insert("habitCompletions", { userId, habitId: id, date });

    await refreshStreak(ctx, id);
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
