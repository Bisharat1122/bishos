/**
 * B1 · Founder-led sales pipeline.
 *
 * Stages: Target → Contacted → Conversation booked → Discovery done → Proposal
 * sent → Verbal yes → Won / Lost / Unqualified. Every OPEN deal must carry a
 * dated next step (enforced in create / update / move). Flags follow Founding
 * Sales: idle 7+ days, stuck 14+ days in a stage, proposal open 9+ days.
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { XP, awardXp, revokeXp, getSettings, diffDays, ymdUtc, addDays, monthKey } from "./os";
import { salesDay, findOrCreateCompany } from "./people";

export const stageV = v.union(
  v.literal("target"),
  v.literal("contacted"),
  v.literal("booked"),
  v.literal("discovery"),
  v.literal("proposal"),
  v.literal("verbal"),
  v.literal("won"),
  v.literal("lost"),
  v.literal("unqualified"),
);

type Ctx = QueryCtx | MutationCtx;
type Deal = Doc<"deals">;
export type Stage = Deal["stage"];

export const STAGES: Stage[] = ["target", "contacted", "booked", "discovery", "proposal", "verbal", "won", "lost", "unqualified"];
export const OPEN_STAGES: Stage[] = ["target", "contacted", "booked", "discovery", "proposal", "verbal"];
export const isOpenStage = (s: Stage) => OPEN_STAGES.includes(s);

const STAGE_LABEL: Record<Stage, string> = {
  target: "Target",
  contacted: "Contacted",
  booked: "Conversation booked",
  discovery: "Discovery done",
  proposal: "Proposal sent",
  verbal: "Verbal yes",
  won: "Won",
  lost: "Lost",
  unqualified: "Unqualified",
};

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const clean = (s?: string | null) => (s ?? "").trim();

const NEXT_STEP_MSG = "Open deals need a next step and a date. What happens next, and when?";
const LOST_MSG = "Add a short reason. It's how you get better at qualifying.";

function assertNextStep(stage: Stage, nextStep?: string, nextStepDate?: string) {
  if (!isOpenStage(stage)) return;
  if (!clean(nextStep) || !nextStepDate) throw new ConvexError(NEXT_STEP_MSG);
  if (!YMD.test(nextStepDate)) throw new ConvexError("The next-step date must be a valid day.");
}

// ─────────────────────────────────────────────────────────────────────────
// Flags + enrichment
// ─────────────────────────────────────────────────────────────────────────

export function dealFlags(d: Deal, today: string) {
  const open = isOpenStage(d.stage);
  const touchedAt = Math.max(d.lastTouchAt ?? 0, d.stageChangedAt);
  const idleDays = diffDays(ymdUtc(touchedAt), today);
  const stageDays = diffDays(ymdUtc(d.stageChangedAt), today);
  const proposalDays = d.stage === "proposal" && d.proposalSentAt ? diffDays(ymdUtc(d.proposalSentAt), today) : null;
  return {
    open,
    idleDays,
    stageDays,
    proposalDays,
    idle: open && idleDays >= 7,
    stuck: open && stageDays >= 14,
    proposalOpen: open && proposalDays !== null && proposalDays >= 9,
    overdue: open && !!d.nextStepDate && d.nextStepDate < today,
    dueToday: open && d.nextStepDate === today,
    noNextStep: open && (!clean(d.nextStep) || !d.nextStepDate),
  };
}

async function enrich(ctx: Ctx, userId: Id<"users">, deals: Deal[], today: string) {
  const cache = new Map<string, { name: string } | null>();
  const nameOf = async (id?: Id<"people"> | Id<"companies"> | Id<"offers"> | Id<"campaigns">) => {
    if (!id) return null;
    if (!cache.has(id)) {
      const doc = (await ctx.db.get(id)) as { name: string; userId: Id<"users"> } | null;
      cache.set(id, doc && doc.userId === userId ? { name: doc.name } : null);
    }
    return cache.get(id)?.name ?? null;
  };
  const out = [];
  for (const d of deals) {
    const companyId = d.companyId;
    out.push({
      ...d,
      stageLabel: STAGE_LABEL[d.stage],
      personName: await nameOf(d.personId),
      companyName: await nameOf(companyId),
      offerName: await nameOf(d.offerId),
      campaignName: await nameOf(d.campaignId),
      flags: dealFlags(d, today),
    });
  }
  return out;
}

export type EnrichedDeal = Awaited<ReturnType<typeof enrich>>[number];

/** Throw unless the referenced doc exists and belongs to the user. */
async function assertOwned(
  ctx: Ctx,
  userId: Id<"users">,
  id: Id<"people"> | Id<"companies"> | Id<"offers"> | Id<"campaigns"> | Id<"lifeAreas"> | null | undefined,
  label: string,
) {
  if (!id) return;
  const doc = (await ctx.db.get(id)) as { userId: Id<"users"> } | null;
  if (!doc || doc.userId !== userId) throw new ConvexError(`${label} not found.`);
}

