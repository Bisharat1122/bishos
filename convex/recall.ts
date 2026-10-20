/**
 * Recall — spaced-repetition cards scheduled with FSRS-4.5.
 *
 * Research (Dunlosky et al. 2013): practice testing + spacing are the two
 * "high utility" learning techniques. FSRS reaches the same retention with
 * fewer reviews than SM-2. Target retention is 90%.
 *
 * Public API (used by Today / weekly review too):
 *   recall.dueCount({ now })                 → number of cards due now
 *   recall.queue({ now, limit?, learningAreaId? }) → session cards (≤30) with button previews
 *   recall.review({ cardId, rating 1–4, date }) → reschedules, logs, +XP.recallCard
 *   recall.stats({ now, date, startOfToday? }) → due/reviewed/retention/7-day forecast
 * `now` is ms from the client so queries stay deterministic — pass a
 * minute-rounded value to avoid needless re-subscriptions.
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, awardXp, revokeXp, DAY_MS, XP } from "./os";

// ═════════════════════════════════════════════════════════════════════════
// FSRS-4.5
// ═════════════════════════════════════════════════════════════════════════

/** FSRS-4.5 default parameters (fitted on ~700M reviews). */
export const FSRS_W = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793,
  0.3246, 1.587, 0.2272, 2.8755,
] as const;
const W = FSRS_W;

export const REQUEST_RETENTION = 0.9;
/** Power forgetting curve: R(t,S) = (1 + FACTOR·t/S)^DECAY. R(S,S) = 0.9 by construction. */
const DECAY = -0.5;
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1; // = 19/81 ≈ 0.2346
const MIN_S = 0.1;
const MAX_S = 36500;
const MAX_IVL = 36500;
const MINUTE = 60_000;

/** Short intraday steps (minutes) before a card graduates to day intervals. */
export const LEARNING_STEPS_MIN = [1, 10];
export const RELEARNING_STEPS_MIN = [10];

export type Rating = 1 | 2 | 3 | 4;
export type FsrsState = "new" | "learning" | "review" | "relearning";

export type MemoryCard = {
  due: number;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  fsrsState: FsrsState;
  lastReview?: number;
  step?: number;
  scheduledDays?: number;
};

export type Scheduled = {
  due: number;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  fsrsState: FsrsState;
  step: number;
  scheduledDays: number; // 0 = an intraday (re)learning step
  elapsedDays: number;
};

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Probability of recall after `elapsedDays` with stability S. */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / stability, DECAY);
}

/**
 * Days until R drops to the requested retention: I = S/FACTOR·(r^(1/DECAY) − 1).
 * With r = 0.9 this is exactly I = S (equivalently S·9·(1/R − 1) in the
 * FSRS v4 notation). Rounded, at least 1 day.
 */
export function nextIntervalDays(stability: number, retention = REQUEST_RETENTION): number {
  const ivl = (stability / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1);
  return clamp(Math.round(ivl), 1, MAX_IVL);
}

/** S0(G) = w[G−1]  → Again 0.49d · Hard 1.40d · Good 3.71d · Easy 13.8d. */
const initStability = (g: Rating) => Math.max(MIN_S, W[g - 1]);
/** D0(G) = w4 − (G − 3)·w5, clamped to [1, 10]. */
const initDifficulty = (g: Rating) => clamp(W[4] - (g - 3) * W[5], 1, 10);
/** D' = D − w6·(G − 3), then mean reversion toward D0(Good): w7·D0(3) + (1 − w7)·D'. */
function nextDifficulty(d: number, g: Rating): number {
  const next = d - W[6] * (g - 3);
  return clamp(W[7] * initDifficulty(3) + (1 - W[7]) * next, 1, 10);
}
/** S'r = S·(e^w8·(11 − D)·S^−w9·(e^(w10·(1−R)) − 1)·hardPenalty·easyBonus + 1). */
function recallStability(d: number, s: number, r: number, g: Rating): number {
  const hardPenalty = g === 2 ? W[15] : 1;
  const easyBonus = g === 4 ? W[16] : 1;
  const inc = Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp((1 - r) * W[10]) - 1) * hardPenalty * easyBonus;
  return clamp(s * (inc + 1), MIN_S, MAX_S);
}
/** S'f = w11·D^−w12·((S + 1)^w13 − 1)·e^(w14·(1−R)), never above the old S. */
function forgetStability(d: number, s: number, r: number): number {
  const sf = W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]);
  return clamp(Math.min(sf, s), MIN_S, MAX_S);
}

