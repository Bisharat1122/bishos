"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Archive, BarChart3, BookmarkPlus, Check, Clock, Flame, Recycle, Split, Target, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { BarChart } from "@/components/Chart";
import { Bar, Chip, EmptyHint, Metric, Section, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { fmtYmd, relDay } from "@/lib/day";
import { LessonInput } from "./LessonInput";
import { PerformanceDialog } from "./PerformanceEditor";
import { WeeklyContentReview } from "./WeeklyContentReview";
import { BrandBadge, FormatBadge, RatioChip } from "./bits";
import { BRAND_META, errMsg, fmtNum, fmtRatio, hookLabel, type BrandFilter, type LitePiece, type PerfWindow } from "./model";

export function AnalyticsPanel({ brand, today, ideas }: { brand: BrandFilter; today: string; ideas: LitePiece[] }) {
  const data = useQuery(api.content.analytics, { today, brand: brand === "both" ? undefined : brand });
  const saveHook = useMutation(api.swipes.saveHookFromPiece);
  const recycle = useMutation(api.content.recycle);
  const snooze = useMutation(api.content.snoozeRecycle);
  const setStage = useMutation(api.content.setStage);
  const router = useRouter();
  const [perf, setPerf] = useState<{ piece: LitePiece; window: PerfWindow } | null>(null);

  if (data === undefined) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-24" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      </div>
    );
  }

  const t = data.totals;
  const cadence = data.cadence.map((w) => ({
    label: fmtYmd(w.weekStart, { month: "short", day: "numeric" }),
    segments: [
      { name: "Personal", value: w.personal, color: BRAND_META.personal.color },
      { name: "Company", value: w.company, color: BRAND_META.company.color },
    ],
    items: w.titles.map((x) => ({ label: x.title, sub: x.format.replace(/_/g, " "), color: BRAND_META[x.brand].color, hours: 1 })),
  }));
  const [ps, cs] = data.brandSplit;
  const splitTotal = ps.published + cs.published;
  const maxHook = Math.max(0.01, ...data.hookTypes.map((h) => h.medianRatio));

  const saveOwnHook = (pieceId: LitePiece["_id"], ratio?: number | null) =>
    void saveHook({ pieceId, note: ratio ? `${fmtRatio(ratio)} your median` : undefined })
      .then((r) => toast(r.existed ? "Already in your hook library" : "Hook saved to library", { tone: "success" }))
      .catch((e) => toast(errMsg(e), { tone: "warning" }));

  const rankList = (list: LitePiece[], kind: "top" | "bottom") =>
    list.length === 0 ? (
      <EmptyHint
        icon={kind === "top" ? TrendingUp : TrendingDown}
        title="Not enough numbers yet"
        hint="Log 24h / 7d / 30d views on 2+ pieces published this month to rank them against your median."
        className="py-6"
      />
    ) : (
      <ol className="space-y-2">
        {list.map((p, i) => (
          <li key={p._id} className="rounded-lg border border-border p-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 w-4 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <Link href={`/content/${p._id}`} className="line-clamp-2 text-sm font-medium hover:underline">
                  {p.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <FormatBadge format={p.format} />
                  <BrandBadge brand={p.brand} compact />
                  {p.perf && <span className="text-[11px] tabular-nums text-muted-foreground">{fmtNum(p.perf.views)} views · {p.perf.window}</span>}
                </div>
              </div>
              <RatioChip ratio={p.perf?.ratio} basis={p.perf?.basis} long />
            </div>
            <LessonInput
              pieceId={p._id}
              initial={p.lesson}
              className="mt-2"
              placeholder={kind === "top" ? "Lesson: why did this one fly?" : "Lesson: what would you do differently?"}
            />
            {kind === "top" && p.hook && (
              <button onClick={() => saveOwnHook(p._id, p.perf?.ratio)} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-1 h-7 px-2 text-xs")}>
                <BookmarkPlus className="h-3.5 w-3.5" /> Save hook to library
              </button>
            )}
          </li>
        ))}
      </ol>
    );

  return (
    <div className="space-y-4">
      <Section>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="Published this month" value={t.thisMonth} sub={`${t.published} all time`} />
          <Metric label="Views this month" value={fmtNum(t.viewsThisMonth)} sub={t.medianViews != null ? `median ${fmtNum(t.medianViews)}/piece` : "log numbers to see"} />
          <Metric label="Saves this month" value={fmtNum(t.savesThisMonth)} />
          <Metric label="Leads from content" value={fmtNum(t.leadsThisMonth)} tone={t.leadsThisMonth > 0 ? "success" : undefined} sub="this month" />
          <Metric label="In the pipeline" value={t.inPipeline} sub={`${t.ideas} ideas banked`} />
          <Metric
            label="Publishing streak"
            value={
              <span className="inline-flex items-center gap-1">
                {t.streakWeeks > 0 && <Flame className="h-5 w-5 text-warning" />}
                {t.streakWeeks}w
              </span>
            }
            sub={t.streakWeeks ? "weeks in a row" : "publish this week to start"}
          />
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyContentReview data={data} ideas={ideas} today={today} />
        </div>
        <Section title={`Needs numbers (${data.needsNumbers.length})`} icon={Clock} hint="Snapshots at 24h, 7d and 30d.">
          {data.needsNumbers.length === 0 ? (
            <p className="text-sm text-muted-foreground">You&apos;re up to date. Nice.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.needsNumbers.slice(0, 8).map((n) => (
                <li key={n.piece._id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm">{n.piece.title}</span>
                  <button onClick={() => setPerf({ piece: n.piece, window: n.window })} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    {n.window}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Top 3 this month" icon={Trophy} hint="Against your own median, not anyone else's.">
          {rankList(data.month.top, "top")}
        </Section>
        <Section title="Bottom 3 this month" icon={TrendingDown} hint="No shame, just data. One lesson each.">
          {rankList(data.month.bottom, "bottom")}
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Cadence · published per week" icon={BarChart3} className="lg:col-span-2" hint={`Target: ${data.week.target} hub${data.week.target === 1 ? "" : "s"} a week · this week ${data.week.hubs}/${data.week.target}`}>
          <BarChart data={cadence} height={220} />
        </Section>
        <Section title="Personal vs company" icon={Split}>
          {splitTotal > 0 && (
            <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-muted">
              <div style={{ width: `${(ps.published / splitTotal) * 100}%`, background: BRAND_META.personal.color }} />
              <div style={{ width: `${(cs.published / splitTotal) * 100}%`, background: BRAND_META.company.color }} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {[ps, cs].map((b) => (
              <div key={b.brand} className="rounded-lg bg-muted/40 p-3">
                <BrandBadge brand={b.brand} />
                <div className="mt-2 text-2xl font-semibold tabular-nums leading-none">{b.published}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">published · {b.thisMonth} this month</div>
                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Median</dt>
                    <dd>{b.medianRatio != null ? <RatioChip ratio={b.medianRatio} /> : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Views</dt>
                    <dd className="tabular-nums">{fmtNum(b.views)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Leads</dt>
                    <dd className="tabular-nums">{fmtNum(b.leads)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">In pipeline</dt>
                    <dd className="tabular-nums">{b.inPipeline}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Best hook types" icon={Target} hint="Median performance vs your median, by hook type.">
          {data.hookTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tag your hooks and log views to see which types work for you.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.hookTypes.map((h) => (
                <li key={h.hookType}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium">{hookLabel(h.hookType === "untyped" ? undefined : h.hookType)}</span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      {h.count} piece{h.count === 1 ? "" : "s"}
                      <RatioChip ratio={h.medianRatio} />
                    </span>
                  </div>
                  <Bar value={(h.medianRatio / maxHook) * 100} tone={h.medianRatio >= 1.2 ? "success" : h.medianRatio <= 0.7 ? "warning" : "primary"} height="h-1" />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Winning hooks" icon={BookmarkPlus} hint="Your outliers (×1.2+). Save them as templates.">
          {data.outlierHooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No outliers yet. They&apos;ll appear as your numbers come in.</p>
          ) : (
            <ul className="space-y-2">
              {data.outlierHooks.map((h) => (
                <li key={h.pieceId} className="rounded-lg border border-border p-2.5">
                  <p className="text-sm">&ldquo;{h.hook}&rdquo;</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <RatioChip ratio={h.ratio} />
                    <span className="text-[11px] text-muted-foreground">{hookLabel(h.hookType)}</span>
                    <span className="ml-auto">
                      {h.inLibrary ? (
                        <Chip tone="success" className="gap-1">
                          <Check className="h-3 w-3" /> In library
                        </Chip>
                      ) : (
                        <button onClick={() => saveOwnHook(h.pieceId, h.ratio)} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}>
                          Save hook
                        </button>
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Recycle due (${data.recycleDue.length})`} icon={Recycle} hint="Winners come back at +6 and +12 months.">
          {data.recycleDue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing due. Published pieces resurface here 6 months later.</p>
          ) : (
            <ul className="space-y-2">
              {data.recycleDue.map((p) => (
                <li key={p._id} className="rounded-lg border border-border p-2.5">
                  <div className="flex items-start gap-2">
                    <Link href={`/content/${p._id}`} className="min-w-0 flex-1 text-sm font-medium hover:underline">
                      {p.title}
                    </Link>
                    <RatioChip ratio={p.perf?.ratio} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">First out {p.publishedOn ? relDay(p.publishedOn, today) : "earlier"}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      onClick={async () => {
                        try {
                          const id = await recycle({ id: p._id, date: today });
                          toast("Fresh copy created", { tone: "success", sub: "Refresh the hook and schedule it" });
                          router.push(`/content/${id}`);
                        } catch (e) {
                          toast(errMsg(e), { tone: "warning" });
                        }
                      }}
                      className={cn(buttonVariants({ size: "sm" }), "h-7 text-xs")}
                    >
                      <Recycle className="h-3.5 w-3.5" /> Recycle
                    </button>
                    <button
                      onClick={() =>
                        void snooze({ id: p._id, date: today })
                          .then(() => toast("Snoozed for 6 months"))
                          .catch((e) => toast(errMsg(e), { tone: "warning" }))
                      }
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}
                    >
                      +6 months
                    </button>
                    <button
                      onClick={() => void setStage({ id: p._id, stage: "archived", date: today }).catch((e) => toast(errMsg(e), { tone: "warning" }))}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs")}
                    >
                      <Archive className="h-3.5 w-3.5" /> Archive
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {perf && (
        <PerformanceDialog
          open
          onClose={() => setPerf(null)}
          title={perf.piece.title}
          pieceId={perf.piece._id}
          performance={perf.piece.performance}
          defaultWindow={perf.window}
        />
      )}
    </div>
  );
}
