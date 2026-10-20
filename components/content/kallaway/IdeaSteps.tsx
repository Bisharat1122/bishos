"use client";

import { useState } from "react";
import Link from "next/link";
import { useAction, useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowRight, Archive, Plus, Sparkles, TrendingUp, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Chip, Select, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { EMOTIONS, IDEA_GATE } from "@/lib/kallaway";
import { AiBox } from "../AiBox";
import { errMsg } from "../model";
import { toggleIn } from "./useKw";
import { CheckRow, Count, Note, Pill, SubHead, useAiTask } from "./parts";
import type { StepProps } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// Step 1 · Idea gate
// ─────────────────────────────────────────────────────────────────────────

export function GateStep({ store }: StepProps) {
  const { kw, set } = store;
  const gate = kw.gate ?? [];
  const passed = IDEA_GATE.filter((g) => gate.includes(g.key)).length;
  return (
    <div className="space-y-3">
      <SubHead hint="Nothing else matters if the idea is weak. Tick what's true." right={<Count n={passed} of={IDEA_GATE.length} />}>
        Does this idea earn a rep?
      </SubHead>
      <div className="space-y-0.5">
        {IDEA_GATE.map((g) => (
          <CheckRow
            key={g.key}
            checked={gate.includes(g.key)}
            onToggle={() => set((c) => ({ gate: toggleIn(c.gate, g.key) }))}
            label={g.label}
            hint={g.hint}
          />
        ))}
      </div>
      {!gate.includes("validated") && (
        <Note tone="info" icon={TrendingUp}>
          Outliers first: remake your own winners, then 10K–1M creators&apos; winners.{" "}
          <Link href="/swipes" className="font-medium underline underline-offset-2">
            Open your swipe file
          </Link>
        </Note>
      )}
      {passed === IDEA_GATE.length && <Note tone="success">This idea passes the gate. Mark the step done and find your angle.</Note>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 2 · Angle & facts (LEGO bricks)
// ─────────────────────────────────────────────────────────────────────────

type Fact = { text: string; score: number };
const byScore = (l: Fact[]) => [...l].sort((a, b) => b.score - a.score);
const isSorted = (l: Fact[]) => l.every((f, i) => i === 0 || l[i - 1].score >= f.score);

export function BricksStep({ store, piece, strategy }: StepProps) {
  const { kw, set } = store;
  const addVault = useMutation(api.contentSystem.addContrarian);
  const buckets = strategy?.buckets ?? [];
  const bucketKnown = !kw.bucketId || kw.bucketId === "chaos" || buckets.some((b) => b.id === kw.bucketId);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
        <div className="space-y-1.5">
          <SubHead>Topic</SubHead>
          <TextInput value={kw.topic ?? ""} onChange={(e) => set({ topic: e.target.value })} placeholder="One sentence: what this video is about" />
        </div>
        <div className="space-y-1.5">
          <SubHead>Topic bucket</SubHead>
          <Select aria-label="Topic bucket" value={bucketKnown ? kw.bucketId ?? "" : ""} onChange={(e) => set({ bucketId: e.target.value })}>
            <option value="">{buckets.length ? "No bucket" : "No buckets set up"}</option>
            {buckets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.kind ? ` · ${b.kind}` : ""}
              </option>
            ))}
            <option value="chaos">Chaos agent (a creative bet)</option>
          </Select>
          <p className="text-[11px] leading-snug text-muted-foreground">
            {buckets.length ? "3-2-1: 3 buckets × 2 a week + 1 chaos agent." : "Set up your 3-2-1 buckets in the Content playbook."}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <SubHead hint="Premise + your take + the key facts.">Angle</SubHead>
        <TextArea rows={2} className="min-h-0" value={kw.angle ?? ""} onChange={(e) => set({ angle: e.target.value })} placeholder="The lens only you can bring to this topic" />
      </div>

      <div className="space-y-2">
        <SubHead hint="What do most people believe that I disagree with?">Belief → your take</SubHead>
        <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <TextArea
            rows={2}
            className="min-h-0"
            aria-label="Common belief"
            value={kw.commonBelief ?? ""}
            onChange={(e) => set({ commonBelief: e.target.value })}
            placeholder="Common belief: most people think…"
          />
          <ArrowRight className="mx-auto h-4 w-4 rotate-90 text-muted-foreground sm:rotate-0" aria-hidden />
          <TextArea
            rows={2}
            className="min-h-0"
            aria-label="Your contrarian take"
            value={kw.contrarianTake ?? ""}
            onChange={(e) => set({ contrarianTake: e.target.value })}
            placeholder="Your contrarian take: actually…"
          />
        </div>
        {kw.contrarianTake?.trim() && (
          <button
            type="button"
            onClick={() =>
              void addVault({ brand: piece.brand, text: kw.contrarianTake!.trim() })
                .then(() => toast("Added to your contrarian vault", { tone: "success" }))
                .catch((e) => toast(errMsg(e), { tone: "warning" }))
            }
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs")}
          >
            <Archive className="h-3.5 w-3.5" /> Save take to my vault
          </button>
        )}
      </div>

      <ShockFacts store={store} piece={piece} />

      <div className="space-y-2">
        <SubHead hint="Write it at the top of the page and reread the script through it.">Target emotion</SubHead>
        <div className="flex flex-wrap gap-1.5">
          {EMOTIONS.map((e) => (
            <Pill key={e.key} on={kw.emotion === e.key} onClick={() => set({ emotion: kw.emotion === e.key ? "" : e.key })}>
              {e.label}
            </Pill>
          ))}
        </div>
        <Note>
          The sweet spot: things people <span className="font-medium text-foreground">don&apos;t believe</span>, but{" "}
          <span className="font-medium text-foreground">can believe quickly</span> once you say it. That aha is the contrast.
        </Note>
      </div>
    </div>
  );
}

