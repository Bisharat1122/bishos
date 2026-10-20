"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Sun, Moon, Flame, Shield, Sparkles, Plus, Inbox, Handshake, Kanban, Clapperboard, Brain, CalendarRange, Target,
  ArrowUpRight, ListChecks, AlertTriangle, Check, Clock, Trophy, BatteryLow, Wand2, Rocket, PhoneCall, CornerDownLeft,
  Timer, Star, ChevronRight, ClipboardCheck,
} from "lucide-react";
import { Topbar } from "@/components/ui";
import {
  cn, buttonVariants, inputClass, Section, Ring, Bar, Chip, CheckCircle, AreaDot, areaColor, EmptyHint, Metric, Kbd,
} from "@/components/os/kit";
import { reward, celebrate, toast, errorMessage } from "@/components/os/celebrate";
import { useCockpit, useStable } from "@/components/os/useCockpit";
import { TaskRow } from "@/components/today/TaskRow";
import { HabitStrip, ChallengesToday } from "@/components/today/HabitStrip";
import { SetupDialog } from "@/components/today/SetupDialog";
import { TrophyCase } from "@/components/os/Achievements";
import { MoneyTodayCard } from "@/components/finance/CashRunwayTile";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { parseQuickTask } from "@/lib/parse";
import { addDaysYmd, clockLabel, fmtMin, fmtYmd, greeting, relDay, useNowMin } from "@/lib/day";
import { openCapture, openRitual } from "@/lib/osEvents";
import { patchTaskStatus } from "@/components/os/optimistic";

export default function TodayPage() {
  return (
    <Suspense fallback={null}>
      <Today />
    </Suspense>
  );
}

