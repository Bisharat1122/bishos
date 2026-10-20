"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  CheckSquare, FolderKanban, Target, StickyNote, ArrowUpRight, ArrowLeft, Repeat, GraduationCap, Trophy, Timer,
  Gauge, Ruler, AlertTriangle, Plus, ArrowRight, Rocket, Layers, Star,
} from "lucide-react";
import {
  PageShell, Section, InlineEdit, Chip, Bar, Ring, Metric, Dialog, EmptyHint, CheckCircle, toneForPct, areaColor,
  cn, buttonVariants, inputClass,
} from "@/components/os/kit";
import { toast, reward, errorMessage } from "@/components/os/celebrate";
import { useStable } from "@/components/os/useCockpit";
import { useTz } from "@/components/direction/util";
import { AddToMomentum } from "@/components/momentum/AddToMomentum";
import { NextActionForm } from "@/components/projects/NextActionForm";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { addDaysYmd, fmtMin, relDay, useToday } from "@/lib/day";

type Hub = NonNullable<FunctionReturnType<typeof api.lifeAreas.hub>>;

const STATUS_TONE = { active: "info", planning: "muted", blocked: "warning", completed: "success" } as const;
const STATUS_LABEL = { active: "Active", planning: "Planning", blocked: "Blocked", completed: "Done" } as const;

/**
 * Life Area hub — the spine. Everything that lives in one area: its
 * standard, this month's rating, hours vs target, goals, projects (with
 * next actions), habits, learning, tasks, notes and recent wins.
 */
