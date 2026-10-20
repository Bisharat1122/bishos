"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type CCData = NonNullable<FunctionReturnType<typeof api.projects.commandCenter>>;
import {
  Plus, X, Layers, Target, Flame, CheckSquare, Timer, CalendarClock,
  ArrowUpRight, Link2, Search,
} from "lucide-react";
import { Card, StatCard, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/variants";
import { toast, errorMessage } from "@/components/os/celebrate";

const fail = (e: unknown) => toast(errorMessage(e), { tone: "warning" });

type RowType = "Goal" | "Habit" | "Task" | "Milestone";
type Status = "On track" | "At risk" | "Behind" | "Done" | "Todo";

const STATUS_META: Record<Status, string> = {
  "On track": "bg-info-soft text-info",
  "At risk": "bg-warning-soft text-warning",
  Behind: "bg-danger-soft text-danger",
  Done: "bg-success-soft text-success",
  Todo: "bg-muted text-muted-foreground",
};

const PHASES = [
  { key: "now", label: "Now / this week" },
  { key: "d30", label: "Day 30" },
  { key: "d60", label: "Day 60" },
  { key: "d90", label: "Day 90" },
] as const;
const PLAN_DOT = ["", "todo", "doing", "done"];
const DOT_CLS: Record<string, string> = {
  "": "bg-muted",
  todo: "bg-muted-foreground/50",
  doing: "bg-warning",
  done: "bg-primary",
};

export function SprintCommandCenter({ id }: { id: Id<"projects"> }) {
  const data = useQuery(api.projects.commandCenter, { id });
  const allAreas = useQuery(api.lifeAreas.list);
  const setAreas = useMutation(api.projects.setAreas);

  const [linkOpen, setLinkOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"All" | RowType>("All");
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"title" | "type" | "area" | "metric" | "due" | "status">("status");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const rows = useMemo(() => (data ? buildRows(data) : []), [data]);
  const filtered = useMemo(() => {
    let r = rows;
    if (typeFilter !== "All") r = r.filter((x) => x.type === typeFilter);
    if (areaFilter) r = r.filter((x) => x.area === areaFilter);
    const dir = sortDir;
    return [...r].sort((a, b) => {
      let av: number | string = "";
      let bv: number | string = "";
      if (sortBy === "metric") { av = metricOf(a); bv = metricOf(b); }
      else if (sortBy === "due") { av = a.due ?? Infinity; bv = b.due ?? Infinity; }
      else if (sortBy === "status") { av = a.status; bv = b.status; }
      else if (sortBy === "type") { av = a.type; bv = b.type; }
      else if (sortBy === "area") { av = a.area ?? ""; bv = b.area ?? ""; }
      else { av = a.title.toLowerCase(); bv = b.title.toLowerCase(); }
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }, [rows, typeFilter, areaFilter, sortBy, sortDir]);

  if (data === undefined) {
    return <div className="mt-5 h-40 animate-pulse rounded-xl border border-border bg-card shadow-card" />;
  }
  if (data === null) return null;

  const s = data.stats;
  const sort = (key: typeof sortBy) => {
    if (sortBy === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortBy(key); setSortDir(1); }
  };

  return (
    <div className="mt-5 space-y-4">
      {/* Areas */}
      <div className="flex flex-wrap items-center gap-2">
        <Layers className="h-4 w-4 text-muted-foreground" />
        {data.areas.map((a) => (
          <Link
            key={a._id}
            href={`/life-areas/${a._id}`}
            className="flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs hover:border-primary/60"
            style={{ borderLeftColor: a.color ?? undefined }}
          >
            {a.name}
          </Link>
        ))}
        <button
          onClick={() => setAreasOpen(true)}
          className="flex items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3 w-3" /> Link area
        </button>
        <button
          onClick={() => setLinkOpen(true)}
          className={cn(buttonVariants({ size: "sm" }), "ml-auto")}
        >
          <Link2 className="h-3.5 w-3.5" /> Link goals / habits / tasks
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Days left" value={s.daysLeft != null ? `${Math.max(0, s.daysLeft)}` : "—"} sub={`${s.timeElapsedPct}% elapsed`} icon={<CalendarClock className="h-4 w-4" />} />
        <StatCard label="Milestones" value={`${s.milestonePct}%`} sub="sprint progress" icon={<Target className="h-4 w-4" />} />
        <StatCard label="Goals" value={`${s.goalsAvg}%`} sub={`${data.goals.length} linked`} icon={<Target className="h-4 w-4" />} />
        <StatCard label="Habits" value={`${s.habitAdherence}%`} sub={`${data.habits.length} linked · 30d`} icon={<Flame className="h-4 w-4" />} />
        <StatCard label="Focus" value={`${s.focusHours}h`} sub="this sprint" icon={<Timer className="h-4 w-4" />} />
        <StatCard label="Tasks" value={`${s.tasksDone}/${s.tasksTotal}`} sub="done" icon={<CheckSquare className="h-4 w-4" />} />
      </div>

      {/* Plan matrix */}
      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Layers className="h-4 w-4 text-sprint" /> Plan — the 90-day arc
        </h3>
        {data.areas.length === 0 ? (
          <p className="text-xs text-muted-foreground">Link life areas to plan your arc across them.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="sticky left-0 bg-card pb-2 pr-3 font-medium">Area</th>
                  {PHASES.map((p) => (
                    <th key={p.key} className="min-w-[150px] pb-2 pr-3 font-medium">{p.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.areas.map((a) => {
                  const row = data.planGrid.find((r) => r.areaId === a._id);
                  return (
                    <tr key={a._id} className="border-t border-border align-top">
                      <td className="sticky left-0 bg-card py-2 pr-3 font-medium">
                        <div className="flex items-center gap-1.5">
                          <PlanDot id={id} areaId={a._id} value={row?.status ?? ""} />
                          {a.name}
                        </div>
                      </td>
                      {PHASES.map((p) => (
                        <td key={p.key} className="py-2 pr-3">
                          <PlanCell id={id} areaId={a._id} field={p.key} value={(row?.[p.key] as string) ?? ""} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Track table */}
      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CheckSquare className="h-4 w-4 text-sprint" /> Track — everything linked
          </h3>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {(["All", "Goal", "Habit", "Task", "Milestone"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "rounded-md border px-2.5 py-0.5 text-[11px]",
                  typeFilter === t ? "border-transparent bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="rounded-md border border-input bg-card shadow-xs px-2.5 py-1 text-[11px] outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
            >
              <option value="">All areas</option>
              {data.areas.map((a) => <option key={a._id} value={a.name}>{a.name}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing linked yet. Use “Link goals / habits / tasks” to populate your sprint.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <Th label="Item" onClick={() => sort("title")} />
                  <Th label="Type" onClick={() => sort("type")} />
                  <Th label="Area" onClick={() => sort("area")} />
                  <Th label="Progress" onClick={() => sort("metric")} />
                  <Th label="Due" onClick={() => sort("due")} />
                  <Th label="Status" onClick={() => sort("status")} />
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <TrackRow key={r.key} row={r} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {areasOpen && allAreas && (
        <AreasModal
          all={allAreas}
          primary={data.project.lifeAreaId}
          selected={new Set(data.areas.map((a) => a._id))}
          onClose={() => setAreasOpen(false)}
          onSave={async (ids) => {
            try {
              await setAreas({ id, areaIds: ids });
              setAreasOpen(false);
            } catch (e) {
              fail(e);
            }
          }}
        />
      )}
      {linkOpen && (
        <LinkModal
          projectId={id}
          defaultArea={data.areas[0]?._id ?? data.project.lifeAreaId}
          onClose={() => setLinkOpen(false)}
        />
      )}
    </div>
  );
}

// ---------- row building / status ----------

type Row = {
  key: string;
  type: RowType;
  title: string;
  area?: string;
  progress?: number;
  streak?: number;
  rate30?: number;
  due?: number | null;
  status: Status;
  link?: string;
  itemId?: string;
  unlinkKind?: "goal" | "habit" | "task";
};

function metricOf(r: Row) {
  return r.progress ?? r.rate30 ?? (r.status === "Done" ? 100 : 0);
}

function buildRows(data: CCData): Row[] {
  const elapsed = data.stats.timeElapsedPct;
  const out: Row[] = [];

  for (const g of data.goals) {
    out.push({
      key: "g:" + g._id, type: "Goal", title: g.title, area: g.area,
      progress: g.progress, due: g.deadline ?? null,
      status: progressStatus(g.progress, elapsed), link: `/goals/${g._id}`,
      itemId: g._id, unlinkKind: "goal",
    });
  }
  for (const h of data.habits) {
    out.push({
      key: "h:" + h._id, type: "Habit", title: h.title, area: h.area,
      streak: h.streak, rate30: h.rate30,
      status: h.rate30 >= 80 ? "On track" : h.rate30 >= 50 ? "At risk" : "Behind",
      link: `/habits/${h._id}`, itemId: h._id, unlinkKind: "habit",
    });
  }
  for (const t of data.tasks) {
    const p = t.status === "done" ? 100 : t.status === "in_progress" ? 50 : 0;
    out.push({
      key: "t:" + t._id, type: "Task", title: t.title, area: t.area,
      progress: p, due: t.dueDate ?? null,
      status: t.status === "done" ? "Done" : taskStatus(t.dueDate),
      link: `/tasks/${t._id}`, itemId: t._id, unlinkKind: "task",
    });
  }
  data.milestones.forEach((m, i) => {
    out.push({
      key: "m:" + i, type: "Milestone", title: m.text,
      status: m.done ? "Done" : "Todo",
    });
  });
  return out;
}

function progressStatus(progress: number, elapsed: number): Status {
  if (progress >= 100) return "Done";
  if (progress >= elapsed) return "On track";
  if (elapsed - progress <= 15) return "At risk";
  return "Behind";
}
function taskStatus(due: number | null | undefined): Status {
  if (due == null) return "On track";
  const now = Date.now();
  if (due < now) return "Behind";
  if (due < now + 3 * 24 * 60 * 60 * 1000) return "At risk";
  return "On track";
}

// ---------- sub-components ----------

function Th({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <th className="cursor-pointer select-none pb-2 pr-3 font-medium hover:text-foreground" onClick={onClick}>
      {label}
    </th>
  );
}

function TrackRow({ row }: { row: Row }) {
  const updateGoal = useMutation(api.goals.update);
  const updateHabit = useMutation(api.habits.update);
  const updateTask = useMutation(api.tasks.update);

  const unlink = () => {
    if (row.unlinkKind === "goal") void updateGoal({ id: row.itemId as Id<"goals">, projectId: null }).catch(fail);
    else if (row.unlinkKind === "habit") void updateHabit({ id: row.itemId as Id<"habits">, projectId: null }).catch(fail);
    else if (row.unlinkKind === "task") void updateTask({ id: row.itemId as Id<"tasks">, projectId: null }).catch(fail);
  };

  return (
    <tr className="group border-b border-border/60">
      <td className="py-2 pr-3 font-medium">
        {row.link ? (
          <Link href={row.link} className="inline-flex items-center gap-1 hover:text-primary">
            {row.title}
            <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
          </Link>
        ) : (
          row.title
        )}
      </td>
      <td className="py-2 pr-3 text-xs text-muted-foreground">{row.type}</td>
      <td className="py-2 pr-3 text-xs text-muted-foreground">{row.area ?? "—"}</td>
      <td className="py-2 pr-3">
        {row.type === "Habit" ? (
          <span className="flex items-center gap-1 text-xs">
            <Flame className="h-3.5 w-3.5 text-warning" /> {row.streak} · {row.rate30}%
          </span>
        ) : row.progress != null ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${row.progress}%` }} />
            </div>
            <span className="text-[11px] tabular-nums text-muted-foreground">{row.progress}%</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-2 pr-3 text-xs text-muted-foreground">
        {row.due ? new Date(row.due).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
      </td>
      <td className="py-2 pr-3">
        <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", STATUS_META[row.status])}>{row.status}</span>
      </td>
      <td className="py-2 text-right">
        {row.unlinkKind && (
          <button onClick={unlink} title="Unlink from sprint" className="text-muted-foreground opacity-0 transition hover:text-danger group-hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </td>
    </tr>
  );
}

function PlanCell({ id, areaId, field, value }: { id: Id<"projects">; areaId: Id<"lifeAreas">; field: string; value: string }) {
  const setCell = useMutation(api.projects.setPlanCell);
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && setCell({ id, areaId, field: field as "now", value: v })}
      placeholder="—"
      className="w-full rounded-md border border-transparent bg-muted/20 px-2 py-1 text-xs outline-none focus:border-ring focus:bg-card focus:ring-[3px] focus:ring-ring/30"
    />
  );
}

function PlanDot({ id, areaId, value }: { id: Id<"projects">; areaId: Id<"lifeAreas">; value: string }) {
  const setCell = useMutation(api.projects.setPlanCell);
  const cycle = () => {
    const next = PLAN_DOT[(PLAN_DOT.indexOf(value) + 1) % PLAN_DOT.length];
    void setCell({ id, areaId, field: "status", value: next }).catch(fail);
  };
  return <button onClick={cycle} title="Cycle status" className={cn("h-2.5 w-2.5 shrink-0 rounded-full", DOT_CLS[value] ?? DOT_CLS[""])} />;
}

function AreasModal({
  all, primary, selected, onClose, onSave,
}: {
  all: { _id: Id<"lifeAreas">; name: string }[];
  primary: Id<"lifeAreas">;
  selected: Set<string>;
  onClose: () => void;
  onSave: (ids: Id<"lifeAreas">[]) => void;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set(selected));
  const toggle = (idv: string) => {
    if (idv === primary) return; // primary always included
    setSel((s) => { const n = new Set(s); n.has(idv) ? n.delete(idv) : n.add(idv); return n; });
  };
  return (
    <Modal title="Link life areas" onClose={onClose}>
      <div className="max-h-72 space-y-1 overflow-y-auto">
        {all.map((a) => {
          const on = sel.has(a._id) || a._id === primary;
          return (
            <button
              key={a._id}
              onClick={() => toggle(a._id)}
              className={cn("flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm", on ? "border-primary/50 bg-primary/10" : "border-border")}
            >
              <span>{a.name}{a._id === primary && <span className="ml-2 text-[10px] text-muted-foreground">primary</span>}</span>
              {on && <CheckSquare className="h-4 w-4 text-primary" />}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onSave([...new Set([primary, ...sel])] as Id<"lifeAreas">[])}
        className={cn(buttonVariants(), "mt-3 w-full")}
      >
        Save areas
      </button>
    </Modal>
  );
}

function LinkModal({
  projectId, defaultArea, onClose,
}: {
  projectId: Id<"projects">;
  defaultArea: Id<"lifeAreas">;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"goal" | "habit" | "task">("goal");
  const [q, setQ] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const goals = useQuery(api.goals.list);
  const habits = useQuery(api.habits.list, {});
  const tasks = useQuery(api.tasks.list, {});

  const updateGoal = useMutation(api.goals.update);
  const updateHabit = useMutation(api.habits.update);
  const updateTask = useMutation(api.tasks.update);
  const createGoal = useMutation(api.goals.create);
  const createHabit = useMutation(api.habits.create);
  const createTask = useMutation(api.tasks.create);

  const items = useMemo(() => {
    const f = (s?: string) => (s ?? "").toLowerCase().includes(q.toLowerCase());
    if (tab === "goal") return (goals ?? []).filter((g) => g.projectId !== projectId && f(g.title)).map((g) => ({ id: g._id as string, title: g.title }));
    if (tab === "habit") return (habits ?? []).filter((h) => h.projectId !== projectId && f(h.title)).map((h) => ({ id: h._id as string, title: h.title }));
    return (tasks ?? []).filter((t) => t.projectId !== projectId && f(t.title)).map((t) => ({ id: t._id as string, title: t.title }));
  }, [tab, q, goals, habits, tasks, projectId]);

  const linkExisting = (itemId: string) => {
    const done = () => toast("Linked to this sprint", { tone: "success" });
    if (tab === "goal") void updateGoal({ id: itemId as Id<"goals">, projectId }).then(done, fail);
    else if (tab === "habit") void updateHabit({ id: itemId as Id<"habits">, projectId }).then(done, fail);
    else void updateTask({ id: itemId as Id<"tasks">, projectId }).then(done, fail);
  };
  const createNew = () => {
    const title = newTitle.trim();
    if (!title) return;
    const done = () => toast(`New ${tab} linked`, { tone: "success" });
    if (tab === "goal") void createGoal({ title, lifeAreaId: defaultArea, timeframe: "custom", projectId }).then(done, fail);
    else if (tab === "habit") void createHabit({ title, frequency: "daily", lifeAreaId: defaultArea, projectId }).then(done, fail);
    else void createTask({ title, priority: "med", lifeAreaId: defaultArea, projectId }).then(done, fail);
    setNewTitle("");
  };

  return (
    <Modal title="Link to this sprint" onClose={onClose}>
      <div className="mb-3 flex items-center rounded-lg bg-muted p-[3px] text-sm text-muted-foreground">
        {(["goal", "habit", "task"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("flex-1 rounded-md px-3 py-1 font-medium capitalize transition-colors", tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {t}s
          </button>
        ))}
      </div>

      {/* create new */}
      <div className="mb-3 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createNew()}
          placeholder={`New ${tab}, linked…`}
          className="flex-1 rounded-md border border-input bg-card shadow-xs px-3 py-2 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
        />
        <button onClick={createNew} className={buttonVariants({ size: "icon" })}>
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* search existing */}
      <div className="mb-2 flex items-center gap-2 rounded-md border border-input bg-card px-3 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${tab}s…`} className="w-full bg-transparent py-2 text-sm outline-none" />
      </div>

      <div className="max-h-64 space-y-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-1 py-3 text-xs text-muted-foreground">No unlinked {tab}s. Create one above.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{it.title}</span>
              <button onClick={() => linkExisting(it.id)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                <Link2 className="h-3 w-3" /> Link
              </button>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
