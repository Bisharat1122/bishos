import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

const kpiTypeValidator = v.union(v.literal("number"), v.literal("checkbox"), v.literal("text"));

/** Sections with their goals + KPI definitions — powers the section tabs. */
export const structure = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, { challengeId }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(challengeId);
    if (!c || c.userId !== userId) return [];
    const [sections, goals, kpiDefs] = await Promise.all([
      ctx.db.query("challengeSections").withIndex("by_challenge", (q) => q.eq("challengeId", challengeId)).collect(),
      ctx.db.query("challengeGoals").withIndex("by_challenge", (q) => q.eq("challengeId", challengeId)).collect(),
      ctx.db.query("challengeKpiDefs").withIndex("by_challenge", (q) => q.eq("challengeId", challengeId)).collect(),
    ]);
    return sections
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        _id: s._id,
        name: s.name,
        icon: s.icon,
        color: s.color,
        syllabus: s.syllabus,
        goals: goals.filter((g) => g.sectionId === s._id).sort((a, b) => a.order - b.order),
        kpiDefs: kpiDefs.filter((k) => k.sectionId === s._id).sort((a, b) => a.order - b.order),
      }));
  },
});

export const addSection = mutation({
  args: { challengeId: v.id("challenges"), name: v.string(), icon: v.optional(v.string()) },
  handler: async (ctx, { challengeId, name, icon }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(challengeId);
    if (!c || c.userId !== userId) throw new Error("Challenge not found");
    const existing = await ctx.db.query("challengeSections").withIndex("by_challenge", (q) => q.eq("challengeId", challengeId)).collect();
    return ctx.db.insert("challengeSections", { userId, challengeId, name, icon, order: existing.length });
  },
});

export const updateSection = mutation({
  args: {
    id: v.id("challengeSections"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    syllabus: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const s = await ctx.db.get(id);
    if (!s || s.userId !== userId) return;
    await ctx.db.patch(id, rest);
  },
});

export const removeSection = mutation({
  args: { id: v.id("challengeSections") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const s = await ctx.db.get(id);
    if (!s || s.userId !== userId) return;
    for (const g of await ctx.db.query("challengeGoals").withIndex("by_section", (q) => q.eq("sectionId", id)).collect()) await ctx.db.delete(g._id);
    for (const k of await ctx.db.query("challengeKpiDefs").withIndex("by_section", (q) => q.eq("sectionId", id)).collect()) await ctx.db.delete(k._id);
    // Detach tasks that were in this section.
    const tasks = await ctx.db.query("tasks").withIndex("by_challenge", (q) => q.eq("challengeId", s.challengeId)).collect();
    for (const t of tasks) if (t.challengeSectionId === id) await ctx.db.patch(t._id, { challengeSectionId: undefined });
    await ctx.db.delete(id);
  },
});

export const reorderSection = mutation({
  args: { id: v.id("challengeSections"), direction: v.union(v.literal("up"), v.literal("down")) },
  handler: async (ctx, { id, direction }) => {
    const userId = await requireUser(ctx);
    const s = await ctx.db.get(id);
    if (!s || s.userId !== userId) return;
    const siblings = (await ctx.db.query("challengeSections").withIndex("by_challenge", (q) => q.eq("challengeId", s.challengeId)).collect()).sort((a, b) => a.order - b.order);
    const idx = siblings.findIndex((x) => x._id === id);
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= siblings.length) return;
    await ctx.db.patch(id, { order: siblings[swap].order });
    await ctx.db.patch(siblings[swap]._id, { order: s.order });
  },
});

// ---- Section goals ----
export const addGoal = mutation({
  args: { sectionId: v.id("challengeSections"), title: v.string() },
  handler: async (ctx, { sectionId, title }) => {
    const userId = await requireUser(ctx);
    const s = await ctx.db.get(sectionId);
    if (!s || s.userId !== userId) throw new Error("Section not found");
    const existing = await ctx.db.query("challengeGoals").withIndex("by_section", (q) => q.eq("sectionId", sectionId)).collect();
    return ctx.db.insert("challengeGoals", { userId, challengeId: s.challengeId, sectionId, title, done: false, order: existing.length });
  },
});

export const toggleGoal = mutation({
  args: { id: v.id("challengeGoals") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const g = await ctx.db.get(id);
    if (!g || g.userId !== userId) return;
    await ctx.db.patch(id, { done: !g.done });
  },
});

export const removeGoal = mutation({
  args: { id: v.id("challengeGoals") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const g = await ctx.db.get(id);
    if (!g || g.userId !== userId) return;
    await ctx.db.delete(id);
  },
});

// ---- Section KPI definitions ----
export const addKpiDef = mutation({
  args: { sectionId: v.id("challengeSections"), name: v.string(), type: kpiTypeValidator, unit: v.optional(v.string()), target: v.optional(v.number()) },
  handler: async (ctx, { sectionId, name, type, unit, target }) => {
    const userId = await requireUser(ctx);
    const s = await ctx.db.get(sectionId);
    if (!s || s.userId !== userId) throw new Error("Section not found");
    const existing = await ctx.db.query("challengeKpiDefs").withIndex("by_section", (q) => q.eq("sectionId", sectionId)).collect();
    return ctx.db.insert("challengeKpiDefs", { userId, challengeId: s.challengeId, sectionId, name, type, unit, target, order: existing.length });
  },
});

export const updateKpiDef = mutation({
  args: { id: v.id("challengeKpiDefs"), name: v.optional(v.string()), unit: v.optional(v.string()), target: v.optional(v.number()) },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const k = await ctx.db.get(id);
    if (!k || k.userId !== userId) return;
    await ctx.db.patch(id, rest);
  },
});

export const removeKpiDef = mutation({
  args: { id: v.id("challengeKpiDefs") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const k = await ctx.db.get(id);
    if (!k || k.userId !== userId) return;
    for (const v of await ctx.db.query("challengeKpiValues").withIndex("by_kpiDef", (q) => q.eq("kpiDefId", id)).collect()) await ctx.db.delete(v._id);
    await ctx.db.delete(id);
  },
});
