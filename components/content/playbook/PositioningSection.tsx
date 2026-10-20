"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { Check, GraduationCap, Mail, Plus, Trash2, TriangleAlert } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Bar, Chip, InlineEdit, ListEditor, Segmented, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { CONTENT_GAMES, KPIS, LEAD_MAGNET_TYPES, SKILL_FIRST, STRUCTURES, UNIQUENESS_AXES } from "@/lib/kallaway";
import { PLATFORMS, errMsg, type Brand } from "../model";
import type { DraftStatus } from "../useDraft";
import { Bullseye } from "./Bullseye";
import { GrowthSpine, Plan321Block, WherePlayBlock } from "./GrowthBlocks";
import {
  FORMULAS_MAX,
  FORMULAS_MIN,
  GAME_KPI,
  SUGGESTED_GAMES,
  TAKES_MAX,
  TAKES_MIN,
  canvasItems,
  gameOf,
  type GrowthStep,
  type SectionState,
  type Strategy,
  type StrategyPatch,
} from "./model";
import { Block, ChoiceChips, DraftField, SaveStatus, StepCard, TagInput, Target } from "./ui";

type Formula = NonNullable<Strategy["formulas"]>[number];

const HERO = ["instagram", "tiktok", "youtube_shorts", "linkedin", "youtube", "x"];
const LAYOUTS = ["Talking head", "Green screen", "Split screen", "POV vlog", "In-the-world", "Faceless text", "Whiteboard", "Screen recording"];

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`);

export function PositioningSection({
  s,
  st,
  brand,
  today,
  steps,
  save,
  status,
}: {
  s: SectionState;
  st: Strategy | null;
  brand: Brand;
  today: string;
  steps: GrowthStep[];
  save: (p: StrategyPatch) => Promise<unknown>;
  status: DraftStatus;
}) {
  const addTake = useMutation(api.contentSystem.addContrarian);
  const [take, setTake] = useState("");
  const uniq = useRef<Record<string, string | undefined>>({});
  const items = canvasItems(st);
  const done = (k: string) => items.find((i) => i.key === k)?.done ?? false;
  const doneCount = items.filter((i) => i.done).length;

  const game = gameOf(st?.game);
  const suggested = SUGGESTED_GAMES[brand];
  const takes = st?.contrarianTakes ?? [];
  const formulas = st?.formulas ?? [];
  const live = formulas.filter((f) => f.status !== "retired").length;

  const saveAxis = (k: string) => (v: string) => {
    const merged = { ...(st?.uniqueness ?? {}), ...uniq.current, [k]: v };
    uniq.current = merged;
    return save({ uniqueness: merged });
  };

  const quietSave = (p: StrategyPatch) => void save(p).catch(() => undefined);

  async function quickAddTake() {
    const t = take.trim();
    if (!t) return;
    try {
      await addTake({ brand, text: t });
      setTake("");
      const n = takes.length + 1;
      toast(n === TAKES_MIN ? "3 contrarian takes. That's a point of view." : "Take added to the vault", { tone: "success" });
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  }

  return (
    <StepCard
      id="pb-position"
      n={s.n}
      title={s.title}
      phase={s.phase}
      pct={s.pct}
      done={s.done}
      summary={s.summary}
      action={<SaveStatus status={status} />}
      why={[
        "Spend your first 2–3 days here. Positioning decides who the algorithm sends your videos to.",
        "One topic, one avatar, one game per channel. It's easier to start narrow and widen than the reverse.",
      ]}
    >
      <p className="flex items-start gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
        <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          <span className="font-medium text-foreground">Skill before content.</span> {SKILL_FIRST}
        </span>
      </p>

      <GrowthSpine steps={steps} focus="position" />

      {/* Canvas meter */}
      <div className="rounded-xl border border-border p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Positioning canvas</p>
          <span className="text-sm font-semibold tabular-nums">
            {doneCount}/{items.length}
          </span>
        </div>
        <Bar value={(doneCount / items.length) * 100} tone={doneCount === items.length ? "success" : "primary"} className="mt-2" height="h-2" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {items.map((i) => (
            <span
              key={i.key}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                i.done ? "border-success/40 bg-success-soft text-success" : "border-border text-muted-foreground",
              )}
            >
              {i.done && <Check className="h-3 w-3" strokeWidth={3} />}
              {i.label}
            </span>
          ))}
        </div>
      </div>

      {/* Game */}
      <Block
        title="Your content game"
        done={done("game")}
        hint="Pick the game from your business model before any tactics. Only one game per channel."
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5" role="radiogroup" aria-label="Content game">
          {CONTENT_GAMES.map((g) => {
            const on = st?.game === g.key;
            const sug = suggested.includes(g.key);
            return (
              <button
                key={g.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => quietSave({ game: g.key, ...(st?.kpi ? {} : { kpi: GAME_KPI[g.key] }) })}
                className={cn(
                  "flex min-h-[150px] flex-col gap-1 rounded-xl border p-3 text-left transition-colors",
                  on ? "border-foreground bg-accent/50 ring-1 ring-foreground" : "border-border hover:border-ring/60 hover:bg-accent/30",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">#{g.n}</span>
                  {on ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : sug ? (
                    <Chip tone="info" className="h-5 px-1.5 text-[10px]">
                      Suggested
                    </Chip>
                  ) : null}
                </span>
                <span className="text-sm font-semibold leading-tight">{g.label}</span>
                <span className="text-xs leading-snug text-muted-foreground">{g.hint}</span>
                <span className="mt-auto pt-2">
                  <span className="block text-[11px] font-medium">KPI: {g.kpi}</span>
                  <span className="block text-[11px] text-muted-foreground">{g.money}</span>
                </span>
              </button>
            );
          })}
        </div>
        {brand === "personal" ? (
          <p className="text-xs text-muted-foreground">Founder brand: Authority (#5) is the usual pick. Trust is the currency, and email is the asset.</p>
        ) : (
          <p className="text-xs text-muted-foreground">Company: #4 if the product needs explaining, #5 if you sell B2B services or SaaS on trust.</p>
        )}
        {(st?.game === "entertainment" || st?.game === "education_media") && (
          <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            He calls the media game a losing game to start now: you compete with MrBeast, Netflix and AI. Products, services and offers pay far more per view.
          </p>
        )}
      </Block>

      <Block
        title="Your KPI"
        done={done("kpi")}
        hint="Business games: emails per video beat followers per video, which beat views. A follow is worth about 5–10 views."
      >
        <ChoiceChips
          options={KPIS.map((k) => ({ value: k.key, label: k.label, hint: k.hint }))}
          value={st?.kpi}
          onChange={(v) => quietSave({ kpi: v })}
        />
        {st?.kpi && (
          <p className="text-xs text-muted-foreground">
            {KPIS.find((k) => k.key === st.kpi)?.hint}
            {game && GAME_KPI[game.key] !== st.kpi ? ` · ${game.label} is usually scored on ${KPIS.find((k) => k.key === GAME_KPI[game.key])?.label.toLowerCase()}.` : ""}
          </p>
        )}
      </Block>

      <div id="pb-interview" className="grid scroll-mt-20 gap-5 lg:grid-cols-2">
        <Block title="Authority statement" done={done("authority")} hint="Your avatar filter. It stops viewer drift: the slow slide toward vanity topics.">
          <DraftField
            value={st?.authorityStatement ?? ""}
            onSave={(v) => save({ authorityStatement: v })}
            placeholder="I help [who] with [what] in [your unique way]"
            ariaLabel="Authority statement"
          />
          <p className="text-[11px] text-muted-foreground">Formula: &ldquo;I help [X] with [Y] in [Z way].&rdquo; Before every idea, ask: does this serve X with Y?</p>
        </Block>

        <Block
          title="Audience of one (niche interview)"
          done={done("avatar") && done("pains")}
          hint="The 'Frankenstein test': picture your perfect viewer in a chair, stitched from real clients. Name, age, what they've tried, their dream outcome."
        >
          <DraftField
            multiline
            value={st?.avatar ?? ""}
            onSave={(v) => save({ avatar: v })}
            placeholder="e.g. Sam, 34, seed-stage SaaS founder, 2 years in, sells to mid-market, drowning in sales calls, wants a repeatable pipeline…"
            ariaLabel="Audience of one"
            rows={3}
          />
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Their max-pain steps (hard, slow or expensive). Each one is a topic.</p>
            <ListEditor numbered items={st?.pains ?? []} onChange={(next) => quietSave({ pains: next })} placeholder="Add a pain step and press Enter…" />
          </div>
        </Block>
      </div>

      <Block
        id="pb-wheel"
        title="Positioning wheel: points of uniqueness"
        done={done("uniqueness")}
        hint="Map 5–10 competitors from your watchlist on each slice and find the white space: topic selection, substance depth, unique stories, visual format. Fill at least 3."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {UNIQUENESS_AXES.map((a) => (
            <div key={a.key} className="space-y-1">
              <span className="block text-xs font-medium">{a.label}</span>
              <DraftField
                multiline
                rows={2}
                value={(st?.uniqueness as Record<string, string | undefined> | undefined)?.[a.key] ?? ""}
                onSave={saveAxis(a.key)}
                placeholder={a.hint}
                ariaLabel={`Uniqueness: ${a.label}`}
                className="min-h-[60px] text-sm"
              />
            </div>
          ))}
        </div>
      </Block>

      <WherePlayBlock st={st} done={done("pyramid")} onSave={quietSave} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Block
          id="pb-bullseye"
          title="Audience bullseye"
          done={done("bullseye")}
          hint="Narrowest first: ring 1 is your ICP. The narrower the ring, the faster you own the lane. Ring 5 (outermost) is banned: viral there brings no buyers and ruins targeting."
        >
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Bullseye rings={st?.bullseye ?? []} size={176} />
            <div className="w-full min-w-0 flex-1">
              <ListEditor
                numbered
                items={st?.bullseye ?? []}
                onChange={(next) => quietSave({ bullseye: next.slice(0, 5) })}
                placeholder={(st?.bullseye ?? []).length ? "Next ring out…" : "Ring 1: your narrowest niche…"}
              />
              <p className="mt-2 text-[11px] text-muted-foreground">e.g. 1 · SaaS founders stuck at $20K MRR → 2 · B2B founders doing their own sales → 3 · all early-stage founders → 4 · anyone curious about startups → 5 · all business content (banned)</p>
            </div>
          </div>
        </Block>

        <Block
          title="Contrarian take vault"
          done={done("takes")}
          hint="Log every time you violently disagree with someone. Aim for 3–5 macro takes, smaller takes under each."
          right={<Target have={takes.length} min={TAKES_MIN} max={TAKES_MAX} />}
        >
          <div className="flex gap-2">
            <input
              value={take}
              onChange={(e) => setTake(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void quickAddTake();
                }
              }}
              placeholder="Most people believe… but actually…"
              className={cn(inputClass, "h-9 min-w-0 flex-1")}
              aria-label="New contrarian take"
            />
            <button type="button" onClick={() => void quickAddTake()} disabled={!take.trim()} className={buttonVariants({ size: "sm" })}>
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          {takes.length > 0 ? (
            <ol className="space-y-1">
              {takes.map((t, i) => (
                <li key={`${i}-${t}`} className="group flex items-start gap-2 rounded-lg border border-border px-2 py-1.5">
                  <span className="mt-1 w-4 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <InlineEdit
                      value={t}
                      onSave={(v) => quietSave({ contrarianTakes: v.trim() ? takes.map((x, j) => (j === i ? v.trim() : x)) : takes.filter((_, j) => j !== i) })}
                      className="text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => quietSave({ contrarianTakes: takes.filter((_, j) => j !== i) })}
                    aria-label="Remove take"
                    className="rounded p-1 text-muted-foreground opacity-60 hover:text-danger group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-muted-foreground">Ask: &ldquo;What do most people in my niche believe that I disagree with?&rdquo;</p>
          )}
        </Block>
      </div>

      <Plan321Block st={st} brand={brand} today={today} done={done("plan321")} save={save} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Block
          title="Terms to own & signature objects"
          done={done("terms") && done("objects")}
          hint="Term ownership: pick niche terms nobody owns yet and repeat them. Big words ('business') can't be owned."
        >
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Terms</p>
              <TagInput items={st?.terms ?? []} onChange={(next) => quietSave({ terms: next })} placeholder="e.g. revenue engine, founder-led sales… (Enter)" />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Signature objects (same set, same look, every video)</p>
              <TagInput items={st?.objects ?? []} onChange={(next) => quietSave({ objects: next })} placeholder="e.g. black hoodie, whiteboard, the same desk… (Enter)" />
            </div>
          </div>
        </Block>

        <div className="space-y-5">
          <Block title="Hero platform" done={done("hero")} hint="One hero platform + email, for 6 months. Video-native, reply to every comment.">
            <ChoiceChips
              options={HERO.map((k) => ({ value: k, label: PLATFORMS.find((p) => p.key === k)?.label ?? k }))}
              value={st?.heroPlatform}
              onChange={(v) => quietSave({ heroPlatform: v })}
            />
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Chip tone="outline" className="gap-1">
                <Mail className="h-3 w-3" /> + Email
              </Chip>
              Islands, not ecosystems: don&apos;t cross-post YouTube links, except by email.
            </p>
          </Block>

          <Block title="Lead magnet" done={done("magnet")} hint="The off-ramp from rented attention to an owned email list. Pick the topic first, then the closest magnet.">
            <DraftField value={st?.leadMagnet ?? ""} onSave={(v) => save({ leadMagnet: v })} placeholder="e.g. The 5-step founder sales playbook (PDF)" ariaLabel="Lead magnet" />
            <ChoiceChips
              options={LEAD_MAGNET_TYPES.map((t) => ({ value: t.key, label: t.label, hint: t.hint }))}
              value={st?.leadMagnetType}
              onChange={(v) => quietSave({ leadMagnetType: v })}
            />
          </Block>
        </div>
      </div>

      <FormulasBlock formulas={formulas} live={live} done={done("formulas")} onChange={(next) => quietSave({ formulas: next })} />
    </StepCard>
  );
}

function FormulasBlock({ formulas, live, done, onChange }: { formulas: Formula[]; live: number; done: boolean; onChange: (next: Formula[]) => void }) {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("");
  const [layout, setLayout] = useState("");
  const can = topic.trim() && format.trim() && layout.trim();
  const add = () => {
    if (!can) return;
    onChange([...formulas, { id: newId(), topic: topic.trim(), format: format.trim(), layout: layout.trim(), status: "testing" }]);
    setTopic("");
    setFormat("");
    setLayout("");
  };
  return (
    <Block
      id="pb-matrix"
      title="Content formulas (format matrix)"
      done={done}
      hint="Formula = topic + format + visual layout: story structure × visual layout, per topic. 3–4 topics × 1–3 formats × 1–3 layouts gives 5–10 formulas to test in the lab. Smash a proven cell with a new angle, or claim an empty one."
      right={<Target have={live} min={FORMULAS_MIN} max={FORMULAS_MAX} />}
    >
      {formulas.length > 0 && (
        <ul className="space-y-1.5">
          {formulas.map((f) => (
            <li
              key={f.id}
              className={cn(
                "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2",
                f.status === "winner" ? "border-success/40" : "border-border",
                f.status === "retired" && "opacity-60",
              )}
            >
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{f.topic}</span>
                <span className="text-muted-foreground"> · {f.format} · {f.layout}</span>
              </span>
              <Segmented
                size="sm"
                value={f.status}
                onChange={(v) => onChange(formulas.map((x) => (x.id === f.id ? { ...x, status: v } : x)))}
                options={[
                  { value: "testing", label: "Testing" },
                  { value: "winner", label: "Winner" },
                  { value: "retired", label: "Retired" },
                ]}
              />
              <button
                type="button"
                onClick={() => onChange(formulas.filter((x) => x.id !== f.id))}
                aria-label="Remove formula"
                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "hover:text-danger")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (e.g. cold outbound)" className={cn(inputClass, "h-9")} aria-label="Formula topic" />
        <input
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          list="pb-formats"
          placeholder="Format (e.g. personal narrative)"
          className={cn(inputClass, "h-9")}
          aria-label="Formula format"
        />
        <input
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          list="pb-layouts"
          placeholder="Layout (e.g. green screen)"
          className={cn(inputClass, "h-9")}
          aria-label="Formula visual layout"
        />
        <button type="button" onClick={add} disabled={!can} className={buttonVariants({ size: "sm", variant: "outline" })}>
          <Plus className="h-3.5 w-3.5" /> Add formula
        </button>
        <datalist id="pb-formats">
          {STRUCTURES.filter((x) => !x.long).map((x) => (
            <option key={x.key} value={x.label} />
          ))}
        </datalist>
        <datalist id="pb-layouts">
          {LAYOUTS.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </div>
      <p className="text-[11px] text-muted-foreground">Example: barbecue technique · live tutorial · standing at the grill. Mark winners as the lab data comes in; formulas burn out, so retire and replace.</p>
    </Block>
  );
}
