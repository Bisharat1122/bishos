/**
 * Compass: purpose, values, vision (overall + per area), not-to-do list and the
 * year theme (one doc per user), plus Life Area standards / weekly hour targets
 * and the monthly Wheel of Life ratings (`areaRatings`).
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";

async function getDoc(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  return ctx.db.query("compass").withIndex("by_user", (q) => q.eq("userId", userId)).first();
}

async function ensureDoc(ctx: MutationCtx, userId: Id<"users">) {
  const d = await getDoc(ctx, userId);
  if (d) return d;
  const id = await ctx.db.insert("compass", { userId, updatedAt: Date.now() });
  return (await ctx.db.get(id))!;
}

/** "YYYY-MM" ± n months. */
export function shiftMonth(period: string, n: number) {
  const [y, m] = period.split("-").map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [doc, areas] = await Promise.all([
      getDoc(ctx, userId),
      ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    return {
      compass: {
        purpose: doc?.purpose ?? "",
        values: doc?.values ?? [],
        vision: doc?.vision ?? "",
        visionByArea: doc?.visionByArea ?? [],
        notToDo: doc?.notToDo ?? [],
        yearTheme: doc?.yearTheme ?? "",
        updatedAt: doc?.updatedAt,
      },
      areas: areas
        .filter((a) => !a.archived)
        .sort((a, b) => a.order - b.order)
        .map((a) => ({
          _id: a._id,
          name: a.name,
          color: a.color,
          order: a.order,
          icon: a.icon,
          standard: a.standard ?? "",
          weeklyHoursTarget: a.weeklyHoursTarget,
          kind: a.kind,
        })),
    };
  },
});

export const update = mutation({
  args: {
    purpose: v.optional(v.string()),
    values: v.optional(v.array(v.string())),
    vision: v.optional(v.string()),
    notToDo: v.optional(v.array(v.string())),
    yearTheme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const doc = await ensureDoc(ctx, userId);
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, val] of Object.entries(args)) {
      if (val === undefined) continue;
      patch[k] = Array.isArray(val) ? val.map((s) => s.trim()).filter(Boolean).slice(0, 30) : val;
    }
    await ctx.db.patch(doc._id, patch);
  },
});

/** Vision for one life area. Empty text removes it. */
export const setAreaVision = mutation({
  args: { lifeAreaId: v.id("lifeAreas"), text: v.string() },
  handler: async (ctx, { lifeAreaId, text }) => {
    const userId = await requireUser(ctx);
    const area = await ctx.db.get(lifeAreaId);
    if (!area || area.userId !== userId) throw new ConvexError("Life area not found.");
    const doc = await ensureDoc(ctx, userId);
    const rest = (doc.visionByArea ?? []).filter((x) => x.lifeAreaId !== lifeAreaId);
    await ctx.db.patch(doc._id, {
      visionByArea: text.trim() ? [...rest, { lifeAreaId, text }] : rest,
      updatedAt: Date.now(),
    });
  },
});

/** Area standard ("what maintained means") and weekly hours target. */
export const setAreaStandard = mutation({
  args: {
    lifeAreaId: v.id("lifeAreas"),
    standard: v.optional(v.string()),
    weeklyHoursTarget: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, { lifeAreaId, standard, weeklyHoursTarget }) => {
    const userId = await requireUser(ctx);
    const area = await ctx.db.get(lifeAreaId);
    if (!area || area.userId !== userId) throw new ConvexError("Life area not found.");
    const patch: Record<string, unknown> = {};
    if (standard !== undefined) patch.standard = standard.trim() || undefined;
    if (weeklyHoursTarget !== undefined) {
      patch.weeklyHoursTarget =
        weeklyHoursTarget === null ? undefined : Math.max(0, Math.min(100, Math.round(weeklyHoursTarget * 2) / 2));
    }
    await ctx.db.patch(lifeAreaId, patch);
  },
});

/** Archive (or restore) a life area — used by the quarterly "prune" step. */
export const archiveArea = mutation({
  args: { lifeAreaId: v.id("lifeAreas"), archived: v.boolean() },
  handler: async (ctx, { lifeAreaId, archived }) => {
    const userId = await requireUser(ctx);
    const area = await ctx.db.get(lifeAreaId);
    if (!area || area.userId !== userId) throw new ConvexError("Life area not found.");
    await ctx.db.patch(lifeAreaId, { archived: archived || undefined });
  },
});

/**
 * Wheel of Life ratings: `period` (YYYY-MM) and the previous month per area,
 * plus a 12-month history of the average rating.
 */
export const ratings = query({
  args: { period: v.string() },
  handler: async (ctx, { period }) => {
    const userId = await requireUser(ctx);
    const [rows, areas] = await Promise.all([
      ctx.db.query("areaRatings").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const live = areas.filter((a) => !a.archived).sort((a, b) => a.order - b.order);
    const prevPeriod = shiftMonth(period, -1);
    const pick = (p: string) => {
      const out: Record<string, { rating: number; note?: string }> = {};
      for (const r of rows) if (r.period === p) out[r.lifeAreaId] = { rating: r.rating, note: r.note };
      return out;
    };
    const history = Array.from({ length: 12 }, (_, i) => shiftMonth(period, i - 11)).map((p) => {
      const rs = rows.filter((r) => r.period === p && live.some((a) => a._id === r.lifeAreaId));
      return {
        period: p,
        avg: rs.length ? Math.round((rs.reduce((a, r) => a + r.rating, 0) / rs.length) * 10) / 10 : null,
        count: rs.length,
      };
    });
    // Most recent earlier month that has any ratings (for "vs last time").
    const earlier = [...new Set(rows.map((r) => r.period))].filter((p) => p < period).sort().pop() ?? null;
    return {
      period,
      prevPeriod,
      current: pick(period),
      previous: pick(prevPeriod),
      lastRatedPeriod: earlier,
      lastRated: earlier ? pick(earlier) : {},
      areas: live.map((a) => ({ _id: a._id, name: a.name, color: a.color, order: a.order })),
      history,
    };
  },
});

/** Rate one area 1–10 for a month (upsert). */
export const rate = mutation({
  args: {
    lifeAreaId: v.id("lifeAreas"),
    period: v.string(),
    rating: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { lifeAreaId, period, rating, note }) => {
    const userId = await requireUser(ctx);
    const area = await ctx.db.get(lifeAreaId);
    if (!area || area.userId !== userId) throw new ConvexError("Life area not found.");
    if (!/^\d{4}-\d{2}$/.test(period)) throw new ConvexError("Period must be YYYY-MM.");
    const value = Math.max(1, Math.min(10, Math.round(rating)));
    const rows = await ctx.db.query("areaRatings").withIndex("by_area", (q) => q.eq("lifeAreaId", lifeAreaId)).collect();
    const existing = rows.find((r) => r.userId === userId && r.period === period);
    if (existing) {
      await ctx.db.patch(existing._id, { rating: value, ...(note !== undefined ? { note: note.trim() || undefined } : {}) });
    } else {
      await ctx.db.insert("areaRatings", { userId, lifeAreaId, period, rating: value, note: note?.trim() || undefined });
    }
  },
});
