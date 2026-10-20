/**
 * Content Studio AI helpers. Every action RETURNS a proposal; nothing is
 * written here. The UI shows the result and the user inserts/accepts it via
 * the normal mutations.
 */
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalQuery, ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { callOpenRouter } from "./openrouter";

const HOOK_TYPES = ["curiosity", "contrarian", "result", "question", "mistake", "myth", "list", "story", "how-to", "before/after"];
const FORMATS = ["short_video", "long_video", "carousel", "text_post", "thread", "newsletter", "article", "podcast", "story"];
const PLATFORMS = ["linkedin", "instagram", "tiktok", "youtube", "youtube_shorts", "x", "facebook", "newsletter", "blog"];

async function authed(ctx: ActionCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Please sign in again.");
  return userId;
}

/** Strip code fences and parse the first {...} or [...] block. */
function parseJson<T>(text: string, kind: "object" | "array"): T {
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "")
    .trim();
  const open = kind === "object" ? "{" : "[";
  const close = kind === "object" ? "}" : "]";
  const start = cleaned.indexOf(open);
  const end = cleaned.lastIndexOf(close);
  if (start === -1 || end <= start) throw new ConvexError("The AI answer wasn't in the expected format. Try again.");
  const slice = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(slice) as T;
  } catch {
    // Common model slips: trailing commas, smart quotes.
    const repaired = slice
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
    try {
      return JSON.parse(repaired) as T;
    } catch {
      throw new ConvexError("The AI answer couldn't be read. Try again.");
    }
  }
}

async function ask(system: string, user: string): Promise<string> {
  try {
    return await callOpenRouter([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/not set/i.test(msg)) throw new ConvexError("AI isn't configured yet (OPENROUTER_API_KEY is missing).");
    if (/429/.test(msg)) throw new ConvexError("The AI is busy right now. Try again in a minute.");
    throw new ConvexError("The AI couldn't answer just now. Try again.");
  }
}

const str = (x: unknown, max = 2000) => (typeof x === "string" ? x.trim().slice(0, max) : "");
const pick = (x: unknown, allowed: string[]) => {
  const s = str(x, 40).toLowerCase().replace(/\s+/g, "_");
  const norm = s.replace(/_/g, "-");
  if (allowed.includes(s)) return s;
  if (allowed.includes(norm)) return norm;
  if (allowed.includes(s.replace(/-/g, "_"))) return s.replace(/-/g, "_");
  return "";
};

// ─────────────────────────────────────────────────────────────────────────
// Context (owner-checked reads)
// ─────────────────────────────────────────────────────────────────────────

export const brandContext = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const [pillars, profile] = await Promise.all([
      ctx.db.query("contentPillars").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).first(),
    ]);
    const who = profile
      ? [profile.name && `Name: ${profile.name}`, profile.occupation && `Role: ${profile.occupation}`, profile.business && `Company: ${profile.business}`]
          .filter(Boolean)
          .join(". ")
      : "";
    const pl = pillars.map((p) => `- ${p.name} (${p.brand})${p.description ? `: ${p.description}` : ""}`).join("\n");
    return `${who ? `${who}.\n` : ""}A startup co-founder building a personal brand and company content with very little time.${pl ? `\nContent pillars:\n${pl}` : ""}`;
  },
});

export const pieceForAi = internalQuery({
  args: { userId: v.id("users"), id: v.id("contentPieces") },
  handler: async (ctx, { userId, id }) => {
    const p = await ctx.db.get(id);
    if (!p || p.userId !== userId) return null;
    const pillar = p.pillarId ? await ctx.db.get(p.pillarId) : null;
    const note = p.sourceNoteId ? await ctx.db.get(p.sourceNoteId) : null;
    return {
      title: p.title,
      brand: p.brand,
      format: p.format,
      platforms: p.platforms ?? [],
      hook: p.hook ?? "",
      hookType: p.hookType ?? "",
      brief: p.brief ?? "",
      script: p.script ?? "",
      cta: p.cta ?? "",
      pillar: pillar?.name ?? "",
      noteTitle: note && note.userId === userId ? note.title : "",
      noteContent: note && note.userId === userId ? note.content : "",
    };
  },
});

