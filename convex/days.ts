import { v } from "convex/values";
import { query, mutation, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, awardXp, revokeXp, XP } from "./os";

/**
 * The Day page — one doc per local day. Morning start-up (check-in, Top 3,
 * if-then, capacity), evening shutdown (leftover decisions, resume note,
 * progress line, lesson, journal). Every ritual has XP and is undoable.
 */

const dayTypeV = v.union(v.literal("focus"), v.literal("buffer"), v.literal("free"));
const shapeV = v.union(v.literal("big3"), v.literal("ivylee"), v.literal("135"));
const journalV = v.object({
  win: v.optional(v.string()),
  gratitude: v.optional(v.string()),
  hard: v.optional(v.string()),
  improve: v.optional(v.string()),
  free: v.optional(v.string()),
});
const decisionV = v.object({
  taskId: v.id("tasks"),
  action: v.union(
    v.literal("today"),
    v.literal("tomorrow"),
    v.literal("backlog"),
    v.literal("someday"),
    v.literal("drop"),
    v.literal("done"),
  ),
});

export async function getDay(ctx: QueryCtx | MutationCtx, userId: Id<"users">, date: string): Promise<Doc<"days"> | null> {
  return ctx.db
    .query("days")
    .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
    .first();
}

async function upsertDay(ctx: MutationCtx, userId: Id<"users">, date: string, patch: Partial<Doc<"days">>) {
  const existing = await getDay(ctx, userId, date);
  if (existing) {
    await ctx.db.patch(existing._id, patch);
    return existing._id;
  }
  return ctx.db.insert("days", { userId, date, ...patch });
}

/**
 * Keep only the caller's (existing) tasks, de-duplicated, max 9, and plan them
 * for `date`. Foreign ids from the client are dropped so they never land in a
 * day's top3 (and `get` never returns someone else's task).
 */
async function claimTop(ctx: MutationCtx, userId: Id<"users">, date: string, taskIds: Id<"tasks">[], force = false) {
  const out: Id<"tasks">[] = [];
  for (const id of [...new Set(taskIds)]) {
    if (out.length >= 9) break;
    const t = await ctx.db.get(id);
    if (!t || t.userId !== userId) continue;
    if (force || t.plannedFor !== date) await ctx.db.patch(id, { plannedFor: date, someday: false });
    out.push(id);
  }
  return out;
}

/** Apply keep / tomorrow / backlog / someday / drop / done decisions. */
async function applyDecisions(
  ctx: MutationCtx,
  userId: Id<"users">,
  date: string,
  decisions: { taskId: Id<"tasks">; action: string }[],
) {
  let top: Id<"tasks">[] | undefined;
  for (const d of decisions) {
    const t = await ctx.db.get(d.taskId);
    if (!t || t.userId !== userId) continue;
    if (d.action === "today") await ctx.db.patch(t._id, { plannedFor: date, someday: false });
    else if (d.action === "tomorrow")
      await ctx.db.patch(t._id, { plannedFor: addDays(date, 1), deferCount: (t.deferCount ?? 0) + 1, someday: false });
    else if (d.action === "backlog") await ctx.db.patch(t._id, { plannedFor: undefined, someday: false });
    else if (d.action === "someday") await ctx.db.patch(t._id, { plannedFor: undefined, someday: true });
    else if (d.action === "drop") await ctx.db.delete(t._id);
    else if (d.action === "done") {
      await ctx.db.patch(t._id, { status: "done", completedAt: Date.now() });
      await awardXp(ctx, userId, `task-${t._id}`, XP.task, "Task done", date);
      // Same Top-3 bonus (and key) as toggleTop, so "Actually done" at shutdown isn't worth less.
      top ??= (await getDay(ctx, userId, date))?.top3 ?? [];
      if (top.includes(t._id)) await awardXp(ctx, userId, `top-${date}-${t._id}`, XP.top3Task, "Top 3 done", date);
    }
  }
}

/** Mirror the check-in into the legacy dailyCheckIns table (dashboard/AI read it). */
async function mirrorCheckIn(ctx: MutationCtx, userId: Id<"users">, date: string, day: Partial<Doc<"days">>) {
  const energy = day.checkIn?.energy;
  const mood = day.checkIn?.mood;
  if (energy == null && mood == null) return;
  const avg5 = ((energy ?? mood ?? 3) + (mood ?? energy ?? 3)) / 2;
  const energyMood = Math.max(1, Math.min(10, Math.round(avg5 * 2)));
  const top = day.top3 ?? [];
  const titles: string[] = [];
  for (const id of top) {
    const t = await ctx.db.get(id);
    if (t) titles.push(t.title);
  }
  const existing = await ctx.db
    .query("dailyCheckIns")
    .withIndex("by_date", (q) => q.eq("userId", userId).eq("date", date))
    .first();
  const payload = { energyMood, priorities: titles, priorityTaskIds: top, blockers: [] as string[] };
  if (existing) await ctx.db.patch(existing._id, { energyMood, priorities: titles, priorityTaskIds: top });
  else await ctx.db.insert("dailyCheckIns", { userId, date, ...payload });
}

