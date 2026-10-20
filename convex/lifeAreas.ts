import { ConvexError, v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, mondayOf, monthKey } from "./os";
import { computeHours } from "./weekPlans";
import { habitStats, habitStatusOf, recordMap } from "./habits";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return ctx.db
      .query("lifeAreas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: { name: v.string(), icon: v.optional(v.string()), color: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("lifeAreas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return ctx.db.insert("lifeAreas", {
      userId,
      name: args.name,
      icon: args.icon,
      color: args.color,
      order: existing.length,
    });
  },
});

export const rename = mutation({
  args: { id: v.id("lifeAreas"), name: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const area = await ctx.db.get(args.id);
    if (!area || area.userId !== userId) return;
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const update = mutation({
  args: {
    id: v.id("lifeAreas"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    standard: v.optional(v.string()),
    weeklyHoursTarget: v.optional(v.union(v.number(), v.null())),
    kind: v.optional(v.union(v.literal("business"), v.literal("personal"))),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, weeklyHoursTarget, ...rest }) => {
    const userId = await requireUser(ctx);
    const area = await ctx.db.get(id);
    if (!area || area.userId !== userId) return;
    const patch: Record<string, unknown> = { ...rest };
    if (weeklyHoursTarget !== undefined) patch.weeklyHoursTarget = weeklyHoursTarget ?? undefined;
    await ctx.db.patch(id, patch);
  },
});

/** Hours spent per area in a time window (focus sessions + done blocks without a session). */
export const hours = query({
  args: { from: v.number(), to: v.number(), fromDate: v.string(), toDate: v.string() },
  handler: async (ctx, { from, to, fromDate, toDate }) => {
    const userId = await requireUser(ctx);
    const [focus, blocks] = await Promise.all([
      ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db
        .query("scheduleBlocks")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", fromDate).lte("date", toDate))
        .collect(),
    ]);
    const out: Record<string, number> = {};
    for (const f of focus) {
      if (f.endTime >= from && f.endTime < to && f.lifeAreaId) out[f.lifeAreaId] = (out[f.lifeAreaId] ?? 0) + f.duration / 3600;
    }
    for (const b of blocks) {
      if (b.status === "done" && !b.focusSessionId && b.lifeAreaId)
        out[b.lifeAreaId] = (out[b.lifeAreaId] ?? 0) + Math.max(0, b.endMin - b.startMin) / 60;
    }
    return out;
  },
});

export const get = query({
  args: { id: v.id("lifeAreas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const area = await ctx.db.get(id);
    if (!area || area.userId !== userId) return null;
    return area;
  },
});

/** Area page payload: the area, its sections (with counts), and everything in it. */
export const overview = query({
  args: { id: v.id("lifeAreas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const area = await ctx.db.get(id);
    if (!area || area.userId !== userId) return null;

    const [sections, tasks, projects, goals, notes] = await Promise.all([
      ctx.db.query("sections").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id)).collect(),
      ctx.db.query("tasks").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id)).collect(),
      ctx.db.query("projects").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id)).collect(),
      ctx.db.query("goals").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id)).collect(),
      ctx.db.query("notes").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id)).collect(),
    ]);

    const sectionsWithCounts = sections.map((s) => ({
      ...s,
      taskCount: tasks.filter((t) => t.sectionId === s._id).length,
      noteCount: notes.filter((n) => n.sectionId === s._id).length,
      goalCount: goals.filter((g) => g.sectionId === s._id).length,
    }));

    return { area, sections: sectionsWithCounts, tasks, projects, goals, notes };
  },
});

/**
 * The Area hub — everything that lives in one Life Area, Life-OS style:
 * standard, this month's rating (+ history), hours this week vs target,
 * 12-week + annual goals, projects with next-action status, habits with
 * consistency, learning areas → content pillars, challenges, open tasks,
 * notes and recent wins. `today` = local day, `tz` = getTimezoneOffset().
 */
