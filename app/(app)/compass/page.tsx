"use client";

/**
 * Compass — purpose, values, vision (overall + per area), not-to-do list, the
 * year theme, area standards + weekly hour targets, and the Wheel of Life
 * (monthly 1–10 ratings as a radar: this month vs last).
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ban, ChevronLeft, ChevronRight, Compass, Eye, Gem, Ruler, Sparkles, Star } from "lucide-react";
import { AreaDot, Chip, ListEditor, PageShell, Section, areaColor, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { useToday } from "@/lib/day";
import { RadarChart } from "@/components/direction/charts";
import { RatingRow } from "@/components/direction/RatingRow";
import { AutoInput, AutoTextArea } from "@/components/direction/AutoField";
import { errMsg, fmtMonth, shiftMonth } from "@/components/direction/util";

export default function CompassPage() {
  const today = useToday();
  const data = useQuery(api.compass.get);
  const update = useMutation(api.compass.update);
  const setVision = useMutation(api.compass.setAreaVision);

  if (data === undefined) {
    return (
      <PageShell title="Compass" icon={Compass}>
        <div className="grid gap-4 lg:grid-cols-[1fr_440px]">
          <div className="space-y-4">
            <div className="skeleton h-40" />
            <div className="skeleton h-48" />
            <div className="skeleton h-56" />
          </div>
          <div className="skeleton h-[520px]" />
        </div>
      </PageShell>
    );
  }
  const c = data.compass;
  const save = (patch: Parameters<typeof update>[0]) => update(patch).catch((e) => toast(errMsg(e), { tone: "warning" }));

  return (
    <PageShell
      title="Compass"
      icon={Compass}
      subtitle="Why you work, what you stand for, where you're headed — and how each area of life is really doing."
      actions={c.yearTheme ? <Chip tone="sprint">Year theme · {c.yearTheme}</Chip> : undefined}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_440px]">
        <div className="min-w-0 space-y-4">
          <Section title="Purpose" icon={Sparkles} hint="Why you do this work. Read it when you feel lost — rewrite it yearly.">
            <div className="space-y-3">
              <AutoTextArea
                value={c.purpose}
                onSave={(purpose) => save({ purpose })}
                placeholder="I build ___ so that ___. My work matters because…"
                rows={3}
              />
              <AutoInput value={c.yearTheme} onSave={(yearTheme) => save({ yearTheme })} label="Year theme" placeholder="One word or line for the year — e.g. “Leverage”" />
            </div>
          </Section>

          <div className="grid gap-4 md:grid-cols-2">
            <Section title="Values" icon={Gem} hint="Your standards, ranked. Use them to break ties.">
              <ListEditor items={c.values} onChange={(values) => void save({ values })} numbered placeholder="Add a value (e.g. Ship small, ship often)…" />
              {c.values.length === 0 && <p className="mt-2 text-[11px] text-muted-foreground">Start with 3–5. Fewer values are easier to live by.</p>}
            </Section>
            <Section title="Not-to-do list" icon={Ban} hint="What you've decided to stop doing. Protects the yes.">
              <ListEditor items={c.notToDo} onChange={(notToDo) => void save({ notToDo })} placeholder="e.g. No calls before noon…" />
            </Section>
          </div>

          <Section title="Vision · 3–5 years" icon={Eye} hint="A vivid picture of success. Write it in the present tense, as if it's already true.">
            <AutoTextArea
              value={c.vision}
              onSave={(vision) => save({ vision })}
              placeholder="It's 2030. The company… My days look like… I'm known for…"
              rows={6}
            />
          </Section>

          <Section title="Vision by area" icon={Star} hint="One or two lines per life area. What does great look like?">
            {data.areas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add life areas first — they're the spine of everything else.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.areas.map((a, i) => (
                  <AutoTextArea
                    key={a._id}
                    label={
                      <span className="flex items-center gap-1.5">
                        <AreaDot color={areaColor(a, i)} /> {a.name}
                      </span>
                    }
                    value={c.visionByArea.find((v) => v.lifeAreaId === a._id)?.text ?? ""}
                    onSave={(text) => setVision({ lifeAreaId: a._id, text })}
                    placeholder="In 3 years this area looks like…"
                    rows={3}
                  />
                ))}
              </div>
            )}
          </Section>

          <AreaStandards areas={data.areas} />
        </div>

        <div className="min-w-0 space-y-4">
          <WheelOfLife today={today} />
        </div>
      </div>
    </PageShell>
  );
}

type Area = { _id: Id<"lifeAreas">; name: string; color?: string; order: number; standard: string; weeklyHoursTarget?: number };

function AreaStandards({ areas }: { areas: Area[] }) {
  const set = useMutation(api.compass.setAreaStandard);
  const total = areas.reduce((a, x) => a + (x.weeklyHoursTarget ?? 0), 0);
  return (
    <Section
      title="Area standards & weekly hours"
      icon={Ruler}
      hint="What “maintained” means for each area, and the hours you budget for it each week."
      action={<Chip tone="muted">{total}h / week</Chip>}
    >
      <div className="space-y-3">
        {areas.map((a, i) => (
          <div key={a._id} className="grid gap-2 sm:grid-cols-[1fr_120px] sm:items-end">
            <AutoInput
              label={
                <span className="flex items-center gap-1.5">
                  <AreaDot color={areaColor(a, i)} /> {a.name}
                </span>
              }
              value={a.standard}
              onSave={(standard) => set({ lifeAreaId: a._id, standard })}
              placeholder="e.g. Every client gets a weekly update; inbox zero by Friday"
            />
            <HoursInput
              value={a.weeklyHoursTarget}
              onSave={(h) => set({ lifeAreaId: a._id, weeklyHoursTarget: h }).catch((e) => toast(errMsg(e), { tone: "warning" }))}
            />
          </div>
        ))}
        {total > 55 && <p className="text-xs text-warning">That's more than 55 hours a week. Consider what you could buy back or drop.</p>}
      </div>
    </Section>
  );
}

function HoursInput({ value, onSave }: { value?: number; onSave: (h: number | null) => unknown }) {
  const [v, setV] = useState(value === undefined ? "" : String(value));
  useEffect(() => setV(value === undefined ? "" : String(value)), [value]);
  const commit = () => {
    const n = v.trim() === "" ? null : Number(v);
    if (n !== null && Number.isNaN(n)) return;
    if ((n ?? undefined) === value) return;
    void onSave(n);
  };
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <input
        type="number"
        min={0}
        max={100}
        step={0.5}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        placeholder="0"
        className={cn(inputClass, "h-9 w-20 text-right tabular-nums")}
        aria-label="Weekly hours target"
      />
      h / week
    </label>
  );
}

function WheelOfLife({ today }: { today: string }) {
  const thisMonth = today.slice(0, 7);
  const [period, setPeriod] = useState(thisMonth);
  const data = useQuery(api.compass.ratings, { period });
  const rate = useMutation(api.compass.rate);

  if (data === undefined) return <div className="skeleton h-[520px]" />;

  const current: Record<string, number | undefined> = {};
  for (const a of data.areas) current[a._id] = data.current[a._id]?.rating;
  const usePrev = Object.keys(data.previous).length > 0;
  const cmp = usePrev ? data.previous : data.lastRated;
  const cmpLabel = usePrev ? fmtMonth(data.prevPeriod) : data.lastRatedPeriod ? fmtMonth(data.lastRatedPeriod) : "Last month";
  const previous: Record<string, number | undefined> = {};
  for (const a of data.areas) previous[a._id] = cmp[a._id]?.rating;
  const rated = data.areas.filter((a) => current[a._id] !== undefined);
  const avg = rated.length ? Math.round((rated.reduce((s, a) => s + (current[a._id] ?? 0), 0) / rated.length) * 10) / 10 : null;
  const maxHist = 10;

  return (
    <Section
      title="Wheel of Life"
      icon={Compass}
      hint="Re-rate each area 1–10 once a month. Low spokes are where the next goal lives."
      action={
        <div className="flex items-center gap-0.5">
          <button onClick={() => setPeriod(shiftMonth(period, -1))} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[96px] text-center text-xs font-medium">{fmtMonth(period)}</span>
          <button
            onClick={() => setPeriod(shiftMonth(period, 1))}
            disabled={period >= thisMonth}
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      }
    >
      {data.areas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add life areas to rate them.</p>
      ) : (
        <div className="space-y-4">
          <RadarChart
            axes={data.areas.map((a) => ({ id: a._id, name: a.name }))}
            current={current}
            previous={previous}
            currentLabel={fmtMonth(period)}
            previousLabel={cmpLabel}
          />
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Average</span>
            <span className="font-semibold tabular-nums">
              {avg ?? "—"}
              <span className="font-normal text-muted-foreground"> / 10 · {rated.length}/{data.areas.length} rated</span>
            </span>
          </div>
          <div className="space-y-3">
            {data.areas.map((a, i) => (
              <RatingRow
                key={`${a._id}-${period}`}
                name={a.name}
                color={areaColor(a, i)}
                value={current[a._id]}
                prev={previous[a._id]}
                onSave={(rating) =>
                  rate({ lifeAreaId: a._id, period, rating }).catch((e) => toast(errMsg(e), { tone: "warning" }))
                }
              />
            ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">12-month average</p>
            <div className="flex h-16 items-end gap-1">
              {data.history.map((h) => (
                <div key={h.period} className="flex flex-1 flex-col items-center gap-1" title={`${fmtMonth(h.period)}: ${h.avg ?? "not rated"}`}>
                  <div
                    className={cn("w-full rounded-t-[4px]", h.avg === null ? "h-1 bg-muted" : h.period === period ? "bg-chart-1" : "bg-chart-1/45")}
                    style={h.avg === null ? undefined : { height: `${(h.avg / maxHist) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 flex gap-1">
              {data.history.map((h) => (
                <span key={h.period} className="flex-1 text-center text-[9px] text-muted-foreground">
                  {new Date(Number(h.period.slice(0, 4)), Number(h.period.slice(5, 7)) - 1, 1).toLocaleDateString(undefined, { month: "narrow" })}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