/** Load a linked doc only if it belongs to the user. */
async function ownedOrNull<T extends { userId: Id<"users"> }>(ctx: Ctx, userId: Id<"users">, id: Id<"people"> | Id<"companies"> | Id<"projects"> | undefined) {
  if (!id) return null;
  const doc = (await ctx.db.get(id)) as T | null;
  return doc && doc.userId === userId ? doc : null;
}

async function ownDeal(ctx: Ctx, userId: Id<"users">, id: Id<"deals">) {
  const d = await ctx.db.get(id);
  if (!d || d.userId !== userId) throw new ConvexError("Deal not found.");
  return d;
}

const closedDay = (d: Deal) => d.closedDate ?? (d.closedAt ? ymdUtc(d.closedAt) : undefined);

// ─────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────

/** Every deal, with person/company/offer/campaign names and flags. */
export const list = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const deals = await ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const rows = await enrich(ctx, userId, deals, today);
    // urgent first inside a column: earliest next step, then biggest value
    return rows.sort(
      (a, b) => (a.nextStepDate ?? "9999").localeCompare(b.nextStepDate ?? "9999") || (b.value ?? 0) - (a.value ?? 0),
    );
  },
});

/** Open deals whose next step is due today or overdue (Today page / sales block). */
export const dueToday = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const deals = await ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const due = deals.filter((d) => isOpenStage(d.stage) && d.nextStepDate && d.nextStepDate <= today);
    const rows = await enrich(ctx, userId, due, today);
    return rows.sort((a, b) => (a.nextStepDate ?? "").localeCompare(b.nextStepDate ?? ""));
  },
});

/** The daily sales block: quota, meetings goal and next steps due. */
export const salesToday = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const day = await salesDay(ctx, userId, today);
    const deals = await ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const due = deals
      .filter((d) => isOpenStage(d.stage) && d.nextStepDate && d.nextStepDate <= today)
      .sort((a, b) => (a.nextStepDate ?? "").localeCompare(b.nextStepDate ?? ""));
    return { ...day, nextSteps: await enrich(ctx, userId, due.slice(0, 12), today), nextStepsCount: due.length };
  },
});

/** One deal with its timeline, commitments, tasks and delivery project. */
export const get = query({
  // id may come from ?deal= in the URL: a malformed one returns null instead of throwing.
  args: { id: v.string(), today: v.string() },
  handler: async (ctx, { id: rawId, today }) => {
    const userId = await requireUser(ctx);
    const id = ctx.db.normalizeId("deals", rawId);
    if (!id) return null;
    const deal = await ctx.db.get(id);
    if (!deal || deal.userId !== userId) return null;
    const [row] = await enrich(ctx, userId, [deal], today);
    const [person, company, interactions, allCommits, tasks, project] = await Promise.all([
      ownedOrNull<Doc<"people">>(ctx, userId, deal.personId),
      ownedOrNull<Doc<"companies">>(ctx, userId, deal.companyId),
      ctx.db.query("interactions").withIndex("by_deal", (q) => q.eq("dealId", id)).collect(),
      ctx.db.query("commitments").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("tasks").withIndex("by_deal", (q) => q.eq("dealId", id)).collect(),
      ownedOrNull<Doc<"projects">>(ctx, userId, deal.projectId),
    ]);
    return {
      deal: row,
      person,
      company,
      interactions: interactions
        .sort((a, b) => (b.date === a.date ? b.at - a.at : b.date.localeCompare(a.date)))
        .map((i) => ({ ...i, personName: row.personName, dealTitle: deal.title })),
      commitments: allCommits
        .filter((c) => c.dealId === id)
        .sort((a, b) => (a.promisedDate ?? "9999").localeCompare(b.promisedDate ?? "9999"))
        .map((c) => ({ ...c, personName: row.personName, dealTitle: deal.title })),
      tasks: tasks.map((t) => ({ _id: t._id, title: t.title, status: t.status, plannedFor: t.plannedFor ?? null })),
      project: project ? { _id: project._id, title: project.title, status: project.status, progress: project.progress } : null,
    };
  },
});

