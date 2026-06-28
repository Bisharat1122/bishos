import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { requireUser } from "./helpers";
import { callOpenRouter } from "./openrouter";
import { computeStreak, computeBestStreak } from "./habits";

const ymd = (ts: number) => new Date(ts).toISOString().slice(0, 10);

const statusValidator = v.union(
  v.literal("planning"),
  v.literal("active"),
  v.literal("blocked"),
  v.literal("completed"),
);
const kindValidator = v.union(v.literal("standard"), v.literal("sprint"));
const attachmentValidator = v.object({
  storageId: v.id("_storage"),
  name: v.string(),
  contentType: v.string(),
  size: v.number(),
  text: v.optional(v.string()),
});

const DAY = 24 * 60 * 60 * 1000;

function computeProgress(milestones: { done: boolean }[]): number {
  if (milestones.length === 0) return 0;
  return Math.round(
    (milestones.filter((m) => m.done).length / milestones.length) * 100,
  );
}

/** List projects with derived task counts. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [projects, tasks] = await Promise.all([
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    return projects.map((p) => {
      const pt = tasks.filter((t) => t.projectId === p._id);
      return {
        ...p,
        kind: p.kind ?? "standard",
        taskTotal: pt.length,
        taskDone: pt.filter((t) => t.status === "done").length,
      };
    });
  },
});

/** Full detail for one project: its tasks, goals and linked notes. */
export const detail = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(id);
    if (!project || project.userId !== userId) return null;

    const [tasks, goals, allNotes] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_project", (q) => q.eq("projectId", id)).collect(),
      ctx.db.query("goals").withIndex("by_project", (q) => q.eq("projectId", id)).collect(),
      ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const notes = allNotes.filter((n) => n.linkedProjectIds?.includes(id));
    return { project: { ...project, kind: project.kind ?? "standard" }, tasks, goals, notes };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    lifeAreaId: v.id("lifeAreas"),
    status: v.optional(statusValidator),
    kind: v.optional(kindValidator),
    // sprint
    outcome: v.optional(v.string()),
    startDate: v.optional(v.number()),
    durationDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const isSprint = args.kind === "sprint";
    const start = args.startDate ?? Date.now();
    return ctx.db.insert("projects", {
      userId,
      title: args.title,
      description: args.description,
      lifeAreaId: args.lifeAreaId,
      status: args.status ?? (isSprint ? "active" : "planning"),
      progress: 0,
      kind: args.kind ?? "standard",
      outcome: args.outcome,
      startDate: isSprint ? start : undefined,
      durationDays: isSprint ? args.durationDays : undefined,
      endDate: isSprint && args.durationDays ? start + args.durationDays * DAY : undefined,
      milestones: isSprint ? [] : undefined,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(statusValidator),
    progress: v.optional(v.number()),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    outcome: v.optional(v.string()),
    startDate: v.optional(v.number()),
    durationDays: v.optional(v.number()),
    endDate: v.optional(v.number()),
    attachments: v.optional(v.array(attachmentValidator)),
    aiPlan: v.optional(v.string()),
    areaIds: v.optional(v.array(v.id("lifeAreas"))),
  },
  handler: async (ctx, { id, ...rest }) => {
    await requireUser(ctx);
    const patch: Record<string, unknown> = { ...rest };
    // keep endDate consistent when duration/start change
    if (rest.startDate !== undefined || rest.durationDays !== undefined) {
      const cur = await ctx.db.get(id);
      const start = rest.startDate ?? cur?.startDate ?? Date.now();
      const dur = rest.durationDays ?? cur?.durationDays;
      if (dur) patch.endDate = start + dur * DAY;
    }
    await ctx.db.patch(id, patch);
  },
});

export const addMilestone = mutation({
  args: { id: v.id("projects"), text: v.string() },
  handler: async (ctx, { id, text }) => {
    await requireUser(ctx);
    const p = await ctx.db.get(id);
    if (!p) return;
    const milestones = [...(p.milestones ?? []), { text, done: false }];
    await ctx.db.patch(id, { milestones, progress: computeProgress(milestones) });
  },
});

export const toggleMilestone = mutation({
  args: { id: v.id("projects"), index: v.number() },
  handler: async (ctx, { id, index }) => {
    await requireUser(ctx);
    const p = await ctx.db.get(id);
    if (!p || !p.milestones?.[index]) return;
    const milestones = p.milestones.map((m, i) =>
      i === index ? { ...m, done: !m.done } : m,
    );
    await ctx.db.patch(id, { milestones, progress: computeProgress(milestones) });
  },
});

