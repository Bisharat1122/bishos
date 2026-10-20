/**
 * Weekly / monthly / quarterly / annual reviews — resumable wizards.
 * One doc per (kind, periodKey): answers per step, stepsDone, frozen scores.
 *
 * periodKey: weekly = weekStart (Monday) · monthly = YYYY-MM ·
 *            quarterly = cycleId (or YYYY-Qn without a cycle) · annual = YYYY
 *
 * Prefill reads tables directly (deals, commitments, metrics, issues, inbox,
 * tasks, projects, habits, days, focus…) so the review starts mostly done.
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, action, QueryCtx, MutationCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, awardXp, diffDays, mondayOf, weekday, XP, DAY_MS } from "./os";
import { isActiveCycleGoal, krRatio } from "./goals";
import { currentCycle, cycleGoalsOf, cycleHistory, cycleState, listCycles, loadExecData, weekExecution, habitWeeklyTarget } from "./cycles";
import { computeHours, freezeWeek, getPlan, localMs } from "./weekPlans";
import { upsertDayType } from "./idealWeek";
import { shiftMonth } from "./compass";
import { callOpenRouter } from "./openrouter";

export type Kind = "weekly" | "monthly" | "quarterly" | "annual";
const kindValidator = v.union(v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("annual"));

/** Step keys per kind (UI metadata lives in components/direction/reviewMeta.ts). */
export const STEPS: Record<Kind, { key: string; essential: boolean }[]> = {
  weekly: [
    { key: "celebrate", essential: true },
    { key: "score", essential: true },
    { key: "reflect", essential: false },
    { key: "clear", essential: true },
    { key: "current", essential: false },
    { key: "scorecard", essential: false },
    { key: "plan", essential: true },
    { key: "share", essential: false },
  ],
  monthly: [
    { key: "rate", essential: true },
    { key: "goals", essential: true },
    { key: "habits", essential: false },
    { key: "time", essential: false },
    { key: "migrate", essential: false },
    { key: "pulse", essential: false },
    { key: "next", essential: true },
  ],
  quarterly: [
    { key: "grade", essential: true },
    { key: "execution", essential: true },
    { key: "scan", essential: true },
    { key: "prune", essential: false },
    { key: "next", essential: true },
  ],
  annual: [
    { key: "peaks", essential: true },
    { key: "lists", essential: true },
    { key: "goals", essential: false },
    { key: "theme", essential: true },
    { key: "freedays", essential: true },
  ],
};

const XP_BY_KIND: Record<Kind, number> = {
  weekly: XP.weeklyReview,
  monthly: XP.monthlyReview,
  quarterly: XP.quarterlyReview,
  annual: XP.annualReview,
};

// ─────────────────────────────────────────────────────────────────────────
// Periods
// ─────────────────────────────────────────────────────────────────────────

type Period = { kind: Kind; periodKey: string; periodStart: string; periodEnd: string; cycleId?: Id<"cycles">; cycleName?: string };

const monthStart = (p: string) => `${p}-01`;
const monthEnd = (p: string) => addDays(monthStart(shiftMonth(p, 1)), -1);
const quarterOf = (ymd: string) => `${ymd.slice(0, 4)}-Q${Math.floor((Number(ymd.slice(5, 7)) - 1) / 3) + 1}`;

async function resolvePeriod(ctx: QueryCtx | MutationCtx, userId: Id<"users">, kind: Kind, periodKey: string): Promise<Period> {
  if (kind === "weekly") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(periodKey)) throw new ConvexError("Weekly period must be a date (YYYY-MM-DD).");
    const ws = mondayOf(periodKey);
    return { kind, periodKey: ws, periodStart: ws, periodEnd: addDays(ws, 6) };
  }
  if (kind === "monthly") {
    if (!/^\d{4}-\d{2}$/.test(periodKey)) throw new ConvexError("Monthly period must be YYYY-MM.");
    return { kind, periodKey, periodStart: monthStart(periodKey), periodEnd: monthEnd(periodKey) };
  }
  if (kind === "annual") {
    if (!/^\d{4}$/.test(periodKey)) throw new ConvexError("Annual period must be YYYY.");
    return { kind, periodKey, periodStart: `${periodKey}-01-01`, periodEnd: `${periodKey}-12-31` };
  }
  const q = /^(\d{4})-Q([1-4])$/.exec(periodKey);
  if (q) {
    const y = Number(q[1]);
    const m = (Number(q[2]) - 1) * 3 + 1;
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    return { kind, periodKey, periodStart: start, periodEnd: addDays(monthStart(shiftMonth(start.slice(0, 7), 3)), -1) };
  }
  const cid = ctx.db.normalizeId("cycles", periodKey);
  const cycle = cid ? await ctx.db.get(cid) : null;
  if (!cycle || cycle.userId !== userId) throw new ConvexError("That cycle no longer exists.");
  return { kind, periodKey, periodStart: cycle.startDate, periodEnd: cycle.endDate, cycleId: cycle._id, cycleName: cycle.name };
}

