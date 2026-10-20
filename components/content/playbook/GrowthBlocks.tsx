"use client";

import { useRef } from "react";
import { useQuery } from "convex/react";
import { Check, Shuffle, TriangleAlert } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/components/os/kit";
import { FORMAT_PYRAMID, PLAN_321, STAND_OUT } from "@/lib/kallaway";
import type { Brand } from "../model";
import { BUCKET_SLOTS, CHAOS_ID, type GrowthStep, type Strategy, type StrategyPatch } from "./model";
import { Block, DraftField } from "./ui";

const SECTION_LABEL: Record<GrowthStep["section"], string> = { position: "Positioning", data: "Data system", loop: "The loop" };

function jump(anchor: string, section: GrowthStep["section"]) {
  const el = document.getElementById(anchor) ?? document.getElementById(`pb-${section}`);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Kallaway's 8-step growth system, with progress per step. Steps owned by another section are dashed. */
export function GrowthSpine({ steps, focus }: { steps: GrowthStep[]; focus: GrowthStep["section"] }) {
  const done = steps.filter((s) => s.done).length;
  return (
    <div className="rounded-xl border border-border p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">
          The growth system <span className="font-normal text-muted-foreground">· zero to a plan in 8 steps</span>
        </p>
        <span className="text-sm font-semibold tabular-nums">
          {done}/{steps.length}
        </span>
      </div>
      <ol className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 2xl:grid-cols-8">
        {steps.map((s) => {
          const here = s.section === focus;
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => jump(s.anchor, s.section)}
                title={s.hint}
                className={cn(
                  "flex h-full w-full flex-col gap-1 rounded-lg border p-2 text-left transition-colors hover:border-ring/60",
                  here ? "border-border bg-background" : "border-dashed border-border",
                  s.done && "border-success/40 bg-success-soft/50",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
                      s.done ? "bg-success text-background" : here ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {s.done ? <Check className="h-3 w-3" strokeWidth={3} /> : s.n}
                  </span>
                  <span className={cn("text-xs font-semibold leading-tight", !here && !s.done && "text-muted-foreground")}>{s.label}</span>
                </span>
                <span className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">{s.hint}</span>
                {!here && <span className="mt-auto text-[10px] text-muted-foreground">→ {SECTION_LABEL[s.section]}</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Where you play: Format Pyramid + the 4 ways to stand out
// ─────────────────────────────────────────────────────────────────────────

const W = 220;
const H = 168;
const BAND = H / FORMAT_PYRAMID.length;
const half = (y: number) => (W / 2) * (y / H);

export function WherePlayBlock({ st, done, onSave }: { st: Strategy | null; done: boolean; onSave: (p: StrategyPatch) => void }) {
  const level = st?.pyramidLevel;
  const stand = st?.standOut ?? [];
  // FORMAT_PYRAMID is top → bottom (stories … facts). The saturation line sits above Facts.
  const lineY = BAND * (FORMAT_PYRAMID.length - 1);
  return (
    <Block
      id="pb-where"
      title="Where you play"
      done={done}
      hint="The Format Pyramid: a saturation line rises from the bottom as a niche fills up. Below it, AI and copycats do it for free."
    >
      <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-stretch">
          <svg viewBox={`0 0 ${W} ${H + 4}`} width={W} height={H + 4} role="img" aria-label="Format pyramid" className="max-w-full shrink-0">
            {FORMAT_PYRAMID.map((lv, i) => {
              const y0 = i * BAND;
              const y1 = (i + 1) * BAND;
              const pts = [
                [W / 2 - half(y0), y0],
                [W / 2 + half(y0), y0],
                [W / 2 + half(y1), y1],
                [W / 2 - half(y1), y1],
              ]
                .map((p) => p.join(","))
                .join(" ");
              const on = level === lv.key;
              const below = y0 >= lineY;
              return (
                <polygon
                  key={lv.key}
                  points={pts}
                  onClick={() => onSave({ pyramidLevel: lv.key })}
                  className={cn("cursor-pointer stroke-card transition-colors", on ? "fill-primary" : below ? "fill-muted" : "fill-accent hover:fill-muted")}
                  strokeWidth={2}
                  style={below && !on ? { fillOpacity: 0.55 } : undefined}
                >
                  <title>{lv.label}</title>
                </polygon>
              );
            })}
            <line x1={4} x2={W - 4} y1={lineY} y2={lineY} className="stroke-danger" strokeWidth={1.5} strokeDasharray="5 4" />
            <text x={6} y={lineY - 4} className="fill-danger text-[9px] font-semibold uppercase tracking-wide">
              saturation line
            </text>
          </svg>
          <div className="flex w-full flex-col sm:w-44" role="radiogroup" aria-label="Format level">
            {FORMAT_PYRAMID.map((lv, i) => {
              const on = level === lv.key;
              return (
                <button
                  key={lv.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onSave({ pyramidLevel: lv.key })}
                  className={cn(
                    "flex flex-1 flex-col justify-center rounded-md px-2 py-1 text-left transition-colors",
                    on ? "bg-accent" : "hover:bg-accent/50",
                    i === FORMAT_PYRAMID.length - 1 && "border-t border-dashed border-danger/50",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    {on && <Check className="h-3 w-3" strokeWidth={3} />}
                    {lv.label}
                  </span>
                  <span className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">{lv.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          {level === "facts" ? (
            <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Facts sit under the line in any crowded niche. Skip them: start with Explanation + Application.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Crowded niche? Go straight to <span className="font-medium text-foreground">Application</span> so one video proves you know your stuff. Stories are the final moat, but hard to
              ramp from zero.
            </p>
          )}
          <p className="pt-1 text-xs font-medium">The 4 ways left to stand out (pick the ones you lean on)</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {STAND_OUT.map((w) => {
              const on = stand.includes(w.key);
              return (
                <button
                  key={w.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSave({ standOut: on ? stand.filter((k) => k !== w.key) : [...stand, w.key] })}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border p-2.5 text-left transition-colors",
                    on ? "border-foreground bg-accent/50" : "border-border hover:border-ring/60",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                      on ? "border-foreground bg-foreground text-background" : "border-muted-foreground/40",
                    )}
                  >
                    {on && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">{w.label}</span>
                    <span className="block text-[11px] leading-snug text-muted-foreground">{w.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Block>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 3-2-1 plan
// ─────────────────────────────────────────────────────────────────────────

function Dots({ have, want }: { have: number; want: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`${have} of ${want} this week`}>
      {Array.from({ length: Math.max(want, have) }, (_, i) => (
        <span key={i} className={cn("size-2.5 rounded-full", i < have ? (i < want ? "bg-success" : "bg-info") : "bg-muted")} />
      ))}
    </span>
  );
}

export function Plan321Block({
  st,
  brand,
  today,
  done,
  save,
}: {
  st: Strategy | null;
  brand: Brand;
  today: string;
  done: boolean;
  save: (p: StrategyPatch) => Promise<unknown>;
}) {
  const week = useQuery(api.contentSystem.bucketWeek, { today, brand });
  // Local merge so two quick edits don't overwrite each other before the server echoes back.
  const local = useRef<Record<string, string>>({});
  const nameOf = (id: string) => (st?.buckets ?? []).find((b) => b.id === id)?.name ?? "";
  const saveName = (id: string) => (v: string) => {
    local.current = { ...Object.fromEntries((st?.buckets ?? []).map((b) => [b.id, b.name])), ...local.current, [id]: v };
    const next = BUCKET_SLOTS.map((s) => ({ id: s.id, kind: s.kind, name: (local.current[s.id] ?? "").trim() })).filter((b) => b.name);
    // Keep any extra buckets another screen may have added.
    const extra = (st?.buckets ?? []).filter((b) => !BUCKET_SLOTS.some((s) => s.id === b.id));
    return save({ buckets: [...next, ...extra] });
  };
  const count = (id: string) => week?.counts[id] ?? 0;
  const total = week?.total ?? 0;

  return (
    <Block
      id="pb-plan321"
      title="The 3-2-1 plan"
      done={done}
      hint="3 topic buckets × 2 videos a week + 1 chaos agent = 7 a week. Kallaway calls it his best content strategy for business owners."
      right={
        <span className={cn("text-xs font-semibold tabular-nums", total >= PLAN_321.total ? "text-success" : "text-muted-foreground")}>
          {week ? `${total}/${PLAN_321.total} this week` : "–"}
        </span>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {BUCKET_SLOTS.map((s) => (
          <div key={s.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</span>
              <Dots have={count(s.id)} want={PLAN_321.perBucket} />
            </div>
            <DraftField value={nameOf(s.id)} onSave={saveName(s.id)} placeholder={s.kind === "broad" ? "e.g. How startups actually grow" : "e.g. Founder-led sales calls"} ariaLabel={s.label} className="h-8 text-sm" />
            <span className="text-[11px] leading-snug text-muted-foreground">
              {s.hint}
              {s.kind === "broad" ? " · bullseye ring 4" : " · rings 2–3"}
            </span>
          </div>
        ))}
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Shuffle className="h-3 w-3" /> Chaos agent
            </span>
            <Dots have={count(CHAOS_ID)} want={PLAN_321.chaos} />
          </div>
          <p className="text-sm font-medium">1 creative bet a week</p>
          <span className="text-[11px] leading-snug text-muted-foreground">Anywhere from your centre ring to ring 4. A random swing that might be the 1%.</span>
        </div>
      </div>
      {week && week.untagged > 0 && (
        <p className="text-xs text-muted-foreground">
          {week.untagged} piece{week.untagged === 1 ? "" : "s"} published this week without a bucket. Tag the bucket in each piece&apos;s workflow so this plan can count it.
        </p>
      )}
    </Block>
  );
}
