"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfDay,
  startOfWeek,
  addDays,
  addMonths,
  isSameDay,
  isToday,
  monthMatrix,
  WEEKDAYS,
  fmtDay,
  fmtRange,
  fmtMonthYear,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import { PRIORITY_STYLES } from "./TaskCard";

type Mode = "day" | "3day" | "week" | "month";

const MODES: { key: Mode; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "3day", label: "3-Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

export function TaskCalendar({
  tasks,
  defaultMode = "week",
  compact = false,
  onSelect,
}: {
  tasks: Doc<"tasks">[];
  defaultMode?: Mode;
  compact?: boolean;
  onSelect?: (id: Id<"tasks">) => void;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const updateTask = useMutation(api.tasks.update);

  // A task lands on the calendar by its scheduled start, else its due date.
  const calDate = (t: Doc<"tasks">) => t.startAt ?? t.dueDate;
  const tasksOn = (day: Date) =>
    tasks
      .filter((t) => calDate(t) != null && isSameDay(calDate(t)!, day))
      .sort((a, b) => (calDate(a)! - calDate(b)!));

  function reschedule(taskId: Id<"tasks">, day: Date) {
    const t = tasks.find((x) => x._id === taskId);
    if (t?.startAt) {
      // preserve the time of day; shift end by the same delta
      const src = new Date(t.startAt);
      const dst = new Date(day);
      dst.setHours(src.getHours(), src.getMinutes(), 0, 0);
      const delta = dst.getTime() - t.startAt;
      void updateTask({ id: taskId, startAt: dst.getTime(), endAt: t.endAt ? t.endAt + delta : undefined });
    } else {
      const noon = new Date(day);
      noon.setHours(12, 0, 0, 0);
      void updateTask({ id: taskId, dueDate: noon.getTime() });
    }
  }

  function navigate(dir: 1 | -1) {
    if (mode === "month") setAnchor((a) => addMonths(a, dir));
    else if (mode === "week") setAnchor((a) => addDays(a, dir * 7));
    else if (mode === "3day") setAnchor((a) => addDays(a, dir * 3));
    else setAnchor((a) => addDays(a, dir));
  }

  // Compute the visible days for column-based modes.
  let columns: Date[] = [];
  if (mode === "day") columns = [anchor];
  else if (mode === "3day") columns = [0, 1, 2].map((i) => addDays(anchor, i));
  else if (mode === "week")
    columns = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i));

  const title =
    mode === "month"
      ? fmtMonthYear(anchor)
      : mode === "day"
        ? fmtDay(anchor)
        : fmtRange(columns[0], columns[columns.length - 1]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setAnchor(startOfDay(new Date()))}
            className="ml-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Today
          </button>
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="ml-auto flex rounded-lg border border-border p-0.5">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                mode === m.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "month" ? (
        <MonthGrid
          anchor={anchor}
          tasksOn={tasksOn}
          onDropTask={reschedule}
          onChipClick={(id) => onSelect?.(id)}
        />
      ) : (
        <ColumnsView
          columns={columns}
          tasksOn={tasksOn}
          onDropTask={reschedule}
          onChipClick={(id) => onSelect?.(id)}
          compact={compact}
        />
      )}
    </div>
  );
}

const timeLabel = (ts: number) =>
  new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

function Chip({
  task,
  onClick,
}: {
  task: Doc<"tasks">;
  onClick: () => void;
}) {
  // Show the scheduled time range (start–end) when set, else the start time.
  const time = task.startAt
    ? task.endAt
      ? `${timeLabel(task.startAt)}–${timeLabel(task.endAt)}`
      : timeLabel(task.startAt)
    : null;
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/task-id", task._id)}
      onClick={onClick}
      title={`${time ? time + " · " : ""}${task.title}`}
      className={cn(
        "cursor-grab truncate rounded-md border-l-2 bg-card-2 px-1.5 py-1 text-[11px] active:cursor-grabbing",
        PRIORITY_STYLES[task.priority],
        task.status === "done" && "text-muted-foreground line-through",
      )}
    >
      {time && <span className="mr-1 font-semibold text-primary">{time}</span>}
      {task.title}
    </div>
  );
}

