"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { ArrowRight, Check, GraduationCap, TrendingUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Ring, buttonVariants, cn } from "@/components/os/kit";
import { celebrate, reward } from "@/components/os/celebrate";
import { BrandPicker } from "../bits";
import { SaveSwipeDialog } from "../SaveSwipeDialog";
import { BRAND_META, type Brand, type Pillar } from "../model";
import { ConvertSection } from "./ConvertSection";
import { DataSection } from "./DataSection";
import { IterateSection } from "./IterateSection";
import { LabSection } from "./LabSection";
import { LongFormSection } from "./LongFormSection";
import { LoopSection } from "./LoopSection";
import { OUTLIER_BAR, growthSteps, scoreSections, type SectionKey } from "./model";
import { PositioningSection } from "./PositioningSection";
import { useStableFor, useStrategySaver } from "./ui";

/** Order for "continue": the loop is a long-term meter, so it never blocks the next step. */
const NEXT_ORDER: SectionKey[] = ["position", "data", "lab", "long", "iterate", "convert", "loop"];

function jumpTo(key: SectionKey) {
  document.getElementById(`pb-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * The Kallaway Playbook: one guided page per brand. Positioning (days 1–3) →
 * data system (week 1) → 60-day short-form lab → weekly YouTube track →
 * iterate → convert. Frameworks come from lib/kallaway.ts + lib/youtube.ts.
 */
export function PlaybookTab({ initialBrand, pillars, today }: { initialBrand: Brand; pillars: Pillar[]; today: string }) {
  const [brand, setBrand] = useState<Brand>(initialBrand);
  const strategy = useQuery(api.contentSystem.strategy, { brand });
  const progress = useStableFor(useQuery(api.contentSystem.progress, { today, brand }), brand);
  const iteration = useQuery(api.contentSystem.iteration, { brand, limit: 10 });
  const watch = useQuery(api.contentSystem.watchlist);
  const swipes = useQuery(api.swipes.list);
  const { save, status } = useStrategySaver(brand);
  const [logOpen, setLogOpen] = useState(false);

  const prog = progress?.[0];
  const ready = strategy !== undefined && prog !== undefined && iteration !== undefined && watch !== undefined && swipes !== undefined;

  const creators = useMemo(() => (watch ?? []).filter((c) => !c.brand || c.brand === brand), [watch, brand]);
  const brandSwipes = useMemo(() => (swipes ?? []).filter((s) => !s.brand || s.brand === brand), [swipes, brand]);
  const outliers5 = brandSwipes.filter((s) => (s.outlier ?? 0) >= OUTLIER_BAR).length;
  const bricked = brandSwipes.filter((s) => s.bricks && Object.values(s.bricks).some((v) => v && v.trim())).length;

  const sections = useMemo(
    () => (ready && strategy !== undefined && prog && iteration ? scoreSections({ st: strategy, prog, rows: iteration, creators, outliers5, bricked }) : null),
    [ready, strategy, prog, iteration, creators, outliers5, bricked],
  );
  const steps = useMemo(
    () => (ready && strategy !== undefined && prog ? growthSteps({ st: strategy, creators: creators.length, outliers5, reps: prog.reps }) : null),
    [ready, strategy, creators.length, outliers5, prog],
  );

  // Celebrate a section the moment it completes (never on first load or a brand switch).
  const doneKey = sections?.map((s) => (s.done ? 1 : 0)).join("") ?? null;
  const prev = useRef<{ brand: Brand; done: Record<string, boolean> } | null>(null);
  useEffect(() => {
    if (!sections) return;
    const map: Record<string, boolean> = Object.fromEntries(sections.map((s) => [s.key, s.done]));
    const p = prev.current;
    if (p && p.brand === brand) {
      const newly = sections.filter((s) => s.done && !p.done[s.key]);
      if (newly.length) {
        const all = sections.every((s) => s.done);
        celebrate(all ? 1.6 : 1.1);
        reward(all ? "Kallaway Playbook complete. You built the engine." : `${newly[0].title} complete`);
      }
    }
    prev.current = { brand, done: map };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneKey, brand]);

  const overall = sections ? Math.round(sections.reduce((a, s) => a + s.pct, 0) / sections.length) : 0;
  const next = sections ? NEXT_ORDER.map((k) => sections.find((s) => s.key === k)!).find((s) => !s.done) : undefined;
  const byKey = (k: SectionKey) => sections!.find((s) => s.key === k)!;

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="os-rise rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Ring value={overall} size={76} stroke={7} tone={overall >= 100 ? "success" : "primary"}>
            <span className="text-center leading-none">
              <span className="block text-base font-semibold tabular-nums">{ready ? `${overall}%` : "–"}</span>
              <span className="mt-0.5 block text-[9px] uppercase tracking-wide text-muted-foreground">done</span>
            </span>
          </Ring>
          <div className="min-w-0 flex-1 basis-60">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" /> Kallaway Playbook · {BRAND_META[brand].label}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight">From zero to a content engine that sells</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Position in 3 days, build your data system in week 1, run a 60-day short-form lab and a weekly YouTube track, then iterate and convert. One step at a time.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <BrandPicker value={brand} onChange={setBrand} />
            <button type="button" onClick={() => setLogOpen(true)} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}>
              <TrendingUp className="h-3.5 w-3.5" /> Log an outlier
            </button>
          </div>
        </div>

        {sections && (
          <>
            <nav className="-mx-1 mt-4 overflow-x-auto px-1 pb-1 scrollbar-thin" aria-label="Playbook sections">
              <ol className="flex min-w-max gap-1.5">
                {sections.map((s) => (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => jumpTo(s.key)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs font-medium transition-colors hover:border-ring/60",
                        s.done ? "border-success/40 bg-success-soft text-success" : next?.key === s.key ? "border-foreground" : "border-border text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
                          s.done ? "bg-success text-background" : next?.key === s.key ? "bg-foreground text-background" : "bg-muted",
                        )}
                      >
                        {s.done ? <Check className="h-3 w-3" strokeWidth={3} /> : s.n}
                      </span>
                      {s.short}
                      {!s.done && s.pct > 0 && <span className="tabular-nums opacity-70">{s.pct}%</span>}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
            {next && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Up next</span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">{next.title}</span> <span className="text-muted-foreground">· {next.phase} · {next.summary}</span>
                </span>
                <button type="button" onClick={() => jumpTo(next.key)} className={cn(buttonVariants({ size: "sm" }), "h-7 text-xs")}>
                  Continue <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {!sections || !steps || strategy === undefined || !prog || !iteration ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <LoopSection s={byKey("loop")} st={strategy} reps={prog.reps} save={save} />
          <PositioningSection key={brand} s={byKey("position")} st={strategy} brand={brand} today={today} steps={steps} save={save} status={status} />
          <DataSection s={byKey("data")} steps={steps} brand={brand} creators={creators} swipes={brandSwipes} today={today} onLog={() => setLogOpen(true)} />
          <LabSection s={byKey("lab")} lab={prog.lab} today={today} save={save} />
          <LongFormSection s={byKey("long")} lf={prog.longForm} today={today} save={save} />
          <IterateSection s={byKey("iterate")} rows={iteration} st={strategy} creators={creators} today={today} />
          <ConvertSection s={byKey("convert")} st={strategy} rows={iteration} />
          <p className="px-1 text-center text-[11px] text-muted-foreground">
            Frameworks paraphrased from Kane Kallaway&apos;s public material (@kallawaymarketing, Open Residency); the YouTube playbook is Paddy Galloway&apos;s.
          </p>
        </div>
      )}

      <SaveSwipeDialog open={logOpen} onClose={() => setLogOpen(false)} pillars={pillars} defaultBrand={brand} />
    </div>
  );
}
