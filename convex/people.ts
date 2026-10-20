/**
 * B1 · People, companies and interactions (personal CRM + sales touches).
 *
 * One Person record is shared by the pipeline, the personal CRM, commitments
 * and meetings. Logging an interaction updates the person's last contact and
 * the deal's last touch, counts toward today's outreach quota and awards XP.
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { XP, awardXp, revokeXp, getSettings, diffDays, ymdUtc } from "./os";

// ─────────────────────────────────────────────────────────────────────────
// Validators
// ─────────────────────────────────────────────────────────────────────────
export const relationV = v.union(
  v.literal("lead"),
  v.literal("customer"),
  v.literal("partner"),
  v.literal("investor"),
  v.literal("mentor"),
  v.literal("peer"),
  v.literal("friend"),
  v.literal("family"),
  v.literal("team"),
  v.literal("other"),
);
export const tierV = v.union(v.literal("A"), v.literal("B"), v.literal("C"));
export const companyRelV = v.union(
  v.literal("prospect"),
  v.literal("customer"),
  v.literal("partner"),
  v.literal("past"),
  v.literal("other"),
);
export const healthV = v.union(v.literal("green"), v.literal("yellow"), v.literal("red"));
export const interactionKindV = v.union(
  v.literal("outreach"),
  v.literal("followup"),
  v.literal("call"),
  v.literal("meeting"),
  v.literal("email"),
  v.literal("dm"),
  v.literal("note"),
);

type Ctx = QueryCtx | MutationCtx;
type Kind = Doc<"interactions">["kind"];

const KIND_LABEL: Record<Kind, string> = {
  outreach: "Outreach",
  followup: "Follow-up",
  call: "Call",
  meeting: "Meeting",
  email: "Email",
  dm: "DM",
  note: "Note",
};

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const clean = (s?: string | null) => (s ?? "").trim();

// ─────────────────────────────────────────────────────────────────────────
// Shared helpers (also used by deals.ts / commitments.ts)
// ─────────────────────────────────────────────────────────────────────────

/** Local day of the last touch (falls back to the UTC day of the timestamp). */
export function lastContactDay(p: Doc<"people">): string | undefined {
  return p.lastContactDate ?? (p.lastContactAt ? ymdUtc(p.lastContactAt) : undefined);
}

export type CadenceStatus = "none" | "ok" | "soon" | "due" | "overdue";

/** Cadence math: days since last contact (or since created) vs cadenceDays. */
export function cadenceInfo(p: Doc<"people">, today: string) {
  const last = lastContactDay(p);
  const since = diffDays(last ?? ymdUtc(p.createdAt), today);
  if (!p.cadenceDays) {
    return { lastDay: last ?? null, daysSince: last ? since : null, dueIn: null as number | null, status: "none" as CadenceStatus };
  }
  const dueIn = p.cadenceDays - since;
  const soonWindow = Math.max(2, Math.round(p.cadenceDays * 0.15));
  const status: CadenceStatus = dueIn < 0 ? "overdue" : dueIn === 0 ? "due" : dueIn <= soonWindow ? "soon" : "ok";
  return { lastDay: last ?? null, daysSince: last ? since : null, dueIn, status };
}

/** Today's sales block: outreach quota + "open to goal" meetings. */
export async function salesDay(ctx: Ctx, userId: Id<"users">, today: string) {
  const settings = await getSettings(ctx, userId);
  const [todays, deals] = await Promise.all([
    ctx.db
      .query("interactions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", today))
      .collect(),
    ctx.db
      .query("deals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect(),
  ]);
  const outreach = todays.filter((i) => i.kind === "outreach" || i.kind === "followup").length;
  const meetingTouches = todays.filter((i) => i.kind === "meeting" || i.kind === "call").length;
  const booked = deals.filter((d) => d.bookedDate === today).length;
  const meetings = booked + meetingTouches;
  const quota = settings.outreachQuota;
  const meetingsGoal = settings.meetingsGoal;
  return {
    outreach,
    quota,
    pct: quota > 0 ? Math.min(100, Math.round((outreach / quota) * 100)) : 0,
    touchesToday: todays.filter((i) => i.kind !== "note").length,
    booked,
    meetingTouches,
    meetings,
    meetingsGoal,
    goalHit: meetingsGoal > 0 && meetings >= meetingsGoal,
    quotaHit: quota > 0 && outreach >= quota,
    currency: settings.currency,
  };
}

