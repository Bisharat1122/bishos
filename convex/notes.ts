import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";

const attachmentValidator = v.object({
  storageId: v.id("_storage"),
  name: v.string(),
  contentType: v.string(),
  size: v.number(),
});

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
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const note = await ctx.db.get(args.id);
    if (!note || note.userId !== userId) return null;
    return note;
  },
});

/** Outgoing links + incoming backlinks for the interlinking panel. */
export const connections = query({
  args: { id: v.id("notes") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
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
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
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
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) patch[k] = val === null ? undefined : val;
    if (rest.content !== undefined) {
      patch.linkedNoteIds = await resolveLinks(ctx, userId, rest.content, id);
    }
    await ctx.db.patch(id, patch);
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
    await requireUser(ctx);
    await ctx.db.delete(args.id);
  },
});