/**
 * Next intraday step for a (re)learning card, or null when it graduates.
 * Again → first step · Hard → repeat (avg of first two on step 0) · Good → next
 * step · Easy → graduate.
 */
function stepDelay(steps: number[], step: number, g: Rating): { minutes: number; step: number } | null {
  if (!steps.length) return null;
  const cur = clamp(step, 0, steps.length - 1);
  if (g === 1) return { minutes: steps[0], step: 0 };
  if (g === 2) {
    if (cur === 0) return { minutes: steps.length > 1 ? (steps[0] + steps[1]) / 2 : steps[0] * 1.5, step: 0 };
    return { minutes: steps[cur], step: cur };
  }
  if (g === 3) {
    const nxt = cur + 1;
    return nxt < steps.length ? { minutes: steps[nxt], step: nxt } : null;
  }
  return null;
}

/** Schedule all four ratings at once (so intervals stay ordered Hard < Good < Easy). */
export function previewAll(card: MemoryCard, now: number): Record<Rating, Scheduled> {
  const reps = card.reps + 1;
  const elapsedDays = card.lastReview ? Math.max(0, (now - card.lastReview) / DAY_MS) : 0;
  const atMin = (m: number) => now + Math.round(m * MINUTE);
  const atDays = (d: number) => now + d * DAY_MS;
  const out = {} as Record<Rating, Scheduled>;
  const ratings: Rating[] = [1, 2, 3, 4];

  if (card.fsrsState === "new" || card.fsrsState === "learning" || card.fsrsState === "relearning") {
    const isNew = card.fsrsState === "new";
    const steps = card.fsrsState === "relearning" ? RELEARNING_STEPS_MIN : LEARNING_STEPS_MIN;
    const step = isNew ? 0 : card.step ?? 0;
    const r = isNew ? 1 : retrievability(elapsedDays, card.stability);
    const memory = (g: Rating) => {
      if (isNew) return { s: initStability(g), d: initDifficulty(g) };
      const d = nextDifficulty(card.difficulty, g);
      const s = g === 1 ? forgetStability(card.difficulty, card.stability, r) : recallStability(card.difficulty, card.stability, r, g);
      return { s, d };
    };
    const mem = Object.fromEntries(ratings.map((g) => [g, memory(g)])) as Record<Rating, { s: number; d: number }>;
    // Graduation intervals (Good on the last step, Easy any time).
    const goodGrad = nextIntervalDays(mem[3].s);
    const easyGrad = Math.max(nextIntervalDays(mem[4].s), isNew ? 1 : goodGrad + 1);
    for (const g of ratings) {
      const { s, d } = mem[g];
      // A brand-new card answered Easy skips the steps; otherwise follow the steps.
      const sd = g === 4 ? null : stepDelay(steps, step, g);
      if (sd) {
        out[g] = {
          due: atMin(sd.minutes),
          stability: s,
          difficulty: d,
          reps,
          lapses: card.lapses,
          fsrsState: card.fsrsState === "relearning" ? "relearning" : "learning",
          step: sd.step,
          scheduledDays: 0,
          elapsedDays,
        };
      } else {
        const ivl = g === 4 ? Math.max(easyGrad, isNew ? 1 : goodGrad + 1) : goodGrad;
        out[g] = { due: atDays(ivl), stability: s, difficulty: d, reps, lapses: card.lapses, fsrsState: "review", step: 0, scheduledDays: ivl, elapsedDays };
      }
    }
    return out;
  }

  // Review state: forgetting curve decides how much a successful recall is worth.
  const r = retrievability(elapsedDays, card.stability);
  const sAgain = forgetStability(card.difficulty, card.stability, r);
  const sHard = recallStability(card.difficulty, card.stability, r, 2);
  const sGood = recallStability(card.difficulty, card.stability, r, 3);
  const sEasy = recallStability(card.difficulty, card.stability, r, 4);
  let hardIvl = nextIntervalDays(sHard);
  let goodIvl = nextIntervalDays(sGood);
  hardIvl = Math.min(hardIvl, goodIvl);
  goodIvl = Math.max(goodIvl, hardIvl + 1);
  const easyIvl = Math.max(nextIntervalDays(sEasy), goodIvl + 1);
  out[1] = {
    due: atMin(RELEARNING_STEPS_MIN[0] ?? 10),
    stability: sAgain,
    difficulty: nextDifficulty(card.difficulty, 1),
    reps,
    lapses: card.lapses + 1,
    fsrsState: "relearning",
    step: 0,
    scheduledDays: 0,
    elapsedDays,
  };
  const grad = (s: number, g: Rating, ivl: number): Scheduled => ({
    due: atDays(ivl),
    stability: s,
    difficulty: nextDifficulty(card.difficulty, g),
    reps,
    lapses: card.lapses,
    fsrsState: "review",
    step: 0,
    scheduledDays: ivl,
    elapsedDays,
  });
  out[2] = grad(sHard, 2, hardIvl);
  out[3] = grad(sGood, 3, goodIvl);
  out[4] = grad(sEasy, 4, easyIvl);
  return out;
}

