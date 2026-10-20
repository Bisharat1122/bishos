"use client";

/**
 * /dashboard — Analytics · Progress & Growth.
 *
 * One reactive query (api.analytics.overview) feeds every section: Growth,
 * Consistency, Execution, Founder flywheel, Content, Time, Mind & body and the
 * headline insights. Range switch (4w / 12w / 26w / 1y) scopes everything;
 * deltas compare with the same span just before it.
 */

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useAction } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import {
  ChartLine,
  Sparkles,
  Flame,
  Gauge,
  Target,
  CircleDollarSign,
  Clapperboard,
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ArrowUpRight,
  Wand2,
  Sprout,
  CalendarDays,
  Workflow,
  Clock,
  Brain,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageShell, Segmented, buttonVariants, cn } from "@/components/os/kit";
import { useToday } from "@/lib/day";
import { Columns, Lines, Sparkline, HBars, type Series } from "@/components/analytics/charts";
import { Heatmap } from "@/components/analytics/Heatmap";
import { Flywheel } from "@/components/analytics/Flywheel";
import { LabProgress, HoldBar, GoalBullets } from "@/components/analytics/bits";
import {
  CAT,
  GRAY,
  ChartCard,
  ChartEmpty,
  StatRow,
  compact,
  money,
  fmtInt,
  wkLabel,
  wkTitle,
  type TableData,
} from "@/components/analytics/primitives";

type Data = FunctionReturnType<typeof api.analytics.overview>;
type RangeKey = "4" | "12" | "26" | "52";

const RANGES: { value: RangeKey; label: string; long: string }[] = [
  { value: "4", label: "4w", long: "last 4 weeks" },
  { value: "12", label: "12w", long: "last 12 weeks" },
  { value: "26", label: "26w", long: "last 26 weeks" },
  { value: "52", label: "1y", long: "last 12 months" },
];
const STORE_KEY = "bishos.analytics.weeks";
const H = 200; // standard chart height (plot + x-axis band)
const HS = 170; // small chart height

const pctFmt = (n: number) => `${Math.round(n)}%`;
const hrs = (n: number) => `${+n.toFixed(1)}h`;
const r1 = (n: number) => +n.toFixed(1);
const sumOf = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Signed delta text + direction (every KPI here is "higher is better"). */
function deltaOf(cur: number | null | undefined, prev: number | null | undefined, fmt: (n: number) => string) {
  if (cur == null || prev == null) return { text: "No earlier data", dir: "flat" as const };
  const d = cur - prev;
  if (Math.abs(d) < 1e-9) return { text: "No change", dir: "flat" as const };
  return { text: `${d > 0 ? "+" : "−"}${fmt(Math.abs(d))}`, dir: d > 0 ? ("up" as const) : ("down" as const) };
}

// XP sources (server order) grouped into 5 categorical series for the chart.
// Server order: rituals, tasks, sales, content, learning, habits, reviews, other.
const XP_GROUPS = [
  { key: "loop", label: "Rituals & habits", idx: [0, 5] },
  { key: "tasks", label: "Tasks & tactics", idx: [1, 7] },
  { key: "sales", label: "Sales & promises", idx: [2] },
  { key: "content", label: "Content", idx: [3] },
  { key: "mind", label: "Learning & reviews", idx: [4, 6] },
];

