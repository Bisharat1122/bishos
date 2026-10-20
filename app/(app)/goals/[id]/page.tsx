"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Trash2,
  X,
  CalendarClock,
  ArrowUpRight,
  Target,
  Gauge,
  Wand2,
  Flag,
  Footprints,
  Plus,
  Minus,
  Pause,
  Play,
  Link2,
  ListOrdered,
  Brain,
  Repeat,
  FolderKanban,
  CheckSquare,
} from "lucide-react";
import { Card, Topbar, EmptyState } from "@/components/ui";
import { DetailSkeleton } from "@/components/Skeleton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AddToMomentum } from "@/components/momentum/AddToMomentum";
import { Bar, Chip, InlineEdit, ListEditor, Section, Segmented, Select, inputClass } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { useToday, mondayOf, fmtYmd } from "@/lib/day";
import { TacticCounter } from "@/components/direction/widgets";
import { WoopCoach } from "@/components/direction/WoopCoach";
import { errMsg, fmtRange } from "@/components/direction/util";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/variants";

type Timeframe = "weekly" | "monthly" | "yearly" | "custom";
type SmartKey = "specific" | "measurable" | "achievable" | "relevant" | "timeBound";
type KR = { title: string; current: number; target: number; unit: string };

const SMART: { key: SmartKey; label: string; letter: string; hint: string }[] = [
  { key: "specific", label: "Specific", letter: "S", hint: "What exactly will you accomplish? Be precise and concrete." },
  { key: "measurable", label: "Measurable", letter: "M", hint: "How will you know it's done? Define the number or signal." },
  { key: "achievable", label: "Achievable", letter: "A", hint: "Is it realistic? What resources or steps make it possible?" },
  { key: "relevant", label: "Relevant", letter: "R", hint: "Why does this matter to you right now? Your real motivation." },
  { key: "timeBound", label: "Time-bound", letter: "T", hint: "By when? Set the deadline and a cadence to check in." },
];

