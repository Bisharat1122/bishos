/**
 * Content Studio model: stages, board groups, formats, platforms, hook types,
 * publish checklist, script templates and small helpers shared by every
 * content screen. Mirrors the rules in convex/content.ts.
 */
import { useCallback, useEffect, useState } from "react";
import { ConvexError } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  BookOpen,
  Building2,
  Clapperboard,
  Facebook,
  GalleryHorizontalEnd,
  Globe,
  Instagram,
  Linkedin,
  ListTree,
  Mail,
  Mic,
  Music2,
  Newspaper,
  SquarePlay,
  Twitter,
  User,
  Video,
  Youtube,
  CircleDot,
} from "lucide-react";
import type { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export type Stage = Doc<"contentPieces">["stage"];
export type Brand = "personal" | "company";
export type BrandFilter = "both" | Brand;
export type PerfWindow = "24h" | "7d" | "30d";
export type LitePiece = FunctionReturnType<typeof api.content.list>[number];
export type Pillar = FunctionReturnType<typeof api.content.listPillars>[number];
export type FullPiece = NonNullable<FunctionReturnType<typeof api.content.get>>;
export type Swipe = FunctionReturnType<typeof api.swipes.list>[number];
export type Hook = Doc<"hooks">;

// ─────────────────────────────────────────────────────────────────────────
// Stages + board groups
// ─────────────────────────────────────────────────────────────────────────

export const STAGE_ORDER: Stage[] = [
  "idea",
  "seed",
  "brief",
  "script",
  "ready_to_record",
  "recorded",
  "editing",
  "ready_to_publish",
  "scheduled",
  "published",
  "repurposing",
  "measured",
  "recycle_due",
  "archived",
];

export const STAGE_LABEL: Record<Stage, string> = {
  idea: "Idea",
  seed: "Seed",
  brief: "Brief",
  script: "Script",
  ready_to_record: "Ready to record",
  recorded: "Recorded",
  editing: "Editing",
  ready_to_publish: "Ready to publish",
  scheduled: "Scheduled",
  published: "Published",
  repurposing: "Repurposing",
  measured: "Measured",
  recycle_due: "Recycle due",
  archived: "Archived",
};

export type GroupKey = "ideas" | "planning" | "production" | "ready" | "live" | "done";

export const GROUPS: { key: GroupKey; label: string; stages: Stage[]; hint: string }[] = [
  { key: "ideas", label: "Ideas", stages: ["idea", "seed"], hint: "Raw ideas and tested seeds" },
  { key: "planning", label: "Planning", stages: ["brief", "script"], hint: "Angle, hook and script" },
  { key: "production", label: "Production", stages: ["ready_to_record", "recorded", "editing"], hint: "Record and edit (video only)" },
  { key: "ready", label: "Ready", stages: ["ready_to_publish", "scheduled"], hint: "Checklist gate, then a date" },
  { key: "live", label: "Live", stages: ["published", "repurposing"], hint: "Out there. Cut the hub into shorts." },
  { key: "done", label: "Done", stages: ["measured", "recycle_due", "archived"], hint: "Measured, recycle or archive" },
];

export function groupOf(stage: Stage): GroupKey {
  return GROUPS.find((g) => g.stages.includes(stage))?.key ?? "ideas";
}
export const groupIndex = (stage: Stage) => GROUPS.findIndex((g) => g.stages.includes(stage));

/** Text formats skip recording stages. */
export const TEXT_FORMATS = new Set(["text_post", "thread", "carousel", "newsletter", "article"]);
const VIDEO_FORMATS = new Set(["short_video", "long_video", "story"]);
const RECORDING = new Set<Stage>(["ready_to_record", "recorded", "editing"]);
export const PUBLISH_STAGES = new Set<Stage>(["published", "repurposing", "measured", "recycle_due"]);

export function nextStage(stage: Stage, format: string, isHub: boolean): Stage | null {
  if (stage === "archived") return null;
  if (stage === "recycle_due") return "archived";
  for (let i = STAGE_ORDER.indexOf(stage) + 1; i < STAGE_ORDER.length; i++) {
    const s = STAGE_ORDER[i];
    if (TEXT_FORMATS.has(format) && RECORDING.has(s)) continue;
    if (s === "repurposing" && !isHub) continue;
    if (s === "recycle_due") continue;
    return s;
  }
  return null;
}

/**
 * Dropping on a board column sets that column's first stage. Exceptions: text
 * formats land on "editing" in Production, and an unpublished piece dropped on
 * Done is archived (not measured).
 */
export function dropStageFor(group: GroupKey, piece: { format: string; publishedAt?: number }): Stage {
  const g = GROUPS.find((x) => x.key === group)!;
  if (group === "production" && TEXT_FORMATS.has(piece.format)) return "editing";
  if (group === "done" && !piece.publishedAt) return "archived";
  return g.stages[0];
}

/** Does moving to `to` publish this piece (and so pass the gate)? */
export const isPublishMove = (to: Stage, piece: { publishedAt?: number }) => PUBLISH_STAGES.has(to) && !piece.publishedAt;

// ─────────────────────────────────────────────────────────────────────────
// Formats, platforms, hooks
// ─────────────────────────────────────────────────────────────────────────

export const FORMATS: { key: string; label: string; icon: LucideIcon; text: boolean }[] = [
  { key: "short_video", label: "Short video", icon: SquarePlay, text: false },
  { key: "long_video", label: "Long video", icon: Clapperboard, text: false },
  { key: "carousel", label: "Carousel", icon: GalleryHorizontalEnd, text: true },
  { key: "text_post", label: "Text post", icon: AlignLeft, text: true },
  { key: "thread", label: "Thread", icon: ListTree, text: true },
  { key: "newsletter", label: "Newsletter", icon: Mail, text: true },
  { key: "article", label: "Article", icon: Newspaper, text: true },
  { key: "podcast", label: "Podcast", icon: Mic, text: false },
  { key: "story", label: "Story", icon: Video, text: false },
];
export function formatMeta(key: string) {
  return FORMATS.find((f) => f.key === key) ?? { key, label: key.replace(/_/g, " "), icon: CircleDot, text: true };
}

export const PLATFORMS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "tiktok", label: "TikTok", icon: Music2 },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "youtube_shorts", label: "YouTube Shorts", icon: SquarePlay },
  { key: "x", label: "X", icon: Twitter },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "newsletter", label: "Newsletter", icon: Mail },
  { key: "blog", label: "Blog", icon: BookOpen },
];
export function platformMeta(key?: string) {
  return PLATFORMS.find((p) => p.key === key) ?? { key: key ?? "web", label: key ? key : "Web", icon: Globe };
}