async function findReview(ctx: QueryCtx | MutationCtx, userId: Id<"users">, kind: Kind, periodKey: string) {
  return ctx.db
    .query("periodicReviews")
    .withIndex("by_user_kind", (q) => q.eq("userId", userId).eq("kind", kind).eq("periodKey", periodKey))
    .first();
}

/** Did the user use the system before `date`? (avoid suggesting empty reviews) */
async function usedBefore(ctx: QueryCtx | MutationCtx, userId: Id<"users">, date: string) {
  const ms = Date.parse(`${date}T00:00:00Z`);
  const task = await ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).first();
  if (task && task._creationTime < ms) return true;
  const plan = await ctx.db.query("weekPlans").withIndex("by_user", (q) => q.eq("userId", userId)).first();
  return !!plan && plan.weekStart < date;
}

/** The period each kind's review should cover right now. */
async function suggestedPeriodKey(ctx: QueryCtx | MutationCtx, userId: Id<"users">, kind: Kind, today: string): Promise<string> {
  if (kind === "weekly") {
    const thisMonday = mondayOf(today);
    const prev = addDays(thisMonday, -7);
    const wd = weekday(today);
    if (wd === 1 || wd === 2) {
      const r = await findReview(ctx, userId, "weekly", prev);
      if (r?.status === "draft") return prev;
      if (!r && (await getPlan(ctx, userId, prev))) return prev;
    }
    return thisMonday;
  }
  if (kind === "monthly") {
    const cur = today.slice(0, 7);
    const prev = shiftMonth(cur, -1);
    if (Number(today.slice(8, 10)) <= 7) {
      const r = await findReview(ctx, userId, "monthly", prev);
      if (r?.status === "draft" || (!r && (await usedBefore(ctx, userId, monthStart(cur))))) return prev;
    }
    return cur;
  }
  if (kind === "annual") {
    const y = today.slice(0, 4);
    const prev = String(Number(y) - 1);
    if (today.slice(5, 7) === "01") {
      const r = await findReview(ctx, userId, "annual", prev);
      if (r?.status === "draft" || (!r && (await usedBefore(ctx, userId, `${y}-01-01`)))) return prev;
    }
    return y;
  }
  // quarterly: the started-but-open cycle, else a recently ended unreviewed cycle, else the calendar quarter
  const { cycle } = await currentCycle(ctx, userId, today);
  if (cycle && cycle.startDate <= today) return cycle._id;
  const all = await listCycles(ctx, userId);
  for (const c of all.filter((c) => c.status === "done" && c.endDate <= today)) {
    if (diffDays(c.endDate, today) > 45) break;
    const r = await findReview(ctx, userId, "quarterly", c._id);
    if (!r || r.status === "draft") return c._id;
  }
  return quarterOf(today);
}

// ─────────────────────────────────────────────────────────────────────────
// Prefill builders
// ─────────────────────────────────────────────────────────────────────────

const OPEN_DEAL = (s: string) => s !== "won" && s !== "lost" && s !== "unqualified";
const r1 = (n: number) => Math.round(n * 10) / 10;

async function staleTasks(ctx: QueryCtx | MutationCtx, userId: Id<"users">, tasks: Doc<"tasks">[], today: string) {
  const cutoffMs = Date.parse(`${addDays(today, -30)}T00:00:00Z`);
  const cutoff = addDays(today, -30);
  return tasks
    .filter(
      (t) =>
        t.status !== "done" &&
        !t.someday &&
        t._creationTime < cutoffMs &&
        (!t.plannedFor || t.plannedFor < cutoff) &&
        (!t.dueDate || t.dueDate < cutoffMs),
    )
    .sort((a, b) => a._creationTime - b._creationTime)
    .slice(0, 25)
    .map((t) => ({
      _id: t._id,
      title: t.title,
      ageDays: Math.floor((Date.parse(`${today}T00:00:00Z`) - t._creationTime) / DAY_MS),
      deferCount: t.deferCount ?? 0,
    }));
}

async function activeExec(ctx: QueryCtx | MutationCtx, userId: Id<"users">, today: string) {
  const { cycle } = await currentCycle(ctx, userId, today);
  if (!cycle) return { cycle: null, goals: [] as Doc<"goals">[], data: await loadExecData(ctx, userId, []) };
  const goals = (await cycleGoalsOf(ctx, userId, cycle._id)).filter((g) => isActiveCycleGoal(g, cycle._id));
  return { cycle, goals, data: await loadExecData(ctx, userId, goals.map((g) => g._id)) };
}

