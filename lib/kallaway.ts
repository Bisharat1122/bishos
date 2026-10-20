/**
 * The Kallaway content system as data — one source for the Content Studio
 * playbook, the per-piece workflow, checklists and the script linter.
 * Paraphrased from Kane Kallaway's public material (YouTube @kallawaymarketing,
 * the Open Residency "Content Masterclass" podcast, Creator Science ep. 316).
 * Research notes: research_notes/Kallaway content system/*.md
 */

// ─────────────────────────────────────────────────────────────────────────
// Strategy
// ─────────────────────────────────────────────────────────────────────────

export const CONTENT_GAMES = [
  { key: "entertainment", n: 1, label: "Entertainment media", kpi: "views", money: "CPM + brand deals", hint: "Max views. He calls it a losing game vs MrBeast, Netflix & AI." },
  { key: "education_media", n: 2, label: "Education media", kpi: "followers", money: "CPM + brand deals", hint: "Teach things people can apply — still a media business." },
  { key: "commodity_product", n: 3, label: "Simple product", kpi: "conversions", money: "Product sales", hint: "Needs no explanation — just show it, in a cool context." },
  { key: "explained_product", n: 4, label: "Product that needs explaining", kpi: "conversions", money: "Single-session sales", hint: "Short education closes the 'what is it / why do I need it' gap." },
  { key: "authority", n: 5, label: "Authority / B2B", kpi: "emails", money: "Email → services, coaching, SaaS", hint: "Trust is the currency. Kallaway's specialty — and the founder's game." },
] as const;

export const KPIS: { key: string; label: string; hint: string }[] = [
  { key: "emails", label: "Emails per video", hint: "His #1 metric for business games" },
  { key: "followers", label: "Followers per video", hint: "#2 — a follow ≈ 5–10 views" },
  { key: "dollars_per_view", label: "$ per view", hint: "On-target views beat total views" },
  { key: "conversions", label: "Conversions per view", hint: "For product games" },
  { key: "views", label: "Views", hint: "Only for media games" },
];

export const LEAD_MAGNET_TYPES = [
  { key: "doc", label: "PDF / doc / template", hint: "Captures exactly what the video explained" },
  { key: "email_course", label: "3–5 day email course", hint: "e.g. a 'blueprint' series" },
  { key: "community", label: "Free community", hint: "Email collected on entry" },
  { key: "waitlist", label: "Waitlist / landing page", hint: "For an offer that's coming" },
  { key: "form", label: "Form", hint: "'Want our help? Fill this in'" },
];

export const UNIQUENESS_AXES = [
  { key: "topic", label: "Topic", hint: "What you talk about that others don't" },
  { key: "substance", label: "Substance / depth", hint: "How deep and non-obvious you go" },
  { key: "avatar", label: "Avatar", hint: "Who exactly it's for" },
  { key: "format", label: "Format", hint: "Story structure / series you own" },
  { key: "visuals", label: "Visuals", hint: "Your signature look, set and objects" },
] as const;

// ─────────────────────────────────────────────────────────────────────────
// The 7 LEGO bricks
// ─────────────────────────────────────────────────────────────────────────

export const BRICKS = [
  { key: "topic", label: "Topic", hint: "One sentence: what it's about" },
  { key: "angle", label: "Angle", hint: "Premise + your take + key facts" },
  { key: "hookStructure", label: "Hook structure", hint: "Spoken + text + visual hook" },
  { key: "storyStructure", label: "Story structure", hint: "Breakdown, listicle, tutorial, story…" },
  { key: "visualFormat", label: "Visual format", hint: "Layout: green screen, split screen, POV, in-the-world…" },
  { key: "keyVisuals", label: "Key visuals", hint: "A-roll, B-roll, graphics" },
  { key: "audio", label: "Audio", hint: "Music + sound effects" },
] as const;
export type BrickKey = (typeof BRICKS)[number]["key"];

/** Beginners: hold hook, story and visual format; change topic + angle every rep. */
export const BEGINNER_HOLD: BrickKey[] = ["hookStructure", "storyStructure", "visualFormat"];

