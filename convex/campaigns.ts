/**
 * Marketing campaigns: objective → channels → offer → targets vs results.
 *
 * Results roll up automatically from linked data:
 *   leads         = deals with campaignId
 *   conversations = linked deals at stage ≥ "booked" (booked … won)
 *   deals         = linked deals won · revenue = Σ value of those
 *   content       = contentPieces with campaignId (+ how many are published)
 * Any of leads / conversations / deals / revenue can be overridden manually
 * (stored in `campaigns.results`); clearing the override returns to auto.
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { awardXp, getSettings, revokeXp, ymdUtc } from "./os";

export const CAMPAIGN_LIVE_XP = 20;
export const CAMPAIGN_DONE_XP = 25;

const statusValidator = v.union(
  v.literal("idea"),
  v.literal("planned"),
  v.literal("live"),
  v.literal("paused"),
  v.literal("done"),
);
const brandValidator = v.union(v.literal("personal"), v.literal("company"));
const resultField = v.union(v.literal("leads"), v.literal("conversations"), v.literal("deals"), v.literal("revenue"));

const CONVO_STAGES = new Set(["booked", "discovery", "proposal", "verbal", "won"]);
const PUBLISHED_STAGES = new Set(["published", "repurposing", "measured", "recycle_due"]);

const isPublished = (p: Doc<"contentPieces">) => p.publishedAt != null || PUBLISHED_STAGES.has(p.stage);

export function rollup(c: Doc<"campaigns">, deals: Doc<"deals">[], pieces: Doc<"contentPieces">[]) {
  const linkedDeals = deals.filter((d) => d.campaignId === c._id);
  const linkedPieces = pieces.filter((p) => p.campaignId === c._id);
  const won = linkedDeals.filter((d) => d.stage === "won");
  const auto = {
    leads: linkedDeals.length,
    conversations: linkedDeals.filter((d) => CONVO_STAGES.has(d.stage)).length,
    deals: won.length,
    revenue: won.reduce((s, d) => s + (d.value ?? 0), 0),
  };
  const r = c.results ?? {};
  const results = {
    leads: r.leads ?? auto.leads,
    conversations: r.conversations ?? auto.conversations,
    deals: r.deals ?? auto.deals,
    revenue: r.revenue ?? auto.revenue,
  };
  const overridden = {
    leads: r.leads != null,
    conversations: r.conversations != null,
    deals: r.deals != null,
    revenue: r.revenue != null,
  };
  const content = linkedPieces.length;
  const published = linkedPieces.filter(isPublished).length;
  const spend = c.spend ?? 0;
  return {
    auto,
    results,
    overridden,
    content,
    published,
    costPerLead: spend > 0 && results.leads > 0 ? Math.round((spend / results.leads) * 100) / 100 : null,
    roi: spend > 0 ? Math.round(((results.revenue - spend) / spend) * 100) : null, // %
  };
}

async function ownCampaign(ctx: QueryCtx | MutationCtx, userId: Id<"users">, id: Id<"campaigns">) {
  const c = await ctx.db.get(id);
  if (!c || c.userId !== userId) throw new ConvexError("Campaign not found");
  return c;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [campaigns, deals, pieces, offers, settings] = await Promise.all([
      ctx.db.query("campaigns").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("contentPieces").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("offers").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      getSettings(ctx, userId),
    ]);
    const offerName = new Map(offers.map((o) => [o._id as string, o.name]));
    const items = campaigns
      .map((c) => ({
        ...c,
        offerName: c.offerId ? offerName.get(c.offerId) ?? null : null,
        rollup: rollup(c, deals, pieces),
      }))
      .sort((a, b) => (a.startDate ?? "9999").localeCompare(b.startDate ?? "9999") || b.createdAt - a.createdAt);
    return { currency: settings.currency, items };
  },
});

export const get = query({
  // v.string (not v.id) so a malformed /campaigns/[id] URL returns null instead of throwing.
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const id = ctx.db.normalizeId("campaigns", args.id);
    if (!id) return null;
    const c = await ctx.db.get(id);
    if (!c || c.userId !== userId) return null;
    const [deals, pieces, offers, settings] = await Promise.all([
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("contentPieces").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("offers").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      getSettings(ctx, userId),
    ]);
    const offer = c.offerId ? offers.find((o) => o._id === c.offerId) ?? null : null;
    const dealRow = (d: Doc<"deals">) => ({
      _id: d._id,
      title: d.title,
      stage: d.stage,
      value: d.value,
      nextStep: d.nextStep,
      nextStepDate: d.nextStepDate,
    });
    const pieceRow = (p: Doc<"contentPieces">) => ({
      _id: p._id,
      title: p.title,
      stage: p.stage,
      format: p.format,
      brand: p.brand,
      isHub: p.isHub,
      publishedAt: p.publishedAt,
      published: isPublished(p),
    });
    return {
      campaign: c,
      currency: settings.currency,
      offer: offer ? { _id: offer._id, name: offer.name, status: offer.status, price: offer.price } : null,
      rollup: rollup(c, deals, pieces),
      deals: deals.filter((d) => d.campaignId === id).sort((a, b) => b.createdAt - a.createdAt).map(dealRow),
      content: pieces.filter((p) => p.campaignId === id).sort((a, b) => b.createdAt - a.createdAt).map(pieceRow),
      // candidates to link (not already in a campaign), newest first
      linkableDeals: deals
        .filter((d) => !d.campaignId)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 60)
        .map(dealRow),
      linkableContent: pieces
        .filter((p) => !p.campaignId && p.stage !== "archived")
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 60)
        .map(pieceRow),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    objective: v.optional(v.string()),
    brand: v.optional(brandValidator),
    channels: v.optional(v.array(v.string())),
    offerId: v.optional(v.id("offers")),
    status: v.optional(statusValidator),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    budget: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const name = args.name.trim();
    if (!name) throw new ConvexError("Give the campaign a name.");
    if (args.offerId) {
      const o = await ctx.db.get(args.offerId);
      if (!o || o.userId !== userId) throw new ConvexError("Offer not found");
    }
    if (args.startDate && args.endDate && args.endDate < args.startDate) throw new ConvexError("End date is before the start date.");
    return ctx.db.insert("campaigns", {
      userId,
      name,
      objective: args.objective,
      brand: args.brand,
      channels: args.channels ?? [],
      offerId: args.offerId,
      status: args.status ?? "idea",
      startDate: args.startDate,
      endDate: args.endDate,
      budget: args.budget,
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

const str = v.optional(v.union(v.string(), v.null()));
const num = v.optional(v.union(v.number(), v.null()));

export const update = mutation({
  args: {
    id: v.id("campaigns"),
    name: v.optional(v.string()),
    objective: str,
    brand: v.optional(v.union(brandValidator, v.null())),
    channels: v.optional(v.array(v.string())),
    offerId: v.optional(v.union(v.id("offers"), v.null())),
    startDate: str,
    endDate: str,
    budget: num,
    spend: num,
    targets: v.optional(
      v.object({ leads: v.optional(v.number()), conversations: v.optional(v.number()), deals: v.optional(v.number()) }),
    ),
    revenueTarget: num,
    contentTarget: num,
    notes: str,
    learnings: str,
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const c = await ownCampaign(ctx, userId, id);
    if (rest.offerId) {
      const o = await ctx.db.get(rest.offerId);
      if (!o || o.userId !== userId) throw new ConvexError("Offer not found");
    }
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      if (k === "name") {
        const n = String(val).trim();
        if (!n) throw new ConvexError("The campaign needs a name.");
        patch.name = n;
      } else patch[k] = val === null ? undefined : val;
    }
    const start = (patch.startDate as string | undefined) ?? (rest.startDate === null ? undefined : c.startDate);
    const end = (patch.endDate as string | undefined) ?? (rest.endDate === null ? undefined : c.endDate);
    if (start && end && end < start) throw new ConvexError("End date is before the start date.");
    await ctx.db.patch(id, patch as Partial<Doc<"campaigns">>);
  },
});

/** Override one result number (value) or return it to auto (null). */
export const setResult = mutation({
  args: { id: v.id("campaigns"), field: resultField, value: v.union(v.number(), v.null()) },
  handler: async (ctx, { id, field, value }) => {
    const userId = await requireUser(ctx);
    const c = await ownCampaign(ctx, userId, id);
    const results = { ...(c.results ?? {}) };
    if (value == null) delete results[field];
    else results[field] = value;
    await ctx.db.patch(id, { results: Object.keys(results).length ? results : undefined });
  },
});

