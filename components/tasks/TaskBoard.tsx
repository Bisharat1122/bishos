"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";

type Status = "not_started" | "in_progress" | "done";

const COLUMNS: { key: Status; label: string; accent: string }[] = [
  { key: "not_started", label: "Not started", accent: "bg-muted-foreground" },
  { key: "in_progress", label: "In progress", accent: "bg-warning" },
  { key: "done", label: "Done", accent: "bg-primary" },
];

export function TaskBoard({
  tasks,
  areaName,
  onSelect,
  compact = false,
}: {
  tasks: Doc<"tasks">[];
  areaName: (id: Id<"lifeAreas">) => string | undefined;
  onSelect?: (id: Id<"tasks">) => void;
  compact?: boolean;
}) {
  const setStatus = useMutation(api.tasks.setStatus).withOptimisticUpdate((store, { id, status }) => {
    const cur = store.getQuery(api.tasks.list, {});
    if (!cur) return;
    store.setQuery(api.tasks.list, {}, cur.map((t) => (t._id === id ? { ...t, status } : t)));
  });
  const removeTask = useMutation(api.tasks.remove);
  const [dragOver, setDragOver] = useState<Status | null>(null);

  function onDrop(status: Status, e: React.DragEvent) {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/task-id") as Id<"tasks">;
    if (id) void setStatus({ id, status });
  }

  return (
    <div
      className={cn(
        "grid gap-4",
        compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 md:grid-cols-3",
      )}
    >
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(col.key);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => onDrop(col.key, e)}
            className={cn(
              "flex flex-col rounded-2xl border border-border bg-card/50 p-3 transition-colors",
              dragOver === col.key && "border-primary/60 bg-primary/5",
            )}
          >
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={cn("h-2 w-2 rounded-full", col.accent)} />
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {colTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {colTasks.map((t) => (
                <TaskCard
                  key={t._id}
                  task={t}
                  areaName={areaName(t.lifeAreaId)}
                  onDelete={() => void removeTask({ id: t._id })}
                  onClick={onSelect ? () => onSelect(t._id) : undefined}
                  compact={compact}
                />
              ))}
              {colTasks.length === 0 && (
                <div className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
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
