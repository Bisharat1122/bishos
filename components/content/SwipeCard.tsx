"use client";

import { useState } from "react";
import { BookmarkPlus, ChevronDown, ExternalLink, Lock, PenLine, Rocket, Shuffle, Trash2 } from "lucide-react";
import { Chip, buttonVariants, cn } from "@/components/os/kit";
import { ARCHETYPES, BEGINNER_HOLD, BRICKS } from "@/lib/kallaway";
import { FormatBadge, PillarTag } from "./bits";
import { hookLabel, platformMeta, type Swipe } from "./model";

/** Short brick labels for the 7-segment preview. */
const BRICK_SHORT: Record<string, string> = {
  topic: "Topic",
  angle: "Angle",
  hookStructure: "Hook",
  storyStructure: "Story",
  visualFormat: "Visual",
  keyVisuals: "Key vis.",
  audio: "Audio",
};

export function SwipeCard({
  swipe,
  pillar,
  onUse,
  onRemix,
  onSaveHook,
  onEdit,
  onDelete,
}: {
  swipe: Swipe;
  pillar?: { name: string; color: string };
  onUse: () => void;
  /** Hold-and-remix the 7 LEGO bricks into a new piece. */
  onRemix?: () => void;
  onSaveHook: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const bricks = (swipe.bricks ?? {}) as Record<string, string | undefined>;
  const filledBricks = BRICKS.filter((b) => bricks[b.key]?.trim());
  const held = new Set<string>(swipe.hold?.length ? swipe.hold : BEGINNER_HOLD);
  const archetype = ARCHETYPES.find((a) => a.key === swipe.archetype);
  const out = swipe.outlier;
  const P = platformMeta(swipe.platform);
  const PI = P.icon;
  const hook = swipe.hookText || swipe.hookSpoken || swipe.hookOnScreen || swipe.title;
  const hasLayers = swipe.hookVisual || swipe.hookSpoken || swipe.hookOnScreen || swipe.structure || swipe.transcript || filledBricks.length > 0;

  return (
    <article className="group flex flex-col rounded-xl border border-border bg-card shadow-card transition-[border-color,transform] hover:-translate-y-px hover:border-ring/50">
      <header className="flex items-center gap-2 px-4 pt-4">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
          <PI className="h-3.5 w-3.5" aria-label={P.label} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{swipe.creator ? `@${swipe.creator.replace(/^@/, "")}` : P.label}</p>
          {swipe.views != null && (
            <p className="text-[10px] tabular-nums text-muted-foreground">
              {Intl.NumberFormat(undefined, { notation: "compact" }).format(swipe.views)} views
            </p>
          )}
        </div>
        {out != null && (
          <div
            className={cn(
              "flex shrink-0 flex-col items-end rounded-lg px-2 py-1 leading-none",
              out >= 5 ? "bg-success-soft text-success" : out >= 2 ? "bg-info-soft text-info" : "bg-muted text-muted-foreground",
            )}
            title={`Views ÷ the creator's usual views${out >= 5 ? ". At or above the 5× research bar." : ". Research bar is 5×."}`}
          >
            <span className="text-lg font-semibold tabular-nums">{out}×</span>
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide">outlier</span>
          </div>
        )}
      </header>

      <div className="flex-1 px-4 pt-3">
        {hook ? (
          <p className="text-[15px] font-medium leading-snug">&ldquo;{hook}&rdquo;</p>
        ) : (
          <p className="text-sm text-muted-foreground">No hook text yet.</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {swipe.hookType && <Chip tone="outline">{hookLabel(swipe.hookType)}</Chip>}
          {archetype && (
            <Chip tone="outline" title={archetype.contrast}>
              {archetype.label}
            </Chip>
          )}
          {swipe.format && <FormatBadge format={swipe.format} />}
          {pillar && <PillarTag name={pillar.name} color={pillar.color} />}
        </div>

        <div className="mt-3 space-y-2 rounded-lg bg-muted/40 p-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Why it worked</p>
            <p className="mt-0.5 text-sm leading-snug">{swipe.whyItWorked}</p>
          </div>
          {swipe.whatToSteal && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Steal this</p>
              <p className="mt-0.5 text-sm leading-snug">{swipe.whatToSteal}</p>
            </div>
          )}
        </div>

        {/* 7 LEGO bricks preview: filled = broken down, lock = held when remixing */}
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">LEGO bricks</p>
            <span className={cn("text-[10px] tabular-nums", filledBricks.length === 7 ? "text-success" : "text-muted-foreground")}>{filledBricks.length}/7</span>
          </div>
          <div className="mt-1 grid grid-cols-7 gap-0.5" aria-label={`${filledBricks.length} of 7 bricks broken down`}>
            {BRICKS.map((b) => {
              const has = !!bricks[b.key]?.trim();
              return (
                <span
                  key={b.key}
                  title={has ? `${b.label}: ${bricks[b.key]}` : `${b.label}: not broken down`}
                  className={cn(
                    "flex h-5 items-center justify-center gap-0.5 truncate rounded px-0.5 text-[8.5px] font-medium",
                    has ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                  )}
                >
                  {held.has(b.key) && <Lock className="h-2 w-2 shrink-0" aria-hidden />}
                  <span className="truncate">{BRICK_SHORT[b.key]}</span>
                </span>
              );
            })}
          </div>
          {filledBricks.length === 0 && <p className="mt-1 text-[10px] text-muted-foreground">Edit to break it into bricks, or use AI analyse.</p>}
        </div>

        {hasLayers && (
          <button
            onClick={() => setOpen(!open)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            aria-expanded={open}
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
            Hook layers, bricks &amp; structure
          </button>
        )}
        {open && (
          <dl className="os-rise mt-2 space-y-1.5 text-xs">
            {[
              ["Seen", swipe.hookVisual],
              ["Said", swipe.hookSpoken],
              ["On screen", swipe.hookOnScreen],
              ["Structure", swipe.structure],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="grid grid-cols-[72px_1fr] gap-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            {filledBricks.length > 0 && (
              <div className="space-y-1.5 border-t border-border pt-1.5">
                {filledBricks.map((b) => (
                  <div key={b.key} className="grid grid-cols-[72px_1fr] gap-2">
                    <dt className="flex items-center gap-1 text-muted-foreground">
                      {held.has(b.key) && <Lock className="h-2.5 w-2.5" aria-label="Held" />}
                      {b.label}
                    </dt>
                    <dd>{bricks[b.key]}</dd>
                  </div>
                ))}
              </div>
            )}
            {swipe.transcript && (
              <details className="pt-1">
                <summary className="cursor-pointer text-muted-foreground">Transcript</summary>
                <p className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap text-muted-foreground scrollbar-thin">{swipe.transcript}</p>
              </details>
            )}
          </dl>
        )}
      </div>

      <footer className="mt-3 flex flex-wrap items-center gap-1 border-t border-border px-3 py-2">
        {onRemix && (
          <button
            type="button"
            onClick={onRemix}
            title="Hold the best bricks, remix the rest into a new piece"
            className={cn(buttonVariants({ size: "sm" }), "h-7 text-xs")}
          >
            <Shuffle className="h-3.5 w-3.5" /> Remix
          </button>
        )}
        <button
          type="button"
          onClick={onUse}
          className={cn(buttonVariants({ size: "sm", variant: onRemix ? "outline" : "default" }), "h-7 text-xs")}
        >
          <Rocket className="h-3.5 w-3.5" /> {onRemix ? "Use" : "Use in a new piece"}
        </button>
        {/* Same fields the server reads (title alone isn't a hook → it would error). */}
        {(swipe.hookText || swipe.hookSpoken || swipe.hookOnScreen) && (
          <button onClick={onSaveHook} title="Save hook to library" aria-label="Save hook to library" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
            <BookmarkPlus className="h-3.5 w-3.5" />
          </button>
        )}
        {swipe.url && (
          <a href={swipe.url} target="_blank" rel="noreferrer" title="Open original" aria-label="Open original" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <span className="ml-auto flex items-center gap-1">
          {(swipe.used ?? 0) > 0 && <span className="text-[10px] tabular-nums text-muted-foreground">used {swipe.used}×</span>}
          <button onClick={onEdit} aria-label="Edit" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
            <PenLine className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} aria-label="Delete" className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "hover:text-danger")}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      </footer>
    </article>
  );
}