/** Move on the status board. Going live and wrapping up earn XP (undo revokes). */
export const setStatus = mutation({
  args: { id: v.id("campaigns"), status: statusValidator, date: v.optional(v.string()) },
  handler: async (ctx, { id, status, date }) => {
    const userId = await requireUser(ctx);
    const c = await ownCampaign(ctx, userId, id);
    if (c.status === status) return { xp: 0 };
    const day = date ?? ymdUtc(Date.now());
    let xp = 0;
    const liveKey = `campaign-live-${id}`;
    const doneKey = `campaign-done-${id}`;
    if (status === "live") {
      if (await awardXp(ctx, userId, liveKey, CAMPAIGN_LIVE_XP, `Campaign live: ${c.name}`, day)) xp += CAMPAIGN_LIVE_XP;
    }
    if (status === "done") {
      if (await awardXp(ctx, userId, doneKey, CAMPAIGN_DONE_XP, `Campaign wrapped: ${c.name}`, day)) xp += CAMPAIGN_DONE_XP;
    } else if (c.status === "done") {
      await revokeXp(ctx, userId, doneKey);
    }
    if (status === "idea" || status === "planned") await revokeXp(ctx, userId, liveKey);
    await ctx.db.patch(id, { status });
    return { xp };
  },
});

/** Link / unlink an existing deal to this campaign (sets deals.campaignId). */
export const linkDeal = mutation({
  args: { id: v.id("campaigns"), dealId: v.id("deals"), link: v.boolean() },
  handler: async (ctx, { id, dealId, link }) => {
    const userId = await requireUser(ctx);
    await ownCampaign(ctx, userId, id);
    const d = await ctx.db.get(dealId);
    if (!d || d.userId !== userId) throw new ConvexError("Deal not found");
    if (link) await ctx.db.patch(dealId, { campaignId: id });
    else if (d.campaignId === id) await ctx.db.patch(dealId, { campaignId: undefined });
  },
});

