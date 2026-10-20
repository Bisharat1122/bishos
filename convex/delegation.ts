/**
 * Delegation (module E) — Buy Back Your Time + EOS Process Documenter.
 *  • Time audit: log blocks, rate $ value (1–4) and energy.
 *  • DRIP: Production (high $ + energizing), Investment (low $ + energizing),
 *    Replacement (high $ + draining), Delegation (low $ + draining).
 *    High $ = value ≥ 3; "neutral" counts as energizing.
 *  • Buyback Rate = annualIncome ÷ 2000 ÷ 4.
 *  • Process library (SOPs) + Replacement Ladder readiness per rung.
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, getSettings, mondayOf } from "./os";

const energyValidator = v.union(v.literal("energizing"), v.literal("neutral"), v.literal("draining"));
const rungValidator = v.union(
  v.literal("admin"),
  v.literal("delivery"),
  v.literal("marketing"),
  v.literal("sales"),
  v.literal("leadership"),
);
const statusValidator = v.union(v.literal("draft"), v.literal("documented"), v.literal("delegated"));
const frequencyValidator = v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("adhoc"));
const stepValidator = v.object({ id: v.string(), text: v.string() });

export const RUNGS = ["admin", "delivery", "marketing", "sales", "leadership"] as const;
export type Rung = (typeof RUNGS)[number];
export type Quadrant = "production" | "investment" | "replacement" | "delegation";
type Energy = Doc<"timeAudit">["energy"];

export function dripQuadrant(value: number, energy: Energy): Quadrant {
  const high = value >= 3;
  const energizing = energy !== "draining";
  if (high) return energizing ? "production" : "replacement";
  return energizing ? "investment" : "delegation";
}

const clampValue = (n: number) => Math.max(1, Math.min(4, Math.round(n)));

/** A client-supplied life area id must belong to the caller. */
async function assertOwnArea(ctx: MutationCtx, userId: Id<"users">, id: Id<"lifeAreas"> | null | undefined) {
  if (!id) return;
  const a = await ctx.db.get(id);
  if (!a || a.userId !== userId) throw new ConvexError("Pick one of your life areas.");
}

async function auditWindow(ctx: QueryCtx, userId: Id<"users">, from: string, to: string) {
  return ctx.db
    .query("timeAudit")
    .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", from).lte("date", to))
    .collect();
}

/** Group entries by activity (case-insensitive) within a quadrant. */
function groupActivities(entries: Doc<"timeAudit">[]) {
  const by = new Map<
    string,
    { activity: string; minutes: number; count: number; valueSum: number; energy: Record<Energy, number>; lifeAreaId?: Id<"lifeAreas"> }
  >();
  for (const e of entries) {
    const key = e.activity.trim().toLowerCase();
    const g = by.get(key) ?? {
      activity: e.activity.trim(),
      minutes: 0,
      count: 0,
      valueSum: 0,
      energy: { energizing: 0, neutral: 0, draining: 0 },
      lifeAreaId: e.lifeAreaId,
    };
    g.minutes += e.minutes;
    g.count++;
    g.valueSum += e.value;
    g.energy[e.energy] += e.minutes;
    by.set(key, g);
  }
  return [...by.values()]
    .map((g) => {
      const energy = (Object.entries(g.energy).sort((a, b) => b[1] - a[1])[0][0] ?? "neutral") as Energy;
      const value = clampValue(g.valueSum / g.count);
      return { activity: g.activity, minutes: g.minutes, count: g.count, value, energy, lifeAreaId: g.lifeAreaId };
    })
    .sort((a, b) => b.minutes - a.minutes);
}

// ─────────────────────────────────────────────────────────────────────────
// Time audit
// ─────────────────────────────────────────────────────────────────────────

