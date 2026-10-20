"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { CalendarClock, Landmark, LayoutDashboard, List, Plus, Receipt, Target, Wallet } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PageShell, Segmented, buttonVariants } from "@/components/os/kit";
import { useStable } from "@/components/os/useCockpit";
import { useToday } from "@/lib/day";
import { AccountsGoals } from "@/components/finance/AccountsGoals";
import { Budgets } from "@/components/finance/Budgets";
import { Invoices } from "@/components/finance/Invoices";
import { Overview, type Drill } from "@/components/finance/Overview";
import { TransactionDialog } from "@/components/finance/QuickAdd";
import { Recurring } from "@/components/finance/Recurring";
import { CurrencyPicker, FinanceSetup } from "@/components/finance/Setup";
import { Transactions } from "@/components/finance/Transactions";
import { MonthPicker, ScopeSwitch } from "@/components/finance/bits";
import type { ScopeFilter } from "@/components/finance/lib";

type Tab = "overview" | "transactions" | "budgets" | "recurring" | "invoices" | "accounts";
const TABS: { value: Tab; label: string; icon: typeof List }[] = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "transactions", label: "Transactions", icon: List },
  { value: "budgets", label: "Budgets", icon: Target },
  { value: "recurring", label: "Recurring", icon: CalendarClock },
  { value: "invoices", label: "Invoices", icon: Receipt },
  { value: "accounts", label: "Accounts & goals", icon: Landmark },
];
const isTab = (t: string | null): t is Tab => !!t && TABS.some((x) => x.value === t);

const SCOPE_KEY = "bishos.finance.scope";
function readScope(): ScopeFilter {
  try {
    const v = typeof window === "undefined" ? null : window.localStorage.getItem(SCOPE_KEY);
    return v === "personal" || v === "business" ? v : "all";
  } catch {
    return "all"; // private mode: keep default
  }
}
function useScope(): [ScopeFilter, (s: ScopeFilter) => void] {
  // Read synchronously so the first finance queries already use the saved
  // scope (no "all" fetch followed by a second fetch). Nothing scope-dependent
  // renders before `meta` loads, so this can't cause a hydration mismatch.
  const [scope, setScope] = useState<ScopeFilter>(readScope);
  const set = (s: ScopeFilter) => {
    setScope(s);
    try {
      window.localStorage.setItem(SCOPE_KEY, s);
    } catch {
      /* ignore */
    }
  };
  return [scope, set];
}

export default function FinancePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="skeleton h-40" />
        </div>
      }
    >
      <Finance />
    </Suspense>
  );
}

function Finance() {
  const today = useToday();
  const curMonth = today.slice(0, 7);
  const router = useRouter();
  const search = useSearchParams();
  const rawTab = search.get("tab");
  const tab: Tab = isTab(rawTab) ? rawTab : "overview";
  const setTab = (t: string) => {
    if (!isTab(t)) return;
    router.replace(t === "overview" ? "/finance" : `/finance?tab=${t}`, { scroll: false });
  };

  const meta = useStable(useQuery(api.finance.meta));
  const [scope, setScope] = useScope();
  const [month, setMonth] = useState(curMonth);
  const [drillCat, setDrillCat] = useState<Id<"finCategories"> | undefined>();
  const [addOpen, setAddOpen] = useState(false);

  // Roll the month forward at midnight on the 1st if you were looking at "this month".
  const [lastCur, setLastCur] = useState(curMonth);
  useEffect(() => {
    if (curMonth !== lastCur) {
      if (month === lastCur) setMonth(curMonth);
      setLastCur(curMonth);
    }
  }, [curMonth, lastCur, month]);

  // Deep link: /finance?add=1 opens quick add.
  useEffect(() => {
    if (search.get("add") === "1" && meta?.ready) {
      setAddOpen(true);
      router.replace(tab === "overview" ? "/finance" : `/finance?tab=${tab}`, { scroll: false });
    }
  }, [search, meta?.ready, router, tab]);

  // Normal tab changes clear a category drill-down; drilling sets it.
  const goTab = (t: string) => {
    setDrillCat(undefined);
    setTab(t);
  };
  const onDrill = (d: Drill) => {
    setDrillCat(d.categoryId);
    setTab("transactions");
  };

  const ready = meta?.ready;
  const defaultScope = scope === "business" ? "business" : "personal";

  return (
    <PageShell
      title="Finance"
      subtitle="Personal and business money in one calm place: cash, runway, bills and invoices."
      icon={Wallet}
      actions={
        meta && (
          <>
            <CurrencyPicker currency={meta.currency} />
            {ready && (
              <button type="button" onClick={() => setAddOpen(true)} className={buttonVariants({ size: "sm" })}>
                <Plus className="h-3.5 w-3.5" /> Add transaction
              </button>
            )}
          </>
        )
      }
      headerExtra={
        ready ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Segmented value={tab} onChange={goTab} options={TABS} className="max-w-full" />
            <div className="flex flex-wrap items-center gap-2">
              {tab === "overview" && <MonthPicker value={month} onChange={setMonth} current={curMonth} />}
              {tab !== "invoices" && <ScopeSwitch value={scope} onChange={setScope} />}
            </div>
          </div>
        ) : null
      }
    >
      {!meta ? (
        <div className="space-y-4">
          <div className="skeleton h-16" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24" />
            ))}
          </div>
          <div className="skeleton h-72" />
        </div>
      ) : !meta.ready ? (
        <FinanceSetup currency={meta.currency} />
      ) : (
        <>
          {tab === "overview" && <Overview meta={meta} scope={scope} month={month} onMonth={setMonth} onTab={goTab} onDrill={onDrill} />}
          {tab === "transactions" && (
            <Transactions meta={meta} scope={scope} month={month} onMonth={setMonth} curMonth={curMonth} initialCategory={drillCat} onAdd={() => setAddOpen(true)} />
          )}
          {tab === "budgets" && <Budgets meta={meta} scope={scope} month={month} onMonth={setMonth} curMonth={curMonth} />}
          {tab === "recurring" && <Recurring meta={meta} scope={scope} />}
          {tab === "invoices" && <Invoices meta={meta} />}
          {tab === "accounts" && <AccountsGoals meta={meta} scope={scope} />}
        </>
      )}

      <TransactionDialog open={addOpen} onClose={() => setAddOpen(false)} meta={meta} defaultScope={defaultScope} />
    </PageShell>
  );
}
