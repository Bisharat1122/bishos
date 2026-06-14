import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

/** The current user's profile + resolved avatar URL (null if none yet). */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const avatarUrl = profile?.avatarId ? await ctx.storage.getUrl(profile.avatarId) : null;
    return profile ? { ...profile, avatarUrl } : null;
  },
});

export const upsert = mutation({
  args: {
    name: v.optional(v.string()),
    city: v.optional(v.string()),
    occupation: v.optional(v.string()),
    business: v.optional(v.string()),
    situation: v.optional(v.string()),
    about: v.optional(v.string()),
    preferences: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return ctx.db.insert("profiles", { userId, ...args });
  },
});

export const setAvatar = mutation({
  args: { avatarId: v.id("_storage") },
  handler: async (ctx, { avatarId }) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    // remove the previous avatar file to avoid orphans
    if (existing?.avatarId) {
      try { await ctx.storage.delete(existing.avatarId); } catch { /* ignore */ }
    }
    if (existing) await ctx.db.patch(existing._id, { avatarId });
    else await ctx.db.insert("profiles", { userId, avatarId });
  },
});
