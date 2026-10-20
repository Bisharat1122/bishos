import { v, ConvexError } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { awardXp, revokeXp, XP, ymdUtc } from "./os";

const statusValidator = v.union(
  v.literal("not_started"),
  v.literal("in_progress"),
  v.literal("done"),
);
const priorityValidator = v.union(
  v.literal("low"),
  v.literal("med"),
  v.literal("high"),
);

const energyValidator = v.union(v.literal("high"), v.literal("med"), v.literal("low"));

/** Life OS task fields accepted by create (all optional). */
const osCreateFields = {
  plannedFor: v.optional(v.string()),
  someday: v.optional(v.boolean()),
  estimateMin: v.optional(v.number()),
  energy: v.optional(energyValidator),
  context: v.optional(v.string()),
  goalId: v.optional(v.id("goals")),
  tacticId: v.optional(v.id("tactics")),
  dealId: v.optional(v.id("deals")),
  personId: v.optional(v.id("people")),
  contentId: v.optional(v.id("contentPieces")),
  learningAreaId: v.optional(v.id("learningAreas")),
  delegate: v.optional(v.boolean()),
};

/** Same fields for update — null clears the field. */
const osUpdateFields = {
  plannedFor: v.optional(v.union(v.string(), v.null())),
  someday: v.optional(v.union(v.boolean(), v.null())),
  estimateMin: v.optional(v.union(v.number(), v.null())),
  energy: v.optional(v.union(energyValidator, v.null())),
  context: v.optional(v.union(v.string(), v.null())),
  goalId: v.optional(v.union(v.id("goals"), v.null())),
  tacticId: v.optional(v.union(v.id("tactics"), v.null())),
  dealId: v.optional(v.union(v.id("deals"), v.null())),
  personId: v.optional(v.union(v.id("people"), v.null())),
  contentId: v.optional(v.union(v.id("contentPieces"), v.null())),
  learningAreaId: v.optional(v.union(v.id("learningAreas"), v.null())),
  delegate: v.optional(v.union(v.boolean(), v.null())),
};

/** Linked Life OS ids must belong to the caller. */
async function assertLinksOwned(ctx: MutationCtx, userId: Id<"users">, rec: Record<string, unknown>) {
  for (const k of ["lifeAreaId", "projectId", "sectionId", "goalId", "tacticId", "dealId", "personId", "contentId", "learningAreaId"]) {
    const id = rec[k];
    if (typeof id !== "string") continue;
    const doc = (await ctx.db.get(id as Id<"goals">)) as { userId?: Id<"users"> } | null;
    if (!doc || doc.userId !== userId) throw new ConvexError("Linked item not found.");
  }
}

export const list = query({
  args: {
    lifeAreaId: v.optional(v.id("lifeAreas")),
    status: v.optional(statusValidator),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    let tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (args.lifeAreaId) tasks = tasks.filter((t) => t.lifeAreaId === args.lifeAreaId);
    if (args.status) tasks = tasks.filter((t) => t.status === args.status);
    return tasks;
  },
});

export const get = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db.get(id);
    if (!task || task.userId !== userId) return null;
    return task;
  },
});

const attachmentValidator = v.object({
  storageId: v.id("_storage"),
  name: v.string(),
  contentType: v.string(),
  size: v.number(),
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: priorityValidator,
    dueDate: v.optional(v.number()),
    startAt: v.optional(v.number()),
    lifeAreaId: v.id("lifeAreas"),
    sectionId: v.optional(v.id("sections")),
    projectId: v.optional(v.id("projects")),
    ...osCreateFields,
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await assertLinksOwned(ctx, userId, args);
    // order = now → newest task sorts to the top of the "Not started" column
    return ctx.db.insert("tasks", { ...args, userId, status: "not_started", order: Date.now() });
  },
});

/**
 * Duplicate a task, copying every field. `startAt`/`dueDate` override the
 * source's dates (the client shifts them to the chosen day, preserving each
 * time-of-day and the gap between start and due). Omit an arg to keep the
 * source value; pass null to clear it. The copy starts fresh: not_started,
 * no completedAt, and a new order so it sorts to the top.
 */
