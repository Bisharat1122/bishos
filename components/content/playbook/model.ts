/**
 * Kallaway Playbook — derived state for the guided program (canvas
 * completeness, section progress, size tiers, copy helpers). The frameworks
 * themselves live in lib/kallaway.ts; this file only scores the user's data
 * against them.
 */
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { BRICKS, CONTENT_GAMES, GROWTH_SYSTEM, LAB_TOTAL, PLAN_321 } from "@/lib/kallaway";
import type { Brand } from "../model";

export type Strategy = Doc<"contentStrategy">;
export type StrategyPatch = Omit<FunctionArgs<typeof api.contentSystem.saveStrategy>, "brand">;
export type Progress = FunctionReturnType<typeof api.contentSystem.progress>[number];
export type Lab = NonNullable<Progress["lab"]>;
export type LongForm = NonNullable<Progress["longForm"]>;
export type IterRow = FunctionReturnType<typeof api.contentSystem.iteration>[number];
export type Creator = FunctionReturnType<typeof api.contentSystem.watchlist>[number];

export const SHORT_FORMATS = new Set(["short_video", "story"]);

/** Research filters (channel_frameworks §5.2–5.3). */
export const OUTLIER_BAR = 5;
export const WATCH_MIN = 20;
export const WATCH_MAX = 30;
export const FORMULAS_MIN = 5;
export const FORMULAS_MAX = 10;
export const TAKES_MIN = 3;
export const TAKES_MAX = 5;
export const LONG_WEEKS = 50;
export const QUIT_ZONE = [10, 30] as const;

/** The KPI each game is scored on (o_n5ED5fE1I + podcast §4). */
export const GAME_KPI: Record<string, string> = {
  entertainment: "views",
  education_media: "followers",
  commodity_product: "conversions",
  explained_product: "conversions",
  authority: "emails",
};

/** Suggested game per brand: founder → Authority; company → #4 or #5 (B2B). */
export const SUGGESTED_GAMES: Record<Brand, string[]> = {
  personal: ["authority"],
  company: ["explained_product", "authority"],
};

export const gameOf = (key?: string) => CONTENT_GAMES.find((g) => g.key === key);
export const brickLabel = (key: string) => BRICKS.find((b) => b.key === key)?.label ?? key.replace(/[_-]/g, " ");

/** "1.2m" / "80k" / "12,000" → number. */
export function parseCount(s: string): number | undefined {
  const m = /^(\d+(?:\.\d+)?)([km])?$/i.exec(s.replace(/[, ]/g, "").trim());
  if (!m) return undefined;
  const mult = m[2]?.toLowerCase() === "k" ? 1000 : m[2]?.toLowerCase() === "m" ? 1_000_000 : 1;
  return Math.round(Number(m[1]) * mult);
}

