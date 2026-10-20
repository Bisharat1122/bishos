"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, GitFork, Sparkles } from "lucide-react";
import { Chip, Ring, cn } from "@/components/os/kit";
import { WORKFLOW_STEPS } from "@/lib/kallaway";
import { relDay } from "@/lib/day";
import { BrandBadge, FormatBadge, HubBadge, PlatformIcons, RatioChip, StageChip } from "./bits";
import { STAGE_LABEL, STAGE_ORDER, TEXT_FORMATS, checklistFor, fmtNum, groupOf, isChecked, nextStage, type LitePiece, type Stage } from "./model";

const RECORDING_STAGES = new Set<Stage>(["ready_to_record", "recorded", "editing"]);

/** Board / list card for a content piece. */
export function PieceCard({
  piece,
  pillar,
  today,
  onAdvance,
  onMove,
  compact,
  className,
}: {
  piece: LitePiece;
  pillar?: { name: string; color: string };
  today: string;
  onAdvance?: () => void;
  /** Non-drag stage change (touch / keyboard): tapping the stage chip opens a native picker. */
  onMove?: (to: Stage) => void;
  compact?: boolean;
  className?: string;
}) {
  const next = nextStage(piece.stage, piece.format, piece.isHub);
  const group = groupOf(piece.stage);
  const items = checklistFor(piece.format);
  const done = items.filter((c) => isChecked(c.key, piece)).length;
  const overdue = !piece.publishedAt && piece.scheduledFor && piece.scheduledFor < today;
  const day = piece.publishedAt ? piece.publishedOn : piece.scheduledFor;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-card shadow-card transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-ring/50",
        className,
      )}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: pillar?.color ?? "var(--border)" }} aria-hidden />
      <Link href={`/content/${piece._id}`} draggable={false} className="block p-3 pl-3.5 outline-none focus-visible:bg-accent/40">
        <div className="flex items-center gap-2">
          <FormatBadge format={piece.format} iconOnly={compact} />
          <BrandBadge brand={piece.brand} compact />
          {piece.isHub && <HubBadge />}
          <span className="ml-auto flex items-center gap-1">
            {piece.perf?.ratio != null && <RatioChip ratio={piece.perf.ratio} basis={piece.perf.basis} />}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug">{piece.title}</p>
        {piece.hook && !compact && (
          <p className="mt-1 line-clamp-1 text-xs italic text-muted-foreground">&ldquo;{piece.hook}&rdquo;</p>
        )}
        {pillar && !compact && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full" style={{ background: pillar.color }} aria-hidden />
            <span className="truncate">{pillar.name}</span>
          </p>
        )}
      </Link>
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border/70 px-3 py-2 pl-3.5">
        {onMove ? (
          <span className="relative inline-flex rounded-full focus-within:ring-2 focus-within:ring-ring/40">
            <StageChip stage={piece.stage} />
            <select
              aria-label={`Move “${piece.title}” to another stage`}
              title="Move to another stage"
              value={piece.stage}
              onChange={(e) => onMove(e.target.value as Stage)}
              className="absolute inset-0 w-full cursor-pointer opacity-0"
            >
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s} disabled={TEXT_FORMATS.has(piece.format) && RECORDING_STAGES.has(s) && s !== piece.stage}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </span>
        ) : (
          <StageChip stage={piece.stage} />
        )}
        {day && (
          <Chip tone={overdue ? "warning" : piece.publishedAt ? "success" : "muted"} className="gap-1">
            {piece.publishedAt ? <CheckCircle2 className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
            {relDay(day, today)}
          </Chip>
        )}
        {group === "ready" && (
          <Chip tone={done === items.length ? "success" : "muted"} className="tabular-nums" title="Publish checklist">
            {done}/{items.length}
          </Chip>
        )}
        {piece.kwSteps > 0 && (
          <Chip
            tone={piece.kwSteps >= WORKFLOW_STEPS.length ? "success" : "muted"}
            className="gap-1 tabular-nums"
            title={`Video workflow: ${piece.kwSteps} of ${WORKFLOW_STEPS.length} steps done`}
          >
            <Ring value={(piece.kwSteps / WORKFLOW_STEPS.length) * 100} size={12} stroke={2} tone={piece.kwSteps >= WORKFLOW_STEPS.length ? "success" : "primary"} />
            {piece.kwSteps}/{WORKFLOW_STEPS.length}
          </Chip>
        )}
        {piece.childCount > 0 && (
          <Chip tone="muted" className="gap-1" title={`${piece.childCount} repurposed children`}>
            <GitFork className="h-3 w-3" />
            {piece.childCount}
          </Chip>
        )}
        {piece.swipeCount > 0 && !compact && (
          <Chip tone="muted" className="gap-1" title="Linked inspiration">
            <Sparkles className="h-3 w-3" />
            {piece.swipeCount}
          </Chip>
        )}
        {piece.perf && !compact && (
          <span className="text-[11px] tabular-nums text-muted-foreground" title={`${piece.perf.window} views`}>
            {fmtNum(piece.perf.views)} views
          </span>
        )}
        <span className="ml-auto flex items-center gap-1">
          <PlatformIcons platforms={piece.platforms} max={compact ? 2 : 3} />
          {onAdvance && next && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAdvance();
              }}
              title={`Advance to ${STAGE_LABEL[next]}`}
              aria-label={`Advance to ${STAGE_LABEL[next]}`}
              className="inline-flex h-6 items-center gap-0.5 rounded-md px-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
