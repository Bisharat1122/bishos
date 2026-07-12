"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { LayoutGrid, CalendarDays, Columns2, Table, X } from "lucide-react";
import { Topbar, AddButton, Modal } from "@/components/ui";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskCalendar } from "@/components/tasks/TaskCalendar";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { sortTasks } from "@/lib/taskSort";
import { cn } from "@/lib/utils";

type View = "board" | "calendar" | "split" | "list";

const VIEWS: { key: View; label: string; icon: typeof LayoutGrid }[] = [
  { key: "board", label: "Board", icon: LayoutGrid },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "split", label: "Split", icon: Columns2 },
  { key: "list", label: "List", icon: Table },
];

const LIST_STATUSES = [
  { key: "all", label: "All" },
  { key: "remaining", label: "Remaining" },
  { key: "completed", label: "Completed" },
] as const;
type ListStatus = (typeof LIST_STATUSES)[number]["key"];

/** True if the task's start→due span (or its single date) overlaps `dayStr`. */
function overlapsDay(t: Doc<"tasks">, dayStr: string) {
  const dayStart = new Date(`${dayStr}T00:00:00`).getTime();
  const dayEnd = new Date(`${dayStr}T23:59:59.999`).getTime();
  const s = t.startAt ?? null;
  const d = t.dueDate ?? null;
  if (s == null && d == null) return false; // undated tasks drop out when filtering by day
  const lo = Math.min(s ?? (d as number), d ?? (s as number));
  const hi = Math.max(s ?? (d as number), d ?? (s as number));
  return lo <= dayEnd && hi >= dayStart;
}

