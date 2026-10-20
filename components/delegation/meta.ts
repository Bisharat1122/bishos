import { BatteryLow, Minus, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Quadrant = "production" | "investment" | "replacement" | "delegation";
export type Energy = "energizing" | "neutral" | "draining";
export type Rung = "admin" | "delivery" | "marketing" | "sales" | "leadership";
export type ProcStatus = "draft" | "documented" | "delegated";

/** DRIP (Buy Back Your Time). Colours are categorical chart tokens. */
export const QUADRANTS: Record<Quadrant, { label: string; short: string; hint: string; action: string; color: string }> = {
  production: {
    label: "Production",
    short: "High $ · energizing",
    hint: "Your zone of genius — the work only you should do.",
    action: "Protect and expand it",
    color: "var(--chart-1)",
  },
  replacement: {
    label: "Replacement",
    short: "High $ · draining",
    hint: "Valuable, but it drains you.",
    action: "Document it, then train someone to replace you",
    color: "var(--chart-3)",
  },
  investment: {
    label: "Investment",
    short: "Low $ · energizing",
    hint: "Learning, strategy and health that pay off later.",
    action: "Keep it, on purpose",
    color: "var(--chart-2)",
  },
  delegation: {
    label: "Delegation",
    short: "Low $ · draining",
    hint: "Costs you energy and earns little.",
    action: "Hand these off first",
    color: "var(--chart-4)",
  },
};

export const quadrantOf = (value: number, energy: Energy): Quadrant => {
  const high = value >= 3;
  const energizing = energy !== "draining";
  return high ? (energizing ? "production" : "replacement") : energizing ? "investment" : "delegation";
};

export const ENERGY: Record<Energy, { label: string; icon: LucideIcon; cls: string }> = {
  energizing: { label: "Energizing", icon: Zap, cls: "text-success" },
  neutral: { label: "Neutral", icon: Minus, cls: "text-muted-foreground" },
  draining: { label: "Draining", icon: BatteryLow, cls: "text-warning" },
};

export const VALUE_LABEL = ["", "$", "$$", "$$$", "$$$$"];
export const VALUE_HINT = ["", "≈ minimum wage", "≈ assistant rate", "≈ skilled pro", "≈ founder-only"];

/** Replacement Ladder — hand off in this order. */
export const RUNGS: { key: Rung; label: string; desc: string }[] = [
  { key: "admin", label: "Admin", desc: "Inbox, calendar, invoices, bookkeeping, travel" },
  { key: "delivery", label: "Delivery", desc: "Client onboarding, kickoff, milestones, handover" },
  { key: "marketing", label: "Marketing", desc: "Content production, posting, campaigns, design" },
  { key: "sales", label: "Sales", desc: "Prospecting, follow-ups, proposals, lead-to-close" },
  { key: "leadership", label: "Leadership", desc: "Hiring, strategy, vision — the last rung" },
];
export const RUNG_LABEL: Record<Rung, string> = Object.fromEntries(RUNGS.map((r) => [r.key, r.label])) as Record<Rung, string>;

export const STATUS_META: Record<ProcStatus, { label: string; tone: "muted" | "info" | "success" }> = {
  draft: { label: "Draft", tone: "muted" },
  documented: { label: "Documented", tone: "info" },
  delegated: { label: "Delegated", tone: "success" },
};

/** Only http(s) links are rendered as anchors. */
export const safeUrl = (u?: string | null) => (u && /^https?:\/\//i.test(u.trim()) ? u.trim() : null);
