import { v, ConvexError } from "convex/values";
import { query, mutation, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, diffDays, mondayOf } from "./os";

/**
 * Kallaway content system: positioning per brand, creator watchlist, the
 * per-piece workflow (`contentPieces.kw`), the 60-day short-form lab, the
 * weekly long-form track, outlier remixing and the YouTube "1-of-10" rank.
 * Frameworks live as data in lib/kallaway.ts (client).
 */

const brandV = v.union(v.literal("personal"), v.literal("company"));
const LAB_RAMP = [3, 5, 7, 7, 7, 7, 7, 7];
const SHORT_FORMATS = new Set(["short_video", "story"]);

async function strategyDoc(ctx: QueryCtx | MutationCtx, userId: Id<"users">, brand: "personal" | "company") {
  const rows = await ctx.db
    .query("contentStrategy")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return rows.find((r) => r.brand === brand) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────
// Strategy (positioning canvas)
// ─────────────────────────────────────────────────────────────────────────

export const strategy = query({
  args: { brand: brandV },
  handler: async (ctx, { brand }) => {
    const userId = await requireUser(ctx);
    return strategyDoc(ctx, userId, brand);
  },
});

export const strategies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return ctx.db
      .query("contentStrategy")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

const formulaV = v.object({
  id: v.string(),
  topic: v.string(),
  format: v.string(),
  layout: v.string(),
  status: v.union(v.literal("testing"), v.literal("winner"), v.literal("retired")),
});

export const saveStrategy = mutation({
  args: {
    brand: brandV,
    game: v.optional(v.string()),
    kpi: v.optional(v.string()),
    authorityStatement: v.optional(v.string()),
    avatar: v.optional(v.string()),
    pains: v.optional(v.array(v.string())),
    bullseye: v.optional(v.array(v.string())),
    contrarianTakes: v.optional(v.array(v.string())),
    terms: v.optional(v.array(v.string())),
    objects: v.optional(v.array(v.string())),
    uniqueness: v.optional(
      v.object({
        topic: v.optional(v.string()),
        substance: v.optional(v.string()),
        avatar: v.optional(v.string()),
        format: v.optional(v.string()),
        visuals: v.optional(v.string()),
      }),
    ),
    heroPlatform: v.optional(v.string()),
    leadMagnet: v.optional(v.string()),
    leadMagnetType: v.optional(v.string()),
    formulas: v.optional(v.array(formulaV)),
    buckets: v.optional(v.array(v.object({ id: v.string(), name: v.string(), kind: v.string() }))),
    standOut: v.optional(v.array(v.string())),
    pyramidLevel: v.optional(v.string()),
    labStartDate: v.optional(v.union(v.string(), v.null())),
    longFormStartDate: v.optional(v.union(v.string(), v.null())),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { brand, labStartDate, longFormStartDate, ...rest }) => {
    const userId = await requireUser(ctx);
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, val] of Object.entries(rest)) if (val !== undefined) patch[k] = val;
    if (labStartDate !== undefined) patch.labStartDate = labStartDate ? mondayOf(labStartDate) : undefined;
    if (longFormStartDate !== undefined) patch.longFormStartDate = longFormStartDate ? mondayOf(longFormStartDate) : undefined;
    const doc = await strategyDoc(ctx, userId, brand);
    if (doc) await ctx.db.patch(doc._id, patch);
    else await ctx.db.insert("contentStrategy", { userId, brand, ...(patch as { updatedAt: number }) });
  },
});

