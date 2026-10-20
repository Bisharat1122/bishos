"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { FunctionReturnType } from "convex/server";
import { Check, ChevronRight, Feather, Flame, Link2, MoreHorizontal, Rocket, Shield, Target } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { AreaDot, Chip, Ring, areaColor } from "@/components/os/kit";
import { cn } from "@/lib/utils";
import { HabitHeatmap } from "./HabitHeatmap";
import { KindMenu, type KindPick } from "./KindMenu";
import { isDone, type HabitKind } from "./util";

export type BoardHabit = FunctionReturnType<typeof api.habits.board>["habits"][number];

/** Consistency ring — never red: success when strong, otherwise neutral primary. */
export function ConsistencyRing({ value, size = 44, isNew, label = true }: { value: number; size?: number; isNew?: boolean; label?: boolean }) {
  const stroke = size >= 60 ? 6 : size >= 40 ? 4 : 3;
  return (
    <Ring value={isNew ? 0 : value} size={size} stroke={stroke} tone={value >= 80 ? "success" : "primary"}>
      {label && (
        <span className={cn("font-semibold tabular-nums leading-none", size >= 60 ? "text-base" : size >= 40 ? "text-[11px]" : "text-[9px]")}>
          {isNew ? "new" : `${value}%`}
        </span>
      )}
    </Ring>
  );
}

export function StreakPill({ streak, className }: { streak: number; className?: string }) {
  return (
    <span
      title="Forgiving streak — skips and misses inside your weekly reserves keep it alive"
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
        streak > 0 ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground",
        className,
      )}
    >
      <Flame className="h-3.5 w-3.5" />
      {streak}
    </span>
  );
}

