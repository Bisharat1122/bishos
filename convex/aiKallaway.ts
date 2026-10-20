/**
 * Kallaway workflow AI helpers (per content piece). Every action RETURNS a
 * proposal; nothing is written to the database here. The workflow panel shows
 * the result and the user taps to insert it (saved through contentSystem.saveKw).
 *
 * Framework rules are paraphrased from Kane Kallaway's public material
 * (see lib/kallaway.ts and research_notes/Kallaway content system/).
 */
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action, ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { callOpenRouter } from "./openrouter";

async function authed(ctx: ActionCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Please sign in again.");
  return userId;
}

/** Strip think tags / code fences and parse the first {...} or [...] block. */
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

const str = (x: unknown, max = 2000) => (typeof x === "string" ? x.trim().slice(0, max) : typeof x === "number" ? String(x) : "");
const num = (x: unknown, min: number, max: number, fallback: number) => {
  const n = typeof x === "number" ? x : typeof x === "string" ? Number(x.replace(/[^\d.-]/g, "")) : NaN;
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback;
};
const asObj = (x: unknown) => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
const asArr = (x: unknown) => (Array.isArray(x) ? x : []);

const JSON_ONLY = "Reply with ONE JSON value only: no prose before or after, no code fences, no comments.";

async function creator(ctx: ActionCtx, userId: Awaited<ReturnType<typeof authed>>) {
  try {
    return await ctx.runQuery(internal.aiContent.brandContext, { userId });
  } catch {
    return "A startup co-founder making short-form and YouTube content for a personal brand and a company.";
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 1. The same topic written in all 6 hook archetypes
// ─────────────────────────────────────────────────────────────────────────

const ARCHETYPES = [
  { key: "fortune_teller", label: "Fortune Teller", rule: "present vs future: current reality, how the future changes, tease that future" },
  { key: "experimenter", label: "Experimenter", rule: "the base pain, I tried a new method or tool, why it works better" },
  { key: "teacher", label: "Teacher", rule: "the pain, my learnings or method, why the steps work" },
  { key: "magician", label: "Magician", rule: "a visual or verbal stun gun (signature visual, sound or phrase) stacked on another archetype" },
  { key: "investigator", label: "Investigator", rule: "tee up a secret or finding, framed against the viewer not knowing it" },
  { key: "contrarian", label: "Contrarian", rule: "say the opposite of conventional wisdom directly" },
] as const;

export type ArchetypeHook = { archetype: string; label: string; lean: string; interjection: string; snapback: string; textHook: string };

export const archetypeHooks = action({
  args: {
    topic: v.string(),
    audience: v.optional(v.string()),
    keyVisual: v.optional(v.string()),
    contrarianTake: v.optional(v.string()),
    commonBelief: v.optional(v.string()),
  },
  handler: async (ctx, a): Promise<ArchetypeHook[]> => {
    const userId = await authed(ctx);
    const topic = a.topic.trim();
    if (topic.length < 4) throw new ConvexError("Write the topic in one sentence first (step 2).");
    const who = await creator(ctx, userId);
    const out = await ask(
      `You write short-form video hooks with Kane Kallaway's 3-step hook formula. ${JSON_ONLY}

Rules you must follow:
- A hook has three lines that build a curiosity loop, each line making the viewer need the next one.
  1. "lean": the context lean-in. State the topic in the first sentence so the viewer instantly knows who/what it's about, and lean them toward the COMMON belief (common ground, a benefit or pain, a metaphor, or a mind-blowing fact). Lead with the viewer's benefit or pain.
  2. "interjection": the scroll-stop interjection. One short line that usually starts with a contrast word (But / However / Yet / Turns out) and sets up the flip.
  3. "snapback": the contrarian snapback. Still on topic, but the opposite of where line 1 leaned. Leaning to +100 then flipping to -100 makes a 200-point arc; the bigger the honest surprise, the stronger the snap. It must be true and pay off, never bait-and-switch.
- Plain words (about a 6th-grade level), active voice, "you/your" over "I/me" unless it is a personal story, no fluff openers ("this is crazy"), no emojis, no hashtags.
- Each line is ideally under 14 words. Total spoken hook under ~5 seconds.
- "textHook": 3 to 5 words of on-screen title text. No punctuation, no connector words (and, or, that, but, so). Repeat the subject word plus a pain reminder, a dream-outcome tease or a future change. It must say the same thing as the spoken hook and the visual.
- The visual, spoken and text hooks must align.`,
      `About the creator: ${who}

Topic: ${topic}
${a.audience?.trim() ? `Audience (one ideal viewer): ${a.audience.trim()}\n` : ""}${a.commonBelief?.trim() ? `Common belief: ${a.commonBelief.trim()}\n` : ""}${a.contrarianTake?.trim() ? `The creator's contrarian take: ${a.contrarianTake.trim()}\n` : ""}${a.keyVisual?.trim() ? `Key visual in the first 2 seconds: ${a.keyVisual.trim()}\n` : ""}
Write this same topic in each of the 6 hook archetypes:
${ARCHETYPES.map((x) => `- ${x.key} (${x.label}): ${x.rule}`).join("\n")}

Return exactly:
[{"archetype": one of ${ARCHETYPES.map((x) => `"${x.key}"`).join(", ")}, "lean": "...", "interjection": "...", "snapback": "...", "textHook": "..."}, ... 6 items, one per archetype]`,
    );
    const arr = asArr(parseJson<unknown>(out, "array"));
    const byKey = new Map<string, ArchetypeHook>();
    arr.forEach((x, i) => {
      const o = asObj(x);
      const raw = str(o.archetype, 40).toLowerCase().replace(/[\s-]+/g, "_");
      const arch = ARCHETYPES.find((k) => k.key === raw || k.label.toLowerCase().replace(/\s+/g, "_") === raw) ?? ARCHETYPES[i];
      if (!arch || byKey.has(arch.key)) return;
      const hook: ArchetypeHook = {
        archetype: arch.key,
        label: arch.label,
        lean: str(o.lean, 300),
        interjection: str(o.interjection, 300),
        snapback: str(o.snapback, 300),
        textHook: str(o.textHook, 80).replace(/[.,!?;:]+$/g, ""),
      };
      if (hook.lean || hook.snapback) byKey.set(arch.key, hook);
    });
    const list = ARCHETYPES.map((k) => byKey.get(k.key)).filter((h): h is ArchetypeHook => !!h);
    if (!list.length) throw new ConvexError("The AI didn't return usable hooks. Try again.");
    return list;
  },
});

// ─────────────────────────────────────────────────────────────────────────
// 2. Hook audit
// ─────────────────────────────────────────────────────────────────────────

const AUDIT_KEYS = ["alignment", "speed", "clarity", "curiosity", "stakes", "relevance", "absorption"] as const;
const FAILURES = ["delay", "confusion", "irrelevance", "disinterest"] as const;

export type HookAudit = {
  scores: Record<(typeof AUDIT_KEYS)[number], number>;
  notes: Partial<Record<(typeof AUDIT_KEYS)[number], string>>;
  failures: { mode: (typeof FAILURES)[number]; why: string }[];
  rewrite: { lean: string; interjection: string; snapback: string; textHook: string; full: string };
  verdict: string;
};

export const auditHook = action({
  args: { spoken: v.string(), textHook: v.optional(v.string()), visual: v.optional(v.string()), topic: v.optional(v.string()) },
  handler: async (ctx, a): Promise<HookAudit> => {
    await authed(ctx);
    const spoken = a.spoken.trim();
    if (spoken.length < 8) throw new ConvexError("Write the spoken hook first (the 3-step builder or the piece's hook).");
    const out = await ask(
      `You are a strict short-form hook auditor using Kane Kallaway's checklists. ${JSON_ONLY}

Score each criterion 0-10 (10 = perfect):
- alignment: the visual, spoken and text hooks all say the same thing; each predicts the others. If no visual or text hook is given, judge whether the spoken hook would be easy to align and say so in the note.
- speed: speed to value. The topic is clear within 1-2 seconds and the first value lands in about 4 seconds. Fluff openers score low.
- clarity: one subject and one question; the line can only mean one thing; no wordplay.
- curiosity: am I curious enough to hear sentence two? Built on contrast (common belief, then the flip).
- stakes: why should they care: a desired outcome (education) or a curiosity scenario (entertainment).
- relevance: "you/your" rather than "I/me", framed as need-to-have for the target viewer, not nice-to-have.
- absorption: 100% comprehension: about 6th-grade words, active voice, fluff cut but clarity kept.

Name the failure modes actually present (only those that apply):
- "delay": the topic arrives late.
- "confusion": comprehension loss (too many words, passive voice, ambiguous meaning, dropped mid-story without context).
- "irrelevance": not about the viewer's problem.
- "disinterest": no contrast, so no curiosity loop.

Then write ONE improved rewrite using the 3-step formula (context lean-in, a scroll-stop interjection usually starting with "But", a contrarian snapback that stays true and pays off) plus a 3-5 word text hook (no punctuation, no connector words).`,
      `${a.topic?.trim() ? `Topic: ${a.topic.trim()}\n` : ""}Spoken hook: """${spoken.slice(0, 1200)}"""
Text hook (on-screen title): ${a.textHook?.trim() ? `"${a.textHook.trim()}"` : "(none given)"}
Visual hook (first 2 seconds): ${a.visual?.trim() ? `"${a.visual.trim()}"` : "(none given)"}

Return exactly:
{"scores": {${AUDIT_KEYS.map((k) => `"${k}": 0-10`).join(", ")}},
 "notes": {${AUDIT_KEYS.map((k) => `"${k}": "one short reason"`).join(", ")}},
 "failures": [{"mode": one of ${FAILURES.map((f) => `"${f}"`).join(", ")}, "why": "one sentence"}],
 "verdict": "one sentence overall",
 "rewrite": {"lean": "...", "interjection": "...", "snapback": "...", "textHook": "..."}}`,
    );
    const j = asObj(parseJson<unknown>(out, "object"));
    const s = asObj(j.scores);
    const n = asObj(j.notes);
    const scores = {} as HookAudit["scores"];
    const notes: HookAudit["notes"] = {};
    for (const k of AUDIT_KEYS) {
      scores[k] = num(s[k], 0, 10, 0);
      const note = str(n[k], 240);
      if (note) notes[k] = note;
    }
    const failures = asArr(j.failures)
      .map((x) => {
        const o = asObj(x);
        const mode = str(o.mode, 30).toLowerCase() as (typeof FAILURES)[number];
        return FAILURES.includes(mode) ? { mode, why: str(o.why, 300) } : null;
      })
      .filter((x): x is HookAudit["failures"][number] => !!x)
      .filter((x, i, all) => all.findIndex((y) => y.mode === x.mode) === i);
    const r = asObj(j.rewrite);
    const rewrite = {
      lean: str(r.lean, 300),
      interjection: str(r.interjection, 300),
      snapback: str(r.snapback, 300),
      textHook: str(r.textHook, 80).replace(/[.,!?;:]+$/g, ""),
      full: "",
    };
    rewrite.full = [rewrite.lean, rewrite.interjection, rewrite.snapback].filter(Boolean).join(" ") || str(j.rewrite, 600);
    return { scores, notes, failures, rewrite, verdict: str(j.verdict, 300) };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// 3. Shock-fact candidates
// ─────────────────────────────────────────────────────────────────────────

export type ShockFact = { text: string; score: number; why: string };

export const shockFacts = action({
  args: { topic: v.string(), notes: v.optional(v.string()), commonBelief: v.optional(v.string()) },
  handler: async (ctx, a): Promise<ShockFact[]> => {
    const userId = await authed(ctx);
    const topic = a.topic.trim();
    if (topic.length < 4) throw new ConvexError("Write the topic in one sentence first.");
    const who = await creator(ctx, userId);
    const out = await ask(
      `You are a research assistant applying Kane Kallaway's "Law of Interesting". ${JSON_ONLY}

- Interestingness = shock value = the distance between what the viewer already believes and what you tell them.
- Shock Score 0-100 = out of 100 people in the target audience, how many have NOT heard this or would not have believed it before. Higher = more shocking.
- The sweet spot: things most people don't believe, but CAN believe quickly once they hear the reason. Not random trivia, not unbelievable claims.
- Prefer facts, contrarian takes and non-obvious implications a founder could actually defend with a source or their own experience. For education/business audiences, favour facts that are non-obvious AND tactically useful.
- Never invent precise statistics you are unsure of. If a number is approximate, say "about". The creator will verify everything before using it.`,
      `About the creator: ${who}

Topic: ${topic}
${a.commonBelief?.trim() ? `The common belief to push against: ${a.commonBelief.trim()}\n` : ""}${a.notes?.trim() ? `Notes / research so far:\n"""${a.notes.trim().slice(0, 6000)}"""\n` : ""}
Give 8 candidate shock facts or contrarian takes for this topic, each one sentence the creator could say on camera.
Return exactly: [{"text": "...", "score": 0-100, "why": "one line on why it's shocking but believable"}, ... 8 items]`,
    );
    const arr = asArr(parseJson<unknown>(out, "array"));
    const list = arr
      .map((x) => {
        const o = asObj(x);
        return { text: str(typeof x === "string" ? x : o.text, 400), score: num(o.score, 0, 100, 50), why: str(o.why, 300) };
      })
      .filter((f) => f.text.length > 8)
      .slice(0, 8)
      .sort((p, q) => q.score - p.score);
    if (!list.length) throw new ConvexError("The AI didn't return usable facts. Try again.");
    return list;
  },
});

// ─────────────────────────────────────────────────────────────────────────
// 4. One-question chain audit
// ─────────────────────────────────────────────────────────────────────────

export type ChainLink = {
  line: string;
  opens: string; // the one question this line opens ("" if none)
  answers: string; // what earlier question it answers ("" if none)
  opensCount: number; // 0, 1 or 2+ questions opened
  answersPrevious: boolean;
  issue?: string;
};

/** Script → spoken lines (one sentence each): drop headings and [placeholders]. */
function scriptLines(script: string): string[] {
  return script
    .replace(/^\s*#+.*$/gm, "\n")
    .replace(/^\s*(?:---|\*\*\*)\s*$/gm, "\n")
    .split(/\n+/)
    .flatMap((l) => l.split(/(?<=[.!?])\s+(?=[A-Z0-9"'“(])/))
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim())
    .filter((l) => l.length > 1 && !/^\[[^\]]*\]$/.test(l));
}

export const questionChain = action({
  args: { script: v.string() },
  handler: async (ctx, a): Promise<{ links: ChainLink[]; loopOpeners: string[]; truncated: boolean; summary: string }> => {
    await authed(ctx);
    const all = scriptLines(a.script);
    if (all.length < 3) throw new ConvexError("Write at least 3 lines of script first. One sentence per line works best.");
    const MAX = 45;
    const lines = all.slice(0, MAX).map((l) => l.slice(0, 400));
    const out = await ask(
      `You audit short-form video scripts with Kane Kallaway's "one-question chain". ${JSON_ONLY}

The rule:
- The first line (usually context) must open EXACTLY ONE clear question in the viewer's head. If you can't name the question, or two questions are about equally strong, that line needs a rewrite.
- Every next line must ANSWER the question the previous line opened, and open exactly one new question. "If you do that all the way down, the story is perfect."
- Viewers constantly guess what comes next; each line either confirms the guess or adds contrast (a zigzag).
- Flag a line when it opens 0 questions (dead air, the viewer can leave), opens 2 or more competing questions (confusion), or doesn't answer the previous line's question (a broken chain).
- The final line may close the last loop without opening a new one: that's fine (payoff). A CTA line is fine too.

Also suggest 3 loop openers (re-hooks) for this script: short phrases that close one loop and open the next, ideally with a contrast word, e.g. "but that's not even the craziest part", "here's the problem", "which is exactly why". Make them specific to this script's content.`,
      `Script lines (numbered):
${lines.map((l, i) => `${i + 1}. ${l}`).join("\n")}

Return exactly:
{"links": [{"i": line number, "opens": "the one question this line opens, phrased as the viewer would think it ('' if none)", "opensCount": 0 | 1 | 2, "answers": "the question from the previous line that this line answers ('' if it doesn't)", "answersPrevious": true | false, "issue": "short fix suggestion, or '' if the line is fine"}, ... one per line],
 "loopOpeners": ["...", "...", "..."],
 "summary": "one sentence on the chain overall"}`,
    );
    const j = asObj(parseJson<unknown>(out, "object"));
    const raw = asArr(j.links).map(asObj);
    const byIndex = new Map<number, Record<string, unknown>>();
    raw.forEach((o, pos) => {
      const i = num(o.i, 1, lines.length, pos + 1);
      if (!byIndex.has(i)) byIndex.set(i, o);
    });
    const links: ChainLink[] = lines.map((line, idx) => {
      const o = byIndex.get(idx + 1) ?? raw[idx] ?? {};
      const opens = str(o.opens, 240);
      const opensCount = num(o.opensCount, 0, 2, opens ? 1 : 0);
      const answers = str(o.answers, 240);
      const answersPrevious = idx === 0 ? true : typeof o.answersPrevious === "boolean" ? o.answersPrevious : !!answers;
      const last = idx === lines.length - 1;
      let issue = str(o.issue, 300);
      if (!issue) {
        if (opensCount === 0 && !last) issue = "Opens no question: the viewer has no reason to stay for the next line.";
        else if (opensCount >= 2) issue = "Opens more than one question: pick one.";
        else if (!answersPrevious) issue = "Doesn't answer the previous line's question.";
      }
      return { line, opens, answers, opensCount, answersPrevious, ...(issue ? { issue } : {}) };
    });
    const loopOpeners = asArr(j.loopOpeners)
      .map((x) => str(x, 160))
      .filter(Boolean)
      .slice(0, 3);
    return { links, loopOpeners, truncated: all.length > MAX, summary: str(j.summary, 300) };
  },
});
