/**
 * Scorecard (EOS-lite): 5–10 weekly numbers, on/off track vs a weekly target.
 *
 * ── Week windows (how the client tells us what "a week" is) ──────────────
 * Every query takes `weeks: [{ weekStart, from?, to? }]`:
 *   - `weekStart` is the client-LOCAL Monday (YYYY-MM-DD). Fields stored as
 *     local date strings (interactions.date, recallLogs.date) are bucketed by
 *     `weekStart <= date < weekStart + 7`.
 *   - `from` / `to` are the epoch-ms bounds of that local week
 *     ([local Monday 00:00, next local Monday 00:00)). Timestamp fields
 *     (deals.closedAt, contentPieces.publishedAt, focusSessions.endTime,
 *     tasks.completedAt) are bucketed by `from <= t < to`. Computing these on
 *     the client (`new Date(y, m, d).getTime()`) is DST-correct.
 *   - If `from`/`to` are omitted they are derived from `weekStart` and the
 *     optional `tzOffsetMin` (JS `Date#getTimezoneOffset()`, default 0).
 * The client helper `weekWindows()` in components/strategy/lib.ts builds this.
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, awardXp, getSettings } from "./os";

export const AUTO_SOURCES = [
  "outreach",
  "meetings",
  "deals_won",
  "revenue",
  "content_published",
  "focus_hours",
  "tasks_done",
  "recall_reviews",
  "revenue_cash",
] as const;
export type AutoSource = (typeof AUTO_SOURCES)[number];

const AUTO_ALIASES: Record<string, AutoSource> = { revenue_auto: "revenue" };

/** Normalise a stored `metrics.auto` value to a known source (or null = manual). */
export function autoSourceOf(auto: string | undefined | null): AutoSource | null {
  if (!auto) return null;
  const k = AUTO_ALIASES[auto] ?? auto;
  return (AUTO_SOURCES as readonly string[]).includes(k) ? (k as AutoSource) : null;
}

export const weekWindowValidator = v.object({
  weekStart: v.string(),
  from: v.optional(v.number()),
  to: v.optional(v.number()),
});

export type WeekWindow = { weekStart: string; from: number; to: number };

/** Fill in missing ms bounds from weekStart + tz offset. */
export function resolveWeeks(
  weeks: { weekStart: string; from?: number; to?: number }[],
  tzOffsetMin = 0,
): WeekWindow[] {
  return weeks.map((w) => {
    const base = Date.parse(`${w.weekStart}T00:00:00Z`) + tzOffsetMin * 60_000;
    return {
      weekStart: w.weekStart,
      from: w.from ?? base,
      to: w.to ?? base + 7 * 24 * 60 * 60 * 1000,
    };
  });
}

/** Is `value` on track for the metric? (≥ target when up, ≤ target when down) */
export function onTrack(value: number, target: number, direction: "up" | "down") {
  return direction === "up" ? value >= target : value <= target;
}

/**
 * Compute every requested auto source for every week window.
 * Returns { [source]: number[] } aligned with `wins`.
 */
