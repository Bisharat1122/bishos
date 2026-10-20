"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  Clock,
  Flame,
  ListChecks,
  Moon,
  Pencil,
  Play,
  Plus,
  Power,
  RotateCcw,
  Sunrise,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Chip, Dialog, Field, Ring, Select, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { celebrate, reward, toast } from "@/components/os/celebrate";
import { fmtYmd } from "@/lib/day";
import { MiniMenu } from "./MiniMenu";
import { errText } from "./util";

export type RoutineItem = FunctionReturnType<typeof api.routines.list>[number];
type Kind = RoutineItem["kind"];
type Step = { id: string; text: string; minutes?: number; minimum?: boolean };

export const KIND_META: Record<Kind, { label: string; icon: LucideIcon; cap?: number }> = {
  morning: { label: "Morning", icon: Sunrise },
  startup: { label: "Work start-up", icon: Play, cap: 15 },
  shutdown: { label: "Shutdown", icon: Power, cap: 10 },
  evening: { label: "Evening", icon: Moon },
  weekly: { label: "Weekly", icon: CalendarDays },
  custom: { label: "Custom", icon: ListChecks },
};

/** Step toggling with an optimistic update on routines.list({today}). */
export function useToggleStep(today: string) {
  return useMutation(api.routines.toggleStep).withOptimisticUpdate((store, { id, date, stepId }) => {
    if (date !== today) return;
    const cur = store.getQuery(api.routines.list, { today });
    if (!cur) return;
    store.setQuery(
      api.routines.list,
      { today },
      cur.map((r) => {
        if (r._id !== id) return r;
        const ids = r.run?.doneStepIds ?? [];
        const next = ids.includes(stepId) ? ids.filter((s) => s !== stepId) : [...ids, stepId];
        return {
          ...r,
          run: r.run ? { ...r.run, doneStepIds: next } : { _id: "optimistic" as never, doneStepIds: next, completed: false, minimum: false, durationSec: null },
          doneSteps: (r.steps as Step[]).filter((s) => next.includes(s.id)).length,
        };
      }),
    );
  });
}

function useCompletion(routine: RoutineItem, date: string) {
  const complete = useMutation(api.routines.complete);
  const uncomplete = useMutation(api.routines.uncomplete);
  return {
    async finish(minimum: boolean, durationSec?: number) {
      try {
        const res = await complete({ id: routine._id, date, minimum, durationSec });
        const xp = res?.xp || undefined;
        if (minimum) {
          reward(`${routine.name} · minimum version done`, xp);
          celebrate(0.6);
        } else reward(`${routine.name} complete`, xp, true);
        return true;
      } catch (e) {
        toast(errText(e), { tone: "warning" });
        return false;
      }
    },
    async undo() {
      try {
        await uncomplete({ id: routine._id, date });
      } catch (e) {
        toast(errText(e), { tone: "warning" });
      }
    },
  };
}

const fmtClock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** 30-day dots: full = solid, minimum = lighter, partial = ring, none = muted. */
export function RunDots({ history }: { history: RoutineItem["history"] }) {
  return (
    <div className="flex flex-wrap gap-[3px]" aria-label="Last 30 days">
      {history.map((h) => (
        <span
          key={h.date}
          title={`${fmtYmd(h.date)} · ${h.status === "full" ? "complete" : h.status === "min" ? "minimum" : h.status === "partial" ? "started" : h.beforeStart ? "before start" : "—"}`}
          className={cn(
            "size-2.5 rounded-full",
            h.status === "full" && "bg-success",
            h.status === "min" && "bg-success/45",
            h.status === "partial" && "border-[1.5px] border-success/70",
            !h.status && (h.beforeStart ? "bg-muted/40" : "bg-muted"),
          )}
        />
      ))}
    </div>
  );
}

