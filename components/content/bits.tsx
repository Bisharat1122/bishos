"use client";

import { Layers } from "lucide-react";
import { Chip, Segmented, cn } from "@/components/os/kit";
import {
  BRAND_META,
  GROUPS,
  STAGE_LABEL,
  formatMeta,
  fmtRatio,
  groupIndex,
  platformMeta,
  ratioTone,
  type Brand,
  type BrandFilter,
  type Stage,
} from "./model";

/** Exact stage label with a 6-step progress meter (one dot per board group). */
export function StageChip({ stage, className }: { stage: Stage; className?: string }) {
  const gi = groupIndex(stage);
  const tone = stage === "recycle_due" ? "info" : gi === 4 ? "success" : stage === "archived" ? "muted" : "outline";
  return (
    <Chip tone={tone} className={cn("gap-1.5", className)} title={`Stage: ${STAGE_LABEL[stage]}`}>
      <span className="flex items-center gap-[2px]" aria-hidden>
        {GROUPS.map((g, i) => (
          <span
            key={g.key}
            className={cn("h-1.5 w-1 rounded-full", i <= gi ? "bg-current" : "bg-current opacity-20")}
          />
        ))}
      </span>
      {STAGE_LABEL[stage]}
    </Chip>
  );
}

export function BrandBadge({ brand, compact, className }: { brand: Brand; compact?: boolean; className?: string }) {
  const m = BRAND_META[brand];
  const I = m.icon;
  return (
    <span
      title={`${m.label} brand`}
      className={cn("inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground", className)}
    >
      <I className="h-3 w-3" style={{ color: m.color }} aria-hidden />
      {!compact && m.label}
    </span>
  );
}

export function BrandToggle({
  value,
  onChange,
  size = "sm",
  className,
}: {
  value: BrandFilter;
  onChange: (b: BrandFilter) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <Segmented<BrandFilter>
      size={size}
      className={className}
      value={value}
      onChange={onChange}
      options={[
        { value: "both", label: "Both" },
        { value: "personal", label: "Personal", icon: BRAND_META.personal.icon },
        { value: "company", label: "Company", icon: BRAND_META.company.icon },
      ]}
    />
  );
}

/** Two-way picker for a single piece's brand. */
export function BrandPicker({ value, onChange }: { value: Brand; onChange: (b: Brand) => void }) {
  return (
    <Segmented<Brand>
      size="sm"
      value={value}
      onChange={onChange}
      options={[
        { value: "personal", label: "Personal", icon: BRAND_META.personal.icon },
        { value: "company", label: "Company", icon: BRAND_META.company.icon },
      ]}
    />
  );
}

export function FormatBadge({ format, className, iconOnly }: { format: string; className?: string; iconOnly?: boolean }) {
  const f = formatMeta(format);
  const I = f.icon;
  return (
    <span title={f.label} className={cn("inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground", className)}>
      <I className="h-3.5 w-3.5" aria-hidden />
      {!iconOnly && f.label}
    </span>
  );
}

export function PlatformIcons({ platforms, max = 3, className }: { platforms: string[]; max?: number; className?: string }) {
  if (!platforms.length) return null;
  const shown = platforms.slice(0, max);
  return (
    <span className={cn("inline-flex items-center gap-1 text-muted-foreground", className)}>
      {shown.map((p) => {
        const m = platformMeta(p);
        const I = m.icon;
        return <I key={p} className="h-3.5 w-3.5" aria-label={m.label} />;
      })}
      {platforms.length > max && <span className="text-[10px] tabular-nums">+{platforms.length - max}</span>}
    </span>
  );
}

export function PlatformChip({ platform, className }: { platform?: string; className?: string }) {
  const m = platformMeta(platform);
  const I = m.icon;
  return (
    <Chip tone="outline" className={cn("gap-1", className)}>
      <I className="h-3 w-3" aria-hidden />
      {m.label}
    </Chip>
  );
}

/** "×1.8 your median" (success ≥1.2, warning ≤0.7). */
export function RatioChip({
  ratio,
  basis,
  long,
  className,
}: {
  ratio?: number | null;
  basis?: "format" | "all" | null;
  long?: boolean;
  className?: string;
}) {
  if (ratio == null) return null;
  return (
    <Chip
      tone={ratioTone(ratio)}
      className={cn("tabular-nums", className)}
      title={`Views vs the median of your other ${basis === "format" ? "pieces in this format" : "published pieces"}`}
    >
      {fmtRatio(ratio)}
      {long ? " your median" : ""}
    </Chip>
  );
}

export function HubBadge({ className }: { className?: string }) {
  return (
    <Chip tone="default" className={cn("h-5 gap-1 px-1.5 text-[10px] uppercase tracking-wide", className)} title="Hub: the weekly long piece">
      <Layers className="h-3 w-3" />
      Hub
    </Chip>
  );
}

export function PillarTag({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground", className)}>
      <span className="size-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
      <span className="truncate">{name}</span>
    </span>
  );
}

/** Like kit's Field, but a <div>: for button groups (a <label> would forward clicks to the first button). */
export function FieldGroup({ label, hint, children, className }: { label: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)} role="group">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}
