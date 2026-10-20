"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfDay,
  addDays,
  addMonths,
  isSameDay,
  isToday,
  WEEKDAYS,
  fmtDay,
  fmtRange,
  fmtMonthYear,
} from "@/lib/date";
import { dateOf, mondayOf, ymdOf } from "@/lib/day";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/variants";
import { PRIORITY_STYLES } from "./TaskCard";
import { toast, errorMessage } from "@/components/os/celebrate";

/** Weeks start on Monday, like the rest of the app. */
const startOfWeek = (d: Date) => dateOf(mondayOf(ymdOf(d)));
/** 6×7 Monday-first grid covering the month that contains `d`. */
const monthMatrix = (d: Date) => {
  const start = startOfWeek(new Date(d.getFullYear(), d.getMonth(), 1));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};
const WEEKDAYS_MON = [...WEEKDAYS.slice(1), WEEKDAYS[0]];

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
    if (!t) return;
    const fail = (e: unknown) => toast(errorMessage(e), { tone: "warning" });
    if (t.startAt) {
      // preserve the time of day; shift the due/end by the same delta
      const src = new Date(t.startAt);
      const dst = new Date(day);
      dst.setHours(src.getHours(), src.getMinutes(), 0, 0);
      const delta = dst.getTime() - t.startAt;
      void updateTask({ id: taskId, startAt: dst.getTime(), dueDate: t.dueDate ? t.dueDate + delta : undefined }).catch(fail);
    } else {
      // keep the deadline's time of day (noon when it had none)
      const src = t.dueDate ? new Date(t.dueDate) : null;
      const dst = new Date(day);
      dst.setHours(src ? src.getHours() : 12, src ? src.getMinutes() : 0, 0, 0);
      void updateTask({ id: taskId, dueDate: dst.getTime() }).catch(fail);
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
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate(1)}
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setAnchor(startOfDay(new Date()))}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-1")}
          >
            Today
          </button>
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="ml-auto inline-flex items-center rounded-lg bg-muted p-[3px] text-muted-foreground">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                mode === m.key
                  ? "bg-card text-foreground shadow-sm"
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

const HOUR_PX = 48;
const tsMin = (ts: number) => {
  const d = new Date(ts);
  return d.getHours() * 60 + d.getMinutes();
};
const hourLabel = (h: number) => {
  const ap = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh} ${ap}`;
};

function Chip({
  task,
  onClick,
}: {
  task: Doc<"tasks">;
  onClick: () => void;
}) {
  // Show the scheduled time range (start–due) when a start time is set.
  const time = task.startAt
    ? task.dueDate && task.dueDate > task.startAt
      ? `${timeLabel(task.startAt)}–${timeLabel(task.dueDate)}`
      : timeLabel(task.startAt)
    : null;
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/task-id", task._id)}
      onClick={onClick}
      title={`${time ? time + " · " : ""}${task.title}`}
      className={cn(
        "cursor-grab truncate rounded-md border-l-2 bg-muted/50 px-1.5 py-1 text-[11px] active:cursor-grabbing",
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
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // open the grid around the working day
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_PX;
  }, []);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
      {/* day headers */}
      <div className="flex border-b border-border">
        <div className="w-14 shrink-0" />
        {columns.map((day) => (
          <div key={+day} className={cn("flex-1 border-l border-border px-2 py-2 text-center", isToday(day) && "bg-primary/5")}>
            <div className="text-[10px] uppercase text-muted-foreground">{WEEKDAYS[day.getDay()]}</div>
            <div className={cn("text-sm font-semibold", isToday(day) && "text-primary")}>{day.getDate()}</div>
          </div>
        ))}
      </div>

      {/* all-day row — tasks with a date but no start time */}
      <div className="flex border-b border-border">
        <div className="w-14 shrink-0 px-1 py-1 text-right text-[9px] uppercase text-muted-foreground">all-day</div>
        {columns.map((day) => {
          const untimed = tasksOn(day).filter((t) => t.startAt == null);
          return (
            <DayDropZone key={+day} day={day} tasks={untimed} onDropTask={onDropTask} className="min-h-[2rem] flex-1 space-y-1 border-l border-border p-1">
              {untimed.map((t) => (
                <Chip key={t._id} task={t} onClick={() => onChipClick(t._id)} />
              ))}
            </DayDropZone>
          );
        })}
      </div>

      {/* hour grid */}
      <div ref={scrollRef} className={cn("flex overflow-y-auto", compact ? "max-h-[44vh]" : "max-h-[58vh]")}>
        {/* sticky time gutter */}
        <div className="sticky left-0 z-10 w-14 shrink-0 bg-card">
          {hours.map((h) => (
            <div key={h} style={{ height: HOUR_PX }} className="relative border-b border-border/40">
              <span className="absolute -top-2 right-1.5 text-[10px] text-muted-foreground">{h === 0 ? "" : hourLabel(h)}</span>
            </div>
          ))}
        </div>
        {/* day columns */}
        {columns.map((day) => {
          const timed = tasksOn(day).filter((t) => t.startAt != null);
          return (
            <DayDropZone key={+day} day={day} tasks={timed} onDropTask={onDropTask} className="relative flex-1 border-l border-border">
              {hours.map((h) => (
                <div key={h} style={{ height: HOUR_PX }} className="border-b border-border/40" />
              ))}
              {timed.map((t) => {
                const startMin = tsMin(t.startAt!);
                let endMin = t.dueDate && t.dueDate > t.startAt! ? tsMin(t.dueDate) : startMin + 30;
                if (endMin <= startMin) endMin = startMin + 30;
                const top = (startMin / 60) * HOUR_PX;
                const height = Math.max(18, ((endMin - startMin) / 60) * HOUR_PX - 2);
                return (
                  <button
                    key={t._id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/task-id", t._id)}
                    onClick={() => onChipClick(t._id)}
                    style={{ top, height }}
                    className={cn(
                      "absolute inset-x-1 cursor-grab overflow-hidden rounded-md border-l-2 bg-muted/50 px-1.5 py-0.5 text-left text-[11px] shadow-sm transition hover:bg-accent active:cursor-grabbing",
                      PRIORITY_STYLES[t.priority],
                      t.status === "done" && "line-through opacity-60",
                    )}
                  >
                    <p className="truncate font-medium">{t.title}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{timeLabel(t.startAt!)}</p>
                  </button>
                );
              })}
            </DayDropZone>
          );
        })}
      </div>
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
        {WEEKDAYS_MON.map((w) => (
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
                  isToday(day) ? "font-semibold text-primary" : "text-muted-foreground",
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