async function ownPerson(ctx: Ctx, userId: Id<"users">, id: Id<"people">) {
  const p = await ctx.db.get(id);
  if (!p || p.userId !== userId) throw new ConvexError("Person not found.");
  return p;
}
async function ownCompany(ctx: Ctx, userId: Id<"users">, id: Id<"companies">) {
  const c = await ctx.db.get(id);
  if (!c || c.userId !== userId) throw new ConvexError("Company not found.");
  return c;
}

/** Find a company by name (case-insensitive) or create it as a prospect. */
export async function findOrCreateCompany(
  ctx: MutationCtx,
  userId: Id<"users">,
  name: string,
  relationship: Doc<"companies">["relationship"] = "prospect",
): Promise<Id<"companies">> {
  const n = name.trim();
  const all = await ctx.db
    .query("companies")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const hit = all.find((c) => c.name.trim().toLowerCase() === n.toLowerCase());
  if (hit) {
    if (relationship === "customer" && hit.relationship !== "customer")
      await ctx.db.patch(hit._id, { relationship: "customer", health: hit.health ?? "green" });
    return hit._id;
  }
  return ctx.db.insert("companies", {
    userId,
    name: n,
    relationship,
    health: relationship === "customer" ? "green" : undefined,
    createdAt: Date.now(),
  });
}

/** Recompute a person's last contact from their remaining touches. */
async function recomputeLastContact(ctx: MutationCtx, personId: Id<"people">) {
  const rows = await ctx.db
    .query("interactions")
    .withIndex("by_person", (q) => q.eq("personId", personId))
    .collect();
  const touches = rows.filter((r) => r.kind !== "note").sort((a, b) => b.date.localeCompare(a.date) || b.at - a.at);
  const last = touches[0];
  await ctx.db.patch(personId, { lastContactAt: last?.at, lastContactDate: last?.date });
}

async function recomputeDealTouch(ctx: MutationCtx, dealId: Id<"deals">) {
  const rows = await ctx.db
    .query("interactions")
    .withIndex("by_deal", (q) => q.eq("dealId", dealId))
    .collect();
  const last = rows.filter((r) => r.kind !== "note").sort((a, b) => b.date.localeCompare(a.date) || b.at - a.at)[0];
  await ctx.db.patch(dealId, { lastTouchAt: last?.at });
}

const OPEN_STAGES = new Set(["target", "contacted", "booked", "discovery", "proposal", "verbal"]);

// ─────────────────────────────────────────────────────────────────────────
// People — queries
// ─────────────────────────────────────────────────────────────────────────

