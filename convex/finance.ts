/**
 * Finance — personal + business money in one place.
 *
 * Tables (schema.ts): finAccounts, finCategories, finTransactions, finBudgets,
 * finRecurring, finInvoices, finGoals.
 *
 * Rules of the road
 * - Amounts are always positive; `type` gives the direction.
 * - Account balance = openingBalance + income − expenses − transfers out + transfers in.
 * - Every `date` is a client-LOCAL "YYYY-MM-DD"; months are "YYYY-MM".
 * - Scoped views (Personal / Business): a transfer between a personal and a
 *   business account counts as money in for one scope and money out for the
 *   other (owner draw / owner funding). In the "All" view it nets to zero.
 * - Burn = avg monthly business outflows (expenses + owner draws) over the last
 *   3 full months; net burn subtracts business income. Runway = business cash ÷
 *   net burn. Money moved in from personal is financing, not income, so it
 *   never lowers burn.
 * - XP: logging a transaction 2 (`fin-tx-<id>`), an invoice paid 15
 *   (`fin-inv-paid-<id>`). Undoing revokes.
 *
 * Public read API for other modules:
 *   finance.today({ date })     — bills due/overdue + invoices overdue (Today cockpit)
 *   finance.summary({ today })  — cash, business cash, runway, month in/out, receivables
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, awardXp, diffDays, getSettings, monthKey, revokeXp } from "./os";

type Ctx = QueryCtx | MutationCtx;
type Scope = "personal" | "business";
type ScopeFilter = "all" | Scope;
type Account = Doc<"finAccounts">;
type Category = Doc<"finCategories">;
type Tx = Doc<"finTransactions">;
type Cadence = Doc<"finRecurring">["cadence"];

// ─────────────────────────────────────────────────────────────────────────
// Validators + small helpers
// ─────────────────────────────────────────────────────────────────────────

const scopeV = v.union(v.literal("personal"), v.literal("business"));
const scopeFilterV = v.union(v.literal("all"), v.literal("personal"), v.literal("business"));
const catScopeV = v.union(v.literal("personal"), v.literal("business"), v.literal("both"));
const accountKindV = v.union(
  v.literal("bank"),
  v.literal("cash"),
  v.literal("card"),
  v.literal("wallet"),
  v.literal("savings"),
  v.literal("investment"),
  v.literal("loan"),
);
const txTypeV = v.union(v.literal("income"), v.literal("expense"), v.literal("transfer"));
const flowTypeV = v.union(v.literal("income"), v.literal("expense"));
const cadenceV = v.union(v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("yearly"));

/** Kinds that count as cash on hand (cards, loans and investments don't). */
const LIQUID = new Set<Account["kind"]>(["bank", "cash", "wallet", "savings"]);

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const YM = /^\d{4}-\d{2}$/;

function assertYmd(s: string, label = "date") {
  if (!YMD.test(s)) throw new ConvexError(`Pick a valid ${label}.`);
}
function assertYm(s: string) {
  if (!YM.test(s)) throw new ConvexError("Pick a valid month.");
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function cleanAmount(n: number): number {
  if (!Number.isFinite(n) || n <= 0) throw new ConvexError("Enter an amount above zero.");
  if (n > 1e13) throw new ConvexError("That amount looks too large.");
  return round2(n);
}
function cleanMoney(n: number, label = "amount"): number {
  if (!Number.isFinite(n)) throw new ConvexError(`Enter a valid ${label}.`);
  if (Math.abs(n) > 1e13) throw new ConvexError("That amount looks too large.");
  return round2(n);
}
function cleanText(s: string | null | undefined, max = 200): string | undefined {
  const t = (s ?? "").trim();
  return t ? t.slice(0, max) : undefined;
}

/** "YYYY-MM" + n months. */
function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
}
const monthStart = (ym: string) => `${ym}-01`;
const daysInMonth = (ym: string) => diffDays(monthStart(ym), monthStart(addMonths(ym, 1)));

/** Day of month (1–31) of a "YYYY-MM-DD". */
const dayOf = (ymd: string) => Number(ymd.slice(8, 10));

/** The day of month a recurring item is anchored to (legacy items: their current due day). */
const anchorOf = (r: { dueDay?: number; nextDue: string }) =>
  r.dueDay && r.dueDay >= 1 && r.dueDay <= 31 ? Math.floor(r.dueDay) : dayOf(r.nextDue);

/**
 * Advance a due date by one cadence. Month-based cadences keep the anchor day
 * (clamped to short months), so Jan 31 → Feb 28 → Mar 31 instead of drifting
 * to the 28th forever.
 */
function advanceDue(ymd: string, cadence: Cadence, anchorDay = dayOf(ymd)): string {
  if (cadence === "weekly") return addDays(ymd, 7);
  const months = cadence === "monthly" ? 1 : cadence === "quarterly" ? 3 : 12;
  const ym = addMonths(ymd.slice(0, 7), months);
  const day = Math.min(anchorDay, daysInMonth(ym));
  return `${ym}-${String(day).padStart(2, "0")}`;
}

/** Normalise any cadence to a monthly amount. */
function monthlyOf(amount: number, cadence: Cadence) {
  if (cadence === "weekly") return (amount * 52) / 12;
  if (cadence === "quarterly") return amount / 3;
  if (cadence === "yearly") return amount / 12;
  return amount;
}

type OwnedTable =
  | "finAccounts"
  | "finCategories"
  | "finTransactions"
  | "finBudgets"
  | "finRecurring"
  | "finInvoices"
  | "finGoals"
  | "deals"
  | "companies"
  | "projects"
  | "people";

/** Load a doc by id and throw unless it belongs to the user. */
async function own<T extends OwnedTable>(ctx: Ctx, userId: Id<"users">, id: Id<T>, label: string): Promise<Doc<T>> {
  const doc = (await ctx.db.get(id)) as (Doc<T> & { userId: Id<"users"> }) | null;
  if (!doc || doc.userId !== userId) throw new ConvexError(`${label} not found.`);
  return doc;
}

/** Load a linked doc only if it exists and belongs to the user. */
async function ownedOrNull<T extends OwnedTable>(ctx: Ctx, userId: Id<"users">, id: Id<T> | undefined): Promise<Doc<T> | null> {
  if (!id) return null;
  const doc = (await ctx.db.get(id)) as (Doc<T> & { userId: Id<"users"> }) | null;
  return doc && doc.userId === userId ? doc : null;
}

// ─────────────────────────────────────────────────────────────────────────
// Core data + money math
// ─────────────────────────────────────────────────────────────────────────