type ShockProposal = FunctionReturnType<typeof api.aiKallaway.shockFacts>;

function ShockFacts({ store, piece }: Pick<StepProps, "store" | "piece">) {
  const { kw, set } = store;
  const facts = kw.shockFacts ?? [];
  const [draft, setDraft] = useState("");
  const shock = useAction(api.aiKallaway.shockFacts);
  const ai = useAiTask<ShockProposal>();
  const [added, setAdded] = useState<Set<number>>(new Set());

  const add = (text: string, score: number) => {
    const t = text.trim();
    if (!t) return;
    set((c) => ({ shockFacts: byScore([...(c.shockFacts ?? []), { text: t, score }]) }));
  };
  const edit = (i: number, patch: Partial<Fact>) => set((c) => ({ shockFacts: (c.shockFacts ?? []).map((f, j) => (j === i ? { ...f, ...patch } : f)) }));
  // Re-sort only when a slider is released, so rows don't jump mid-drag.
  const settle = () => set((c) => (isSorted(c.shockFacts ?? []) ? {} : { shockFacts: byScore(c.shockFacts ?? []) }));
  const topic = kw.topic?.trim() || piece.title;
  const n = facts.length;
  // One runner for "Find" and "Try again" so a retry sends the same context.
  const findFacts = () =>
    void ai.run(async () => {
      setAdded(new Set());
      return shock({ topic, notes: [kw.angle, piece.brief].filter(Boolean).join("\n\n") || undefined, commonBelief: kw.commonBelief || undefined });
    });

  return (
    <div className="space-y-2">
      <SubHead
        hint="Shock Score: out of 100 people, how many haven't heard this? Aim for 5–10 high-shock, true facts."
        right={
          <span className={cn("text-[11px] font-medium tabular-nums", n >= 5 && n <= 10 ? "text-success" : n > 10 ? "text-warning" : "text-muted-foreground")}>
            {n} fact{n === 1 ? "" : "s"} · aim 5–10
          </span>
        }
      >
        Shock facts
      </SubHead>
      {facts.length > 0 && (
        <ul className="space-y-1.5">
          {facts.map((f, i) => (
            <li key={i} className="rounded-lg border border-border p-2">
              <div className="flex items-start gap-2">
                <TextInput aria-label={`Fact ${i + 1}`} value={f.text} onChange={(e) => edit(i, { text: e.target.value })} className="h-8 flex-1" />
                <button
                  type="button"
                  aria-label="Remove fact"
                  onClick={() => set((c) => ({ shockFacts: (c.shockFacts ?? []).filter((_, j) => j !== i) }))}
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-8 shrink-0 hover:text-danger")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={f.score}
                  aria-label={`Shock score for fact ${i + 1}`}
                  onChange={(e) => edit(i, { score: Number(e.target.value) })}
                  onPointerUp={settle}
                  onKeyUp={settle}
                  onBlur={settle}
                  className="h-1.5 min-w-0 flex-1 cursor-pointer accent-primary"
                />
                <Chip tone={f.score >= 70 ? "success" : "muted"} className="w-12 tabular-nums">
                  {f.score}
                </Chip>
              </div>
            </li>
          ))}
        </ul>
      )}
      {n > 10 && <Note tone="warning">More than 10: keep the most shocking ones, the rest dilute the script.</Note>}
      <div className="flex gap-2">
        <TextInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
            e.preventDefault();
            add(draft, 50);
            setDraft("");
          }}
          placeholder="Add a fact, take or implication… (Enter)"
          className="h-8"
        />
        <button
          type="button"
          aria-label="Add fact"
          disabled={!draft.trim()}
          onClick={() => {
            add(draft, 50);
            setDraft("");
          }}
          className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "shrink-0")}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={findFacts}
        disabled={ai.state?.loading || topic.trim().length < 4}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Sparkles className="h-3.5 w-3.5" /> Find shock facts
      </button>
      {ai.state && (
        <AiBox
          title="Shock-fact candidates"
          loading={ai.state.loading}
          error={ai.state.error}
          onClose={ai.clear}
          onRetry={findFacts}
        >
          <Note tone="warning" className="mb-2">
            Verify before using. AI facts can be wrong or out of date: check a source, or use only what you&apos;ve seen yourself.
          </Note>
          <ul className="space-y-1">
            {(ai.state.data ?? []).map((f, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-card">
                <Chip tone={f.score >= 70 ? "success" : "muted"} className="mt-0.5 w-10 shrink-0 tabular-nums">
                  {f.score}
                </Chip>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{f.text}</p>
                  {f.why && <p className="mt-0.5 text-[11px] text-muted-foreground">{f.why}</p>}
                </div>
                <button
                  type="button"
                  disabled={added.has(i)}
                  onClick={() => {
                    add(f.text, f.score);
                    setAdded((s) => new Set(s).add(i));
                  }}
                  className={cn(buttonVariants({ variant: added.has(i) ? "secondary" : "default", size: "sm" }), "h-7 shrink-0 px-2 text-xs")}
                >
                  {added.has(i) ? "Added" : "Add"}
                </button>
              </li>
            ))}
          </ul>
        </AiBox>
      )}
    </div>
  );
}
