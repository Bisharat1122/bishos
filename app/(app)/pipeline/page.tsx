"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { AlarmClock, ChevronDown, KanbanSquare, List, Plus, Search, Trophy, Wand2, XCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyHint, Kanban, Metric, PageShell, Section, Segmented, Select, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { relDay, useToday } from "@/lib/day";
import { DealCard, FlagChips, NextStepLine, type DealRow } from "@/components/sales/DealCard";
import { DealDrawer } from "@/components/sales/DealDrawer";
import { DealDialog } from "@/components/sales/DealDialog";
import { useDealMover } from "@/components/sales/DealMove";
import { OutreachMeter } from "@/components/sales/OutreachMeter";
import { RouteConversationDialog } from "@/components/sales/RouteConversationDialog";
import { StageChip } from "@/components/sales/chips";
import { OPEN_STAGES, STAGE_META, agoLabel, fmtMoney, type Stage } from "@/components/sales/meta";

type View = "board" | "list";
type Filter = "all" | "attention" | "due";
type SortKey = "next" | "value" | "stage" | "idle";
type ClosedTab = "won" | "lost";

const VIEW_KEY = "b1.pipeline.view";

function needsAttention(d: DealRow) {
  const f = d.flags;
  return f.overdue || f.idle || f.stuck || f.proposalOpen || f.noNextStep || f.dueToday;
}

/**
 * Opens the drawer for ?deal=<id>. Reacts to in-page navigations too (a
 * /pipeline?deal= link clicked while already here). Suspense-wrapped by the
 * page so only this tiny node waits on the search params during prerender.
 */
