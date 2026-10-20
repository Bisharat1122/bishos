import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { awardXp, XP } from "./os";

const attachmentValidator = v.object({
  storageId: v.id("_storage"),
  name: v.string(),
  contentType: v.string(),
  size: v.number(),
});

// ── Life OS knowledge fields (Zettelkasten / LYT / Forte) ──
export const noteTypeValidator = v.union(
  v.literal("fleeting"),
  v.literal("source"),
  v.literal("idea"),
  v.literal("map"),
  v.literal("project"),
  v.literal("daily"),
);
export const noteStatusValidator = v.union(v.literal("inbox"), v.literal("processed"), v.literal("evergreen"));
const linkReasonValidator = v.object({ noteId: v.id("notes"), reason: v.string() });

/** Fleeting notes should be processed or thrown away within ~2 days (Ahrens). */
export const FLEETING_STALE_MS = 48 * 60 * 60 * 1000;

/** A note waiting in the knowledge inbox (fleeting or explicitly "inbox"). */
export const isInboxNote = (n: Doc<"notes">) =>
  n.noteStatus === "inbox" || (n.noteType === "fleeting" && n.noteStatus !== "processed" && n.noteStatus !== "evergreen");

/** Linked Life OS ids (learning area, resource) must belong to the caller. */
async function assertOwnedLinks(
  ctx: MutationCtx,
  userId: Id<"users">,
  ids: (Id<"learningAreas"> | Id<"resources"> | null | undefined)[],
) {
  for (const lid of ids) {
    if (!lid) continue;
    const doc = await ctx.db.get(lid);
    if (!doc || doc.userId !== userId) throw new ConvexError("Linked item not found.");
  }
}

/** Pull `[[Title]]` references out of note content. */
function extractWikiTitles(content: string): string[] {
  const out: string[] = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) out.push(m[1].trim());
  return out;
}

/** Resolve `[[Title]]` mentions in content to note ids (case-insensitive, excl. self). */
export async function resolveLinks(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  content: string,
  selfId?: Id<"notes">,
): Promise<Id<"notes">[]> {
  const titles = extractWikiTitles(content);
  if (titles.length === 0) return [];
  const all = await ctx.db
    .query("notes")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const ids = new Set<Id<"notes">>();
  for (const t of titles) {
    const match = all.find(
      (n) => n._id !== selfId && n.title.toLowerCase() === t.toLowerCase(),
    );
    if (match) ids.add(match._id);
  }
  return [...ids];
}

export const list = query({
  args: { lifeAreaId: v.optional(v.id("lifeAreas")) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    let notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    if (args.lifeAreaId) notes = notes.filter((n) => n.lifeAreaId === args.lifeAreaId);
    return notes;
  },
});

/** Lightweight title list for `[[` autocomplete. */
export const titles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return notes.map((n) => ({ _id: n._id, title: n.title }));
  },
});

export const get = query({
  // Plain string so a malformed /notes/<id> URL returns null instead of throwing.
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const id = ctx.db.normalizeId("notes", args.id);
    if (!id) return null;
    const note = await ctx.db.get(id);
    if (!note || note.userId !== userId) return null;
    return note;
  },
});

/** Outgoing links + incoming backlinks for the interlinking panel. */
export const connections = query({
  args: { id: v.string() },
  handler: async (ctx, { id: rawId }) => {
    const userId = await requireUser(ctx);
    const id = ctx.db.normalizeId("notes", rawId);
    if (!id) return { outgoing: [], backlinks: [] };
    const note = await ctx.db.get(id);
    if (!note || note.userId !== userId) return { outgoing: [], backlinks: [] };

    const all = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const outgoing = (note.linkedNoteIds ?? [])
      .map((nid) => all.find((n) => n._id === nid))
      .filter((n): n is NonNullable<typeof n> => Boolean(n))
      .map((n) => ({ _id: n._id, title: n.title }));

    const backlinks = all
      .filter((n) => n._id !== id && n.linkedNoteIds?.includes(id))
      .map((n) => ({ _id: n._id, title: n.title }));

    return { outgoing, backlinks };
  },
});

