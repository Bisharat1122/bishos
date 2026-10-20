"use client";

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowRight, Check, ClipboardCheck, Eye, Sparkles, Wand2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Bar, Chip, Segmented, TextArea, TextInput, buttonVariants, cn, toneForPct } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import {
  ARCHETYPES,
  HOOKS_THAT_FAIL,
  HOOKS_THAT_WORK,
  HOOK_AUDIT,
  HOOK_FORMATS,
  HOOK_JOBS,
  MIN_VIABLE_VISUAL,
  POWER_WORDS,
  STRUCTURES,
  TEXT_HOOK_RULES,
  VISUAL_HOOKS,
  detectPowerWords,
  lintTextHook,
} from "@/lib/kallaway";
import { AiBox } from "../AiBox";
import { errMsg } from "../model";
import { toggleIn, type KwPatch, type KwStore } from "./useKw";
import { CheckRow, Count, LintList, Note, PickCard, Pill, SubHead, useAiTask } from "./parts";
import { MVV, type StepProps } from "./types";

type ArchetypeHooks = FunctionReturnType<typeof api.aiKallaway.archetypeHooks>;
type HookAudit = FunctionReturnType<typeof api.aiKallaway.auditHook>;

/** Starter lines for the newest "hooks that work" patterns (his own hook data). */
const WORKING_STARTERS: Record<string, string> = {
  transformation: "Here's how to turn [before] into [after].",
  impossibility: "Here's how to make your [thing] so [quality] it's impossible to [skip / ignore].",
  addiction: "Here's how to get [your viewer] addicted to [the thing].",
  new_thing: "[Company] just released [new thing] that [outcome].",
};

/** AI audit keys → HOOK_AUDIT keys. */
const AUDIT_MAP: Record<string, string> = { relevance: "you" };