/** The 2-week audit: entries, days logged of 14, minutes per day, recent activities. */
export const audit = query({
  args: { today: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, { today, days }) => {
    const userId = await requireUser(ctx);
    const span = Math.max(1, Math.min(60, days ?? 14));
    const from = addDays(today, -(span - 1));
    const entries = await auditWindow(ctx, userId, from, today);
    const byDay = new Map<string, number>();
    for (const e of entries) byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.minutes);
    const recentAll = await auditWindow(ctx, userId, addDays(today, -60), today);
    const seen = new Map<string, Doc<"timeAudit">>();
    for (const e of recentAll.sort((a, b) => b.createdAt - a.createdAt)) {
      const k = e.activity.trim().toLowerCase();
      if (!seen.has(k)) seen.set(k, e);
    }
    return {
      from,
      to: today,
      windowDays: span,
      daysLogged: byDay.size,
      totalMin: entries.reduce((s, e) => s + e.minutes, 0),
      byDay: Array.from({ length: span }, (_, i) => {
        const date = addDays(from, i);
        return { date, minutes: byDay.get(date) ?? 0 };
      }),
      entries: entries.sort((a, b) => b.date.localeCompare(a.date) || (b.startMin ?? -1) - (a.startMin ?? -1) || b.createdAt - a.createdAt),
      recentActivities: [...seen.values()].slice(0, 12).map((e) => ({
        activity: e.activity,
        value: e.value,
        energy: e.energy,
        lifeAreaId: e.lifeAreaId ?? null,
        minutes: e.minutes,
      })),
    };
  },
});

export const logAudit = mutation({
  args: {
    date: v.string(),
    activity: v.string(),
    minutes: v.optional(v.number()),
    startMin: v.optional(v.number()),
    endMin: v.optional(v.number()),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    value: v.number(),
    energy: energyValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (!args.activity.trim()) throw new ConvexError("What were you doing? Add a short activity name.");
    let minutes = args.minutes ?? 0;
    if (args.startMin != null && args.endMin != null) {
      const span = args.endMin - args.startMin;
      minutes = span > 0 ? span : span + 24 * 60;
    }
    minutes = Math.round(minutes);
    if (!(minutes > 0) || minutes > 24 * 60) throw new ConvexError("Add how long it took (minutes, or a start and end time).");
    if (args.lifeAreaId) {
      const a = await ctx.db.get(args.lifeAreaId);
      if (!a || a.userId !== userId) throw new ConvexError("Pick one of your life areas.");
    }
    return ctx.db.insert("timeAudit", {
      userId,
      date: args.date,
      startMin: args.startMin,
      minutes,
      activity: args.activity.trim(),
      lifeAreaId: args.lifeAreaId,
      value: clampValue(args.value),
      energy: args.energy,
      createdAt: Date.now(),
    });
  },
});

export const updateAudit = mutation({
  args: {
    id: v.id("timeAudit"),
    activity: v.optional(v.string()),
    minutes: v.optional(v.number()),
    value: v.optional(v.number()),
    energy: v.optional(energyValidator),
    lifeAreaId: v.optional(v.union(v.id("lifeAreas"), v.null())),
    date: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const e = await ctx.db.get(id);
    if (!e || e.userId !== userId) return;
    await assertOwnArea(ctx, userId, rest.lifeAreaId);
    const patch: Partial<Doc<"timeAudit">> = {};
    if (rest.activity?.trim()) patch.activity = rest.activity.trim();
    if (rest.minutes != null && rest.minutes > 0) patch.minutes = Math.round(rest.minutes);
    if (rest.value != null) patch.value = clampValue(rest.value);
    if (rest.energy) patch.energy = rest.energy;
    if (rest.date) patch.date = rest.date;
    if (rest.lifeAreaId !== undefined) patch.lifeAreaId = rest.lifeAreaId ?? undefined;
    await ctx.db.patch(id, patch);
  },
});

export const removeAudit = mutation({
  args: { id: v.id("timeAudit") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const e = await ctx.db.get(id);
    if (!e || e.userId !== userId) return;
    await ctx.db.delete(id);
  },
});

