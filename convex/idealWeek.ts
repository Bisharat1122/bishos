/**
 * Ideal Week: a template of day types (Focus / Buffer / Free) and time blocks
 * (maker / manager / admin / routine / free) per weekday. "Apply" materializes
 * it into real scheduleBlocks for a week without overlapping or duplicating.
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, getSettings } from "./os";

export type BlockType = "maker" | "manager" | "admin" | "routine" | "free";
export type DayType = "focus" | "buffer" | "free";
export type TemplateDay = { weekday: number; dayType: DayType; theme?: string };
export type TemplateBlock = {
  id: string;
  weekday: number;
  startMin: number;
  endMin: number;
  title: string;
  blockType: BlockType;
  lifeAreaId?: Id<"lifeAreas">;
};

const blockTypeValidator = v.union(
  v.literal("maker"),
  v.literal("manager"),
  v.literal("admin"),
  v.literal("routine"),
  v.literal("free"),
);
const dayTypeValidator = v.union(v.literal("focus"), v.literal("buffer"), v.literal("free"));
const blockValidator = v.object({
  id: v.string(),
  weekday: v.number(),
  startMin: v.number(),
  endMin: v.number(),
  title: v.string(),
  blockType: blockTypeValidator,
  lifeAreaId: v.optional(v.id("lifeAreas")),
});
const dayValidator = v.object({ weekday: v.number(), dayType: dayTypeValidator, theme: v.optional(v.string()) });

const H = (h: number, m = 0) => h * 60 + m;

/** Find the user's areas by intent so the default template can tag blocks. */
function pickAreas(areas: Doc<"lifeAreas">[]) {
  const live = areas.filter((a) => !a.archived).sort((a, b) => a.order - b.order);
  const find = (re: RegExp) => live.find((a) => re.test(a.name))?._id;
  return {
    ops: find(/operat|deliver|client|admin/i) ?? live[0]?._id,
    sales: find(/sales|market|pipeline|growth/i) ?? live[1]?._id,
    content: find(/learn|content|brand|personal/i) ?? live[2]?._id,
    fitness: find(/fit|health|gym|body/i),
  };
}

/**
 * Default solo-founder week (synthesis from the Founder OS report):
 * maker mornings for delivery, manager afternoons for calls, a daily sales
 * block, Wednesday content hub, Thursday repurposing, Friday buffer + review,
 * a light Saturday and a protected Free Day (settings.freeWeekday, default Sun).
 */
export function defaultTemplate(areas: Doc<"lifeAreas">[], freeWeekday = 0): { days: TemplateDay[]; blocks: TemplateBlock[] } {
  const a = pickAreas(areas);
  const blocks: TemplateBlock[] = [];
  const add = (weekday: number, s: number, e: number, title: string, blockType: BlockType, lifeAreaId?: Id<"lifeAreas">) => {
    if (weekday === freeWeekday && blockType !== "free") return;
    blocks.push({ id: `d-${weekday}-${s}`, weekday, startMin: s, endMin: e, title, blockType, lifeAreaId });
  };
  for (const wd of [1, 2, 3, 4, 5]) add(wd, H(8, 30), H(9), "Start-up ritual", "routine");
  // Monday
  add(1, H(9), H(12, 30), "Delivery deep work", "maker", a.ops);
  add(1, H(13, 30), H(14, 30), "Outreach & follow-ups", "manager", a.sales);
  add(1, H(14, 30), H(17), "Client calls · office hours", "manager", a.ops);
  // Tuesday
  add(2, H(9), H(12, 30), "Delivery deep work", "maker", a.ops);
  add(2, H(13, 30), H(15), "Outreach & follow-ups", "manager", a.sales);
  add(2, H(15), H(17), "Discovery & sales calls", "manager", a.sales);
  // Wednesday
  add(3, H(9), H(12), "Content hub writing", "maker", a.content);
  add(3, H(13), H(14), "Outreach & follow-ups", "manager", a.sales);
  add(3, H(14), H(16), "Sales calls", "manager", a.sales);
  add(3, H(16), H(17, 30), "Pipeline review", "admin", a.sales);
  // Thursday
  add(4, H(9), H(12, 30), "Delivery deep work", "maker", a.ops);
  add(4, H(13, 30), H(14, 30), "Outreach & follow-ups", "manager", a.sales);
  add(4, H(14, 30), H(16), "Client calls", "manager", a.ops);
  add(4, H(16), H(17, 30), "Cut hub into short posts", "maker", a.content);
  // Friday — buffer + review
  add(5, H(9), H(12), "Buffer: processes, recordings, finance", "admin", a.ops);
  add(5, H(13), H(14), "Outreach & follow-ups", "manager", a.sales);
  add(5, H(14), H(15, 30), "Weekly review", "routine");
  add(5, H(15, 30), H(16, 30), "Co-founder sync", "manager", a.ops);
  for (const wd of [1, 2, 3, 4]) add(wd, H(17, 30), H(18), "Shutdown ritual", "routine");
  add(5, H(16, 30), H(17), "Shutdown ritual", "routine");
  // Fitness + a light Saturday
  for (const wd of [1, 3, 5]) add(wd, H(7), H(8), "Workout", "routine", a.fitness);
  add(6, H(10), H(11, 30), "Learning session", "maker", a.content);
  add(6, H(17), H(18), "Workout", "routine", a.fitness);

  const themes: Record<number, string> = {
    1: "Delivery + plan",
    2: "Delivery + sales",
    3: "Content + sales",
    4: "Delivery + clients",
    5: "Buffer + review",
    6: "Learning + life",
    0: "Rest",
  };
  const days: TemplateDay[] = [0, 1, 2, 3, 4, 5, 6].map((wd) => ({
    weekday: wd,
    dayType: wd === freeWeekday ? "free" : wd === 5 || wd === 6 || wd === 0 ? "buffer" : "focus",
    theme: wd === freeWeekday ? "Free Day — no work" : themes[wd],
  }));
  return { days, blocks };
}