export function HookStep({ store, piece, strategy }: StepProps) {
  const { kw, set, flush } = store;
  const update = useMutation(api.content.update);
  const archetypeHooks = useAction(api.aiKallaway.archetypeHooks);
  const auditHook = useAction(api.aiKallaway.auditHook);
  const archAi = useAiTask<ArchetypeHooks>();
  const auditAi = useAiTask<HookAudit>();
  const [mode, setMode] = useState<"archetype" | "format">(kw.hookFormat && !kw.archetype ? "format" : "archetype");
  const [applying, setApplying] = useState(false);

  const composed = [kw.lean, kw.interjection, kw.snapback]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" ");
  const spoken = composed || piece.hook?.trim() || "";
  const power = detectPowerWords(spoken);
  const reqHit = POWER_WORDS.filter((p) => p.required && power[p.key]).length;
  const reqTotal = POWER_WORDS.filter((p) => p.required).length;
  const words = composed ? composed.split(/\s+/).length : 0;
  const isPieceHook = !!composed && composed === (piece.hook ?? "").trim();
  const startsIfYou = /^\s*["“]?if you\b/i.test(composed || piece.hook || "");
  const audit = (kw.hookAudit ?? []).filter((k) => !k.startsWith(MVV));
  const mvv = (kw.hookAudit ?? []).filter((k) => k.startsWith(MVV));
  const arch = ARCHETYPES.find((a) => a.key === kw.archetype);
  const structure = STRUCTURES.find((s) => s.key === kw.structure);
  const topic = kw.topic?.trim() || piece.title;

  async function applyAsHook() {
    if (!composed) return;
    setApplying(true);
    try {
      await flush({ alsoHook: true, patch: { lean: kw.lean ?? "", interjection: kw.interjection ?? "", snapback: kw.snapback ?? "" } });
      toast("Piece hook updated", { tone: "success" });
    } catch {
      /* useKw already warned */
    } finally {
      setApplying(false);
    }
  }

  function pickFormat(key: string) {
    const on = kw.hookFormat === key;
    set({ hookFormat: on ? "" : key });
    // Keep the piece's hook type (Content Studio filters/analytics) in sync.
    if (!on) void update({ id: piece._id, hookType: key }).catch((e) => toast(errMsg(e), { tone: "warning" }));
  }

  function starter(key: string) {
    const line = WORKING_STARTERS[key];
    if (!line) return;
    if (kw.lean?.trim() && !confirm("Replace your context lean-in with this starter?")) return;
    set({ lean: line });
  }

  return (
    <div className="space-y-6">
      {/* The 3 jobs */}
      <div className="space-y-2">
        <SubHead>The 3 jobs of a hook, in order</SubHead>
        <ol className="grid gap-2 sm:grid-cols-3">
          {HOOK_JOBS.map((j, i) => (
            <li key={j.key} className="relative rounded-lg border border-border bg-muted/40 p-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Job {i + 1}</span>
              <p className="text-sm font-medium leading-tight">{j.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{j.hint}</p>
              {i < HOOK_JOBS.length - 1 && (
                <ArrowRight className="absolute -right-[13px] top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 rounded-full bg-card text-muted-foreground sm:block" aria-hidden />
              )}
            </li>
          ))}
        </ol>
        <p className="text-[11px] leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">The 200-point arc:</span> lean them to the common belief (+100), then flip to your take (−100). Jumping
          straight to the contrarian line is only half the distance.
        </p>
      </div>

      {/* Archetype / format picker */}
      <div className="space-y-2">
        <SubHead
          right={
            <Segmented<"archetype" | "format">
              size="sm"
              value={mode}
              onChange={setMode}
              options={[
                { value: "archetype", label: "6 archetypes" },
                { value: "format", label: "9 formats" },
              ]}
            />
          }
        >
          Pick a shape
        </SubHead>
        {mode === "archetype" ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {ARCHETYPES.map((a) => (
              <PickCard key={a.key} on={kw.archetype === a.key} onClick={() => set({ archetype: kw.archetype === a.key ? "" : a.key })} title={a.label} sub={a.contrast}>
                <span className="text-[11px] leading-snug text-muted-foreground">{a.steps.join(" → ")}</span>
                <span className="text-[10px] text-muted-foreground">Best for: {a.best}</span>
              </PickCard>
            ))}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {HOOK_FORMATS.map((f) => (
              <PickCard
                key={f.key}
                on={kw.hookFormat === f.key}
                onClick={() => pickFormat(f.key)}
                title={f.label}
                sub={<span className="italic">&ldquo;{f.example}&rdquo;</span>}
                badge={structure?.hooks.includes(f.key) ? <Chip tone="info">fits {structure.label.toLowerCase()}</Chip> : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3-step builder */}
      <div className="space-y-3">
        <SubHead hint="2–4 short lines. Each line makes them need the next one.">3-step hook builder</SubHead>
        {arch && (
          <Note tone="muted">
            <span className="font-medium text-foreground">{arch.label}:</span> {arch.steps.join(" → ")}
          </Note>
        )}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">Quick-pick a pattern that works (from his own hook data)</span>
          <div className="flex flex-wrap gap-1.5">
            {HOOKS_THAT_WORK.map((h) => (
              <Pill key={h.key} action on={false} onClick={() => starter(h.key)} title={`${h.hint} · inserts a starter into line 1`}>
                {h.label}
              </Pill>
            ))}
          </div>
        </div>
        <BuilderLine
          n={1}
          label="Context lean-in"
          hint="Topic in the first sentence, then lean them toward the common belief: common ground, a pain or benefit, a metaphor or a mind-blowing fact."
          value={kw.lean ?? ""}
          onChange={(v) => set({ lean: v })}
          placeholder={kw.commonBelief ? `e.g. ${kw.commonBelief}` : "Most founders think…"}
        />
        <BuilderLine
          n={2}
          label="Scroll-stop interjection"
          hint="One stunning line, usually opening with But / However / Yet."
          value={kw.interjection ?? ""}
          onChange={(v) => set({ interjection: v })}
          placeholder="But…"
        />
        <BuilderLine
          n={3}
          label="Contrarian snapback"
          hint="Still on topic, the opposite of the lean. The bigger the honest shock, the stronger the snap."
          value={kw.snapback ?? ""}
          onChange={(v) => set({ snapback: v })}
          placeholder={kw.contrarianTake ? `e.g. ${kw.contrarianTake}` : "Turns out…"}
        />
        {kw.commonBelief?.trim() && kw.contrarianTake?.trim() && !kw.lean?.trim() && !kw.snapback?.trim() && (
          <button
            type="button"
            onClick={() => set({ lean: kw.commonBelief!.trim(), snapback: kw.contrarianTake!.trim() })}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs")}
          >
            Start from my belief → take
          </button>
        )}

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Preview</span>
            {words > 0 && (
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {words} words · ≈{Math.max(1, Math.round(words / 2.5))}s
              </span>
            )}
            {isPieceHook && (
              <Chip tone="success" className="ml-auto gap-1">
                <Check className="h-3 w-3" /> The piece&apos;s hook
              </Chip>
            )}
          </div>
          <p className={cn("text-base font-medium leading-snug", !composed && "text-muted-foreground")}>{composed || "Your hook appears here as you write."}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => void applyAsHook()} disabled={!composed || isPieceHook || applying} className={buttonVariants({ size: "sm" })}>
              <Check className="h-3.5 w-3.5" /> Use as the piece&apos;s hook
            </button>
          </div>
        </div>

        {startsIfYou && (
          <Note tone="warning">
            Starts with &ldquo;If you…&rdquo;. Conditional openers never win in his data. Lead with the transformation, the impossible thing or the new thing instead.
          </Note>
        )}

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">Power words (detected live{composed ? "" : " in the piece's hook"})</span>
            <span className={cn("text-[11px] font-medium tabular-nums", reqHit === reqTotal ? "text-success" : "text-muted-foreground")}>
              required {reqHit}/{reqTotal}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POWER_WORDS.map((p) => {
              const hit = spoken ? power[p.key] : false;
              return (
                <Chip
                  key={p.key}
                  tone={hit ? "success" : p.required && spoken ? "warning" : "muted"}
                  className="gap-1"
                  title={`${p.hint}${p.required ? " · required" : " · optional"}`}
                >
                  {hit && <Check className="h-3 w-3" />}
                  {p.label}
                  {!p.required && <span className="opacity-70">opt</span>}
                </Chip>
              );
            })}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">Avoid: {HOOKS_THAT_FAIL.join(" · ")}.</p>
      </div>

      {/* Text hook */}
      <div className="space-y-2">
        <SubHead hint="The on-screen title text: bigger words, not your captions.">Text hook</SubHead>
        <TextArea rows={2} className="min-h-0 font-medium" value={kw.textHook ?? ""} onChange={(e) => set({ textHook: e.target.value })} placeholder="3–5 words, max 2 lines" />
        <LintList issues={lintTextHook(kw.textHook ?? "")} />
        <ul className="grid gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground sm:grid-cols-2">
          {TEXT_HOOK_RULES.map((r) => (
            <li key={r} className="flex gap-1.5">
              <span aria-hidden>·</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      {/* Visual + audio */}
      <div className="space-y-2">
        <SubHead hint="What they SEE in the first 2 seconds: visuals land before words.">Key visual</SubHead>
        <TextInput value={kw.keyVisual ?? ""} onChange={(e) => set({ keyVisual: e.target.value })} placeholder="e.g. I pull a $40K invoice off the printer" />
        <div className="flex flex-wrap gap-1.5">
          {VISUAL_HOOKS.map((v) => (
            <Pill key={v.key} on={kw.visualCategory === v.key} onClick={() => set({ visualCategory: kw.visualCategory === v.key ? "" : v.key })}>
              {v.label}
            </Pill>
          ))}
        </div>
        <div className="rounded-lg border border-border p-2">
          <div className="flex items-center justify-between gap-2 px-2 pb-1">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Eye className="h-3.5 w-3.5" /> Minimum viable visual: at least one in the first 2s
            </span>
            <Count n={mvv.length} target={1} />
          </div>
          {MIN_VIABLE_VISUAL.map((m, i) => (
            <CheckRow key={m} checked={mvv.includes(`${MVV}${i}`)} onToggle={() => set((c) => ({ hookAudit: toggleIn(c.hookAudit, `${MVV}${i}`) }))} label={m} />
          ))}
        </div>
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-medium text-muted-foreground">Audio</span>
          <TextInput value={kw.audioNote ?? ""} onChange={(e) => set({ audioNote: e.target.value })} placeholder="Music mood, sound effects, the first sound they hear" />
        </div>
      </div>

      {/* Hook audit */}
      <div className="space-y-2">
        <SubHead hint="Visual, spoken and text hooks should all say the same thing." right={<Count n={audit.length} of={HOOK_AUDIT.length} />}>
          Hook audit
        </SubHead>
        <div className="space-y-0.5">
          {HOOK_AUDIT.map((a) => (
            <CheckRow key={a.key} checked={audit.includes(a.key)} onToggle={() => set((c) => ({ hookAudit: toggleIn(c.hookAudit, a.key) }))} label={a.label} hint={a.hint} />
          ))}
        </div>
      </div>

      {/* AI */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            void archAi.run(() =>
              archetypeHooks({
                topic,
                audience: strategy?.avatar || undefined,
                keyVisual: kw.keyVisual || undefined,
                contrarianTake: kw.contrarianTake || undefined,
                commonBelief: kw.commonBelief || undefined,
              }),
            )
          }
          disabled={archAi.state?.loading || topic.trim().length < 4}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Sparkles className="h-3.5 w-3.5" /> Write it in all 6 archetypes
        </button>
        <button
          type="button"
          onClick={() => void auditAi.run(() => auditHook({ spoken, textHook: kw.textHook || undefined, visual: kw.keyVisual || undefined, topic }))}
          disabled={auditAi.state?.loading || spoken.length < 8}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ClipboardCheck className="h-3.5 w-3.5" /> Audit my hook
        </button>
      </div>

      {archAi.state && (
        <AiBox title="Your topic in 6 archetypes" loading={archAi.state.loading} error={archAi.state.error} onClose={archAi.clear}>
          <div className="grid gap-2 sm:grid-cols-2">
            {(archAi.state.data ?? []).map((h) => (
              <div key={h.archetype} className="flex flex-col rounded-lg border border-border bg-card p-2.5">
                <div className="mb-1 flex items-center gap-1.5">
                  <Chip tone="outline">{h.label}</Chip>
                  {h.textHook && (
                    <span className="min-w-0 truncate text-[11px] font-medium text-muted-foreground" title="Text hook">
                      {h.textHook}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-snug">{h.lean}</p>
                <p className="text-sm leading-snug">{h.interjection}</p>
                <p className="text-sm font-medium leading-snug">{h.snapback}</p>
                <button
                  type="button"
                  onClick={() => {
                    const p: KwPatch = { archetype: h.archetype, lean: h.lean, interjection: h.interjection, snapback: h.snapback };
                    if (h.textHook) p.textHook = h.textHook;
                    set(p);
                    toast(`${h.label} hook inserted`);
                  }}
                  className={cn(buttonVariants({ size: "sm" }), "mt-2 h-7 self-start px-2 text-xs")}
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </AiBox>
      )}

      {auditAi.state && (
        <AiBox title="Hook audit" loading={auditAi.state.loading} error={auditAi.state.error} onClose={auditAi.clear}>
          {auditAi.state.data && <AuditResult data={auditAi.state.data} onApply={set} />}
        </AiBox>
      )}
    </div>
  );
}

function BuilderLine({
  n,
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  n: number;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">{n}</span>
      <div className="min-w-0 flex-1 space-y-1">
        <span className="block text-xs font-medium">{label}</span>
        <TextArea rows={2} className="min-h-0" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} />
        <span className="block text-[11px] leading-snug text-muted-foreground">{hint}</span>
      </div>
    </div>
  );
}

const SCORE_LABEL: Record<string, string> = {
  alignment: "Alignment",
  speed: "Speed to value",
  clarity: "Clarity",
  curiosity: "Curiosity",
  stakes: "Stakes",
  relevance: "Relevance",
  absorption: "Absorption",
};

function AuditResult({ data, onApply }: { data: HookAudit; onApply: KwStore["set"] }) {
  const entries = Object.entries(data.scores) as [string, number][];
  const passing = entries.filter(([, s]) => s >= 7).map(([k]) => AUDIT_MAP[k] ?? k);
  const r = data.rewrite;
  return (
    <div className="space-y-3">
      {data.verdict && <p className="text-sm leading-snug">{data.verdict}</p>}
      <ul className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {entries.map(([k, s]) => (
          <li key={k} className="min-w-0">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium">{SCORE_LABEL[k] ?? k}</span>
              <span className="tabular-nums text-muted-foreground">{s}/10</span>
            </div>
            <Bar value={s * 10} tone={toneForPct(s * 10)} className="mt-1" />
            {data.notes[k as keyof typeof data.notes] && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{data.notes[k as keyof typeof data.notes]}</p>}
          </li>
        ))}
      </ul>
      {data.failures.length > 0 && (
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground">Failure modes found</span>
          <ul className="space-y-1">
            {data.failures.map((f) => (
              <li key={f.mode} className="flex items-start gap-2 text-xs">
                <Chip tone="warning" className="shrink-0 capitalize">
                  {f.mode}
                </Chip>
                <span className="min-w-0 leading-snug">{f.why}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {r.full && (
        <div className="rounded-lg border border-border bg-card p-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Improved rewrite</span>
          <p className="mt-1 text-sm font-medium leading-snug">{r.full}</p>
          {r.textHook && <p className="mt-1 text-[11px] text-muted-foreground">Text hook: {r.textHook}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {(r.lean || r.snapback) && (
              <button
                type="button"
                onClick={() => {
                  const p: KwPatch = { lean: r.lean, interjection: r.interjection, snapback: r.snapback };
                  if (r.textHook) p.textHook = r.textHook;
                  onApply(p);
                  toast("Rewrite inserted into the builder");
                }}
                className={cn(buttonVariants({ size: "sm" }), "h-7 px-2 text-xs")}
              >
                <Wand2 className="h-3.5 w-3.5" /> Use rewrite
              </button>
            )}
            {passing.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onApply((c) => {
                    const cur = (c.hookAudit ?? []).slice();
                    for (const k of passing) if (!cur.includes(k)) cur.push(k);
                    return { hookAudit: cur };
                  });
                  toast(`${passing.length} passing checks ticked`);
                }}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 px-2 text-xs")}
              >
                Tick the checks that scored 7+
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
