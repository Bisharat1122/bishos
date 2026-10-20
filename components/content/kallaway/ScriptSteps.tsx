"use client";

import { useMemo } from "react";
import { useAction } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Check, Copy, ListPlus, Link2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Chip, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { DOPAMINE_LADDER, HOOK_FORMATS, STORYLOCKS, STRUCTURES, lintScript, type LintIssue } from "@/lib/kallaway";
import { DROP_OFF_PHRASES } from "@/lib/youtube";
import { AiBox } from "../AiBox";
import { toggleIn } from "./useKw";
import { CheckRow, Count, LintList, Note, PickCard, Pill, SubHead, copyText, useAiTask } from "./parts";
import { DL, isLongForm, type StepProps } from "./types";

const LAYOUTS = ["Talking head + captions", "Green screen", "Split screen", "POV vlog", "In-the-world", "Faceless text + B-roll", "Screen recording"];
const formatLabel = (k: string) => HOOK_FORMATS.find((f) => f.key === k)?.label ?? k;

/**
 * Append a structure's blocks to the script as `## ` headings, pre-filling
 * what the workflow already knows (hook, packaging, last line).
 */
function outline(script: string, blocks: string[], fill: { hook: string; packaging: string; lastLine: string }) {
  const body = blocks
    .map((b, i) => {
      const text =
        i === 0 && /hook/i.test(b) && fill.hook
          ? fill.hook
          : /^packaging/i.test(b) && fill.packaging
            ? fill.packaging
            : i === blocks.length - 1 && fill.lastLine
              ? fill.lastLine
              : "";
      return `## ${b}\n${text ? `${text}\n` : ""}`;
    })
    .join("\n");
  return script.trim() ? `${script.trimEnd()}\n\n${body}` : body;
}

// ─────────────────────────────────────────────────────────────────────────
// Step 4 · Structure
// ─────────────────────────────────────────────────────────────────────────