export default function GoalPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"goals">;
  const router = useRouter();
  const today = useToday();
  const weekStart = mondayOf(today);

  const goal = useQuery(api.goals.get, { id });
  const links = useQuery(api.goals.links, { id, weekStart });
  const areas = useQuery(api.lifeAreas.list);
  const current = useQuery(api.cycles.current, { today });
  const update = useMutation(api.goals.update);
  const setGoalStatus = useMutation(api.goals.setGoalStatus);
  const convert = useMutation(api.goals.convert);
  const addMilestone = useMutation(api.goals.addMilestone);
  const toggleMilestone = useMutation(api.goals.toggleMilestone).withOptimisticUpdate((store, { index }) => {
    const g = store.getQuery(api.goals.get, { id });
    if (!g) return;
    const milestones = g.milestones.map((m, i) => (i === index ? { ...m, done: !m.done } : m));
    const progress =
      (g.metric && g.metric.target > 0) || (g.keyResults && g.keyResults.length)
        ? g.progress
        : milestones.length
          ? Math.round((milestones.filter((m) => m.done).length / milestones.length) * 100)
          : 0;
    store.setQuery(api.goals.get, { id }, { ...g, milestones, progress });
  });
  const removeMilestone = useMutation(api.goals.removeMilestone);
  const removeGoal = useMutation(api.goals.remove);
  const aiBreakdown = useAction(api.ai.goalMilestones);

  const [msText, setMsText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const areaName = (aid: Id<"lifeAreas">) => areas?.find((a) => a._id === aid)?.name;

  if (goal === undefined)
    return (
      <div>
        <Topbar />
        <DetailSkeleton />
      </div>
    );
  if (goal === null)
    return (
      <div>
        <Topbar />
        <div className="space-y-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <EmptyState title="Goal not found" hint="It may have been deleted, or the link is wrong." />
          <div className="text-center">
            <Link href="/goals" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Back to goals
            </Link>
          </div>
        </div>
      </div>
    );

  const smart = goal.smart ?? {};
  const smartScore = SMART.filter((s) => (smart[s.key] ?? "").trim()).length;
  const tags = goal.tags ?? [];
  const deadlineValue = goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : "";
  const metric = goal.metric;
  const level = goal.level ?? "legacy";
  const status = goal.goalStatus ?? "active";
  const cycle = links?.cycle ?? null;
  const cycleEnded = !!cycle && (cycle.status === "done" || today > cycle.endDate);
  const isLifeOs = level !== "legacy";

  function saveSmart(key: SmartKey, value: string) {
    void update({ id, smart: { ...smart, [key]: value } });
  }

  const run = async (p: Promise<unknown>, ok?: string) => {
    try {
      await p;
      if (ok) toast(ok, { tone: "success" });
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  };

  const changeLevel = (next: "legacy" | "annual" | "cycle") => {
    if (next === level) return;
    if (next === "legacy") return void run(update({ id, level: null, goalStatus: null, cycleId: null }), "Back to a plain goal");
    if (level === "legacy") {
      const cycleId = next === "cycle" && current && current.state.phase !== "ended" && current.status !== "done" ? current._id : undefined;
      return void run(
        convert({ id, level: next, cycleId }).then((s) =>
          toast(next === "annual" ? "Now an annual goal" : s === "active" ? "In this 12-week cycle" : "Moved to the 12-week backlog", { tone: "success" }),
        ),
      );
    }
    void run(update({ id, level: next, goalStatus: next === "cycle" ? "backlog" : "active", cycleId: next === "annual" ? null : undefined }));
  };

  // Re-activating a cycle goal whose cycle is gone/closed puts it in the current cycle (not back into the closed one).
  const activateInto = level === "cycle" && (!goal.cycleId || cycleEnded) && current && current.status !== "done" ? current._id : undefined;
  const changeStatus = (s: "active" | "backlog" | "achieved" | "dropped") =>
    void run(
      setGoalStatus({ id, goalStatus: s, cycleId: s === "active" ? activateInto : undefined }).then(() => {
        if (s === "achieved") reward(`Goal achieved · ${goal.title}`, undefined, true);
      }),
    );

  return (
    <div>
      <Topbar />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Breadcrumb items={[{ label: "Goals", href: "/goals" }, { label: goal.title }]} />

        {/* Header */}
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <input
              key={goal.title}
              defaultValue={goal.title}
              onBlur={(e) => e.target.value.trim() && e.target.value !== goal.title && update({ id, title: e.target.value.trim() })}
              className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none"
              aria-label="Goal title"
            />
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link href={`/life-areas/${goal.lifeAreaId}`} className="inline-flex items-center gap-1 hover:text-primary">
                {areaName(goal.lifeAreaId)}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              {cycle && (
                <Link href="/goals">
                  <Chip tone="sprint">
                    {cycle.name} · {fmtRange(cycle.startDate, cycle.endDate)}
                  </Chip>
                </Link>
              )}
              {links?.parent && (
                <Link href={`/goals/${links.parent._id}`}>
                  <Chip tone="outline">
                    <Link2 /> {links.parent.title}
                  </Chip>
                </Link>
              )}
              {goal.grade !== undefined && <Chip tone={goal.grade >= 0.7 ? "success" : "muted"}>Grade {goal.grade.toFixed(2)}</Chip>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AddToMomentum type="goal" itemId={id} title={goal.title} />
            <button
              onClick={async () => {
                if (!confirm(`Delete “${goal.title}” and its tactics?`)) return;
                // Leave first so this page doesn't flash "not found" while the delete lands.
                router.push("/goals");
                try {
                  await removeGoal({ id });
                } catch (e) {
                  toast(errMsg(e), { tone: "warning" });
                }
              }}
              className="text-muted-foreground hover:text-danger"
              aria-label="Delete goal"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Life OS model */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr]">
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-2xl font-semibold tabular-nums">{goal.progress}%</p>
              <p className="text-[10px] text-muted-foreground">
                {metric && metric.target > 0 ? "from metric" : goal.keyResults?.length ? "from key results" : "from milestones"}
              </p>
            </div>
            <Gauge className="h-8 w-8 text-primary" />
          </Card>
          <Card>
            <p className="mb-1.5 text-xs text-muted-foreground">Level</p>
            <Segmented
              size="sm"
              value={level}
              onChange={changeLevel}
              options={[
                { value: "cycle", label: "12-week" },
                { value: "annual", label: "Annual" },
                { value: "legacy", label: "Plain" },
              ]}
            />
            {isLifeOs && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Select value={status} onChange={(e) => changeStatus(e.target.value as typeof status)} className="h-8 w-auto text-xs" aria-label="Status">
                  <option value="active">Active</option>
                  <option value="backlog">Backlog</option>
                  <option value="achieved">Achieved</option>
                  <option value="dropped">Dropped</option>
                </Select>
                <Segmented
                  size="sm"
                  value={goal.goalType ?? "outcome"}
                  onChange={(t) => void run(update({ id, goalType: t }))}
                  options={[
                    { value: "outcome", label: "Outcome" },
                    { value: "learning", label: "Learning" },
                  ]}
                />
              </div>
            )}
          </Card>
          <Card>
            <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" /> Deadline
            </p>
            <input
              type="date"
              value={deadlineValue}
              onChange={(e) => void update({ id, deadline: e.target.value ? new Date(e.target.value + "T12:00:00").getTime() : null })}
              className="w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
            />
            <select
              value={goal.timeframe}
              onChange={(e) => void update({ id, timeframe: e.target.value as Timeframe })}
              className="mt-2 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
              aria-label="Timeframe"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
          </Card>
        </div>

        {/* Reasons + key results */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Section title="Why it matters" icon={ListOrdered} hint="Ranked reasons — read them when motivation dips.">
            <ListEditor items={goal.reasons ?? []} onChange={(reasons) => void update({ id, reasons })} numbered placeholder="Add a reason…" />
          </Section>
          <KeyResults goalId={id} krs={goal.keyResults ?? []} grade={goal.grade} showGrade={cycleEnded || goal.grade !== undefined} />
        </div>

        {/* Tactics */}
        {(level === "cycle" || (links?.tactics.length ?? 0) > 0) && (
          <Tactics goalId={id} tactics={links?.tactics} weekStart={weekStart} today={today} readOnly={status !== "active"} />
        )}

        {/* WOOP */}
        <Section className="mt-4" title="WOOP coach" icon={Brain} hint="Wish · Outcome · Obstacle · Plan — name the obstacle before it shows up.">
          <WoopCoach goalId={id} woop={goal.woop ?? {}} />
        </Section>

        {/* Linked */}
        <Linked links={links} />

        {/* SMART framework */}
        <Card className="mt-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <Target className="h-4 w-4 text-primary" /> SMART goal
            </h2>
            <span className={cn("rounded-md px-3 py-1 text-xs font-medium", smartScore === 5 ? "bg-success-soft text-success" : "bg-muted text-muted-foreground")}>
              {smartScore}/5 defined
            </span>
          </div>
          <div className="space-y-3">
            {SMART.map((s) => (
              <div key={s.key} className="flex gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
                    (smart[s.key] ?? "").trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {s.letter}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.label}</p>
                  <textarea
                    defaultValue={smart[s.key] ?? ""}
                    onBlur={(e) => saveSmart(s.key, e.target.value)}
                    placeholder={s.hint}
                    rows={2}
                    className="mt-1 w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Measurable metric */}
          <Card>
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
              <Gauge className="h-4 w-4 text-primary" /> Measurable target
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">Set a number to track — it drives the progress automatically.</p>
            <MetricEditor initial={metric} onSave={(m) => void update({ id, metric: m })} />
            {metric && metric.target > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>
                    {metric.current} / {metric.target} {metric.unit}
                  </span>
                  <span>{goal.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${goal.progress}%` }} />
                </div>
              </div>
            )}
          </Card>

          {/* Milestones */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Milestones ({goal.milestones.filter((m) => m.done).length}/{goal.milestones.length})
              </h3>
              <button
                onClick={async () => {
                  setAiBusy(true);
                  try {
                    await aiBreakdown({ goalId: id });
                  } catch (e) {
                    toast(errMsg(e), { tone: "warning" });
                  } finally {
                    setAiBusy(false);
                  }
                }}
                disabled={aiBusy}
                className={buttonVariants({ variant: "secondary", size: "sm" })}
                title="Let AI break this goal into milestones"
              >
                <Wand2 className="h-3.5 w-3.5" />
                {aiBusy ? "Thinking…" : "AI milestones"}
              </button>
            </div>
            <div className="space-y-1.5">
              {goal.milestones.map((m, i) => (
                <div key={i} className="group flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2">
                  <button
                    onClick={() => void toggleMilestone({ id, index: i })}
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                      m.done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground",
                    )}
                    aria-label={m.done ? "Mark not done" : "Mark done"}
                  >
                    {m.done ? "✓" : ""}
                  </button>
                  <span className={cn("flex-1 text-sm", m.done && "text-muted-foreground line-through")}>{m.text}</span>
                  <button
                    onClick={() => void removeMilestone({ id, index: i })}
                    className="text-muted-foreground opacity-0 transition hover:text-danger group-hover:opacity-100"
                    aria-label="Remove milestone"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!msText.trim()) return;
                void addMilestone({ id, text: msText.trim() });
                setMsText("");
              }}
            >
              <input
                value={msText}
                onChange={(e) => setMsText(e.target.value)}
                placeholder="Add a milestone / action step…"
                className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
              />
              <button className={buttonVariants({ variant: "secondary" })}>Add</button>
            </form>

            {/* tags */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-md bg-primary/15 px-2.5 py-0.5 text-xs text-primary">
                  {t}
                  <button onClick={() => void update({ id, tags: tags.filter((x) => x !== t) })} aria-label={`Remove tag ${t}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const t = tagInput.trim();
                    if (t && !tags.includes(t)) void update({ id, tags: [...tags, t] });
                    setTagInput("");
                  }
                }}
                placeholder="Add tag…"
                className="w-24 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function KeyResults({ goalId, krs, grade, showGrade }: { goalId: Id<"goals">; krs: KR[]; grade?: number; showGrade: boolean }) {
  const update = useMutation(api.goals.update);
  const setKr = useMutation(api.goals.setKeyResult);
  const [draft, setDraft] = useState<KR>({ title: "", current: 0, target: 0, unit: "" });
  const save = (next: KR[]) => update({ id: goalId, keyResults: next }).catch((e) => toast(errMsg(e), { tone: "warning" }));
  const bump = async (i: number, delta: number) => {
    try {
      const r = await setKr({ id: goalId, index: i, delta });
      if (r?.reached) reward(`Key result reached · ${krs[i].title}`, undefined, true);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  };
  const suggested = krs.length ? krs.reduce((a, k) => a + (k.target ? Math.min(1, k.current / k.target) : 0), 0) / krs.length : 0;
  return (
    <Section title="Key results (lag)" icon={Flag} hint="The numbers that prove it worked. Graded 0–1 at the end of the cycle.">
      <div className="space-y-3">
        {krs.length === 0 && <p className="text-sm text-muted-foreground">No key result yet. What number would make this a clear win?</p>}
        {krs.map((k, i) => {
          const p = k.target > 0 ? Math.round((k.current / k.target) * 100) : 0;
          return (
            <div key={i} className="group space-y-1">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <InlineEdit value={k.title} onSave={(v) => void save(v.trim() ? krs.map((x, j) => (j === i ? { ...x, title: v.trim() } : x)) : krs.filter((_, j) => j !== i))} className="text-sm font-medium" />
                </div>
                <button onClick={() => void bump(i, -1)} className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "size-7")} aria-label="Decrease">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  key={`${k.current}`}
                  type="number"
                  defaultValue={k.current}
                  onBlur={(e) => Number(e.target.value) !== k.current && void setKr({ id: goalId, index: i, current: Number(e.target.value) })}
                  className={cn(inputClass, "h-7 w-16 px-2 text-right tabular-nums")}
                  aria-label="Current value"
                />
                <span className="text-xs text-muted-foreground">/</span>
                <input
                  key={`t${k.target}`}
                  type="number"
                  defaultValue={k.target}
                  onBlur={(e) => Number(e.target.value) !== k.target && void save(krs.map((x, j) => (j === i ? { ...x, target: Number(e.target.value) } : x)))}
                  className={cn(inputClass, "h-7 w-16 px-2 text-right tabular-nums")}
                  aria-label="Target"
                />
                <button onClick={() => void bump(i, 1)} className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "size-7")} aria-label="Increase">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Bar value={p} tone={p >= 100 ? "success" : "primary"} className="flex-1" />
                <span className="w-24 text-right text-[11px] tabular-nums text-muted-foreground">
                  {p}% {k.unit && `· ${k.unit}`}
                </span>
              </div>
            </div>
          );
        })}
        {krs.length < 5 && (
          <form
            className="grid grid-cols-[1fr_64px_72px_auto] gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.title.trim()) return;
              void save([...krs, { ...draft, title: draft.title.trim(), unit: draft.unit.trim() }]);
              setDraft({ title: "", current: 0, target: 0, unit: "" });
            }}
          >
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Add a key result…" className={cn(inputClass, "h-8 min-w-0")} />
            <input type="number" value={draft.target || ""} onChange={(e) => setDraft({ ...draft, target: Number(e.target.value) })} placeholder="Target" className={cn(inputClass, "h-8 min-w-0 px-2")} />
            <input value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} placeholder="unit" className={cn(inputClass, "h-8 min-w-0 px-2")} />
            <button className={buttonVariants({ variant: "secondary", size: "sm" })} disabled={!draft.title.trim()}>
              Add
            </button>
          </form>
        )}
        {showGrade && (
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Final grade</span>
              <span className={cn("font-semibold tabular-nums", (grade ?? suggested) >= 0.7 ? "text-success" : "")}>{(grade ?? suggested).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              defaultValue={grade ?? Math.round(suggested * 20) / 20}
              onMouseUp={(e) => void update({ id: goalId, grade: Number((e.target as HTMLInputElement).value) })}
              onTouchEnd={(e) => void update({ id: goalId, grade: Number((e.target as HTMLInputElement).value) })}
              onKeyUp={(e) => void update({ id: goalId, grade: Number((e.target as HTMLInputElement).value) })}
              className="mt-2 w-full accent-[var(--primary)]"
              aria-label="Grade 0 to 1"
            />
            <p className="text-[11px] text-muted-foreground">0.6–0.7 is a success for a stretch goal. Suggested from key results: {suggested.toFixed(2)}.</p>
          </div>
        )}
      </div>
    </Section>
  );
}

