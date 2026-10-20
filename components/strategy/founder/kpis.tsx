"use client";

/** Founder HQ KPI row: six equal tiles (number, label, mini chart, context line). */
import { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Clapperboard, Clock, Gauge, Handshake, HeartHandshake, Trophy } from "lucide-react";
import { cn } from "@/components/os/kit";
import { fmtYmd } from "@/lib/day";
import { STAGE_LABEL, fmtMoney, fmtNum } from "../lib";
import { BulletBar, StageStrip, TrendLine, WeekBars, ceilingTone } from "./charts";
import { plural, type HQ } from "./shared";

type Tile = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  value?: ReactNode;
  suffix?: ReactNode;
  tone?: "success" | "warning" | "danger";
  viz?: ReactNode;
  sub?: ReactNode;
};

const BASE: Omit<Tile, "value">[] = [
  { key: "score", label: "Scorecard", icon: Gauge, href: "/scorecard" },
  { key: "pipe", label: "Open pipeline", icon: Handshake, href: "/pipeline" },
  { key: "won", label: "Won this week", icon: Trophy, href: "/pipeline" },
  { key: "promise", label: "Promises kept", icon: HeartHandshake, href: "/commitments" },
  { key: "content", label: "Hub content", icon: Clapperboard, href: "/content" },
  { key: "hours", label: "Hours this week", icon: Clock, href: "/insights" },
];

const wk = (ymd: string) => `Week of ${fmtYmd(ymd, { month: "short", day: "numeric" })}`;

function tiles(hq: HQ): Tile[] {
  const cur = hq.currency;
  const money = (n: number) => fmtMoney(n, cur, { compact: Math.abs(n) >= 10_000 });
  const s = hq.scorecard;
  const p = hq.pipeline;
  const c = hq.content;
  const pr = hq.promises;
  const h = hq.hours;
  const cap = hq.wellbeing.cap;
  const target = Math.max(1, c.target);

  const shares = s.weekly.map((w) => (w.tracked ? Math.round((w.on / w.tracked) * 100) : null));
  const wonByValue = p.wonWeekly.some((w) => w.value > 0);
  const wonSeries = p.wonWeekly.map((w) => (wonByValue ? w.value : w.count));
  const wonAvg = wonSeries.slice(0, -1).reduce((a, b) => a + b, 0) / Math.max(1, wonSeries.length - 1);

  return [
    {
      ...BASE[0],
      value: s.total ? s.on : "—",
      suffix: s.total ? `/${s.total}` : undefined,
      tone: !s.total ? undefined : s.off === 0 && s.missing === 0 ? "success" : s.off > s.on ? "danger" : undefined,
      viz: (
        <TrendLine
          values={shares}
          label={`Share of numbers on track, last 8 weeks: ${shares.map((x) => (x == null ? "no data" : `${x}%`)).join(", ")}`}
        />
      ),
      sub: s.total ? `on track · ${s.off} off${s.missing ? ` · ${s.missing} blank` : ""}` : "Not set up yet",
    },
    {
      ...BASE[1],
      value: money(p.openValue),
      tone: undefined,
      viz: (
        <StageStrip
          stages={p.byStage.map((x) => ({ key: x.stage, label: STAGE_LABEL[x.stage] ?? x.stage, count: x.count }))}
          label={`Open deals by stage: ${p.byStage.map((x) => `${STAGE_LABEL[x.stage] ?? x.stage} ${x.count}`).join(", ")}`}
        />
      ),
      sub: `${plural(p.openCount, "deal")}${p.winRate != null ? ` · ${p.winRate}% win rate · 90d` : ""}`,
    },
    {
      ...BASE[2],
      value: p.wonValueThisWeek > 0 ? money(p.wonValueThisWeek) : p.wonThisWeek,
      suffix: p.wonValueThisWeek > 0 ? undefined : p.wonThisWeek === 1 ? "deal" : "deals",
      tone: p.wonThisWeek ? "success" : undefined,
      viz: (
        <WeekBars
          values={wonSeries}
          barClass="bg-success/70"
          titles={p.wonWeekly.map((w) => `${wk(w.weekStart)}: ${plural(w.count, "deal")}${w.value ? ` · ${money(w.value)}` : ""}`)}
          label={`Deals won per week, last 8 weeks: ${p.wonWeekly.map((w) => (wonByValue ? money(w.value) : w.count)).join(", ")}`}
        />
      ),
      sub: `${plural(p.wonThisWeek, "deal")} · avg ${wonByValue ? money(Math.round(wonAvg)) : fmtNum(wonAvg)}/wk`,
    },
    {
      ...BASE[3],
      value: pr.rate == null ? "—" : `${pr.rate}%`,
      tone: pr.rate == null ? undefined : pr.rate >= 90 ? "success" : pr.rate < 70 ? "warning" : undefined,
      viz: (
        <BulletBar
          value={pr.rate ?? 0}
          target={90}
          max={100}
          label={pr.rate == null ? "No promises due in the last 28 days" : `${pr.rate}% kept on time, goal 90%`}
        />
      ),
      sub: pr.due ? `${pr.kept}/${pr.due} on time · ${pr.overdueCount} overdue` : "None due in 28 days",
    },
    {
      ...BASE[4],
      value: c.hubsThisWeek,
      suffix: `/${target}`,
      tone: c.hubsThisWeek >= target ? "success" : undefined,
      viz: (
        <WeekBars
          values={c.cadence.map((w) => w.hubs)}
          target={target}
          titles={c.cadence.map((w) => `${wk(w.weekStart)}: ${w.hubs} hub · ${w.published} published`)}
          label={`Hub pieces per week vs target ${target}, last 8 weeks: ${c.cadence.map((w) => w.hubs).join(", ")}`}
        />
      ),
      sub: `${c.publishedThisWeek} published${c.hubStreak ? ` · ${c.hubStreak}-wk streak` : ""}`,
    },
    {
      ...BASE[5],
      value: `${fmtNum(h.total)}h`,
      suffix: `/${cap}h`,
      tone: h.total >= cap ? "warning" : undefined,
      viz: <BulletBar value={h.total} target={cap} tone={ceilingTone(h.total, cap)} label={`${fmtNum(h.total)} hours of a ${cap} hour cap`} />,
      sub: `${fmtNum(h.focus)}h deep focus · cap ${cap}h`,
    },
  ];
}

