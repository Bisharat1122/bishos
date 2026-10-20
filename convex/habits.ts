import { v, ConvexError } from "convex/values";
import { query, mutation, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { awardXp, revokeXp, XP, addDays, diffDays, mondayOf, getSettings, ymdUtc } from "./os";

const DAY = 24 * 60 * 60 * 1000;
const ymd = (ts: number) => new Date(ts).toISOString().slice(0, 10);

const frequencyValidator = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("custom"),
);

const habitStatusValidator = v.union(
  v.literal("active"),
  v.literal("queued"),
  v.literal("graduated"),
  v.literal("archived"),
);

const timeOfDayValidator = v.union(
  v.literal("morning"),
  v.literal("afternoon"),
  v.literal("evening"),
  v.literal("any"),
);

/** Consecutive-day streak ending today (or yesterday if today not yet done). */
export function computeStreak(dates: Set<string>): number {
  const now = Date.now();
  let cursor = now;
  if (!dates.has(ymd(now))) {
    if (dates.has(ymd(now - DAY))) cursor = now - DAY;
    else return 0;
  }
  let streak = 0;
  while (dates.has(ymd(cursor))) {
    streak++;
    cursor -= DAY;
  }
  return streak;
}

/** UTC day-number for a YYYY-MM-DD string (DST-safe consecutiveness). */
const dayIndex = (d: string) => Math.floor(Date.parse(`${d}T00:00:00Z`) / DAY);

/** Longest consecutive-day run ever achieved — the lifetime best streak. */
export function computeBestStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0;
  const idx = [...dates].map(dayIndex).sort((a, b) => a - b);
  let best = 1;
  let run = 1;
  for (let i = 1; i < idx.length; i++) {
    run = idx[i] - idx[i - 1] === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────────────
// Life OS habit maths (forgiving by design — see reports/Founder life OS):
//  • consistency % (last 30 days) comes first; skips leave the denominator;
//  • the streak survives planned skips and misses that fit inside the
//    week's reserves (rest days for <7/week targets + reserve skips);
//  • a back-fill of yesterday/the day before is a "repair".
// ─────────────────────────────────────────────────────────────────────────

export type HabitKind = "done" | "min" | "stretch" | "skip";
export type HabitRecord = { date: string; kind: HabitKind; repaired: boolean };
export const AUTOMATICITY_DAYS = [30, 60, 90] as const;
const TIME_ORDER: Record<string, number> = { morning: 0, afternoon: 1, evening: 2, any: 3 };

export const isDoneKind = (k: HabitKind | null | undefined) => !!k && k !== "skip";

export const habitStatusOf = (h: Pick<Doc<"habits">, "habitStatus">) => h.habitStatus ?? "active";

export function recordMap(comps: Doc<"habitCompletions">[]): Map<string, HabitRecord> {
  const m = new Map<string, HabitRecord>();
  for (const c of comps) m.set(c.date, { date: c.date, kind: c.kind ?? "done", repaired: !!c.repaired });
  return m;
}

/** Weekly target (default 7 for daily, 1 for weekly) and reserve skips (default 2). */
export function habitPlan(h: Pick<Doc<"habits">, "frequency" | "weeklyTarget" | "reserveSkips">) {
  const def = h.frequency === "weekly" ? 1 : 7;
  const target = Math.max(1, Math.min(7, Math.round(h.weeklyTarget ?? def)));
  const reserves = Math.max(0, Math.min(7, Math.round(h.reserveSkips ?? 2)));
  return { target, reserves, restDays: 7 - target };
}

/** The day the habit "started" for the cap (startedOn, else creation day). */
function startedOf(h: Doc<"habits">, today: string) {
  const s = h.startedOn ?? ymdUtc(h._creationTime);
  return s > today ? today : s;
}

/** First tracked day: start, or an earlier back-filled record. */
export function habitStart(h: Doc<"habits">, map: Map<string, HabitRecord>, today: string) {
  let s = startedOf(h, today);
  for (const d of map.keys()) if (d < s) s = d;
  return s;
}

/** Skips and (past, unlogged) misses inside one Mon–Sun week. */
function weekUsage(map: Map<string, HabitRecord>, start: string, today: string, weekStart: string, exclude?: string) {
  let skips = 0;
  let misses = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    if (d < start || d === exclude) continue;
    const r = map.get(d);
    if (r?.kind === "skip") skips++;
    else if (!r && d < today) misses++;
  }
  return { skips, misses };
}