// ─────────────────────────────────────────────────────────────────────────

export const get = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    const day = await getDay(ctx, userId, date);
    if (!day) return null;
    const top3 = [];
    for (const id of day.top3 ?? []) {
      const t = await ctx.db.get(id);
      if (t && t.userId === userId) top3.push(t);
    }
    return { ...day, top3Tasks: top3 };
  },
});

/** Days in [from, to] for the journal calendar. */
export const range = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("days")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", from).lte("date", to))
      .collect();
    return rows;
  },
});

export const saveCheckIn = mutation({
  args: {
    date: v.string(),
    sleepHours: v.optional(v.number()),
    sleepQuality: v.optional(v.number()),
    energy: v.optional(v.number()),
    mood: v.optional(v.number()),
  },
  handler: async (ctx, { date, ...ci }) => {
    const userId = await requireUser(ctx);
    const existing = await getDay(ctx, userId, date);
    const checkIn = { ...(existing?.checkIn ?? {}), ...ci, at: Date.now() };
    const lowEnergy = (checkIn.energy != null && checkIn.energy <= 2) || (checkIn.sleepHours != null && checkIn.sleepHours < 6);
    await upsertDay(ctx, userId, date, { checkIn });
    await mirrorCheckIn(ctx, userId, date, { ...existing, checkIn });
    await awardXp(ctx, userId, `checkin-${date}`, XP.checkIn, "Morning check-in", date);
    return { lowEnergySuggested: lowEnergy };
  },
});

export const setTop3 = mutation({
  args: { date: v.string(), taskIds: v.array(v.id("tasks")) },
  handler: async (ctx, { date, taskIds }) => {
    const userId = await requireUser(ctx);
    const ids = await claimTop(ctx, userId, date, taskIds);
    await upsertDay(ctx, userId, date, { top3: ids });
  },
});

/** Patch any day fields (autosave for journal, intention, resume note…). */
export const update = mutation({
  args: {
    date: v.string(),
    dayType: v.optional(dayTypeV),
    dailyShape: v.optional(shapeV),
    intention: v.optional(v.string()),
    ifThen: v.optional(v.object({ trigger: v.string(), response: v.string() })),
    capacityMin: v.optional(v.number()),
    lowEnergy: v.optional(v.boolean()),
    resumeNote: v.optional(v.string()),
    progressLine: v.optional(v.string()),
    lesson: v.optional(v.string()),
    journal: v.optional(journalV),
  },
  handler: async (ctx, { date, ...patch }) => {
    const userId = await requireUser(ctx);
    const clean: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) if (val !== undefined) clean[k] = val;
    await upsertDay(ctx, userId, date, clean as Partial<Doc<"days">>);
    const j = patch.journal;
    if (j && Object.values(j).some((x) => (x ?? "").trim().length > 3))
      await awardXp(ctx, userId, `journal-${date}`, XP.journal, "Journal entry", date);
  },
});

/** Finish the morning start-up ritual. */
export const completeStartup = mutation({
  args: {
    date: v.string(),
    top3: v.array(v.id("tasks")),
    dailyShape: v.optional(shapeV),
    intention: v.optional(v.string()),
    ifThen: v.optional(v.object({ trigger: v.string(), response: v.string() })),
    capacityMin: v.optional(v.number()),
    dayType: v.optional(dayTypeV),
    lowEnergy: v.optional(v.boolean()),
    decisions: v.optional(v.array(decisionV)),
  },
  handler: async (ctx, { date, decisions, top3, ...rest }) => {
    const userId = await requireUser(ctx);
    if (decisions?.length) await applyDecisions(ctx, userId, date, decisions);
    const ids = await claimTop(ctx, userId, date, top3);
    const clean: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) if (val !== undefined) clean[k] = val;
    await upsertDay(ctx, userId, date, { ...(clean as Partial<Doc<"days">>), top3: ids, startupAt: Date.now() });
    const day = await getDay(ctx, userId, date);
    if (day) await mirrorCheckIn(ctx, userId, date, day);
    const fresh = await awardXp(ctx, userId, `startup-${date}`, XP.startup, "Start-up ritual", date);
    return { xp: fresh ? XP.startup : 0 };
  },
});