export const noteForAi = internalQuery({
  args: { userId: v.id("users"), id: v.id("notes") },
  handler: async (ctx, { userId, id }) => {
    const n = await ctx.db.get(id);
    if (!n || n.userId !== userId) return null;
    return { title: n.title, content: n.content };
  },
});

async function loadPiece(ctx: ActionCtx, userId: Id<"users">, id: Id<"contentPieces">) {
  const p = await ctx.runQuery(internal.aiContent.pieceForAi, { userId, id });
  if (!p) throw new ConvexError("Piece not found.");
  return p;
}

// ─────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────

export type SwipeBricks = {
  topic: string;
  angle: string;
  hookStructure: string;
  storyStructure: string;
  visualFormat: string;
  keyVisuals: string;
  audio: string;
};

export type SwipeAnalysis = {
  title: string;
  hookText: string;
  hookVisual: string;
  hookSpoken: string;
  hookOnScreen: string;
  hookType: string;
  format: string;
  structure: string;
  whyItWorked: string;
  whatToSteal: string;
  /** Kallaway's 7 LEGO bricks (empty strings when the AI can't tell). */
  bricks: SwipeBricks;
  /** One of the 6 hook archetypes, or "". */
  archetype: string;
};

const ARCHETYPES = ["fortune_teller", "experimenter", "teacher", "magician", "investigator", "contrarian"];

/** Break a saved post/video down from its pasted transcript or caption. */
export const analyseSwipe = action({
  args: {
    transcript: v.string(),
    url: v.optional(v.string()),
    platform: v.optional(v.string()),
    creator: v.optional(v.string()),
  },
  handler: async (ctx, a): Promise<SwipeAnalysis> => {
    await authed(ctx);
    const text = a.transcript.trim();
    if (text.length < 15) throw new ConvexError("Paste a bit more of the transcript or caption first.");
    const out = await ask(
      `You are a short-form content strategist who reverse-engineers why posts work. Reply with ONE JSON object only, no prose, no code fences.`,
      `Break down this ${a.platform || "social"} post${a.creator ? ` by ${a.creator}` : ""}${a.url ? ` (${a.url})` : ""}.

Return exactly these keys (strings):
{"title": short label for this post (max 8 words),
 "hookText": the hook as one line (the first sentence or the core promise),
 "hookVisual": what is likely SEEN in the first frame (or "" if text-only),
 "hookSpoken": the first spoken sentence (or "" if text-only),
 "hookOnScreen": the on-screen text / first line a silent viewer reads,
 "hookType": one of ${HOOK_TYPES.join(", ")},
 "format": one of ${FORMATS.join(", ")},
 "structure": the beat structure as a short arrow chain, e.g. "Hook → Problem → 3 tips → CTA",
 "whyItWorked": ONE sentence on the psychological reason it worked,
 "whatToSteal": ONE sentence on the transferable element a founder could reuse,
 "archetype": the hook archetype, one of ${ARCHETYPES.join(", ")} (fortune_teller = present vs future, experimenter = "I tried a new way", teacher = lesson learned, magician = visual/verbal stun gun, investigator = a secret they don't know, contrarian = opposite of conventional wisdom),
 "bricks": the 7 LEGO bricks of this idea, each a short phrase (or "" if unknown):
   {"topic": one sentence on what it's about,
    "angle": premise + the creator's take + key facts,
    "hookStructure": the hook as a reusable fill-in-the-blank pattern (spoken + text + visual),
    "storyStructure": breakdown | newscaster | case study | listicle | problem-solver | tutorial | personal narrative (+ the beats),
    "visualFormat": the on-screen layout (green screen, split screen, talking head, POV vlog, in-the-world, faceless text…),
    "keyVisuals": the A-roll, B-roll and graphics used,
    "audio": music + sound effects (or "" if unknown)}}

Transcript / caption:
"""${text.slice(0, 12000)}"""`,
    );
    const j = parseJson<Record<string, unknown>>(out, "object");
    const b = (j.bricks && typeof j.bricks === "object" ? j.bricks : {}) as Record<string, unknown>;
    return {
      archetype: pick(j.archetype, ARCHETYPES),
      bricks: {
        topic: str(b.topic, 400),
        angle: str(b.angle, 600),
        hookStructure: str(b.hookStructure, 400),
        storyStructure: str(b.storyStructure, 400),
        visualFormat: str(b.visualFormat, 300),
        keyVisuals: str(b.keyVisuals, 400),
        audio: str(b.audio, 300),
      },
      title: str(j.title, 120),
      hookText: str(j.hookText, 400),
      hookVisual: str(j.hookVisual, 400),
      hookSpoken: str(j.hookSpoken, 400),
      hookOnScreen: str(j.hookOnScreen, 400),
      hookType: pick(j.hookType, HOOK_TYPES),
      format: pick(j.format, FORMATS),
      structure: str(j.structure, 600),
      whyItWorked: str(j.whyItWorked, 600),
      whatToSteal: str(j.whatToSteal, 600),
    };
  },
});

