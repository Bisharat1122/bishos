import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { requireUser } from "./helpers";
import { callOpenRouter } from "./openrouter";

const DAY = 24 * 60 * 60 * 1000;
const ymd = (ts: number) => new Date(ts).toISOString().slice(0, 10);

function weekBounds(now: number, offset = 0) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + offset * 7);
  const start = d.getTime();
  return { start, end: start + 7 * DAY };
}

/** Assemble a week (sections A–G) live from the database. offset 0=this week, -1=last. */
export const summary = query({
  args: { weekOffset: v.optional(v.number()) },
  handler: async (ctx, { weekOffset }) => {
    const userId = await requireUser(ctx);
    const { start, end } = weekBounds(Date.now(), weekOffset ?? 0);

    const [tasks, goals, projects, habits, hcompletions, focus, notes, checkins, areas, schedule] =
      await Promise.all([
        ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("goals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("dailyCheckIns").withIndex("by_date", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("scheduleBlocks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ]);

    const areaName = (id?: string) => areas.find((a) => a._id === id)?.name ?? "—";

    // A — tasks completed by area
    const completed = tasks.filter(
      (t) => t.status === "done" && t.completedAt != null && t.completedAt >= start && t.completedAt < end,
    );
    const tasksByArea: Record<string, number> = {};
    for (const t of completed) {
      const k = areaName(t.lifeAreaId);
      tasksByArea[k] = (tasksByArea[k] ?? 0) + 1;
    }

    // B — goals
    const goalsOut = goals.map((g) => ({
      title: g.title,
      progress: g.progress,
      done: g.milestones.filter((m) => m.done).length,
      total: g.milestones.length,
    }));

    // C — projects
    const projectsOut = projects.map((p) => ({
      title: p.title,
      status: p.status,
      progress: p.progress,
      kind: p.kind ?? "standard",
    }));

    // D — focus
    let focusTotal = 0;
    const focusByArea = new Map<string, number>();
    for (const s of focus) {
      if (s.endTime >= start && s.endTime < end) {
        focusTotal += s.duration;
        if (s.lifeAreaId) focusByArea.set(s.lifeAreaId, (focusByArea.get(s.lifeAreaId) ?? 0) + s.duration);
      }
    }
    const focusOut = {
      totalSeconds: focusTotal,
      byArea: [...focusByArea.entries()]
        .map(([id, seconds]) => ({ name: areaName(id), seconds }))
        .sort((a, b) => b.seconds - a.seconds),
    };

    // E — habits
    const weekDates = new Set(Array.from({ length: 7 }, (_, i) => ymd(start + i * DAY)));
    const compByHabit = new Map<string, number>();
    for (const c of hcompletions) {
      if (weekDates.has(c.date)) compByHabit.set(c.habitId, (compByHabit.get(c.habitId) ?? 0) + 1);
    }
    const habitsOut = habits.map((h) => ({
      title: h.title,
      streak: h.streak,
      thisWeek: compByHabit.get(h._id) ?? 0,
    }));

    // F — notes & learning
    const newNotes = notes.filter((n) => n._creationTime >= start && n._creationTime < end);
    const notesOut = { count: newNotes.length, titles: newNotes.slice(0, 6).map((n) => n.title) };

    // F2 — schedule adherence + planned vs actual hours (this week)
    const weekBlocks = schedule.filter((b) => weekDates.has(b.date));
    const schedDone = weekBlocks.filter((b) => b.status === "done").length;
    let schedMin = 0;
    const schedByArea = new Map<string, number>();
    for (const b of weekBlocks) {
      const dur = Math.max(0, b.endMin - b.startMin);
      schedMin += dur;
      const k = areaName(b.lifeAreaId);
      schedByArea.set(k, (schedByArea.get(k) ?? 0) + dur);
    }
    const scheduleOut = {
      totalBlocks: weekBlocks.length,
      done: schedDone,
      adherence: weekBlocks.length ? Math.round((schedDone / weekBlocks.length) * 100) : 0,
      scheduledHours: Math.round((schedMin / 60) * 10) / 10,
      actualHours: Math.round((focusTotal / 3600) * 10) / 10,
      byArea: [...schedByArea.entries()]
        .map(([name, min]) => ({ name, hours: Math.round((min / 60) * 10) / 10 }))
        .sort((a, b) => b.hours - a.hours),
    };

    // G — energy & mood
    const weekCheckins = checkins.filter((c) => weekDates.has(c.date));
    const moodValues = weekCheckins.map((c) => ({ date: c.date, energyMood: c.energyMood }));
    const moodAvg = moodValues.length
      ? Math.round((moodValues.reduce((s, m) => s + m.energyMood, 0) / moodValues.length) * 10) / 10
      : null;

    const saved = await ctx.db
      .query("weeklyReviews")
      .withIndex("by_weekStart", (q) => q.eq("userId", userId).eq("weekStart", ymd(start)))
      .first();

    return {
      weekStart: ymd(start),
      weekEnd: ymd(end - DAY),
      tasksCompleted: { total: completed.length, byArea: tasksByArea },
      goals: goalsOut,
      projects: projectsOut,
      focus: focusOut,
      schedule: scheduleOut,
      habits: habitsOut,
      notes: notesOut,
      mood: { avg: moodAvg, values: moodValues },
      saved,
    };
  },
});

/** Upsert this week's review doc (content snapshot and/or user notes). */
export const save = mutation({
  args: {
    weekStart: v.string(),
    weekEnd: v.string(),
    content: v.optional(v.any()),
    userNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("weeklyReviews")
      .withIndex("by_weekStart", (q) => q.eq("userId", userId).eq("weekStart", args.weekStart))
      .first();
    const patch: Record<string, unknown> = {};
    if (args.content !== undefined) patch.content = args.content;
    if (args.userNotes !== undefined) patch.userNotes = args.userNotes;
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return ctx.db.insert("weeklyReviews", {
      userId,
      weekStart: args.weekStart,
      weekEnd: args.weekEnd,
      content: args.content ?? {},
      userNotes: args.userNotes,
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const all = await ctx.db
      .query("weeklyReviews")
      .withIndex("by_weekStart", (q) => q.eq("userId", userId))
      .collect();
    return all.reverse();
  },
});

/** Section H — AI insights + next-week plan, generated from the week's data. */
export const generate = action({
  args: { weekOffset: v.optional(v.number()) },
  handler: async (ctx, { weekOffset }): Promise<string> => {
    const s = await ctx.runQuery(api.reviews.summary, { weekOffset: weekOffset ?? 0 });
    const h = (sec: number) => (sec / 3600).toFixed(1);

    const facts = [
      `Week ${s.weekStart} → ${s.weekEnd}.`,
      `Tasks completed: ${s.tasksCompleted.total} (${Object.entries(s.tasksCompleted.byArea).map(([a, n]) => `${a}: ${n}`).join(", ") || "none"}).`,
      `Focus: ${h(s.focus.totalSeconds)}h total — ${s.focus.byArea.map((a) => `${a.name} ${h(a.seconds)}h`).join(", ") || "none"}.`,
      `Schedule: ${s.schedule.scheduledHours}h planned across ${s.schedule.totalBlocks} blocks, ${s.schedule.adherence}% completed (${s.schedule.done}/${s.schedule.totalBlocks}); actually focused ${s.schedule.actualHours}h.`,
      `Goals: ${s.goals.map((g) => `${g.title} ${g.progress}%`).join("; ") || "none"}.`,
      `Projects: ${s.projects.map((p) => `${p.title} (${p.status})`).join("; ") || "none"}.`,
      `Habits: ${s.habits.map((hh) => `${hh.title} ${hh.thisWeek}x (streak ${hh.streak})`).join("; ") || "none"}.`,
      `Notes added: ${s.notes.count} (${s.notes.titles.join(", ")}).`,
      `Energy/mood avg: ${s.mood.avg ?? "n/a"}/10 over ${s.mood.values.length} check-ins.`,
    ].join("\n");

    const insights: string = await callOpenRouter([
      { role: "system", content: "You are Bish's weekly reflection coach. Be direct, specific, and practical. Use markdown." },
      {
        role: "user",
        content:
          `Here is my week's data:\n${facts}\n\n` +
          "Write a weekly review with these markdown sections: '## What went well', '## What to improve', '## Start / Stop / Continue', '## Plan for next week' (3-5 concrete, scheduled actions). Reference my actual numbers.",
      },
    ]);

    await ctx.runMutation(api.reviews.save, {
      weekStart: s.weekStart,
      weekEnd: s.weekEnd,
      content: {
        tasksCompleted: s.tasksCompleted,
        goals: s.goals,
        projects: s.projects,
        focus: s.focus,
        habits: s.habits,
        notes: s.notes,
        mood: s.mood,
        aiInsights: insights,
      },
    });
    return insights;
  },
});