export const hub = query({
  args: { id: v.id("lifeAreas"), today: v.string(), tz: v.optional(v.number()) },
  handler: async (ctx, { id, today, tz = 0 }) => {
    const userId = await requireUser(ctx);
    const area = await ctx.db.get(id);
    if (!area || area.userId !== userId) return null;
    const weekStart = mondayOf(today);
    const period = monthKey(today);

    const [sections, tasks, projects, goals, notes, habits, ratings, learning, pillars, challenges, momentum, hours] =
      await Promise.all([
        ctx.db.query("sections").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id)).collect(),
        ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("projects").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id)).collect(),
        ctx.db.query("goals").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id)).collect(),
        ctx.db.query("notes").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id)).collect(),
        ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("areaRatings").withIndex("by_area", (q) => q.eq("lifeAreaId", id)).collect(),
        ctx.db.query("learningAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("contentPillars").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("challenges").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("momentum").withIndex("by_user_created", (q) => q.eq("userId", userId)).order("desc").take(300),
        computeHours(ctx, userId, weekStart, addDays(weekStart, 6), tz),
      ]);

    // ── Tasks in this area ───────────────────────────────────────────────
    const areaTasks = tasks.filter((t) => t.lifeAreaId === id);
    const open = areaTasks.filter((t) => t.status !== "done");
    const PR = { high: 0, med: 1, low: 2 } as const;
    const liteTask = (t: Doc<"tasks">) => ({
      _id: t._id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      plannedFor: t.plannedFor ?? null,
      someday: !!t.someday,
      dueDate: t.dueDate ?? null,
      estimateMin: t.estimateMin ?? null,
      projectId: t.projectId ?? null,
    });
    const openSorted = [...open]
      .filter((t) => !t.someday)
      .sort(
        (a, b) =>
          (a.plannedFor ?? "9999").localeCompare(b.plannedFor ?? "9999") ||
          (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity) ||
          PR[a.priority] - PR[b.priority],
      );

    // ── Projects + next action ───────────────────────────────────────────
    const projectRows = projects
      .filter((p) => p.userId === userId)
      .map((p) => {
        const pOpen = tasks.filter((t) => t.projectId === p._id && t.status !== "done");
        const next =
          [...pOpen].sort(
            (a, b) =>
              Number(b.status === "in_progress") - Number(a.status === "in_progress") ||
              (a.plannedFor ?? "9999").localeCompare(b.plannedFor ?? "9999") ||
              PR[a.priority] - PR[b.priority],
          )[0] ?? null;
        return {
          _id: p._id,
          title: p.title,
          status: p.status,
          kind: p.kind ?? "standard",
          progress: p.progress,
          goalId: p.goalId ?? null,
          openCount: pOpen.length,
          nextAction: next ? { _id: next._id, title: next.title, plannedFor: next.plannedFor ?? null } : null,
        };
      })
      .sort((a, b) => {
        const rank = { active: 0, blocked: 1, planning: 2, completed: 3 } as const;
        return rank[a.status] - rank[b.status] || a.title.localeCompare(b.title);
      });

    // ── Goals ────────────────────────────────────────────────────────────
    const goalRow = (g: Doc<"goals">) => ({
      _id: g._id,
      title: g.title,
      level: g.level ?? null,
      goalStatus: g.goalStatus ?? null,
      progress: g.progress,
      deadline: g.deadline ?? null,
      projects: projectRows.filter((p) => p.goalId === g._id).length,
    });
    const mineGoals = goals.filter((g) => g.userId === userId && g.goalStatus !== "dropped");
    const cycleGoals = mineGoals.filter((g) => g.level === "cycle" && (g.goalStatus ?? "active") !== "achieved").map(goalRow);
    const annualGoals = mineGoals.filter((g) => g.level === "annual" && (g.goalStatus ?? "active") !== "achieved").map(goalRow);
    const achievedGoals = mineGoals.filter((g) => g.goalStatus === "achieved").map(goalRow);
    const otherGoals = mineGoals.filter((g) => !g.level && g.goalStatus !== "achieved").map(goalRow);

    // ── Habits (consistency first, streak second) ───────────────────────
    const areaHabits = habits.filter(
      (h) => h.lifeAreaId === id && (habitStatusOf(h) === "active" || habitStatusOf(h) === "queued"),
    );
    const habitRows = await Promise.all(
      areaHabits.map(async (h) => {
        const comps = await ctx.db.query("habitCompletions").withIndex("by_habit", (q) => q.eq("habitId", h._id)).collect();
        const s = habitStats(h, recordMap(comps), today);
        return {
          _id: h._id,
          title: h.title,
          status: habitStatusOf(h),
          consistency: s.consistency,
          streak: s.streak,
          doneToday: !!s.kindToday && s.kindToday !== "skip",
          goalId: h.goalId ?? null,
        };
      }),
    );

    // ── Rating (Wheel of Life) ───────────────────────────────────────────
    const mineRatings = ratings.filter((r) => r.userId === userId).sort((a, b) => b.period.localeCompare(a.period));
    const current = mineRatings.find((r) => r.period === period) ?? null;
    const latest = mineRatings[0] ?? null;
    const history = Array.from({ length: 6 }, (_, i) => {
      const [y, m] = period.split("-").map(Number);
      const d = new Date(Date.UTC(y, m - 1 - (5 - i), 1));
      const p = d.toISOString().slice(0, 7);
      return { period: p, rating: mineRatings.find((r) => r.period === p)?.rating ?? null };
    });

    // ── Learning areas → pillars, challenges ────────────────────────────
    const learningRows = learning
      .filter((l) => l.lifeAreaId === id)
      .map((l) => ({
        _id: l._id,
        name: l.name,
        status: l.status,
        weeklyMinutesTarget: l.weeklyMinutesTarget ?? null,
        pillar: l.pillarId ? (pillars.find((p) => p._id === l.pillarId)?.name ?? null) : null,
      }));
    const pillarRows = pillars
      .filter((p) => p.learningAreaId && learningRows.some((l) => l._id === p.learningAreaId))
      .map((p) => ({ _id: p._id, name: p.name, brand: p.brand }));
    const challengeRows = challenges
      .filter((c) => c.primaryLifeAreaId === id && c.status === "active")
      .map((c) => ({ _id: c._id, name: c.name, icon: c.icon ?? null }));

    // ── Recent wins in this area ─────────────────────────────────────────
    const goalIds = new Set<string>(goals.map((g) => g._id));
    const projectIds = new Set<string>(projects.map((p) => p._id));
    const taskIds = new Set<string>(areaTasks.map((t) => t._id));
    const habitIds = new Set<string>(areaHabits.map((h) => h._id));
    const sectionIds = new Set<string>(sections.map((s) => s._id));
    const inArea = (m: Doc<"momentum">) =>
      m.lifeAreaId === id ||
      (m.type === "lifeArea" && m.itemId === id) ||
      (m.type === "goal" && goalIds.has(m.itemId)) ||
      (m.type === "project" && projectIds.has(m.itemId)) ||
      (m.type === "task" && taskIds.has(m.itemId)) ||
      (m.type === "habit" && habitIds.has(m.itemId)) ||
      (m.type === "section" && sectionIds.has(m.itemId));
    const weekStartMs = Date.parse(`${weekStart}T00:00:00Z`) + tz * 60_000;
    const monthAgo = Date.parse(`${addDays(today, -30)}T00:00:00Z`) + tz * 60_000;
    const loggedWins = momentum
      .filter((m) => inArea(m) && m.createdAt >= monthAgo)
      .slice(0, 6)
      .map((m) => ({ _id: m._id, title: m.titleSnapshot, impact: m.impact, at: m.createdAt, why: m.why ?? null }));
    const doneThisWeek = areaTasks.filter((t) => t.status === "done" && (t.completedAt ?? 0) >= weekStartMs);

    const hRow = hours.rows.find((r) => r.areaId === id);
    return {
      area,
      sections: sections.map((s) => ({
        ...s,
        taskCount: areaTasks.filter((t) => t.sectionId === s._id).length,
        noteCount: notes.filter((n) => n.sectionId === s._id).length,
        goalCount: goals.filter((g) => g.sectionId === s._id).length,
      })),
      rating: {
        period,
        current: current ? { rating: current.rating, note: current.note ?? null } : null,
        latest: latest ? { period: latest.period, rating: latest.rating } : null,
        history,
      },
      hours: {
        actualH: hRow?.actualH ?? 0,
        plannedH: hRow?.plannedH ?? 0,
        targetH: area.weeklyHoursTarget ?? 0,
      },
      goals: { cycle: cycleGoals, annual: annualGoals, achieved: achievedGoals, other: otherGoals },
      projects: projectRows,
      habits: habitRows,
      learning: learningRows,
      pillars: pillarRows,
      challenges: challengeRows,
      tasks: {
        openCount: open.length,
        plannedToday: open.filter((t) => t.plannedFor === today).length,
        someday: open.filter((t) => t.someday).length,
        doneThisWeek: doneThisWeek.length,
        next: openSorted.slice(0, 8).map(liteTask),
      },
      notes: notes
        .filter((n) => n.userId === userId)
        .sort((a, b) => b._creationTime - a._creationTime)
        .slice(0, 8)
        .map((n) => ({ _id: n._id, title: n.title, noteType: n.noteType ?? null })),
      noteCount: notes.length,
      wins: {
        logged: loggedWins,
        recentDone: doneThisWeek
          .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
          .slice(0, 5)
          .map((t) => ({ _id: t._id, title: t.title, completedAt: t.completedAt ?? null })),
      },
    };
  },
});