/** 10 hook variations for a piece (or a free topic). */
export const hookVariations = action({
  args: {
    pieceId: v.optional(v.id("contentPieces")),
    topic: v.optional(v.string()),
    hook: v.optional(v.string()),
    hookType: v.optional(v.string()),
  },
  handler: async (ctx, a): Promise<{ text: string; hookType: string }[]> => {
    const userId = await authed(ctx);
    const brand = await ctx.runQuery(internal.aiContent.brandContext, { userId });
    const p = a.pieceId ? await loadPiece(ctx, userId, a.pieceId) : null;
    const topic = a.topic?.trim() || p?.title || "";
    if (!topic && !a.hook?.trim()) throw new ConvexError("Give it a topic or a working hook first.");
    const out = await ask(
      `You write scroll-stopping hooks for a founder. Plain words, specific, no clickbait, no emojis, no hashtags. Reply with a JSON array only.`,
      `About the creator: ${brand}

Piece: ${topic}
${p ? `Brand: ${p.brand}. Format: ${p.format}. Pillar: ${p.pillar || "—"}.\n` : ""}${a.hook || p?.hook ? `Current hook: ${a.hook || p?.hook}\n` : ""}${p?.brief ? `Brief: ${p.brief.slice(0, 1500)}\n` : ""}${p?.script ? `Script excerpt: ${p.script.slice(0, 2500)}\n` : ""}
Write 10 hook variations that work in the first 2 seconds / first line. Mix types${a.hookType ? `, but lean towards "${a.hookType}"` : ""}.
Return: [{"text": "...", "hookType": one of ${HOOK_TYPES.join(", ")}}, ...]`,
    );
    const arr = parseJson<unknown[]>(out, "array");
    return arr
      .map((x) => {
        if (typeof x === "string") return { text: x.trim(), hookType: "" };
        const o = (x ?? {}) as Record<string, unknown>;
        return { text: str(o.text, 300), hookType: pick(o.hookType, HOOK_TYPES) };
      })
      .filter((h) => h.text.length > 3)
      .slice(0, 10);
  },
});

/** Draft 5–10 repurposed posts from a hub script. */
export const repurposeDrafts = action({
  args: { pieceId: v.id("contentPieces"), script: v.optional(v.string()), count: v.optional(v.number()) },
  handler: async (ctx, a): Promise<{ format: string; platform: string; title: string; body: string }[]> => {
    const userId = await authed(ctx);
    const p = await loadPiece(ctx, userId, a.pieceId);
    const brand = await ctx.runQuery(internal.aiContent.brandContext, { userId });
    const source = (a.script ?? p.script).trim() || p.brief.trim();
    if (source.length < 40) throw new ConvexError("Write (or paste) the hub script first. The drafts are cut from it.");
    const n = Math.max(5, Math.min(10, Math.round(a.count ?? 7)));
    const out = await ask(
      `You repurpose one long "hub" piece into platform-native short posts (hub-and-spoke). Each post carries ONE idea, opens with a strong hook, and ends with a light CTA. Plain founder voice, no emojis spam, no hashtags walls. Reply with a JSON array only.`,
      `About the creator: ${brand}

Hub: "${p.title}" (${p.brand} brand, ${p.format}). ${p.cta ? `Main CTA: ${p.cta}.` : ""}
Hub script:
"""${source.slice(0, 14000)}"""

Draft ${n} posts mixing: short video scripts (hook + 3 beats + CTA, ~45s), LinkedIn/X text posts, one carousel (slide-by-slide), one X thread.
Return: [{"format": one of ${FORMATS.join(", ")}, "platform": one of ${PLATFORMS.join(", ")}, "title": working title (max 8 words), "body": the full draft}]`,
    );
    const arr = parseJson<unknown[]>(out, "array");
    return arr
      .map((x) => {
        const o = (x ?? {}) as Record<string, unknown>;
        return {
          format: pick(o.format, FORMATS) || "text_post",
          platform: pick(o.platform, PLATFORMS),
          title: str(o.title, 140) || "Repurposed post",
          body: str(o.body, 6000),
        };
      })
      .filter((d) => d.body.length > 10)
      .slice(0, 10);
  },
});