export async function loadTemplate(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const doc = await ctx.db.query("idealWeek").withIndex("by_user", (q) => q.eq("userId", userId)).first();
  if (doc) return { doc, days: doc.days as TemplateDay[], blocks: doc.blocks as TemplateBlock[], isDefault: false };
  const [areas, settings] = await Promise.all([
    ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    getSettings(ctx, userId),
  ]);
  const t = defaultTemplate(areas, settings.freeWeekday);
  return { doc: null, days: t.days, blocks: t.blocks, isDefault: true };
}

/**
 * Upsert ONLY the `dayType` of a `days` row (the days table is owned by the
 * core Day module; Direction never touches its other fields).
 */
export async function upsertDayType(ctx: MutationCtx, userId: Id<"users">, date: string, dayType: DayType | undefined) {
  const row = await ctx.db
    .query("days")
    .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
    .first();
  if (row) {
    if (row.dayType !== dayType) await ctx.db.patch(row._id, { dayType });
    return row._id;
  }
  if (!dayType) return null;
  return ctx.db.insert("days", { userId, date, dayType });
}

async function ensureDoc(ctx: MutationCtx, userId: Id<"users">) {
  const t = await loadTemplate(ctx, userId);
  if (t.doc) return t.doc;
  const id = await ctx.db.insert("idealWeek", { userId, days: t.days, blocks: t.blocks });
  return (await ctx.db.get(id))!;
}

const clampBlock = (b: TemplateBlock): TemplateBlock => {
  const s = Math.max(0, Math.min(H(23, 45), Math.round(b.startMin / 5) * 5));
  const e = Math.max(s + 15, Math.min(H(24), Math.round(b.endMin / 5) * 5));
  return { ...b, weekday: ((Math.round(b.weekday) % 7) + 7) % 7, startMin: s, endMin: e, title: b.title.trim().slice(0, 120) || "Block" };
};

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const t = await loadTemplate(ctx, userId);
    const byWd = new Map(t.days.map((d) => [d.weekday, d]));
    return {
      isDefault: t.isDefault,
      days: [0, 1, 2, 3, 4, 5, 6].map((wd) => byWd.get(wd) ?? { weekday: wd, dayType: "focus" as DayType }),
      blocks: [...t.blocks].sort((a, b) => a.weekday - b.weekday || a.startMin - b.startMin),
    };
  },
});

/** Replace the whole template. */
export const save = mutation({
  args: { days: v.array(dayValidator), blocks: v.array(blockValidator) },
  handler: async (ctx, { days, blocks }) => {
    const userId = await requireUser(ctx);
    const doc = await ensureDoc(ctx, userId);
    await ctx.db.patch(doc._id, { days, blocks: blocks.map(clampBlock) });
  },
});