/** All people with company name, cadence status and deal counts. */
export const list = query({
  args: { today: v.optional(v.string()) },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const day = today ?? ymdUtc(Date.now());
    const [people, companies, deals] = await Promise.all([
      ctx.db.query("people").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("companies").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const companyName = new Map(companies.map((c) => [c._id as string, c.name]));
    return people
      .map((p) => {
        const pd = deals.filter((d) => d.personId === p._id);
        return {
          ...p,
          companyName: p.companyId ? companyName.get(p.companyId) ?? null : null,
          ...cadenceInfo(p, day),
          openDeals: pd.filter((d) => OPEN_STAGES.has(d.stage)).length,
          wonDeals: pd.filter((d) => d.stage === "won").length,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

/** Quick search across people (name, email, title, company) and companies. */
export const search = query({
  args: { q: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { q, limit }) => {
    const userId = await requireUser(ctx);
    const needle = q.trim().toLowerCase();
    const [people, companies] = await Promise.all([
      ctx.db.query("people").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
      ctx.db.query("companies").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
    ]);
    const cname = new Map(companies.map((c) => [c._id as string, c.name]));
    const n = limit ?? 8;
    const ppl = people
      .filter((p) => {
        if (!needle) return true;
        const hay = [p.name, p.email, p.title, p.companyId ? cname.get(p.companyId) : ""].join(" ").toLowerCase();
        return hay.includes(needle);
      })
      .slice(0, n)
      .map((p) => ({ _id: p._id, name: p.name, title: p.title ?? null, companyName: p.companyId ? cname.get(p.companyId) ?? null : null, relation: p.relation }));
    const cos = companies
      .filter((c) => !needle || c.name.toLowerCase().includes(needle))
      .slice(0, n)
      .map((c) => ({ _id: c._id, name: c.name, relationship: c.relationship }));
    return { people: ppl, companies: cos };
  },
});

/** Person profile: timeline, deals, commitments and linked tasks. */
export const get = query({
  // id is a raw string from the URL: a malformed one returns null instead of throwing.
  args: { id: v.string(), today: v.optional(v.string()) },
  handler: async (ctx, { id: rawId, today }) => {
    const userId = await requireUser(ctx);
    const id = ctx.db.normalizeId("people", rawId);
    if (!id) return null;
    const person = await ctx.db.get(id);
    if (!person || person.userId !== userId) return null;
    const day = today ?? ymdUtc(Date.now());
    const [company, interactions, deals, commitments, tasks] = await Promise.all([
      person.companyId
        ? ctx.db.get(person.companyId).then((c) => (c && c.userId === userId ? c : null))
        : Promise.resolve(null),
      ctx.db.query("interactions").withIndex("by_person", (q) => q.eq("personId", id)).collect(),
      ctx.db.query("deals").withIndex("by_person", (q) => q.eq("personId", id)).collect(),
      ctx.db.query("commitments").withIndex("by_person", (q) => q.eq("personId", id)).collect(),
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const dealTitle = new Map(deals.map((d) => [d._id as string, d.title]));
    return {
      person: { ...person, ...cadenceInfo(person, day), companyName: company?.name ?? null },
      company,
      interactions: interactions
        .sort((a, b) => (b.date === a.date ? b.at - a.at : b.date.localeCompare(a.date)))
        .map((i) => ({ ...i, dealTitle: i.dealId ? dealTitle.get(i.dealId) ?? null : null, personName: person.name })),
      deals: deals.sort((a, b) => b.createdAt - a.createdAt),
      commitments: commitments
        .sort((a, b) => (a.promisedDate ?? "9999").localeCompare(b.promisedDate ?? "9999"))
        .map((c) => ({ ...c, personName: person.name, dealTitle: c.dealId ? dealTitle.get(c.dealId) ?? null : null })),
      tasks: tasks
        .filter((t) => t.personId === id)
        .sort((a, b) => Number(a.status === "done") - Number(b.status === "done"))
        .map((t) => ({ _id: t._id, title: t.title, status: t.status, plannedFor: t.plannedFor ?? null })),
    };
  },
});

/** Who is due a reconnect (cadence elapsed), most overdue first. */
export const dueToReconnect = query({
  args: { today: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { today, limit }) => {
    const userId = await requireUser(ctx);
    const [people, companies] = await Promise.all([
      ctx.db.query("people").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("companies").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const cname = new Map(companies.map((c) => [c._id as string, c.name]));
    const rows = people
      .filter((p) => p.cadenceDays && p.cadenceDays > 0)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        relation: p.relation,
        tier: p.tier ?? null,
        cadenceDays: p.cadenceDays!,
        companyName: p.companyId ? cname.get(p.companyId) ?? null : null,
        ...cadenceInfo(p, today),
      }))
      .filter((r) => r.dueIn !== null && r.dueIn <= 0)
      // most overdue first; tier A before B before C on ties
      .sort((a, b) => a.dueIn! - b.dueIn! || (a.tier ?? "Z").localeCompare(b.tier ?? "Z"));
    return limit ? rows.slice(0, limit) : rows;
  },
});

/** Today's outreach quota + meetings goal ("open to goal"). */
export const outreachToday = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    return salesDay(ctx, userId, today);
  },
});

/** Recent touches across everyone (for timelines and the weekly review). */
export const recentInteractions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("interactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit ?? 30);
    const names = new Map<string, string>();
    for (const r of rows) {
      if (r.personId && !names.has(r.personId)) {
        const p = await ctx.db.get(r.personId);
        if (p && p.userId === userId) names.set(r.personId, p.name);
      }
    }
    return rows.map((r) => ({ ...r, personName: r.personId ? names.get(r.personId) ?? null : null }));
  },
});

// ─────────────────────────────────────────────────────────────────────────
// People — mutations
// ─────────────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    name: v.string(),
    companyId: v.optional(v.id("companies")),
    companyName: v.optional(v.string()), // find-or-create the company by name
    title: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    social: v.optional(v.string()),
    relation: v.optional(relationV),
    tier: v.optional(tierV),
    cadenceDays: v.optional(v.number()),
    source: v.optional(v.string()),
    howMet: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { companyName, ...args }) => {
    const userId = await requireUser(ctx);
    const name = clean(args.name);
    if (!name) throw new ConvexError("Give the person a name.");
    let companyId = args.companyId;
    if (companyId) await ownCompany(ctx, userId, companyId);
    else if (clean(companyName)) companyId = await findOrCreateCompany(ctx, userId, clean(companyName));
    const opt = (s?: string) => (clean(s) ? clean(s) : undefined);
    return ctx.db.insert("people", {
      userId,
      name,
      companyId,
      title: opt(args.title),
      email: opt(args.email),
      phone: opt(args.phone),
      social: opt(args.social),
      relation: args.relation ?? "lead",
      tier: args.tier,
      cadenceDays: args.cadenceDays && args.cadenceDays > 0 ? Math.round(args.cadenceDays) : undefined,
      source: opt(args.source),
      howMet: opt(args.howMet),
      notes: opt(args.notes),
      tags: args.tags,
      createdAt: Date.now(),
    });
  },
});

