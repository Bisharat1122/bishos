"use client";

import { ReactNode, useState } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Sun, ArrowRight, Star, ChevronDown, ChevronRight } from "lucide-react";
import { CheckCircle, cn } from "@/components/os/kit";
import { TaskTimerButton } from "./TaskTimerButton";
import { TaskMetaChips, type TaskLookups } from "./taskMeta";

export type GtdGroup = {
  key: string;
  title: ReactNode;
  hint?: ReactNode;
  tasks: Doc<"tasks">[];
  /** Collapsed by default (e.g. "Done today"). */
  collapsed?: boolean;
  action?: ReactNode;
  hideWhen?: boolean;
};

/**
 * GTD-style grouped task list (Today / Upcoming / Anytime / Someday /
 * Overdue / Done). Rows are selectable for bulk planning; on desktop each
 * row also has quick "today / tomorrow / Top 3" buttons on hover.
 */
export function TaskGtdList({
  groups,
  lk,
  selected,
  onSelect,
  onOpen,
  onToggleDone,
  onPlan,
  onToggleTop3,
  empty,
}: {
  groups: GtdGroup[];
  lk: TaskLookups;
  selected: Set<string>;
  onSelect: (ids: Id<"tasks">[], on: boolean) => void;
  onOpen: (id: Id<"tasks">) => void;
  onToggleDone: (t: Doc<"tasks">) => void;
  onPlan: (ids: Id<"tasks">[], when: "today" | "tomorrow") => void;
  onToggleTop3: (t: Doc<"tasks">) => void;
  empty: ReactNode;
}) {
  const visible = groups.filter((g) => g.tasks.length > 0);
  if (visible.length === 0) return <>{empty}</>;
  return (
    <div className="space-y-4">
      {visible.map((g) => (
        <Group
          key={g.key}
          g={g}
          lk={lk}
          selected={selected}
          onSelect={onSelect}
          onOpen={onOpen}
          onToggleDone={onToggleDone}
          onPlan={onPlan}
          onToggleTop3={onToggleTop3}
        />
      ))}
    </div>
  );
}

function Group({
  g,
  lk,
  selected,
  onSelect,
  onOpen,
  onToggleDone,
  onPlan,
  onToggleTop3,
}: {
  g: GtdGroup;
  lk: TaskLookups;
  selected: Set<string>;
  onSelect: (ids: Id<"tasks">[], on: boolean) => void;
  onOpen: (id: Id<"tasks">) => void;
  onToggleDone: (t: Doc<"tasks">) => void;
  onPlan: (ids: Id<"tasks">[], when: "today" | "tomorrow") => void;
  onToggleTop3: (t: Doc<"tasks">) => void;
}) {
  const [open, setOpen] = useState(!g.collapsed);
  const ids = g.tasks.map((t) => t._id);
  const allOn = ids.length > 0 && ids.every((id) => selected.has(id));
  return (
    <section className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center gap-2 px-3 pt-3 sm:px-4">
        <input
          type="checkbox"
          checked={allOn}
          onChange={(e) => onSelect(ids, e.target.checked)}
          aria-label="Select all in group"
          className="size-4 shrink-0 accent-[var(--primary)]"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-expanded={open}
          aria-label={open ? "Collapse group" : "Expand group"}
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <h2 className="truncate text-sm font-semibold">{g.title}</h2>
          <span className="rounded bg-muted px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">{g.tasks.length}</span>
        </div>
        {g.action && <div className="shrink-0">{g.action}</div>}
      </div>
      {g.hint && open && <p className="px-3 pt-1 text-xs text-muted-foreground sm:px-4 sm:pl-[4.25rem]">{g.hint}</p>}
      {open ? (
        <ul className="p-1.5 sm:p-2">
          {g.tasks.map((t) => (
            <Row
              key={t._id}
              t={t}
              lk={lk}
              hideWhen={g.hideWhen}
              checked={selected.has(t._id)}
              onCheck={(on) => onSelect([t._id], on)}
              onOpen={() => onOpen(t._id)}
              onToggleDone={() => onToggleDone(t)}
              onPlan={(w) => onPlan([t._id], w)}
              onToggleTop3={() => onToggleTop3(t)}
            />
          ))}
        </ul>
      ) : (
        <div className="h-2" />
      )}
    </section>
  );
}

function Row({
  t,
  lk,
  hideWhen,
  checked,
  onCheck,
  onOpen,
  onToggleDone,
  onPlan,
  onToggleTop3,
}: {
  t: Doc<"tasks">;
  lk: TaskLookups;
  hideWhen?: boolean;
  checked: boolean;
  onCheck: (on: boolean) => void;
  onOpen: () => void;
  onToggleDone: () => void;
  onPlan: (w: "today" | "tomorrow") => void;
  onToggleTop3: () => void;
}) {
  const done = t.status === "done";
  const top = lk.isTop3(t._id);
  const quick = "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
  return (
    <li
      className={cn(
        "group flex items-start gap-2 rounded-lg px-1.5 py-2 transition-colors hover:bg-accent/40 sm:px-2",
        checked && "bg-accent/60",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheck(e.target.checked)}
        aria-label={`Select ${t.title}`}
        className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
      />
      <span className="mt-px">
        <CheckCircle checked={done} onClick={onToggleDone} size="sm" />
      </span>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={onOpen} className={cn("block w-full truncate text-left text-sm font-medium hover:underline", done && "text-muted-foreground line-through")}>
          {t.title}
        </button>
        {/* Chips hold links (goal / project / deal / person) — keep them out of the button. */}
        <div onClick={onOpen} className="cursor-pointer">
          <TaskMetaChips task={t} lk={lk} hideWhen={hideWhen} className="mt-1" />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {!done && (
          <div className="hidden items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 sm:flex">
            {t.plannedFor !== lk.today && (
              <button type="button" title="Do it today" aria-label="Plan for today" onClick={() => onPlan("today")} className={quick}>
                <Sun className="h-3.5 w-3.5" />
              </button>
            )}
            <button type="button" title="Tomorrow" aria-label="Plan for tomorrow" onClick={() => onPlan("tomorrow")} className={quick}>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title={top ? "Remove from today's Top 3" : "Add to today's Top 3"}
              aria-label={top ? "Remove from Top 3" : "Add to Top 3"}
              aria-pressed={top}
              onClick={onToggleTop3}
              className={cn(quick, top && "text-foreground")}
            >
              <Star className={cn("h-3.5 w-3.5", top && "fill-current")} />
            </button>
          </div>
        )}
        {!done && <TaskTimerButton task={t} compact />}
      </div>
    </li>
  );
}
