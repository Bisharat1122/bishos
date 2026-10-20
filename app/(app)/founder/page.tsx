"use client";

import { useMemo } from "react";
import { CashRunwayTile } from "@/components/finance/CashRunwayTile";
import Link from "next/link";
import { useQuery } from "convex/react";
import { CalendarCheck, Crown, Gauge } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PageShell, buttonVariants } from "@/components/os/kit";
import { addDaysYmd, fmtYmd, greeting, useToday } from "@/lib/day";
import {
  AttentionPanel,
  FocusStrip,
  KpiRow,
  MarketingEngine,
  RevenueEngine,
  ScorecardPanel,
  TimeOpsPanel,
} from "@/components/strategy/founder";
import { weekWindow } from "@/components/strategy/lib";
import { useStable } from "@/components/os/useCockpit";

/**
 * Founder HQ — the CEO cockpit, read top to bottom:
 *   1. This week's focus (Weekly Big 3) + status line
 *   2. KPI row (6 equal tiles)
 *   3. Revenue engine | Marketing engine
 *   4. Scorecard | Time & operations
 *   5. Needs your attention (issues · decisions · energy)
 * Every panel renders its own frame while loading, so nothing shifts.
 */
export default function FounderHQPage() {
  const today = useToday();
  const win = useMemo(() => weekWindow(today), [today]);
  // Args change once a day; useStable keeps the last result while it re-subscribes.
  const hq = useStable(useQuery(api.founder.hq, { today, weekStart: win.weekStart, from: win.from, to: win.to }));

  const weekLabel = `${fmtYmd(win.weekStart, { month: "short", day: "numeric" })} – ${fmtYmd(addDaysYmd(win.weekStart, 6), { month: "short", day: "numeric" })}`;

  return (
    <PageShell
      title="Founder HQ"
      icon={Crown}
      subtitle={
        // greeting() uses the clock: the server (UTC) and the browser (local) can disagree.
        <span suppressHydrationWarning>{`${greeting()}. The CEO view for the week of ${weekLabel}.`}</span>
      }
      actions={
        <>
          <Link href="/reviews" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <CalendarCheck className="h-4 w-4" /> Weekly review
          </Link>
          <Link href="/scorecard" className={buttonVariants({ size: "sm" })}>
            <Gauge className="h-4 w-4" /> Scorecard
          </Link>
        </>
      }
      headerExtra={<FocusStrip hq={hq} />}
    >
      <div className="space-y-4">
        <KpiRow hq={hq} />

        <div className="grid gap-4 xl:grid-cols-12">
          {/*
            FINANCE SLOT: once the Finance module ships (finAccounts / finTransactions),
            pass its cash & runway tile here, e.g. cashSlot={<CashRunwayTile />}.
            The tile owns its own query; founder.hq stays finance-free.
          */}
          <RevenueEngine hq={hq} today={today} className="xl:col-span-7" cashSlot={<CashRunwayTile />} />
          <MarketingEngine hq={hq} className="xl:col-span-5" />

          <ScorecardPanel hq={hq} className="xl:col-span-7" />
          <TimeOpsPanel hq={hq} className="xl:col-span-5" />

          <AttentionPanel hq={hq} today={today} className="xl:col-span-12" />
        </div>
      </div>
    </PageShell>
  );
}
