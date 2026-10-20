"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  LayoutGrid, CalendarDays, Columns2, Table, X, Sun, CalendarRange, Inbox, Moon, AlarmClock, CheckCheck,
  Plus, ArrowRight, Star, Sparkles, RotateCcw, CheckSquare, Archive,
} from "lucide-react";
import { Modal } from "@/components/ui";
import { PageShell, Segmented, Select, Dialog, EmptyHint, cn, buttonVariants, inputClass } from "@/components/os/kit";
import { toast, reward, celebrate, errorMessage } from "@/components/os/celebrate";
import { useStable } from "@/components/os/useCockpit";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskCalendar } from "@/components/tasks/TaskCalendar";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { TaskGtdList, type GtdGroup } from "@/components/tasks/TaskGtdList";
import type { TaskLookups } from "@/components/tasks/taskMeta";
import { sortTasks } from "@/lib/taskSort";
import { useToday, addDaysYmd, dateOf, relDay, fmtYmd, ymdOf, fmtMin } from "@/lib/day";

/**
 * Tasks — GTD-style lists over the Life OS task model ("when" day ≠
 * deadline, estimate, energy, goal, deal/person, delegate), plus the
 * classic board / calendar / table layouts. Bulk-plan, add to Today's
 * Top 3, and decide on stale tasks (no silent rollover).
 */

type ListKey = "today" | "upcoming" | "anytime" | "someday" | "overdue" | "done";
type LayoutKey = "board" | "calendar" | "split" | "list";
type View = ListKey | LayoutKey;

const LISTS: ListKey[] = ["today", "upcoming", "anytime", "someday", "overdue", "done"];
const LAYOUTS: LayoutKey[] = ["board", "calendar", "split", "list"];
const VIEW_KEY = "bishos.tasks.view.v2";

const LIST_STATUSES = [
  { value: "all", label: "All" },
  { value: "remaining", label: "Remaining" },
  { value: "completed", label: "Completed" },
] as const;
type ListStatus = (typeof LIST_STATUSES)[number]["value"];

const PRANK = { high: 0, med: 1, low: 2 } as const;
const byPriorityDue = (a: Doc<"tasks">, b: Doc<"tasks">) =>
  PRANK[a.priority] - PRANK[b.priority] || (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity);

/** True if the task's start→due span (or its single date) overlaps `dayStr`. */
function overlapsDay(t: Doc<"tasks">, dayStr: string) {
  const dayStart = new Date(`${dayStr}T00:00:00`).getTime();
  const dayEnd = new Date(`${dayStr}T23:59:59.999`).getTime();
  const s = t.startAt ?? null;
  const d = t.dueDate ?? null;
  if (s == null && d == null) return false;
  const lo = Math.min(s ?? (d as number), d ?? (s as number));
  const hi = Math.max(s ?? (d as number), d ?? (s as number));
  return lo <= dayEnd && hi >= dayStart;
}