/** Guess the platform from a pasted URL. */
export function detectPlatform(url: string): string | undefined {
  const u = url.toLowerCase();
  if (u.includes("linkedin.")) return "linkedin";
  if (u.includes("instagram.")) return "instagram";
  if (u.includes("tiktok.")) return "tiktok";
  if (u.includes("youtube.com/shorts") || u.includes("youtu.be/shorts")) return "youtube_shorts";
  if (u.includes("youtube.") || u.includes("youtu.be")) return "youtube";
  if (u.includes("twitter.") || u.includes("x.com")) return "x";
  if (u.includes("facebook.") || u.includes("fb.watch")) return "facebook";
  if (u.includes("substack.") || u.includes("beehiiv.")) return "newsletter";
  return undefined;
}

export const HOOK_TYPES: { key: string; label: string; hint: string }[] = [
  // Kallaway's 9 proven spoken-hook formats
  { key: "secret_reveal", label: "Secret reveal", hint: "An unknown insight or new release" },
  { key: "case_study", label: "Case study", hint: "Someone got a result an unexpected way" },
  { key: "comparison", label: "Comparison", hint: "A vs B, beginner vs expert" },
  { key: "education", label: "Education", hint: "The easiest way to do one task" },
  { key: "personal_experience", label: "Personal experience", hint: "When I was…, I used… to…" },
  { key: "problem", label: "Problem", hint: "Agitate a known pain, promise a fix" },
  { key: "curiosity", label: "Curiosity", hint: "Open a knowledge gap" },
  { key: "contrarian", label: "Contrarian", hint: "Bold claim against the grain" },
  { key: "result", label: "Result", hint: "Lead with a specific outcome" },
  { key: "question", label: "Question", hint: "Ask what they're already asking" },
  { key: "mistake", label: "Mistake", hint: "A costly mistake to avoid" },
  { key: "myth", label: "Myth", hint: "Bust a common belief" },
  { key: "list", label: "List", hint: "N things, numbered" },
  { key: "story", label: "Story", hint: "Drop into a moment" },
  { key: "how-to", label: "How-to", hint: "Promise a clear method" },
  { key: "before/after", label: "Before/after", hint: "Show the transformation" },
];
export const hookLabel = (k?: string) => HOOK_TYPES.find((h) => h.key === k)?.label ?? (k ? k : "Untyped");

export const STARTER_HOOKS: { text: string; hookType: string }[] = [
  { text: "I spent [time] doing [X] so you don't have to.", hookType: "result" },
  { text: "Stop doing [common practice]. Do this instead.", hookType: "contrarian" },
  { text: "The biggest mistake I made building [company]:", hookType: "mistake" },
  { text: "Everyone says [belief]. Here's why that's wrong.", hookType: "myth" },
  { text: "[N] things I wish I knew before [milestone]:", hookType: "list" },
  { text: "How we got [result] in [timeframe] with [constraint].", hookType: "how-to" },
  { text: "Why do most [audience] fail at [goal]?", hookType: "question" },
  { text: "Last [day], a client told me something I can't stop thinking about.", hookType: "story" },
  { text: "Nobody talks about this part of [topic].", hookType: "curiosity" },
  { text: "[Before state] → [after state]. Here's exactly what changed.", hookType: "before/after" },
];