/** DRIP matrix over the audit window: hours + activities per quadrant. */
export const drip = query({
  args: { today: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, { today, days }) => {
    const userId = await requireUser(ctx);
    const span = Math.max(1, Math.min(90, days ?? 14));
    const entries = await auditWindow(ctx, userId, addDays(today, -(span - 1)), today);
    const quads: Record<Quadrant, Doc<"timeAudit">[]> = { production: [], investment: [], replacement: [], delegation: [] };
    for (const e of entries) quads[dripQuadrant(e.value, e.energy)].push(e);
    const totalMin = entries.reduce((s, e) => s + e.minutes, 0);
    const out = (Object.keys(quads) as Quadrant[]).map((q) => {
      const minutes = quads[q].reduce((s, e) => s + e.minutes, 0);
      return { key: q, minutes, pct: totalMin ? Math.round((minutes / totalMin) * 100) : 0, activities: groupActivities(quads[q]) };
    });
    const energizing = out.filter((q) => q.key === "production" || q.key === "investment").reduce((s, q) => s + q.minutes, 0);
    return {
      quadrants: out,
      totalMin,
      energizingPct: totalMin ? Math.round((energizing / totalMin) * 100) : 0,
      entries: entries.length,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Buyback
// ─────────────────────────────────────────────────────────────────────────

export const buyback = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const settings = await getSettings(ctx, userId);
    const income = settings.annualIncome || 0;
    const hourly = income / 2000;
    const rate = hourly / 4;
    const entries = await auditWindow(ctx, userId, addDays(today, -13), today);
    const weeks = Math.max(1, new Set(entries.map((e) => mondayOf(e.date))).size);
    const daysLogged = new Set(entries.map((e) => e.date)).size;
    const low = entries.filter((e) => e.value <= 2);
    const candidates = groupActivities(low).map((g) => {
      const hoursPerWeek = g.minutes / 60 / weeks;
      return {
        ...g,
        quadrant: dripQuadrant(g.value, g.energy),
        hoursPerWeek: Math.round(hoursPerWeek * 10) / 10,
        costPerWeek: Math.round(hoursPerWeek * rate * 100) / 100,
      };
    });
    // Delegation-quadrant items first (low $ + draining), then by hours.
    candidates.sort((a, b) => Number(b.quadrant === "delegation") - Number(a.quadrant === "delegation") || b.hoursPerWeek - a.hoursPerWeek);

    const tasks = (await ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect())
      .filter((t) => t.delegate && t.status !== "done")
      .slice(0, 40)
      .map((t) => ({
        _id: t._id,
        title: t.title,
        estimateMin: t.estimateMin ?? null,
        cost: t.estimateMin ? Math.round((t.estimateMin / 60) * rate * 100) / 100 : null,
      }));

    const totalHoursPerWeek = Math.round(candidates.reduce((s, c) => s + c.hoursPerWeek, 0) * 10) / 10;
    return {
      annualIncome: income,
      currency: settings.currency || "USD",
      hourly: Math.round(hourly * 100) / 100,
      rate: Math.round(rate * 100) / 100,
      weeks,
      daysLogged,
      candidates,
      tasks,
      totalHoursPerWeek,
      totalCostPerWeek: Math.round(totalHoursPerWeek * rate * 100) / 100,
      // What those hours are worth at your own hourly value.
      valueOfHoursPerWeek: Math.round(totalHoursPerWeek * hourly * 100) / 100,
    };
  },
});

/** Upsert ONLY annualIncome + currency on userSettings (core-owned table). */
export const setIncome = mutation({
  args: { annualIncome: v.number(), currency: v.string() },
  handler: async (ctx, { annualIncome, currency }) => {
    const userId = await requireUser(ctx);
    const income = Math.max(0, Math.round(annualIncome));
    const cur = currency.trim().toUpperCase().slice(0, 6) || "USD";
    const doc = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (doc) await ctx.db.patch(doc._id, { annualIncome: income, currency: cur });
    else await ctx.db.insert("userSettings", { userId, annualIncome: income, currency: cur });
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Processes (SOPs)
// ─────────────────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<string, number> = { draft: 0, documented: 1, delegated: 2 };

export const processes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const list = await ctx.db.query("processes").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const out = [];
    for (const p of list) {
      const task = p.sourceTaskId ? await ctx.db.get(p.sourceTaskId) : null;
      out.push({ ...p, stepCount: p.steps.length, sourceTaskTitle: task && task.userId === userId ? task.title : null });
    }
    return out.sort(
      (a, b) =>
        RUNGS.indexOf(a.rung) - RUNGS.indexOf(b.rung) ||
        (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0) ||
        b.createdAt - a.createdAt,
    );
  },
});

const processFields = {
  title: v.optional(v.string()),
  rung: v.optional(rungValidator),
  lifeAreaId: v.optional(v.union(v.id("lifeAreas"), v.null())),
  trigger: v.optional(v.union(v.string(), v.null())),
  steps: v.optional(v.array(stepValidator)),
  tools: v.optional(v.array(v.string())),
  owner: v.optional(v.union(v.string(), v.null())),
  recordingUrl: v.optional(v.union(v.string(), v.null())),
  status: v.optional(statusValidator),
  frequency: v.optional(v.union(frequencyValidator, v.null())),
  notes: v.optional(v.union(v.string(), v.null())),
};

const cleanSteps = (steps: { id: string; text: string }[]) =>
  steps
    .map((s, i) => ({ id: s.id || `p${Date.now().toString(36)}${i}`, text: s.text.trim() }))
    .filter((s) => s.text);

function processPatch(rest: {
  title?: string;
  rung?: Rung;
  lifeAreaId?: Id<"lifeAreas"> | null;
  trigger?: string | null;
  steps?: { id: string; text: string }[];
  tools?: string[];
  owner?: string | null;
  recordingUrl?: string | null;
  status?: Doc<"processes">["status"];
  frequency?: Doc<"processes">["frequency"] | null;
  notes?: string | null;
}) {
  const patch: Partial<Doc<"processes">> = {};
  if (rest.title !== undefined && rest.title.trim()) patch.title = rest.title.trim();
  if (rest.rung !== undefined) patch.rung = rest.rung;
  if (rest.lifeAreaId !== undefined) patch.lifeAreaId = rest.lifeAreaId ?? undefined;
  if (rest.trigger !== undefined) patch.trigger = rest.trigger?.trim() || undefined;
  if (rest.steps !== undefined) patch.steps = cleanSteps(rest.steps);
  if (rest.tools !== undefined) patch.tools = rest.tools.map((t) => t.trim()).filter(Boolean);
  if (rest.owner !== undefined) patch.owner = rest.owner?.trim() || undefined;
  if (rest.recordingUrl !== undefined) {
    const u = rest.recordingUrl?.trim();
    // Only http(s) links (Loom, Drive…) — anything else gets an https:// prefix.
    patch.recordingUrl = u ? (/^https?:\/\//i.test(u) ? u : `https://${u.replace(/^[a-z]+:\/*/i, "")}`) : undefined;
  }
  if (rest.status !== undefined) patch.status = rest.status;
  if (rest.frequency !== undefined) patch.frequency = rest.frequency ?? undefined;
  if (rest.notes !== undefined) patch.notes = rest.notes?.trim() || undefined;
  return patch;
}

export const createProcess = mutation({
  args: { ...processFields, title: v.string(), rung: rungValidator, sourceTaskId: v.optional(v.id("tasks")) },
  handler: async (ctx, { sourceTaskId, ...rest }) => {
    const userId = await requireUser(ctx);
    if (!rest.title.trim()) throw new ConvexError("Give the process a title.");
    if (sourceTaskId) {
      const t = await ctx.db.get(sourceTaskId);
      if (!t || t.userId !== userId) throw new ConvexError("That task no longer exists.");
    }
    await assertOwnArea(ctx, userId, rest.lifeAreaId);
    const patch = processPatch(rest);
    return ctx.db.insert("processes", {
      userId,
      title: rest.title.trim(),
      rung: rest.rung,
      steps: patch.steps ?? [],
      status: patch.status ?? "draft",
      owner: patch.owner ?? "me",
      lifeAreaId: patch.lifeAreaId,
      trigger: patch.trigger,
      tools: patch.tools,
      recordingUrl: patch.recordingUrl,
      frequency: patch.frequency,
      notes: patch.notes,
      sourceTaskId,
      createdAt: Date.now(),
    });
  },
});

export const updateProcess = mutation({
  args: { id: v.id("processes"), ...processFields },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const p = await ctx.db.get(id);
    if (!p || p.userId !== userId) return;
    await assertOwnArea(ctx, userId, rest.lifeAreaId);
    await ctx.db.patch(id, processPatch(rest));
  },
});

export const markPerformed = mutation({
  args: { id: v.id("processes") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const p = await ctx.db.get(id);
    if (!p || p.userId !== userId) return;
    await ctx.db.patch(id, { lastPerformedAt: Date.now() });
  },
});

export const removeProcess = mutation({
  args: { id: v.id("processes") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const p = await ctx.db.get(id);
    if (!p || p.userId !== userId) return;
    await ctx.db.delete(id);
  },
});

/** Best-guess ladder rung for a task (deal → sales, content → marketing, area name…). */
function guessRung(t: Doc<"tasks">, areaName: string | undefined): Rung {
  if (t.dealId || t.personId) return "sales";
  if (t.contentId) return "marketing";
  const n = (areaName ?? "").toLowerCase();
  if (/sales|pipeline|outreach/.test(n)) return "sales";
  if (/market|content|brand/.test(n)) return "marketing";
  if (/operation|delivery|client/.test(n)) return "delivery";
  if (/lead|strategy|vision/.test(n)) return "leadership";
  return "admin";
}

async function delegateQueue(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const [tasks, procs, areas] = await Promise.all([
    ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("processes").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
  ]);
  const linked = new Set(procs.map((p) => p.sourceTaskId).filter(Boolean) as string[]);
  const areaName = new Map(areas.map((a) => [a._id as string, a.name]));
  return {
    procs,
    queue: tasks
      .filter((t) => t.delegate && !linked.has(t._id))
      .map((t) => ({
        _id: t._id,
        title: t.title,
        status: t.status,
        lifeAreaId: t.lifeAreaId,
        areaName: areaName.get(t.lifeAreaId) ?? null,
        rung: guessRung(t, areaName.get(t.lifeAreaId)),
        estimateMin: t.estimateMin ?? null,
      }))
      .sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || a.title.localeCompare(b.title)),
  };
}

