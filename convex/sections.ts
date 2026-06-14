import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

export const list = query({
  args: { lifeAreaId: v.optional(v.id("lifeAreas")) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (args.lifeAreaId) {
      const id = args.lifeAreaId;
      return ctx.db
        .query("sections")
        .withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id))
        .collect();
    }
    return ctx.db
      .query("sections")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

export const create = mutation({
  args: { lifeAreaId: v.id("lifeAreas"), name: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("sections")
      .withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", args.lifeAreaId))
      .collect();
    return ctx.db.insert("sections", {
      userId,
      lifeAreaId: args.lifeAreaId,
      name: args.name,
      order: existing.length,
    });
  },
});

export const get = query({
  args: { id: v.id("sections") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const section = await ctx.db.get(id);
    if (!section || section.userId !== userId) return null;
    const area = await ctx.db.get(section.lifeAreaId);
    return { section, area };
  },
});

/** Section page payload: tasks, notes and goals scoped to this section. */
export const overview = query({
  args: { id: v.id("sections") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const section = await ctx.db.get(id);
    if (!section || section.userId !== userId) return null;
    const area = await ctx.db.get(section.lifeAreaId);

    const [tasks, notes, goals] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_section", (q) => q.eq("sectionId", id)).collect(),
      ctx.db.query("notes").withIndex("by_section", (q) => q.eq("sectionId", id)).collect(),
      ctx.db.query("goals").filter((q) => q.eq(q.field("sectionId"), id)).collect(),
    ]);
    return { section, area, tasks, notes, goals };
  },
});

export const rename = mutation({
  args: { id: v.id("sections"), name: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const remove = mutation({
  args: { id: v.id("sections") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.delete(args.id);
  },
});