function Today() {
  const router = useRouter();
  const params = useSearchParams();
  const { args, data } = useCockpit();
  const onboarding = useQuery(api.onboarding.status);
  // Optimistic: the check mark flips on click, not after the round-trip.
  const toggleTop = useMutation(api.days.toggleTop).withOptimisticUpdate((store, { taskId }) =>
    patchTaskStatus(store, taskId, (cur) => (cur === "done" ? "not_started" : "done")),
  );
  const setStatus = useMutation(api.tasks.setStatus).withOptimisticUpdate((store, { id, status }) => patchTaskStatus(store, id, status));
  const updateTask = useMutation(api.tasks.update);
  const createTask = useMutation(api.tasks.create);
  const setTop3 = useMutation(api.days.setTop3);
  const plan = useMutation(api.tasks.plan);
  const setCommitment = useMutation(api.commitments.setStatus);
  const toggleBig3 = useMutation(api.weekPlans.toggleBig3);
  const execution = useQuery(api.tactics.execution, { weekStart: args.weekStart, today: args.date });
  // Kallaway 60-day lab line on the Content tile.
  const contentLab = useStable(useQuery(api.content.today, { date: args.date }))?.lab ?? null;

  const [openTask, setOpenTask] = useState<Id<"tasks"> | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [trophies, setTrophies] = useState(false);
  const [quick, setQuick] = useState("");
  const nowMin = useNowMin();

  useEffect(() => {
    if (params.get("setup") === "1") setSetupOpen(true);
  }, [params]);

  const areaById = useMemo(() => new Map((data?.areas ?? []).map((a) => [a._id as string, a])), [data?.areas]);

  if (data === undefined) return <TodaySkeleton />;

  const { day } = data;
  const top3 = data.top3;
  const topDone = top3.filter((t) => t.status === "done").length;
  const hour = new Date().getHours();
  const evening = hour >= 16;
  const shutdownDone = !!day?.shutdownAt;
  const startupDone = !!day?.startupAt;
  const listTasks: Doc<"tasks">[] = [...data.planned, ...data.scheduledToday, ...data.dueToday];
  const openList = listTasks.filter((t) => t.status !== "done");
  const doneList = listTasks.filter((t) => t.status === "done");

  // Every Today write reports failures instead of failing silently.
  const safe = (p: Promise<unknown>) => p.catch((e) => toast(errorMessage(e, "Couldn't save"), { tone: "warning" }));

  const onToggleTask = async (t: Doc<"tasks">) => {
    const isTop = top3.some((x) => x._id === t._id);
    try {
      if (isTop) {
        const r = await toggleTop({ date: args.date, taskId: t._id });
        if (r.done && r.allTopDone) {
          celebrate(1.4);
          reward("All Top priorities done. That's a winning day 🏆", 15);
        } else if (r.done) toast("Top priority done", { tone: "success", xp: 20 });
      } else {
        const done = t.status !== "done";
        await setStatus({ id: t._id, status: done ? "done" : "not_started", date: args.date });
        if (done) toast("Done", { tone: "success", xp: 5 });
      }
    } catch (e) {
      toast(errorMessage(e, "Couldn't update the task"), { tone: "warning" });
    }
  };

  const onQuickAdd = async () => {
    const p = parseQuickTask(quick, data.areas);
    if (!p.title) return;
    const area = (p.areaId ?? data.areas[0]?._id) as Id<"lifeAreas"> | undefined;
    if (!area) {
      setSetupOpen(true);
      return;
    }
    try {
      await createTask({
        title: p.title,
        priority: p.priority ?? "med",
        lifeAreaId: area,
        plannedFor: p.plannedFor ?? (p.someday ? undefined : args.date),
        someday: p.someday,
        estimateMin: p.estimateMin,
      });
    } catch (e) {
      toast(errorMessage(e, "Couldn't add the task"), { tone: "warning" });
      return;
    }
    setQuick("");
    toast(p.plannedFor && p.plannedFor !== args.date ? `Added for ${relDay(p.plannedFor, args.date)}` : "Added to today", { tone: "success" });
  };

  const makeTop = async (t: Doc<"tasks">) => {
    const ids = top3.map((x) => x._id);
    const next = ids.includes(t._id) ? ids.filter((x) => x !== t._id) : [...ids, t._id];
    await safe(setTop3({ date: args.date, taskIds: next }));
  };

  const capPct = data.capacity.capacityMin ? Math.round(((data.capacity.plannedMin + data.capacity.meetingMin) / data.capacity.capacityMin) * 100) : 0;
  const lvl = data.game.level;
  const showSetup = data.needsSetup || (onboarding && onboarding.doneCount < onboarding.steps.length && !onboarding.onboarded);

  return (
    <div>
      <Topbar />
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="os-rise overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{fmtYmd(data.date, { weekday: "long", month: "long", day: "numeric" })}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {greeting()}
                {data.name ? `, ${data.name}` : ""}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {data.cycle && (
                  <Link href="/goals">
                    <Chip tone="sprint">
                      <Target /> Week {Math.min(12, data.cycle.week)}/12{data.cycle.theme ? ` · ${data.cycle.theme}` : ""}
                    </Chip>
                  </Link>
                )}
                {day?.dayType && <Chip tone="secondary">{day.dayType === "focus" ? "Focus day" : day.dayType === "buffer" ? "Buffer day" : "Free day"}</Chip>}
                {day?.lowEnergy && (
                  <Chip tone="info">
                    <BatteryLow /> Low-energy mode
                  </Chip>
                )}
                {day?.checkIn?.energy && <Chip tone="outline">Energy {day.checkIn.energy}/5</Chip>}
              </div>
              {day?.intention && <p className="mt-3 text-base font-medium">“{day.intention}”</p>}
              {day?.ifThen && (
                <p className="mt-2 text-sm text-muted-foreground">
                  <b className="text-foreground">If</b> {day.ifThen.trigger}, <b className="text-foreground">then</b> {day.ifThen.response}.
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {!startupDone ? (
                  <button onClick={() => openRitual("startup")} className={cn(buttonVariants({ size: "lg" }), "daily-glow")}>
                    <Sun /> Start my day <span className="text-xs opacity-70">· 5 min</span>
                  </button>
                ) : !shutdownDone ? (
                  <button
                    onClick={() => openRitual("shutdown")}
                    className={cn(buttonVariants({ size: "lg", variant: evening ? "default" : "outline" }), evening && "daily-glow")}
                  >
                    <Moon /> Shutdown <span className="text-xs opacity-70">· 5 min</span>
                  </button>
                ) : (
                  <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-success-soft px-4 text-sm font-medium text-success">
                    <Check className="h-4 w-4" /> Day complete — enjoy your evening
                  </span>
                )}
                <button onClick={() => openCapture("dump")} className={buttonVariants({ variant: "outline", size: "lg" })}>
                  <Wand2 /> Brain dump
                </button>
                {startupDone && (
                  <button onClick={() => openRitual("startup")} className={buttonVariants({ variant: "ghost", size: "lg" })}>
                    Re-plan
                  </button>
                )}
              </div>
            </div>

            {/* Day score */}
            <div className="flex items-center gap-4 lg:flex-col lg:gap-2">
              <Ring value={data.dayScore} size={112} stroke={9} tone={data.dayScore >= 80 ? "success" : "primary"}>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-semibold tabular-nums leading-none">{data.dayScore}</span>
                  <span className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">day score</span>
                </div>
              </Ring>
              <div className="space-y-1 text-xs text-muted-foreground lg:text-center">
                <ScoreLine done={startupDone} label="Start-up" />
                <ScoreLine done={top3.length > 0 && topDone === top3.length} label={`Top ${topDone}/${top3.length || 3}`} />
                <ScoreLine done={shutdownDone} label="Shutdown" />
              </div>
            </div>

            {/* Level + streak */}
            <div className="w-full rounded-xl border border-border bg-muted/40 p-4 lg:w-64">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Level {lvl.level}</p>
                  <p className="text-lg font-semibold">{lvl.title}</p>
                </div>
                <button onClick={() => setTrophies(true)} className="rounded-lg p-1.5 text-warning transition hover:bg-accent" title="Achievements" aria-label="Achievements">
                  <Trophy className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="os-shine h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${lvl.pct}%` }} />
              </div>
              <p className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                <span className="tabular-nums">
                  {lvl.into}/{lvl.span} XP
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> +{data.game.todayXp} today
                </span>
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Flame className="h-4 w-4 text-warning" /> {data.game.streak.streak}
                  <span className="text-xs font-normal text-muted-foreground">day streak</span>
                </span>
                <span className="flex items-center gap-0.5" title="Reserve shields: missed days that won't break your streak this week">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Shield key={i} className={cn("h-4 w-4", i < data.game.streak.shieldsLeft ? "text-info" : "text-muted-foreground/30")} />
                  ))}
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-1" aria-label="XP this week">
                {data.game.week.map((d) => {
                  const max = Math.max(50, ...data.game.week.map((x) => x.xp));
                  return (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ${d.xp} XP`}>
                      <div className="flex h-8 w-full items-end">
                        <div className={cn("w-full rounded-sm", d.date === data.date ? "bg-primary" : "bg-primary/30")} style={{ height: `${Math.max(6, (d.xp / max) * 100)}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{fmtYmd(d.date, { weekday: "narrow" })}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Banners ─────────────────────────────────────────────────── */}
        {data.freshStart && !startupDone && (
          <div className="os-rise mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-info/30 bg-info-soft px-4 py-3 text-sm text-info">
            <Rocket className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              <b>Welcome back.</b> {data.freshStart.daysAway} days away is normal. Start fresh: the start-up ritual helps you decide what still matters in 5 minutes.
            </span>
            <button onClick={() => openRitual("startup")} className={buttonVariants({ size: "sm" })}>
              Fresh start
            </button>
          </div>
        )}
        {showSetup && onboarding && (
          <div className="os-rise mt-4 rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-3">
              <Ring value={(onboarding.doneCount / onboarding.steps.length) * 100} size={40} stroke={4}>
                <span className="text-[10px] font-semibold">
                  {onboarding.doneCount}/{onboarding.steps.length}
                </span>
              </Ring>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Set up your Life OS</p>
                <p className="text-xs text-muted-foreground">Nine small steps. Each one makes the daily check-in smarter.</p>
              </div>
              <button onClick={() => setSetupOpen(true)} className={buttonVariants({ size: "sm" })}>
                {data.areas.length ? "Continue setup" : "Start setup"} <ChevronRight />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {onboarding.steps.map((s) => (
                <Link key={s.key} href={s.key === "areas" ? "/today?setup=1" : s.href}>
                  <Chip tone={s.done ? "success" : "outline"}>
                    {s.done ? <Check /> : null} {s.label}
                  </Chip>
                </Link>
              ))}
            </div>
          </div>
        )}
        {(() => {
          const wd = new Date().getDay();
          const monthStart = data.date.endsWith("-01");
          const cycleEnding = data.cycle && data.cycle.week >= 12;
          if (!data.week.reviewed && wd === data.settings.reviewWeekday)
            return (
              <ReviewBanner href="/reviews/weekly" title="It's weekly review day" sub="The review is the heart of the system — 60 min, or 20 in minimum mode. +120 XP." />
            );
          if (monthStart) return <ReviewBanner href="/reviews/monthly" title="New month, fresh start" sub="Re-rate your Life Areas and tune habits — 30 minutes. +150 XP." />;
          if (cycleEnding) return <ReviewBanner href="/reviews/quarterly" title="Your 12-week cycle is ending" sub="Grade your goals and set the next three. +300 XP." />;
          return null;
        })()}
        {data.leftovers.length > 0 && startupDone && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              {data.leftovers.length} task{data.leftovers.length === 1 ? "" : "s"} from earlier days still need a decision.
            </span>
            <button onClick={() => void safe(plan({ ids: data.leftovers.map((t) => t._id), plannedFor: args.date }))} className={buttonVariants({ variant: "outline", size: "sm" })}>
              All to today
            </button>
            <button onClick={() => void safe(plan({ ids: data.leftovers.map((t) => t._id), plannedFor: null }))} className={buttonVariants({ variant: "outline", size: "sm" })}>
              All to backlog
            </button>
          </div>
        )}

        {/* ── Main grid ───────────────────────────────────────────────── */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {/* Top priorities */}
            <Section
              title={day?.lowEnergy ? "Your one thing" : "Top priorities"}
              icon={Star}
              hint={top3.length ? `${topDone} of ${top3.length} done · +15 XP each` : "The few things that make today a win."}
              action={
                top3.length > 0 && (
                  <Ring value={(topDone / top3.length) * 100} size={36} stroke={4} tone="success">
                    <span className="text-[10px] font-semibold">{topDone}</span>
                  </Ring>
                )
              }
            >
              {top3.length === 0 ? (
                <EmptyHint
                  icon={Star}
                  title="No priorities picked yet"
                  hint="Run the 5-minute start-up to pick your Top 3 and check that the day fits."
                  action={
                    <button onClick={() => openRitual("startup")} className={buttonVariants({ size: "sm" })}>
                      <Sun /> Start my day
                    </button>
                  }
                />
              ) : (
                <div className="space-y-2">
                  {top3.map((t, i) => (
                    <TaskRow
                      key={t._id}
                      task={t}
                      rank={i + 1}
                      areaColor={areaColor(areaById.get(t.lifeAreaId))}
                      areaName={areaById.get(t.lifeAreaId)?.name}
                      onToggle={() => void onToggleTask(t)}
                      onOpen={setOpenTask}
                      onTop={() => void makeTop(t)}
                      isTop
                      dayStart={args.dayStart}
                    />
                  ))}
                </div>
              )}
            </Section>

            <HabitStrip habits={data.habits} date={args.date} lowEnergy={day?.lowEnergy} />

            {/* Today list */}
            <Section
              title="Today"
              icon={ListChecks}
              hint={
                <span className="inline-flex items-center gap-2">
                  {fmtMin(data.capacity.plannedMin + data.capacity.meetingMin)} planned of {fmtMin(data.capacity.capacityMin)}
                  {data.capacity.over > 0 && <span className="text-warning">· {fmtMin(data.capacity.over)} over capacity</span>}
                </span>
              }
              action={<span className="text-xs tabular-nums text-muted-foreground">{data.doneTodayCount} done</span>}
            >
              <Bar value={Math.min(100, capPct)} tone={capPct > 100 ? "warning" : "primary"} className="mb-3" />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void onQuickAdd();
                }}
                className="mb-2 flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Plus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={quick}
                    onChange={(e) => setQuick(e.target.value)}
                    placeholder="Add to today…  try: Follow up Sara fri #sales ~15m"
                    className={cn(inputClass, "h-10 w-full pl-9")}
                  />
                </div>
                {quick && (
                  <button className={buttonVariants({ size: "sm" })}>
                    <CornerDownLeft />
                  </button>
                )}
              </form>
              {openList.length === 0 && doneList.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">Nothing else planned. Protect the space — or pull something in from Tasks.</p>
              ) : (
                <div className="space-y-0.5">
                  {openList.map((t) => (
                    <TaskRow
                      key={t._id}
                      task={t}
                      areaColor={areaColor(areaById.get(t.lifeAreaId))}
                      areaName={areaById.get(t.lifeAreaId)?.name}
                      onToggle={() => void onToggleTask(t)}
                      onOpen={setOpenTask}
                      onTomorrow={() => void safe(updateTask({ id: t._id, plannedFor: addDaysYmd(args.date, 1) }))}
                      onUnplan={() => void safe(updateTask({ id: t._id, plannedFor: null }))}
                      onTop={() => void makeTop(t)}
                      dayStart={args.dayStart}
                    />
                  ))}
                  {doneList.length > 0 && (
                    <details className="pt-2">
                      <summary className="cursor-pointer px-2 text-xs text-muted-foreground">{doneList.length} completed</summary>
                      <div className="mt-1 space-y-0.5">
                        {doneList.map((t) => (
                          <TaskRow key={t._id} task={t} compact onToggle={() => void onToggleTask(t)} onOpen={setOpenTask} dayStart={args.dayStart} />
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
              {data.overdue.count > 0 && (
                <div className="mt-3 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
                  {data.overdue.count} overdue deadline{data.overdue.count === 1 ? "" : "s"}:{" "}
                  {data.overdue.top.slice(0, 3).map((t, i) => (
                    <button key={t._id} onClick={() => setOpenTask(t._id)} className="font-medium underline-offset-2 hover:underline">
                      {i ? ", " : ""}
                      {t.title}
                    </button>
                  ))}
                </div>
              )}
            </Section>

            {/* Timeline */}
            <Section
              title="Timeline"
              icon={CalendarRange}
              action={
                <Link href="/schedule" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  Calendar <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {data.blocks.length === 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>No time blocks today. Maker mornings, calls in the afternoon.</span>
                  <div className="flex gap-2">
                    <Link href="/week" className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Apply Ideal Week
                    </Link>
                    <Link href="/schedule" className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <Plus /> Block time
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="relative space-y-1.5">
                  {data.blocks.map((b) => {
                    const nowIn = nowMin >= b.startMin && nowMin < b.endMin;
                    const past = nowMin >= b.endMin;
                    return (
                      <div
                        key={b._id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                          nowIn ? "border-primary bg-primary/5" : "border-border",
                          (past || b.status !== "planned") && !nowIn && "opacity-60",
                        )}
                      >
                        <span className="w-24 shrink-0 text-xs tabular-nums text-muted-foreground">
                          {clockLabel(b.startMin)}–{clockLabel(b.endMin)}
                        </span>
                        <span
                          className={cn(
                            "h-6 w-1 shrink-0 rounded-full",
                            b.blockType === "maker" ? "bg-chart-1" : b.blockType === "manager" ? "bg-chart-2" : b.blockType === "free" ? "bg-chart-3" : "bg-muted-foreground/40",
                          )}
                        />
                        <span className={cn("min-w-0 flex-1 truncate", b.status === "done" && "os-done-text")}>{b.title}</span>
                        {b.blockType && <span className="hidden text-[10px] uppercase tracking-wide text-muted-foreground sm:inline">{b.blockType}</span>}
                        {nowIn && <Chip tone="default">now</Chip>}
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>

          {/* ── Right rail ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Week big 3 */}
            <Section
              title="This week"
              icon={Target}
              action={
                <Link href="/week" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  Week <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {execution && execution.score != null && (
                <Link href="/goals" className="mb-3 flex items-center gap-3 rounded-lg border border-border px-3 py-2 transition hover:bg-accent">
                  <Ring value={execution.score} size={40} stroke={4} tone={execution.score >= 85 ? "success" : execution.score >= 60 ? "primary" : "warning"}>
                    <span className="text-[10px] font-semibold tabular-nums">{execution.score}</span>
                  </Ring>
                  <span className="min-w-0 flex-1 text-xs">
                    <span className="block text-sm font-medium">Execution score</span>
                    <span className="text-muted-foreground">
                      {execution.achieved}/{execution.target} lead actions this week · aim for 85%
                    </span>
                  </span>
                </Link>
              )}
              {data.week.big3.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No Weekly Big 3 yet.{" "}
                  <Link href="/week" className="font-medium text-foreground underline-offset-2 hover:underline">
                    Set them →
                  </Link>
                </p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {data.week.big3.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle
                        checked={b.done}
                        size="sm"
                        onClick={async () => {
                          const r = await toggleBig3({ weekStart: args.weekStart, index: i, date: args.date }).catch((e) => {
                            toast(errorMessage(e, "Couldn't update"), { tone: "warning" });
                            return null;
                          });
                          if (!r) return;
                          if (r.allDone) {
                            celebrate(1.3);
                            reward("Weekly Big 3 complete. Huge week 🏆", r.xp || undefined);
                          } else if (r.done) toast("Weekly outcome done", { tone: "success", xp: r.xp || undefined });
                        }}
                      />
                      <span className={cn(b.done && "os-done-text")}>{b.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Quick tiles */}
            <div className="grid grid-cols-2 gap-3">
              <Tile href="/inbox" icon={Inbox} label="Inbox" value={data.inbox.open} warn={data.inbox.stale > 0} sub={data.inbox.stale ? `${data.inbox.stale} older than 48h` : data.inbox.open ? "to process" : "zero 🎉"} />
              <Tile href="/recall" icon={Brain} label="Recall" value={data.recallDue} sub={data.recallDue ? "cards due" : "all caught up"} />
              <Tile href="/focus" icon={Timer} label="Focus" value={fmtMin(data.focusMin)} sub="today" />
              <Tile
                href="/content"
                icon={Clapperboard}
                label="Content"
                value={`${data.content.publishedThisWeek}/${data.content.weeklyTarget}`}
                sub="hub pieces this week"
                extra={contentLab ? `Lab: ${contentLab.done}/${contentLab.target} reps this week` : undefined}
                extraDone={!!contentLab && contentLab.done >= contentLab.target}
              />
            </div>

            {/* Sales */}
            <Section
              title="Sales today"
              icon={Kanban}
              action={
                <Link href="/pipeline" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  Pipeline <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              <div className="flex items-center gap-4">
                <Ring value={(data.outreach.today / Math.max(1, data.outreach.quota)) * 100} size={56} stroke={6} tone={data.outreach.today >= data.outreach.quota ? "success" : "primary"}>
                  <span className="text-xs font-semibold tabular-nums">{data.outreach.today}</span>
                </Ring>
                <div className="flex-1 text-sm">
                  <p className="font-medium">
                    {data.outreach.today}/{data.outreach.quota} outreach touches
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.outreach.meetings >= data.outreach.meetingsGoal
                      ? "Meetings goal hit — you can stop prospecting today."
                      : `${data.outreach.meetings}/${data.outreach.meetingsGoal} conversations today`}
                  </p>
                </div>
              </div>
              {data.deals.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                  {data.deals.map((d) => (
                    <Link key={d._id} href={`/pipeline?deal=${d._id}`} className="flex items-start gap-2 rounded-md px-1 py-1 text-sm hover:bg-accent">
                      <PhoneCall className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{d.title}</span>
                        <span className={cn("block truncate text-xs", d.missing ? "text-danger" : "text-muted-foreground")}>
                          {d.missing ? "No next step — set one" : `${d.nextStep ?? "Next step"} · ${relDay(d.nextStepDate!, args.date)}`}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              {data.reconnect.length > 0 && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Due to reconnect</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {data.reconnect.map((p) => (
                      <Link key={p._id} href={`/people/${p._id}`}>
                        <Chip tone="outline">{p.name}</Chip>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* Commitments */}
            <Section
              title="Promises"
              icon={Handshake}
              action={
                <Link href="/commitments" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  All <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {data.commitments.iOwe.length === 0 && data.commitments.waiting.length === 0 ? (
                <p className="text-sm text-muted-foreground">No promises due. Keep it that way 🤝</p>
              ) : (
                <div className="space-y-1.5">
                  {data.commitments.iOwe.map((c) => (
                    <div key={c._id} className="flex items-center gap-2 text-sm">
                      <CheckCircle
                        checked={false}
                        size="sm"
                        onClick={async () => {
                          const r = await setCommitment({ id: c._id, status: "done", date: args.date }).catch((e) => {
                            toast(errorMessage(e, "Couldn't update"), { tone: "warning" });
                            return undefined;
                          });
                          if (r === undefined) return;
                          toast("Promise kept 🤝", { tone: "success", xp: (r as { xp?: number } | null)?.xp || undefined });
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate">{c.title}</span>
                      <span className={cn("shrink-0 text-xs", c.overdue ? "text-danger" : "text-muted-foreground")}>
                        {c.person ? `${c.person} · ` : ""}
                        {relDay(c.date, args.date)}
                      </span>
                    </div>
                  ))}
                  {data.commitments.waiting.length > 0 && (
                    <div className="border-t border-border pt-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Check on (waiting for)</p>
                      {data.commitments.waiting.map((c) => (
                        <p key={c._id} className="mt-1 flex items-center gap-2 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{c.title}</span>
                          {c.person && <span className="text-xs text-muted-foreground">{c.person}</span>}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* Active challenges */}
            <ChallengesToday date={args.date} />

            {/* Money: bills due + overdue invoices */}
            <MoneyTodayCard />

            {/* Content today */}
            {data.content.today.length > 0 && (
              <Section title="Content due" icon={Clapperboard}>
                <div className="space-y-1.5">
                  {data.content.today.map((c) => (
                    <Link key={c._id} href={`/content/${c._id}`} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-accent">
                      <Chip tone={c.brand === "personal" ? "sprint" : "info"}>{c.brand}</Chip>
                      <span className="min-w-0 flex-1 truncate">{c.title}</span>
                      <span className={cn("text-xs", c.overdue ? "text-danger" : "text-muted-foreground")}>{c.stage.replace(/_/g, " ")}</span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* Routines */}
            {data.routines.length > 0 && (
              <Section
                title="Routines"
                icon={ListChecks}
                action={
                  <Link href="/routines" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    Run <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                }
              >
                <div className="space-y-2">
                  {data.routines.map((r) => (
                    <Link key={r._id} href="/routines" className="flex items-center gap-3 rounded-md px-1 py-1 text-sm hover:bg-accent">
                      <span className={cn("flex size-5 items-center justify-center rounded-full border-2", r.completed ? "border-success bg-success text-background" : "border-muted-foreground/40")}>
                        {r.completed && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{r.name}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {r.doneSteps}/{r.steps}
                      </span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            <div className="flex items-center justify-center gap-2 py-2 text-[11px] text-muted-foreground">
              <Kbd>C</Kbd> capture · <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd> anything
            </div>
          </div>
        </div>
      </div>

      {openTask && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenTask(null)} />
          <div className="relative h-full w-full max-w-xl overflow-y-auto border-l border-border bg-card shadow-raised">
            <TaskDetailPanel id={openTask} onClose={() => setOpenTask(null)} />
          </div>
        </div>
      )}
      <TrophyCase open={trophies} onClose={() => setTrophies(false)} />
      <SetupDialog
        open={setupOpen}
        onClose={() => {
          setSetupOpen(false);
          if (params.get("setup")) router.replace("/today");
        }}
      />
    </div>
  );
}

function ReviewBanner({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link href={href} className="os-rise mt-4 flex items-center gap-3 rounded-xl border border-sprint/30 bg-sprint/10 px-4 py-3 text-sm transition hover:bg-sprint/15">
      <ClipboardCheck className="h-4 w-4 shrink-0 text-sprint" />
      <span className="flex-1">
        <b>{title}.</b> <span className="text-muted-foreground">{sub}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function ScoreLine({ done, label }: { done: boolean; label: string }) {
  return (
    <p className="flex items-center gap-1.5 lg:justify-center">
      <span className={cn("size-1.5 rounded-full", done ? "bg-success" : "bg-muted-foreground/30")} />
      <span className={cn(done && "text-foreground")}>{label}</span>
    </p>
  );
}

function Tile({ href, icon: I, label, value, sub, warn, extra, extraDone }: { href: string; icon: typeof Inbox; label: string; value: React.ReactNode; sub?: string; warn?: boolean; extra?: string; extraDone?: boolean }) {
  return (
    <Link href={href} className="group rounded-xl border border-border bg-card p-3 shadow-card transition hover:border-ring/60">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <I className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
      </div>
      <Metric label="" value={value} className="mt-1.5" tone={warn ? "warning" : undefined} />
      {sub && <p className={cn("-mt-1 truncate text-[11px]", warn ? "text-warning" : "text-muted-foreground")}>{sub}</p>}
      {extra && <p className={cn("mt-0.5 truncate text-[11px] font-medium", extraDone ? "text-success" : "text-foreground")}>{extra}</p>}
    </Link>
  );
}

function TodaySkeleton() {
  return (
    <div>
      <Topbar />
      <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="skeleton h-56 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="skeleton h-48" />
            <div className="skeleton h-24" />
            <div className="skeleton h-64" />
          </div>
          <div className="space-y-4">
            <div className="skeleton h-32" />
            <div className="skeleton h-40" />
            <div className="skeleton h-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
