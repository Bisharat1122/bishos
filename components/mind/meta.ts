"use client";

import { ConvexError } from "convex/values";

/**
 * Mind module vocabulary: note types, statuses, skill statuses, resource
 * formats and practice kinds — labels, hints, icons and token colours.
 */
import { useRef } from "react";
import {
  BookOpen,
  CalendarDays,
  FileText,
  FolderKanban,
  Headphones,
  Lightbulb,
  Map as MapIcon,
  MonitorPlay,
  Newspaper,
  GraduationCap,
  Wrench,
  Zap,
  Package,
  ScrollText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Tone } from "@/components/os/kit";
import { useCoarseNow } from "@/components/os/useCockpit";

export type NoteType = "fleeting" | "source" | "idea" | "map" | "project" | "daily";
export type NoteStatus = "inbox" | "processed" | "evergreen";

export const NOTE_TYPES: { value: NoteType; label: string; hint: string; tone: Tone; icon: LucideIcon }[] = [
  { value: "fleeting", label: "Fleeting", hint: "A quick capture. Process it within 48h or let it go.", tone: "warning", icon: Zap },
  { value: "source", label: "Source", hint: "Notes on a book, video or article, in your own words.", tone: "info", icon: BookOpen },
  { value: "idea", label: "Idea", hint: "One idea per note, written in your own words.", tone: "success", icon: Lightbulb },
  { value: "map", label: "Map", hint: "A hub that links related notes (Map of Content).", tone: "sprint", icon: MapIcon },
  { value: "project", label: "Project", hint: "Working notes for a project.", tone: "accent", icon: FolderKanban },
  { value: "daily", label: "Daily", hint: "A day log.", tone: "muted", icon: CalendarDays },
];

export const noteTypeOf = (n: { noteType?: NoteType | null }): NoteType => n.noteType ?? "idea";
export const noteTypeMeta = (t: NoteType) => NOTE_TYPES.find((x) => x.value === t) ?? NOTE_TYPES[2];

export const NOTE_STATUSES: { value: NoteStatus; label: string; hint: string; tone: Tone }[] = [
  { value: "inbox", label: "Inbox", hint: "Not processed yet", tone: "warning" },
  { value: "processed", label: "Processed", hint: "In your own words, linked", tone: "info" },
  { value: "evergreen", label: "Evergreen", hint: "Mature, reused often", tone: "success" },
];

export type SkillStatus = "todo" | "learning" | "practicing" | "solid";
export const SKILL_STATUSES: { value: SkillStatus; label: string; tone: Tone; color: string }[] = [
  { value: "todo", label: "To learn", tone: "muted", color: "var(--muted-foreground)" },
  { value: "learning", label: "Learning", tone: "info", color: "var(--info)" },
  { value: "practicing", label: "Practicing", tone: "warning", color: "var(--warning)" },
  { value: "solid", label: "Solid", tone: "success", color: "var(--success)" },
];
export const skillMeta = (s: SkillStatus) => SKILL_STATUSES.find((x) => x.value === s) ?? SKILL_STATUSES[0];
export const nextSkillStatus = (s: SkillStatus): SkillStatus =>
  SKILL_STATUSES[(SKILL_STATUSES.findIndex((x) => x.value === s) + 1) % SKILL_STATUSES.length].value;

export const RESOURCE_FORMATS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "book", label: "Book", icon: BookOpen },
  { value: "course", label: "Course", icon: GraduationCap },
  { value: "video", label: "Video", icon: MonitorPlay },
  { value: "article", label: "Article", icon: Newspaper },
  { value: "podcast", label: "Podcast", icon: Headphones },
  { value: "paper", label: "Paper", icon: ScrollText },
  { value: "tool", label: "Tool", icon: Wrench },
  { value: "other", label: "Other", icon: Package },
];
export const formatMeta = (f: string) => RESOURCE_FORMATS.find((x) => x.value === f) ?? { value: f, label: f || "Other", icon: FileText };

