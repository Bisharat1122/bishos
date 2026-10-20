"use client";

import { ReactNode, memo, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, Lock, Route } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { CheckCircle, Ring, buttonVariants, cn } from "@/components/os/kit";
import { reward } from "@/components/os/celebrate";
import { useStable } from "@/components/os/useCockpit";
import { ARCHETYPES, CTA_RAMPS, EMOTIONS, HOOK_AUDIT, HOOK_FORMATS, IDEA_GATE, PACKAGING_SHORT, STRUCTURES, WORKFLOW_STEPS } from "@/lib/kallaway";
import { scriptStats, type FullPiece } from "../model";
import { useKw, type Kw } from "./useKw";
import { BricksStep, GateStep } from "./IdeaSteps";
import { HookStep } from "./HookStep";
import { ScriptStep, StructureStep } from "./ScriptSteps";
import { ConvertStep, PackageStep, ReviewStep } from "./ShipSteps";
import { MVV, isLongForm, type StepProps } from "./types";

type StepKey = (typeof WORKFLOW_STEPS)[number]["key"];

const HINTS: Record<StepKey, string> = {
  gate: "Does this idea earn a rep?",
  bricks: "Topic, contrarian angle, shock facts, emotion",
  hook: "Visual stop → context → contrast",
  structure: "Pick the story shape, write the last line first",
  script: "Live linter, storylocks, one-question chain",
  convert: "Signal, trust, one ramp, aligned offer",
  package: "What earns the click (or the share)",
  review: "Which brick was weak? Fix it next rep",
};

const COLLAPSE_KEY = "bishos.content.kwPanel";

/**
 * Kallaway's per-video process as a guided, autosaving checklist on every piece.
 * Memoised: typing in the editor's other fields (hook, brief, CTA…) re-renders
 * PieceEditor on every keystroke, but leaves these props unchanged.
 */
