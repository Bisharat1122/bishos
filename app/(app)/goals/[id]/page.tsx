"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Trash2, X, CalendarClock, ArrowUpRight, Target, Gauge, Wand2 } from "lucide-react";
import { Card, Topbar, EmptyState } from "@/components/ui";
import { DetailSkeleton } from "@/components/Skeleton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AddToMomentum } from "@/components/momentum/AddToMomentum";
import { cn } from "@/lib/utils";

type Timeframe = "weekly" | "monthly" | "yearly" | "custom";
type SmartKey = "specific" | "measurable" | "achievable" | "relevant" | "timeBound";

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

  const goal = useQuery(api.goals.get, { id });
  const areas = useQuery(api.lifeAreas.list);
  const update = useMutation(api.goals.update);
  const addMilestone = useMutation(api.goals.addMilestone);
  const toggleMilestone = useMutation(api.goals.toggleMilestone);
  const removeMilestone = useMutation(api.goals.removeMilestone);
  const removeGoal = useMutation(api.goals.remove);
  const aiBreakdown = useAction(api.ai.goalMilestones);

  const [msText, setMsText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const areaName = (aid: Id<"lifeAreas">) =>
    areas?.find((a) => a._id === aid)?.name;

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
        <div className="px-8 py-7">
          <EmptyState title="Goal not found" />
        </div>
      </div>
    );

  const smart = goal.smart ?? {};
  const smartScore = SMART.filter((s) => (smart[s.key] ?? "").trim()).length;
  const tags = goal.tags ?? [];
  const deadlineValue = goal.deadline
    ? new Date(goal.deadline).toISOString().slice(0, 10)
    : "";
  const metric = goal.metric;

  function saveSmart(key: SmartKey, value: string) {
    void update({ id, smart: { ...smart, [key]: value } });
  }

  return (
    <div>
      <Topbar />
      <div className="mx-auto max-w-4xl px-8 py-7">
        <Breadcrumb items={[{ label: "Goals", href: "/goals" }, { label: goal.title }]} />

        {/* Header */}
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="flex-1">
            <input
              defaultValue={goal.title}
              onBlur={(e) =>
                e.target.value.trim() &&
                e.target.value !== goal.title &&
                update({ id, title: e.target.value.trim() })
              }
              className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none"
            />
            <Link
              href={`/life-areas/${goal.lifeAreaId}`}
              className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
            >
              {areaName(goal.lifeAreaId)}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <AddToMomentum type="goal" itemId={id} title={goal.title} />
            <button
              onClick={async () => {
                await removeGoal({ id });
                router.push("/goals");
              }}
              className="text-muted-foreground hover:text-warning"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Top settings row */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold">{goal.progress}%</p>
              <p className="text-[10px] text-muted-foreground">
                {metric && metric.target > 0 ? "from metric" : "from key results"}
              </p>
            </div>
            <Gauge className="h-8 w-8 text-primary" />
          </Card>
          <Card>
            <p className="mb-1 text-xs text-muted-foreground">Timeframe</p>
            <select
              value={goal.timeframe}
              onChange={(e) => void update({ id, timeframe: e.target.value as Timeframe })}
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm outline-none"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
          </Card>
          <Card>
            <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" /> Deadline
            </p>
            <input
              type="date"
              value={deadlineValue}
              onChange={(e) =>
                void update({
                  id,
                  deadline: e.target.value
                    ? new Date(e.target.value + "T12:00:00").getTime()
                    : null,
                })
              }
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm outline-none [color-scheme:dark]"
            />
          </Card>
        </div>

        {/* SMART framework */}
        <Card className="mt-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <Target className="h-4 w-4 text-primary" /> SMART goal
            </h2>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                smartScore === 5
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {smartScore}/5 defined
            </span>
          </div>
          <div className="space-y-3">
            {SMART.map((s) => (
              <div key={s.key} className="flex gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                    (smart[s.key] ?? "").trim()
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
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
                    className="mt-1 w-full resize-none rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm outline-none focus:border-primary/60"
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
            <p className="mb-3 text-xs text-muted-foreground">
              Set a number to track — it drives the progress automatically.
            </p>
            <MetricEditor
              initial={metric}
              onSave={(m) => void update({ id, metric: m })}
            />
            {metric && metric.target > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>
                    {metric.current} / {metric.target} {metric.unit}
                  </span>
                  <span>{goal.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Key results / milestones */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Key results ({goal.milestones.filter((m) => m.done).length}/
                {goal.milestones.length})
              </h3>
              <button
                onClick={async () => {
                  setAiBusy(true);
                  try {
                    await aiBreakdown({ goalId: id });
                  } finally {
                    setAiBusy(false);
                  }
                }}
                disabled={aiBusy}
                className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/25 disabled:opacity-50"
                title="Let AI break this goal into milestones"
              >
                <Wand2 className="h-3.5 w-3.5" />
                {aiBusy ? "Thinking…" : "AI milestones"}
              </button>
            </div>
            <div className="space-y-1.5">
              {goal.milestones.map((m, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2"
                >
                  <button
                    onClick={() => void toggleMilestone({ id, index: i })}
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                      m.done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground",
                    )}
                  >
                    {m.done ? "✓" : ""}
                  </button>
                  <span
                    className={cn("flex-1 text-sm", m.done && "text-muted-foreground line-through")}
                  >
                    {m.text}
                  </span>
                  <button
                    onClick={() => void removeMilestone({ id, index: i })}
                    className="text-muted-foreground opacity-0 transition hover:text-warning group-hover:opacity-100"
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
                placeholder="Add a key result / action step…"
                className="flex-1 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
              <button className="rounded-lg bg-muted px-3 py-2 text-sm font-medium">Add</button>
            </form>

            {/* tags */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
              {tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs text-primary"
                >
                  {t}
                  <button onClick={() => void update({ id, tags: tags.filter((x) => x !== t) })}>
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
        className="w-20 rounded-lg border border-border bg-muted/30 px-2 py-1.5 outline-none"
      />
      <span className="text-muted-foreground">/</span>
      <input
        type="number"
        value={target}
        onChange={(e) => setTarget(Number(e.target.value))}
        onBlur={save}
        className="w-20 rounded-lg border border-border bg-muted/30 px-2 py-1.5 outline-none"
      />
      <input
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        onBlur={save}
        placeholder="unit (e.g. pages, $, reps)"
        className="flex-1 rounded-lg border border-border bg-muted/30 px-2 py-1.5 outline-none"
      />
    </div>
  );
}