/**
 * Pipeline header numbers: value by stage, win rate, velocity, today's block.
 * Win rate is a 90-DAY figure (deals closed in [today-89, today]):
 * won ÷ (won + lost). Unqualified deals are left out (not a lost sale).
 */
export const stats = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const deals = await ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const day = await salesDay(ctx, userId, today);

    const byStage = Object.fromEntries(STAGES.map((s) => [s, { count: 0, value: 0 }])) as Record<Stage, { count: number; value: number }>;
    for (const d of deals) {
      byStage[d.stage].count++;
      byStage[d.stage].value += d.value ?? 0;
    }
    const open = deals.filter((d) => isOpenStage(d.stage));
    const since90 = addDays(today, -89);
    const closed90 = deals.filter((d) => !isOpenStage(d.stage) && (closedDay(d) ?? "") >= since90);
    const won90 = closed90.filter((d) => d.stage === "won");
    const lost90 = closed90.filter((d) => d.stage === "lost");
    const month = monthKey(today);
    const wonMonth = deals.filter((d) => d.stage === "won" && closedDay(d) && monthKey(closedDay(d)!) === month);
    const velocity = won90.length
      ? Math.round(won90.reduce((s, d) => s + Math.max(0, diffDays(ymdUtc(d.createdAt), closedDay(d)!)), 0) / won90.length)
      : null;
    let idle = 0;
    let stuck = 0;
    let overdue = 0;
    let dueTodayCount = 0;
    let proposalOpen = 0;
    for (const d of open) {
      const f = dealFlags(d, today);
      if (f.idle) idle++;
      if (f.stuck) stuck++;
      if (f.overdue) overdue++;
      if (f.dueToday) dueTodayCount++;
      if (f.proposalOpen) proposalOpen++;
    }
    return {
      byStage,
      openCount: open.length,
      openValue: open.reduce((s, d) => s + (d.value ?? 0), 0),
      winRate: won90.length + lost90.length ? Math.round((won90.length / (won90.length + lost90.length)) * 100) : null,
      won90: won90.length,
      lost90: lost90.length,
      wonValue90: won90.reduce((s, d) => s + (d.value ?? 0), 0),
      avgWon: won90.length ? Math.round(won90.reduce((s, d) => s + (d.value ?? 0), 0) / won90.length) : null,
      wonThisMonth: { count: wonMonth.length, value: wonMonth.reduce((s, d) => s + (d.value ?? 0), 0) },
      velocityDays: velocity,
      flags: { idle, stuck, overdue, dueToday: dueTodayCount, proposalOpen },
      nextStepsDue: dueTodayCount + overdue,
      day,
      currency: day.currency,
    };
  },
});

/** Selects for the deal form: offers + campaigns (owned by B2) and currency. */
export const options = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [offers, campaigns, settings] = await Promise.all([
      ctx.db.query("offers").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("campaigns").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      getSettings(ctx, userId),
    ]);
    return {
      offers: offers
        .sort((a, b) => Number(a.status === "retired") - Number(b.status === "retired") || a.name.localeCompare(b.name))
        .map((o) => ({ _id: o._id, name: o.name, status: o.status, price: o.price ?? null })),
      campaigns: campaigns
        .sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || a.name.localeCompare(b.name))
        .map((c) => ({ _id: c._id, name: c.name, status: c.status })),
      currency: settings.currency,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Stage transitions (shared by create / update / move)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Apply side effects of moving `deal` to `to`. Mutates `patch`, awards or
 * revokes XP, and updates the person/company. Returns XP gained.
 */
