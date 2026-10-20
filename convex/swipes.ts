/**
 * Inspiration library (swipes) + hook library.
 * A swipe is only worth saving when it's broken down at save time, so
 * "why it worked" is required (fights the collector's fallacy).
 */
import { ConvexError, v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";

const brandV = v.union(v.literal("personal"), v.literal("company"));

const outlier = (s: Doc<"swipes">) =>
  s.views != null && s.creatorAvgViews != null && s.creatorAvgViews > 0
    ? Math.round((s.views / s.creatorAvgViews) * 10) / 10
    : null;

async function ownSwipe(ctx: MutationCtx, userId: Id<"users">, id: Id<"swipes">) {
  const s = await ctx.db.get(id);
  if (!s || s.userId !== userId) throw new ConvexError("That inspiration no longer exists.");
  return s;
}

async function ownPillar(ctx: MutationCtx, userId: Id<"users">, id?: Id<"contentPillars"> | null) {
  if (!id) return;
  const p = await ctx.db.get(id);
  if (!p || p.userId !== userId) throw new ConvexError("Pillar not found.");
}

const nonNeg = (n: number | undefined, what: string) => {
  if (n !== undefined && (!Number.isFinite(n) || n < 0)) throw new ConvexError(`${what} must be a positive number.`);
  return n === undefined ? undefined : Math.round(n);
};

const swipeFields = {
  url: v.optional(v.string()),
  platform: v.optional(v.string()),
  creator: v.optional(v.string()),
  title: v.optional(v.string()),
  hookText: v.optional(v.string()),
  hookVisual: v.optional(v.string()),
  hookSpoken: v.optional(v.string()),
  hookOnScreen: v.optional(v.string()),
  hookType: v.optional(v.string()),
  format: v.optional(v.string()),
  structure: v.optional(v.string()),
  views: v.optional(v.number()),
  creatorAvgViews: v.optional(v.number()),
  whatToSteal: v.optional(v.string()),
  brand: v.optional(brandV),
  tags: v.optional(v.array(v.string())),
  transcript: v.optional(v.string()),
};

const trimOrUndef = (s?: string) => (s && s.trim() ? s.trim() : undefined);

// ─────────────────────────────────────────────────────────────────────────
// Swipes
// ─────────────────────────────────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const swipes = await ctx.db.query("swipes").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return swipes.sort((a, b) => b.createdAt - a.createdAt).map((s) => ({ ...s, outlier: outlier(s) }));
  },
});