/** Patch a person. Pass null to clear an optional field. */
export const update = mutation({
  args: {
    id: v.id("people"),
    name: v.optional(v.string()),
    companyId: v.optional(v.union(v.id("companies"), v.null())),
    companyName: v.optional(v.string()),
    title: v.optional(v.union(v.string(), v.null())),
    email: v.optional(v.union(v.string(), v.null())),
    phone: v.optional(v.union(v.string(), v.null())),
    social: v.optional(v.union(v.string(), v.null())),
    relation: v.optional(relationV),
    tier: v.optional(v.union(tierV, v.null())),
    cadenceDays: v.optional(v.union(v.number(), v.null())),
    source: v.optional(v.union(v.string(), v.null())),
    howMet: v.optional(v.union(v.string(), v.null())),
    notes: v.optional(v.union(v.string(), v.null())),
    tags: v.optional(v.union(v.array(v.string()), v.null())),
  },
  handler: async (ctx, { id, companyName, ...rest }) => {
    const userId = await requireUser(ctx);
    await ownPerson(ctx, userId, id);
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      patch[k] = val === null || val === "" ? undefined : typeof val === "string" ? val.trim() : val;
    }
    if (rest.name !== undefined && !clean(rest.name)) throw new ConvexError("A person needs a name.");
    if (typeof rest.cadenceDays === "number") patch.cadenceDays = rest.cadenceDays > 0 ? Math.round(rest.cadenceDays) : undefined;
    if (rest.companyId) await ownCompany(ctx, userId, rest.companyId);
    if (companyName !== undefined) {
      patch.companyId = clean(companyName) ? await findOrCreateCompany(ctx, userId, clean(companyName)) : undefined;
    }
    await ctx.db.patch(id, patch);
  },
});