/** Finish the evening shutdown. Every leftover gets a decision — no silent rollover. */
export const completeShutdown = mutation({
  args: {
    date: v.string(),
    decisions: v.optional(v.array(decisionV)),
    resumeNote: v.optional(v.string()),
    progressLine: v.optional(v.string()),
    lesson: v.optional(v.string()),
    journal: v.optional(journalV),
    tomorrowTop: v.optional(v.array(v.id("tasks"))),
    dayScore: v.optional(v.number()),
  },
  handler: async (ctx, { date, decisions, tomorrowTop, ...rest }) => {
    const userId = await requireUser(ctx);
    if (decisions?.length) await applyDecisions(ctx, userId, date, decisions);
    const clean: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) if (val !== undefined) clean[k] = val;
    // The ritual only sends win/gratitude — merge so the journal page's
    // hard / improve / free-writing fields aren't wiped by the shutdown.
    if (rest.journal) {
      const existing = await getDay(ctx, userId, date);
      clean.journal = { ...(existing?.journal ?? {}), ...rest.journal };
    }
    await upsertDay(ctx, userId, date, { ...(clean as Partial<Doc<"days">>), shutdownAt: Date.now() });
    if (tomorrowTop?.length) {
      const tomorrow = addDays(date, 1);
      const ids = await claimTop(ctx, userId, tomorrow, tomorrowTop, true);
      await upsertDay(ctx, userId, tomorrow, { top3: ids });
    }
    const j = rest.journal;
    if (j && Object.values(j).some((x) => (x ?? "").trim().length > 3))
      await awardXp(ctx, userId, `journal-${date}`, XP.journal, "Journal entry", date);
    const fresh = await awardXp(ctx, userId, `shutdown-${date}`, XP.shutdown, "Shutdown complete", date);
    return { xp: fresh ? XP.shutdown : 0 };
  },
});

/** Re-open a ritual (e.g. tapped by mistake). */
export const reopen = mutation({
  args: { date: v.string(), which: v.union(v.literal("startup"), v.literal("shutdown")) },
  handler: async (ctx, { date, which }) => {
    const userId = await requireUser(ctx);
    const day = await getDay(ctx, userId, date);
    if (!day) return;
    await ctx.db.patch(day._id, which === "startup" ? { startupAt: undefined } : { shutdownAt: undefined });
    await revokeXp(ctx, userId, `${which}-${date}`);
  },
});

/** Toggle a Top-3 task done from the Today screen (+ bonus XP). */
export const toggleTop = mutation({
  args: { date: v.string(), taskId: v.id("tasks") },
  handler: async (ctx, { date, taskId }) => {
    const userId = await requireUser(ctx);
    const t = await ctx.db.get(taskId);
    if (!t || t.userId !== userId) return { done: false, allTopDone: false };
    const done = t.status !== "done";
    await ctx.db.patch(taskId, { status: done ? "done" : "not_started", completedAt: done ? Date.now() : undefined });
    const day = await getDay(ctx, userId, date);
    const inTop = !!day?.top3?.includes(taskId);
    if (done) {
      await awardXp(ctx, userId, `task-${taskId}`, XP.task, "Task done", date);
      if (inTop) await awardXp(ctx, userId, `top-${date}-${taskId}`, XP.top3Task, "Top 3 done", date);
    } else {
      await revokeXp(ctx, userId, `task-${taskId}`);
      await revokeXp(ctx, userId, `top-${date}-${taskId}`);
    }
    let allTopDone = false;
    if (done && inTop && day?.top3?.length) {
      const tops = await Promise.all(day.top3.map((id) => ctx.db.get(id)));
      allTopDone = tops.every((x) => !x || x.status === "done" || x._id === taskId);
    }
    return { done, allTopDone, inTop };
  },
});

/** Everything touched on a day — the Day page (journal detail). */
export const detail = query({
  args: { date: v.string(), dayStart: v.number() },
  handler: async (ctx, { date, dayStart }) => {
    const userId = await requireUser(ctx);
    const end = dayStart + 24 * 60 * 60 * 1000;
    const inDay = (t?: number) => t != null && t >= dayStart && t < end;
    const [day, tasks, completions, habits, focus, inbox, notes, interactions, content, blocks] = await Promise.all([
      getDay(ctx, userId, date),
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId).eq("date", date)).collect(),
      ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("inbox").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("interactions").withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date)).collect(),
      ctx.db.query("contentPieces").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("scheduleBlocks").withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date)).collect(),
    ]);
    const top3 = (day?.top3 ?? []).map((id) => tasks.find((t) => t._id === id)).filter(Boolean);
    return {
      day,
      top3,
      completed: tasks.filter((t) => t.status === "done" && inDay(t.completedAt)),
      habits: completions.map((c) => ({ kind: c.kind ?? "done", title: habits.find((h) => h._id === c.habitId)?.title ?? "Habit" })),
      focusMin: Math.round(focus.filter((f) => inDay(f.endTime)).reduce((s, f) => s + f.duration, 0) / 60),
      captures: inbox.filter((i) => inDay(i.createdAt)).map((i) => ({ _id: i._id, text: i.text, status: i.status })),
      notes: notes.filter((n) => inDay(n._creationTime)).map((n) => ({ _id: n._id, title: n.title })),
      interactions: interactions.map((i) => ({ _id: i._id, kind: i.kind, summary: i.summary })),
      published: content.filter((c) => inDay(c.publishedAt)).map((c) => ({ _id: c._id, title: c.title, brand: c.brand })),
      blocks: blocks.sort((a, b) => a.startMin - b.startMin),
    };
  },
});
