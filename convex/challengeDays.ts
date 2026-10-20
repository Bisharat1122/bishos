import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";
import { refreshStreak } from "./habits";
import { awardXp, revokeXp, XP } from "./os";
import { syncTaskXp, revokeTaskXp } from "./tasks";

const ymd = (ts: number) => new Date(ts).toISOString().slice(0, 10);

/** Days for the side panel (newest first). */
export const list = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, { challengeId }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(challengeId);
    if (!c || c.userId !== userId) return [];
    return (
      await ctx.db.query("challengeDays").withIndex("by_challenge", (q) => q.eq("challengeId", challengeId)).collect()
    ).sort((a, b) => b.order - a.order);
  },
});

export const create = mutation({
  args: { challengeId: v.id("challenges"), name: v.optional(v.string()), date: v.optional(v.string()) },
  handler: async (ctx, { challengeId, name, date }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(challengeId);
    if (!c || c.userId !== userId) throw new Error("Challenge not found");
    const existing = await ctx.db.query("challengeDays").withIndex("by_challenge", (q) => q.eq("challengeId", challengeId)).collect();
    const today = ymd(Date.now());
    return ctx.db.insert("challengeDays", {
      userId,
      challengeId,
      name: name?.trim() || `Day ${existing.length + 1}`,
      date: date ?? today,
      order: existing.length,
    });
  },
});

export const rename = mutation({
  args: { id: v.id("challengeDays"), name: v.optional(v.string()), date: v.optional(v.string()), note: v.optional(v.string()) },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const d = await ctx.db.get(id);
    if (!d || d.userId !== userId) return;
    await ctx.db.patch(id, rest);
  },
});

/**
 * Detailed per-day table for the challenge home "Days" tab — every day as a
 * row with all its key metrics, plus a dynamic column per KPI definition.
 */
export const daysTable = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, { challengeId }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(challengeId);
    if (!c || c.userId !== userId) return null;

    const [days, tasks, sessions, habits, completions, kpiDefs, kpiValues, sections] = await Promise.all([
      ctx.db.query("challengeDays").withIndex("by_challenge", (q) => q.eq("challengeId", challengeId)).collect(),
      ctx.db.query("tasks").withIndex("by_challenge", (q) => q.eq("challengeId", challengeId)).collect(),
      ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("habits").withIndex("by_challenge", (q) => q.eq("challengeId", challengeId)).collect(),
      ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("challengeKpiDefs").withIndex("by_challenge", (q) => q.eq("challengeId", challengeId)).collect(),
      ctx.db.query("challengeKpiValues").withIndex("by_challenge", (q) => q.eq("challengeId", challengeId)).collect(),
      ctx.db.query("challengeSections").withIndex("by_challenge", (q) => q.eq("challengeId", challengeId)).collect(),
    ]);

    const focusByTask = new Map<string, number>();
    for (const s of sessions) if (s.taskId) focusByTask.set(s.taskId as string, (focusByTask.get(s.taskId as string) ?? 0) + s.duration);

    const challengeHabitIds = new Set(habits.map((h) => h._id as string));
    const doneByDate = new Map<string, Set<string>>();
    for (const cmp of completions) {
      if (!challengeHabitIds.has(cmp.habitId as string)) continue;
      if (!doneByDate.has(cmp.date)) doneByDate.set(cmp.date, new Set());
      doneByDate.get(cmp.date)!.add(cmp.habitId as string);
    }

    // KPI columns ordered by section order, then KPI order.
    const sectionOrder = new Map(sections.map((s) => [s._id as string, s.order]));
    const sectionName = (idv: string) => sections.find((s) => s._id === idv)?.name ?? "";
    const kpiCols = [...kpiDefs]
      .sort((a, b) => (sectionOrder.get(a.sectionId as string) ?? 0) - (sectionOrder.get(b.sectionId as string) ?? 0) || a.order - b.order)
      .map((k) => ({ _id: k._id, name: k.name, section: sectionName(k.sectionId as string), type: k.type, unit: k.unit, target: k.target }));

    const valsByDay = new Map<string, Map<string, { num?: number; bool?: boolean; text?: string }>>();
    for (const v of kpiValues) {
      if (!valsByDay.has(v.dayId as string)) valsByDay.set(v.dayId as string, new Map());
      valsByDay.get(v.dayId as string)!.set(v.kpiDefId as string, { num: v.num, bool: v.bool, text: v.text });
    }

    const habitCols = [...habits].sort((a, b) => a.title.localeCompare(b.title)).map((h) => ({ _id: h._id, title: h.title }));

    const rows = days
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => {
        const dayTasks = tasks.filter((t) => t.challengeDayId === d._id);
        const focusSeconds = dayTasks.reduce((sum, t) => sum + (focusByTask.get(t._id as string) ?? 0), 0);
        const doneSet = doneByDate.get(d.date) ?? new Set<string>();
        const kmap = valsByDay.get(d._id as string) ?? new Map();
        const kpi: Record<string, { num?: number; bool?: boolean; text?: string }> = {};
        for (const col of kpiCols) kpi[col._id] = kmap.get(col._id as string) ?? {};
        const habitDone: Record<string, boolean> = {};
        for (const col of habitCols) habitDone[col._id] = doneSet.has(col._id as string);
        return {
          _id: d._id,
          name: d.name,
          date: d.date,
          focusSeconds,
          tasksDone: dayTasks.filter((t) => t.status === "done").length,
          tasksTotal: dayTasks.length,
          habitsDone: doneSet.size,
          habitsTotal: habits.length,
          habitDone,
          energy: d.journal?.energy ?? null,
          sleep: d.health?.sleepDuration ?? null,
          wakeUp: d.health?.timeAwake ?? null,
          bedtime: d.health?.timeInBed ?? null,
          cheatMeal: d.health?.cheatMeal ?? false,
          kpi,
        };
      });

    return { kpiCols, habitCols, rows };
  },
});

