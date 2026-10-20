"use client";

import { useState } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { CalendarClock, Clock, Target, ArrowRightToLine, MoreHorizontal, Star, X, Zap } from "lucide-react";
import { cn, CheckCircle, AreaDot, Chip } from "@/components/os/kit";
import { TaskTimerButton } from "@/components/tasks/TaskTimerButton";
import { fmtMin } from "@/lib/day";

export function TaskRow({
  task,
  areaColor,
  areaName,
  rank,
  onToggle,
  onOpen,
  onTomorrow,
  onUnplan,
  onTop,
  isTop,
  dayStart,
  compact,
}: {
  task: Doc<"tasks">;
  areaColor?: string;
  areaName?: string;
  rank?: number;
  onToggle: () => void;
  onOpen: (id: Id<"tasks">) => void;
  onTomorrow?: () => void;
  onUnplan?: () => void;
  onTop?: () => void;
  isTop?: boolean;
  dayStart: number;
  compact?: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const done = task.status === "done";
  const overdue = task.dueDate != null && task.dueDate < dayStart && !done;
  const dueToday = task.dueDate != null && task.dueDate >= dayStart && task.dueDate < dayStart + 86400000;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-lg border border-transparent px-2 transition-colors hover:border-border hover:bg-accent/40",
        compact ? "py-1.5" : "py-2.5",
        rank != null && !done && "border-border bg-card",
      )}
    >
      {rank != null ? (
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
            done ? "bg-success text-background" : "bg-muted text-foreground",
          )}
        >
          {rank}
        </span>
      ) : null}
      <CheckCircle checked={done} onClick={onToggle} size={rank != null ? "lg" : "md"} />
      <button onClick={() => onOpen(task._id)} className="min-w-0 flex-1 text-left">
        <span className={cn("block truncate text-sm", rank != null && "font-medium", done && "os-done-text")}>{task.title}</span>
        {!compact && (
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            {areaName && (
              <span className="inline-flex items-center gap-1">
                <AreaDot color={areaColor} /> {areaName}
              </span>
            )}
            {task.estimateMin != null && (
              <span className="inline-flex items-center gap-0.5">
                <Clock className="h-3 w-3" /> {fmtMin(task.estimateMin)}
              </span>
            )}
            {task.energy === "high" && (
              <span className="inline-flex items-center gap-0.5">
                <Zap className="h-3 w-3" /> deep
              </span>
            )}
          </span>
        )}
      </button>
      <div className="flex shrink-0 items-center gap-1">
        {overdue && <Chip tone="danger"><CalendarClock /> overdue</Chip>}
        {dueToday && !done && <Chip tone="warning"><CalendarClock /> due today</Chip>}
        {task.goalId && <Chip tone="sprint" title="Moves a 12-week goal"><Target /></Chip>}
        {!done && (
          <span className="opacity-0 transition group-hover:opacity-100 max-sm:opacity-100">
            <TaskTimerButton task={task} compact />
          </span>
        )}
        {(onTomorrow || onUnplan || onTop) && !done && (
          <div className="relative">
            <button
              onClick={() => setMenu((m) => !m)}
              className="rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground group-hover:opacity-100 max-sm:opacity-100"
              aria-label="More"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <div className="os-pop absolute right-0 z-50 mt-1 w-44 rounded-lg border border-border bg-popover p-1 text-sm shadow-raised">
                  {onTop && (
                    <button onClick={() => { setMenu(false); onTop(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
                      <Star className="h-3.5 w-3.5" /> {isTop ? "Remove from Top" : "Make it a Top"}
                    </button>
                  )}
                  {onTomorrow && (
                    <button onClick={() => { setMenu(false); onTomorrow(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
                      <ArrowRightToLine className="h-3.5 w-3.5" /> Move to tomorrow
                    </button>
                  )}
                  {onUnplan && (
                    <button onClick={() => { setMenu(false); onUnplan(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
                      <X className="h-3.5 w-3.5" /> Remove from today
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
