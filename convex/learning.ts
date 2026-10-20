/**
 * Learning areas — "a project with a performance goal" (Ultralearning):
 * target performance, a map of what/how to learn, a skill tree, a weekly time
 * budget, a "things I don't know" list, practice sessions and learn-in-public.
 *
 * Public API other modules may call:
 *   learning.weekSummary({ weekStart }) → minutes per area vs target, ideas,
 *     gaps added/closed, recall reviews, seeds, resources finished.
 *   learning.listAreasLite() → [{ _id, name, status, color }]
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, awardXp, mondayOf, revokeXp, XP } from "./os";

const areaStatusV = v.union(v.literal("active"), v.literal("paused"), v.literal("done"));
const skillStatusV = v.union(v.literal("todo"), v.literal("learning"), v.literal("practicing"), v.literal("solid"));
const practiceKindV = v.union(v.literal("study"), v.literal("practice"), v.literal("project"), v.literal("recall"), v.literal("teach"));

type Ctx = QueryCtx | MutationCtx;
type SkillDoc = Doc<"skillNodes">;

async function ownArea(ctx: Ctx, userId: Id<"users">, id: Id<"learningAreas">) {
  const a = await ctx.db.get(id);
  if (!a || a.userId !== userId) throw new ConvexError("Learning area not found.");
  return a;
}

async function ownOptional(ctx: Ctx, userId: Id<"users">, id: Id<"lifeAreas"> | Id<"goals"> | Id<"contentPillars"> | undefined | null) {
  if (!id) return;
  const doc = await ctx.db.get(id);
  if (!doc || (doc as { userId?: Id<"users"> }).userId !== userId) throw new ConvexError("Linked item not found.");
}

const SKILL_WEIGHT: Record<SkillDoc["status"], number> = { todo: 0, learning: 1 / 3, practicing: 2 / 3, solid: 1 };

/** Skill progress: solid = 1, practicing = ⅔, learning = ⅓, todo = 0. */
function skillProgress(nodes: SkillDoc[]) {
  const total = nodes.length;
  const count = (s: SkillDoc["status"]) => nodes.filter((n) => n.status === s).length;
  const pct = total ? Math.round((nodes.reduce((a, n) => a + SKILL_WEIGHT[n.status], 0) / total) * 100) : 0;
  return { total, todo: count("todo"), learning: count("learning"), practicing: count("practicing"), solid: count("solid"), pct };
}

const gapId = () => Math.random().toString(36).slice(2, 10);

