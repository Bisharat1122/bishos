"use client";

/**
 * Review wizard (/reviews/[kind]?period=…). Resumable: answers autosave and
 * finished steps are remembered. Minimum mode shows only the essential steps.
 * Completing freezes the scores, awards XP once and celebrates.
 */
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, ClipboardCheck, PartyPopper, RotateCcw, Timer, Zap } from "lucide-react";
import { Bar, Chip, EmptyHint, PageShell, buttonVariants, cn } from "@/components/os/kit";
import { celebrate, reward, toast } from "@/components/os/celebrate";
import { useToday, addDaysYmd, mondayOf } from "@/lib/day";
import { REVIEWS, REVIEW_KINDS, ReviewKind } from "@/components/direction/reviewMeta";
import { StepBody, StepCtx } from "@/components/direction/ReviewSteps";
import { errMsg, periodLabel, shiftMonth, useTz } from "@/components/direction/util";

export default function ReviewWizardPage() {
  return (
    <Suspense
      fallback={
        <PageShell title="Review" icon={ClipboardCheck}>
          <div className="skeleton h-96" />
        </PageShell>
      }
    >
      <Wizard />
    </Suspense>
  );
}

function Wizard() {
  const params = useParams<{ kind: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const today = useToday();
  const tz = useTz();
  const kind = params.kind as ReviewKind;
  const valid = REVIEW_KINDS.includes(kind);
  const periodParam = search.get("period") ?? undefined;

  const period = useQuery(api.periodicReviews.period, valid ? { kind, today, periodKey: periodParam } : "skip");
  const review = useQuery(api.periodicReviews.get, period ? { kind, periodKey: period.periodKey } : "skip");
  const pre = useQuery(api.periodicReviews.prefill, period ? { kind, periodKey: period.periodKey, today, tz } : "skip");
  const open = useMutation(api.periodicReviews.open);
  const saveAnswer = useMutation(api.periodicReviews.saveAnswer);
  const setStep = useMutation(api.periodicReviews.setStep);
  const complete = useMutation(api.periodicReviews.complete);
  const reopen = useMutation(api.periodicReviews.reopen);

  const meta = valid ? REVIEWS[kind] : null;
  const answers = useMemo(() => ((review?.answers ?? {}) as Record<string, unknown>), [review]);
  const minimum = answers._minimum === true;
  const steps = useMemo(() => (meta ? meta.steps.filter((s) => !minimum || s.essential) : []), [meta, minimum]);
  const done = new Set(review?.stepsDone ?? []);
  const [current, setCurrent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [startMinimum, setStartMinimum] = useState(false);

  // Resume at the first unfinished step.
  useEffect(() => {
    if (!review) return;
    if (current && steps.some((s) => s.key === current)) return;
    const first = steps.find((s) => !(review.stepsDone ?? []).includes(s.key)) ?? steps[0];
    if (first) setCurrent(first.key);
  }, [review, steps, current]);

  // Reset the cursor when the period changes.
  useEffect(() => setCurrent(null), [period?.periodKey]);

  if (!valid || !meta) {
    return (
      <PageShell title="Review" icon={ClipboardCheck}>
        <EmptyHint
          title="Unknown review"
          hint="Reviews are weekly, monthly, quarterly or annual."
          action={
            <Link href="/reviews" className={buttonVariants({ size: "sm" })}>
              All reviews
            </Link>
          }
        />
      </PageShell>
    );
  }

  const label = period ? periodLabel(kind, period.periodKey, period.periodStart, period.periodEnd, period.cycleName) : "";
  const shift = (n: number) => {
    if (!period) return;
    const k = period.periodKey;
    const next =
      kind === "weekly" ? addDaysYmd(mondayOf(k), n * 7) : kind === "monthly" ? shiftMonth(k, n) : kind === "annual" ? String(Number(k) + n) : null;
    if (next) router.push(`/reviews/${kind}?period=${encodeURIComponent(next)}`);
  };
  const canShift = kind !== "quarterly";

  const save = (key: string, value: unknown) =>
    review ? saveAnswer({ id: review._id, key, value }).catch((e) => toast(errMsg(e), { tone: "warning" })) : Promise.resolve();

  const start = async () => {
    if (!period) return;
    setBusy(true);
    try {
      const id = await open({ kind, periodKey: period.periodKey });
      if (startMinimum) await saveAnswer({ id, key: "_minimum", value: true });
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const idx = steps.findIndex((s) => s.key === current);
  const step = steps[idx];
  const essentialLeft = meta.steps.filter((s) => s.essential && !done.has(s.key));

  const goNext = async () => {
    if (!review || !step) return;
    if (!done.has(step.key)) {
      try {
        await setStep({ id: review._id, step: step.key, done: true });
      } catch (e) {
        return void toast(errMsg(e), { tone: "warning" });
      }
    }
    const nxt = steps[idx + 1];
    if (nxt) {
      setCurrent(nxt.key);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const finish = async () => {
    if (!review) return;
    setBusy(true);
    try {
      if (step && !done.has(step.key)) await setStep({ id: review._id, step: step.key, done: true });
      const r = await complete({ id: review._id, today, tz, minimum });
      reward(`${meta.title} complete${minimum ? " (minimum)" : ""}`, r.xp || undefined, true);
      celebrate(1.6);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <div className="flex flex-wrap items-center gap-2">
      {canShift && (
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 shadow-xs">
          <button onClick={() => shift(-1)} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Previous period">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => shift(1)} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Next period">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
      <Link href="/reviews" className={buttonVariants({ variant: "outline" })}>
        All reviews
      </Link>
    </div>
  );

  const skeleton = (
    <PageShell title={meta.title} icon={ClipboardCheck} actions={header}>
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="skeleton h-80" />
        <div className="skeleton h-[480px]" />
      </div>
    </PageShell>
  );
  if (period === undefined || review === undefined) return skeleton;

  // Intro: not started yet. (Doesn't need the heavy prefill — don't wait for it.)
  if (review === null) {
    return (
      <PageShell title={meta.title} subtitle={label} icon={ClipboardCheck} actions={header}>
        <div className="os-rise mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
          <p className="text-sm text-muted-foreground">{meta.blurb}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip tone="muted">
              <Timer /> {meta.minutes}
            </Chip>
            <Chip tone="muted">Minimum {meta.minMinutes}</Chip>
            <Chip tone="info">
              <Zap /> +{meta.xp} XP
            </Chip>
          </div>
          <ol className="mt-5 space-y-2">
            {meta.steps.map((s, i) => (
              <li key={s.key} className={cn("flex items-start gap-3 text-sm", startMinimum && !s.essential && "opacity-40")}>
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold tabular-nums">{i + 1}</span>
                <span>
                  <span className="font-medium">{s.title}</span>
                  {s.essential && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">essential</span>}
                  <span className="block text-xs text-muted-foreground">{s.prompt}</span>
                </span>
              </li>
            ))}
          </ol>
          <label className="mt-5 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={startMinimum} onChange={(e) => setStartMinimum(e.target.checked)} className="size-4 accent-[var(--primary)]" />
            Minimum mode — only the essential steps ({meta.minMinutes})
          </label>
          <button onClick={() => void start()} disabled={busy} className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full sm:w-auto")}>
            Start review <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-3 text-xs text-muted-foreground">Everything is pre-filled from your data and saves as you go — stop anytime and resume later.</p>
        </div>
      </PageShell>
    );
  }

  if (pre === undefined) return skeleton;

  const ctx: StepCtx = { kind, review, pre, answers, save, today, tz };
  const isDone = review.status === "done";
  const progress = Math.round((steps.filter((s) => done.has(s.key)).length / Math.max(1, steps.length)) * 100);

  return (
    <PageShell
      title={meta.title}
      subtitle={label}
      icon={ClipboardCheck}
      actions={
        <>
          <button
            onClick={() => void save("_minimum", !minimum)}
            className={cn(buttonVariants({ variant: minimum ? "default" : "outline", size: "sm" }))}
            title="Show only the essential steps"
            aria-pressed={minimum}
          >
            <Timer className="h-3.5 w-3.5" /> Minimum {meta.minMinutes}
          </button>
          {header}
        </>
      }
    >
      {isDone && (
        <div className="os-rise mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success/40 bg-success-soft px-4 py-3">
          <div className="flex items-center gap-2 text-success">
            <PartyPopper className="h-5 w-5" />
            <span className="text-sm font-medium">
              Done{review.completedAt ? ` · ${new Date(review.completedAt).toLocaleDateString()}` : ""}
              {kind === "weekly" && typeof (review.scores as { execution?: number } | undefined)?.execution === "number" &&
                ` · execution frozen at ${(review.scores as { execution: number }).execution}%`}
            </span>
          </div>
          <button
            onClick={() => void reopen({ id: review._id }).catch((e) => toast(errMsg(e), { tone: "warning" }))}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reopen
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* rail */}
        <nav className="h-fit rounded-xl border border-border bg-card p-3 shadow-card lg:sticky lg:top-20" aria-label="Review steps">
          <div className="mb-3 space-y-1 px-1">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{progress}% done</span>
              <span>
                {steps.filter((s) => done.has(s.key)).length}/{steps.length}
              </span>
            </div>
            <Bar value={isDone ? 100 : progress} tone={isDone ? "success" : "primary"} />
          </div>
          <ol className="flex gap-1 overflow-x-auto scrollbar-thin lg:flex-col">
            {steps.map((s, i) => {
              const on = s.key === current;
              const finished = done.has(s.key);
              return (
                <li key={s.key} className="shrink-0">
                  <button
                    onClick={() => setCurrent(s.key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      on ? "bg-accent font-medium" : "hover:bg-accent/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
                        finished ? "bg-success text-background" : on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {finished ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className="whitespace-nowrap lg:whitespace-normal">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* step */}
        {step && (
          <section key={step.key} className="fade-in min-w-0 rounded-xl border border-border bg-card shadow-card">
            <div className="border-b border-border px-4 py-4 sm:px-6">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Step {idx + 1} of {steps.length}
                {step.essential && " · essential"}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{step.title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{step.prompt}</p>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <StepBody step={step.key} ctx={ctx} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 sm:px-6">
              <button
                onClick={() => idx > 0 && setCurrent(steps[idx - 1].key)}
                disabled={idx === 0}
                className={buttonVariants({ variant: "ghost" })}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="flex flex-wrap items-center gap-2">
                {!isDone && essentialLeft.length > 0 && idx === steps.length - 1 && (
                  <span className="text-[11px] text-muted-foreground">
                    {essentialLeft.filter((s) => s.key !== step.key).length > 0 &&
                      `Essential left: ${essentialLeft
                        .filter((s) => s.key !== step.key)
                        .map((s) => s.title)
                        .join(", ")}`}
                  </span>
                )}
                {idx < steps.length - 1 ? (
                  <button onClick={() => void goNext()} className={buttonVariants()}>
                    {done.has(step.key) ? "Next" : "Done · next"} <ArrowRight className="h-4 w-4" />
                  </button>
                ) : isDone ? (
                  <Link href="/reviews" className={buttonVariants()}>
                    Back to reviews
                  </Link>
                ) : (
                  <button onClick={() => void finish()} disabled={busy} className={buttonVariants()}>
                    <PartyPopper className="h-4 w-4" /> {busy ? "Completing…" : `Complete review · +${meta.xp} XP`}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}
