import { v, ConvexError } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { awardXp, revokeXp, XP, ymdUtc } from "./os";

const HOUR = 60 * 60 * 1000;
const STALE_MS = 48 * HOUR;

/** One inbox for everything. No filing decision at capture time. */
export const capture = mutation({
  args: { text: v.string(), source: v.optional(v.string()) },
  handler: async (ctx, { text, source }) => {
    const userId = await requireUser(ctx);
    const t = text.trim();
    if (!t) throw new ConvexError("Nothing to capture.");
    return ctx.db.insert("inbox", {
      userId,
      text: t.slice(0, 4000),
      source: source ?? "quick",
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const captureMany = mutation({
  args: { items: v.array(v.string()), source: v.optional(v.string()) },
  handler: async (ctx, { items, source }) => {
    const userId = await requireUser(ctx);
    const now = Date.now();
    let n = 0;
    for (const raw of items) {
      const t = raw.trim();
      if (!t) continue;
      await ctx.db.insert("inbox", { userId, text: t.slice(0, 4000), source: source ?? "brain-dump", status: "open", createdAt: now + n++ });
    }
    return n;
  },
});

/** Open items (snoozed ones re-appear once their time passes). */
export const list = query({
  args: { now: v.number(), view: v.optional(v.union(v.literal("open"), v.literal("snoozed"), v.literal("processed"))) },
  handler: async (ctx, { now, view }) => {
    const userId = await requireUser(ctx);
    const all = await ctx.db
      .query("inbox")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    const v_ = view ?? "open";
    const rows =
      v_ === "open"
        ? all.filter((i) => i.status === "open" || (i.status === "snoozed" && (i.snoozeUntil ?? 0) <= now))
        : v_ === "snoozed"
          ? all.filter((i) => i.status === "snoozed" && (i.snoozeUntil ?? 0) > now)
          : all.filter((i) => i.status === "processed" || i.status === "discarded").slice(0, 60);
    return rows.map((i) => ({ ...i, ageHours: Math.floor((now - i.createdAt) / HOUR), stale: now - i.createdAt > STALE_MS }));
  },
});

export const counts = query({
  args: { now: v.number() },
  handler: async (ctx, { now }) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("inbox")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const open = rows.filter((i) => i.status === "open" || (i.status === "snoozed" && (i.snoozeUntil ?? 0) <= now));
    return { open: open.length, stale: open.filter((i) => now - i.createdAt > STALE_MS).length };
  },
});

async function own(ctx: MutationCtx, id: Id<"inbox">) {
  const userId = await requireUser(ctx);
  const item = await ctx.db.get(id);
  if (!item || item.userId !== userId) throw new ConvexError("Inbox item not found");
  return { userId, item };
}

/** Reject foreign ids that don't belong to this user. */
async function assertOwned(ctx: MutationCtx, userId: Id<"users">, ids: (Id<"lifeAreas"> | Id<"projects"> | Id<"people"> | undefined)[]) {
  for (const id of ids) {
    if (!id) continue;
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) throw new ConvexError("Linked item not found.");
  }
}

async function markProcessed(
  ctx: MutationCtx,
  userId: Id<"users">,
  id: Id<"inbox">,
  to: { type: string; id: string },
  date?: string,
) {
  await ctx.db.patch(id, { status: "processed", processedAt: Date.now(), processedTo: to });
  await awardXp(ctx, userId, `inbox-${id}`, XP.inboxProcessed, "Inbox processed", date ?? ymdUtc(Date.now()));
}

export const update = mutation({
  args: { id: v.id("inbox"), text: v.string() },
  handler: async (ctx, { id, text }) => {
    await own(ctx, id);
    await ctx.db.patch(id, { text: text.trim().slice(0, 4000) });
  },
});

export const toTask = mutation({
  args: {
    id: v.id("inbox"),
    title: v.string(),
    lifeAreaId: v.id("lifeAreas"),
    priority: v.optional(v.union(v.literal("low"), v.literal("med"), v.literal("high"))),
    plannedFor: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    estimateMin: v.optional(v.number()),
    energy: v.optional(v.union(v.literal("high"), v.literal("med"), v.literal("low"))),
    someday: v.optional(v.boolean()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, { id, date, title, priority, ...rest }) => {
    const { userId, item } = await own(ctx, id);
    await assertOwned(ctx, userId, [rest.lifeAreaId, rest.projectId]);
    const taskId = await ctx.db.insert("tasks", {
      userId,
      title: title.trim() || item.text.slice(0, 200),
      description: title.trim() && title.trim() !== item.text ? item.text : undefined,
      status: "not_started",
      priority: priority ?? "med",
      order: Date.now(),
      ...rest,
    });
    await markProcessed(ctx, userId, id, { type: "task", id: taskId }, date);
    return taskId;
  },
});

/** Two-minute rule: it's already done. */
export const markDone = mutation({
  args: { id: v.id("inbox"), date: v.optional(v.string()) },
  handler: async (ctx, { id, date }) => {
    const { userId } = await own(ctx, id);
    await markProcessed(ctx, userId, id, { type: "done", id: "" }, date);
  },
});

export const toNote = mutation({
  args: {
    id: v.id("inbox"),
    title: v.string(),
    noteType: v.optional(
      v.union(v.literal("fleeting"), v.literal("source"), v.literal("idea"), v.literal("map"), v.literal("project"), v.literal("daily")),
    ),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    date: v.optional(v.string()),
  },
  handler: async (ctx, { id, title, noteType, lifeAreaId, date }) => {
    const { userId, item } = await own(ctx, id);
    await assertOwned(ctx, userId, [lifeAreaId]);
    const noteId = await ctx.db.insert("notes", {
      userId,
      title: title.trim() || item.text.slice(0, 80),
      content: item.text,
      lifeAreaId,
      noteType: noteType ?? "idea",
      noteStatus: "inbox",
    });
    await markProcessed(ctx, userId, id, { type: "note", id: noteId }, date);
    return noteId;
  },
});

export const toCommitment = mutation({
  args: {
    id: v.id("inbox"),
    title: v.string(),
    direction: v.union(v.literal("i_owe"), v.literal("owed_to_me")),
    personId: v.optional(v.id("people")),
    promisedDate: v.optional(v.string()),
    checkDate: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, { id, date, title, ...rest }) => {
    const { userId, item } = await own(ctx, id);
    await assertOwned(ctx, userId, [rest.personId]);
    const cid = await ctx.db.insert("commitments", {
      userId,
      title: title.trim() || item.text.slice(0, 200),
      status: "open",
      source: "other",
      createdAt: Date.now(),
      ...rest,
    });
    await markProcessed(ctx, userId, id, { type: "commitment", id: cid }, date);
    return cid;
  },
});

export const toPerson = mutation({
  args: {
    id: v.id("inbox"),
    name: v.string(),
    relation: v.optional(
      v.union(
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
      ),
    ),
    date: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, relation, date }) => {
    const { userId, item } = await own(ctx, id);
    const pid = await ctx.db.insert("people", {
      userId,
      name: name.trim() || item.text.slice(0, 80),
      relation: relation ?? "lead",
      notes: item.text,
      createdAt: Date.now(),
    });
    await markProcessed(ctx, userId, id, { type: "person", id: pid }, date);
    return pid;
  },
});

export const toContentIdea = mutation({
  args: {
    id: v.id("inbox"),
    title: v.string(),
    brand: v.union(v.literal("personal"), v.literal("company")),
    date: v.optional(v.string()),
  },
  handler: async (ctx, { id, title, brand, date }) => {
    const { userId, item } = await own(ctx, id);
    const pid = await ctx.db.insert("contentPieces", {
      userId,
      title: title.trim() || item.text.slice(0, 120),
      brief: item.text,
      brand,
      format: "text_post",
      stage: "idea",
      createdAt: Date.now(),
    });
    await markProcessed(ctx, userId, id, { type: "content", id: pid }, date);
    return pid;
  },
});

export const toResource = mutation({
  args: {
    id: v.id("inbox"),
    title: v.string(),
    whySaved: v.string(),
    format: v.optional(v.string()),
    url: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, { id, title, whySaved, format, url, date }) => {
    const { userId, item } = await own(ctx, id);
    if (!whySaved.trim()) throw new ConvexError("Say why you're saving it — otherwise it's just collecting.");
    const urlMatch = item.text.match(/https?:\/\/\S+/);
    const rid = await ctx.db.insert("resources", {
      userId,
      title: title.trim() || item.text.slice(0, 120),
      url: url ?? urlMatch?.[0],
      format: format ?? "article",
      whySaved: whySaved.trim(),
      status: "queued",
      createdAt: Date.now(),
    });
    await markProcessed(ctx, userId, id, { type: "resource", id: rid }, date);
    return rid;
  },
});

export const snooze = mutation({
  args: { id: v.id("inbox"), until: v.number() },
  handler: async (ctx, { id, until }) => {
    await own(ctx, id);
    await ctx.db.patch(id, { status: "snoozed", snoozeUntil: until });
  },
});

export const discard = mutation({
  args: { id: v.id("inbox") },
  handler: async (ctx, { id }) => {
    await own(ctx, id);
    await ctx.db.patch(id, { status: "discarded", processedAt: Date.now() });
  },
});

export const restore = mutation({
  args: { id: v.id("inbox") },
  handler: async (ctx, { id }) => {
    const { userId } = await own(ctx, id);
    await ctx.db.patch(id, { status: "open", snoozeUntil: undefined, processedAt: undefined, processedTo: undefined });
    // Undo → revoke, so re-processing earns it again and restore+discard doesn't keep it.
    await revokeXp(ctx, userId, `inbox-${id}`);
  },
});

export const remove = mutation({
  args: { id: v.id("inbox") },
  handler: async (ctx, { id }) => {
    await own(ctx, id);
    await ctx.db.delete(id);
  },
});
