"use client";

/** Reviews hub — the current weekly / monthly / quarterly / annual review, status and history. */
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowRight, CalendarCheck, CalendarDays, CalendarRange, Check, ClipboardCheck, Flame, History, Mountain, Telescope } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bar, Chip, EmptyHint, PageShell, Section, buttonVariants, cn } from "@/components/os/kit";
import { useToday, fmtYmd, ymdOf } from "@/lib/day";
import { REVIEWS, ReviewKind } from "@/components/direction/reviewMeta";
import { ago, periodLabel } from "@/components/direction/util";

const ICONS: Record<ReviewKind, LucideIcon> = {
  weekly: CalendarDays,
  monthly: CalendarRange,
  quarterly: Mountain,
  annual: Telescope,
};

export default function ReviewsPage() {
  const today = useToday();
  const hub = useQuery(api.periodicReviews.hub, { today });

  return (
    <PageShell
      title="Reviews"
      icon={ClipboardCheck}
      subtitle="Look back, get current, score, commit. The weekly review is the product — everything else feeds it."
      actions={
        hub && hub.weeklyStreak > 0 ? (
          <Chip tone="success">
            <Flame /> {hub.weeklyStreak}-week review streak
          </Chip>
        ) : undefined
      }
    >
      {hub === undefined ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-64" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {hub.cards.map((c) => {
              const meta = REVIEWS[c.kind];
              const Icon = ICONS[c.kind];
              const label = periodLabel(c.kind, c.periodKey, c.periodStart, c.periodEnd, c.cycleName);
              const href = `/reviews/${c.kind}?period=${encodeURIComponent(c.periodKey)}`;
              const pct = Math.round((c.stepsDone / c.stepsTotal) * 100);
              return (
                <article
                  key={c.kind}
                  className={cn(
                    "os-rise flex flex-col rounded-xl border bg-card p-4 shadow-card sm:p-5",
                    c.status === "done" ? "border-success/40" : c.kind === "weekly" ? "border-ring" : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-muted">
                      <Icon className="h-5 w-5" />
                    </span>
                    {c.status === "done" ? (
                      <Chip tone="success">
                        <Check /> Done
                      </Chip>
                    ) : c.status === "draft" ? (
                      <Chip tone="info">In progress</Chip>
                    ) : (
                      <Chip tone="muted">Not started</Chip>
                    )}
                  </div>
                  <h2 className="mt-3 text-base font-semibold">{meta.title}</h2>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{meta.blurb}</p>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>
                        {c.stepsDone}/{c.stepsTotal} steps
                      </span>
                      <span>
                        {meta.minutes} · min {meta.minMinutes}
                      </span>
                    </div>
                    <Bar value={c.status === "done" ? 100 : pct} tone={c.status === "done" ? "success" : "primary"} />
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Last done: {c.lastDone ? ago(c.lastDone.completedAt) : "never"} · +{meta.xp} XP
                  </p>
                  <Link href={href} className={cn(buttonVariants({ variant: c.status === "done" ? "outline" : "default" }), "mt-4 w-full")}>
                    {c.status === "done" ? "View" : c.status === "draft" ? "Resume" : "Start"} <ArrowRight className="h-4 w-4" />
                  </Link>
                  {c.otherDrafts.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {c.otherDrafts.slice(0, 2).map((d) => (
                        <Link
                          key={d.periodKey}
                          href={`/reviews/${c.kind}?period=${encodeURIComponent(d.periodKey)}`}
                          className="block truncate text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                        >
                          Unfinished: {periodLabel(c.kind, d.periodKey, d.periodStart, d.periodEnd)}
                        </Link>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <Section className="mt-6" title="History" icon={History}>
            {hub.history.length === 0 ? (
              <EmptyHint
                icon={CalendarCheck}
                title="No reviews yet"
                hint="Start with the weekly review — the minimum version takes about 20 minutes and earns 120 XP."
                action={
                  <Link href="/reviews/weekly" className={buttonVariants({ size: "sm" })}>
                    Start the weekly review
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {hub.history.map((r) => {
                  const s = (r.scores ?? {}) as Record<string, unknown>;
                  const bits: string[] = [];
                  if (typeof s.execution === "number") bits.push(`execution ${s.execution}%`);
                  if (typeof s.big3Total === "number" && s.big3Total) bits.push(`Big 3 ${s.big3Done}/${s.big3Total}`);
                  if (typeof s.avgRating === "number") bits.push(`areas avg ${s.avgRating}`);
                  if (typeof s.avgGrade === "number") bits.push(`avg grade ${s.avgGrade}`);
                  if (typeof s.avgExecution === "number") bits.push(`avg execution ${s.avgExecution}%`);
                  if (typeof s.achievedPct === "number") bits.push(`${s.achievedPct}% goals achieved`);
                  if (s.minimum) bits.push("minimum mode");
                  return (
                    <Link
                      key={r._id}
                      href={`/reviews/${r.kind}?period=${encodeURIComponent(r.periodKey)}`}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm hover:bg-accent/40 sm:px-2"
                    >
                      <Chip tone="muted" className="capitalize">
                        {r.kind}
                      </Chip>
                      <span className="min-w-0 flex-1 truncate font-medium">{periodLabel(r.kind, r.periodKey, r.periodStart, r.periodEnd)}</span>
                      <span className="text-xs text-muted-foreground">{bits.join(" · ")}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.completedAt ? fmtYmd(ymdOf(r.completedAt), { month: "short", day: "numeric" }) : ""}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </Section>
        </>
      )}
    </PageShell>
  );
}
