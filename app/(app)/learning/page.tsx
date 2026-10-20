"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { AlertTriangle, BookOpen, Brain, CircleHelp, GraduationCap, Lightbulb, Plus, Target, Timer } from "lucide-react";
import { Bar, Chip, EmptyHint, Metric, PageShell, Ring, Section, buttonVariants, cn, toneForPct } from "@/components/os/kit";
import { LearningAreaDialog } from "@/components/mind/LearningAreaDialog";
import { formatMeta, useMinuteNow, useStable } from "@/components/mind/meta";
import { fmtMin, mondayOf, useToday } from "@/lib/day";

type AreaRow = FunctionReturnType<typeof api.learning.listAreas>[number];

export default function LearningPage() {
  const today = useToday();
  const now = useMinuteNow();
  const areas = useStable(useQuery(api.learning.listAreas, { date: today, now }));
  const week = useQuery(api.learning.weekSummary, { weekStart: mondayOf(today) });
  const due = useStable(useQuery(api.recall.dueCount, { now }));
  const [open, setOpen] = useState(false);

  const active = areas?.filter((a) => a.status === "active") ?? [];
  const rest = areas?.filter((a) => a.status !== "active") ?? [];
  const weekPct = week && week.targetMinutes ? Math.round((week.totalMinutes / week.targetMinutes) * 100) : 0;

  return (
    <PageShell
      title="Learning"
      icon={GraduationCap}
      subtitle="Learn by doing, test yourself, then teach it. Practice turns into skill — and into content."
      actions={
        <>
          <Link href="/recall" className={buttonVariants({ variant: "outline" })}>
            <Brain /> Recall
            {due ? <Chip tone="warning" className="ml-0.5">{due} due</Chip> : null}
          </Link>
          <button onClick={() => setOpen(true)} className={buttonVariants()}>
            <Plus /> Learning area
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* This week */}
        {week === undefined ? (
          <div className="skeleton h-[92px]" />
        ) : (
          <Section bodyClassName="grid grid-cols-2 gap-4 sm:grid-cols-5 sm:items-center">
            <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
              <Ring value={weekPct} size={56} tone={toneForPct(weekPct)}>
                <span className="text-xs font-semibold tabular-nums">{weekPct}%</span>
              </Ring>
              <Metric label="Practice this week" value={fmtMin(week.totalMinutes)} sub={week.targetMinutes ? `of ${fmtMin(week.targetMinutes)}` : "no target yet"} />
            </div>
            <Metric label="Sessions" value={week.sessions} sub="this week" />
            <Metric label="Ideas explained" value={week.ideasCreated} sub="→ idea notes" />
            <Metric label="Gaps" value={`${week.gapsAdded}/${week.gapsClosed}`} sub="found / closed" />
            <Metric label="Recall" value={week.recallReviews} sub={week.recallRetention != null ? `${week.recallRetention}% retention` : "reviews"} />
          </Section>
        )}

        {areas === undefined ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-64" />
            ))}
          </div>
        ) : areas.length === 0 ? (
          <EmptyHint
            icon={GraduationCap}
            title="Start your first learning area"
            hint="A learning area is a project with a performance goal — “record a 60-second explainer with no notes”. Map the skills, log practice, test yourself with recall cards, and turn what you learn into posts."
            action={
              <button onClick={() => setOpen(true)} className={buttonVariants()}>
                <Plus /> Learning area
              </button>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {active.map((a, i) => (
                <AreaCard key={a._id} a={a} index={i} />
              ))}
            </div>
            {rest.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paused & done</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {rest.map((a, i) => (
                    <AreaCard key={a._id} a={a} index={i + active.length} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <LearningAreaDialog open={open} onClose={() => setOpen(false)} />
    </PageShell>
  );
}

function AreaCard({ a, index }: { a: AreaRow; index: number }) {
  const target = a.weeklyMinutesTarget ?? 0;
  const pct = target ? Math.round((a.minutesThisWeek / target) * 100) : 0;
  const color = a.color ?? `var(--chart-${(index % 5) + 1})`;
  const tooMany = a.activeResources.length > 2;
  return (
    <Link
      href={`/learning/${a._id}`}
      className={cn(
        "os-rise group flex flex-col rounded-xl border border-border bg-card p-4 text-card-foreground shadow-card transition-colors hover:border-ring/60 sm:p-5",
        a.status !== "active" && "opacity-75",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
            <h3 className="truncate font-semibold">{a.name}</h3>
            {a.status !== "active" && <Chip tone="muted">{a.status}</Chip>}
          </div>
          {a.lifeAreaName && <p className="mt-0.5 text-xs text-muted-foreground">{a.lifeAreaName}</p>}
          {a.targetPerformance ? (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
              <Target className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2">{a.targetPerformance}</span>
            </p>
          ) : (
            <p className="mt-2 text-xs italic text-muted-foreground">Set a target performance — what will you be able to do?</p>
          )}
        </div>
        <Ring value={pct} size={60} stroke={6} color={target ? undefined : "var(--muted-foreground)"} tone={toneForPct(pct)}>
          <span className="flex flex-col items-center leading-none">
            <span className="text-[11px] font-semibold tabular-nums">{a.minutesThisWeek}</span>
            <span className="text-[9px] text-muted-foreground">{target ? `/${target}m` : "min"}</span>
          </span>
        </Ring>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Skills</span>
          <span className="tabular-nums text-muted-foreground">
            {a.skills.total ? `${a.skills.solid}/${a.skills.total} solid · ${a.skills.pct}%` : "no skills mapped"}
          </span>
        </div>
        <Bar value={a.skills.pct} tone="success" />
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Active resources</span>
          {tooMany && (
            <Chip tone="warning" title="Finishing 1–2 at a time beats starting many">
              <AlertTriangle /> {a.activeResources.length} active · max 2
            </Chip>
          )}
        </div>
        {a.activeResources.length ? (
          a.activeResources.slice(0, 2).map((r) => {
            const F = formatMeta(r.format).icon;
            return (
              <div key={r._id} className="flex items-center gap-2 text-xs">
                <F className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{r.title}</span>
                <span className="w-14">
                  <Bar value={r.progress} tone="info" height="h-1" />
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground">{a.queuedResources ? `${a.queuedResources} queued — start one` : "Nothing in progress"}</p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        <Chip tone={a.dueCards ? "warning" : "muted"}>
          <Brain /> {a.dueCards} due
        </Chip>
        <Chip tone="muted">
          <Timer /> {a.sessionsThisWeek} session{a.sessionsThisWeek === 1 ? "" : "s"}
        </Chip>
        {a.openGaps > 0 && (
          <Chip tone="outline">
            <CircleHelp /> {a.openGaps} gap{a.openGaps === 1 ? "" : "s"}
          </Chip>
        )}
        {a.doneResources > 0 && (
          <Chip tone="muted">
            <BookOpen /> {a.doneResources} done
          </Chip>
        )}
        {a.totalCards > 0 && a.dueCards === 0 && (
          <Chip tone="success">
            <Lightbulb /> {a.totalCards} cards
          </Chip>
        )}
      </div>
    </Link>
  );
}