export type HabitStats = ReturnType<typeof habitStats>;

export function habitStats(h: Doc<"habits">, map: Map<string, HabitRecord>, today: string) {
  const { target, reserves, restDays } = habitPlan(h);
  const start = habitStart(h, map, today);
  const allowance = restDays + reserves; // non-done days a week can absorb

  // Forgiving current streak (counts done-ish days; skips/absorbed misses keep it).
  // A full Mon–Sun week with no log at all (7 misses) always breaks it — otherwise
  // low-target habits (allowance ≥ 7, e.g. 1×/week + 2 reserves) could never break.
  let streak = 0;
  {
    const used = new Map<string, number>();
    const missed = new Map<string, number>();
    let d = map.has(today) ? today : addDays(today, -1);
    let guard = 0;
    while (d >= start && guard++ < 1500) {
      const r = map.get(d);
      if (r && r.kind !== "skip") streak++;
      else {
        const wk = mondayOf(d);
        const n = (used.get(wk) ?? 0) + 1;
        const m = (missed.get(wk) ?? 0) + (r ? 0 : 1);
        if (n > allowance || m >= 7) break;
        used.set(wk, n);
        missed.set(wk, m);
      }
      d = addDays(d, -1);
    }
  }

  // Best forgiving streak (last ~2 years).
  let best = streak;
  {
    let run = 0;
    let used = new Map<string, number>();
    let missed = new Map<string, number>();
    const floor = addDays(today, -730);
    let d = start < floor ? floor : start;
    while (d <= today) {
      const r = map.get(d);
      if (r && r.kind !== "skip") run++;
      else if (d !== today || r) {
        const wk = mondayOf(d);
        const n = (used.get(wk) ?? 0) + 1;
        const m = (missed.get(wk) ?? 0) + (r ? 0 : 1);
        if (n > allowance || m >= 7) {
          best = Math.max(best, run);
          run = 0;
          used = new Map();
          missed = new Map();
        } else {
          used.set(wk, n);
          missed.set(wk, m);
        }
      }
      d = addDays(d, 1);
    }
    best = Math.max(best, run);
  }

  // Consistency: done-ish ÷ (days since start in the last 30 − skip days),
  // scaled to the weekly target. Today only counts once it's logged.
  const winFloor = addDays(today, -29);
  let num = 0;
  let denom = 0;
  for (let d = start > winFloor ? start : winFloor; d <= today; d = addDays(d, 1)) {
    const r = map.get(d);
    if (r?.kind === "skip") continue;
    if (d === today && !r) continue;
    denom++;
    if (r) num++;
  }
  const expected = (denom * target) / 7;
  const consistency = denom === 0 ? 0 : Math.min(100, Math.round((num / Math.max(1, expected)) * 100));

  // This week: shields (reserve skips) left.
  const wk = mondayOf(today);
  const u = weekUsage(map, start, today, wk);
  const over = Math.max(0, u.skips + u.misses - restDays);
  // Mirror habits.log's skip limit: logged skips never exceed `reserves` per week.
  const shieldsLeft = Math.max(0, Math.min(reserves - u.skips, reserves - over));
  let doneThisWeek = 0;
  for (let i = 0; i < 7; i++) if (isDoneKind(map.get(addDays(wk, i))?.kind)) doneThisWeek++;

  // Automaticity check at day 30 / 60 / 90 (latest milestone reached, if unanswered).
  const age = diffDays(start, today);
  const recorded = new Set((h.automaticity ?? []).map((a) => a.day));
  let automaticityDue: number | null = null;
  if (habitStatusOf(h) === "active") {
    const m = [...AUTOMATICITY_DAYS].reverse().find((x) => age >= x);
    if (m && !recorded.has(m)) automaticityDue = m;
  }

  const rt = map.get(today);
  return {
    start,
    target,
    reserves,
    dayNumber: age + 1,
    kindToday: (rt?.kind ?? null) as HabitKind | null,
    repairedToday: !!rt?.repaired,
    streak,
    bestStreak: best,
    consistency,
    doneDays30: num,
    possibleDays30: denom,
    shieldsLeft,
    skipsThisWeek: u.skips,
    doneThisWeek,
    automaticityDue,
  };
}