export function Shields({ left, total, className }: { left: number; total: number; className?: string }) {
  if (total <= 0) return null;
  return (
    <span
      title={`${left} of ${total} reserve shield${total === 1 ? "" : "s"} left this week`}
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${left} of ${total} shields left this week`}
    >
      {Array.from({ length: total }, (_, i) => (
        <Shield key={i} className={cn("h-3.5 w-3.5", i < left ? "fill-info/25 text-info" : "text-muted-foreground/40")} />
      ))}
    </span>
  );
}

function KindGlyph({ kind, className }: { kind: HabitKind | null; className?: string }) {
  if (kind === "min") return <Feather className={className} />;
  if (kind === "stretch") return <Rocket className={className} />;
  if (kind === "skip") return <Shield className={className} />;
  return <Check className={cn(className, !kind && "opacity-0 group-hover:opacity-40")} strokeWidth={3} />;
}

/** Big tap target: tap = done/undo · long-press, right-click or ⋯ = 2-min / stretch / skip. */
export function HabitTodayCard({
  habit,
  onPick,
  busy,
}: {
  habit: BoardHabit;
  onPick: (kind: KindPick, date?: string) => void;
  busy?: boolean;
}) {
  const s = habit.stats;
  const kind = s.kindToday;
  const done = isDone(kind);
  const [menu, setMenu] = useState<DOMRect | null>(null);
  const timer = useRef<number | null>(null);
  const long = useRef(false);
  const btn = useRef<HTMLButtonElement>(null);

  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  const tap = () => {
    if (long.current) {
      long.current = false;
      return;
    }
    onPick(done ? "clear" : "done");
  };

  return (
    <div
      className={cn(
        "group/card relative flex items-start gap-3 rounded-xl border bg-card p-3 shadow-card transition-colors sm:items-center sm:gap-4 sm:p-4",
        done ? "border-success/40" : kind === "skip" ? "border-info/40" : "border-border",
      )}
    >
      <button
        ref={btn}
        type="button"
        disabled={busy}
        aria-label={done ? `Undo ${habit.title}` : `Mark ${habit.title} done (long-press for more)`}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          long.current = false;
          const el = e.currentTarget;
          timer.current = window.setTimeout(() => {
            long.current = true;
            setMenu(el.getBoundingClientRect());
            try {
              navigator.vibrate?.(12);
            } catch {
              /* ignore */
            }
          }, 450);
        }}
        onPointerUp={clear}
        onPointerLeave={clear}
        onPointerCancel={clear}
        onContextMenu={(e) => {
          e.preventDefault();
          clear();
          setMenu(e.currentTarget.getBoundingClientRect());
        }}
        onClick={tap}
        style={{ WebkitTouchCallout: "none" }}
        className={cn(
          "group flex size-14 shrink-0 select-none touch-manipulation items-center justify-center rounded-2xl border-2 transition-all active:scale-95 disabled:opacity-60",
          kind === "done" || kind === "stretch"
            ? "os-pop border-success bg-success text-background"
            : kind === "min"
              ? "os-pop border-success/50 bg-success/45 text-foreground"
              : kind === "skip"
                ? "border-dashed border-info bg-info-soft text-info"
                : "border-muted-foreground/30 text-foreground hover:border-success hover:bg-success-soft",
        )}
      >
        <KindGlyph kind={kind} className="h-6 w-6" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/habits/${habit._id}`} className="min-w-0 hover:underline">
            <p className={cn("text-[15px] font-medium leading-snug", done && "text-muted-foreground")}>{habit.title}</p>
          </Link>
          <button
            type="button"
            aria-label="More log options"
            onClick={(e) => setMenu(e.currentTarget.getBoundingClientRect())}
            className="-mr-1 -mt-1 rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
        {habit.anchor && (
          <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
            <Link2 className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-2">After I {habit.anchor}</span>
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ConsistencyRing value={s.consistency} size={26} isNew={s.possibleDays30 === 0} label={false} />
            <span className="tabular-nums">{s.possibleDays30 === 0 ? "New" : `${s.consistency}%`}</span>
          </span>
          <StreakPill streak={s.streak} />
          <Shields left={s.shieldsLeft} total={s.reserves} />
          {kind === "min" && <Chip tone="success">2-min counts</Chip>}
          {kind === "stretch" && <Chip tone="success">Stretch</Chip>}
          {kind === "skip" && <Chip tone="info">Shield used</Chip>}
          {s.repairedToday && <Chip tone="info">Repaired</Chip>}
          {!done && habit.minVersion && kind !== "skip" && (
            <span className="hidden min-w-0 truncate text-xs text-muted-foreground sm:inline">Bad day? {habit.minVersion}</span>
          )}
        </div>
      </div>

      <KindMenu
        anchor={menu}
        onClose={() => setMenu(null)}
        onPick={(k) => onPick(k)}
        current={kind}
        minVersion={habit.minVersion}
        stretchVersion={habit.stretchVersion}
        shieldsLeft={s.shieldsLeft}
        heading={habit.title}
      />
    </div>
  );
}

/** Overview card (All / Graduated): consistency first, streak second, shields, 12-week heatmap. */
export function HabitOverviewCard({
  habit,
  today,
  actions,
  footer,
}: {
  habit: BoardHabit;
  today: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const s = habit.stats;
  const isNew = s.possibleDays30 === 0;
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <ConsistencyRing value={s.consistency} size={64} isNew={isNew} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/habits/${habit._id}`} className="group min-w-0">
              <p className="flex items-center gap-1 font-medium leading-snug group-hover:underline">
                <span className="truncate">{habit.title}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </p>
            </Link>
            {actions}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isNew ? "Consistency starts with your first log" : `${s.doneDays30} of the last ${s.possibleDays30} days`}
            {" · "}day {s.dayNumber}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StreakPill streak={s.streak} />
            <span className="text-[11px] text-muted-foreground">best {s.bestStreak}</span>
            <Shields left={s.shieldsLeft} total={s.reserves} />
          </div>
        </div>
      </div>
      {habit.anchor && <p className="line-clamp-2 text-xs text-muted-foreground">After I {habit.anchor}, I will {habit.title.toLowerCase()}.</p>}
      <HabitHeatmap records={habit.recent} today={today} weeks={12} start={s.start} cell={11} />
      <div className="flex flex-wrap items-center gap-1.5">
        {habit.areaName && (
          <Chip tone="outline">
            <AreaDot color={areaColor({ color: habit.areaColor ?? undefined, order: habit.areaOrder })} />
            {habit.areaName}
          </Chip>
        )}
        {habit.goalTitle && (
          <Chip tone="sprint" title="Counts toward your 12-week execution score">
            <Target />
            {habit.goalTitle}
          </Chip>
        )}
        <Chip tone="muted">{s.target === 7 ? "Daily" : `${s.target}× / week`}</Chip>
        {footer}
      </div>
    </div>
  );
}