function DayDropZone({
  day,
  tasks,
  onDropTask,
  children,
  className,
}: {
  day: Date;
  tasks: Doc<"tasks">[];
  onDropTask: (id: Id<"tasks">, day: Date) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData("text/task-id") as Id<"tasks">;
        if (id) onDropTask(id, day);
      }}
      className={cn(over && "bg-primary/10", className)}
    >
      {children}
    </div>
  );
}

function ColumnsView({
  columns,
  tasksOn,
  onDropTask,
  onChipClick,
  compact,
}: {
  columns: Date[];
  tasksOn: (d: Date) => Doc<"tasks">[];
  onDropTask: (id: Id<"tasks">, day: Date) => void;
  onChipClick: (id: Id<"tasks">) => void;
  compact?: boolean;
}) {
  return (
    <div
      className="grid flex-1 gap-2 overflow-y-auto"
      style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
    >
      {columns.map((day) => {
        const dayTasks = tasksOn(day);
        return (
          <DayDropZone
            key={day.toISOString()}
            day={day}
            tasks={dayTasks}
            onDropTask={onDropTask}
            className="flex flex-col rounded-xl border border-border bg-card/40"
          >
            <div
              className={cn(
                "border-b border-border px-2 py-1.5 text-center",
                isToday(day) && "bg-primary/10",
              )}
            >
              <div className="text-[10px] uppercase text-muted-foreground">
                {WEEKDAYS[day.getDay()]}
              </div>
              <div
                className={cn(
                  "text-sm font-semibold",
                  isToday(day) && "text-primary",
                )}
              >
                {day.getDate()}
              </div>
            </div>
            <div
              className={cn(
                "flex flex-1 flex-col gap-1 p-1.5",
                compact ? "min-h-[120px]" : "min-h-[320px]",
              )}
            >
              {dayTasks.map((t) => (
                <Chip
                  key={t._id}
                  task={t}
                  onClick={() => onChipClick(t._id)}
                />
              ))}
            </div>
          </DayDropZone>
        );
      })}
    </div>
  );
}

function MonthGrid({
  anchor,
  tasksOn,
  onDropTask,
  onChipClick,
}: {
  anchor: Date;
  tasksOn: (d: Date) => Doc<"tasks">[];
  onDropTask: (id: Id<"tasks">, day: Date) => void;
  onChipClick: (id: Id<"tasks">) => void;
}) {
  const days = monthMatrix(anchor);
  const month = anchor.getMonth();
  return (
    <div className="flex flex-1 flex-col">
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="px-2 py-1 text-center text-[10px] uppercase text-muted-foreground"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 gap-1">
        {days.map((day) => {
          const dayTasks = tasksOn(day);
          const inMonth = day.getMonth() === month;
          return (
            <DayDropZone
              key={day.toISOString()}
              day={day}
              tasks={dayTasks}
              onDropTask={onDropTask}
              className={cn(
                "flex min-h-[92px] flex-col rounded-lg border border-border p-1",
                inMonth ? "bg-card/40" : "bg-transparent opacity-50",
                isToday(day) && "border-primary/60",
              )}
            >
              <div
                className={cn(
                  "mb-1 text-right text-[11px]",
                  isToday(day) ? "font-bold text-primary" : "text-muted-foreground",
                )}
              >
                {day.getDate()}
              </div>
              <div className="flex flex-col gap-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <Chip
                    key={t._id}
                    task={t}
                    onClick={() => onChipClick(t._id)}
                  />
                ))}
                {dayTasks.length > 3 && (
                  <span className="px-1 text-[10px] text-muted-foreground">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </DayDropZone>
          );
        })}
      </div>
    </div>
  );
}