async function loadCore(ctx: Ctx, userId: Id<"users">) {
  const [accounts, categories, txs] = await Promise.all([
    ctx.db.query("finAccounts").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("finCategories").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("finTransactions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
  ]);
  const acctScope = new Map<string, Scope>(accounts.map((a) => [a._id, a.scope]));
  const balance = balancesOf(accounts, txs);
  const catById = new Map<string, Category>(categories.map((c) => [c._id, c]));
  return { accounts, categories, txs, acctScope, balance, catById };
}

function balancesOf(accounts: Account[], txs: Tx[]) {
  const bal = new Map<string, number>(accounts.map((a) => [a._id, a.openingBalance]));
  const add = (id: string | undefined, d: number) => {
    if (id && bal.has(id)) bal.set(id, (bal.get(id) ?? 0) + d);
  };
  for (const t of txs) {
    if (t.type === "income") add(t.accountId, t.amount);
    else if (t.type === "expense") add(t.accountId, -t.amount);
    else {
      add(t.accountId, -t.amount);
      add(t.toAccountId, t.amount);
    }
  }
  for (const [k, n] of bal) bal.set(k, round2(n));
  return bal;
}

type Flow = { inc: number; exp: number; transfer: boolean };
const NO_FLOW: Flow = { inc: 0, exp: 0, transfer: false };

/** What a transaction means for a scope view (see header for transfers). */
function flowOf(t: Tx, filter: ScopeFilter, acctScope: Map<string, Scope>): Flow {
  if (t.type === "income") return filter === "all" || t.scope === filter ? { inc: t.amount, exp: 0, transfer: false } : NO_FLOW;
  if (t.type === "expense") return filter === "all" || t.scope === filter ? { inc: 0, exp: t.amount, transfer: false } : NO_FLOW;
  if (filter === "all" || !t.toAccountId) return NO_FLOW;
  const from = acctScope.get(t.accountId);
  const to = acctScope.get(t.toAccountId);
  if (!from || !to || from === to) return NO_FLOW;
  if (from === filter) return { inc: 0, exp: t.amount, transfer: true };
  if (to === filter) return { inc: t.amount, exp: 0, transfer: true };
  return NO_FLOW;
}

const inScope = (s: Scope, filter: ScopeFilter) => filter === "all" || s === filter;
const catInScope = (c: Category, filter: ScopeFilter) => filter === "all" || c.scope === "both" || c.scope === filter;

function cashTotals(accounts: Account[], balance: Map<string, number>) {
  let cash = 0;
  let businessCash = 0;
  let personalCash = 0;
  let netWorth = 0;
  for (const a of accounts) {
    if (a.archived) continue;
    const b = balance.get(a._id) ?? a.openingBalance;
    netWorth += b;
    if (!LIQUID.has(a.kind)) continue;
    cash += b;
    if (a.scope === "business") businessCash += b;
    else personalCash += b;
  }
  return { cash: round2(cash), businessCash: round2(businessCash), personalCash: round2(personalCash), netWorth: round2(netWorth) };
}

/**
 * Business burn over the last 3 full months before `today`'s month (only the
 * months since your first business entry). Falls back to this month so far.
 */
function burnOf(txs: Tx[], acctScope: Map<string, Scope>, today: string, businessCash: number) {
  const cur = monthKey(today);
  const firstBiz = txs.reduce<string | null>((m, t) => {
    const touchesBiz =
      t.scope === "business" || acctScope.get(t.accountId) === "business" || (t.toAccountId && acctScope.get(t.toAccountId) === "business");
    return touchesBiz && (!m || t.date < m) ? t.date : m;
  }, null);
  let months = [addMonths(cur, -3), addMonths(cur, -2), addMonths(cur, -1)].filter(
    (m) => firstBiz != null && monthStart(addMonths(m, 1)) > firstBiz,
  );
  const partial = months.length === 0;
  if (partial) months = [cur];
  const set = new Set(months);
  let out = 0;
  let inc = 0;
  for (const t of txs) {
    if (!set.has(t.date.slice(0, 7))) continue;
    if (partial && t.date > today) continue;
    const f = flowOf(t, "business", acctScope);
    out += f.exp;
    if (!f.transfer) inc += f.inc; // money moved in from personal is financing
  }
  const n = months.length;
  const burn = round2(out / n);
  const income = round2(inc / n);
  const netBurn = round2(burn - income);
  const runwayMonths = netBurn > 0 ? Math.max(0, Math.round((businessCash / netBurn) * 10) / 10) : null;
  return { burn, income, netBurn, runwayMonths, months: n, partial, hasData: firstBiz != null };
}

/** Effective budget per category for a month (a month override beats the default). */
function budgetMap(budgets: Doc<"finBudgets">[], month: string) {
  const base = new Map<string, number>();
  const over = new Map<string, number>();
  for (const b of budgets) {
    if (!b.month) base.set(b.categoryId, b.amount);
    else if (b.month === month) over.set(b.categoryId, b.amount);
  }
  const out = new Map(base);
  for (const [k, n] of over) out.set(k, n);
  return out;
}

/** Lower = shown first (only 4 make the cut). */
const INSIGHT_PRIORITY: Record<string, number> = {
  runway: 0,
  "inv-overdue": 1,
  "budget-over": 2,
  "cat-up": 3,
  save: 4,
  pace: 5,
  "cat-down": 6,
  "budget-ok": 7,
  subs: 8,
};

/** Money placeholder inside insight text; the client formats it in your currency. */
const money = (n: number) => `{{money:${round2(n)}}}`;

function isOverdueInvoice(inv: Doc<"finInvoices">, today: string) {
  return inv.status === "sent" && inv.dueOn < today;
}

/** First non-archived account of a scope (bank first), else any open account. */
function defaultAccount(accounts: Account[], scope: Scope): Account | null {
  const open = accounts.filter((a) => !a.archived).sort((a, b) => a.order - b.order);
  const sameScope = open.filter((a) => a.scope === scope);
  return sameScope.find((a) => a.kind === "bank") ?? sameScope.find((a) => LIQUID.has(a.kind)) ?? sameScope[0] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES: { name: string; type: "income" | "expense"; scope: "personal" | "business" | "both" }[] = [
  // Personal spending
  { name: "Rent/Housing", type: "expense", scope: "personal" },
  { name: "Food & Groceries", type: "expense", scope: "personal" },
  { name: "Transport", type: "expense", scope: "personal" },
  { name: "Utilities", type: "expense", scope: "personal" },
  { name: "Health & Fitness", type: "expense", scope: "personal" },
  { name: "Learning", type: "expense", scope: "personal" },
  { name: "Entertainment", type: "expense", scope: "personal" },
  { name: "Family", type: "expense", scope: "personal" },
  // Business spending
  { name: "Software/SaaS", type: "expense", scope: "business" },
  { name: "Contractors", type: "expense", scope: "business" },
  { name: "Marketing/Ads", type: "expense", scope: "business" },
  { name: "Office", type: "expense", scope: "business" },
  { name: "Taxes", type: "expense", scope: "business" },
  { name: "Bank fees", type: "expense", scope: "business" },
  { name: "Salaries", type: "expense", scope: "business" },
  { name: "Other", type: "expense", scope: "both" },
  // Income
  { name: "Salary/Owner draw", type: "income", scope: "personal" },
  { name: "Client revenue", type: "income", scope: "business" },
  { name: "Retainers", type: "income", scope: "business" },
  { name: "Product sales", type: "income", scope: "business" },
  { name: "Other", type: "income", scope: "both" },
];

/**
 * Seed default categories (only if you have none) and a first account per
 * scope (only for scopes without one). Safe to run twice.
 */
export const setup = mutation({
  args: {
    personalName: v.optional(v.string()),
    businessName: v.optional(v.string()),
    personalOpening: v.optional(v.number()),
    businessOpening: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const [cats, accounts] = await Promise.all([
      ctx.db.query("finCategories").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("finAccounts").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    let categories = 0;
    if (cats.length === 0) {
      let order = 0;
      for (const c of DEFAULT_CATEGORIES) {
        await ctx.db.insert("finCategories", { userId, name: c.name, type: c.type, scope: c.scope, order: order++ });
        categories++;
      }
    }
    let created = 0;
    let order = accounts.reduce((m, a) => Math.max(m, a.order), -1) + 1;
    const now = Date.now();
    if (!accounts.some((a) => a.scope === "personal")) {
      await ctx.db.insert("finAccounts", {
        userId,
        name: cleanText(args.personalName, 60) ?? "Personal account",
        kind: "bank",
        scope: "personal",
        openingBalance: cleanMoney(args.personalOpening ?? 0, "opening balance"),
        order: order++,
        createdAt: now,
      });
      created++;
    }
    if (!accounts.some((a) => a.scope === "business")) {
      await ctx.db.insert("finAccounts", {
        userId,
        name: cleanText(args.businessName, 60) ?? "Business account",
        kind: "bank",
        scope: "business",
        openingBalance: cleanMoney(args.businessOpening ?? 0, "opening balance"),
        order: order++,
        createdAt: now,
      });
      created++;
    }
    return { categories, accounts: created };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────

/** Accounts (with balances), categories, recent payees and currency. */
export const meta = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const settings = await getSettings(ctx, userId);
    const { accounts, categories, txs, balance } = await loadCore(ctx, userId);
    const txCount = new Map<string, number>();
    for (const t of txs) {
      txCount.set(t.accountId, (txCount.get(t.accountId) ?? 0) + 1);
      if (t.toAccountId) txCount.set(t.toAccountId, (txCount.get(t.toAccountId) ?? 0) + 1);
    }
    // Most recent use of each payee → smart defaults in quick add.
    const sorted = [...txs].sort((a, b) => (b.date === a.date ? b.createdAt - a.createdAt : b.date < a.date ? -1 : 1));
    const seen = new Set<string>();
    const payees: { name: string; type: Tx["type"]; categoryId: Id<"finCategories"> | null; scope: Scope; accountId: Id<"finAccounts"> }[] = [];
    for (const t of sorted) {
      const name = t.payee?.trim();
      if (!name || t.type === "transfer") continue;
      const k = name.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      payees.push({ name, type: t.type, categoryId: t.categoryId ?? null, scope: t.scope, accountId: t.accountId });
      if (payees.length >= 80) break;
    }
    const pa = defaultAccount(accounts, "personal");
    const ba = defaultAccount(accounts, "business");
    return {
      currency: settings.currency,
      ready: accounts.length > 0,
      hasTransactions: txs.length > 0,
      accounts: accounts
        .map((a) => ({ ...a, balance: balance.get(a._id) ?? a.openingBalance, txCount: txCount.get(a._id) ?? 0, liquid: LIQUID.has(a.kind) }))
        .sort((a, b) => Number(!!a.archived) - Number(!!b.archived) || a.order - b.order),
      categories: categories.sort((a, b) => (a.type === b.type ? a.order - b.order : a.type === "expense" ? -1 : 1)),
      payees,
      defaults: { personal: pa?._id ?? null, business: ba?._id ?? null },
    };
  },
});

/** Deals, companies, projects and people for the "link to…" pickers. */
export const linkOptions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [deals, companies, projects, people] = await Promise.all([
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("companies").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("people").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const stageRank = (s: string) => (s === "won" ? 0 : s === "lost" || s === "unqualified" ? 2 : 1);
    return {
      deals: deals
        .sort((a, b) => stageRank(a.stage) - stageRank(b.stage) || b.stageChangedAt - a.stageChangedAt)
        .map((d) => ({ _id: d._id, title: d.title, stage: d.stage, value: d.value ?? null, companyId: d.companyId ?? null, personId: d.personId ?? null, projectId: d.projectId ?? null })),
      companies: companies.sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ _id: c._id, name: c.name, relationship: c.relationship })),
      projects: projects
        .sort((a, b) => Number(a.status === "completed") - Number(b.status === "completed") || a.title.localeCompare(b.title))
        .map((p) => ({ _id: p._id, title: p.title, status: p.status, companyId: p.companyId ?? null })),
      people: people.sort((a, b) => a.name.localeCompare(b.name)).map((p) => ({ _id: p._id, name: p.name, companyId: p.companyId ?? null })),
    };
  },
});

