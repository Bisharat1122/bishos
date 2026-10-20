import { v, ConvexError } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { callOpenRouter } from "./openrouter";

/** Pull the first JSON object/array out of a model reply. */
export function parseJson<T>(text: string): T | null {
  const clean = text.replace(/```(?:json)?/gi, "").trim();
  const start = clean.search(/[[{]/);
  if (start < 0) return null;
  const open = clean[start];
  const close = open === "[" ? "]" : "}";
  const end = clean.lastIndexOf(close);
  if (end <= start) return null;
  try {
    return JSON.parse(clean.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export type DumpItem = {
  type: "task" | "note" | "commitment" | "idea" | "person" | "resource";
  title: string;
  area?: string;
  plannedFor?: string | null;
  priority?: "low" | "med" | "high";
  direction?: "i_owe" | "owed_to_me";
  person?: string;
  brand?: "personal" | "company";
};

/**
 * Voice/typed brain-dump → structured items in a REVIEW TRAY (nothing is saved
 * here). Following Todoist Ramble: pass the real area list, don't over-interpret.
 */
export const brainDump = action({
  args: { text: v.string(), areas: v.array(v.string()), today: v.string() },
  handler: async (ctx, { text, areas, today }): Promise<DumpItem[]> => {
    if ((await getAuthUserId(ctx)) === null) throw new ConvexError("Not authenticated");
    const reply = await callOpenRouter([
      {
        role: "system",
        content:
          "You turn a founder's messy brain-dump into separate, clean items. Never invent items that aren't in the text. Keep his wording short. Output STRICT JSON only: an array of objects.",
      },
      {
        role: "user",
        content: `Today is ${today}. My life areas: ${areas.join(", ") || "none"}.
Split this brain-dump into items. Each item: {"type": "task"|"note"|"commitment"|"idea"|"person"|"resource", "title": short, "area": one of my areas or null, "plannedFor": "YYYY-MM-DD" only if a day is clearly mentioned else null, "priority": "low"|"med"|"high", "direction": "i_owe"|"owed_to_me" (commitments only), "person": name if mentioned, "brand": "personal"|"company" (content ideas only)}.
Rules: a promise to someone = commitment i_owe; waiting on someone = commitment owed_to_me; a content/post/video idea = idea; a book/course/link to study = resource; someone to remember = person; a thought to keep = note; otherwise task.

Brain-dump:
"""${text.slice(0, 6000)}"""`,
      },
    ]);
    const items = parseJson<DumpItem[]>(reply);
    if (!Array.isArray(items)) throw new ConvexError("The AI reply couldn't be read. Try again or capture as plain inbox items.");
    return items
      .filter((i) => i && typeof i.title === "string" && i.title.trim())
      .slice(0, 40)
      .map((i) => ({
        ...i,
        title: i.title.trim().slice(0, 200),
        // The model sometimes drifts ("medium", "owe", "Tomorrow") — keep only values
        // the inbox.to* validators accept, so saving the reviewed rows never throws.
        priority: i.priority && ["low", "med", "high"].includes(i.priority) ? i.priority : undefined,
        direction: i.direction && ["i_owe", "owed_to_me"].includes(i.direction) ? i.direction : undefined,
        brand: i.brand && ["personal", "company"].includes(i.brand) ? i.brand : undefined,
        plannedFor: typeof i.plannedFor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(i.plannedFor) ? i.plannedFor : null,
      }));
  },
});

export const setSuggestions = internalMutation({
  args: { userId: v.id("users"), items: v.array(v.object({ id: v.id("inbox"), suggestion: v.any() })) },
  handler: async (ctx, { userId, items }) => {
    for (const it of items) {
      const doc = await ctx.db.get(it.id);
      if (doc && doc.userId === userId) await ctx.db.patch(it.id, { suggestion: it.suggestion });
    }
  },
});

/** Suggest a destination for each open inbox item (one-tap chips in the UI). */
export const sortInbox = action({
  args: { items: v.array(v.object({ id: v.id("inbox"), text: v.string() })), areas: v.array(v.string()) },
  handler: async (ctx, { items, areas }): Promise<number> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Not authenticated");
    if (!items.length) return 0;
    const reply = await callOpenRouter([
      {
        role: "system",
        content: "You file inbox items for a startup founder. Output STRICT JSON only.",
      },
      {
        role: "user",
        content: `Life areas: ${areas.join(", ")}.
For each item return {"i": index, "type": "task"|"note"|"commitment"|"idea"|"person"|"resource"|"trash", "title": clean short title, "area": one of the areas or null, "twoMinute": true if it takes under 2 minutes}.
Return a JSON array.
Items:
${items.map((it, i) => `${i}. ${it.text.slice(0, 400)}`).join("\n")}`,
      },
    ]);
    const parsed = parseJson<{ i: number; type: string; title: string; area?: string; twoMinute?: boolean }[]>(reply);
    if (!Array.isArray(parsed)) throw new ConvexError("The AI reply couldn't be read. Try again.");
    const out = parsed
      .filter((p) => typeof p.i === "number" && items[p.i])
      .map((p) => ({ id: items[p.i].id, suggestion: { type: p.type, title: p.title, area: p.area ?? null, twoMinute: !!p.twoMinute } }));
    await ctx.runMutation(internal.aiCapture.setSuggestions, { userId, items: out });
    return out.length;
  },
});
