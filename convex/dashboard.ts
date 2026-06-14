import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./helpers";
import { rangeValidator, resolveRange, RangeKey } from "./range";

const DAY = 24 * 60 * 60 * 1000;
const ymd = (ts: number) => new Date(ts).toISOString().slice(0, 10);

/** Aggregates the "today" view: tasks, per-area focus, recent notes, deadlines. */
export const today = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const nowTs = Date.now();

    const [tasks, lifeAreas, notes] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").take(5),
    ]);

    const openTasks = tasks.filter((t) => t.status !== "done");
    const priorityRank = { high: 0, med: 1, low: 2 } as const;
    const topTasks = [...openTasks]
      .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
      .slice(0, 8);

    const upcomingDeadlines = openTasks
      .filter((t) => t.dueDate && t.dueDate <= nowTs + 7 * DAY)
      .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));

    return {
      topTasks,
      lifeAreas,
      recentNotes: notes,
      upcomingDeadlines,
      counts: { openTasks: openTasks.length, lifeAreas: lifeAreas.length },
    };
  },
});

/**
 * Range-driven cross-module analytics for the dashboard cockpit. Every module's
 * key metrics for the selected window in a single reactive query, with a few
 * top items (ids + titles) for deep-linking.
 */
export const overview = query({
  args: { range: rangeValidator, start: v.optional(v.number()), end: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const now = Date.now();
    const { from, to } = resolveRange(args.range as RangeKey, args.start, args.end);
    const inWin = (ts?: number | null) => ts != null && ts >= from && ts < to;

    const [tasks, projects, goals, notes, focus, habits, hcompletions, checkins, areas, momentum, schedule] =
      await Promise.all([
        ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("goals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").collect(),
        ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("dailyCheckIns").withIndex("by_date", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("momentum").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("scheduleBlocks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ]);

    const areaName = (id?: string) => areas.find((a) => a._id === id)?.name ?? "Unassigned";

    // window day-strings (UTC, matches habits/checkins date storage)
    const dayStrs: string[] = [];
    for (let t = from; t < to; t += DAY) dayStrs.push(ymd(t));
    const winDates = new Set(dayStrs);
    const todayStr = ymd(now);

    // ---- Tasks ----
    const openTasks = tasks.filter((t) => t.status !== "done");
    const overdue = openTasks.filter((t) => t.dueDate != null && t.dueDate < now);
    const prank = { high: 0, med: 1, low: 2 } as const;
    const tasksOut = {
      done: tasks.filter((t) => t.status === "done" && inWin(t.completedAt)).length,
      created: tasks.filter((t) => inWin(t._creationTime)).length,
      open: openTasks.length,
      overdue: overdue.length,
      top: [...overdue, ...openTasks]
        .filter((t, i, arr) => arr.findIndex((x) => x._id === t._id) === i)
        .sort((a, b) => prank[a.priority] - prank[b.priority] || (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity))
        .slice(0, 4)
        .map((t) => ({ _id: t._id, title: t.title, priority: t.priority })),
    };

    // ---- Projects ----
    const activeProjects = projects.filter((p) => p.status === "active" || p.status === "planning" || p.status === "blocked");
    const projectsOut = {
      active: projects.filter((p) => p.status === "active").length,
      total: projects.length,
      avgProgress: activeProjects.length
        ? Math.round(activeProjects.reduce((s, p) => s + p.progress, 0) / activeProjects.length)
        : 0,
      top: activeProjects
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 4)
        .map((p) => ({ _id: p._id, title: p.title, progress: p.progress, status: p.status })),
    };

    // ---- Goals ----
    const behind = goals.filter((g) => g.deadline != null && g.deadline < now && g.progress < 100);
    const goalsOut = {
      total: goals.length,
      behind: behind.length,
      avgProgress: goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0,
      top: (behind.length ? behind : goals)
        .sort((a, b) => a.progress - b.progress)
        .slice(0, 4)
        .map((g) => ({ _id: g._id, title: g.title, progress: g.progress })),
    };

    // ---- Notes ----
    const notesOut = {
      created: notes.filter((n) => inWin(n._creationTime)).length,
      total: notes.length,
      recent: notes.slice(0, 4).map((n) => ({ _id: n._id, title: n.title })),
    };

    // ---- Focus ----
    let focusSec = 0;
    const focusByArea = new Map<string, number>();
    for (const s of focus) {
      if (inWin(s.endTime)) {
        focusSec += s.duration;
        if (s.lifeAreaId) focusByArea.set(areaName(s.lifeAreaId), (focusByArea.get(areaName(s.lifeAreaId)) ?? 0) + s.duration);
      }
    }
    const focusOut = {
      hours: Math.round((focusSec / 3600) * 10) / 10,
      byArea: [...focusByArea.entries()]
        .map(([name, sec]) => ({ name, hours: Math.round((sec / 3600) * 10) / 10 }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 4),
    };

    // ---- Habits ----
    const winCompletions = hcompletions.filter((c) => winDates.has(c.date));
    const habitsOut = {
      total: habits.length,
      rate: habits.length && dayStrs.length
        ? Math.round((winCompletions.length / (habits.length * dayStrs.length)) * 100)
        : 0,
      longest: habits.reduce((m, h) => Math.max(m, h.streak), 0),
      atRisk: habits
        .filter((h) => h.streak > 0)
        .filter((h) => !hcompletions.some((c) => c.habitId === h._id && c.date === todayStr))
        .slice(0, 4)
        .map((h) => ({ _id: h._id, title: h.title, streak: h.streak })),
    };

    // ---- Check-in ----
    const winCheckins = checkins.filter((c) => winDates.has(c.date));
    const latest = [...checkins].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
    const checkinOut = {
      days: winCheckins.length,
      avgEnergy: winCheckins.length
        ? Math.round((winCheckins.reduce((s, c) => s + c.energyMood, 0) / winCheckins.length) * 10) / 10
        : null,
      latest: latest ? { date: latest.date, energyMood: latest.energyMood } : null,
    };

    // ---- Momentum ----
    const winMomentum = momentum.filter((m) => inWin(m.createdAt));
    const momentumOut = {
      count: winMomentum.length,
      avgImpact: winMomentum.length
        ? Math.round((winMomentum.reduce((s, m) => s + m.impact, 0) / winMomentum.length) * 10) / 10
        : 0,
      recent: [...winMomentum]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 4)
        .map((m) => ({ title: m.titleSnapshot, type: m.type, impact: m.impact })),
    };

    // ---- Schedule (date-string window) ----
    const winBlocks = schedule.filter((b) => winDates.has(b.date));
    const schedDone = winBlocks.filter((b) => b.status === "done").length;
    const schedMin = winBlocks.reduce((s, b) => s + Math.max(0, b.endMin - b.startMin), 0);
    const scheduleOut = {
      totalBlocks: winBlocks.length,
      done: schedDone,
      adherence: winBlocks.length ? Math.round((schedDone / winBlocks.length) * 100) : 0,
      scheduledHours: Math.round((schedMin / 60) * 10) / 10,
      actualHours: focusOut.hours,
    };

    // ---- Life areas (attention = focus distribution) ----
    const areasOut = {
      count: areas.length,
      attention: focusOut.byArea,
    };

    // ---- Previous-period comparison (same length, immediately before) ----
    const len = to - from;
    const pFrom = from - len;
    const inPrev = (ts?: number | null) => ts != null && ts >= pFrom && ts < from;
    const prevDates = new Set<string>();
    for (let t = pFrom; t < from; t += DAY) prevDates.add(ymd(t));
    const prevDays = prevDates.size || 1;

    const prevFocusSec = focus.reduce((s, x) => (inPrev(x.endTime) ? s + x.duration : s), 0);
    const prevSchedBlocks = schedule.filter((b) => prevDates.has(b.date));
    const prevSchedDone = prevSchedBlocks.filter((b) => b.status === "done").length;
    const prevCheckins = checkins.filter((c) => prevDates.has(c.date));
    const compare = {
      focusHours: Math.round((prevFocusSec / 3600) * 10) / 10,
      tasksDone: tasks.filter((t) => t.status === "done" && inPrev(t.completedAt)).length,
      momentum: momentum.filter((m) => inPrev(m.createdAt)).length,
      notes: notes.filter((n) => inPrev(n._creationTime)).length,
      adherence: prevSchedBlocks.length ? Math.round((prevSchedDone / prevSchedBlocks.length) * 100) : 0,
      avgEnergy: prevCheckins.length
        ? Math.round((prevCheckins.reduce((s, c) => s + c.energyMood, 0) / prevCheckins.length) * 10) / 10
        : null,
      habitRate: habits.length
        ? Math.round((hcompletions.filter((c) => prevDates.has(c.date)).length / (habits.length * prevDays)) * 100)
        : 0,
    };

    // ---- Mood/energy trend (LineChart) ----
    const moodSeries = [...winCheckins]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((c) => ({ label: c.date.slice(5), value: c.energyMood }));

    // ---- Best focus day in window ----
    const focusByDay = new Map<string, number>();
    for (const s of focus) {
      if (inWin(s.endTime)) {
        const d = ymd(s.endTime);
        focusByDay.set(d, (focusByDay.get(d) ?? 0) + s.duration);
      }
    }
    const bestDayEntry = [...focusByDay.entries()].sort((a, b) => b[1] - a[1])[0];
    const bestDay = bestDayEntry
      ? {
          label: new Date(bestDayEntry[0] + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" }),
          hours: Math.round((bestDayEntry[1] / 3600) * 10) / 10,
        }
      : null;

    // ---- Computed smart insights (data-grounded, clickable) ----
    const periodWord = args.range === "today" ? "yesterday" : args.range === "month" ? "last month" : args.range === "week" ? "last week" : "the previous period";
    const plural = (n: number) => (n === 1 ? "" : "s");
    type Insight = { text: string; href: string; tone: "good" | "warn" | "neutral" };
    const insights: Insight[] = [];

    if (focusOut.hours > 0 && compare.focusHours > 0) {
      const pct = Math.round(((focusOut.hours - compare.focusHours) / compare.focusHours) * 100);
      if (Math.abs(pct) >= 1)
        insights.push({ text: `Focus ${pct >= 0 ? "up" : "down"} ${Math.abs(pct)}% vs ${periodWord} (${focusOut.hours}h)`, href: "/focus", tone: pct >= 0 ? "good" : "warn" });
    }
    if (bestDay) insights.push({ text: `Most productive day: ${bestDay.label} (${bestDay.hours}h focus)`, href: "/focus", tone: "neutral" });
    if (focusOut.byArea[0]) insights.push({ text: `${focusOut.byArea[0].name} got the most focus (${focusOut.byArea[0].hours}h)`, href: "/focus", tone: "neutral" });
    if (goalsOut.behind > 0) insights.push({ text: `${goalsOut.behind} goal${plural(goalsOut.behind)} past deadline`, href: "/goals", tone: "warn" });
    if (tasksOut.overdue > 0) insights.push({ text: `${tasksOut.overdue} task${plural(tasksOut.overdue)} overdue`, href: "/tasks", tone: "warn" });
    if (habitsOut.atRisk[0]) insights.push({ text: `"${habitsOut.atRisk[0].title}" streak (${habitsOut.atRisk[0].streak}) at risk today`, href: "/habits", tone: "warn" });
    if (scheduleOut.totalBlocks > 0) insights.push({ text: `${scheduleOut.adherence}% of scheduled blocks completed`, href: "/schedule", tone: scheduleOut.adherence >= 70 ? "good" : "warn" });
    if (momentumOut.count > 0) insights.push({ text: `${momentumOut.count} momentum moment${plural(momentumOut.count)} logged (avg ${momentumOut.avgImpact}/5)`, href: "/momentum", tone: "good" });
    if (checkinOut.avgEnergy != null && compare.avgEnergy != null) {
      const d = Math.round((checkinOut.avgEnergy - compare.avgEnergy) * 10) / 10;
      if (Math.abs(d) >= 0.3) insights.push({ text: `Energy ${d >= 0 ? "up" : "down"} ${Math.abs(d)} pts vs ${periodWord}`, href: "/check-in", tone: d >= 0 ? "good" : "warn" });
    }

    return {
      range: args.range,
      tasks: tasksOut,
      projects: projectsOut,
      goals: goalsOut,
      notes: notesOut,
      focus: focusOut,
      habits: habitsOut,
      checkin: checkinOut,
      momentum: momentumOut,
      schedule: scheduleOut,
      areas: areasOut,
      compare,
      moodSeries,
      bestDay,
      insights,
    };
  },
});
