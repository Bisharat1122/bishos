import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { rangeValidator, resolveRange, RangeKey } from "./range";
import { addDays, diffDays, mondayOf } from "./os";

const typeValidator = v.union(
  v.literal("task"),
  v.literal("goal"),
  v.literal("project"),
  v.literal("note"),
  v.literal("habit"),
  v.literal("lifeArea"),
  v.literal("section"),
  v.literal("challenge"),
  v.literal("win"),
);

/** Log a new momentum moment (repeatable — same item can be added many times). */
export const add = mutation({
  args: {
    type: typeValidator,
    itemId: v.string(),
    titleSnapshot: v.string(),
    why: v.optional(v.string()),
    impact: v.number(),
    // Optional Life Area (free-text wins → shown on that area's hub).
    lifeAreaId: v.optional(v.id("lifeAreas")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (args.lifeAreaId) {
      const area = await ctx.db.get(args.lifeAreaId);
      if (!area || area.userId !== userId) throw new ConvexError("Life area not found.");
    }
    const title = args.titleSnapshot.trim() || "Win";
    return ctx.db.insert("momentum", {
      userId,
      type: args.type,
      itemId: args.itemId,
      titleSnapshot: title.slice(0, 200),
      why: args.why?.slice(0, 1000),
      impact: Math.max(1, Math.min(5, Math.round(args.impact))),
      createdAt: Date.now(),
      lifeAreaId: args.lifeAreaId,
    });
  },
});

/** List momentum entries, newest first, optionally filtered by type and range. */
export const list = query({
  args: {
    type: v.optional(typeValidator),
    range: v.optional(rangeValidator),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    let rows = await ctx.db
      .query("momentum")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    if (args.type) rows = rows.filter((r) => r.type === args.type);
    if (args.range) {
      const { from, to } = resolveRange(args.range as RangeKey, args.start, args.end);
      rows = rows.filter((r) => r.createdAt >= from && r.createdAt < to);
    }
    return rows;
  },
});

/** How many times a specific item has moved the needle (for the pin button badge). */
export const countForItem = query({
  args: { itemId: v.string() },
  handler: async (ctx, { itemId }) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("momentum")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.filter((r) => r.itemId === itemId).length;
  },
});

export const remove = mutation({
  args: { id: v.id("momentum") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (row && row.userId === userId) await ctx.db.delete(id);
  },
});