export const search = query({
  args: { term: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (!args.term.trim()) return [];
    return ctx.db
      .query("notes")
      .withSearchIndex("search_content", (q) =>
        q.search("content", args.term).eq("userId", userId),
      )
      .take(20);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.string()),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    sectionId: v.optional(v.id("sections")),
    tags: v.optional(v.array(v.string())),
    attachments: v.optional(v.array(attachmentValidator)),
    // Life OS (optional). noteType left undefined = treated as "idea".
    noteType: v.optional(noteTypeValidator),
    noteStatus: v.optional(noteStatusValidator),
    summary: v.optional(v.string()),
    resourceId: v.optional(v.id("resources")),
    learningAreaId: v.optional(v.id("learningAreas")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await assertOwnedLinks(ctx, userId, [args.learningAreaId, args.resourceId]);
    const content = args.content ?? "";
    const id = await ctx.db.insert("notes", { ...args, content, userId });
    const linkedNoteIds = await resolveLinks(ctx, userId, content, id);
    if (linkedNoteIds.length) await ctx.db.patch(id, { linkedNoteIds });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    lifeAreaId: v.optional(v.union(v.id("lifeAreas"), v.null())),
    sectionId: v.optional(v.union(v.id("sections"), v.null())),
    tags: v.optional(v.array(v.string())),
    linkedProjectIds: v.optional(v.array(v.id("projects"))),
    attachments: v.optional(v.array(attachmentValidator)),
    // Life OS (optional; null clears)
    noteType: v.optional(v.union(noteTypeValidator, v.null())),
    noteStatus: v.optional(v.union(noteStatusValidator, v.null())),
    summary: v.optional(v.union(v.string(), v.null())),
    resourceId: v.optional(v.union(v.id("resources"), v.null())),
    learningAreaId: v.optional(v.union(v.id("learningAreas"), v.null())),
    linkReasons: v.optional(v.array(linkReasonValidator)),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const note = await ctx.db.get(id);
    if (!note || note.userId !== userId) throw new ConvexError("Note not found.");
    await assertOwnedLinks(ctx, userId, [rest.learningAreaId, rest.resourceId]);
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) patch[k] = val === null ? undefined : val;
    if (rest.content !== undefined) {
      const linkedNoteIds = await resolveLinks(ctx, userId, rest.content, id);
      patch.linkedNoteIds = linkedNoteIds;
      // Drop "why" reasons for links that no longer exist in the text.
      const reasons = (rest.linkReasons ?? note.linkReasons) as { noteId: Id<"notes">; reason: string }[] | undefined;
      if (reasons?.length) patch.linkReasons = reasons.filter((r) => linkedNoteIds.includes(r.noteId));
    }
    await ctx.db.patch(id, patch);
  },
});

/** Save the one-line "why" for a link (Zettelkasten: the reason is the knowledge). */
export const setLinkReason = mutation({
  args: { id: v.id("notes"), targetId: v.id("notes"), reason: v.string() },
  handler: async (ctx, { id, targetId, reason }) => {
    const userId = await requireUser(ctx);
    const note = await ctx.db.get(id);
    if (!note || note.userId !== userId) throw new ConvexError("Note not found.");
    const text = reason.trim().slice(0, 280);
    const others = (note.linkReasons ?? []).filter((r) => r.noteId !== targetId);
    await ctx.db.patch(id, { linkReasons: text ? [...others, { noteId: targetId, reason: text }] : others });
  },
});

/**
 * Knowledge inbox: fleeting notes waiting to be processed. Notes older than
 * 48h are flagged `stale` (process them or let them go).
 */
export const inbox = query({
  args: { now: v.number() },
  handler: async (ctx, { now }) => {
    const userId = await requireUser(ctx);
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const items = notes
      .filter(isInboxNote)
      .sort((a, b) => a._creationTime - b._creationTime)
      .map((n) => ({
        _id: n._id,
        title: n.title,
        content: n.content.slice(0, 600),
        noteType: n.noteType,
        lifeAreaId: n.lifeAreaId,
        learningAreaId: n.learningAreaId,
        createdAt: n._creationTime,
        ageHours: Math.max(0, Math.floor((now - n._creationTime) / 3_600_000)),
        stale: now - n._creationTime > FLEETING_STALE_MS,
      }));
    return { items, count: items.length, staleCount: items.filter((i) => i.stale).length };
  },
});

/**
 * Process a fleeting note: keep it as an idea note, turn it into a task, or
 * discard it. Each processed note earns XP.inboxProcessed once.
 */