async function applyStage(
  ctx: MutationCtx,
  userId: Id<"users">,
  deal: Deal,
  to: Stage,
  date: string,
  patch: Partial<Deal> & Record<string, unknown>,
  opts: { companyName?: string } = {},
) {
  const from = deal.stage;
  const now = Date.now();
  let xp = 0;
  if (from === to) return { xp, won: false };
  patch.stageChangedAt = now;
  // (re)sent: entering Proposal from an earlier stage restarts the 9-day clock
  if (to === "proposal" && (!deal.proposalSentAt || STAGES.indexOf(from) < STAGES.indexOf("proposal"))) patch.proposalSentAt = now;
  if (to === "booked") patch.bookedDate = date;
  if (from === "won" && to !== "won") await revokeXp(ctx, userId, `deal-won-${deal._id}`);

  if (isOpenStage(to)) {
    patch.closedAt = undefined;
    patch.closedDate = undefined;
    patch.lostReason = undefined;
    const fi = isOpenStage(from) ? STAGES.indexOf(from) : -1;
    const ti = STAGES.indexOf(to);
    if (ti > fi) {
      if (ti > 0 && (await awardXp(ctx, userId, `deal-${deal._id}-${to}`, XP.dealAdvanced, `Deal → ${STAGE_LABEL[to]}: ${deal.title}`.slice(0, 120), date)))
        xp += XP.dealAdvanced;
    } else {
      // moved backwards: undo the advancement XP for the stages it left
      for (let i = ti + 1; i <= fi; i++) await revokeXp(ctx, userId, `deal-${deal._id}-${STAGES[i]}`);
    }
    return { xp, won: false };
  }

  patch.closedAt = now;
  patch.closedDate = date;

  if (to === "won") {
    patch.lostReason = undefined;
    if (await awardXp(ctx, userId, `deal-won-${deal._id}`, XP.dealWon, `Deal won: ${deal.title}`.slice(0, 120), date)) xp += XP.dealWon;
    const person = await ownedOrNull<Doc<"people">>(ctx, userId, deal.personId);
    let companyId = deal.companyId ?? person?.companyId;
    if (!companyId && clean(opts.companyName)) {
      companyId = await findOrCreateCompany(ctx, userId, clean(opts.companyName), "customer");
      if (person && !person.companyId) await ctx.db.patch(person._id, { companyId });
    }
    if (companyId && !deal.companyId) patch.companyId = companyId;
    if (companyId) {
      const co = await ctx.db.get(companyId);
      if (co && co.userId === userId && co.relationship !== "customer")
        await ctx.db.patch(companyId, { relationship: "customer", health: co.health ?? "green" });
    }
    if (person && ["lead", "other", "peer", "partner"].includes(person.relation)) await ctx.db.patch(person._id, { relation: "customer" });
    return { xp, won: true };
  }

  // lost / unqualified → keep the person warm as a nurture contact
  const reason = clean((patch.lostReason as string | undefined) ?? deal.lostReason);
  if (!reason) throw new ConvexError(LOST_MSG);
  const nurture = await ownedOrNull<Doc<"people">>(ctx, userId, deal.personId);
  if (nurture && !nurture.cadenceDays) await ctx.db.patch(nurture._id, { cadenceDays: 90 });
  return { xp, won: false };
}