function habitStats(habits: Doc<"habits">[], completions: Doc<"habitCompletions">[], start: string, end: string) {
  const days = diffDays(start, end) + 1;
  const rows = habits
    .filter((h) => (h.habitStatus ?? "active") === "active")
    .map((h) => {
      const mine = completions.filter((c) => c.habitId === h._id && c.date >= start && c.date <= end);
      const done = mine.filter((c) => c.kind !== "skip").length;
      const skips = mine.filter((c) => c.kind === "skip").length;
      const target = Math.round((habitWeeklyTarget(h) * days) / 7);
      return { _id: h._id, title: h.title, done, skips, target, pct: target ? Math.min(100, Math.round((done / target) * 100)) : 0 };
    });
  const t = rows.reduce((a, r) => a + r.target, 0);
  const d = rows.reduce((a, r) => a + Math.min(r.done, r.target), 0);
  return { rows, pct: t ? Math.round((d / t) * 100) : null };
}

async function buildPrefill(ctx: QueryCtx | MutationCtx, userId: Id<"users">, p: Period, today: string, tz: number) {
  const startMs = localMs(p.periodStart, tz);
  const endMs = localMs(addDays(p.periodEnd, 1), tz);
  const nowMs = Date.now();
  const [tasks, projects, habits, completions, areas, goals, focus, dayRows] = await Promise.all([
    ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("goals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db
      .query("days")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", p.periodStart).lte("date", p.periodEnd))
      .collect(),
  ]);
  const liveAreas = areas.filter((a) => !a.archived).sort((a, b) => a.order - b.order);
  const areaName = (id?: string) => areas.find((a) => a._id === id)?.name ?? "";
  const doneInPeriod = tasks.filter((t) => t.status === "done" && t.completedAt && t.completedAt >= startMs && t.completedAt < endMs);
  const focusH = r1(focus.filter((s) => s.startTime >= startMs && s.startTime < endMs).reduce((a, s) => a + s.duration, 0) / 3600);
  const base = {
    period: p,
    tasksDone: doneInPeriod.length,
    focusH,
    wins: doneInPeriod
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      .slice(0, 30)
      .map((t) => ({ _id: t._id, title: t.title, area: areaName(t.lifeAreaId), goal: !!t.goalId })),
    progressLines: dayRows.filter((d) => d.progressLine).map((d) => ({ date: d.date, text: d.progressLine! })),
    lessons: dayRows.filter((d) => d.lesson).map((d) => ({ date: d.date, text: d.lesson! })),
    journalWins: dayRows.filter((d) => d.journal?.win).map((d) => ({ date: d.date, text: d.journal!.win! })),
  };

  if (p.kind === "weekly") {
    const ws = p.periodStart;
    const [plan, nextPlan, inbox, deals, commitments, metrics, entries, issues] = await Promise.all([
      getPlan(ctx, userId, ws),
      getPlan(ctx, userId, addDays(ws, 7)),
      ctx.db.query("inbox").withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "open")).collect(),
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("commitments").withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "open")).collect(),
      ctx.db.query("metrics").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("metricEntries").withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekStart", ws)).collect(),
      ctx.db.query("issues").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const ex = await activeExec(ctx, userId, today);
    const exec = weekExecution(ex.data, ws);
    const history = ex.cycle ? await cycleHistory(ctx, userId, ex.cycle, ex.data, today) : [];
    const people = await ctx.db.query("people").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const personName = (id?: string) => people.find((x) => x._id === id)?.name;
    const openDeals = deals.filter((d) => OPEN_DEAL(d.stage));
    const openTaskProjects = new Set(tasks.filter((t) => t.status !== "done" && t.projectId).map((t) => t.projectId as string));
    const big3 = plan?.big3 ?? [];
    return {
      ...base,
      kind: "weekly" as const,
      big3,
      big3Done: big3.filter((b) => b.done).length,
      execution: { score: exec.score, achieved: exec.achieved, target: exec.target, items: exec.items.map((i) => ({ ...i, goalTitle: ex.goals.find((g) => g._id === i.goalId)?.title ?? "" })) },
      history,
      cycle: ex.cycle ? { _id: ex.cycle._id, name: ex.cycle.name, state: cycleState(ex.cycle, today) } : null,
      goals: ex.goals.map((g) => ({ _id: g._id, title: g.title })),
      habits: habitStats(habits, completions, ws, p.periodEnd),
      rituals: {
        startups: dayRows.filter((d) => d.startupAt).length,
        shutdowns: dayRows.filter((d) => d.shutdownAt).length,
      },
      inbox: { open: inbox.length, older48h: inbox.filter((i) => i.createdAt < nowMs - 48 * 3600_000).length },
      projectsNoNext: projects
        .filter((pr) => pr.status !== "completed" && !openTaskProjects.has(pr._id))
        .map((pr) => ({ _id: pr._id, title: pr.title, status: pr.status, area: areaName(pr.lifeAreaId) })),
      staleTasks: await staleTasks(ctx, userId, tasks, today),
      dealsNoNextStep: openDeals
        .filter((d) => !d.nextStepDate)
        .map((d) => ({ _id: d._id, title: d.title, stage: d.stage, person: personName(d.personId) })),
      idleDeals: openDeals
        .filter((d) => (d.lastTouchAt ?? d.stageChangedAt) < nowMs - 7 * DAY_MS)
        .map((d) => ({
          _id: d._id,
          title: d.title,
          stage: d.stage,
          person: personName(d.personId),
          idleDays: Math.floor((nowMs - (d.lastTouchAt ?? d.stageChangedAt)) / DAY_MS),
        })),
      dealsOverdueStep: openDeals.filter((d) => d.nextStepDate && d.nextStepDate < today).length,
      commitments: {
        iOwe: commitments
          .filter((c) => c.direction === "i_owe")
          .sort((a, b) => (a.promisedDate ?? "9999").localeCompare(b.promisedDate ?? "9999"))
          .map((c) => ({ _id: c._id, title: c.title, date: c.promisedDate, person: personName(c.personId), overdue: !!c.promisedDate && c.promisedDate < today })),
        owedToMe: commitments
          .filter((c) => c.direction === "owed_to_me")
          .sort((a, b) => (a.checkDate ?? a.promisedDate ?? "9999").localeCompare(b.checkDate ?? b.promisedDate ?? "9999"))
          .map((c) => {
            const d = c.checkDate ?? c.promisedDate;
            return { _id: c._id, title: c.title, date: d, person: personName(c.personId), overdue: !!d && d < today };
          }),
      },
      scorecard: metrics
        .filter((m) => m.active)
        .sort((a, b) => a.order - b.order)
        .map((m) => {
          const e = entries.find((x) => x.metricId === m._id);
          const value = e?.value;
          return {
            _id: m._id,
            name: m.name,
            unit: m.unit,
            target: m.target,
            value: value ?? null,
            auto: m.auto,
            onTrack: value === undefined ? null : m.direction === "up" ? value >= m.target : value <= m.target,
          };
        }),
      issues: issues
        .filter((i) => i.status === "open" || i.status === "discussing")
        .sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt)
        .slice(0, 8)
        .map((i) => ({ _id: i._id, title: i.title, priority: i.priority, status: i.status })),
      someday: {
        count: tasks.filter((t) => t.someday && t.status !== "done").length,
        items: tasks
          .filter((t) => t.someday && t.status !== "done")
          .slice(0, 8)
          .map((t) => ({ _id: t._id, title: t.title })),
      },
      nextWeek: {
        weekStart: addDays(ws, 7),
        big3: nextPlan?.big3 ?? [],
        freeDay: nextPlan?.freeDay,
      },
    };
  }

  if (p.kind === "monthly") {
    const ratings = await ctx.db.query("areaRatings").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const prevKey = shiftMonth(p.periodKey, -1);
    const ex = await activeExec(ctx, userId, today);
    const habitEnd = p.periodEnd < today ? p.periodEnd : today;
    const habitStart = addDays(habitEnd, -29);
    const hs = habitStats(habits, completions, habitStart, habitEnd);
    const habitsOut = hs.rows.map((r) => {
      const h = habits.find((x) => x._id === r._id)!;
      const started = h.startedOn ?? new Date(h._creationTime).toISOString().slice(0, 10);
      const ageDays = Math.max(0, diffDays(started, today));
      const suggestion = r.pct >= 85 && ageDays >= 60 ? "graduate" : r.pct >= 60 ? "keep" : r.pct >= 30 || ageDays < 21 ? "shrink" : "drop";
      return { ...r, ageDays, suggestion, minVersion: h.minVersion, goalId: h.goalId };
    });
    const deals = await ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const content = await ctx.db.query("contentPieces").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return {
      ...base,
      kind: "monthly" as const,
      areas: liveAreas.map((a) => ({
        _id: a._id,
        name: a.name,
        color: a.color,
        order: a.order,
        standard: a.standard,
        rating: ratings.find((r) => r.lifeAreaId === a._id && r.period === p.periodKey)?.rating ?? null,
        previous: ratings.find((r) => r.lifeAreaId === a._id && r.period === prevKey)?.rating ?? null,
      })),
      goals: [
        ...ex.goals.map((g) => ({ _id: g._id, title: g.title, level: "cycle" as const, progress: g.progress, keyResults: g.keyResults ?? [] })),
        ...goals
          .filter((g) => g.level === "annual" && (g.goalStatus ?? "active") === "active")
          .map((g) => ({ _id: g._id, title: g.title, level: "annual" as const, progress: g.progress, keyResults: g.keyResults ?? [] })),
      ],
      habits: { rows: habitsOut, pct: hs.pct },
      hours: await computeHours(ctx, userId, p.periodStart, p.periodEnd, tz),
      staleTasks: await staleTasks(ctx, userId, tasks, today),
      dealsWon: deals.filter((d) => d.stage === "won" && d.closedAt && d.closedAt >= startMs && d.closedAt < endMs).length,
      contentPublished: content.filter((c) => c.publishedAt && c.publishedAt >= startMs && c.publishedAt < endMs).length,
    };
  }

  if (p.kind === "quarterly") {
    let cycleOut = null;
    let cycleGoals: Doc<"goals">[] = [];
    let history: Awaited<ReturnType<typeof cycleHistory>> = [];
    if (p.cycleId) {
      const cycle = (await ctx.db.get(p.cycleId))!;
      cycleGoals = (await cycleGoalsOf(ctx, userId, cycle._id)).filter((g) => g.level === "cycle" || !g.level);
      const data = await loadExecData(ctx, userId, cycleGoals.filter((g) => g.goalStatus !== "dropped").map((g) => g._id));
      history = await cycleHistory(ctx, userId, cycle, data, today);
      cycleOut = { ...cycle, state: cycleState(cycle, today) };
    }
    const scores = history.filter((h) => h.score !== null).map((h) => h.score as number);
    const tactics = await ctx.db.query("tactics").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return {
      ...base,
      kind: "quarterly" as const,
      cycle: cycleOut,
      goals: cycleGoals.map((g) => {
        const krs = g.keyResults ?? [];
        return {
          _id: g._id,
          title: g.title,
          goalType: g.goalType,
          goalStatus: g.goalStatus ?? "active",
          keyResults: krs,
          grade: g.grade ?? null,
          suggestedGrade: krs.length ? Math.round((krs.reduce((a, k) => a + krRatio(k), 0) / krs.length) * 100) / 100 : null,
          tactics: tactics.filter((t) => t.goalId === g._id).map((t) => ({ _id: t._id, title: t.title, weeklyTarget: t.weeklyTarget })),
        };
      }),
      history,
      avgExecution: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      weeksOver85: scores.filter((s) => s >= 85).length,
      prune: {
        projects: projects
          .filter((pr) => pr.status !== "completed")
          .map((pr) => ({ _id: pr._id, title: pr.title, status: pr.status, area: areaName(pr.lifeAreaId), progress: pr.progress })),
        habits: habits
          .filter((h) => (h.habitStatus ?? "active") === "active")
          .map((h) => ({ _id: h._id, title: h.title, area: areaName(h.lifeAreaId) })),
        areas: liveAreas.map((a) => ({ _id: a._id, name: a.name })),
      },
      backlog: goals.filter((g) => (g.level === "cycle" && g.goalStatus === "backlog") || (g.level === "annual" && g.goalStatus !== "dropped" && g.goalStatus !== "achieved")).map((g) => ({
          _id: g._id,
          title: g.title,
          level: g.level,
          lifeAreaId: g.lifeAreaId,
          goalType: g.goalType,
          reasons: g.reasons,
          keyResults: g.keyResults,
        })),
    };
  }

  // annual
  const [momentum, deals, content, cycles, ratings] = await Promise.all([
    ctx.db.query("momentum").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("contentPieces").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    listCycles(ctx, userId),
    ctx.db.query("areaRatings").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
  ]);
  const yearCycles = cycles.filter((c) => c.startDate.slice(0, 4) === p.periodKey);
  const yearCycleIds = new Set<string>(yearCycles.map((c) => c._id));
  const yearGoals = goals.filter((g) => g.cycleId && yearCycleIds.has(g.cycleId));
  const decided = yearGoals.filter((g) => g.goalStatus === "achieved" || g.goalStatus === "dropped" || g.grade !== undefined);
  const achieved = yearGoals.filter((g) => g.goalStatus === "achieved" || (g.grade ?? 0) >= 0.7);
  const months = Array.from({ length: 12 }, (_, i) => `${p.periodKey}-${String(i + 1).padStart(2, "0")}`).map((m) => {
    const rs = ratings.filter((r) => r.period === m);
    return { period: m, avg: rs.length ? r1(rs.reduce((a, r) => a + r.rating, 0) / rs.length) : null };
  });
  return {
    ...base,
    kind: "annual" as const,
    peaks: momentum
      .filter((m) => m.createdAt >= startMs && m.createdAt < endMs)
      .sort((a, b) => b.impact - a.impact || b.createdAt - a.createdAt)
      .slice(0, 15)
      .map((m) => ({ _id: m._id, title: m.titleSnapshot, impact: m.impact, why: m.why, at: m.createdAt, type: m.type })),
    dealsWon: deals.filter((d) => d.stage === "won" && d.closedAt && d.closedAt >= startMs && d.closedAt < endMs).length,
    revenue: deals
      .filter((d) => d.stage === "won" && d.closedAt && d.closedAt >= startMs && d.closedAt < endMs)
      .reduce((a, d) => a + (d.value ?? 0), 0),
    contentPublished: content.filter((c) => c.publishedAt && c.publishedAt >= startMs && c.publishedAt < endMs).length,
    cycles: yearCycles.map((c) => {
      const cg = goals.filter((g) => g.cycleId === c._id);
      const graded = cg.filter((g) => g.grade !== undefined);
      return { _id: c._id, name: c.name, startDate: c.startDate, goals: cg.length, avgGrade: graded.length ? r1(graded.reduce((a, g) => a + (g.grade ?? 0), 0) / graded.length) : null };
    }),
    goalsTotal: yearGoals.length,
    goalsDecided: decided.length,
    goalsAchieved: achieved.length,
    achievedPct: decided.length ? Math.round((achieved.length / decided.length) * 100) : null,
    months,
    areas: liveAreas.map((a) => ({ _id: a._id, name: a.name, color: a.color, order: a.order })),
    annualGoals: goals
      .filter((g) => g.level === "annual" && g.goalStatus !== "dropped")
      .map((g) => ({ _id: g._id, title: g.title, lifeAreaId: g.lifeAreaId, goalStatus: g.goalStatus ?? "active" })),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────

/** Reviews hub: the current review per kind (status, progress, last done) + history. */
export const hub = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const all = await ctx.db.query("periodicReviews").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    // Quarterly drafts keyed by a cycle that was since deleted can't be opened any more — don't offer them.
    const cycleIds = new Set<string>((await listCycles(ctx, userId)).map((c) => c._id));
    const openable = (r: Doc<"periodicReviews">) => r.kind !== "quarterly" || /^\d{4}-Q[1-4]$/.test(r.periodKey) || cycleIds.has(r.periodKey);
    const kinds: Kind[] = ["weekly", "monthly", "quarterly", "annual"];
    const cards = [];
    for (const kind of kinds) {
      const periodKey = await suggestedPeriodKey(ctx, userId, kind, today);
      const period = await resolvePeriod(ctx, userId, kind, periodKey);
      const doc = all.find((r) => r.kind === kind && r.periodKey === periodKey) ?? null;
      const done = all
        .filter((r) => r.kind === kind && r.status === "done")
        .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
      const drafts = all.filter((r) => r.kind === kind && r.status === "draft" && r.periodKey !== periodKey && openable(r));
      cards.push({
        ...period,
        status: doc?.status ?? "none",
        stepsDone: doc?.stepsDone?.length ?? 0,
        stepsTotal: STEPS[kind].length,
        essentialTotal: STEPS[kind].filter((s) => s.essential).length,
        lastDone: done[0] ? { periodKey: done[0].periodKey, completedAt: done[0].completedAt, periodStart: done[0].periodStart, periodEnd: done[0].periodEnd } : null,
        doneCount: done.length,
        otherDrafts: drafts.map((d) => ({ periodKey: d.periodKey, periodStart: d.periodStart, periodEnd: d.periodEnd })),
      });
    }
    // Weekly streak: consecutive weeks (ending this or last week) with a done review.
    const doneWeeks = new Set(all.filter((r) => r.kind === "weekly" && r.status === "done").map((r) => r.periodKey));
    let streak = 0;
    let wk = mondayOf(today);
    if (!doneWeeks.has(wk)) wk = addDays(wk, -7);
    while (doneWeeks.has(wk) && streak < 520) {
      streak++;
      wk = addDays(wk, -7);
    }
    const history = all
      .filter((r) => r.status === "done")
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      .slice(0, 40)
      .map((r) => ({
        _id: r._id,
        kind: r.kind,
        periodKey: r.periodKey,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        completedAt: r.completedAt,
        scores: r.scores ?? null,
      }));
    return { cards, history, weeklyStreak: streak };
  },
});

