"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";
import type { TaskLookups } from "./taskMeta";
import { toast, errorMessage } from "@/components/os/celebrate";
import { todayYmd } from "@/lib/day";

type Status = "not_started" | "in_progress" | "done";

const COLUMNS: { key: Status; label: string; accent: string }[] = [
  { key: "not_started", label: "Not started", accent: "bg-muted-foreground" },
  { key: "in_progress", label: "In progress", accent: "bg-warning" },
  { key: "done", label: "Done", accent: "bg-success" },
];

/** Effective sort key — manual order if set, else creation time. Higher = top. */
const eff = (t: Doc<"tasks">) => t.order ?? t._creationTime;

type DropAt = { col: Status; taskId: Id<"tasks"> | null; before: boolean };

export function TaskBoard({
  tasks,
  areaName,
  projectName,
  focusByTask,
  onSelect,
  compact = false,
  lookups,
}: {
  tasks: Doc<"tasks">[];
  areaName: (id: Id<"lifeAreas">) => string | undefined;
  projectName?: (id: Id<"projects">) => string | undefined;
  focusByTask?: Map<string, number>;
  onSelect?: (id: Id<"tasks">) => void;
  compact?: boolean;
  lookups?: TaskLookups;
}) {
  const setOrder = useMutation(api.tasks.setOrder).withOptimisticUpdate((store, { id, order, status }) => {
    const cur = store.getQuery(api.tasks.list, {});
    if (!cur) return;
    store.setQuery(
      api.tasks.list,
      {},
      cur.map((t) => (t._id === id ? { ...t, order, ...(status ? { status } : {}) } : t)),
    );
  });
  const removeTask = useMutation(api.tasks.remove);

  const [draggingId, setDraggingId] = useState<Id<"tasks"> | null>(null);
  const [dropAt, setDropAt] = useState<DropAt | null>(null);

  // `tasks` arrive pre-sorted by the canonical comparator (priority → due →
  // order), so high-priority / soon-due tasks stay on top. We only filter here.
  const colTasksOf = (status: Status) => tasks.filter((t) => t.status === status);

  /** Order value that places the dragged task at the indicated slot. */
  function computeOrder(status: Status, targetId: Id<"tasks"> | null, before: boolean): number {
    const list = colTasksOf(status).filter((t) => t._id !== draggingId);
    if (!targetId) {
      if (list.length === 0) return Date.now();
      return eff(list[list.length - 1]) - 1; // bottom of column
    }
    const idx = list.findIndex((t) => t._id === targetId);
    if (idx === -1) return Date.now();
    const target = list[idx];
    if (before) {
      const above = list[idx - 1];
      return above ? (eff(above) + eff(target)) / 2 : eff(target) + 1;
    }
    const below = list[idx + 1];
    return below ? (eff(target) + eff(below)) / 2 : eff(target) - 1;
  }

  function handleDrop(col: Status) {
    if (!draggingId) return;
    const at = dropAt && dropAt.col === col ? dropAt : { col, taskId: null, before: false };
    const order = computeOrder(col, at.taskId, at.before);
    const dragged = tasks.find((t) => t._id === draggingId);
    const status = dragged && dragged.status !== col ? col : undefined;
    void setOrder({ id: draggingId, order, status, date: lookups?.today ?? todayYmd() }).catch((e) => toast(errorMessage(e), { tone: "warning" }));
    setDraggingId(null);
    setDropAt(null);
  }

  return (
    <div className={cn("grid gap-4", compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 md:grid-cols-3")}>
      {COLUMNS.map((col) => {
        const colTasks = colTasksOf(col.key);
        const active = draggingId && dropAt?.col === col.key;
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setDropAt({ col: col.key, taskId: null, before: false });
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(col.key);
            }}
            className={cn(
              "flex flex-col rounded-xl border border-border bg-card/50 p-3 transition-colors",
              active && "border-primary/60 bg-primary/5",
            )}
          >
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={cn("h-2 w-2 rounded-full", col.accent)} />
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {colTasks.length}
              </span>
            </div>

            <div className="flex min-h-[3rem] flex-col gap-2">
              {colTasks.map((t) => {
                const showBefore = dropAt?.col === col.key && dropAt.taskId === t._id && dropAt.before;
                const showAfter = dropAt?.col === col.key && dropAt.taskId === t._id && !dropAt.before;
                return (
                  <div
                    key={t._id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingId(t._id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDropAt(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const r = e.currentTarget.getBoundingClientRect();
                      setDropAt({ col: col.key, taskId: t._id, before: e.clientY < r.top + r.height / 2 });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDrop(col.key);
                    }}
                    className={cn("cursor-grab active:cursor-grabbing", draggingId === t._id && "opacity-40")}
                  >
                    {showBefore && <DropLine />}
                    <TaskCard
                      task={t}
                      areaName={areaName(t.lifeAreaId)}
                      projectName={t.projectId ? projectName?.(t.projectId) : undefined}
                      focusSeconds={focusByTask?.get(t._id)}
                      onDelete={() => {
                        if (confirm(`Delete “${t.title}”?`)) void removeTask({ id: t._id, date: lookups?.today ?? todayYmd() });
                      }}
                      onClick={onSelect ? () => onSelect(t._id) : undefined}
                      compact={compact}
                      lookups={lookups}
                    />
                    {showAfter && <DropLine />}
                  </div>
                );
              })}

              {colTasks.length === 0 && (
                <div
                  className={cn(
                    "rounded-xl border border-dashed py-6 text-center text-xs",
                    active ? "border-primary/60 text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DropLine() {
  return <div className="my-1 h-0.5 rounded-full bg-primary" />;
}