/** Tighten a script: cut filler, sharpen the hook, keep the voice. */
export const tightenScript = action({
  args: { script: v.string(), format: v.optional(v.string()), pieceId: v.optional(v.id("contentPieces")) },
  handler: async (ctx, a): Promise<string> => {
    const userId = await authed(ctx);
    const script = a.script.trim();
    if (script.length < 30) throw new ConvexError("There isn't enough script to tighten yet.");
    const p = a.pieceId ? await loadPiece(ctx, userId, a.pieceId) : null;
    const out = await ask(
      `You are a sharp script editor. Keep the author's voice and structure. Cut filler, hedges and repetition, sharpen the first line, one idea only, end with a clear CTA. Return ONLY the edited script as plain text/markdown, no commentary.`,
      `Format: ${a.format || p?.format || "short video"}.${p?.cta ? ` CTA to keep: ${p.cta}.` : ""}
Tighten this script (aim for ~20–30% shorter without losing substance):

${script.slice(0, 16000)}`,
    );
    return out
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/^```[a-z]*\n?|```$/gim, "")
      .trim();
  },
});

/** Feynman / simple-explanation draft from an idea note (or the piece's source note). */
export const feynman = action({
  args: { noteId: v.optional(v.id("notes")), pieceId: v.optional(v.id("contentPieces")), text: v.optional(v.string()) },
  handler: async (ctx, a): Promise<{ explanation: string; jargon: string[]; posts: { angle: string; text: string }[] }> => {
    const userId = await authed(ctx);
    let title = "";
    let body = a.text?.trim() ?? "";
    if (a.noteId) {
      const n = await ctx.runQuery(internal.aiContent.noteForAi, { userId, id: a.noteId });
      if (!n) throw new ConvexError("Note not found.");
      title = n.title;
      body = n.content;
    } else if (a.pieceId) {
      const p = await loadPiece(ctx, userId, a.pieceId);
      title = p.noteTitle || p.title;
      body = p.noteContent || [p.brief, p.script].filter(Boolean).join("\n\n");
    }
    if (body.trim().length < 20) throw new ConvexError("There's not enough in the note to explain yet.");
    const out = await ask(
      `You turn learning notes into simple public explanations (Feynman technique, "learn in public"). Reply with ONE JSON object only.`,
      `Note: ${title}
"""${body.slice(0, 12000)}"""

Return:
{"explanation": a plain explanation a 12-year-old could follow (120–200 words, no jargon),
 "jargon": [terms from the note that need defining or that the author may not fully understand yet],
 "posts": [{"angle": "TIL" | "mistake" | "myth-bust", "text": a short post (60–120 words) with a strong first line}] (exactly 3)}`,
    );
    const j = parseJson<Record<string, unknown>>(out, "object");
    const posts = Array.isArray(j.posts) ? j.posts : [];
    return {
      explanation: str(j.explanation, 3000),
      jargon: (Array.isArray(j.jargon) ? j.jargon : []).map((x) => str(x, 80)).filter(Boolean).slice(0, 12),
      posts: posts
        .map((x) => {
          const o = (x ?? {}) as Record<string, unknown>;
          return { angle: str(o.angle, 30) || "post", text: str(o.text, 2000) };
        })
        .filter((x) => x.text)
        .slice(0, 3),
    };
  },
});