/** Add or edit one template block (id "" = new). */
export const upsertBlock = mutation({
  args: { block: blockValidator },
  handler: async (ctx, { block }) => {
    const userId = await requireUser(ctx);
    const doc = await ensureDoc(ctx, userId);
    if (block.lifeAreaId) {
      const area = await ctx.db.get(block.lifeAreaId);
      if (!area || area.userId !== userId) throw new ConvexError("Life area not found.");
    }
    const id = block.id || `b-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
    const clean = clampBlock({ ...block, id });
    const exists = doc.blocks.some((b) => b.id === id);
    const blocks = exists ? doc.blocks.map((b) => (b.id === id ? clean : b)) : [...doc.blocks, clean];
    await ctx.db.patch(doc._id, { blocks });
    return id;
  },
});

export const removeBlock = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const doc = await ensureDoc(ctx, userId);
    await ctx.db.patch(doc._id, { blocks: doc.blocks.filter((b) => b.id !== id) });
  },
});

/** Set a weekday's day type and/or theme. */
export const setDay = mutation({
  args: { weekday: v.number(), dayType: v.optional(dayTypeValidator), theme: v.optional(v.string()) },
  handler: async (ctx, { weekday, dayType, theme }) => {
    const userId = await requireUser(ctx);
    const doc = await ensureDoc(ctx, userId);
    const cur = doc.days.find((d) => d.weekday === weekday) ?? { weekday, dayType: "focus" as DayType };
    const next = {
      weekday,
      dayType: dayType ?? cur.dayType,
      theme: theme !== undefined ? theme.trim() || undefined : cur.theme,
    };
    const days = [...doc.days.filter((d) => d.weekday !== weekday), next].sort((a, b) => a.weekday - b.weekday);
    await ctx.db.patch(doc._id, { days });
  },
});

/** Restore the default founder template. */
export const reset = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [areas, settings, doc] = await Promise.all([
      ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      getSettings(ctx, userId),
      ctx.db.query("idealWeek").withIndex("by_user", (q) => q.eq("userId", userId)).first(),
    ]);
    const t = defaultTemplate(areas, settings.freeWeekday);
    if (doc) await ctx.db.patch(doc._id, { days: t.days, blocks: t.blocks });
    else await ctx.db.insert("idealWeek", { userId, days: t.days, blocks: t.blocks });
  },
});

/**
 * Materialize the template into scheduleBlocks for the week starting
 * `weekStart` (a Monday). Never creates past blocks, never duplicates, skips
 * anything that would overlap an existing block, and keeps the Free Day free.
 * Also fills unset day types for the week and the plan's Free Day.
 */
export const applyToWeek = mutation({
  args: { weekStart: v.string(), today: v.string() },
  handler: async (ctx, { weekStart, today }) => {
    const userId = await requireUser(ctx);
    const t = await loadTemplate(ctx, userId);
    const weekEnd = addDays(weekStart, 6);
    const [existing, dayRows, plan] = await Promise.all([
      ctx.db
        .query("scheduleBlocks")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", weekStart).lte("date", weekEnd))
        .collect(),
      ctx.db
        .query("days")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", weekStart).lte("date", weekEnd))
        .collect(),
      ctx.db.query("weekPlans").withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekStart", weekStart)).first(),
    ]);
    const dateOfWd = (wd: number) => addDays(weekStart, (wd + 6) % 7);
    const tplDay = (wd: number) => t.days.find((d) => d.weekday === wd);

    // Fill the plan's Free Day from the template when none is set yet.
    let freeDay = plan?.freeDay;
    if (!freeDay) {
      const freeWd = t.days.find((d) => d.dayType === "free")?.weekday;
      if (freeWd !== undefined && dateOfWd(freeWd) >= today) {
        freeDay = dateOfWd(freeWd);
        if (plan) await ctx.db.patch(plan._id, { freeDay });
        else await ctx.db.insert("weekPlans", { userId, weekStart, big3: [], freeDay });
      }
    }

    // Day types for future days that have none yet (only `dayType` is written).
    const dayType = new Map<string, DayType | undefined>(dayRows.map((r) => [r.date, r.dayType]));
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      if (date < today || dayType.get(date)) continue;
      const wd = (i + 1) % 7;
      const want: DayType | undefined = date === freeDay ? "free" : tplDay(wd)?.dayType;
      if (!want) continue;
      await upsertDayType(ctx, userId, date, want);
      dayType.set(date, want);
    }

    let created = 0;
    let overlaps = 0;
    let duplicates = 0;
    let past = 0;
    let free = 0;
    const live = [...existing];
    for (const b of [...t.blocks].sort((x, y) => x.weekday - y.weekday || x.startMin - y.startMin)) {
      const date = dateOfWd(b.weekday);
      if (date < today) {
        past++;
        continue;
      }
      const dt = dayType.get(date) ?? tplDay(b.weekday)?.dayType;
      if ((date === freeDay || dt === "free") && b.blockType !== "free") {
        free++;
        continue;
      }
      const same = live.filter((e) => e.date === date);
      if (same.some((e) => e.title === b.title && e.startMin === b.startMin && e.endMin === b.endMin)) {
        duplicates++;
        continue;
      }
      if (same.some((e) => e.startMin < b.endMin && b.startMin < e.endMin)) {
        overlaps++;
        continue;
      }
      const id = await ctx.db.insert("scheduleBlocks", {
        userId,
        date,
        startMin: b.startMin,
        endMin: b.endMin,
        title: b.title,
        status: "planned",
        lifeAreaId: b.lifeAreaId,
        blockType: b.blockType,
        fromTemplate: true,
      });
      live.push((await ctx.db.get(id))!);
      created++;
    }
    return { created, overlaps, duplicates, past, free };
  },
});

/** Remove the planned (not done) template blocks of a week — undo for "apply". */
export const clearWeek = mutation({
  args: { weekStart: v.string(), today: v.string() },
  handler: async (ctx, { weekStart, today }) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("scheduleBlocks")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", weekStart).lte("date", addDays(weekStart, 6)))
      .collect();
    let removed = 0;
    for (const r of rows) {
      if (r.fromTemplate && r.status === "planned" && r.date >= today) {
        await ctx.db.delete(r._id);
        removed++;
      }
    }
    return removed;
  },
});