export const removeMilestone = mutation({
  args: { id: v.id("projects"), index: v.number() },
  handler: async (ctx, { id, index }) => {
    await requireUser(ctx);
    const p = await ctx.db.get(id);
    if (!p) return;
    const milestones = (p.milestones ?? []).filter((_, i) => i !== index);
    await ctx.db.patch(id, { milestones, progress: computeProgress(milestones) });
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    await requireUser(ctx);
    const tasks = await ctx.db.query("tasks").withIndex("by_project", (q) => q.eq("projectId", id)).collect();
    for (const t of tasks) await ctx.db.patch(t._id, { projectId: undefined });
    const goals = await ctx.db.query("goals").withIndex("by_project", (q) => q.eq("projectId", id)).collect();
    for (const g of goals) await ctx.db.patch(g._id, { projectId: undefined });
    const habits = await ctx.db.query("habits").withIndex("by_project", (q) => q.eq("projectId", id)).collect();
    for (const h of habits) await ctx.db.patch(h._id, { projectId: undefined });
    await ctx.db.delete(id);
  },
});

/** Multi-area: set the life areas this sprint spans. */
export const setAreas = mutation({
  args: { id: v.id("projects"), areaIds: v.array(v.id("lifeAreas")) },
  handler: async (ctx, { id, areaIds }) => {
    const userId = await requireUser(ctx);
    const p = await ctx.db.get(id);
    if (!p || p.userId !== userId) return;
    await ctx.db.patch(id, { areaIds });
  },
});

/** Edit a single cell of the Plan matrix (creates the area's row if missing). */
export const setPlanCell = mutation({
  args: {
    id: v.id("projects"),
    areaId: v.id("lifeAreas"),
    field: v.union(
      v.literal("now"),
      v.literal("d30"),
      v.literal("d60"),
      v.literal("d90"),
      v.literal("status"),
    ),
    value: v.string(),
  },
  handler: async (ctx, { id, areaId, field, value }) => {
    const userId = await requireUser(ctx);
    const p = await ctx.db.get(id);
    if (!p || p.userId !== userId) return;
    const grid = (p.planGrid ?? []).map((r) => ({ ...r }));
    let row = grid.find((r) => r.areaId === areaId);
    if (!row) {
      row = { areaId, now: "", d30: "", d60: "", d90: "", status: "" };
      grid.push(row);
    }
    (row as Record<string, unknown>)[field] = value;
    await ctx.db.patch(id, { planGrid: grid });
  },
});

/**
 * Sprint Command Center: everything linked to this sprint, aggregated.
 * Linked goals/tasks via projectId, linked habits via projectId, areas via
 * areaIds (+ the primary lifeAreaId), plus rolled-up stats.
 */
