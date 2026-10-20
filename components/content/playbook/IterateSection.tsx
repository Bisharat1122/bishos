"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, CalendarClock, Search } from "lucide-react";
import { Chip, buttonVariants, cn } from "@/components/os/kit";
import { relDay } from "@/lib/day";
import { FLOP_DIAGNOSIS, HOOKS_THAT_FAIL, HOOKS_THAT_WORK, KPIS, RESEARCH_CADENCE, holdAdvice, rankAdvice } from "@/lib/kallaway";
import { FormatBadge } from "../bits";
import { SHORT_FORMATS, brickLabel, compact, type Creator, type IterRow, type SectionState, type Strategy } from "./model";
import { Block, Rules, StepCard } from "./ui";

const KPI_ORDER = [
  { key: "emails", label: "Emails / video", pick: (r: IterRow) => r.leads },
  { key: "followers", label: "Followers / video", pick: (r: IterRow) => r.follows },
  { key: "views", label: "Views / video", pick: (r: IterRow) => r.views },
] as const;

export function IterateSection({ s, rows, st, creators, today }: { s: SectionState; rows: IterRow[]; st: Strategy | null; creators: Creator[]; today: string }) {
  const withNums = rows.filter((r) => r.hasNumbers);
  const avg = (pick: (r: IterRow) => number | undefined) => {
    const xs = withNums.map(pick).filter((x): x is number => x != null);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  const lastNiche = creators.map((c) => c.lastCheckedOn).filter((x): x is string => !!x).sort().at(-1);
  const kpiLabel = KPIS.find((k) => k.key === st?.kpi)?.label;

  return (
    <StepCard
      id="pb-iterate"
      n={s.n}
      title={s.title}
      phase={s.phase}
      pct={s.pct}
      done={s.done}
      summary={s.summary}
      why={[
        "The sauce is the distance between reps. After every rep, name the weak brick and fix 1–2 things next time.",
        "Data is a lagging indicator. The leading indicator is following the principles while you make the video.",
      ]}
    >
      {/* KPI ranking */}
      <Block title="Score it like a business" hint={`Emails per video > followers per video > views.${kpiLabel ? ` Your KPI: ${kpiLabel.toLowerCase()}.` : ""}`}>
        <div className="grid grid-cols-3 gap-2">
          {KPI_ORDER.map((k, i) => {
            const v = avg(k.pick);
            const mine = st?.kpi === k.key;
            return (
              <div key={k.key} className={cn("rounded-lg border p-3", mine ? "border-foreground" : "border-border")}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">#{i + 1}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums leading-none">{v == null ? "—" : compact(Math.round(v * 10) / 10)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{k.label}</p>
              </div>
            );
          })}
        </div>
      </Block>

      {/* Last reps */}
      <Block title="Your last reps" hint="Log numbers on each piece (Analytics), then mark which brick was weak and the next fix in its post-mortem.">
        {rows.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">Publish a rep and log its numbers. This table then tells you what to fix next.</p>
            <Link href="/content?tab=board" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Open the board <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {rows.map((r) => {
              const short = SHORT_FORMATS.has(r.format);
              const hold = short && r.hold3s != null ? holdAdvice(r.hold3s) : null;
              const rank = r.rank && r.format === "long_video" ? rankAdvice(r.rank.rank) : null;
              return (
                <li key={r._id} className="grid gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.3fr)] sm:items-center">
                  <div className="min-w-0">
                    <Link href={`/content/${r._id}`} className="block truncate text-sm font-medium hover:underline">
                      {r.title}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <FormatBadge format={r.format} />
                      {r.publishedOn && <span>{relDay(r.publishedOn, today)}</span>}
                      {r.rank && (
                        <span className="tabular-nums" title="Rank by views among your last 10 in this format">
                          {r.rank.rank} of {r.rank.of}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs tabular-nums">
                    {r.hasNumbers ? (
                      <>
                        <span title="Emails / leads">
                          <span className="font-semibold">{compact(r.leads)}</span> <span className="text-muted-foreground">emails</span>
                        </span>
                        <span title="Followers gained">
                          <span className="font-semibold">{compact(r.follows)}</span> <span className="text-muted-foreground">follows</span>
                        </span>
                        <span title="Views">
                          <span className="font-semibold">{compact(r.views)}</span> <span className="text-muted-foreground">views</span>
                        </span>
                      </>
                    ) : (
                      <Link href={`/content/${r._id}`} className="text-muted-foreground underline-offset-2 hover:underline">
                        Log numbers →
                      </Link>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {hold && (
                      <Chip tone={hold.tone} title={hold.text}>
                        {r.hold3s}% at 3s
                      </Chip>
                    )}
                    {rank && (
                      <Chip tone={rank.tone} title={rank.text}>
                        {r.rank!.rank <= 3 ? "Study it" : r.rank!.rank <= 6 ? "Mid pack" : "Repackage"}
                      </Chip>
                    )}
                    {r.weakBricks.map((b) => (
                      <Chip key={b} tone="warning" className="text-[10px]">
                        Weak: {brickLabel(b)}
                      </Chip>
                    ))}
                    {r.nextFix && <span className="w-full truncate text-[11px] text-muted-foreground">Next fix: {r.nextFix}</span>}
                    {r.hasNumbers && !r.weakBricks.length && !r.nextFix && (
                      <Link href={`/content/${r._id}`} className="text-[11px] text-muted-foreground underline-offset-2 hover:underline">
                        Add post-mortem →
                      </Link>
                    )}
                  </div>
                  {(hold || rank) && <p className="text-[11px] text-muted-foreground sm:col-span-3">{(hold ?? rank)!.text}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Block>

      <div className="grid gap-5 lg:grid-cols-2">
        <Block title="Diagnose a flop, in this order, every time" hint="Topic first, then angle, then hook. Hook rate and skip rate are icing, not cake.">
          <ol className="space-y-1.5">
            {FLOP_DIAGNOSIS.map((f, i) => (
              <li key={f.key} className="flex gap-2.5 rounded-lg border border-border p-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{f.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{f.hint}</span>
                  {f.key === "hook" && (
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {HOOKS_THAT_WORK.map((h) => (
                        <Chip key={h.key} tone="success" className="h-5 text-[10px]" title={h.hint}>
                          {h.label}
                        </Chip>
                      ))}
                      {HOOKS_THAT_FAIL.map((h) => (
                        <Chip key={h} tone="warning" className="h-5 text-[10px]">
                          ✕ {h}
                        </Chip>
                      ))}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </Block>

        <div className="space-y-5">
          <Block title="Research cadence" hint="Reminders, so ideas stay data-led.">
            <div className="space-y-2">
              {RESEARCH_CADENCE.map((r) => (
                <div key={r.key} className="flex items-start gap-2.5 rounded-lg border border-border p-2.5">
                  {r.key === "own" ? <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> : <Search className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
                      {r.label}
                      <span className="inline-flex items-center gap-1 text-[11px] font-normal text-muted-foreground">
                        <CalendarClock className="h-3 w-3" /> {r.every}
                      </span>
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {r.hint}
                      {r.key === "niche" && ` · last watchlist check: ${lastNiche ? relDay(lastNiche, today) : "never"}`}
                    </span>
                  </span>
                  <Link
                    href={r.key === "own" ? "/content?tab=analytics" : "/swipes?tab=watchlist"}
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 shrink-0 px-2 text-xs")}
                  >
                    Open
                  </Link>
                </div>
              ))}
            </div>
          </Block>

          <Block title="Read the signals right">
            <Rules
              items={[
                "No breakout after 3 batches of 10? It's almost always substance or hooks.",
                "A smooth retention decline is normal. Abnormal drops mean confusion, or visuals that don't match the words.",
                "Shorts: ≥70% still watching at 3s is a banger; under 50% is a hook problem.",
                "YouTube: rank each video among your last 10. Bottom 4? Your only live lever is the title + thumbnail.",
                "Data confirms; it lags. Get a peer one level above you to review your inputs.",
              ]}
            />
          </Block>
        </div>
      </div>
    </StepCard>
  );
}
