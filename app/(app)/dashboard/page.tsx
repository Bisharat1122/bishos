"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ListTodo, CalendarRange, Clock, Target, FolderKanban, Repeat, TrendingUp,
  StickyNote, CalendarCheck, Wand2, ArrowUpRight, ArrowUp, ArrowDown,
  AlertTriangle, Lightbulb, Flame, Smile, X,
} from "lucide-react";
import { Card, Topbar } from "@/components/ui";
import { BarChart, LineChart } from "@/components/Chart";
import { cn } from "@/lib/utils";

type Range = "today" | "week" | "month" | "custom";
const RANGE_LABEL: Record<Range, string> = { today: "Today", week: "This week", month: "This month", custom: "Custom" };

export default function DashboardPage() {
  const [range, setRange] = useState<Range>("week");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");

  const rangeArgs = {
    range,
    start: cStart ? new Date(cStart + "T00:00:00").getTime() : undefined,
    end: cEnd ? new Date(cEnd + "T00:00:00").getTime() : undefined,
  };
  const o = useQuery(api.dashboard.overview, rangeArgs);
  const ra = useQuery(api.focus.rangeAnalytics, rangeArgs);
  const notifs = useQuery(api.notifications.list);
  const dismissNotif = useMutation(api.notifications.dismiss);
  const attention = (notifs ?? []).filter((n) => n.severity === "urgent").slice(0, 3);

  const genInsights = useAction(api.ai.insights);
  const [aiInsights, setAiInsights] = useState<{ title: string; body: string }[] | null>(null);
  const [insightsBusy, setInsightsBusy] = useState(false);

  const L = RANGE_LABEL[range].toLowerCase();
  const focusHours = ra ? Math.round((ra.total / 3600) * 10) / 10 : null;

  return (
    <div>
      <Topbar />
      <div className="glow-grid px-4 py-6 sm:px-8 sm:py-7">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, Bish 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your whole life at a glance — pick a window, every module updates.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={range} onChange={(e) => setRange(e.target.value as Range)}
              className="rounded-full border border-border bg-muted/40 px-4 py-2 text-sm outline-none">
              <option value="today">Today</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="custom">Date range</option>
            </select>
            {range === "custom" && (
              <>
                <input type="date" value={cStart} onChange={(e) => setCStart(e.target.value)}
                  className="rounded-full border border-border bg-muted/40 px-3 py-2 text-sm outline-none [color-scheme:dark]" />
                <input type="date" value={cEnd} onChange={(e) => setCEnd(e.target.value)}
                  className="rounded-full border border-border bg-muted/40 px-3 py-2 text-sm outline-none [color-scheme:dark]" />
              </>
            )}
          </div>
        </div>

        {/* Needs attention — top urgent notifications inline */}
        {attention.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warning">
              <AlertTriangle className="h-3.5 w-3.5" /> Needs attention
            </span>
            {attention.map((n) => (
              <span key={n.key} className="group flex items-center gap-2 rounded-full border border-warning/30 bg-warning/5 py-1 pl-3 pr-1.5 text-xs">
                <Link href={n.href} className="flex items-center gap-1.5">
                  <span className="font-medium">{n.title}</span>
                  <span className="text-warning">· {n.meta}</span>
                </Link>
                <button onClick={() => void dismissNotif({ key: n.key })} title="Dismiss" className="rounded-full p-0.5 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* KPI row with deltas vs previous period */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={Clock} label={`Focus · ${L}`} value={focusHours} unit="h"
            delta={focusHours != null && o ? round1(focusHours - o.compare.focusHours) : null} deltaUnit="h" />
          <Kpi icon={ListTodo} label="Tasks done" value={o?.tasks.done}
            delta={o ? o.tasks.done - o.compare.tasksDone : null} />
          <Kpi icon={CalendarRange} label="Plan adherence" value={o ? `${o.schedule.adherence}%` : undefined}
            delta={o ? o.schedule.adherence - o.compare.adherence : null} deltaUnit="pts" />
          <Kpi icon={Smile} label="Avg energy" value={o?.checkin.avgEnergy != null ? `${o.checkin.avgEnergy}` : "—"}
            delta={o && o.checkin.avgEnergy != null && o.compare.avgEnergy != null ? round1(o.checkin.avgEnergy - o.compare.avgEnergy) : null} deltaUnit="pts" />
        </div>

        {/* Focus chart + smart insights */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-semibold"><Flame className="h-4 w-4 text-primary" /> Focus activity</h2>
                <p className="text-3xl font-bold tracking-tight">
                  {focusHours ?? "—"}h
                  {o && (
                    <DeltaText delta={focusHours != null ? round1(focusHours - o.compare.focusHours) : null} unit="h" className="ml-2 align-middle text-sm" suffix={`vs ${L === "today" ? "yesterday" : `last ${L.replace("this ", "")}`}`} />
                  )}
                </p>
              </div>
              <Link href="/focus" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">Open <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </div>
            <BarChart data={ra?.series ?? []} unit="h" />
          </Card>

          <Card className="bg-card-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4 text-primary" /> Smart insights</h2>
              <button
                onClick={async () => { setInsightsBusy(true); try { setAiInsights(await genInsights()); } catch { /* keep */ } finally { setInsightsBusy(false); } }}
                disabled={insightsBusy}
                className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/25 disabled:opacity-50"
              >
                <Wand2 className="h-3.5 w-3.5" /> {insightsBusy ? "…" : aiInsights ? "AI ↻" : "Ask AI"}
              </button>
            </div>
            <div className="space-y-2">
              {o?.insights.slice(0, 6).map((ins, i) => (
                <Link key={i} href={ins.href}
                  className={cn(
                    "group flex items-start gap-2 rounded-lg border px-2.5 py-2 text-xs transition hover:brightness-110",
                    ins.tone === "good" && "border-primary/30 bg-primary/5",
                    ins.tone === "warn" && "border-warning/30 bg-warning/5",
                    ins.tone === "neutral" && "border-border bg-muted/20",
                  )}>
                  {ins.tone === "warn" ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                    : ins.tone === "good" ? <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    : <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />}
                  <span className="flex-1">{ins.text}</span>
                  <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 opacity-0 transition group-hover:opacity-100" />
                </Link>
              ))}
              {o && o.insights.length === 0 && <Empty>Log some activity to see insights</Empty>}

              {/* AI-written insights, when generated */}
              {aiInsights?.map((ai, i) => (
                <div key={`ai${i}`} className="rounded-lg border border-accent/30 bg-accent/5 px-2.5 py-2">
                  <p className="text-xs font-medium text-accent">{ai.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{ai.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Energy trend + module tiles */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold"><Smile className="h-4 w-4 text-primary" /> Energy trend</h2>
              <Link href="/check-in" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">Open <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </div>
            <LineChart data={o?.moodSeries ?? []} max={10} unit="" />
          </Card>

          {/* Schedule */}
          <Tile icon={CalendarRange} title="Schedule" href="/schedule">
            <Metrics items={[
              { v: o ? `${o.schedule.adherence}%` : undefined, l: "adherence" },
              { v: o ? `${o.schedule.scheduledHours}h` : undefined, l: "planned" },
              { v: o ? `${o.schedule.actualHours}h` : undefined, l: "focused" },
            ]} />
            <p className="mt-3 text-xs text-muted-foreground">{o ? `${o.schedule.done}/${o.schedule.totalBlocks} blocks completed ${L}` : "—"}</p>
          </Tile>

          {/* Momentum */}
          <Tile icon={TrendingUp} title="Momentum" href="/momentum">
            <Metrics items={[
              { v: o?.momentum.count, l: "moments" },
              { v: o ? `${o.momentum.avgImpact}/5` : undefined, l: "avg impact" },
            ]} />
            <List>
              {o?.momentum.recent.map((m, i) => <Row key={i} label={m.title} right={`${m.impact}/5`} />)}
              {o && o.momentum.recent.length === 0 && <Empty>Nothing logged {L}</Empty>}
            </List>
          </Tile>
        </div>

        {/* Module tiles */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Tile icon={ListTodo} title="Tasks" href="/tasks">
            <Metrics items={[
              { v: o?.tasks.done, l: "done" },
              { v: o?.tasks.open, l: "open" },
              { v: o?.tasks.overdue, l: "overdue", warn: (o?.tasks.overdue ?? 0) > 0 },
            ]} />
            <List>
              {o?.tasks.top.map((t) => <LinkRow key={t._id} href="/tasks" label={t.title} right={t.priority} />)}
              {o && o.tasks.top.length === 0 && <Empty>No open tasks</Empty>}
            </List>
          </Tile>

          <Tile icon={Target} title="Goals" href="/goals">
            <Metrics items={[
              { v: o?.goals.behind, l: "behind", warn: (o?.goals.behind ?? 0) > 0 },
              { v: o ? `${o.goals.avgProgress}%` : undefined, l: "avg progress" },
              { v: o?.goals.total, l: "total" },
            ]} />
            <List>
              {o?.goals.top.map((g) => <LinkRow key={g._id} href={`/goals/${g._id}`} label={g.title} right={`${g.progress}%`} />)}
              {o && o.goals.top.length === 0 && <Empty>No goals yet</Empty>}
            </List>
          </Tile>

          <Tile icon={FolderKanban} title="Projects" href="/projects">
            <Metrics items={[
              { v: o?.projects.active, l: "active" },
              { v: o ? `${o.projects.avgProgress}%` : undefined, l: "avg progress" },
              { v: o?.projects.total, l: "total" },
            ]} />
            <List>
              {o?.projects.top.map((p) => <LinkRow key={p._id} href={`/projects/${p._id}`} label={p.title} right={`${p.progress}%`} />)}
              {o && o.projects.top.length === 0 && <Empty>No active projects</Empty>}
            </List>
          </Tile>

          <Tile icon={Repeat} title="Habits" href="/habits">
            <Metrics items={[
              { v: o ? `${o.habits.rate}%` : undefined, l: "completion" },
              { v: o?.habits.longest, l: "longest streak" },
              { v: o?.habits.atRisk.length, l: "at risk", warn: (o?.habits.atRisk.length ?? 0) > 0 },
            ]} />
            <List>
              {o?.habits.atRisk.map((h) => <LinkRow key={h._id} href="/habits" label={h.title} right={`🔥${h.streak}`} />)}
              {o && o.habits.atRisk.length === 0 && <Empty>All habits on track</Empty>}
            </List>
          </Tile>

          <Tile icon={StickyNote} title="Notes" href="/notes">
            <Metrics items={[
              { v: o?.notes.created, l: `new ${L}` },
              { v: o?.notes.total, l: "total" },
            ]} />
            <List>
              {o?.notes.recent.map((n) => <LinkRow key={n._id} href={`/notes/${n._id}`} label={n.title} />)}
              {o && o.notes.recent.length === 0 && <Empty>No notes yet</Empty>}
            </List>
          </Tile>

          <Tile icon={CalendarCheck} title="Check-in" href="/check-in">
            <Metrics items={[
              { v: o?.checkin.avgEnergy != null ? `${o.checkin.avgEnergy}/10` : "—", l: "avg energy" },
              { v: o?.checkin.days, l: "days logged" },
            ]} />
            <p className="mt-3 text-xs text-muted-foreground">
              {o?.checkin.latest ? `Last check-in ${o.checkin.latest.date} · energy ${o.checkin.latest.energyMood}/10` : "No check-ins yet"}
            </p>
          </Tile>
        </div>
      </div>
    </div>
  );
}

const round1 = (n: number) => Math.round(n * 10) / 10;

// ---- primitives ----
function Kpi({ icon: Icon, label, value, unit, delta, deltaUnit }: {
  icon: typeof Clock; label: string; value: React.ReactNode; unit?: string; delta?: number | null; deltaUnit?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-1.5 text-2xl font-bold tracking-tight">{value ?? "—"}{value != null && unit ? unit : ""}</div>
      <DeltaText delta={delta} unit={deltaUnit} className="mt-0.5 text-xs" suffix="vs prev" />
    </Card>
  );
}

function DeltaText({ delta, unit, className, suffix }: { delta?: number | null; unit?: string; className?: string; suffix?: string }) {
  if (delta == null || delta === 0) return <span className={cn("text-muted-foreground", className)}>—</span>;
  const up = delta > 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-medium", up ? "text-primary" : "text-warning", className)}>
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta)}{unit} <span className="font-normal text-muted-foreground">{suffix}</span>
    </span>
  );
}

function Tile({ icon: Icon, title, href, children }: { icon: typeof ListTodo; title: string; href: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-primary" /> {title}</h2>
        <Link href={href} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">Open <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
      {children}
    </Card>
  );
}

function Metrics({ items }: { items: { v: React.ReactNode; l: string; warn?: boolean }[] }) {
  return (
    <div className="flex gap-4">
      {items.map((m, i) => (
        <div key={i}>
          <div className={cn("text-2xl font-bold tracking-tight", m.warn && "text-warning")}>{m.v ?? "—"}</div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{m.l}</div>
        </div>
      ))}
    </div>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 space-y-1 border-t border-border pt-3">{children}</div>;
}

function LinkRow({ href, label, right }: { href: string; label: string; right?: string }) {
  return (
    <Link href={href} className="group flex items-center justify-between gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted/40">
      <span className="truncate">{label}</span>
      {right && <span className="shrink-0 text-xs uppercase text-muted-foreground">{right}</span>}
    </Link>
  );
}

function Row({ label, right }: { label: string; right?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1 py-1 text-sm">
      <span className="truncate">{label}</span>
      {right && <span className="shrink-0 text-xs text-muted-foreground">{right}</span>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-1 py-1 text-xs text-muted-foreground">{children}</p>;
}