export const WorkflowPanel = memo(function WorkflowPanel({ piece, script, setScript }: { piece: FullPiece; script: string; setScript: (v: string) => void }) {
  const store = useKw(piece._id, piece.kw);
  const strategy = useStable(useQuery(api.contentSystem.strategy, { brand: piece.brand }));
  const { kw, set, status } = store;
  const steps = kw.steps ?? [];
  const published = !!piece.publishedAt;
  const long = isLongForm(piece.format);
  const doneCount = WORKFLOW_STEPS.filter((s) => steps.includes(s.key)).length;
  const total = WORKFLOW_STEPS.length;

  const firstUndone = (list: string[]) => WORKFLOW_STEPS.find((s) => !list.includes(s.key) && (s.key !== "review" || published))?.key;
  const [open, setOpen] = useState<Set<string>>(() => {
    const f = firstUndone(piece.kw?.steps ?? []);
    return new Set(f ? [f] : []);
  });
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* storage blocked: stay expanded */
    }
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });
  };

  const toggleOpen = (key: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  function toggleDone(key: StepKey) {
    const isDone = steps.includes(key);
    const next = isDone ? steps.filter((k) => k !== key) : [...steps, key];
    set({ steps: next });
    if (!isDone) {
      // Guided flow: fold this step, open the next one still to do.
      const nxt = firstUndone(next);
      setOpen((s) => {
        const n = new Set(s);
        n.delete(key);
        if (nxt) n.add(nxt);
        return n;
      });
      const doneNow = WORKFLOW_STEPS.filter((s) => next.includes(s.key)).length;
      if (doneNow === total) reward("Workflow complete · that's a full rep", undefined, true);
    }
  }

  const props: StepProps = { store, piece, script, setScript, strategy };
  const savedLabel = status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Couldn't save, retrying on next edit" : "";

  return (
    <section className="rounded-xl border border-border bg-card text-card-foreground shadow-card">
      <div className="flex items-center gap-3 px-4 pt-4 sm:px-5">
        <Ring value={(doneCount / total) * 100} size={44} stroke={4} tone={doneCount === total ? "success" : "primary"}>
          <span className="text-[11px] font-semibold tabular-nums">
            {doneCount}/{total}
          </span>
        </Ring>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Route className="h-4 w-4 text-muted-foreground" aria-hidden />
            Video workflow
          </h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Kallaway system{long ? " + Paddy Galloway for YouTube" : ""}
            {savedLabel && <span className={cn("ml-2", status === "error" && "text-warning")}>· {savedLabel}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand workflow" : "Collapse workflow"}
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          {collapsed ? <ChevronsUpDown className="h-4 w-4" /> : <ChevronsDownUp className="h-4 w-4" />}
        </button>
      </div>

      {collapsed ? (
        <div className="px-4 pb-4 pt-3 sm:px-5">
          <ol className="flex gap-1" aria-label="Workflow progress">
            {WORKFLOW_STEPS.map((s) => (
              <li key={s.key} title={s.label} className={cn("h-1.5 flex-1 rounded-full", steps.includes(s.key) ? "bg-success" : "bg-muted")} />
            ))}
          </ol>
        </div>
      ) : (
        <ol className="space-y-2 p-4 pt-3 sm:p-5 sm:pt-3">
          {WORKFLOW_STEPS.map((s, i) => {
            const isDone = steps.includes(s.key);
            const locked = s.key === "review" && !published;
            const isOpen = open.has(s.key);
            return (
              <li key={s.key} className={cn("rounded-lg border transition-colors", isOpen ? "border-ring/50" : "border-border")}>
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  {locked ? (
                    <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground" title="Unlocks after you publish">
                      <Lock className="h-3.5 w-3.5" aria-label="Locked until published" />
                    </span>
                  ) : (
                    <CheckCircle size="sm" checked={isDone} onClick={() => toggleDone(s.key)} label={isDone ? `Mark “${s.label}” not done` : `Mark “${s.label}” done`} />
                  )}
                  <button
                    type="button"
                    onClick={() => toggleOpen(s.key)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    <span className="w-3 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-sm font-medium leading-tight", isDone && "text-muted-foreground")}>{s.label}</span>
                      <span className="block truncate text-[11px] leading-snug text-muted-foreground">{summary(s.key, kw, piece, script) || HINTS[s.key]}</span>
                    </span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden />
                  </button>
                </div>
                {isOpen && (
                  <div className="os-rise border-t border-border px-3 py-4 sm:px-4">
                    <StepBody step={s.key} props={props} />
                    {!locked && !isDone && (
                      <div className="mt-5 flex justify-end">
                        <button type="button" onClick={() => toggleDone(s.key)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                          Mark “{s.label}” done
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
});

function StepBody({ step, props }: { step: StepKey; props: StepProps }): ReactNode {
  switch (step) {
    case "gate":
      return <GateStep {...props} />;
    case "bricks":
      return <BricksStep {...props} />;
    case "hook":
      return <HookStep {...props} />;
    case "structure":
      return <StructureStep {...props} />;
    case "script":
      return <ScriptStep {...props} />;
    case "convert":
      return <ConvertStep {...props} />;
    case "package":
      return <PackageStep {...props} />;
    case "review":
      return <ReviewStep {...props} />;
  }
}

/** One-line status for a collapsed step. */
function summary(step: StepKey, kw: Kw, piece: FullPiece, script: string): string {
  const parts: string[] = [];
  switch (step) {
    case "gate": {
      const n = IDEA_GATE.filter((g) => (kw.gate ?? []).includes(g.key)).length;
      return n ? `${n}/${IDEA_GATE.length} checks passed` : "";
    }
    case "bricks": {
      if (kw.topic?.trim()) parts.push("topic set");
      if (kw.contrarianTake?.trim()) parts.push("contrarian take");
      const f = kw.shockFacts?.length ?? 0;
      if (f) parts.push(`${f} fact${f === 1 ? "" : "s"}`);
      const emo = EMOTIONS.find((e) => e.key === kw.emotion);
      if (emo) parts.push(emo.label.toLowerCase());
      return parts.join(" · ");
    }
    case "hook": {
      const lines = [kw.lean, kw.interjection, kw.snapback].filter((x) => x?.trim()).length;
      const shape = ARCHETYPES.find((a) => a.key === kw.archetype)?.label ?? HOOK_FORMATS.find((f) => f.key === kw.hookFormat)?.label;
      if (shape) parts.push(shape);
      if (lines) parts.push(`${lines}/3 lines`);
      const audit = (kw.hookAudit ?? []).filter((k) => !k.startsWith(MVV) && HOOK_AUDIT.some((h) => h.key === k)).length;
      if (audit) parts.push(`audit ${audit}/${HOOK_AUDIT.length}`);
      return parts.join(" · ");
    }
    case "structure": {
      const st = STRUCTURES.find((s) => s.key === kw.structure);
      if (st) parts.push(st.label);
      if (kw.visualFormat?.trim()) parts.push(kw.visualFormat.trim());
      if (kw.lastLine?.trim()) parts.push("last line written");
      return parts.join(" · ");
    }
    case "script": {
      const s = scriptStats(script);
      return s.words ? `${s.words} words · ≈ ${s.label}` : "";
    }
    case "convert": {
      const r = kw.trustRungs?.length ?? 0;
      if (r) parts.push(`${r} trust rung${r === 1 ? "" : "s"}`);
      const ramp = CTA_RAMPS.find((c) => c.key === kw.ctaRamp);
      if (ramp) parts.push(ramp.label);
      return parts.join(" · ");
    }
    case "package": {
      if (isLongForm(piece.format)) {
        const t = kw.titles?.length ?? 0;
        if (t) parts.push(`${t}/10 titles`);
        const c = kw.thumbConcepts?.length ?? 0;
        if (c) parts.push(`${c} thumbnail concept${c === 1 ? "" : "s"}`);
        if (kw.ytTitle?.trim()) parts.push("title chosen");
      } else {
        const n = PACKAGING_SHORT.filter((p) => (kw.packaging ?? []).includes(p.key)).length;
        if (n) parts.push(`${n}/${PACKAGING_SHORT.length} checks`);
        if (kw.series?.trim()) parts.push(`${kw.series.trim()}${kw.seriesNo ? ` #${kw.seriesNo}` : ""}`);
      }
      return parts.join(" · ");
    }
    case "review": {
      if (!piece.publishedAt) return isLongForm(piece.format) ? "Predict your rank now · the rest unlocks after publishing" : "Unlocks after you publish";
      const w = kw.weakBricks?.length ?? 0;
      if (w) parts.push(`${w} weak brick${w === 1 ? "" : "s"}`);
      if (kw.nextFix?.trim()) parts.push("fix noted");
      return parts.join(" · ");
    }
  }
}
