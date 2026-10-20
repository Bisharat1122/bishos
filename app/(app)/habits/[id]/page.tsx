"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarCheck,
  Check,
  Feather,
  Flame,
  GraduationCap,
  Link2,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Rocket,
  RotateCcw,
  Shield,
  Sparkles,
  Target,
  Trash2,
  Trophy,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Topbar } from "@/components/ui";
import { DetailSkeleton } from "@/components/Skeleton";
import { AddToMomentum } from "@/components/momentum/AddToMomentum";
import { BarChart } from "@/components/Chart";
import { Chip, Dialog, EmptyHint, Metric, PageShell, Section, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { fmtYmd, useToday } from "@/lib/day";
import { HabitDialog } from "@/components/habits/HabitDialog";
import { HabitHeatmap, HeatLegend } from "@/components/habits/HabitHeatmap";
import { KindMenu, type KindPick } from "@/components/habits/KindMenu";
import { AutomaticityPrompt } from "@/components/habits/AutomaticityPrompt";
import { ConsistencyRing, Shields } from "@/components/habits/HabitCards";
import { KIND_LABEL, TIME_OF_DAY, errText, isDone } from "@/components/habits/util";

const MILESTONES = [30, 60, 90];

export default function HabitDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"habits">;
  const router = useRouter();
  const today = useToday();

  const data = useQuery(api.habits.detail, { id, today });
  const areas = useQuery(api.lifeAreas.list);
  const sections = useQuery(api.sections.list, {});
  const update = useMutation(api.habits.update);
  const log = useMutation(api.habits.log);
  const removeHabit = useMutation(api.habits.remove);

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cellMenu, setCellMenu] = useState<{ date: string; rect: DOMRect } | null>(null);
  const [todayMenu, setTodayMenu] = useState<DOMRect | null>(null);
  const [checkDay, setCheckDay] = useState<number | null>(null);

  if (data === undefined)
    return (
      <div>
        <Topbar />
        <DetailSkeleton />
      </div>
    );
  if (data === null)
    return (
      <PageShell title="Habit not found">
        <EmptyHint
          title="This habit doesn't exist anymore"
          hint="It may have been deleted. Your other habits are still waiting."
          action={
            <Link href="/habits" className={buttonVariants()}>
              Back to habits
            </Link>
          }
        />
      </PageShell>
    );

  const { habit, stats } = data;
  const areaName = areas?.find((a) => a._id === habit.lifeAreaId)?.name;
  const sectionName = sections?.find((s) => s._id === habit.sectionId)?.name;
  const kind = stats.kindToday;
  const done = isDone(kind);
  const monthData = data.monthly.map((m) => ({
    label: m.label,
    segments: [{ name: "Completions", value: m.count, color: "var(--chart-1)" }],
  }));
  const recordFor = (date: string) => data.records.find((r) => r.date === date) ?? null;
  const tod = TIME_OF_DAY.find((t) => t.value === (habit.timeOfDay ?? "any"));
  const autoByDay = new Map((habit.automaticity ?? []).map((a) => [a.day, a.score]));

  async function pick(k: KindPick, date = today) {
    try {
      const res = await log({ id, date, kind: k, today });
      if (k === "clear") return;
      const xp = res?.xp || undefined;
      if (k === "skip") toast("Shield used — streak protected", { tone: "info" });
      else if (res?.repaired) reward("Streak repaired", xp);
      else reward(k === "min" ? "2-minute version counts" : k === "stretch" ? "Stretch done!" : `${habit.title} ✓`, xp);
    } catch (e) {
      toast(errText(e), { tone: "warning" });
    }
  }

  async function setStatus(habitStatus: "active" | "queued" | "graduated") {
    try {
      await update({ id, habitStatus, today });
      toast(habitStatus === "graduated" ? "Graduated 🎓" : habitStatus === "queued" ? "Moved to the queue" : "Tracking daily", { tone: "success" });
    } catch (e) {
      toast(errText(e), { tone: "warning" });
    }
  }

  return (
    <PageShell
      title={habit.title}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/habits" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Habits
          </Link>
          <Link href={`/life-areas/${habit.lifeAreaId}`} className="inline-flex items-center gap-1 hover:text-foreground">
            {areaName}
            {sectionName ? ` · ${sectionName}` : ""}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </span>
      }
      actions={
        <>
          {data.status !== "active" && <Chip tone={data.status === "graduated" ? "success" : "info"} className="capitalize">{data.status}</Chip>}
          <AddToMomentum type="habit" itemId={id} title={habit.title} />
          <button onClick={() => setEditOpen(true)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Pencil /> Edit
          </button>
          <button onClick={() => setConfirmDelete(true)} aria-label="Delete habit" className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground hover:text-danger")}>
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Log today */}
        <div className={cn("flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-card sm:flex-row sm:items-center", done ? "border-success/40" : "border-border")}>
          <button
            onClick={() => void pick(done ? "clear" : "done")}
            className={cn(
              "flex items-center gap-3 rounded-xl text-left text-sm font-medium transition",
            )}
          >
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 transition-all",
                kind === "done" || kind === "stretch"
                  ? "os-pop border-success bg-success text-background"
                  : kind === "min"
                    ? "os-pop border-success/50 bg-success/45 text-foreground"
                    : kind === "skip"
                      ? "border-dashed border-info bg-info-soft text-info"
                      : "border-muted-foreground/30 hover:border-success hover:bg-success-soft",
              )}
            >
              {kind === "min" ? <Feather className="h-5 w-5" /> : kind === "stretch" ? <Rocket className="h-5 w-5" /> : kind === "skip" ? <Shield className="h-5 w-5" /> : <Check className={cn("h-5 w-5", !kind && "opacity-30")} strokeWidth={3} />}
            </span>
            <span>
              <span className="block">{kind ? `${KIND_LABEL[kind]} today${done ? " — nice." : ""}` : "Mark done for today"}</span>
              {habit.anchor && <span className="block text-xs font-normal text-muted-foreground">After I {habit.anchor}</span>}
            </span>
          </button>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {habit.minVersion && !done && (
              <button onClick={() => void pick("min")} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Feather /> 2-min: {habit.minVersion.length > 28 ? habit.minVersion.slice(0, 28) + "…" : habit.minVersion}
              </button>
            )}
            <button onClick={(e) => setTodayMenu(e.currentTarget.getBoundingClientRect())} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <MoreHorizontal /> More
            </button>
          </div>
        </div>

        {/* Stats — consistency first, streak second */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <ConsistencyRing value={stats.consistency} size={60} isNew={stats.possibleDays30 === 0} />
            <Metric label="Consistency" value={`${stats.consistency}%`} sub={`${stats.doneDays30} of last ${stats.possibleDays30} days`} />
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <Metric
              label="Forgiving streak"
              value={<span className="inline-flex items-center gap-1"><Flame className="h-5 w-5 text-warning" />{stats.streak}d</span>}
              sub={<Shields left={stats.shieldsLeft} total={stats.reserves} />}
            />
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <Metric label="Best streak" value={<span className="inline-flex items-center gap-1"><Trophy className="h-5 w-5 text-muted-foreground" />{data.bestStreak}d</span>} sub="lifetime record" />
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <Metric label="Total done" value={<span className="inline-flex items-center gap-1"><CalendarCheck className="h-5 w-5 text-muted-foreground" />{data.total}</span>} sub={`day ${stats.dayNumber} · ${stats.doneThisWeek}/${stats.target} this week`} />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-5">
            {/* Heatmap */}
            <Section title="Last 6 months" hint="Tap a day to log or repair it.">
              <HabitHeatmap
                records={data.records}
                today={today}
                weeks={26}
                start={stats.start}
                cell={14}
                onCell={(date, rect) => setCellMenu({ date, rect })}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <HeatLegend />
                <span className="text-[11px] text-muted-foreground">
                  All-time: <span className="font-medium text-foreground">{data.rateAll}%</span>
                </span>
              </div>
            </Section>

            {/* Monthly chart */}
            <Section title="Completions per month">
              <BarChart data={monthData} height={180} />
            </Section>
          </div>

          <div className="min-w-0 space-y-5">
            {/* Design */}
            <Section
              title="Habit design"
              icon={Sparkles}
              action={
                <button onClick={() => setEditOpen(true)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  <Pencil /> Edit
                </button>
              }
            >
              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Link2 className="h-3 w-3" /> If-then plan
                  </p>
                  {habit.anchor ? (
                    <p className="mt-1 font-medium">
                      After I {habit.anchor}, I will {habit.title.charAt(0).toLowerCase() + habit.title.slice(1)}.
                    </p>
                  ) : (
                    <button onClick={() => setEditOpen(true)} className="mt-1 text-left text-muted-foreground underline-offset-2 hover:underline">
                      Add a cue — habits anchored to an existing routine stick far better.
                    </button>
                  )}
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
                  <dt className="text-muted-foreground">2-min</dt>
                  <dd>{habit.minVersion || <span className="text-muted-foreground">—</span>}</dd>
                  <dt className="text-muted-foreground">Stretch</dt>
                  <dd>{habit.stretchVersion || <span className="text-muted-foreground">—</span>}</dd>
                  <dt className="text-muted-foreground">Target</dt>
                  <dd>
                    {stats.target === 7 ? "Every day" : `${stats.target}× a week`} · {stats.reserves} reserve skip{stats.reserves === 1 ? "" : "s"}
                    {habit.target ? ` · ${habit.target}` : ""}
                  </dd>
                  <dt className="text-muted-foreground">When</dt>
                  <dd>{tod?.label}</dd>
                  <dt className="text-muted-foreground">Goal</dt>
                  <dd>
                    {data.goalTitle && habit.goalId ? (
                      <Link href={`/goals/${habit.goalId}`} className="inline-flex items-center gap-1 hover:underline">
                        <Target className="h-3.5 w-3.5 text-sprint" />
                        {data.goalTitle}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </dd>
                  <dt className="text-muted-foreground">Started</dt>
                  <dd>
                    {fmtYmd(stats.start, { month: "short", day: "numeric", year: "numeric" })} · day {stats.dayNumber}
                    {stats.dayNumber < 66 && <span className="text-muted-foreground"> (median habit: ~66 days)</span>}
                  </dd>
                </dl>
                {habit.description && <p className="border-t border-border pt-3 text-muted-foreground">{habit.description}</p>}
                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  {data.status === "active" && (
                    <>
                      <button onClick={() => void setStatus("graduated")} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        <GraduationCap /> Graduate
                      </button>
                      <button onClick={() => void setStatus("queued")} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        <Pause /> Pause → queue
                      </button>
                    </>
                  )}
                  {data.status === "queued" && (
                    <button onClick={() => void setStatus("active")} className={buttonVariants({ size: "sm" })}>
                      <Play /> Start now
                    </button>
                  )}
                  {(data.status === "graduated" || data.status === "archived") && (
                    <button onClick={() => void setStatus("active")} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <RotateCcw /> Resume daily tracking
                    </button>
                  )}
                </div>
              </div>
            </Section>

            {/* Automaticity */}
            <Section title="Automaticity checks" icon={GraduationCap} hint="Day 30 · 60 · 90 — how automatic does it feel (1–5)?">
              <div className="space-y-3">
                {stats.automaticityDue && (
                  <AutomaticityPrompt habitId={id} title={habit.title} day={stats.automaticityDue} compact />
                )}
                {checkDay && checkDay !== stats.automaticityDue && (
                  <AutomaticityPrompt habitId={id} title={habit.title} day={checkDay} compact onDismiss={() => setCheckDay(null)} />
                )}
                <ul className="space-y-2">
                  {MILESTONES.map((m) => {
                    const score = autoByDay.get(m);
                    const reached = stats.dayNumber - 1 >= m;
                    return (
                      <li key={m} className="flex items-center gap-3 text-sm">
                        <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">Day {m}</span>
                        {score != null ? (
                          <>
                            <span className="flex flex-1 gap-1">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <span key={n} className={cn("h-2 flex-1 rounded-full", n <= score ? (score >= 4 ? "bg-success" : "bg-primary") : "bg-muted")} />
                              ))}
                            </span>
                            <span className="w-8 text-right text-xs tabular-nums">{score}/5</span>
                          </>
                        ) : reached ? (
                          <button onClick={() => setCheckDay(m)} className="text-xs text-info hover:underline">
                            Answer now
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">in {m - (stats.dayNumber - 1)} days</span>
                        )}
                      </li>
                    );
                  })}
                  {(habit.automaticity ?? [])
                    .filter((a) => !MILESTONES.includes(a.day))
                    .map((a) => (
                      <li key={a.day} className="flex items-center gap-3 text-sm">
                        <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">Day {a.day}</span>
                        <span className="flex-1 text-xs">{a.score}/5</span>
                      </li>
                    ))}
                </ul>
                {!stats.automaticityDue && !checkDay && stats.dayNumber > 7 && (
                  <button onClick={() => setCheckDay(stats.dayNumber - 1)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    Check in early
                  </button>
                )}
              </div>
            </Section>
          </div>
        </div>
      </div>

      <KindMenu
        anchor={todayMenu}
        onClose={() => setTodayMenu(null)}
        onPick={(k) => void pick(k)}
        current={kind}
        minVersion={habit.minVersion}
        stretchVersion={habit.stretchVersion}
        shieldsLeft={stats.shieldsLeft}
        heading="Today"
      />
      <KindMenu
        anchor={cellMenu?.rect ?? null}
        onClose={() => setCellMenu(null)}
        onPick={(k) => cellMenu && void pick(k, cellMenu.date)}
        current={cellMenu ? recordFor(cellMenu.date)?.kind ?? null : null}
        minVersion={habit.minVersion}
        stretchVersion={habit.stretchVersion}
        shieldsLeft={cellMenu && cellMenu.date === today ? stats.shieldsLeft : stats.reserves}
        heading={cellMenu ? fmtYmd(cellMenu.date) : undefined}
      />

      <HabitDialog open={editOpen} onClose={() => setEditOpen(false)} habit={habit} today={today} />

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this habit?" size="sm">
        <p className="text-sm text-muted-foreground">
          “{habit.title}” and its history will be removed for good. Need a break instead? Pause it to the queue — no guilt.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {data.status === "active" && (
            <button
              onClick={() => {
                setConfirmDelete(false);
                void setStatus("queued");
              }}
              className={buttonVariants({ variant: "outline" })}
            >
              <Pause /> Pause instead
            </button>
          )}
          <button
            onClick={async () => {
              setConfirmDelete(false);
              // Leave first so this page doesn't flash "not found" while the delete lands.
              router.push("/habits");
              try {
                await removeHabit({ id });
                toast("Habit deleted");
              } catch (e) {
                toast(errText(e), { tone: "warning" });
              }
            }}
            className={buttonVariants({ variant: "destructive" })}
          >
            <Trash2 /> Delete
          </button>
        </div>
      </Dialog>
    </PageShell>
  );
}
