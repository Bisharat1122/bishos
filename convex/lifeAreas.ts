import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return ctx.db
      .query("lifeAreas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: { name: v.string(), icon: v.optional(v.string()), color: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("lifeAreas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return ctx.db.insert("lifeAreas", {
      userId,
      name: args.name,
      icon: args.icon,
      color: args.color,
      order: existing.length,
    });
  },
});

export const rename = mutation({
  args: { id: v.id("lifeAreas"), name: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const update = mutation({
  args: {
    id: v.id("lifeAreas"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await requireUser(ctx);
    await ctx.db.patch(id, rest);
  },
});

export const get = query({
  args: { id: v.id("lifeAreas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const area = await ctx.db.get(id);
    if (!area || area.userId !== userId) return null;
    return area;
  },
});

/** Area page payload: the area, its sections (with counts), and everything in it. */
export const overview = query({
  args: { id: v.id("lifeAreas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const area = await ctx.db.get(id);
    if (!area || area.userId !== userId) return null;

    const [sections, tasks, projects, goals, notes] = await Promise.all([
      ctx.db.query("sections").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id)).collect(),
      ctx.db.query("tasks").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id)).collect(),
      ctx.db.query("projects").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id)).collect(),
      ctx.db.query("goals").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id)).collect(),
      ctx.db.query("notes").withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id)).collect(),
    ]);

    const sectionsWithCounts = sections.map((s) => ({
      ...s,
      taskCount: tasks.filter((t) => t.sectionId === s._id).length,
      noteCount: notes.filter((n) => n.sectionId === s._id).length,
      goalCount: goals.filter((g) => g.sectionId === s._id).length,
    }));

    return { area, sections: sectionsWithCounts, tasks, projects, goals, notes };
  },
});

export const remove = mutation({
  args: { id: v.id("lifeAreas") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    // Cascade: delete sections under this area too.
    const sections = await ctx.db
      .query("sections")
      .withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", args.id))
      .collect();
    for (const s of sections) await ctx.db.delete(s._id);
    await ctx.db.delete(args.id);
  },
});