export default function TasksPage() {
  const areas = useQuery(api.lifeAreas.list);
  const sections = useQuery(api.sections.list, {});
  const tasks = useQuery(api.tasks.list, {});
  const projects = useQuery(api.projects.list);
  const createTask = useMutation(api.tasks.create);

  const [view, setView] = useState<View>("board");
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [selected, setSelected] = useState<Id<"tasks"> | null>(null);

  // List-view-only filters
  const [listStatus, setListStatus] = useState<ListStatus>("all");
  const [listDate, setListDate] = useState<string>("");

  // create form
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "med" | "high">("med");
  const [projectId, setProjectId] = useState<string>("");
  const [areaId, setAreaId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [dueTime, setDueTime] = useState<string>("");

  const openAdd = () => {
    setProjectId("");
    setAreaId(areas?.[0]?._id ?? "");
    setTitle("");
    setStartDate(""); setStartTime(""); setDueDate(""); setDueTime("");
    setAddOpen(true);
  };

  // When a project is chosen the life area is inherited from it.
  const chosenProject = projects?.find((p) => p._id === projectId);
  const effectiveAreaId = chosenProject ? chosenProject.lifeAreaId : (areaId as Id<"lifeAreas"> | "");

  const focusTotals = useQuery(api.focus.taskTotals);
  const focusByTask = useMemo(
    () => new Map((focusTotals?.tasks ?? []).map((t) => [t.id, t.seconds] as const)),
    [focusTotals],
  );

  const areaName = (id: Id<"lifeAreas">) =>
    areas?.find((a) => a._id === id)?.name;
  const projectName = (id: Id<"projects">) =>
    projects?.find((p) => p._id === id)?.title;
  const sectionName = (id?: Id<"sections">) =>
    id ? sections?.find((s) => s._id === id)?.name : undefined;

  const filtered = useMemo(
    () =>
      sortTasks((tasks ?? []).filter((t) => !areaFilter || t.lifeAreaId === areaFilter)),
    [tasks, areaFilter],
  );

  // The List view narrows further by status (completed / remaining) and day.
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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !effectiveAreaId) return;
    void createTask({
      title: title.trim(),
      priority,
      lifeAreaId: effectiveAreaId as Id<"lifeAreas">,
      projectId: projectId ? (projectId as Id<"projects">) : undefined,
      dueDate: dueDate ? new Date(`${dueDate}T${dueTime || "23:59"}`).getTime() : undefined,
      startAt: startDate ? new Date(`${startDate}T${startTime || "09:00"}`).getTime() : undefined,
    });
    setTitle("");
    setStartDate(""); setStartTime(""); setDueDate(""); setDueTime("");
    setAddOpen(false);
  }

  return (
    <div className="flex h-full flex-col">
      <Topbar action={<AddButton label="New task" onClick={openAdd} />} />
      <div className="flex flex-1 flex-col overflow-hidden px-8 py-6">
        {/* Header row */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              Plan on the board, schedule on the calendar — or both, side by side.
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Area filter */}
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="rounded-full border border-border bg-muted/40 px-3 py-2 text-sm outline-none"
            >
              <option value="">All life areas</option>
              {areas?.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* View switcher */}
            <div className="flex rounded-full border border-border p-0.5">
              {VIEWS.map((v) => {
                const Icon = v.icon;
                return (
                  <button
                    key={v.key}
                    onClick={() => setView(v.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition",
                      view === v.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* List-only filters: completed / remaining + a day filter */}
        {view === "list" && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-border p-0.5">
              {LIST_STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setListStatus(s.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition",
                    listStatus === s.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <input
              type="date"
              value={listDate}
              onChange={(e) => setListDate(e.target.value)}
              className="rounded-full border border-border bg-muted/40 px-3 py-2 text-sm outline-none [color-scheme:dark]"
            />
            {listDate && (
              <button
                onClick={() => setListDate("")}
                className="flex items-center gap-1 rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" /> Clear date
              </button>
            )}

            <span className="ml-auto text-sm text-muted-foreground">
              {listFiltered.length} task{listFiltered.length === 1 ? "" : "s"}
            </span>
          </div>
        )}

        {/* Views */}
        <div className="flex-1 overflow-y-auto">
          {view === "board" && (
            <TaskBoard
              tasks={filtered}
              areaName={areaName}
              projectName={projectName}
              focusByTask={focusByTask}
              onSelect={setSelected}
            />
          )}
          {view === "list" && (
            <TaskList
              tasks={listFiltered}
              areaName={areaName}
              sectionName={sectionName}
              onSelect={setSelected}
            />
          )}
          {view === "calendar" && (
            <div className="h-full rounded-2xl border border-border bg-card p-4">
              <TaskCalendar
                tasks={filtered}
                defaultMode="week"
                onSelect={setSelected}
              />
            </div>
          )}
          {view === "split" && (
            <div className="grid h-full grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="overflow-y-auto">
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                  Board
                </h2>
                <TaskBoard
                  tasks={filtered}
                  areaName={areaName}
                  projectName={projectName}
                  focusByTask={focusByTask}
                  onSelect={setSelected}
                  compact
                />
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                  Calendar
                </h2>
                <TaskCalendar
                  tasks={filtered}
                  defaultMode="week"
                  compact
                  onSelect={setSelected}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <TaskDetailPanel id={selected} onClose={() => setSelected(null)} />
      )}

      {addOpen && (
        <Modal title="New task" onClose={() => setAddOpen(false)}>
          <form className="space-y-3" onSubmit={submit}>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title…"
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            />
            {/* Project first — life area flows down from it */}
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none"
            >
              <option value="">No project — standalone task</option>
              {projects?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              {chosenProject ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm">
                  <span className="text-xs text-muted-foreground">Life area</span>
                  <span className="font-medium">{areaName(chosenProject.lifeAreaId) ?? "—"}</span>
                </div>
              ) : (
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none"
                >
                  <option value="">Life area…</option>
                  {areas?.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none"
              >
                <option value="low">Low priority</option>
                <option value="med">Medium priority</option>
                <option value="high">High priority</option>
              </select>
            </div>
            <div>
              <span className="mb-1 block text-xs text-muted-foreground">Start (optional)</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none [color-scheme:dark]"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none [color-scheme:dark]"
                />
              </div>
            </div>
            <div>
              <span className="mb-1 block text-xs text-muted-foreground">Due / end (optional)</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none [color-scheme:dark]"
                />
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none [color-scheme:dark]"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Add a start time and it appears on your Schedule & Calendar between start and due.
            </p>
            <button
              disabled={!title.trim() || !effectiveAreaId}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Add task
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