// ─────────────────────────────────────────────────────────────────────────
// Publish checklist
// ─────────────────────────────────────────────────────────────────────────

export const CHECKLIST: { key: string; label: string; hint: string; videoOnly?: boolean; auto?: string }[] = [
  // Kallaway publish gate (mirrored in convex/content.ts CHECKLIST_KEYS)
  { key: "hook", label: "Hook passes the audit", hint: "Clear subject, one question, speed to value, curiosity for line 2" },
  { key: "aligned", label: "Visual, spoken & text hooks say the same thing", hint: "Confusion leads to churn — check it with the sound off", videoOnly: true },
  { key: "lockin", label: "Lock-in zone confirms the hook", hint: "Next 5–10s confirm the claim + show a trust anchor", videoOnly: true },
  { key: "eyes_closed", label: "Eyes-closed pacing test", hint: "Bored → cut tighter. Lost → add breathing room", videoOnly: true },
  { key: "visual_match", label: "Every visual matches its words", hint: "Best possible way to visualize each sentence?", videoOnly: true },
  { key: "two_hits", label: "Two dopamine hits early", hint: "Two usable insights before they could leave" },
  { key: "cta", label: "One CTA ramp, aligned with the topic", hint: "Native — the answer to the topic, not an ad break" },
  { key: "captions", label: "Captions / subtitles", hint: "Most people watch muted", videoOnly: true },
  { key: "thumbnail", label: "Custom cover / thumbnail", hint: "Shares happen in DMs where only the cover shows" },
  { key: "pillar", label: "Tagged with a pillar", hint: "Ticks itself when a pillar is set", auto: "pillar" },
  { key: "repurpose", label: "Repurpose plan", hint: "Ticks itself once children exist", auto: "children" },
];

export function checklistFor(format: string) {
  return CHECKLIST.filter((c) => !c.videoOnly || VIDEO_FORMATS.has(format));
}

export function isChecked(key: string, piece: { checklist?: string[]; pillarId?: unknown; childCount?: number }) {
  if (key === "pillar" && piece.pillarId) return true;
  if (key === "repurpose" && (piece.childCount ?? 0) > 0) return true;
  return (piece.checklist ?? []).includes(key);
}

export function missingFor(piece: { format: string; checklist?: string[]; pillarId?: unknown; childCount?: number }) {
  return checklistFor(piece.format).filter((c) => !isChecked(c.key, piece));
}

// ─────────────────────────────────────────────────────────────────────────
// Script templates + estimate
// ─────────────────────────────────────────────────────────────────────────

export const SCRIPT_TEMPLATES: { key: string; label: string; hint: string; body: string }[] = [
  {
    key: "kw_narrative",
    label: "Kallaway · Personal narrative",
    hint: "Problem → tried → failed → what worked (hottest format now)",
    body: `## Hook — lean · but · snapback
[Context lean-in: the problem, in their words]
[But… the scroll-stop line]
[The contrarian snapback]

## The problem I had
[One specific moment]

## What I tried
[The obvious fix most people try]

## Why it failed
[But… the turn]

## What actually worked
[Your one-of-one lesson — show it]

## If you have this problem…
[Native CTA: the free resource that solves it]

## Last line (write this first)
[The memorable line that loops back to the hook]
`,
  },
  {
    key: "kw_breakdown",
    label: "Kallaway · Breakdown",
    hint: "Hook → context/shock → how it works → why it matters",
    body: `## Hook (≤4s to first value)
[Lean-in with context]
[But… interjection]
[Snapback]

## Context / shock
[The highest shock-score fact]

## What happened / how it works
[Each line answers the last question and opens the next]

## Why it matters
[The implication for THEM]

## Outro
[Last line + CTA]
`,
  },
  {
    key: "kw_youtube",
    label: "Kallaway · YouTube long-form",
    hint: "Packaging first, intro formula, second-best point first",
    body: `## Packaging (lock BEFORE scripting)
Title: [desire loop — pain / FOMO / desire]
Thumbnail: [≤3 elements, adds to the title, never repeats it]

## Intro (first 30–60s)
1. Confirm the click (~5s): [restate the title promise]
2. The common belief: [what most people think]
3. Your contrarian take: [but actually…]
4. Proof: [Trust Ladder rungs — results, demo, testimonials]
5. The plan: [what this video covers, in order]

## Point 1 — your SECOND-best point
Context → How (with examples) → Why it matters
Re-hook: [but that's not even the biggest one…]

## Point 2 — your BEST point
Context → How → Why
Re-hook: [loop opener]

## Points 3+ (descending toward a climax)

## Outro
[Recap — reality beat expectations] · [free dessert] · [native CTA to the lead magnet]
`,
  },
  {
    key: "hpipc",
    label: "Hook → Problem → Insight → Proof → CTA",
    hint: "The default for short video and posts",
    body: `## Hook (0–2s)
[The line that stops the scroll]

## Problem
[What your audience is stuck on, in their words]

## Insight
[The one idea that changes how they see it]

## Proof
[Your result, a client story, a number, a screenshot]

## CTA
[One clear next step]
`,
  },
  {
    key: "listicle",
    label: "Listicle",
    hint: "N tips, numbered, fast",
    body: `## Hook
[N] [things] that [result] (number 3 surprised me)

1. [Tip] — [why it works in one line]
2. [Tip] — [why]
3. [Tip] — [why]
4. [Tip] — [why]
5. [Tip] — [why]

## Payoff
[Which one matters most and why]

## CTA
[Save this / follow for more on X]
`,
  },
  {
    key: "story",
    label: "Story",
    hint: "Moment → tension → turn → lesson",
    body: `## Hook — drop into the moment
[Time + place + something going wrong]

## Tension
[What was at stake, what you tried]

## Turn
[The moment it changed]

## Lesson
[What you learned, framed for them]

## CTA
[Ask them about their version of this]
`,
  },
  {
    key: "tutorial",
    label: "Tutorial",
    hint: "Promise → steps → result",
    body: `## Hook — the promise
How to [result] in [time] (without [pain])

## Why it matters
[One sentence]

## Steps
1. [Step] — [detail]
2. [Step] — [detail]
3. [Step] — [detail]

## Result
[Show the after]

## CTA
[Try it / comment "X" and I'll send the template]
`,
  },
];