/** Delete a person; their deals, touches and commitments stay (unlinked). */
export const remove = mutation({
  args: { id: v.id("people") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await ownPerson(ctx, userId, id);
    const [deals, touches, commits, tasks] = await Promise.all([
      ctx.db.query("deals").withIndex("by_person", (q) => q.eq("personId", id)).collect(),
      ctx.db.query("interactions").withIndex("by_person", (q) => q.eq("personId", id)).collect(),
      ctx.db.query("commitments").withIndex("by_person", (q) => q.eq("personId", id)).collect(),
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    for (const d of deals) await ctx.db.patch(d._id, { personId: undefined });
    for (const t of touches) await ctx.db.patch(t._id, { personId: undefined });
    for (const c of commits) await ctx.db.patch(c._id, { personId: undefined });
    for (const t of tasks) if (t.personId === id) await ctx.db.patch(t._id, { personId: undefined });
    await ctx.db.delete(id);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Interactions
// ─────────────────────────────────────────────────────────────────────────

/**
 * Log a touch. Updates person.lastContactAt and deal.lastTouchAt (notes don't
 * count as contact), awards XP.outreach (key touch-<id>) and returns today's
 * sales block so the UI can show the quota.
 */
export const logInteraction = mutation({
  args: {
    kind: interactionKindV,
    summary: v.string(),
    personId: v.optional(v.id("people")),
    dealId: v.optional(v.id("deals")),
    companyId: v.optional(v.id("companies")),
    date: v.string(), // client-local YYYY-MM-DD
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (!YMD.test(args.date)) throw new ConvexError("Pick a valid date for this touch.");
    const deal = args.dealId ? await ctx.db.get(args.dealId) : null;
    if (args.dealId && (!deal || deal.userId !== userId)) throw new ConvexError("Deal not found.");
    const personId = args.personId ?? deal?.personId;
    const person = personId ? await ownPerson(ctx, userId, personId) : null;
    if (args.companyId) await ownCompany(ctx, userId, args.companyId);
    const companyId = args.companyId ?? person?.companyId ?? deal?.companyId;
    const now = Date.now();
    const summary = clean(args.summary) || `${KIND_LABEL[args.kind]}${person ? ` with ${person.name}` : ""}`;

    const id = await ctx.db.insert("interactions", {
      userId,
      personId,
      companyId,
      dealId: deal?._id,
      kind: args.kind,
      channel: clean(args.channel) || undefined,
      summary,
      date: args.date,
      at: now,
    });

    const isTouch = args.kind !== "note";
    // A backdated touch stamps noon of that day rather than "now".
    const stamp = args.date >= ymdUtc(now - 36 * 3600 * 1000) ? now : Date.parse(`${args.date}T12:00:00Z`);
    if (isTouch && person) {
      const prev = lastContactDay(person);
      if (!prev || args.date >= prev) await ctx.db.patch(person._id, { lastContactAt: stamp, lastContactDate: args.date });
    }
    if (isTouch && deal && (!deal.lastTouchAt || stamp > deal.lastTouchAt)) await ctx.db.patch(deal._id, { lastTouchAt: stamp });

    let xp = 0;
    if (isTouch) {
      const who = person?.name ?? deal?.title ?? summary;
      if (await awardXp(ctx, userId, `touch-${id}`, XP.outreach, `${KIND_LABEL[args.kind]}: ${who}`.slice(0, 120), args.date)) xp = XP.outreach;
    }
    const day = await salesDay(ctx, userId, args.date);
    return { id, xp, day };
  },
});

export const updateInteraction = mutation({
  args: {
    id: v.id("interactions"),
    summary: v.optional(v.string()),
    kind: v.optional(interactionKindV),
    channel: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { id, summary, kind, channel }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.userId !== userId) throw new ConvexError("Touch not found.");
    const patch: Partial<Doc<"interactions">> = {};
    if (summary !== undefined && clean(summary)) patch.summary = clean(summary);
    if (kind) patch.kind = kind;
    if (channel !== undefined) patch.channel = clean(channel) || undefined;
    await ctx.db.patch(id, patch);
  },
});

/** Delete a touch, revoke its XP and recompute last contact / last touch. */
export const removeInteraction = mutation({
  args: { id: v.id("interactions") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.userId !== userId) return;
    await ctx.db.delete(id);
    await revokeXp(ctx, userId, `touch-${id}`);
    const p = row.personId ? await ctx.db.get(row.personId) : null;
    if (p && p.userId === userId) await recomputeLastContact(ctx, p._id);
    const d = row.dealId ? await ctx.db.get(row.dealId) : null;
    if (d && d.userId === userId) await recomputeDealTouch(ctx, d._id);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Companies
// ─────────────────────────────────────────────────────────────────────────

type CompanyRollup = {
  peopleCount: number;
  openDeals: number;
  openValue: number;
  revenue: number;
  wonCount: number;
  lastContactDay: string | null;
};

async function companyRollups(ctx: Ctx, userId: Id<"users">) {
  const [people, deals, touches] = await Promise.all([
    ctx.db.query("people").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("interactions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
  ]);
  const out = new Map<string, CompanyRollup>();
  const get = (id: string) => {
    let r = out.get(id);
    if (!r) {
      r = { peopleCount: 0, openDeals: 0, openValue: 0, revenue: 0, wonCount: 0, lastContactDay: null };
      out.set(id, r);
    }
    return r;
  };
  const bump = (r: CompanyRollup, day?: string) => {
    if (day && (!r.lastContactDay || day > r.lastContactDay)) r.lastContactDay = day;
  };
  const personCompany = new Map<string, string>();
  for (const p of people) {
    if (!p.companyId) continue;
    personCompany.set(p._id, p.companyId);
    const r = get(p.companyId);
    r.peopleCount++;
    bump(r, lastContactDay(p));
  }
  for (const d of deals) {
    const cid = d.companyId ?? (d.personId ? personCompany.get(d.personId) : undefined);
    if (!cid) continue;
    const r = get(cid);
    if (OPEN_STAGES.has(d.stage)) {
      r.openDeals++;
      r.openValue += d.value ?? 0;
    }
    if (d.stage === "won") {
      r.wonCount++;
      r.revenue += d.value ?? 0;
    }
  }
  for (const t of touches) {
    if (t.kind === "note") continue;
    const cid = t.companyId ?? (t.personId ? personCompany.get(t.personId) : undefined);
    if (cid) bump(get(cid), t.date);
  }
  return out;
}

const EMPTY_ROLLUP: CompanyRollup = { peopleCount: 0, openDeals: 0, openValue: 0, revenue: 0, wonCount: 0, lastContactDay: null };

export const companies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [rows, rollups] = await Promise.all([
      ctx.db.query("companies").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      companyRollups(ctx, userId),
    ]);
    return rows
      .map((c) => ({ ...c, ...(rollups.get(c._id) ?? EMPTY_ROLLUP) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

/** Company page: people, deals, projects, commitments and the timeline. */
export const getCompany = query({
  // id is a raw string from the URL: a malformed one returns null instead of throwing.
  args: { id: v.string(), today: v.optional(v.string()) },
  handler: async (ctx, { id: rawId, today }) => {
    const userId = await requireUser(ctx);
    const id = ctx.db.normalizeId("companies", rawId);
    if (!id) return null;
    const company = await ctx.db.get(id);
    if (!company || company.userId !== userId) return null;
    const day = today ?? ymdUtc(Date.now());
    const [people, allDeals, touches, commits, projects, tasks] = await Promise.all([
      ctx.db.query("people").withIndex("by_company", (q) => q.eq("companyId", id)).collect(),
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("interactions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("commitments").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const pids = new Set(people.map((p) => p._id as string));
    const pname = new Map(people.map((p) => [p._id as string, p.name]));
    const deals = allDeals.filter((d) => d.companyId === id || (d.personId && pids.has(d.personId)));
    const dids = new Set(deals.map((d) => d._id as string));
    const dtitle = new Map(deals.map((d) => [d._id as string, d.title]));
    const mine = <T extends { companyId?: Id<"companies">; personId?: Id<"people">; dealId?: Id<"deals"> }>(x: T) =>
      x.companyId === id || (x.personId && pids.has(x.personId)) || (x.dealId && dids.has(x.dealId));
    const projs = projects.filter((p) => p.companyId === id || (p.dealId && dids.has(p.dealId)));
    return {
      company,
      people: people.map((p) => ({ ...p, ...cadenceInfo(p, day) })).sort((a, b) => a.name.localeCompare(b.name)),
      deals: deals.sort((a, b) => b.createdAt - a.createdAt),
      interactions: touches
        .filter(mine)
        .sort((a, b) => (b.date === a.date ? b.at - a.at : b.date.localeCompare(a.date)))
        .slice(0, 100)
        .map((i) => ({ ...i, personName: i.personId ? pname.get(i.personId) ?? null : null, dealTitle: i.dealId ? dtitle.get(i.dealId) ?? null : null })),
      commitments: commits
        .filter(mine)
        .sort((a, b) => (a.promisedDate ?? "9999").localeCompare(b.promisedDate ?? "9999"))
        .map((c) => ({ ...c, personName: c.personId ? pname.get(c.personId) ?? null : null, dealTitle: c.dealId ? dtitle.get(c.dealId) ?? null : null })),
      projects: projs.map((p) => {
        const pt = tasks.filter((t) => t.projectId === p._id);
        return { _id: p._id, title: p.title, status: p.status, progress: p.progress, taskTotal: pt.length, taskDone: pt.filter((t) => t.status === "done").length };
      }),
      revenue: deals.filter((d) => d.stage === "won").reduce((s, d) => s + (d.value ?? 0), 0),
    };
  },
});

export const createCompany = mutation({
  args: {
    name: v.string(),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    relationship: v.optional(companyRelV),
    health: v.optional(healthV),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const name = clean(args.name);
    if (!name) throw new ConvexError("Give the company a name.");
    const all = await ctx.db.query("companies").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    if (all.some((c) => c.name.trim().toLowerCase() === name.toLowerCase())) throw new ConvexError(`"${name}" already exists.`);
    return ctx.db.insert("companies", {
      userId,
      name,
      website: clean(args.website) || undefined,
      industry: clean(args.industry) || undefined,
      relationship: args.relationship ?? "prospect",
      health: args.health ?? (args.relationship === "customer" ? "green" : undefined),
      notes: clean(args.notes) || undefined,
      tags: args.tags,
      createdAt: Date.now(),
    });
  },
});

export const updateCompany = mutation({
  args: {
    id: v.id("companies"),
    name: v.optional(v.string()),
    website: v.optional(v.union(v.string(), v.null())),
    industry: v.optional(v.union(v.string(), v.null())),
    relationship: v.optional(companyRelV),
    health: v.optional(v.union(healthV, v.null())),
    notes: v.optional(v.union(v.string(), v.null())),
    tags: v.optional(v.union(v.array(v.string()), v.null())),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    await ownCompany(ctx, userId, id);
    if (rest.name !== undefined && !clean(rest.name)) throw new ConvexError("A company needs a name.");
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      patch[k] = val === null || val === "" ? undefined : typeof val === "string" ? val.trim() : val;
    }
    await ctx.db.patch(id, patch);
  },
});

/** Delete a company; people, deals, touches, commitments and projects are unlinked. */
export const removeCompany = mutation({
  args: { id: v.id("companies") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await ownCompany(ctx, userId, id);
    const [people, deals, touches, commits, projects] = await Promise.all([
      ctx.db.query("people").withIndex("by_company", (q) => q.eq("companyId", id)).collect(),
      ctx.db.query("deals").withIndex("by_company", (q) => q.eq("companyId", id)).collect(),
      ctx.db.query("interactions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("commitments").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    for (const p of people) await ctx.db.patch(p._id, { companyId: undefined });
    for (const d of deals) await ctx.db.patch(d._id, { companyId: undefined });
    for (const t of touches) if (t.companyId === id) await ctx.db.patch(t._id, { companyId: undefined });
    for (const c of commits) if (c.companyId === id) await ctx.db.patch(c._id, { companyId: undefined });
    for (const p of projects) if (p.companyId === id) await ctx.db.patch(p._id, { companyId: undefined });
    await ctx.db.delete(id);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Customers
// ─────────────────────────────────────────────────────────────────────────

/** A light-touch idea for the next check-in / renewal conversation. */
function nextIdea(o: {
  daysSince: number | null;
  daysAsCustomer: number | null;
  projects: { status: string; progress: number }[];
  openIOwe: number;
  health?: string;
}) {
  if (o.openIOwe > 0) return { text: `Deliver the ${o.openIOwe === 1 ? "open promise" : `${o.openIOwe} open promises`} first`, tone: "warning" as const };
  if (o.health === "red") return { text: "Book a save call: what would make this a 10/10?", tone: "danger" as const };
  if (o.daysSince === null) return { text: "Send a first check-in: how is it going so far?", tone: "info" as const };
  if (o.daysAsCustomer !== null && o.daysAsCustomer >= 300 && o.daysAsCustomer <= 400) return { text: "Renewal window: book a one-year review", tone: "info" as const };
  if (o.projects.some((p) => p.status === "completed" || p.progress >= 90))
    return { text: "Delivery wrapped: ask for a testimonial or a referral", tone: "success" as const };
  if (o.daysSince >= 30) return { text: `It's been ${o.daysSince} days: send a value check-in`, tone: "warning" as const };
  if (o.health === "yellow") return { text: "Ask one question: what's one thing we could do better?", tone: "warning" as const };
  return { text: "Share a quick win or a useful idea this month", tone: "muted" as const };
}

export const customers = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const [companies, people, deals, touches, commits, projects, tasks] = await Promise.all([
      ctx.db.query("companies").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("people").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("interactions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("commitments").withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "open")).collect(),
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const settings = await getSettings(ctx, userId);
    const rows = companies
      .filter((c) => c.relationship === "customer")
      .map((c) => {
        const ppl = people.filter((p) => p.companyId === c._id);
        const pids = new Set(ppl.map((p) => p._id as string));
        const cd = deals.filter((d) => d.companyId === c._id || (d.personId && pids.has(d.personId)));
        const dids = new Set(cd.map((d) => d._id as string));
        const won = cd.filter((d) => d.stage === "won");
        const mine = (x: { companyId?: Id<"companies">; personId?: Id<"people">; dealId?: Id<"deals"> }) =>
          x.companyId === c._id || (x.personId && pids.has(x.personId)) || (x.dealId && dids.has(x.dealId));
        let last: string | null = null;
        for (const p of ppl) {
          const d = lastContactDay(p);
          if (d && (!last || d > last)) last = d;
        }
        for (const t of touches) if (t.kind !== "note" && mine(t) && (!last || t.date > last)) last = t.date;
        const pname = new Map(ppl.map((p) => [p._id as string, p.name]));
        const dtitle = new Map(cd.map((d) => [d._id as string, d.title]));
        const openCommits = commits
          .filter(mine)
          .sort((a, b) => (a.promisedDate ?? "9999").localeCompare(b.promisedDate ?? "9999"))
          .map((x) => ({
            ...x,
            personName: x.personId ? pname.get(x.personId) ?? null : null,
            dealTitle: x.dealId ? dtitle.get(x.dealId) ?? null : null,
          }));
        const projs = projects
          .filter((p) => p.companyId === c._id || (p.dealId && dids.has(p.dealId)))
          .map((p) => {
            const pt = tasks.filter((t) => t.projectId === p._id);
            return { _id: p._id, title: p.title, status: p.status, progress: p.progress, taskTotal: pt.length, taskDone: pt.filter((t) => t.status === "done").length };
          });
        const firstWin = won.map((d) => d.closedDate ?? (d.closedAt ? ymdUtc(d.closedAt) : undefined)).filter(Boolean).sort()[0] as string | undefined;
        const daysSince = last ? diffDays(last, today) : null;
        const openIOwe = openCommits.filter((x) => x.direction === "i_owe").length;
        return {
          ...c,
          people: ppl.map((p) => ({ _id: p._id, name: p.name, title: p.title ?? null })),
          revenue: won.reduce((s, d) => s + (d.value ?? 0), 0),
          wonCount: won.length,
          openDeals: cd.filter((d) => OPEN_STAGES.has(d.stage)).map((d) => ({ _id: d._id, title: d.title, stage: d.stage, value: d.value ?? 0 })),
          lastContactDay: last,
          daysSince,
          customerSince: firstWin ?? null,
          projects: projs,
          commitments: openCommits,
          idea: nextIdea({ daysSince, daysAsCustomer: firstWin ? diffDays(firstWin, today) : null, projects: projs, openIOwe, health: c.health }),
        };
      })
      .sort((a, b) => {
        const rank = (h?: string) => (h === "red" ? 0 : h === "yellow" ? 1 : 2);
        return rank(a.health) - rank(b.health) || b.revenue - a.revenue;
      });
    return { customers: rows, currency: settings.currency };
  },
});
