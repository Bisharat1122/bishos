/**
 * B1 · Sales & relationships — shared labels, tones and formatters.
 * Colour is used for meaning only (tokens): chart-1..5 for stage categories,
 * success/warning/info for state. Works in light and dark.
 */
import { ConvexError } from "convex/values";
import type { LucideIcon } from "lucide-react";
import { Send, Reply, Phone, Users, Mail, MessageCircle, StickyNote } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import type { Tone } from "@/components/os/kit";

export type Stage = Doc<"deals">["stage"];
export type Relation = Doc<"people">["relation"];
export type Tier = NonNullable<Doc<"people">["tier"]>;
export type CompanyRel = Doc<"companies">["relationship"];
export type Health = NonNullable<Doc<"companies">["health"]>;
export type TouchKind = Doc<"interactions">["kind"];
export type Direction = Doc<"commitments">["direction"];
export type CommitmentStatus = Doc<"commitments">["status"];

export const OPEN_STAGES: Stage[] = ["target", "contacted", "booked", "discovery", "proposal", "verbal"];
export const CLOSED_STAGES: Stage[] = ["won", "lost", "unqualified"];
export const isOpenStage = (s: Stage) => OPEN_STAGES.includes(s);

export const STAGE_META: Record<Stage, { label: string; short: string; hint: string; dot: string; tone: Tone; nextStep: string }> = {
  target: { label: "Target", short: "Target", hint: "Researched, not contacted yet", dot: "var(--muted-foreground)", tone: "muted", nextStep: "Send the first message" },
  contacted: { label: "Contacted", short: "Contacted", hint: "Reached out, waiting on a reply", dot: "var(--chart-1)", tone: "info", nextStep: "Follow up" },
  booked: { label: "Conversation booked", short: "Booked", hint: "A call is on the calendar", dot: "var(--chart-2)", tone: "info", nextStep: "Run the discovery call" },
  discovery: { label: "Discovery done", short: "Discovery", hint: "Pain, budget and decision-maker confirmed", dot: "var(--chart-3)", tone: "info", nextStep: "Send the proposal" },
  proposal: { label: "Proposal sent", short: "Proposal", hint: "Proposal is with them", dot: "var(--chart-4)", tone: "sprint", nextStep: "Follow up on the proposal" },
  verbal: { label: "Verbal yes", short: "Verbal", hint: "They said yes: get it signed", dot: "var(--chart-5)", tone: "success", nextStep: "Send contract + invoice" },
  won: { label: "Won", short: "Won", hint: "Signed and paid", dot: "var(--success)", tone: "success", nextStep: "" },
  lost: { label: "Lost", short: "Lost", hint: "Not this time: nurture", dot: "var(--muted-foreground)", tone: "muted", nextStep: "" },
  unqualified: { label: "Unqualified", short: "Unqualified", hint: "Not a fit", dot: "var(--muted-foreground)", tone: "muted", nextStep: "" },
};

export const LOST_REASONS = ["No budget", "Bad timing", "Chose a competitor", "No decision", "Not a fit", "Went quiet"];

export const SOURCE_CHANNELS: { value: string; label: string }[] = [
  { value: "outbound", label: "Outbound" },
  { value: "inbound", label: "Inbound" },
  { value: "referral", label: "Referral" },
  { value: "content", label: "Content" },
  { value: "network", label: "Network" },
  { value: "event", label: "Event" },
  { value: "ads", label: "Ads" },
  { value: "other", label: "Other" },
];

export const RELATIONS: { value: Relation; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "customer", label: "Customer" },
  { value: "partner", label: "Partner" },
  { value: "investor", label: "Investor" },
  { value: "mentor", label: "Mentor" },
  { value: "peer", label: "Peer" },
  { value: "friend", label: "Friend" },
  { value: "family", label: "Family" },
  { value: "team", label: "Team" },
  { value: "other", label: "Other" },
];
export const relationLabel = (r: Relation) => RELATIONS.find((x) => x.value === r)?.label ?? r;
export const RELATION_TONE: Partial<Record<Relation, Tone>> = { lead: "info", customer: "success", partner: "sprint", investor: "accent" };