function DealFromUrl({ onOpen }: { onOpen: (id: Id<"deals">) => void }) {
  const id = useSearchParams().get("deal");
  useEffect(() => {
    if (id) onOpen(id as Id<"deals">);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return null;
}

export default function PipelinePage() {
  const today = useToday();
  const deals = useQuery(api.deals.list, { today });
  const stats = useQuery(api.deals.stats, { today });
  const mover = useDealMover();

  const [view, setView] = useState<View>("board");
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("next");
  const [openId, setOpenId] = useState<Id<"deals"> | null>(null);
  const [newDeal, setNewDeal] = useState<{ stage: Stage } | null>(null);
  const [routing, setRouting] = useState(false);
  const [closedOpen, setClosedOpen] = useState(false);
  const [closedTab, setClosedTab] = useState<ClosedTab>("won");

  // remember the view (?deal=<id> is handled by <DealFromUrl />)
  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "board" || v === "list") setView(v);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const closeDeal = () => {
    setOpenId(null);
    // drop ?deal= so a refresh / re-click doesn't reopen a closed (or deleted) deal
    const url = new URL(window.location.href);
    if (url.searchParams.has("deal")) {
      url.searchParams.delete("deal");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  };
  const changeView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  };

  const currency = stats?.currency ?? "USD";

  const visible = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (deals ?? []).filter((d) => {
      if (n && ![d.title, d.personName, d.companyName, d.nextStep].filter(Boolean).join(" ").toLowerCase().includes(n)) return false;
      if (filter === "attention" && !needsAttention(d)) return false;
      if (filter === "due" && !(d.flags.dueToday || d.flags.overdue)) return false;
      return true;
    });
  }, [deals, q, filter]);

  const openDeals = useMemo(() => visible.filter((d) => d.flags.open), [visible]);
  const { closed, wonList, lostList, attentionCount, dueCount } = useMemo(() => {
    const all = deals ?? [];
    const closed = all.filter((d) => !d.flags.open);
    const byClosed = (a: DealRow, b: DealRow) => (b.closedAt ?? 0) - (a.closedAt ?? 0);
    return {
      closed,
      wonList: closed.filter((d) => d.stage === "won").sort(byClosed),
      lostList: closed.filter((d) => d.stage !== "won").sort(byClosed),
      attentionCount: all.filter((d) => d.flags.open && needsAttention(d)).length,
      dueCount: all.filter((d) => d.flags.dueToday || d.flags.overdue).length,
    };
  }, [deals]);

  const columns = useMemo(
    () =>
      OPEN_STAGES.map((s) => {
        const inCol = openDeals.filter((d) => d.stage === s);
        const sum = inCol.reduce((t, d) => t + (d.value ?? 0), 0);
        return { key: s, label: STAGE_META[s].short, dot: STAGE_META[s].dot, hint: `Σ ${fmtMoney(sum, currency, true)} · ${STAGE_META[s].hint}` };
      }),
    [openDeals, currency],
  );

  const sorted = useMemo(() => {
    const rows = [...openDeals];
    if (sort === "value") rows.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    else if (sort === "stage") rows.sort((a, b) => OPEN_STAGES.indexOf(b.stage) - OPEN_STAGES.indexOf(a.stage));
    else if (sort === "idle") rows.sort((a, b) => b.flags.idleDays - a.flags.idleDays);
    else rows.sort((a, b) => (a.nextStepDate ?? "9999").localeCompare(b.nextStepDate ?? "9999"));
    return rows;
  }, [openDeals, sort]);

  return (
    <PageShell
      title="Pipeline"
      icon={KanbanSquare}
      subtitle="Founder-led sales. No open deal without a dated next step."
      actions={
        <>
          <button onClick={() => setRouting(true)} className={buttonVariants({ variant: "outline" })}>
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">Route a conversation</span>
            <span className="sm:hidden">Route</span>
          </button>
          <button onClick={() => setNewDeal({ stage: "target" })} className={buttonVariants()}>
            <Plus className="h-4 w-4" /> New deal
          </button>
        </>
      }
      headerExtra={
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(300px,1.35fr)]">
          {stats === undefined ? (
            <>
              <div className="skeleton h-24" />
              <div className="skeleton h-24" />
              <div className="skeleton h-24" />
              <div className="skeleton col-span-2 h-24 lg:col-span-1" />
            </>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <Metric
                  label="Open pipeline"
                  value={fmtMoney(stats.openValue, currency, stats.openValue >= 100000)}
                  sub={`${stats.openCount} open deal${stats.openCount === 1 ? "" : "s"}${stats.velocityDays !== null ? ` · ~${stats.velocityDays}d to close` : ""}`}
                />
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <Metric
                  label="Win rate · 90d"
                  value={stats.winRate === null ? "—" : `${stats.winRate}%`}
                  tone={stats.winRate !== null && stats.winRate >= 30 ? "success" : undefined}
                  sub={stats.won90 + stats.lost90 ? `${stats.won90} won · ${stats.lost90} lost` : "Close a few deals to see it"}
                />
              </div>
              <button
                onClick={() => setFilter(filter === "due" ? "all" : "due")}
                className={cn("rounded-xl border bg-card p-4 text-left shadow-card transition-colors hover:border-ring/60", filter === "due" ? "border-ring" : "border-border")}
              >
                <Metric
                  label="Next steps due"
                  value={stats.nextStepsDue}
                  tone={stats.flags.overdue ? "warning" : stats.nextStepsDue ? "info" : "success"}
                  sub={
                    stats.nextStepsDue
                      ? `${stats.flags.dueToday} today${stats.flags.overdue ? ` · ${stats.flags.overdue} overdue` : ""}`
                      : "All caught up"
                  }
                />
              </button>
              <OutreachMeter className="col-span-2 lg:col-span-1" />
            </>
          )}
        </div>
      }
    >
      {/* toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          value={view}
          onChange={changeView}
          options={[
            { value: "board", label: "Board", icon: KanbanSquare },
            { value: "list", label: "List", icon: List },
          ]}
        />
        <Segmented
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "attention", label: "Needs attention", count: attentionCount },
            { value: "due", label: "Due", count: dueCount },
          ]}
        />
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search deals, people…" className={cn(inputClass, "h-9 w-full pl-8")} />
        </div>
      </div>

      {deals === undefined ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-80 w-72 shrink-0" />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <EmptyHint
          icon={KanbanSquare}
          title="Your pipeline is empty"
          hint="Add the people you want to sell to as Targets. Every deal gets a dated next step, so nothing slips."
          action={
            <button onClick={() => setNewDeal({ stage: "target" })} className={buttonVariants()}>
              <Plus className="h-4 w-4" /> Add your first deal
            </button>
          }
        />
      ) : view === "board" ? (
        <Kanban<DealRow>
          columns={columns}
          items={openDeals}
          columnOf={(d) => d.stage}
          onMove={(d, to) => mover.request(d, to as Stage)}
          renderCard={(d) => <DealCard deal={d} today={today} currency={currency} onOpen={() => setOpenId(d._id)} active={openId === d._id} />}
          footer={(col) => (
            <button
              onClick={() => setNewDeal({ stage: col.key as Stage })}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-1.5 text-xs text-muted-foreground transition-colors hover:border-ring/60 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          )}
        />
      ) : sorted.length === 0 ? (
        <EmptyHint title="Nothing matches" hint="Clear the search or filter to see every open deal." />
      ) : (
        <Section bodyClassName="p-0 sm:p-0" className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <span className="text-xs text-muted-foreground">
              {sorted.length} open · {fmtMoney(sorted.reduce((s, d) => s + (d.value ?? 0), 0), currency)}
            </span>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Sort
              <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-8 w-auto text-xs">
                <option value="next">Next step date</option>
                <option value="value">Value</option>
                <option value="stage">Stage (latest first)</option>
                <option value="idle">Longest idle</option>
              </Select>
            </label>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Deal</th>
                  <th className="px-3 py-2 font-medium">Stage</th>
                  <th className="px-3 py-2 text-right font-medium">Value</th>
                  <th className="px-3 py-2 font-medium">Next step</th>
                  <th className="px-3 py-2 font-medium">Last touch</th>
                  <th className="px-3 py-2 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d) => (
                  <tr
                    key={d._id}
                    onClick={() => setOpenId(d._id)}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        setOpenId(d._id);
                      }
                    }}
                    tabIndex={0}
                    aria-label={`Open ${d.title}`}
                    className="cursor-pointer border-b border-border/60 outline-none transition-colors last:border-0 hover:bg-accent/40 focus-visible:bg-accent/40"
                  >
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">{[d.personName, d.companyName].filter(Boolean).join(" · ") || "—"}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <StageChip stage={d.stage} />
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{d.value ? fmtMoney(d.value, currency) : "—"}</td>
                    <td className="max-w-[280px] px-3 py-2.5">
                      <NextStepLine deal={d} today={today} />
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{agoLabel(d.flags.idleDays)}</td>
                    <td className="px-3 py-2.5">
                      <FlagChips flags={d.flags} max={2} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Won / lost strip */}
      {deals !== undefined && closed.length > 0 && (
        <Section className="mt-6">
          <button onClick={() => setClosedOpen((o) => !o)} className="-mt-1 flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-left" aria-expanded={closedOpen}>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ChevronDown className={cn("h-4 w-4 transition-transform", !closedOpen && "-rotate-90")} /> Closed deals
            </span>
            <span className="flex items-center gap-1.5 text-xs text-success">
              <Trophy className="h-3.5 w-3.5" /> Won this month: {fmtMoney(stats?.wonThisMonth.value ?? 0, currency)} ({stats?.wonThisMonth.count ?? 0})
            </span>
            <span className="text-xs text-muted-foreground">
              {wonList.length} won · {lostList.length} lost/unqualified
            </span>
          </button>
          {closedOpen && (
            <div className="mt-4 space-y-3">
              <Segmented
                size="sm"
                value={closedTab}
                onChange={setClosedTab}
                options={[
                  { value: "won", label: "Won", icon: Trophy, count: wonList.length },
                  { value: "lost", label: "Lost & unqualified", icon: XCircle, count: lostList.length },
                ]}
              />
              {(closedTab === "won" ? wonList : lostList).length === 0 ? (
                <p className="text-sm text-muted-foreground">{closedTab === "won" ? "No wins yet. They're coming." : "Nothing lost. Nice."}</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {(closedTab === "won" ? wonList : lostList).map((d) => (
                    <button
                      key={d._id}
                      onClick={() => setOpenId(d._id)}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-ring/60 hover:bg-accent/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {d.stage === "won" ? [d.companyName ?? d.personName, d.closedDate && `won ${relDay(d.closedDate, today).toLowerCase()}`].filter(Boolean).join(" · ") : `${STAGE_META[d.stage].label}${d.lostReason ? `: ${d.lostReason}` : ""}`}
                        </p>
                      </div>
                      {d.value ? (
                        <span className={cn("shrink-0 text-xs font-semibold tabular-nums", d.stage === "won" ? "text-success" : "text-muted-foreground")}>
                          {fmtMoney(d.value, currency, true)}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* stage legend: flags explained */}
      {deals !== undefined && deals.length > 0 && (
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <AlarmClock className="h-3 w-3" /> Flags: idle = no touch 7+ days · stuck = 14+ days in a stage · proposal open 9+ days · overdue next step
        </p>
      )}

      <Suspense fallback={null}>
        <DealFromUrl onOpen={setOpenId} />
      </Suspense>
      <DealDrawer dealId={openId} onClose={closeDeal} />
      <DealDialog open={!!newDeal} onClose={() => setNewDeal(null)} defaults={{ stage: newDeal?.stage }} />
      <RouteConversationDialog open={routing} onClose={() => setRouting(false)} />
      {mover.node}
    </PageShell>
  );
}