// ─────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────

export const HOOK_JOBS = [
  { key: "visual_stop", label: "Visual stop", hint: "A thumb-stopper that looks different from the feed — visuals land before words" },
  { key: "context", label: "Context in the first sentence", hint: "Who/what instantly. Dropped mid-story = confusion = churn" },
  { key: "contrast", label: "Contrast", hint: "Lean them to the common belief, then flip it — the 200-point arc" },
];

export const ARCHETYPES = [
  { key: "fortune_teller", label: "Fortune Teller", contrast: "Present vs future", steps: ["Current reality", "How the future changes", "Tease that future"], best: "News, product innovation, future authority" },
  { key: "experimenter", label: "Experimenter", contrast: "I tried a new way", steps: ["The base pain", "I tried a new method/tool", "Why it works better"], best: "Product demos, B2B tools, new frameworks" },
  { key: "teacher", label: "Teacher", contrast: "Lesson learned", steps: ["The pain", "My learnings / method", "Why the steps work"], best: "Building expert authority" },
  { key: "magician", label: "Magician", contrast: "Visual/verbal stun gun", steps: ["Signature visual, sound or phrase", "Stack on any other archetype"], best: "Extra scroll-stop layer" },
  { key: "investigator", label: "Investigator", contrast: "A secret they don't know", steps: ["Tee up the secret", "Frame it against their not-knowing"], best: "Research / leading-edge positioning" },
  { key: "contrarian", label: "Contrarian", contrast: "Opposite of conventional wisdom", steps: ["Find what you believe that most don't", "Say it directly"], best: "Experts in crowded spaces" },
] as const;

export const HOOK_FORMATS = [
  { key: "secret_reveal", label: "Secret reveal", example: "[Company] just released [N] free [thing] that make [outcome] way faster." },
  { key: "case_study", label: "Case study", example: "[Person] just did [result] in [time] using this [N]-step method." },
  { key: "comparison", label: "Comparison", example: "Beginner founder vs experienced founder." },
  { key: "question", label: "Question", example: "Can you [do X] in under [time] using only [Y]?" },
  { key: "education", label: "Education", example: "Here's the easiest way to use [tool] to [task]." },
  { key: "list", label: "List", example: "These are the [N] best [things] for [goal]." },
  { key: "contrarian", label: "Contrarian", example: "Most people think [belief]. They're wrong." },
  { key: "personal_experience", label: "Personal experience", example: "When I was [context], I used [technique] to [result]." },
  { key: "problem", label: "Problem", example: "If you struggle with [pain], this is one obvious fix." },
] as const;

export const POWER_WORDS = [
  { key: "subject", label: "Subject", hint: "I, we, you, or a proper noun", required: true },
  { key: "action", label: "Action", hint: "A verb", required: true },
  { key: "objective", label: "Objective", hint: "The end-state — shocking & non-obvious", required: true },
  { key: "contrast", label: "Contrast", hint: "Base state vs new state (0 → 100K)", required: true },
  { key: "proof", label: "Proof", hint: "e.g. 'again' — more for education", required: false },
  { key: "time", label: "Time", hint: "'in 5 months', 'in 90 days'", required: false },
];

/** Hook audit = 4 commandments + 4 S's + final 4 questions (deduplicated). */
export const HOOK_AUDIT = [
  { key: "alignment", label: "Alignment", hint: "Visual, spoken and text hooks all say the same thing" },
  { key: "speed", label: "Speed to value", hint: "Topic in 1–2s, first value in ~4s (short) / 30–60s (YouTube)" },
  { key: "clarity", label: "Clarity", hint: "One subject, one question — only one possible meaning" },
  { key: "curiosity", label: "Curiosity", hint: "Am I curious enough to hear sentence two?" },
  { key: "stakes", label: "Stakes", hint: "Why should they care — outcome or curiosity scenario" },
  { key: "you", label: "Relevance", hint: "'You/your', not 'I/me' — need-to-have, not nice-to-have" },
  { key: "absorption", label: "100% absorption", hint: "~6th-grade words, active voice — cut fluff, not clarity" },
];