export function compact(n?: number | null): string {
  if (n == null) return "—";
  return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

// ─────────────────────────────────────────────────────────────────────────
// Creator size tiers ("Kallaway's paradox": ignore >1M)
// ─────────────────────────────────────────────────────────────────────────

export type Tier = { key: string; label: string; tone: "outline" | "warning" | "muted"; hint: string; inRange: boolean };

export function tierOf(followers?: number): Tier {
  if (followers == null) return { key: "unknown", label: "Size?", tone: "muted", hint: "Add their follower count", inRange: false };
  if (followers < 10_000) return { key: "tiny", label: "Under 10K", tone: "muted", hint: "Tiny sample: breakouts are noisy", inRange: false };
  if (followers < 50_000) return { key: "micro", label: "Micro", tone: "outline", hint: "10–50K: a breakout here means the idea won", inRange: true };
  if (followers < 250_000) return { key: "small", label: "Small", tone: "outline", hint: "50–250K: the sweet spot", inRange: true };
  if (followers <= 1_000_000) return { key: "medium", label: "Medium", tone: "outline", hint: "250K–1M: still a clean signal", inRange: true };
  return { key: "big", label: "Over 1M", tone: "warning", hint: "Ignore: brand equity props up their duds", inRange: false };
}

// ─────────────────────────────────────────────────────────────────────────
// Positioning canvas completeness
// ─────────────────────────────────────────────────────────────────────────

export type CanvasItem = { key: string; label: string; done: boolean };

const filled = (s?: string) => !!s && s.trim().length > 0;
const count = (a?: string[]) => (a ?? []).filter((x) => x.trim()).length;

export function canvasItems(st: Strategy | null | undefined): CanvasItem[] {
  const u = st?.uniqueness ?? {};
  const axes = [u.topic, u.substance, u.avatar, u.format, u.visuals].filter(filled).length;
  return [
    { key: "game", label: "Content game", done: filled(st?.game) },
    { key: "kpi", label: "KPI", done: filled(st?.kpi) },
    { key: "authority", label: "Authority statement", done: filled(st?.authorityStatement) },
    { key: "avatar", label: "Audience of one", done: filled(st?.avatar) },
    { key: "pains", label: "Max-pain steps", done: count(st?.pains) >= 1 },
    { key: "bullseye", label: "Niche bullseye (2+ rings)", done: count(st?.bullseye) >= 2 },
    { key: "takes", label: `Contrarian vault (${TAKES_MIN}+)`, done: count(st?.contrarianTakes) >= TAKES_MIN },
    { key: "terms", label: "Terms to own", done: count(st?.terms) >= 1 },
    { key: "objects", label: "Signature objects", done: count(st?.objects) >= 1 },
    { key: "uniqueness", label: "Uniqueness (3+ axes)", done: axes >= 3 },
    { key: "hero", label: "Hero platform", done: filled(st?.heroPlatform) },
    { key: "magnet", label: "Lead magnet", done: filled(st?.leadMagnet) && filled(st?.leadMagnetType) },
    { key: "formulas", label: `Content formulas (${FORMULAS_MIN}+)`, done: (st?.formulas ?? []).filter((f) => f.status !== "retired").length >= FORMULAS_MIN },
    { key: "pyramid", label: "Where you play", done: filled(st?.pyramidLevel) && (st?.standOut ?? []).length > 0 },
    { key: "plan321", label: "3-2-1 buckets", done: namedBuckets(st) >= PLAN_321.buckets.length },
  ];
}

/** 3-2-1 bucket slots: stable ids so pieces' `kw.bucketId` keeps pointing at the right slot. */
export const BUCKET_SLOTS = PLAN_321.buckets.map((b, i) => ({ ...b, id: i === 0 ? "broad-1" : `narrow-${i}` }));
export const CHAOS_ID = "chaos";

export function namedBuckets(st: Strategy | null | undefined) {
  return (st?.buckets ?? []).filter((b) => b.name.trim()).length;
}

// ─────────────────────────────────────────────────────────────────────────
// Growth system spine (podcast 2 §9) — which steps are done, and where they live
// ─────────────────────────────────────────────────────────────────────────

export type GrowthStep = (typeof GROWTH_SYSTEM)[number] & { n: number; done: boolean; anchor: string; section: "position" | "data" | "loop" };

const GROWTH_WHERE: Record<string, { anchor: string; section: GrowthStep["section"] }> = {
  interview: { anchor: "pb-interview", section: "position" },
  watchlist: { anchor: "pb-watchlist", section: "data" },
  wheel: { anchor: "pb-wheel", section: "position" },
  bullseye: { anchor: "pb-bullseye", section: "position" },
  plan321: { anchor: "pb-plan321", section: "position" },
  scanner: { anchor: "pb-scanner", section: "data" },
  matrix: { anchor: "pb-matrix", section: "position" },
  write: { anchor: "pb-loop", section: "loop" },
};

export function growthSteps(input: { st: Strategy | null; creators: number; outliers5: number; reps: number }): GrowthStep[] {
  const c = canvasItems(input.st);
  const has = (k: string) => c.find((i) => i.key === k)?.done ?? false;
  const done: Record<string, boolean> = {
    interview: has("avatar") && has("pains"),
    watchlist: input.creators >= 10,
    wheel: has("uniqueness"),
    bullseye: has("bullseye"),
    plan321: has("plan321"),
    scanner: input.outliers5 >= 5,
    matrix: has("formulas"),
    write: input.reps >= 1,
  };
  return GROWTH_SYSTEM.map((g, i) => ({ ...g, n: i + 1, done: !!done[g.key], ...(GROWTH_WHERE[g.key] ?? { anchor: "pb-position", section: "position" as const }) }));
}

// ─────────────────────────────────────────────────────────────────────────
// Section scoring
// ─────────────────────────────────────────────────────────────────────────

export type SectionKey = "loop" | "position" | "data" | "lab" | "long" | "iterate" | "convert";

export type SectionState = { key: SectionKey; n: number; title: string; short: string; phase: string; pct: number; done: boolean; summary: string };

const pct = (x: number) => Math.round(Math.max(0, Math.min(1, x)) * 100);

export function scoreSections(input: {
  st: Strategy | null;
  prog: Progress;
  rows: IterRow[];
  creators: Creator[];
  outliers5: number;
  bricked: number;
}): SectionState[] {
  const { st, prog, rows, creators, outliers5, bricked } = input;
  const reps = prog.reps;

  const canvas = canvasItems(st);
  const canvasDone = canvas.filter((c) => c.done).length;

  const dataParts = [Math.min(1, creators.length / WATCH_MIN), Math.min(1, outliers5 / 10), Math.min(1, bricked / 3)];
  const dataPct = pct(dataParts.reduce((a, b) => a + b, 0) / dataParts.length);

  const lab = prog.lab;
  const lf = prog.longForm;

  const reviewed = rows.filter((r) => r.hasNumbers && (r.weakBricks.length > 0 || !!r.nextFix?.trim())).length;

  const convertItems = [
    filled(st?.leadMagnet) && filled(st?.leadMagnetType),
    st?.kpi === "emails" || st?.kpi === "dollars_per_view" || st?.kpi === "conversions",
    rows.some((r) => (r.leads ?? 0) > 0),
  ];
  const convertDone = convertItems.filter(Boolean).length;

  return [
    {
      key: "loop",
      n: 1,
      title: "The loop",
      short: "Loop",
      phase: "Every rep",
      pct: pct(reps / QUIT_ZONE[1]),
      done: reps >= QUIT_ZONE[1],
      summary:
        reps === 0
          ? "Your first rep starts the loop"
          : reps < QUIT_ZONE[0]
            ? `${reps} rep${reps === 1 ? "" : "s"} · warming up`
            : reps <= QUIT_ZONE[1]
              ? `${reps} reps · quit-point zone, keep going`
              : `${reps} reps · past the quit point`,
    },
    {
      key: "position",
      n: 2,
      title: "Positioning",
      short: "Position",
      phase: "Days 1–3",
      pct: pct(canvasDone / canvas.length),
      done: canvasDone === canvas.length,
      summary: `${canvasDone}/${canvas.length} canvas items`,
    },
    {
      key: "data",
      n: 3,
      title: "Data system",
      short: "Data",
      phase: "Week 1",
      pct: dataPct,
      done: dataPct >= 100,
      summary: `${creators.length}/${WATCH_MIN}–${WATCH_MAX} creators · ${outliers5} outliers ≥${OUTLIER_BAR}×`,
    },
    {
      key: "lab",
      n: 4,
      title: "The 60-day lab",
      short: "Lab",
      phase: "Days 1–60",
      pct: lab ? pct(lab.total / LAB_TOTAL) : 0,
      done: !!lab && lab.total >= LAB_TOTAL,
      summary: !lab
        ? "Not started"
        : lab.week < 1
          ? "Starts Monday"
          : lab.finished
            ? `Finished · ${lab.total}/${LAB_TOTAL} reps`
            : `Week ${lab.week} · ${lab.thisWeekDone}/${lab.thisWeekTarget} this week · ${lab.total}/${LAB_TOTAL}`,
    },
    {
      key: "long",
      n: 5,
      title: "YouTube long-form",
      short: "YouTube",
      phase: "Weekly · 50 weeks",
      pct: lf ? pct(lf.shipped / LONG_WEEKS) : 0,
      done: !!lf && lf.shipped >= LONG_WEEKS,
      summary: !lf ? "Not started" : `${lf.shipped}/${LONG_WEEKS} weeks · streak ${lf.streak}${lf.thisWeek ? " · shipped this week" : ""}`,
    },
    {
      key: "iterate",
      n: 6,
      title: "Iterate",
      short: "Iterate",
      phase: "After every rep",
      pct: pct(reviewed / 5),
      done: reviewed >= 5,
      summary: rows.length ? `${reviewed} of the last ${rows.length} reps reviewed` : "No published reps yet",
    },
    {
      key: "convert",
      n: 7,
      title: "Convert",
      short: "Convert",
      phase: "Always on",
      pct: pct(convertDone / convertItems.length),
      done: convertDone === convertItems.length,
      summary: `${convertDone}/${convertItems.length} funnel basics in place`,
    },
  ];
}

/** Encouraging one-liner for the lab card. */
export function labMessage(lab: Lab | null): { tone: "success" | "info" | "warning" | "muted"; text: string } {
  if (!lab) return { tone: "muted", text: "Start on a Monday. Week 1 is only 3 reps." };
  if (lab.week < 1) return { tone: "info", text: "Your lab starts Monday. Bank 2–3 scripts now so week 1 is easy." };
  if (lab.finished) {
    return lab.total >= LAB_TOTAL
      ? { tone: "success", text: `Lab complete: ${lab.total} reps. Phase 2: double down on the formulas that pass all 4 tests.` }
      : { tone: "info", text: `Lab window closed at ${lab.total}/${LAB_TOTAL} reps. Restart it, or keep shipping and move to phase 2.` };
  }
  const left = Math.max(0, lab.thisWeekTarget - lab.thisWeekDone);
  if (lab.total >= QUIT_ZONE[0] && lab.total <= QUIT_ZONE[1] && left > 0)
    return { tone: "warning", text: `${lab.total} reps in: the quit-point zone. This is exactly where most people stop. ${left} more this week.` };
  if (left === 0) return { tone: "success", text: `Week ${lab.week} target hit. Rest, or bank a buffer for next week.` };
  if (lab.thisWeekDone === 0) return { tone: "info", text: `Week ${lab.week}: ${lab.thisWeekTarget} reps to ship. One at a time, iterate between each.` };
  return { tone: "info", text: `${left} to go this week. Fix one weak brick from your last rep.` };
}