export const COMPANY_RELS: { value: CompanyRel; label: string }[] = [
  { value: "prospect", label: "Prospect" },
  { value: "customer", label: "Customer" },
  { value: "partner", label: "Partner" },
  { value: "past", label: "Past" },
  { value: "other", label: "Other" },
];
export const COMPANY_REL_TONE: Record<CompanyRel, Tone> = { prospect: "info", customer: "success", partner: "sprint", past: "muted", other: "muted" };

export const HEALTH: { value: Health; label: string; tone: Tone; dot: string }[] = [
  { value: "green", label: "Healthy", tone: "success", dot: "var(--success)" },
  { value: "yellow", label: "Watch", tone: "warning", dot: "var(--warning)" },
  { value: "red", label: "At risk", tone: "danger", dot: "var(--danger)" },
];

export const CADENCES: { value: number; label: string }[] = [
  { value: 7, label: "Weekly" },
  { value: 14, label: "Every 2 weeks" },
  { value: 30, label: "Monthly" },
  { value: 90, label: "Quarterly" },
  { value: 182, label: "Twice a year" },
  { value: 365, label: "Yearly" },
];
export const cadenceLabel = (d?: number | null) => (d ? CADENCES.find((c) => c.value === d)?.label ?? `Every ${d} days` : "No cadence");

export const TOUCH_KINDS: { value: TouchKind; label: string; icon: LucideIcon; hint: string }[] = [
  { value: "outreach", label: "Outreach", icon: Send, hint: "First touch / cold message" },
  { value: "followup", label: "Follow-up", icon: Reply, hint: "Nudge after no reply" },
  { value: "call", label: "Call", icon: Phone, hint: "Phone or video call" },
  { value: "meeting", label: "Meeting", icon: Users, hint: "A held meeting" },
  { value: "email", label: "Email", icon: Mail, hint: "Email exchange" },
  { value: "dm", label: "DM", icon: MessageCircle, hint: "LinkedIn / X / WhatsApp chat" },
  { value: "note", label: "Note", icon: StickyNote, hint: "Private note (not a touch)" },
];
export const touchMeta = (k: TouchKind) => TOUCH_KINDS.find((t) => t.value === k) ?? TOUCH_KINDS[0];

export const TOUCH_CHANNELS = ["LinkedIn", "Email", "Phone", "WhatsApp", "X", "Instagram", "In person", "Other"];

export const COMMIT_SOURCES = ["call", "meeting", "email", "message", "other"];

/** Currency formatting; `compact` for column totals ($12.4K). */
export function fmtMoney(n: number | null | undefined, currency = "USD", compact = false) {
  const v = n ?? 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: compact && Math.abs(v) >= 1000 ? 1 : 0,
      notation: compact ? "compact" : "standard",
    }).format(v);
  } catch {
    return `${currency} ${Math.round(v).toLocaleString()}`;
  }
}

/** Readable message from a Convex / JS error. */
export function errMsg(e: unknown): string {
  if (e instanceof ConvexError) return typeof e.data === "string" ? e.data : "Something went wrong.";
  if (e instanceof Error) {
    const m = /Uncaught (?:ConvexError|Error):\s*([^\n]+)/.exec(e.message);
    return (m?.[1] ?? e.message).replace(/\s+at .*$/, "").trim();
  }
  return "Something went wrong.";
}

/** "today" / "yesterday" / "5d ago" / "3w ago" for a local ymd. */
export function agoLabel(days: number | null | undefined): string {
  if (days === null || days === undefined) return "Never";
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days}d ago`;
  if (days < 60) return `${Math.round(days / 7)}w ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${(days / 365).toFixed(1).replace(/\.0$/, "")}y ago`;
}