export default function AnalyticsPage() {
  const today = useToday();
  const tzOffsetMin = useMemo(() => new Date().getTimezoneOffset(), []);
  const [range, setRange] = useState<RangeKey>("12");
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORE_KEY);
      if (v && RANGES.some((r) => r.value === v)) setRange(v as RangeKey);
    } catch {
      /* storage blocked: keep default */
    }
  }, []);
  const pickRange = (v: RangeKey) => {
    setRange(v);
    try {
      localStorage.setItem(STORE_KEY, v);
    } catch {
      /* ignore */
    }
  };

  const live = useQuery(api.analytics.overview, { today, weeks: Number(range), tzOffsetMin });
  // Refetch keeps the frame: hold the previous render (dimmed) while a new range loads.
  const [last, setLast] = useState<Data | undefined>(undefined);
  useEffect(() => {
    if (live) setLast(live);
  }, [live]);
  const data = live ?? last;
  const stale = !live && !!last;
  const rangeLong = RANGES.find((r) => r.value === range)!.long;

  return (
    <PageShell
      title="Analytics · Progress & Growth"
      icon={ChartLine}
      subtitle={
        data ? (
          <>
            Your growth across the Life OS for the {rangeLong}, compared with the {data.range.weeks} weeks before. Your daily home is{" "}
            <Link href="/today" className="font-medium text-foreground underline-offset-2 hover:underline">
              Today
            </Link>
            .
          </>
        ) : (
          <>Your growth across the Life OS: XP, consistency, execution, sales, content, time and mind.</>
        )
      }
      actions={
        <Segmented
          options={RANGES.map((r) => ({ value: r.value, label: r.label }))}
          value={range}
          onChange={pickRange}
          size="sm"
        />
      }
    >
      {!data ? (
        <AnalyticsSkeleton />
      ) : (
        <div aria-busy={stale} className={cn("space-y-10 transition-opacity duration-200", stale && "opacity-60")}>
          <KpiRow d={data} />
          <InsightsRail d={data} />
          <GrowthSection d={data} />
          <ConsistencySection d={data} />
          <ExecutionSection d={data} />
          <FounderSection d={data} />
          <ContentSection d={data} />
          <TimeSection d={data} />
          <MindSection d={data} />
        </div>
      )}
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared layout bits
// ─────────────────────────────────────────────────────────────────────────

function SectionHead({ id, icon: Icon, title, desc }: { id: string; icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="mb-4 flex items-start gap-3" id={id}>
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card shadow-card">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function useAxis(d: Data) {
  return useMemo(
    () => ({ labels: d.range.weekStarts.map(wkLabel), titles: d.range.weekStarts.map(wkTitle) }),
    [d.range.weekStarts],
  );
}

function weekTable(d: Data, columns: string[], row: (i: number) => (string | number | null)[]): TableData {
  return { columns: ["Week", ...columns], rows: d.range.weekStarts.map((ws, i) => [wkLabel(ws), ...row(i)]).reverse() };
}

// ─────────────────────────────────────────────────────────────────────────
// KPI hero row
// ─────────────────────────────────────────────────────────────────────────

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  delta,
  spark,
  href,
  footer,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta: { text: string; dir: "up" | "down" | "flat" };
  spark: (number | null)[];
  href: string;
  footer?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-ring/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <div className="mt-1.5 flex min-w-0 items-baseline gap-1.5">
        <span className="truncate text-2xl font-semibold leading-tight tracking-tight">{value}</span>
        {sub && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
      </div>
      <p
        className={cn(
          "mt-0.5 flex items-center gap-1 text-xs",
          delta.dir === "up" ? "text-success" : delta.dir === "down" ? "text-warning" : "text-muted-foreground",
        )}
      >
        {delta.dir === "up" ? <ArrowUp className="h-3 w-3" aria-hidden /> : delta.dir === "down" ? <ArrowDown className="h-3 w-3" aria-hidden /> : <Minus className="h-3 w-3" aria-hidden />}
        <span className="truncate font-medium tabular-nums">{delta.text}</span>
        {delta.dir !== "flat" && <span className="shrink-0 text-muted-foreground">vs prev</span>}
      </p>
      <div className="mt-auto pt-2">
        {footer ?? <Sparkline values={spark} />}
      </div>
    </Link>
  );
}

function KpiRow({ d }: { d: Data }) {
  const k = d.kpis;
  const lv = d.growth.level;
  return (
    <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi
        icon={Sparkles}
        label="Level"
        value={`L${lv.level}`}
        sub={lv.title}
        delta={deltaOf(k.xp.value, k.xp.prev, (n) => `${compact(n)} XP`)}
        spark={k.xp.spark}
        href="/today"
        footer={
          <div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span className="tabular-nums">{fmtInt(lv.total)} XP</span>
              <span className="tabular-nums">{fmtInt(lv.span - lv.into)} to L{lv.level + 1}</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-muted" role="progressbar" aria-valuenow={lv.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Level ${lv.level} progress`}>
              <div className="h-full rounded-full bg-primary" style={{ width: `${lv.pct}%` }} />
            </div>
            <div className="h-1" />
          </div>
        }
      />
      <Kpi
        icon={Flame}
        label="Ritual streak"
        value={`${k.streak.value}d`}
        sub={`best ${k.streak.best}`}
        delta={deltaOf(k.streak.ritualDays, k.streak.ritualDaysPrev, (n) => `${n} ritual day${n === 1 ? "" : "s"}`)}
        spark={k.streak.spark}
        href="/today"
      />
      <Kpi
        icon={Gauge}
        label="Avg day score"
        value={k.dayScore.value ?? "—"}
        sub={k.dayScore.value != null ? "/ 100" : undefined}
        delta={deltaOf(k.dayScore.value, k.dayScore.prev, (n) => `${n} pts`)}
        spark={k.dayScore.spark}
        href="/journal"
      />
      <Kpi
        icon={Target}
        label="Execution"
        value={k.execution.value != null ? `${k.execution.value}%` : "—"}
        sub={k.execution.value != null ? "bar 85%" : "no cycle"}
        delta={deltaOf(k.execution.value, k.execution.prev, (n) => `${n} pts`)}
        spark={k.execution.spark}
        href="/goals"
      />
      <Kpi
        icon={CircleDollarSign}
        label="Revenue won"
        value={money(k.revenue.value, d.currency)}
        sub={`${d.founder.won} deal${d.founder.won === 1 ? "" : "s"}`}
        delta={deltaOf(k.revenue.value, k.revenue.prev, (n) => money(n, d.currency))}
        spark={k.revenue.spark}
        href="/pipeline"
      />
      <Kpi
        icon={Clapperboard}
        label="Content shipped"
        value={k.content.value}
        sub={k.content.value === 1 ? "piece" : "pieces"}
        delta={deltaOf(k.content.value, k.content.prev, (n) => `${n}`)}
        spark={k.content.spark}
        href="/content"
      />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Insights rail
// ─────────────────────────────────────────────────────────────────────────

function InsightsRail({ d }: { d: Data }) {
  const ask = useAction(api.ai.insights);
  const [ai, setAi] = useState<{ title: string; body: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const run = async () => {
    setBusy(true);
    setErr(false);
    try {
      setAi(await ask());
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section aria-labelledby="insights-h">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="insights-h" className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <Lightbulb className="h-4 w-4" aria-hidden /> Headline insights
        </h2>
        <button type="button" onClick={run} disabled={busy} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Wand2 className="h-3.5 w-3.5" aria-hidden /> {busy ? "Thinking…" : ai ? "Ask AI again" : "Ask AI for more"}
        </button>
      </div>
      {d.insights.length === 0 && !ai ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Insights appear as you log rituals, tasks, focus sessions, deals and content. Start with{" "}
          <Link href="/today" className="font-medium text-foreground underline-offset-2 hover:underline">
            today&apos;s start-up ritual
          </Link>
          .
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {d.insights.map((ins, i) => {
            const Icon = ins.tone === "up" ? TrendingUp : ins.tone === "down" ? TrendingDown : Lightbulb;
            return (
              <li key={i}>
                <Link
                  href={ins.href}
                  className="group flex h-full items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-sm shadow-card transition-colors hover:border-ring/60"
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg",
                      ins.tone === "up" ? "bg-success-soft text-success" : ins.tone === "down" ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    <span className="sr-only">{ins.tone === "up" ? "Improving" : ins.tone === "down" ? "Needs attention" : "Note"}</span>
                  </span>
                  <span className="min-w-0 flex-1 leading-snug">{ins.text}</span>
                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" aria-hidden />
                </Link>
              </li>
            );
          })}
          {ai?.map((a, i) => (
            <li key={`ai${i}`} className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3.5 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-info-soft text-info">
                <Wand2 className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only">AI insight</span>
              </span>
              <span className="min-w-0 flex-1 leading-snug">
                <span className="block font-medium">{a.title}</span>
                <span className="text-muted-foreground">{a.body}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {err && <p className="mt-2 text-xs text-warning">The AI couldn&apos;t answer right now. Try again in a moment.</p>}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Growth
// ─────────────────────────────────────────────────────────────────────────

function GrowthSection({ d }: { d: Data }) {
  const ax = useAxis(d);
  const g = d.growth;
  const empty = g.totalXp === 0;
  const groupSeries: Series[] = XP_GROUPS.map((grp, gi) => ({
    key: grp.key,
    label: grp.label,
    color: CAT[gi],
    values: g.weekly.map((w) => sumOf(grp.idx.map((i) => w.bySource[i]))),
  }));
  const mix = g.sources.filter((s) => s.xp > 0).sort((a, b) => b.xp - a.xp);
  return (
    <section aria-labelledby="growth">
      <SectionHead id="growth" icon={Sprout} title="Growth" desc="XP is the running score of everything you do in the OS. Levels mark the compounding." />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Cumulative XP"
          hint="Total XP at the end of each week"
          href="/today"
          stat={
            <StatRow
              items={[
                { label: "Total", value: fmtInt(g.totalXp), sub: "XP" },
                { label: "This period", value: `+${fmtInt(g.xpPeriod)}`, sub: "XP" },
                { label: "Levels gained", value: g.levelsGained, sub: `now L${g.level.level} ${g.level.title}` },
              ]}
            />
          }
          table={weekTable(d, ["XP earned", "Cumulative"], (i) => [g.weekly[i].total, g.weekly[i].cumulative])}
        >
          {empty ? (
            <ChartEmpty height={H} title="Earn your first XP" hint="Every ritual, task, deal, post and review adds XP. Start with today's start-up ritual." href="/today" cta="Open Today" />
          ) : (
            <Lines
              labels={ax.labels}
              titles={ax.titles}
              series={[{ key: "xp", label: "Cumulative XP", color: CAT[0], values: g.weekly.map((w) => w.cumulative) }]}
              area
              yMin={0}
              fmt={compact}
              height={H}
              ariaLabel={`Cumulative XP over the ${d.range.weeks} weeks, now ${fmtInt(g.totalXp)}`}
            />
          )}
        </ChartCard>
        <ChartCard
          title="XP per week by source"
          hint="Where your effort went each week"
          table={{
            columns: ["Week", ...g.sources.map((s) => s.label), "Total"],
            rows: d.range.weekStarts.map((ws, i) => [wkLabel(ws), ...g.weekly[i].bySource, g.weekly[i].total]).reverse(),
          }}
          stat={
            mix.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Period mix:{" "}
                {mix.slice(0, 4).map((s, i) => (
                  <span key={s.key}>
                    {i > 0 && " · "}
                    <span className="font-medium text-foreground">{s.label}</span> {Math.round((s.xp / Math.max(1, g.xpPeriod)) * 100)}%
                  </span>
                ))}
              </p>
            ) : undefined
          }
        >
          {g.xpPeriod === 0 ? (
            <ChartEmpty height={H + 22} title="No XP in this range yet" hint="Rituals, tasks, outreach and content all earn XP." href="/today" cta="Open Today" />
          ) : (
            <Columns labels={ax.labels} titles={ax.titles} series={groupSeries} height={H} fmt={compact} totalLabel="XP that week" ariaLabel="Weekly XP stacked by source" />
          )}
        </ChartCard>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Consistency
// ─────────────────────────────────────────────────────────────────────────

function ConsistencySection({ d }: { d: Data }) {
  const ax = useAxis(d);
  const c = d.consistency;
  const hasDays = c.loggedDays > 0 || c.ritualDays > 0;
  const dayRows = c.heatmap
    .filter((h) => !h.future)
    .map((h) => [h.date, h.score, h.ritual ? "Yes" : "No", h.free ? "Free" : ""] as (string | number | null)[])
    .reverse();
  const inboxAny = c.weekly.some((w) => w.captured || w.processed);
  return (
    <section aria-labelledby="consistency">
      <SectionHead id="consistency" icon={CalendarDays} title="Consistency" desc="Show up daily. Free days and reserve shields never break the streak." />
      <div className="space-y-4">
        <ChartCard
          title="Daily consistency"
          hint="Each square is a day, coloured by its day score"
          href="/journal"
          hrefLabel="Journal"
          stat={
            <StatRow
              items={[
                { label: "Streak", value: `${c.streak.current}d`, sub: `${c.streak.shieldsLeft} shield${c.streak.shieldsLeft === 1 ? "" : "s"} left` },
                { label: "Best", value: `${c.streak.best}d` },
                { label: "Start-up", value: c.startupPct != null ? `${c.startupPct}%` : "—", sub: c.eligibleDays ? `of ${c.eligibleDays} days` : undefined },
                { label: "Shutdown", value: c.shutdownPct != null ? `${c.shutdownPct}%` : "—" },
                { label: "Avg score", value: c.avgScore ?? "—" },
              ]}
            />
          }
          table={{ columns: ["Day", "Score", "Ritual", "Note"], rows: dayRows }}
        >
          {hasDays ? (
            <Heatmap cells={c.heatmap} weeks={d.range.weeks} ariaLabel={`Day scores for the ${d.range.weeks} weeks; average ${c.avgScore ?? "not logged"}`} />
          ) : (
            <ChartEmpty height={190} title="Your first day lights the first square" hint="Run the start-up ritual in the morning and the shutdown at night." href="/today" cta="Start today" />
          )}
        </ChartCard>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ChartCard title="Average day score" hint="Mean of logged days each week" table={weekTable(d, ["Avg score", "Ritual days"], (i) => [c.weekly[i].avgScore, c.weekly[i].ritualDays])}>
            {c.loggedDays ? (
              <Lines labels={ax.labels} titles={ax.titles} series={[{ key: "s", label: "Avg day score", color: CAT[0], values: c.weekly.map((w) => w.avgScore) }]} yMax={100} height={HS} fmt={(n) => `${Math.round(n)}`} ariaLabel="Average day score per week" />
            ) : (
              <ChartEmpty height={HS} title="No days logged yet" href="/today" cta="Open Today" />
            )}
          </ChartCard>
          <ChartCard title="Rituals per week" hint="Start-ups and shutdowns completed (max 7)" table={weekTable(d, ["Start-ups", "Shutdowns", "Routines"], (i) => [c.weekly[i].startup, c.weekly[i].shutdown, c.weekly[i].routines])}>
            {c.ritualDays ? (
              <Columns
                labels={ax.labels}
                titles={ax.titles}
                mode="group"
                yMax={7}
                height={HS}
                series={[
                  { key: "su", label: "Start-ups", color: CAT[0], values: c.weekly.map((w) => w.startup) },
                  { key: "sd", label: "Shutdowns", color: CAT[1], values: c.weekly.map((w) => w.shutdown) },
                ]}
                extraTip={(i) => [{ label: "routines completed", value: `${c.weekly[i].routines}`, bold: false }]}
                ariaLabel="Start-up and shutdown rituals per week"
              />
            ) : (
              <ChartEmpty height={HS + 22} title="No rituals yet" hint="Two minutes in the morning, two at night." href="/today" cta="Start-up ritual" />
            )}
          </ChartCard>
          <ChartCard
            className="md:col-span-2 xl:col-span-1"
            title="Inbox: captured vs processed"
            hint={`${c.inboxOpen} item${c.inboxOpen === 1 ? "" : "s"} open right now`}
            href="/inbox"
            table={weekTable(d, ["Captured", "Processed"], (i) => [c.weekly[i].captured, c.weekly[i].processed])}
          >
            {inboxAny ? (
              <Columns
                labels={ax.labels}
                titles={ax.titles}
                mode="group"
                height={HS}
                series={[
                  { key: "cap", label: "Captured", color: GRAY, values: c.weekly.map((w) => w.captured) },
                  { key: "pro", label: "Processed", color: CAT[0], values: c.weekly.map((w) => w.processed) },
                ]}
                ariaLabel="Inbox items captured and processed per week"
              />
            ) : (
              <ChartEmpty height={HS + 22} title="Nothing captured yet" hint="Press C anywhere to capture a thought in two seconds." href="/inbox" cta="Open Inbox" />
            )}
          </ChartCard>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Execution
// ─────────────────────────────────────────────────────────────────────────

function ExecutionSection({ d }: { d: Data }) {
  const ax = useAxis(d);
  const e = d.execution;
  const big3Any = e.big3Total > 0;
  return (
    <section aria-labelledby="execution">
      <SectionHead id="execution" icon={Target} title="Execution" desc="Lead measures done ÷ planned each week (tactics + goal habits). 85% is the 12-week bar." />
      {!e.hasCycles ? (
        <ChartCard title="Execution score" hint="Your weekly execution history appears here">
          <ChartEmpty height={H} title="Start your first 12-week cycle to see execution history" hint="Pick up to 3 goals, add key results and weekly tactics." href="/goals" cta="Plan a 12-week cycle" />
        </ChartCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Weekly execution score"
            hint={e.cycle ? `${e.cycle.name} · week ${e.cycle.week} of 12` : "Weeks inside a 12-week cycle"}
            href="/goals"
            stat={
              <StatRow
                items={[
                  { label: "Avg, full weeks", value: e.avg != null ? `${e.avg}%` : "—", sub: e.avgPrev != null ? `prev ${e.avgPrev}%` : undefined },
                  { label: "Weekly reviews", value: `${e.reviewsDone}`, sub: `of ${d.range.weeks} weeks` },
                ]}
              />
            }
            table={weekTable(d, ["Cycle week", "Score %", "Reviewed"], (i) => [e.weekly[i].cycleWeek, e.weekly[i].score, e.weekly[i].reviewed ? "Yes" : "No"])}
          >
            {e.weekly.some((w) => w.score != null) ? (
              <Lines
                labels={ax.labels}
                titles={e.weekly.map((w, i) => (w.cycleWeek ? `${ax.titles[i]} · cycle week ${w.cycleWeek}` : `${ax.titles[i]} · outside a cycle`))}
                series={[{ key: "x", label: "Execution", color: CAT[0], values: e.weekly.map((w) => w.score) }]}
                yMax={100}
                refLine={{ value: 85, label: "85%" }}
                fmt={pctFmt}
                height={H}
                ariaLabel={`Weekly execution score; period average ${e.avg ?? "none"}%`}
              />
            ) : (
              <ChartEmpty height={H} title="No scored weeks in this range" hint="Log tactics on the Goals page each week to build the score." href="/goals" cta="Open Goals" />
            )}
          </ChartCard>
          <ChartCard
            title="Weekly Big 3"
            hint="Outcomes you committed to each week"
            href="/week"
            stat={
              <StatRow
                items={[
                  { label: "Completed", value: e.big3Rate != null ? `${e.big3Rate}%` : "—", sub: `${e.big3Done} of ${e.big3Total}` },
                  { label: "Previous", value: e.big3RatePrev != null ? `${e.big3RatePrev}%` : "—" },
                ]}
              />
            }
            table={weekTable(d, ["Done", "Planned"], (i) => [e.weekly[i].big3Done, e.weekly[i].big3Total])}
          >
            {big3Any ? (
              <Columns
                labels={ax.labels}
                titles={ax.titles}
                height={H}
                yMax={Math.max(3, ...e.weekly.map((w) => w.big3Total))}
                series={[
                  { key: "done", label: "Done", color: CAT[0], values: e.weekly.map((w) => w.big3Done) },
                  { key: "open", label: "Not done", color: GRAY, values: e.weekly.map((w) => Math.max(0, w.big3Total - w.big3Done)) },
                ]}
                totalLabel="Planned"
                ariaLabel="Weekly Big 3 done versus not done"
              />
            ) : (
              <ChartEmpty height={H + 22} title="Set this week's Big 3" hint="Three outcomes that would make the week a win." href="/week" cta="Plan the week" />
            )}
          </ChartCard>
          <ChartCard
            className="lg:col-span-2"
            title="12-week goals · key results"
            hint={e.cycle ? `Progress vs time: the marker shows ${e.cycle.pct}% of the cycle elapsed (${e.cycle.daysLeft} days left)` : "No cycle running"}
            href="/goals"
            table={
              e.goals.length
                ? { columns: ["Goal", "Key results %", "Cycle elapsed %"], rows: e.goals.map((g) => [g.title, g.pct, g.elapsedPct]) }
                : null
            }
          >
            {e.goals.length ? (
              <GoalBullets goals={e.goals} />
            ) : (
              <ChartEmpty height={120} title="No active 12-week goals" hint="Add up to 3 goals with measurable key results." href="/goals" cta="Add a goal" />
            )}
          </ChartCard>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Founder flywheel
// ─────────────────────────────────────────────────────────────────────────

function FounderSection({ d }: { d: Data }) {
  const ax = useAxis(d);
  const f = d.founder;
  const cur = d.currency;
  const anyFlow = f.flywheel.some((s) => s.value > 0 || s.prev > 0);
  const weeksHit = f.weekly.filter((w) => w.outreach >= f.quotaWeekly).length;
  const hasScorecard = f.weekly.some((w) => w.scorecardPct != null);
  return (
    <section aria-labelledby="founder">
      <SectionHead id="founder" icon={Workflow} title="Founder flywheel" desc="Content earns attention, attention becomes leads, leads become deals, deals become revenue." />
      <div className="space-y-4">
        <ChartCard
          title="From content to revenue"
          hint="This period, with the change vs the previous one and the conversion from each stage to the next"
          href="/founder"
          hrefLabel="Founder HQ"
          table={{
            columns: ["Stage", "This period", "Previous", "Conversion"],
            rows: f.flywheel.map((s, i) => {
              const p = i > 0 ? f.flywheel[i - 1].value : 0;
              return [
                s.label,
                s.money ? money(s.value, cur, true) : s.value,
                s.money ? money(s.prev, cur, true) : s.prev,
                i === 0 || s.money ? "—" : p > 0 ? `${+((s.value / p) * 100).toFixed(1)}%` : "—",
              ];
            }),
          }}
        >
          {anyFlow ? (
            <>
              <Flywheel stages={f.flywheel} currency={cur} />
              <p className="mt-3 text-xs text-muted-foreground">
                Deals count every channel (outreach, referrals, inbound); <span className="font-medium text-foreground">{f.contentDeals}</span> came from content.
                Win rate <span className="font-medium text-foreground">{f.winRate != null ? `${f.winRate}%` : "—"}</span> · open pipeline{" "}
                <span className="font-medium text-foreground">{money(f.openPipeline, cur)}</span> in {f.openDeals} deal{f.openDeals === 1 ? "" : "s"} · {f.liveOffers} live offer
                {f.liveOffers === 1 ? "" : "s"} · {f.liveCampaigns} live campaign{f.liveCampaigns === 1 ? "" : "s"}.
              </p>
            </>
          ) : (
            <ChartEmpty height={180} title="Start the flywheel" hint="Publish a piece of content, log outreach or add your first deal to see the flow." href="/content" cta="Open Content Studio" />
          )}
        </ChartCard>
        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard
            title="Outreach vs quota"
            hint={`Outreach + follow-ups per week · quota ${f.quotaDaily}/day × 5 workdays`}
            href="/pipeline"
            stat={
              <StatRow
                items={[
                  { label: "Touches", value: fmtInt(f.outreach), sub: `prev ${fmtInt(f.outreachPrev)}` },
                  { label: "Weeks at quota", value: `${weeksHit}`, sub: `of ${d.range.weeks}` },
                ]}
              />
            }
            table={weekTable(d, ["Outreach", "Meetings", "Quota"], (i) => [f.weekly[i].outreach, f.weekly[i].meetings, f.quotaWeekly])}
          >
            {f.outreach || f.outreachPrev ? (
              <Columns
                labels={ax.labels}
                titles={ax.titles}
                height={H}
                series={[{ key: "o", label: "Outreach touches", color: CAT[0], values: f.weekly.map((w) => w.outreach) }]}
                target={f.quotaWeekly}
                targetLabel="Weekly quota"
                extraTip={(i) => [{ label: "meetings / calls", value: `${f.weekly[i].meetings}`, bold: false }]}
                ariaLabel="Outreach touches per week against the weekly quota"
              />
            ) : (
              <ChartEmpty height={H + 22} title="No outreach logged yet" hint="Log a touch on any person or deal; it counts toward the daily quota." href="/people" cta="Open People" />
            )}
          </ChartCard>
          <ChartCard
            title="Pipeline value"
            hint="Value of open deals at the end of each week"
            href="/pipeline"
            stat={<StatRow items={[{ label: "Open now", value: money(f.openPipeline, cur), sub: `${f.openDeals} deals` }]} />}
            table={weekTable(d, ["Open pipeline"], (i) => [money(f.weekly[i].pipeline, cur, true)])}
          >
            {f.weekly.some((w) => w.pipeline > 0) ? (
              <Lines
                labels={ax.labels}
                titles={ax.titles}
                series={[{ key: "p", label: "Open pipeline", color: CAT[0], values: f.weekly.map((w) => w.pipeline) }]}
                area
                fmt={(n) => money(n, cur)}
                height={H}
                ariaLabel="Open pipeline value per week"
              />
            ) : (
              <ChartEmpty height={H} title="No deal values yet" hint="Add a value to your deals to see the pipeline grow." href="/pipeline" cta="Open Pipeline" />
            )}
          </ChartCard>
          <ChartCard
            title="Won revenue"
            hint="Value of deals won each week"
            href="/pipeline"
            stat={
              <StatRow
                items={[
                  { label: "This period", value: money(f.revenue, cur), sub: `prev ${money(f.revenuePrev, cur)}` },
                  { label: "Win rate", value: f.winRate != null ? `${f.winRate}%` : "—" },
                ]}
              />
            }
            table={weekTable(d, ["Revenue", "Deals won", "Deals created"], (i) => [money(f.weekly[i].revenue, cur, true), f.weekly[i].won, f.weekly[i].dealsCreated])}
          >
            {f.weekly.some((w) => w.revenue > 0 || w.won > 0) ? (
              <Columns
                labels={ax.labels}
                titles={ax.titles}
                height={H}
                series={[{ key: "r", label: "Revenue won", color: CAT[0], values: f.weekly.map((w) => w.revenue) }]}
                fmt={(n) => money(n, cur)}
                extraTip={(i) => [
                  { label: "deals won", value: `${f.weekly[i].won}`, bold: false },
                  { label: "deals created", value: `${f.weekly[i].dealsCreated}`, bold: false },
                ]}
                ariaLabel="Revenue won per week"
              />
            ) : (
              <ChartEmpty height={H} title="No wins in this range yet" hint="Move a deal to Won to see revenue here." href="/pipeline" cta="Open Pipeline" />
            )}
          </ChartCard>
          <ChartCard
            title="Promise-keeping"
            hint="“I owe” commitments kept on time, by the week they were due"
            href="/commitments"
            stat={
              <StatRow
                items={[
                  { label: "Kept on time", value: f.promiseRate != null ? `${f.promiseRate}%` : "—", sub: `${f.promiseDue} due` },
                  { label: "Previous", value: f.promiseRatePrev != null ? `${f.promiseRatePrev}%` : "—" },
                ]}
              />
            }
            table={weekTable(d, ["Due", "Kept", "Rate %"], (i) => [f.weekly[i].promiseDue, f.weekly[i].promiseKept, f.weekly[i].promiseRate])}
          >
            {f.promiseDue > 0 ? (
              <Lines
                labels={ax.labels}
                titles={ax.titles}
                series={[{ key: "pk", label: "Kept on time", color: CAT[0], values: f.weekly.map((w) => w.promiseRate) }]}
                yMax={100}
                refLine={{ value: 85, label: "85%" }}
                fmt={pctFmt}
                height={H}
                ariaLabel="Share of promises kept on time per week"
              />
            ) : (
              <ChartEmpty height={H} title="No promises came due" hint="Log what you promise people, with a date. Keeping them builds trust (and XP)." href="/commitments" cta="Open Commitments" />
            )}
          </ChartCard>
          {hasScorecard && (
            <ChartCard
              className="md:col-span-2"
              title="Scorecard on target"
              hint="Share of this week's scorecard numbers that hit their target"
              href="/scorecard"
              table={weekTable(d, ["On target %"], (i) => [f.weekly[i].scorecardPct])}
            >
              <Lines
                labels={ax.labels}
                titles={ax.titles}
                series={[{ key: "sc", label: "On target", color: CAT[0], values: f.weekly.map((w) => w.scorecardPct) }]}
                yMax={100}
                fmt={pctFmt}
                height={HS}
                ariaLabel="Scorecard metrics on target per week"
              />
            </ChartCard>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Content
// ─────────────────────────────────────────────────────────────────────────

function ContentSection({ d }: { d: Data }) {
  const ax = useAxis(d);
  const c = d.content;
  const any = c.published > 0 || c.publishedPrev > 0;
  return (
    <section aria-labelledby="content">
      <SectionHead id="content" icon={Clapperboard} title="Content" desc="Reps build the brand. Volume first, then hooks and retention." />
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Published per week"
          hint={`Personal vs company · target ${c.weeklyTarget}/week`}
          href="/content"
          stat={
            <StatRow
              items={[
                { label: "Shipped", value: c.published, sub: `prev ${c.publishedPrev}` },
                { label: "Personal", value: c.personal },
                { label: "Company", value: c.company },
              ]}
            />
          }
          table={weekTable(d, ["Personal", "Company", "Total"], (i) => [c.weekly[i].personal, c.weekly[i].company, c.weekly[i].personal + c.weekly[i].company])}
        >
          {any ? (
            <Columns
              labels={ax.labels}
              titles={ax.titles}
              height={H}
              series={[
                { key: "p", label: "Personal", color: CAT[0], values: c.weekly.map((w) => w.personal) },
                { key: "c", label: "Company", color: CAT[1], values: c.weekly.map((w) => w.company) },
              ]}
              target={c.weeklyTarget || null}
              targetLabel="Weekly target"
              totalLabel="Published"
              ariaLabel="Content pieces published per week, personal and company"
            />
          ) : (
            <ChartEmpty height={H + 22} title="Publish your first piece" hint="Move a piece to Published in Content Studio to start the count." href="/content" cta="Open Content Studio" />
          )}
        </ChartCard>
        <ChartCard
          title="60-day short-form lab"
          hint="Shorts shipped per lab week vs the ramp"
          href="/content?tab=playbook#pb-lab"
          table={
            c.labs.length
              ? { columns: ["Lab week", ...c.labs.map((l) => (l.brand === "personal" ? "Personal" : "Company"))], rows: Array.from({ length: 8 }, (_, i) => [`W${i + 1}`, ...c.labs.map((l) => `${l.weeks[i].done}/${l.weeks[i].target}`)]) }
              : null
          }
        >
          {c.labs.length ? (
            <LabProgress labs={c.labs} />
          ) : (
            <ChartEmpty height={H} title="Start the 60-day lab" hint="Ship 3 → 5 → 7 shorts a week for 8 weeks to find your format." href="/content?tab=playbook#pb-lab" cta="Set up the lab" />
          )}
        </ChartCard>
        <ChartCard
          title="Performance per piece"
          hint="From each published piece's most mature snapshot (30d › 7d › 24h)"
          href="/content"
          stat={
            <StatRow
              items={[
                { label: "Avg views", value: c.avgViews != null ? compact(c.avgViews) : "—", sub: c.avgViewsPrev != null ? `prev ${compact(c.avgViewsPrev)}` : undefined },
                { label: "Avg follows", value: c.avgFollows ?? "—" },
                { label: "Measured", value: c.measured, sub: `of ${c.published}` },
              ]}
            />
          }
        >
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">3-second hold</p>
              <HoldBar hold={c.hold} />
            </div>
            <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Swipes saved</dt>
                <dd className="text-sm font-semibold">{c.swipes.saved}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Avg outlier</dt>
                <dd className="text-sm font-semibold">{c.swipes.avgOutlier != null ? `${c.swipes.avgOutlier}×` : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Workflow steps</dt>
                <dd className="text-sm font-semibold">{c.avgKwSteps != null ? `${c.avgKwSteps} avg` : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">In production</dt>
                <dd className="text-sm font-semibold">{c.inProgress}</dd>
              </div>
            </dl>
          </div>
        </ChartCard>
        <ChartCard
          title="Best hook types"
          hint="Average views per piece, by hook type"
          href="/content"
          table={c.hookTypes.length ? { columns: ["Hook type", "Avg views", "Avg follows", "Pieces"], rows: c.hookTypes.map((h) => [h.type, h.avgViews, h.avgFollows, h.count]) } : null}
        >
          {c.hookTypes.length ? (
            <HBars
              rows={c.hookTypes.map((h) => ({
                key: h.type,
                label: h.type,
                value: h.avgViews,
                display: compact(h.avgViews),
                sub: `${h.count} piece${h.count === 1 ? "" : "s"} · ${h.avgFollows} follows avg`,
              }))}
            />
          ) : (
            <ChartEmpty height={160} title="No hook data yet" hint="Tag a hook type on published pieces and add their views." href="/content" cta="Open Content Studio" />
          )}
        </ChartCard>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Time
// ─────────────────────────────────────────────────────────────────────────

function TimeSection({ d }: { d: Data }) {
  const ax = useAxis(d);
  const t = d.time;
  const weeksElapsed = Math.max(1, d.range.elapsedDays / 7);
  // Categorical slots follow the area's position (by area order, never by rank), so
  // two user-picked colours can't collide. Past 5 areas, the tail and unattributed
  // time fold into one gray "Other" series (no generated 6th hue).
  const named = t.areas.filter((a) => a.id !== "none");
  const slotOf = new Map(named.slice(0, CAT.length).map((a, i) => [a.id, CAT[i] as string]));
  const colorOfArea = (id: string) => slotOf.get(id) ?? GRAY;
  const folded = t.areas.map((a, i) => ({ a, i })).filter(({ a }) => !slotOf.has(a.id));
  const areaSeries: Series[] = [
    ...t.areas
      .map((a, i) => ({ a, i }))
      .filter(({ a }) => slotOf.has(a.id))
      .map(({ a, i }) => ({ key: a.id, label: a.name, color: colorOfArea(a.id), values: t.weekly.map((w) => w.hours[i] ?? 0) })),
    ...(folded.length
      ? [
          {
            key: "other",
            label: folded.length === 1 ? folded[0].a.name : "Other & unattributed",
            color: GRAY,
            values: t.weekly.map((w) => r1(sumOf(folded.map(({ i }) => w.hours[i] ?? 0)))),
          },
        ]
      : []),
  ];
  const bestIdx = t.weekday.reduce((m, x, i) => (x.avgMin > t.weekday[m].avgMin ? i : m), 0);
  const anyFocus = t.deepHours > 0;
  return (
    <section aria-labelledby="time">
      <SectionHead id="time" icon={Clock} title="Time" desc="Where the hours actually went, against what you planned and what each area deserves." />
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Hours by life area"
          hint="Focus hours per week, stacked by area"
          href="/focus"
          stat={
            <StatRow
              items={[
                { label: "Deep work", value: hrs(t.deepHours), sub: `prev ${hrs(t.deepHoursPrev)}` },
                { label: "Per week", value: hrs(t.deepHours / weeksElapsed) },
              ]}
            />
          }
          table={{
            columns: ["Week", ...t.areas.map((a) => a.name), "Total"],
            rows: d.range.weekStarts.map((ws, i) => [wkLabel(ws), ...t.weekly[i].hours, t.weekly[i].total]).reverse(),
          }}
        >
          {anyFocus ? (
            <Columns
              labels={ax.labels}
              titles={ax.titles}
              height={H}
              series={areaSeries}
              fmt={hrs}
              target={t.targetTotal}
              targetLabel="Weekly target (all areas)"
              totalLabel="Total focus"
              ariaLabel="Focus hours per week stacked by life area"
            />
          ) : (
            <ChartEmpty height={H + 22} title="No focus sessions yet" hint="Start a focus timer on any task; the hours land in its life area." href="/focus" cta="Start a focus session" />
          )}
        </ChartCard>
        <ChartCard
          title="Deep work: planned vs actual"
          hint="Calendar blocks planned vs focus hours logged"
          href="/schedule"
          stat={
            <StatRow
              items={[
                { label: "Planned", value: hrs(t.planned) },
                { label: "Focused", value: hrs(t.deepHours) },
                { label: "Blocks done", value: hrs(t.blocksDone) },
              ]}
            />
          }
          table={weekTable(d, ["Planned h", "Focus h", "Blocks done h", "Maker h"], (i) => [t.weekly[i].planned, t.weekly[i].total, t.weekly[i].blocksDone, t.weekly[i].maker])}
        >
          {t.planned > 0 || anyFocus ? (
            <Columns
              labels={ax.labels}
              titles={ax.titles}
              mode="group"
              height={H}
              fmt={hrs}
              series={[
                { key: "pl", label: "Planned (calendar)", color: GRAY, values: t.weekly.map((w) => w.planned) },
                { key: "ac", label: "Actual (focus)", color: CAT[0], values: t.weekly.map((w) => w.total) },
              ]}
              ariaLabel="Planned calendar hours versus focus hours per week"
            />
          ) : (
            <ChartEmpty height={H + 22} title="Plan a block, then focus" hint="Time-block your week on the calendar and log focus to compare." href="/schedule" cta="Open Calendar" />
          )}
        </ChartCard>
        <ChartCard
          title="Area time vs target"
          hint="Average focus hours per week; the marker is the area's weekly target"
          href="/life-areas"
          table={t.areas.length ? { columns: ["Area", "Avg h/week", "Target h/week", "Total h"], rows: t.areas.map((a) => [a.name, r1(a.total / weeksElapsed), a.target, a.total]) } : null}
          stat={
            t.audit ? (
              <p className="text-xs text-muted-foreground">
                Time audit: <span className="font-medium text-foreground">{hrs(t.audit.hours)}</span> logged ·{" "}
                <span className="font-medium text-foreground">{t.audit.highValuePct ?? 0}%</span> high-value ·{" "}
                <span className="font-medium text-foreground">{t.audit.energizingPct ?? 0}%</span> energising ·{" "}
                <span className="font-medium text-foreground">{t.audit.drainingPct ?? 0}%</span> draining
              </p>
            ) : undefined
          }
        >
          {t.areas.length ? (
            <HBars
              rows={t.areas.map((a) => {
                const avg = a.total / weeksElapsed;
                return {
                  key: a.id,
                  label: a.name,
                  value: avg,
                  display: hrs(avg),
                  target: a.target,
                  targetDisplay: a.target ? hrs(a.target) : undefined,
                  color: colorOfArea(a.id),
                };
              })}
            />
          ) : (
            <ChartEmpty height={160} title="No life areas yet" href="/life-areas" cta="Set up life areas" />
          )}
        </ChartCard>
        <ChartCard
          title="Focus by weekday"
          hint={anyFocus ? `Average focus per day · best: ${t.weekday[bestIdx].day}` : "Average focus per day of the week"}
          href="/focus"
          table={{ columns: ["Day", "Avg focus (min)"], rows: t.weekday.map((w) => [w.day, w.avgMin]) }}
        >
          {anyFocus ? (
            <Columns
              labels={t.weekday.map((w) => w.day)}
              titles={t.weekday.map((w) => `${w.day} · average over the period`)}
              height={HS}
              fmt={(n) => hrs(n / 60)}
              series={[
                { key: "best", label: "Best day", color: CAT[0], values: t.weekday.map((w, i) => (i === bestIdx ? w.avgMin : null)) },
                { key: "rest", label: "Other days", color: GRAY, values: t.weekday.map((w, i) => (i === bestIdx ? null : w.avgMin)) },
              ]}
              totalLabel="Avg focus"
              ariaLabel="Average focus time per weekday"
            />
          ) : (
            <ChartEmpty height={HS + 22} title="No focus data yet" href="/focus" cta="Start a focus session" />
          )}
        </ChartCard>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Mind & body
// ─────────────────────────────────────────────────────────────────────────

function MindSection({ d }: { d: Data }) {
  const ax = useAxis(d);
  const m = d.mind;
  const hasSleep = m.weekly.some((w) => w.sleep != null);
  return (
    <section aria-labelledby="mind">
      <SectionHead id="mind" icon={Brain} title="Mind & body" desc="Energy fuels everything else. Learning compounds when you recall and practise." />
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Energy & mood"
          hint="Weekly average of morning check-ins (1–5)"
          href="/insights"
          stat={<StatRow items={[{ label: "Check-ins", value: m.checkInDays, sub: "days" }, { label: "Avg energy", value: m.energyAvg != null ? r1(m.energyAvg) : "—", sub: "/ 5" }]} />}
          table={weekTable(d, ["Energy", "Mood", "Sleep h"], (i) => [m.weekly[i].energy, m.weekly[i].mood, m.weekly[i].sleep])}
        >
          {m.checkInDays ? (
            <Lines
              labels={ax.labels}
              titles={ax.titles}
              yMin={1}
              yMax={5}
              fmt={(n) => `${r1(n)}`}
              height={H}
              series={[
                { key: "e", label: "Energy", color: CAT[0], values: m.weekly.map((w) => w.energy) },
                { key: "m", label: "Mood", color: CAT[1], values: m.weekly.map((w) => w.mood) },
              ]}
              ariaLabel="Average energy and mood per week"
            />
          ) : (
            <ChartEmpty height={H + 22} title="No check-ins yet" hint="Rate sleep, energy and mood during the start-up ritual." href="/today" cta="Check in" />
          )}
        </ChartCard>
        <ChartCard title="Sleep" hint="Average hours slept per night, by week" href="/insights" table={weekTable(d, ["Sleep h"], (i) => [m.weekly[i].sleep])}>
          {hasSleep ? (
            <Lines
              labels={ax.labels}
              titles={ax.titles}
              series={[{ key: "s", label: "Sleep", color: CAT[0], values: m.weekly.map((w) => w.sleep) }]}
              yMax={10}
              refLine={{ value: 7, label: "7h" }}
              fmt={hrs}
              height={H}
              ariaLabel="Average sleep hours per week"
            />
          ) : (
            <ChartEmpty height={H} title="No sleep logged yet" hint="Add sleep hours in the morning check-in." href="/today" cta="Check in" />
          )}
        </ChartCard>
        <ChartCard
          title="Recall reviews"
          hint="Cards reviewed per week; retention = graded reviews you remembered"
          href="/recall"
          stat={
            <StatRow
              items={[
                { label: "Reviews", value: fmtInt(m.reviews), sub: `prev ${fmtInt(m.reviewsPrev)}` },
                { label: "Retention", value: m.retention != null ? `${m.retention}%` : "—", sub: m.retentionPrev != null ? `prev ${m.retentionPrev}%` : undefined },
              ]}
            />
          }
          table={weekTable(d, ["Reviews", "Retention %"], (i) => [m.weekly[i].reviews, m.weekly[i].retention])}
        >
          {m.reviews || m.reviewsPrev ? (
            <Columns
              labels={ax.labels}
              titles={ax.titles}
              height={H}
              series={[{ key: "r", label: "Reviews", color: CAT[0], values: m.weekly.map((w) => w.reviews) }]}
              extraTip={(i) => [{ label: "retention", value: m.weekly[i].retention != null ? `${m.weekly[i].retention}%` : "—", bold: false }]}
              ariaLabel="Recall card reviews per week"
            />
          ) : (
            <ChartEmpty height={H} title="No recall reviews yet" hint="Turn notes into cards and review a few a day." href="/recall" cta="Open Recall" />
          )}
        </ChartCard>
        <ChartCard
          title="Practice by learning area"
          hint="Minutes practised this period; the marker is the weekly target × weeks"
          href="/learning"
          stat={
            <StatRow
              items={[
                { label: "Practice", value: hrs(m.practiceMin / 60) },
                { label: "Notes created", value: m.notesCreated },
                { label: "Resources done", value: m.resourcesFinished },
              ]}
            />
          }
          table={m.practiceAreas.length ? { columns: ["Learning area", "Minutes", "Target"], rows: m.practiceAreas.map((p) => [p.name, p.minutes, p.target]) } : null}
        >
          {m.practiceAreas.length ? (
            <HBars
              rows={m.practiceAreas.map((p) => ({
                key: p.id,
                label: p.name,
                value: p.minutes,
                display: hrs(p.minutes / 60),
                target: p.target,
                targetDisplay: p.target ? hrs(p.target / 60) : undefined,
              }))}
            />
          ) : (
            <ChartEmpty height={160} title="No practice logged" hint="Log deliberate practice against a learning area." href="/learning" cta="Open Learning" />
          )}
        </ChartCard>
        <ChartCard
          className="md:col-span-2"
          title="Habit consistency"
          hint="Check-ins (full, minimum or stretch) vs each habit's weekly target, since it started in this period"
          href="/habits"
          stat={m.habitAvg != null ? <StatRow items={[{ label: "Average", value: `${m.habitAvg}%`, sub: `${m.habits.length} active habits` }]} /> : undefined}
          table={m.habits.length ? { columns: ["Habit", "Done", "Expected", "%", "Minimum", "Stretch", "Skips"], rows: m.habits.map((h) => [h.title, h.done, h.expected, h.pct, h.min, h.stretch, h.skip]) } : null}
        >
          {m.habits.length ? (
            <HBars
              className="grid gap-x-8 gap-y-2.5 space-y-0 md:grid-cols-2"
              max={100}
              rows={m.habits.map((h) => ({
                key: h._id,
                label: h.title,
                value: h.pct,
                display: `${h.pct}%`,
                sub: `${h.done} of ${h.expected}${h.min ? ` · ${h.min} minimum` : ""}${h.stretch ? ` · ${h.stretch} stretch` : ""}${h.skip ? ` · ${h.skip} planned skip${h.skip === 1 ? "" : "s"}` : ""}`,
              }))}
            />
          ) : (
            <ChartEmpty height={140} title="No active habits" hint="Design one tiny habit with an anchor: “After I pour coffee, I…”" href="/habits" cta="Add a habit" />
          )}
        </ChartCard>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Skeleton — the same layout and sizes as the loaded page (no layout shift)
// ─────────────────────────────────────────────────────────────────────────

function CardSk({ h, stat = true, className }: { h: number; stat?: boolean; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 shadow-card sm:px-5 sm:pb-5", className)}>
      <div className="skeleton h-4 w-40" />
      <div className="skeleton mt-1.5 h-3 w-56 max-w-full" />
      {stat && <div className="skeleton mt-3 h-9 w-64 max-w-full" />}
      <div className="skeleton mt-3 w-full" style={{ height: h }} />
    </div>
  );
}

function HeadSk() {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="skeleton size-8 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <div className="skeleton h-5 w-36" />
        <div className="skeleton mt-1.5 h-4 w-72 max-w-full" />
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading analytics">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton mt-2 h-7 w-24" />
            <div className="skeleton mt-1.5 h-3.5 w-28" />
            <div className="skeleton mt-2 h-[30px] w-full" />
          </div>
        ))}
      </div>
      <div>
        <div className="skeleton mb-3 h-6 w-44" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-[76px] rounded-xl" />
          ))}
        </div>
      </div>
      <div>
        <HeadSk />
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSk h={H} />
          <CardSk h={H + 22} />
        </div>
      </div>
      <div>
        <HeadSk />
        <CardSk h={190} />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CardSk h={HS} stat={false} />
          <CardSk h={HS + 22} stat={false} />
          <CardSk h={HS + 22} stat={false} className="md:col-span-2 xl:col-span-1" />
        </div>
      </div>
      <div>
        <HeadSk />
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSk h={H} />
          <CardSk h={H + 22} />
        </div>
      </div>
    </div>
  );
}