/** Save the day's health-tracker fields. */
export const setHealth = mutation({
  args: {
    dayId: v.id("challengeDays"),
    sleepDuration: v.optional(v.number()),
    timeAwake: v.optional(v.string()),
    timeInBed: v.optional(v.string()),
    deepRest: v.optional(v.number()),
    perceivedEnergy: v.optional(v.number()),
    cheatMeal: v.optional(v.boolean()),
  },
  handler: async (ctx, { dayId, ...health }) => {
    const userId = await requireUser(ctx);
    const d = await ctx.db.get(dayId);
    if (!d || d.userId !== userId) return;
    await ctx.db.patch(dayId, { health: { ...d.health, ...health } });
  },
});

/** Health tracker for the whole challenge: rows + averages + sleep series. */
export const health = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, { challengeId }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(challengeId);
    if (!c || c.userId !== userId) return null;
    const days = (
      await ctx.db.query("challengeDays").withIndex("by_challenge", (q) => q.eq("challengeId", challengeId)).collect()
    ).sort((a, b) => a.date.localeCompare(b.date));

    const rows = days.map((d) => ({ _id: d._id, name: d.name, date: d.date, health: d.health ?? {} }));

    const mean = (nums: number[]) => (nums.length ? Math.round((nums.reduce((a, n) => a + n, 0) / nums.length) * 100) / 100 : null);
    const isWeekday = (ymd: string) => { const wd = new Date(ymd + "T00:00:00").getDay(); return wd >= 1 && wd <= 5; };

    const sleeps = rows.map((r) => r.health.sleepDuration).filter((n): n is number => n != null);
    const restMF = rows.filter((r) => isWeekday(r.date)).map((r) => r.health.deepRest).filter((n): n is number => n != null);
    const energies = rows.map((r) => r.health.perceivedEnergy).filter((n): n is number => n != null);

    const sleepSeries = rows.filter((r) => r.health.sleepDuration != null).map((r) => ({ date: r.date, value: r.health.sleepDuration as number }));

    return {
      rows,
      averages: {
        sleep: mean(sleeps),
        restMF: mean(restMF),
        energy: energies.length ? Math.round(energies.reduce((a, n) => a + n, 0) / energies.length) : null,
      },
      sleepSeries,
    };
  },
});

/** Save the day's end-of-day journal (Overview tab). */
export const setJournal = mutation({
  args: {
    dayId: v.id("challengeDays"),
    good: v.optional(v.string()),
    bad: v.optional(v.string()),
    improve: v.optional(v.string()),
    lessons: v.optional(v.string()),
    energy: v.optional(v.number()),
  },
  handler: async (ctx, { dayId, ...journal }) => {
    const userId = await requireUser(ctx);
    const d = await ctx.db.get(dayId);
    if (!d || d.userId !== userId) return;
    await ctx.db.patch(dayId, { journal: { ...d.journal, ...journal } });
  },
});