export const duplicate = mutation({
  args: {
    id: v.id("tasks"),
    startAt: v.optional(v.union(v.number(), v.null())),
    dueDate: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, { id, startAt, dueDate }) => {
    const userId = await requireUser(ctx);
    const src = await ctx.db.get(id);
    if (!src || src.userId !== userId) throw new ConvexError("Task not found");
    return ctx.db.insert("tasks", {
      userId,
      title: src.title,
      description: src.description,
      priority: src.priority,
      status: "not_started",
      startAt: startAt === undefined ? src.startAt : (startAt ?? undefined),
      dueDate: dueDate === undefined ? src.dueDate : (dueDate ?? undefined),
      lifeAreaId: src.lifeAreaId,
      sectionId: src.sectionId,
      projectId: src.projectId,
      tags: src.tags,
      attachments: src.attachments,
      estimateMin: src.estimateMin,
      energy: src.energy,
      context: src.context,
      goalId: src.goalId,
      dealId: src.dealId,
      personId: src.personId,
      learningAreaId: src.learningAreaId,
      order: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(statusValidator),
    priority: v.optional(priorityValidator),
    dueDate: v.optional(v.union(v.number(), v.null())),
    startAt: v.optional(v.union(v.number(), v.null())),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    sectionId: v.optional(v.union(v.id("sections"), v.null())),
    projectId: v.optional(v.union(v.id("projects"), v.null())),
    tags: v.optional(v.array(v.string())),
    attachments: v.optional(v.array(attachmentValidator)),
    ...osUpdateFields,
    date: v.optional(v.string()), // client-local day (XP bookkeeping)
  },
  handler: async (ctx, { id, date, ...rest }) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db.get(id);
    if (!task || task.userId !== userId) throw new ConvexError("Task not found");
    await assertLinksOwned(ctx, userId, rest);
    // Translate explicit nulls into field removal for optional links.
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      patch[k] = val === null ? undefined : val;
    }
    if (rest.status !== undefined && (rest.status === "done") !== (task.status === "done")) {
      patch.completedAt = rest.status === "done" ? Date.now() : undefined;
      await syncTaskXp(ctx, userId, id, rest.status === "done", date);
    }
    // Moving a task to a later "when" counts as a deferral (stale filter).
    if (typeof rest.plannedFor === "string") {
      const cur = await ctx.db.get(id);
      if (cur?.plannedFor && rest.plannedFor > cur.plannedFor) patch.deferCount = (cur.deferCount ?? 0) + 1;
    }
    await ctx.db.patch(id, patch);
  },
});

/**
 * The ONE place task-completion XP is settled (every status change goes
 * through here — tasks.update / setStatus / setOrder, challenge-day ticks).
 * Mirrors days.toggleTop: done → `task-${id}` (+ `top-${date}-${id}` when the
 * task is in that local day's Top 3); un-done → revoke both. `date` is the
 * client-LOCAL day; without it the Top-3 bonus can't be resolved.
 */
export async function syncTaskXp(ctx: MutationCtx, userId: Id<"users">, id: Id<"tasks">, done: boolean, date?: string) {
  const key = `task-${id}`;
  if (done) {
    await awardXp(ctx, userId, key, XP.task, "Task done", date ?? ymdUtc(Date.now()));
    if (date) {
      const day = await ctx.db
        .query("days")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
        .first();
      if (day?.top3?.includes(id)) await awardXp(ctx, userId, `top-${date}-${id}`, XP.top3Task, "Top 3 done", date);
    }
  } else {
    await revokeTaskXp(ctx, userId, id, date);
  }
}

/**
 * Revoke a task's completion XP + its Top-3 bonus. The bonus key carries the
 * Top-3 day; picking a task into Top 3 plans it for that day, so `plannedFor`
 * (plus the caller's local date) covers it.
 */
export async function revokeTaskXp(ctx: MutationCtx, userId: Id<"users">, id: Id<"tasks">, date?: string) {
  await revokeXp(ctx, userId, `task-${id}`);
  const t = await ctx.db.get(id);
  const days = new Set([date, t?.plannedFor].filter((d): d is string => !!d));
  for (const d of days) await revokeXp(ctx, userId, `top-${d}-${id}`);
}

/** Set (or clear) the "when" day for many tasks at once — bulk reschedule. */
export const plan = mutation({
  args: {
    ids: v.array(v.id("tasks")),
    plannedFor: v.union(v.string(), v.null()),
    someday: v.optional(v.boolean()),
  },
  handler: async (ctx, { ids, plannedFor, someday }) => {
    const userId = await requireUser(ctx);
    for (const id of ids) {
      const t = await ctx.db.get(id);
      if (!t || t.userId !== userId) continue;
      const deferred = plannedFor && t.plannedFor && plannedFor > t.plannedFor;
      await ctx.db.patch(id, {
        plannedFor: plannedFor ?? undefined,
        someday: someday ?? (plannedFor ? false : t.someday),
        deferCount: deferred ? (t.deferCount ?? 0) + 1 : t.deferCount,
      });
    }
  },
});