export const processFleeting = mutation({
  args: {
    id: v.id("notes"),
    action: v.union(v.literal("idea"), v.literal("task"), v.literal("discard")),
    date: v.string(),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { id, action, date, lifeAreaId, title }) => {
    const userId = await requireUser(ctx);
    const note = await ctx.db.get(id);
    if (!note || note.userId !== userId) throw new ConvexError("Note not found.");
    let taskId: Id<"tasks"> | undefined;
    if (action === "idea") {
      await ctx.db.patch(id, {
        noteType: "idea",
        noteStatus: "processed",
        ...(title?.trim() ? { title: title.trim() } : {}),
      });
    } else if (action === "task") {
      let areaId = lifeAreaId ?? note.lifeAreaId;
      if (areaId) {
        const a = await ctx.db.get(areaId);
        if (!a || a.userId !== userId) areaId = undefined;
      }
      if (!areaId) {
        const first = await ctx.db
          .query("lifeAreas")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();
        if (!first) throw new ConvexError("Create a life area first so the task has a home.");
        areaId = first._id;
      }
      taskId = await ctx.db.insert("tasks", {
        userId,
        title: (title?.trim() || note.title).slice(0, 200),
        description: note.content || undefined,
        status: "not_started",
        priority: "med",
        lifeAreaId: areaId,
        learningAreaId: note.learningAreaId,
        order: Date.now(),
      });
      await ctx.db.delete(id);
    } else {
      await ctx.db.delete(id);
    }
    const xp = (await awardXp(ctx, userId, `note-processed-${id}`, XP.inboxProcessed, "Fleeting note processed", date))
      ? XP.inboxProcessed
      : 0;
    return { taskId, xp };
  },
});

/**
 * "Mental squeeze point" (LYT): clusters of ≥5 linked notes that no Map of
 * Content covers yet. Returns up to 6 suggestions.
 */
export const suggestMaps = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const all = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const maps = all.filter((n) => n.noteType === "map");
    const pool = all.filter((n) => n.noteType !== "map" && n.noteType !== "daily");
    const byId = new Map(pool.map((n) => [n._id as string, n]));
    const adj = new Map<string, Set<string>>();
    const edge = (a: string, b: string) => {
      if (a === b || !byId.has(a) || !byId.has(b)) return;
      if (!adj.has(a)) adj.set(a, new Set());
      if (!adj.has(b)) adj.set(b, new Set());
      adj.get(a)!.add(b);
      adj.get(b)!.add(a);
    };
    for (const n of pool) for (const l of n.linkedNoteIds ?? []) edge(n._id, l);

    const covered = (ids: string[]) => {
      const set = new Set(ids);
      const need = Math.min(3, Math.ceil(ids.length * 0.4));
      return maps.some((m) => (m.linkedNoteIds ?? []).filter((x) => set.has(x)).length >= need);
    };
    const describe = (ids: string[]) => {
      const notes = ids.map((i) => byId.get(i)!).filter(Boolean);
      const hub = [...notes].sort((a, b) => (adj.get(b._id)?.size ?? 0) - (adj.get(a._id)?.size ?? 0))[0];
      const tagCount = new Map<string, number>();
      for (const n of notes) for (const t of n.tags ?? []) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
      const tag = [...tagCount.entries()].sort((a, b) => b[1] - a[1])[0];
      return {
        key: ids.slice().sort().join("|"),
        hubId: hub._id,
        hubTitle: hub.title,
        tag: tag && tag[1] >= 2 ? tag[0] : undefined,
        size: ids.length,
        noteIds: ids as Id<"notes">[],
        titles: notes.slice(0, 14).map((n) => n.title),
      };
    };

    // Connected components over the link graph.
    const seen = new Set<string>();
    const out: ReturnType<typeof describe>[] = [];
    for (const start of adj.keys()) {
      if (seen.has(start)) continue;
      const comp: string[] = [];
      const stack = [start];
      seen.add(start);
      while (stack.length) {
        const cur = stack.pop()!;
        comp.push(cur);
        for (const nb of adj.get(cur) ?? []) {
          if (seen.has(nb)) continue;
          seen.add(nb);
          stack.push(nb);
        }
      }
      if (comp.length < 5) continue;
      if (comp.length <= 12) {
        if (!covered(comp)) out.push(describe(comp));
        continue;
      }
      // Big web → suggest a map per hub neighbourhood (hub + ≥4 neighbours).
      const used = new Set<string>();
      const hubs = comp.filter((id) => (adj.get(id)?.size ?? 0) >= 4).sort((a, b) => adj.get(b)!.size - adj.get(a)!.size);
      for (const h of hubs) {
        if (used.has(h)) continue;
        const ids = [h, ...adj.get(h)!];
        used.add(h);
        for (const i of ids) used.add(i);
        if (!covered(ids)) out.push(describe(ids));
      }
    }
    return out.sort((a, b) => b.size - a.size).slice(0, 6);
  },
});