/** The review doc for (kind, periodKey) — null if not started. */
export const get = query({
  args: { kind: kindValidator, periodKey: v.string() },
  handler: async (ctx, { kind, periodKey }) => {
    const userId = await requireUser(ctx);
    return findReview(ctx, userId, kind, periodKey);
  },
});

/** Resolve the period to open: explicit `periodKey` or the suggested one. */
export const period = query({
  args: { kind: kindValidator, today: v.string(), periodKey: v.optional(v.string()) },
  handler: async (ctx, { kind, today, periodKey }) => {
    const userId = await requireUser(ctx);
    try {
      return await resolvePeriod(ctx, userId, kind, periodKey ?? (await suggestedPeriodKey(ctx, userId, kind, today)));
    } catch {
      return resolvePeriod(ctx, userId, kind, await suggestedPeriodKey(ctx, userId, kind, today));
    }
  },
});

/** Pre-filled numbers for a review. */
export const prefill = query({
  args: { kind: kindValidator, periodKey: v.string(), today: v.string(), tz: v.optional(v.number()) },
  handler: async (ctx, { kind, periodKey, today, tz }) => {
    const userId = await requireUser(ctx);
    const p = await resolvePeriod(ctx, userId, kind, periodKey);
    return buildPrefill(ctx, userId, p, today, tz ?? 0);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────

/** Get-or-create the draft for (kind, periodKey). */
export const open = mutation({
  args: { kind: kindValidator, periodKey: v.string() },
  handler: async (ctx, { kind, periodKey }) => {
    const userId = await requireUser(ctx);
    const p = await resolvePeriod(ctx, userId, kind, periodKey);
    const existing = await findReview(ctx, userId, kind, p.periodKey);
    if (existing) return existing._id;
    return ctx.db.insert("periodicReviews", {
      userId,
      kind,
      periodKey: p.periodKey,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      answers: {},
      stepsDone: [],
      status: "draft",
    });
  },
});

async function ownReview(ctx: MutationCtx, userId: Id<"users">, id: Id<"periodicReviews">) {
  const r = await ctx.db.get(id);
  if (!r || r.userId !== userId) throw new ConvexError("Review not found.");
  return r;
}

/** Save one answer (autosave). */
export const saveAnswer = mutation({
  args: { id: v.id("periodicReviews"), key: v.string(), value: v.any() },
  handler: async (ctx, { id, key, value }) => {
    const userId = await requireUser(ctx);
    const r = await ownReview(ctx, userId, id);
    const answers = { ...((r.answers as Record<string, unknown>) ?? {}) };
    if (value === null || value === undefined || value === "") delete answers[key];
    else answers[key] = value;
    await ctx.db.patch(id, { answers });
  },
});

/** Mark a step done / not done (resumable progress). */
export const setStep = mutation({
  args: { id: v.id("periodicReviews"), step: v.string(), done: v.boolean() },
  handler: async (ctx, { id, step, done }) => {
    const userId = await requireUser(ctx);
    const r = await ownReview(ctx, userId, id);
    const cur = new Set(r.stepsDone ?? []);
    if (done) cur.add(step);
    else cur.delete(step);
    await ctx.db.patch(id, { stepsDone: [...cur] });
  },
});

/** Store an AI draft the user accepted (the user edits it in the UI first). */
export const saveDraft = mutation({
  args: { id: v.id("periodicReviews"), text: v.string() },
  handler: async (ctx, { id, text }) => {
    const userId = await requireUser(ctx);
    await ownReview(ctx, userId, id);
    await ctx.db.patch(id, { aiDraft: text.trim() || undefined });
  },
});

/**
 * Complete a review: freeze its scores (weekly: the execution score goes into
 * weekPlans + reviewedAt), award XP once (key `review-<kind>-<periodKey>`).
 */
export const complete = mutation({
  args: { id: v.id("periodicReviews"), today: v.string(), tz: v.optional(v.number()), minimum: v.optional(v.boolean()) },
  handler: async (ctx, { id, today, tz, minimum }) => {
    const userId = await requireUser(ctx);
    const r = await ownReview(ctx, userId, id);
    const p = await resolvePeriod(ctx, userId, r.kind, r.periodKey);
    const pre = await buildPrefill(ctx, userId, p, today, tz ?? 0);
    const answers = (r.answers ?? {}) as Record<string, unknown>;
    let scores: Record<string, unknown> = { tasksDone: pre.tasksDone, focusH: pre.focusH, minimum: !!minimum };

    if (pre.kind === "weekly") {
      const frozen = await freezeWeek(ctx, userId, p.periodStart, today);
      scores = {
        ...scores,
        execution: frozen,
        big3Done: pre.big3Done,
        big3Total: pre.big3.length,
        habitPct: pre.habits.pct,
        inbox: pre.inbox.open,
      };
    } else if (pre.kind === "monthly") {
      const rated = pre.areas.filter((a) => a.rating !== null);
      scores = {
        ...scores,
        avgRating: rated.length ? r1(rated.reduce((a, x) => a + (x.rating ?? 0), 0) / rated.length) : null,
        ratings: Object.fromEntries(rated.map((a) => [a.name, a.rating])),
        habitPct: pre.habits.pct,
        hours: pre.hours.totals,
      };
    } else if (pre.kind === "quarterly") {
      const graded = pre.goals.filter((g) => g.grade !== null);
      const burnout = ["burnout.exhaustion", "burnout.detachment", "burnout.efficacy"].map((k) => Number(answers[k]) || 0);
      scores = {
        ...scores,
        avgExecution: pre.avgExecution,
        avgGrade: graded.length ? Math.round((graded.reduce((a, g) => a + (g.grade ?? 0), 0) / graded.length) * 100) / 100 : null,
        burnout: burnout.some(Boolean) ? burnout : null,
      };
    } else {
      scores = { ...scores, achievedPct: pre.achievedPct, dealsWon: pre.dealsWon, contentPublished: pre.contentPublished };
    }

    await ctx.db.patch(id, {
      status: "done",
      completedAt: Date.now(),
      scores,
      stepsDone: r.stepsDone,
    });
    const amount = XP_BY_KIND[r.kind];
    const awarded = await awardXp(ctx, userId, `review-${r.kind}-${r.periodKey}`, amount, `${r.kind[0].toUpperCase()}${r.kind.slice(1)} review`, today);
    return { xp: awarded ? amount : 0, scores };
  },
});

/** Reopen a done review for edits (XP is not awarded twice). */
export const reopen = mutation({
  args: { id: v.id("periodicReviews") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await ownReview(ctx, userId, id);
    await ctx.db.patch(id, { status: "draft" });
  },
});

/**
 * Annual review "Free Days first": put protected Free Days on the calendar
 * (a free block per date + days.dayType = "free"). Skips dates that already
 * have a free block.
 */
export const addFreeDays = mutation({
  args: { dates: v.array(v.string()), label: v.optional(v.string()) },
  handler: async (ctx, { dates, label }) => {
    const userId = await requireUser(ctx);
    let created = 0;
    for (const date of [...new Set(dates)].slice(0, 120)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const rows = await ctx.db
        .query("scheduleBlocks")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
        .collect();
      await upsertDayType(ctx, userId, date, "free");
      if (rows.some((b) => b.blockType === "free")) continue;
      await ctx.db.insert("scheduleBlocks", {
        userId,
        date,
        startMin: 8 * 60,
        endMin: 20 * 60,
        title: label?.trim() || "Free Day — no work",
        status: "planned",
        blockType: "free",
        fromTemplate: false,
      });
      created++;
    }
    return created;
  },
});

// ─────────────────────────────────────────────────────────────────────────
// AI draft (returns text; the user edits before saving)
// ─────────────────────────────────────────────────────────────────────────

const AI_FOCUS: Record<string, string> = {
  summary: "Write a short, honest summary of this period (5–8 bullets): wins first, then the score, then what to change.",
  reflect: "Draft Keep / Improve / Start / Stop — 1–2 short bullets each, grounded in the numbers.",
  share: "Draft a 4–6 line update to share with a co-founder: score, wins, misses, next week's Big 3.",
  plan: "Suggest next week's Big 3 outcomes (3 lines, each a concrete outcome, not a task list) based on goals, tactics and loose ends.",
  next: "Suggest one focus for the next period and 2–3 concrete adjustments.",
  execution: "List key successes (3) and key mistakes/lessons (3) for this 12-week cycle.",
  lists: "Draft 'went well' (6) and 'went badly' (6) lists for the year from the data.",
  peaks: "Pick the top positive and negative peaks of the year and what to repeat or avoid.",
};

export const aiDraft = action({
  args: {
    kind: kindValidator,
    periodKey: v.string(),
    today: v.string(),
    tz: v.optional(v.number()),
    focus: v.optional(v.string()),
  },
  handler: async (ctx, { kind, periodKey, today, tz, focus }): Promise<string> => {
    const pre: unknown = await ctx.runQuery(api.periodicReviews.prefill, { kind, periodKey, today, tz });
    const doc: unknown = await ctx.runQuery(api.periodicReviews.get, { kind, periodKey });
    const answers = (doc as { answers?: unknown } | null)?.answers ?? {};
    // Trim long lists so the prompt stays small.
    const compact = JSON.stringify(pre, (_k, val) => (Array.isArray(val) && val.length > 12 ? val.slice(0, 12) : val)).slice(0, 14000);
    const task = AI_FOCUS[focus ?? "summary"] ?? AI_FOCUS.summary;
    const text = await callOpenRouter([
      {
        role: "system",
        content:
          "You are Bish's chief of staff. Bish is a near-solo startup co-founder (delivery, sales, marketing, learning, content). " +
          "Be specific, kind and brief. Use only the data given; never invent numbers. Plain text with short bullets. No preamble.",
      },
      {
        role: "user",
        content: `This is my ${kind} review (${periodKey}).\nData: ${compact}\nMy answers so far: ${JSON.stringify(answers).slice(0, 4000)}\n\nTask: ${task}`,
      },
    ]);
    return text.trim();
  },
});