/**
 * Lightweight names for the Tasks screen chips + filters, in one query:
 * goals, projects, deals, people, and the Top 3 for `date` (local day).
 */
export const lookups = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    const [goals, projects, deals, people, day] = await Promise.all([
      ctx.db.query("goals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("people").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("days").withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date)).first(),
    ]);
    const levelRank = (g: { level?: string }) => (g.level === "cycle" ? 0 : g.level === "annual" ? 1 : 2);
    return {
      goals: goals
        .sort((a, b) => levelRank(a) - levelRank(b) || a.title.localeCompare(b.title))
        .map((g) => ({
          _id: g._id,
          title: g.title,
          level: g.level ?? null,
          goalStatus: g.goalStatus ?? null,
          lifeAreaId: g.lifeAreaId,
        })),
      projects: projects
        .sort((a, b) => Number(a.status === "completed") - Number(b.status === "completed") || a.title.localeCompare(b.title))
        .map((p) => ({ _id: p._id, title: p.title, lifeAreaId: p.lifeAreaId, status: p.status, goalId: p.goalId ?? null })),
      deals: deals.map((d) => ({ _id: d._id, title: d.title, stage: d.stage })),
      people: people.map((p) => ({ _id: p._id, name: p.name })),
      top3: day?.top3 ?? [],
      dailyShape: day?.dailyShape ?? "big3",
    };
  },
});

/**
 * Stale-task decision (deferred 3+ times) — Bullet-Journal migration: never
 * roll over silently. keep = reset the counter; today = plan for `date` and
 * reset; someday = park it; drop = delete.
 */
export const triageStale = mutation({
  args: {
    id: v.id("tasks"),
    action: v.union(v.literal("keep"), v.literal("today"), v.literal("someday"), v.literal("drop")),
    date: v.string(),
  },
  handler: async (ctx, { id, action, date }) => {
    const userId = await requireUser(ctx);
    const t = await ctx.db.get(id);
    if (!t || t.userId !== userId) throw new ConvexError("Task not found");
    if (action === "drop") {
      await revokeTaskXp(ctx, userId, id, date);
      await ctx.db.delete(id);
      return;
    }
    if (action === "keep") await ctx.db.patch(id, { deferCount: 0 });
    else if (action === "today") await ctx.db.patch(id, { deferCount: 0, plannedFor: date, someday: false });
    else await ctx.db.patch(id, { deferCount: 0, plannedFor: undefined, someday: true });
  },
});

/** Tasks planned for a local day (plus overdue-by-"when" if includeOverdue). */
export const forDay = query({
  args: { date: v.string(), includeOverdue: v.optional(v.boolean()) },
  handler: async (ctx, { date, includeOverdue }) => {
    const userId = await requireUser(ctx);
    const all = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return all.filter(
      (t) => t.plannedFor === date || (includeOverdue && t.status !== "done" && !!t.plannedFor && t.plannedFor < date),
    );
  },
});

export const setStatus = mutation({
  args: { id: v.id("tasks"), status: statusValidator, date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) throw new ConvexError("Task not found");
    const flips = (args.status === "done") !== (task.status === "done");
    await ctx.db.patch(args.id, {
      status: args.status,
      completedAt: args.status === "done" ? (flips ? Date.now() : task.completedAt) : undefined,
    });
    if (flips) await syncTaskXp(ctx, userId, args.id, args.status === "done", args.date);
  },
});

/** Drag-and-drop: set a task's manual order (and optionally move it to another
 * column/status in the same gesture). */
export const setOrder = mutation({
  args: {
    id: v.id("tasks"),
    order: v.number(),
    status: v.optional(statusValidator),
    date: v.optional(v.string()), // client-local day (XP bookkeeping)
  },
  handler: async (ctx, { id, order, status, date }) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db.get(id);
    if (!task || task.userId !== userId) throw new ConvexError("Task not found");
    const patch: Record<string, unknown> = { order };
    if (status !== undefined) {
      patch.status = status;
      patch.completedAt = status === "done" ? Date.now() : undefined;
      // Only settle XP when the done-ness actually flips (in_progress ↔ not_started is not a completion).
      if ((status === "done") !== (task.status === "done")) await syncTaskXp(ctx, userId, id, status === "done", date);
    }
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("tasks"), date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) return;
    // A deleted task can't keep its completion XP.
    if (task.status === "done") await revokeTaskXp(ctx, userId, args.id, args.date);
    await ctx.db.delete(args.id);
  },
});