/** Link / unlink a content piece to this campaign (sets contentPieces.campaignId). */
export const linkContent = mutation({
  args: { id: v.id("campaigns"), pieceId: v.id("contentPieces"), link: v.boolean() },
  handler: async (ctx, { id, pieceId, link }) => {
    const userId = await requireUser(ctx);
    await ownCampaign(ctx, userId, id);
    const p = await ctx.db.get(pieceId);
    if (!p || p.userId !== userId) throw new ConvexError("Content piece not found");
    if (link) await ctx.db.patch(pieceId, { campaignId: id });
    else if (p.campaignId === id) await ctx.db.patch(pieceId, { campaignId: undefined });
  },
});

export const remove = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await ownCampaign(ctx, userId, id);
    const [deals, pieces] = await Promise.all([
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("contentPieces").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    for (const d of deals) if (d.campaignId === id) await ctx.db.patch(d._id, { campaignId: undefined });
    for (const p of pieces) if (p.campaignId === id) await ctx.db.patch(p._id, { campaignId: undefined });
    await revokeXp(ctx, userId, `campaign-live-${id}`);
    await revokeXp(ctx, userId, `campaign-done-${id}`);
    await ctx.db.delete(id);
  },
});

/** Lightweight picker list for other modules (deal drawer, content editor). */
export const options = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db.query("campaigns").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return rows
      .filter((c) => c.status !== "done")
      .map((c) => ({ _id: c._id, name: c.name, status: c.status, brand: c.brand }));
  },
});
