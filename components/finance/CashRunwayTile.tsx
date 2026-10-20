"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Wallet, ArrowUpRight, AlertTriangle } from "lucide-react";
import { cn, Chip } from "@/components/os/kit";
import { useStable } from "@/components/os/useCockpit";
import { useToday } from "@/lib/day";
import { useMoney } from "./lib";

/** Founder HQ → Revenue engine: business cash, runway, this month, receivables. */
export function CashRunwayTile() {
  const today = useToday();
  const s = useStable(useQuery(api.finance.summary, { today }));
  const money = useMoney(s?.currency);
  if (s === undefined) return <div className="skeleton h-[84px]" />;
  if (!s.ready)
    return (
      <Link href="/finance" className="flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-3 text-sm transition hover:bg-accent">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-muted-foreground">Set up Finance to see cash, burn and runway here.</span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    );
  const runway = s.runwayMonths;
  const tone = runway == null ? "success" : runway >= 12 ? "success" : runway >= 6 ? "info" : runway >= 3 ? "warning" : "danger";
  return (
    <Link href="/finance" className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm transition hover:bg-accent sm:grid-cols-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Business cash</p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums">{money.fmt(s.businessCash)}</p>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Runway</p>
        <p className={cn("mt-0.5 text-lg font-semibold tabular-nums", tone === "danger" && "text-danger", tone === "warning" && "text-warning")}>
          {runway == null ? (s.business.income || s.business.expense ? "Profitable" : "No data yet") : `${runway.toFixed(1)} mo`}
        </p>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Business net · month</p>
        {(() => {
          const net = s.business.income - s.business.expense;
          return <p className={cn("mt-0.5 text-lg font-semibold tabular-nums", net < 0 ? "text-danger" : "text-success")}>{money.fmt(net)}</p>;
        })()}
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Receivables</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-lg font-semibold tabular-nums">
          {money.fmt(s.outstandingInvoices.amount)}
          {s.overdueInvoices.count > 0 && (
            <Chip tone="danger" title={`${s.overdueInvoices.count} overdue invoice${s.overdueInvoices.count === 1 ? "" : "s"}`}>
              <AlertTriangle /> {money.fmt(s.overdueInvoices.amount)}
            </Chip>
          )}
        </p>
      </div>
    </Link>
  );
}

/** Today → right rail: bills due/overdue and overdue invoices. */
export function MoneyTodayCard() {
  const today = useToday();
  const f = useStable(useQuery(api.finance.today, { date: today }));
  const money = useMoney(f?.currency);
  if (!f || f.count === 0) return null;
  return (
    <section className="rounded-xl border border-border bg-card text-card-foreground shadow-card">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Wallet className="h-4 w-4 text-muted-foreground" /> Money
        </h2>
        <Link href="/finance" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          Finance <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="space-y-1.5 p-4 pt-3 text-sm sm:p-5 sm:pt-3">
        {f.bills.top.map((b: { _id: string; name: string; amount: number; nextDue: string }) => (
          <Link key={b._id} href="/finance?tab=recurring" className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-accent">
            <span className="min-w-0 flex-1 truncate">{b.name}</span>
            <span className={cn("shrink-0 text-xs tabular-nums", b.nextDue < today ? "text-danger" : "text-muted-foreground")}>
              {money.fmt(b.amount)} · {b.nextDue < today ? "overdue" : "due today"}
            </span>
          </Link>
        ))}
        {f.invoices.top.map((i: { _id: string; title: string; amount: number; dueOn: string }) => (
          <Link key={i._id} href="/finance?tab=invoices" className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-accent">
            <span className="min-w-0 flex-1 truncate">Invoice: {i.title}</span>
            <span className="shrink-0 text-xs tabular-nums text-danger">{money.fmt(i.amount)} overdue</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