export function StructureStep({ store, piece, script, setScript }: StepProps) {
  const { kw, set } = store;
  const long = isLongForm(piece.format);
  const current = STRUCTURES.find((s) => s.key === kw.structure);
  const ordered = long ? [...STRUCTURES.filter((s) => s.long), ...STRUCTURES.filter((s) => !s.long)] : [...STRUCTURES.filter((s) => !s.long), ...STRUCTURES.filter((s) => s.long)];
  const composed = [kw.lean, kw.interjection, kw.snapback]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join("\n");
  const inScript = !!current && current.blocks.every((b) => script.includes(`## ${b}`));

  return (
    <div className="space-y-5">
      {kw.structure && !current && (
        <Note>
          From your remix: <span className="font-medium text-foreground">&ldquo;{kw.structure}&rdquo;</span>. Pick the closest structure below.
        </Note>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {ordered.map((s) => (
          <PickCard
            key={s.key}
            on={kw.structure === s.key}
            onClick={() => set({ structure: kw.structure === s.key ? "" : s.key })}
            title={s.label}
            sub={s.hint}
            badge={s.long ? <Chip tone={long ? "info" : "muted"}>Long-form</Chip> : undefined}
          />
        ))}
      </div>

      {current && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Blocks</span>
            <ol className="mt-1 space-y-0.5">
              {current.blocks.map((b, i) => (
                <li key={b} className="flex gap-2 text-sm leading-snug">
                  <span className="w-4 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{i + 1}</span>
                  {b}
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Hook formats that fit</span>
            <div className="flex flex-wrap gap-1.5">
              {current.hooks.map((h) => (
                <Pill key={h} on={kw.hookFormat === h} onClick={() => set({ hookFormat: kw.hookFormat === h ? "" : h })}>
                  {formatLabel(h)}
                </Pill>
              ))}
            </div>
            {kw.hookFormat && !current.hooks.includes(kw.hookFormat) && (
              <p className="text-[11px] text-warning">Your hook format ({formatLabel(kw.hookFormat)}) isn&apos;t a usual fit for this structure.</p>
            )}
          </div>
          <button
            type="button"
            disabled={inScript}
            onClick={() => {
              setScript(
                outline(script, current.blocks, {
                  hook: composed,
                  packaging: [kw.ytTitle?.trim() && `Title: ${kw.ytTitle.trim()}`, kw.thumbConcept?.trim() && `Thumbnail: ${kw.thumbConcept.trim()}`]
                    .filter(Boolean)
                    .join("\n"),
                  lastLine: kw.lastLine?.trim() ?? "",
                }),
              );
              toast("Outline added to your script", { tone: "success", sub: "Fill each block in the Script section" });
            }}
            className={buttonVariants({ variant: inScript ? "secondary" : "default", size: "sm" })}
          >
            {inScript ? (
              <>
                <Check className="h-3.5 w-3.5" /> Outline is in your script
              </>
            ) : (
              <>
                <ListPlus className="h-3.5 w-3.5" /> Insert outline into script
              </>
            )}
          </button>
        </div>
      )}

      <div className="space-y-2">
        <SubHead hint="The layout brick: hold it constant while you're learning.">Visual format</SubHead>
        <TextInput value={kw.visualFormat ?? ""} onChange={(e) => set({ visualFormat: e.target.value })} placeholder="e.g. Green screen over the screenshot" />
        <div className="flex flex-wrap gap-1.5">
          {LAYOUTS.map((l) => (
            <Pill key={l} on={kw.visualFormat === l} onClick={() => set({ visualFormat: kw.visualFormat === l ? "" : l })}>
              {l}
            </Pill>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <SubHead hint="The memorable 'last dab': worth sharing, and in shorts it loops back to your first line.">Write your last line first</SubHead>
        <TextArea rows={2} className="min-h-0" value={kw.lastLine ?? ""} onChange={(e) => set({ lastLine: e.target.value })} placeholder="The line they'll repeat to a friend" />
        {kw.lean?.trim() && (
          <p className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
            <Link2 className="mt-px h-3 w-3 shrink-0" aria-hidden />
            <span>
              Your first line: &ldquo;{kw.lean.trim()}&rdquo;. Does the last line loop back to it?
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 5 · Script & retention
// ─────────────────────────────────────────────────────────────────────────

type Chain = FunctionReturnType<typeof api.aiKallaway.questionChain>;

function fmtSec(s: number) {
  const m = Math.floor(s / 60);
  return m ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
}

export function ScriptStep({ store, piece, script }: StepProps) {
  const { kw, set } = store;
  const long = isLongForm(piece.format);
  const questionChain = useAction(api.aiKallaway.questionChain);
  const ai = useAiTask<Chain>();

  const lint = useMemo(() => lintScript(script, { long }), [script, long]);
  const dropOffs = useMemo(() => {
    const t = ` ${script.toLowerCase().replace(/[’]/g, "'")} `;
    return DROP_OFF_PHRASES.filter((p) => t.includes(p));
  }, [script]);
  const issues: LintIssue[] = [
    ...dropOffs.map((p) => ({ kind: "warn" as const, text: `"${p}" is a drop-off phrase: viewers leave here (Paddy Galloway). Cut it.` })),
    ...lint.issues,
  ];

  const locks = kw.storylocks ?? [];
  const ladder = locks.filter((k) => k.startsWith(DL));
  const lockKeys = locks.filter((k) => !k.startsWith(DL));
  const s = lint.stats;
  const detected: Record<string, boolean> = lint.words
    ? {
        contrast: s.contrast > 0,
        loops: s.loops > 0,
        embedded: s.hedges === 0,
        but_therefore: s.andThen === 0 && s.contrast > 0,
        rhythm: s.variety >= 3,
        last_line: !!kw.lastLine?.trim(),
      }
    : { last_line: !!kw.lastLine?.trim() };
  const lineCount = script.split(/\n+/).filter((l) => l.trim() && !/^\s*#/.test(l)).length;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <SubHead hint={long ? "Long-form rules: loop opener every 60–90s, first payoff in 30–60s." : "Short-form rules: loop opener every 20–30s, first value in ~4s."}>
          Live script check
        </SubHead>
        {lint.words ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Chip tone="outline" className="tabular-nums">
                {lint.words} words
              </Chip>
              <Chip tone="outline" className="tabular-nums">
                ≈ {fmtSec(lint.seconds)}
              </Chip>
              <Chip tone={lint.grade > 8 ? "warning" : "outline"} className="tabular-nums">
                grade {lint.grade}
              </Chip>
            </div>
            <LintList issues={issues} />
          </>
        ) : (
          <Note>Write the script in the Script section below. This step checks it live as you type.</Note>
        )}
      </div>

      <div className="space-y-2">
        <SubHead hint="Word-level retention tricks. 'Looks done' = spotted in your script." right={<Count n={lockKeys.length} of={STORYLOCKS.length} />}>
          Storylocks
        </SubHead>
        <div className="space-y-0.5">
          {STORYLOCKS.map((l) => {
            const on = lockKeys.includes(l.key);
            return (
              <CheckRow
                key={l.key}
                checked={on}
                onToggle={() => set((c) => ({ storylocks: toggleIn(c.storylocks, l.key) }))}
                label={l.label}
                hint={l.hint}
                aside={detected[l.key] && !on ? <Chip tone="success">looks done</Chip> : undefined}
              />
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <SubHead hint="Levels 1–4 are the message, 5–6 the messenger." right={<Count n={ladder.length} of={DOPAMINE_LADDER.length} />}>
          Dopamine ladder
        </SubHead>
        <ol className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {DOPAMINE_LADDER.map((d, i) => {
            const key = `${DL}${d.key}`;
            const on = ladder.includes(key);
            return (
              <li key={d.key}>
                <button
                  type="button"
                  aria-pressed={on}
                  title={d.hint}
                  onClick={() => set((c) => ({ storylocks: toggleIn(c.storylocks, key) }))}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-colors",
                    on ? "border-foreground bg-accent/60" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
                      on ? "bg-success text-background" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {on ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block font-medium", on && "text-foreground")}>{d.label}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">{d.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="space-y-2">
        <SubHead hint="Each line answers the last line's question and opens exactly one new one.">One-question chain</SubHead>
        <button
          type="button"
          onClick={() => void ai.run(() => questionChain({ script }))}
          disabled={ai.state?.loading || lineCount < 3}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Link2 className="h-3.5 w-3.5" /> Audit the question chain
        </button>
        {lineCount < 3 && <p className="text-[11px] text-muted-foreground">Needs at least 3 lines of script (one sentence per line works best).</p>}
        {ai.state && (
          <AiBox title="One-question chain" loading={ai.state.loading} error={ai.state.error} onClose={ai.clear} onRetry={() => void ai.run(() => questionChain({ script }))}>
            {ai.state.data && <ChainView data={ai.state.data} />}
          </AiBox>
        )}
      </div>
    </div>
  );
}

function ChainView({ data }: { data: Chain }) {
  const flagged = data.links.filter((l) => l.issue).length;
  return (
    <div className="space-y-3">
      <p className="text-sm leading-snug">
        {data.summary || "Chain audited."}{" "}
        <span className={cn("text-xs font-medium", flagged ? "text-warning" : "text-success")}>
          {flagged ? `${flagged} line${flagged === 1 ? "" : "s"} to fix` : "No broken links"}
        </span>
      </p>
      <ol className="relative space-y-2 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-border">
        {data.links.map((l, i) => (
          <li key={i} className="relative flex gap-2.5">
            <span
              className={cn(
                "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold tabular-nums",
                l.issue ? "border-warning bg-warning-soft text-warning" : "border-border bg-card text-muted-foreground",
              )}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 rounded-lg border border-border bg-card p-2">
              <p className="text-sm leading-snug">{l.line}</p>
              <div className="mt-1 space-y-0.5 text-[11px] leading-snug text-muted-foreground">
                {i > 0 && (
                  <p>
                    <span className="font-medium text-foreground">Answers:</span> {l.answers || "nothing from the line before"}
                  </p>
                )}
                <p>
                  <span className="font-medium text-foreground">Opens:</span> {l.opens || "no question"}
                </p>
              </div>
              {(l.issue || l.opensCount !== 1 || !l.answersPrevious) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {l.opensCount === 0 && <Chip tone="warning">opens 0</Chip>}
                  {l.opensCount >= 2 && <Chip tone="warning">opens 2+</Chip>}
                  {!l.answersPrevious && <Chip tone="warning">chain broken</Chip>}
                  {l.issue && <span className="text-[11px] leading-snug text-warning">{l.issue}</span>}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
      {data.truncated && <p className="text-[11px] text-muted-foreground">Only the first 45 lines were checked.</p>}
      {data.loopOpeners.length > 0 && (
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Loop openers for this script</span>
          <ul className="space-y-1">
            {data.loopOpeners.map((o) => (
              <li key={o} className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
                <span className="min-w-0 flex-1 text-sm italic leading-snug">&ldquo;{o}&rdquo;</span>
                <button type="button" aria-label="Copy loop opener" onClick={() => copyText(o)} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-7 shrink-0")}>
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
