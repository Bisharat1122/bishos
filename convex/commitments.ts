/**
 * B1 · Commitments ledger — what I owe, and what others owe me ("waiting for").
 *
 * Promise-keeping rate (last 28 days) = "I owe" commitments kept on or before
 * their promised date ÷ "I owe" commitments that came due in that window.
 * Renegotiated and cancelled promises are left out (renegotiating early is
 * the honest move). Keeping an "I owe" on time awards XP.commitmentKept.
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { XP, awardXp, revokeXp, addDays, mondayOf } from "./os";

export const directionV = v.union(v.literal("i_owe"), v.literal("owed_to_me"));
export const commitmentStatusV = v.union(
  v.literal("open"),
  v.literal("done"),
  v.literal("broken"),
  v.literal("renegotiated"),
  v.literal("cancelled"),
);

type Ctx = QueryCtx | MutationCtx;
type Commitment = Doc<"commitments">;

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const clean = (s?: string | null) => (s ?? "").trim();
const okDate = (s?: string | null) => (s && YMD.test(s) ? s : undefined);

async function own(ctx: Ctx, userId: Id<"users">, id: Id<"commitments">) {
  const c = await ctx.db.get(id);
  if (!c || c.userId !== userId) throw new ConvexError("Commitment not found.");
  return c;
}

/** Attach person / deal / company / project names. */
async function enrich(ctx: Ctx, userId: Id<"users">, rows: Commitment[]) {
  const cache = new Map<string, string | null>();
  const label = async (id?: Id<"people"> | Id<"companies"> | Id<"deals"> | Id<"projects">) => {
    if (!id) return null;
    if (!cache.has(id)) {
      const doc = (await ctx.db.get(id)) as { name?: string; title?: string; userId: Id<"users"> } | null;
      cache.set(id, doc && doc.userId === userId ? doc.name ?? doc.title ?? null : null);
    }
    return cache.get(id) ?? null;
  };
  const out = [];
  for (const c of rows) {
    out.push({
      ...c,
      personName: await label(c.personId),
      companyName: await label(c.companyId),
      dealTitle: await label(c.dealId),
      projectTitle: await label(c.projectId),
    });
  }
  return out;
}

const byDate = (a: Commitment, b: Commitment) =>
  (a.promisedDate ?? "9999").localeCompare(b.promisedDate ?? "9999") || a.createdAt - b.createdAt;

/** Kept on time? (no promised date counts as on time) */
const keptOnTime = (c: Commitment) =>
  c.status === "done" && (!c.promisedDate || !c.doneDate || c.doneDate <= c.promisedDate);

function rateFor(rows: Commitment[], from: string, to: string, today: string) {
  // due in [from, to]; open ones only count once they're actually late
  const due = rows.filter(
    (c) =>
      c.direction === "i_owe" &&
      c.promisedDate &&
      c.promisedDate >= from &&
      c.promisedDate <= to &&
      (c.status === "done" || c.status === "broken" || (c.status === "open" && c.promisedDate < today)),
  );
  const kept = due.filter(keptOnTime);
  return { due: due.length, kept: kept.length, rate: due.length ? Math.round((kept.length / due.length) * 100) : null };
}

// ─────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────

/** All commitments (newest data first within status), enriched. */
export const list = query({
  args: { status: v.optional(commitmentStatusV) },
  handler: async (ctx, { status }) => {
    const userId = await requireUser(ctx);
    const rows = status
      ? await ctx.db.query("commitments").withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", status)).collect()
      : await ctx.db.query("commitments").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return enrich(ctx, userId, rows.sort(byDate));
  },
});

/**
 * One day's view (Today page): due today, overdue, "waiting for" checks due,
 * and the next 7 days. Only open commitments.
 */
