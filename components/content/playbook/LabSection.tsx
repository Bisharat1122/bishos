"use client";

import { FlaskConical, Lock, Play, RotateCcw, Shuffle } from "lucide-react";
import { buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { BEGINNER_HOLD, LAB_RAMP, LAB_TOTAL } from "@/lib/kallaway";
import { addDaysYmd, fmtYmd, mondayOf } from "@/lib/day";
import { brickLabel, labMessage, type Lab, type SectionState, type StrategyPatch } from "./model";
import { Block, Rules, StepCard } from "./ui";

const MAX = Math.max(...LAB_RAMP);
const TONE_BOX: Record<string, string> = {
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  muted: "bg-muted text-muted-foreground",
};

export function LabSection({ s, lab, today, save }: { s: SectionState; lab: Lab | null; today: string; save: (p: StrategyPatch) => Promise<unknown> }) {
  const thisMonday = mondayOf(today);
  const nextMonday = addDaysYmd(thisMonday, 7);
  const msg = labMessage(lab);

  const start = (d: string) =>
    void save({ labStartDate: d })
      .then(() => toast(d === thisMonday ? "Lab started. Week 1: 3 reps." : `Lab starts ${fmtYmd(d)}. Bank a few scripts.`, { tone: "success" }))
      .catch(() => undefined);
  const reset = () => {
    if (!confirm("Reset the 60-day lab? Your published pieces stay; only the lab start date is cleared.")) return;
    void save({ labStartDate: null }).catch(() => undefined);
  };

  const weeks = lab?.weeks ?? LAB_RAMP.map((target, i) => ({ n: i + 1, start: addDaysYmd(thisMonday, i * 7), target, done: 0 }));

  return (
    <StepCard
      id="pb-lab"
      n={s.n}
      title={s.title}
      phase={s.phase}
      pct={s.pct}
      done={s.done}
      summary={s.summary}
      why={[
        "About 50 short videos in 60 days: 3 in week 1, 5 in week 2, then 7 a week for 6 weeks.",
        "The first breakout on a cold account typically comes after 10–30 videos. The lab gets you there on purpose.",
      ]}
      action={
        lab ? (
          <button type="button" onClick={reset} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs")}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        ) : undefined
      }
    >
      {!lab && (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-4 sm:flex-row sm:items-center">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <FlaskConical className="h-5 w-5 text-muted-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Start my lab</p>
            <p className="text-xs text-muted-foreground">It runs Monday to Sunday for 8 weeks and counts short videos you mark published in the Studio.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => start(thisMonday)} className={buttonVariants({ size: "sm" })}>
              <Play className="h-3.5 w-3.5" /> This week
            </button>
            <button type="button" onClick={() => start(nextMonday)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Next Monday · {fmtYmd(nextMonday, { month: "short", day: "numeric" })}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Weekly bars */}
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Reps per week</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums leading-none">
                {lab?.total ?? 0}
                <span className="text-sm font-normal text-muted-foreground">/{LAB_TOTAL}</span>
              </p>
            </div>
            {lab && lab.week >= 1 && !lab.finished && (
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">This week</p>
                <p className={cn("text-lg font-semibold tabular-nums leading-none", lab.thisWeekDone >= lab.thisWeekTarget && "text-success")}>
                  {lab.thisWeekDone}/{lab.thisWeekTarget}
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-8 items-end gap-1.5 sm:gap-2" role="list" aria-label="Lab weeks">
            {weeks.map((w) => {
              const current = !!lab && lab.week === w.n;
              const past = !!lab && lab.week > w.n;
              const hit = w.done >= w.target;
              const trackH = (w.target / MAX) * 100;
              const fill = Math.min(1, w.done / w.target) * 100;
              return (
                <div key={w.n} role="listitem" className="flex flex-col items-center gap-1" aria-label={`Week ${w.n}: ${w.done} of ${w.target}`}>
                  <span className={cn("text-[10px] font-medium tabular-nums", hit ? "text-success" : current ? "text-foreground" : "text-muted-foreground")}>
                    {w.done}/{w.target}
                  </span>
                  <div className="flex h-28 w-full items-end">
                    <div
                      className={cn(
                        "relative w-full overflow-hidden rounded-md bg-muted",
                        current && "ring-2 ring-foreground ring-offset-1 ring-offset-card",
                        past && !hit && "bg-warning-soft",
                      )}
                      style={{ height: `${trackH}%` }}
                    >
                      <div
                        className={cn("absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out", hit ? "bg-success" : "bg-primary")}
                        style={{ height: `${fill}%` }}
                      />
                    </div>
                  </div>
                  <span className={cn("text-[10px] tabular-nums", current ? "font-semibold text-foreground" : "text-muted-foreground")}>W{w.n}</span>
                </div>
              );
            })}
          </div>
          <p className={cn("mt-4 rounded-lg px-3 py-2 text-sm", TONE_BOX[msg.tone])}>{msg.text}</p>
          {lab && <p className="mt-2 text-[11px] text-muted-foreground">Started {fmtYmd(lab.start)} · ends {fmtYmd(addDaysYmd(lab.start, 55))}</p>}
        </div>

        {/* How to rep */}
        <div className="space-y-4">
          <Block title="Every rep: hold 3, change 2" hint="Don't invent formats as a beginner. Stack proven bricks.">
            <div className="space-y-1.5">
              {BEGINNER_HOLD.map((k) => (
                <div key={k} className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1">{brickLabel(k)}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">hold</span>
                </div>
              ))}
              {["topic", "angle"].map((k) => (
                <div key={k} className="flex items-center gap-2 rounded-lg border border-dashed border-border px-2.5 py-1.5 text-sm">
                  <Shuffle className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1">{brickLabel(k)}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">change</span>
                </div>
              ))}
            </div>
          </Block>
          <Rules
            items={[
              "Model outliers closely for your first 30–50 videos, like tracing with a stencil.",
              "Ship at 80%. Reps beat polish while you're learning.",
              "Post at the same time daily, for your accountability, not the algorithm.",
              "After the lab: keep formulas that perform on your KPI, attract the ideal viewer, you enjoy, and you're proud of.",
            ]}
          />
        </div>
      </div>
    </StepCard>
  );
}
