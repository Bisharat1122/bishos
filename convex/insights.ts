/**
 * Energy & wellbeing (module E). Reads days.checkIn, focusSessions,
 * scheduleBlocks, routines/routineRuns, tacticLogs and weekPlans.
 *
 * Burnout "observations" are design proposals from the research report, NOT
 * clinical cutoffs. Responses are protective (rest, less, delegate), never
 * more productivity pressure. This is not a clinical tool.
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, getSettings, monthKey, mondayOf, weekday } from "./os";

const DAY_MS = 24 * 60 * 60 * 1000;
const localYmd = (ms: number, off: number) => new Date(ms - off * 60_000).toISOString().slice(0, 10);
const localHour = (ms: number, off: number) => new Date(ms - off * 60_000).getUTCHours();
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const round1 = (x: number | null) => (x == null ? null : Math.round(x * 10) / 10);

type CheckIn = { date: string; energy: number | null; mood: number | null; sleepHours: number | null; sleepQuality: number | null };

async function loadDays(ctx: QueryCtx, userId: Id<"users">) {
  return ctx.db.query("days").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
}

function checkInsOf(days: Doc<"days">[]): CheckIn[] {
  return days
    .filter((d) => d.checkIn)
    .map((d) => ({
      date: d.date,
      energy: d.checkIn!.energy ?? null,
      mood: d.checkIn!.mood ?? null,
      sleepHours: d.checkIn!.sleepHours ?? null,
      sleepQuality: d.checkIn!.sleepQuality ?? null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function inRange(c: CheckIn[], from: string, to: string) {
  return c.filter((x) => x.date >= from && x.date <= to);
}
const pick = (c: CheckIn[], k: "energy" | "mood" | "sleepHours") => c.map((x) => x[k]).filter((x): x is number => x != null);

/** Energy, mood and sleep analytics + the user's own focus curve. */
export const energy = query({
  args: { today: v.string(), tzOffsetMin: v.optional(v.number()) },
  handler: async (ctx, { today, tzOffsetMin }) => {
    const userId = await requireUser(ctx);
    const off = tzOffsetMin ?? 0;
    const checkIns = checkInsOf(await loadDays(ctx, userId));
    const byDate = new Map(checkIns.map((c) => [c.date, c]));

    const trend = Array.from({ length: 30 }, (_, i) => {
      const date = addDays(today, i - 29);
      const c = byDate.get(date);
      return { date, energy: c?.energy ?? null, mood: c?.mood ?? null, sleepHours: c?.sleepHours ?? null };
    });

    const recent = inRange(checkIns, addDays(today, -89), today);
    // Mon → Sun
    const byWeekday = [1, 2, 3, 4, 5, 6, 0].map((wd) => {
      const xs = recent.filter((c) => weekday(c.date) === wd);
      return { weekday: wd, energy: round1(avg(pick(xs, "energy"))), mood: round1(avg(pick(xs, "mood"))), count: xs.length };
    });
    const pairs = recent
      .filter((c) => c.sleepHours != null && c.energy != null)
      .map((c) => ({ date: c.date, sleep: c.sleepHours!, energy: c.energy! }));

    // Sleep → energy contrast (7h+ vs less), only when both sides have data.
    const rested = pairs.filter((p) => p.sleep >= 7).map((p) => p.energy);
    const short = pairs.filter((p) => p.sleep < 7).map((p) => p.energy);
    const sleepContrast =
      rested.length >= 3 && short.length >= 3
        ? { rested: round1(avg(rested))!, short: round1(avg(short))!, restedN: rested.length, shortN: short.length }
        : null;

    const last7 = inRange(checkIns, addDays(today, -6), today);
    const base = inRange(checkIns, addDays(today, -34), addDays(today, -7));

    // Focus curve: minutes of focus by local start hour (last 60 days).
    const cutoff = Date.parse(`${addDays(today, -59)}T00:00:00Z`) - DAY_MS;
    const sessions = (await ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect()).filter(
      (s) => s.startTime >= cutoff,
    );
    const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, minutes: 0, sessions: 0 }));
    for (const s of sessions) {
      const h = localHour(s.startTime, off);
      byHour[h].minutes += Math.round(s.duration / 60);
      byHour[h].sessions++;
    }
    const totalFocusMin = byHour.reduce((s, b) => s + b.minutes, 0);
    let peak: { start: number; minutes: number } | null = null;
    for (let h = 0; h < 24; h++) {
      const m = byHour[h].minutes + byHour[(h + 1) % 24].minutes;
      if (m > 0 && (!peak || m > peak.minutes)) peak = { start: h, minutes: m };
    }
    const topHours = [...byHour].filter((b) => b.minutes > 0).sort((a, b) => b.minutes - a.minutes).slice(0, 3).map((b) => b.hour);

    return {
      checkInCount: checkIns.length,
      learning: checkIns.length < 14,
      trend,
      byWeekday,
      pairs,
      sleepContrast,
      avg7: { energy: round1(avg(pick(last7, "energy"))), mood: round1(avg(pick(last7, "mood"))), sleep: round1(avg(pick(last7, "sleepHours"))), n: last7.length },
      base28: { energy: round1(avg(pick(base, "energy"))), mood: round1(avg(pick(base, "mood"))), sleep: round1(avg(pick(base, "sleepHours"))), n: base.length },
      focus: { byHour, totalFocusMin, sessions: sessions.length, peak, topHours, enough: sessions.length >= 10 },
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Observations (burnout signals) + protective suggestions
// ─────────────────────────────────────────────────────────────────────────

const SUGGESTIONS: Record<string, { title: string; body: string; href: string; cta: string }> = {
  "lighter-week": {
    title: "Run a lighter week: Top 1, not Top 3",
    body: "Pick one outcome a day for the next few days. Everything else is a bonus, not a debt.",
    href: "/today",
    cta: "Plan today",
  },
  "free-day": {
    title: "Propose a Free Day",
    body: "Block one full day with no work at all — plan it first, then plan the week around it.",
    href: "/week",
    cta: "Open week plan",
  },
  shutdown: {
    title: "Enforce the shutdown",
    body: "Pick a hard stop, run the 10-minute shutdown, then close the laptop. Detachment is what lowers exhaustion.",
    href: "/routines",
    cta: "Open routines",
  },
  "minimum-habits": {
    title: "Switch habits to their minimum versions",
    body: "Log the 2-minute version this week. It counts fully and keeps every streak alive.",
    href: "/habits",
    cta: "Open habits",
  },
  delegate: {
    title: "What can I delegate, automate or drop?",
    body: "Open the time audit, find one low-$ draining task and hand it off, automate it, or delete it.",
    href: "/delegation",
    cta: "Open delegation",
  },
  sleep: {
    title: "Protect tonight's sleep",
    body: "Screens off 30 minutes earlier and run the evening routine. One good night already helps your judgement.",
    href: "/routines",
    cta: "Evening routine",
  },
  talk: {
    title: "Talk to someone",
    body: "Share how the last weeks felt with your co-founder, a partner or a friend. If low mood persists, talk to a professional.",
    href: "#support",
    cta: "Support resources",
  },
};

type Observation = {
  key: string;
  title: string;
  active: boolean;
  enoughData: boolean;
  detail: string;
  kind: string;
  suggest: string[];
};

export const signals = query({
  args: { today: v.string(), weekStart: v.optional(v.string()), tzOffsetMin: v.optional(v.number()) },
  handler: async (ctx, { today, weekStart, tzOffsetMin }) => {
    const userId = await requireUser(ctx);
    const off = tzOffsetMin ?? 0;
    const settings = await getSettings(ctx, userId);
    const cap = settings.workHoursCap || 55;
    const W0 = weekStart ?? mondayOf(today);
    const weeks = [W0, addDays(W0, -7), addDays(W0, -14), addDays(W0, -21)];
    const from = weeks[3];

    const days = await loadDays(ctx, userId);
    const dayByDate = new Map(days.map((d) => [d.date, d]));
    const checkIns = checkInsOf(days);

    // Work minutes per local day: focus sessions + done blocks not already logged as focus.
    const work = new Map<string, number>();
    const add = (d: string, m: number) => work.set(d, (work.get(d) ?? 0) + m);
    const cutoff = Date.parse(`${from}T00:00:00Z`) - DAY_MS;
    for (const s of await ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect()) {
      if (s.startTime < cutoff) continue;
      const d = localYmd(s.startTime, off);
      if (d >= from && d <= today) add(d, s.duration / 60);
    }
    const blocks = await ctx.db
      .query("scheduleBlocks")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", from).lte("date", today))
      .collect();
    for (const b of blocks) if (b.status === "done" && !b.focusSessionId && b.blockType !== "free") add(b.date, Math.max(0, b.endMin - b.startMin));
    const hoursOf = (wk: string) => {
      let m = 0;
      for (let i = 0; i < 7; i++) m += work.get(addDays(wk, i)) ?? 0;
      return Math.round((m / 60) * 10) / 10;
    };
    const hoursByWeek = weeks.slice(0, 3).map((wk) => ({ weekStart: wk, hours: hoursOf(wk) })).reverse();

    // Shutdown completions (core ritual or a shutdown routine).
    const shutdownRoutineIds = new Set(
      (await ctx.db.query("routines").withIndex("by_user", (q) => q.eq("userId", userId)).collect())
        .filter((r) => r.kind === "shutdown")
        .map((r) => r._id as string),
    );
    const runs = await ctx.db
      .query("routineRuns")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", addDays(today, -21)))
      .collect();
    const shutdownDays = new Set(runs.filter((r) => r.completed && shutdownRoutineIds.has(r.routineId)).map((r) => r.date));
    for (const d of days) if (d.shutdownAt) shutdownDays.add(d.date);

    const obs: Observation[] = [];

    // 1 · 55+ h in 2 of the last 3 weeks.
    {
      const heavy = hoursByWeek.filter((w) => w.hours >= cap).length;
      const tracked = hoursByWeek.some((w) => w.hours > 0);
      obs.push({
        key: "long-hours",
        title: `${cap}+ hour weeks`,
        active: heavy >= 2,
        enoughData: tracked,
        detail: tracked
          ? `Last 3 weeks: ${hoursByWeek.map((w) => `${w.hours}h`).join(" · ")} (focus + done blocks).`
          : "Log focus sessions or complete calendar blocks to see your weekly hours.",
        kind: "Long weeks happen when you're building something. Two in a row is a signal to protect recovery — not a failure.",
        suggest: ["lighter-week", "free-day", "delegate"],
      });
    }

    // 2 · Average sleep < 6.5 h (last 7 days).
    {
      const xs = pick(inRange(checkIns, addDays(today, -6), today), "sleepHours");
      const a = avg(xs);
      obs.push({
        key: "short-sleep",
        title: "Short sleep",
        active: xs.length >= 3 && a != null && a < 6.5,
        enoughData: xs.length >= 3,
        detail: xs.length ? `Average ${round1(a)}h over ${xs.length} night${xs.length === 1 ? "" : "s"} this week.` : "Add sleep hours to your morning check-in.",
        kind: "Sleep is the cheapest performance tool you have — and less sleep blurs the judgement your company runs on. One earlier night counts.",
        suggest: ["sleep", "minimum-habits"],
      });
    }

    // 3 · No full free day in 14 days. The 14 COMPLETED days before today — an
    // unfinished today with <30 min logged would otherwise count as "free" every
    // morning — plus today when it's explicitly marked as a free day.
    {
      let free = dayByDate.get(today)?.dayType === "free" ? 1 : 0;
      let workedDays = 0;
      for (let i = 1; i <= 14; i++) {
        const d = addDays(today, -i);
        const m = work.get(d) ?? 0;
        if (m > 0) workedDays++;
        if (dayByDate.get(d)?.dayType === "free" || m < 30) free++;
      }
      obs.push({
        key: "no-free-day",
        title: "No full day off",
        active: free === 0,
        enoughData: workedDays >= 7,
        detail: free === 0 ? "Every one of the last 14 days had logged work." : `${free} rest day${free === 1 ? "" : "s"} in the last 14.`,
        kind: "Rest is part of the work. A real day off restores the energy that long weeks spend.",
        suggest: ["free-day"],
      });
    }

    // 4 · Shutdown done on ≤2 of the last 5 workdays.
    {
      const wd: string[] = [];
      for (let i = 1; wd.length < 5 && i < 14; i++) {
        const d = addDays(today, -i);
        const w = weekday(d);
        if (w >= 1 && w <= 5) wd.push(d);
      }
      const done = wd.filter((d) => shutdownDays.has(d)).length;
      const activeDays = wd.filter((d) => (work.get(d) ?? 0) > 0 || dayByDate.has(d)).length;
      obs.push({
        key: "shutdown",
        title: "Shutdown skipped",
        active: activeDays >= 3 && done <= 2,
        enoughData: activeDays >= 3,
        detail: `Shutdown done on ${done} of the last ${wd.length} workdays.`,
        kind: "A missed shutdown is normal; restart tonight. Even the 1-minute version helps your brain let go of work.",
        suggest: ["shutdown"],
      });
    }

    // 5 · 7-day mood/energy ≥1 point below the 4-week baseline.
    {
      const last7 = inRange(checkIns, addDays(today, -6), today);
      const base = inRange(checkIns, addDays(today, -34), addDays(today, -7));
      const e7 = avg(pick(last7, "energy"));
      const eb = avg(pick(base, "energy"));
      const m7 = avg(pick(last7, "mood"));
      const mb = avg(pick(base, "mood"));
      const enough = pick(last7, "energy").length >= 3 && pick(base, "energy").length >= 7;
      const eDrop = e7 != null && eb != null && eb - e7 >= 1;
      const mDrop = m7 != null && mb != null && mb - m7 >= 1;
      obs.push({
        key: "mood-dip",
        title: "Energy or mood dip",
        active: enough && (eDrop || mDrop),
        enoughData: enough,
        detail: enough
          ? `7-day energy ${round1(e7)} vs ${round1(eb)} baseline · mood ${round1(m7) ?? "–"} vs ${round1(mb) ?? "–"}.`
          : "Needs about a week of check-ins plus a 4-week baseline.",
        kind: "Dips happen to everyone. A lighter few days is a smart response, not a step back.",
        suggest: ["lighter-week", "minimum-habits", "talk"],
      });
    }

    // 6 · Execution falling while hours stay high.
    {
      const logs = await ctx.db
        .query("tacticLogs")
        .withIndex("by_user_week", (q) => q.eq("userId", userId).gte("weekStart", weeks[3]))
        .collect();
      const plans = await ctx.db
        .query("weekPlans")
        .withIndex("by_user_week", (q) => q.eq("userId", userId).gte("weekStart", weeks[3]))
        .collect();
      const execScore = (wk: string): number | null => {
        const ls = logs.filter((l) => l.weekStart === wk);
        const target = ls.reduce((s, l) => s + l.target, 0);
        if (target > 0) return Math.round((ls.reduce((s, l) => s + Math.min(l.done, l.target), 0) / target) * 100);
        const p = plans.find((x) => x.weekStart === wk);
        return p?.executionScore ?? null;
      };
      const [e1, e2, e3] = [execScore(weeks[1]), execScore(weeks[2]), execScore(weeks[3])];
      const prev = avg([e2, e3].filter((x): x is number => x != null));
      const h1 = hoursOf(weeks[1]);
      const enough = e1 != null && prev != null;
      obs.push({
        key: "effort-not-converting",
        title: "Effort not converting",
        active: enough && e1! <= prev! - 15 && h1 >= cap * 0.8,
        enoughData: enough,
        detail: enough ? `Execution ${e1}% last week vs ${Math.round(prev!)}% before, with ${h1}h worked.` : "Needs a few weeks of 12-week tactics.",
        kind: "When hours stay high but results slip, the fix is usually less, not more. Pick the one thing that matters most.",
        suggest: ["delegate", "lighter-week"],
      });
    }

    // 7 · Low mood that persists (≤2 on 5+ of the last 7 check-ins).
    const last7Moods = pick(inRange(checkIns, addDays(today, -6), today), "mood");
    const lowMoodPersistent = last7Moods.filter((m) => m <= 2).length >= 5;
    obs.push({
      key: "low-mood",
      title: "Low mood for several days",
      active: lowMoodPersistent,
      enoughData: last7Moods.length >= 5,
      detail: `${last7Moods.filter((m) => m <= 2).length} low-mood day${last7Moods.filter((m) => m <= 2).length === 1 ? "" : "s"} in the last week.`,
      kind: "You've had a run of hard days. That deserves care — please talk to someone you trust, or a professional.",
      suggest: ["talk", "lighter-week"],
    });

    // 8 · Monthly pulse.
    const pulses = days.filter((d) => d.pulse).sort((a, b) => b.date.localeCompare(a.date));
    const latest = pulses[0] && pulses[0].date >= addDays(today, -45) ? pulses[0] : null;
    {
      const p = latest?.pulse;
      obs.push({
        key: "pulse",
        title: "Burnout pulse",
        active: !!p && (p.exhaustion >= 4 || p.cynicism >= 4 || p.efficacy <= 2),
        enoughData: !!p,
        detail: p ? `Exhaustion ${p.exhaustion}/5 · Detachment ${p.cynicism}/5 · Efficacy ${p.efficacy}/5.` : "Take the 3-question monthly pulse below.",
        kind: "Thank you for answering honestly. Naming it is the first protective step.",
        suggest: ["talk", "lighter-week", "delegate"],
      });
    }

    const active = obs.filter((o) => o.active);
    const recommended = new Set(active.flatMap((o) => o.suggest));
    const suggestions = Object.entries(SUGGESTIONS)
      .map(([key, s]) => ({ key, ...s, recommended: recommended.has(key) }))
      .sort((a, b) => Number(b.recommended) - Number(a.recommended));

    return {
      observations: obs,
      activeCount: active.length,
      suggestions,
      lowMoodPersistent,
      hoursByWeek,
      cap,
      headline:
        active.length === 0
          ? "No warning signs right now. Keep protecting your recovery."
          : "A missed day is normal; restart today. Here's what your data suggests protecting.",
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Monthly 3-question burnout pulse (stored on that day's `days.pulse`)
// ─────────────────────────────────────────────────────────────────────────

export const pulse = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const days = await loadDays(ctx, userId);
    const history = days
      .filter((d) => d.pulse)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 12)
      .map((d) => ({ date: d.date, ...d.pulse! }));
    const current = history.find((h) => monthKey(h.date) === monthKey(today)) ?? null;
    return { due: !current, current, history };
  },
});

export const savePulse = mutation({
  args: { date: v.string(), exhaustion: v.number(), cynicism: v.number(), efficacy: v.number() },
  handler: async (ctx, { date, exhaustion, cynicism, efficacy }) => {
    const userId = await requireUser(ctx);
    const c = (n: number) => Math.max(1, Math.min(5, Math.round(n)));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ConvexError("Invalid date.");
    const p = { exhaustion: c(exhaustion), cynicism: c(cynicism), efficacy: c(efficacy), at: Date.now() };
    const existing = await ctx.db
      .query("days")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();
    if (existing) await ctx.db.patch(existing._id, { pulse: p });
    else await ctx.db.insert("days", { userId, date, pulse: p });
  },
});