export function schedule(card: MemoryCard, rating: Rating, now: number): Scheduled {
  return previewAll(card, now)[rating];
}

/** "1m" · "10m" · "2h" · "4d" · "36d" · "1.6mo" · "1.2y" */
export function fmtInterval(ms: number): string {
  const min = Math.max(1, Math.round(ms / MINUTE));
  if (min < 60) return `${min}m`;
  const h = min / 60;
  if (h < 20) return `${Math.round(h)}h`;
  const d = Math.max(1, Math.round(ms / DAY_MS));
  if (d < 45) return `${d}d`;
  if (d < 365) {
    const mo = d / 30.4;
    return `${mo < 10 ? mo.toFixed(1).replace(/\.0$/, "") : Math.round(mo)}mo`;
  }
  const y = d / 365;
  return `${y < 10 ? y.toFixed(1) : Math.round(y)}y`;
}

/*
 * Mental unit checks (default weights, R target 0.9):
 *  • new → Good: S0 = 3.71, D0 = 5.16, step 10m; Good again (R≈1) → S ≈ 3.73 → 4d.
 *  • new → Easy: S0 = 13.82 → 14d.   new → Again: 1m, D0 = 7.62.
 *  • review S=3.71 D=5.16 after 4d: R = (1 + 0.2346·4/3.71)^−0.5 ≈ 0.893
 *      Good: inc = e^1.647·5.84·3.71^−0.137·(e^0.112 − 1) ≈ 2.99 → S ≈ 14.8 → 15d
 *      Hard: inc·0.227 ≈ 0.68 → S ≈ 6.2 → 6d ·  Easy: inc·2.88 ≈ 8.6 → S ≈ 35.6 → 36d
 *      Again: S'f = 2.107·5.16^−0.079·(4.71^0.325 − 1)·e^(1.587·0.107) ≈ 1.43 → relearn 10m → 1d
 */

// ═════════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════════

type CardDoc = Doc<"recallCards">;

function previewsFor(card: CardDoc, now: number) {
  const all = previewAll(card, now);
  return ([1, 2, 3, 4] as Rating[]).map((g) => ({
    rating: g,
    due: all[g].due,
    label: fmtInterval(all[g].due - now),
    graduates: all[g].scheduledDays > 0,
  }));
}

async function areaMap(ctx: QueryCtx, userId: Id<"users">) {
  const areas = await ctx.db
    .query("learningAreas")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return new Map(areas.map((a) => [a._id as string, a]));
}

/** Round-robin across learning areas so a session mixes topics (interleaving). */
function interleave<T>(items: T[], keyOf: (t: T) => string): T[] {
  const buckets = new Map<string, T[]>();
  for (const it of items) {
    const k = keyOf(it);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(it);
  }
  const lists = [...buckets.values()];
  const out: T[] = [];
  let i = 0;
  while (out.length < items.length) {
    for (const l of lists) if (i < l.length) out.push(l[i]);
    i++;
  }
  return out;
}

async function dueCards(ctx: QueryCtx, userId: Id<"users">, now: number) {
  const cards = await ctx.db
    .query("recallCards")
    .withIndex("by_user_due", (q) => q.eq("userId", userId).lte("due", now))
    .collect();
  return cards.filter((c) => !c.suspended);
}

const ratingValidator = v.number();

// ═════════════════════════════════════════════════════════════════════════
// Queries
// ═════════════════════════════════════════════════════════════════════════