/** Create a Map of Content linking the given notes. */
export const createMap = mutation({
  args: { title: v.string(), noteIds: v.array(v.id("notes")), intro: v.optional(v.string()) },
  handler: async (ctx, { title, noteIds, intro }) => {
    const userId = await requireUser(ctx);
    const notes: Doc<"notes">[] = [];
    for (const nid of noteIds.slice(0, 60)) {
      const n = await ctx.db.get(nid);
      if (n && n.userId === userId) notes.push(n);
    }
    if (!notes.length) throw new ConvexError("Pick at least one note for the map.");
    const areaCount = new Map<string, number>();
    for (const n of notes) if (n.lifeAreaId) areaCount.set(n.lifeAreaId, (areaCount.get(n.lifeAreaId) ?? 0) + 1);
    const topArea = [...areaCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as Id<"lifeAreas"> | undefined;
    const content = [
      intro?.trim() || "A hub for notes that keep showing up together. Group them, then add a line on how they connect.",
      "",
      "## Notes",
      ...notes.map((n) => `- [[${n.title}]]`),
      "",
      "## Open questions",
      "- ",
    ].join("\n");
    return ctx.db.insert("notes", {
      userId,
      title: title.trim() || "Map of Content",
      content,
      noteType: "map",
      noteStatus: "processed",
      lifeAreaId: topArea,
      linkedNoteIds: notes.map((n) => n._id),
    });
  },
});

/** Small seeded PRNG so "random" stays deterministic per seed (queries must be pure). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Review mode (practice testing over your notes): processed notes, title
 * first. Notes marked "hard" and the least recently reviewed come first,
 * shuffled by `seed`.
 */
export const reviewSet = query({
  args: { seed: v.number(), limit: v.optional(v.number()), learningAreaId: v.optional(v.id("learningAreas")) },
  handler: async (ctx, { seed, limit, learningAreaId }) => {
    const userId = await requireUser(ctx);
    const max = Math.max(1, Math.min(50, Math.round(limit ?? 10)));
    let notes = (
      await ctx.db
        .query("notes")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    ).filter(
      (n) =>
        !isInboxNote(n) &&
        n.noteType !== "daily" &&
        n.content.replace(/\s+/g, " ").trim().length >= 40 &&
        n.title.trim().toLowerCase() !== "untitled note",
    );
    if (learningAreaId) notes = notes.filter((n) => n.learningAreaId === learningAreaId);
    notes.sort((a, b) => {
      if (!!a.reviewHard !== !!b.reviewHard) return a.reviewHard ? -1 : 1;
      return (a.lastReviewedAt ?? 0) - (b.lastReviewedAt ?? 0);
    });
    const pool = notes.slice(0, Math.max(max * 3, 30));
    const rand = mulberry32(seed);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return {
      total: notes.length,
      items: pool.slice(0, max).map((n) => ({
        _id: n._id,
        title: n.title,
        content: n.content.slice(0, 6000),
        summary: n.summary,
        noteType: n.noteType,
        tags: n.tags ?? [],
        lastReviewedAt: n.lastReviewedAt,
      })),
    };
  },
});

/** Light self-rating after recalling a note in review mode. */
export const markReviewed = mutation({
  args: { id: v.id("notes"), result: v.union(v.literal("easy"), v.literal("hard")) },
  handler: async (ctx, { id, result }) => {
    const userId = await requireUser(ctx);
    const note = await ctx.db.get(id);
    if (!note || note.userId !== userId) return;
    await ctx.db.patch(id, { lastReviewedAt: Date.now(), reviewHard: result === "hard" });
  },
});

/** Append text to an existing note (used to save AI responses into notes). */
export const append = mutation({
  args: { id: v.id("notes"), content: v.string() },
  handler: async (ctx, { id, content }) => {
    const userId = await requireUser(ctx);
    const note = await ctx.db.get(id);
    if (!note || note.userId !== userId) return;
    const newContent = note.content ? `${note.content}\n\n${content}` : content;
    const linkedNoteIds = await resolveLinks(ctx, userId, newContent, id);
    await ctx.db.patch(id, { content: newContent, linkedNoteIds });
  },
});

export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const note = await ctx.db.get(args.id);
    if (!note || note.userId !== userId) return;
    // Keep recall cards, but drop their link so "Source note" never points at a dead /notes/<id>.
    const cards = await ctx.db
      .query("recallCards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const c of cards) if (c.noteId === args.id) await ctx.db.patch(c._id, { noteId: undefined });
    await ctx.db.delete(args.id);
  },
});
