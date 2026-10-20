/**
 * Resource queue (books, courses, videos, articles…). Guards against the
 * Collector's Fallacy: every resource needs a "why saved" line, and each
 * learning area should keep only 1–2 resources active at a time (we warn,
 * never block). Status flow: queued → active → done | dropped.
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";

export const MAX_ACTIVE_PER_AREA = 2;

const statusV = v.union(v.literal("queued"), v.literal("active"), v.literal("done"), v.literal("dropped"));
type Status = Doc<"resources">["status"];

async function own(ctx: QueryCtx | MutationCtx, userId: Id<"users">, id: Id<"resources">) {
  const r = await ctx.db.get(id);
  if (!r || r.userId !== userId) throw new ConvexError("Resource not found.");
  return r;
}

async function ownArea(ctx: QueryCtx | MutationCtx, userId: Id<"users">, id?: Id<"learningAreas"> | null) {
  if (!id) return;
  const a = await ctx.db.get(id);
  if (!a || a.userId !== userId) throw new ConvexError("Learning area not found.");
}

async function activeIn(ctx: QueryCtx | MutationCtx, userId: Id<"users">, areaId?: Id<"learningAreas">) {
  const all = await ctx.db
    .query("resources")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return all.filter((r) => r.status === "active" && r.learningAreaId === areaId).length;
}

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const list = query({
  args: { learningAreaId: v.optional(v.id("learningAreas")), status: v.optional(statusV) },
  handler: async (ctx, { learningAreaId, status }) => {
    const userId = await requireUser(ctx);
    let rows = await ctx.db
      .query("resources")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (learningAreaId) rows = rows.filter((r) => r.learningAreaId === learningAreaId);
    if (status) rows = rows.filter((r) => r.status === status);
    const areas = await ctx.db
      .query("learningAreas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const areaName = new Map(areas.map((a) => [a._id as string, a.name]));
    const cards = await ctx.db
      .query("recallCards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((r) => ({
        ...r,
        areaName: r.learningAreaId ? areaName.get(r.learningAreaId) : undefined,
        cardCount: cards.filter((c) => c.resourceId === r._id).length,
      }));
  },
});

export const get = query({
  args: { id: v.id("resources") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const r = await ctx.db.get(id);
    if (!r || r.userId !== userId) return null;
    return r;
  },
});

/** Active resources per learning area (for "max 2 active" warnings). */
export const activeCounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("resources")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const out: Record<string, number> = {};
    for (const r of rows) if (r.status === "active") out[r.learningAreaId ?? "none"] = (out[r.learningAreaId ?? "none"] ?? 0) + 1;
    return out;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    whySaved: v.string(),
    format: v.string(),
    url: v.optional(v.string()),
    author: v.optional(v.string()),
    learningAreaId: v.optional(v.id("learningAreas")),
    status: v.optional(statusV),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const title = args.title.trim();
    const whySaved = args.whySaved.trim();
    if (!title) throw new ConvexError("Give the resource a title.");
    if (!whySaved) throw new ConvexError("Add a line on why you're saving this — it's what keeps the queue honest.");
    await ownArea(ctx, userId, args.learningAreaId);
    const status: Status = args.status ?? "queued";
    const now = Date.now();
    const id = await ctx.db.insert("resources", {
      userId,
      title: title.slice(0, 300),
      whySaved: whySaved.slice(0, 500),
      format: args.format || "other",
      url: args.url?.trim() || undefined,
      author: args.author?.trim() || undefined,
      learningAreaId: args.learningAreaId,
      status,
      progress: status === "done" ? 100 : 0,
      createdAt: now,
      startedAt: status === "active" || status === "done" ? now : undefined,
      finishedAt: status === "done" ? now : undefined,
    });
    const active = status === "active" ? await activeIn(ctx, userId, args.learningAreaId) : 0;
    return { id, activeInArea: active, warn: active > MAX_ACTIVE_PER_AREA };
  },
});

export const update = mutation({
  args: {
    id: v.id("resources"),
    title: v.optional(v.string()),
    whySaved: v.optional(v.string()),
    format: v.optional(v.string()),
    url: v.optional(v.union(v.string(), v.null())),
    author: v.optional(v.union(v.string(), v.null())),
    learningAreaId: v.optional(v.union(v.id("learningAreas"), v.null())),
    progress: v.optional(v.number()),
    rating: v.optional(v.union(v.number(), v.null())),
    takeaways: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    await own(ctx, userId, id);
    await ownArea(ctx, userId, rest.learningAreaId);
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      patch[k] = val === null ? undefined : val;
    }
    if (typeof patch.title === "string") {
      patch.title = (patch.title as string).trim();
      if (!patch.title) throw new ConvexError("Title can't be empty.");
    }
    if (typeof patch.whySaved === "string") {
      patch.whySaved = (patch.whySaved as string).trim();
      if (!patch.whySaved) throw new ConvexError("“Why saved” is required.");
    }
    if (typeof patch.progress === "number") patch.progress = clampPct(patch.progress as number);
    if (typeof patch.rating === "number") patch.rating = Math.max(1, Math.min(5, Math.round(patch.rating as number)));
    await ctx.db.patch(id, patch);
  },
});

/** Move through the queue. Returns the active count in that area so the UI can warn (>2). */
export const setStatus = mutation({
  args: { id: v.id("resources"), status: statusV },
  handler: async (ctx, { id, status }) => {
    const userId = await requireUser(ctx);
    const r = await own(ctx, userId, id);
    const now = Date.now();
    const patch: Partial<Doc<"resources">> = { status };
    if (status === "active" && !r.startedAt) patch.startedAt = now;
    if (status === "done") {
      patch.finishedAt = now;
      patch.progress = 100;
      if (!r.startedAt) patch.startedAt = now;
    } else if (r.status === "done") {
      patch.finishedAt = undefined;
    }
    await ctx.db.patch(id, patch);
    const active = await activeIn(ctx, userId, r.learningAreaId);
    return { activeInArea: active, warn: status === "active" && active > MAX_ACTIVE_PER_AREA };
  },
});

export const remove = mutation({
  args: { id: v.id("resources") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const r = await ctx.db.get(id);
    if (!r || r.userId !== userId) return;
    for (const c of await ctx.db.query("recallCards").withIndex("by_user", (q) => q.eq("userId", userId)).collect())
      if (c.resourceId === id) await ctx.db.patch(c._id, { resourceId: undefined });
    for (const n of await ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).collect())
      if (n.resourceId === id) await ctx.db.patch(n._id, { resourceId: undefined });
    await ctx.db.delete(id);
  },
});