// ─────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    title: v.string(),
    stage: v.optional(stageV),
    personId: v.optional(v.id("people")),
    companyId: v.optional(v.id("companies")),
    companyName: v.optional(v.string()),
    offerId: v.optional(v.id("offers")),
    campaignId: v.optional(v.id("campaigns")),
    value: v.optional(v.number()),
    sourceChannel: v.optional(v.string()),
    nextStep: v.optional(v.string()),
    nextStepDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    lostReason: v.optional(v.string()),
    qualification: v.optional(
      v.object({
        pain: v.optional(v.string()),
        budget: v.optional(v.string()),
        decisionMaker: v.optional(v.string()),
        timeline: v.optional(v.string()),
      }),
    ),
    date: v.string(), // client-local today
  },
  handler: async (ctx, { date, companyName, ...args }) => {
    const userId = await requireUser(ctx);
    const title = clean(args.title);
    if (!title) throw new ConvexError("Give the deal a name.");
    const stage = args.stage ?? "target";
    assertNextStep(stage, args.nextStep, args.nextStepDate);
    if ((stage === "lost" || stage === "unqualified") && !clean(args.lostReason)) throw new ConvexError(LOST_MSG);
    const person = args.personId ? await ctx.db.get(args.personId) : null;
    if (args.personId && (!person || person.userId !== userId)) throw new ConvexError("Person not found.");
    await assertOwned(ctx, userId, args.offerId, "Offer");
    await assertOwned(ctx, userId, args.campaignId, "Campaign");
    let companyId = args.companyId ?? person?.companyId;
    if (companyId) {
      const co = await ctx.db.get(companyId);
      if (!co || co.userId !== userId) throw new ConvexError("Company not found.");
    } else if (clean(companyName)) {
      companyId = await findOrCreateCompany(ctx, userId, clean(companyName));
      if (person && !person.companyId) await ctx.db.patch(person._id, { companyId });
    }
    const now = Date.now();
    const id = await ctx.db.insert("deals", {
      userId,
      title,
      stage: "target",
      personId: args.personId,
      companyId,
      offerId: args.offerId,
      campaignId: args.campaignId,
      value: args.value && args.value > 0 ? args.value : undefined,
      sourceChannel: clean(args.sourceChannel) || undefined,
      nextStep: clean(args.nextStep) || undefined,
      nextStepDate: args.nextStepDate || undefined,
      notes: clean(args.notes) || undefined,
      lostReason: clean(args.lostReason) || undefined,
      qualification: args.qualification,
      stageChangedAt: now,
      createdAt: now,
    });
    let result = { xp: 0, won: false };
    if (stage !== "target") {
      const doc = (await ctx.db.get(id))!;
      const patch: Partial<Deal> & Record<string, unknown> = { lostReason: clean(args.lostReason) || undefined };
      result = await applyStage(ctx, userId, doc, stage, date, patch);
      await ctx.db.patch(id, { ...patch, stage });
    }
    return { id, ...result };
  },
});

const qualV = v.object({
  pain: v.optional(v.string()),
  budget: v.optional(v.string()),
  decisionMaker: v.optional(v.string()),
  timeline: v.optional(v.string()),
});

/**
 * Patch a deal (null clears). If `stage` changes, the same rules as `move`
 * apply. The merged deal must still have a next step + date while open.
 */
