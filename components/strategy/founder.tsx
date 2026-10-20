"use client";

/**
 * Founder HQ panels — the CEO cockpit, read top to bottom:
 *   FocusStrip (Weekly Big 3 + status line) → KpiRow → Revenue | Marketing engine
 *   → Scorecard | Time & operations → Needs your attention.
 * Every panel takes `hq` (or `undefined` while loading) and renders the SAME
 * frame either way, so nothing shifts when data arrives.
 */
import { ReactNode, useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BedDouble,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Gauge as GaugeIcon,
  Handshake,
  Hourglass,
  Info,
  Megaphone,
  Package,
  Plus,
  Siren,
  Sparkles,
  Target,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { AreaDot, Bar, Chip, Section, areaColor, buttonVariants, cn, type Tone } from "@/components/os/kit";
import { celebrate, errorMessage, toast } from "@/components/os/celebrate";
import { fmtYmd, relDay } from "@/lib/day";
import { CONTENT_STAGE_LABEL, PRIORITY_META, STAGE_LABEL, fmtMetric, fmtMoney, fmtNum, pct, relDayInline } from "./lib";
import { DeepLink } from "./viz";
import { BulletBar, TrendLine, WeekBars, ceilingTone, floorTone } from "./founder/charts";
import { EmptyLine, SkeletonRows, StatCell, SubHead, plural, type HQ } from "./founder/shared";

export type { HQ } from "./founder/shared";
export { KpiRow } from "./founder/kpis";

const DOT: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  muted: "bg-muted-foreground/40",
};

// ── Header strip: Weekly Big 3 + one-line status ────────────────────────
type StatusItem = { key: string; tone: "success" | "warning" | "danger" | "info" | "muted"; text: string; href: string };

function statusItems(hq: HQ): StatusItem[] {
  const out: StatusItem[] = [];
  const s = hq.scorecard;
  const p = hq.pipeline;
  const pr = hq.promises;
  if (s.total) {
    out.push({
      key: "score",
      tone: s.off === 0 && s.missing === 0 ? "success" : s.off > s.on ? "danger" : "muted",
      text: `${s.on} of ${s.total} scorecard numbers on track`,
      href: "/scorecard",
    });
  }
  if (p.dueCount)
    out.push({
      key: "steps",
      tone: p.overdueCount ? "warning" : "info",
      text: `${plural(p.dueCount, "deal step")} due${p.overdueCount ? ` (${p.overdueCount} overdue)` : " today"}`,
      href: "/pipeline",
    });
  if (p.noNextStep) out.push({ key: "nostep", tone: "warning", text: `${plural(p.noNextStep, "deal")} need${p.noNextStep === 1 ? "s" : ""} a next step`, href: "/pipeline" });
  if (pr.overdueCount) out.push({ key: "promise", tone: "warning", text: `${plural(pr.overdueCount, "promise")} overdue`, href: "/commitments" });
  if (hq.decisions.dueCount) out.push({ key: "decide", tone: "info", text: `${plural(hq.decisions.dueCount, "decision")} to review`, href: "/decisions" });
  const load = hq.wellbeing.observations.filter((o) => o.tone === "warning").length;
  if (load) out.push({ key: "load", tone: "warning", text: `${plural(load, "load signal")} worth a look`, href: "/insights" });
  if (out.every((x) => x.key === "score")) out.push({ key: "clear", tone: "success", text: "Nothing urgent: steps, promises and reviews are clear", href: "/pipeline" });
  return out;
}