export default function TasksPage() {
  const today = useToday();
  const tomorrow = addDaysYmd(today, 1);
  const todayStart = dateOf(today).getTime();
  const tomorrowStart = dateOf(tomorrow).getTime();

  const areas = useQuery(api.lifeAreas.list);
  const sections = useQuery(api.sections.list, {});
  const tasks = useQuery(api.tasks.list, {});
  const lookups = useStable(useQuery(api.tasks.lookups, { date: today }));
  const focusTotals = useQuery(api.focus.taskTotals);

  const createTask = useMutation(api.tasks.create);
  const setTop3 = useMutation(api.days.setTop3);
  const toggleTop = useMutation(api.days.toggleTop);
  const triageStale = useMutation(api.tasks.triageStale);
  const setStatus = useMutation(api.tasks.setStatus).withOptimisticUpdate((store, { id, status }) => {
    const cur = store.getQuery(api.tasks.list, {});
    if (!cur) return;
    store.setQuery(api.tasks.list, {}, cur.map((t) => (t._id === id ? { ...t, status, completedAt: status === "done" ? Date.now() : undefined } : t)));
  });
  const plan = useMutation(api.tasks.plan).withOptimisticUpdate((store, { ids, plannedFor, someday }) => {
    const cur = store.getQuery(api.tasks.list, {});
    if (!cur) return;
    const set = new Set<string>(ids);
    store.setQuery(
      api.tasks.list,
      {},
      cur.map((t) => (set.has(t._id) ? { ...t, plannedFor: plannedFor ?? undefined, someday: someday ?? (plannedFor ? false : t.someday) } : t)),
    );
  });

  const [view, setViewState] = useState<View>("today");
  const [areaFilter, setAreaFilter] = useState("");
  const [goalFilter, setGoalFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [energyFilter, setEnergyFilter] = useState("");
  const [openId, setOpenId] = useState<Id<"tasks"> | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [doneLimit, setDoneLimit] = useState(60);
  const [staleOpen, setStaleOpen] = useState(false);
  const [listStatus, setListStatus] = useState<ListStatus>("all");
  const [listDate, setListDate] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  // Restore the last view + deep links (?view=today&area=<id>) after mount.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const fromUrl = sp.get("view") as View | null;
    let saved: View | null = null;
    try {
      saved = localStorage.getItem(VIEW_KEY) as View | null;
    } catch {
      /* storage blocked */
    }
    const pick = fromUrl ?? saved;
    if (pick && ([...LISTS, ...LAYOUTS] as string[]).includes(pick)) setViewState(pick);
    if (sp.get("area")) setAreaFilter(sp.get("area")!);
    if (sp.get("goal")) setGoalFilter(sp.get("goal")!);
    if (sp.get("project")) setProjectFilter(sp.get("project")!);
  }, []);
  const setView = (v: View) => {
    setViewState(v);
    setSelected(new Set());
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* storage blocked */
    }
  };

  // ── Lookups for chips ────────────────────────────────────────────────
  const top3 = useMemo(() => lookups?.top3 ?? [], [lookups]);
  const lk: TaskLookups = useMemo(() => {
    const g = new Map((lookups?.goals ?? []).map((x) => [x._id as string, x.title]));
    const p = new Map((lookups?.projects ?? []).map((x) => [x._id as string, x.title]));
    const d = new Map((lookups?.deals ?? []).map((x) => [x._id as string, x.title]));
    const pe = new Map((lookups?.people ?? []).map((x) => [x._id as string, x.name]));
    const a = new Map((areas ?? []).map((x) => [x._id as string, x.name]));
    const t3 = new Set<string>(top3);
    return {
      today,
      goalTitle: (id) => (id ? g.get(id) : undefined),
      projectTitle: (id) => (id ? p.get(id) : undefined),
      dealTitle: (id) => (id ? d.get(id) : undefined),
      personName: (id) => (id ? pe.get(id) : undefined),
      areaName: (id) => (id ? a.get(id) : undefined),
      isTop3: (id) => t3.has(id),
    };
  }, [lookups, areas, top3, today]);

  const focusByTask = useMemo(() => new Map((focusTotals?.tasks ?? []).map((t) => [t.id, t.seconds] as const)), [focusTotals]);
  const areaName = (id: Id<"lifeAreas">) => areas?.find((a) => a._id === id)?.name;
  const projectName = (id: Id<"projects">) => lk.projectTitle(id);
  const sectionName = (id?: Id<"sections">) => (id ? sections?.find((s) => s._id === id)?.name : undefined);

  // ── Filters (area, goal, project, energy) ───────────────────────────
  const filtered = useMemo(
    () =>
      sortTasks(
        (tasks ?? []).filter((t) => {
          if (areaFilter && t.lifeAreaId !== areaFilter) return false;
          if (goalFilter === "none" ? !!t.goalId : goalFilter && t.goalId !== goalFilter) return false;
          if (projectFilter === "none" ? !!t.projectId : projectFilter && t.projectId !== projectFilter) return false;
          if (energyFilter === "none" ? !!t.energy : energyFilter && t.energy !== energyFilter) return false;
          return true;
        }),
      ),
    [tasks, areaFilter, goalFilter, projectFilter, energyFilter],
  );
  const filtersOn = !!(areaFilter || goalFilter || projectFilter || energyFilter);

  // ── GTD buckets ──────────────────────────────────────────────────────
  const buckets = useMemo(() => {
    const open = filtered.filter((t) => t.status !== "done");
    const t3 = new Set<string>(top3);
    const topTasks = top3.map((id) => filtered.find((t) => t._id === id)).filter((t): t is Doc<"tasks"> => !!t);
    const plannedToday = open.filter((t) => t.plannedFor === today && !t3.has(t._id)).sort(byPriorityDue);
    const dueToday = open
      .filter((t) => !t3.has(t._id) && t.plannedFor !== today && t.dueDate != null && t.dueDate >= todayStart && t.dueDate < tomorrowStart)
      .sort(byPriorityDue);
    // A task from an earlier day whose deadline is today already shows under
    // "Deadline today" — never list (or count) it twice.
    const dueTodayIds = new Set<string>(dueToday.map((t) => t._id));
    const earlier = open
      .filter((t) => !t3.has(t._id) && !dueTodayIds.has(t._id) && !t.someday && !!t.plannedFor && t.plannedFor < today)
      .sort((a, b) => (a.plannedFor ?? "").localeCompare(b.plannedFor ?? "") || byPriorityDue(a, b));
    const doneToday = filtered
      .filter((t) => t.status === "done" && !t3.has(t._id) && (t.completedAt ?? 0) >= todayStart && (t.completedAt ?? 0) < tomorrowStart)
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
    const upcoming = open.filter((t) => !!t.plannedFor && t.plannedFor > today).sort((a, b) => (a.plannedFor ?? "").localeCompare(b.plannedFor ?? "") || byPriorityDue(a, b));
    const deadlinesAhead = open
      .filter((t) => !t.plannedFor && !t.someday && t.dueDate != null && t.dueDate >= tomorrowStart)
      .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));
    const anytime = open.filter((t) => !t.plannedFor && !t.someday);
    const someday = open.filter((t) => !!t.someday);
    const overdue = open.filter((t) => t.dueDate != null && t.dueDate < todayStart).sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));
    const done = filtered.filter((t) => t.status === "done").sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
    const stale = open.filter((t) => (t.deferCount ?? 0) >= 3);
    const todayOpen = topTasks.filter((t) => t.status !== "done").length + plannedToday.length + dueToday.length + earlier.length;
    return { topTasks, plannedToday, dueToday, earlier, doneToday, upcoming, deadlinesAhead, anytime, someday, overdue, done, stale, todayOpen };
  }, [filtered, top3, today, todayStart, tomorrowStart]);

  // Today's planned load (capacity hint, Sunsama-style).
  const todayLoadMin = [...buckets.topTasks.filter((t) => t.status !== "done"), ...buckets.plannedToday].reduce((s, t) => s + (t.estimateMin ?? 30), 0);

  const groups: GtdGroup[] = useMemo(() => {
    const areaGroups = (list: Doc<"tasks">[], prefix: string) => {
      const by = new Map<string, Doc<"tasks">[]>();
      for (const t of list) {
        const k = t.lifeAreaId as string;
        if (!by.has(k)) by.set(k, []);
        by.get(k)!.push(t);
      }
      const order = (areas ?? []).slice().sort((a, b) => a.order - b.order).map((a) => a._id as string);
      return [...by.entries()]
        .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
        .map(([k, ts]) => ({
          key: `${prefix}-${k}`,
          title: (
            <Link href={`/life-areas/${k}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
              {lk.areaName(k) ?? "Area"}
            </Link>
          ),
          tasks: ts.sort(byPriorityDue),
        }));
    };
    switch (view) {
      case "today":
        return [
          { key: "top", title: "Top 3", hint: "Your most important outcomes today. Star tasks to add them.", tasks: buckets.topTasks, hideWhen: true },
          { key: "planned", title: "Planned for today", tasks: buckets.plannedToday, hideWhen: true },
          { key: "due", title: "Deadline today", hint: "Not planned yet — do it today or plan it for later.", tasks: buckets.dueToday },
          {
            key: "earlier",
            title: "From earlier days",
            hint: "Nothing rolls over silently — decide: today, tomorrow or someday.",
            tasks: buckets.earlier,
            action: (
              <button onClick={() => void bulkPlan(buckets.earlier.map((t) => t._id), "today")} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <Sun /> All today
              </button>
            ),
          },
          { key: "doneToday", title: "Done today", tasks: buckets.doneToday, collapsed: true, hideWhen: true },
        ];
      case "upcoming": {
        const byDay = new Map<string, Doc<"tasks">[]>();
        for (const t of buckets.upcoming) {
          const k = t.plannedFor!;
          if (!byDay.has(k)) byDay.set(k, []);
          byDay.get(k)!.push(t);
        }
        const dayGroups: GtdGroup[] = [...byDay.entries()].map(([d, ts]) => {
          const mins = ts.reduce((s, t) => s + (t.estimateMin ?? 0), 0);
          return {
            key: `d-${d}`,
            title: (
              <span>
                {relDay(d, today)} <span className="font-normal text-muted-foreground">· {fmtYmd(d, { weekday: "short", month: "short", day: "numeric" })}</span>
                {mins > 0 && <span className="font-normal text-muted-foreground"> · {fmtMin(mins)}</span>}
              </span>
            ),
            tasks: ts,
            hideWhen: true,
          };
        });
        return [
          ...dayGroups,
          {
            key: "deadlines",
            title: "Deadlines ahead — no “when” yet",
            hint: "A deadline is not a plan. Pick the day you will work on each.",
            tasks: buckets.deadlinesAhead,
          },
        ];
      }
      case "anytime":
        return areaGroups(buckets.anytime, "any");
      case "someday":
        return areaGroups(buckets.someday, "some");
      case "overdue":
        return [
          {
            key: "overdue",
            title: "Deadlines that passed",
            hint: "No guilt — reschedule, renegotiate the date, or drop what no longer matters.",
            tasks: buckets.overdue,
          },
        ];
      case "done": {
        const shown = buckets.done.slice(0, doneLimit);
        const byDay = new Map<string, Doc<"tasks">[]>();
        for (const t of shown) {
          const k = t.completedAt ? ymdOf(t.completedAt) : "earlier";
          if (!byDay.has(k)) byDay.set(k, []);
          byDay.get(k)!.push(t);
        }
        return [...byDay.entries()].map(([d, ts]) => ({
          key: `done-${d}`,
          title: d === "earlier" ? "Earlier" : relDay(d, today),
          tasks: ts,
          hideWhen: true,
        }));
      }
      default:
        return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, buckets, areas, lk, today, doneLimit]);

  const counts: Record<ListKey, number> = {
    today: buckets.todayOpen,
    upcoming: buckets.upcoming.length,
    anytime: buckets.anytime.length,
    someday: buckets.someday.length,
    overdue: buckets.overdue.length,
    done: buckets.doneToday.length + buckets.topTasks.filter((t) => t.status === "done").length,
  };

  // List-view (table) narrowing
  const listFiltered = useMemo(
    () =>
      filtered.filter((t) => {
        if (listStatus === "remaining" && t.status === "done") return false;
        if (listStatus === "completed" && t.status !== "done") return false;
        if (listDate && !overlapsDay(t, listDate)) return false;
        return true;
      }),
    [filtered, listStatus, listDate],
  );

  // ── Actions ──────────────────────────────────────────────────────────
  async function bulkPlan(ids: Id<"tasks">[], when: "today" | "tomorrow" | "someday" | "backlog") {
    if (!ids.length) return;
    try {
      if (when === "today") await plan({ ids, plannedFor: today });
      else if (when === "tomorrow") await plan({ ids, plannedFor: tomorrow });
      else if (when === "someday") await plan({ ids, plannedFor: null, someday: true });
      else await plan({ ids, plannedFor: null, someday: false });
      const label = { today: "today", tomorrow: "tomorrow", someday: "Someday", backlog: "the backlog" }[when];
      toast(`${ids.length} task${ids.length === 1 ? "" : "s"} → ${label}`, { tone: "success" });
      setSelected(new Set());
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    }
  }

  const topCap = lookups?.dailyShape === "ivylee" ? 6 : lookups?.dailyShape === "135" ? 9 : 3;
  async function addToTop3(ids: Id<"tasks">[]) {
    const cur = [...top3];
    const fresh = ids.filter((id) => !cur.includes(id));
    if (!fresh.length) return toast("Already in today's Top 3");
    const room = Math.max(0, topCap - cur.length);
    if (room === 0) return toast(`Top ${topCap} is full — finish or swap one on Today first.`, { tone: "warning" });
    const adding = fresh.slice(0, room);
    try {
      await setTop3({ date: today, taskIds: [...cur, ...adding] });
      toast(
        fresh.length > adding.length ? `Added ${adding.length} — Top ${topCap} is now full.` : `Added to today's Top ${topCap}`,
        { tone: fresh.length > adding.length ? "warning" : "success" },
      );
      setSelected(new Set());
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    }
  }

  async function toggleTop3(t: Doc<"tasks">) {
    if (top3.includes(t._id)) {
      try {
        await setTop3({ date: today, taskIds: top3.filter((x) => x !== t._id) });
        toast("Removed from Top 3");
      } catch (e) {
        toast(errorMessage(e), { tone: "warning" });
      }
    } else await addToTop3([t._id]);
  }

  async function toggleDone(t: Doc<"tasks">) {
    const done = t.status !== "done";
    try {
      if (top3.includes(t._id)) {
        const r = await toggleTop({ date: today, taskId: t._id });
        if (r.done) {
          if (r.allTopDone) {
            reward("Top 3 complete — great day", undefined, true);
            celebrate(1.4);
          } else reward("Top 3 task done");
        }
      } else {
        await setStatus({ id: t._id, status: done ? "done" : "not_started", date: today });
        if (done) toast("Done", { tone: "success" });
      }
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    }
  }

  const selectedIds = [...selected] as Id<"tasks">[];
  const onSelect = (ids: Id<"tasks">[], on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      ids.forEach((id) => (on ? n.add(id) : n.delete(id)));
      return n;
    });

  const isList = (LISTS as string[]).includes(view);
  const loading = tasks === undefined || lookups === undefined;

  const listOptions = [
    { value: "today" as View, label: "Today", icon: Sun, count: counts.today },
    { value: "upcoming" as View, label: "Upcoming", icon: CalendarRange, count: counts.upcoming },
    { value: "anytime" as View, label: "Anytime", icon: Inbox, count: counts.anytime },
    { value: "someday" as View, label: "Someday", icon: Moon, count: counts.someday },
    { value: "overdue" as View, label: "Overdue", icon: AlarmClock, count: counts.overdue },
    { value: "done" as View, label: "Done", icon: CheckCheck },
  ];
  const layoutOptions = [
    { value: "board" as View, label: "Board", icon: LayoutGrid },
    { value: "calendar" as View, label: "Calendar", icon: CalendarDays },
    { value: "split" as View, label: "Split", icon: Columns2 },
    { value: "list" as View, label: "Table", icon: Table },
  ];

  const emptyFor: Record<ListKey, { title: string; hint: string }> = {
    today: { title: "Nothing planned for today", hint: "Pick a few tasks from Anytime or Upcoming and plan them for today — or choose your Top 3 on Today." },
    upcoming: { title: "Nothing scheduled ahead", hint: "Give tasks a “when” day and they line up here, day by day." },
    anytime: { title: "Backlog is clear", hint: "Tasks without a “when” day land here. Capture anything with C." },
    someday: { title: "No someday items", hint: "Park ideas you might do later — they stay out of your way until the weekly review." },
    overdue: { title: "No passed deadlines", hint: "Every deadline is still ahead of you. Nice." },
    done: { title: "Nothing completed yet", hint: "Finished tasks collect here — your proof of progress." },
  };

  return (
    <PageShell
      title="Tasks"
      icon={CheckSquare}
      subtitle="Next actions with a “when” day — separate from the deadline. Plan today, park the rest; nothing rolls over silently."
      actions={
        <>
          <Link href="/today" className={buttonVariants({ variant: "outline" })}>
            <Sun /> <span className="hidden sm:inline">Today</span>
          </Link>
          <button onClick={() => setAddOpen(true)} className={buttonVariants()}>
            <Plus /> New task
          </button>
        </>
      }
    >
      {/* Views: GTD lists + classic layouts */}
      <div className="flex flex-wrap items-center gap-2">
        <Segmented options={listOptions} value={view} onChange={setView} />
        <Segmented options={layoutOptions} value={view} onChange={setView} />
      </div>

      {/* Filters */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="sm:w-44" aria-label="Filter by life area">
          <option value="">All life areas</option>
          {(areas ?? [])
            .filter((a) => !a.archived)
            .sort((a, b) => a.order - b.order)
            .map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
        </Select>
        <Select value={goalFilter} onChange={(e) => setGoalFilter(e.target.value)} className="sm:w-48" aria-label="Filter by goal">
          <option value="">Any goal</option>
          <option value="none">No goal (maintenance)</option>
          {(lookups?.goals ?? [])
            .filter((g) => g.goalStatus !== "dropped" && g.goalStatus !== "achieved")
            .map((g) => (
              <option key={g._id} value={g._id}>
                {g.level === "cycle" ? "12w · " : g.level === "annual" ? "Year · " : ""}
                {g.title}
              </option>
            ))}
        </Select>
        <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="sm:w-44" aria-label="Filter by project">
          <option value="">Any project</option>
          <option value="none">No project</option>
          {(lookups?.projects ?? [])
            .filter((p) => p.status !== "completed" || p._id === projectFilter)
            .map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
        </Select>
        <Select value={energyFilter} onChange={(e) => setEnergyFilter(e.target.value)} className="sm:w-40" aria-label="Filter by energy">
          <option value="">Any energy</option>
          <option value="high">Deep (high)</option>
          <option value="med">Medium</option>
          <option value="low">Light (low)</option>
          <option value="none">Not set</option>
        </Select>
        {filtersOn && (
          <button
            onClick={() => {
              setAreaFilter("");
              setGoalFilter("");
              setProjectFilter("");
              setEnergyFilter("");
            }}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "col-span-2 justify-start sm:col-span-1")}
          >
            <X /> Clear filters
          </button>
        )}
      </div>

      {/* Stale tasks — keep / schedule / drop (Bullet Journal migration) */}
      {isList && buckets.stale.length > 0 && view !== "done" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm">
          <p className="flex items-center gap-2 text-warning">
            <RotateCcw className="h-4 w-4 shrink-0" />
            <span>
              <b>{buckets.stale.length}</b> task{buckets.stale.length === 1 ? " has" : "s have"} been moved 3+ times. Worth keeping?
            </span>
          </p>
          <button onClick={() => setStaleOpen(true)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Decide now
          </button>
        </div>
      )}

      {/* Today summary */}
      {view === "today" && !loading && (
        <p className="mt-4 text-xs text-muted-foreground">
          <b className="text-foreground tabular-nums">{fmtMin(todayLoadMin)}</b> planned today (tasks without an estimate count as 30m) ·{" "}
          {top3.length ? `${buckets.topTasks.filter((t) => t.status === "done").length}/${top3.length} of your Top ${topCap} done` : "no Top 3 yet"} ·{" "}
          <Link href="/today" className="underline-offset-2 hover:text-foreground hover:underline">
            open Today
          </Link>
        </p>
      )}

      {/* Bulk bar */}
      {isList && selected.size > 0 && (
        <div className="os-rise sticky top-16 z-20 mt-4 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-popover px-3 py-2 shadow-raised">
          <span className="mr-1 text-sm font-medium tabular-nums">{selected.size} selected</span>
          <button onClick={() => void bulkPlan(selectedIds, "today")} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <Sun /> Today
          </button>
          <button onClick={() => void bulkPlan(selectedIds, "tomorrow")} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <ArrowRight /> Tomorrow
          </button>
          <button onClick={() => void bulkPlan(selectedIds, "someday")} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <Moon /> Someday
          </button>
          <button onClick={() => void bulkPlan(selectedIds, "backlog")} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <Archive /> Backlog
          </button>
          <button onClick={() => void addToTop3(selectedIds)} className={buttonVariants({ size: "sm" })}>
            <Star /> Add to Top {topCap}
          </button>
          <button onClick={() => setSelected(new Set())} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "ml-auto")} aria-label="Clear selection">
            <X />
          </button>
        </div>
      )}

      {/* Table-only filters */}
      {view === "list" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Segmented options={LIST_STATUSES.map((s) => ({ value: s.value, label: s.label }))} value={listStatus} onChange={setListStatus} size="sm" />
          <input type="date" value={listDate} onChange={(e) => setListDate(e.target.value)} className={cn(inputClass, "h-8")} aria-label="Filter by day" />
          {listDate && (
            <button onClick={() => setListDate("")} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <X /> Clear date
            </button>
          )}
          <span className="ml-auto text-sm text-muted-foreground">
            {listFiltered.length} task{listFiltered.length === 1 ? "" : "s"}
          </span>
        </div>
      )}

      {/* Views */}
      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-28" />
            <div className="skeleton h-40" />
            <div className="skeleton h-24" />
          </div>
        ) : isList ? (
          <>
            <TaskGtdList
              groups={groups}
              lk={lk}
              selected={selected}
              onSelect={onSelect}
              onOpen={setOpenId}
              onToggleDone={(t) => void toggleDone(t)}
              onPlan={(ids, w) => void bulkPlan(ids, w)}
              onToggleTop3={(t) => void toggleTop3(t)}
              empty={
                <EmptyHint
                  icon={view === "today" ? Sun : view === "done" ? CheckCheck : view === "someday" ? Moon : view === "overdue" ? Sparkles : Inbox}
                  title={filtersOn ? "No tasks match these filters" : emptyFor[view as ListKey].title}
                  hint={filtersOn ? "Clear a filter to see more." : emptyFor[view as ListKey].hint}
                  action={
                    view !== "done" && view !== "overdue" ? (
                      <button onClick={() => setAddOpen(true)} className={buttonVariants({ size: "sm" })}>
                        <Plus /> New task
                      </button>
                    ) : undefined
                  }
                />
              }
            />
            {view === "done" && buckets.done.length > doneLimit && (
              <div className="mt-3 text-center">
                <button onClick={() => setDoneLimit((n) => n + 60)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Show more ({buckets.done.length - doneLimit} left)
                </button>
              </div>
            )}
          </>
        ) : view === "board" ? (
          <TaskBoard tasks={filtered} areaName={areaName} projectName={projectName} focusByTask={focusByTask} onSelect={setOpenId} lookups={lk} />
        ) : view === "list" ? (
          <TaskList tasks={listFiltered} areaName={areaName} sectionName={sectionName} onSelect={setOpenId} lookups={lk} />
        ) : view === "calendar" ? (
          <div className="rounded-xl border border-border bg-card p-3 shadow-card sm:p-4">
            <TaskCalendar tasks={filtered} defaultMode="week" onSelect={setOpenId} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Board</h2>
              <TaskBoard tasks={filtered} areaName={areaName} projectName={projectName} focusByTask={focusByTask} onSelect={setOpenId} compact lookups={lk} />
            </div>
            <div className="rounded-xl border border-border bg-card p-3 shadow-card sm:p-4">
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Calendar</h2>
              <TaskCalendar tasks={filtered} defaultMode="week" compact onSelect={setOpenId} />
            </div>
          </div>
        )}
      </div>

      {openId && <TaskDetailPanel id={openId} onClose={() => setOpenId(null)} />}

      {addOpen && (
        <NewTaskModal
          onClose={() => setAddOpen(false)}
          areas={(areas ?? []).filter((a) => !a.archived).sort((a, b) => a.order - b.order)}
          projects={(lookups?.projects ?? []).filter((p) => p.status !== "completed")}
          goals={(lookups?.goals ?? []).filter((g) => g.goalStatus !== "dropped" && g.goalStatus !== "achieved")}
          defaults={{
            areaId: areaFilter,
            projectId: projectFilter && projectFilter !== "none" ? projectFilter : "",
            goalId: goalFilter && goalFilter !== "none" ? goalFilter : "",
            when: view === "today" ? "today" : view === "upcoming" ? "tomorrow" : view === "someday" ? "someday" : "",
          }}
          today={today}
          onCreate={async (args) => {
            try {
              await createTask(args);
              toast("Task added", { tone: "success" });
            } catch (e) {
              toast(errorMessage(e), { tone: "warning" });
            }
          }}
        />
      )}

      <Dialog open={staleOpen} onClose={() => setStaleOpen(false)} title="Moved 3+ times — keep, schedule or drop?" size="lg">
        <p className="mb-3 text-sm text-muted-foreground">
          If it isn’t worth doing today, it may not be worth doing at all. Decide once and the reminder stops.
        </p>
        {buckets.stale.length === 0 ? (
          <EmptyHint icon={Sparkles} title="All decided" hint="No stale tasks left." />
        ) : (
          <ul className="divide-y divide-border">
            {buckets.stale.map((t) => (
              <li key={t._id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Moved {t.deferCount}× · {lk.areaName(t.lifeAreaId) ?? "—"}
                    {t.plannedFor ? ` · planned ${relDay(t.plannedFor, today).toLowerCase()}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ["today", "Do today"],
                      ["keep", "Keep"],
                      ["someday", "Someday"],
                      ["drop", "Drop"],
                    ] as const
                  ).map(([action, label]) => (
                    <button
                      key={action}
                      onClick={() =>
                        void triageStale({ id: t._id, action, date: today })
                          .then(() => toast(action === "drop" ? "Dropped — one less thing" : "Decided", { tone: "success" }))
                          .catch((e) => toast(errorMessage(e), { tone: "warning" }))
                      }
                      className={buttonVariants({ variant: action === "today" ? "default" : action === "drop" ? "ghost" : "outline", size: "sm" })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </PageShell>
  );
}

type CreateArgs = {
  title: string;
  priority: "low" | "med" | "high";
  lifeAreaId: Id<"lifeAreas">;
  projectId?: Id<"projects">;
  dueDate?: number;
  startAt?: number;
  plannedFor?: string;
  someday?: boolean;
  estimateMin?: number;
  energy?: "high" | "med" | "low";
  goalId?: Id<"goals">;
};

/** New task: project → area flows down; "when" (≠ deadline), estimate, energy, goal. */
function NewTaskModal({
  onClose,
  onCreate,
  areas,
  projects,
  goals,
  defaults,
  today,
}: {
  onClose: () => void;
  onCreate: (a: CreateArgs) => Promise<void>;
  areas: { _id: Id<"lifeAreas">; name: string }[];
  projects: { _id: Id<"projects">; title: string; lifeAreaId: Id<"lifeAreas">; goalId: Id<"goals"> | null }[];
  goals: { _id: Id<"goals">; title: string; level: string | null }[];
  defaults: { areaId: string; projectId: string; goalId: string; when: string };
  today: string;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "med" | "high">("med");
  const [projectId, setProjectId] = useState(defaults.projectId);
  const [areaId, setAreaId] = useState(defaults.areaId || areas[0]?._id || "");
  const [goalId, setGoalId] = useState(defaults.goalId);
  const [when, setWhen] = useState(defaults.when); // "" | today | tomorrow | someday | YYYY-MM-DD
  const [estimate, setEstimate] = useState("");
  const [energy, setEnergy] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [more, setMore] = useState(false);

  const chosenProject = projects.find((p) => p._id === projectId);
  const effectiveAreaId = chosenProject ? chosenProject.lifeAreaId : (areaId as Id<"lifeAreas"> | "");
  const tomorrow = addDaysYmd(today, 1);
  const whenChip = (on: boolean) =>
    cn(
      "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
      on ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !effectiveAreaId) return;
    const plannedFor = when === "today" ? today : when === "tomorrow" ? tomorrow : /^\d{4}-\d{2}-\d{2}$/.test(when) ? when : undefined;
    void onCreate({
      title: title.trim(),
      priority,
      lifeAreaId: effectiveAreaId as Id<"lifeAreas">,
      projectId: projectId ? (projectId as Id<"projects">) : undefined,
      goalId: goalId ? (goalId as Id<"goals">) : chosenProject?.goalId ?? undefined,
      plannedFor,
      someday: when === "someday" ? true : undefined,
      estimateMin: estimate ? Number(estimate) : undefined,
      energy: (energy || undefined) as CreateArgs["energy"],
      dueDate: dueDate ? new Date(`${dueDate}T${dueTime || "23:59"}`).getTime() : undefined,
      startAt: startDate ? new Date(`${startDate}T${startTime || "09:00"}`).getTime() : undefined,
    });
    onClose();
  }

  const field = cn(inputClass, "h-10 w-full");
  return (
    <Modal title="New task" onClose={onClose}>
      <form className="space-y-3" onSubmit={submit}>
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's the next action?" className={field} />

        <div>
          <span className="mb-1 block text-xs font-medium text-muted-foreground">When will you work on it?</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" className={whenChip(when === "today")} onClick={() => setWhen("today")}>Today</button>
            <button type="button" className={whenChip(when === "tomorrow")} onClick={() => setWhen("tomorrow")}>Tomorrow</button>
            <button type="button" className={whenChip(when === "someday")} onClick={() => setWhen("someday")}>Someday</button>
            <button type="button" className={whenChip(when === "")} onClick={() => setWhen("")}>Anytime</button>
            <input
              type="date"
              value={/^\d{4}-\d{2}-\d{2}$/.test(when) ? when : ""}
              onChange={(e) => setWhen(e.target.value)}
              className={cn(inputClass, "h-8 text-xs")}
              aria-label="Pick a day"
            />
          </div>
        </div>

        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={field} aria-label="Project">
          <option value="">No project — area task</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          {chosenProject ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 text-sm">
              <span className="text-xs text-muted-foreground">Area</span>
              <span className="truncate font-medium">{areas.find((a) => a._id === chosenProject.lifeAreaId)?.name ?? "—"}</span>
            </div>
          ) : (
            <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className={field} aria-label="Life area">
              <option value="">Life area…</option>
              {areas.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}
          <select value={goalId} onChange={(e) => setGoalId(e.target.value)} className={field} aria-label="Goal">
            <option value="">{chosenProject?.goalId ? "Project's goal" : "No goal (maintenance)"}</option>
            {goals.map((g) => (
              <option key={g._id} value={g._id}>
                {g.level === "cycle" ? "12w · " : g.level === "annual" ? "Year · " : ""}
                {g.title}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select value={estimate} onChange={(e) => setEstimate(e.target.value)} className={field} aria-label="Estimate">
            <option value="">Estimate</option>
            {[5, 15, 30, 45, 60, 90, 120, 180, 240].map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} min` : `${m / 60} h`}
              </option>
            ))}
          </select>
          <select value={energy} onChange={(e) => setEnergy(e.target.value)} className={field} aria-label="Energy">
            <option value="">Energy</option>
            <option value="high">Deep</option>
            <option value="med">Medium</option>
            <option value="low">Light</option>
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className={field} aria-label="Priority">
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <button type="button" onClick={() => setMore((m) => !m)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
          {more ? "Hide" : "Add"} deadline & time block
        </button>
        {more && (
          <div className="space-y-3">
            <div>
              <span className="mb-1 block text-xs text-muted-foreground">Deadline (real consequence)</span>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={field} aria-label="Deadline date" />
                <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className={field} aria-label="Deadline time" />
              </div>
            </div>
            <div>
              <span className="mb-1 block text-xs text-muted-foreground">Start (shows on Calendar between start and deadline)</span>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={field} aria-label="Start date" />
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={field} aria-label="Start time" />
              </div>
            </div>
          </div>
        )}

        <button disabled={!title.trim() || !effectiveAreaId} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          Add task
        </button>
        {!areas.length && (
          <p className="text-center text-xs text-muted-foreground">
            Create a <Link href="/life-areas" className="underline">Life Area</Link> first — every task lives in one.
          </p>
        )}
      </form>
    </Modal>
  );
}