async function loadRecords(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const comps = await ctx.db
    .query("habitCompletions")
    .withIndex("by_date", (q) => q.eq("userId", userId))
    .collect();
  const by = new Map<string, Doc<"habitCompletions">[]>();
  for (const c of comps) {
    if (!by.has(c.habitId)) by.set(c.habitId, []);
    by.get(c.habitId)!.push(c);
  }
  const out = new Map<string, Map<string, HabitRecord>>();
  for (const [k, list] of by) out.set(k, recordMap(list));
  return out;
}

async function capacityOf(ctx: QueryCtx | MutationCtx, userId: Id<"users">, habits: Doc<"habits">[], today: string) {
  const settings = await getSettings(ctx, userId);
  const since = addDays(today, -29);
  const newActive = habits.filter((h) => habitStatusOf(h) === "active" && startedOf(h, today) >= since).length;
  const max = Math.max(1, settings.maxNewHabits);
  return { newActive, max, full: newActive >= max };
}

const CAP_MESSAGE = (max: number) =>
  `You're already building ${max} new habit${max === 1 ? "" : "s"} this month. Add this one to the queue — it starts as soon as one sticks.`;

/** Habits with today's status, streak, and a 7-day trail. Pass the client-local
 * `today` for timezone-correct "done today" (defaults to the server's UTC day). */
export const list = query({
  args: { today: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const [habits, records] = await Promise.all([
      ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      loadRecords(ctx, userId),
    ]);

    const today = args.today ?? ymd(Date.now());
    const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    const last30 = new Set(Array.from({ length: 30 }, (_, i) => addDays(today, -i)));

    return habits.map((h) => {
      const map = records.get(h._id) ?? new Map<string, HabitRecord>();
      const dates = new Set([...map.values()].filter((r) => r.kind !== "skip").map((r) => r.date));
      const s = habitStats(h, map, today);
      let done30 = 0;
      for (const d of dates) if (last30.has(d)) done30++;
      return {
        ...h,
        completedToday: dates.has(today),
        streak: s.streak,
        bestStreak: Math.max(s.bestStreak, computeBestStreak(dates)),
        total: dates.size,
        rate30: Math.round((done30 / 30) * 100),
        trail: last7.map((d) => ({ date: d, done: dates.has(d), kind: map.get(d)?.kind ?? null })),
        kindToday: s.kindToday,
        consistency: s.consistency,
        shieldsLeft: s.shieldsLeft,
      };
    });
  },
});

/**
 * Today strip (used by the Today page): active habits with today's log kind,
 * forgiving streak, shields left this week, consistency %, anchor, minimum
 * version and goal title. `date` is the client-local day.
 */