export const VISUAL_HOOKS = [
  { key: "overlay", label: "Graphic / text overlay" },
  { key: "interrupt", label: "Pattern interrupt / visual switch" },
  { key: "motion", label: "Subject moves in/out of frame" },
  { key: "vfx", label: "VFX / transition" },
  { key: "selection", label: "Striking visual selection" },
];

/** "Minimum viable visual" — at least one of these in the first 2 seconds. */
export const MIN_VIABLE_VISUAL = [
  "Attractive or unique-looking person",
  "Recognizable person or brand",
  "Atypical visual for the category",
  "Atypical layout",
];

export const TEXT_HOOK_RULES = [
  "3–5 words, max 2 lines",
  "On screen ~3 seconds, a third from the top — never over your face",
  "No punctuation (quotes/parentheses ok), no connector words",
  "Subject word + a pain reminder, dream-outcome tease or future change",
];

// ─────────────────────────────────────────────────────────────────────────
// Story, structure, retention
// ─────────────────────────────────────────────────────────────────────────

export const EMOTIONS = [
  { key: "awe", label: "Awe / inspiration" },
  { key: "amusement", label: "Amusement / humor" },
  { key: "excitement", label: "Excitement / joy" },
  { key: "anger", label: "Anger / outrage" },
  { key: "surprise", label: "Surprise / curiosity" },
  { key: "sadness", label: "Sadness / empathy" },
];

export type Structure = { key: string; label: string; blocks: string[]; hooks: string[]; long?: boolean; hint: string };

export const STRUCTURES: Structure[] = [
  { key: "narrative", label: "Personal narrative", blocks: ["Hook", "The problem I had", "What I tried", "Why it failed", "What actually worked", "If you have this problem…"], hooks: ["personal_experience", "problem", "contrarian"], hint: "The hottest short-form format right now — one-of-one, AI can't copy it" },
  { key: "breakdown", label: "Breakdown", blocks: ["Hook", "Context / shock", "What happened / how it works", "Why it matters", "Outro"], hooks: ["secret_reveal", "question", "comparison", "contrarian"], hint: "Explain how something works" },
  { key: "newscaster", label: "Newscaster", blocks: ["Hook", "Full context", "Your short take", "Outro"], hooks: ["secret_reveal", "question", "comparison", "contrarian", "problem"], hint: "Fresh news in your niche" },
  { key: "case_study", label: "Case-study explainer", blocks: ["Hook", "The framework (2–4 parts)", "Outro"], hooks: ["case_study", "question", "comparison"], hint: "Reflection on how someone got a result" },
  { key: "listicle", label: "Listicle", blocks: ["Hook", "Item 1", "Item 2", "Item 3", "Outro"], hooks: ["list", "problem"], hint: "3–5 independent items" },
  { key: "problem_solver", label: "Problem-solver", blocks: ["Hook", "Problem (agitate)", "Solution", "Outro"], hooks: ["problem", "question", "contrarian"], hint: "One pain, one fix" },
  { key: "tutorial", label: "Tutorial", blocks: ["Hook", "Step 1", "Step 2", "Step 3", "Result + outro"], hooks: ["education"], hint: "Dependent steps toward one outcome" },
  {
    key: "youtube",
    label: "YouTube long-form",
    long: true,
    blocks: [
      "Packaging — title locked + thumbnail concept",
      "Intro: confirm the click (~5s)",
      "Intro: the common belief",
      "Intro: your contrarian take",
      "Intro: proof + the plan",
      "Point 1 — your SECOND-best point (context → how → why) + re-hook",
      "Point 2 — your BEST point + re-hook",
      "Points 3+ descending to a climax",
      "Outro: recap + 'free dessert' + native CTA",
    ],
    hooks: ["contrarian", "case_study", "secret_reveal", "problem"],
    hint: "Packaging first, first payoff within 30–60s, a re-hook every 60–90s",
  },
];

