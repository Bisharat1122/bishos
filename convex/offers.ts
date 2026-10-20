/**
 * Offers (Hormozi value equation + MAGIC naming).
 *
 * Value = (dream outcome × perceived likelihood) ÷ (time delay × effort).
 * Each input is 1–10 (time & effort: higher = longer/harder = worse), so the
 * raw value spans 0.01 … 100. For display it is normalised to 0–100 on a log
 * scale: norm = (log10(raw) + 2) / 4 × 100  (neutral 5/5/5/5 → 50).
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { awardXp, getSettings, revokeXp, ymdUtc } from "./os";

export const OFFER_LIVE_XP = 30;

export type Scores = { dream: number; likelihood: number; time: number; effort: number };
export const DEFAULT_SCORES: Scores = { dream: 5, likelihood: 5, time: 5, effort: 5 };

const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)));

export function valueRaw(s: Scores) {
  return (clamp(s.dream) * clamp(s.likelihood)) / (clamp(s.time) * clamp(s.effort));
}

export function valueScore(s: Scores | undefined) {
  const raw = valueRaw(s ?? DEFAULT_SCORES);
  return Math.round(Math.max(0, Math.min(100, ((Math.log10(raw) + 2) / 4) * 100)));
}

const statusValidator = v.union(v.literal("draft"), v.literal("testing"), v.literal("live"), v.literal("retired"));
const scoresValidator = v.object({ dream: v.number(), likelihood: v.number(), time: v.number(), effort: v.number() });
const magicValidator = v.object({
  magnet: v.optional(v.string()),
  avatar: v.optional(v.string()),
  goal: v.optional(v.string()),
  interval: v.optional(v.string()),
  container: v.optional(v.string()),
});

const OPEN_STAGES = new Set(["target", "contacted", "booked", "discovery", "proposal", "verbal"]);

async function ownOffer(ctx: QueryCtx | MutationCtx, userId: Id<"users">, id: Id<"offers">) {
  const o = await ctx.db.get(id);
  if (!o || o.userId !== userId) throw new ConvexError("Offer not found");
  return o;
}

function dealStats(deals: Doc<"deals">[]) {
  const won = deals.filter((d) => d.stage === "won");
  const open = deals.filter((d) => OPEN_STAGES.has(d.stage));
  return {
    dealCount: deals.length,
    wonCount: won.length,
    revenue: won.reduce((s, d) => s + (d.value ?? 0), 0),
    openCount: open.length,
    openValue: open.reduce((s, d) => s + (d.value ?? 0), 0),
    winRate: won.length + deals.filter((d) => d.stage === "lost").length
      ? Math.round((won.length / (won.length + deals.filter((d) => d.stage === "lost").length)) * 100)
      : null,
  };
}

/** Offer cards: score + status + linked deal count / revenue. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [offers, deals, campaigns, settings] = await Promise.all([
      ctx.db.query("offers").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("campaigns").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      getSettings(ctx, userId),
    ]);
    const rank = { live: 0, testing: 1, draft: 2, retired: 3 } as const;
    const items = offers
      .map((o) => ({
        ...o,
        score: valueScore(o.scores),
        ...dealStats(deals.filter((d) => d.offerId === o._id)),
        campaignCount: campaigns.filter((c) => c.offerId === o._id).length,
      }))
      .sort((a, b) => rank[a.status] - rank[b.status] || b.createdAt - a.createdAt);
    return { currency: settings.currency, items };
  },
});

/** Lightweight picker list (id, name, status) for selects in other modules. */
export const options = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const offers = await ctx.db.query("offers").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return offers
      .filter((o) => o.status !== "retired")
      .map((o) => ({ _id: o._id, name: o.name, status: o.status, price: o.price }));
  },
});

