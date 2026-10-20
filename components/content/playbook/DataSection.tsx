"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, TrendingUp, Users } from "lucide-react";
import { Bar, Chip, buttonVariants, cn } from "@/components/os/kit";
import { DCT } from "@/lib/kallaway";
import { addDaysYmd } from "@/lib/day";
import type { Brand, Swipe } from "../model";
import { GrowthSpine } from "./GrowthBlocks";
import { OUTLIER_BAR, WATCH_MAX, WATCH_MIN, compact, tierOf, type Creator, type GrowthStep, type SectionState } from "./model";
import { Block, Rules, StepCard } from "./ui";
import { CreatorDialog } from "./WatchlistPanel";

export function DataSection({
  s,
  steps,
  brand,
  creators,
  swipes,
  today,
  onLog,
}: {
  s: SectionState;
  steps: GrowthStep[];
  brand: Brand;
  creators: Creator[];
  swipes: Swipe[];
  today: string;
  onLog: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const outliers = swipes.filter((x) => (x.outlier ?? 0) >= OUTLIER_BAR).sort((a, b) => (b.outlier ?? 0) - (a.outlier ?? 0));
  const bricked = swipes.filter((x) => x.bricks && Object.values(x.bricks).some((v) => v && v.trim())).length;
  const inRange = creators.filter((c) => tierOf(c.followers).inRange).length;
  const big = creators.filter((c) => tierOf(c.followers).key === "big").length;
  const weekAgo = addDaysYmd(today, -6);
  const checkedWeek = creators.filter((c) => c.lastCheckedOn && c.lastCheckedOn >= weekAgo).length;

  return (
    <StepCard
      id="pb-data"
      n={s.n}
      title={s.title}
      phase={s.phase}
      pct={s.pct}
      done={s.done}
      summary={s.summary}
      action={
        <button type="button" onClick={onLog} className={cn(buttonVariants({ size: "sm" }), "h-7 text-xs")}>
          <TrendingUp className="h-3.5 w-3.5" /> Log an outlier
        </button>
      }
      why={[
        "Data-enabled creativity: let the data pick your topics, so your creativity goes into the angle.",
        "An outlier is a video that beat its creator's own average by 5× or more. It proves the idea, not the person.",
      ]}
    >
      <GrowthSpine steps={steps} focus="data" />

      <div className="grid gap-3 sm:grid-cols-3">
        {DCT.map((d) => (
          <div key={d.key} className="rounded-lg border border-border p-3">
            <p className="text-sm font-semibold">{d.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{d.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Block
          id="pb-watchlist"
          title="Creator watchlist"
          done={creators.length >= WATCH_MIN}
          hint="Start with ~10 creators, grow to 20–30. 10K–1M followers, same content type. Ignore over 1M: their duds are propped up by brand."
          right={
            <span className="text-sm font-semibold tabular-nums">
              {creators.length}
              <span className="font-normal text-muted-foreground">/{WATCH_MIN}–{WATCH_MAX}</span>
            </span>
          }
        >
          <Bar value={(creators.length / WATCH_MIN) * 100} tone={creators.length >= WATCH_MIN ? "success" : "primary"} height="h-2" />
          <div className="flex flex-wrap gap-1.5">
            <Chip tone="outline" className="tabular-nums">
              {inRange} in range
            </Chip>
            {big > 0 && (
              <Chip tone="warning" className="tabular-nums" title="Over 1M: brand equity props up their duds">
                {big} over 1M
              </Chip>
            )}
            <Chip tone={checkedWeek ? "success" : "muted"} className="tabular-nums">
              {checkedWeek} checked this week
            </Chip>
          </div>
          {creators.length > 0 && (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {creators.slice(0, 4).map((c) => {
                const t = tierOf(c.followers);
                return (
                  <li key={c._id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{compact(c.followers)}</span>
                    <Chip tone={t.tone} className="h-4 px-1.5 text-[9px]" title={t.hint}>
                      {t.label}
                    </Chip>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setAdding(true)} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 text-xs")}>
              <Plus className="h-3.5 w-3.5" /> Add creator
            </button>
            <Link href="/swipes?tab=watchlist" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 text-xs")}>
              <Users className="h-3.5 w-3.5" /> Manage watchlist <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Block>

        <Block title="Outlier rules" hint="Run these filters every time you check your watchlist.">
          <Rules
            items={[
              <>
                <span className="font-medium">Outlier score = views ÷ the creator&apos;s average</span> (rolling ~3 months before the post).
              </>,
              <>
                <span className="font-medium">Research at ≥5×.</span> Graduate your own formats at 10×+.
              </>,
              <>
                <span className="font-medium">Engagement ≥ ~2–5%</span>, which screens out paid brand deals that inflate views.
              </>,
              <>
                <span className="font-medium">Recent window:</span> 7–14 days for news niches, last 3 months (up to 12) for evergreen.
              </>,
              <>
                <span className="font-medium">Ask of every outlier:</span> &ldquo;Do I have something non-obvious to say about this?&rdquo; No: skip. Yes: it&apos;s a validated video.
              </>,
            ]}
          />
        </Block>
      </div>

      <Block title="Where ideas come from, in priority order" hint="For your first ~100 reps, don't reinvent the wheel before you can ride the bike.">
        <ol className="grid gap-2 sm:grid-cols-3">
          {[
            { t: "Your own winners", d: "Remake what already worked for you. Audit your channel every 2 weeks." },
            { t: "10K–1M creators' winners", d: "Remake their outliers holding as many LEGO bricks as possible; change topic + angle." },
            { t: "A tool", d: "Only if you can't find either: an outlier database surfaces winners for you." },
          ].map((x, i) => (
            <li key={x.t} className="flex gap-2.5 rounded-lg border border-border p-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background tabular-nums">{i + 1}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{x.t}</span>
                <span className="block text-xs leading-snug text-muted-foreground">{x.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </Block>

      <Block
        id="pb-scanner"
        title="Topic scanner: your outliers"
        done={outliers.length >= 5}
        hint="Every outlier you log with a 5×+ score lands here. Break it into its 7 LEGO bricks, then remix it."
        right={
          <div className="flex items-center gap-1.5">
            <Chip tone={outliers.length ? "success" : "muted"} className="tabular-nums">
              {outliers.length} at ≥{OUTLIER_BAR}×
            </Chip>
            <Chip tone="outline" className="tabular-nums">
              {bricked} broken down
            </Chip>
          </div>
        }
      >
        {outliers.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">No 5×+ outliers logged for {brand === "personal" ? "your personal brand" : "the company"} yet. Add views and the creator&apos;s average when you save one.</p>
            <button type="button" onClick={onLog} className={buttonVariants({ size: "sm" })}>
              <TrendingUp className="h-3.5 w-3.5" /> Log an outlier
            </button>
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {outliers.slice(0, 6).map((o) => {
              const filled = o.bricks ? Object.values(o.bricks).filter((v) => v && v.trim()).length : 0;
              return (
                <li key={o._id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <span className="flex shrink-0 flex-col items-center rounded-md bg-success-soft px-2 py-1 leading-none text-success">
                    <span className="text-base font-semibold tabular-nums">{o.outlier}×</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-medium leading-snug">{o.title || o.hookText || o.creator || "Untitled outlier"}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {o.creator ? `@${o.creator.replace(/^@/, "")} · ` : ""}
                      {filled}/7 bricks
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {outliers.length > 0 && (
          <Link href="/swipes" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 text-xs")}>
            Break down & remix in Inspiration <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </Block>

      <CreatorDialog open={adding} creator={null} defaultBrand={brand} onClose={() => setAdding(false)} />
    </StepCard>
  );
}