/** "Record this next time": tasks flagged delegate with no SOP yet. */
export const recordQueue = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return (await delegateQueue(ctx, userId)).queue.slice(0, 60);
  },
});

/** Create a draft SOP from a delegate-flagged task (sets sourceTaskId). */
export const createFromTask = mutation({
  args: { taskId: v.id("tasks"), rung: v.optional(rungValidator) },
  handler: async (ctx, { taskId, rung }) => {
    const userId = await requireUser(ctx);
    const t = await ctx.db.get(taskId);
    if (!t || t.userId !== userId) throw new ConvexError("That task no longer exists.");
    const existing = (await ctx.db.query("processes").withIndex("by_user", (q) => q.eq("userId", userId)).collect()).find(
      (p) => p.sourceTaskId === taskId,
    );
    if (existing) return existing._id;
    const area = await ctx.db.get(t.lifeAreaId);
    return ctx.db.insert("processes", {
      userId,
      title: t.title,
      lifeAreaId: t.lifeAreaId,
      rung: rung ?? guessRung(t, area?.name),
      trigger: undefined,
      steps: [],
      owner: "me",
      status: "draft",
      frequency: "adhoc",
      sourceTaskId: taskId,
      notes: t.description ? t.description.slice(0, 2000) : undefined,
      createdAt: Date.now(),
    });
  },
});