export function RoutineCard({
  routine,
  today,
  onRun,
  onEdit,
  onMove,
  onToggleActive,
  onDelete,
}: {
  routine: RoutineItem;
  today: string;
  onRun: () => void;
  onEdit: () => void;
  onMove: (dir: "up" | "down") => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const meta = KIND_META[routine.kind];
  const I = meta.icon;
  const toggle = useToggleStep(today);
  const { finish, undo } = useCompletion(routine, today);
  const resetDay = useMutation(api.routines.resetDay);
  const steps = routine.steps as Step[];
  const doneIds = routine.run?.doneStepIds ?? [];
  const completed = !!routine.run?.completed;
  const pct = steps.length ? (routine.doneSteps / steps.length) * 100 : 0;

  return (
    <div className={cn("flex min-w-0 flex-col rounded-xl border bg-card shadow-card", completed ? "border-success/40" : "border-border", !routine.active && "opacity-60")}>
      <div className="flex items-start gap-3 p-4 pb-3">
        <Ring value={completed ? 100 : pct} size={44} stroke={4} tone={completed ? "success" : "primary"}>
          {completed ? <Check className="h-4 w-4 text-success" strokeWidth={3} /> : <I className="h-4 w-4" />}
        </Ring>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold leading-snug">{routine.name}</p>
              <p className="text-xs text-muted-foreground">
                {meta.label} · {routine.plannedMin ? `≤${routine.plannedMin} min` : `${steps.length} steps`}
                {routine.minimumIds.length > 0 && ` · min ${routine.minimumIds.length} step${routine.minimumIds.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <MiniMenu
              items={[
                { label: "Edit routine", icon: Pencil, onClick: onEdit },
                { label: "Move up", icon: ArrowUp, onClick: () => onMove("up") },
                { label: "Move down", icon: ArrowDown, onClick: () => onMove("down") },
                { label: routine.active ? "Pause routine" : "Activate routine", icon: routine.active ? X : Play, onClick: onToggleActive },
                (routine.run?.doneStepIds.length ?? 0) > 0 && !completed && { label: "Reset today", icon: RotateCcw, onClick: () => void resetDay({ id: routine._id, date: today }).catch((e) => toast(errText(e), { tone: "warning" })) },
                { label: "Delete", icon: Trash2, danger: true, onClick: onDelete },
              ]}
            />
          </div>
          {routine.anchor && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{routine.anchor}</p>}
        </div>
      </div>

      <ul className="space-y-0.5 px-2">
        {steps.map((s) => {
          const on = doneIds.includes(s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => void toggle({ id: routine._id, date: today, stepId: s.id })}
                className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    on ? "os-pop border-success bg-success text-background" : "border-muted-foreground/40",
                  )}
                >
                  {on && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className={cn("min-w-0 flex-1 leading-snug", on && "text-muted-foreground line-through decoration-muted-foreground/40")}>{s.text}</span>
                {s.minimum && <Chip tone="muted" className="px-1.5 text-[10px]">min</Chip>}
                {s.minutes ? <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{s.minutes}m</span> : null}
              </button>
            </li>
          );
        })}
        {steps.length === 0 && <li className="px-2 py-2 text-sm text-muted-foreground">No steps yet — edit to add 3–8 short steps.</li>}
      </ul>

      <div className="mt-auto space-y-3 p-4 pt-3">
        <div className="flex flex-wrap gap-2">
          {completed ? (
            <>
              <Chip tone="success" className="h-8 px-3 text-sm">
                <Check /> {routine.run?.minimum ? "Minimum done" : "Done today"}
                {routine.run?.durationSec ? ` · ${fmtClock(routine.run.durationSec)}` : ""}
              </Chip>
              <button onClick={() => void undo()} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Undo
              </button>
            </>
          ) : (
            <>
              <button onClick={onRun} disabled={!steps.length} className={buttonVariants({ size: "sm" })}>
                <Play /> Run now
              </button>
              <button onClick={() => void finish(false)} disabled={!steps.length} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Complete
              </button>
              {routine.minimumIds.length > 0 && (
                <button onClick={() => void finish(true)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  Minimum
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <RunDots history={routine.history} />
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <span className="tabular-nums text-muted-foreground" title="Consistency, last 30 days">
              {routine.consistency}%
            </span>
            <span
              className={cn("inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold tabular-nums", routine.streak ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground")}
              title={`Streak (${routine.unit}) — two reserve days a week keep it alive`}
            >
              <Flame className="h-3 w-3" />
              {routine.streak}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Focused full-screen checklist with a timer (elapsed vs planned minutes). */
export function RoutineRunner({ routine, date, onClose }: { routine: RoutineItem; date: string; onClose: () => void }) {
  const toggle = useToggleStep(date);
  const { finish } = useCompletion(routine, date);
  const steps = routine.steps as Step[];
  const doneIds = routine.run?.doneStepIds ?? [];
  const key = `bishos-run-${routine._id}-${date}`;
  const [startedAt] = useState(() => {
    try {
      const v = Number(window.sessionStorage.getItem(key));
      if (v && Date.now() - v < 6 * 3600_000) return v;
      const now = Date.now();
      window.sessionStorage.setItem(key, String(now));
      return now;
    } catch {
      return Date.now();
    }
  });
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearInterval(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const elapsed = (now - startedAt) / 1000;
  const planned = routine.plannedMin * 60;
  const over = planned > 0 && elapsed > planned;
  const allDone = steps.length > 0 && steps.every((s) => doneIds.includes(s.id));
  const minDone = routine.minimumIds.length > 0 && routine.minimumIds.every((id) => doneIds.includes(id));
  const nextIdx = steps.findIndex((s) => !doneIds.includes(s.id));

  async function done(minimum: boolean) {
    setBusy(true);
    const ok = await finish(minimum, elapsed);
    setBusy(false);
    if (ok) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      onClose();
    }
  }

  const meta = KIND_META[routine.kind];
  return (
    <div role="dialog" aria-modal="true" aria-label={`Run ${routine.name}`} className="fade-in fixed inset-0 z-[60] flex flex-col bg-background text-foreground">
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{routine.name}</p>
          <p className="truncate text-xs text-muted-foreground">{meta.label} · {fmtYmd(date)}</p>
        </div>
        <button onClick={onClose} aria-label="Close run mode" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-8 sm:py-10">
          <Ring value={planned ? Math.min(100, (elapsed / planned) * 100) : 0} size={150} stroke={8} tone={allDone ? "success" : over ? "info" : "primary"}>
            <span className="text-center">
              <span className="block text-3xl font-semibold tabular-nums tracking-tight">{fmtClock(elapsed)}</span>
              <span className="block text-xs text-muted-foreground">
                {planned ? (over ? `+${fmtClock(elapsed - planned)} · that's fine` : `of ${routine.plannedMin} min`) : "elapsed"}
              </span>
            </span>
          </Ring>
          {routine.anchor && <p className="mt-4 text-center text-sm text-muted-foreground">{routine.anchor}</p>}

          <ul className="mt-8 w-full space-y-2">
            {steps.map((s, i) => {
              const on = doneIds.includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => void toggle({ id: routine._id, date, stepId: s.id })}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all active:scale-[0.99]",
                      on ? "border-success/40 bg-success-soft" : i === nextIdx ? "border-ring bg-card shadow-card" : "border-border bg-card",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        on ? "os-pop border-success bg-success text-background" : "border-muted-foreground/40",
                      )}
                    >
                      {on ? <Check className="h-4 w-4" strokeWidth={3} /> : <span className="text-xs font-medium tabular-nums text-muted-foreground">{i + 1}</span>}
                    </span>
                    <span className={cn("min-w-0 flex-1 text-[15px] leading-snug", on && "text-muted-foreground")}>{s.text}</span>
                    {s.minimum && <Chip tone="muted">min</Chip>}
                    {s.minutes ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {s.minutes}m
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-2 sm:flex-row">
          {routine.minimumIds.length > 0 && (
            <button disabled={busy} onClick={() => void done(true)} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "flex-1")}>
              Complete minimum{minDone ? " ✓" : ` (${routine.minimumIds.length} steps)`}
            </button>
          )}
          <button disabled={busy} onClick={() => void done(false)} className={cn(buttonVariants({ size: "lg" }), "flex-1", allDone && "os-shine")}>
            <Check /> Complete
          </button>
        </div>
      </div>
    </div>
  );
}

/** Create / edit a routine with its steps (minutes + minimum flag). */
export function RoutineEditor({ open, routine, onClose }: { open: boolean; routine: RoutineItem | null; onClose: () => void }) {
  const create = useMutation(api.routines.create);
  const update = useMutation(api.routines.update);
  const remove = useMutation(api.routines.remove);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("custom");
  const [anchor, setAnchor] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [draft, setDraft] = useState("");
  const [armDelete, setArmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(routine?.name ?? "");
    setKind(routine?.kind ?? "custom");
    setAnchor(routine?.anchor ?? "");
    setSteps(((routine?.steps as Step[]) ?? []).map((s) => ({ ...s })));
    setDraft("");
    setArmDelete(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, routine?._id]);

  const total = useMemo(() => steps.reduce((s, x) => s + (x.minutes ?? 0), 0), [steps]);
  const cap = KIND_META[kind].cap;
  const set = (i: number, patch: Partial<Step>) => setSteps((xs) => xs.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const moveStep = (i: number, d: -1 | 1) =>
    setSteps((xs) => {
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const n = [...xs];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const all = draft.trim() ? [...steps, { id: "", text: draft.trim() }] : steps;
    const clean = all.map((s) => ({ id: s.id, text: s.text, minutes: s.minutes || undefined, minimum: s.minimum || undefined }));
    try {
      if (routine) await update({ id: routine._id, name, kind, anchor: anchor.trim() || null, steps: clean });
      else await create({ name, kind, anchor: anchor.trim() || undefined, steps: clean });
      toast(routine ? "Routine saved" : "Routine created", { tone: "success" });
      onClose();
    } catch (e) {
      setError(errText(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={routine ? "Edit routine" : "New routine"} size="lg">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <TextInput autoFocus={!routine} value={name} onChange={(e) => setName(e.target.value)} placeholder="Gym prep" maxLength={60} />
          </Field>
          <Field label="Kind">
            <Select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
              {(Object.keys(KIND_META) as Kind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_META[k].label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Anchor (one trigger)" hint="A routine is a short checklist set off by one cue, tracked as one unit.">
          <TextInput value={anchor} onChange={(e) => setAnchor(e.target.value)} placeholder="When I sit down at my desk" maxLength={120} />
        </Field>

        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Steps · keep it to 3–8 · mark the minimum version</span>
            <span className={cn("text-xs tabular-nums", cap && total > cap ? "text-warning" : "text-muted-foreground")}>
              {total} min{cap ? ` · aim ≤${cap}` : ""}
            </span>
          </div>
          <ul className="space-y-1.5">
            {steps.map((s, i) => (
              <li key={s.id || i} className="flex items-center gap-1.5">
                <span className="w-4 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <TextInput value={s.text} onChange={(e) => set(i, { text: e.target.value })} className="h-8 min-w-0 flex-1" maxLength={140} />
                <input
                  type="number"
                  min={0}
                  max={240}
                  value={s.minutes ?? ""}
                  onChange={(e) => set(i, { minutes: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="min"
                  aria-label="Minutes"
                  className="h-8 w-14 shrink-0 rounded-md border border-input bg-card px-2 text-sm tabular-nums shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                />
                <button
                  type="button"
                  onClick={() => set(i, { minimum: !s.minimum })}
                  title="Part of the minimum version"
                  className={cn(
                    "h-8 shrink-0 rounded-md border px-2 text-xs font-medium transition-colors",
                    s.minimum ? "border-success/50 bg-success-soft text-success" : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  min
                </button>
                <div className="hidden shrink-0 sm:flex">
                  <button type="button" onClick={() => moveStep(i, -1)} aria-label="Move up" className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => moveStep(i, 1)} aria-label="Move down" className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button type="button" onClick={() => setSteps((xs) => xs.filter((_, j) => j !== i))} aria-label="Remove step" className="shrink-0 rounded p-1 text-muted-foreground hover:text-danger">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              setSteps((xs) => [...xs, { id: "", text: draft.trim() }]);
              setDraft("");
            }}
          >
            <TextInput value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a step…" className="h-8" maxLength={140} />
            <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Plus /> Add
            </button>
          </form>
        </div>

        {error && <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">{error}</p>}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center">
          {routine && (
            <button
              type="button"
              onClick={async () => {
                if (!armDelete) return setArmDelete(true);
                try {
                  await remove({ id: routine._id });
                  toast("Routine deleted");
                  onClose();
                } catch (e) {
                  setError(errText(e));
                }
              }}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-danger hover:bg-danger-soft sm:mr-auto")}
            >
              <Trash2 /> {armDelete ? "Tap again to delete" : "Delete"}
            </button>
          )}
          <button type="button" onClick={onClose} className={cn(buttonVariants({ variant: "ghost" }), !routine && "sm:ml-auto")}>
            Cancel
          </button>
          <button type="button" disabled={!name.trim() || saving} onClick={() => void save()} className={buttonVariants()}>
            {routine ? "Save routine" : "Create routine"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
