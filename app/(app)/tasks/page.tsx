"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LayoutGrid, CalendarDays, Columns2, Table } from "lucide-react";
import { Topbar, AddButton, Modal } from "@/components/ui";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskCalendar } from "@/components/tasks/TaskCalendar";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { cn } from "@/lib/utils";

type View = "board" | "calendar" | "split" | "list";

const VIEWS: { key: View; label: string; icon: typeof LayoutGrid }[] = [
  { key: "board", label: "Board", icon: LayoutGrid },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "split", label: "Split", icon: Columns2 },
  { key: "list", label: "List", icon: Table },
];

export default function TasksPage() {
  const areas = useQuery(api.lifeAreas.list);
  const sections = useQuery(api.sections.list, {});
  const tasks = useQuery(api.tasks.list, {});
  const projects = useQuery(api.projects.list);
  const createTask = useMutation(api.tasks.create);

  const [view, setView] = useState<View>("board");
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [selected, setSelected] = useState<Id<"tasks"> | null>(null);

  // create form
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "med" | "high">("med");
  const [projectId, setProjectId] = useState<string>("");
  const [areaId, setAreaId] = useState<string>("");
  const [due, setDue] = useState<string>("");

  const openAdd = () => {
    setProjectId("");
    setAreaId(areas?.[0]?._id ?? "");
    setTitle("");
    setDue("");
    setAddOpen(true);
  };

  // When a project is chosen the life area is inherited from it.
  const chosenProject = projects?.find((p) => p._id === projectId);
  const effectiveAreaId = chosenProject ? chosenProject.lifeAreaId : (areaId as Id<"lifeAreas"> | "");

  const areaName = (id: Id<"lifeAreas">) =>
    areas?.find((a) => a._id === id)?.name;
  const sectionName = (id?: Id<"sections">) =>
    id ? sections?.find((s) => s._id === id)?.name : undefined;

  const filtered = useMemo(
    () =>
      (tasks ?? []).filter((t) => !areaFilter || t.lifeAreaId === areaFilter),
    [tasks, areaFilter],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !effectiveAreaId) return;
    void createTask({
      title: title.trim(),
      priority,
      lifeAreaId: effectiveAreaId as Id<"lifeAreas">,
      projectId: projectId ? (projectId as Id<"projects">) : undefined,
      dueDate: due ? new Date(due + "T12:00:00").getTime() : undefined,
    });
    setTitle("");
    setDue("");
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

        {/* Views */}
        <div className="flex-1 overflow-y-auto">
          {view === "board" && (
            <TaskBoard tasks={filtered} areaName={areaName} onSelect={setSelected} />
          )}
          {view === "list" && (
            <TaskList
              tasks={filtered}
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
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none [color-scheme:dark]"
            />
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