export async function computeAuto(
  ctx: QueryCtx,
  userId: Id<"users">,
  sources: Set<AutoSource>,
  wins: WeekWindow[],
): Promise<Record<string, number[]>> {
  const out: Record<string, number[]> = {};
  if (!sources.size || !wins.length) return out;
  const zero = () => wins.map(() => 0);
  for (const s of sources) out[s] = zero();

  const minWeek = wins.reduce((m, w) => (w.weekStart < m ? w.weekStart : m), wins[0].weekStart);
  const maxWeekEnd = wins.reduce((m, w) => {
    const e = addDays(w.weekStart, 7);
    return e > m ? e : m;
  }, addDays(wins[0].weekStart, 7));
  const minFrom = Math.min(...wins.map((w) => w.from));
  const maxTo = Math.max(...wins.map((w) => w.to));

  const idxByMs = (t: number | undefined) => {
    if (t == null || t < minFrom || t >= maxTo) return -1;
    return wins.findIndex((w) => t >= w.from && t < w.to);
  };
  const idxByDate = (d: string | undefined) => {
    if (!d || d < minWeek || d >= maxWeekEnd) return -1;
    return wins.findIndex((w) => d >= w.weekStart && d < addDays(w.weekStart, 7));
  };

  if (sources.has("outreach") || sources.has("meetings")) {
    const rows = await ctx.db
      .query("interactions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", minWeek).lt("date", maxWeekEnd))
      .collect();
    for (const r of rows) {
      const i = idxByDate(r.date);
      if (i < 0) continue;
      if (out.outreach && (r.kind === "outreach" || r.kind === "followup")) out.outreach[i]++;
      if (out.meetings && (r.kind === "call" || r.kind === "meeting")) out.meetings[i]++;
    }
  }

  if (sources.has("deals_won") || sources.has("revenue")) {
    const won = await ctx.db
      .query("deals")
      .withIndex("by_user_stage", (q) => q.eq("userId", userId).eq("stage", "won"))
      .collect();
    for (const d of won) {
      const i = idxByMs(d.closedAt);
      if (i < 0) continue;
      if (out.deals_won) out.deals_won[i]++;
      if (out.revenue) out.revenue[i] += d.value ?? 0;
    }
  }

  if (sources.has("content_published")) {
    const pieces = await ctx.db
      .query("contentPieces")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const p of pieces) {
      const i = idxByMs(p.publishedAt);
      if (i >= 0) out.content_published[i]++;
    }
  }

  if (sources.has("focus_hours")) {
    const sessions = await ctx.db
      .query("focusSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.and(q.gte(q.field("endTime"), minFrom), q.lt(q.field("endTime"), maxTo)))
      .collect();
    for (const s of sessions) {
      const i = idxByMs(s.endTime);
      if (i >= 0) out.focus_hours[i] += s.duration / 3600;
    }
    out.focus_hours = out.focus_hours.map((h) => Math.round(h * 10) / 10);
  }

  if (sources.has("tasks_done")) {
    const done = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("userId", userId).eq("status", "done"))
      .collect();
    for (const t of done) {
      const i = idxByMs(t.completedAt);
      if (i >= 0) out.tasks_done[i]++;
    }
  }

  if (sources.has("recall_reviews")) {
    const logs = await ctx.db
      .query("recallLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", minWeek).lt("date", maxWeekEnd))
      .collect();
    for (const l of logs) {
      const i = idxByDate(l.date);
      if (i >= 0) out.recall_reviews[i]++;
    }
  }

  // Cash actually received: business-scope income transactions (Finance), by local date.
  if (sources.has("revenue_cash")) {
    const txs = await ctx.db
      .query("finTransactions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", minWeek).lt("date", maxWeekEnd))
      .collect();
    for (const t of txs) {
      if (t.type !== "income" || t.scope !== "business") continue;
      const i = idxByDate(t.date);
      if (i >= 0) out.revenue_cash[i] += t.amount;
    }
    out.revenue_cash = out.revenue_cash.map((n) => Math.round(n * 100) / 100);
  }

  return out;
}

export type GridMetric = Doc<"metrics"> & {
  source: AutoSource | null;
  values: (number | null)[];
  status: ("on" | "off" | null)[];
  onTrackCount: number;
  weeksWithData: number;
  avg: number | null;
};