export const forDay = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    const open = (
      await ctx.db.query("commitments").withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "open")).collect()
    ).sort(byDate);
    const week = addDays(date, 7);
    const due = open.filter((c) => c.promisedDate === date);
    const overdue = open.filter((c) => c.promisedDate && c.promisedDate < date);
    const taken = new Set([...due, ...overdue].map((c) => c._id as string));
    const checks = open.filter(
      (c) => c.direction === "owed_to_me" && c.checkDate && c.checkDate <= date && !taken.has(c._id),
    );
    const upcoming = open.filter((c) => c.promisedDate && c.promisedDate > date && c.promisedDate <= week);
    return {
      due: await enrich(ctx, userId, due),
      overdue: await enrich(ctx, userId, overdue),
      checks: await enrich(ctx, userId, checks),
      upcoming: await enrich(ctx, userId, upcoming),
      counts: {
        iOweOpen: open.filter((c) => c.direction === "i_owe").length,
        owedOpen: open.filter((c) => c.direction === "owed_to_me").length,
      },
    };
  },
});

/** Promise-keeping rate (last 28 days) + weekly history + open counts. */
export const stats = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db.query("commitments").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const window = rateFor(rows, addDays(today, -27), today, today);
    const thisMonday = mondayOf(today);
    const weeks = [3, 2, 1, 0].map((n) => {
      const start = addDays(thisMonday, -7 * n);
      const end = addDays(start, 6);
      return { weekStart: start, ...rateFor(rows, start, end < today ? end : today, today) };
    });
    const open = rows.filter((c) => c.status === "open");
    const keptAllTime = rows.filter((c) => c.direction === "i_owe" && keptOnTime(c)).length;
    return {
      ...window,
      weeks,
      keptAllTime,
      iOweOpen: open.filter((c) => c.direction === "i_owe").length,
      owedOpen: open.filter((c) => c.direction === "owed_to_me").length,
      overdueIOwe: open.filter((c) => c.direction === "i_owe" && c.promisedDate && c.promisedDate < today).length,
      overdueOwed: open.filter((c) => c.direction === "owed_to_me" && c.promisedDate && c.promisedDate < today).length,
      dueToday: open.filter((c) => c.promisedDate === today).length,
      checksDue: open.filter((c) => c.direction === "owed_to_me" && c.checkDate && c.checkDate <= today).length,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    title: v.string(),
    direction: directionV,
    personId: v.optional(v.id("people")),
    companyId: v.optional(v.id("companies")),
    dealId: v.optional(v.id("deals")),
    projectId: v.optional(v.id("projects")),
    source: v.optional(v.string()), // call | email | meeting | message | other
    promisedDate: v.optional(v.string()),
    checkDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const title = clean(args.title);
    if (!title) throw new ConvexError("What was promised?");
    const person = args.personId ? await ctx.db.get(args.personId) : null;
    if (args.personId && (!person || person.userId !== userId)) throw new ConvexError("Person not found.");
    const deal = args.dealId ? await ctx.db.get(args.dealId) : null;
    if (args.dealId && (!deal || deal.userId !== userId)) throw new ConvexError("Deal not found.");
    if (args.projectId) {
      const p = await ctx.db.get(args.projectId);
      if (!p || p.userId !== userId) throw new ConvexError("Project not found.");
    }
    if (args.companyId) {
      const c = await ctx.db.get(args.companyId);
      if (!c || c.userId !== userId) throw new ConvexError("Company not found.");
    }
    const promisedDate = okDate(args.promisedDate);
    return ctx.db.insert("commitments", {
      userId,
      title,
      direction: args.direction,
      personId: args.personId ?? deal?.personId,
      companyId: args.companyId ?? person?.companyId ?? deal?.companyId,
      dealId: args.dealId,
      projectId: args.projectId ?? deal?.projectId,
      source: clean(args.source) || undefined,
      promisedDate,
      // "waiting for": check again on the promised day unless told otherwise
      checkDate: okDate(args.checkDate) ?? (args.direction === "owed_to_me" ? promisedDate : undefined),
      status: "open",
      notes: clean(args.notes) || undefined,
      createdAt: Date.now(),
    });
  },
});

