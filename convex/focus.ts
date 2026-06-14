import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Log a completed focus session (from the timer). Durations in seconds. */
export const log = mutation({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),
    taskId: v.optional(v.id("tasks")),
    projectId: v.optional(v.id("projects")),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    sectionId: v.optional(v.id("sections")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return ctx.db.insert("focusSessions", { userId, ...args });
  },
});

/** Manual entry of past focus time (minutes), optionally on a chosen date. */
export const logManual = mutation({
  args: {
    durationMinutes: v.number(),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const end = args.date ?? Date.now();
    const duration = Math.round(args.durationMinutes * 60);
    return ctx.db.insert("focusSessions", {
      userId,
      startTime: end - duration * 1000,
      endTime: end,
      duration,
      lifeAreaId: args.lifeAreaId,
      projectId: args.projectId,
      taskId: args.taskId,
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return ctx.db
      .query("focusSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(25);
  },
});

export const remove = mutation({
  args: { id: v.id("focusSessions") },
  handler: async (ctx, { id }) => {
    await requireUser(ctx);
    await ctx.db.delete(id);
  },
});

/** All focus sessions logged against one task + the total — for the task panel. */
export const byTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    await requireUser(ctx);
    const sessions = await ctx.db
      .query("focusSessions")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .collect();
    sessions.sort((a, b) => b.endTime - a.endTime);
    return { total: sessions.reduce((a, s) => a + s.duration, 0), sessions };
  },
});

/** Total focus time per task and per project (all time) — the "time spent" panel. */
export const taskTotals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [sessions, tasks, projects] = await Promise.all([
      ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const byTask = new Map<string, { seconds: number; count: number }>();
    const byProject = new Map<string, { seconds: number; count: number }>();
    for (const s of sessions) {
      if (s.taskId) {
        const e = byTask.get(s.taskId) ?? { seconds: 0, count: 0 };
        byTask.set(s.taskId, { seconds: e.seconds + s.duration, count: e.count + 1 });
      }
      if (s.projectId) {
        const e = byProject.get(s.projectId) ?? { seconds: 0, count: 0 };
        byProject.set(s.projectId, { seconds: e.seconds + s.duration, count: e.count + 1 });
      }
    }
    return {
      tasks: [...byTask.entries()]
        .map(([id, v]) => ({ id, title: tasks.find((t) => t._id === id)?.title ?? "(deleted task)", ...v }))
        .sort((a, b) => b.seconds - a.seconds),
      projects: [...byProject.entries()]
        .map(([id, v]) => ({ id, title: projects.find((p) => p._id === id)?.title ?? "(deleted)", ...v }))
        .sort((a, b) => b.seconds - a.seconds),
    };
  },
});

