"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export const PRIORITY_STYLES: Record<string, string> = {
  high: "border-l-warning",
  med: "border-l-primary",
  low: "border-l-muted-foreground",
};

export const PRIORITY_TEXT: Record<string, string> = {
  high: "text-warning",
  med: "text-primary",
  low: "text-muted-foreground",
};

export function TaskCard({
  task,
  areaName,
  onDelete,
  onClick,
  compact = false,
}: {
  task: Doc<"tasks">;
  areaName?: string;
  onDelete?: () => void;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/task-id", task._id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onClick}
      className={cn(
        "group cursor-grab rounded-xl border border-l-4 border-border bg-card-2 active:cursor-grabbing",
        PRIORITY_STYLES[task.priority],
        compact ? "px-2 py-1.5" : "p-3",
      )}
    >
      <div className="flex items-start gap-1.5">
        {!compact && (
          <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate font-medium",
              compact ? "text-xs" : "text-sm",
              task.status === "done" && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </p>
          {!compact && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide",
                  PRIORITY_TEXT[task.priority],
                )}
              >
                {task.priority}
              </span>
              {areaName && (
                <span className="truncate rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {areaName}
                </span>
              )}
            </div>
          )}
        </div>
        {!compact && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-muted-foreground opacity-0 transition hover:text-warning group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
