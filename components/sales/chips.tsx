"use client";

import { Chip, cn } from "@/components/os/kit";
import { HEALTH, RELATION_TONE, STAGE_META, agoLabel, relationLabel, type Health, type Relation, type Stage } from "./meta";

/** Reconnect status from cadenceInfo(): overdue / due / soon / ok / none. */
export function CadenceChip({
  status,
  dueIn,
  className,
}: {
  status: "none" | "ok" | "soon" | "due" | "overdue";
  dueIn: number | null;
  className?: string;
}) {
  if (status === "none") return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  if (status === "overdue") return <Chip tone="warning" className={className}>Reconnect · {-(dueIn ?? 0)}d over</Chip>;
  if (status === "due") return <Chip tone="info" className={className}>Reconnect today</Chip>;
  if (status === "soon") return <Chip tone="muted" className={className}>In {dueIn}d</Chip>;
  return <Chip tone="success" className={className}>On track</Chip>;
}

export function LastContact({ daysSince, className }: { daysSince: number | null; className?: string }) {
  return <span className={cn("text-xs tabular-nums text-muted-foreground", className)}>{agoLabel(daysSince)}</span>;
}

export function RelationChip({ relation }: { relation: Relation }) {
  return <Chip tone={RELATION_TONE[relation] ?? "muted"}>{relationLabel(relation)}</Chip>;
}

export function StageChip({ stage, className }: { stage: Stage; className?: string }) {
  const m = STAGE_META[stage];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium", className)}>
      <span className="size-2 shrink-0 rounded-full" style={{ background: m.dot }} />
      {m.short}
    </span>
  );
}

export function HealthPicker({ value, onChange, size = "sm" }: { value?: Health | null; onChange: (h: Health) => void; size?: "sm" | "md" }) {
  return (
    <div role="radiogroup" aria-label="Customer health" className="inline-flex items-center gap-1 rounded-lg bg-muted p-0.5">
      {HEALTH.map((h) => {
        const active = value === h.value;
        return (
          <button
            key={h.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={h.label}
            onClick={(e) => {
              e.stopPropagation();
              onChange(h.value);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md font-medium transition-colors",
              size === "sm" ? "h-6 px-2 text-[11px]" : "h-7 px-2.5 text-xs",
              active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="size-2 rounded-full" style={{ background: h.dot, opacity: active ? 1 : 0.55 }} />
            {h.label}
          </button>
        );
      })}
    </div>
  );
}