export const STORYLOCKS = [
  { key: "term", label: "Term branding", hint: "Name your concept — unknown names create anticipation" },
  { key: "embedded", label: "Embedded truths", hint: "Drop if / maybe / might — say 'when you…', 'the reason this works…'" },
  { key: "thought", label: "Thought narration", hint: "'You're probably thinking…' after big points" },
  { key: "negative", label: "Negative frames", hint: "'This is killing your growth' beats 'how to grow' (loss aversion)" },
  { key: "loops", label: "Loop openers", hint: "'But that's not even the craziest part' — every 20–30s (short), 60–90s (long)" },
  { key: "contrast", label: "Contrast words", hint: "but · actually · instead · turns out · yet — split key lines into A then B" },
  { key: "but_therefore", label: "But / therefore, never 'and then'", hint: "Alternate context and conflict (the Dance)" },
  { key: "rhythm", label: "Jagged rhythm", hint: "Mix short, medium and long sentences — one per line" },
  { key: "last_line", label: "Last line written first", hint: "A memorable 'last dab' that loops back to the first line" },
];

export const DOPAMINE_LADDER = [
  { key: "stimulation", label: "Stimulation", hint: "Color, motion, contrast in 0–2s" },
  { key: "captivation", label: "Captivation", hint: "An open question pops in their head" },
  { key: "anticipation", label: "Anticipation", hint: "They guess — then a head-fake" },
  { key: "validation", label: "Validation", hint: "A non-obvious payoff closes the loop" },
  { key: "affection", label: "Affection", hint: "They like the messenger" },
  { key: "revelation", label: "Revelation", hint: "You're a consistent source of value" },
];

// ─────────────────────────────────────────────────────────────────────────
// Conversion
// ─────────────────────────────────────────────────────────────────────────

/** Trust Ladder — rung 1 is the strongest. */
export const TRUST_LADDER = [
  { n: 1, label: "Warm endorsement", hint: "Someone they know and respect vouches for you" },
  { n: 2, label: "Proof of audience", hint: "A real, big following" },
  { n: 3, label: "Demonstration", hint: "Show your ability in the video itself" },
  { n: 4, label: "Group testimonials", hint: "Named clients and results" },
  { n: 5, label: "Personal results", hint: "Your own numbers / screenshots" },
  { n: 6, label: "Borrowed proof", hint: "A famous person's framework" },
  { n: 7, label: "Cold testimonial", hint: "One stranger's review" },
  { n: 8, label: "Third-party stat", hint: "A study or statistic" },
];

export const CTA_RAMPS = [
  { key: "lead_magnet", label: "Lead magnet (email)", hint: "His favorite — topic-aligned free resource" },
  { key: "sales_page", label: "Sales page", hint: "Low ticket or high trust" },
  { key: "dm", label: "Call / DM", hint: "High ticket — 'comment X / DM me'" },
  { key: "follow", label: "Follow / series", hint: "Bingeability: 'part 2 next'" },
  { key: "none", label: "None this time", hint: "Pure trust-building rep" },
];

export const FUNNEL_SWITCHES = [
  { key: "signal", label: "Bullseye signal", hint: "Lines 1–2 make it unmistakably a solution to THEIR pain" },
  { key: "trust", label: "Trust", hint: "Stack 2+ Trust Ladder rungs" },
  { key: "ramp", label: "Clear ramp", hint: "One off-ramp per video, aligned with the topic" },
  { key: "offer", label: "Aligned offer", hint: "Priced below the flip point — ~10× return in 30 days" },
];

// ─────────────────────────────────────────────────────────────────────────
// Gates (per-piece checklists)
// ─────────────────────────────────────────────────────────────────────────

export const IDEA_GATE = [
  { key: "avatar", label: "Passes the avatar filter", hint: "Would my one ideal viewer find this useful or interesting?" },
  { key: "validated", label: "Validated by an outlier", hint: "A 5×+ video (yours first, then 10K–1M creators) proves the topic" },
  { key: "contrarian", label: "Non-obvious contrarian angle", hint: "What do most people believe that I disagree with?" },
  { key: "visual", label: "A key visual exists", hint: "No good visual for the first 3–5s? Make one or drop the idea" },
  { key: "unique", label: "Every point is unique", hint: "Measure twice, cut once" },
  { key: "worth", label: "Worth a $1,000 rep?", hint: "If this video cost $1,000, would you still make it?" },
];