export const remove = mutation({
  args: { id: v.id("lifeAreas") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const area = await ctx.db.get(args.id);
    if (!area || area.userId !== userId) return;
    // Tasks, projects, goals and habits REQUIRE an area — deleting it would leave
    // them pointing at nothing. Refuse (archiving keeps everything intact).
    const [tasks, projects, goals, habits] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", args.id)).collect(),
      ctx.db.query("projects").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", args.id)).collect(),
      ctx.db.query("goals").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", args.id)).collect(),
      ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const used = [
      [tasks.length, "task"],
      [projects.length, "project"],
      [goals.length, "goal"],
      [habits.filter((h) => h.lifeAreaId === args.id).length, "habit"],
    ] as const;
    const parts = used.filter(([n]) => n > 0).map(([n, w]) => `${n} ${w}${n === 1 ? "" : "s"}`);
    if (parts.length) {
      throw new ConvexError(`“${area.name}” still has ${parts.join(", ")}. Move them to another area first, or archive it instead.`);
    }
    // Optional links just lose their area.
    const notes = await ctx.db.query("notes").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", args.id)).collect();
    for (const n of notes) await ctx.db.patch(n._id, { lifeAreaId: undefined, sectionId: undefined });
    const sessions = await ctx.db.query("focusSessions").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", args.id)).collect();
    for (const f of sessions) await ctx.db.patch(f._id, { lifeAreaId: undefined, sectionId: undefined });
    // Cascade: delete sections under this area too.
    const sections = await ctx.db
      .query("sections")
      .withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", args.id))
      .collect();
    for (const s of sections) await ctx.db.delete(s._id);
    await ctx.db.delete(args.id);
  },
});
