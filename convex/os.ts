/**
 * Life OS shared helpers (no public functions here).
 *
 * Dates: every Life OS `date` is a client-LOCAL "YYYY-MM-DD" string and every
 * `weekStart` is the local Monday of that week. These helpers do calendar math
 * on those strings in UTC so they are timezone- and DST-safe on the server.
 */
import { MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const DAY_MS = 24 * 60 * 60 * 1000;

const toUtc = (ymd: string) => Date.parse(`${ymd}T00:00:00Z`);
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** ymd + n days. */
export function addDays(ymd: string, n: number): string {
  return fromUtc(toUtc(ymd) + n * DAY_MS);
}

/** Whole days from a to b (b - a). */
export function diffDays(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / DAY_MS);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(ymd: string): number {
  return new Date(toUtc(ymd)).getUTCDay();
}

/** The Monday of the week containing ymd. */
export function mondayOf(ymd: string): string {
  const wd = weekday(ymd);
  return addDays(ymd, wd === 0 ? -6 : 1 - wd);
}

/** Inclusive list of days from a to b. */
export function daysBetween(a: string, b: string): string[] {
  const out: string[] = [];
  const n = diffDays(a, b);
  for (let i = 0; i <= n && i < 400; i++) out.push(addDays(a, i));
  return out;
}

/** "YYYY-MM" for a ymd. */
export const monthKey = (ymd: string) => ymd.slice(0, 7);

/** Rough local day for a timestamp when the client didn't send one (UTC). */
export const ymdUtc = (ms: number) => fromUtc(ms);

// ─────────────────────────────────────────────────────────────────────────
// Settings (single doc per user) with defaults applied.
// ─────────────────────────────────────────────────────────────────────────
export const SETTINGS_DEFAULTS = {
  capacityMin: 330, // Sunsama: ~5.5h of planned work for a 9–5 day
  outreachQuota: 20,
  meetingsGoal: 2,
  contentWeeklyTarget: 1,
  maxActiveGoals: 3,
  maxActiveProjects: 5,
  maxNewHabits: 3,
  annualIncome: 0,
  currency: "USD",
  freeWeekday: 0,
  reviewWeekday: 5,
  workHoursCap: 55,
  celebrate: true,
};

export type Settings = typeof SETTINGS_DEFAULTS & { _id?: Id<"userSettings">; onboardedAt?: number };

export async function getSettings(ctx: QueryCtx | MutationCtx, userId: Id<"users">): Promise<Settings> {
  const doc = await ctx.db
    .query("userSettings")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  const out: Settings = { ...SETTINGS_DEFAULTS };
  if (doc) {
    for (const [k, val] of Object.entries(doc)) {
      if (val !== undefined && k !== "userId" && k !== "_creationTime") (out as Record<string, unknown>)[k] = val;
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// XP — positive reinforcement only. Every reward has a stable key so the same
// action can't be farmed; undoing an action revokes its XP.
// ─────────────────────────────────────────────────────────────────────────
export const XP = {
  startup: 25,
  shutdown: 25,
  checkIn: 10,
  top3Task: 15,
  task: 5,
  habit: 5,
  habitMin: 3,
  routine: 10,
  inboxProcessed: 2,
  commitmentKept: 10,
  outreach: 2,
  dealAdvanced: 10,
  dealWon: 100,
  contentPublished: 40,
  recallCard: 1,
  practice: 10,
  journal: 5,
  weeklyReview: 120,
  monthlyReview: 150,
  quarterlyReview: 300,
  annualReview: 500,
  tactic: 8,
} as const;

export async function awardXp(
  ctx: MutationCtx,
  userId: Id<"users">,
  key: string,
  amount: number,
  reason: string,
  date: string,
) {
  const existing = await ctx.db
    .query("xpLedger")
    .withIndex("by_key", (q) => q.eq("userId", userId).eq("key", key))
    .first();
  if (existing) return false;
  await ctx.db.insert("xpLedger", { userId, key, amount, reason, date, at: Date.now() });
  return true;
}

export async function revokeXp(ctx: MutationCtx, userId: Id<"users">, key: string) {
  const existing = await ctx.db
    .query("xpLedger")
    .withIndex("by_key", (q) => q.eq("userId", userId).eq("key", key))
    .first();
  if (existing) await ctx.db.delete(existing._id);
}

const LEVEL_TITLES = [
  "Starter",
  "Builder",
  "Operator",
  "Closer",
  "Creator",
  "Strategist",
  "Founder",
  "Architect",
  "Visionary",
  "Legend",
];

/** level n starts at 50·(n-1)² XP → L2 50, L3 200, L5 800, L10 4050. */
export function levelFromXp(total: number) {
  const level = Math.floor(Math.sqrt(Math.max(0, total) / 50)) + 1;
  const floor = 50 * (level - 1) ** 2;
  const next = 50 * level ** 2;
  return {
    level,
    title: LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 2))],
    total,
    into: total - floor,
    span: next - floor,
    pct: Math.round(((total - floor) / (next - floor)) * 100),
  };
}

/**
 * Forgiving ritual streak (research: broken streaks hurt, repairable/skippable
 * ones don't). A day "counts" when the start-up or shutdown ritual was done.
 * Free days never break it. Up to `reserves` missed days per Mon–Sun week are
 * absorbed by reserve shields. Today not done yet doesn't break the streak.
 */
export function ritualStreak(
  doneDays: Set<string>,
  freeDays: Set<string>,
  today: string,
  reserves = 2,
): { streak: number; shieldsUsedThisWeek: number; shieldsLeft: number; best: number } {
  let streak = 0;
  let cursor = doneDays.has(today) ? today : addDays(today, -1);
  const used = new Map<string, number>();
  const earliest = doneDays.size ? [...doneDays].sort()[0] : null;
  let guard = 0;
  while (guard++ < 800) {
    // stop once we've walked past the earliest recorded day
    if (!earliest || cursor < earliest) break;
    if (doneDays.has(cursor)) {
      streak++;
    } else if (freeDays.has(cursor)) {
      // free day: neutral
    } else {
      const wk = mondayOf(cursor);
      const u = used.get(wk) ?? 0;
      if (u >= reserves) break;
      used.set(wk, u + 1);
    }
    cursor = addDays(cursor, -1);
  }
  const thisWeek = used.get(mondayOf(today)) ?? 0;

  // best = longest run of done days allowing the same weekly reserves
  const sorted = [...doneDays].sort();
  let best = 0;
  if (sorted.length) {
    let run = 0;
    let wkUsed = new Map<string, number>();
    let d = sorted[0];
    const last = sorted[sorted.length - 1];
    while (d <= last) {
      if (doneDays.has(d)) run++;
      else if (!freeDays.has(d)) {
        const wk = mondayOf(d);
        const u = wkUsed.get(wk) ?? 0;
        if (u >= reserves) {
          best = Math.max(best, run);
          run = 0;
          wkUsed = new Map();
        } else wkUsed.set(wk, u + 1);
      }
      d = addDays(d, 1);
    }
    best = Math.max(best, run, streak);
  }
  return { streak, shieldsUsedThisWeek: thisWeek, shieldsLeft: Math.max(0, reserves - thisWeek), best };
}