export const today = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    const [habits, records, areas] = await Promise.all([
      ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      loadRecords(ctx, userId),
      ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const active = habits.filter((h) => habitStatusOf(h) === "active");
    const goalTitles = new Map<string, string>();
    for (const id of new Set(active.map((h) => h.goalId).filter(Boolean) as Id<"goals">[])) {
      const g = await ctx.db.get(id);
      if (g && g.userId === userId) goalTitles.set(id, g.title);
    }
    const areaById = new Map(areas.map((a) => [a._id as string, a]));
    return active
      .map((h) => {
        const s = habitStats(h, records.get(h._id) ?? new Map(), date);
        const area = areaById.get(h.lifeAreaId);
        return {
          _id: h._id,
          title: h.title,
          kind: s.kindToday,
          done: isDoneKind(s.kindToday),
          repaired: s.repairedToday,
          streak: s.streak,
          shieldsLeft: s.shieldsLeft,
          reserves: s.reserves,
          consistency: s.consistency,
          anchor: h.anchor ?? null,
          minVersion: h.minVersion ?? null,
          stretchVersion: h.stretchVersion ?? null,
          timeOfDay: h.timeOfDay ?? "any",
          weeklyTarget: s.target,
          doneThisWeek: s.doneThisWeek,
          goalId: h.goalId ?? null,
          goalTitle: h.goalId ? goalTitles.get(h.goalId) ?? null : null,
          lifeAreaId: h.lifeAreaId,
          areaName: area?.name ?? null,
          areaColor: area?.color ?? null,
        };
      })
      .sort((a, b) => (TIME_ORDER[a.timeOfDay] ?? 3) - (TIME_ORDER[b.timeOfDay] ?? 3) || a.title.localeCompare(b.title));
  },
});

/** Everything the /habits page needs: every habit with stats + ~17 weeks of records. */
export const board = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const [habits, records, areas] = await Promise.all([
      ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      loadRecords(ctx, userId),
      ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const goalTitles = new Map<string, string>();
    for (const id of new Set(habits.map((h) => h.goalId).filter(Boolean) as Id<"goals">[])) {
      const g = await ctx.db.get(id);
      if (g && g.userId === userId) goalTitles.set(id, g.title);
    }
    const areaById = new Map(areas.map((a) => [a._id as string, a]));
    const floor = addDays(mondayOf(today), -7 * 16);
    const out = habits
      .filter((h) => habitStatusOf(h) !== "archived")
      .map((h) => {
        const map = records.get(h._id) ?? new Map<string, HabitRecord>();
        const s = habitStats(h, map, today);
        const area = areaById.get(h.lifeAreaId);
        return {
          ...h,
          status: habitStatusOf(h),
          stats: s,
          areaName: area?.name ?? null,
          areaColor: area?.color ?? null,
          areaOrder: area?.order ?? 0,
          goalTitle: h.goalId ? goalTitles.get(h.goalId) ?? null : null,
          recent: [...map.values()].filter((r) => r.date >= floor).sort((a, b) => a.date.localeCompare(b.date)),
        };
      })
      .sort(
        (a, b) =>
          (TIME_ORDER[a.timeOfDay ?? "any"] ?? 3) - (TIME_ORDER[b.timeOfDay ?? "any"] ?? 3) ||
          a._creationTime - b._creationTime,
      );
    const capacity = await capacityOf(ctx, userId, habits, today);
    return { habits: out, capacity };
  },
});