/** Add one take to the contrarian vault (quick capture from anywhere). */
export const addContrarian = mutation({
  args: { brand: brandV, text: v.string() },
  handler: async (ctx, { brand, text }) => {
    const userId = await requireUser(ctx);
    const t = text.trim();
    if (!t) return;
    const doc = await strategyDoc(ctx, userId, brand);
    if (doc) await ctx.db.patch(doc._id, { contrarianTakes: [...(doc.contrarianTakes ?? []), t], updatedAt: Date.now() });
    else await ctx.db.insert("contentStrategy", { userId, brand, contrarianTakes: [t], updatedAt: Date.now() });
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Creator watchlist
// ─────────────────────────────────────────────────────────────────────────

export const watchlist = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [rows, swipes] = await Promise.all([
      ctx.db.query("creatorWatch").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("swipes").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    return rows
      .map((r) => ({ ...r, swipes: swipes.filter((s) => s.creatorWatchId === r._id || (!!s.creator && s.creator.toLowerCase() === r.name.toLowerCase())).length }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

const watchFields = {
  name: v.optional(v.string()),
  platform: v.optional(v.string()),
  url: v.optional(v.string()),
  followers: v.optional(v.number()),
  avgViews: v.optional(v.number()),
  brand: v.optional(brandV),
  notes: v.optional(v.string()),
  lastCheckedOn: v.optional(v.string()),
};

export const addCreator = mutation({
  args: { ...watchFields, name: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (!args.name.trim()) throw new ConvexError("Give the creator a name.");
    return ctx.db.insert("creatorWatch", { userId, ...args, name: args.name.trim(), createdAt: Date.now() });
  },
});

/** Edit a creator. `undefined` = leave as is; `null` (or "" for text) = clear the field. */
export const updateCreator = mutation({
  args: {
    id: v.id("creatorWatch"),
    name: v.optional(v.string()),
    platform: v.optional(v.union(v.string(), v.null())),
    url: v.optional(v.union(v.string(), v.null())),
    followers: v.optional(v.union(v.number(), v.null())),
    avgViews: v.optional(v.union(v.number(), v.null())),
    brand: v.optional(v.union(brandV, v.null())),
    notes: v.optional(v.union(v.string(), v.null())),
    lastCheckedOn: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { id, name, ...rest }) => {
    const userId = await requireUser(ctx);
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) throw new ConvexError("Creator not found.");
    const patch: Record<string, unknown> = {};
    if (name !== undefined) {
      if (!name.trim()) throw new ConvexError("Give the creator a name.");
      patch.name = name.trim();
    }
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      patch[k] = val === null || (typeof val === "string" && !val.trim()) ? undefined : typeof val === "string" ? val.trim() : val;
    }
    await ctx.db.patch(id, patch);
  },
});

export const removeCreator = mutation({
  args: { id: v.id("creatorWatch") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) return;
    await ctx.db.delete(id);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Per-piece workflow (contentPieces.kw)
// ─────────────────────────────────────────────────────────────────────────

const kwPatchV = v.object({
  gate: v.optional(v.array(v.string())),
  topic: v.optional(v.string()),
  angle: v.optional(v.string()),
  commonBelief: v.optional(v.string()),
  contrarianTake: v.optional(v.string()),
  shockFacts: v.optional(v.array(v.object({ text: v.string(), score: v.number() }))),
  emotion: v.optional(v.string()),
  archetype: v.optional(v.string()),
  hookFormat: v.optional(v.string()),
  lean: v.optional(v.string()),
  interjection: v.optional(v.string()),
  snapback: v.optional(v.string()),
  textHook: v.optional(v.string()),
  keyVisual: v.optional(v.string()),
  visualCategory: v.optional(v.string()),
  audioNote: v.optional(v.string()),
  hookAudit: v.optional(v.array(v.string())),
  structure: v.optional(v.string()),
  visualFormat: v.optional(v.string()),
  storylocks: v.optional(v.array(v.string())),
  lastLine: v.optional(v.string()),
  trustRungs: v.optional(v.array(v.number())),
  ctaRamp: v.optional(v.string()),
  ctaText: v.optional(v.string()),
  packaging: v.optional(v.array(v.string())),
  ytTitle: v.optional(v.string()),
  thumbConcept: v.optional(v.string()),
  firstCaption: v.optional(v.string()),
  series: v.optional(v.string()),
  seriesNo: v.optional(v.number()),
  formulaId: v.optional(v.string()),
  bucketId: v.optional(v.string()),
  weakBricks: v.optional(v.array(v.string())),
  nextFix: v.optional(v.string()),
  steps: v.optional(v.array(v.string())),
  titles: v.optional(v.array(v.string())),
  thumbConcepts: v.optional(v.array(v.string())),
  ytChecks: v.optional(v.array(v.string())),
  stakes: v.optional(v.array(v.string())),
  predictRank: v.optional(v.object({ h1: v.optional(v.number()), d1: v.optional(v.number()), w1: v.optional(v.number()) })),
});

/** Merge a partial workflow patch into the piece (autosave-friendly). */
export const saveKw = mutation({
  args: { id: v.id("contentPieces"), patch: kwPatchV, alsoHook: v.optional(v.boolean()) },
  handler: async (ctx, { id, patch, alsoHook }) => {
    const userId = await requireUser(ctx);
    const p = await ctx.db.get(id);
    if (!p || p.userId !== userId) throw new ConvexError("That piece no longer exists.");
    const kw = { ...(p.kw ?? {}), ...patch };
    const extra: Partial<Doc<"contentPieces">> = {};
    // Keep the piece's main hook in sync with the 3-step builder when asked.
    if (alsoHook) {
      const spoken = [kw.lean, kw.interjection, kw.snapback].filter((x) => x && x.trim()).join(" ");
      if (spoken) extra.hook = spoken;
    }
    await ctx.db.patch(id, { kw, ...extra });
  },
});

/** Remix an outlier swipe: hold chosen bricks, change the rest. */
export const remixFromSwipe = mutation({
  args: {
    swipeId: v.id("swipes"),
    hold: v.array(v.string()),
    title: v.string(),
    brand: brandV,
    format: v.optional(v.string()),
  },
  handler: async (ctx, { swipeId, hold, title, brand, format }) => {
    const userId = await requireUser(ctx);
    const s = await ctx.db.get(swipeId);
    if (!s || s.userId !== userId) throw new ConvexError("That inspiration no longer exists.");
    const b = s.bricks ?? {};
    const keep = new Set(hold);
    const kw: Doc<"contentPieces">["kw"] = {
      topic: keep.has("topic") ? b.topic : undefined,
      angle: keep.has("angle") ? b.angle : undefined,
      structure: keep.has("storyStructure") ? b.storyStructure : undefined,
      visualFormat: keep.has("visualFormat") ? b.visualFormat : undefined,
      keyVisual: keep.has("keyVisuals") ? b.keyVisuals : undefined,
      audioNote: keep.has("audio") ? b.audio : undefined,
      archetype: s.archetype,
      gate: ["validated"],
    };
    const lines = [
      `Remixed from: ${s.title || s.hookText || s.creator || "an outlier"}${s.url ? ` (${s.url})` : ""}`,
      `Held bricks: ${hold.length ? hold.join(", ") : "none"}`,
      keep.has("hookStructure") && (b.hookStructure || s.hookText) ? `Hook structure to reuse: ${b.hookStructure || s.hookText}` : "",
      s.whyItWorked ? `Why it worked: ${s.whyItWorked}` : "",
      s.whatToSteal ? `What to steal: ${s.whatToSteal}` : "",
    ].filter(Boolean);
    const id = await ctx.db.insert("contentPieces", {
      userId,
      title: title.trim() || `Remix · ${s.title ?? s.creator ?? "outlier"}`,
      brand,
      format: format ?? s.format ?? "short_video",
      stage: "brief",
      pillarId: s.pillarId,
      hookType: s.hookType,
      brief: lines.join("\n"),
      swipeIds: [swipeId],
      kw,
      createdAt: Date.now(),
    });
    await ctx.db.patch(swipeId, { used: (s.used ?? 0) + 1, hold });
    return id;
  },
});

/** Save LEGO bricks / hold / archetype on a swipe. */
export const saveBricks = mutation({
  args: {
    swipeId: v.id("swipes"),
    bricks: v.optional(
      v.object({
        topic: v.optional(v.string()),
        angle: v.optional(v.string()),
        hookStructure: v.optional(v.string()),
        storyStructure: v.optional(v.string()),
        visualFormat: v.optional(v.string()),
        keyVisuals: v.optional(v.string()),
        audio: v.optional(v.string()),
      }),
    ),
    hold: v.optional(v.array(v.string())),
    archetype: v.optional(v.string()),
    creatorWatchId: v.optional(v.union(v.id("creatorWatch"), v.null())),
  },
  handler: async (ctx, { swipeId, creatorWatchId, ...rest }) => {
    const userId = await requireUser(ctx);
    const s = await ctx.db.get(swipeId);
    if (!s || s.userId !== userId) throw new ConvexError("That inspiration no longer exists.");
    if (creatorWatchId) {
      const c = await ctx.db.get(creatorWatchId);
      if (!c || c.userId !== userId) throw new ConvexError("Creator not found.");
    }
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) if (val !== undefined) patch[k] = val;
    if (creatorWatchId !== undefined) patch.creatorWatchId = creatorWatchId ?? undefined;
    await ctx.db.patch(swipeId, patch);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Lab + long-form track + iteration
// ─────────────────────────────────────────────────────────────────────────

/** Progress for the 60-day lab (shorts) and the weekly long-form track, per brand. */
export const progress = query({
  args: { today: v.string(), brand: v.optional(brandV) },
  handler: async (ctx, { today, brand }) => {
    const userId = await requireUser(ctx);
    const [rows, pieces] = await Promise.all([
      ctx.db.query("contentStrategy").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("contentPieces").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const published = pieces.filter((p) => !!p.publishedOn && (!brand || p.brand === brand));
    const thisWeek = mondayOf(today);
    const brands: ("personal" | "company")[] = brand ? [brand] : ["personal", "company"];

    return brands.map((b) => {
      const st = rows.find((r) => r.brand === b) ?? null;
      const mine = published.filter((p) => p.brand === b);
      const shorts = mine.filter((p) => SHORT_FORMATS.has(p.format));
      const longs = mine.filter((p) => p.format === "long_video");

      // 60-day lab
      let lab = null as null | {
        start: string;
        week: number;
        weeks: { n: number; start: string; target: number; done: number }[];
        total: number;
        target: number;
        thisWeekDone: number;
        thisWeekTarget: number;
        finished: boolean;
      };
      if (st?.labStartDate) {
        const weeks = LAB_RAMP.map((target, i) => {
          const start = addDays(st.labStartDate!, i * 7);
          const end = addDays(start, 6);
          const done = shorts.filter((p) => p.publishedOn! >= start && p.publishedOn! <= end).length;
          return { n: i + 1, start, target, done };
        });
        const week = Math.floor(diffDays(st.labStartDate, today) / 7) + 1;
        const cur = weeks[Math.min(Math.max(week, 1), 8) - 1];
        lab = {
          start: st.labStartDate,
          week,
          weeks,
          total: weeks.reduce((s, w) => s + w.done, 0),
          target: LAB_RAMP.reduce((a, c) => a + c, 0),
          thisWeekDone: cur.done,
          thisWeekTarget: cur.target,
          finished: week > 8,
        };
      }

      // weekly long-form track: weeks since start with ≥1 long video
      let longForm = null as null | { start: string; weeks: number; shipped: number; streak: number; thisWeek: boolean };
      if (st?.longFormStartDate) {
        const totalWeeks = Math.max(1, Math.floor(diffDays(st.longFormStartDate, today) / 7) + 1);
        const shippedWeeks = new Set(longs.map((p) => mondayOf(p.publishedOn!)));
        let streak = 0;
        let wk = shippedWeeks.has(thisWeek) ? thisWeek : addDays(thisWeek, -7);
        while (shippedWeeks.has(wk) && wk >= st.longFormStartDate) {
          streak++;
          wk = addDays(wk, -7);
        }
        longForm = {
          start: st.longFormStartDate,
          weeks: totalWeeks,
          shipped: [...shippedWeeks].filter((w) => w >= st.longFormStartDate!).length,
          streak,
          thisWeek: shippedWeeks.has(thisWeek),
        };
      }

      // Reps (all-time) — "volume negates luck"; first ~300 one at a time.
      const reps = mine.length;
      return { brand: b, strategy: st, lab, longForm, reps, shortsTotal: shorts.length, longTotal: longs.length };
    });
  },
});

/** Last reps with metrics + "which brick was weak" — the iteration loop. */
export const iteration = query({
  args: { brand: v.optional(brandV), limit: v.optional(v.number()) },
  handler: async (ctx, { brand, limit }) => {
    const userId = await requireUser(ctx);
    const pieces = await ctx.db
      .query("contentPieces")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const pub = pieces
      .filter((p) => !!p.publishedAt && (!brand || p.brand === brand))
      .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
    const best = (p: Doc<"contentPieces">) => {
      const perf = p.performance ?? [];
      return perf.find((s) => s.window === "30d") ?? perf.find((s) => s.window === "7d") ?? perf.find((s) => s.window === "24h") ?? null;
    };
    // 1-of-10 rank within the same format family.
    const rankOf = (p: Doc<"contentPieces">) => {
      const fam = pub.filter((x) => (x.format === "long_video") === (p.format === "long_video"));
      const idx = fam.findIndex((x) => x._id === p._id);
      const window = fam.slice(idx, idx + 10); // this one + the 9 before it
      if (window.length < 3) return null;
      const views = (x: Doc<"contentPieces">) => best(x)?.views ?? 0;
      const sorted = [...window].sort((a, b) => views(b) - views(a));
      return { rank: sorted.findIndex((x) => x._id === p._id) + 1, of: window.length };
    };
    return pub.slice(0, limit ?? 12).map((p) => {
      const snap = best(p);
      return {
        _id: p._id,
        title: p.title,
        brand: p.brand,
        format: p.format,
        publishedOn: p.publishedOn,
        views: snap?.views,
        follows: snap?.follows,
        leads: snap?.leads,
        hold3s: snap?.hold3s,
        ctr: snap?.ctr,
        rank: rankOf(p),
        weakBricks: p.kw?.weakBricks ?? [],
        nextFix: p.kw?.nextFix,
        hasNumbers: !!snap,
      };
    });
  },
});

/**
 * 3-2-1 plan: this week's (Mon–Sun) published pieces per bucket (`kw.bucketId`,
 * "chaos" for the chaos agent), for one brand. `untagged` = published with no bucket.
 */
export const bucketWeek = query({
  args: { today: v.string(), brand: brandV },
  handler: async (ctx, { today, brand }) => {
    const userId = await requireUser(ctx);
    const pieces = await ctx.db
      .query("contentPieces")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const start = mondayOf(today);
    const end = addDays(start, 6);
    const week = pieces.filter((p) => p.brand === brand && !!p.publishedOn && p.publishedOn >= start && p.publishedOn <= end);
    const counts: Record<string, number> = {};
    let untagged = 0;
    for (const p of week) {
      const b = p.kw?.bucketId;
      if (b) counts[b] = (counts[b] ?? 0) + 1;
      else untagged++;
    }
    return { start, end, counts, untagged, total: week.length };
  },
});