/** Anti-hoarding stats: saved vs used. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [swipes, hooks] = await Promise.all([
      ctx.db.query("swipes").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("hooks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const used = swipes.filter((s) => (s.used ?? 0) > 0).length;
    const ratios = swipes.map(outlier).filter((x): x is number => x != null).sort((a, b) => a - b);
    const mid = Math.floor(ratios.length / 2);
    const med = !ratios.length
      ? null
      : ratios.length % 2
        ? ratios[mid]
        : Math.round(((ratios[mid - 1] + ratios[mid]) / 2) * 10) / 10;
    return {
      saved: swipes.length,
      used,
      usedPct: swipes.length ? Math.round((used / swipes.length) * 100) : 0,
      medianOutlier: med,
      hooks: hooks.length,
    };
  },
});

export const create = mutation({
  args: { ...swipeFields, whyItWorked: v.string(), pillarId: v.optional(v.id("contentPillars")) },
  handler: async (ctx, a) => {
    const userId = await requireUser(ctx);
    const why = a.whyItWorked.trim();
    if (!why) throw new ConvexError("Write one line on why it worked. That's what makes a swipe useful later.");
    await ownPillar(ctx, userId, a.pillarId);
    return ctx.db.insert("swipes", {
      userId,
      url: trimOrUndef(a.url),
      platform: trimOrUndef(a.platform),
      creator: trimOrUndef(a.creator),
      title: trimOrUndef(a.title),
      hookText: trimOrUndef(a.hookText),
      hookVisual: trimOrUndef(a.hookVisual),
      hookSpoken: trimOrUndef(a.hookSpoken),
      hookOnScreen: trimOrUndef(a.hookOnScreen),
      hookType: trimOrUndef(a.hookType),
      format: trimOrUndef(a.format),
      structure: trimOrUndef(a.structure),
      views: nonNeg(a.views, "Views"),
      creatorAvgViews: nonNeg(a.creatorAvgViews, "Creator average views"),
      whyItWorked: why,
      whatToSteal: trimOrUndef(a.whatToSteal),
      pillarId: a.pillarId,
      brand: a.brand,
      tags: a.tags?.length ? a.tags : undefined,
      transcript: trimOrUndef(a.transcript),
      used: 0,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("swipes"),
    ...swipeFields,
    whyItWorked: v.optional(v.string()),
    pillarId: v.optional(v.union(v.id("contentPillars"), v.null())),
    brand: v.optional(v.union(brandV, v.null())),
    views: v.optional(v.union(v.number(), v.null())),
    creatorAvgViews: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, { id, ...a }) => {
    const userId = await requireUser(ctx);
    await ownSwipe(ctx, userId, id);
    await ownPillar(ctx, userId, a.pillarId);
    const patch: Partial<Doc<"swipes">> = {};
    if (a.whyItWorked !== undefined) {
      if (!a.whyItWorked.trim()) throw new ConvexError("“Why it worked” can't be empty.");
      patch.whyItWorked = a.whyItWorked.trim();
    }
    const text = ["url", "platform", "creator", "title", "hookText", "hookVisual", "hookSpoken", "hookOnScreen", "hookType", "format", "structure", "whatToSteal", "transcript"] as const;
    for (const k of text) if (a[k] !== undefined) (patch as Record<string, unknown>)[k] = trimOrUndef(a[k]);
    if (a.views !== undefined) patch.views = a.views === null ? undefined : nonNeg(a.views, "Views");
    if (a.creatorAvgViews !== undefined)
      patch.creatorAvgViews = a.creatorAvgViews === null ? undefined : nonNeg(a.creatorAvgViews, "Creator average views");
    if (a.pillarId !== undefined) patch.pillarId = a.pillarId ?? undefined;
    if (a.brand !== undefined) patch.brand = a.brand ?? undefined;
    if (a.tags !== undefined) patch.tags = a.tags.length ? a.tags : undefined;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("swipes") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await ownSwipe(ctx, userId, id);
    const pieces = await ctx.db.query("contentPieces").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const p of pieces) {
      if (p.swipeIds?.includes(id)) {
        const rest = p.swipeIds.filter((x) => x !== id);
        await ctx.db.patch(p._id, { swipeIds: rest.length ? rest : undefined });
      }
    }
    await ctx.db.delete(id);
  },
});

/** "Use in a new piece": creates a piece linked via swipeIds and counts the use. */
export const useInPiece = mutation({
  args: {
    id: v.id("swipes"),
    title: v.optional(v.string()),
    brand: v.optional(brandV),
    format: v.optional(v.string()),
  },
  handler: async (ctx, { id, title, brand, format }) => {
    const userId = await requireUser(ctx);
    const s = await ownSwipe(ctx, userId, id);
    const name =
      title?.trim() ||
      (s.title ? `Inspired by ${s.title}` : s.hookText ? `Riff on: ${s.hookText}` : `Inspired by ${s.creator ?? "a swipe"}`);
    const brief = [
      `Inspired by ${s.creator ? `@${s.creator.replace(/^@/, "")}` : "a saved post"}${s.url ? ` (${s.url})` : ""}.`,
      `Why it worked: ${s.whyItWorked}`,
      s.whatToSteal ? `What to steal: ${s.whatToSteal}` : "",
      s.structure ? `Structure: ${s.structure}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const pieceId = await ctx.db.insert("contentPieces", {
      userId,
      title: name.slice(0, 300),
      brand: brand ?? s.brand ?? "personal",
      pillarId: s.pillarId,
      format: format || s.format || "short_video",
      stage: "idea",
      hookType: s.hookType,
      brief,
      swipeIds: [id],
      createdAt: Date.now(),
    });
    await ctx.db.patch(id, { used: (s.used ?? 0) + 1 });
    return pieceId;
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Hook library
// ─────────────────────────────────────────────────────────────────────────

export const listHooks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const hooks = await ctx.db.query("hooks").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return hooks.sort((a, b) => (b.uses ?? 0) - (a.uses ?? 0) || b.createdAt - a.createdAt);
  },
});

async function insertHook(
  ctx: MutationCtx,
  userId: Id<"users">,
  h: { text: string; hookType?: string; source: Doc<"hooks">["source"]; sourceId?: string; note?: string },
) {
  const text = h.text.trim();
  if (!text) throw new ConvexError("The hook is empty.");
  const all = await ctx.db.query("hooks").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
  const dupe = all.find((x) => x.text.trim().toLowerCase() === text.toLowerCase());
  if (dupe) return { id: dupe._id, existed: true };
  const id = await ctx.db.insert("hooks", {
    userId,
    text,
    hookType: trimOrUndef(h.hookType),
    source: h.source,
    sourceId: h.sourceId,
    note: trimOrUndef(h.note),
    uses: 0,
    createdAt: Date.now(),
  });
  return { id, existed: false };
}

export const createHook = mutation({
  args: { text: v.string(), hookType: v.optional(v.string()), note: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const userId = await requireUser(ctx);
    return insertHook(ctx, userId, { ...a, source: "manual" });
  },
});

/** Add several starter hooks at once (dupes are skipped). */
export const addStarterHooks = mutation({
  args: { hooks: v.array(v.object({ text: v.string(), hookType: v.optional(v.string()) })) },
  handler: async (ctx, { hooks }) => {
    const userId = await requireUser(ctx);
    let added = 0;
    for (const h of hooks.slice(0, 40)) {
      const r = await insertHook(ctx, userId, { ...h, source: "manual", note: "Starter template" });
      if (!r.existed) added++;
    }
    return added;
  },
});

export const updateHook = mutation({
  args: { id: v.id("hooks"), text: v.optional(v.string()), hookType: v.optional(v.union(v.string(), v.null())), note: v.optional(v.string()) },
  handler: async (ctx, { id, text, hookType, note }) => {
    const userId = await requireUser(ctx);
    const h = await ctx.db.get(id);
    if (!h || h.userId !== userId) throw new ConvexError("Hook not found.");
    const patch: Partial<Doc<"hooks">> = {};
    if (text !== undefined) {
      if (!text.trim()) throw new ConvexError("The hook is empty.");
      patch.text = text.trim();
    }
    if (hookType !== undefined) patch.hookType = hookType ?? undefined;
    if (note !== undefined) patch.note = trimOrUndef(note);
    await ctx.db.patch(id, patch);
  },
});

export const removeHook = mutation({
  args: { id: v.id("hooks") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const h = await ctx.db.get(id);
    if (!h || h.userId !== userId) throw new ConvexError("Hook not found.");
    await ctx.db.delete(id);
  },
});

/** Count a use (copied, or inserted into a piece). */
export const useHook = mutation({
  args: { id: v.id("hooks") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const h = await ctx.db.get(id);
    if (!h || h.userId !== userId) throw new ConvexError("Hook not found.");
    await ctx.db.patch(id, { uses: (h.uses ?? 0) + 1 });
  },
});

export const saveHookFromSwipe = mutation({
  args: { swipeId: v.id("swipes") },
  handler: async (ctx, { swipeId }) => {
    const userId = await requireUser(ctx);
    const s = await ownSwipe(ctx, userId, swipeId);
    const text = s.hookText || s.hookSpoken || s.hookOnScreen;
    if (!text?.trim()) throw new ConvexError("This swipe has no hook text yet. Add it first.");
    const r = outlier(s);
    return insertHook(ctx, userId, {
      text,
      hookType: s.hookType,
      source: "swipe",
      sourceId: swipeId,
      note: [s.creator ? `from @${s.creator.replace(/^@/, "")}` : "", r != null ? `${r}× outlier` : "", s.format ?? ""]
        .filter(Boolean)
        .join(" · "),
    });
  },
});

export const saveHookFromPiece = mutation({
  args: { pieceId: v.id("contentPieces"), note: v.optional(v.string()) },
  handler: async (ctx, { pieceId, note }) => {
    const userId = await requireUser(ctx);
    const p = await ctx.db.get(pieceId);
    if (!p || p.userId !== userId) throw new ConvexError("Piece not found.");
    if (!p.hook?.trim()) throw new ConvexError("This piece has no hook yet.");
    return insertHook(ctx, userId, { text: p.hook, hookType: p.hookType, source: "own", sourceId: pieceId, note: note ?? `Your own · ${p.title}` });
  },
});