/** Cards due at `now` (ms, from the client). */
export const dueCount = query({
  args: { now: v.number(), learningAreaId: v.optional(v.id("learningAreas")) },
  handler: async (ctx, { now, learningAreaId }) => {
    const userId = await requireUser(ctx);
    const due = await dueCards(ctx, userId, now);
    return learningAreaId ? due.filter((c) => c.learningAreaId === learningAreaId).length : due.length;
  },
});

/**
 * Today's session: due cards (≤ limit, default 30) mixed across areas.
 * Short-step (learning/relearning) cards first, then reviews (most overdue
 * first), then new cards. Each card carries its 4 button previews.
 */
export const queue = query({
  args: { now: v.number(), limit: v.optional(v.number()), learningAreaId: v.optional(v.id("learningAreas")) },
  handler: async (ctx, { now, limit, learningAreaId }) => {
    const userId = await requireUser(ctx);
    const max = clamp(Math.round(limit ?? 30), 1, 200);
    let due = await dueCards(ctx, userId, now);
    if (learningAreaId) due = due.filter((c) => c.learningAreaId === learningAreaId);
    const areas = await areaMap(ctx, userId);
    const learning = due.filter((c) => c.fsrsState === "learning" || c.fsrsState === "relearning").sort((a, b) => a.due - b.due);
    const reviews = due.filter((c) => c.fsrsState === "review").sort((a, b) => a.due - b.due);
    const fresh = due.filter((c) => c.fsrsState === "new").sort((a, b) => a.createdAt - b.createdAt);
    const key = (c: CardDoc) => (c.learningAreaId as string | undefined) ?? "none";
    const ordered = [...learning, ...interleave(reviews, key), ...interleave(fresh, key)].slice(0, max);

    const noteIds = [...new Set(ordered.map((c) => c.noteId).filter(Boolean))] as Id<"notes">[];
    const notes = new Map<string, string>();
    for (const nid of noteIds) {
      const n = await ctx.db.get(nid);
      if (n && n.userId === userId) notes.set(nid, n.title);
    }
    return ordered.map((c) => {
      const a = c.learningAreaId ? areas.get(c.learningAreaId) : undefined;
      return {
        ...c,
        areaName: a?.name,
        areaColor: a?.color,
        noteTitle: c.noteId ? notes.get(c.noteId) : undefined,
        previews: previewsFor(c, now),
      };
    });
  },
});

/** Card browser. */
export const list = query({
  args: {
    learningAreaId: v.optional(v.id("learningAreas")),
    noteId: v.optional(v.id("notes")),
    resourceId: v.optional(v.id("resources")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    let cards = await ctx.db
      .query("recallCards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (args.learningAreaId) cards = cards.filter((c) => c.learningAreaId === args.learningAreaId);
    if (args.noteId) cards = cards.filter((c) => c.noteId === args.noteId);
    if (args.resourceId) cards = cards.filter((c) => c.resourceId === args.resourceId);
    const areas = await areaMap(ctx, userId);
    return cards
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((c) => ({ ...c, areaName: c.learningAreaId ? areas.get(c.learningAreaId)?.name : undefined }));
  },
});

/**
 * Stats: due now/today, reviewed today, retention (30d, review-state answers
 * that weren't "Again"), 7-day forecast, review streak.
 * `startOfToday` = local midnight in ms (defaults to now − a rolling day split).
 */
export const stats = query({
  args: { now: v.number(), date: v.string(), startOfToday: v.optional(v.number()) },
  handler: async (ctx, { now, date, startOfToday }) => {
    const userId = await requireUser(ctx);
    const cards = (
      await ctx.db
        .query("recallCards")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    ).filter((c) => !c.suspended);
    const sod = startOfToday ?? now - (now % DAY_MS);
    const forecast = Array.from({ length: 7 }, (_, i) => ({ date: addDays(date, i), count: 0 }));
    for (const c of cards) {
      const idx = c.due < sod + DAY_MS ? 0 : Math.floor((c.due - sod) / DAY_MS);
      if (idx >= 0 && idx < 7) forecast[idx].count++;
    }
    const dueNow = cards.filter((c) => c.due <= now).length;

    const since = addDays(date, -119);
    const logs = await ctx.db
      .query("recallLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", since))
      .collect();
    const today = logs.filter((l) => l.date === date);
    const from30 = addDays(date, -29);
    const recent = logs.filter((l) => l.date >= from30);
    const reviewAnswers = recent.filter((l) => l.state === "review");
    const sample = reviewAnswers.length >= 5 ? reviewAnswers : recent;
    const retention = sample.length ? Math.round((sample.filter((l) => l.rating > 1).length / sample.length) * 100) : null;

    // Streak: consecutive days with ≥1 review, ending today (or yesterday if not yet today).
    const days = new Set(logs.map((l) => l.date));
    let streak = 0;
    let cursor = days.has(date) ? date : addDays(date, -1);
    while (days.has(cursor)) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(date, i - 6);
      return { date: d, count: logs.filter((l) => l.date === d).length };
    });

    return {
      total: cards.length,
      newCount: cards.filter((c) => c.fsrsState === "new").length,
      learningCount: cards.filter((c) => c.fsrsState === "learning" || c.fsrsState === "relearning").length,
      reviewCount: cards.filter((c) => c.fsrsState === "review").length,
      matureCount: cards.filter((c) => c.fsrsState === "review" && c.stability >= 21).length,
      dueNow,
      dueToday: forecast[0].count,
      reviewedToday: today.length,
      cardsReviewedToday: new Set(today.map((l) => l.cardId)).size,
      retention,
      retentionSample: sample.length,
      forecast,
      last7,
      streak,
    };
  },
});