export const PACKAGING_SHORT = [
  { key: "cover", label: "Custom cover", hint: "Shares happen in DMs where only the cover shows" },
  { key: "caption", label: "First caption line = curiosity title", hint: "Written like a headline" },
  { key: "series", label: "Part of a series / grid makes sense", hint: "Bingeability: a profile visitor knows what to click next" },
];

export const PACKAGING_LONG = [
  { key: "title_first", label: "Title locked BEFORE scripting", hint: "Most effort while you're freshest, on the most important thing" },
  { key: "desire_loop", label: "Title triggers a desire loop", hint: "Pain, FOMO or desire — or an unanswered question" },
  { key: "thumb_3", label: "Thumbnail ≤3 elements, adds to the title (never repeats it)", hint: "Thumbnail → title → thumbnail → click" },
  { key: "dark_mode", label: "Readable at 1/16 size, in dark mode", hint: "Keep the bottom-right corner clear" },
  { key: "variants", label: "3 thumbnail variants for A/B test", hint: "Iterate around the winner" },
  { key: "click_confirm", label: "Intro confirms the click in ~5s", hint: "Clickbait yes, bait-and-switch never" },
  { key: "payoff", label: "First payoff in 30–60s", hint: "Reorder in the edit if the best bit is late" },
];

export const PUBLISH_GATE = [
  { key: "aligned", label: "Visual, spoken & text hooks aligned", hint: "Watch it with sound off — still clear?" },
  { key: "lockin", label: "Lock-in zone confirms the hook", hint: "Next 5–10s: confirm the claim + a trust anchor" },
  { key: "eyes_closed", label: "Eyes-closed pacing test", hint: "Bored → cut tighter. Lost → add breathing room" },
  { key: "visual_match", label: "Every visual matches its words", hint: "Best way to visualize each sentence?" },
  { key: "two_hits", label: "Two dopamine hits before they could leave", hint: "Two usable insights early = locked in" },
  { key: "cta", label: "One CTA ramp, aligned with the topic", hint: "Native — the answer to the topic, not an ad break" },
  { key: "captions", label: "Captions / subtitles", hint: "Most people watch muted" },
];

/** 60-day short-form lab: 3, then 5, then 7 a week for 6 weeks ≈ 50 videos. */
export const LAB_RAMP = [3, 5, 7, 7, 7, 7, 7, 7];
export const LAB_TOTAL = LAB_RAMP.reduce((a, b) => a + b, 0);

export const KALLAWAY_LOOP = [
  { key: "idea", label: "Idea", hint: "Outliers first: your winners → 10K–1M creators" },
  { key: "research", label: "Research", hint: "Shock-score facts, find the contrarian angle" },
  { key: "script", label: "Script", hint: "Hook → structure → one-question chain (~20 min)" },
  { key: "record", label: "Record", hint: "Line by line keeps the energy up" },
  { key: "edit", label: "Edit", hint: "Eyes-closed test, visuals match words" },
  { key: "post", label: "Post", hint: "Same time daily — for accountability, not the algorithm" },
  { key: "review", label: "Review", hint: "Which brick was weak? Fix 1–2 next rep" },
];

/** YouTube "1-of-10" rule: rank a video by views among your last 10. */
export function rankAdvice(rank: number): { tone: "success" | "info" | "warning"; text: string } {
  if (rank <= 3) return { tone: "success", text: "Top 3 of your last 10 — let it run and study what you did." };
  if (rank <= 6) return { tone: "info", text: "Middle of the pack — usually a smaller idea TAM. Don't beat yourself up." };
  return { tone: "warning", text: "Bottom 4 — your only live lever is the title + thumbnail. Repackage or take the lesson." };
}

/** Shorts: ≥70% still watching at 3s is a banger, <50% is a problem. */
export function holdAdvice(hold3s: number): { tone: "success" | "info" | "warning"; text: string } {
  if (hold3s >= 70) return { tone: "success", text: "Banger hook — ≥70% held at 3s." };
  if (hold3s >= 50) return { tone: "info", text: "OK hook — aim for 70%+ at 3s." };
  return { tone: "warning", text: "Hook problem — under 50% at 3s. Check visual stop, context and contrast." };
}

