import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";

/** The thread if the caller owns it, else null. */
async function ownThread(ctx: QueryCtx | MutationCtx, userId: Id<"users">, threadId: Id<"aiThreads">) {
  const thread = await ctx.db.get(threadId);
  return thread && thread.userId === userId ? thread : null;
}

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
    const userId = await requireUser(ctx);
    if (!(await ownThread(ctx, userId, args.threadId))) return [];
    return ctx.db
      .query("aiMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
  },
});

/** Stored model of a thread (module docks use it to show the real active model). */
export const provider = query({
  args: { threadId: v.id("aiThreads") },
  handler: async (ctx, { threadId }) => {
    const userId = await requireUser(ctx);
    const thread = await ownThread(ctx, userId, threadId);
    return thread?.provider ?? null;
  },
});

export const rename = mutation({
  args: { threadId: v.id("aiThreads"), title: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (!(await ownThread(ctx, userId, args.threadId))) return;
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
    const userId = await requireUser(ctx);
    if (!(await ownThread(ctx, userId, threadId))) return;
    await ctx.db.patch(threadId, { provider });
  },
});

export const removeThread = mutation({
  args: { threadId: v.id("aiThreads") },
  handler: async (ctx, { threadId }) => {
    const userId = await requireUser(ctx);
    if (!(await ownThread(ctx, userId, threadId))) return;
    const msgs = await ctx.db
      .query("aiMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
    for (const m of msgs) await ctx.db.delete(m._id);
    await ctx.db.delete(threadId);
  },
});
