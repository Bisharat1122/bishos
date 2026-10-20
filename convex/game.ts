import { v } from "convex/values";
import { query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, levelFromXp, ritualStreak } from "./os";

/** Shared: XP totals + ritual streak for a user (used by Today + Sidebar). */
export async function gameState(ctx: QueryCtx, userId: Id<"users">, today: string) {
  const [ledger, days] = await Promise.all([
    ctx.db.query("xpLedger").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("days").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
  ]);
  const total = ledger.reduce((s, x) => s + x.amount, 0);
  const todayXp = ledger.filter((x) => x.date === today).reduce((s, x) => s + x.amount, 0);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((d) => ({
    date: d,
    xp: ledger.filter((x) => x.date === d).reduce((s, x) => s + x.amount, 0),
  }));
  const done = new Set(days.filter((d) => d.startupAt || d.shutdownAt).map((d) => d.date));
  const free = new Set(days.filter((d) => d.dayType === "free").map((d) => d.date));
  const streak = ritualStreak(done, free, today);
  return { level: levelFromXp(total), todayXp, week, streak, ritualDays: done.size };
}

/** XP, level, streak and the last reward events. */
export const stats = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const state = await gameState(ctx, userId, today);
    const recent = await ctx.db
      .query("xpLedger")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(12);
    return { ...state, recent: recent.map((r) => ({ reason: r.reason, amount: r.amount, at: r.at })) };
  },
});

type Badge = { key: string; title: string; hint: string; icon: string; unlocked: boolean; progress: number; goal: number };

/** Achievements — milestones derived from the XP ledger + days (positive only). */
export const achievements = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const [ledger, state] = await Promise.all([
      ctx.db.query("xpLedger").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      gameState(ctx, userId, today),
    ]);
    const count = (prefix: string, suffix?: string) =>
      ledger.filter((x) => x.key.startsWith(prefix) && (!suffix || x.key.endsWith(suffix))).length;
    const best = state.streak.best;
    const defs: Omit<Badge, "unlocked">[] = [
      { key: "day-one", title: "Day One", hint: "Finish your first start-up ritual", icon: "sun", progress: count("startup-"), goal: 1 },
      { key: "loop-closer", title: "Loop Closer", hint: "Finish your first shutdown", icon: "moon", progress: count("shutdown-"), goal: 1 },
      { key: "week-warrior", title: "Week Warrior", hint: "Reach a 7-day ritual streak", icon: "flame", progress: best, goal: 7 },
      { key: "unbreakable", title: "Unbreakable", hint: "Reach a 30-day ritual streak", icon: "shield", progress: best, goal: 30 },
      { key: "mind-like-water", title: "Mind Like Water", hint: "Process 50 inbox items", icon: "inbox", progress: count("inbox-"), goal: 50 },
      { key: "top-performer", title: "Top Performer", hint: "Finish 25 Top priorities", icon: "star", progress: count("top-"), goal: 25 },
      { key: "promise-keeper", title: "Promise Keeper", hint: "Keep 10 promises on time", icon: "handshake", progress: count("commitment-kept-") + count("commit-"), goal: 10 },
      { key: "first-close", title: "First Close", hint: "Win your first deal", icon: "trophy", progress: count("deal-won-"), goal: 1 },
      { key: "rainmaker", title: "Rainmaker", hint: "Win 10 deals", icon: "trophy", progress: count("deal-won-"), goal: 10 },
      { key: "dialer", title: "Dialer", hint: "Log 100 outreach touches", icon: "phone", progress: count("touch-"), goal: 100 },
      { key: "publisher", title: "Publisher", hint: "Publish your first piece of content", icon: "clapperboard", progress: count("content-pub-"), goal: 1 },
      { key: "content-machine", title: "Content Machine", hint: "Publish 25 pieces", icon: "clapperboard", progress: count("content-pub-"), goal: 25 },
      { key: "student", title: "Deliberate Student", hint: "Log 10 practice sessions", icon: "graduation", progress: count("practice-"), goal: 10 },
      { key: "memory-palace", title: "Memory Palace", hint: "Review 500 recall cards", icon: "brain", progress: count("recall-"), goal: 500 },
      { key: "reviewer", title: "The Reviewer", hint: "Complete 4 weekly reviews", icon: "clipboard", progress: count("review-weekly-"), goal: 4 },
      { key: "quarter-master", title: "Quarter Master", hint: "Complete a quarterly review", icon: "target", progress: count("review-quarterly-"), goal: 1 },
      { key: "habit-hero", title: "Habit Hero", hint: "Log 100 habit check-ins", icon: "repeat", progress: count("habit-"), goal: 100 },
      { key: "level-5", title: "Strategist", hint: "Reach level 5", icon: "sparkles", progress: state.level.level, goal: 5 },
      { key: "level-10", title: "Visionary", hint: "Reach level 10", icon: "sparkles", progress: state.level.level, goal: 10 },
    ];
    const badges: Badge[] = defs.map((d) => ({ ...d, unlocked: d.progress >= d.goal, progress: Math.min(d.progress, d.goal) }));
    return { badges, unlocked: badges.filter((b) => b.unlocked).length, total: badges.length };
  },
});