/** Full per-habit analytics for its individual page. */
export const detail = query({
  // Plain string so a malformed /habits/<id> URL returns null instead of throwing.
  args: { id: v.string(), today: v.optional(v.string()) },
  handler: async (ctx, { id: rawId, today: todayArg }) => {
    const userId = await requireUser(ctx);
    const id = ctx.db.normalizeId("habits", rawId);
    if (!id) return null;
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) return null;

    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", id))
      .collect();
    const map = recordMap(completions);
    const dates = new Set(completions.filter((c) => c.kind !== "skip").map((c) => c.date));
    const completedDates = [...dates].sort();

    const today = todayArg ?? ymd(Date.now());
    const last30 = new Set(Array.from({ length: 30 }, (_, i) => addDays(today, -i)));
    let done30 = 0;
    for (const d of dates) if (last30.has(d)) done30++;

    // Earliest of creation / first completion → how long we've been tracking.
    const firstMs = completedDates.length
      ? Math.min(habit._creationTime, Date.parse(`${completedDates[0]}T00:00:00Z`))
      : habit._creationTime;
    const daysTracked = Math.max(1, Math.floor((Date.now() - firstMs) / DAY) + 1);

    // Completions per month for the last 6 months.
    const [ty, tm] = today.split("-").map(Number);
    const monthly = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(ty, tm - 1 - (5 - i), 1));
      const key = d.toISOString().slice(0, 7);
      return {
        label: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
        count: completedDates.filter((x) => x.startsWith(key)).length,
      };
    });

    const stats = habitStats(habit, map, today);
    const goal = habit.goalId ? await ctx.db.get(habit.goalId) : null;
    const settings = await getSettings(ctx, userId);

    return {
      habit,
      completedDates,
      completedToday: dates.has(today),
      currentStreak: stats.streak,
      bestStreak: Math.max(stats.bestStreak, computeBestStreak(dates)),
      total: dates.size,
      daysTracked,
      rate30: Math.round((done30 / 30) * 100),
      rateAll: Math.round((dates.size / daysTracked) * 100),
      monthly,
      // Life OS additions
      status: habitStatusOf(habit),
      stats,
      records: [...map.values()].sort((a, b) => a.date.localeCompare(b.date)),
      goalTitle: goal && goal.userId === userId ? goal.title : null,
      maxNewHabits: settings.maxNewHabits,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    frequency: frequencyValidator,
    target: v.optional(v.string()),
    lifeAreaId: v.id("lifeAreas"),
    sectionId: v.optional(v.id("sections")),
    projectId: v.optional(v.id("projects")),
    // Life OS design (all optional; legacy callers keep working)
    anchor: v.optional(v.string()),
    minVersion: v.optional(v.string()),
    stretchVersion: v.optional(v.string()),
    weeklyTarget: v.optional(v.number()),
    reserveSkips: v.optional(v.number()),
    goalId: v.optional(v.id("goals")),
    habitStatus: v.optional(habitStatusValidator),
    startedOn: v.optional(v.string()),
    timeOfDay: v.optional(timeOfDayValidator),
    today: v.optional(v.string()), // client-local today (cap + startedOn)
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const { today: todayArg, habitStatus, startedOn, weeklyTarget, reserveSkips, ...rest } = args;
    const area = await ctx.db.get(args.lifeAreaId);
    if (!area || area.userId !== userId) throw new ConvexError("Pick one of your life areas.");
    if (args.goalId) {
      const g = await ctx.db.get(args.goalId);
      if (!g || g.userId !== userId) throw new ConvexError("That goal no longer exists.");
    }
    const today = todayArg ?? ymd(Date.now());
    // Cap new active habits only for the Life OS flow (explicit status).
    if (habitStatus === "active") {
      const habits = await ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
      const cap = await capacityOf(ctx, userId, habits, today);
      if (cap.full) throw new ConvexError(CAP_MESSAGE(cap.max));
    }
    const status = habitStatus ?? "active";
    const clean = <T>(x: T | undefined) => (typeof x === "string" && !x.trim() ? undefined : x);
    return ctx.db.insert("habits", {
      ...rest,
      anchor: clean(rest.anchor)?.trim(),
      minVersion: clean(rest.minVersion)?.trim(),
      stretchVersion: clean(rest.stretchVersion)?.trim(),
      userId,
      streak: 0,
      weeklyTarget: Math.max(1, Math.min(7, Math.round(weeklyTarget ?? (args.frequency === "weekly" ? 1 : 7)))),
      reserveSkips: Math.max(0, Math.min(7, Math.round(reserveSkips ?? 2))),
      habitStatus: status,
      startedOn: status === "queued" ? undefined : startedOn ?? today,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("habits"),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    frequency: v.optional(frequencyValidator),
    target: v.optional(v.union(v.string(), v.null())),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    sectionId: v.optional(v.union(v.id("sections"), v.null())),
    projectId: v.optional(v.union(v.id("projects"), v.null())),
    // Life OS design fields (null clears)
    anchor: v.optional(v.union(v.string(), v.null())),
    minVersion: v.optional(v.union(v.string(), v.null())),
    stretchVersion: v.optional(v.union(v.string(), v.null())),
    weeklyTarget: v.optional(v.union(v.number(), v.null())),
    reserveSkips: v.optional(v.union(v.number(), v.null())),
    goalId: v.optional(v.union(v.id("goals"), v.null())),
    habitStatus: v.optional(habitStatusValidator),
    startedOn: v.optional(v.union(v.string(), v.null())),
    timeOfDay: v.optional(v.union(timeOfDayValidator, v.null())),
    today: v.optional(v.string()), // client-local today (queue → active)
  },
  handler: async (ctx, { id, today: todayArg, ...rest }) => {
    const userId = await requireUser(ctx);
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) return;
    if (rest.lifeAreaId) {
      const a = await ctx.db.get(rest.lifeAreaId);
      if (!a || a.userId !== userId) throw new ConvexError("Pick one of your life areas.");
    }
    if (rest.goalId) {
      const g = await ctx.db.get(rest.goalId);
      if (!g || g.userId !== userId) throw new ConvexError("That goal no longer exists.");
    }
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      if (typeof val === "string" && k !== "title" && !val.trim()) {
        patch[k] = undefined;
        continue;
      }
      patch[k] = val === null ? undefined : val;
    }
    if (typeof patch.weeklyTarget === "number") patch.weeklyTarget = Math.max(1, Math.min(7, Math.round(patch.weeklyTarget)));
    if (typeof patch.reserveSkips === "number") patch.reserveSkips = Math.max(0, Math.min(7, Math.round(patch.reserveSkips)));

    // Starting a queued habit: respect the new-habit cap and give it a fresh start.
    const from = habitStatusOf(habit);
    if (rest.habitStatus === "active" && from === "queued") {
      const today = todayArg ?? ymd(Date.now());
      const habits = await ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
      const cap = await capacityOf(
        ctx,
        userId,
        habits.filter((h) => h._id !== id),
        today,
      );
      if (cap.full) throw new ConvexError(`You're already building ${cap.max} new habits. Graduate or pause one, then start this.`);
      if (rest.startedOn === undefined) patch.startedOn = today;
    }
    await ctx.db.patch(id, patch);
  },
});

