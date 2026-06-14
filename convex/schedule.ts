import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

const DAY = 24 * 60 * 60 * 1000;

/** Local YYYY-MM-DD for a Date (no UTC shift). */
function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Midnight ms for a YYYY-MM-DD string. */
function dayMs(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getTime();
}

/** Expand a recurring series into the list of occurrence date strings. */
function expandDates(
  startStr: string,
  recurrence: "daily" | "weekly",
  weekdays: number[] | undefined,
  untilStr: string | undefined,
): string[] {
  const start = new Date(`${startStr}T00:00:00`);
  const horizonDays = recurrence === "daily" ? 60 : 56;
  const untilMs = untilStr ? dayMs(untilStr) : start.getTime() + horizonDays * DAY;
  const days = weekdays && weekdays.length ? weekdays : [start.getDay()];
  const out: string[] = [];
  const cur = new Date(start);
  while (cur.getTime() <= untilMs && out.length < 120) {
    if (recurrence === "daily" || days.includes(cur.getDay())) out.push(ymdLocal(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

const linkArgs = {
  taskId: v.optional(v.id("tasks")),
  projectId: v.optional(v.id("projects")),
  goalId: v.optional(v.id("goals")),
  lifeAreaId: v.optional(v.id("lifeAreas")),
  sectionId: v.optional(v.id("sections")),
  color: v.optional(v.string()),
  notes: v.optional(v.string()),
};

export const create = mutation({
  args: {
    date: v.string(),
    startMin: v.number(),
    endMin: v.number(),
    title: v.string(),
    ...linkArgs,
    recurrence: v.optional(v.union(v.literal("daily"), v.literal("weekly"))),
    weekdays: v.optional(v.array(v.number())),
    untilDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const base = {
      userId,
      startMin: args.startMin,
      endMin: Math.max(args.startMin + 5, args.endMin),
      title: args.title.slice(0, 200) || "Untitled block",
      status: "planned" as const,
      taskId: args.taskId,
      projectId: args.projectId,
      goalId: args.goalId,
      lifeAreaId: args.lifeAreaId,
      sectionId: args.sectionId,
      color: args.color,
      notes: args.notes,
    };

    if (!args.recurrence) {
      return ctx.db.insert("scheduleBlocks", { ...base, date: args.date });
    }

    const dates = expandDates(args.date, args.recurrence, args.weekdays, args.untilDate);
    let seriesId: string | undefined;
    let firstId = null;
    for (const d of dates) {
      const id = await ctx.db.insert("scheduleBlocks", {
        ...base,
        date: d,
        recurrence: args.recurrence,
        seriesId,
      });
      if (!seriesId) {
        seriesId = id;
        firstId = id;
        await ctx.db.patch(id, { seriesId: id });
      }
    }
    return firstId;
  },
});

export const update = mutation({
  args: {
    id: v.id("scheduleBlocks"),
    date: v.optional(v.string()),
    startMin: v.optional(v.number()),
    endMin: v.optional(v.number()),
    title: v.optional(v.string()),
    taskId: v.optional(v.union(v.id("tasks"), v.null())),
    projectId: v.optional(v.union(v.id("projects"), v.null())),
    goalId: v.optional(v.union(v.id("goals"), v.null())),
    lifeAreaId: v.optional(v.union(v.id("lifeAreas"), v.null())),
    sectionId: v.optional(v.union(v.id("sections"), v.null())),
    color: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const block = await ctx.db.get(id);
    if (!block || block.userId !== userId) return;
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      patch[k] = val === null ? undefined : val;
    }
    await ctx.db.patch(id, patch);
  },
});

/** Mark a block planned/done/skipped. Marking done auto-logs a focus session
 * (attributed to the same task/project/area); un-marking removes it. */
export const setStatus = mutation({
  args: {
    id: v.id("scheduleBlocks"),
    status: v.union(v.literal("planned"), v.literal("done"), v.literal("skipped")),
  },
  handler: async (ctx, { id, status }) => {
    const userId = await requireUser(ctx);
    const block = await ctx.db.get(id);
    if (!block || block.userId !== userId) return;

    if (status === "done" && !block.focusSessionId) {
      const start = dayMs(block.date) + block.startMin * 60000;
      const end = dayMs(block.date) + block.endMin * 60000;
      const focusSessionId = await ctx.db.insert("focusSessions", {
        userId,
        startTime: start,
        endTime: end,
        duration: Math.max(0, (block.endMin - block.startMin) * 60),
        taskId: block.taskId,
        projectId: block.projectId,
        lifeAreaId: block.lifeAreaId,
        sectionId: block.sectionId,
      });
      await ctx.db.patch(id, { status, focusSessionId });
      return;
    }

    if (status !== "done" && block.focusSessionId) {
      await ctx.db.delete(block.focusSessionId);
      await ctx.db.patch(id, { status, focusSessionId: undefined });
      return;
    }
    await ctx.db.patch(id, { status });
  },
});

export const remove = mutation({
  args: { id: v.id("scheduleBlocks") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const block = await ctx.db.get(id);
    if (!block || block.userId !== userId) return;
    if (block.focusSessionId) await ctx.db.delete(block.focusSessionId);
    await ctx.db.delete(id);
  },
});

/** Delete this occurrence and all future occurrences in the same series. */
export const removeSeries = mutation({
  args: { seriesId: v.string(), fromDate: v.string() },
  handler: async (ctx, { seriesId, fromDate }) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("scheduleBlocks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const r of rows) {
      if (r.seriesId === seriesId && r.date >= fromDate) {
        if (r.focusSessionId) await ctx.db.delete(r.focusSessionId);
        await ctx.db.delete(r._id);
      }
    }
  },
});

/** Blocks within an inclusive date window (YYYY-MM-DD strings). */
export const range = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { startDate, endDate }) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("scheduleBlocks")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).gte("date", startDate).lte("date", endDate),
      )
      .collect();
    return rows.sort((a, b) => (a.date === b.date ? a.startMin - b.startMin : a.date.localeCompare(b.date)));
  },
});