export const update = mutation({
  args: {
    id: v.id("deals"),
    date: v.optional(v.string()),
    title: v.optional(v.string()),
    stage: v.optional(stageV),
    personId: v.optional(v.union(v.id("people"), v.null())),
    companyId: v.optional(v.union(v.id("companies"), v.null())),
    offerId: v.optional(v.union(v.id("offers"), v.null())),
    campaignId: v.optional(v.union(v.id("campaigns"), v.null())),
    value: v.optional(v.union(v.number(), v.null())),
    sourceChannel: v.optional(v.union(v.string(), v.null())),
    nextStep: v.optional(v.union(v.string(), v.null())),
    nextStepDate: v.optional(v.union(v.string(), v.null())),
    notes: v.optional(v.union(v.string(), v.null())),
    lostReason: v.optional(v.union(v.string(), v.null())),
    qualification: v.optional(qualV),
    companyName: v.optional(v.string()),
  },
  handler: async (ctx, { id, date, stage, companyName, ...rest }) => {
    const userId = await requireUser(ctx);
    const deal = await ownDeal(ctx, userId, id);
    const patch: Partial<Deal> & Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      patch[k] = val === null || val === "" ? undefined : typeof val === "string" ? val.trim() : val;
    }
    if (rest.title !== undefined && !clean(rest.title)) throw new ConvexError("A deal needs a name.");
    if (typeof rest.value === "number") patch.value = rest.value > 0 ? rest.value : undefined;
    if (rest.personId) {
      const p = await ctx.db.get(rest.personId);
      if (!p || p.userId !== userId) throw new ConvexError("Person not found.");
      if (!deal.companyId && rest.companyId === undefined && p.companyId) patch.companyId = p.companyId;
    }
    if (rest.companyId) {
      const c = await ctx.db.get(rest.companyId);
      if (!c || c.userId !== userId) throw new ConvexError("Company not found.");
    }
    await assertOwned(ctx, userId, rest.offerId, "Offer");
    await assertOwned(ctx, userId, rest.campaignId, "Campaign");
    if (companyName !== undefined && rest.companyId === undefined) {
      patch.companyId = clean(companyName) ? await findOrCreateCompany(ctx, userId, clean(companyName)) : undefined;
    }
    if (rest.qualification) patch.qualification = { ...(deal.qualification ?? {}), ...rest.qualification };

    const toStage = stage ?? deal.stage;
    const merged = { ...deal, ...patch, stage: toStage };
    assertNextStep(toStage, merged.nextStep, merged.nextStepDate);
    if ((toStage === "lost" || toStage === "unqualified") && !clean(merged.lostReason)) throw new ConvexError(LOST_MSG);
    let result = { xp: 0, won: false };
    if (stage && stage !== deal.stage) {
      result = await applyStage(ctx, userId, deal, stage, date ?? ymdUtc(Date.now()), patch, { companyName });
      patch.stage = stage;
    }
    await ctx.db.patch(id, patch);
    return result;
  },
});

/**
 * Move a deal to a stage (board drag / won / lost). Open stages require a
 * next step + date; lost/unqualified require a reason. Awards XP.dealAdvanced
 * (key deal-<id>-<stage>) on forward moves and XP.dealWon on a win.
 */
export const move = mutation({
  args: {
    id: v.id("deals"),
    stage: stageV,
    date: v.string(),
    nextStep: v.optional(v.string()),
    nextStepDate: v.optional(v.string()),
    lostReason: v.optional(v.string()),
    value: v.optional(v.number()),
    companyName: v.optional(v.string()), // won: customer account to file it under
  },
  handler: async (ctx, { id, stage, date, nextStep, nextStepDate, lostReason, value, companyName }) => {
    const userId = await requireUser(ctx);
    const deal = await ownDeal(ctx, userId, id);
    const patch: Partial<Deal> & Record<string, unknown> = {};
    if (nextStep !== undefined) patch.nextStep = clean(nextStep) || undefined;
    if (nextStepDate !== undefined) patch.nextStepDate = nextStepDate || undefined;
    if (lostReason !== undefined) patch.lostReason = clean(lostReason) || undefined;
    if (value !== undefined) patch.value = value > 0 ? value : undefined;
    const merged = { ...deal, ...patch };
    assertNextStep(stage, merged.nextStep, merged.nextStepDate);
    const result = await applyStage(ctx, userId, deal, stage, date, patch, { companyName });
    patch.stage = stage;
    await ctx.db.patch(id, patch);
    // "open to goal": did this booking just hit today's meetings goal?
    let goalJustHit = false;
    if (stage === "booked" && deal.stage !== "booked") {
      const day = await salesDay(ctx, userId, date);
      goalJustHit = day.goalHit && day.meetings === day.meetingsGoal;
    }
    return { ...result, goalJustHit };
  },
});