/** Day 30/60/90 automaticity check (1–5). Optionally graduate the habit. */
export const recordAutomaticity = mutation({
  args: { id: v.id("habits"), day: v.number(), score: v.number(), graduate: v.optional(v.boolean()) },
  handler: async (ctx, { id, day, score, graduate }) => {
    const userId = await requireUser(ctx);
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) return;
    const s = Math.max(1, Math.min(5, Math.round(score)));
    const list = (habit.automaticity ?? []).filter((a) => a.day !== day);
    list.push({ day, score: s });
    list.sort((a, b) => a.day - b.day);
    await ctx.db.patch(id, { automaticity: list, ...(graduate ? { habitStatus: "graduated" as const } : {}) });
  },
});

/** Recompute and persist a habit's (forgiving) streak from its completion set. */
export async function refreshStreak(ctx: MutationCtx, id: Id<"habits">, today?: string) {
  const habit = await ctx.db.get(id);
  if (!habit) return;
  const completions = await ctx.db
    .query("habitCompletions")
    .withIndex("by_habit", (q) => q.eq("habitId", id))
    .collect();
  const done = completions.filter((c) => c.kind !== "skip");
  const lastCompletedAt = done.length
    ? Math.max(...done.map((c) => Date.parse(`${c.date}T00:00:00Z`)))
    : undefined;
  const s = habitStats(habit, recordMap(completions), today ?? ymd(Date.now()));
  await ctx.db.patch(id, { streak: s.streak, lastCompletedAt });
}

/** Toggle today's completion for a habit and refresh its streak. */
export const toggleToday = mutation({
  args: { id: v.id("habits"), today: v.optional(v.string()) },
  handler: async (ctx, { id, today: todayArg }) => {
    const userId = await requireUser(ctx);
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) return;
    const today = todayArg ?? ymd(Date.now());

    const existing = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", id))
      .filter((q) => q.eq(q.field("date"), today))
      .first();

    const key = `habit-${id}-${today}`;
    if (existing) {
      await ctx.db.delete(existing._id);
      await revokeXp(ctx, userId, key);
    } else {
      await ctx.db.insert("habitCompletions", { userId, habitId: id, date: today });
      await awardXp(ctx, userId, key, XP.habit, `Habit: ${habit.title}`, today);
    }

    await refreshStreak(ctx, id, today);
  },
});