export const remove = mutation({
  args: { id: v.id("challengeDays") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const d = await ctx.db.get(id);
    if (!d || d.userId !== userId) return;
    for (const kv of await ctx.db.query("challengeKpiValues").withIndex("by_day", (q) => q.eq("dayId", id)).collect()) await ctx.db.delete(kv._id);
    for (const dh of await ctx.db.query("challengeDayHabits").withIndex("by_day", (q) => q.eq("dayId", id)).collect()) await ctx.db.delete(dh._id);
    // Detach this day's tasks (keep the tasks themselves).
    const tasks = await ctx.db.query("tasks").withIndex("by_challengeDay", (q) => q.eq("challengeDayId", id)).collect();
    for (const t of tasks) await ctx.db.patch(t._id, { challengeDayId: undefined });
    await ctx.db.delete(id);
  },
});

/** Full payload for one day: tasks per section, KPI values, habit checks, overview. */
export const dayData = query({
  args: { dayId: v.id("challengeDays") },
  handler: async (ctx, { dayId }) => {
    const userId = await requireUser(ctx);
    const day = await ctx.db.get(dayId);
    if (!day || day.userId !== userId) return null;

    const [tasks, kpiValues, completions, habits] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_challengeDay", (q) => q.eq("challengeDayId", dayId)).collect(),
      ctx.db.query("challengeKpiValues").withIndex("by_day", (q) => q.eq("dayId", dayId)).collect(),
      // Habit "done" reads from the GLOBAL completions for this day's date, so
      // it stays in sync with the main Habits module.
      ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId).eq("date", day.date)).collect(),
      ctx.db.query("habits").withIndex("by_challenge", (q) => q.eq("challengeId", day.challengeId)).collect(),
    ]);

    // Focus seconds per task — read only this day's tasks' sessions (by_task)
    // instead of every session the user ever logged.
    const focusByTask = new Map<string, number>();
    const perTask = await Promise.all(
      tasks.map((t) => ctx.db.query("focusSessions").withIndex("by_task", (q) => q.eq("taskId", t._id)).collect()),
    );
    perTask.forEach((rows, i) => {
      const secs = rows.filter((r) => r.userId === userId).reduce((sum, r) => sum + r.duration, 0);
      focusByTask.set(tasks[i]._id as string, secs);
    });

    const focusBySection = new Map<string, number>();
    let focusTotal = 0;
    const taskRows = tasks.map((t) => {
      const secs = focusByTask.get(t._id as string) ?? 0;
      focusTotal += secs;
      if (t.challengeSectionId) focusBySection.set(t.challengeSectionId as string, (focusBySection.get(t.challengeSectionId as string) ?? 0) + secs);
      return {
        _id: t._id,
        title: t.title,
        status: t.status,
        sectionId: t.challengeSectionId,
        focusSeconds: secs,
        lifeAreaId: t.lifeAreaId,
      };
    });

    const habitDone = new Map(completions.map((c) => [c.habitId as string, true]));

    return {
      day,
      tasks: taskRows,
      kpiValues: kpiValues.map((k) => ({ kpiDefId: k.kpiDefId, sectionId: k.sectionId, num: k.num, bool: k.bool, text: k.text })),
      habits: habits.map((h) => ({ _id: h._id, title: h.title, done: habitDone.get(h._id as string) ?? false })),
      overview: {
        focusTotal,
        focusBySection: Array.from(focusBySection.entries()).map(([sectionId, secs]) => ({ sectionId, seconds: secs })),
        tasksDone: taskRows.filter((t) => t.status === "done").length,
        tasksTotal: taskRows.length,
        habitsDone: habits.filter((h) => habitDone.get(h._id as string)).length,
        habitsTotal: habits.length,
      },
    };
  },
});

