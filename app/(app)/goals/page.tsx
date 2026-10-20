"use client";

/**
 * Goals · 12 weeks — the cockpit. Cycle header ("Week 4 of 12"), this week's
 * execution score ring + 12-week history, ≤3 active goal cards (KRs, tactics
 * with +/− for THIS week, trend), the annual goals, the someday backlog and the
 * legacy goals with a "convert" action. Works with no cycle yet (wizard).
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowUpRight,
  CalendarRange,
  Flag,
  Mountain,
  Plus,
  Rocket,
  Sparkles,
  Target,
  Trash2,
  Archive,
  Trophy,
  Telescope,
  Minus,
  Hourglass,
  ClipboardCheck,
  Pencil,
} from "lucide-react";
import {
  AreaDot,
  Bar,
  Chip,
  Dialog,
  Field,
  Metric,
  PageShell,
  Section,
  Select,
  TextInput,
  areaColor,
  buttonVariants,
  cn,
} from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { useToday, fmtYmd } from "@/lib/day";
import { ExecBars, ExecRing, Spark } from "@/components/direction/charts";
import { HabitLead, TacticCounter } from "@/components/direction/widgets";
import { Candidate, CycleWizard } from "@/components/direction/CycleWizard";
import { GoalPlanEditor, GoalDraft, cleanGoal, emptyGoal, goalProblems } from "@/components/direction/GoalPlanEditor";
import { errMsg, fmtRange } from "@/components/direction/util";

type Cockpit = FunctionReturnType<typeof api.cycles.cockpit>;
type GoalCardData = Cockpit["goals"][number];

export default function GoalsPage() {
  const today = useToday();
  const data = useQuery(api.cycles.cockpit, { today });
  const areas = useQuery(api.lifeAreas.list);
  const [wizard, setWizard] = useState<{ open: boolean; preselect?: Id<"goals">[] }>({ open: false });
  const [addOpen, setAddOpen] = useState<null | { parentGoalId?: Id<"goals">; title?: string; lifeAreaId?: string }>(null);

  const liveAreas = useMemo(() => (areas ?? []).filter((a) => !a.archived).sort((a, b) => a.order - b.order), [areas]);

  const candidates: Candidate[] = useMemo(() => {
    if (!data) return [];
    const map = (g: { _id: Id<"goals">; title: string; lifeAreaId: Id<"lifeAreas">; goalType?: "outcome" | "learning"; reasons?: string[]; keyResults?: Candidate["keyResults"] }, source: Candidate["source"]): Candidate => ({
      _id: g._id,
      title: g.title,
      lifeAreaId: g.lifeAreaId,
      source,
      goalType: g.goalType,
      reasons: g.reasons,
      keyResults: g.keyResults,
    });
    const phase = data.cycle?.state.phase;
    // In week 13 / after the end, this cycle's active goals can be carried over.
    const carryNow = phase === "buffer" || phase === "ended" ? data.goals.map((g) => map(g, "carry")) : [];
    return [
      ...carryNow,
      ...data.stragglers.map((g) => map(g, "carry")),
      ...data.backlog.map((g) => map(g, "backlog")),
      ...data.annual.map((g) => map(g, "annual")),
      ...data.legacy.map((g) => map(g, "legacy")),
    ];
  }, [data]);

  if (data === undefined) {
    return (
      <PageShell title="Goals · 12 weeks" icon={Target}>
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <div className="skeleton h-72" />
          <div className="skeleton h-72" />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      </PageShell>
    );
  }

  const cycle = data.cycle;
  const phase = cycle?.state.phase;
  const canStartNext = !cycle || phase === "buffer" || phase === "ended";
  const underCap = data.goals.length < data.maxActiveGoals;
  const closePrevious = cycle && (phase === "buffer" || phase === "ended") ? { _id: cycle._id, name: cycle.name } : null;

  return (
    <PageShell
      title="Goals · 12 weeks"
      icon={Target}
      subtitle={cycle?.theme ? `“${cycle.theme}”` : "Three goals. Twelve weeks. Score the actions you control, grade the results at the end."}
      actions={
        <>
          {cycle && phase !== "ended" && underCap && (
            <button onClick={() => setAddOpen({})} className={buttonVariants({ variant: "outline" })}>
              <Plus className="h-4 w-4" /> 12-week goal
            </button>
          )}
          {canStartNext && (
            <button onClick={() => setWizard({ open: true })} className={buttonVariants()}>
              <Rocket className="h-4 w-4" /> {cycle ? "Start next cycle" : "Start a cycle"}
            </button>
          )}
        </>
      }
    >
      {!cycle ? (
        <FirstCycleHero onStart={() => setWizard({ open: true })} hasGoals={candidates.length > 0} />
      ) : (
        <>
          <CycleHeader cockpit={data} />
          <div className="mt-4 grid gap-4 lg:grid-cols-[340px_1fr]">
            <ExecutionCard cockpit={data} />
            <div className="grid content-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {data.goals.map((g) => (
                <GoalCard key={g._id} goal={g} weekStart={data.scoreWeek} today={today} readOnly={phase === "planned"} />
              ))}
              {underCap && phase !== "ended" && (
                <button
                  onClick={() => setAddOpen({})}
                  className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                >
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Add a 12-week goal</span>
                  <span className="text-xs">
                    {data.goals.length} of {data.maxActiveGoals} active — a key result to aim at, tactics to do weekly.
                  </span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <AnnualGoals cockpit={data} areas={liveAreas} onPlan={(g) => setAddOpen({ parentGoalId: g._id, title: g.title, lifeAreaId: g.lifeAreaId })} canPlan={!!cycle && underCap && phase !== "ended"} />
        <BacklogList cockpit={data} />
      </div>

      {data.legacy.length > 0 && <LegacyGoals cockpit={data} />}
      {(data.finished.length > 0 || data.pastCycles.length > 0) && <PastCycles cockpit={data} />}

      <CycleWizard
        open={wizard.open}
        onClose={() => setWizard({ open: false })}
        today={today}
        candidates={candidates}
        maxGoals={data.maxActiveGoals}
        closePrevious={closePrevious}
        preselect={wizard.preselect ?? data.stragglers.map((g) => g._id)}
      />
      {addOpen && cycle && (
        <AddGoalDialog
          onClose={() => setAddOpen(null)}
          cycleId={cycle._id}
          areas={liveAreas}
          weekStart={data.scoreWeek}
          initial={emptyGoal(addOpen.lifeAreaId ?? liveAreas[0]?._id ?? "", { title: addOpen.title ?? "", parentGoalId: addOpen.parentGoalId })}
        />
      )}
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function FirstCycleHero({ onStart, hasGoals }: { onStart: () => void; hasGoals: boolean }) {
  return (
    <div className="os-rise overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <Chip tone="info">
            <Sparkles /> 12 Week Year
          </Chip>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Start your first 12-week cycle</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            A year is too long to feel urgent. Pick up to three goals for the next twelve weeks, give each a key result (the outcome) and 1–3
            weekly tactics (the actions you control). Every week you get one number: did you do what you said?
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={onStart} className={buttonVariants({ size: "lg" })}>
              <Rocket className="h-4 w-4" /> Start a cycle
            </button>
            {hasGoals && <span className="self-center text-xs text-muted-foreground">You can bring in goals you already have.</span>}
          </div>
        </div>
        <ol className="grid gap-3 text-sm">
          {[
            [Target, "≤ 3 goals", "Fewer goals, finished. The rest wait in the backlog."],
            [Flag, "Key result = lag", "The number that tells you it worked. Graded 0–1 at the end."],
            [ClipboardCheck, "Tactics = lead", "What you do every week. Logged with one tap."],
            [Trophy, "≥ 85% execution", "Hit your tactics and the results tend to follow."],
          ].map(([I, t, d]) => {
            const Icon = I as typeof Target;
            return (
              <li key={t as string} className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-medium">{t as string}</span>
                  <span className="text-xs text-muted-foreground">{d as string}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function CycleHeader({ cockpit }: { cockpit: Cockpit }) {
  const c = cockpit.cycle!;
  const s = c.state;
  const [editOpen, setEditOpen] = useState(false);
  const label =
    s.phase === "planned"
      ? `Starts in ${s.startsIn} day${s.startsIn === 1 ? "" : "s"}`
      : s.phase === "running"
        ? `Week ${s.week} of 12`
        : s.phase === "buffer"
          ? "Week 13 · buffer"
          : "Cycle ended";
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarRange className="h-3.5 w-3.5" /> {c.name} · {fmtRange(c.startDate, c.endDate)}
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="ml-0.5 rounded p-0.5 hover:bg-accent hover:text-foreground"
              aria-label="Rename or delete this cycle"
              title="Rename or delete this cycle"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{label}</p>
        </div>
        <div className="flex flex-wrap gap-6">
          <Metric label="Days left" value={s.phase === "planned" ? 84 : s.daysLeft} />
          <Metric label="Active goals" value={`${cockpit.goals.length}/${cockpit.maxActiveGoals}`} />
          <Metric
            label="Avg execution"
            value={cockpit.avgExecution === null ? "—" : `${cockpit.avgExecution}%`}
            tone={cockpit.avgExecution !== null && cockpit.avgExecution >= 85 ? "success" : undefined}
          />
        </div>
      </div>
      <div className="mt-4 flex gap-1" aria-label={label}>
        {Array.from({ length: 13 }, (_, i) => {
          const w = i + 1;
          const done = s.phase === "done" || s.phase === "ended" || (s.phase !== "planned" && (w < s.rawWeek));
          const cur = s.phase !== "planned" && w === s.rawWeek;
          return (
            <span
              key={w}
              title={w === 13 ? "Week 13 · review & recharge" : `Week ${w}`}
              className={cn(
                "h-2 flex-1 rounded-full",
                w === 13 && "max-w-[40px]",
                done ? "bg-primary" : cur ? "os-shine bg-primary/60" : "bg-muted",
                w === 13 && !done && !cur && "bg-success-soft",
              )}
            />
          );
        })}
      </div>
      {s.phase === "buffer" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-success-soft px-4 py-3 text-sm">
          <span className="text-success">
            <b>Week 13:</b> review, celebrate and recharge. Grade your key results and plan the next cycle.
          </span>
          <Link href="/reviews/quarterly" className={buttonVariants({ size: "sm" })}>
            Quarterly review <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
      {s.phase === "ended" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warning-soft px-4 py-3 text-sm">
          <span className="text-warning">This cycle has ended. Close it with a quarterly review, then start the next one.</span>
          <Link href="/reviews/quarterly" className={buttonVariants({ size: "sm" })}>
            Close the cycle <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
      {s.phase === "planned" && (
        <p className="mt-3 text-xs text-muted-foreground">
          Starts {fmtYmd(c.startDate, { weekday: "long", month: "short", day: "numeric" })}. Use the days before to set up tactics and your Ideal Week.
        </p>
      )}
      {cockpit.nextCycle && (
        <p className="mt-3 text-xs text-muted-foreground">
          Next: {cockpit.nextCycle.name} starts {fmtYmd(cockpit.nextCycle.startDate, { month: "short", day: "numeric" })}.
        </p>
      )}
      {editOpen && (
        <EditCycleDialog
          cycle={{ _id: c._id, name: c.name, theme: c.theme }}
          goalCount={cockpit.goals.length + cockpit.finished.length}
          onClose={() => setEditOpen(false)}
        />
      )}
    </section>
  );
}

/** Rename a cycle (name + theme) or delete it (cycles.remove: its goals move to the backlog). */
function EditCycleDialog({
  cycle,
  goalCount,
  onClose,
}: {
  cycle: { _id: Id<"cycles">; name: string; theme?: string };
  goalCount: number;
  onClose: () => void;
}) {
  const update = useMutation(api.cycles.update);
  const remove = useMutation(api.cycles.remove);
  const [name, setName] = useState(cycle.name);
  const [theme, setTheme] = useState(cycle.theme ?? "");
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await update({ id: cycle._id, name: name.trim(), theme: theme.trim() });
      toast("Cycle updated", { tone: "success" });
      onClose();
    } catch (err) {
      toast(errMsg(err), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    const goalsLine = goalCount
      ? `Its ${goalCount} goal${goalCount === 1 ? "" : "s"} stay${goalCount === 1 ? "s" : ""} — active ones move to the Someday backlog, with their key results and tactics kept.`
      : "It has no goals.";
    if (!window.confirm(`Delete the cycle “${cycle.name}”?\n\n${goalsLine}\n\nThis can't be undone.`)) return;
    setBusy(true);
    try {
      await remove({ id: cycle._id });
      toast("Cycle deleted", { tone: "info" });
      onClose();
    } catch (err) {
      toast(errMsg(err), { tone: "warning" });
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title="Edit cycle" size="sm">
      <form onSubmit={(e) => void save(e)} className="space-y-4">
        <Field label="Name">
          <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Q4 sprint" maxLength={80} />
        </Field>
        <Field label="Theme (optional)" hint="One word or line for the 12 weeks.">
          <TextInput value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Ship and sell" maxLength={120} />
        </Field>
        <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
          <button type="button" onClick={() => void del()} disabled={busy} className={cn(buttonVariants({ variant: "ghost" }), "text-danger hover:bg-danger-soft hover:text-danger")}>
            <Trash2 className="h-4 w-4" /> Delete cycle
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
              Cancel
            </button>
            <button type="submit" disabled={busy || !name.trim()} className={buttonVariants()}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

function ExecutionCard({ cockpit }: { cockpit: Cockpit }) {
  const ex = cockpit.execution;
  const phase = cockpit.cycle?.state.phase;
  const label = phase === "buffer" || phase === "ended" ? "week 12" : "this week";
  return (
    <Section title="Execution score" icon={Mountain} hint="Tactics done ÷ planned. 85% is the bar.">
      <div className="flex flex-col items-center gap-4">
        <ExecRing
          score={ex.score}
          size={148}
          label={label}
          sub={ex.target ? `${ex.achieved} of ${ex.target} reps done` : "Add tactics to your goals to get a score"}
        />
        {ex.score !== null && ex.score >= 85 && <Chip tone="success">On the bar — keep the streak of weeks going</Chip>}
        <ExecBars points={cockpit.history} className="w-full" />
      </div>
    </Section>
  );
}

function GoalCard({ goal, weekStart, today, readOnly }: { goal: GoalCardData; weekStart: string; today: string; readOnly?: boolean }) {
  const setKr = useMutation(api.goals.setKeyResult);
  const krs = goal.keyResults ?? [];
  const bumpKr = async (index: number, delta: number) => {
    try {
      const r = await setKr({ id: goal._id, index, delta });
      if (r?.reached) reward(`Key result reached · ${krs[index].title}`, undefined, true);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  };
  return (
    <article className="os-rise flex flex-col rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-start justify-between gap-2 px-4 pt-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <AreaDot color={areaColor(goal.area)} /> {goal.area?.name ?? "—"}
            <Chip tone={goal.goalType === "learning" ? "info" : "muted"} className="ml-1 px-1.5 py-0 text-[10px] capitalize">
              {goal.goalType ?? "outcome"}
            </Chip>
          </p>
          <Link href={`/goals/${goal._id}`} className="mt-1 block text-base font-semibold leading-snug hover:underline">
            {goal.title}
          </Link>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
              goal.weekScore === null ? "bg-muted text-muted-foreground" : goal.weekScore >= 85 ? "bg-success-soft text-success" : "bg-muted",
            )}
            title="This week's execution for this goal"
          >
            {goal.weekScore === null ? "—" : `${goal.weekScore}%`}
          </span>
          <Spark values={goal.trend} width={72} height={20} />
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        {krs.length === 0 ? (
          <Link href={`/goals/${goal._id}`} className="block rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
            + Add a key result — the number that proves it worked
          </Link>
        ) : (
          krs.map((k, i) => {
            const p = k.target > 0 ? Math.round((k.current / k.target) * 100) : 0;
            return (
              <div key={i}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate font-medium" title={k.title}>
                    <Flag className="mr-1 inline h-3 w-3 text-muted-foreground" />
                    {k.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 tabular-nums text-muted-foreground">
                    {!readOnly && (
                      <button onClick={() => void bumpKr(i, -1)} className="rounded p-0.5 hover:bg-accent hover:text-foreground" aria-label="Decrease key result">
                        <Minus className="h-3 w-3" />
                      </button>
                    )}
                    <span className="font-semibold text-foreground">{k.current}</span>/{k.target} {k.unit}
                    {!readOnly && (
                      <button onClick={() => void bumpKr(i, 1)} className="rounded p-0.5 hover:bg-accent hover:text-foreground" aria-label="Increase key result">
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                </div>
                <Bar value={p} tone={p >= 100 ? "success" : "primary"} className="mt-1" />
              </div>
            );
          })
        )}
      </div>

      <div className="mt-auto space-y-1.5 border-t border-border px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">This week</p>
        {goal.tactics.length === 0 && goal.habits.length === 0 && (
          <Link href={`/goals/${goal._id}`} className="block text-xs text-muted-foreground hover:text-foreground">
            + Add 1–3 tactics (weekly actions)
          </Link>
        )}
        {goal.tactics
          .filter((t) => t.active)
          .map((t) => (
            <TacticCounter
              key={t._id}
              tacticId={t._id}
              title={t.title}
              done={t.done}
              target={t.target}
              weekStart={weekStart}
              today={today}
              compact
              readOnly={readOnly}
            />
          ))}
        {goal.habits.map((h) => (
          <HabitLead key={h.id} title={h.title} done={h.done} target={h.target} />
        ))}
      </div>
    </article>
  );
}

function AddGoalDialog({
  onClose,
  cycleId,
  areas,
  weekStart,
  initial,
}: {
  onClose: () => void;
  cycleId: Id<"cycles">;
  areas: { _id: string; name: string }[];
  weekStart: string;
  initial: GoalDraft;
}) {
  const create = useMutation(api.goals.createWithPlan);
  const [draft, setDraft] = useState<GoalDraft>(initial);
  const [busy, setBusy] = useState(false);
  const problems = goalProblems(draft);
  const save = async () => {
    setBusy(true);
    try {
      const c = cleanGoal(draft);
      await create({
        title: c.title,
        lifeAreaId: c.lifeAreaId,
        level: "cycle",
        cycleId,
        goalType: c.goalType,
        reasons: c.reasons,
        keyResults: c.keyResults,
        tactics: c.tactics,
        parentGoalId: c.parentGoalId,
      });
      reward(`New 12-week goal · ${c.title}`, undefined, true);
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onClose={onClose} title="New 12-week goal" size="lg">
      <GoalPlanEditor draft={draft} onChange={setDraft} areas={areas} weekStart={weekStart} />
      <div className="mt-6 flex items-center justify-between gap-2 border-t border-border pt-4">
        <span className="text-xs text-warning">{problems.length ? `Needs ${problems.join(", ")}` : ""}</span>
        <div className="flex gap-2">
          <button onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
            Cancel
          </button>
          <button onClick={() => void save()} disabled={busy || problems.length > 0} className={buttonVariants()}>
            {busy ? "Saving…" : "Add goal"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function AnnualGoals({
  cockpit,
  areas,
  onPlan,
  canPlan,
}: {
  cockpit: Cockpit;
  areas: { _id: Id<"lifeAreas">; name: string }[];
  onPlan: (g: Cockpit["annual"][number]) => void;
  canPlan: boolean;
}) {
  const create = useMutation(api.goals.createWithPlan);
  const setStatus = useMutation(api.goals.setGoalStatus);
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const a = area || areas[0]?._id;
    if (!title.trim()) return;
    if (!a) return void toast("Add a life area first — every goal lives in one.", { tone: "info" });
    try {
      await create({ title: title.trim(), lifeAreaId: a as Id<"lifeAreas">, level: "annual" });
      setTitle("");
      if (cockpit.annual.length + 1 > 8) toast("More than 8 annual goals — consider trimming the list.", { tone: "info" });
    } catch (err) {
      toast(errMsg(err), { tone: "warning" });
    }
  };
  const live = cockpit.annual.filter((g) => g.goalStatus !== "achieved");
  return (
    <Section
      title="Annual goals"
      icon={Telescope}
      hint="Up to 8 for the year. Each 12-week cycle pulls from here."
      action={<Chip tone={live.length > 8 ? "warning" : "muted"}>{live.length}/8</Chip>}
    >
      <div className="space-y-1.5">
        {cockpit.annual.length === 0 && (
          <p className="pb-2 text-sm text-muted-foreground">Where do you want to be by December? Add the few that matter most.</p>
        )}
        {cockpit.annual.map((g) => (
          <div key={g._id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/50">
            <AreaDot color={areaColor(g.area)} />
            <Link href={`/goals/${g._id}`} className={cn("min-w-0 flex-1 truncate text-sm", g.goalStatus === "achieved" && "text-muted-foreground line-through")}>
              {g.title}
            </Link>
            {g.children > 0 && <Chip tone="muted">{g.children} cycle goal{g.children === 1 ? "" : "s"}</Chip>}
            {canPlan && g.goalStatus !== "achieved" && (
              <button onClick={() => onPlan(g)} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7")} title="Plan a 12-week goal for it">
                <Rocket className="h-3.5 w-3.5" /> <span className="hidden sm:inline">This cycle</span>
              </button>
            )}
            <button
              onClick={() =>
                void setStatus({ id: g._id, goalStatus: g.goalStatus === "achieved" ? "active" : "achieved" })
                  .then(() => g.goalStatus !== "achieved" && reward(`Annual goal achieved · ${g.title}`, undefined, true))
                  .catch((err) => toast(errMsg(err), { tone: "warning" }))
              }
              className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-success focus:opacity-100 group-hover:opacity-100"
              aria-label={g.goalStatus === "achieved" ? "Mark not achieved" : "Mark achieved"}
              title={g.goalStatus === "achieved" ? "Mark not achieved" : "Mark achieved"}
            >
              <Trophy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => void setStatus({ id: g._id, goalStatus: "dropped" }).catch((err) => toast(errMsg(err), { tone: "warning" }))}
              className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-danger focus:opacity-100 group-hover:opacity-100"
              aria-label="Drop"
              title="Drop"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => void add(e)} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add an annual goal…" className="flex-1" />
        <Select value={area} onChange={(e) => setArea(e.target.value)} className="sm:w-44" aria-label="Life area">
          {areas.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </Select>
        <button className={buttonVariants({ variant: "secondary" })} disabled={!title.trim()}>
          Add
        </button>
      </form>
    </Section>
  );
}

function BacklogList({ cockpit }: { cockpit: Cockpit }) {
  const setStatus = useMutation(api.goals.setGoalStatus);
  const moveHere = useMutation(api.cycles.moveGoalHere);
  const remove = useMutation(api.goals.remove);
  const cycle = cockpit.cycle;
  const canActivate = !!cycle && cycle.state.phase !== "ended" && cockpit.goals.length < cockpit.maxActiveGoals;
  const items = [...cockpit.stragglers, ...cockpit.backlog];
  const activate = async (id: Id<"goals">, straggler: boolean) => {
    if (!cycle) return;
    try {
      if (straggler) await moveHere({ goalId: id, cycleId: cycle._id });
      else await setStatus({ id, goalStatus: "active", cycleId: cycle._id });
      reward("Goal activated for this cycle");
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  };
  return (
    <Section title="Someday backlog" icon={Hourglass} hint="12-week goals waiting their turn. Activating one respects the cap.">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing waiting. When a new idea shows up mid-cycle, park it here instead of starting it.</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((g) => {
            const straggler = cockpit.stragglers.some((s) => s._id === g._id);
            return (
              <div key={g._id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/50">
                <AreaDot color={areaColor(g.area)} />
                <Link href={`/goals/${g._id}`} className="min-w-0 flex-1 truncate text-sm">
                  {g.title}
                </Link>
                {straggler && <Chip tone="warning">from a past cycle</Chip>}
                {canActivate && (
                  <button onClick={() => void activate(g._id, straggler)} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7")}>
                    Activate
                  </button>
                )}
                <button
                  onClick={() => void setStatus({ id: g._id, goalStatus: "dropped" }).catch((err) => toast(errMsg(err), { tone: "warning" }))}
                  className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                  aria-label="Drop"
                  title="Drop"
                >
                  <Archive className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => confirm(`Delete “${g.title}” and its tactics?`) && void remove({ id: g._id }).catch((err) => toast(errMsg(err), { tone: "warning" }))}
                  className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-danger focus:opacity-100 group-hover:opacity-100"
                  aria-label="Delete"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {cycle && !canActivate && items.length > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">The cycle is full ({cockpit.maxActiveGoals} active). Finish or drop one to activate another.</p>
      )}
    </Section>
  );
}

function LegacyGoals({ cockpit }: { cockpit: Cockpit }) {
  const convert = useMutation(api.goals.convert);
  const cycle = cockpit.cycle;
  const doConvert = async (id: Id<"goals">, level: "cycle" | "annual") => {
    try {
      const status = await convert({ id, level, cycleId: level === "cycle" && cycle && cycle.state.phase !== "ended" ? cycle._id : undefined });
      if (level === "annual") toast("Moved to annual goals", { tone: "success" });
      else if (status === "active") reward("Converted — it's in this cycle now");
      else toast(cycle ? "Converted to the backlog (the cycle is full)" : "Converted to the backlog — start a cycle to activate it", { tone: "info" });
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  };
  return (
    <Section className="mt-4" title="Other goals" hint="Goals from before the 12-week system. Convert the ones still alive." icon={Target}>
      <div className="grid gap-2 md:grid-cols-2">
        {cockpit.legacy.map((g) => (
          <div key={g._id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/goals/${g._id}`} className="min-w-0">
                <p className="truncate text-sm font-medium hover:underline">{g.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <AreaDot color={areaColor(g.area)} /> {g.area?.name} · {g.milestoneDone}/{g.milestoneTotal} milestones
                </p>
              </Link>
              <span className="text-xs font-semibold tabular-nums">{g.progress}%</span>
            </div>
            <Bar value={g.progress} className="mt-2" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button onClick={() => void doConvert(g._id, "cycle")} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "h-7")}>
                <Rocket className="h-3.5 w-3.5" /> Convert to 12-week goal
              </button>
              <button onClick={() => void doConvert(g._id, "annual")} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7")}>
                Make annual
              </button>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PastCycles({ cockpit }: { cockpit: Cockpit }) {
  const [open, setOpen] = useState(false);
  return (
    <Section
      className="mt-4"
      title="Finished & past cycles"
      icon={Trophy}
      action={
        <button onClick={() => setOpen(!open)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          {open ? "Hide" : "Show"}
        </button>
      }
    >
      {!open ? (
        <p className="text-sm text-muted-foreground">
          {cockpit.finished.length} finished this cycle · {cockpit.pastCycles.length} past cycle{cockpit.pastCycles.length === 1 ? "" : "s"}
        </p>
      ) : (
        <div className="space-y-4">
          {cockpit.finished.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">This cycle</p>
              {cockpit.finished.map((g) => (
                <Link key={g._id} href={`/goals/${g._id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent/50">
                  <Chip tone={g.goalStatus === "achieved" ? "success" : "muted"}>{g.goalStatus}</Chip>
                  <span className="truncate">{g.title}</span>
                </Link>
              ))}
            </div>
          )}
          {cockpit.pastCycles.map((c) => (
            <div key={c._id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{c.name}</p>
                <span className="text-xs text-muted-foreground">
                  {fmtRange(c.startDate, c.endDate)} · avg grade {c.avgGrade === null ? "—" : c.avgGrade.toFixed(2)}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {c.goals.map((g) => (
                  <li key={g._id} className="flex items-center justify-between gap-2 text-xs">
                    <Link href={`/goals/${g._id}`} className="truncate hover:underline">
                      {g.title}
                    </Link>
                    <span className={cn("tabular-nums", (g.grade ?? 0) >= 0.7 ? "text-success" : "text-muted-foreground")}>
                      {g.grade === undefined ? "—" : g.grade.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