/** Patch fields (null clears). Status changes go through setStatus. */
export const update = mutation({
  args: {
    id: v.id("commitments"),
    title: v.optional(v.string()),
    direction: v.optional(directionV),
    personId: v.optional(v.union(v.id("people"), v.null())),
    dealId: v.optional(v.union(v.id("deals"), v.null())),
    projectId: v.optional(v.union(v.id("projects"), v.null())),
    companyId: v.optional(v.union(v.id("companies"), v.null())),
    source: v.optional(v.union(v.string(), v.null())),
    promisedDate: v.optional(v.union(v.string(), v.null())),
    checkDate: v.optional(v.union(v.string(), v.null())),
    notes: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    await own(ctx, userId, id);
    if (rest.title !== undefined && !clean(rest.title)) throw new ConvexError("A commitment needs a title.");
    for (const key of ["personId", "dealId", "projectId", "companyId"] as const) {
      const ref = rest[key];
      if (ref) {
        const doc = (await ctx.db.get(ref)) as { userId: Id<"users"> } | null;
        if (!doc || doc.userId !== userId) throw new ConvexError("Linked item not found.");
      }
    }
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      patch[k] = val === null || val === "" ? undefined : typeof val === "string" ? val.trim() : val;
    }
    if (rest.promisedDate) patch.promisedDate = okDate(rest.promisedDate);
    if (rest.checkDate) patch.checkDate = okDate(rest.checkDate);
    await ctx.db.patch(id, patch);
  },
});

/**
 * Set the status. done → doneAt/doneDate and XP for an on-time "I owe"
 * (key commit-<id>). Leaving done revokes the XP.
 */
export const setStatus = mutation({
  args: { id: v.id("commitments"), status: commitmentStatusV, date: v.string() },
  handler: async (ctx, { id, status, date }) => {
    const userId = await requireUser(ctx);
    const c = await own(ctx, userId, id);
    let xp = 0;
    let onTime = false;
    if (status === "done") {
      onTime = !c.promisedDate || date <= c.promisedDate;
      await ctx.db.patch(id, { status, doneAt: Date.now(), doneDate: date });
      if (c.direction === "i_owe" && onTime && (await awardXp(ctx, userId, `commit-${id}`, XP.commitmentKept, `Promise kept: ${c.title}`.slice(0, 120), date)))
        xp = XP.commitmentKept;
    } else {
      await ctx.db.patch(id, { status, doneAt: undefined, doneDate: undefined });
      await revokeXp(ctx, userId, `commit-${id}`);
    }
    return { xp, onTime };
  },
});

/**
 * Renegotiate: close this promise as "renegotiated" and open a fresh one with
 * the new date (history stays honest; the rate excludes renegotiated ones).
 */
export const renegotiate = mutation({
  args: { id: v.id("commitments"), newDate: v.string(), note: v.optional(v.string()) },
  handler: async (ctx, { id, newDate, note }) => {
    const userId = await requireUser(ctx);
    const c = await own(ctx, userId, id);
    if (!YMD.test(newDate)) throw new ConvexError("Pick the new date you agreed.");
    await ctx.db.patch(id, { status: "renegotiated" });
    await revokeXp(ctx, userId, `commit-${id}`);
    const trail = `Renegotiated${c.promisedDate ? ` from ${c.promisedDate}` : ""}${clean(note) ? `: ${clean(note)}` : ""}`;
    return ctx.db.insert("commitments", {
      userId,
      title: c.title,
      direction: c.direction,
      personId: c.personId,
      companyId: c.companyId,
      dealId: c.dealId,
      projectId: c.projectId,
      source: c.source,
      promisedDate: newDate,
      checkDate: c.direction === "owed_to_me" ? newDate : undefined,
      status: "open",
      notes: [c.notes, trail].filter(Boolean).join("\n"),
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("commitments") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await own(ctx, userId, id);
    await revokeXp(ctx, userId, `commit-${id}`);
    await ctx.db.delete(id);
  },
});