/**
 * Life OS habit log for a client-LOCAL day: done | min (2-minute version) |
 * stretch | skip (planned reserve skip — keeps the streak) | clear.
 * Back-filling yesterday/the day before counts as a streak "repair".
 * Skips are limited to the week's reserves (throws a friendly ConvexError).
 * Returns the XP gained (for the toast) and whether it was a repair.
 */
export const log = mutation({
  args: {
    id: v.id("habits"),
    date: v.string(),
    kind: v.union(v.literal("done"), v.literal("min"), v.literal("stretch"), v.literal("skip"), v.literal("clear")),
    today: v.optional(v.string()), // client-local today (repair detection)
  },
  handler: async (ctx, { id, date, kind, today }) => {
    const userId = await requireUser(ctx);
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) return { xp: 0, repaired: false };
    if (today && date > today) throw new ConvexError("That day hasn't happened yet — log it when it comes.");
    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", id))
      .collect();
    const existing = completions.find((c) => c.date === date) ?? null;
    const key = `habit-${id}-${date}`;
    const xpOf = (k: HabitKind | undefined | null) => (!k || k === "skip" ? 0 : k === "min" ? XP.habitMin : XP.habit);
    const oldKind: HabitKind | null = existing ? existing.kind ?? "done" : null;
    let xp = 0;
    let repaired = false;

    if (kind === "clear") {
      if (existing) await ctx.db.delete(existing._id);
      await revokeXp(ctx, userId, key);
    } else {
      if (kind === "skip" && oldKind !== "skip") {
        const t = today ?? (date > ymd(Date.now()) ? date : ymd(Date.now()));
        const map = recordMap(completions);
        let start = habitStart(habit, map, t);
        if (date < start) start = date;
        const { reserves, restDays } = habitPlan(habit);
        const u = weekUsage(map, start, t, mondayOf(date), date);
        if (reserves === 0) {
          throw new ConvexError("This habit has no reserve skips. The 2-minute version still counts — try that instead.");
        }
        if (u.skips >= reserves || u.skips + u.misses + 1 - restDays > reserves) {
          throw new ConvexError(
            `You've used this week's ${reserves} reserve skip${reserves === 1 ? "" : "s"}. The 2-minute version keeps your streak alive — and shields refill on Monday.`,
          );
        }
      }
      repaired = !!today && date < today && diffDays(date, today) <= 2;
      if (existing) await ctx.db.patch(existing._id, { kind, repaired: existing.repaired || repaired });
      else await ctx.db.insert("habitCompletions", { userId, habitId: id, date, kind, repaired });
      if (kind === "skip") await revokeXp(ctx, userId, key);
      else {
        if (oldKind && oldKind !== kind) await revokeXp(ctx, userId, key);
        const awarded = await awardXp(ctx, userId, key, xpOf(kind), `Habit: ${habit.title}`, date);
        if (awarded) xp = Math.max(0, xpOf(kind) - xpOf(oldKind));
      }
    }
    await refreshStreak(ctx, id, today);
    return { xp, repaired };
  },
});

/** Toggle a specific day's completion (backfill/correct from the heatmap).
 * Future dates are rejected. */
export const toggleDate = mutation({
  args: { id: v.id("habits"), date: v.string(), today: v.optional(v.string()) },
  handler: async (ctx, { id, date, today }) => {
    const userId = await requireUser(ctx);
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) return;
    if (date > (today ?? ymd(Date.now()))) return; // no marking the future

    const existing = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", id))
      .filter((q) => q.eq(q.field("date"), date))
      .first();

    if (existing) await ctx.db.delete(existing._id);
    else await ctx.db.insert("habitCompletions", { userId, habitId: id, date });

    await refreshStreak(ctx, id, today);
  },
});

export const remove = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) return;
    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", id))
      .collect();
    for (const c of completions) await ctx.db.delete(c._id);
    await ctx.db.delete(id);
  },
});