export const commandCenter = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(id);
    if (!project || project.userId !== userId) return null;

    const [areasAll, goals, habits, tasks, completions, sessions] = await Promise.all([
      ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("goals").withIndex("by_project", (q) => q.eq("projectId", id)).collect(),
      ctx.db.query("habits").withIndex("by_project", (q) => q.eq("projectId", id)).collect(),
      ctx.db.query("tasks").withIndex("by_project", (q) => q.eq("projectId", id)).collect(),
      ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);

    const areaIdSet = new Set<string>([...(project.areaIds ?? []), project.lifeAreaId]);
    const areas = areasAll
      .filter((a) => areaIdSet.has(a._id))
      .map((a) => ({ _id: a._id, name: a.name, color: a.color }));
    const areaName = (idv?: string) => areasAll.find((a) => a._id === idv)?.name;

    // habit completion sets → streaks + 30-day adherence
    const compByHabit = new Map<string, Set<string>>();
    for (const c of completions) {
      if (!compByHabit.has(c.habitId)) compByHabit.set(c.habitId, new Set());
      compByHabit.get(c.habitId)!.add(c.date);
    }
    const today = ymd(Date.now());
    const last30 = new Set(Array.from({ length: 30 }, (_, i) => ymd(Date.now() - i * DAY)));
    const habitRows = habits.map((h) => {
      const dates = compByHabit.get(h._id) ?? new Set<string>();
      let done30 = 0;
      for (const d of dates) if (last30.has(d)) done30++;
      return {
        _id: h._id,
        title: h.title,
        lifeAreaId: h.lifeAreaId,
        area: areaName(h.lifeAreaId),
        streak: computeStreak(dates),
        bestStreak: computeBestStreak(dates),
        rate30: Math.round((done30 / 30) * 100),
        completedToday: dates.has(today),
      };
    });

    const goalRows = goals.map((g) => ({
      _id: g._id,
      title: g.title,
      progress: g.progress,
      deadline: g.deadline,
      lifeAreaId: g.lifeAreaId,
      area: areaName(g.lifeAreaId),
    }));
    const taskRows = tasks.map((t) => ({
      _id: t._id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      lifeAreaId: t.lifeAreaId,
      area: areaName(t.lifeAreaId),
    }));

    // focus roll-up over the sprint window (area-wide + project/task linked)
    const from = project.startDate ?? project._creationTime;
    const to = project.endDate ?? Date.now();
    const linkedTaskIds = new Set(tasks.map((t) => t._id as string));
    let focusSec = 0;
    for (const s of sessions) {
      if (s.endTime < from || s.endTime > to) continue;
      const inScope =
        s.projectId === id ||
        (s.lifeAreaId && areaIdSet.has(s.lifeAreaId)) ||
        (s.taskId && linkedTaskIds.has(s.taskId));
      if (inScope) focusSec += s.duration;
    }

    const now = Date.now();
    const daysLeft = project.endDate != null ? Math.ceil((project.endDate - now) / DAY) : null;
    const tasksDone = tasks.filter((t) => t.status === "done").length;
    const goalsAvg = goalRows.length
      ? Math.round(goalRows.reduce((a, g) => a + g.progress, 0) / goalRows.length)
      : 0;
    const habitAdherence = habitRows.length
      ? Math.round(habitRows.reduce((a, h) => a + h.rate30, 0) / habitRows.length)
      : 0;
    const timeElapsedPct =
      project.startDate != null && project.endDate != null && project.endDate > project.startDate
        ? Math.min(100, Math.max(0, Math.round(((now - project.startDate) / (project.endDate - project.startDate)) * 100)))
        : 0;

    return {
      project: { ...project, kind: project.kind ?? "standard" },
      areas,
      goals: goalRows,
      habits: habitRows,
      tasks: taskRows,
      milestones: project.milestones ?? [],
      planGrid: project.planGrid ?? [],
      stats: {
        daysLeft,
        milestonePct: project.progress,
        goalsAvg,
        habitAdherence,
        focusHours: Math.round((focusSec / 3600) * 10) / 10,
        tasksDone,
        tasksTotal: tasks.length,
        timeElapsedPct,
      },
    };
  },
});

/**
 * Sprint AI planner: reads the sprint's outcome + linked notes (text/markdown)
 * and asks OpenRouter for a day/week-by-week learning schedule. Stores the plan
 * on the project as `aiPlan`.
 */
export const generateSprintPlan = action({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }): Promise<string> => {
    const data = await ctx.runQuery(api.projects.detail, { id });
    if (!data) throw new Error("Sprint not found.");
    const { project, notes } = data;

    const docText = (project.attachments ?? [])
      .filter((a) => a.text && a.text.trim())
      .map((a) => `### ${a.name}\n${a.text}`)
      .join("\n\n");
    const noteText = notes.map((n) => `### ${n.title}\n${n.content}`).join("\n\n");
    // Large cap — the model has a 1M-token context, so feed whole PDFs/notes.
    const material = [docText, noteText].filter(Boolean).join("\n\n").slice(0, 200000);

    const prompt = [
      `You are planning a ${project.durationDays ?? 30}-day learning sprint titled "${project.title}".`,
      project.outcome ? `Desired outcome: ${project.outcome}` : "",
      "",
      material
        ? `Here is the course material/notes to base the plan on:\n${material}`
        : "No material was attached; build a sensible plan from the title and outcome.",
      "",
      "Produce a concrete schedule broken into weekly phases and daily focus blocks.",
      "Use markdown: '## Week N' headings, then '- [ ] ' task lines that I can act on.",
      "Keep it realistic for the time box. End with 3-5 key milestones.",
    ].join("\n");

    const plan: string = await callOpenRouter([
      { role: "system", content: "You are a sharp, practical learning coach for Bish." },
      { role: "user", content: prompt },
    ]);
    await ctx.runMutation(api.projects.update, { id, aiPlan: plan });
    return plan;
  },
});
