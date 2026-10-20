"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Play, Pause, RotateCcw, SkipForward, Plus, Trash2, Clock, Timer, CalendarDays, LayoutDashboard, Star,
  Brain, Phone, Sun, Layers, ArrowRight,
} from "lucide-react";
import { BarChart } from "@/components/Chart";
import { useFocusTimer, type BlockType } from "@/components/focus/FocusTimerProvider";
import { PageShell, Section, Segmented, Metric, Select, EmptyHint, Chip, areaColor, cn, buttonVariants, inputClass } from "@/components/os/kit";
import { toast, errorMessage } from "@/components/os/celebrate";
import { useCockpit, useStable } from "@/components/os/useCockpit";
import { useTz } from "@/components/direction/util";
import { dateOf, fmtMin, mondayOf, useToday } from "@/lib/day";

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s) % 60).padStart(2, "0")}`;
const hrs = (s: number) => (s / 3600).toFixed(1);
const PRANK = { high: 0, med: 1, low: 2 } as const;
const kindOfEnergy = (e?: string | null): BlockType | undefined => (e === "high" ? "maker" : e === "low" ? "manager" : undefined);

const BLOCK_OPTIONS = [
  { value: "maker" as BlockType, label: "Deep", icon: Brain },
  { value: "manager" as BlockType, label: "Shallow", icon: Phone },
  { value: "" as BlockType, label: "Unmarked" },
];

/**
 * Focus — the execution engine of the Life OS. Start from today's Top 3 /
 * planned tasks, mark each session as deep (maker) or shallow (manager),
 * and see hours by Life Area this week against each area's target.
 */
export default function FocusPage() {
  const today = useToday();
  const weekStart = mondayOf(today);
  const tz = useTz();
  const weekArgs = useMemo(() => ({ weekStartMs: dateOf(weekStart).getTime(), todayStartMs: dateOf(today).getTime() }), [weekStart, today]);

  const areas = useQuery(api.lifeAreas.list);
  const lookups = useStable(useQuery(api.tasks.lookups, { date: today }));
  const tasks = useQuery(api.tasks.list, {});
  const week = useStable(useQuery(api.focus.week, weekArgs));
  const hours = useStable(useQuery(api.weekPlans.hoursByArea, { weekStart, tz }));
  const totals = useQuery(api.focus.taskTotals);
  const sessions = useQuery(api.focus.list);
  const { data: cockpit } = useCockpit();
  const logManual = useMutation(api.focus.logManual);
  const removeSession = useMutation(api.focus.remove);
  const setKind = useMutation(api.focus.setBlockType);

  // The running timer lives in a global provider so it persists across pages
  // and is mirrored in the Topbar.
  const timer = useFocusTimer();
  const { type, mode, workMin, breakMin, running, taskId, projectId, areaId, blockType } = timer;

  function pickTask(id: string) {
    const t = tasks?.find((x) => x._id === id);
    timer.attribute({
      taskId: id,
      areaId: t?.lifeAreaId ?? "",
      projectId: t?.projectId ?? "",
      taskTitle: t?.title ?? "",
      ...(t && kindOfEnergy(t.energy) ? { blockType: kindOfEnergy(t.energy) } : {}),
    });
  }

  function startOn(t: Doc<"tasks">) {
    timer.startFocus({
      type,
      taskId: t._id,
      areaId: t.lifeAreaId,
      projectId: t.projectId ?? "",
      taskTitle: t.title,
      blockType: kindOfEnergy(t.energy),
    });
    toast(`Focusing on “${t.title}”`, { tone: "info" });
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
  const pct = type === "stopwatch" ? ((timer.elapsed % 60) / 60) * 100 : timer.total > 0 ? ((timer.total - timer.left) / timer.total) * 100 : 0;
  const openTasks = (tasks ?? []).filter((t) => t.status !== "done").sort((a, b) => PRANK[a.priority] - PRANK[b.priority]);
  const projects = (lookups?.projects ?? []).filter((p) => p.status !== "completed" || p._id === projectId);
  const liveAreas = (areas ?? []).filter((a) => !a.archived).sort((a, b) => a.order - b.order);

  // Today's plan: Top 3 first, then planned + time-blocked tasks.
  const planRows = useMemo(() => {
    if (!cockpit) return undefined;
    const top = cockpit.top3.map((t) => ({ t, top: true }));
    const rest = [...cockpit.planned, ...cockpit.scheduledToday].filter((t) => t.status !== "done").map((t) => ({ t, top: false }));
    return [...top, ...rest];
  }, [cockpit]);
  const areaById = useMemo(() => new Map(liveAreas.map((a, i) => [a._id as string, { a, i }])), [liveAreas]);

  const deepShare = week && week.weekSec > 0 ? Math.round((week.makerSec / week.weekSec) * 100) : null;
  const chartData = (week?.days ?? []).map((d) => ({
    label: d.label,
    segments: [
      { name: "Deep", value: d.makerH, color: "var(--chart-1)" },
      { name: "Shallow", value: d.managerH, color: "var(--chart-3)" },
      { name: "Unmarked", value: d.otherH, color: "var(--muted-foreground)" },
    ],
    items: d.items,
  }));

  return (
    <PageShell
      title="Focus"
      icon={Timer}
      subtitle="Deep work on what matters. Start from today’s plan — every session counts toward your Life Area hours."
      actions={
        <>
          <Link href="/week" className={buttonVariants({ variant: "outline" })}>
            <CalendarDays /> Week
          </Link>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            <LayoutDashboard /> Analytics
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Timer */}
        <Section className="lg:col-span-1">
          <Segmented
            className="mb-4 w-full"
            options={[
              { value: "pomodoro" as const, label: "Pomodoro", icon: Timer },
              { value: "stopwatch" as const, label: "Stopwatch", icon: Clock },
            ]}
            value={type}
            onChange={(t) => timer.switchType(t)}
          />

          {type === "pomodoro" && (
            <div className="mb-2 flex justify-center gap-2">
              {(["focus", "break"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => timer.setMode(m)}
                  className={cn(
                    "rounded-md px-4 py-1 text-xs font-medium capitalize transition-colors",
                    mode === m ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* dial */}
          <div className="relative mx-auto my-3 flex h-44 w-44 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="45" className="fill-none stroke-muted" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="45"
                className={cn("fill-none transition-[stroke-dashoffset] duration-500", mode === "break" && type === "pomodoro" ? "stroke-success" : "stroke-primary")}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={(2 * Math.PI * 45 * (100 - pct)) / 100}
              />
            </svg>
            <div className="text-center">
              <div className="text-4xl font-semibold tabular-nums">{fmt(display)}</div>
              <div className="text-xs uppercase text-muted-foreground">{type === "stopwatch" ? "elapsed" : mode}</div>
            </div>
          </div>
          {timer.taskTitle && <p className="-mt-1 mb-2 truncate text-center text-sm text-muted-foreground">{timer.taskTitle}</p>}

          <div className="mt-2 flex justify-center gap-2">
            <button onClick={timer.toggle} className={buttonVariants({ size: "lg" })}>
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? "Pause" : "Start"}
            </button>
            <button onClick={timer.stopAndLog} title="Stop & log focused time" aria-label="Stop and log" className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-10")}>
              <RotateCcw className="h-4 w-4" />
            </button>
            {type === "pomodoro" && mode === "break" && (
              <button onClick={timer.skipBreak} aria-label="Skip break" className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-10")}>
                <SkipForward className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Deep vs shallow (Paul Graham's maker / manager split) */}
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">This session is…</p>
            <Segmented className="w-full" size="sm" options={BLOCK_OPTIONS} value={blockType} onChange={timer.setBlockType} />
            <p className="mt-1.5 text-[11px] text-muted-foreground">Deep = maker work (build, write, deliver). Shallow = manager work (calls, email, admin).</p>
          </div>

          {/* settings + attribution */}
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            {type === "pomodoro" && (
              <div className="flex items-center gap-2 text-sm">
                <span className="w-14 text-muted-foreground">Focus</span>
                <input
                  type="number"
                  min={1}
                  value={workMin}
                  onChange={(e) => timer.setWorkMin(Math.max(1, Number(e.target.value)))}
                  className={cn(inputClass, "h-8 w-16")}
                  aria-label="Focus minutes"
                />
                <span className="w-12 text-muted-foreground">Break</span>
                <input
                  type="number"
                  min={1}
                  value={breakMin}
                  onChange={(e) => timer.setBreakMin(Math.max(1, Number(e.target.value)))}
                  className={cn(inputClass, "h-8 w-16")}
                  aria-label="Break minutes"
                />
              </div>
            )}
            <Select value={taskId} onChange={(e) => pickTask(e.target.value)} aria-label="Attribute to a task">
              <option value="">Attribute to a task…</option>
              {openTasks.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </Select>
            <Select
              value={projectId}
              onChange={(e) => {
                const pa = projects.find((p) => p._id === e.target.value)?.lifeAreaId;
                timer.attribute({ projectId: e.target.value, areaId: pa ?? areaId });
              }}
              aria-label="Project"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </Select>
            <Select value={areaId} onChange={(e) => timer.attribute({ areaId: e.target.value })} aria-label="Life area">
              <option value="">Life area…</option>
              {liveAreas.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
        </Section>

        <div className="space-y-4 lg:col-span-2">
          {/* Numbers */}
          <Section>
            {week === undefined ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="skeleton h-12" />
                <div className="skeleton h-12" />
                <div className="skeleton h-12" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <Metric label="Today" value={`${hrs(week.todaySec)}h`} />
                <Metric label="This week" value={`${hrs(week.weekSec)}h`} sub="Mon – Sun" />
                <Metric
                  label="Deep share"
                  value={deepShare == null ? "—" : `${deepShare}%`}
                  sub={week.weekSec > 0 ? `${hrs(week.makerSec)}h deep · ${hrs(week.managerSec)}h shallow` : "Mark sessions deep or shallow"}
                  tone={deepShare != null && deepShare >= 50 ? "success" : undefined}
                />
              </div>
            )}
          </Section>

          {/* Start from today's plan */}
          <Section
            title="Start from today’s plan"
            icon={Sun}
            hint="Your Top 3 first, then everything planned for today."
            action={
              <Link href="/tasks?view=today" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Plan <ArrowRight />
              </Link>
            }
          >
            {planRows === undefined ? (
              <div className="space-y-2">
                <div className="skeleton h-11" />
                <div className="skeleton h-11" />
                <div className="skeleton h-11" />
              </div>
            ) : planRows.length === 0 ? (
              <EmptyHint
                icon={Sun}
                title="Nothing planned for today"
                hint="Pick your Top 3 on Today — then start a deep-work session on the first one here."
                action={
                  <Link href="/today" className={buttonVariants({ size: "sm" })}>
                    Choose Top 3
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {planRows.map(({ t, top }) => {
                  const done = t.status === "done";
                  const isRunning = timer.active && timer.taskId === t._id;
                  const ar = areaById.get(t.lifeAreaId);
                  return (
                    <li key={t._id} className="flex items-center gap-3 py-2">
                      <span className="flex size-6 shrink-0 items-center justify-center">
                        {top ? <Star className={cn("h-4 w-4", done ? "text-muted-foreground" : "fill-current")} aria-label="Top 3" /> : <span className="size-2 rounded-full" style={{ background: areaColor(ar?.a, ar?.i ?? 0) }} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>{t.title}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          {ar && <span className="text-[11px] text-muted-foreground">{ar.a.name}</span>}
                          {t.estimateMin != null && <Chip className="h-4 px-1.5 text-[10px]">{fmtMin(t.estimateMin)}</Chip>}
                          {t.energy === "high" && <Chip className="h-4 px-1.5 text-[10px]">Deep</Chip>}
                          {t.energy === "low" && <Chip className="h-4 px-1.5 text-[10px]">Light</Chip>}
                        </div>
                      </div>
                      {!done &&
                        (isRunning ? (
                          <button onClick={timer.toggle} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                            {running ? <Pause /> : <Play />} {running ? fmt(display) : "Resume"}
                          </button>
                        ) : (
                          <button onClick={() => startOn(t)} className={buttonVariants({ variant: top ? "default" : "outline", size: "sm" })}>
                            <Play /> Focus
                          </button>
                        ))}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          {/* Hours by Life Area vs target */}
          <Section
            title="Hours by Life Area — this week"
            icon={Layers}
            hint="Focus sessions + finished calendar blocks, against each area’s weekly target."
            action={
              <Link href="/life-areas" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Targets <ArrowRight />
              </Link>
            }
          >
            {hours === undefined ? (
              <div className="space-y-3">
                <div className="skeleton h-8" />
                <div className="skeleton h-8" />
                <div className="skeleton h-8" />
              </div>
            ) : hours.rows.length === 0 ? (
              <EmptyHint icon={Layers} title="No Life Areas yet" hint="Areas are the spine — create them to see time by area." action={<Link href="/life-areas" className={buttonVariants({ size: "sm" })}>Set up areas</Link>} />
            ) : (
              <div className="space-y-3">
                {hours.rows.map((r, i) => (
                  <div key={r.areaId}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      {r.areaId === "none" ? (
                        <span className="truncate text-muted-foreground">{r.name}</span>
                      ) : (
                        <Link href={`/life-areas/${r.areaId}`} className="truncate hover:underline">
                          {r.name}
                        </Link>
                      )}
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        <b className="text-foreground">{r.actualH}h</b>
                        {r.targetH > 0 ? ` / ${r.targetH}h` : ""}
                        {r.plannedH > 0 && <span className="hidden sm:inline"> · {r.plannedH}h planned</span>}
                      </span>
                    </div>
                    <BulletBar actual={r.actualH} target={r.targetH} planned={r.plannedH} color={areaColor(r, i)} />
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">Bar = done · light = planned · tick = target.</p>
              </div>
            )}
          </Section>

          {/* Deep vs shallow by day */}
          <Section title="This week — deep vs shallow" icon={Brain}>
            {week === undefined ? <div className="skeleton h-[230px]" /> : <BarChart data={chartData} unit="h" />}
          </Section>

          {/* Time per task */}
          <Section title="Time per task" icon={Clock} hint="All time, top 8.">
            {totals === undefined ? (
              <div className="space-y-2">
                <div className="skeleton h-5" />
                <div className="skeleton h-5" />
              </div>
            ) : totals.tasks.length > 0 ? (
              <div className="space-y-2">
                {totals.tasks.slice(0, 8).map((t) => {
                  const max = totals.tasks[0].seconds || 1;
                  return (
                    <div key={t.id} className="flex items-center gap-3">
                      <span className="w-32 truncate text-sm sm:w-44">{t.title}</span>
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
              <p className="text-sm text-muted-foreground">Run a timer with a task attached to see time per task.</p>
            )}
          </Section>
        </div>
      </div>

      {/* Manual + activity history */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ManualEntry
          areas={liveAreas}
          onLog={(a) =>
            void logManual(a)
              .then(() => toast("Time logged", { tone: "success" }))
              .catch((e) => toast(errorMessage(e), { tone: "warning" }))
          }
        />
        <Section title="Activity history" hint="Tap the tag to mark a session deep or shallow.">
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {sessions === undefined && (
              <>
                <div className="skeleton h-9" />
                <div className="skeleton h-9" />
              </>
            )}
            {sessions?.length === 0 && <p className="text-sm text-muted-foreground">No sessions yet.</p>}
            {sessions?.map((s) => {
              const label =
                tasks?.find((t) => t._id === s.taskId)?.title ??
                lookups?.projects.find((p) => p._id === s.projectId)?.title ??
                areas?.find((a) => a._id === s.lifeAreaId)?.name ??
                "Focus";
              const next = s.blockType === "maker" ? "manager" : s.blockType === "manager" ? null : "maker";
              return (
                <div key={s._id} className="group flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm sm:gap-3">
                  <span className="w-10 shrink-0 font-medium tabular-nums">{Math.round(s.duration / 60)}m</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{label}</span>
                  <button
                    onClick={() => void setKind({ id: s._id, blockType: next }).catch((e) => toast(errorMessage(e), { tone: "warning" }))}
                    title="Cycle: deep → shallow → unmarked"
                    className={cn(
                      "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                      s.blockType === "maker" ? "bg-primary text-primary-foreground" : s.blockType === "manager" ? "bg-secondary text-secondary-foreground" : "border border-dashed border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s.blockType === "maker" ? "Deep" : s.blockType === "manager" ? "Shallow" : "Tag"}
                  </button>
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                    {new Date(s.endTime).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                  <button
                    onClick={() => void removeSession({ id: s._id }).catch((e) => toast(errorMessage(e), { tone: "warning" }))}
                    aria-label="Delete session"
                    className="shrink-0 text-muted-foreground transition hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </PageShell>
  );
}

/** Bullet bar: done (area colour), planned (faint), target (tick). */
function BulletBar({ actual, target, planned, color }: { actual: number; target: number; planned: number; color: string }) {
  const max = Math.max(target, actual, planned, 1) * 1.12;
  const w = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
  return (
    <div className="relative h-2.5 w-full">
      <div className="absolute inset-0 overflow-hidden rounded-full bg-muted">
        {planned > 0 && <div className="absolute inset-y-0 left-0 rounded-full bg-foreground/10" style={{ width: w(planned) }} />}
        <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700" style={{ width: w(actual), background: color }} />
      </div>
      {target > 0 && <div className="absolute -inset-y-1 w-0.5 rounded bg-foreground" style={{ left: w(target) }} aria-hidden />}
    </div>
  );
}

function ManualEntry({
  areas,
  onLog,
}: {
  areas: { _id: Id<"lifeAreas">; name: string }[];
  onLog: (v: { durationMinutes: number; lifeAreaId?: Id<"lifeAreas">; date?: number; blockType?: "maker" | "manager" }) => void;
}) {
  const today = useToday();
  const [min, setMin] = useState(30);
  const [areaId, setAreaId] = useState("");
  const [date, setDate] = useState(today);
  const [kind, setKind] = useState<BlockType>("");

  return (
    <Section title="Log time manually" hint="Forgot the timer? Add it here — it counts toward area hours.">
      <div className="flex flex-wrap items-center gap-2">
        <input type="number" min={1} value={min} onChange={(e) => setMin(Number(e.target.value))} className={cn(inputClass, "h-9 w-20")} aria-label="Minutes" />
        <span className="text-sm text-muted-foreground">min</span>
        <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className={cn(inputClass, "h-9")} aria-label="Life area">
          <option value="">Life area…</option>
          {areas.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value as BlockType)} className={cn(inputClass, "h-9")} aria-label="Deep or shallow">
          <option value="">Unmarked</option>
          <option value="maker">Deep</option>
          <option value="manager">Shallow</option>
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(inputClass, "h-9")} aria-label="Date" />
        <button
          onClick={() =>
            onLog({
              durationMinutes: Math.max(1, Number.isFinite(min) ? min : 0),
              lifeAreaId: areaId ? (areaId as Id<"lifeAreas">) : undefined,
              // Today (or no date) → ends now, never in the future; past days → midday.
              date: !date || date >= today ? undefined : new Date(date + "T12:00:00").getTime(),
              blockType: kind || undefined,
            })
          }
          disabled={!Number.isFinite(min) || min < 1}
          className={buttonVariants()}
        >
          <Plus className="h-4 w-4" /> Log
        </button>
      </div>
    </Section>
  );
}