/** Words and a speaking-time estimate at ≈150 wpm. */
export function scriptStats(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).filter((w) => !/^#+$/.test(w)).length : 0;
  const seconds = Math.round((words / 150) * 60);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return { words, seconds, label: m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s` };
}

// ─────────────────────────────────────────────────────────────────────────
// Numbers, colours, brand
// ─────────────────────────────────────────────────────────────────────────

export function fmtNum(n?: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

export const fmtRatio = (r: number) => `×${r >= 10 ? Math.round(r) : r.toFixed(1)}`;

export function ratioTone(r?: number | null): "success" | "warning" | "muted" {
  if (r == null) return "muted";
  if (r >= 1.2) return "success";
  if (r <= 0.7) return "warning";
  return "muted";
}

export const PILLAR_SWATCHES = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];

/** Pillar colour: a chart token key ("chart-3"), any css colour, or a stable fallback. */
export function pillarColor(p?: { color?: string; order?: number } | null, i = 0): string {
  if (p?.color) return p.color.startsWith("chart-") ? `var(--${p.color})` : p.color;
  return `var(--chart-${(((p?.order ?? i) % 5) + 5) % 5 + 1})`;
}

export const BRAND_META: Record<Brand, { label: string; icon: LucideIcon; color: string }> = {
  personal: { label: "Personal", icon: User, color: "var(--chart-1)" },
  company: { label: "Company", icon: Building2, color: "var(--chart-2)" },
};

export const matchesBrand = (f: BrandFilter, b?: Brand | null) => f === "both" || !b || b === f;

const BRAND_KEY = "bishos.content.brand";

/** Global Both / Personal / Company filter, remembered per browser. */
export function useBrandFilter(): [BrandFilter, (b: BrandFilter) => void] {
  const [brand, setBrand] = useState<BrandFilter>("both");
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(BRAND_KEY);
      if (v === "personal" || v === "company" || v === "both") setBrand(v);
    } catch {
      /* storage blocked: keep default */
    }
  }, []);
  const set = useCallback((b: BrandFilter) => {
    setBrand(b);
    try {
      window.localStorage.setItem(BRAND_KEY, b);
    } catch {
      /* ignore */
    }
  }, []);
  return [brand, set];
}

/** Human message for a Convex/AI error. */
export function errMsg(e: unknown): string {
  if (e instanceof ConvexError) return typeof e.data === "string" ? e.data : "Something went wrong.";
  if (e instanceof Error) {
    const m = /Uncaught (?:Convex)?Error: ([^\n]+)/.exec(e.message);
    return (m?.[1] ?? e.message).slice(0, 200);
  }
  return "Something went wrong.";
}

export const IDEA_GOAL = 100;

export const IDEA_SPARKS: string[] = [
  "A question a client asked this week:",
  "An objection from a sales call:",
  "A mistake I made and what it cost:",
  "Something I learned (TIL):",
  "A myth in my industry:",
  "Behind the scenes of what we're building:",
  "A result we got and how:",
  "An opinion most founders won't say out loud:",
];
