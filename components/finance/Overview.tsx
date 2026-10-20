"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Flame,
  Info,
  Landmark,
  Lightbulb,
  PiggyBank,
  Receipt,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Bar, Chip, EmptyHint, Ring, Section, buttonVariants, cn } from "@/components/os/kit";
import { errorMessage, reward, toast } from "@/components/os/celebrate";
import { useStable } from "@/components/os/useCockpit";
import { relDay, useToday } from "@/lib/day";
import { BudgetBar, Delta, ScopeChip, StatTile, budgetTone } from "./bits";
import { CashflowChart } from "./CashflowChart";
import { InlineQuickAdd, type Meta } from "./QuickAdd";
import { fmtMonth, addMonthsYm, kindLabel, renderMoneyText, useMoney, whenLabel, type Money, type ScopeFilter } from "./lib";

export type Drill = { categoryId?: Id<"finCategories"> };

export function Overview({
  meta,
  scope,
  month,
  onMonth,
  onTab,
  onDrill,
}: {
  meta: Meta;
  scope: ScopeFilter;
  month: string;
  onMonth: (m: string) => void;
  onTab: (t: string) => void;
  onDrill: (d: Drill) => void;
}) {
  const today = useToday();
  const data = useStable(useQuery(api.finance.overview, { today, month, scope }));
  const money = useMoney(meta.currency);
  const payBill = useMutation(api.finance.markRecurringPaid);
  const payInvoice = useMutation(api.finance.markInvoicePaid);
  const [busy, setBusy] = useState<string | null>(null);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-16" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="skeleton h-72 lg:col-span-2" />
          <div className="skeleton h-72" />
        </div>
      </div>
    );
  }

  const t = data.totals;
  const prevLabel = fmtMonth(addMonthsYm(month, -1), "tiny");
  const defaultScope = scope === "business" ? "business" : "personal";

  async function markBill(id: Id<"finRecurring">, name: string) {
    setBusy(id);
    try {
      const r = await payBill({ id, date: today });
      reward(`${name} paid · next due ${whenLabel(r.nextDue, today)}`, r.xp || undefined);
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    } finally {
      setBusy(null);
    }
  }
  async function markInvoice(id: Id<"finInvoices">, title: string) {
    setBusy(id);
    try {
      const r = await payInvoice({ id, date: today });
      reward(`Paid: ${title}`, r.xp || undefined, true);
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    } finally {
      setBusy(null);
    }
  }

  const maxSpend = Math.max(1, ...data.spending.map((s) => s.amount));

  return (
    <div className="space-y-4">
      {data.isCurrent && <InlineQuickAdd meta={meta} defaultScope={defaultScope} className="os-rise" />}

      {/* This month */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={`Income · ${fmtMonth(month, "tiny")}`}
          icon={ArrowDownLeft}
          value={money.fmt(t.income)}
          sub={<Delta cur={t.income} prev={t.prevIncome} goodWhenUp label={prevLabel} />}
        />
        <StatTile
          label={`Expenses · ${fmtMonth(month, "tiny")}`}
          icon={ArrowUpRight}
          value={money.fmt(t.expense)}
          sub={<Delta cur={t.expense} prev={t.prevExpense} goodWhenUp={false} label={prevLabel} />}
        />
        <StatTile
          label="Net"
          icon={Scale}
          value={`${t.net > 0 ? "+" : ""}${money.fmt(t.net)}`}
          tone={t.net > 0 ? "success" : t.net < 0 ? "warning" : undefined}
          sub={t.net >= 0 ? "Money kept this month" : "Spent more than came in"}
        />
        <StatTile
          label="Savings rate"
          icon={PiggyBank}
          value={t.savingsRate == null ? "—" : `${t.savingsRate}%`}
          tone={t.savingsRate != null && t.savingsRate >= 20 ? "success" : t.savingsRate != null && t.savingsRate < 0 ? "warning" : undefined}
          sub={t.savingsRate == null ? "Log income to see it" : t.savingsRate >= 20 ? "Healthy: 20%+ kept" : "Share of income you kept"}
        />
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {data.insights.map((ins) => {
            const I = ins.tone === "success" ? CheckCircle2 : ins.tone === "warning" ? AlertTriangle : ins.tone === "info" ? TrendingUp : Lightbulb;
            const inner = (
              <>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
                    ins.tone === "success" && "bg-success-soft text-success",
                    ins.tone === "warning" && "bg-warning-soft text-warning",
                    ins.tone === "info" && "bg-info-soft text-info",
                  )}
                >
                  <I className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 text-left text-sm leading-snug">{renderMoneyText(ins.text, money)}</span>
              </>
            );
            return ins.tab ? (
              <button
                key={ins.id}
                type="button"
                onClick={() => onTab(ins.tab!)}
                className="os-rise flex items-start gap-2.5 rounded-xl border border-border bg-card p-3 shadow-card transition-colors hover:bg-accent/40"
              >
                {inner}
              </button>
            ) : (
              <div key={ins.id} className="os-rise flex items-start gap-2.5 rounded-xl border border-border bg-card p-3 shadow-card">
                {inner}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Cashflow · last 12 months" icon={TrendingUp} className="min-w-0 lg:col-span-2" hint="Click a month to open it.">
          <CashflowChart data={data.cashflow} money={money} selected={month} onSelect={onMonth} />
        </Section>
        <RunwayCard burn={data.burn} businessCash={data.cash.businessCash} money={money} onTab={onTab} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Section
          title={`Where it went · ${fmtMonth(month, "tiny")}`}
          icon={Receipt}
          className="min-w-0 lg:col-span-7"
          action={
            <button type="button" onClick={() => onTab("transactions")} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              All transactions
            </button>
          }
        >
          {data.spending.length === 0 ? (
            <EmptyHint icon={Receipt} title="No spending logged this month" hint="Every expense you log lands here by category, so you see where the money really goes." />
          ) : (
            <ul className="space-y-2.5">
              {data.spending.slice(0, 9).map((s) => {
                const diff = s.prev > 0 ? Math.round(((s.amount - s.prev) / s.prev) * 100) : null;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      disabled={!s.categoryId}
                      onClick={() => s.categoryId && onDrill({ categoryId: s.categoryId })}
                      className="group w-full rounded-lg px-1 py-0.5 text-left enabled:hover:bg-accent/40"
                    >
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium">{s.name}</span>
                        <span className="shrink-0 tabular-nums">
                          {money.fmt(s.amount)}
                          <span className="ml-2 inline-block w-11 text-right text-xs text-muted-foreground">{s.pct}%</span>
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${(s.amount / maxSpend) * 100}%`, background: "var(--chart-1)" }} />
                        </div>
                        <span className="w-24 shrink-0 text-right text-[11px] text-muted-foreground">
                          {diff == null ? "new" : diff === 0 ? "same" : `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff)}% vs ${prevLabel}`}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
              {data.spending.length > 9 && <li className="px-1 text-xs text-muted-foreground">+{data.spending.length - 9} more categories</li>}
            </ul>
          )}
        </Section>

        <Section
          title="Budget vs actual"
          icon={Target}
          className="min-w-0 lg:col-span-5"
          action={
            <button type="button" onClick={() => onTab("budgets")} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Budgets
            </button>
          }
        >
          {data.budgets.length === 0 ? (
            <EmptyHint
              icon={Target}
              title="No budgets yet"
              hint="Give a few categories a monthly limit. You'll see a calm heads-up at 80%."
              action={
                <button type="button" onClick={() => onTab("budgets")} className={buttonVariants({ size: "sm" })}>
                  Set budgets
                </button>
              }
            />
          ) : (
            <ul className="space-y-3.5">
              {data.budgets.slice(0, 7).map((b) => {
                const tone = budgetTone(b.pct);
                return (
                  <li key={b.categoryId}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate font-medium">{b.name}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        <span className="font-medium text-foreground">{money.fmt(b.spent)}</span> / {money.fmt(b.budget)}
                      </span>
                    </div>
                    <BudgetBar spent={b.spent} budget={b.budget} />
                    <p className={cn("mt-1 text-[11px]", tone === "success" ? "text-muted-foreground" : tone === "warning" ? "text-warning" : "text-danger")}>
                      {b.remaining >= 0 ? `${money.fmt(b.remaining)} left · ${b.pct}% used` : `${money.fmt(-b.remaining)} over budget`}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Section
          title="Cash by account"
          icon={Landmark}
          className="min-w-0"
          action={
            <button type="button" onClick={() => onTab("accounts")} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Accounts
            </button>
          }
        >
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <div className="text-2xl font-semibold tracking-tight">
                {money.fmt(scope === "business" ? data.cash.businessCash : scope === "personal" ? data.cash.personalCash : data.cash.cash)}
              </div>
              <div className="text-xs text-muted-foreground">Cash on hand{scope !== "all" ? ` · ${scope}` : ""}</div>
            </div>
            {scope === "all" && data.cash.netWorth !== data.cash.cash && (
              <div className="text-right text-xs text-muted-foreground">
                Net worth
                <div className="text-sm font-medium tabular-nums text-foreground">{money.fmt(data.cash.netWorth)}</div>
              </div>
            )}
          </div>
          {data.cash.accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts in this view.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.cash.accounts.map((a) => (
                <li key={a._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{a.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {kindLabel(a.kind)} · {a.scope === "business" ? "Business" : "Personal"}
                    </div>
                  </div>
                  <span className={cn("shrink-0 tabular-nums", a.balance < 0 && "text-warning")}>{money.fmt(a.balance)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Bills · next 14 days"
          icon={CalendarClock}
          className="min-w-0"
          hint={data.subscriptionsMonthly > 0 ? `Subscriptions: ${money.fmt(data.subscriptionsMonthly)}/month` : undefined}
          action={
            <button type="button" onClick={() => onTab("recurring")} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Recurring
            </button>
          }
        >
          {data.bills.length === 0 ? (
            <EmptyHint
              icon={CalendarClock}
              title="Nothing due soon"
              hint="Add subscriptions and bills once. We'll remind you and log them in one tap."
              className="py-6"
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.bills.slice(0, 6).map((b) => (
                <li key={b._id} className="flex items-center gap-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{b.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {b.overdue ? (
                        <Chip tone="warning" className="px-1.5 py-0 text-[10px]">
                          {-b.days === 1 ? "1 day late" : `${-b.days} days late`}
                        </Chip>
                      ) : b.days === 0 ? (
                        <Chip tone="info" className="px-1.5 py-0 text-[10px]">
                          Today
                        </Chip>
                      ) : (
                        <span>{relDay(b.nextDue, today)}</span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 tabular-nums">{money.fmt(b.amount)}</span>
                  <button
                    type="button"
                    disabled={busy === b._id}
                    onClick={() => markBill(b._id, b.name)}
                    className={buttonVariants({ variant: b.overdue || b.days <= 0 ? "default" : "outline", size: "sm", className: "h-7 px-2" })}
                  >
                    Paid
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {data.invoices.show ? (
          <Section
            title="Money owed to you"
            icon={Receipt}
            className="min-w-0"
            hint={
              data.invoices.openCount > 0
                ? `${money.fmt(data.invoices.outstanding)} outstanding${data.invoices.overdueCount ? ` · ${money.fmt(data.invoices.overdueAmount)} overdue` : ""}`
                : undefined
            }
            action={
              <button type="button" onClick={() => onTab("invoices")} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Invoices
              </button>
            }
          >
            {data.invoices.rows.length === 0 ? (
              <EmptyHint icon={Receipt} title="No unpaid invoices" hint="Send an invoice (or bill a won deal) and track it until the cash lands." className="py-6" />
            ) : (
              <ul className="divide-y divide-border">
                {data.invoices.rows.map((i) => (
                  <li key={i._id} className="flex items-center gap-3 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{i.companyName ?? i.title}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {i.overdue ? (
                          <Chip tone="warning" className="px-1.5 py-0 text-[10px]">
                            {i.daysOverdue}d overdue
                          </Chip>
                        ) : (
                          <span>Due {whenLabel(i.dueOn, today)}</span>
                        )}
                        {i.companyName && <span className="truncate">· {i.title}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 tabular-nums">{money.fmt(i.amount)}</span>
                    <button
                      type="button"
                      disabled={busy === i._id}
                      onClick={() => markInvoice(i._id, i.title)}
                      className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 px-2" })}
                    >
                      Paid
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        ) : (
          <GoalsCard goals={data.goals} money={money} onTab={onTab} />
        )}
      </div>

      {data.invoices.show && data.goals.length > 0 && <GoalsCard goals={data.goals} money={money} onTab={onTab} wide />}
    </div>
  );
}

type OverviewData = FunctionReturnType<typeof api.finance.overview>;

function RunwayCard({
  burn,
  businessCash,
  money,
  onTab,
}: {
  burn: OverviewData["burn"];
  businessCash: number;
  money: Money;
  onTab: (t: string) => void;
}) {
  const r = burn.runwayMonths;
  const positive = r == null && burn.hasData && (burn.burn > 0 || burn.income > 0);
  const pct = r == null ? (positive ? 100 : 0) : Math.min(100, (r / 12) * 100);
  const tone = r == null ? "success" : r >= 12 ? "success" : r >= 6 ? "primary" : "warning";
  const headline = !burn.hasData ? "—" : positive ? "Profitable" : r == null ? "—" : r >= 99 ? "99+ mo" : `${r} mo`;
  const copy = !burn.hasData
    ? "Log business income and expenses to see how long your cash lasts."
    : positive
      ? "Business income covers spending. Every month adds to the bank."
      : r == null
        ? "Not enough business activity yet to estimate runway."
        : r >= 12
          ? "Comfortable. A year or more of cash at this burn."
          : r >= 6
            ? "Healthy. Keep revenue moving and watch big new costs."
            : r >= 3
              ? "Getting short. Prioritise collections and closing deals."
              : "Tight. Make cash this week's #1 focus: invoices, deals, cuts.";
  return (
    <Section title="Business runway" icon={Flame} className="min-w-0" hint={burn.partial ? "Based on this month so far" : `Avg of the last ${burn.months} month${burn.months === 1 ? "" : "s"}`}>
      <div className="flex items-center gap-4">
        <Ring value={pct} size={88} stroke={8} tone={tone}>
          <span className="text-center">
            <span className="block text-lg font-semibold leading-none">{headline}</span>
            {r != null && r < 99 && <span className="block text-[10px] text-muted-foreground">runway</span>}
          </span>
        </Ring>
        <p className="text-sm leading-snug text-muted-foreground">{copy}</p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Business cash</dt>
          <dd className={cn("font-semibold tabular-nums", businessCash < 0 && "text-warning")}>{money.fmt(businessCash)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Burn / month</dt>
          <dd className="font-semibold tabular-nums">{money.fmt(burn.burn)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Income / month</dt>
          <dd className="font-semibold tabular-nums">{money.fmt(burn.income)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Net burn</dt>
          <dd className={cn("font-semibold tabular-nums", burn.netBurn <= 0 && burn.hasData && "text-success")}>
            {burn.netBurn <= 0 ? `+${money.fmt(-burn.netBurn)}` : money.fmt(burn.netBurn)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <Info className="mt-px h-3 w-3 shrink-0" />
        Runway = business cash ÷ net burn. Owner draws count as burn; money you move in doesn&apos;t count as income.
      </p>
      {!burn.hasData && (
        <button type="button" onClick={() => onTab("transactions")} className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}>
          <Sparkles className="h-3.5 w-3.5" /> Log business money
        </button>
      )}
    </Section>
  );
}

function GoalsCard({
  goals,
  money,
  onTab,
  wide,
}: {
  goals: OverviewData["goals"];
  money: Money;
  onTab: (t: string) => void;
  wide?: boolean;
}) {
  return (
    <Section
      title="Savings goals"
      icon={PiggyBank}
      className="min-w-0"
      action={
        <button type="button" onClick={() => onTab("accounts")} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Goals
        </button>
      }
    >
      {goals.length === 0 ? (
        <EmptyHint
          icon={PiggyBank}
          title="No savings goals yet"
          hint="An emergency fund, 6 months of runway, a laptop. Name it and watch it fill."
          className="py-6"
          action={
            <button type="button" onClick={() => onTab("accounts")} className={buttonVariants({ size: "sm" })}>
              Add a goal
            </button>
          }
        />
      ) : (
        <ul className={cn("grid gap-4", wide && "sm:grid-cols-2 xl:grid-cols-3")}>
          {goals.map((g) => (
            <li key={g._id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-1.5 truncate font-medium">
                  {g.name}
                  {wide && <ScopeChip scope={g.scope} className="px-1.5 py-0 text-[10px]" />}
                </span>
                <span className="shrink-0 text-xs font-medium tabular-nums">{g.pct}%</span>
              </div>
              <Bar value={g.pct} tone={g.pct >= 100 ? "success" : "primary"} height="h-2" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {money.fmt(g.current)} of {money.fmt(g.target)}
                {g.deadline && ` · by ${relDay(g.deadline)}`}
                {g.accountName && ` · ${g.accountName}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