export function FocusStrip({ hq }: { hq: HQ | undefined }) {
  const big3 = hq?.big3 ?? [];
  const done = big3.filter((b) => b.done).length;
  return (
    <section aria-labelledby="hq-focus" className="mt-5 overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
        <h2 id="hq-focus" className="flex items-center gap-2 text-sm font-semibold">
          <Target className="h-4 w-4 text-muted-foreground" aria-hidden /> This week&apos;s founder focus
        </h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {big3.length > 0 && (
            <span className={cn("font-medium tabular-nums", done === big3.length && "text-success")}>
              {done}/{big3.length} done
            </span>
          )}
          <Link href="/week" className="font-medium hover:text-foreground">
            {big3.length ? "Edit in Week →" : "Plan the week →"}
          </Link>
        </div>
      </div>

      {hq === undefined ? (
        <div className="grid gap-3 px-4 py-3.5 sm:grid-cols-3 sm:px-5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-10" />
          ))}
        </div>
      ) : big3.length ? (
        <ol className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[0, 1, 2].map((i) => {
            const b = big3[i];
            if (!b)
              return (
                <li key={i} className="flex items-center px-4 py-3.5 sm:px-5">
                  <Link href="/week" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <Plus className="h-4 w-4" aria-hidden /> Add Big {i + 1}
                  </Link>
                </li>
              );
            return (
              <li key={i} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                {b.done ? (
                  <CheckCircle2 className="os-pop mt-0.5 h-5 w-5 shrink-0 text-success" aria-label="Done" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/50" aria-label="Not done" />
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Big {i + 1}</p>
                  <p className={cn("text-sm font-medium leading-snug", b.done && "os-done-text")}>{b.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="flex flex-col items-start gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-muted-foreground">No Weekly Big 3 yet. Pick the three outcomes that would make this week a win.</p>
          <Link href="/week" className={buttonVariants({ size: "sm" })}>
            Set the Big 3
          </Link>
        </div>
      )}

      <div className="border-t border-border bg-muted/30 px-4 py-2.5 sm:px-5">
        <h3 className="sr-only">Status</h3>
        {hq === undefined ? (
          <div className="flex h-4 items-center" aria-hidden>
            <div className="skeleton h-3 w-2/3" />
          </div>
        ) : (
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs leading-4">
            {statusItems(hq).map((it) => (
              <li key={it.key}>
                <Link href={it.href} className="inline-flex items-center gap-1.5 text-foreground/90 underline-offset-4 hover:underline">
                  <span className={cn("size-1.5 shrink-0 rounded-full", DOT[it.tone])} aria-hidden />
                  {it.text}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ── Revenue engine ──────────────────────────────────────────────────────
export function RevenueEngine({
  hq,
  today,
  cashSlot,
  className,
}: {
  hq: HQ | undefined;
  today: string;
  /**
   * FINANCE SLOT — a cash & runway tile (Finance module: finAccounts /
   * finTransactions) renders at the top of this panel. Build it as its own
   * component with its own query and pass it in; this panel never reads
   * finance tables.
   */
  cashSlot?: ReactNode;
  className?: string;
}) {
  return (
    <Section
      title="Revenue engine"
      icon={Handshake}
      hint="Pipeline by stage, next steps and promises to clients"
      action={<DeepLink href="/pipeline">Pipeline</DeepLink>}
      className={cn("h-full min-w-0", className)}
    >
      {!hq ? (
        <div className="min-h-[360px] space-y-5">
          <SkeletonRows rows={6} h="h-5" />
          <div className="grid gap-5 sm:grid-cols-2">
            <SkeletonRows rows={3} h="h-9" />
            <SkeletonRows rows={3} h="h-9" />
          </div>
        </div>
      ) : (
        <RevenueBody hq={hq} today={today} cashSlot={cashSlot} />
      )}
    </Section>
  );
}

function RevenueBody({ hq, today, cashSlot }: { hq: HQ; today: string; cashSlot?: ReactNode }) {
  const p = hq.pipeline;
  const pr = hq.promises;
  const maxCount = Math.max(1, ...p.byStage.map((s) => s.count));
  const promiseRows = [
    ...pr.overdue.map((x) => ({ ...x, late: true })),
    ...pr.upcoming.map((x) => ({ ...x, late: false })),
  ].slice(0, 4);
  return (
    <div className="space-y-5">
      {/* ── FINANCE SLOT: cash & runway tile (passed in via `cashSlot`) ── */}
      {cashSlot != null && <div data-slot="finance-cash-runway">{cashSlot}</div>}

      <div>
        <SubHead right={<span className="text-xs tabular-nums text-muted-foreground">{fmtMoney(p.openValue, hq.currency)} open</span>}>
          Pipeline by stage
        </SubHead>
        {!p.openCount ? (
          <EmptyLine href="/pipeline" cta="Add a deal">
            No open deals. Every deal you add gets a dated next step, so nothing goes cold.
          </EmptyLine>
        ) : (
          <ul className="space-y-1.5" aria-label="Open deals by stage">
            {p.byStage.map((s) => (
              <li key={s.stage} className="flex items-center gap-2 text-xs">
                <span className={cn("w-20 shrink-0 truncate", s.count ? "text-foreground" : "text-muted-foreground")}>{STAGE_LABEL[s.stage]}</span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-muted/60">
                  {s.count > 0 && (
                    <div
                      className="flex h-full items-center rounded bg-chart-1/80 px-1.5 text-[11px] font-semibold text-background transition-[width] duration-700"
                      style={{ width: `${Math.max(8, (s.count / maxCount) * 100)}%` }}
                    >
                      {s.count}
                    </div>
                  )}
                </div>
                <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                  {s.value ? fmtMoney(s.value, hq.currency, { compact: true }) : s.count ? "—" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="min-w-0">
          <SubHead count={p.dueCount} countTone={p.overdueCount ? "warning" : "info"} href="/pipeline" linkLabel="Deals">
            Next steps due
          </SubHead>
          {p.nextDue.length ? (
            <ul className="space-y-2">
              {p.nextDue.slice(0, 4).map((d) => {
                const late = !!d.nextStepDate && d.nextStepDate < today;
                return (
                  <li key={d._id} className="min-w-0 text-sm">
                    <Link href={`/pipeline?deal=${d._id}`} className="block truncate font-medium underline-offset-4 hover:underline">
                      {d.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      <span className={cn(late && "font-medium text-warning")}>
                        {d.nextStepDate ? (late ? `Overdue · ${relDay(d.nextStepDate, today)}` : relDay(d.nextStepDate, today)) : ""}
                      </span>
                      {d.nextStep ? ` · ${d.nextStep}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : p.openCount ? (
            <p className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden /> No steps due. All are in the future.
            </p>
          ) : (
            <EmptyLine>Next steps show here on the day they&apos;re due.</EmptyLine>
          )}
        </div>

        <div className="min-w-0">
          <SubHead
            count={pr.overdueCount + pr.upcomingCount}
            countTone={pr.overdueCount ? "warning" : "info"}
            href="/commitments"
            linkLabel="Commitments"
          >
            Promises due
          </SubHead>
          {promiseRows.length ? (
            <ul className="space-y-2">
              {promiseRows.map((x) => (
                <li key={x._id} className="min-w-0 text-sm">
                  <p className="truncate font-medium">{x.title}</p>
                  <p className={cn("truncate text-xs", x.late ? "font-medium text-warning" : "text-muted-foreground")}>
                    {x.late ? "Overdue" : "Due"}
                    {x.promisedDate ? ` · ${relDay(x.promisedDate, today)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : pr.openOwe || pr.due ? (
            <p className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden /> Nothing owed in the next 7 days.
            </p>
          ) : (
            <EmptyLine href="/commitments" cta="Log a promise">
              Log what you promise clients and partners to track your follow-through.
            </EmptyLine>
          )}
        </div>
      </div>

      {(p.openCount > 0 || pr.waitingCheck > 0) && (
        <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
          {p.noNextStep > 0 ? (
            <Chip tone="warning">
              <TriangleAlert /> {p.noNextStep} without a dated next step
            </Chip>
          ) : (
            p.openCount > 0 && (
              <Chip tone="success">
                <CheckCircle2 /> Every open deal has a next step
              </Chip>
            )
          )}
          {p.idleCount > 0 && (
            <Chip tone="muted" title={p.idle.map((d) => d.title).join(", ")}>
              {p.idleCount} idle 7+ days
            </Chip>
          )}
          {pr.dueToday > 0 && <Chip tone="info">{pr.dueToday} promised for today</Chip>}
          {pr.waitingCheck > 0 && <Chip tone="info">{pr.waitingCheck} waiting-for to check</Chip>}
        </div>
      )}
    </div>
  );
}

// ── Marketing engine ────────────────────────────────────────────────────
export function MarketingEngine({ hq, className }: { hq: HQ | undefined; className?: string }) {
  return (
    <Section
      title="Marketing engine"
      icon={Megaphone}
      hint="Content cadence, work in production, offers and campaigns live"
      action={<DeepLink href="/content">Studio</DeepLink>}
      className={cn("h-full min-w-0", className)}
    >
      {!hq ? (
        <div className="min-h-[360px] space-y-5">
          <div className="skeleton h-[76px]" />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-[66px]" />
            ))}
          </div>
          <SkeletonRows rows={4} />
        </div>
      ) : (
        <MarketingBody hq={hq} />
      )}
    </Section>
  );
}

function MarketingBody({ hq }: { hq: HQ }) {
  const c = hq.content;
  const g = hq.growth;
  const target = Math.max(1, c.target);
  const live = [
    ...g.offers.map((o) => ({
      key: o._id as string,
      href: `/offers/${o._id}`,
      icon: Package,
      name: o.name,
      meta: o.price != null ? fmtMoney(o.price, hq.currency, { compact: true }) : "Offer",
    })),
    ...g.campaigns.map((x) => ({ key: x._id as string, href: `/campaigns/${x._id}`, icon: Megaphone, name: x.name, meta: plural(x.leads, "lead") })),
  ].slice(0, 3);
  return (
    <div className="space-y-5">
      <div>
        <SubHead
          right={
            <span className="text-xs tabular-nums text-muted-foreground">
              <span className={cn("font-semibold", c.hubsThisWeek >= target ? "text-success" : "text-foreground")}>{c.hubsThisWeek}</span>/{target} this
              week
            </span>
          }
        >
          Hub cadence
        </SubHead>
        <WeekBars
          height={48}
          values={c.cadence.map((w) => w.hubs)}
          target={target}
          titles={c.cadence.map((w) => `Week of ${fmtYmd(w.weekStart, { month: "short", day: "numeric" })}: ${w.hubs} hub · ${w.published} published`)}
          label={`Hub pieces per week vs target ${target}, last 8 weeks: ${c.cadence.map((w) => w.hubs).join(", ")}`}
        />
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>8 weeks ago</span>
          <span className="flex items-center gap-2">
            {c.hubStreak > 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-warning">
                <Flame className="h-3 w-3" aria-hidden /> {c.hubStreak}-week streak
              </span>
            )}
            <span>dashed = {target}/week target</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCell value={c.inProductionCount} label="In production" sub={`${c.ideas} ideas banked`} href="/content" />
        <StatCell
          value={g.offersLive}
          label="Offers live"
          sub={g.offersTesting ? `${g.offersTesting} testing` : "none testing"}
          href="/offers"
          tone={g.offersLive > 0 ? "success" : undefined}
        />
        <StatCell
          value={g.campaignsLive}
          label="Campaigns live"
          sub={g.campaignsPlanned ? `${g.campaignsPlanned} planned` : "none planned"}
          href="/campaigns"
          tone={g.campaignsLive > 0 ? "success" : undefined}
        />
      </div>

      <div>
        <SubHead count={c.inProductionCount} countTone="info" href="/content" linkLabel="Studio">
          In production
        </SubHead>
        {c.inProduction.length ? (
          <ul className="space-y-1">
            {c.inProduction.slice(0, 3).map((x) => (
              <li key={x._id}>
                <Link href={`/content/${x._id}`} className="-mx-1.5 flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-accent">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {x.isHub && <span className="size-1.5 shrink-0 rounded-full bg-sprint" aria-label="Hub piece" />}
                    <span className="truncate">{x.title}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{CONTENT_STAGE_LABEL[x.stage] ?? x.stage}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyLine href="/content" cta="Brief a piece">
            Nothing in production. Move an idea to Brief to start this week&apos;s hub piece.
          </EmptyLine>
        )}
      </div>

      <div>
        <SubHead href="/campaigns" linkLabel="Campaigns">
          Live offers &amp; campaigns
        </SubHead>
        {live.length ? (
          <ul className="space-y-1">
            {live.map((x) => {
              const I = x.icon;
              return (
                <li key={x.key}>
                  <Link href={x.href} className="-mx-1.5 flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-accent">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <I className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate">{x.name}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{x.meta}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyLine href="/offers" cta="Build an offer">
            Nothing live. One live offer plus one focused campaign is the engine.
          </EmptyLine>
        )}
      </div>
    </div>
  );
}

// ── Scorecard ───────────────────────────────────────────────────────────
const STATUS_CHIP: Record<"on" | "off" | "none", { tone: Tone; label: string }> = {
  on: { tone: "success", label: "On track" },
  off: { tone: "danger", label: "Off track" },
  none: { tone: "muted", label: "No entry" },
};

export function ScorecardPanel({ hq, className }: { hq: HQ | undefined; className?: string }) {
  const s = hq?.scorecard;
  return (
    <Section
      title="Scorecard"
      icon={GaugeIcon}
      hint={
        s?.total ? (
          <>
            {s.on} of {s.total} on track this week · <Zap className="inline h-3 w-3 align-[-1px] text-info" aria-hidden /> = fills itself
          </>
        ) : (
          "The weekly numbers that say if the business is on track"
        )
      }
      action={<DeepLink href="/scorecard">Full grid</DeepLink>}
      className={cn("h-full min-w-0", className)}
    >
      {!hq || !s ? (
        <div className="min-h-[280px]">
          <SkeletonRows rows={7} h="h-6" />
        </div>
      ) : !s.total ? (
        <SeedScorecard />
      ) : (
        <div className="-mx-4 sm:-mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-4 pb-2 font-medium sm:pl-5">
                  Number
                </th>
                <th scope="col" className="hidden w-28 pb-2 pr-3 font-medium sm:table-cell">
                  8 weeks
                </th>
                <th scope="col" className="pb-2 pr-3 text-right font-medium">
                  This week
                </th>
                <th scope="col" className="hidden pb-2 pr-3 text-right font-medium md:table-cell">
                  vs last
                </th>
                <th scope="col" className="px-4 pb-2 text-right font-medium sm:pr-5">
                  <span className="sr-only">Status</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border border-t border-border">
              {s.metrics.map((m) => {
                const delta = m.value != null && m.last != null ? m.value - m.last : null;
                const better = delta == null || delta === 0 ? null : m.direction === "up" ? delta > 0 : delta < 0;
                const st = STATUS_CHIP[m.status ?? "none"];
                return (
                  <tr key={m._id}>
                    <td className="w-full max-w-0 px-4 py-2 sm:pl-5">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate">{m.name}</span>
                        {m.auto && <Zap className="h-3 w-3 shrink-0 text-info" aria-label="Fills itself" />}
                      </span>
                    </td>
                    <td className="hidden py-2 pr-3 sm:table-cell">
                      <TrendLine
                        values={m.history}
                        target={m.target}
                        height={22}
                        tone={m.status === "on" ? "success" : m.status === "off" ? "danger" : "info"}
                        floorZero={false}
                        label={`${m.name}, last 8 weeks: ${m.history.map((x) => (x == null ? "no entry" : fmtMetric(x, m.unit, hq.currency))).join(", ")}; target ${fmtMetric(m.target, m.unit, hq.currency)}`}
                      />
                    </td>
                    <td className="whitespace-nowrap py-2 pr-3 text-right tabular-nums">
                      {m.value == null ? (
                        <Link href="/scorecard" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                          + add
                        </Link>
                      ) : (
                        <span className={cn("font-semibold", m.status === "on" && "text-success", m.status === "off" && "text-danger")}>
                          {fmtMetric(m.value, m.unit, hq.currency)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground"> / {fmtMetric(m.target, m.unit, hq.currency)}</span>
                    </td>
                    <td className="hidden whitespace-nowrap py-2 pr-3 text-right text-xs tabular-nums md:table-cell">
                      {delta == null || delta === 0 ? (
                        <span className="text-muted-foreground">{delta === 0 ? "same" : "—"}</span>
                      ) : (
                        <span className={cn("inline-flex items-center", better ? "text-success" : "text-muted-foreground")}>
                          {delta > 0 ? <ArrowUpRight className="h-3 w-3" aria-hidden /> : <ArrowDownRight className="h-3 w-3" aria-hidden />}
                          {fmtNum(Math.abs(delta))}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right sm:pr-5">
                      <Chip tone={st.tone}>{st.label}</Chip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

function SeedScorecard() {
  const seed = useMutation(api.scorecard.seedDefaults);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-muted-foreground">Seven numbers that tell you if the business is on track. Six fill themselves in.</p>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await seed({});
            if (r.created) {
              toast("Founder scorecard ready", { tone: "success" });
              celebrate(0.7);
            }
          } catch (err) {
            toast(errorMessage(err, "Could not set up the scorecard"), { tone: "warning" });
          } finally {
            setBusy(false);
          }
        }}
        className={buttonVariants({ size: "sm" })}
      >
        <Sparkles className="h-3.5 w-3.5" /> Start with the founder scorecard
      </button>
    </div>
  );
}

// ── Time & operations ───────────────────────────────────────────────────
const RUNG_LABEL: Record<string, string> = { admin: "Admin", delivery: "Delivery", marketing: "Marketing", sales: "Sales", leadership: "Leadership" };
const ROW =
  "grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)_4rem] items-center gap-3 text-sm sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_4.5rem]";

export function TimeOpsPanel({ hq, className }: { hq: HQ | undefined; className?: string }) {
  return (
    <Section
      title="Time & operations"
      icon={Clock}
      hint="Where this week's hours went, and what's ready to hand off"
      action={<DeepLink href="/week">Week</DeepLink>}
      className={cn("h-full min-w-0", className)}
    >
      {!hq ? (
        <div className="min-h-[280px] space-y-5">
          <SkeletonRows rows={5} />
          <SkeletonRows rows={5} h="h-4" />
        </div>
      ) : (
        <TimeOpsBody hq={hq} />
      )}
    </Section>
  );
}

function TimeOpsBody({ hq }: { hq: HQ }) {
  const h = hq.hours;
  const d = hq.delegation;
  const cap = hq.wellbeing.cap;
  const max = Math.max(1, ...h.byArea.map((a) => Math.max(a.actual, a.target ?? 0)));
  const weekly = h.weekly.map((w) => w.hours);
  return (
    <div className="space-y-5">
      <div>
        <SubHead
          right={
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="tabular-nums">
                <span className="font-semibold text-foreground">{fmtNum(h.total)}h</span>
                <span className="hidden sm:inline"> · {fmtNum(h.focus)}h focus</span>
              </span>
              <TrendLine
                className="w-16"
                height={18}
                values={weekly}
                target={cap}
                tone={ceilingTone(h.total, cap)}
                label={`Hours per week, last 8 weeks: ${weekly.map((x) => `${fmtNum(x)}h`).join(", ")}; cap ${cap}h`}
              />
            </span>
          }
        >
          Hours by Life Area
        </SubHead>
        {!h.byArea.length ? (
          <EmptyLine href="/life-areas" cta="Set up Life Areas">
            Life Areas sort your hours into the parts of life you care about.
          </EmptyLine>
        ) : (
          <ul className="space-y-2">
            {h.byArea.map((a, i) => {
              const p = a.target ? pct(a.actual, a.target) : null;
              return (
                <li key={a._id} className={ROW}>
                  <span className="flex min-w-0 items-center gap-2">
                    <AreaDot color={areaColor(a, i)} />
                    <span className="truncate">{a.name}</span>
                  </span>
                  {a.target ? (
                    <BulletBar
                      value={a.actual}
                      target={a.target}
                      tone={floorTone(a.actual, a.target)}
                      label={`${a.name}: ${fmtNum(a.actual)} of ${a.target} target hours (${p}%)`}
                    />
                  ) : (
                    <Bar value={(a.actual / max) * 100} color={areaColor(a, i)} height="h-2" />
                  )}
                  <span className="text-right text-xs tabular-nums text-muted-foreground">
                    <span className={cn("font-semibold", p != null && p >= 100 ? "text-success" : "text-foreground")}>{fmtNum(a.actual)}</span>
                    {a.target ? `/${a.target}h` : "h"}
                  </span>
                </li>
              );
            })}
            {h.unassigned > 0 && (
              <li className={cn(ROW, "text-xs text-muted-foreground")}>
                <span className="pl-4">No area</span>
                <span />
                <span className="text-right tabular-nums">{fmtNum(h.unassigned)}h</span>
              </li>
            )}
          </ul>
        )}
        {h.byArea.length > 0 && !h.byArea.some((a) => a.target) && (
          <p className="mt-2 text-xs text-muted-foreground">
            Set weekly hour targets per area in{" "}
            <Link href="/compass" className="font-medium text-foreground underline-offset-4 hover:underline">
              Compass
            </Link>{" "}
            to see target vs actual.
          </p>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <SubHead
          href="/delegation"
          linkLabel="Delegation"
          right={
            d.total ? (
              <span className="text-xs tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{d.ready}</span>/{d.total} ready · {d.pct}%
              </span>
            ) : undefined
          }
        >
          Delegation readiness
        </SubHead>
        {!d.total ? (
          <EmptyLine href="/delegation" cta="Document a process">
            No processes yet. Start with the admin rung: what you repeat every week.
          </EmptyLine>
        ) : (
          <ul className="space-y-2">
            {d.byRung.map((r) => (
              <li key={r.rung} className={cn(ROW, "text-xs")}>
                <span className={cn("truncate", r.total ? "text-foreground" : "text-muted-foreground")}>{RUNG_LABEL[r.rung]}</span>
                {r.total ? <Bar value={r.pct ?? 0} tone={r.pct === 100 ? "success" : "primary"} height="h-2" /> : <div className="h-2 rounded-full bg-muted" />}
                <span className="text-right tabular-nums text-muted-foreground">{r.total ? `${r.ready}/${r.total}` : "none"}</span>
              </li>
            ))}
          </ul>
        )}
        {d.recordNext > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{d.recordNext}</span> {d.recordNext === 1 ? "task" : "tasks"} marked “should not be me”: record
            the process next time.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Needs your attention ────────────────────────────────────────────────
export function AttentionPanel({ hq, today, className }: { hq: HQ | undefined; today: string; className?: string }) {
  return (
    <Section title="Needs your attention" icon={Siren} hint="Issues to solve, decisions to review, and how you're holding up" className={cn("h-full min-w-0", className)}>
      <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        <Col>{hq ? <IssuesCol hq={hq} /> : <ColSkeleton title="Top issues" />}</Col>
        <Col>{hq ? <DecisionsCol hq={hq} today={today} /> : <ColSkeleton title="Decisions to review" />}</Col>
        <Col>{hq ? <EnergyCol hq={hq} today={today} /> : <ColSkeleton title="Energy & load" />}</Col>
      </div>
    </Section>
  );
}

const Col = ({ children }: { children: ReactNode }) => (
  <div className="min-w-0 py-4 first:pt-0 last:pb-0 md:px-5 md:py-0 md:first:pl-0 md:last:pr-0">{children}</div>
);

function ColSkeleton({ title }: { title: string }) {
  return (
    <div className="min-h-[180px]">
      <SubHead>{title}</SubHead>
      <SkeletonRows rows={3} h="h-9" />
    </div>
  );
}

function IssuesCol({ hq }: { hq: HQ }) {
  const i = hq.issues;
  return (
    <>
      <SubHead count={i.openCount} href="/decisions?tab=issues" linkLabel="IDS">
        Top issues
      </SubHead>
      {i.top.length ? (
        <ol className="space-y-2.5">
          {i.top.map((x, n) => (
            <li key={x._id} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold tabular-nums">{n + 1}</span>
              <div className="min-w-0 flex-1">
                <Link href={`/decisions?tab=issues&issue=${x._id}`} className="block text-sm font-medium leading-snug underline-offset-4 hover:underline">
                  {x.title}
                </Link>
                <div className="mt-1 flex items-center gap-1.5">
                  <Chip tone={PRIORITY_META[x.priority]?.tone ?? "muted"}>{PRIORITY_META[x.priority]?.label ?? `P${x.priority}`}</Chip>
                  <span className="text-xs text-muted-foreground">{x.status === "discussing" ? "Discussing" : "Identified"}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyLine href="/decisions?tab=issues" cta="Add an issue">
          No open issues. Log what&apos;s in the way before it grows.
        </EmptyLine>
      )}
    </>
  );
}

function DecisionsCol({ hq, today }: { hq: HQ; today: string }) {
  const d = hq.decisions;
  return (
    <>
      <SubHead count={d.dueCount} countTone="warning" href="/decisions" linkLabel="Journal">
        Decisions to review
      </SubHead>
      {d.due.length ? (
        <>
          <ul className="space-y-2.5">
            {d.due.map((x) => (
              <li key={x._id} className="flex items-start gap-2.5">
                <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                <div className="min-w-0 flex-1">
                  <Link href={`/decisions?review=${x._id}`} className="block text-sm font-medium leading-snug underline-offset-4 hover:underline">
                    {x.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Review due {x.reviewDate ? relDayInline(x.reviewDate, today) : ""}
                    {x.confidence != null ? ` · you were ${x.confidence}% sure` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <Link href={`/decisions?review=${d.due[0]._id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}>
            Review now
          </Link>
        </>
      ) : (
        <EmptyLine href="/decisions" cta="Journal a decision">
          No reviews due{d.openCount ? ` (${d.openCount} awaiting an outcome later)` : ""}. Journal big calls to learn how good your judgement is.
        </EmptyLine>
      )}
    </>
  );
}

function EnergyCol({ hq, today }: { hq: HQ; today: string }) {
  const w = hq.wellbeing;
  return (
    <>
      <SubHead href="/insights" linkLabel="Insights">
        Energy &amp; load
      </SubHead>
      <div className="space-y-3">
        <div>
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Hours this week</span>
            <span className="tabular-nums">
              <span className="font-semibold">{fmtNum(w.hoursThisWeek)}</span> / {w.cap}h cap
            </span>
          </div>
          <BulletBar
            value={w.hoursThisWeek}
            target={w.cap}
            tone={ceilingTone(w.hoursThisWeek, w.cap)}
            label={`${fmtNum(w.hoursThisWeek)} of a ${w.cap} hour cap`}
          />
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 px-2 py-2">
            <dt className="sr-only">Average sleep, 7 days</dt>
            <dd className={cn("text-base font-semibold tabular-nums", w.avgSleep != null && w.avgSleep < 6.5 && "text-warning")}>
              {w.avgSleep != null ? `${w.avgSleep}h` : "—"}
            </dd>
            <dd className="text-[11px] text-muted-foreground" aria-hidden>
              sleep 7d
            </dd>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2">
            <dt className="sr-only">Average energy</dt>
            <dd className="text-base font-semibold tabular-nums">{w.avgEnergy != null ? `${w.avgEnergy}/5` : "—"}</dd>
            <dd className="text-[11px] text-muted-foreground" aria-hidden>
              energy
            </dd>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2">
            <dt className="sr-only">Days since a rest day</dt>
            <dd className={cn("text-base font-semibold tabular-nums", w.daysSinceRest >= 14 && "text-warning")}>{w.daysSinceRest > 28 ? "28+" : w.daysSinceRest}</dd>
            <dd className="text-[11px] text-muted-foreground" aria-hidden>
              days since rest
            </dd>
          </div>
        </dl>
        <ul className="space-y-1.5">
          {w.observations.map((o) => {
            const Icon = o.tone === "warning" ? TriangleAlert : o.tone === "success" ? CheckCircle2 : Info;
            return (
              <li key={o.key} className="flex items-start gap-2 text-sm">
                <Icon
                  className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", o.tone === "warning" ? "text-warning" : o.tone === "success" ? "text-success" : "text-info")}
                  aria-hidden
                />
                <Link href={o.href} className="underline-offset-4 hover:underline">
                  {o.text}
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BedDouble className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {w.freeDayPlanned ? `Free Day protected: ${relDay(w.freeDayPlanned, today)}.` : "No Free Day protected this week yet."}{" "}
            <Link href="/week" className="font-medium text-foreground underline-offset-4 hover:underline">
              Plan the week
            </Link>
          </span>
        </p>
      </div>
    </>
  );
}
