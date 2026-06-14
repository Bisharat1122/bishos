"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Play, Pause, RotateCcw, SkipForward, Plus, Trash2, Clock, Timer } from "lucide-react";
import { Card, Topbar } from "@/components/ui";
import { BarChart } from "@/components/Chart";
import { useFocusTimer } from "@/components/focus/FocusTimerProvider";
import { cn } from "@/lib/utils";

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s) % 60).padStart(2, "0")}`;
const hrs = (s: number) => (s / 3600).toFixed(1);
const PRANK = { high: 0, med: 1, low: 2 } as const;

export default function FocusPage() {
  const areas = useQuery(api.lifeAreas.list);
  const projects = useQuery(api.projects.list);
  const tasks = useQuery(api.tasks.list, {});
  const analytics = useQuery(api.focus.analytics);
  const weekRange = useQuery(api.focus.rangeAnalytics, { range: "week" });
  const totals = useQuery(api.focus.taskTotals);
  const sessions = useQuery(api.focus.list);
  const logManual = useMutation(api.focus.logManual);
  const removeSession = useMutation(api.focus.remove);

  // The running timer lives in a global provider so it persists across pages
  // and is mirrored in the Topbar.
  const timer = useFocusTimer();
  const { type, mode, workMin, breakMin, running, taskId, projectId, areaId } = timer;

  function pickTask(id: string) {
    const t = tasks?.find((x) => x._id === id);
    timer.attribute({
      taskId: id,
      areaId: t?.lifeAreaId ?? "",
      projectId: t?.projectId ?? "",
      taskTitle: t?.title ?? "",
    });
  }

  // preselect a task when arriving from a task's "Focus on this" link
  const preselected = useRef(false);
  useEffect(() => {
    if (preselected.current || !tasks) return;
    const tid = new URLSearchParams(window.location.search).get("task");
    if (tid) {
      preselected.current = true;
      pickTask(tid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const display = timer.display;
  const pct =
    type === "stopwatch"
      ? ((timer.elapsed % 60) / 60) * 100
      : timer.total > 0
        ? ((timer.total - timer.left) / timer.total) * 100
        : 0;
  const openTasks = (tasks ?? [])
    .filter((t) => t.status !== "done")
    .sort((a, b) => PRANK[a.priority] - PRANK[b.priority]);

  return (
    <div>
      <Topbar />
      <div className="px-4 py-6 sm:px-8 sm:py-7">
        <h1 className="text-2xl font-bold tracking-tight">Focus Time</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pomodoro or a plain stopwatch. Attribute time to a task, project or life area.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Timer */}
          <Card className="lg:col-span-1">
            {/* type toggle */}
            <div className="mb-4 flex rounded-full border border-border p-0.5">
              {([
                { k: "pomodoro", label: "Pomodoro", icon: Timer },
                { k: "stopwatch", label: "Stopwatch", icon: Clock },
              ] as const).map((t) => (
                <button
                  key={t.k}
                  onClick={() => timer.switchType(t.k)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium transition",
                    type === t.k ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {type === "pomodoro" && (
              <div className="mb-2 flex justify-center gap-2">
                {(["focus", "break"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => timer.setMode(m)}
                    className={cn(
                      "rounded-full px-4 py-1 text-xs font-medium capitalize",
                      mode === m ? "bg-muted text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            {/* dial */}
            <div className="relative mx-auto my-3 flex h-44 w-44 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" className="fill-none stroke-muted" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className={cn("fill-none", mode === "break" && type === "pomodoro" ? "stroke-accent" : "stroke-primary")}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={(2 * Math.PI * 45 * (100 - pct)) / 100}
                />
              </svg>
              <div className="text-center">
                <div className="text-4xl font-bold tabular-nums">{fmt(display)}</div>
                <div className="text-xs uppercase text-muted-foreground">
                  {type === "stopwatch" ? "elapsed" : mode}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={timer.toggle}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
              >
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {running ? "Pause" : "Start"}
              </button>
              <button
                onClick={timer.stopAndLog}
                title="Stop & log focused time"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              {type === "pomodoro" && mode === "break" && (
                <button
                  onClick={timer.skipBreak}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-muted"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* settings + attribution */}
            <div className="mt-5 space-y-2 border-t border-border pt-4">
              {type === "pomodoro" && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-14 text-muted-foreground">Focus</span>
                  <input
                    type="number"
                    min={1}
                    value={workMin}
                    onChange={(e) => timer.setWorkMin(Math.max(1, Number(e.target.value)))}
                    className="w-16 rounded-lg border border-border bg-muted/30 px-2 py-1 outline-none"
                  />
                  <span className="w-12 text-muted-foreground">Break</span>
                  <input
                    type="number"
                    min={1}
                    value={breakMin}
                    onChange={(e) => timer.setBreakMin(Math.max(1, Number(e.target.value)))}
                    className="w-16 rounded-lg border border-border bg-muted/30 px-2 py-1 outline-none"
                  />
                </div>
              )}
              <select
                value={taskId}
                onChange={(e) => pickTask(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-sm outline-none"
              >
                <option value="">Attribute to a task…</option>
                {openTasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
              </select>
              <select
                value={projectId}
                onChange={(e) => {
                  const pa = projects?.find((p) => p._id === e.target.value)?.lifeAreaId;
                  timer.attribute({ projectId: e.target.value, areaId: pa ?? areaId });
                }}
                className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-sm outline-none"
              >
                <option value="">No project</option>
                {projects?.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <select
                value={areaId}
                onChange={(e) => timer.attribute({ areaId: e.target.value })}
                className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-sm outline-none"
              >
                <option value="">Life area…</option>
                {areas?.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Analytics */}
          <div className="space-y-4 lg:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> Today
                </div>
                <div className="mt-2 text-2xl font-bold">{analytics ? hrs(analytics.totalToday) : "—"}h</div>
              </Card>
              <Card>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> This week
                </div>
                <div className="mt-2 text-2xl font-bold">{analytics ? hrs(analytics.totalWeek) : "—"}h</div>
              </Card>
            </div>

            <Card>
              <h2 className="mb-4 font-semibold">This week — by life area</h2>
              <BarChart data={weekRange?.series ?? []} unit="h" />
            </Card>

            {/* Time per task */}
            <Card>
              <h2 className="mb-3 font-semibold">Time per task</h2>
              {totals && totals.tasks.length > 0 ? (
                <div className="space-y-2">
                  {totals.tasks.slice(0, 8).map((t) => {
                    const max = totals.tasks[0].seconds || 1;
                    return (
                      <div key={t.id} className="flex items-center gap-3">
                        <span className="w-44 truncate text-sm">{t.title}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(t.seconds / max) * 100}%` }} />
                        </div>
                        <span className="w-20 text-right text-xs text-muted-foreground">
                          {hrs(t.seconds)}h · {t.count}×
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Run a timer with a task attached to see time per task.
                </p>
              )}
            </Card>
          </div>
        </div>

        {/* Manual + activity history */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ManualEntry areas={areas} onLog={logManual} />
          <Card>
            <h2 className="mb-3 font-semibold">Activity history</h2>
            <div className="max-h-80 space-y-1.5 overflow-y-auto">
              {sessions?.length === 0 && <p className="text-sm text-muted-foreground">No sessions yet.</p>}
              {sessions?.map((s) => {
                const label =
                  tasks?.find((t) => t._id === s.taskId)?.title ??
                  projects?.find((p) => p._id === s.projectId)?.title ??
                  areas?.find((a) => a._id === s.lifeAreaId)?.name ??
                  "Focus";
                return (
                  <div key={s._id} className="group flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 text-sm">
                    <span className="font-medium tabular-nums">{Math.round(s.duration / 60)}m</span>
                    <span className="flex-1 truncate text-muted-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.endTime).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      onClick={() => void removeSession({ id: s._id })}
                      className="text-muted-foreground opacity-0 transition hover:text-warning group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ManualEntry({
  areas,
  onLog,
}: {
  areas: { _id: Id<"lifeAreas">; name: string }[] | undefined;
  onLog: (v: { durationMinutes: number; lifeAreaId?: Id<"lifeAreas">; date?: number }) => void;
}) {
  const [min, setMin] = useState(30);
  const [areaId, setAreaId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <Card>
      <h2 className="mb-3 font-semibold">Log time manually</h2>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={1}
          value={min}
          onChange={(e) => setMin(Number(e.target.value))}
          className="w-20 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none"
        />
        <span className="text-sm text-muted-foreground">min</span>
        <select
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none"
        >
          <option value="">Life area…</option>
          {areas?.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={() =>
            onLog({
              durationMinutes: min,
              lifeAreaId: areaId ? (areaId as Id<"lifeAreas">) : undefined,
              date: new Date(date + "T12:00:00").getTime(),
            })
          }
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Log
        </button>
      </div>
    </Card>
  );
}