/** Blocks for a single day (client passes its local YYYY-MM-DD). */
export const day = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("scheduleBlocks")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .collect();
    return rows.sort((a, b) => a.startMin - b.startMin);
  },
});

/** Adherence + planned-vs-actual hours over a date window (for analytics cards
 * and the weekly review). */
export const analytics = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { startDate, endDate }) => {
    const userId = await requireUser(ctx);
    const [blocks, areas, focus] = await Promise.all([
      ctx.db
        .query("scheduleBlocks")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", userId).gte("date", startDate).lte("date", endDate),
        )
        .collect(),
      ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);

    const areaName = (id?: string) => areas.find((a) => a._id === id)?.name ?? "Unassigned";
    const windowStart = dayMs(startDate);
    const windowEnd = dayMs(endDate) + DAY;

    let scheduledMin = 0;
    let done = 0;
    let skipped = 0;
    const schedByArea = new Map<string, number>();
    for (const b of blocks) {
      const dur = Math.max(0, b.endMin - b.startMin);
      scheduledMin += dur;
      if (b.status === "done") done++;
      if (b.status === "skipped") skipped++;
      schedByArea.set(areaName(b.lifeAreaId), (schedByArea.get(areaName(b.lifeAreaId)) ?? 0) + dur);
    }

    let actualSec = 0;
    for (const s of focus) {
      if (s.endTime >= windowStart && s.endTime < windowEnd) actualSec += s.duration;
    }

    const total = blocks.length;
    return {
      totalBlocks: total,
      done,
      skipped,
      adherence: total ? Math.round((done / total) * 100) : 0,
      scheduledHours: Math.round((scheduledMin / 60) * 10) / 10,
      actualHours: Math.round((actualSec / 3600) * 10) / 10,
      byArea: [...schedByArea.entries()]
        .map(([name, min]) => ({ name, hours: Math.round((min / 60) * 10) / 10 }))
        .sort((a, b) => b.hours - a.hours),
    };
  },
});