/** The Overview dashboard for one month and scope. */
export const overview = query({
  args: { today: v.string(), month: v.string(), scope: scopeFilterV },
  handler: async (ctx, { today, month, scope }) => {
    const userId = await requireUser(ctx);
    assertYmd(today);
    assertYm(month);
    const settings = await getSettings(ctx, userId);
    const { accounts, categories, txs, acctScope, balance, catById } = await loadCore(ctx, userId);
    const [budgets, recurring, invoices, goals] = await Promise.all([
      ctx.db.query("finBudgets").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("finRecurring").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("finInvoices").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("finGoals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const prevMonth = addMonths(month, -1);
    const isCurrent = month === monthKey(today);

    // ── 12-month cashflow + this/prev month category breakdown (one pass)
    const months = Array.from({ length: 12 }, (_, i) => addMonths(month, i - 11));
    const idx = new Map(months.map((m, i) => [m, i]));
    const inc = months.map(() => 0);
    const exp = months.map(() => 0);
    const spendCur = new Map<string, number>();
    const spendPrev = new Map<string, number>();
    const incomeCur = new Map<string, number>();
    let txCountMonth = 0;
    for (const t of txs) {
      const ym = t.date.slice(0, 7);
      const i = idx.get(ym);
      if (i === undefined) continue;
      const f = flowOf(t, scope, acctScope);
      inc[i] += f.inc;
      exp[i] += f.exp;
      if (ym !== month && ym !== prevMonth) continue;
      if (ym === month && (f.inc || f.exp || (t.type === "transfer" && scope === "all"))) txCountMonth++;
      const key = f.transfer ? (f.exp ? "__transfer_out" : "__transfer_in") : (t.categoryId ?? "__none");
      if (f.exp) {
        const m = ym === month ? spendCur : spendPrev;
        m.set(key, (m.get(key) ?? 0) + f.exp);
      } else if (f.inc && ym === month) {
        incomeCur.set(key, (incomeCur.get(key) ?? 0) + f.inc);
      }
    }
    const income = round2(inc[11]);
    const expense = round2(exp[11]);
    const prevIncome = round2(inc[10]);
    const prevExpense = round2(exp[10]);
    const net = round2(income - expense);
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : null;
    const otherScope = scope === "business" ? "personal" : "business";
    const labelOf = (key: string) => {
      if (key === "__none") return "Uncategorised";
      if (key === "__transfer_out") return scope === "business" ? "Owner draw (to personal)" : "Moved to business";
      if (key === "__transfer_in") return scope === "business" ? "Owner funding (from personal)" : `From ${otherScope}`;
      return catById.get(key)?.name ?? "Deleted category";
    };
    const totalSpend = [...spendCur.values()].reduce((a, b) => a + b, 0);
    const spending = [...spendCur.entries()]
      .map(([key, amount]) => ({
        key,
        categoryId: key.startsWith("__") ? null : (key as Id<"finCategories">),
        name: labelOf(key),
        amount: round2(amount),
        pct: totalSpend > 0 ? Math.round((amount / totalSpend) * 1000) / 10 : 0,
        prev: round2(spendPrev.get(key) ?? 0),
      }))
      .sort((a, b) => b.amount - a.amount);
    const incomeBy = [...incomeCur.entries()]
      .map(([key, amount]) => ({ key, name: labelOf(key), amount: round2(amount) }))
      .sort((a, b) => b.amount - a.amount);

    // ── Budget vs actual (every expense in the category counts)
    const bmap = budgetMap(budgets, month);
    const catSpend = new Map<string, number>();
    for (const t of txs) {
      if (t.type !== "expense" || !t.categoryId || t.date.slice(0, 7) !== month) continue;
      catSpend.set(t.categoryId, (catSpend.get(t.categoryId) ?? 0) + t.amount);
    }
    const budgetRows = categories
      .filter((c) => c.type === "expense" && !c.archived && catInScope(c, scope) && (bmap.get(c._id) ?? 0) > 0)
      .map((c) => {
        const budget = bmap.get(c._id) ?? 0;
        const spent = round2(catSpend.get(c._id) ?? 0);
        return { categoryId: c._id, name: c.name, scope: c.scope, budget, spent, pct: Math.round((spent / budget) * 100), remaining: round2(budget - spent) };
      })
      .sort((a, b) => b.pct - a.pct);

    // ── Cash, burn, runway
    const totals = cashTotals(accounts, balance);
    const burn = burnOf(txs, acctScope, today, totals.businessCash);
    const accountRows = accounts
      .filter((a) => !a.archived && inScope(a.scope, scope))
      .sort((a, b) => a.order - b.order)
      .map((a) => ({ _id: a._id, name: a.name, kind: a.kind, scope: a.scope, balance: balance.get(a._id) ?? a.openingBalance, liquid: LIQUID.has(a.kind) }));

    // ── Upcoming bills (overdue + next 14 days)
    const horizon = addDays(today, 14);
    const bills = recurring
      .filter((r) => r.active && r.type === "expense" && inScope(r.scope, scope) && r.nextDue <= horizon)
      .sort((a, b) => (a.nextDue < b.nextDue ? -1 : a.nextDue > b.nextDue ? 1 : b.amount - a.amount))
      .map((r) => ({
        _id: r._id,
        name: r.name,
        kind: r.kind ?? null,
        amount: r.amount,
        cadence: r.cadence,
        nextDue: r.nextDue,
        scope: r.scope,
        overdue: r.nextDue < today,
        days: diffDays(today, r.nextDue),
      }));
    const subscriptionsMonthly = round2(
      recurring
        .filter((r) => r.active && r.type === "expense" && (r.kind ?? "subscription") === "subscription" && inScope(r.scope, scope))
        .reduce((s, r) => s + monthlyOf(r.amount, r.cadence), 0),
    );

    // ── Receivables (business)
    const showInvoices = scope !== "personal";
    const openInv = showInvoices ? invoices.filter((i) => i.status === "sent") : [];
    const invRows = [];
    for (const i of openInv.sort((a, b) => (a.dueOn < b.dueOn ? -1 : 1)).slice(0, 8)) {
      const co = await ownedOrNull(ctx, userId, i.companyId);
      invRows.push({
        _id: i._id,
        title: i.title,
        number: i.number ?? null,
        amount: i.amount,
        dueOn: i.dueOn,
        companyName: co?.name ?? null,
        overdue: isOverdueInvoice(i, today),
        daysOverdue: Math.max(0, diffDays(i.dueOn, today)),
      });
    }
    const outstanding = round2(openInv.reduce((s, i) => s + i.amount, 0));
    const overdueList = openInv.filter((i) => isOverdueInvoice(i, today));
    const overdueAmount = round2(overdueList.reduce((s, i) => s + i.amount, 0));

    // ── Goals
    const goalRows = goals
      .filter((g) => inScope(g.scope, scope))
      .map((g) => {
        const acct = g.accountId ? accounts.find((a) => a._id === g.accountId) : undefined;
        const current = acct ? (balance.get(acct._id) ?? acct.openingBalance) : (g.saved ?? 0);
        return {
          _id: g._id,
          name: g.name,
          target: g.target,
          current: round2(current),
          pct: g.target > 0 ? Math.max(0, Math.min(100, Math.round((current / g.target) * 100))) : 0,
          deadline: g.deadline ?? null,
          accountName: acct?.name ?? null,
          scope: g.scope,
        };
      })
      .sort((a, b) => a.pct - b.pct);

    // ── Insights (3–4, most useful first)
    type Insight = { id: string; tone: "success" | "warning" | "info" | "muted"; text: string; tab?: string };
    const insights: Insight[] = [];
    // Biggest category move vs last month
    let up: (typeof spending)[number] | null = null;
    let upPct = 0;
    let down: { name: string; pct: number; saved: number } | null = null;
    const minMove = Math.max(1, (totalSpend || 0) * 0.03);
    for (const r of spending) {
      if (r.key.startsWith("__")) continue;
      if (r.prev > 0 && r.amount - r.prev >= minMove) {
        const p = Math.round(((r.amount - r.prev) / r.prev) * 100);
        if (p >= 20 && p > upPct) {
          up = r;
          upPct = p;
        }
      }
    }
    for (const [key, prev] of spendPrev) {
      if (key.startsWith("__") || prev <= 0) continue;
      const cur = spendCur.get(key) ?? 0;
      const p = Math.round(((prev - cur) / prev) * 100);
      if (p >= 25 && prev - cur >= minMove && (!down || p > down.pct) && !isCurrent) {
        down = { name: labelOf(key), pct: p, saved: round2(prev - cur) };
      }
    }
    if (up) insights.push({ id: "cat-up", tone: "warning", text: `${up.name} spend up ${upPct}% vs last month`, tab: "transactions" });
    const over = budgetRows.filter((b) => b.spent > b.budget);
    if (over.length) {
      insights.push({
        id: "budget-over",
        tone: "warning",
        text: `${over.length === 1 ? `${over[0].name} is` : `${over.length} budgets are`} over budget this month`,
        tab: "budgets",
      });
    } else if (budgetRows.length && isCurrent) {
      insights.push({ id: "budget-ok", tone: "success", text: `All ${budgetRows.length} budgets on track so far`, tab: "budgets" });
    }
    if (savingsRate != null && income > 0) {
      if (savingsRate >= 20) insights.push({ id: "save", tone: "success", text: `You kept ${savingsRate}% of what came in${isCurrent ? " so far this month" : ""}` });
      else if (net < 0) insights.push({ id: "save", tone: "warning", text: `Spending is ahead of income by ${money(Math.abs(net))} this month` });
    }
    if (isCurrent && expense > 0 && prevExpense > 0) {
      const day = diffDays(monthStart(month), today) + 1;
      const projected = (expense / Math.max(1, day)) * daysInMonth(month);
      const p = Math.round(((projected - prevExpense) / prevExpense) * 100);
      if (day >= 7 && p >= 15) insights.push({ id: "pace", tone: "info", text: `At this pace you'll spend ${p}% more than last month` });
      else if (day >= 7 && p <= -15) insights.push({ id: "pace", tone: "success", text: `On pace to spend ${-p}% less than last month` });
    }
    if (down) insights.push({ id: "cat-down", tone: "success", text: `${down.name} spend down ${down.pct}% vs last month` });
    if (overdueList.length && showInvoices) {
      insights.push({
        id: "inv-overdue",
        tone: "warning",
        text: `${overdueList.length} overdue invoice${overdueList.length === 1 ? "" : "s"} (${money(overdueAmount)}): a quick nudge could bring in cash`,
        tab: "invoices",
      });
    }
    if (scope !== "personal" && burn.runwayMonths != null && burn.runwayMonths < 6) {
      insights.push({ id: "runway", tone: "warning", text: `Runway is ${burn.runwayMonths} months. Collections and revenue first this week` });
    }
    if (subscriptionsMonthly > 0) {
      insights.push({
        id: "subs",
        tone: "muted",
        text: `Subscriptions cost ${money(subscriptionsMonthly)}/month (${money(subscriptionsMonthly * 12)}/year)`,
        tab: "recurring",
      });
    }

    return {
      currency: settings.currency,
      ready: accounts.length > 0,
      month,
      isCurrent,
      scope,
      totals: { income, expense, net, savingsRate, prevIncome, prevExpense, txCount: txCountMonth },
      cashflow: months.map((m, i) => ({ month: m, income: round2(inc[i]), expense: round2(exp[i]), net: round2(inc[i] - exp[i]) })),
      spending,
      incomeBy,
      budgets: budgetRows,
      cash: { ...totals, accounts: accountRows },
      burn,
      bills,
      subscriptionsMonthly,
      invoices: { show: showInvoices, rows: invRows, outstanding, openCount: openInv.length, overdueCount: overdueList.length, overdueAmount },
      goals: goalRows,
      insights: insights
        .map((x, i) => ({ x, i, p: INSIGHT_PRIORITY[x.id] ?? 9 }))
        .sort((a, b) => a.p - b.p || a.i - b.i)
        .slice(0, 4)
        .map(({ x }) => x),
    };
  },
});

/** Transactions for a month (or "all"), filtered, newest first. */
export const transactions = query({
  args: {
    month: v.string(), // "YYYY-MM" or "all"
    scope: v.optional(scopeFilterV),
    type: v.optional(txTypeV),
    accountId: v.optional(v.id("finAccounts")),
    categoryId: v.optional(v.id("finCategories")),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    let rows: Tx[];
    if (args.month === "all") {
      rows = await ctx.db
        .query("finTransactions")
        .withIndex("by_user_date", (q) => q.eq("userId", userId))
        .order("desc")
        .take(2000);
    } else {
      assertYm(args.month);
      rows = await ctx.db
        .query("finTransactions")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", userId).gte("date", monthStart(args.month)).lt("date", monthStart(addMonths(args.month, 1))),
        )
        .collect();
    }
    const [accounts, categories] = await Promise.all([
      ctx.db.query("finAccounts").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("finCategories").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const acctById = new Map(accounts.map((a) => [a._id as string, a]));
    const catById = new Map(categories.map((c) => [c._id as string, c]));
    const acctScope = new Map<string, Scope>(accounts.map((a) => [a._id, a.scope]));
    const scope = args.scope ?? "all";
    const q = (args.search ?? "").trim().toLowerCase();

    const filtered = rows.filter((t) => {
      if (args.type && t.type !== args.type) return false;
      if (args.accountId && t.accountId !== args.accountId && t.toAccountId !== args.accountId) return false;
      if (args.categoryId && t.categoryId !== args.categoryId) return false;
      if (scope !== "all") {
        if (t.type === "transfer") {
          const from = acctScope.get(t.accountId);
          const to = t.toAccountId ? acctScope.get(t.toAccountId) : undefined;
          if (from !== scope && to !== scope) return false;
        } else if (t.scope !== scope) return false;
      }
      if (q) {
        const hay = [t.payee, t.note, catById.get(t.categoryId ?? "")?.name, acctById.get(t.accountId)?.name, String(t.amount), ...(t.tags ?? [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    filtered.sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));

    // Names for linked deal / company / project (only the user's own docs).
    const nameCache = new Map<string, string | null>();
    const linkName = async (id: Id<"deals"> | Id<"companies"> | Id<"projects"> | undefined) => {
      if (!id) return null;
      if (nameCache.has(id)) return nameCache.get(id) ?? null;
      const doc = (await ctx.db.get(id)) as { userId: Id<"users">; title?: string; name?: string } | null;
      const name = doc && doc.userId === userId ? (doc.title ?? doc.name ?? null) : null;
      nameCache.set(id, name);
      return name;
    };

    const out = [];
    let income = 0;
    let expense = 0;
    for (const t of filtered.slice(0, 1000)) {
      const f = flowOf(t, scope, acctScope);
      income += f.inc;
      expense += f.exp;
      out.push({
        ...t,
        accountName: acctById.get(t.accountId)?.name ?? "Deleted account",
        toAccountName: t.toAccountId ? (acctById.get(t.toAccountId)?.name ?? "Deleted account") : null,
        categoryName: t.categoryId ? (catById.get(t.categoryId)?.name ?? null) : null,
        dealName: await linkName(t.dealId),
        companyName: await linkName(t.companyId),
        projectName: await linkName(t.projectId),
      });
    }
    return { rows: out, total: filtered.length, income: round2(income), expense: round2(expense), net: round2(income - expense) };
  },
});

/** Expense categories with this month's budget, spend and remaining. */
export const budgets = query({
  args: { month: v.string(), scope: v.optional(scopeFilterV) },
  handler: async (ctx, { month, scope = "all" }) => {
    const userId = await requireUser(ctx);
    assertYm(month);
    const settings = await getSettings(ctx, userId);
    const [categories, budgets, txs] = await Promise.all([
      ctx.db.query("finCategories").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("finBudgets").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db
        .query("finTransactions")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", monthStart(month)).lt("date", monthStart(addMonths(month, 1))))
        .collect(),
    ]);
    const bmap = budgetMap(budgets, month);
    const spend = new Map<string, number>();
    for (const t of txs) if (t.type === "expense" && t.categoryId) spend.set(t.categoryId, (spend.get(t.categoryId) ?? 0) + t.amount);
    const rows = categories
      .filter((c) => c.type === "expense" && !c.archived && catInScope(c, scope))
      .sort((a, b) => a.order - b.order)
      .map((c) => {
        const budget = bmap.get(c._id) ?? 0;
        const spent = round2(spend.get(c._id) ?? 0);
        return {
          categoryId: c._id,
          name: c.name,
          scope: c.scope,
          budget,
          spent,
          pct: budget > 0 ? Math.round((spent / budget) * 100) : null,
          remaining: round2(budget - spent),
          monthOverride: budgets.some((b) => b.categoryId === c._id && b.month === month),
        };
      });
    const withBudget = rows.filter((r) => r.budget > 0);
    return {
      currency: settings.currency,
      month,
      rows,
      totalBudget: round2(withBudget.reduce((s, r) => s + r.budget, 0)),
      totalSpent: round2(withBudget.reduce((s, r) => s + r.spent, 0)),
      unbudgetedSpent: round2(rows.filter((r) => r.budget <= 0).reduce((s, r) => s + r.spent, 0)),
    };
  },
});

/** Subscriptions, bills and retainers with due status and monthly totals. */
export const recurring = query({
  args: { today: v.string(), scope: v.optional(scopeFilterV) },
  handler: async (ctx, { today, scope = "all" }) => {
    const userId = await requireUser(ctx);
    assertYmd(today);
    const settings = await getSettings(ctx, userId);
    const [items, accounts, categories] = await Promise.all([
      ctx.db.query("finRecurring").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("finAccounts").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("finCategories").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const acctName = new Map(accounts.map((a) => [a._id as string, a.name]));
    const catName = new Map(categories.map((c) => [c._id as string, c.name]));
    const rows = await Promise.all(
      items
        .filter((x) => inScope(x.scope, scope))
        .map(async (r) => {
          const days = diffDays(today, r.nextDue);
          const co = await ownedOrNull(ctx, userId, r.companyId);
          return {
            ...r,
            kind: r.kind ?? "subscription",
            days,
            status: !r.active ? ("paused" as const) : days < 0 ? ("overdue" as const) : days <= 3 ? ("due" as const) : days <= 14 ? ("soon" as const) : ("later" as const),
            monthly: round2(monthlyOf(r.amount, r.cadence)),
            accountName: r.accountId ? (acctName.get(r.accountId) ?? null) : null,
            categoryName: r.categoryId ? (catName.get(r.categoryId) ?? null) : null,
            companyName: co?.name ?? null,
          };
        }),
    );
    rows.sort((a, b) => Number(!a.active) - Number(!b.active) || (a.nextDue < b.nextDue ? -1 : a.nextDue > b.nextDue ? 1 : 0));
    const active = rows.filter((r) => r.active);
    const sum = (xs: typeof rows) => round2(xs.reduce((s, r) => s + r.monthly, 0));
    return {
      currency: settings.currency,
      rows,
      subscriptionsMonthly: sum(active.filter((r) => r.type === "expense" && r.kind === "subscription")),
      expensesMonthly: sum(active.filter((r) => r.type === "expense")),
      incomeMonthly: sum(active.filter((r) => r.type === "income")),
      dueCount: active.filter((r) => r.status === "overdue" || r.status === "due").length,
    };
  },
});

/** Invoices (receivables) with overdue flags, totals and won deals to bill. */
export const invoices = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    assertYmd(today);
    const settings = await getSettings(ctx, userId);
    const [list, won] = await Promise.all([
      ctx.db.query("finInvoices").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("deals").withIndex("by_user_stage", (q) => q.eq("userId", userId).eq("stage", "won")).collect(),
    ]);
    const rows = await Promise.all(
      list.map(async (i) => {
        const [co, person, deal, project] = await Promise.all([
          ownedOrNull(ctx, userId, i.companyId),
          ownedOrNull(ctx, userId, i.personId),
          ownedOrNull(ctx, userId, i.dealId),
          ownedOrNull(ctx, userId, i.projectId),
        ]);
        const overdue = isOverdueInvoice(i, today);
        return {
          ...i,
          companyName: co?.name ?? null,
          personName: person?.name ?? null,
          dealTitle: deal?.title ?? null,
          projectTitle: project?.title ?? null,
          overdue,
          daysOverdue: overdue ? diffDays(i.dueOn, today) : 0,
          daysToDue: diffDays(today, i.dueOn),
        };
      }),
    );
    const rank = (r: (typeof rows)[number]) => (r.overdue ? 0 : r.status === "sent" ? 1 : r.status === "draft" ? 2 : r.status === "paid" ? 3 : 4);
    rows.sort((a, b) => rank(a) - rank(b) || (rank(a) >= 3 ? (b.paidOn ?? b.issuedOn).localeCompare(a.paidOn ?? a.issuedOn) : a.dueOn.localeCompare(b.dueOn)));
    const sent = rows.filter((r) => r.status === "sent");
    const od = sent.filter((r) => r.overdue);
    const curMonth = monthKey(today);
    const invoicedDeals = new Set(list.filter((i) => i.status !== "void" && i.dealId).map((i) => i.dealId as string));
    const wonDeals = [];
    for (const d of won.sort((a, b) => (b.closedAt ?? b.stageChangedAt) - (a.closedAt ?? a.stageChangedAt))) {
      const co = await ownedOrNull(ctx, userId, d.companyId);
      wonDeals.push({
        _id: d._id,
        title: d.title,
        value: d.value ?? null,
        companyId: d.companyId ?? null,
        companyName: co?.name ?? null,
        personId: d.personId ?? null,
        projectId: d.projectId ?? null,
        closedDate: d.closedDate ?? null,
        invoiced: invoicedDeals.has(d._id),
      });
    }
    return {
      currency: settings.currency,
      rows,
      outstanding: round2(sent.reduce((s, r) => s + r.amount, 0)),
      outstandingCount: sent.length,
      overdue: round2(od.reduce((s, r) => s + r.amount, 0)),
      overdueCount: od.length,
      draftCount: rows.filter((r) => r.status === "draft").length,
      paidThisMonth: round2(rows.filter((r) => r.status === "paid" && (r.paidOn ?? "").slice(0, 7) === curMonth).reduce((s, r) => s + r.amount, 0)),
      wonDeals,
      nextNumber: nextInvoiceNumber(list),
    };
  },
});

/** Savings goals with progress (linked account balance or manual amount). */
export const goals = query({
  args: { scope: v.optional(scopeFilterV) },
  handler: async (ctx, { scope = "all" }) => {
    const userId = await requireUser(ctx);
    const { accounts, balance } = await loadCore(ctx, userId);
    const list = await ctx.db.query("finGoals").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return list
      .filter((g) => inScope(g.scope, scope))
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((g) => {
        const acct = g.accountId ? accounts.find((a) => a._id === g.accountId) : undefined;
        const current = round2(acct ? (balance.get(acct._id) ?? acct.openingBalance) : (g.saved ?? 0));
        return {
          ...g,
          current,
          accountName: acct?.name ?? null,
          pct: g.target > 0 ? Math.max(0, Math.min(100, Math.round((current / g.target) * 100))) : 0,
          left: round2(Math.max(0, g.target - current)),
        };
      });
  },
});

/**
 * Today cockpit: bills due today or overdue, and overdue invoices.
 * Counts + the top 3 of each.
 */
export const today = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    assertYmd(date);
    const settings = await getSettings(ctx, userId);
    const [recurring, invoices] = await Promise.all([
      ctx.db.query("finRecurring").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("finInvoices").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const bills = recurring
      .filter((r) => r.active && r.type === "expense" && r.nextDue <= date)
      .sort((a, b) => (a.nextDue < b.nextDue ? -1 : a.nextDue > b.nextDue ? 1 : b.amount - a.amount));
    const overdueInv = invoices.filter((i) => isOverdueInvoice(i, date)).sort((a, b) => (a.dueOn < b.dueOn ? -1 : 1));
    const invTop = [];
    for (const i of overdueInv.slice(0, 3)) {
      const co = await ownedOrNull(ctx, userId, i.companyId);
      invTop.push({ _id: i._id, title: i.title, number: i.number ?? null, amount: i.amount, dueOn: i.dueOn, companyName: co?.name ?? null, daysOverdue: diffDays(i.dueOn, date) });
    }
    return {
      currency: settings.currency,
      bills: {
        dueToday: bills.filter((b) => b.nextDue === date).length,
        overdue: bills.filter((b) => b.nextDue < date).length,
        total: bills.length,
        amount: round2(bills.reduce((s, b) => s + b.amount, 0)),
        top: bills.slice(0, 3).map((b) => ({ _id: b._id, name: b.name, amount: b.amount, nextDue: b.nextDue, scope: b.scope, overdue: b.nextDue < date })),
      },
      invoices: {
        overdue: overdueInv.length,
        amount: round2(overdueInv.reduce((s, i) => s + i.amount, 0)),
        top: invTop,
      },
      count: bills.length + overdueInv.length,
    };
  },
});

/**
 * Money at a glance for Founder HQ / Analytics: cash, business cash, runway,
 * this month's income/expense, outstanding invoices.
 */
export const summary = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    assertYmd(today);
    const settings = await getSettings(ctx, userId);
    const { accounts, txs, acctScope, balance } = await loadCore(ctx, userId);
    const invoices = await ctx.db.query("finInvoices").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const totals = cashTotals(accounts, balance);
    const burn = burnOf(txs, acctScope, today, totals.businessCash);
    const month = monthKey(today);
    let income = 0;
    let expense = 0;
    let bizIncome = 0;
    let bizExpense = 0;
    for (const t of txs) {
      if (t.date.slice(0, 7) !== month) continue;
      const all = flowOf(t, "all", acctScope);
      income += all.inc;
      expense += all.exp;
      if (t.scope === "business" && t.type === "income") bizIncome += t.amount;
      if (t.scope === "business" && t.type === "expense") bizExpense += t.amount;
    }
    const sent = invoices.filter((i) => i.status === "sent");
    const od = sent.filter((i) => isOverdueInvoice(i, today));
    return {
      ready: accounts.length > 0,
      currency: settings.currency,
      cashTotal: totals.cash,
      businessCash: totals.businessCash,
      personalCash: totals.personalCash,
      netWorth: totals.netWorth,
      runwayMonths: burn.runwayMonths, // null = not burning cash (or no data)
      burn: burn.burn,
      netBurn: burn.netBurn,
      month: { key: month, income: round2(income), expense: round2(expense), net: round2(income - expense) },
      business: { income: round2(bizIncome), expense: round2(bizExpense) },
      outstandingInvoices: { count: sent.length, amount: round2(sent.reduce((s, i) => s + i.amount, 0)) },
      overdueInvoices: { count: od.length, amount: round2(od.reduce((s, i) => s + i.amount, 0)) },
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────────────────

export const createAccount = mutation({
  args: { name: v.string(), kind: accountKindV, scope: scopeV, openingBalance: v.number(), currency: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const name = cleanText(args.name, 60);
    if (!name) throw new ConvexError("Give the account a name.");
    const existing = await ctx.db.query("finAccounts").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return ctx.db.insert("finAccounts", {
      userId,
      name,
      kind: args.kind,
      scope: args.scope,
      currency: cleanText(args.currency, 8)?.toUpperCase(),
      openingBalance: cleanMoney(args.openingBalance, "opening balance"),
      order: existing.reduce((m, a) => Math.max(m, a.order), -1) + 1,
      createdAt: Date.now(),
    });
  },
});

export const updateAccount = mutation({
  args: {
    id: v.id("finAccounts"),
    name: v.optional(v.string()),
    kind: v.optional(accountKindV),
    scope: v.optional(scopeV),
    openingBalance: v.optional(v.number()),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    await own(ctx, userId, id, "Account");
    const patch: Partial<Account> = {};
    if (rest.name !== undefined) {
      const n = cleanText(rest.name, 60);
      if (!n) throw new ConvexError("Give the account a name.");
      patch.name = n;
    }
    if (rest.kind !== undefined) patch.kind = rest.kind;
    if (rest.scope !== undefined) patch.scope = rest.scope;
    if (rest.openingBalance !== undefined) patch.openingBalance = cleanMoney(rest.openingBalance, "opening balance");
    if (rest.archived !== undefined) patch.archived = rest.archived || undefined;
    await ctx.db.patch(id, patch);
  },
});

/** Delete an account with no history; otherwise ask to archive it. */
export const removeAccount = mutation({
  args: { id: v.id("finAccounts") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await own(ctx, userId, id, "Account");
    const used = await ctx.db.query("finTransactions").withIndex("by_account", (q) => q.eq("accountId", id)).first();
    const all = used ? [] : await ctx.db.query("finTransactions").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    if (used || all.some((t) => t.toAccountId === id)) throw new ConvexError("This account has transactions. Archive it instead to keep your history.");
    for (const r of await ctx.db.query("finRecurring").withIndex("by_user", (q) => q.eq("userId", userId)).collect()) {
      if (r.accountId === id) await ctx.db.patch(r._id, { accountId: undefined });
    }
    for (const g of await ctx.db.query("finGoals").withIndex("by_user", (q) => q.eq("userId", userId)).collect()) {
      if (g.accountId === id) await ctx.db.patch(g._id, { accountId: undefined });
    }
    await ctx.db.delete(id);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────

export const createCategory = mutation({
  args: { name: v.string(), type: flowTypeV, scope: catScopeV },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const name = cleanText(args.name, 50);
    if (!name) throw new ConvexError("Give the category a name.");
    const existing = await ctx.db.query("finCategories").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const dupe = existing.find((c) => !c.archived && c.type === args.type && c.name.toLowerCase() === name.toLowerCase());
    if (dupe) return dupe._id;
    return ctx.db.insert("finCategories", {
      userId,
      name,
      type: args.type,
      scope: args.scope,
      order: existing.reduce((m, c) => Math.max(m, c.order), -1) + 1,
    });
  },
});

export const updateCategory = mutation({
  args: { id: v.id("finCategories"), name: v.optional(v.string()), scope: v.optional(catScopeV), archived: v.optional(v.boolean()) },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    await own(ctx, userId, id, "Category");
    const patch: Partial<Category> = {};
    if (rest.name !== undefined) {
      const n = cleanText(rest.name, 50);
      if (!n) throw new ConvexError("Give the category a name.");
      patch.name = n;
    }
    if (rest.scope !== undefined) patch.scope = rest.scope;
    if (rest.archived !== undefined) patch.archived = rest.archived || undefined;
    await ctx.db.patch(id, patch);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Transactions
// ─────────────────────────────────────────────────────────────────────────

type TxLinks = {
  dealId?: Id<"deals"> | null;
  companyId?: Id<"companies"> | null;
  projectId?: Id<"projects"> | null;
};

async function assertTxLinks(ctx: Ctx, userId: Id<"users">, links: TxLinks) {
  if (links.dealId) await own(ctx, userId, links.dealId, "Deal");
  if (links.companyId) await own(ctx, userId, links.companyId, "Company");
  if (links.projectId) await own(ctx, userId, links.projectId, "Project");
}

/** Validate the money side of a transaction and return its normalised fields. */
async function resolveTx(
  ctx: Ctx,
  userId: Id<"users">,
  t: {
    type: Tx["type"];
    accountId: Id<"finAccounts">;
    toAccountId?: Id<"finAccounts">;
    categoryId?: Id<"finCategories">;
    scope?: Scope;
  },
  allowArchived: Set<string> = new Set(),
) {
  const acct = await own(ctx, userId, t.accountId, "Account");
  if (acct.archived && !allowArchived.has(acct._id)) throw new ConvexError(`“${acct.name}” is archived. Pick another account.`);
  if (t.type === "transfer") {
    if (!t.toAccountId) throw new ConvexError("Pick the account the money goes to.");
    if (t.toAccountId === t.accountId) throw new ConvexError("Pick two different accounts for a transfer.");
    const to = await own(ctx, userId, t.toAccountId, "Account");
    if (to.archived && !allowArchived.has(to._id)) throw new ConvexError(`“${to.name}” is archived. Pick another account.`);
    return { scope: acct.scope, categoryId: undefined, toAccountId: t.toAccountId };
  }
  let categoryId: Id<"finCategories"> | undefined;
  if (t.categoryId) {
    const c = await own(ctx, userId, t.categoryId, "Category");
    if (c.type !== t.type) throw new ConvexError(`“${c.name}” is an ${c.type} category. Pick an ${t.type} category.`);
    categoryId = c._id;
  }
  return { scope: t.scope ?? acct.scope, categoryId, toAccountId: undefined };
}

function cleanTags(tags: string[] | undefined) {
  if (!tags) return undefined;
  const out = [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 10);
  return out.length ? out : undefined;
}

export const addTransaction = mutation({
  args: {
    type: txTypeV,
    amount: v.number(),
    date: v.string(),
    accountId: v.id("finAccounts"),
    toAccountId: v.optional(v.id("finAccounts")),
    categoryId: v.optional(v.id("finCategories")),
    scope: v.optional(scopeV),
    payee: v.optional(v.string()),
    note: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    dealId: v.optional(v.id("deals")),
    companyId: v.optional(v.id("companies")),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    assertYmd(args.date);
    const amount = cleanAmount(args.amount);
    const base = await resolveTx(ctx, userId, args);
    await assertTxLinks(ctx, userId, args);
    const id = await ctx.db.insert("finTransactions", {
      userId,
      date: args.date,
      amount,
      type: args.type,
      accountId: args.accountId,
      toAccountId: base.toAccountId,
      categoryId: base.categoryId,
      scope: base.scope,
      payee: cleanText(args.payee, 120),
      note: cleanText(args.note, 500),
      tags: cleanTags(args.tags),
      dealId: args.dealId,
      companyId: args.companyId,
      projectId: args.projectId,
      createdAt: Date.now(),
    });
    const gained = await awardXp(ctx, userId, `fin-tx-${id}`, 2, "Logged money", args.date);
    return { id, xp: gained ? 2 : 0 };
  },
});

/** Patch a transaction (null clears an optional field). */
export const updateTransaction = mutation({
  args: {
    id: v.id("finTransactions"),
    type: v.optional(txTypeV),
    amount: v.optional(v.number()),
    date: v.optional(v.string()),
    accountId: v.optional(v.id("finAccounts")),
    toAccountId: v.optional(v.union(v.id("finAccounts"), v.null())),
    categoryId: v.optional(v.union(v.id("finCategories"), v.null())),
    scope: v.optional(scopeV),
    payee: v.optional(v.union(v.string(), v.null())),
    note: v.optional(v.union(v.string(), v.null())),
    tags: v.optional(v.array(v.string())),
    dealId: v.optional(v.union(v.id("deals"), v.null())),
    companyId: v.optional(v.union(v.id("companies"), v.null())),
    projectId: v.optional(v.union(v.id("projects"), v.null())),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const cur = await own(ctx, userId, id, "Transaction");
    if (rest.date !== undefined) assertYmd(rest.date);
    const merged = {
      type: rest.type ?? cur.type,
      accountId: rest.accountId ?? cur.accountId,
      toAccountId: rest.toAccountId === null ? undefined : (rest.toAccountId ?? cur.toAccountId),
      categoryId: rest.categoryId === null ? undefined : (rest.categoryId ?? cur.categoryId),
      scope: rest.scope ?? cur.scope,
    };
    // Keep working with an archived account the transaction already used.
    const base = await resolveTx(ctx, userId, merged, new Set([cur.accountId, cur.toAccountId ?? ""].filter(Boolean)));
    await assertTxLinks(ctx, userId, rest);
    const patch: Partial<Tx> = {
      type: merged.type,
      accountId: merged.accountId,
      toAccountId: base.toAccountId,
      categoryId: base.categoryId,
      scope: base.scope,
    };
    if (rest.amount !== undefined) patch.amount = cleanAmount(rest.amount);
    if (rest.date !== undefined) patch.date = rest.date;
    if (rest.payee !== undefined) patch.payee = cleanText(rest.payee, 120);
    if (rest.note !== undefined) patch.note = cleanText(rest.note, 500);
    if (rest.tags !== undefined) patch.tags = cleanTags(rest.tags);
    if (rest.dealId !== undefined) patch.dealId = rest.dealId ?? undefined;
    if (rest.companyId !== undefined) patch.companyId = rest.companyId ?? undefined;
    if (rest.projectId !== undefined) patch.projectId = rest.projectId ?? undefined;
    await ctx.db.patch(id, patch);
    // An invoice payment keeps the invoice's paid date in sync.
    if (cur.invoiceId && patch.date !== undefined) {
      const inv = await ownedOrNull(ctx, userId, cur.invoiceId);
      if (inv && inv.transactionId === id) await ctx.db.patch(inv._id, { paidOn: patch.date });
    }
  },
});

/**
 * Delete a transaction. Deleting an invoice payment re-opens the invoice.
 * Deleting a recurring item's "mark paid" payment moves the item's nextDue
 * back to the date it covered — only when nothing has moved it since (no
 * later payment / skip / manual edit), so we never guess.
 */
export const removeTransaction = mutation({
  args: { id: v.id("finTransactions") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const t = await own(ctx, userId, id, "Transaction");
    await ctx.db.delete(id);
    await revokeXp(ctx, userId, `fin-tx-${id}`);
    let reopened = false;
    if (t.invoiceId) {
      const inv = await ownedOrNull(ctx, userId, t.invoiceId);
      if (inv && inv.transactionId === id) {
        await ctx.db.patch(inv._id, { status: "sent", paidOn: undefined, transactionId: undefined });
        await revokeXp(ctx, userId, `fin-inv-paid-${inv._id}`);
        reopened = true;
      }
    }
    let recurring: { name: string; nextDue: string } | null = null;
    if (t.recurringId && t.recurringDue && YMD.test(t.recurringDue)) {
      const r = await ownedOrNull(ctx, userId, t.recurringId);
      if (r && r.nextDue === advanceDue(t.recurringDue, r.cadence, anchorOf(r))) {
        await ctx.db.patch(r._id, { nextDue: t.recurringDue });
        recurring = { name: r.name, nextDue: t.recurringDue };
      }
    }
    return { reopenedInvoice: reopened, recurring };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Budgets
// ─────────────────────────────────────────────────────────────────────────

/** Set (or clear with null/0) a category's monthly budget. `month` = one month only. */
export const setBudget = mutation({
  args: { categoryId: v.id("finCategories"), amount: v.union(v.number(), v.null()), month: v.optional(v.string()) },
  handler: async (ctx, { categoryId, amount, month }) => {
    const userId = await requireUser(ctx);
    const c = await own(ctx, userId, categoryId, "Category");
    if (c.type !== "expense") throw new ConvexError("Budgets are for expense categories.");
    if (month) assertYm(month);
    const all = await ctx.db.query("finBudgets").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const existing = all.find((b) => b.categoryId === categoryId && (b.month ?? null) === (month ?? null));
    if (amount == null || amount === 0) {
      if (existing) await ctx.db.delete(existing._id);
      return;
    }
    const n = cleanAmount(amount);
    if (existing) await ctx.db.patch(existing._id, { amount: n });
    else await ctx.db.insert("finBudgets", { userId, categoryId, amount: n, month: month || undefined });
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Recurring
// ─────────────────────────────────────────────────────────────────────────

const recurringFields = {
  name: v.string(),
  type: flowTypeV,
  kind: v.optional(v.string()),
  amount: v.number(),
  cadence: cadenceV,
  nextDue: v.string(),
  accountId: v.optional(v.id("finAccounts")),
  categoryId: v.optional(v.id("finCategories")),
  scope: scopeV,
  companyId: v.optional(v.id("companies")),
  note: v.optional(v.string()),
};

const KINDS = new Set(["subscription", "bill", "salary", "retainer", "loan", "other"]);

async function checkRecurringLinks(
  ctx: Ctx,
  userId: Id<"users">,
  r: { type: "income" | "expense"; accountId?: Id<"finAccounts"> | null; categoryId?: Id<"finCategories"> | null; companyId?: Id<"companies"> | null },
) {
  if (r.accountId) await own(ctx, userId, r.accountId, "Account");
  if (r.categoryId) {
    const c = await own(ctx, userId, r.categoryId, "Category");
    if (c.type !== r.type) throw new ConvexError(`“${c.name}” is an ${c.type} category.`);
  }
  if (r.companyId) await own(ctx, userId, r.companyId, "Company");
}

export const createRecurring = mutation({
  args: recurringFields,
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const name = cleanText(args.name, 80);
    if (!name) throw new ConvexError("Give it a name, like “Figma” or “Office rent”.");
    assertYmd(args.nextDue, "next due date");
    await checkRecurringLinks(ctx, userId, args);
    const kind = args.kind && KINDS.has(args.kind) ? args.kind : args.type === "income" ? "retainer" : "subscription";
    return ctx.db.insert("finRecurring", {
      userId,
      name,
      type: args.type,
      kind,
      amount: cleanAmount(args.amount),
      cadence: args.cadence,
      nextDue: args.nextDue,
      dueDay: dayOf(args.nextDue),
      accountId: args.accountId,
      categoryId: args.categoryId,
      scope: args.scope,
      companyId: args.companyId,
      active: true,
      note: cleanText(args.note, 300),
      createdAt: Date.now(),
    });
  },
});

export const updateRecurring = mutation({
  args: {
    id: v.id("finRecurring"),
    name: v.optional(v.string()),
    type: v.optional(flowTypeV),
    kind: v.optional(v.string()),
    amount: v.optional(v.number()),
    cadence: v.optional(cadenceV),
    nextDue: v.optional(v.string()),
    accountId: v.optional(v.union(v.id("finAccounts"), v.null())),
    categoryId: v.optional(v.union(v.id("finCategories"), v.null())),
    scope: v.optional(scopeV),
    companyId: v.optional(v.union(v.id("companies"), v.null())),
    active: v.optional(v.boolean()),
    note: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const cur = await own(ctx, userId, id, "Recurring item");
    const type = rest.type ?? cur.type;
    const categoryId = rest.categoryId === null ? undefined : (rest.categoryId ?? cur.categoryId);
    await checkRecurringLinks(ctx, userId, { type, accountId: rest.accountId, categoryId, companyId: rest.companyId });
    const patch: Partial<Doc<"finRecurring">> = { type, categoryId };
    if (rest.name !== undefined) {
      const n = cleanText(rest.name, 80);
      if (!n) throw new ConvexError("Give it a name.");
      patch.name = n;
    }
    if (rest.kind !== undefined && KINDS.has(rest.kind)) patch.kind = rest.kind;
    if (rest.amount !== undefined) patch.amount = cleanAmount(rest.amount);
    if (rest.cadence !== undefined) patch.cadence = rest.cadence;
    if (rest.nextDue !== undefined) {
      assertYmd(rest.nextDue, "next due date");
      patch.nextDue = rest.nextDue;
    }
    // Re-anchor the day of month only when the date (or cadence) really
    // changed: the edit form always re-sends nextDue, and a clamped Feb 28
    // must not overwrite a 31st anchor.
    if ((rest.nextDue !== undefined && rest.nextDue !== cur.nextDue) || (rest.cadence !== undefined && rest.cadence !== cur.cadence)) {
      patch.dueDay = dayOf(patch.nextDue ?? cur.nextDue);
    }
    if (rest.accountId !== undefined) patch.accountId = rest.accountId ?? undefined;
    if (rest.scope !== undefined) patch.scope = rest.scope;
    if (rest.companyId !== undefined) patch.companyId = rest.companyId ?? undefined;
    if (rest.active !== undefined) patch.active = rest.active;
    if (rest.note !== undefined) patch.note = cleanText(rest.note, 300);
    await ctx.db.patch(id, patch);
  },
});

export const removeRecurring = mutation({
  args: { id: v.id("finRecurring") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await own(ctx, userId, id, "Recurring item");
    // Past payments stay in your history; they just lose the link.
    const txs = await ctx.db.query("finTransactions").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const t of txs) if (t.recurringId === id) await ctx.db.patch(t._id, { recurringId: undefined });
    await ctx.db.delete(id);
  },
});

/** Log this cycle's payment as a transaction and move nextDue forward one cadence. */
export const markRecurringPaid = mutation({
  args: {
    id: v.id("finRecurring"),
    date: v.string(), // client-local day it was paid
    amount: v.optional(v.number()),
    accountId: v.optional(v.id("finAccounts")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    assertYmd(args.date);
    const r = await own(ctx, userId, args.id, "Recurring item");
    const accounts = await ctx.db.query("finAccounts").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    let accountId = args.accountId ?? r.accountId;
    const chosen = accountId ? accounts.find((a) => a._id === accountId && !a.archived) : undefined;
    if (!chosen) accountId = defaultAccount(accounts, r.scope)?._id;
    if (!accountId) throw new ConvexError(`Add a ${r.scope} account first, so we know where the money ${r.type === "income" ? "lands" : "comes from"}.`);
    let categoryId = r.categoryId;
    if (categoryId) {
      const c = await ownedOrNull(ctx, userId, categoryId);
      if (!c || c.type !== r.type) categoryId = undefined;
    }
    const txId = await ctx.db.insert("finTransactions", {
      userId,
      date: args.date,
      amount: cleanAmount(args.amount ?? r.amount),
      type: r.type,
      accountId,
      categoryId,
      scope: r.scope,
      payee: r.name,
      companyId: r.companyId,
      recurringId: r._id,
      recurringDue: r.nextDue,
      createdAt: Date.now(),
    });
    const dueDay = anchorOf(r);
    const nextDue = advanceDue(r.nextDue, r.cadence, dueDay);
    await ctx.db.patch(r._id, { nextDue, dueDay });
    const gained = await awardXp(ctx, userId, `fin-tx-${txId}`, 2, `${r.type === "income" ? "Received" : "Paid"} ${r.name}`, args.date);
    return { txId, nextDue, xp: gained ? 2 : 0 };
  },
});

/** Skip this cycle without logging money (e.g. a free month). */
export const skipRecurring = mutation({
  args: { id: v.id("finRecurring") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const r = await own(ctx, userId, id, "Recurring item");
    const dueDay = anchorOf(r);
    const nextDue = advanceDue(r.nextDue, r.cadence, dueDay);
    await ctx.db.patch(id, { nextDue, dueDay });
    return { nextDue };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Invoices
// ─────────────────────────────────────────────────────────────────────────

function nextInvoiceNumber(list: Doc<"finInvoices">[]) {
  let max = 0;
  for (const i of list) {
    const m = /(\d+)\s*$/.exec(i.number ?? "");
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `INV-${String(Math.max(max, list.length) + 1).padStart(4, "0")}`;
}

async function assertInvoiceLinks(
  ctx: Ctx,
  userId: Id<"users">,
  l: { companyId?: Id<"companies"> | null; personId?: Id<"people"> | null; dealId?: Id<"deals"> | null; projectId?: Id<"projects"> | null },
) {
  if (l.companyId) await own(ctx, userId, l.companyId, "Company");
  if (l.personId) await own(ctx, userId, l.personId, "Person");
  if (l.dealId) await own(ctx, userId, l.dealId, "Deal");
  if (l.projectId) await own(ctx, userId, l.projectId, "Project");
}

export const createInvoice = mutation({
  args: {
    title: v.string(),
    amount: v.number(),
    issuedOn: v.string(),
    dueOn: v.string(),
    number: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("sent"))),
    companyId: v.optional(v.id("companies")),
    personId: v.optional(v.id("people")),
    dealId: v.optional(v.id("deals")),
    projectId: v.optional(v.id("projects")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const title = cleanText(args.title, 120);
    if (!title) throw new ConvexError("Give the invoice a title, like “Website build: milestone 1”.");
    assertYmd(args.issuedOn, "issue date");
    assertYmd(args.dueOn, "due date");
    if (args.dueOn < args.issuedOn) throw new ConvexError("The due date can't be before the issue date.");
    await assertInvoiceLinks(ctx, userId, args);
    const list = await ctx.db.query("finInvoices").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const settings = await getSettings(ctx, userId);
    return ctx.db.insert("finInvoices", {
      userId,
      number: cleanText(args.number, 30) ?? nextInvoiceNumber(list),
      title,
      companyId: args.companyId,
      personId: args.personId,
      dealId: args.dealId,
      projectId: args.projectId,
      amount: cleanAmount(args.amount),
      currency: settings.currency,
      issuedOn: args.issuedOn,
      dueOn: args.dueOn,
      status: args.status ?? "draft",
      notes: cleanText(args.notes, 1000),
      createdAt: Date.now(),
    });
  },
});

export const updateInvoice = mutation({
  args: {
    id: v.id("finInvoices"),
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    issuedOn: v.optional(v.string()),
    dueOn: v.optional(v.string()),
    number: v.optional(v.union(v.string(), v.null())),
    companyId: v.optional(v.union(v.id("companies"), v.null())),
    personId: v.optional(v.union(v.id("people"), v.null())),
    dealId: v.optional(v.union(v.id("deals"), v.null())),
    projectId: v.optional(v.union(v.id("projects"), v.null())),
    notes: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const cur = await own(ctx, userId, id, "Invoice");
    await assertInvoiceLinks(ctx, userId, rest);
    const patch: Partial<Doc<"finInvoices">> = {};
    if (rest.title !== undefined) {
      const t = cleanText(rest.title, 120);
      if (!t) throw new ConvexError("Give the invoice a title.");
      patch.title = t;
    }
    if (rest.amount !== undefined) patch.amount = cleanAmount(rest.amount);
    if (rest.issuedOn !== undefined) {
      assertYmd(rest.issuedOn, "issue date");
      patch.issuedOn = rest.issuedOn;
    }
    if (rest.dueOn !== undefined) {
      assertYmd(rest.dueOn, "due date");
      patch.dueOn = rest.dueOn;
    }
    if ((patch.dueOn ?? cur.dueOn) < (patch.issuedOn ?? cur.issuedOn)) throw new ConvexError("The due date can't be before the issue date.");
    if (rest.number !== undefined) patch.number = cleanText(rest.number, 30);
    if (rest.companyId !== undefined) patch.companyId = rest.companyId ?? undefined;
    if (rest.personId !== undefined) patch.personId = rest.personId ?? undefined;
    if (rest.dealId !== undefined) patch.dealId = rest.dealId ?? undefined;
    if (rest.projectId !== undefined) patch.projectId = rest.projectId ?? undefined;
    if (rest.notes !== undefined) patch.notes = cleanText(rest.notes, 1000);
    await ctx.db.patch(id, patch);
    // Keep the linked payment's amount in step with the invoice.
    if (patch.amount !== undefined && cur.status === "paid" && cur.transactionId) {
      const tx = await ownedOrNull(ctx, userId, cur.transactionId);
      if (tx) await ctx.db.patch(tx._id, { amount: patch.amount });
    }
  },
});

/** Unpay an invoice: delete its payment transaction and take back the XP. */
async function unpay(ctx: MutationCtx, userId: Id<"users">, inv: Doc<"finInvoices">) {
  if (inv.transactionId) {
    const tx = await ownedOrNull(ctx, userId, inv.transactionId);
    if (tx) {
      await ctx.db.delete(tx._id);
      await revokeXp(ctx, userId, `fin-tx-${tx._id}`);
    }
  }
  await revokeXp(ctx, userId, `fin-inv-paid-${inv._id}`);
}

/** Move an invoice between draft / sent / void (un-paying it if needed). */
export const setInvoiceStatus = mutation({
  args: { id: v.id("finInvoices"), status: v.union(v.literal("draft"), v.literal("sent"), v.literal("void")) },
  handler: async (ctx, { id, status }) => {
    const userId = await requireUser(ctx);
    const inv = await own(ctx, userId, id, "Invoice");
    if (inv.status === status) return;
    if (inv.status === "paid") await unpay(ctx, userId, inv);
    await ctx.db.patch(id, { status, paidOn: undefined, transactionId: undefined });
  },
});

/**
 * Mark paid: logs a business income transaction (category "Client revenue")
 * linked to the invoice, and rewards you.
 */
export const markInvoicePaid = mutation({
  args: { id: v.id("finInvoices"), date: v.string(), accountId: v.optional(v.id("finAccounts")) },
  handler: async (ctx, { id, date, accountId }) => {
    const userId = await requireUser(ctx);
    assertYmd(date);
    const inv = await own(ctx, userId, id, "Invoice");
    if (inv.status === "paid") return { txId: inv.transactionId ?? null, xp: 0 };
    if (inv.status === "void") throw new ConvexError("This invoice is void. Re-open it first.");
    const accounts = await ctx.db.query("finAccounts").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    let acct = accountId ? accounts.find((a) => a._id === accountId && !a.archived) : undefined;
    if (accountId && !acct) throw new ConvexError("Account not found.");
    acct = acct ?? defaultAccount(accounts, "business") ?? undefined;
    if (!acct) throw new ConvexError("Add a business account first, so we know where the money lands.");

    const cats = await ctx.db.query("finCategories").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const cat = cats.find((c) => !c.archived && c.type === "income" && c.name.toLowerCase() === "client revenue");
    let categoryId = cat?._id;
    if (!categoryId) {
      categoryId = await ctx.db.insert("finCategories", {
        userId,
        name: "Client revenue",
        type: "income",
        scope: "business",
        order: cats.reduce((m, c) => Math.max(m, c.order), -1) + 1,
      });
    }
    const co = await ownedOrNull(ctx, userId, inv.companyId);
    const txId = await ctx.db.insert("finTransactions", {
      userId,
      date,
      amount: inv.amount,
      type: "income",
      accountId: acct._id,
      categoryId,
      scope: "business",
      payee: co?.name ?? inv.title,
      note: inv.number ? `Invoice ${inv.number} · ${inv.title}` : `Invoice · ${inv.title}`,
      dealId: inv.dealId,
      companyId: inv.companyId,
      projectId: inv.projectId,
      invoiceId: inv._id,
      createdAt: Date.now(),
    });
    await ctx.db.patch(id, { status: "paid", paidOn: date, transactionId: txId });
    const gained = await awardXp(ctx, userId, `fin-inv-paid-${id}`, 15, `Invoice paid: ${inv.title}`, date);
    return { txId, xp: gained ? 15 : 0 };
  },
});

/** Delete an invoice. A recorded payment stays in your transactions. */
export const removeInvoice = mutation({
  args: { id: v.id("finInvoices") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const inv = await own(ctx, userId, id, "Invoice");
    if (inv.transactionId) {
      const tx = await ownedOrNull(ctx, userId, inv.transactionId);
      if (tx) await ctx.db.patch(tx._id, { invoiceId: undefined });
    }
    await revokeXp(ctx, userId, `fin-inv-paid-${id}`);
    await ctx.db.delete(id);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Goals
// ─────────────────────────────────────────────────────────────────────────

export const createGoal = mutation({
  args: {
    name: v.string(),
    target: v.number(),
    scope: scopeV,
    accountId: v.optional(v.id("finAccounts")),
    saved: v.optional(v.number()),
    deadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const name = cleanText(args.name, 80);
    if (!name) throw new ConvexError("Name the goal, like “Emergency fund”.");
    if (args.accountId) await own(ctx, userId, args.accountId, "Account");
    if (args.deadline) assertYmd(args.deadline, "deadline");
    return ctx.db.insert("finGoals", {
      userId,
      name,
      target: cleanAmount(args.target),
      scope: args.scope,
      accountId: args.accountId,
      saved: args.accountId ? undefined : args.saved != null ? cleanMoney(args.saved, "saved amount") : 0,
      deadline: args.deadline || undefined,
      createdAt: Date.now(),
    });
  },
});

export const updateGoal = mutation({
  args: {
    id: v.id("finGoals"),
    name: v.optional(v.string()),
    target: v.optional(v.number()),
    scope: v.optional(scopeV),
    accountId: v.optional(v.union(v.id("finAccounts"), v.null())),
    saved: v.optional(v.number()),
    deadline: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    await own(ctx, userId, id, "Goal");
    const patch: Partial<Doc<"finGoals">> = {};
    if (rest.name !== undefined) {
      const n = cleanText(rest.name, 80);
      if (!n) throw new ConvexError("Name the goal.");
      patch.name = n;
    }
    if (rest.target !== undefined) patch.target = cleanAmount(rest.target);
    if (rest.scope !== undefined) patch.scope = rest.scope;
    if (rest.accountId !== undefined) {
      if (rest.accountId) await own(ctx, userId, rest.accountId, "Account");
      patch.accountId = rest.accountId ?? undefined;
    }
    if (rest.saved !== undefined) patch.saved = cleanMoney(rest.saved, "saved amount");
    if (rest.deadline !== undefined) {
      if (rest.deadline) assertYmd(rest.deadline, "deadline");
      patch.deadline = rest.deadline || undefined;
    }
    await ctx.db.patch(id, patch);
  },
});

export const removeGoal = mutation({
  args: { id: v.id("finGoals") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await own(ctx, userId, id, "Goal");
    await ctx.db.delete(id);
  },
});