type TacticRow = {
  _id: Id<"tactics">;
  title: string;
  weeklyTarget: number;
  ifThen?: string;
  active: boolean;
  done: number;
  target: number;
  history: { weekStart: string; done: number; target: number }[];
};

function Tactics({
  goalId,
  tactics,
  weekStart,
  today,
  readOnly,
}: {
  goalId: Id<"goals">;
  tactics?: TacticRow[];
  weekStart: string;
  today: string;
  readOnly: boolean;
}) {
  const create = useMutation(api.tactics.create);
  const update = useMutation(api.tactics.update);
  const remove = useMutation(api.tactics.remove);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(3);
  const [ifThen, setIfThen] = useState("");
  const activeCount = (tactics ?? []).filter((t) => t.active).length;
  return (
    <Section
      className="mt-4"
      title="Tactics (lead)"
      icon={Footprints}
      hint="1–3 weekly actions you fully control. Each one you log counts toward the execution score."
      action={<Chip tone="muted">This week · {fmtYmd(weekStart, { month: "short", day: "numeric" })}</Chip>}
    >
      {tactics === undefined ? (
        <div className="skeleton h-24" />
      ) : (
        <div className="space-y-3">
          {tactics.length === 0 && <p className="text-sm text-muted-foreground">No tactics yet. What will you do every week that makes the key result likely?</p>}
          {tactics.map((t) => (
            <div key={t._id} className={cn("space-y-2 rounded-lg border border-border p-3", !t.active && "opacity-60")}>
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <InlineEdit value={t.title} onSave={(v) => v.trim() && void update({ id: t._id, title: v })} className="text-sm font-medium" />
                </div>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  Target
                  <input
                    key={t.weeklyTarget}
                    type="number"
                    min={1}
                    defaultValue={t.weeklyTarget}
                    onBlur={(e) => Number(e.target.value) !== t.weeklyTarget && void update({ id: t._id, weeklyTarget: Number(e.target.value), weekStart })}
                    className={cn(inputClass, "h-7 w-14 px-2")}
                  />
                  /wk
                </label>
                <button
                  onClick={() => void update({ id: t._id, active: !t.active })}
                  className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                  title={t.active ? "Pause tactic" : "Resume tactic"}
                  aria-label={t.active ? "Pause tactic" : "Resume tactic"}
                >
                  {t.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => confirm(`Delete tactic “${t.title}” and its history?`) && void remove({ id: t._id })}
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "hover:text-danger")}
                  aria-label="Delete tactic"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <InlineEdit value={t.ifThen ?? ""} placeholder="Add an if-then plan…" onSave={(v) => void update({ id: t._id, ifThen: v || null })} className="text-xs text-muted-foreground" />
              {t.active && (
                <TacticCounter tacticId={t._id} title="This week" done={t.done} target={t.target} weekStart={weekStart} today={today} compact readOnly={readOnly} />
              )}
              {t.history.length > 0 && (
                <div className="flex items-end gap-[3px]" aria-label="12-week history">
                  {t.history.map((h, i) => {
                    const r = h.target ? Math.min(1, h.done / h.target) : 0;
                    const future = h.weekStart > weekStart;
                    return (
                      <span
                        key={h.weekStart}
                        title={`Week ${i + 1}: ${future ? "upcoming" : `${h.done}/${h.target}`}`}
                        className={cn("flex-1 rounded-t-[3px]", future ? "bg-muted/60" : r >= 1 ? "bg-success" : r > 0 ? "bg-primary/70" : "bg-muted", h.weekStart === weekStart && "ring-1 ring-ring")}
                        style={{ height: future ? 4 : Math.max(4, r * 22) }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {activeCount < 3 ? (
            <form
              className="space-y-2 rounded-lg border border-dashed border-border p-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!title.trim()) return;
                try {
                  await create({ goalId, title, weeklyTarget: target, ifThen: ifThen || undefined });
                  setTitle("");
                  setIfThen("");
                  setTarget(3);
                } catch (err) {
                  toast(errMsg(err), { tone: "warning" });
                }
              }}
            >
              <div className="grid grid-cols-[1fr_92px_auto] gap-2">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New tactic, e.g. 5 discovery calls" className={cn(inputClass, "h-8 min-w-0")} />
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <input type="number" min={1} value={target} onChange={(e) => setTarget(Number(e.target.value))} className={cn(inputClass, "h-8 w-14 px-2")} />
                  /wk
                </label>
                <button className={buttonVariants({ size: "sm" })} disabled={!title.trim()}>
                  Add
                </button>
              </div>
              <input value={ifThen} onChange={(e) => setIfThen(e.target.value)} placeholder="If-then (optional): If it's 9:00 Monday, then I…" className={cn(inputClass, "h-8 w-full text-xs")} />
            </form>
          ) : (
            <p className="text-[11px] text-muted-foreground">Three active tactics is plenty. Pause one to add another.</p>
          )}
        </div>
      )}
    </Section>
  );
}

function Linked({ links }: { links: FunctionReturnType<typeof api.goals.links> | undefined }) {
  if (links === undefined) return <div className="skeleton mt-4 h-32" />;
  if (links === null) return null;
  const empty = !links.projects.length && !links.tasks.length && !links.habits.length && !links.children.length;
  return (
    <Section className="mt-4" title="Linked work" icon={Link2} hint="Projects, tasks and habits that serve this goal.">
      {empty ? (
        <p className="text-sm text-muted-foreground">
          Nothing linked yet. Link a project or task to this goal from its page, or attach a habit as a lead measure on the Habits page.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <FolderKanban className="h-3.5 w-3.5" /> Projects ({links.projects.length})
            </p>
            <div className="space-y-1">
              {links.projects.map((p) => (
                <Link key={p._id} href={`/projects/${p._id}`} className="block rounded-md px-2 py-1 text-sm hover:bg-accent">
                  <span className="truncate">{p.title}</span>
                  <span className="ml-1 text-[11px] text-muted-foreground">· {p.status}</span>
                </Link>
              ))}
            </div>
            {links.children.length > 0 && (
              <>
                <p className="mb-2 mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Target className="h-3.5 w-3.5" /> 12-week goals ({links.children.length})
                </p>
                {links.children.map((c) => (
                  <Link key={c._id} href={`/goals/${c._id}`} className="block rounded-md px-2 py-1 text-sm hover:bg-accent">
                    {c.title}
                  </Link>
                ))}
              </>
            )}
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CheckSquare className="h-3.5 w-3.5" /> Tasks ({links.taskCounts.done}/{links.taskCounts.total} done)
            </p>
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {links.tasks.map((t) => (
                <Link key={t._id} href={`/tasks/${t._id}`} className={cn("block truncate rounded-md px-2 py-1 text-sm hover:bg-accent", t.status === "done" && "text-muted-foreground line-through")}>
                  {t.title}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Repeat className="h-3.5 w-3.5" /> Habits ({links.habits.length})
            </p>
            {links.habits.map((h) => (
              <Link key={h._id} href={`/habits/${h._id}`} className="block rounded-md px-2 py-1 text-sm hover:bg-accent">
                {h.title}
                {h.weeklyTarget && <span className="ml-1 text-[11px] text-muted-foreground">· {h.weeklyTarget}×/wk</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

function MetricEditor({
  initial,
  onSave,
}: {
  initial?: { current: number; target: number; unit: string };
  onSave: (m: { current: number; target: number; unit: string }) => void;
}) {
  const [current, setCurrent] = useState(initial?.current ?? 0);
  const [target, setTarget] = useState(initial?.target ?? 0);
  const [unit, setUnit] = useState(initial?.unit ?? "");

  const save = () => onSave({ current, target, unit });

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <input
        type="number"
        value={current}
        onChange={(e) => setCurrent(Number(e.target.value))}
        onBlur={save}
        className="w-20 rounded-md border border-input bg-card px-2 py-1.5 shadow-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
        aria-label="Current"
      />
      <span className="text-muted-foreground">/</span>
      <input
        type="number"
        value={target}
        onChange={(e) => setTarget(Number(e.target.value))}
        onBlur={save}
        className="w-20 rounded-md border border-input bg-card px-2 py-1.5 shadow-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
        aria-label="Target"
      />
      <input
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        onBlur={save}
        placeholder="unit (e.g. pages, $, reps)"
        className="flex-1 rounded-md border border-input bg-card px-2 py-1.5 shadow-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
      />
    </div>
  );
}