/** Delete a deal. Touches, commitments, tasks and projects are unlinked. */
export const remove = mutation({
  args: { id: v.id("deals") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await ownDeal(ctx, userId, id);
    const [touches, commits, tasks, projects] = await Promise.all([
      ctx.db.query("interactions").withIndex("by_deal", (q) => q.eq("dealId", id)).collect(),
      ctx.db.query("commitments").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("tasks").withIndex("by_deal", (q) => q.eq("dealId", id)).collect(),
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    for (const t of touches) await ctx.db.patch(t._id, { dealId: undefined });
    for (const c of commits) if (c.dealId === id) await ctx.db.patch(c._id, { dealId: undefined });
    for (const t of tasks) await ctx.db.patch(t._id, { dealId: undefined });
    for (const p of projects) if (p.dealId === id) await ctx.db.patch(p._id, { dealId: undefined });
    await revokeXp(ctx, userId, `deal-won-${id}`);
    for (const s of OPEN_STAGES) await revokeXp(ctx, userId, `deal-${id}-${s}`);
    await ctx.db.delete(id);
  },
});

/** Pick the delivery area: name matches operation/delivery/client, else the first. */
async function deliveryArea(ctx: Ctx, userId: Id<"users">) {
  const areas = (await ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect())
    .filter((a) => !a.archived)
    .sort((a, b) => a.order - b.order);
  return areas.find((a) => /operation|delivery|client/i.test(a.name)) ?? areas[0] ?? null;
}

/**
 * Won deal → delivery project in the operations area (or `lifeAreaId`).
 * Links deal.projectId, project.dealId and project.companyId, and marks the
 * company and person as customers.
 */
export const createDeliveryProject = mutation({
  args: {
    dealId: v.id("deals"),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    title: v.optional(v.string()),
    companyName: v.optional(v.string()),
  },
  handler: async (ctx, { dealId, lifeAreaId, title, companyName }) => {
    const userId = await requireUser(ctx);
    const deal = await ownDeal(ctx, userId, dealId);
    if (deal.projectId && (await ctx.db.get(deal.projectId))) throw new ConvexError("This deal already has a delivery project.");
    let area: Doc<"lifeAreas"> | null = null;
    if (lifeAreaId) {
      area = await ctx.db.get(lifeAreaId);
      if (!area || area.userId !== userId) throw new ConvexError("Life area not found.");
    } else area = await deliveryArea(ctx, userId);
    if (!area) throw new ConvexError("Create a life area first (e.g. Company Operations).");

    const person = await ownedOrNull<Doc<"people">>(ctx, userId, deal.personId);
    let companyId = deal.companyId ?? person?.companyId;
    if (!companyId && clean(companyName)) {
      companyId = await findOrCreateCompany(ctx, userId, clean(companyName), "customer");
      if (person && !person.companyId) await ctx.db.patch(person._id, { companyId });
    }
    const company = await ownedOrNull<Doc<"companies">>(ctx, userId, companyId);

    const q = deal.qualification;
    const description = [
      `Delivery for the won deal "${deal.title}".`,
      q?.pain ? `Pain to solve: ${q.pain}` : "",
      q?.timeline ? `Timeline: ${q.timeline}` : "",
      deal.notes ? `Notes: ${deal.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const projectId = await ctx.db.insert("projects", {
      userId,
      title: clean(title) || `${company?.name ?? deal.title}: delivery`,
      description,
      status: "active",
      lifeAreaId: area._id,
      progress: 0,
      kind: "standard",
      dealId,
      companyId: company?._id,
    });
    await ctx.db.patch(dealId, { projectId, ...(company && !deal.companyId ? { companyId: company._id } : {}) });
    if (company && company.relationship !== "customer") await ctx.db.patch(company._id, { relationship: "customer", health: company.health ?? "green" });
    if (person && ["lead", "other", "peer", "partner"].includes(person.relation)) await ctx.db.patch(person._id, { relation: "customer" });
    // carry open commitments on the deal into the project
    const commits = await ctx.db.query("commitments").withIndex("by_user_status", (x) => x.eq("userId", userId).eq("status", "open")).collect();
    for (const c of commits) if (c.dealId === dealId && !c.projectId) await ctx.db.patch(c._id, { projectId });
    return { projectId, areaName: area.name };
  },
});

/** The default area the delivery project will go to (for the UI preselect). */
export const deliveryDefaults = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const area = await deliveryArea(ctx, userId);
    return area ? { lifeAreaId: area._id, name: area.name } : null;
  },
});
