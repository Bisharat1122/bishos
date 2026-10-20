"use client";

/**
 * Finance helpers shared by every finance component: money formatting in the
 * settings currency, month math on "YYYY-MM", labels, quick-add parsing,
 * category guessing and CSV export.
 */

import { useMemo } from "react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { diffDaysYmd, fmtYmd } from "@/lib/day";

export type Scope = "personal" | "business";
export type ScopeFilter = "all" | Scope;
export type TxType = "income" | "expense" | "transfer";
export type Cadence = "weekly" | "monthly" | "quarterly" | "yearly";
export type AccountKind = Doc<"finAccounts">["kind"];
export type Category = Doc<"finCategories">;

export const CURRENCIES: { code: string; label: string }[] = [
  { code: "USD", label: "US dollar" },
  { code: "PKR", label: "Pakistani rupee" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British pound" },
  { code: "AED", label: "UAE dirham" },
  { code: "SAR", label: "Saudi riyal" },
  { code: "INR", label: "Indian rupee" },
  { code: "CAD", label: "Canadian dollar" },
  { code: "AUD", label: "Australian dollar" },
  { code: "SGD", label: "Singapore dollar" },
  { code: "TRY", label: "Turkish lira" },
  { code: "MYR", label: "Malaysian ringgit" },
  { code: "BDT", label: "Bangladeshi taka" },
  { code: "NGN", label: "Nigerian naira" },
  { code: "ZAR", label: "South African rand" },
];

export const isValidCurrency = (code: string) => {
  try {
    new Intl.NumberFormat(undefined, { style: "currency", currency: code });
    return /^[A-Za-z]{3}$/.test(code);
  } catch {
    return false;
  }
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export type Money = {
  currency: string;
  /** 1,234 or 1,234.50 (decimals only when there are cents). */
  fmt: (n: number) => string;
  /** Always whole units. */
  whole: (n: number) => string;
  /** 12.4K / 1.2M from 10,000 up (axis ticks, tight tiles). */
  compact: (n: number) => string;
  /** The currency symbol / code on its own. */
  symbol: string;
};

export function makeMoney(currency: string): Money {
  const code = isValidCurrency(currency) ? currency.toUpperCase() : "USD";
  const nf = (o: Intl.NumberFormatOptions) => new Intl.NumberFormat(undefined, { style: "currency", currency: code, ...o });
  const whole = nf({ maximumFractionDigits: 0, minimumFractionDigits: 0 });
  const two = nf({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const compact = nf({ notation: "compact", maximumFractionDigits: 1, minimumFractionDigits: 0 });
  const symbol = whole.formatToParts(0).find((p) => p.type === "currency")?.value ?? code;
  return {
    currency: code,
    fmt: (n) => (Number.isInteger(round2(n)) ? whole.format(round2(n)) : two.format(n)),
    whole: (n) => whole.format(Math.round(n)),
    compact: (n) => (Math.abs(n) >= 10000 ? compact.format(n) : whole.format(Math.round(n))),
    symbol,
  };
}

export function useMoney(currency: string | undefined): Money {
  return useMemo(() => makeMoney(currency ?? "USD"), [currency]);
}

/** Replace `{{money:123.4}}` placeholders (server insights) with formatted money. */
export function renderMoneyText(text: string, money: Money) {
  return text.replace(/\{\{money:(-?[\d.]+)\}\}/g, (_, n) => money.whole(Number(n)));
}

// ── Months ───────────────────────────────────────────────────────────────
export const monthOf = (ymd: string) => ymd.slice(0, 7);

export function addMonthsYm(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
}

export function fmtMonth(ym: string, style: "long" | "short" | "tiny" = "long") {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  if (style === "tiny") return d.toLocaleDateString(undefined, { month: "short" });
  if (style === "short") return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Lower-case "today" / "tomorrow" / "in 3 days" / "2 days ago" / "on Oct 30" for sentences. */
export function whenLabel(ymd: string, today: string) {
  const n = diffDaysYmd(today, ymd);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  if (n > 1 && n < 7) return `in ${n} days`;
  if (n < -1 && n > -14) return `${-n} days ago`;
  return `on ${fmtYmd(ymd, { month: "short", day: "numeric" })}`;
}

// ── Labels ───────────────────────────────────────────────────────────────
export const SCOPE_LABEL: Record<ScopeFilter, string> = { all: "All", personal: "Personal", business: "Business" };

export const ACCOUNT_KINDS: { value: AccountKind; label: string }[] = [
  { value: "bank", label: "Bank account" },
  { value: "cash", label: "Cash" },
  { value: "wallet", label: "Wallet / mobile money" },
  { value: "savings", label: "Savings" },
  { value: "card", label: "Credit card" },
  { value: "investment", label: "Investment" },
  { value: "loan", label: "Loan" },
];
export const kindLabel = (k: AccountKind) => ACCOUNT_KINDS.find((x) => x.value === k)?.label ?? k;

export const CADENCES: { value: Cadence; label: string; per: string }[] = [
  { value: "weekly", label: "Weekly", per: "wk" },
  { value: "monthly", label: "Monthly", per: "mo" },
  { value: "quarterly", label: "Quarterly", per: "qtr" },
  { value: "yearly", label: "Yearly", per: "yr" },
];
export const cadencePer = (c: Cadence) => CADENCES.find((x) => x.value === c)?.per ?? c;

export const RECURRING_KINDS = [
  { value: "subscription", label: "Subscription" },
  { value: "bill", label: "Bill" },
  { value: "salary", label: "Salary / payroll" },
  { value: "retainer", label: "Retainer" },
  { value: "loan", label: "Loan payment" },
  { value: "other", label: "Other" },
];
export const recurringKindLabel = (k: string | null | undefined) => RECURRING_KINDS.find((x) => x.value === k)?.label ?? "Other";

/** Categories usable for a type + scope (a "both" category fits either scope). */
export function categoriesFor(categories: Category[] | undefined, type: TxType | "income" | "expense", scope: Scope | ScopeFilter) {
  if (!categories || type === "transfer") return [];
  return categories.filter((c) => !c.archived && c.type === type && (scope === "all" || c.scope === "both" || c.scope === scope));
}

// ── Quick add parsing + smart category guess ─────────────────────────────

/** "45 groceries", "groceries 45", "1.2k figma", "1,200 rent" → { amount, text }. */
export function parseQuick(raw: string): { amount: number | null; text: string } {
  const s = raw.trim();
  const num = (t: string) => {
    const m = /^([\d.,]+)(k|m)?$/i.exec(t);
    if (!m) return null;
    const n = Number(m[1].replace(/,/g, ""));
    if (!Number.isFinite(n)) return null;
    const mul = m[2]?.toLowerCase() === "k" ? 1000 : m[2]?.toLowerCase() === "m" ? 1_000_000 : 1;
    return n * mul;
  };
  const lead = /^([\d.,]+[km]?)\s+(.*)$/i.exec(s);
  if (lead && num(lead[1]) != null) return { amount: num(lead[1]), text: lead[2].trim() };
  const trail = /^(.*?)\s+([\d.,]+[km]?)$/i.exec(s);
  if (trail && num(trail[2]) != null) return { amount: num(trail[2]), text: trail[1].trim() };
  const only = num(s);
  if (only != null) return { amount: only, text: "" };
  return { amount: null, text: s };
}

const KEYWORDS: [RegExp, string[]][] = [
  [/\b(rent|landlord|mortgage|housing)\b/, ["rent/housing"]],
  [/\b(grocer|grocery|groceries|food|restaurant|coffee|cafe|lunch|dinner|breakfast|pizza|burger|foodpanda|ubereats|swiggy|zomato|meal)\b/, ["food & groceries"]],
  [/\b(uber|careem|bykea|indrive|taxi|fuel|petrol|diesel|gas station|metro|bus|train|parking|toll|flight)\b/, ["transport"]],
  [/\b(electric|electricity|internet|wifi|water|gas bill|phone|mobile bill|ptcl|k-electric|utility|utilities)\b/, ["utilities"]],
  [/\b(gym|doctor|pharmacy|medicine|clinic|hospital|fitness|health)\b/, ["health & fitness"]],
  [/\b(course|book|books|udemy|coursera|class|workshop|tuition|learning)\b/, ["learning"]],
  [/\b(netflix|spotify|youtube premium|movie|cinema|game|games|steam|concert|entertainment)\b/, ["entertainment"]],
  [/\b(family|kids|school fee|gift|parents)\b/, ["family"]],
  [/\b(figma|notion|github|vercel|aws|gcp|azure|openai|anthropic|slack|zoom|google workspace|gsuite|canva|adobe|hosting|domain|saas|software|cursor|chatgpt|claude|linear|hubspot|webflow|framer)\b/, ["software/saas"]],
  [/\b(contractor|freelancer|upwork|fiverr|designer|developer|agency)\b/, ["contractors"]],
  [/\b(ads|facebook ads|meta ads|google ads|linkedin ads|marketing|promotion|sponsor|boost)\b/, ["marketing/ads"]],
  [/\b(office|cowork|coworking|stationery|printer|furniture|desk)\b/, ["office"]],
  [/\b(tax|taxes|fbr|vat|gst|irs|withholding)\b/, ["taxes"]],
  [/\b(bank fee|fee|fees|charges|wire|transfer fee|stripe fee|paypal fee|payoneer)\b/, ["bank fees"]],
  [/\b(salary|payroll|wages|staff)\b/, ["salaries", "salary/owner draw"]],
  [/\b(invoice|client|project payment|milestone)\b/, ["client revenue"]],
  [/\b(retainer)\b/, ["retainers"]],
  [/\b(sale|sales|gumroad|product|course sale|shopify)\b/, ["product sales"]],
  [/\b(owner draw|draw)\b/, ["salary/owner draw"]],
];

export type PayeeHint = { name: string; type: TxType; categoryId: Id<"finCategories"> | null; scope: Scope; accountId: Id<"finAccounts"> };

/** Best category for a payee/description: your own history first, then keywords and name matches. */
export function guessCategory(
  text: string,
  type: "income" | "expense",
  scope: Scope,
  categories: Category[] | undefined,
  payees: PayeeHint[] | undefined,
): { categoryId: Id<"finCategories"> | null; scope?: Scope; accountId?: Id<"finAccounts"> } {
  const t = text.trim().toLowerCase();
  if (!t || !categories) return { categoryId: null };
  const hit = payees?.find((p) => p.type === type && p.name.toLowerCase() === t);
  if (hit && hit.categoryId && categories.some((c) => c._id === hit.categoryId && !c.archived)) {
    return { categoryId: hit.categoryId, scope: hit.scope, accountId: hit.accountId };
  }
  const pool = categoriesFor(categories, type, scope);
  const anyScope = categoriesFor(categories, type, "all");
  for (const [re, names] of KEYWORDS) {
    if (!re.test(t)) continue;
    for (const n of names) {
      const c = pool.find((x) => x.name.toLowerCase() === n) ?? anyScope.find((x) => x.name.toLowerCase() === n);
      if (c) return { categoryId: c._id, scope: c.scope === "both" ? undefined : c.scope };
    }
  }
  const words = t.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
  const byName = pool.find((c) => words.some((w) => c.name.toLowerCase().includes(w)));
  return { categoryId: byName?._id ?? null };
}

// ── CSV ──────────────────────────────────────────────────────────────────
const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Neutralise spreadsheet formulas and quote when needed.
  const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const csv = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Parse a money input ("1,200.50", "12k") → number or NaN. */
export function parseAmount(s: string): number {
  const p = parseQuick(s);
  return p.amount != null && !p.text ? p.amount : Number.NaN;
}
