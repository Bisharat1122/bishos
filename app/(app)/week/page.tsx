"use client";

/**
 * Week — the week plan. Weekly Big 3, this week's tactics + execution score,
 * a 7-day strip (day type, theme, Top 3, rituals, planned vs done), hours by
 * area (target vs planned vs actual), the protected Free Day, notes and the
 * Ideal Week editor with "apply to this / next week".
 */
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  LayoutGrid,
  Moon,
  Palmtree,
  Sun,
  Target,
  Trophy,
  Footprints,
  NotebookPen,
} from "lucide-react";
import { Chip, PageShell, Section, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { useToday, mondayOf, addDaysYmd, fmtYmd, fmtMin } from "@/lib/day";
import { ExecRing } from "@/components/direction/charts";
import { Big3Editor, FreeDayPicker, HabitLead, HoursByArea, TacticCounter } from "@/components/direction/widgets";
import { IdealWeekEditor } from "@/components/direction/IdealWeekEditor";
import { AutoTextArea } from "@/components/direction/AutoField";
import { DAY_TYPES, DayType, errMsg, useTz, weekRange } from "@/components/direction/util";

const DAY_CYCLE: (DayType | null)[] = ["focus", "buffer", "free"];

export default function WeekPage() {
  const today = useToday();
  const tz = useTz();
  const thisMonday = mondayOf(today);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const ws = weekStart ?? thisMonday;
  const data = useQuery(api.weekPlans.week, { weekStart: ws, today, tz });
  const upsert = useMutation(api.weekPlans.upsert);
  const setDayType = useMutation(api.weekPlans.setDayType);

  const isThis = ws === thisMonday;
  const isFuture = ws > thisMonday;
  const label = isThis ? "This week" : ws === addDaysYmd(thisMonday, 7) ? "Next week" : ws === addDaysYmd(thisMonday, -7) ? "Last week" : weekRange(ws);

  return (
    <PageShell
      title="Week"
      icon={CalendarDays}
      subtitle="Objectives, not a schedule: three outcomes, your tactics, and a week shape that protects deep work and rest."
      actions={
        <>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5 shadow-xs">
            <button onClick={() => setWeekStart(addDaysYmd(ws, -7))} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Previous week">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setWeekStart(null)} className="min-w-[110px] px-2 text-center text-sm font-medium" title="Back to this week">
              {label}
              <span className="block text-[10px] font-normal text-muted-foreground">{weekRange(ws)}</span>
            </button>
            <button onClick={() => setWeekStart(addDaysYmd(ws, 7))} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Next week">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Link href={`/reviews/weekly?period=${ws}`} className={buttonVariants({ variant: "outline" })}>
            <ClipboardCheck className="h-4 w-4" /> Weekly review
          </Link>
        </>
      }
    >
      {data === undefined ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <div className="skeleton h-56" />
            <div className="skeleton h-56" />
          </div>
          <div className="skeleton h-40" />
          <div className="skeleton h-72" />
        </div>
      ) : (
        <div className="space-y-4">
          {data.plan.reviewedAt && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-success-soft px-4 py-2.5 text-sm text-success">
              <Trophy className="h-4 w-4" /> Reviewed · execution frozen at {data.plan.executionScore ?? "—"}%
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <Section title="Weekly Big 3" icon={Target} hint="Three outcomes that would make this week a win. Check them off as they land.">
              <Big3Editor weekStart={data.weekStart} big3={data.plan.big3} goals={data.goals} today={today} />
              {data.plan.big3.length === 0 && (
                <p className="mt-3 text-xs text-muted-foreground">Tip: tie at least one outcome to a 12-week goal and one to revenue.</p>
              )}
            </Section>

            <Section
              title="Tactics this week"
              icon={Footprints}
              hint={data.cycle ? `${data.cycle.name} · week ${Math.max(1, Math.min(13, data.cycle.weekNumber))}` : undefined}
              action={
                data.cycle ? (
                  <Link href="/goals" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    Goals
                  </Link>
                ) : undefined
              }
            >
              {!data.cycle ? (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-muted-foreground">Tactics come from your 12-week goals — the weekly actions you score.</p>
                  <Link href="/goals" className={buttonVariants({ size: "sm" })}>
                    Start a 12-week cycle
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <ExecRing score={data.execution.score} size={92} label={isThis ? "so far" : "score"} />
                    <div className="text-sm">
                      <p className="font-medium tabular-nums">
                        {data.execution.achieved}/{data.execution.target} reps
                      </p>
                      <p className="text-xs text-muted-foreground">85% is the bar — partial weeks still count.</p>
                    </div>
                  </div>
                  {data.tactics.length === 0 && <p className="text-xs text-muted-foreground">Add tactics to your goals to score this week.</p>}
                  <div className="space-y-1.5">
                    {data.tactics.map((t) =>
                      t.kind === "tactic" ? (
                        <TacticCounter
                          key={t.id}
                          tacticId={t.id as Id<"tactics">}
                          title={t.title}
                          done={t.done}
                          target={t.target}
                          weekStart={data.weekStart}
                          today={today}
                          sub={t.goalTitle}
                          readOnly={isFuture}
                        />
                      ) : (
                        <HabitLead key={t.id} title={t.title} done={t.done} target={t.target} />
                      ),
                    )}
                  </div>
                </div>
              )}
            </Section>
          </div>

          {/* 7-day strip */}
          <div className="overflow-x-auto pb-1 scrollbar-thin">
            <div className="grid min-w-[760px] grid-cols-7 gap-2">
              {data.days.map((d) => {
                const meta = DAY_TYPES[d.dayType];
                const isToday = d.date === today;
                const past = d.date < today;
                return (
                  <div
                    key={d.date}
                    className={cn(
                      "flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-card",
                      isToday ? "border-ring ring-2 ring-ring/20" : "border-border",
                      d.dayType === "free" && "bg-success-soft/40",
                      past && !isToday && "opacity-80",
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <Link href={isToday ? "/today" : `/journal/${d.date}`} className="leading-tight hover:underline">
                        <span className="block text-xs text-muted-foreground">{fmtYmd(d.date, { weekday: "short" })}</span>
                        <span className="text-lg font-semibold tabular-nums">{fmtYmd(d.date, { day: "numeric" })}</span>
                      </Link>
                      <button
                        onClick={() => {
                          const next = DAY_CYCLE[(DAY_CYCLE.indexOf(d.dayType) + 1) % DAY_CYCLE.length];
                          void setDayType({ date: d.date, dayType: next }).catch((e) => toast(errMsg(e), { tone: "warning" }));
                        }}
                        title={`${meta.label} day — ${meta.hint}. Click to change.`}
                      >
                        <Chip tone={meta.tone} className={cn("cursor-pointer px-1.5 py-0 text-[10px]", !d.dayTypeSet && "opacity-70")}>
                          {d.isFreeDay && <Palmtree />}
                          {meta.label}
                        </Chip>
                      </button>
                    </div>
                    {d.theme && <p className="line-clamp-2 text-[11px] text-muted-foreground">{d.theme}</p>}
                    <div className="mt-auto space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-muted-foreground">Top 3</span>
                        <span className="flex items-center gap-0.5">
                          {d.top3Count === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            d.top3.map((t) => (
                              <span key={t._id} title={t.title} className={cn("size-2 rounded-full", t.done ? "bg-success" : "bg-muted-foreground/30")} />
                            ))
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1" title="Done blocks / planned blocks">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" /> Blocks
                        </span>
                        <span className="tabular-nums">
                          {d.plannedMin ? `${fmtMin(d.doneMin)}/${fmtMin(d.plannedMin)}` : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-muted-foreground">Tasks done</span>
                        <span className="tabular-nums">{d.tasksCompleted || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span title={d.startupAt ? "Start-up done" : "No start-up"} className={cn("flex items-center gap-1", d.startupAt ? "text-success" : "text-muted-foreground/50")}>
                          <Sun className="h-3.5 w-3.5" />
                        </span>
                        <span title={d.shutdownAt ? "Shutdown done" : "No shutdown"} className={cn("flex items-center gap-1", d.shutdownAt ? "text-success" : "text-muted-foreground/50")}>
                          <Moon className="h-3.5 w-3.5" />
                        </span>
                        {d.dayScore !== undefined && <span className="ml-auto font-semibold tabular-nums">{d.dayScore}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <Section title="Hours by life area" icon={Clock} hint="Target (from the Compass) vs planned blocks vs actual focus + done blocks.">
              <HoursByArea rows={data.hours.rows} totals={data.hours.totals} />
            </Section>
            <div className="space-y-4">
              <Section title="Protected Free Day" icon={Palmtree} hint="Plan rest first. No work, midnight to midnight.">
                <FreeDayPicker weekStart={data.weekStart} freeDay={data.plan.freeDay} today={today} />
              </Section>
              <Section title="Notes" icon={NotebookPen}>
                <AutoTextArea
                  key={data.weekStart /* remount per week so a pending draft can't save into another week */}
                  value={data.plan.notes ?? ""}
                  onSave={(notes) => upsert({ weekStart: data.weekStart, notes })}
                  placeholder="Context for the week: travel, launches, constraints, who to follow up with…"
                  rows={4}
                />
              </Section>
            </div>
          </div>

          <Section title="Ideal Week" icon={LayoutGrid} hint="Your template week. Apply it and the calendar fills with blocks — no overlaps, no duplicates.">
            <IdealWeekEditor today={today} thisWeek={thisMonday} />
          </Section>
        </div>
      )}
    </PageShell>
  );
}
