"use client";

import { Fragment } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Bar, Segmented, cn } from "@/components/os/kit";
import { KALLAWAY_LOOP } from "@/lib/kallaway";
import { QUIT_ZONE, type SectionState, type Strategy, type StrategyPatch } from "./model";
import { Block, StepCard } from "./ui";

const MILESTONES = [
  { at: 1, label: "First rep" },
  { at: QUIT_ZONE[0], label: "Quit zone" },
  { at: QUIT_ZONE[1], label: "Past it" },
  { at: 100, label: "Stencil off" },
  { at: 300, label: "Batch" },
];

const BATCH = [
  { value: "1", label: "1 at a time" },
  { value: "3", label: "2–3" },
  { value: "10", label: "5–10" },
] as const;

export function LoopSection({ s, st, reps, save }: { s: SectionState; st: Strategy | null; reps: number; save: (p: StrategyPatch) => Promise<unknown> }) {
  const batch = String(st?.batchSize ?? 1);
  const batchOn = BATCH.some((b) => b.value === batch) ? (batch as (typeof BATCH)[number]["value"]) : "1";
  // Log scale so 1 → 300 fits on one bar.
  const pos = (n: number) => Math.min(100, (Math.log10(Math.max(1, n)) / Math.log10(300)) * 100);

  return (
    <StepCard
      id="pb-loop"
      n={s.n}
      title={s.title}
      phase={s.phase}
      pct={s.pct}
      done={s.done}
      summary={s.summary}
      why={[
        "Every piece goes round the same 7 steps. You loop it, rep after rep.",
        "The strategy is the easy part. The skill is how much you improve between one rep and the next.",
      ]}
    >
      {/* Stepper */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1 scrollbar-thin">
        <ol className="flex min-w-max items-stretch gap-1.5">
          {KALLAWAY_LOOP.map((step, i) => (
            <Fragment key={step.key}>
              <li className="flex w-32 flex-col gap-1.5 rounded-lg border border-border bg-background p-2.5 sm:w-36">
                <span className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background tabular-nums">{i + 1}</span>
                  <span className="text-sm font-semibold">{step.label}</span>
                </span>
                <span className="text-[11px] leading-snug text-muted-foreground">{step.hint}</span>
              </li>
              {i < KALLAWAY_LOOP.length - 1 ? (
                <li aria-hidden className="flex items-center text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5" />
                </li>
              ) : (
                <li aria-hidden className="flex flex-col items-center justify-center gap-1 px-1 text-muted-foreground">
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-[10px] uppercase tracking-wide">loop</span>
                </li>
              )}
            </Fragment>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Meta-principle */}
        <div className="rounded-xl border border-border p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">The meta-principle</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">Reps × iteration distance</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-snug">
            <li>
              <span className="font-medium">Volume negates luck.</span> More reps, more shots at a breakout.
            </li>
            <li>
              <span className="font-medium">The sauce is the distance you improve between reps.</span> Break each rep into its bricks, compare it A vs B with the winner in
              your niche, and fix 1–2 things next time.
            </li>
            <li>
              <span className="font-medium">Expect the quit point at 10–30 reps</span>, the moment you think &ldquo;I should be good by now.&rdquo; Most people stop here.
              Don&apos;t.
            </li>
          </ul>
        </div>

        {/* Reps meter */}
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Your reps</p>
            <p className="text-2xl font-semibold tabular-nums leading-none">{reps}</p>
          </div>
          <div className="relative mt-4 pb-7">
            <Bar value={pos(reps)} tone={reps >= QUIT_ZONE[1] ? "success" : reps >= QUIT_ZONE[0] ? "warning" : "primary"} height="h-2" />
            {MILESTONES.map((m) => (
              <span key={m.at} className="absolute top-3 -translate-x-1/2 text-center" style={{ left: `${pos(m.at)}%` }}>
                <span className={cn("mx-auto block h-1.5 w-px", reps >= m.at ? "bg-foreground" : "bg-border")} />
                <span className={cn("block whitespace-nowrap text-[10px] tabular-nums", reps >= m.at ? "text-foreground" : "text-muted-foreground")}>
                  {m.at}
                </span>
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {reps < QUIT_ZONE[0]
              ? "Warm-up. Ship, review, fix one brick, repeat."
              : reps <= QUIT_ZONE[1]
                ? "You're in the quit-point zone. Keep the reps coming."
                : reps < 100
                  ? "Past the quit point. Keep modelling outliers closely for your first 30–50."
                  : "Now find your own lane: borrow formats from other industries."}
          </p>
        </div>
      </div>

      <Block
        title="Reps per batch"
        hint="One rep at a time for your first ~300; batch later. Batching lengthens the iteration cycle: batch 5 and you repeat rep 1's mistake five times."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            size="sm"
            value={batchOn}
            onChange={(v) => void save({ batchSize: Number(v) }).catch(() => undefined)}
            options={BATCH.map((b) => ({ value: b.value, label: b.label }))}
          />
          {reps < 300 && batchOn !== "1" && <span className="text-xs text-warning">Under 300 reps: one at a time iterates faster.</span>}
        </div>
      </Block>
    </StepCard>
  );
}