export const get = query({
  // v.string (not v.id) so a malformed /offers/[id] URL returns null instead of throwing.
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const id = ctx.db.normalizeId("offers", args.id);
    if (!id) return null;
    const offer = await ctx.db.get(id);
    if (!offer || offer.userId !== userId) return null;
    const [deals, campaigns, settings] = await Promise.all([
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("campaigns").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      getSettings(ctx, userId),
    ]);
    const linked = deals.filter((d) => d.offerId === id);
    return {
      offer,
      score: valueScore(offer.scores),
      currency: settings.currency,
      stats: dealStats(linked),
      deals: linked
        .sort((a, b) => (b.lastTouchAt ?? b.createdAt) - (a.lastTouchAt ?? a.createdAt))
        .slice(0, 25)
        .map((d) => ({ _id: d._id, title: d.title, stage: d.stage, value: d.value, closedAt: d.closedAt })),
      campaigns: campaigns
        .filter((c) => c.offerId === id)
        .map((c) => ({ _id: c._id, name: c.name, status: c.status, startDate: c.startDate, endDate: c.endDate })),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    icp: v.optional(v.string()),
    problem: v.optional(v.string()),
    dreamOutcome: v.optional(v.string()),
    price: v.optional(v.number()),
    pricingModel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const name = args.name.trim();
    if (!name) throw new ConvexError("Give the offer a working name.");
    return ctx.db.insert("offers", {
      userId,
      name,
      status: "draft",
      icp: args.icp,
      problem: args.problem,
      dreamOutcome: args.dreamOutcome,
      price: args.price,
      pricingModel: args.pricingModel,
      scores: DEFAULT_SCORES,
      deliverables: [],
      bonuses: [],
      createdAt: Date.now(),
    });
  },
});

const str = v.optional(v.union(v.string(), v.null()));

export const update = mutation({
  args: {
    id: v.id("offers"),
    name: v.optional(v.string()),
    status: v.optional(statusValidator),
    icp: str,
    problem: str,
    dreamOutcome: str,
    proof: str,
    timeToResult: str,
    effortRemoved: str,
    scores: v.optional(scoresValidator),
    deliverables: v.optional(v.array(v.string())),
    bonuses: v.optional(v.array(v.string())),
    guarantee: str,
    price: v.optional(v.union(v.number(), v.null())),
    pricingModel: str,
    urgency: str,
    notes: str,
    magic: v.optional(magicValidator),
    date: v.optional(v.string()), // client-local today (XP ledger)
  },
  handler: async (ctx, { id, date, ...rest }) => {
    const userId = await requireUser(ctx);
    const offer = await ownOffer(ctx, userId, id);
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      if (k === "name") {
        const n = String(val).trim();
        if (!n) throw new ConvexError("The offer needs a name.");
        patch.name = n;
      } else if (k === "scores") {
        const s = val as Scores;
        patch.scores = { dream: clamp(s.dream), likelihood: clamp(s.likelihood), time: clamp(s.time), effort: clamp(s.effort) };
      } else {
        patch[k] = val === null ? undefined : val;
      }
    }
    let wentLive = false;
    if (rest.status && rest.status !== offer.status) {
      const key = `offer-live-${id}`;
      if (rest.status === "live") {
        patch.wentLiveAt = offer.wentLiveAt ?? Date.now();
        wentLive = await awardXp(ctx, userId, key, OFFER_LIVE_XP, `Offer live: ${offer.name}`, date ?? ymdUtc(Date.now()));
      } else if (offer.status === "live" && rest.status !== "retired") {
        // moved back to draft/testing: undo the reward (retiring keeps it — it shipped)
        await revokeXp(ctx, userId, key);
      }
    }
    await ctx.db.patch(id, patch as Partial<Doc<"offers">>);
    return { wentLive, xp: wentLive ? OFFER_LIVE_XP : 0 };
  },
});

export const duplicate = mutation({
  args: { id: v.id("offers") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const src = await ownOffer(ctx, userId, id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, _creationTime, wentLiveAt, ...rest } = src;
    return ctx.db.insert("offers", {
      ...rest,
      name: `${src.name} (copy)`,
      status: "draft",
      createdAt: Date.now(),
    });
  },
});

/** Delete an offer and unlink it from deals and campaigns. */
export const remove = mutation({
  args: { id: v.id("offers") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await ownOffer(ctx, userId, id);
    const [deals, campaigns] = await Promise.all([
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("campaigns").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    for (const d of deals) if (d.offerId === id) await ctx.db.patch(d._id, { offerId: undefined });
    for (const c of campaigns) if (c.offerId === id) await ctx.db.patch(c._id, { offerId: undefined });
    await revokeXp(ctx, userId, `offer-live-${id}`);
    await ctx.db.delete(id);
  },
});
