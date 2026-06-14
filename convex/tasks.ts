import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

const statusValidator = v.union(
  v.literal("not_started"),
  v.literal("in_progress"),
  v.literal("done"),
);
const priorityValidator = v.union(
  v.literal("low"),
  v.literal("med"),
  v.literal("high"),
);

export const list = query({
  args: {
    lifeAreaId: v.optional(v.id("lifeAreas")),
    status: v.optional(statusValidator),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    let tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (args.lifeAreaId) tasks = tasks.filter((t) => t.lifeAreaId === args.lifeAreaId);
    if (args.status) tasks = tasks.filter((t) => t.status === args.status);
    return tasks;
  },
});

export const get = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db.get(id);
    if (!task || task.userId !== userId) return null;
    return task;
  },
});

const attachmentValidator = v.object({
  storageId: v.id("_storage"),
  name: v.string(),
  contentType: v.string(),
  size: v.number(),
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: priorityValidator,
    dueDate: v.optional(v.number()),
    startAt: v.optional(v.number()),
    endAt: v.optional(v.number()),
    lifeAreaId: v.id("lifeAreas"),
    sectionId: v.optional(v.id("sections")),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    // order = now → newest task sorts to the top of the "Not started" column
    return ctx.db.insert("tasks", { ...args, userId, status: "not_started", order: Date.now() });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(statusValidator),
    priority: v.optional(priorityValidator),
    dueDate: v.optional(v.union(v.number(), v.null())),
    startAt: v.optional(v.union(v.number(), v.null())),
    endAt: v.optional(v.union(v.number(), v.null())),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    sectionId: v.optional(v.union(v.id("sections"), v.null())),
    projectId: v.optional(v.union(v.id("projects"), v.null())),
    tags: v.optional(v.array(v.string())),
    attachments: v.optional(v.array(attachmentValidator)),
  },
  handler: async (ctx, { id, ...rest }) => {
    await requireUser(ctx);
    // Translate explicit nulls into field removal for optional links.
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      patch[k] = val === null ? undefined : val;
    }
    if (rest.status !== undefined) {
      patch.completedAt = rest.status === "done" ? Date.now() : undefined;
    }
    await ctx.db.patch(id, patch);
  },
});

export const setStatus = mutation({
  args: { id: v.id("tasks"), status: statusValidator },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.patch(args.id, {
      status: args.status,
      completedAt: args.status === "done" ? Date.now() : undefined,
    });
  },
});

/** Drag-and-drop: set a task's manual order (and optionally move it to another
 * column/status in the same gesture). */
export const setOrder = mutation({
  args: {
    id: v.id("tasks"),
    order: v.number(),
    status: v.optional(statusValidator),
  },
  handler: async (ctx, { id, order, status }) => {
    await requireUser(ctx);
    const patch: Record<string, unknown> = { order };
    if (status !== undefined) {
      patch.status = status;
      patch.completedAt = status === "done" ? Date.now() : undefined;
    }
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.delete(args.id);
  },
});
