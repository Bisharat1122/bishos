"use client";

/**
 * "Start a 12-week cycle" wizard: name/theme + start Monday → pick or create
 * ≤ cap goals → plan each (type, reasons, key result, tactics) → launch.
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, ArrowRight, CalendarRange, Check, Plus, Rocket, Target, X } from "lucide-react";
import { AreaDot, Chip, Dialog, Field, Segmented, TextInput, areaColor, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { addDaysYmd, fmtYmd, mondayOf } from "@/lib/day";
import { GoalPlanEditor, GoalDraft, cleanGoal, emptyGoal, goalProblems } from "./GoalPlanEditor";
import { errMsg, fmtRange } from "./util";

export type Candidate = {
  _id: Id<"goals">;
  title: string;
  lifeAreaId: Id<"lifeAreas">;
  source: "annual" | "backlog" | "legacy" | "carry";
  goalType?: "outcome" | "learning";
  reasons?: string[];
  keyResults?: { title: string; current: number; target: number; unit: string }[];
};

const SOURCE_LABEL: Record<Candidate["source"], string> = {
  annual: "Annual goal",
  backlog: "Backlog",
  legacy: "Existing goal",
  carry: "Carried over",
};

export function CycleWizard({
  open,
  onClose,
  today,
  candidates,
  maxGoals,
  closePrevious,
  preselect,
  onLaunched,
}: {
  open: boolean;
  onClose: () => void;
  today: string;
  candidates: Candidate[];
  maxGoals: number;
  closePrevious?: { _id: Id<"cycles">; name: string } | null;
  preselect?: Id<"goals">[];
  onLaunched?: (id: Id<"cycles">) => void;
}) {
  const areas = useQuery(api.lifeAreas.list);
  const suggest = useQuery(api.cycles.suggestStart, { today });
  const launch = useMutation(api.cycles.launch);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("");
  const [startMode, setStartMode] = useState<"this" | "next" | "custom">("next");
  const [custom, setCustom] = useState("");
  const [goals, setGoals] = useState<GoalDraft[]>([]);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);

  const liveAreas = useMemo(() => (areas ?? []).filter((a) => !a.archived).sort((a, b) => a.order - b.order), [areas]);

  // Reset when opened.
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setTheme("");
    setActive(0);
    const pre = (preselect ?? [])
      .map((id) => candidates.find((c) => c._id === id))
      .filter(Boolean)
      .slice(0, maxGoals)
      .map((c) => fromCandidate(c!));
    setGoals(pre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!suggest || !open) return;
    setStartMode(suggest.suggested === suggest.thisMonday ? "this" : "next");
    setName((n) => n || `Cycle · ${fmtYmd(suggest.suggested, { month: "short", day: "numeric" })}`);
  }, [suggest, open]);

  const startDate =
    startMode === "this" ? suggest?.thisMonday : startMode === "next" ? suggest?.nextMonday : custom ? mondayOf(custom) : undefined;
  const endDate = startDate ? addDaysYmd(startDate, 83) : undefined;

  function fromCandidate(c: Candidate): GoalDraft {
    return emptyGoal(c.lifeAreaId, {
      goalId: c._id,
      source: c.source,
      title: c.title,
      goalType: c.goalType ?? "outcome",
      reasons: c.reasons ?? [],
      parentGoalId: c.source === "annual" ? c._id : undefined,
      keyResults: c.keyResults?.length ? c.keyResults : [{ title: "", current: 0, target: 0, unit: "" }],
    });
  }

  const toggleCandidate = (c: Candidate) => {
    const has = goals.find((g) => g.goalId === c._id);
    if (has) return setGoals(goals.filter((g) => g.goalId !== c._id));
    if (goals.length >= maxGoals) return toast(`${maxGoals} goals max — focus is the point.`, { tone: "info" });
    setGoals([...goals, fromCandidate(c)]);
  };
  const addNew = () => {
    if (goals.length >= maxGoals) return toast(`${maxGoals} goals max — focus is the point.`, { tone: "info" });
    setGoals([...goals, emptyGoal(liveAreas[goals.length % Math.max(1, liveAreas.length)]?._id ?? "")]);
    setActive(goals.length);
  };

  const problems = goals.map((g) => goalProblems(g));
  const canNext =
    step === 0 ? !!startDate && name.trim().length > 0 : step === 1 ? goals.length > 0 : step === 2 ? problems.every((p) => p.length === 0) : true;

  const doLaunch = async () => {
    if (!startDate) return;
    setBusy(true);
    try {
      const id = await launch({
        name: name.trim(),
        theme: theme.trim() || undefined,
        startDate,
        today,
        closePreviousId: closePrevious?._id,
        goals: goals.map((g) => cleanGoal(g)),
      });
      reward(`${name.trim()} launched — 12 weeks, ${goals.length} goal${goals.length === 1 ? "" : "s"} 🚀`, undefined, true);
      onLaunched?.(id);
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const STEPS = ["Cycle", "Goals", "Plan", "Launch"];

  return (
    <Dialog open={open} onClose={onClose} title="Start a 12-week cycle" size="xl">
      {/* stepper */}
      <ol className="mb-5 flex items-center gap-1.5 overflow-x-auto text-xs">
        {STEPS.map((s, i) => (
          <li key={s} className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition-colors",
                i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
              )}
            >
              {i < step ? <Check className="h-3 w-3" /> : <span className="tabular-nums">{i + 1}</span>}
              {s}
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Twelve weeks is long enough to matter and short enough to feel urgent. You score your <b>actions</b> every week (lead) and grade
            the <b>results</b> at the end (lag). Week 13 is a buffer to review and recharge.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Q4 sprint" />
            </Field>
            <Field label="Theme (optional)" hint="One word or line for the 12 weeks — e.g. “Pipeline before polish”.">
              <TextInput value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Ship and sell" />
            </Field>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Start on a Monday</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {suggest &&
                (
                  [
                    ["this", "This Monday", suggest.thisMonday],
                    ["next", "Next Monday", suggest.nextMonday],
                  ] as const
                ).map(([k, label, d]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setStartMode(k)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      startMode === k ? "border-ring bg-accent" : "border-border hover:bg-accent/50",
                    )}
                  >
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{fmtYmd(d, { weekday: "short", month: "short", day: "numeric" })}</p>
                  </button>
                ))}
              <div
                className={cn("rounded-lg border p-3 transition-colors", startMode === "custom" ? "border-ring bg-accent" : "border-border")}
                onClick={() => setStartMode("custom")}
              >
                <p className="text-sm font-medium">Another week</p>
                <input
                  type="date"
                  value={custom}
                  onChange={(e) => {
                    setCustom(e.target.value);
                    setStartMode("custom");
                  }}
                  className="mt-1 w-full bg-transparent text-xs text-muted-foreground outline-none"
                  aria-label="Custom start date"
                />
              </div>
            </div>
            {startDate && endDate && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarRange className="h-3.5 w-3.5" /> {fmtRange(startDate, endDate)} · week 13 buffer {fmtRange(addDaysYmd(endDate, 1), addDaysYmd(endDate, 7))}
              </p>
            )}
            {closePrevious && (
              <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
                “{closePrevious.name}” will be closed. Ungraded goals get graded from their key results (≥0.7 counts as achieved; the rest move to the
                backlog). For a proper close, run the quarterly review first.
              </p>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Pick up to <b>{maxGoals}</b>. More than three active goals splits your attention — the rest wait in the backlog.
            </p>
            <Chip tone={goals.length >= maxGoals ? "warning" : "muted"}>
              {goals.length}/{maxGoals} chosen
            </Chip>
          </div>
          {goals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {goals.map((g, i) => (
                <span key={g.key} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  {g.title || `New goal ${i + 1}`}
                  <button type="button" onClick={() => setGoals(goals.filter((x) => x.key !== g.key))} aria-label="Remove" className="text-muted-foreground hover:text-danger">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {candidates.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {candidates.map((c) => {
                const on = goals.some((g) => g.goalId === c._id);
                const area = areas?.find((a) => a._id === c.lifeAreaId);
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => toggleCandidate(c)}
                    className={cn("flex items-start gap-3 rounded-lg border p-3 text-left transition-colors", on ? "border-ring bg-accent" : "border-border hover:bg-accent/40")}
                  >
                    <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2", on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                      {on && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{c.title}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <AreaDot color={areaColor(area)} /> {area?.name ?? "—"} · {SOURCE_LABEL[c.source]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <button type="button" onClick={addNew} disabled={goals.length >= maxGoals} className={buttonVariants({ variant: "outline" })}>
            <Plus className="h-4 w-4" /> New goal
          </button>
        </div>
      )}

      {step === 2 && goals.length > 0 && (
        <div className="space-y-4">
          {goals.length > 1 && (
            <Segmented
              value={String(Math.min(active, goals.length - 1))}
              onChange={(v) => setActive(Number(v))}
              options={goals.map((g, i) => ({
                value: String(i),
                label: (
                  <span className="flex items-center gap-1.5">
                    {problems[i].length === 0 ? <Check className="h-3 w-3 text-success" /> : <span className="size-1.5 rounded-full bg-warning" />}
                    {g.title.slice(0, 22) || `Goal ${i + 1}`}
                  </span>
                ),
              }))}
            />
          )}
          {(() => {
            const i = Math.min(active, goals.length - 1);
            const g = goals[i];
            return (
              <div key={g.key}>
                <GoalPlanEditor
                  draft={g}
                  onChange={(next) => setGoals(goals.map((x, j) => (j === i ? next : x)))}
                  areas={liveAreas}
                  weekStart={startDate}
                />
                {problems[i].length > 0 && <p className="mt-3 text-xs text-warning">Still needs {problems[i].join(", ")}.</p>}
              </div>
            );
          })()}
        </div>
      )}

      {step === 3 && startDate && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-lg font-semibold">{name}</p>
            {theme && <p className="text-sm text-muted-foreground">“{theme}”</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              {fmtRange(startDate, endDate!)} · 12 weeks · aim for ≥85% execution each week
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {goals.map((g) => {
              const c = cleanGoal(g);
              const area = areas?.find((a) => a._id === g.lifeAreaId);
              return (
                <div key={g.key} className="rounded-xl border border-border p-3">
                  <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <AreaDot color={areaColor(area)} /> {area?.name} · {g.goalType}
                  </p>
                  <p className="mt-1 font-medium">{c.title}</p>
                  {c.keyResults[0] && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      KR: {c.keyResults[0].title} → {c.keyResults[0].target} {c.keyResults[0].unit}
                    </p>
                  )}
                  <ul className="mt-2 space-y-0.5 text-xs">
                    {c.tactics.map((t) => (
                      <li key={t.title}>
                        • {t.title} <span className="text-muted-foreground">{t.weeklyTarget}×/wk</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-2 border-t border-border pt-4">
        <button type="button" onClick={() => (step === 0 ? onClose() : setStep(step - 1))} className={buttonVariants({ variant: "ghost" })}>
          <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Cancel" : "Back"}
        </button>
        {step < 3 ? (
          <button type="button" disabled={!canNext} onClick={() => setStep(step + 1)} className={buttonVariants()}>
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={() => void doLaunch()} className={buttonVariants()}>
            <Rocket className="h-4 w-4" /> {busy ? "Launching…" : "Launch cycle"}
          </button>
        )}
      </div>
    </Dialog>
  );
}