// ═════════════════════════════════════════════════════════════════════════
// Mutations
// ═════════════════════════════════════════════════════════════════════════

async function assertLinks(
  ctx: { db: QueryCtx["db"] },
  userId: Id<"users">,
  links: { learningAreaId?: Id<"learningAreas">; noteId?: Id<"notes">; resourceId?: Id<"resources">; skillNodeId?: Id<"skillNodes"> },
) {
  for (const id of [links.learningAreaId, links.noteId, links.resourceId, links.skillNodeId]) {
    if (!id) continue;
    const doc = await ctx.db.get(id);
    if (!doc || (doc as { userId?: Id<"users"> }).userId !== userId) throw new ConvexError("Linked item not found.");
  }
}

/**
 * New cards are due a few minutes in the past: queries compare against the
 * client's minute-rounded `now` (which lags real time by up to ~2 min, more
 * with clock skew), so `due: now` hid a just-created "due now" card.
 */
const NEW_CARD_DUE_LEAD_MS = 10 * MINUTE;

function freshCard(userId: Id<"users">, front: string, back: string, now: number) {
  return {
    userId,
    front: front.trim(),
    back: back.trim(),
    due: now - NEW_CARD_DUE_LEAD_MS,
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    fsrsState: "new" as const,
    createdAt: now,
  };
}

const linkArgs = {
  learningAreaId: v.optional(v.id("learningAreas")),
  noteId: v.optional(v.id("notes")),
  resourceId: v.optional(v.id("resources")),
  skillNodeId: v.optional(v.id("skillNodes")),
};

export const create = mutation({
  args: { front: v.string(), back: v.string(), ...linkArgs },
  handler: async (ctx, { front, back, ...links }) => {
    const userId = await requireUser(ctx);
    if (!front.trim() || !back.trim()) throw new ConvexError("A card needs a question and an answer.");
    await assertLinks(ctx, userId, links);
    return ctx.db.insert("recallCards", { ...freshCard(userId, front, back, Date.now()), ...links });
  },
});

/** Insert approved AI / takeaway proposals in one go. */
export const createMany = mutation({
  args: { cards: v.array(v.object({ front: v.string(), back: v.string() })), ...linkArgs },
  handler: async (ctx, { cards, ...links }) => {
    const userId = await requireUser(ctx);
    await assertLinks(ctx, userId, links);
    const now = Date.now();
    const ids: Id<"recallCards">[] = [];
    for (const c of cards.slice(0, 50)) {
      if (!c.front.trim() || !c.back.trim()) continue;
      ids.push(await ctx.db.insert("recallCards", { ...freshCard(userId, c.front, c.back, now), ...links }));
    }
    return ids;
  },
});

export const update = mutation({
  args: {
    id: v.id("recallCards"),
    front: v.optional(v.string()),
    back: v.optional(v.string()),
    learningAreaId: v.optional(v.union(v.id("learningAreas"), v.null())),
    skillNodeId: v.optional(v.union(v.id("skillNodes"), v.null())),
    suspended: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const card = await ctx.db.get(id);
    if (!card || card.userId !== userId) throw new ConvexError("Card not found.");
    await assertLinks(ctx, userId, {
      learningAreaId: rest.learningAreaId ?? undefined,
      skillNodeId: rest.skillNodeId ?? undefined,
    });
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      patch[k] = val === null ? undefined : typeof val === "string" ? val.trim() : val;
    }
    if (patch.front === "" || patch.back === "") throw new ConvexError("Question and answer can't be empty.");
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("recallCards") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const card = await ctx.db.get(id);
    if (!card || card.userId !== userId) return;
    await ctx.db.delete(id);
  },
});

