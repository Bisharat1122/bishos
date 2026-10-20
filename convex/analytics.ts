/**
 * Analytics · Progress & Growth — one reactive aggregate for /dashboard.
 *
 * Args: `today` (client-LOCAL YYYY-MM-DD), `weeks` (4 | 12 | 26 | 52) and
 * `tzOffsetMin` (= `new Date().getTimezoneOffset()`, used to turn stored
 * timestamps into the client's local day).
 *
 * The current period is the `weeks` Monday-weeks ending with this week (the
 * current week is partial). The previous period is the same number of DAYS
 * just before it, so "vs previous period" deltas compare equal spans.
 *
 * Single user: every table is read through its by_user/by_date index and the
 * maths happens here, so the page renders from one subscription.
 */
import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, diffDays, mondayOf, weekday, levelFromXp, ritualStreak, getSettings, ymdUtc, DAY_MS } from "./os";
import { ExecData, weekExecution, cycleState, currentCycle } from "./cycles";
import { isActiveCycleGoal, krRatio } from "./goals";

// ─────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────

const RANGES = [4, 12, 26, 52];

/** XP sources, in display order. Index = position in every `bySource` array. */
export const XP_SOURCES = ["rituals", "tasks", "sales", "content", "learning", "habits", "reviews", "other"] as const;
type XpSource = (typeof XP_SOURCES)[number];
const SOURCE_LABEL: Record<XpSource, string> = {
  rituals: "Rituals",
  tasks: "Tasks & tactics",
  sales: "Sales & promises",
  content: "Content",
  learning: "Learning",
  habits: "Habits",
  reviews: "Reviews",
  other: "Other",
};
// Order matters: the first matching prefix wins ("decision-review-" before "decision-").
const SOURCE_RULES: [string, XpSource][] = [
  ["startup-", "rituals"],
  ["shutdown-", "rituals"],
  ["checkin-", "rituals"],
  ["journal-", "rituals"],
  ["routine-", "rituals"],
  ["inbox-", "rituals"],
  ["note-processed-", "rituals"],
  ["decision-review-", "reviews"],
  ["review-", "reviews"],
  ["scorecard-", "reviews"],
  ["task-", "tasks"],
  ["top-", "tasks"],
  ["big3-", "tasks"],
  ["tactic-", "tasks"],
  ["issue-solved-", "tasks"],
  ["decision-", "tasks"],
  ["deal-", "sales"],
  ["touch-", "sales"],
  ["commit-", "sales"],
  ["offer-", "sales"],
  ["campaign-", "sales"],
  ["content-pub-", "content"],
  ["practice-", "learning"],
  ["recall-", "learning"],
  ["habit-", "habits"],
];
const sourceOf = (key: string): XpSource => SOURCE_RULES.find(([p]) => key.startsWith(p))?.[1] ?? "other";

const OPEN_STAGES = new Set(["target", "contacted", "booked", "discovery", "proposal", "verbal"]);
const LAB_RAMP = [3, 5, 7, 7, 7, 7, 7, 7]; // mirrors convex/content.ts
const LAB_SHORTS = new Set(["short_video", "story"]);
const WEEKDAY_LABEL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : null);
const r1 = (n: number) => Math.round(n * 10) / 10;
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null);
const meanOrNull = (xs: (number | null | undefined)[]) => {
  const ok = xs.filter((x): x is number => typeof x === "number");
  return ok.length ? sum(ok) / ok.length : null;
};

const CURRENCY_SIGN: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥", AUD: "A$", CAD: "C$", PKR: "Rs " };
function money(n: number, currency: string) {
  const sign = CURRENCY_SIGN[currency] ?? `${currency} `;
  const a = Math.abs(n);
  const body = a >= 1e6 ? `${r1(a / 1e6)}M` : a >= 1e4 ? `${Math.round(a / 1e3)}K` : a >= 1e3 ? `${r1(a / 1e3)}K` : `${Math.round(a)}`;
  return `${n < 0 ? "-" : ""}${sign}${body}`;
}
const compact = (n: number) => (n >= 1e6 ? `${r1(n / 1e6)}M` : n >= 1e3 ? `${r1(n / 1e3)}K` : `${Math.round(n)}`);

/** Most mature performance snapshot (30d > 7d > 24h). */
function bestSnapshot(p: Doc<"contentPieces">) {
  const perf = p.performance ?? [];
  return perf.find((s) => s.window === "30d") ?? perf.find((s) => s.window === "7d") ?? perf.find((s) => s.window === "24h") ?? null;
}

type Insight = { text: string; tone: "up" | "down" | "neutral"; href: string; weight: number };

// ─────────────────────────────────────────────────────────────────────────
// The query
// ─────────────────────────────────────────────────────────────────────────

