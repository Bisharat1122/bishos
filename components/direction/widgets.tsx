"use client";

/** Shared Direction widgets: tactic +/− counter, Weekly Big 3, hours by area, Free Day picker. */
import { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Minus, Plus, Target, Trash2, Palmtree, Repeat } from "lucide-react";
import { AreaDot, CheckCircle, Chip, InlineEdit, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { reward, toast, celebrate } from "@/components/os/celebrate";
import { fmtYmd, weekDays } from "@/lib/day";
import { errMsg } from "./util";

// ─────────────────────────────────────────────────────────────────────────
// Tactic counter
// ─────────────────────────────────────────────────────────────────────────

export function TacticCounter({
  tacticId,
  title,
  done,
  target,
  weekStart,
  today,
  ifThen,
  sub,
  compact,
  readOnly,
}: {
  tacticId: Id<"tactics">;
  title: string;
  done: number;
  target: number;
  weekStart: string;
  today: string;
  ifThen?: string;
  sub?: React.ReactNode;
  compact?: boolean;
  readOnly?: boolean;
}) {
  const log = useMutation(api.tactics.logTactic);
  const [busy, setBusy] = useState(false);
  const hit = done >= target;
  const go = async (delta: number) => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await log({ tacticId, weekStart, delta, date: today });
      if (r.hitTarget) reward(`Tactic target hit · ${title}`, r.xp || undefined, true);
      else if (r.xp) toast(`+1 · ${title}`, { tone: "success", xp: r.xp });
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={cn("flex items-center gap-3", compact ? "py-1" : "rounded-lg border border-border bg-background/60 px-3 py-2")}>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", hit && "text-success")} title={title}>
          {title}
        </p>
        <div className="mt-1 flex items-center gap-1" aria-hidden>
          {Array.from({ length: Math.min(target, 14) }, (_, i) => (
            <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < done ? (hit ? "bg-success" : "bg-primary") : "bg-muted")} />
          ))}
          {target > 14 && <span className="text-[10px] text-muted-foreground">…</span>}
        </div>
        {(ifThen || sub) && !compact && <p className="mt-1 truncate text-[11px] text-muted-foreground">{sub ?? ifThen}</p>}
      </div>
      {!readOnly && (
        <button
          type="button"
          onClick={() => void go(-1)}
          disabled={busy || done <= 0}
          aria-label={`Undo one: ${title}`}
          className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "size-7")}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
      )}
      <span className={cn("w-12 text-center text-sm font-semibold tabular-nums", hit && "text-success")}>
        {done}
        <span className="font-normal text-muted-foreground">/{target}</span>
      </span>
      {!readOnly && (
        <button
          type="button"
          onClick={() => void go(1)}
          disabled={busy}
          aria-label={`Log one: ${title}`}
          className={cn(buttonVariants({ variant: hit ? "outline" : "default", size: "icon-sm" }), "size-7")}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/** Read-only habit lead measure (logged from the Habits page / Today). */
export function HabitLead({ title, done, target }: { title: string; done: number; target: number }) {
  const hit = done >= target;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2">
      <Repeat className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <Link href="/habits" className="min-w-0 flex-1 truncate text-sm hover:underline">
        {title}
      </Link>
      <span className={cn("text-sm font-semibold tabular-nums", hit && "text-success")}>
        {done}
        <span className="font-normal text-muted-foreground">/{target}</span>
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Weekly Big 3
// ─────────────────────────────────────────────────────────────────────────

type Big3Item = { text: string; done: boolean; goalId?: Id<"goals"> };

export function Big3Editor({
  weekStart,
  big3,
  goals,
  today,
  editable = true,
  checkable = true,
}: {
  weekStart: string;
  big3: Big3Item[];
  goals: { _id: Id<"goals">; title: string }[];
  today: string;
  editable?: boolean;
  checkable?: boolean;
}) {
  const upsert = useMutation(api.weekPlans.upsert);
  const toggle = useMutation(api.weekPlans.toggleBig3);
  const [draft, setDraft] = useState("");
  const [goalId, setGoalId] = useState("");
  const save = (next: Big3Item[]) =>
    upsert({ weekStart, big3: next.map((b) => ({ text: b.text, done: b.done, goalId: b.goalId })) }).catch((e) =>
      toast(errMsg(e), { tone: "warning" }),
    );
  const onToggle = async (i: number) => {
    try {
      const r = await toggle({ weekStart, index: i, date: today });
      if (r.done) {
        if (r.allDone) {
          reward("Weekly Big 3 complete 🎉", r.xp || undefined, true);
          celebrate(1.4);
        } else reward(`Big 3 · ${big3[i].text}`, r.xp || undefined);
      }
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  };
  const goalTitle = (id?: string) => goals.find((g) => g._id === id)?.title;

  return (
    <div className="space-y-2">
      {big3.map((b, i) => (
        <div
          key={i}
          className={cn(
            "group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
            b.done ? "border-success/40 bg-success-soft" : "border-border bg-background/60",
          )}
        >
          <span className="w-4 text-center text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
          {checkable && <CheckCircle checked={b.done} onClick={() => void onToggle(i)} size="lg" label={b.done ? "Mark not done" : "Mark done"} />}
          <div className="min-w-0 flex-1">
            {editable ? (
              <InlineEdit
                value={b.text}
                onSave={(v) => void save(v.trim() ? big3.map((x, j) => (j === i ? { ...x, text: v } : x)) : big3.filter((_, j) => j !== i))}
                className={cn("text-sm font-medium", b.done && "text-muted-foreground line-through")}
              />
            ) : (
              <p className={cn("text-sm font-medium", b.done && "text-muted-foreground line-through")}>{b.text}</p>
            )}
            {b.goalId && goalTitle(b.goalId) && (
              <p className="mt-0.5 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
                <Target className="h-3 w-3" /> {goalTitle(b.goalId)}
              </p>
            )}
          </div>
          {editable && (
            <button
              onClick={() => void save(big3.filter((_, j) => j !== i))}
              className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-danger focus:opacity-100 group-hover:opacity-100"
              aria-label="Remove outcome"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      {editable && big3.length < 3 && (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            void save([...big3, { text: draft.trim(), done: false, goalId: (goalId || undefined) as Id<"goals"> | undefined }]);
            setDraft("");
            setGoalId("");
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={big3.length === 0 ? "Outcome #1 — what must be true by Sunday?" : `Outcome #${big3.length + 1}`}
            className={cn(inputClass, "h-9 flex-1")}
          />
          {goals.length > 0 && (
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)} className={cn(inputClass, "h-9 sm:w-44")} aria-label="Serves goal">
              <option value="">No goal</option>
              {goals.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.title}
                </option>
              ))}
            </select>
          )}
          <button className={buttonVariants({ size: "sm" })} disabled={!draft.trim()}>
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </form>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Hours by area (target vs planned vs actual)
// ─────────────────────────────────────────────────────────────────────────

export type HoursRow = { areaId: string; name: string; color?: string; order: number; targetH: number; plannedH: number; actualH: number };

export function HoursByArea({ rows, totals }: { rows: HoursRow[]; totals: { targetH: number; plannedH: number; actualH: number } }) {
  const visible = rows.filter((r) => r.targetH || r.plannedH || r.actualH);
  if (!visible.length) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        No hours yet. Set weekly targets on the <Link className="underline" href="/compass">Compass</Link>, plan blocks, or run a focus session.
      </p>
    );
  }
  const max = Math.max(1, ...visible.map((r) => Math.max(r.targetH, r.plannedH, r.actualH)));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-muted-foreground/25" /> Planned
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-foreground/80" /> Actual
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-foreground" /> Target
        </span>
      </div>
      {visible.map((r, i) => {
        const tone = r.targetH ? (r.actualH >= r.targetH ? "text-success" : r.actualH >= r.targetH * 0.6 ? "" : "text-warning") : "";
        return (
          <div key={r.areaId} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <AreaDot color={r.areaId === "none" ? undefined : r.color ?? `var(--chart-${((r.order ?? i) % 5) + 1})`} />
                <span className="truncate">{r.name}</span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                <span className={cn("font-semibold text-foreground", tone)}>{r.actualH}h</span> actual · {r.plannedH}h planned
                {r.targetH ? ` · ${r.targetH}h target` : ""}
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-muted" title={`${r.name}: actual ${r.actualH}h, planned ${r.plannedH}h, target ${r.targetH}h`}>
              <div className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/25" style={{ width: `${(r.plannedH / max) * 100}%` }} />
              <div
                className="absolute inset-y-[3px] left-0 rounded-full transition-[width] duration-700"
                style={{ width: `${(r.actualH / max) * 100}%`, background: r.areaId === "none" ? "var(--muted-foreground)" : r.color ?? `var(--chart-${((r.order ?? i) % 5) + 1})` }}
              />
              {r.targetH > 0 && <div className="absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `calc(${(r.targetH / max) * 100}% - 1px)` }} />}
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
        <span>Total</span>
        <span className="tabular-nums">
          <span className="font-semibold text-foreground">{totals.actualH}h</span> actual · {totals.plannedH}h planned · {totals.targetH}h target
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Free Day picker
// ─────────────────────────────────────────────────────────────────────────

export function FreeDayPicker({ weekStart, freeDay, today }: { weekStart: string; freeDay?: string; today: string }) {
  const setFree = useMutation(api.weekPlans.setFreeDay);
  const pick = async (date: string | null) => {
    try {
      await setFree({ weekStart, date });
      if (date) reward(`Free Day protected · ${fmtYmd(date, { weekday: "long" })}`);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  };
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays(weekStart).map((d) => {
          const on = d === freeDay;
          return (
            <button
              key={d}
              type="button"
              onClick={() => void pick(on ? null : d)}
              aria-pressed={on}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg border py-2 text-xs transition-colors",
                on ? "os-pop border-success bg-success-soft text-success" : "border-border hover:bg-accent",
                d < today && !on && "opacity-50",
              )}
            >
              <span className="font-medium">{fmtYmd(d, { weekday: "narrow" })}</span>
              <span className="tabular-nums text-[10px] text-muted-foreground">{fmtYmd(d, { day: "numeric" })}</span>
              {on && <Palmtree className="h-3 w-3" />}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {freeDay ? (
          <>
            <Chip tone="success" className="mr-1">Protected</Chip>
            {fmtYmd(freeDay, { weekday: "long", month: "short", day: "numeric" })} — no work, midnight to midnight.
          </>
        ) : (
          "Plan the Free Day first — rest you schedule is rest you get."
        )}
      </p>
    </div>
  );
}
