/**
 * YouTube long-form layer — Paddy Galloway's frameworks (Open Residency
 * "2-Hour YouTube Masterclass", Sep 2026), paraphrased. Complements the
 * Kallaway system in lib/kallaway.ts. Notes: research_notes/Kallaway content system/youtube_video.md
 */

/** YouTube is a click-and-watch platform: packaging is ~50% of the game. */
export const YT_CORE = "Clicks × watch time × satisfaction. The click (packaging) is half the game.";

/** CCN — every video must work for Core, Casual and New viewers. */
export const CCN = [
  { key: "core", label: "Core fans", hint: "Your regulars still love it" },
  { key: "casual", label: "Casual viewers", hint: "Someone who's seen 1–2 of yours gets it instantly" },
  { key: "new", label: "New viewers", hint: "A stranger with zero context would click and stay" },
];

/** Hallmarks of the biggest videos. */
export const BIG_VIDEO_TESTS = [
  { key: "ccn", label: "Works for Core, Casual and New", hint: "Not over-serving fans, not chasing strangers" },
  { key: "glance", label: "Passes the 1-second glance test", hint: "The whole idea fits in one line" },
  { key: "universal", label: "Universal appeal inside your niche", hint: "Big idea, still on-topic" },
  { key: "unpause", label: "A question you must click to answer", hint: "'Click to unpause' the curiosity" },
];

/** Three idea sources (in order). */
export const IDEA_SOURCES = [
  { key: "own_hits", label: "Your own past hits", hint: "Remake them — the safest bet" },
  { key: "outliers", label: "Outliers 3–4×+ a channel's average", hint: "Your niche and adjacent niches" },
  { key: "new", label: "New combinations", hint: "~20% of videos — experiments" },
];

/** 100 → 10 → 1 idea funnel with elimination tests. */
export const IDEA_FUNNEL = [
  { n: "100", label: "Write ~100 ideas per video", hint: "Quantity first, from your guiding principles" },
  { n: "10", label: "Cut with elimination tests", hint: "'Can we package it?' alone removes two-thirds" },
  { n: "1", label: "One-page idea slide per finalist", hint: "Pick the one you'd bet your career on" },
];

export const ELIMINATION_TESTS = [
  { key: "package", label: "Can we package it?", hint: "A title + thumbnail you'd click" },
  { key: "glance", label: "Glance test", hint: "Understood in one second" },
  { key: "ccn", label: "CCN fit", hint: "Core, casual and new all care" },
  { key: "eighty", label: "80% rule", hint: "Shares ~80% of your audience — experiment only 1 in 4–5" },
  { key: "can_make", label: "Can we make it great?", hint: "Execution is realistic" },
];

/** Packaging workflow. */
export const PACKAGING_FLOW = [
  { key: "titles", label: "≥10 titles first", hint: "Before anything else" },
  { key: "brief", label: "Thumbnail brief: ~5 concepts", hint: "Concepts, not designs" },
  { key: "shoot", label: "Shoot 10–30 shots per concept", hint: "Faces, emotions, angles" },
  { key: "ab", label: "≥3 clearly different thumbnails in A/B test", hint: "YouTube's native Test & Compare" },
  { key: "time", label: "10–20% of production time on packaging", hint: "One thumbnail swap took a video from 1K to 40K views/day" },
];

export const TITLE_RULES = [
  "Under ~60 characters",
  "Words everyone knows",
  "Complements the thumbnail — never repeats it",
  "Title Case, no ALL CAPS",
  "Written for people, not SEO (search is only 5–10% of views)",
];

/** Live title check. */
export function lintTitle(t: string): { kind: "warn" | "tip" | "good"; text: string }[] {
  const s = t.trim();
  const out: { kind: "warn" | "tip" | "good"; text: string }[] = [];
  if (!s) return out;
  if (s.length > 60) out.push({ kind: "warn", text: `${s.length} characters — keep it under ~60.` });
  else out.push({ kind: "good", text: `${s.length} characters.` });
  const words = s.split(/\s+/);
  const caps = words.filter((w) => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w));
  if (caps.length) out.push({ kind: "tip", text: `Avoid ALL CAPS (${caps.slice(0, 3).join(", ")}).` });
  const small = new Set(["a", "an", "the", "and", "or", "but", "of", "in", "on", "to", "for", "at", "by", "vs"]);
  const notTitle = words.filter((w, i) => i > 0 && !small.has(w.toLowerCase()) && /^[a-z]/.test(w));
  if (notTitle.length > 1) out.push({ kind: "tip", text: "Use Title Case." });
  if (/\b(seo|keyword|tutorial \d{4})\b/i.test(s)) out.push({ kind: "tip", text: "Write for people, not SEO." });
  return out;
}

/** 45-second intro. */
export const INTRO_45 = [
  { key: "promise10", label: "Deliver on the promise in the first 10 seconds", hint: "60–70% can leave otherwise" },
  { key: "intrigue", label: "Create intrigue with minimal context", hint: "Only the context they need" },
  { key: "flow", label: "Flow straight into the video", hint: "No 'welcome back', no throat-clearing" },
];

/** Ways to raise stakes. */
export const STAKES = [
  { key: "doubter", label: "A doubter", hint: "Someone says it can't be done" },
  { key: "time_limit", label: "A time limit", hint: "A ticking clock" },
  { key: "reward", label: "A reward", hint: "What's won if it works" },
  { key: "punishment", label: "A punishment", hint: "What's lost if it fails" },
  { key: "cost", label: "Cost of not paying attention", hint: "What the viewer misses by leaving" },
];

/** The pendulum — what to focus on, in order, as you grow. */
export const PENDULUM = [
  { n: 1, label: "Make it watchable", hint: "Clear audio, clear story, no drop-off traps" },
  { n: 2, label: "Ideas + packaging", hint: "Where the views actually come from" },
  { n: 3, label: "Production quality", hint: "Only after 1 and 2 work" },
];

/** Phrases that cause drop-offs (watch your retention curve). */
export const DROP_OFF_PHRASES = ["at the end of the day", "without further ado", "welcome back", "before we get started", "make sure to subscribe"];

export const YT_EXPECTATIONS =
  "Brands: commit 18–24 months before judging a channel. Kallaway: 1 video a week for 50 weeks, think in 3–5 years. Hire a YouTuber, not a videographer.";