export type ResourceStatus = "queued" | "active" | "done" | "dropped";
export const RESOURCE_STATUSES: { value: ResourceStatus; label: string; hint: string; tone: Tone; dot: string }[] = [
  { value: "queued", label: "Queued", hint: "Saved with a reason", tone: "muted", dot: "var(--muted-foreground)" },
  { value: "active", label: "Active", hint: "Keep 1–2 per area", tone: "info", dot: "var(--info)" },
  { value: "done", label: "Done", hint: "Takeaways → recall cards", tone: "success", dot: "var(--success)" },
  { value: "dropped", label: "Dropped", hint: "Let go, guilt-free", tone: "outline", dot: "var(--border)" },
];

export type PracticeKind = "study" | "practice" | "project" | "recall" | "teach";
export const PRACTICE_KINDS: { value: PracticeKind; label: string; hint: string }[] = [
  { value: "practice", label: "Practice", hint: "Drill the skill directly — the highest-value minutes." },
  { value: "project", label: "Project", hint: "Do the real thing (ship, record, pitch)." },
  { value: "study", label: "Study", hint: "Read, watch, take notes in your own words." },
  { value: "recall", label: "Recall", hint: "Test yourself from memory." },
  { value: "teach", label: "Teach", hint: "Explain it simply (Feynman) — find where you stall." },
];

export const CARD_STATES: Record<string, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "info" },
  learning: { label: "Learning", tone: "warning" },
  relearning: { label: "Relearning", tone: "warning" },
  review: { label: "Review", tone: "success" },
};

/** Pick the life area that looks like "learning / content". */
export function learningLifeArea<T extends { _id: string; name: string }>(areas: T[] | undefined): T | undefined {
  return areas?.find((a) => /learn|content/i.test(a.name));
}

/**
 * Keep the last loaded query result while new args load. Convex `useQuery`
 * returns undefined whenever args change (e.g. the minute-rounded `now`), which
 * would otherwise flash skeletons every minute. `key` resets it (e.g. route id).
 */
export function useStable<T>(value: T | undefined, key = ""): T | undefined {
  const ref = useRef<{ key: string; value: T | undefined }>({ key, value });
  if (ref.current.key !== key) ref.current = { key, value: undefined };
  if (value !== undefined) ref.current.value = value;
  return value !== undefined ? value : ref.current.value;
}

/**
 * Current time rounded to the minute (stable query args). Delegates to the
 * shared, boundary-aligned clock so every page — and the background Warmup
 * (`useCoarseNow(60_000)`) — sends the SAME `now` and shares one cached
 * subscription instead of drifting by up to a minute.
 */
export function useMinuteNow(): number {
  return useCoarseNow(60_000);
}

/** Local midnight (ms) for today. */
export function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "due now" / "in 3d" / "2d overdue" for a timestamp. */
export function dueLabel(due: number, now: number): string {
  const diff = due - now;
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60_000);
  const fmt = min < 60 ? `${Math.max(1, min)}m` : min < 60 * 20 ? `${Math.round(min / 60)}h` : `${Math.round(abs / 86_400_000)}d`;
  if (diff <= 0) return min < 1 ? "due now" : `due ${fmt} ago`;
  return `in ${fmt}`;
}

/** Is the keyboard event coming from a text field? (page-scoped shortcuts skip these) */
export function isTypingTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}

export function errMsg(e: unknown, fallback = "Something went wrong."): string {
  if (e instanceof ConvexError) return typeof e.data === "string" ? e.data : fallback;
  const m = e instanceof Error ? e.message : String(e ?? "");
  // Convex wraps server errors: "[CONVEX M(x)] [Request ID: …] Server Error Uncaught Error: msg at handler …"
  const cleaned = m.replace(/^[\s\S]*?Uncaught (?:ConvexError|Error):\s*/, "").replace(/\s+at\s+[\s\S]*$/, "").trim();
  return cleaned || fallback;
}