/**
 * Replacement Ladder: readiness per rung = (documented + delegated) ÷
 * (processes on the rung + delegate-flagged tasks with no SOP yet).
 */
export const ladder = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const { procs, queue } = await delegateQueue(ctx, userId);
    const open = queue.filter((t) => t.status !== "done");
    const rungs = RUNGS.map((rung) => {
      const ps = procs.filter((p) => p.rung === rung);
      const documented = ps.filter((p) => p.status === "documented").length;
      const delegated = ps.filter((p) => p.status === "delegated").length;
      const draft = ps.filter((p) => p.status === "draft").length;
      const undocumentedTasks = open.filter((t) => t.rung === rung).length;
      const total = ps.length + undocumentedTasks;
      return {
        rung,
        processes: ps.length,
        documented,
        delegated,
        draft,
        undocumentedTasks,
        total,
        readiness: total ? Math.round(((documented + delegated) / total) * 100) : 0,
      };
    });
    // Hint: climb the ladder in order — the first rung that isn't handed off yet.
    const first = rungs.find((r) => r.delegated < r.total || r.total === 0) ?? rungs[rungs.length - 1];
    let hint: string;
    if (first.total === 0) {
      hint =
        first.rung === "admin"
          ? "Start with admin: inbox, invoicing, scheduling. Record yourself doing one this week (Camcorder Method) and turn it into a 7–15 step SOP."
          : `Next rung: ${first.rung}. List the recurring ${first.rung} tasks you do and mark the first one "delegate".`;
    } else if (first.draft + first.undocumentedTasks > 0) {
      hint = `Finish documenting ${first.rung}: ${first.draft + first.undocumentedTasks} item${first.draft + first.undocumentedTasks === 1 ? "" : "s"} still need a written SOP. Record the next run, then write the 20% of steps that give 80% of the result.`;
    } else {
      hint = `${first.rung[0].toUpperCase()}${first.rung.slice(1)} is documented — it's ready to hand off. Delegate one SOP to a VA or contractor and mark it "delegated".`;
    }
    return { rungs, hint, focusRung: first.rung };
  },
});