/** Focus analytics for an arbitrary range — drives the Dashboard time filter. */
export const rangeAnalytics = query({
  args: {
    range: v.union(v.literal("today"), v.literal("week"), v.literal("month"), v.literal("custom")),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const [sessions, areas, tasks, sections, projects] = await Promise.all([
      ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("sections").filter((q) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const taskById = new Map(tasks.map((t) => [t._id, t]));
    const projById = new Map(projects.map((p) => [p._id, p]));
    const sectionName = (id?: string) => sections.find((s) => s._id === id)?.name;
    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const day0 = new Date(now);
    day0.setHours(0, 0, 0, 0);

    const areaMeta = (id: string) => {
      if (id === "none") return { name: "Unattributed", color: "#6b7280" };
      const a = areas.find((x) => x._id === id);
      return { name: a?.name ?? "Other", color: a?.color };
    };

    let from: number, to: number;
    let labels: string[] = [];
    let bucketOf: (endTime: number) => number;

    if (args.range === "today") {
      from = day0.getTime();
      to = from + DAY;
      labels = Array.from({ length: 6 }, (_, i) => `${i * 4}-${i * 4 + 4}h`);
      bucketOf = (t) => Math.min(5, Math.floor(new Date(t).getHours() / 4));
    } else if (args.range === "week") {
      const ws = new Date(day0);
      ws.setDate(ws.getDate() - ws.getDay());
      from = ws.getTime();
      to = from + 7 * DAY;
      labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      bucketOf = (t) => Math.floor((t - from) / DAY);
    } else if (args.range === "month") {
      const ms = new Date(day0.getFullYear(), day0.getMonth(), 1);
      from = ms.getTime();
      to = new Date(day0.getFullYear(), day0.getMonth() + 1, 1).getTime();
      labels = ["W1", "W2", "W3", "W4", "W5", "W6"];
      bucketOf = (t) => Math.min(5, Math.floor((t - from) / (7 * DAY)));
    } else {
      from = args.start ?? day0.getTime();
      to = (args.end ?? now) + DAY;
      const days = Math.max(1, Math.min(31, Math.round((to - from) / DAY)));
      labels = Array.from({ length: days }, (_, i) =>
        new Date(from + i * DAY).toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
      );
      bucketOf = (t) => Math.floor((t - from) / DAY);
    }

    type Item = { label: string; sub?: string; color?: string; hours: number };
    const segMaps: Map<string, number>[] = labels.map(() => new Map());
    const itemMaps: Map<string, Item>[] = labels.map(() => new Map());
    let total = 0;
    const byArea = new Map<string, number>();

    for (const s of sessions) {
      if (s.endTime < from || s.endTime >= to) continue;
      total += s.duration;
      const hrs = s.duration / 3600;
      const task = s.taskId ? taskById.get(s.taskId) : undefined;
      const project = s.projectId ? projById.get(s.projectId) : undefined;
      const areaId = s.lifeAreaId ?? task?.lifeAreaId ?? "none";
      byArea.set(areaId, (byArea.get(areaId) ?? 0) + s.duration);

      const idx = bucketOf(s.endTime);
      if (idx < 0 || idx >= segMaps.length) continue;
      segMaps[idx].set(areaId, (segMaps[idx].get(areaId) ?? 0) + hrs);

      // per-task / -project / -area item for the tooltip
      let ikey: string, label: string, sub: string | undefined;
      if (task) {
        ikey = "t:" + s.taskId;
        label = task.title;
        const projId = s.projectId ?? task.projectId;
        const projTitle = projId ? projById.get(projId)?.title : undefined;
        const where = task.sectionId ? sectionName(task.sectionId) : areaMeta(areaId).name;
        sub = [projTitle, where].filter(Boolean).join(" · ");
      } else if (project) {
        ikey = "p:" + s.projectId;
        label = project.title;
        sub = "Project · " + areaMeta(areaId).name;
      } else {
        ikey = "a:" + areaId;
        label = areaMeta(areaId).name;
        sub = undefined;
      }
      const m = itemMaps[idx];
      const e = m.get(ikey) ?? { label, sub, color: areaMeta(areaId).color, hours: 0 };
      e.hours += hrs;
      m.set(ikey, e);
    }

    const series = labels.map((label, i) => {
      const segments = [...segMaps[i].entries()].map(([id, hrs]) => ({
        name: areaMeta(id).name,
        color: areaMeta(id).color,
        value: hrs,
      }));
      const items = [...itemMaps[i].values()].sort((a, b) => b.hours - a.hours);
      return { label, total: segments.reduce((a, b) => a + b.value, 0), segments, items };
    });

    const present = new Set<string>();
    for (const m of segMaps) for (const id of m.keys()) present.add(id);
    const legend = [...present].map((id) => areaMeta(id));

    return {
      total,
      series,
      legend,
      byArea: [...byArea.entries()]
        .map(([id, sec]) => ({ name: areaMeta(id).name, seconds: sec }))
        .sort((a, b) => b.seconds - a.seconds),
    };
  },
});

/** Weekly + per-area analytics (seconds). Drives the Focus page and Dashboard chart. */
export const analytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [sessions, areas] = await Promise.all([
      ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);

    const now = Date.now();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartMs = weekStart.getTime();

    const week = WEEKDAYS.map((label) => ({ label, seconds: 0 }));
    const areaSeconds = new Map<string, number>();
    let totalWeek = 0;
    let totalToday = 0;

    for (const s of sessions) {
      if (s.endTime >= todayStart.getTime()) totalToday += s.duration;
      if (s.endTime >= weekStartMs) {
        totalWeek += s.duration;
        const dayIdx = Math.floor((s.endTime - weekStartMs) / (24 * 60 * 60 * 1000));
        if (dayIdx >= 0 && dayIdx < 7) week[dayIdx].seconds += s.duration;
        if (s.lifeAreaId) {
          areaSeconds.set(s.lifeAreaId, (areaSeconds.get(s.lifeAreaId) ?? 0) + s.duration);
        }
      }
    }

    const byArea = [...areaSeconds.entries()]
      .map(([id, seconds]) => ({
        lifeAreaId: id,
        name: areas.find((a) => a._id === id)?.name ?? "Unknown",
        seconds,
      }))
      .sort((a, b) => b.seconds - a.seconds);

    return { week, byArea, totalWeek, totalToday };
  },
});
