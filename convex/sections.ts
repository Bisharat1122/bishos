import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

export const list = query({
  args: { lifeAreaId: v.optional(v.id("lifeAreas")) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (args.lifeAreaId) {
      const id = args.lifeAreaId;
      const rows = await ctx.db
        .query("sections")
        .withIndex("by_lifeArea", (q) => q.eq("lifeAreaId", id))
        .collect();
      return rows.filter((s) => s.userId === userId);
    }
    return ctx.db
      .query("sections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: { lifeAreaId: v.id("lifeAreas"), name: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const area = await ctx.db.get(args.lifeAreaId);
    if (!area || area.userId !== userId) throw new ConvexError("Life area not found.");
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
      ctx.db
        .query("goals")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("sectionId"), id))
        .collect(),
    ]);
    return { section, area, tasks, notes, goals };
  },
});

export const rename = mutation({
  args: { id: v.id("sections"), name: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const section = await ctx.db.get(args.id);
    if (!section || section.userId !== userId) return;
    await ctx.db.patch(args.id, { name: args.name });
  },
});

/** Delete a section; its tasks / notes / goals stay in the area, unsectioned. */
export const remove = mutation({
  args: { id: v.id("sections") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const section = await ctx.db.get(args.id);
    if (!section || section.userId !== userId) return;
    const [tasks, notes, goals] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_section", (q) => q.eq("sectionId", args.id)).collect(),
      ctx.db.query("notes").withIndex("by_section", (q) => q.eq("sectionId", args.id)).collect(),
      ctx.db
        .query("goals")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("sectionId"), args.id))
        .collect(),
    ]);
    for (const t of tasks) await ctx.db.patch(t._id, { sectionId: undefined });
    for (const n of notes) await ctx.db.patch(n._id, { sectionId: undefined });
    for (const g of goals) await ctx.db.patch(g._id, { sectionId: undefined });
    await ctx.db.delete(args.id);
  },
});