// ─────────────────────────────────────────────────────────────────────────
// Script linter (live, no AI)
// ─────────────────────────────────────────────────────────────────────────

const HEDGES = ["maybe", "might", "perhaps", "probably", "possibly", "kind of", "sort of", "i think", "i guess", "could be"];
const CONTRAST = ["but", "actually", "instead", "turns out", "except", "yet", "however", "although"];
const LOOP_OPENERS = [
  "but that's not",
  "here's the crazy part",
  "here's what nobody",
  "but here's the problem",
  "that's when i realized",
  "which is exactly why",
  "but wait",
  "here's the thing",
  "the real reason",
  "except",
];
const CONNECTORS = ["and", "or", "that", "but", "therefore", "so", "because"];

export type LintIssue = { kind: "warn" | "tip" | "good"; text: string };

function sentences(text: string): string[] {
  return text
    .replace(/^#+.*$/gm, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 2);
}

const count = (text: string, phrases: string[]) => {
  const t = ` ${text.toLowerCase()} `;
  return phrases.reduce((n, p) => n + (t.match(new RegExp(`[^a-z]${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^a-z]`, "g"))?.length ?? 0), 0);
};

/** Rough Flesch–Kincaid grade. */
function grade(text: string, sents: string[]): number {
  const words = text.match(/[a-zA-Z']+/g) ?? [];
  if (!words.length || !sents.length) return 0;
  const syll = words.reduce((n, w) => n + Math.max(1, (w.toLowerCase().replace(/e$/, "").match(/[aeiouy]+/g) ?? []).length), 0);
  return Math.max(0, Math.round((0.39 * (words.length / sents.length) + 11.8 * (syll / words.length) - 15.59) * 10) / 10);
}

export function lintScript(script: string, opts: { long?: boolean } = {}) {
  const text = script ?? "";
  const sents = sentences(text);
  const words = (text.replace(/^#+.*$/gm, "").match(/\S+/g) ?? []).length;
  const seconds = Math.round((words / 150) * 60);
  const issues: LintIssue[] = [];
  if (!words) return { words, seconds, grade: 0, issues, stats: { andThen: 0, hedges: 0, contrast: 0, loops: 0, you: 0, i: 0, variety: 0 } };

  const andThen = count(text, ["and then"]);
  const hedges = count(text, HEDGES);
  const contrast = count(text, CONTRAST);
  const loops = count(text, LOOP_OPENERS);
  const you = count(text, ["you", "your", "you're"]);
  const i = count(text, ["i", "me", "my", "i'm"]);
  const lens = sents.map((s) => s.split(/\s+/).length);
  const mean = lens.reduce((a, b) => a + b, 0) / Math.max(1, lens.length);
  const variety = lens.length > 2 ? Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length) : 0;
  const g = grade(text, sents);

  if (andThen) issues.push({ kind: "warn", text: `"and then" ×${andThen} — link beats with "but" or "therefore" instead.` });
  if (hedges) issues.push({ kind: "warn", text: `${hedges} hedge word${hedges > 1 ? "s" : ""} (maybe/might/probably…) — use embedded truths.` });
  if (!contrast) issues.push({ kind: "warn", text: "No contrast words — add a 'but' / 'actually' turn." });
  else issues.push({ kind: "good", text: `${contrast} contrast word${contrast > 1 ? "s" : ""} — good zig-zag.` });
  const interval = opts.long ? 75 : 25;
  const neededLoops = Math.max(0, Math.floor(seconds / interval));
  if (neededLoops > loops) issues.push({ kind: "tip", text: `~${seconds}s long → aim for ${neededLoops} loop opener${neededLoops > 1 ? "s" : ""} (one every ${opts.long ? "60–90" : "20–30"}s); found ${loops}.` });
  if (lens.length > 3 && variety < 3) issues.push({ kind: "tip", text: "Sentences are all a similar length — make the rhythm jagged (short, medium, long)." });
  if (g > 8) issues.push({ kind: "warn", text: `Reading level ≈ grade ${g} — simplify toward grade 6 for 100% absorption.` });
  else if (g) issues.push({ kind: "good", text: `Reading level ≈ grade ${g} — easy to absorb.` });
  if (i > you * 2 && you < 3) issues.push({ kind: "tip", text: "Lots of I/me, little 'you' — make it about the viewer (unless it's a personal narrative)." });
  if (!opts.long && seconds > 75) issues.push({ kind: "tip", text: `~${seconds}s — long for a short. Compress: is every line earning its place?` });

  return { words, seconds, grade: g, issues, stats: { andThen, hedges, contrast, loops, you, i, variety: Math.round(variety * 10) / 10 } };
}

/** Text-hook rule check: ≤5 words ideal, ≤2 lines, no punctuation, no connectors. */
export function lintTextHook(t: string): LintIssue[] {
  const out: LintIssue[] = [];
  const s = t.trim();
  if (!s) return out;
  const words = s.split(/\s+/);
  const lines = s.split(/\n/).length;
  if (words.length > 7) out.push({ kind: "warn", text: `${words.length} words — aim for 3–5.` });
  else out.push({ kind: "good", text: `${words.length} words.` });
  if (lines > 2) out.push({ kind: "warn", text: "More than 2 lines." });
  if (/[.,!?;:]/.test(s)) out.push({ kind: "tip", text: "Drop punctuation (quotes/parentheses are fine)." });
  const conn = words.filter((w) => CONNECTORS.includes(w.toLowerCase().replace(/[^a-z]/g, "")));
  if (conn.length) out.push({ kind: "tip", text: `Connector words: ${[...new Set(conn)].join(", ")} — cut them.` });
  return out;
}

/** Heuristic power-word detection for a spoken hook. */
export function detectPowerWords(hook: string): Record<string, boolean> {
  const h = ` ${hook.toLowerCase()} `;
  return {
    subject: /\b(i|we|you|my|our|your)\b/.test(h) || /\s[A-Z][a-z]+/.test(` ${hook}`),
    action: /\b\w+(ed|ing)\b|\b(get|got|make|made|build|built|grew|grow|lost|win|won|use|used|turn|turned|went|go|stop|start|do|did)\b/.test(h),
    objective: /\d|\b(result|revenue|clients|customers|followers|views|million|k\b|x\b|faster|more|less)\b/.test(h),
    contrast: count(h, CONTRAST) > 0 || /\bfrom\b.*\bto\b|\bvs\b|→/.test(h),
    proof: /\b(again|proven|tested|every time|\d+ (times|clients|companies))\b/.test(h),
    time: /\b(in|within|under) \d+|\b(days?|weeks?|months?|years?|minutes?|hours?)\b/.test(h),
  };
}

/** The workflow steps shown on every piece (progress ring). */
export const WORKFLOW_STEPS = [
  { key: "gate", label: "Idea gate" },
  { key: "bricks", label: "Angle & facts" },
  { key: "hook", label: "Hook" },
  { key: "structure", label: "Structure" },
  { key: "script", label: "Script & retention" },
  { key: "convert", label: "Convert" },
  { key: "package", label: "Packaging" },
  { key: "review", label: "Post-mortem" },
] as const;

// ─────────────────────────────────────────────────────────────────────────
// Newest material (Open Residency podcast #2, Oct 2026)
// ─────────────────────────────────────────────────────────────────────────

/** Format Pyramid — a saturation "red line" rises from the bottom. */
export const FORMAT_PYRAMID = [
  { key: "stories", label: "Stories", hint: "Your lived problem → action → result. Least saturated, one-of-one" },
  { key: "application", label: "Application", hint: "How to apply it to their situation. Go here in crowded niches" },
  { key: "explanation", label: "Explanation", hint: "Why/how something works" },
  { key: "facts", label: "Facts", hint: "Raw information — most saturated, AI does it now" },
];

/** The 4 ways left to stand out. */
export const STAND_OUT = [
  { key: "ideas", label: "Better ideas", hint: "Idea = topic + angle. Topic TAM × shock score. Exploit proven winners ~6 months before exploring" },
  { key: "advanced", label: "More advanced", hint: "Pitch at 4–6/10 sophistication — fewer views, higher-value buyers" },
  { key: "proof", label: "Better proof", hint: "One-of-one proof. Audit competitors' proof — beat it or move to a sub-lane" },
  { key: "story", label: "Better storytelling", hint: "Problem → action → result" },
];

/** DCT — where data vs creativity goes. */
export const DCT = [
  { key: "data", label: "Data picks the topic", hint: "Outliers decide what to talk about" },
  { key: "creativity", label: "Creativity picks the angle", hint: "Your non-obvious take" },
  { key: "transposition", label: "Transpositioning", hint: "Borrow a winning format from another niche" },
];

/** 3-2-1: 3 topic buckets × 2 videos/week + 1 chaos agent = 7/week. */
export const PLAN_321 = {
  buckets: [
    { kind: "broad", label: "Bucket 1 · broad", hint: "Bigger topic TAM inside your niche" },
    { kind: "narrow", label: "Bucket 2 · narrow", hint: "Deep, buyer-intent topic" },
    { kind: "narrow", label: "Bucket 3 · narrow", hint: "Deep, buyer-intent topic" },
  ],
  perBucket: 2,
  chaos: 1,
  total: 7,
};

export const HOOKS_THAT_WORK = [
  { key: "transformation", label: "Transformation", hint: "Before → after" },
  { key: "impossibility", label: "Impossibility", hint: "Something that sounds impossible" },
  { key: "addiction", label: "Addiction", hint: "Something people can't stop doing" },
  { key: "new_thing", label: "A new thing exists", hint: "'This just came out…'" },
];
export const HOOKS_THAT_FAIL = ["Opening with 'If you…'", "Fear framing", "Multi-sentence hooks before the point"];

/** Diagnose a flop in this order. */
export const FLOP_DIAGNOSIS = [
  { key: "topic", label: "Was the topic validated?", hint: "An outlier proved demand — if not, that's the problem" },
  { key: "angle", label: "Was the angle non-obvious?", hint: "Shock score high enough?" },
  { key: "hook", label: "Did the hook land?", hint: "3s hold ≥70% (shorts) / CTR + first 30s (YouTube)" },
];

export const RESEARCH_CADENCE = [
  { key: "own", label: "Own-channel audit", every: "every 2 weeks", hint: "Your winners first — remake them" },
  { key: "niche", label: "Niche scan", every: "every 3–4 weeks", hint: "Outliers from your watchlist, last 3 months, >2% engagement" },
];

export const GROWTH_SYSTEM = [
  { key: "interview", label: "Niche interview", hint: "Who you serve; the 'Frankenstein' ideal viewer stitched from real people" },
  { key: "watchlist", label: "Competitor watchlist", hint: "~10 creators to start (20–30 later)" },
  { key: "wheel", label: "Positioning wheel", hint: "Topic selection, substance depth, unique stories, visual format…" },
  { key: "bullseye", label: "Audience bullseye", hint: "Rings from narrowest out — the outer ring is banned" },
  { key: "plan321", label: "3-2-1 plan", hint: "3 buckets × 2/week + 1 chaos agent = 7 a week" },
  { key: "scanner", label: "Topic scanner", hint: "Mark outliers you have a non-obvious take on" },
  { key: "matrix", label: "Format matrix", hint: "Story structure × visual layout" },
  { key: "write", label: "Write hooks & scripts by hand", hint: "AI to ~90%, the last 10% is you" },
];

/** Skill before content — and the business stack. */
export const SKILL_FIRST = "Content amplifies skill. Aim for top 10% (ideally top 1%) in what you teach — he did 18 months of daily shorts at ~8h each.";
export const OWNED_STACK = "Rented → owned: short form (cash cow) + long form ('the GOAT') → email. Solo? Start short form. With a team? Long form. Same problem all the way: content → lead magnet (keyword DM) → page → low-ticket → high-ticket.";