// ---- Tasks (real global tasks tagged to day+section) ----
export const addTask = mutation({
  args: { dayId: v.id("challengeDays"), sectionId: v.id("challengeSections"), title: v.string() },
  handler: async (ctx, { dayId, sectionId, title }) => {
    const userId = await requireUser(ctx);
    const day = await ctx.db.get(dayId);
    if (!day || day.userId !== userId) throw new Error("Day not found");
    const challenge = await ctx.db.get(day.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    // Global tasks require a life area — use the challenge's primary, else the first.
    let areaId = challenge.primaryLifeAreaId;
    if (!areaId) {
      const first = await ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).first();
      areaId = first?._id;
    }
    if (!areaId) throw new Error("Create a Life Area first — tasks need one.");
    return ctx.db.insert("tasks", {
      userId,
      title,
      status: "not_started",
      priority: "med",
      lifeAreaId: areaId,
      challengeId: day.challengeId,
      challengeSectionId: sectionId,
      challengeDayId: dayId,
      order: Date.now(),
    });
  },
});

export const toggleTask = mutation({
  // `date` = client-local today (XP + Top-3 bonus), same path as tasks.setStatus.
  args: { taskId: v.id("tasks"), date: v.optional(v.string()) },
  handler: async (ctx, { taskId, date }) => {
    const userId = await requireUser(ctx);
    const t = await ctx.db.get(taskId);
    if (!t || t.userId !== userId) return;
    const done = t.status === "done";
    await ctx.db.patch(taskId, {
      status: done ? "not_started" : "done",
      completedAt: done ? undefined : Date.now(),
    });
    await syncTaskXp(ctx, userId, taskId, !done, date);
  },
});

export const removeTask = mutation({
  args: { taskId: v.id("tasks"), date: v.optional(v.string()) },
  handler: async (ctx, { taskId, date }) => {
    const userId = await requireUser(ctx);
    const t = await ctx.db.get(taskId);
    if (!t || t.userId !== userId) return;
    if (t.status === "done") await revokeTaskXp(ctx, userId, taskId, date);
    await ctx.db.delete(taskId);
  },
});

// ---- KPI matrix values (per day, per KPI def) ----
export const setKpiValue = mutation({
  args: {
    dayId: v.id("challengeDays"),
    kpiDefId: v.id("challengeKpiDefs"),
    num: v.optional(v.number()),
    bool: v.optional(v.boolean()),
    text: v.optional(v.string()),
  },
  handler: async (ctx, { dayId, kpiDefId, num, bool, text }) => {
    const userId = await requireUser(ctx);
    const day = await ctx.db.get(dayId);
    if (!day || day.userId !== userId) return;
    const def = await ctx.db.get(kpiDefId);
    if (!def || def.userId !== userId || def.challengeId !== day.challengeId) return;
    const existing = await ctx.db
      .query("challengeKpiValues")
      .withIndex("by_day", (q) => q.eq("dayId", dayId))
      .collect();
    const row = existing.find((r) => r.kpiDefId === kpiDefId);
    const fields = { num, bool, text };
    if (row) await ctx.db.patch(row._id, fields);
    else
      await ctx.db.insert("challengeKpiValues", {
        userId,
        challengeId: day.challengeId,
        dayId,
        sectionId: def.sectionId,
        kpiDefId,
        ...fields,
      });
  },
});

/**
 * Tick/untick a habit for this day — writes to the GLOBAL habitCompletions
 * for the day's date and refreshes the habit's streak, so the main Habits
 * module (streaks, heatmap) stays in sync.
 */
export const toggleHabit = mutation({
  args: { dayId: v.id("challengeDays"), habitId: v.id("habits") },
  handler: async (ctx, { dayId, habitId }) => {
    const userId = await requireUser(ctx);
    const day = await ctx.db.get(dayId);
    if (!day || day.userId !== userId) return;
    const habit = await ctx.db.get(habitId);
    if (!habit || habit.userId !== userId) return;

    const existing = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", habitId))
      .filter((q) => q.eq(q.field("date"), day.date))
      .first();
    const xpKey = `habit-${habitId}-${day.date}`;
    if (existing) {
      await ctx.db.delete(existing._id);
      await revokeXp(ctx, userId, xpKey);
    } else {
      await ctx.db.insert("habitCompletions", { userId, habitId, date: day.date });
      await awardXp(ctx, userId, xpKey, XP.habit, "Habit", day.date);
    }

    await refreshStreak(ctx, habitId);
  },
});
