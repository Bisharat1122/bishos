"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Flame, Play, RotateCcw, Youtube } from "lucide-react";
import { Chip, Metric, Segmented, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { addDaysYmd, fmtYmd, mondayOf } from "@/lib/day";
import {
  BIG_VIDEO_TESTS,
  CCN,
  DROP_OFF_PHRASES,
  ELIMINATION_TESTS,
  IDEA_FUNNEL,
  IDEA_SOURCES,
  INTRO_45,
  PACKAGING_FLOW,
  PENDULUM,
  STAKES,
  TITLE_RULES,
  YT_CORE,
  YT_EXPECTATIONS,
  lintTitle,
} from "@/lib/youtube";
import { LONG_WEEKS, type LongForm, type SectionState, type StrategyPatch } from "./model";
import { Block, Rules, StepCard } from "./ui";

type YtTab = "ideas" | "packaging" | "retention" | "mindset";

export function LongFormSection({ s, lf, today, save }: { s: SectionState; lf: LongForm | null; today: string; save: (p: StrategyPatch) => Promise<unknown> }) {
  const thisMonday = mondayOf(today);
  const nextMonday = addDaysYmd(thisMonday, 7);
  const start = (d: string) =>
    void save({ longFormStartDate: d })
      .then(() => toast("Weekly YouTube track started. One video a week, 50 weeks.", { tone: "success" }))
      .catch(() => undefined);
  const reset = () => {
    if (!confirm("Reset the weekly long-form track? Your videos stay; only the start date is cleared.")) return;
    void save({ longFormStartDate: null }).catch(() => undefined);
  };
  const notYet = !!lf && lf.start > today;

  return (
    <StepCard
      id="pb-long"
      n={s.n}
      title={s.title}
      phase={s.phase}
      pct={s.pct}
      done={s.done}
      summary={s.summary}
      why={[
        "You're not a YouTuber. You're an entrepreneur using YouTube as a free traffic source: every video is a sales agent working 24/7.",
        "One long video ≈ 20 shorts in trust. Plan for 50 weekly videos with zero traction expected, and a 3–5 year horizon.",
      ]}
      action={
        lf ? (
          <button type="button" onClick={reset} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs")}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        ) : undefined
      }
    >
      {!lf ? (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-4 sm:flex-row sm:items-center">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Youtube className="h-5 w-5 text-muted-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Start the weekly track</p>
            <p className="text-xs text-muted-foreground">Counts weeks (Mon–Sun) where you published at least one long video. Never miss a week.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => start(thisMonday)} className={buttonVariants({ size: "sm" })}>
              <Play className="h-3.5 w-3.5" /> This week
            </button>
            <button type="button" onClick={() => start(nextMonday)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Next Monday
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-border p-4">
            <Metric
              label="Week streak"
              value={
                <span className="inline-flex items-center gap-1">
                  {lf.streak > 0 && <Flame className="h-5 w-5 text-warning" />}
                  {lf.streak}
                </span>
              }
            />
            <Metric label={`Shipped / ${LONG_WEEKS}`} value={lf.shipped} tone={lf.shipped >= LONG_WEEKS ? "success" : undefined} />
            <div className="min-w-0">
              <div className={cn("flex items-center gap-1 text-base font-semibold leading-none", lf.thisWeek ? "text-success" : "text-muted-foreground")}>
                {lf.thisWeek ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                {lf.thisWeek ? "Yes" : notYet ? "Soon" : "Not yet"}
              </div>
              <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">This week shipped?</div>
            </div>
            <p className="col-span-3 text-[11px] text-muted-foreground">
              {notYet ? `Starts ${fmtYmd(lf.start)}.` : `Week ${Math.min(lf.weeks, LONG_WEEKS)} of ${LONG_WEEKS} · started ${fmtYmd(lf.start)}.`}
            </p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">50 weeks</p>
            <div className="mt-2 grid grid-cols-10 gap-1" aria-label={`${lf.shipped} of ${LONG_WEEKS} weeks shipped`}>
              {Array.from({ length: LONG_WEEKS }, (_, i) => (
                <span
                  key={i}
                  className={cn("aspect-square rounded-sm", i < lf.shipped ? "bg-success" : i < lf.weeks ? "bg-muted-foreground/25" : "bg-muted")}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Filled = weeks shipped. ~10K subscribers at month 12 is typical; the credibility line is around 10K.</p>
          </div>
        </div>
      )}

      <Block title="The rules (Kallaway)">
        <Rules
          className="sm:columns-2 sm:gap-6 [&>li]:break-inside-avoid"
          items={[
            <>
              <span className="font-medium">Packaging first.</span> Lock the title before you script, while you&apos;re freshest.
            </>,
            <>
              <span className="font-medium">Thumbnail ≤3 elements</span>, adds to the title, never repeats it. Readable at 1/16 size in dark mode.
            </>,
            <>
              <span className="font-medium">Trigger a desire loop:</span> a pain, FOMO, or a desire. Clickbait yes, bait-and-switch never.
            </>,
            <>
              <span className="font-medium">The intro confirms the click in ~5 seconds.</span>
            </>,
            <>
              <span className="font-medium">First payoff in 30–60 seconds.</span> Reorder in the edit if your best bit is late.
            </>,
            <>
              <span className="font-medium">1 video a week for 50 weeks.</span> One incremental improvement per video.
            </>,
            <>
              <span className="font-medium">Think in 3–5 years.</span> A couple thousand on-target views is huge.
            </>,
            <>
              <span className="font-medium">Don&apos;t post YouTube links on other socials</span>; email is fine.
            </>,
          ]}
        />
      </Block>

      <GallowayPlaybook />
    </StepCard>
  );
}

/** Paddy Galloway's YouTube frameworks (lib/youtube.ts). Credited to him, not Kallaway. */
function GallowayPlaybook() {
  const [tab, setTab] = useState<YtTab>("ideas");
  const [title, setTitle] = useState("");
  const lint = lintTitle(title);
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Youtube className="h-4 w-4 text-muted-foreground" /> YouTube playbook (Paddy Galloway)
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            From YouTube strategist Paddy Galloway (Red Bull, MrBeast), Open Residency, Sep 2026. A long-form layer on top of the Kallaway system.
          </p>
        </div>
        <Segmented<YtTab>
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            { value: "ideas", label: "Ideas" },
            { value: "packaging", label: "Packaging" },
            { value: "retention", label: "Retention" },
            { value: "mindset", label: "Mindset" },
          ]}
        />
      </div>

      <div className="fade-in mt-4 space-y-4" key={tab}>
        {tab === "ideas" && (
          <>
            <p className="rounded-lg bg-card px-3 py-2 text-sm font-medium">{YT_CORE}</p>
            <div>
              <p className="mb-1.5 text-xs font-semibold">CCN: every video must work for three viewers</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {CCN.map((c) => (
                  <div key={c.key} className="rounded-lg border border-border bg-card p-2.5">
                    <p className="text-sm font-semibold">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.hint}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-semibold">What the biggest videos have in common</p>
                <Rules
                  items={BIG_VIDEO_TESTS.map((t) => (
                    <span key={t.key}>
                      <span className="font-medium">{t.label}.</span> <span className="text-muted-foreground">{t.hint}</span>
                    </span>
                  ))}
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold">Where ideas come from, in order</p>
                <ol className="space-y-1.5 text-sm">
                  {IDEA_SOURCES.map((x, i) => (
                    <li key={x.key} className="flex gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">{i + 1}</span>
                      <span>
                        <span className="font-medium">{x.label}.</span> <span className="text-muted-foreground">{x.hint}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold">The idea funnel: 100 → 10 → 1</p>
                <div className="space-y-1.5">
                  {IDEA_FUNNEL.map((f, i) => (
                    <div key={f.n} className="mx-auto flex items-center gap-3 rounded-lg bg-card px-3 py-2 shadow-xs" style={{ width: `${100 - i * 18}%` }}>
                      <span className="text-lg font-semibold tabular-nums">{f.n}</span>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium">{f.label}</span>
                        <span className="block text-[11px] text-muted-foreground">{f.hint}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold">Elimination tests (cut 100 to 10)</p>
                <Rules
                  items={ELIMINATION_TESTS.map((t) => (
                    <span key={t.key}>
                      <span className="font-medium">{t.label}</span> <span className="text-muted-foreground">· {t.hint}</span>
                    </span>
                  ))}
                />
                <p className="mt-2 rounded-lg bg-card px-3 py-2 text-xs">
                  <span className="font-semibold">The 80% rule:</span> topics should share ~80% of your audience, and you stay there 80% of the time. Experiment with only 1 video in 4–5.
                </p>
              </div>
            </div>
          </>
        )}

        {tab === "packaging" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold">Packaging workflow, every video</p>
              <ol className="space-y-1.5">
                {PACKAGING_FLOW.map((p, i) => (
                  <li key={p.key} className="flex gap-2.5 rounded-lg border border-border bg-card p-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{p.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{p.hint}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-xs font-semibold">Title rules</p>
                <Rules items={TITLE_RULES} />
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <label htmlFor="pb-title-test" className="text-xs font-semibold">
                  Test a title
                </label>
                <input
                  id="pb-title-test"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. I Tried Cold Calling For 30 Days"
                  className={cn(inputClass, "mt-1.5 h-9 w-full")}
                />
                {lint.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {lint.map((l) => (
                      <Chip key={l.text} tone={l.kind === "good" ? "success" : l.kind === "warn" ? "warning" : "info"}>
                        {l.text}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "retention" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold">The 45-second intro</p>
              <ol className="space-y-1.5">
                {INTRO_45.map((p, i) => (
                  <li key={p.key} className="flex gap-2.5 rounded-lg border border-border bg-card p-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{p.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{p.hint}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-xs font-semibold">Storytelling is useless without stakes. Add one:</p>
                <div className="flex flex-wrap gap-1.5">
                  {STAKES.map((x) => (
                    <Chip key={x.key} tone="outline" title={x.hint}>
                      {x.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold">Phrases that cause drop-offs</p>
                <div className="flex flex-wrap gap-1.5">
                  {DROP_OFF_PHRASES.map((x) => (
                    <Chip key={x} tone="warning">
                      &ldquo;{x}&rdquo;
                    </Chip>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">Views and the shape of the retention curve are the two metrics he trusts. Drop-off moments are the same for core, casual and new viewers, so fixes carry over.</p>
              </div>
            </div>
          </div>
        )}

        {tab === "mindset" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold">The pendulum: focus in this order as you grow</p>
              <ol className="space-y-1.5">
                {PENDULUM.map((p) => (
                  <li key={p.n} className="flex gap-2.5 rounded-lg border border-border bg-card p-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">{p.n}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{p.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{p.hint}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold">Expectations</p>
              <p className="rounded-lg bg-card px-3 py-2 text-sm">{YT_EXPECTATIONS}</p>
              <p className="text-[11px] text-muted-foreground">
                Judge each video against what you expected (its 1-of-10 rank), not your channel average. Good data beats no data; no data beats bad data, so change a clear underperformer now.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