/** Forget the schedule and start the card again as new. */
export const reset = mutation({
  args: { id: v.id("recallCards") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const card = await ctx.db.get(id);
    if (!card || card.userId !== userId) throw new ConvexError("Card not found.");
    await ctx.db.patch(id, {
      due: Date.now() - NEW_CARD_DUE_LEAD_MS,
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      fsrsState: "new",
      step: undefined,
      scheduledDays: undefined,
      lastReview: undefined,
      lastRating: undefined,
    });
  },
});

/**
 * Grade a card (1 again · 2 hard · 3 good · 4 easy). Reschedules with FSRS,
 * logs to recallLogs and awards XP.recallCard once per card per day
 * (key `recall-<cardId>-<date>`). Returns the updated card + fresh previews.
 */
export const review = mutation({
  args: { cardId: v.id("recallCards"), rating: ratingValidator, date: v.string() },
  handler: async (ctx, { cardId, rating, date }) => {
    const userId = await requireUser(ctx);
    const card = await ctx.db.get(cardId);
    if (!card || card.userId !== userId) throw new ConvexError("Card not found.");
    const g = clamp(Math.round(rating), 1, 4) as Rating;
    const now = Date.now();
    const next = schedule(card, g, now);
    const prev = {
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      reps: card.reps,
      lapses: card.lapses,
      fsrsState: card.fsrsState,
      step: card.step,
      scheduledDays: card.scheduledDays,
      lastReview: card.lastReview,
      lastRating: card.lastRating,
    };
    await ctx.db.patch(cardId, {
      due: next.due,
      stability: next.stability,
      difficulty: next.difficulty,
      reps: next.reps,
      lapses: next.lapses,
      fsrsState: next.fsrsState,
      step: next.step,
      scheduledDays: next.scheduledDays,
      lastReview: now,
      lastRating: g,
    });
    const logId = await ctx.db.insert("recallLogs", {
      userId,
      cardId,
      rating: g,
      date,
      at: now,
      learningAreaId: card.learningAreaId,
      state: card.fsrsState,
      elapsedDays: Math.round(next.elapsedDays * 100) / 100,
      scheduledDays: next.scheduledDays,
      prev,
    });
    const awarded = await awardXp(ctx, userId, `recall-${cardId}-${date}`, XP.recallCard, "Recall card reviewed", date);
    const updated = (await ctx.db.get(cardId))!;
    return {
      logId,
      xp: awarded ? XP.recallCard : 0,
      intervalLabel: fmtInterval(next.due - now),
      // Still in short steps → the session should show it again soon.
      again: next.scheduledDays === 0,
      card: { ...updated, previews: previewsFor(updated, now) },
    };
  },
});

/** Undo a review (misclick): restore the snapshot, drop the log, revoke XP if it was the only one today. */
export const undoReview = mutation({
  args: { logId: v.id("recallLogs") },
  handler: async (ctx, { logId }) => {
    const userId = await requireUser(ctx);
    const log = await ctx.db.get(logId);
    if (!log || log.userId !== userId) throw new ConvexError("Nothing to undo.");
    const card = await ctx.db.get(log.cardId);
    if (card && card.userId === userId && log.prev) {
      const p = log.prev as Partial<CardDoc>;
      await ctx.db.patch(card._id, {
        due: p.due ?? card.due,
        stability: p.stability ?? card.stability,
        difficulty: p.difficulty ?? card.difficulty,
        reps: p.reps ?? card.reps,
        lapses: p.lapses ?? card.lapses,
        fsrsState: p.fsrsState ?? card.fsrsState,
        step: p.step,
        scheduledDays: p.scheduledDays,
        lastReview: p.lastReview,
        lastRating: p.lastRating,
      });
    }
    await ctx.db.delete(logId);
    const others = await ctx.db
      .query("recallLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", log.date))
      .collect();
    if (!others.some((l) => l.cardId === log.cardId)) await revokeXp(ctx, userId, `recall-${log.cardId}-${log.date}`);
    return card ? await ctx.db.get(card._id) : null;
  },
});
