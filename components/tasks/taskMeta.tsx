"use client";

import Link from "next/link";
import { Doc } from "@/convex/_generated/dataModel";
import {
  Star, CalendarClock, CalendarCheck, Clock, Target, FolderKanban, Handshake, User, Network,
  RotateCcw, BatteryFull, BatteryMedium, BatteryLow, Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { relDay, fmtMin, dateOf } from "@/lib/day";

/**
 * Life OS task metadata — one place that renders the chips every task view
 * shares: Top 3, "when" (≠ deadline), deadline, estimate, energy, goal,
 * project, deal, person, delegate and the stale flag.
 */

export type TaskLookups = {
  today: string;
  goalTitle: (id?: string | null) => string | undefined;
  projectTitle: (id?: string | null) => string | undefined;
  dealTitle: (id?: string | null) => string | undefined;
  personName: (id?: string | null) => string | undefined;
  areaName: (id?: string | null) => string | undefined;
  isTop3: (id: string) => boolean;
};

const base = "inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-4 [&>svg]:size-3 [&>svg]:shrink-0";
const tone = {
  muted: "bg-muted text-muted-foreground",
  outline: "border border-border text-muted-foreground",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  primary: "bg-primary text-primary-foreground",
  sprint: "bg-sprint/15 text-sprint",
} as const;

function Pill({ t = "muted", children, title, className }: { t?: keyof typeof tone; children: React.ReactNode; title?: string; className?: string }) {
  return (
    <span title={title} className={cn(base, tone[t], className)}>
      {children}
    </span>
  );
}

function LinkPill({ href, t = "outline", children, title }: { href: string; t?: keyof typeof tone; children: React.ReactNode; title?: string }) {
  return (
    <Link
      href={href}
      title={title}
      onClick={(e) => e.stopPropagation()}
      className={cn(base, tone[t], "transition-colors hover:border-ring hover:text-foreground")}
    >
      {children}
    </Link>
  );
}

/** Deadline label + whether it needs attention (never red — warning at most). */
export function deadlineMeta(dueDate: number, done: boolean, today: string) {
  const d0 = dateOf(today).getTime();
  const dd = new Date(dueDate);
  dd.setHours(0, 0, 0, 0);
  const diff = Math.round((dd.getTime() - d0) / 86400000);
  const date = new Date(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (done) return { label: date, warn: false };
  if (diff < 0) return { label: `Was due ${date}`, warn: true };
  if (diff === 0) return { label: "Due today", warn: true };
  if (diff === 1) return { label: "Due tomorrow", warn: true };
  if (diff <= 6) return { label: `Due ${new Date(dueDate).toLocaleDateString(undefined, { weekday: "short" })}`, warn: false };
  return { label: `Due ${date}`, warn: false };
}

export function WhenChip({ task, today }: { task: Doc<"tasks">; today: string }) {
  const done = task.status === "done";
  if (task.someday)
    return (
      <Pill title="Someday / maybe">
        <Moon /> Someday
      </Pill>
    );
  if (!task.plannedFor) return null;
  const late = !done && task.plannedFor < today;
  return (
    <Pill t={late ? "warning" : task.plannedFor === today ? "info" : "muted"} title={`When: ${task.plannedFor}`}>
      <CalendarCheck /> {late ? `From ${relDay(task.plannedFor, today).toLowerCase()}` : relDay(task.plannedFor, today)}
    </Pill>
  );
}

const ENERGY = {
  high: { label: "Deep", icon: BatteryFull, title: "High energy — deep work" },
  med: { label: "Medium", icon: BatteryMedium, title: "Medium energy" },
  low: { label: "Light", icon: BatteryLow, title: "Low energy — admin" },
} as const;

export function TaskMetaChips({
  task,
  lk,
  compact,
  hideProject,
  hideWhen,
  className,
}: {
  task: Doc<"tasks">;
  lk: TaskLookups;
  compact?: boolean;
  hideProject?: boolean;
  hideWhen?: boolean;
  className?: string;
}) {
  const done = task.status === "done";
  const top = lk.isTop3(task._id);
  const due = task.dueDate ? deadlineMeta(task.dueDate, done, lk.today) : null;
  const goal = lk.goalTitle(task.goalId);
  const project = !hideProject && task.projectId ? lk.projectTitle(task.projectId) : undefined;
  const deal = lk.dealTitle(task.dealId);
  const person = lk.personName(task.personId);
  const stale = !done && (task.deferCount ?? 0) >= 3;
  const E = task.energy ? ENERGY[task.energy] : null;
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-1", className)}>
      {top && (
        <Pill t="primary" title="In today's Top 3">
          <Star className="fill-current" /> Top 3
        </Pill>
      )}
      {!hideWhen && <WhenChip task={task} today={lk.today} />}
      {due && (
        <Pill t={due.warn ? "warning" : "muted"} title="Deadline">
          <CalendarClock /> {due.label}
        </Pill>
      )}
      {task.estimateMin != null && (
        <Pill title="Estimate">
          <Clock /> {fmtMin(task.estimateMin)}
        </Pill>
      )}
      {E && !compact && (
        <Pill title={E.title}>
          <E.icon /> {E.label}
        </Pill>
      )}
      {goal && !compact && (
        <LinkPill href={`/goals/${task.goalId}`} title={`Moves goal: ${goal}`}>
          <Target /> <span className="max-w-[9rem] truncate">{goal}</span>
        </LinkPill>
      )}
      {project && (
        <LinkPill href={`/projects/${task.projectId}`} t="sprint" title={`Project: ${project}`}>
          <FolderKanban /> <span className="max-w-[8rem] truncate">{project}</span>
        </LinkPill>
      )}
      {deal && !compact && (
        <LinkPill href={`/pipeline?deal=${task.dealId}`} title={`Deal: ${deal}`}>
          <Handshake /> <span className="max-w-[8rem] truncate">{deal}</span>
        </LinkPill>
      )}
      {person && !compact && (
        <LinkPill href={`/people/${task.personId}`} title={`Person: ${person}`}>
          <User /> <span className="max-w-[7rem] truncate">{person}</span>
        </LinkPill>
      )}
      {task.delegate && !done && (
        <LinkPill href="/delegation" t="info" title="Should not be me — record it next time (Delegation)">
          <Network /> Delegate
        </LinkPill>
      )}
      {stale && (
        <Pill t="warning" title="Moved 3+ times — keep, schedule or drop it">
          <RotateCcw /> Moved {task.deferCount}×
        </Pill>
      )}
    </div>
  );
}