function splitLines(text?: string) {
  return (text ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

function addGaps(area: Doc<"learningAreas">, lines: string[], date: string) {
  const gaps = [...(area.gaps ?? [])];
  const known = new Set(gaps.map((g) => g.text.toLowerCase()));
  let added = 0;
  for (const text of lines) {
    if (known.has(text.toLowerCase())) continue;
    known.add(text.toLowerCase());
    gaps.push({ id: gapId(), text: text.slice(0, 240), resolved: false, addedOn: date });
    added++;
  }
  return { gaps, added };
}

// ═════════════════════════════════════════════════════════════════════════
// Queries
// ═════════════════════════════════════════════════════════════════════════

/** Learning areas grid: minutes this week vs target, skills, resources, due cards. */
export const listAreas = query({
  args: { date: v.string(), now: v.number() },
  handler: async (ctx, { date, now }) => {
    const userId = await requireUser(ctx);
    const areas = await ctx.db
      .query("learningAreas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const weekStart = mondayOf(date);
    const weekEnd = addDays(weekStart, 6);
    const sessions = (
      await ctx.db
        .query("practiceSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    ).filter((s) => s.date >= weekStart && s.date <= weekEnd);
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const cards = (
      await ctx.db
        .query("recallCards")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    ).filter((c) => !c.suspended);
    const lifeAreas = await ctx.db
      .query("lifeAreas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const out = [];
    for (const a of areas) {
      const nodes = await ctx.db
        .query("skillNodes")
        .withIndex("by_area", (q) => q.eq("learningAreaId", a._id))
        .collect();
      const mine = sessions.filter((s) => s.learningAreaId === a._id);
      const res = resources.filter((r) => r.learningAreaId === a._id);
      const areaCards = cards.filter((c) => c.learningAreaId === a._id);
      out.push({
        ...a,
        lifeAreaName: lifeAreas.find((l) => l._id === a.lifeAreaId)?.name,
        minutesThisWeek: mine.reduce((sum, s) => sum + s.minutes, 0),
        sessionsThisWeek: mine.length,
        skills: skillProgress(nodes),
        activeResources: res
          .filter((r) => r.status === "active")
          .map((r) => ({ _id: r._id, title: r.title, format: r.format, progress: r.progress ?? 0 })),
        queuedResources: res.filter((r) => r.status === "queued").length,
        doneResources: res.filter((r) => r.status === "done").length,
        dueCards: areaCards.filter((c) => c.due <= now).length,
        totalCards: areaCards.length,
        openGaps: (a.gaps ?? []).filter((g) => !g.resolved).length,
      });
    }
    const rank = { active: 0, paused: 1, done: 2 } as const;
    return out.sort((a, b) => rank[a.status] - rank[b.status] || a.createdAt - b.createdAt);
  },
});

/** Small list for selects (notes, cards, resources). */
export const listAreasLite = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const areas = await ctx.db
      .query("learningAreas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return areas
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((a) => ({ _id: a._id, name: a.name, status: a.status, color: a.color, lifeAreaId: a.lifeAreaId, pillarId: a.pillarId }));
  },
});

/** Everything the learning-area page needs. */
export const getArea = query({
  // Plain string so a malformed /learning/<id> URL returns null instead of throwing.
  args: { id: v.string(), date: v.string(), now: v.number() },
  handler: async (ctx, { id: rawId, date, now }) => {
    const userId = await requireUser(ctx);
    const id = ctx.db.normalizeId("learningAreas", rawId);
    if (!id) return null;
    const area = await ctx.db.get(id);
    if (!area || area.userId !== userId) return null;
    const weekStart = mondayOf(date);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const skills = (
      await ctx.db
        .query("skillNodes")
        .withIndex("by_area", (q) => q.eq("learningAreaId", id))
        .collect()
    ).sort((a, b) => a.order - b.order);
    const sessions = (
      await ctx.db
        .query("practiceSessions")
        .withIndex("by_area", (q) => q.eq("learningAreaId", id))
        .collect()
    ).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    const resources = (
      await ctx.db
        .query("resources")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    ).filter((r) => r.learningAreaId === id);
    const cards = (
      await ctx.db
        .query("recallCards")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    ).filter((c) => c.learningAreaId === id);

    const ideaNotes = new Map<string, { title: string; madePublic: boolean }>();
    for (const s of sessions.slice(0, 60)) {
      if (!s.ideaNoteId) continue;
      const n = await ctx.db.get(s.ideaNoteId);
      if (n && n.userId === userId) ideaNotes.set(s.ideaNoteId, { title: n.title, madePublic: !!n.madePublic });
    }
    const skillTitle = new Map(skills.map((s) => [s._id as string, s.title]));
    const goal = area.goalId ? await ctx.db.get(area.goalId) : null;
    const pillar = area.pillarId ? await ctx.db.get(area.pillarId) : null;
    const lifeArea = area.lifeAreaId ? await ctx.db.get(area.lifeAreaId) : null;

    const week = weekDays.map((d) => ({
      date: d,
      minutes: sessions.filter((s) => s.date === d).reduce((a, s) => a + s.minutes, 0),
    }));
    const notesCount = (
      await ctx.db
        .query("notes")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    ).filter((n) => n.learningAreaId === id).length;

    return {
      area,
      goal: goal && goal.userId === userId ? { _id: goal._id, title: goal.title } : null,
      pillar: pillar && pillar.userId === userId ? { _id: pillar._id, name: pillar.name } : null,
      lifeArea: lifeArea && lifeArea.userId === userId ? { _id: lifeArea._id, name: lifeArea.name } : null,
      skills,
      skillStats: skillProgress(skills),
      sessions: sessions.slice(0, 60).map((s) => ({
        ...s,
        skillTitle: s.skillNodeId ? skillTitle.get(s.skillNodeId) : undefined,
        ideaNote: s.ideaNoteId ? ideaNotes.get(s.ideaNoteId) : undefined,
      })),
      totalMinutes: sessions.reduce((a, s) => a + s.minutes, 0),
      week,
      minutesThisWeek: week.reduce((a, d) => a + d.minutes, 0),
      resources: resources.sort((a, b) => b.createdAt - a.createdAt),
      activeResources: resources.filter((r) => r.status === "active").length,
      cardsTotal: cards.length,
      cardsDue: cards.filter((c) => !c.suspended && c.due <= now).length,
      notesCount,
      openGaps: (area.gaps ?? []).filter((g) => !g.resolved).length,
    };
  },
});

/** Light area info for AI actions. */
export const areaBrief = query({
  args: { id: v.id("learningAreas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const area = await ctx.db.get(id);
    if (!area || area.userId !== userId) return null;
    const skills = await ctx.db
      .query("skillNodes")
      .withIndex("by_area", (q) => q.eq("learningAreaId", id))
      .collect();
    return {
      name: area.name,
      targetPerformance: area.targetPerformance,
      why: area.why,
      map: area.map,
      gaps: (area.gaps ?? []).filter((g) => !g.resolved).map((g) => g.text),
      skills: skills.map((s) => s.title),
    };
  },
});

/** Goals for the "linked goal" select. */
export const goalOptions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return goals
      .filter((g) => g.goalStatus !== "dropped")
      .map((g) => ({ _id: g._id, title: g.title, level: g.level, goalStatus: g.goalStatus }));
  },
});

/** Content pillars for the "learn in public → pillar" select. */
export const pillarOptions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const pillars = await ctx.db
      .query("contentPillars")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return pillars.sort((a, b) => a.order - b.order).map((p) => ({ _id: p._id, name: p.name, brand: p.brand }));
  },
});

