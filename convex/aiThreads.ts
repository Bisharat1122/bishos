import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const threads = await ctx.db
      .query("aiThreads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    // Module-docked threads (Goals/Tasks/…) live in their own windows.
    return threads.filter((t) => !t.moduleKey);
  },
});

export const createThread = mutation({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return ctx.db.insert("aiThreads", {
      userId,
      title: args.title ?? "New chat",
    });
  },
});

export const messages = query({
  args: { threadId: v.id("aiThreads") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return ctx.db
      .query("aiMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
  },
});

export const rename = mutation({
  args: { threadId: v.id("aiThreads"), title: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.patch(args.threadId, { title: args.title.slice(0, 80) });
  },
});

export const setProvider = mutation({
  args: {
    threadId: v.id("aiThreads"),
    provider: v.union(
      v.literal("openrouter"),
      v.literal("gpt-oss"),
      v.literal("owl"),
      v.literal("hy3"),
    ),
  },
  handler: async (ctx, { threadId, provider }) => {
    await requireUser(ctx);
    await ctx.db.patch(threadId, { provider });
  },
});

export const removeThread = mutation({
  args: { threadId: v.id("aiThreads") },
  handler: async (ctx, { threadId }) => {
    await requireUser(ctx);
    const msgs = await ctx.db
      .query("aiMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
    for (const m of msgs) await ctx.db.delete(m._id);
    await ctx.db.delete(threadId);
  },
});
