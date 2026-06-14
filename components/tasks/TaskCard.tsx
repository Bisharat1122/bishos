"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { Trash2, GripVertical, CalendarClock, Clock, FolderKanban, Paperclip } from "lucide-react";
import { TaskTimerButton } from "./TaskTimerButton";
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

const DAY = 24 * 60 * 60 * 1000;

/** Relative deadline label + urgency. */
function dueMeta(dueDate: number, done: boolean) {
  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);
  const dd = new Date(dueDate);
  dd.setHours(0, 0, 0, 0);
  const diff = Math.round((dd.getTime() - today0.getTime()) / DAY);
  const date = new Date(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (done) return { label: date, urgent: false };
  if (diff < 0) return { label: `Overdue ${-diff}d`, urgent: true };
  if (diff === 0) return { label: "Due today", urgent: true };
  if (diff === 1) return { label: "Due tomorrow", urgent: true };
  if (diff <= 3) return { label: `${diff}d left · ${date}`, urgent: false };
  return { label: date, urgent: false };
}

export function TaskCard({
  task,
  areaName,
  projectName,
  focusSeconds,
  onDelete,
  onClick,
  compact = false,
}: {
  task: Doc<"tasks">;
  areaName?: string;
  projectName?: string;
  focusSeconds?: number;
  onDelete?: () => void;
  onClick?: () => void;
  compact?: boolean;
}) {
  const done = task.status === "done";
  const due = task.dueDate ? dueMeta(task.dueDate, done) : null;
  const focusH = focusSeconds && focusSeconds > 0 ? (focusSeconds / 3600).toFixed(1) : null;
  const attachments = task.attachments?.length ?? 0;
  const tags = task.tags ?? [];

  return (
    <div
      onClick={onClick}
      className={cn(
        "group rounded-xl border border-l-4 border-border bg-card-2",
        onClick && "cursor-pointer",
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
              done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </p>

          {/* metrics — shown in both normal and compact (split) cards */}
          <div className={cn("flex flex-wrap items-center gap-1.5 text-[10px]", compact ? "mt-1" : "mt-2")}>
            {!compact && (
              <span className={cn("font-semibold uppercase tracking-wide", PRIORITY_TEXT[task.priority])}>
                {task.priority}
              </span>
            )}

            {due && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                  due.urgent ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground",
                )}
              >
                <CalendarClock className="h-3 w-3" /> {due.label}
              </span>
            )}

            {projectName ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-sprint/15 px-1.5 py-0.5 text-sprint">
                <FolderKanban className="h-3 w-3" /> <span className="max-w-[7rem] truncate">{projectName}</span>
              </span>
            ) : (
              areaName && (
                <span className="max-w-[7rem] truncate rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
                  {areaName}
                </span>
              )
            )}

            {focusH && (
              <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                <Clock className="h-3 w-3" /> {focusH}h
              </span>
            )}

            {attachments > 0 && (
              <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                <Paperclip className="h-3 w-3" /> {attachments}
              </span>
            )}
          </div>

          {/* tags */}
          {!compact && tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tags.slice(0, 4).map((t) => (
                <span key={t} className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <TaskTimerButton task={task} compact />
          {onDelete && (
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
    </div>
  );
}
