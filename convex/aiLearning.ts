/**
 * AI helpers for the Mind module. Every action RETURNS PROPOSALS only — the
 * UI shows them with checkboxes and applies the approved ones through normal
 * mutations (recall.createMany, learning.addSkills, learning.makePublic).
 */
import { v, ConvexError } from "convex/values";
import { action, ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { callOpenRouter } from "./openrouter";

async function requireActionUser(ctx: ActionCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new ConvexError("Not authenticated");
  return userId;
}

/** Pull the first JSON value out of a model reply (handles ``` fences and chatter). */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [fenced?.[1], text];
  for (const c of candidates) {
    if (!c) continue;
    const start = c.search(/[[{]/);
    if (start < 0) continue;
    const open = c[start];
    const close = open === "[" ? "]" : "}";
    const end = c.lastIndexOf(close);
    if (end <= start) continue;
    try {
      return JSON.parse(c.slice(start, end + 1));
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

const str = (x: unknown, max = 600) => (typeof x === "string" ? x.trim().slice(0, max) : "");

type CardProposal = { front: string; back: string };

function parseCards(text: string): CardProposal[] {
  const json = extractJson(text);
  const arr = Array.isArray(json) ? json : Array.isArray((json as { cards?: unknown[] } | null)?.cards) ? (json as { cards: unknown[] }).cards : null;
  let cards: CardProposal[] = [];
  if (arr) {
    cards = arr
      .map((c) => {
        const o = (c ?? {}) as Record<string, unknown>;
        return { front: str(o.front ?? o.question ?? o.q, 400), back: str(o.back ?? o.answer ?? o.a, 800) };
      })
      .filter((c) => c.front && c.back);
  }
  if (!cards.length) {
    // Fallback: "Q: … / A: …" pairs.
    const re = /Q[:.)]\s*([\s\S]+?)\n\s*A[:.)]\s*([\s\S]+?)(?=\n\s*Q[:.)]|$)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) cards.push({ front: m[1].trim().slice(0, 400), back: m[2].trim().slice(0, 800) });
  }
  const seen = new Set<string>();
  return cards.filter((c) => {
    const k = c.front.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Propose 3–6 recall cards (question → answer) from a note, a resource's
 * takeaways, or raw text. Nothing is saved here.
 */
export const generateCards = action({
  args: {
    noteId: v.optional(v.id("notes")),
    resourceId: v.optional(v.id("resources")),
    text: v.optional(v.string()),
    title: v.optional(v.string()),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<CardProposal[]> => {
    await requireActionUser(ctx);
    let title = args.title ?? "";
    let body = args.text ?? "";
    if (args.noteId) {
      const n = await ctx.runQuery(api.notes.get, { id: args.noteId });
      if (!n) throw new ConvexError("Note not found.");
      title = n.title;
      body = [n.summary ? `Summary: ${n.summary}` : "", n.content].filter(Boolean).join("\n\n");
    } else if (args.resourceId) {
      const r = await ctx.runQuery(api.resources.get, { id: args.resourceId });
      if (!r) throw new ConvexError("Resource not found.");
      title = r.title;
      body = [args.text ?? r.takeaways ?? "", r.whySaved ? `(Why I saved it: ${r.whySaved})` : ""].filter(Boolean).join("\n\n");
    }
    if (body.replace(/\s+/g, "").length < 20) throw new ConvexError("There isn't enough text to make cards from yet. Write a few lines first.");
    const n = Math.max(3, Math.min(6, Math.round(args.count ?? 5)));
    const reply = await callOpenRouter([
      {
        role: "system",
        content:
          "You write excellent spaced-repetition cards for a busy startup founder. Rules: one fact or idea per card (minimum information principle); questions must be answerable from memory without the source; prefer 'why/how' and application questions over trivia; answers short (1–2 sentences); use the note's own terms; no yes/no questions; never invent facts that aren't in the text.",
      },
      {
        role: "user",
        content: `Create exactly ${n} recall cards from this ${args.resourceId ? "resource's takeaways" : "note"}.\nReturn ONLY a JSON array like [{"front":"question","back":"answer"}] with no commentary.\n\nTitle: ${title}\n\n${body.slice(0, 16000)}`,
      },
    ]);
    const cards = parseCards(reply).slice(0, n);
    if (!cards.length) throw new ConvexError("The AI reply couldn't be read. Try again.");
    return cards;
  },
});

export type FeynmanDraft = {
  explanation: string;
  jargon: string[];
  hook: string;
  posts: { angle: string; text: string }[];
};

/**
 * Learn in public: a Feynman-style simple explanation of a note, the jargon
 * it still leans on (candidate gaps), a hook, and 3 short post variants
 * (TIL / mistake / myth-bust). Returned for the user to accept or edit.
 */
export const feynmanDraft = action({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }): Promise<FeynmanDraft> => {
    await requireActionUser(ctx);
    const note = await ctx.runQuery(api.notes.get, { id: noteId });
    if (!note) throw new ConvexError("Note not found.");
    if (note.content.replace(/\s+/g, "").length < 20) throw new ConvexError("Write a few lines in the note first.");
    const reply = await callOpenRouter([
      {
        role: "system",
        content:
          "You help a startup founder learn in public. Use the Feynman technique: explain simply, as if to a smart 12-year-old, with one concrete example. Flag any jargon the explanation can't do without — those are learning gaps. Write in first person, plain words, no hashtags, no emojis, no hype.",
      },
      {
        role: "user",
        content: `Turn this note into learn-in-public material. Return ONLY JSON:\n{"explanation":"≤150 words","jargon":["term", "..."],"hook":"one scroll-stopping first line","posts":[{"angle":"TIL","text":"≤80 words"},{"angle":"Mistake I made","text":"..."},{"angle":"Myth-bust","text":"..."}]}\n\nTitle: ${note.title}\n\n${note.content.slice(0, 12000)}`,
      },
    ]);
    const json = (extractJson(reply) ?? {}) as Record<string, unknown>;
    const explanation = str(json.explanation, 2000) || (json && Object.keys(json).length ? "" : reply.trim().slice(0, 2000));
    const jargon = Array.isArray(json.jargon) ? json.jargon.map((j) => str(j, 80)).filter(Boolean).slice(0, 8) : [];
    const posts = Array.isArray(json.posts)
      ? json.posts
          .map((p) => {
            const o = (p ?? {}) as Record<string, unknown>;
            return { angle: str(o.angle, 40) || "Post", text: str(o.text, 1200) };
          })
          .filter((p) => p.text)
          .slice(0, 4)
      : [];
    if (!explanation && !posts.length) throw new ConvexError("The AI reply couldn't be read. Try again.");
    return { explanation, jargon, hook: str(json.hook, 200), posts };
  },
});

export type SkillProposal = { title: string; children: string[] };

/**
 * Ultralearning "map the subject first": propose a skill tree (4–7 top-level
 * skills with 2–5 sub-skills) for a learning area, skipping skills it already has.
 */
export const suggestSkillMap = action({
  args: { learningAreaId: v.id("learningAreas") },
  handler: async (ctx, { learningAreaId }): Promise<SkillProposal[]> => {
    await requireActionUser(ctx);
    const area = await ctx.runQuery(api.learning.areaBrief, { id: learningAreaId });
    if (!area) throw new ConvexError("Learning area not found.");
    const reply = await callOpenRouter([
      {
        role: "system",
        content:
          "You design practical skill trees for a time-poor startup founder (Ultralearning: directness, drill the weakest point). Skills are things you can DO and practise, not book chapters. Keep titles short (2–6 words).",
      },
      {
        role: "user",
        content: `Learning area: ${area.name}\nTarget performance: ${area.targetPerformance ?? "(not set)"}\nWhy: ${area.why ?? "(not set)"}\nMap notes: ${(area.map ?? "").slice(0, 3000)}\nKnown gaps: ${area.gaps.join("; ") || "none"}\nSkills already in the tree (don't repeat): ${area.skills.join("; ") || "none"}\n\nPropose 4–7 top-level skills, each with 2–5 sub-skills, ordered from foundation to advanced. Return ONLY JSON: [{"title":"skill","children":["sub-skill","..."]}]`,
      },
    ]);
    const json = extractJson(reply);
    const arr = Array.isArray(json) ? json : Array.isArray((json as { skills?: unknown[] } | null)?.skills) ? (json as { skills: unknown[] }).skills : [];
    const existing = new Set(area.skills.map((s: string) => s.toLowerCase()));
    const out = arr
      .map((s) => {
        const o = (s ?? {}) as Record<string, unknown>;
        return {
          title: str(o.title ?? o.name, 120),
          children: Array.isArray(o.children) ? o.children.map((c) => str(typeof c === "string" ? c : (c as { title?: string })?.title, 120)).filter(Boolean).slice(0, 6) : [],
        };
      })
      .filter((s) => s.title && !existing.has(s.title.toLowerCase()))
      .slice(0, 8);
    if (!out.length) throw new ConvexError("The AI reply couldn't be read. Try again.");
    return out;
  },
});