/** Metrics × weeks with values and on/off-track status. Shared with founder.hq. */
export async function computeGrid(
  ctx: QueryCtx,
  userId: Id<"users">,
  wins: WeekWindow[],
  includeInactive = false,
): Promise<GridMetric[]> {
  const all = await ctx.db
    .query("metrics")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const metrics = all.filter((m) => includeInactive || m.active).sort((a, b) => a.order - b.order);

  const sources = new Set<AutoSource>();
  for (const m of metrics) {
    const s = autoSourceOf(m.auto);
    if (s) sources.add(s);
  }
  const auto = await computeAuto(ctx, userId, sources, wins);

  const out: GridMetric[] = [];
  for (const m of metrics) {
    const source = autoSourceOf(m.auto);
    let values: (number | null)[];
    if (source) {
      values = auto[source] ?? wins.map(() => 0);
    } else {
      const entries = await ctx.db
        .query("metricEntries")
        .withIndex("by_metric", (q) => q.eq("metricId", m._id))
        .collect();
      const byWeek = new Map(entries.map((e) => [e.weekStart, e.value]));
      values = wins.map((w) => (byWeek.has(w.weekStart) ? (byWeek.get(w.weekStart) as number) : null));
    }
    const status = values.map((val) => (val == null ? null : onTrack(val, m.target, m.direction) ? "on" : "off")) as (
      | "on"
      | "off"
      | null
    )[];
    const present = values.filter((x): x is number => x != null);
    out.push({
      ...m,
      source,
      values,
      status,
      onTrackCount: status.filter((s) => s === "on").length,
      weeksWithData: present.length,
      avg: present.length ? Math.round((present.reduce((a, b) => a + b, 0) / present.length) * 10) / 10 : null,
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────

/** Plain metric list (active first, by order). */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("metrics")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.sort((a, b) => Number(b.active) - Number(a.active) || a.order - b.order);
  },
});

/**
 * The 13-week grid (or any set of weeks). Values are aligned with `weeks` in
 * the order the client sent them.
 */
export const grid = query({
  args: {
    weeks: v.array(weekWindowValidator),
    tzOffsetMin: v.optional(v.number()),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const wins = resolveWeeks(args.weeks.slice(0, 60), args.tzOffsetMin ?? 0);
    const metrics = await computeGrid(ctx, userId, wins, args.includeInactive ?? false);
    const settings = await getSettings(ctx, userId);
    const totalMetrics = await ctx.db
      .query("metrics")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return {
      weeks: wins.map((w) => w.weekStart),
      currency: settings.currency,
      metrics,
      hasAny: totalMetrics.length > 0,
      inactiveCount: totalMetrics.filter((m) => !m.active).length,
    };
  },
});

/**
 * One-week summary (on / off / missing) — used by the weekly review and
 * Founder HQ. Pass the current week's window.
 */
export const weekSummary = query({
  args: { week: weekWindowValidator, tzOffsetMin: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const [win] = resolveWeeks([args.week], args.tzOffsetMin ?? 0);
    const metrics = await computeGrid(ctx, userId, [win]);
    const rows = metrics.map((m) => ({
      _id: m._id,
      name: m.name,
      unit: m.unit,
      target: m.target,
      direction: m.direction,
      auto: m.source,
      value: m.values[0],
      status: m.status[0],
    }));
    return {
      weekStart: win.weekStart,
      total: rows.length,
      on: rows.filter((r) => r.status === "on").length,
      off: rows.filter((r) => r.status === "off").length,
      missing: rows.filter((r) => r.status == null).length,
      metrics: rows,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────

const directionValidator = v.union(v.literal("up"), v.literal("down"));

async function ownMetric(ctx: QueryCtx, userId: Id<"users">, id: Id<"metrics">) {
  const m = await ctx.db.get(id);
  if (!m || m.userId !== userId) throw new ConvexError("Metric not found");
  return m;
}

/** Client-supplied goal / life area ids must belong to the caller. */
async function assertLinks(
  ctx: QueryCtx,
  userId: Id<"users">,
  links: { goalId?: Id<"goals"> | null; lifeAreaId?: Id<"lifeAreas"> | null },
) {
  if (links.goalId) {
    const g = await ctx.db.get(links.goalId);
    if (!g || g.userId !== userId) throw new ConvexError("Goal not found");
  }
  if (links.lifeAreaId) {
    const a = await ctx.db.get(links.lifeAreaId);
    if (!a || a.userId !== userId) throw new ConvexError("Life Area not found");
  }
}

export const create = mutation({
  args: {
    name: v.string(),
    unit: v.optional(v.string()),
    target: v.number(),
    direction: directionValidator,
    auto: v.optional(v.string()),
    goalId: v.optional(v.id("goals")),
    lifeAreaId: v.optional(v.id("lifeAreas")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const name = args.name.trim();
    if (!name) throw new ConvexError("Give the metric a name.");
    await assertLinks(ctx, userId, args);
    const existing = await ctx.db
      .query("metrics")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const order = existing.reduce((m, x) => Math.max(m, x.order), -1) + 1;
    return ctx.db.insert("metrics", {
      userId,
      name,
      unit: args.unit?.trim() || undefined,
      target: args.target,
      direction: args.direction,
      auto: autoSourceOf(args.auto) ?? undefined,
      goalId: args.goalId,
      lifeAreaId: args.lifeAreaId,
      owner: "me",
      order,
      active: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("metrics"),
    name: v.optional(v.string()),
    unit: v.optional(v.union(v.string(), v.null())),
    target: v.optional(v.number()),
    direction: v.optional(directionValidator),
    auto: v.optional(v.union(v.string(), v.null())),
    goalId: v.optional(v.union(v.id("goals"), v.null())),
    lifeAreaId: v.optional(v.union(v.id("lifeAreas"), v.null())),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    await ownMetric(ctx, userId, id);
    await assertLinks(ctx, userId, rest);
    const patch: Partial<Doc<"metrics">> = {};
    if (rest.name !== undefined) {
      const n = rest.name.trim();
      if (!n) throw new ConvexError("Give the metric a name.");
      patch.name = n;
    }
    if (rest.unit !== undefined) patch.unit = rest.unit?.trim() || undefined;
    if (rest.target !== undefined) patch.target = rest.target;
    if (rest.direction !== undefined) patch.direction = rest.direction;
    if (rest.auto !== undefined) patch.auto = autoSourceOf(rest.auto) ?? undefined;
    if (rest.goalId !== undefined) patch.goalId = rest.goalId ?? undefined;
    if (rest.lifeAreaId !== undefined) patch.lifeAreaId = rest.lifeAreaId ?? undefined;
    if (rest.active !== undefined) patch.active = rest.active;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("metrics") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await ownMetric(ctx, userId, id);
    const entries = await ctx.db
      .query("metricEntries")
      .withIndex("by_metric", (q) => q.eq("metricId", id))
      .collect();
    for (const e of entries) await ctx.db.delete(e._id);
    await ctx.db.delete(id);
  },
});

/** Rewrite the order of the given metric ids (first = top). */
export const reorder = mutation({
  args: { ids: v.array(v.id("metrics")) },
  handler: async (ctx, { ids }) => {
    const userId = await requireUser(ctx);
    for (let i = 0; i < ids.length; i++) {
      const m = await ctx.db.get(ids[i]);
      if (m && m.userId === userId && m.order !== i) await ctx.db.patch(ids[i], { order: i });
    }
  },
});

/**
 * Upsert (or clear with value=null) the manual value for one metric-week.
 * Auto metrics are read-only. The first entry of a week earns a little XP.
 */
export const setEntry = mutation({
  args: {
    metricId: v.id("metrics"),
    weekStart: v.string(),
    value: v.union(v.number(), v.null()),
    date: v.optional(v.string()), // client-local today, for the XP ledger
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const m = await ownMetric(ctx, userId, args.metricId);
    if (autoSourceOf(m.auto)) throw new ConvexError("This number is calculated automatically.");
    if (args.value != null && !Number.isFinite(args.value)) throw new ConvexError("Enter a number.");
    const entries = await ctx.db
      .query("metricEntries")
      .withIndex("by_metric", (q) => q.eq("metricId", args.metricId))
      .collect();
    const existing = entries.find((e) => e.weekStart === args.weekStart);
    if (args.value == null) {
      if (existing) await ctx.db.delete(existing._id);
      return { xp: 0 };
    }
    if (existing) await ctx.db.patch(existing._id, { value: args.value });
    else await ctx.db.insert("metricEntries", { userId, metricId: args.metricId, weekStart: args.weekStart, value: args.value });
    const gained = await awardXp(ctx, userId, `scorecard-${args.weekStart}`, 10, "Scorecard updated", args.date ?? args.weekStart);
    return { xp: gained ? 10 : 0 };
  },
});

/** Starter founder scorecard — only when the user has no metrics yet. */
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("metrics")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) return { created: 0 };
    const settings = await getSettings(ctx, userId);
    const weeklyRevenue = settings.annualIncome > 0 ? Math.round(settings.annualIncome / 52) : 1000;
    const rows: { name: string; unit?: string; target: number; auto?: AutoSource }[] = [
      { name: "Outreach touches", unit: "touches", target: 100, auto: "outreach" },
      { name: "Sales conversations", unit: "calls", target: 5, auto: "meetings" },
      { name: "Deals won", unit: "deals", target: 1, auto: "deals_won" },
      { name: "Revenue", unit: settings.currency, target: weeklyRevenue },
      { name: "Content published", unit: "pieces", target: 5, auto: "content_published" },
      { name: "Deep work hours", unit: "h", target: 15, auto: "focus_hours" },
      { name: "Recall reviews", unit: "cards", target: 50, auto: "recall_reviews" },
    ];
    let order = 0;
    for (const r of rows) {
      await ctx.db.insert("metrics", {
        userId,
        name: r.name,
        unit: r.unit,
        target: r.target,
        direction: "up",
        auto: r.auto,
        owner: "me",
        order: order++,
        active: true,
      });
    }
    return { created: rows.length };
  },
});