/** Compact stats for the dashboard tile over a window. */
export const rangeStats = query({
  args: { range: rangeValidator, start: v.optional(v.number()), end: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("momentum")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    const { from, to } = resolveRange(args.range as RangeKey, args.start, args.end);
    const inRange = rows.filter((r) => r.createdAt >= from && r.createdAt < to);
    const avgImpact = inRange.length
      ? Math.round((inRange.reduce((s, r) => s + r.impact, 0) / inRange.length) * 10) / 10
      : 0;
    return {
      count: inRange.length,
      totalAll: rows.length,
      avgImpact,
      recent: inRange.slice(0, 5),
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Wins — the progress principle (Amabile): one feed that merges the moments
// you log by hand with the wins the system already knows about.
// ─────────────────────────────────────────────────────────────────────────

export type WinSource = "logged" | "progress" | "journal" | "top3" | "big3" | "deal" | "content" | "promise" | "offer";

export type Win = {
  id: string;
  source: WinSource;
  date: string; // local YYYY-MM-DD
  at: number; // sort key (ms; day wins sort at local noon)
  title: string;
  sub?: string;
  impact?: number;
  href?: string;
  momentumId?: Id<"momentum">;
  itemType?: string;
  itemId?: string;
};

/** Wins from XP keys → source + id (the ledger already has title + local date). */
const XP_SOURCES: { prefix: string; source: WinSource; strip?: RegExp }[] = [
  { prefix: "top-", source: "top3" },
  { prefix: "big3-", source: "big3", strip: /^Weekly Big 3:\s*/ },
  { prefix: "deal-won-", source: "deal", strip: /^Deal won:\s*/ },
  { prefix: "content-pub-", source: "content", strip: /^Published:\s*/ },
  { prefix: "commit-", source: "promise", strip: /^Promise kept:\s*/ },
  { prefix: "offer-live-", source: "offer", strip: /^Offer live:\s*/ },
];

const MOMENTUM_ROUTE: Record<string, (id: string) => string | undefined> = {
  goal: (id) => `/goals/${id}`,
  project: (id) => `/projects/${id}`,
  note: (id) => `/notes/${id}`,
  habit: (id) => `/habits/${id}`,
  lifeArea: (id) => `/life-areas/${id}`,
  challenge: (id) => `/challenges/${id}`,
  task: (id) => `/tasks/${id}`,
  section: () => "/life-areas",
};

/**
 * The Wins feed. `today` = client-local day, `tz` = getTimezoneOffset()
 * (minutes) so manual entries land on the right local day. Returns the items
 * for the last `rangeDays` days, a per-day count for the last 84 days, the
 * streak of days with at least one win, and this week's count.
 */
export const wins = query({
  args: { today: v.string(), tz: v.optional(v.number()), rangeDays: v.optional(v.number()) },
  handler: async (ctx, { today, tz = 0, rangeDays = 30 }) => {
    const userId = await requireUser(ctx);
    const horizon = addDays(today, -370); // enough history for a long streak
    const [momentum, days, xp, tasks] = await Promise.all([
      ctx.db.query("momentum").withIndex("by_user_created", (q) => q.eq("userId", userId)).order("desc").collect(),
      ctx.db.query("days").withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", horizon).lte("date", today)).collect(),
      ctx.db.query("xpLedger").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const localYmd = (ms: number) => new Date(ms - tz * 60_000).toISOString().slice(0, 10);
    const noonOf = (ymd: string) => Date.parse(`${ymd}T12:00:00Z`) + tz * 60_000;
    const taskTitle = new Map(tasks.map((t) => [t._id as string, t.title]));

    // Section wins link to their section page (needs the section's area id).
    const sectionHref = new Map<string, string>();
    for (const m of momentum) {
      if (m.type !== "section" || sectionHref.has(m.itemId)) continue;
      const sid = ctx.db.normalizeId("sections", m.itemId);
      const sec = sid ? await ctx.db.get(sid) : null;
      sectionHref.set(m.itemId, sec && sec.userId === userId ? `/life-areas/${sec.lifeAreaId}/sections/${sec._id}` : "/life-areas");
    }

    const all: Win[] = [];
    for (const m of momentum) {
      const date = localYmd(m.createdAt);
      if (date < horizon) break; // newest first
      all.push({
        id: `m-${m._id}`,
        source: "logged",
        date,
        at: m.createdAt,
        title: m.titleSnapshot,
        sub: m.why,
        impact: m.impact,
        href: m.type === "win" ? undefined : m.type === "section" ? sectionHref.get(m.itemId) : MOMENTUM_ROUTE[m.type]?.(m.itemId),
        momentumId: m._id,
        itemType: m.type,
        itemId: m.itemId,
      });
    }
    for (const d of days) {
      const line = d.progressLine?.trim();
      const win = d.journal?.win?.trim();
      if (line) all.push({ id: `p-${d.date}`, source: "progress", date: d.date, at: noonOf(d.date) + 1, title: line, href: `/journal/${d.date}` });
      if (win && win !== line) all.push({ id: `j-${d.date}`, source: "journal", date: d.date, at: noonOf(d.date), title: win, href: `/journal/${d.date}` });
    }
    for (const row of xp) {
      if (row.date < horizon || row.date > today) continue;
      const src = XP_SOURCES.find((s) => row.key.startsWith(s.prefix));
      if (!src) continue;
      let title = src.strip ? row.reason.replace(src.strip, "") : row.reason;
      let href: string | undefined;
      const rest = row.key.slice(src.prefix.length);
      if (src.source === "top3") {
        const taskId = rest.slice(11); // "YYYY-MM-DD-<taskId>"
        title = taskTitle.get(taskId) ?? "A Top 3 task";
        href = `/journal/${row.date}`;
      } else if (src.source === "deal") href = `/pipeline?deal=${rest}`;
      else if (src.source === "content") href = `/content/${rest}`;
      else if (src.source === "promise") href = "/commitments";
      else if (src.source === "offer") href = `/offers/${rest}`;
      else if (src.source === "big3") href = "/week";
      all.push({ id: `x-${row._id}`, source: src.source, date: row.date, at: row.at, title, href });
    }

    // Per-day counts → streak + heat strip.
    const perDay: Record<string, number> = {};
    for (const w of all) perDay[w.date] = (perDay[w.date] ?? 0) + 1;
    let streak = 0;
    let cursor = perDay[today] ? today : addDays(today, -1);
    while (perDay[cursor] && streak < 400) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    let best = 0;
    let run = 0;
    for (let i = 365; i >= 0; i--) {
      const d = addDays(today, -i);
      run = perDay[d] ? run + 1 : 0;
      best = Math.max(best, run);
    }
    const weekStart = mondayOf(today);
    const weekCount = all.filter((w) => w.date >= weekStart && w.date <= today).length;
    const lastWeekCount = all.filter((w) => w.date >= addDays(weekStart, -7) && w.date < weekStart).length;
    const heat = Array.from({ length: 84 }, (_, i) => {
      const d = addDays(today, i - 83);
      return { date: d, count: perDay[d] ?? 0 };
    });
    const from = addDays(today, -(Math.max(1, Math.min(365, rangeDays)) - 1));
    const items = all
      .filter((w) => w.date >= from && w.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date) || b.at - a.at);
    return {
      items,
      heat,
      streak,
      bestStreak: best,
      weekCount,
      lastWeekCount,
      winDaysThisWeek: Array.from({ length: diffDays(weekStart, today) + 1 }, (_, i) => addDays(weekStart, i)).filter((d) => perDay[d]).length,
      todayCount: perDay[today] ?? 0,
    };
  },
});