export default function LifeAreaPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"lifeAreas">;
  const today = useToday();
  const tz = useTz();
  const data = useStable(useQuery(api.lifeAreas.hub, { id, today, tz }));
  const update = useMutation(api.lifeAreas.update);
  const rate = useMutation(api.compass.rate);
  const createTask = useMutation(api.tasks.create);
  const setStatus = useMutation(api.tasks.setStatus);

  const [nextFor, setNextFor] = useState<Hub["projects"][number] | null>(null);
  const [openTask, setOpenTask] = useState<Id<"tasks"> | null>(null);
  const [taskDraft, setTaskDraft] = useState("");
  const [showOtherGoals, setShowOtherGoals] = useState(false);

  if (data === undefined)
    return (
      <PageShell title={<span className="skeleton inline-block h-7 w-48 align-middle" />} icon={Layers}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="skeleton h-40" />
          <div className="skeleton h-40" />
          <div className="skeleton h-40" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      </PageShell>
    );
  if (data === null)
    return (
      <PageShell title="Life area not found" icon={Layers}>
        <EmptyHint
          icon={Layers}
          title="This area doesn’t exist (or was deleted)"
          action={
            <Link href="/life-areas" className={buttonVariants({ size: "sm" })}>
              All life areas
            </Link>
          }
        />
      </PageShell>
    );

  const { area, rating, hours, goals, projects, habits, learning, pillars, challenges, tasks, notes, wins, sections } = data;
  const color = areaColor(area);
  const hoursPct = hours.targetH ? (hours.actualH / hours.targetH) * 100 : 0;
  const ratingValue = rating.current?.rating ?? null;
  const noNext = projects.filter((p) => (p.status === "active" || p.status === "blocked") && !p.nextAction);
  const activeGoals = [...goals.cycle, ...goals.annual];

  async function rateArea(n: number) {
    try {
      await rate({ lifeAreaId: id, period: rating.period, rating: n });
      toast(`${area.name}: ${n}/10 this month`, { tone: "success" });
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    }
  }

  return (
    <PageShell
      title={
        <span className="flex items-center gap-2.5">
          <span className="size-3 shrink-0 rounded-full" style={{ background: color }} />
          {area.name}
          {area.kind && <Chip tone={area.kind === "business" ? "info" : "secondary"}>{area.kind}</Chip>}
          {area.archived && <Chip>archived</Chip>}
        </span>
      }
      subtitle={
        <InlineEdit
          value={area.description ?? ""}
          placeholder="Add a one-line description…"
          onSave={(v) => void update({ id, description: v })}
          className="-ml-1 text-sm text-muted-foreground"
        />
      }
      actions={
        <>
          <Link href="/life-areas" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ArrowLeft /> All areas
          </Link>
          <AddToMomentum type="lifeArea" itemId={id} title={area.name} />
        </>
      }
    >
      {/* Standard · rating · hours */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Section title="Standard" icon={Ruler} hint="What “maintained” looks like here.">
          <InlineEdit
            value={area.standard ?? ""}
            placeholder="e.g. Clients delivered on time; invoices sent every Friday."
            onSave={(v) => void update({ id, standard: v }).then(() => toast("Standard saved", { tone: "success" }))}
            multiline
            className="text-sm"
          />
        </Section>

        <Section
          title="This month"
          icon={Gauge}
          hint="Wheel of Life — rate 1–10, re-rate monthly."
          action={
            <Link href="/compass" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Compass <ArrowRight />
            </Link>
          }
        >
          <div className="flex items-center gap-4">
            <Ring value={(ratingValue ?? 0) * 10} size={64} tone={ratingValue == null ? "primary" : toneForPct(ratingValue * 10)}>
              <span className="text-lg font-semibold tabular-nums">{ratingValue ?? "—"}</span>
            </Ring>
            <div className="min-w-0 flex-1">
              {ratingValue == null && (
                <p className="text-xs text-muted-foreground">
                  {rating.latest ? `Last rated ${rating.latest.rating}/10 (${rating.latest.period}).` : "Not rated yet."} How is it really going?
                </p>
              )}
              <div className="mt-1 flex items-end gap-1" aria-label="Last 6 months">
                {rating.history.map((h) => (
                  <div key={h.period} className="flex flex-1 flex-col items-center gap-0.5" title={`${h.period}: ${h.rating ?? "—"}`}>
                    <div className="flex h-8 w-full items-end overflow-hidden rounded-sm bg-muted">
                      <div className="w-full rounded-sm" style={{ height: `${(h.rating ?? 0) * 10}%`, background: color }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{h.period.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-10 gap-0.5" role="group" aria-label="Rate this month">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => void rateArea(n)}
                aria-pressed={ratingValue === n}
                className={cn(
                  "h-7 rounded-md text-xs font-medium tabular-nums transition-colors",
                  ratingValue === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </Section>

        <Section
          title="Hours this week"
          icon={Timer}
          hint="Focus sessions + done calendar blocks."
          action={
            <Link href="/week" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Week <ArrowRight />
            </Link>
          }
        >
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tabular-nums">{hours.actualH}h</span>
            <span className="text-sm text-muted-foreground">
              of
              <input
                type="number"
                min={0}
                max={80}
                defaultValue={hours.targetH || ""}
                placeholder="—"
                key={hours.targetH}
                onBlur={(e) => {
                  const n = e.target.value === "" ? null : Number(e.target.value);
                  if (n !== (area.weeklyHoursTarget ?? null)) void update({ id, weeklyHoursTarget: n }).then(() => toast("Weekly target saved", { tone: "success" }));
                }}
                className={cn(inputClass, "mx-1 h-7 w-14 px-1 text-right text-sm")}
                aria-label="Weekly hours target"
              />
              h target
            </span>
          </div>
          <Bar value={hoursPct} tone={hours.targetH ? toneForPct(hoursPct) : "primary"} color={hours.targetH ? undefined : color} className="mt-3" height="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {hours.plannedH > 0 ? `${hours.plannedH}h planned on the calendar · ` : ""}
            <Link href="/focus" className="underline-offset-2 hover:underline">
              Start a focus session
            </Link>
          </p>
        </Section>
      </div>

      {/* At a glance */}
      <Section className="mt-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="Open tasks" value={tasks.openCount} sub={tasks.someday ? `+${tasks.someday} someday` : undefined} />
          <Metric label="Planned today" value={tasks.plannedToday} />
          <Metric label="Done this week" value={tasks.doneThisWeek} tone={tasks.doneThisWeek > 0 ? "success" : undefined} />
          <Metric label="Active goals" value={activeGoals.length} sub={`${projects.filter((p) => p.status === "active").length} active projects`} />
        </div>
      </Section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Goals */}
        <Section
          title="Goals"
          icon={Target}
          hint="Most areas are maintenance. Goals are for change you want this cycle."
          action={
            <Link href="/goals" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Goals <ArrowRight />
            </Link>
          }
        >
          {activeGoals.length === 0 && goals.other.length === 0 ? (
            <EmptyHint
              icon={Target}
              title="No goals in this area"
              hint="That’s fine — the standard keeps it healthy. Add a 12-week goal only when you want something to change."
              action={
                <Link href="/goals" className={buttonVariants({ size: "sm" })}>
                  Plan a goal
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {goals.cycle.length > 0 && <GoalList label="12-week goals" rows={goals.cycle} />}
              {goals.annual.length > 0 && <GoalList label="Annual goals" rows={goals.annual} />}
              {goals.other.length > 0 && (
                <div>
                  <button onClick={() => setShowOtherGoals((s) => !s)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                    {showOtherGoals ? "Hide" : "Show"} other goals ({goals.other.length})
                  </button>
                  {showOtherGoals && <GoalList rows={goals.other} />}
                </div>
              )}
              {goals.achieved.length > 0 && (
                <p className="flex items-center gap-1 text-xs text-success">
                  <Trophy className="h-3 w-3" /> {goals.achieved.length} achieved
                </p>
              )}
            </div>
          )}
        </Section>

        {/* Projects */}
        <Section
          title="Projects"
          icon={FolderKanban}
          hint={noNext.length ? `${noNext.length} active without a next action` : "Every active project has a next action."}
          action={
            <Link href="/projects" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Projects <ArrowRight />
            </Link>
          }
        >
          {projects.length === 0 ? (
            <EmptyHint
              icon={FolderKanban}
              title="No projects here"
              hint="A project is an outcome with more than one step — a delivery, a launch, a sprint."
              action={
                <Link href="/projects" className={buttonVariants({ size: "sm" })}>
                  New project
                </Link>
              }
            />
          ) : (
            <ul className="space-y-1.5">
              {projects.slice(0, 10).map((p) => {
                const warn = (p.status === "active" || p.status === "blocked") && !p.nextAction;
                return (
                  <li key={p._id} className="rounded-lg border border-border p-2.5">
                    <div className="flex items-center gap-2">
                      <Link href={`/projects/${p._id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">
                        {p.kind === "sprint" && <Rocket className="mr-1 inline h-3.5 w-3.5 text-sprint" />}
                        {p.title}
                      </Link>
                      <Chip tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Chip>
                    </div>
                    {p.status !== "completed" &&
                      (p.nextAction ? (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          <ArrowRight className="mr-1 inline h-3 w-3" />
                          {p.nextAction.title}
                          {p.nextAction.plannedFor ? ` · ${relDay(p.nextAction.plannedFor, today).toLowerCase()}` : ""}
                        </p>
                      ) : (
                        <button
                          onClick={() => setNextFor(p)}
                          className={cn("mt-1 flex items-center gap-1 text-xs font-medium", warn ? "text-warning" : "text-muted-foreground hover:text-foreground")}
                        >
                          {warn ? <AlertTriangle className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                          {warn ? "No next action — add one" : "Add next action"}
                        </button>
                      ))}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* Habits */}
        <Section
          title="Habits"
          icon={Repeat}
          hint="Consistency first, streak second."
          action={
            <Link href="/habits" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Habits <ArrowRight />
            </Link>
          }
        >
          {habits.length === 0 ? (
            <EmptyHint
              icon={Repeat}
              title="No habits in this area"
              hint="A habit here is a maintenance standard — e.g. “lift 3× a week” under Fitness."
              action={
                <Link href="/habits" className={buttonVariants({ size: "sm" })}>
                  Add a habit
                </Link>
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {habits.map((h) => (
                <li key={h._id}>
                  <Link href={`/habits/${h._id}`} className="flex items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:border-ring">
                    <Ring value={h.consistency} size={40} stroke={4} tone={toneForPct(h.consistency)}>
                      <span className="text-[10px] font-semibold tabular-nums">{h.consistency}%</span>
                    </Ring>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{h.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {h.status === "queued" ? "Queued" : `${h.streak}-day streak`}
                        {h.doneToday ? " · done today" : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Learning & content + challenges */}
        <Section
          title="Learning & content"
          icon={GraduationCap}
          hint="What you’re learning here, and the content pillars it feeds."
          action={
            <Link href="/learning" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Learning <ArrowRight />
            </Link>
          }
        >
          {learning.length === 0 && challenges.length === 0 ? (
            <EmptyHint
              icon={GraduationCap}
              title="Nothing linked yet"
              hint="Link a learning area to this Life Area to see practice and pillars here."
              action={
                <Link href="/learning" className={buttonVariants({ size: "sm" })}>
                  Open Learning
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {learning.length > 0 && (
                <ul className="space-y-1.5">
                  {learning.map((l) => (
                    <li key={l._id}>
                      <Link href={`/learning/${l._id}`} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm hover:bg-muted/70">
                        <span className="min-w-0 truncate">{l.name}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          {l.pillar && <Chip tone="outline">{l.pillar}</Chip>}
                          {l.status !== "active" && <Chip>{l.status}</Chip>}
                          {l.weeklyMinutesTarget ? <span className="text-[11px] text-muted-foreground">{fmtMin(l.weeklyMinutesTarget)}/wk</span> : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {pillars.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[11px] text-muted-foreground">Pillars:</span>
                  {pillars.map((p) => (
                    <Link key={p._id} href="/content" className="rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground">
                      {p.name} · {p.brand}
                    </Link>
                  ))}
                </div>
              )}
              {challenges.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">Challenges:</span>
                  {challenges.map((c) => (
                    <Link key={c._id} href={`/challenges/${c._id}`} className="inline-flex items-center gap-1 rounded-md bg-sprint/15 px-2 py-0.5 text-xs text-sprint hover:underline">
                      {c.icon ?? <Rocket className="h-3 w-3" />} {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Tasks */}
        <Section
          title="Next up"
          icon={CheckSquare}
          hint={`${tasks.openCount} open in this area`}
          action={
            <Link href={`/tasks?area=${id}&view=anytime`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Tasks <ArrowRight />
            </Link>
          }
        >
          <form
            className="mb-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!taskDraft.trim()) return;
              void createTask({ title: taskDraft.trim(), priority: "med", lifeAreaId: id })
                .then(() => toast("Task added", { tone: "success" }))
                .catch((err) => toast(errorMessage(err), { tone: "warning" }));
              setTaskDraft("");
            }}
          >
            <input value={taskDraft} onChange={(e) => setTaskDraft(e.target.value)} placeholder={`Add a task to ${area.name}…`} className={cn(inputClass, "h-9 min-w-0 flex-1")} />
            <button className={buttonVariants({ variant: "secondary" })} disabled={!taskDraft.trim()}>
              Add
            </button>
          </form>
          {tasks.next.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing open — the area is in good shape.</p>
          ) : (
            <ul className="space-y-1">
              {tasks.next.map((t) => (
                <li key={t._id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-accent/40">
                  <CheckCircle
                    size="sm"
                    checked={t.status === "done"}
                    onClick={() =>
                      void setStatus({ id: t._id, status: "done", date: today })
                        .then(() => toast("Done", { tone: "success" }))
                        .catch((e) => toast(errorMessage(e), { tone: "warning" }))
                    }
                  />
                  <button onClick={() => setOpenTask(t._id)} className="min-w-0 flex-1 truncate text-left text-sm hover:underline">
                    {t.title}
                  </button>
                  {t.plannedFor ? (
                    <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px]", t.plannedFor < today ? "bg-warning-soft text-warning" : t.plannedFor === today ? "bg-info-soft text-info" : "bg-muted text-muted-foreground")}>
                      {relDay(t.plannedFor, today)}
                    </span>
                  ) : t.estimateMin ? (
                    <span className="shrink-0 text-[10px] text-muted-foreground">{fmtMin(t.estimateMin)}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Wins */}
        <Section
          title="Recent wins"
          icon={Trophy}
          hint="Progress you made in this area."
          action={
            <Link href="/momentum" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Wins <ArrowRight />
            </Link>
          }
        >
          {wins.logged.length === 0 && wins.recentDone.length === 0 ? (
            <EmptyHint icon={Trophy} title="No wins logged yet" hint="Finish a task or log a win — small progress counts." action={<AddToMomentum type="lifeArea" itemId={id} title={area.name} />} />
          ) : (
            <ul className="space-y-1.5">
              {wins.logged.map((w) => (
                <li key={w._id} className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-current text-chart-3" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{w.title}</p>
                    {w.why && <p className="truncate text-xs text-muted-foreground">{w.why}</p>}
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{new Date(w.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </li>
              ))}
              {wins.recentDone.map((t) => (
                <li key={t._id} className="flex items-center gap-2 px-3 py-1 text-sm text-muted-foreground">
                  <CheckSquare className="h-3.5 w-3.5 shrink-0 text-success" />
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Notes + sections */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section
          title={`Notes (${data.noteCount})`}
          icon={StickyNote}
          action={
            <Link href="/notes" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Notes <ArrowRight />
            </Link>
          }
        >
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes filed under this area yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {notes.map((n) => (
                <li key={n._id}>
                  <Link href={`/notes/${n._id}`} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm hover:bg-muted/70">
                    <span className="truncate">{n.title || "Untitled"}</span>
                    {n.noteType && <Chip>{n.noteType}</Chip>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Sections" icon={Layers} hint="Sub-areas — add them from the Life Areas list.">
          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sections. <Link href="/life-areas" className="underline-offset-2 hover:underline">Add one</Link> if this area needs sub-areas.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sections.map((s) => (
                <Link key={s._id} href={`/life-areas/${id}/sections/${s._id}`} className="group rounded-lg border border-border p-3 transition-colors hover:border-ring">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">{s.name}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {s.taskCount} tasks · {s.noteCount} notes · {s.goalCount} goals
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>

      {openTask && <TaskDetailPanel id={openTask} onClose={() => setOpenTask(null)} />}

      <Dialog open={!!nextFor} onClose={() => setNextFor(null)} title="Add the next action" size="sm">
        {nextFor && (
          <NextActionForm
            project={nextFor}
            onCreate={async (title, when) => {
              try {
                await createTask({
                  title,
                  priority: "med",
                  lifeAreaId: id,
                  projectId: nextFor._id,
                  goalId: nextFor.goalId ?? undefined,
                  plannedFor: when === "today" ? today : when === "tomorrow" ? addDaysYmd(today, 1) : undefined,
                });
                reward("Next action added");
                setNextFor(null);
              } catch (e) {
                toast(errorMessage(e), { tone: "warning" });
              }
            }}
          />
        )}
      </Dialog>
    </PageShell>
  );
}

function GoalList({ label, rows }: { label?: string; rows: Hub["goals"]["cycle"] }) {
  return (
    <div>
      {label && <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>}
      <ul className="space-y-1.5">
        {rows.map((g) => (
          <li key={g._id}>
            <Link href={`/goals/${g._id}`} className="block rounded-lg border border-border p-2.5 transition-colors hover:border-ring">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium">{g.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{g.progress}%</span>
              </div>
              <Bar value={g.progress} tone={toneForPct(g.progress)} className="mt-1.5" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {g.goalStatus && g.goalStatus !== "active" ? `${g.goalStatus} · ` : ""}
                {g.projects} project{g.projects === 1 ? "" : "s"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