const FRAME = "flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 shadow-card";

function TileView({ t, loading }: { t: Tile; loading?: boolean }) {
  const Icon = t.icon;
  const body = (
    <>
      <div className="flex h-4 items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium uppercase leading-4 tracking-wide text-muted-foreground">{t.label}</span>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      {loading ? (
        <>
          <div className="mt-2 flex h-8 items-center">
            <div className="skeleton h-6 w-20" />
          </div>
          <div className="skeleton mt-2 h-7" />
          <div className="mt-2 flex h-4 items-center">
            <div className="skeleton h-3 w-24" />
          </div>
        </>
      ) : (
        <>
          <div className="mt-2 flex h-8 min-w-0 items-baseline gap-1">
            <span
              className={cn(
                "truncate text-2xl font-semibold leading-8 tracking-tight tabular-nums",
                t.tone === "success" && "text-success",
                t.tone === "warning" && "text-warning",
                t.tone === "danger" && "text-danger",
              )}
            >
              {t.value}
            </span>
            {t.suffix != null && <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">{t.suffix}</span>}
          </div>
          <div className="mt-2 flex h-7 items-center">{t.viz}</div>
          <div className="mt-2 truncate text-xs leading-4 text-muted-foreground" title={typeof t.sub === "string" ? t.sub : undefined}>
            {t.sub}
          </div>
        </>
      )}
    </>
  );
  if (loading) return <div className={FRAME}>{body}</div>;
  return (
    <Link
      href={t.href}
      className={cn(FRAME, "transition-colors hover:border-ring/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40")}
    >
      {body}
    </Link>
  );
}

export function KpiRow({ hq }: { hq: HQ | undefined }) {
  const list: Tile[] = hq ? tiles(hq) : BASE;
  return (
    <section aria-label="Key numbers" className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
      {list.map((t) => (
        <TileView key={t.key} t={t} loading={!hq} />
      ))}
    </section>
  );
}
