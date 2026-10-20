"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowRight, BatteryCharging, CheckCircle2, Eye, HeartHandshake, HeartPulse, LifeBuoy, Moon, Smile, Sparkles, Timer } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Bar, Chip, Metric, PageShell, Section, buttonVariants, cn } from "@/components/os/kit";
import { LineChart } from "@/components/Chart";
import { fmtMin, fmtYmd, useToday } from "@/lib/day";
import { FocusHours, SleepScatter, TrendChart, WeekdayBars, hourLabel } from "@/components/habits/WellbeingCharts";
import { PulseCard } from "@/components/habits/PulseCard";

function Delta({ now, base }: { now: number | null; base: number | null }) {
  if (now == null || base == null) return null;
  const d = Math.round((now - base) * 10) / 10;
  if (Math.abs(d) < 0.2) return <span className="text-muted-foreground">steady vs 4-week baseline</span>;
  return (
    <span className={d > 0 ? "text-success" : "text-muted-foreground"}>
      {d > 0 ? "▲" : "▼"} {Math.abs(d)} vs baseline
    </span>
  );
}

export default function InsightsPage() {
  const today = useToday();
  const [tz] = useState(() => new Date().getTimezoneOffset());
  const e = useQuery(api.insights.energy, { today, tzOffsetMin: tz });
  const s = useQuery(api.insights.signals, { today, tzOffsetMin: tz });

  const sleepLine = (e?.trend ?? []).filter((t) => t.sleepHours != null).map((t) => ({ label: fmtYmd(t.date, { month: "short", day: "numeric" }), value: t.sleepHours! }));

  return (
    <PageShell
      title="Energy & Wellbeing"
      icon={HeartPulse}
      subtitle="Learn your own curve and protect recovery. Observations, not diagnoses."
      headerExtra={
        e ? (
          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-4">
            <Metric label="Energy · 7d" value={<span className="inline-flex items-center gap-1"><BatteryCharging className="h-5 w-5 text-muted-foreground" />{e.avg7.energy ?? "–"}</span>} sub={<Delta now={e.avg7.energy} base={e.base28.energy} />} />
            <Metric label="Mood · 7d" value={<span className="inline-flex items-center gap-1"><Smile className="h-5 w-5 text-muted-foreground" />{e.avg7.mood ?? "–"}</span>} sub={<Delta now={e.avg7.mood} base={e.base28.mood} />} />
            <Metric label="Sleep · 7d" value={<span className="inline-flex items-center gap-1"><Moon className="h-5 w-5 text-muted-foreground" />{e.avg7.sleep != null ? `${e.avg7.sleep}h` : "–"}</span>} sub="average per night" />
            <Metric label="Check-ins" value={e.checkInCount} sub={e.learning ? `${Math.max(0, 14 - e.checkInCount)} more to learn your curve` : "your curve is ready"} />
          </div>
        ) : (
          <div className="skeleton mt-5 h-[92px] rounded-xl" aria-hidden />
        )
      }
    >
      <div className="space-y-5">
        {s?.lowMoodPersistent && (
          <div className="flex gap-3 rounded-xl border border-info/40 bg-info-soft p-4">
            <LifeBuoy className="mt-0.5 h-5 w-5 shrink-0 text-info" />
            <div className="text-sm">
              <p className="font-medium">You&apos;ve logged low mood on most days this week.</p>
              <p className="mt-0.5 text-muted-foreground">
                That deserves real support. Please talk to someone you trust — and if it keeps going, to a doctor or mental-health professional.{" "}
                <a href="#support" className="font-medium text-foreground underline underline-offset-2">
                  Support resources
                </a>
              </p>
            </div>
          </div>
        )}

        {e?.learning && (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center">
            <Sparkles className="h-5 w-5 shrink-0 text-sprint" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">Learning your curve · {e.checkInCount} of 14 check-ins</p>
              <p className="text-muted-foreground">
                Chronotype quizzes are unreliable — over 80% of studies find no main effect. After ~2 weeks of one-tap check-ins this page shows <em>your</em> pattern.
              </p>
              <Bar value={(e.checkInCount / 14) * 100} tone="sprint" className="mt-2" />
            </div>
            <Link href="/today" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}>
              Check in today <ArrowRight />
            </Link>
          </div>
        )}

        {/* Observations */}
        <Section title="Observations" icon={Eye} hint="Design heuristics from founder-burnout research — not clinical cutoffs.">
          {s === undefined ? (
            <div className="grid gap-2 md:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="skeleton h-20" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className={cn("text-sm font-medium", s.activeCount ? "text-foreground" : "text-success")}>{s.headline}</p>
              <ul className="grid gap-2 md:grid-cols-2">
                {[...s.observations]
                  .sort((a, b) => Number(b.active) - Number(a.active) || Number(b.enoughData) - Number(a.enoughData))
                  .map((o) => (
                    <li
                      key={o.key}
                      className={cn(
                        "rounded-lg border p-3 text-sm",
                        o.active ? "border-warning/40 bg-warning-soft" : "border-border bg-background",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {o.active ? (
                          <Eye className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                        ) : (
                          <CheckCircle2 className={cn("mt-0.5 h-4 w-4 shrink-0", o.enoughData ? "text-success" : "text-muted-foreground/50")} />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium">
                            {o.title}
                            {!o.active && <span className="font-normal text-muted-foreground"> · {o.enoughData ? "all clear" : "not enough data"}</span>}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{o.detail}</p>
                          {o.active && <p className="mt-1.5 text-xs">{o.kind}</p>}
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                <Timer className="h-3.5 w-3.5" />
                Hours (focus + done blocks):
                {s.hoursByWeek.map((w) => (
                  <Chip key={w.weekStart} tone={w.hours >= s.cap ? "warning" : "muted"}>
                    wk of {fmtYmd(w.weekStart, { month: "short", day: "numeric" })} · {w.hours}h
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Protective toolkit */}
        {s && (
          <Section title="Protective toolkit" icon={HeartHandshake} hint="When the signals rise, the answer is less — not more.">
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {s.suggestions.map((sg) => (
                <Link
                  key={sg.key}
                  href={sg.href}
                  className={cn(
                    "group flex flex-col rounded-lg border p-3 transition-colors hover:bg-accent/50",
                    sg.recommended ? "border-ring/60 bg-card" : "border-border bg-background",
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{sg.title}</span>
                    {sg.recommended && <Chip tone="info">Suggested</Chip>}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">{sg.body}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium">
                    {sg.cta} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Trends */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Energy & mood · 30 days" hint="1–5 from your morning check-in">
            {e === undefined ? <div className="skeleton h-48" /> : <TrendChart data={e.trend} />}
          </Section>
          <Section title="Sleep · 30 days" hint="Hours per night">
            {e === undefined ? (
              <div className="skeleton h-48" />
            ) : sleepLine.length ? (
              <LineChart data={sleepLine} height={190} max={10} unit="h" />
            ) : (
              <div className="flex h-[190px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                Add sleep hours to your check-in.
              </div>
            )}
          </Section>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Section title="Energy by weekday" hint="Last 90 days">
            {e === undefined ? <div className="skeleton h-36" /> : <WeekdayBars data={e.byWeekday} />}
          </Section>
          <Section title="Sleep vs energy" hint="Each dot is a check-in · dashed line = 7h">
            {e === undefined ? (
              <div className="skeleton h-36" />
            ) : (
              <>
                <SleepScatter pairs={e.pairs} />
                {e.sleepContrast && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    After 7h+ sleep your energy averages <span className="font-medium text-foreground">{e.sleepContrast.rested}</span> vs{" "}
                    <span className="font-medium text-foreground">{e.sleepContrast.short}</span> on shorter nights.
                  </p>
                )}
              </>
            )}
          </Section>
          <Section title="Your best focus hours" hint="Focus minutes by start hour · last 60 days">
            {e === undefined ? (
              <div className="skeleton h-36" />
            ) : (
              <>
                <FocusHours byHour={e.focus.byHour} topHours={e.focus.topHours} />
                <p className="mt-2 text-xs text-muted-foreground">
                  {e.focus.enough && e.focus.peak
                    ? `Your peak window: ${hourLabel(e.focus.peak.start)}–${hourLabel((e.focus.peak.start + 2) % 24)} (${fmtMin(e.focus.peak.minutes)} of focus). Protect it for maker work.`
                    : `Learning your curve · ${e.focus.sessions} of 10 sessions. Your own data beats any chronotype label.`}
                </p>
              </>
            )}
          </Section>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <PulseCard today={today} />
          <section id="support" className="scroll-mt-20 rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <LifeBuoy className="h-4 w-4 text-muted-foreground" /> This is not a clinical tool
            </h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                These observations are simple heuristics from research on founders and burnout. They can&apos;t diagnose anything and they can be wrong —
                you know yourself best.
              </p>
              <p>
                If low mood, exhaustion or hopelessness lasts two weeks or more, please talk to a doctor or a mental-health professional. Founders carry a
                lot; getting support is a strength, not a setback.
              </p>
              <p>
                If you&apos;re in crisis or thinking about harming yourself, contact your local emergency number now, or find a free, confidential helpline
                in your country at{" "}
                <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-2">
                  findahelpline.com
                </a>
                .
              </p>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
