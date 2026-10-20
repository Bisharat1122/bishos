/**
 * Shared helpers for the strategy screens (Founder HQ, Scorecard, Offers,
 * Campaigns, Decisions). Client-side only; no React.
 */
import type { MeterTone, Tone } from "@/components/os/kit";
import { addDaysYmd, dateOf, mondayOf, relDay } from "@/lib/day";

// ── Week windows (see convex/scorecard.ts for the contract) ──────────────
export type WeekWin = { weekStart: string; from: number; to: number };

/** The local week containing `today`: Monday + epoch-ms bounds (DST-correct). */
export function weekWindow(today: string): WeekWin {
  const weekStart = mondayOf(today);
  return { weekStart, from: dateOf(weekStart).getTime(), to: dateOf(addDaysYmd(weekStart, 7)).getTime() };
}

/** `n` local weeks ending with the week of `today`, oldest → newest. */
export function weekWindows(today: string, n = 13): WeekWin[] {
  const current = mondayOf(today);
  return Array.from({ length: n }, (_, i) => {
    const ws = addDaysYmd(current, -7 * (n - 1 - i));
    return { weekStart: ws, from: dateOf(ws).getTime(), to: dateOf(addDaysYmd(ws, 7)).getTime() };
  });
}

// ── Formatting ───────────────────────────────────────────────────────────
export function fmtMoney(n: number | null | undefined, currency = "USD", opts: { compact?: boolean } = {}): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const compact = opts.compact ?? Math.abs(n) >= 100_000;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: compact ? 1 : 0,
      notation: compact ? "compact" : "standard",
    }).format(n);
  } catch {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0, notation: compact ? "compact" : "standard" }).format(n)} ${currency}`;
  }
}

export function fmtNum(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(n);
}

const MONEY_UNITS = new Set(["usd", "eur", "gbp", "pkr", "inr", "aed", "cad", "aud", "$", "€", "£"]);
/** Format a metric value with its unit (currency codes → money). */
export function fmtMetric(n: number | null | undefined, unit: string | undefined, currency: string): string {
  if (n == null) return "—";
  const u = (unit ?? "").trim();
  if (u && (u.toUpperCase() === currency.toUpperCase() || MONEY_UNITS.has(u.toLowerCase()))) {
    return fmtMoney(n, /^[A-Za-z]{3}$/.test(u) ? u.toUpperCase() : currency, { compact: Math.abs(n) >= 10_000 });
  }
  if (u === "h") return `${fmtNum(n)}h`;
  if (u === "%") return `${fmtNum(n)}%`;
  return fmtNum(n);
}

/** The unit to print after a number, unless fmtMetric already shows it (h, %, money). */
export function unitSuffix(unit: string | undefined, currency: string): string {
  const u = (unit ?? "").trim();
  if (!u || u === "h" || u === "%") return "";
  if (u.toUpperCase() === currency.toUpperCase() || MONEY_UNITS.has(u.toLowerCase())) return "";
  return u;
}

export const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

// ── Scorecard ────────────────────────────────────────────────────────────
export const AUTO_META: Record<string, { label: string; hint: string; unit: string; suggest: string; target: number }> = {
  outreach: { label: "Outreach touches", hint: "Interactions logged as outreach or follow-up", unit: "touches", suggest: "Outreach touches", target: 100 },
  meetings: { label: "Sales conversations", hint: "Interactions logged as a call or meeting", unit: "calls", suggest: "Sales conversations", target: 5 },
  deals_won: { label: "Deals won", hint: "Deals moved to Won (by close date)", unit: "deals", suggest: "Deals won", target: 1 },
  revenue: { label: "Won revenue", hint: "Sum of the value of deals won that week", unit: "", suggest: "Won revenue", target: 1000 },
  revenue_cash: { label: "Cash collected", hint: "Business income logged in Finance that week", unit: "", suggest: "Cash collected", target: 1000 },
  content_published: { label: "Content published", hint: "Content pieces published that week", unit: "pieces", suggest: "Content published", target: 5 },
  focus_hours: { label: "Deep work hours", hint: "Focus session time ending that week", unit: "h", suggest: "Deep work hours", target: 15 },
  tasks_done: { label: "Tasks completed", hint: "Tasks marked done that week", unit: "tasks", suggest: "Tasks completed", target: 25 },
  recall_reviews: { label: "Recall reviews", hint: "Recall cards reviewed that week", unit: "cards", suggest: "Recall reviews", target: 50 },
};

export function onTrack(value: number, target: number, direction: "up" | "down") {
  return direction === "up" ? value >= target : value <= target;
}

// ── Offers ───────────────────────────────────────────────────────────────
export type Scores = { dream: number; likelihood: number; time: number; effort: number };
export const DEFAULT_SCORES: Scores = { dream: 5, likelihood: 5, time: 5, effort: 5 };

/** (dream × likelihood) ÷ (time × effort) — 0.01 … 100. */
export function valueRaw(s: Scores) {
  return (s.dream * s.likelihood) / (s.time * s.effort);
}
/** Log-normalised 0–100 (neutral 5/5/5/5 → 50). Mirrors convex/offers.ts. */
export function valueScore(s: Scores | undefined) {
  const raw = valueRaw(s ?? DEFAULT_SCORES);
  return Math.round(Math.max(0, Math.min(100, ((Math.log10(raw) + 2) / 4) * 100)));
}
export function scoreTone(score: number): MeterTone {
  if (score >= 70) return "success";
  if (score >= 50) return "primary";
  if (score >= 35) return "warning";
  return "danger";
}
export function scoreLabel(score: number) {
  if (score >= 80) return "Irresistible";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Promising";
  if (score >= 40) return "Average";
  return "Weak";
}

export const OFFER_STATUS: Record<"draft" | "testing" | "live" | "retired", { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "muted" },
  testing: { label: "Testing", tone: "info" },
  live: { label: "Live", tone: "success" },
  retired: { label: "Retired", tone: "outline" },
};

export const PRICING_MODELS = [
  "One-time",
  "Per project",
  "Monthly retainer",
  "Subscription",
  "Per seat",
  "Performance-based",
  "Payment plan",
  "Custom",
];

// ── Campaigns ────────────────────────────────────────────────────────────
export const CHANNELS = [
  "LinkedIn",
  "Instagram",
  "TikTok",
  "YouTube",
  "X",
  "Email",
  "Ads",
  "Events",
  "Partnerships",
  "Cold outreach",
];

export type CampaignStatus = "idea" | "planned" | "live" | "paused" | "done";
export const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; tone: Tone; dot: string }> = {
  idea: { label: "Idea", tone: "muted", dot: "var(--muted-foreground)" },
  planned: { label: "Planned", tone: "info", dot: "var(--info)" },
  live: { label: "Live", tone: "success", dot: "var(--success)" },
  paused: { label: "Paused", tone: "warning", dot: "var(--warning)" },
  done: { label: "Done", tone: "outline", dot: "var(--chart-4)" },
};

// ── Deals ────────────────────────────────────────────────────────────────
export const STAGE_LABEL: Record<string, string> = {
  target: "Target",
  contacted: "Contacted",
  booked: "Booked",
  discovery: "Discovery",
  proposal: "Proposal",
  verbal: "Verbal yes",
  won: "Won",
  lost: "Lost",
  unqualified: "Unqualified",
};

export const CONTENT_STAGE_LABEL: Record<string, string> = {
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

// ── Issues & decisions ───────────────────────────────────────────────────
export const PRIORITY_META: Record<number, { label: string; tone: Tone }> = {
  1: { label: "P1", tone: "danger" },
  2: { label: "P2", tone: "warning" },
  3: { label: "P3", tone: "muted" },
};

export const DECISION_STATES = ["Rested", "Tired", "Calm", "Stressed", "Excited", "Rushed", "Anxious", "Focused"];

/**
 * Relative day for mid-sentence use ("Review today", "Review Monday",
 * "Review Nov 3"): only the relative words are lower-cased, never dates or weekdays.
 */
export function relDayInline(ymd: string, today: string): string {
  const r = relDay(ymd, today);
  return r === "Today" || r === "Tomorrow" || r === "Yesterday" ? r.toLowerCase() : r;
}