export const overview = query({
  args: { today: v.string(), weeks: v.number(), tzOffsetMin: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const today = args.today;
    const weeks = RANGES.includes(args.weeks) ? args.weeks : 12;
    const tz = Math.max(-16 * 60, Math.min(16 * 60, Math.round(args.tzOffsetMin)));

    // ── Period geometry ──────────────────────────────────────────────────
    const thisMonday = mondayOf(today);
    const start = addDays(thisMonday, -(weeks - 1) * 7);
    const prevStart = addDays(start, -weeks * 7);
    const prevEnd = addDays(today, -weeks * 7);
    const weekStarts = Array.from({ length: weeks }, (_, i) => addDays(start, i * 7));
    const prevWeekStarts = Array.from({ length: weeks }, (_, i) => addDays(prevStart, i * 7));
    const allWeekStarts = [...prevWeekStarts, ...weekStarts]; // chronological, 2×weeks

    const localYmd = (ms: number) => ymdUtc(ms - tz * 60_000);
    // Earliest instant that can fall on prevStart in any timezone (with a day of slack).
    const fromMs = Date.parse(`${prevStart}T00:00:00Z`) - 2 * DAY_MS;

    const inCur = (d: string | null | undefined): d is string => !!d && d >= start && d <= today;
    const inPrev = (d: string | null | undefined): d is string => !!d && d >= prevStart && d <= prevEnd;
    const wi = (d: string) => Math.floor(diffDays(start, d) / 7); // week index in current period
    const zeros = () => Array.from({ length: weeks }, () => 0);
    const elapsedDays = diffDays(start, today) + 1;

    // ── Reads (parallel) ─────────────────────────────────────────────────
    const [
      settings,
      ledger,
      days,
      habits,
      completions,
      inbox,
      routineRuns,
      cycles,
      goals,
      tactics,
      tacticLogs,
      weekPlans,
      reviews,
      deals,
      interactions,
      commitments,
      metrics,
      metricEntries,
      offers,
      campaigns,
      pieces,
      strategies,
      swipes,
      areas,
      projects,
      focus,
      blocks,
      audit,
      recallLogs,
      practice,
      learningAreas,
      notes,
      resources,
    ] = await Promise.all([
      getSettings(ctx, userId),
      ctx.db.query("xpLedger").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("days").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId).gte("date", prevStart)).collect(),
      ctx.db.query("inbox").withIndex("by_user", (q) => q.eq("userId", userId).gte("_creationTime", fromMs - 30 * DAY_MS)).collect(),
      ctx.db.query("routineRuns").withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", prevStart)).collect(),
      ctx.db.query("cycles").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("goals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("tactics").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("tacticLogs").withIndex("by_user_week", (q) => q.eq("userId", userId).gte("weekStart", prevStart)).collect(),
      ctx.db.query("weekPlans").withIndex("by_user_week", (q) => q.eq("userId", userId).gte("weekStart", prevStart)).collect(),
      ctx.db.query("periodicReviews").withIndex("by_user_kind", (q) => q.eq("userId", userId).eq("kind", "weekly").gte("periodKey", prevStart)).collect(),
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("interactions").withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", prevStart)).collect(),
      ctx.db.query("commitments").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("metrics").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("metricEntries").withIndex("by_user_week", (q) => q.eq("userId", userId).gte("weekStart", prevStart)).collect(),
      ctx.db.query("offers").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("campaigns").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("contentPieces").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("contentStrategy").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("swipes").withIndex("by_user", (q) => q.eq("userId", userId).gte("_creationTime", fromMs)).collect(),
      ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId).gte("_creationTime", fromMs)).collect(),
      ctx.db.query("scheduleBlocks").withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", prevStart)).collect(),
      ctx.db.query("timeAudit").withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", start)).collect(),
      ctx.db.query("recallLogs").withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", prevStart)).collect(),
      ctx.db.query("practiceSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("learningAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId).gte("_creationTime", fromMs)).collect(),
      ctx.db.query("resources").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const currency = settings.currency || "USD";
    const insights: Insight[] = [];

    // ═════════════════════════════════════════════════════════════════════
    // GROWTH · XP
    // ═════════════════════════════════════════════════════════════════════
    const totalXp = sum(ledger.map((x) => x.amount));
    const xpBefore = sum(ledger.filter((x) => x.date < start).map((x) => x.amount));
    const xpWeekly = weekStarts.map((weekStart) => ({ weekStart, total: 0, cumulative: 0, bySource: XP_SOURCES.map(() => 0) }));
    const xpBySource = XP_SOURCES.map(() => 0);
    let xpPrev = 0;
    const xpPrevWeekly = zeros();
    for (const x of ledger) {
      if (inCur(x.date)) {
        const w = xpWeekly[wi(x.date)];
        const s = XP_SOURCES.indexOf(sourceOf(x.key));
        w.total += x.amount;
        w.bySource[s] += x.amount;
        xpBySource[s] += x.amount;
      } else if (inPrev(x.date)) {
        xpPrev += x.amount;
        xpPrevWeekly[Math.floor(diffDays(prevStart, x.date) / 7)] += x.amount;
      }
    }
    let running = xpBefore;
    for (const w of xpWeekly) {
      running += w.total;
      w.cumulative = running;
    }
    const xpPeriod = sum(xpWeekly.map((w) => w.total));
    const level = levelFromXp(totalXp);
    const levelsGained = level.level - levelFromXp(xpBefore).level;
    const growth = {
      level,
      totalXp,
      xpPeriod,
      xpPrev,
      levelsGained,
      sources: XP_SOURCES.map((k, i) => ({ key: k, label: SOURCE_LABEL[k], xp: xpBySource[i] })),
      weekly: xpWeekly,
    };
    if (xpPeriod > 0) {
      const top = growth.sources.filter((s) => s.key !== "other").sort((a, b) => b.xp - a.xp)[0];
      const change = pct(xpPeriod - xpPrev, xpPrev);
      insights.push({
        text:
          `You earned ${compact(xpPeriod)} XP this period` +
          (change != null ? ` (${change >= 0 ? "+" : ""}${change}% vs the period before)` : "") +
          (top && top.xp > 0 ? `; most of it from ${top.label.toLowerCase()}.` : "."),
        tone: change == null || change >= 0 ? "up" : "down",
        href: "/today",
        weight: 40,
      });
    }

    // ═════════════════════════════════════════════════════════════════════
    // CONSISTENCY · days, rituals, habits, heatmap
    // ═════════════════════════════════════════════════════════════════════
    const dayByDate = new Map(days.map((d) => [d.date, d]));
    const ritualDone = new Set(days.filter((d) => d.startupAt || d.shutdownAt).map((d) => d.date));
    const freeDays = new Set(days.filter((d) => d.dayType === "free").map((d) => d.date));
    const streak = ritualStreak(ritualDone, freeDays, today);

    // Top-3 done per day, from the XP ledger keys `top-<date>-<taskId>`.
    const topDoneByDate = new Map<string, number>();
    for (const x of ledger) {
      if (!x.key.startsWith("top-")) continue;
      const d = x.key.slice(4, 14);
      topDoneByDate.set(d, (topDoneByDate.get(d) ?? 0) + 1);
    }

    // Habits countable on a given day (daily-ish, active, started).
    const activeHabits = habits.filter((h) => (h.habitStatus ?? "active") === "active");
    const dailyHabits = activeHabits.filter((h) => h.frequency !== "weekly");
    const habitCreatedDay = new Map(habits.map((h) => [h._id as string, localYmd(h._creationTime)]));
    const complByDate = new Map<string, Doc<"habitCompletions">[]>();
    for (const c of completions) {
      const arr = complByDate.get(c.date);
      if (arr) arr.push(c);
      else complByDate.set(c.date, [c]);
    }
    function habitRatio(date: string): number | null {
      const countable = dailyHabits.filter(
        (h) => (habitCreatedDay.get(h._id) ?? "") <= date && (!h.startedOn || h.startedOn <= date),
      );
      if (!countable.length) return null;
      const ids = new Set<string>(countable.map((h) => h._id));
      const todays = (complByDate.get(date) ?? []).filter((c) => ids.has(c.habitId));
      const skipped = todays.filter((c) => c.kind === "skip").length;
      const done = todays.filter((c) => c.kind !== "skip").length;
      const denom = countable.length - skipped;
      return denom > 0 ? Math.min(1, done / denom) : null;
    }
    /** Day score: the shutdown snapshot when present, else the live Today formula. */
    function scoreOf(date: string): number | null {
      const d = dayByDate.get(date);
      if (d?.dayScore != null) return Math.round(d.dayScore);
      const hr = habitRatio(date);
      const anyHabit = (complByDate.get(date) ?? []).some((c) => c.kind !== "skip");
      if (!d && !anyHabit) return null;
      const top = d?.top3?.length ?? 0;
      const topDone = Math.min(top, topDoneByDate.get(date) ?? 0);
      return (
        (d?.startupAt ? 20 : 0) +
        (top ? Math.round((topDone / top) * 30) : 0) +
        (hr != null ? Math.round(hr * 20) : 0) +
        (d?.shutdownAt ? 20 : 0) +
        (d?.progressLine || d?.journal?.win ? 10 : 0)
      );
    }

    const heatmap: { date: string; score: number | null; ritual: boolean; free: boolean; future: boolean }[] = [];
    const consWeekly = weekStarts.map((weekStart) => ({
      weekStart,
      avgScore: null as number | null,
      ritualDays: 0,
      startup: 0,
      shutdown: 0,
      routines: 0,
      captured: 0,
      processed: 0,
    }));
    const firstDay = days.length ? days.reduce((m, d) => (d.date < m ? d.date : m), days[0].date) : null;
    let eligible = 0;
    let startupDays = 0;
    let shutdownDays = 0;
    const curScores: number[] = [];
    weekStarts.forEach((ws, i) => {
      const scores: number[] = [];
      for (let k = 0; k < 7; k++) {
        const date = addDays(ws, k);
        const future = date > today;
        const d = dayByDate.get(date);
        const s = future ? null : scoreOf(date);
        const ritual = !!(d?.startupAt || d?.shutdownAt);
        heatmap.push({ date, score: s, ritual, free: freeDays.has(date), future });
        if (future) continue;
        if (s != null) scores.push(s);
        if (ritual) consWeekly[i].ritualDays++;
        if (d?.startupAt) consWeekly[i].startup++;
        if (d?.shutdownAt) consWeekly[i].shutdown++;
        const counts = firstDay != null && date >= firstDay && !freeDays.has(date) && (date < today || ritual);
        if (counts) {
          eligible++;
          if (d?.startupAt) startupDays++;
          if (d?.shutdownAt) shutdownDays++;
        }
      }
      const m = mean(scores);
      consWeekly[i].avgScore = m == null ? null : Math.round(m);
      curScores.push(...scores);
    });
    const prevScores: number[] = [];
    let ritualDaysPrev = 0;
    for (let k = 0; k < elapsedDays; k++) {
      const date = addDays(prevStart, k);
      const s = scoreOf(date);
      if (s != null) prevScores.push(s);
      if (ritualDone.has(date)) ritualDaysPrev++;
    }
    for (const r of routineRuns) if (r.completed && inCur(r.date)) consWeekly[wi(r.date)].routines++;
    for (const it of inbox) {
      const c = localYmd(it.createdAt);
      if (inCur(c)) consWeekly[wi(c)].captured++;
      if (it.processedAt && (it.status === "processed" || it.status === "discarded")) {
        const p = localYmd(it.processedAt);
        if (inCur(p)) consWeekly[wi(p)].processed++;
      }
    }
    const avgScore = mean(curScores);
    const avgScorePrev = mean(prevScores);
    const consistency = {
      streak: { current: streak.streak, best: streak.best, shieldsLeft: streak.shieldsLeft },
      heatmap,
      eligibleDays: eligible,
      startupPct: pct(startupDays, eligible),
      shutdownPct: pct(shutdownDays, eligible),
      avgScore: avgScore == null ? null : Math.round(avgScore),
      avgScorePrev: avgScorePrev == null ? null : Math.round(avgScorePrev),
      ritualDays: sum(consWeekly.map((w) => w.ritualDays)),
      ritualDaysPrev,
      loggedDays: curScores.length,
      inboxOpen: inbox.filter((i) => i.status === "open").length,
      weekly: consWeekly,
    };
    if (streak.streak >= 3 || streak.best >= 3) {
      insights.push({
        text:
          streak.streak >= streak.best && streak.streak > 0
            ? `Ritual streak at ${streak.streak} days: your best yet. ${streak.shieldsLeft} reserve shield${streak.shieldsLeft === 1 ? "" : "s"} left this week.`
            : `Ritual streak: ${streak.streak} day${streak.streak === 1 ? "" : "s"} (best ${streak.best}). One start-up tomorrow keeps it growing.`,
        tone: streak.streak > 0 ? "up" : "neutral",
        href: "/today",
        weight: 50,
      });
    }

    // ═════════════════════════════════════════════════════════════════════
    // EXECUTION · 12-week cycles, tactics, habits, Big 3
    // ═════════════════════════════════════════════════════════════════════
    const goalsByCycle = new Map<string, Doc<"goals">[]>();
    for (const g of goals) {
      if (!g.cycleId) continue;
      const arr = goalsByCycle.get(g.cycleId);
      if (arr) arr.push(g);
      else goalsByCycle.set(g.cycleId, [g]);
    }
    const sortedCycles = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const cycleFor = (ws: string) => sortedCycles.find((c) => c.startDate <= ws && ws <= addDays(c.startDate, 77)) ?? null;
    const execDataCache = new Map<string, ExecData>();
    function execDataFor(c: Doc<"cycles">): ExecData {
      const hit = execDataCache.get(c._id);
      if (hit) return hit;
      const pick = (goalsByCycle.get(c._id) ?? []).filter((g) => c.status === "done" || isActiveCycleGoal(g, c._id));
      const set = new Set<string>(pick.map((g) => g._id));
      const myTactics = tactics.filter((t) => set.has(t.goalId)).sort((a, b) => a.order - b.order);
      const myHabits = habits.filter((h) => h.goalId && set.has(h.goalId) && (h.habitStatus ?? "active") === "active");
      const habitIds = new Set<string>(myHabits.map((h) => h._id));
      const data: ExecData = {
        tactics: myTactics,
        logs: tacticLogs.filter((l) => set.has(l.goalId)),
        habits: myHabits,
        completions: completions.filter((c2) => habitIds.has(c2.habitId)),
      };
      execDataCache.set(c._id, data);
      return data;
    }
    const planByWeek = new Map(weekPlans.map((p) => [p.weekStart, p]));
    const reviewedWeeks = new Set(reviews.filter((r) => r.status === "done").map((r) => r.periodKey));
    const execAll = allWeekStarts.map((ws) => {
      const c = cycleFor(ws);
      if (!c || ws > thisMonday) return null;
      const frozen = planByWeek.get(ws)?.executionScore;
      return frozen ?? weekExecution(execDataFor(c), ws).score;
    });
    const execPrev = execAll.slice(0, weeks);
    const execCur = execAll.slice(weeks);
    const execWeekly = weekStarts.map((weekStart, i) => {
      const plan = planByWeek.get(weekStart);
      const big3 = plan?.big3 ?? [];
      return {
        weekStart,
        score: execCur[i],
        cycleWeek: (() => {
          const c = cycleFor(weekStart);
          return c ? Math.floor(diffDays(c.startDate, weekStart) / 7) + 1 : null;
        })(),
        big3Done: big3.filter((b) => b.done).length,
        big3Total: big3.length,
        reviewed: reviewedWeeks.has(weekStart),
      };
    });
    // The week in progress is still filling up: keep it on the chart, but leave it
    // out of the period average (unless it is the only scored week so far).
    const execCurClosed = execCur.map((s, i) => (weekStarts[i] < thisMonday ? s : null));
    const execAvg = meanOrNull(execCurClosed.some((s) => s != null) ? execCurClosed : execCur);
    const execAvgPrev = meanOrNull(execPrev);
    const big3Done = sum(execWeekly.map((w) => w.big3Done));
    const big3Total = sum(execWeekly.map((w) => w.big3Total));
    const prevPlans = prevWeekStarts.map((ws) => planByWeek.get(ws)?.big3 ?? []);
    const big3RatePrev = pct(sum(prevPlans.map((b) => b.filter((x) => x.done).length)), sum(prevPlans.map((b) => b.length)));

    const { cycle: curCycle } = await currentCycle(ctx, userId, today);
    let goalCards: { _id: Id<"goals">; title: string; pct: number; elapsedPct: number; krs: { title: string; current: number; target: number; unit: string; pct: number }[] }[] = [];
    let cycleInfo: null | { name: string; week: number; phase: string; pct: number; daysLeft: number } = null;
    if (curCycle) {
      const st = cycleState(curCycle, today);
      cycleInfo = { name: curCycle.name, week: st.week, phase: st.phase, pct: st.pct, daysLeft: st.daysLeft };
      goalCards = (goalsByCycle.get(curCycle._id) ?? [])
        .filter((g) => isActiveCycleGoal(g, curCycle._id) || g.goalStatus === "achieved")
        .map((g) => {
          const krs = (g.keyResults ?? []).map((k) => ({ ...k, pct: Math.round(krRatio(k) * 100) }));
          const p = krs.length ? Math.round(sum(krs.map((k) => k.pct)) / krs.length) : Math.round(g.progress ?? 0);
          return { _id: g._id, title: g.title, pct: p, elapsedPct: st.pct, krs };
        });
    }
    const execution = {
      hasCycles: cycles.length > 0,
      cycle: cycleInfo,
      avg: execAvg == null ? null : Math.round(execAvg),
      avgPrev: execAvgPrev == null ? null : Math.round(execAvgPrev),
      big3Rate: pct(big3Done, big3Total),
      big3RatePrev,
      big3Done,
      big3Total,
      reviewsDone: execWeekly.filter((w) => w.reviewed).length,
      weekly: execWeekly,
      goals: goalCards,
    };
    {
      // Last 4 completed, scored weeks vs the 4 before (across period boundaries).
      const scored = execAll.filter((s, i): s is number => s != null && allWeekStarts[i] < thisMonday);
      if (scored.length >= 6) {
        const last = scored.slice(-4);
        const before = scored.slice(-8, -4);
        const a = Math.round(sum(last) / last.length);
        const b = Math.round(sum(before) / before.length);
        const d = a - b;
        insights.push({
          text:
            d === 0
              ? `Execution is holding steady at ${a}% over the last 4 weeks.`
              : `Execution ${d > 0 ? "up" : "down"} ${Math.abs(d)} pts vs the 4 weeks before (${a}% vs ${b}%).` + (a >= 85 ? " That's above the 85% bar." : ""),
          tone: d > 0 ? "up" : d < 0 ? "down" : "neutral",
          href: "/goals",
          weight: 90,
        });
      } else if (execAvg != null) {
        insights.push({
          text: `Average execution this period: ${Math.round(execAvg)}%. The 12-week bar is 85%.`,
          tone: execAvg >= 85 ? "up" : "neutral",
          href: "/goals",
          weight: 60,
        });
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // FOUNDER FLYWHEEL · outreach, pipeline, revenue, promises, scorecard
    // ═════════════════════════════════════════════════════════════════════
    const closeDay = (d: Doc<"deals">) => d.closedDate ?? localYmd(d.closedAt ?? d.stageChangedAt);
    const founderWeekly = weekStarts.map((weekStart) => ({
      weekStart,
      outreach: 0,
      meetings: 0,
      dealsCreated: 0,
      won: 0,
      revenue: 0,
      pipeline: 0,
      promiseDue: 0,
      promiseKept: 0,
      promiseRate: null as number | null,
      scorecardPct: null as number | null,
    }));
    let outreachPrev = 0;
    const outreachPrevWeekly = zeros();
    for (const it of interactions) {
      const isOut = it.kind === "outreach" || it.kind === "followup";
      const isMeet = it.kind === "meeting" || it.kind === "call";
      if (inCur(it.date)) {
        if (isOut) founderWeekly[wi(it.date)].outreach++;
        if (isMeet) founderWeekly[wi(it.date)].meetings++;
      } else if (inPrev(it.date) && isOut) {
        outreachPrev++;
        outreachPrevWeekly[Math.floor(diffDays(prevStart, it.date) / 7)]++;
      }
    }
    let wonCount = 0;
    let lostCount = 0;
    let revenue = 0;
    let revenuePrev = 0;
    let wonPrev = 0;
    let dealsCreated = 0;
    let dealsCreatedPrev = 0;
    for (const d of deals) {
      const created = localYmd(d.createdAt);
      if (inCur(created)) {
        founderWeekly[wi(created)].dealsCreated++;
        dealsCreated++;
      } else if (inPrev(created)) dealsCreatedPrev++;
      if (d.stage === "won") {
        const cd = closeDay(d);
        if (inCur(cd)) {
          founderWeekly[wi(cd)].won++;
          founderWeekly[wi(cd)].revenue += d.value ?? 0;
          wonCount++;
          revenue += d.value ?? 0;
        } else if (inPrev(cd)) {
          wonPrev++;
          revenuePrev += d.value ?? 0;
        }
      } else if (d.stage === "lost" && inCur(closeDay(d))) lostCount++;
    }
    weekStarts.forEach((ws, i) => {
      const end = addDays(ws, 6) < today ? addDays(ws, 6) : today;
      founderWeekly[i].pipeline = sum(
        deals
          .filter((d) => {
            if (localYmd(d.createdAt) > end) return false;
            if (OPEN_STAGES.has(d.stage)) return true;
            return closeDay(d) > end; // closed later → still open at that week's end
          })
          .map((d) => d.value ?? 0),
      );
    });
    const keptOnTime = (c: Doc<"commitments">) =>
      c.status === "done" && (!c.promisedDate || !c.doneDate || c.doneDate <= c.promisedDate);
    const dueIn = (c: Doc<"commitments">, from: string, to: string) =>
      c.direction === "i_owe" &&
      !!c.promisedDate &&
      c.promisedDate >= from &&
      c.promisedDate <= to &&
      (c.status === "done" || c.status === "broken" || (c.status === "open" && c.promisedDate < today));
    weekStarts.forEach((ws, i) => {
      const end = addDays(ws, 6) < today ? addDays(ws, 6) : today;
      const due = commitments.filter((c) => dueIn(c, ws, end));
      const kept = due.filter(keptOnTime).length;
      founderWeekly[i].promiseDue = due.length;
      founderWeekly[i].promiseKept = kept;
      founderWeekly[i].promiseRate = pct(kept, due.length);
    });
    const promiseDue = sum(founderWeekly.map((w) => w.promiseDue));
    const promiseKept = sum(founderWeekly.map((w) => w.promiseKept));
    const prevDue = commitments.filter((c) => dueIn(c, prevStart, prevEnd));
    const promiseRatePrev = pct(prevDue.filter(keptOnTime).length, prevDue.length);
    // Scorecard: share of manual entries on target that week.
    const metricById = new Map(metrics.map((m) => [m._id as string, m]));
    weekStarts.forEach((ws, i) => {
      const entries = metricEntries.filter((e) => e.weekStart === ws && metricById.get(e.metricId)?.active);
      const onTarget = entries.filter((e) => {
        const m = metricById.get(e.metricId)!;
        return m.direction === "up" ? e.value >= m.target : e.value <= m.target;
      }).length;
      founderWeekly[i].scorecardPct = pct(onTarget, entries.length);
    });

    // Content totals (shared with the flywheel).
    const pubDay = (p: Doc<"contentPieces">) => p.publishedOn ?? (p.publishedAt ? localYmd(p.publishedAt) : null);
    const pubCur = pieces.filter((p) => inCur(pubDay(p)));
    const pubPrev = pieces.filter((p) => inPrev(pubDay(p)));
    const perfTotals = (list: Doc<"contentPieces">[]) => {
      let views = 0;
      let follows = 0;
      let leads = 0;
      let measured = 0;
      for (const p of list) {
        const s = bestSnapshot(p);
        if (!s) continue;
        measured++;
        views += s.views ?? 0;
        follows += s.follows ?? 0;
        leads += s.leads ?? 0;
      }
      return { views, follows, leads, measured };
    };
    const perfCur = perfTotals(pubCur);
    const perfPrev = perfTotals(pubPrev);
    const flywheel = [
      { key: "published", label: "Content published", value: pubCur.length, prev: pubPrev.length, money: false },
      { key: "views", label: "Views", value: perfCur.views, prev: perfPrev.views, money: false },
      { key: "follows", label: "Follows", value: perfCur.follows, prev: perfPrev.follows, money: false },
      { key: "leads", label: "Leads", value: perfCur.leads, prev: perfPrev.leads, money: false },
      { key: "deals", label: "Deals created", value: dealsCreated, prev: dealsCreatedPrev, money: false },
      { key: "won", label: "Deals won", value: wonCount, prev: wonPrev, money: false },
      { key: "revenue", label: "Revenue won", value: revenue, prev: revenuePrev, money: true },
    ];
    const openDeals = deals.filter((d) => OPEN_STAGES.has(d.stage));
    const founder = {
      quotaWeekly: settings.outreachQuota * 5,
      quotaDaily: settings.outreachQuota,
      weekly: founderWeekly,
      flywheel,
      contentDeals: deals.filter((d) => d.sourceChannel === "content" && inCur(localYmd(d.createdAt))).length,
      outreach: sum(founderWeekly.map((w) => w.outreach)),
      outreachPrev,
      revenue,
      revenuePrev,
      won: wonCount,
      winRate: pct(wonCount, wonCount + lostCount),
      openPipeline: sum(openDeals.map((d) => d.value ?? 0)),
      openDeals: openDeals.length,
      promiseRate: pct(promiseKept, promiseDue),
      promiseRatePrev,
      promiseDue,
      liveOffers: offers.filter((o) => o.status === "live").length,
      liveCampaigns: campaigns.filter((c) => c.status === "live").length,
      hasData: deals.length > 0 || interactions.length > 0 || commitments.length > 0,
    };
    if (revenue > 0 || revenuePrev > 0) {
      insights.push({
        text:
          revenue > 0
            ? `Won ${money(revenue, currency)} across ${wonCount} deal${wonCount === 1 ? "" : "s"}` +
              (revenuePrev > 0 ? ` (${revenue >= revenuePrev ? "up" : "down"} from ${money(revenuePrev, currency)} the period before).` : ", up from nothing the period before.")
            : `No deals won yet this period (${money(revenuePrev, currency)} the period before). ${openDeals.length} open deal${openDeals.length === 1 ? "" : "s"} worth ${money(founder.openPipeline, currency)} in the pipeline.`,
        tone: revenue >= revenuePrev ? "up" : "down",
        href: "/pipeline",
        weight: 85,
      });
    }
    {
      const lastFour = founderWeekly.slice(-4).filter((w) => w.weekStart < thisMonday || w.outreach >= founder.quotaWeekly);
      if (founder.outreach > 0 && lastFour.length >= 2) {
        const hit = lastFour.filter((w) => w.outreach >= founder.quotaWeekly).length;
        insights.push({
          text: `Outreach hit the weekly quota (${founder.quotaWeekly}) in ${hit} of the last ${lastFour.length} weeks.`,
          tone: hit >= lastFour.length / 2 ? "up" : "down",
          href: "/pipeline",
          weight: 55,
        });
      }
    }
    if (promiseDue >= 3 && founder.promiseRate != null) {
      insights.push({
        text: `You kept ${founder.promiseRate}% of promises on time (${promiseKept} of ${promiseDue}).`,
        tone: founder.promiseRate >= 85 ? "up" : "down",
        href: "/commitments",
        weight: 45,
      });
    }

    // ═════════════════════════════════════════════════════════════════════
    // CONTENT
    // ═════════════════════════════════════════════════════════════════════
    const contentWeekly = weekStarts.map((weekStart) => ({ weekStart, personal: 0, company: 0 }));
    for (const p of pubCur) contentWeekly[wi(pubDay(p)!)][p.brand]++;
    const hookMap = new Map<string, { views: number; n: number; follows: number }>();
    const hold = { low: 0, mid: 0, high: 0, n: 0 };
    let kwSteps = 0;
    for (const p of pubCur) {
      kwSteps += p.kw?.steps?.length ?? 0;
      const s = bestSnapshot(p);
      if (!s) continue;
      const type = (p.hookType || p.kw?.hookFormat || "").trim();
      if (type && s.views != null) {
        const h = hookMap.get(type) ?? { views: 0, n: 0, follows: 0 };
        h.views += s.views;
        h.follows += s.follows ?? 0;
        h.n++;
        hookMap.set(type, h);
      }
      if (s.hold3s != null) {
        hold.n++;
        if (s.hold3s >= 70) hold.high++;
        else if (s.hold3s >= 50) hold.mid++;
        else hold.low++;
      }
    }
    const hookTypes = [...hookMap.entries()]
      .map(([type, h]) => ({ type, avgViews: Math.round(h.views / h.n), avgFollows: r1(h.follows / h.n), count: h.n }))
      .sort((a, b) => b.avgViews - a.avgViews)
      .slice(0, 6);
    const labs = strategies
      .filter((st) => !!st.labStartDate)
      .map((st) => {
        const shorts = pieces.filter((p) => p.brand === st.brand && LAB_SHORTS.has(p.format) && !!pubDay(p));
        const wks = LAB_RAMP.map((target, i) => {
          const s0 = addDays(st.labStartDate!, i * 7);
          const e0 = addDays(s0, 6);
          return { n: i + 1, start: s0, target, done: shorts.filter((p) => pubDay(p)! >= s0 && pubDay(p)! <= e0).length };
        });
        return {
          brand: st.brand,
          start: st.labStartDate!,
          week: Math.floor(diffDays(st.labStartDate!, today) / 7) + 1,
          weeks: wks,
          total: sum(wks.map((w) => w.done)),
          target: sum(LAB_RAMP),
        };
      });
    const swipesCur = swipes.filter((s) => inCur(localYmd(s.createdAt)));
    const outliers = swipesCur.filter((s) => s.views && s.creatorAvgViews).map((s) => s.views! / s.creatorAvgViews!);
    const content = {
      weekly: contentWeekly,
      weeklyTarget: settings.contentWeeklyTarget,
      published: pubCur.length,
      publishedPrev: pubPrev.length,
      personal: pubCur.filter((p) => p.brand === "personal").length,
      company: pubCur.filter((p) => p.brand === "company").length,
      measured: perfCur.measured,
      avgViews: perfCur.measured ? Math.round(perfCur.views / perfCur.measured) : null,
      avgFollows: perfCur.measured ? r1(perfCur.follows / perfCur.measured) : null,
      avgViewsPrev: perfPrev.measured ? Math.round(perfPrev.views / perfPrev.measured) : null,
      hookTypes,
      hold,
      labs,
      swipes: { saved: swipesCur.length, avgOutlier: outliers.length ? r1(sum(outliers) / outliers.length) : null },
      avgKwSteps: pubCur.length ? r1(kwSteps / pubCur.length) : null,
      inProgress: pieces.filter((p) => !pubDay(p) && p.stage !== "idea" && p.stage !== "archived").length,
    };
    if (hookTypes.length >= 2 && hookTypes[0].count >= 2) {
      const best = hookTypes[0];
      insights.push({
        text: `Best hook type: "${best.type}" averages ${compact(best.avgViews)} views across ${best.count} pieces.`,
        tone: "up",
        href: "/content",
        weight: 65,
      });
    } else if (content.published > 0) {
      const target = settings.contentWeeklyTarget * weeks;
      insights.push({
        text: `Shipped ${content.published} piece${content.published === 1 ? "" : "s"} of content (${content.personal} personal, ${content.company} company)${target ? ` against a target of about ${target}` : ""}.`,
        tone: content.published >= content.publishedPrev ? "up" : "down",
        href: "/content",
        weight: 35,
      });
    }

    // ═════════════════════════════════════════════════════════════════════
    // TIME · focus by area, deep work, planned vs actual
    // ═════════════════════════════════════════════════════════════════════
    const liveAreas = areas.filter((a) => !a.archived).sort((a, b) => a.order - b.order);
    const projectById = new Map(projects.map((p) => [p._id as string, p]));
    const sessionDays = focus.map((s) => localYmd(s.endTime));
    const needTasks = new Set<Id<"tasks">>();
    focus.forEach((s, i) => {
      if (!s.lifeAreaId && s.taskId && (inCur(sessionDays[i]) || inPrev(sessionDays[i]))) needTasks.add(s.taskId);
    });
    const taskArea = new Map<string, string>();
    await Promise.all(
      [...needTasks].map(async (id) => {
        const t = await ctx.db.get(id);
        if (t && t.userId === userId) taskArea.set(id, t.lifeAreaId);
      }),
    );
    const areaOfSession = (s: Doc<"focusSessions">): string =>
      s.lifeAreaId ?? (s.taskId ? taskArea.get(s.taskId) : undefined) ?? (s.projectId ? projectById.get(s.projectId)?.lifeAreaId : undefined) ?? "none";
    const areaIdx = new Map(liveAreas.map((a, i) => [a._id as string, i]));
    const OTHER = liveAreas.length; // index for unattributed / archived
    const timeWeekly = weekStarts.map((weekStart) => ({
      weekStart,
      hours: Array.from({ length: liveAreas.length + 1 }, () => 0),
      total: 0,
      planned: 0,
      blocksDone: 0,
      maker: 0,
    }));
    const weekdayMin = Array.from({ length: 7 }, () => 0);
    let focusPrevSec = 0;
    const focusPrevWeekly = zeros();
    focus.forEach((s, i) => {
      const d = sessionDays[i];
      if (inCur(d)) {
        const w = timeWeekly[wi(d)];
        const h = s.duration / 3600;
        w.hours[areaIdx.get(areaOfSession(s)) ?? OTHER] += h;
        w.total += h;
        weekdayMin[(weekday(d) + 6) % 7] += s.duration / 60;
      } else if (inPrev(d)) {
        focusPrevSec += s.duration;
        focusPrevWeekly[Math.floor(diffDays(prevStart, d) / 7)] += s.duration / 3600;
      }
    });
    for (const b of blocks) {
      if (!inCur(b.date) || b.blockType === "free") continue;
      const h = Math.max(0, b.endMin - b.startMin) / 60;
      const w = timeWeekly[wi(b.date)];
      w.planned += h;
      if (b.status === "done") w.blocksDone += h;
      if (b.blockType === "maker") w.maker += h;
    }
    for (const w of timeWeekly) {
      w.hours = w.hours.map(r1);
      w.total = r1(w.total);
      w.planned = r1(w.planned);
      w.blocksDone = r1(w.blocksDone);
      w.maker = r1(w.maker);
    }
    // Weekday averages: divide by how many of that weekday fell in the period so far.
    const weekdayCount = Array.from({ length: 7 }, () => 0);
    for (let k = 0; k < elapsedDays; k++) weekdayCount[(weekday(addDays(start, k)) + 6) % 7]++;
    const weekdayAvg = weekdayMin.map((m, i) => ({ day: WEEKDAY_LABEL[i], avgMin: weekdayCount[i] ? Math.round(m / weekdayCount[i]) : 0 }));
    const hasOther = timeWeekly.some((w) => w.hours[OTHER] > 0);
    const timeAreas = [
      ...liveAreas.map((a, i) => ({
        id: a._id as string,
        name: a.name,
        color: a.color ?? null,
        order: a.order,
        target: a.weeklyHoursTarget ?? null,
        total: r1(sum(timeWeekly.map((w) => w.hours[i]))),
      })),
      ...(hasOther ? [{ id: "none", name: "Unattributed", color: null, order: 999, target: null, total: r1(sum(timeWeekly.map((w) => w.hours[OTHER]))) }] : []),
    ];
    if (!hasOther) for (const w of timeWeekly) w.hours.pop();
    const deepHours = r1(sum(timeWeekly.map((w) => w.total)));
    const auditMin = sum(audit.filter((a) => a.date <= today).map((a) => a.minutes));
    const time = {
      areas: timeAreas,
      weekly: timeWeekly,
      deepHours,
      deepHoursPrev: r1(focusPrevSec / 3600),
      prevWeekly: focusPrevWeekly.map(r1),
      targetTotal: liveAreas.some((a) => a.weeklyHoursTarget) ? sum(liveAreas.map((a) => a.weeklyHoursTarget ?? 0)) : null,
      weekday: weekdayAvg,
      planned: r1(sum(timeWeekly.map((w) => w.planned))),
      blocksDone: r1(sum(timeWeekly.map((w) => w.blocksDone))),
      audit: auditMin
        ? {
            hours: r1(auditMin / 60),
            highValuePct: pct(sum(audit.filter((a) => a.value >= 3).map((a) => a.minutes)), auditMin),
            energizingPct: pct(sum(audit.filter((a) => a.energy === "energizing").map((a) => a.minutes)), auditMin),
            drainingPct: pct(sum(audit.filter((a) => a.energy === "draining").map((a) => a.minutes)), auditMin),
          }
        : null,
    };
    {
      const best = weekdayAvg.reduce((m, d, i) => (d.avgMin > weekdayAvg[m].avgMin ? i : m), 0);
      if (deepHours >= 2 && elapsedDays >= 14 && weekdayAvg[best].avgMin > 0) {
        insights.push({
          text: `Best day of the week for deep work: ${WEEKDAY_FULL[best]} (avg ${r1(weekdayAvg[best].avgMin / 60)}h of focus).`,
          tone: "neutral",
          href: "/focus",
          weight: 70,
        });
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // MIND & BODY · recall, practice, check-ins, habits, notes
    // ═════════════════════════════════════════════════════════════════════
    const mindWeekly = weekStarts.map((weekStart) => ({
      weekStart,
      reviews: 0,
      retention: null as number | null,
      practiceMin: 0,
      energy: null as number | null,
      mood: null as number | null,
      sleep: null as number | null,
      notes: 0,
    }));
    const retAcc = weekStarts.map(() => ({ ok: 0, n: 0 }));
    let reviewsPrev = 0;
    const retPrev = { ok: 0, n: 0 };
    for (const l of recallLogs) {
      const graded = l.state === "review";
      if (inCur(l.date)) {
        const i = wi(l.date);
        mindWeekly[i].reviews++;
        if (graded) {
          retAcc[i].n++;
          if (l.rating >= 2) retAcc[i].ok++;
        }
      } else if (inPrev(l.date)) {
        reviewsPrev++;
        if (graded) {
          retPrev.n++;
          if (l.rating >= 2) retPrev.ok++;
        }
      }
    }
    retAcc.forEach((r, i) => (mindWeekly[i].retention = pct(r.ok, r.n)));
    const retCur = { ok: sum(retAcc.map((r) => r.ok)), n: sum(retAcc.map((r) => r.n)) };
    const laById = new Map(learningAreas.map((a) => [a._id as string, a]));
    const practiceByArea = new Map<string, number>();
    for (const p of practice) {
      if (!inCur(p.date)) continue;
      mindWeekly[wi(p.date)].practiceMin += p.minutes;
      practiceByArea.set(p.learningAreaId, (practiceByArea.get(p.learningAreaId) ?? 0) + p.minutes);
    }
    const weeksElapsed = elapsedDays / 7;
    const practiceAreas = [...practiceByArea.entries()]
      .map(([id, minutes]) => {
        const la = laById.get(id);
        return {
          id,
          name: la?.name ?? "Learning area",
          minutes,
          target: la?.weeklyMinutesTarget ? Math.round(la.weeklyMinutesTarget * weeksElapsed) : null,
        };
      })
      .sort((a, b) => b.minutes - a.minutes);
    // Check-ins
    const ciAcc = weekStarts.map(() => ({ e: [] as number[], m: [] as number[], s: [] as number[] }));
    const sleepEnergy = { hi: [] as number[], lo: [] as number[] };
    let checkInDays = 0;
    for (const d of days) {
      if (!inCur(d.date) || !d.checkIn) continue;
      checkInDays++;
      const a = ciAcc[wi(d.date)];
      if (d.checkIn.energy != null) a.e.push(d.checkIn.energy);
      if (d.checkIn.mood != null) a.m.push(d.checkIn.mood);
      if (d.checkIn.sleepHours != null) a.s.push(d.checkIn.sleepHours);
      if (d.checkIn.sleepHours != null && d.checkIn.energy != null) (d.checkIn.sleepHours >= 7 ? sleepEnergy.hi : sleepEnergy.lo).push(d.checkIn.energy);
    }
    ciAcc.forEach((a, i) => {
      const e = mean(a.e);
      const m = mean(a.m);
      const s = mean(a.s);
      mindWeekly[i].energy = e == null ? null : r1(e);
      mindWeekly[i].mood = m == null ? null : r1(m);
      mindWeekly[i].sleep = s == null ? null : r1(s);
    });
    for (const n of notes) {
      const d = localYmd(n._creationTime);
      if (inCur(d)) mindWeekly[wi(d)].notes++;
    }
    // Habit consistency per habit (done incl. min/stretch vs prorated weekly target).
    const habitRows = activeHabits
      .map((h) => {
        const from = [start, h.startedOn ?? "", habitCreatedDay.get(h._id) ?? ""].sort()[2];
        const activeDays = from > today ? 0 : diffDays(from, today) + 1;
        const target = h.weeklyTarget ?? (h.frequency === "weekly" ? 1 : 7);
        const expected = Math.max(1, Math.round((target * activeDays) / 7));
        const mine = completions.filter((c) => c.habitId === h._id && c.date >= from && c.date <= today);
        const kinds = { done: 0, min: 0, stretch: 0, skip: 0 };
        for (const c of mine) kinds[c.kind ?? "done"]++;
        const done = kinds.done + kinds.min + kinds.stretch;
        return {
          _id: h._id,
          title: h.title,
          done,
          expected,
          pct: Math.min(100, Math.round((done / expected) * 100)),
          full: kinds.done,
          min: kinds.min,
          stretch: kinds.stretch,
          skip: kinds.skip,
          activeDays,
        };
      })
      .filter((h) => h.activeDays > 0)
      .sort((a, b) => b.pct - a.pct);
    const mind = {
      weekly: mindWeekly,
      reviews: sum(mindWeekly.map((w) => w.reviews)),
      reviewsPrev,
      retention: pct(retCur.ok, retCur.n),
      retentionPrev: pct(retPrev.ok, retPrev.n),
      practiceMin: sum(mindWeekly.map((w) => w.practiceMin)),
      practiceAreas,
      checkInDays,
      energyAvg: meanOrNull(mindWeekly.map((w) => w.energy)),
      habits: habitRows,
      habitAvg: habitRows.length ? Math.round(sum(habitRows.map((h) => h.pct)) / habitRows.length) : null,
      notesCreated: sum(mindWeekly.map((w) => w.notes)),
      resourcesFinished: resources.filter((r) => r.finishedAt && inCur(localYmd(r.finishedAt))).length,
    };
    if (sleepEnergy.hi.length >= 3 && sleepEnergy.lo.length >= 3) {
      const hi = r1(mean(sleepEnergy.hi)!);
      const lo = r1(mean(sleepEnergy.lo)!);
      if (Math.abs(hi - lo) >= 0.3) {
        insights.push({
          text: `After 7h+ of sleep your energy averages ${hi}/5, vs ${lo}/5 on shorter nights.`,
          tone: hi > lo ? "up" : "neutral",
          href: "/insights",
          weight: 75,
        });
      }
    }
    if (mind.retention != null && retCur.n >= 10) {
      insights.push({
        text: `Recall retention is ${mind.retention}% over ${retCur.n} graded reviews${mind.retentionPrev != null ? ` (${mind.retentionPrev}% the period before)` : ""}.`,
        tone: mind.retentionPrev == null || mind.retention >= mind.retentionPrev ? "up" : "down",
        href: "/recall",
        weight: 30,
      });
    }
    if (habitRows.length >= 2) {
      const best = habitRows[0];
      const worst = habitRows[habitRows.length - 1];
      if (best.pct - worst.pct >= 25) {
        insights.push({
          text: `Most consistent habit: ${best.title} (${best.pct}%). ${worst.title} is at ${worst.pct}%; try its 2-minute version.`,
          tone: "neutral",
          href: "/habits",
          weight: 42,
        });
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // KPI sparklines (current period, weekly)
    // ═════════════════════════════════════════════════════════════════════
    const kpis = {
      xp: { value: xpPeriod, prev: xpPrev, spark: xpWeekly.map((w) => w.total) },
      streak: { value: streak.streak, best: streak.best, ritualDays: consistency.ritualDays, ritualDaysPrev, spark: consWeekly.map((w) => w.ritualDays) },
      dayScore: { value: consistency.avgScore, prev: consistency.avgScorePrev, spark: consWeekly.map((w) => w.avgScore) },
      execution: { value: execution.avg, prev: execution.avgPrev, spark: execWeekly.map((w) => w.score) },
      revenue: { value: revenue, prev: revenuePrev, spark: founderWeekly.map((w) => w.revenue) },
      content: { value: pubCur.length, prev: pubPrev.length, spark: contentWeekly.map((w) => w.personal + w.company) },
    };

    return {
      range: { weeks, start, today, prevStart, prevEnd, weekStarts, elapsedDays },
      currency,
      kpis,
      growth,
      consistency,
      execution,
      founder,
      content,
      time,
      mind,
      insights: insights
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 6)
        .map(({ text, tone, href }) => ({ text, tone, href })),
    };
  },
});
