"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  TrendingUp, CheckSquare, Target, FolderKanban, StickyNote, Repeat,
  Layers, Trash2, ArrowUpRight,
} from "lucide-react";
import { Topbar, EmptyState, StatCard } from "@/components/ui";
import { cn } from "@/lib/utils";

type Range = "today" | "week" | "month" | "custom";
type MType = "task" | "goal" | "project" | "note" | "habit" | "lifeArea" | "section";

const TYPE_META: Record<MType, { label: string; icon: typeof Target; cls: string; route: (id: string) => string | null }> = {
  task: { label: "Task", icon: CheckSquare, cls: "text-primary", route: () => "/tasks" },
  goal: { label: "Goal", icon: Target, cls: "text-warning", route: (id) => `/goals/${id}` },
  project: { label: "Project", icon: FolderKanban, cls: "text-sprint", route: (id) => `/projects/${id}` },
  note: { label: "Note", icon: StickyNote, cls: "text-accent", route: (id) => `/notes/${id}` },
  habit: { label: "Habit", icon: Repeat, cls: "text-primary", route: () => "/habits" },
  lifeArea: { label: "Life Area", icon: Layers, cls: "text-muted-foreground", route: (id) => `/life-areas/${id}` },
  section: { label: "Section", icon: Layers, cls: "text-muted-foreground", route: () => "/life-areas" },
};

const TYPE_FILTERS: { key: MType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "goal", label: "Goals" },
  { key: "project", label: "Projects" },
  { key: "task", label: "Tasks" },
  { key: "note", label: "Notes" },
  { key: "habit", label: "Habits" },
  { key: "lifeArea", label: "Life Areas" },
];

export default function MomentumPage() {
  const [range, setRange] = useState<Range>("month");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const [typeFilter, setTypeFilter] = useState<MType | "all">("all");
  const [sort, setSort] = useState<"newest" | "impact">("newest");

  const entries = useQuery(api.momentum.list, {
    type: typeFilter === "all" ? undefined : typeFilter,
    range,
    start: cStart ? new Date(cStart + "T00:00:00").getTime() : undefined,
    end: cEnd ? new Date(cEnd + "T00:00:00").getTime() : undefined,
  });
  const removeEntry = useMutation(api.momentum.remove);

  const sorted = entries
    ? [...entries].sort((a, b) => (sort === "impact" ? b.impact - a.impact : b.createdAt - a.createdAt))
    : undefined;

  const total = entries?.length ?? 0;
  const avgImpact = total
    ? Math.round((entries!.reduce((s, e) => s + e.impact, 0) / total) * 10) / 10
    : 0;
  const topType = (() => {
    if (!entries || !entries.length) return "—";
    const counts = new Map<string, number>();
    for (const e of entries) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? TYPE_META[top[0] as MType].label : "—";
  })();

  return (
    <div>
      <Topbar />
      <div className="px-4 py-7 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <TrendingUp className="h-6 w-6 text-primary" /> Momentum
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The things that moved your needle — what&apos;s actually working.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as Range)}
              className="rounded-full border border-border bg-muted/40 px-4 py-2 text-sm outline-none"
            >
              <option value="today">Today</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="custom">Date range</option>
            </select>
            {range === "custom" && (
              <>
                <input type="date" value={cStart} onChange={(e) => setCStart(e.target.value)}
                  className="rounded-full border border-border bg-muted/40 px-3 py-2 text-sm outline-none" />
                <input type="date" value={cEnd} onChange={(e) => setCEnd(e.target.value)}
                  className="rounded-full border border-border bg-muted/40 px-3 py-2 text-sm outline-none" />
              </>
            )}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "impact")}
              className="rounded-full border border-border bg-muted/40 px-4 py-2 text-sm outline-none"
            >
              <option value="newest">Newest</option>
              <option value="impact">Highest impact</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Momentum moments" value={String(total)} sub="In this range" icon={<TrendingUp className="h-4 w-4" />} />
          <StatCard label="Avg impact" value={avgImpact ? `${avgImpact}/5` : "—"} sub="How much these moved you" icon={<Target className="h-4 w-4" />} />
          <StatCard label="Top source" value={topType} sub="Where your momentum came from" icon={<Layers className="h-4 w-4" />} />
        </div>

        {/* Type filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                typeFilter === t.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="mt-6 space-y-3">
          {sorted && sorted.length === 0 && (
            <EmptyState
              title="No momentum logged yet"
              hint="Open any goal, project, note, task or habit and hit 'Momentum' to log what's working."
            />
          )}
          {sorted?.map((e) => {
            const meta = TYPE_META[e.type as MType];
            const Icon = meta.icon;
            const route = meta.route(e.itemId);
            const inner = (
              <div className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/50">
                <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/50", meta.cls)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {meta.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {/* impact dots */}
                    <span className="ml-auto flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={cn("h-1.5 w-1.5 rounded-full", n <= e.impact ? "bg-primary" : "bg-muted")} />
                      ))}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 font-medium">
                    {e.titleSnapshot}
                    {route && <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />}
                  </p>
                  {e.why && <p className="mt-1 text-sm text-muted-foreground">{e.why}</p>}
                </div>
                <button
                  onClick={(ev) => { ev.preventDefault(); void removeEntry({ id: e._id as Id<"momentum"> }); }}
                  title="Remove"
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
            return route ? (
              <Link key={e._id} href={route}>{inner}</Link>
            ) : (
              <div key={e._id}>{inner}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