/**
 * Weekly review roll-up (Mon–Sun of `weekStart`): minutes per area vs target,
 * sessions, idea notes, gaps added/closed, recall reviews + retention, content
 * seeds from learning, resources finished.
 */
export const weekSummary = query({
  args: { weekStart: v.string() },
  handler: async (ctx, { weekStart }) => {
    const userId = await requireUser(ctx);
    const start = mondayOf(weekStart);
    const end = addDays(start, 6);
    const areas = await ctx.db
      .query("learningAreas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const sessions = (
      await ctx.db
        .query("practiceSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    ).filter((s) => s.date >= start && s.date <= end);
    const logs = await ctx.db
      .query("recallLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", start).lte("date", end))
      .collect();
    const startMs = Date.parse(`${start}T00:00:00Z`);
    const endMs = Date.parse(`${end}T23:59:59Z`);
    const seeds = (
      await ctx.db
        .query("contentPieces")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    ).filter((p) => p.learningAreaId && p.createdAt >= startMs && p.createdAt <= endMs);
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let gapsAdded = 0;
    let gapsClosed = 0;
    for (const a of areas)
      for (const g of a.gaps ?? []) {
        if (g.addedOn && g.addedOn >= start && g.addedOn <= end) gapsAdded++;
        if (g.resolved && g.resolvedOn && g.resolvedOn >= start && g.resolvedOn <= end) gapsClosed++;
      }
    const perArea = areas
      .filter((a) => a.status === "active" || sessions.some((s) => s.learningAreaId === a._id))
      .map((a) => {
        const mine = sessions.filter((s) => s.learningAreaId === a._id);
        const minutes = mine.reduce((sum, s) => sum + s.minutes, 0);
        const target = a.weeklyMinutesTarget ?? 0;
        return {
          _id: a._id,
          name: a.name,
          color: a.color,
          minutes,
          target,
          pct: target ? Math.round((minutes / target) * 100) : null,
          sessions: mine.length,
        };
      });
    const reviewAnswers = logs.filter((l) => l.state === "review");
    const sample = reviewAnswers.length >= 5 ? reviewAnswers : logs;
    return {
      weekStart: start,
      totalMinutes: perArea.reduce((a, x) => a + x.minutes, 0),
      targetMinutes: perArea.reduce((a, x) => a + x.target, 0),
      areas: perArea,
      sessions: sessions.length,
      ideasCreated: sessions.filter((s) => s.ideaNoteId).length,
      gapsAdded,
      gapsClosed,
      recallReviews: logs.length,
      recallRetention: sample.length ? Math.round((sample.filter((l) => l.rating > 1).length / sample.length) * 100) : null,
      seedsCreated: seeds.length,
      resourcesFinished: resources.filter((r) => r.finishedAt && r.finishedAt >= startMs && r.finishedAt <= endMs).length,
    };
  },
});

// ═════════════════════════════════════════════════════════════════════════
// Learning areas
// ═════════════════════════════════════════════════════════════════════════

export const createArea = mutation({
  args: {
    name: v.string(),
    targetPerformance: v.optional(v.string()),
    why: v.optional(v.string()),
    map: v.optional(v.string()),
    weeklyMinutesTarget: v.optional(v.number()),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    goalId: v.optional(v.id("goals")),
    pillarId: v.optional(v.id("contentPillars")),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const name = args.name.trim();
    if (!name) throw new ConvexError("Give the learning area a name.");
    await ownOptional(ctx, userId, args.lifeAreaId);
    await ownOptional(ctx, userId, args.goalId);
    await ownOptional(ctx, userId, args.pillarId);
    return ctx.db.insert("learningAreas", {
      userId,
      name,
      targetPerformance: args.targetPerformance?.trim() || undefined,
      why: args.why?.trim() || undefined,
      map: args.map,
      weeklyMinutesTarget: args.weeklyMinutesTarget != null ? Math.max(0, Math.round(args.weeklyMinutesTarget)) : undefined,
      lifeAreaId: args.lifeAreaId,
      goalId: args.goalId,
      pillarId: args.pillarId,
      color: args.color,
      gaps: [],
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const updateArea = mutation({
  args: {
    id: v.id("learningAreas"),
    name: v.optional(v.string()),
    targetPerformance: v.optional(v.union(v.string(), v.null())),
    why: v.optional(v.union(v.string(), v.null())),
    map: v.optional(v.union(v.string(), v.null())),
    weeklyMinutesTarget: v.optional(v.union(v.number(), v.null())),
    lifeAreaId: v.optional(v.union(v.id("lifeAreas"), v.null())),
    goalId: v.optional(v.union(v.id("goals"), v.null())),
    pillarId: v.optional(v.union(v.id("contentPillars"), v.null())),
    color: v.optional(v.union(v.string(), v.null())),
    status: v.optional(areaStatusV),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    await ownArea(ctx, userId, id);
    await ownOptional(ctx, userId, rest.lifeAreaId);
    await ownOptional(ctx, userId, rest.goalId);
    await ownOptional(ctx, userId, rest.pillarId);
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      patch[k] = val === null ? undefined : val;
    }
    if (typeof patch.name === "string") {
      patch.name = (patch.name as string).trim();
      if (!patch.name) throw new ConvexError("Name can't be empty.");
    }
    if (typeof patch.weeklyMinutesTarget === "number") patch.weeklyMinutesTarget = Math.max(0, Math.round(patch.weeklyMinutesTarget as number));
    await ctx.db.patch(id, patch);
  },
});

/** Delete an area with its skills and sessions; resources, cards and notes are kept (unlinked). */
export const removeArea = mutation({
  args: { id: v.id("learningAreas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await ownArea(ctx, userId, id);
    for (const s of await ctx.db.query("skillNodes").withIndex("by_area", (q) => q.eq("learningAreaId", id)).collect()) await ctx.db.delete(s._id);
    for (const s of await ctx.db.query("practiceSessions").withIndex("by_area", (q) => q.eq("learningAreaId", id)).collect()) await ctx.db.delete(s._id);
    for (const r of await ctx.db.query("resources").withIndex("by_user", (q) => q.eq("userId", userId)).collect())
      if (r.learningAreaId === id) await ctx.db.patch(r._id, { learningAreaId: undefined });
    for (const c of await ctx.db.query("recallCards").withIndex("by_user", (q) => q.eq("userId", userId)).collect())
      if (c.learningAreaId === id) await ctx.db.patch(c._id, { learningAreaId: undefined, skillNodeId: undefined });
    for (const n of await ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).collect())
      if (n.learningAreaId === id) await ctx.db.patch(n._id, { learningAreaId: undefined });
    await ctx.db.delete(id);
  },
});

// ── "Things I don't know" (Feynman's notebook) ──
export const addGap = mutation({
  args: { id: v.id("learningAreas"), text: v.string(), date: v.string() },
  handler: async (ctx, { id, text, date }) => {
    const userId = await requireUser(ctx);
    const area = await ownArea(ctx, userId, id);
    const { gaps, added } = addGaps(area, splitLines(text), date);
    if (added) await ctx.db.patch(id, { gaps });
    return added;
  },
});

export const setGap = mutation({
  args: { id: v.id("learningAreas"), gapId: v.string(), resolved: v.optional(v.boolean()), text: v.optional(v.string()), date: v.string() },
  handler: async (ctx, { id, gapId: gid, resolved, text, date }) => {
    const userId = await requireUser(ctx);
    const area = await ownArea(ctx, userId, id);
    const gaps = (area.gaps ?? []).map((g) => {
      if (g.id !== gid) return g;
      const next = { ...g };
      if (text !== undefined && text.trim()) next.text = text.trim().slice(0, 240);
      if (resolved !== undefined) {
        next.resolved = resolved;
        next.resolvedOn = resolved ? date : undefined;
      }
      return next;
    });
    await ctx.db.patch(id, { gaps });
  },
});

export const removeGap = mutation({
  args: { id: v.id("learningAreas"), gapId: v.string() },
  handler: async (ctx, { id, gapId: gid }) => {
    const userId = await requireUser(ctx);
    const area = await ownArea(ctx, userId, id);
    await ctx.db.patch(id, { gaps: (area.gaps ?? []).filter((g) => g.id !== gid) });
  },
});

// ═════════════════════════════════════════════════════════════════════════
// Skill tree
// ═════════════════════════════════════════════════════════════════════════

async function ownSkill(ctx: Ctx, userId: Id<"users">, id: Id<"skillNodes">) {
  const s = await ctx.db.get(id);
  if (!s || s.userId !== userId) throw new ConvexError("Skill not found.");
  return s;
}

async function nextOrder(ctx: Ctx, areaId: Id<"learningAreas">, parentId?: Id<"skillNodes">) {
  const nodes = await ctx.db
    .query("skillNodes")
    .withIndex("by_area", (q) => q.eq("learningAreaId", areaId))
    .collect();
  const siblings = nodes.filter((n) => n.parentId === parentId);
  return siblings.reduce((m, n) => Math.max(m, n.order), 0) + 1;
}

export const addSkill = mutation({
  args: { learningAreaId: v.id("learningAreas"), title: v.string(), parentId: v.optional(v.id("skillNodes")), status: v.optional(skillStatusV) },
  handler: async (ctx, { learningAreaId, title, parentId, status }) => {
    const userId = await requireUser(ctx);
    await ownArea(ctx, userId, learningAreaId);
    if (parentId) {
      const p = await ownSkill(ctx, userId, parentId);
      if (p.learningAreaId !== learningAreaId) throw new ConvexError("Parent skill is in another area.");
    }
    const t = title.trim();
    if (!t) throw new ConvexError("Name the skill.");
    return ctx.db.insert("skillNodes", {
      userId,
      learningAreaId,
      title: t.slice(0, 160),
      parentId,
      status: status ?? "todo",
      order: await nextOrder(ctx, learningAreaId, parentId),
    });
  },
});

/** Insert an approved skill map (AI suggestion): top-level skills with children. */
export const addSkills = mutation({
  args: {
    learningAreaId: v.id("learningAreas"),
    items: v.array(v.object({ title: v.string(), children: v.optional(v.array(v.string())) })),
    parentId: v.optional(v.id("skillNodes")),
  },
  handler: async (ctx, { learningAreaId, items, parentId }) => {
    const userId = await requireUser(ctx);
    await ownArea(ctx, userId, learningAreaId);
    if (parentId) await ownSkill(ctx, userId, parentId);
    let order = await nextOrder(ctx, learningAreaId, parentId);
    let n = 0;
    for (const it of items.slice(0, 30)) {
      if (!it.title.trim()) continue;
      const id = await ctx.db.insert("skillNodes", {
        userId,
        learningAreaId,
        title: it.title.trim().slice(0, 160),
        parentId,
        status: "todo",
        order: order++,
      });
      n++;
      let childOrder = 1;
      for (const c of (it.children ?? []).slice(0, 15)) {
        if (!c.trim()) continue;
        await ctx.db.insert("skillNodes", {
          userId,
          learningAreaId,
          title: c.trim().slice(0, 160),
          parentId: id,
          status: "todo",
          order: childOrder++,
        });
        n++;
      }
    }
    return n;
  },
});

export const updateSkill = mutation({
  args: {
    id: v.id("skillNodes"),
    title: v.optional(v.string()),
    status: v.optional(skillStatusV),
    notes: v.optional(v.union(v.string(), v.null())),
    parentId: v.optional(v.union(v.id("skillNodes"), v.null())),
  },
  handler: async (ctx, { id, title, status, notes, parentId }) => {
    const userId = await requireUser(ctx);
    const skill = await ownSkill(ctx, userId, id);
    const patch: Partial<SkillDoc> = {};
    if (title !== undefined) {
      if (!title.trim()) throw new ConvexError("Name can't be empty.");
      patch.title = title.trim().slice(0, 160);
    }
    if (status) patch.status = status;
    if (notes !== undefined) patch.notes = notes ?? undefined;
    if (parentId !== undefined) {
      if (parentId) {
        // Refuse cycles: the new parent can't be this node or one of its descendants.
        const all = await ctx.db
          .query("skillNodes")
          .withIndex("by_area", (q) => q.eq("learningAreaId", skill.learningAreaId))
          .collect();
        let cur: SkillDoc | undefined = all.find((n) => n._id === parentId);
        if (!cur) throw new ConvexError("Parent skill not found.");
        while (cur) {
          if (cur._id === id) throw new ConvexError("A skill can't sit under itself.");
          const pid: Id<"skillNodes"> | undefined = cur.parentId;
          cur = pid ? all.find((n) => n._id === pid) : undefined;
        }
      }
      patch.parentId = parentId ?? undefined;
      patch.order = await nextOrder(ctx, skill.learningAreaId, parentId ?? undefined);
    }
    await ctx.db.patch(id, patch);
  },
});

/** Move a skill up/down among its siblings. */
export const moveSkill = mutation({
  args: { id: v.id("skillNodes"), direction: v.union(v.literal("up"), v.literal("down")) },
  handler: async (ctx, { id, direction }) => {
    const userId = await requireUser(ctx);
    const skill = await ownSkill(ctx, userId, id);
    const siblings = (
      await ctx.db
        .query("skillNodes")
        .withIndex("by_area", (q) => q.eq("learningAreaId", skill.learningAreaId))
        .collect()
    )
      .filter((n) => n.parentId === skill.parentId)
      .sort((a, b) => a.order - b.order);
    const i = siblings.findIndex((s) => s._id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= siblings.length) return;
    // Normalise orders, then swap.
    for (let k = 0; k < siblings.length; k++) siblings[k] = { ...siblings[k], order: k + 1 };
    const a = siblings[i];
    const b = siblings[j];
    for (const s of siblings) {
      const order = s._id === a._id ? b.order : s._id === b._id ? a.order : s.order;
      await ctx.db.patch(s._id, { order });
    }
  },
});

/** Delete a skill; its children move up to its parent. */
export const removeSkill = mutation({
  args: { id: v.id("skillNodes") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const skill = await ownSkill(ctx, userId, id);
    const nodes = await ctx.db
      .query("skillNodes")
      .withIndex("by_area", (q) => q.eq("learningAreaId", skill.learningAreaId))
      .collect();
    for (const c of nodes.filter((n) => n.parentId === id)) await ctx.db.patch(c._id, { parentId: skill.parentId });
    for (const s of await ctx.db
      .query("practiceSessions")
      .withIndex("by_area", (q) => q.eq("learningAreaId", skill.learningAreaId))
      .collect())
      if (s.skillNodeId === id) await ctx.db.patch(s._id, { skillNodeId: undefined });
    await ctx.db.delete(id);
  },
});

// ═════════════════════════════════════════════════════════════════════════
// Practice sessions
// ═════════════════════════════════════════════════════════════════════════

/**
 * Log a session. Gaps found (one per line) join the area's "things I don't
 * know" list. "What can you now explain?" becomes an `idea` note linked to the
 * area. +XP.practice (key `practice-<sessionId>`).
 */
export const logPractice = mutation({
  args: {
    learningAreaId: v.id("learningAreas"),
    date: v.string(),
    minutes: v.number(),
    kind: practiceKindV,
    skillNodeId: v.optional(v.id("skillNodes")),
    whatPracticed: v.optional(v.string()),
    gapsFound: v.optional(v.string()),
    explainNow: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const area = await ownArea(ctx, userId, args.learningAreaId);
    const minutes = Math.max(1, Math.min(24 * 60, Math.round(args.minutes)));
    let skill: SkillDoc | null = null;
    if (args.skillNodeId) {
      skill = await ownSkill(ctx, userId, args.skillNodeId);
      if (skill.learningAreaId !== area._id) throw new ConvexError("That skill belongs to another area.");
    }
    const sessionId = await ctx.db.insert("practiceSessions", {
      userId,
      learningAreaId: area._id,
      skillNodeId: skill?._id,
      date: args.date,
      minutes,
      kind: args.kind,
      whatPracticed: args.whatPracticed?.trim() || undefined,
      gapsFound: args.gapsFound?.trim() || undefined,
      explainNow: args.explainNow?.trim() || undefined,
      createdAt: Date.now(),
    });

    const gapLines = splitLines(args.gapsFound);
    let gapsAdded = 0;
    if (gapLines.length) {
      const { gaps, added } = addGaps(area, gapLines, args.date);
      gapsAdded = added;
      if (added) await ctx.db.patch(area._id, { gaps });
    }

    let ideaNoteId: Id<"notes"> | undefined;
    const explain = args.explainNow?.trim();
    if (explain) {
      const firstLine = explain.split(/\r?\n/)[0].replace(/^#+\s*/, "").trim();
      const sentence = firstLine.split(/(?<=[.!?])\s/)[0] ?? firstLine;
      const title = (sentence.length > 90 ? `${sentence.slice(0, 87).trimEnd()}…` : sentence) || `${area.name} — what I can explain`;
      const meta = [
        `From a ${args.kind} session in **${area.name}**${skill ? ` · ${skill.title}` : ""} (${minutes} min, ${args.date}).`,
        args.whatPracticed?.trim() ? `Practiced: ${args.whatPracticed.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      ideaNoteId = await ctx.db.insert("notes", {
        userId,
        title,
        content: `${explain}\n\n---\n${meta}`,
        noteType: "idea",
        noteStatus: "processed",
        learningAreaId: area._id,
        lifeAreaId: area.lifeAreaId,
        tags: ["learning"],
      });
      await ctx.db.patch(sessionId, { ideaNoteId });
    }

    const awarded = await awardXp(ctx, userId, `practice-${sessionId}`, XP.practice, `Practice · ${area.name}`, args.date);
    return { sessionId, ideaNoteId, gapsAdded, xp: awarded ? XP.practice : 0 };
  },
});

export const removePractice = mutation({
  args: { id: v.id("practiceSessions") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const s = await ctx.db.get(id);
    if (!s || s.userId !== userId) return;
    await ctx.db.delete(id);
    await revokeXp(ctx, userId, `practice-${id}`);
  },
});

// ═════════════════════════════════════════════════════════════════════════
// Learn in public
// ═════════════════════════════════════════════════════════════════════════

/**
 * Turn a note into a content seed (contentPieces, stage "seed", brand
 * personal) linked back to the note and its learning area / pillar, and mark
 * the note `madePublic`. Optional `script`/`hook` come from an accepted
 * Feynman draft. Returns the existing seed if one was already made.
 */
export const makePublic = mutation({
  args: {
    noteId: v.id("notes"),
    title: v.optional(v.string()),
    script: v.optional(v.string()),
    hook: v.optional(v.string()),
    format: v.optional(v.string()),
  },
  handler: async (ctx, { noteId, title, script, hook, format }) => {
    const userId = await requireUser(ctx);
    const note = await ctx.db.get(noteId);
    if (!note || note.userId !== userId) throw new ConvexError("Note not found.");
    const pieces = await ctx.db
      .query("contentPieces")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const existing = pieces.find((p) => p.sourceNoteId === noteId && p.stage !== "archived");
    if (existing) {
      if (!note.madePublic) await ctx.db.patch(noteId, { madePublic: true });
      return { pieceId: existing._id, existing: true };
    }
    const area = note.learningAreaId ? await ctx.db.get(note.learningAreaId) : null;
    const pillarId = area && area.userId === userId ? area.pillarId : undefined;
    const body = note.content.replace(/\n---\n[\s\S]*$/, "").trim();
    const pieceId = await ctx.db.insert("contentPieces", {
      userId,
      title: (title?.trim() || note.title).slice(0, 200),
      brand: "personal",
      pillarId,
      format: format ?? "text_post",
      stage: "seed",
      hook: hook?.trim() || undefined,
      brief: (note.summary?.trim() || body.slice(0, 600)) || undefined,
      script: script?.trim() || undefined,
      sourceNoteId: noteId,
      learningAreaId: area && area.userId === userId ? area._id : undefined,
      createdAt: Date.now(),
    });
    await ctx.db.patch(noteId, { madePublic: true });
    return { pieceId, existing: false };
  },
});
