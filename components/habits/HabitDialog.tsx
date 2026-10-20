"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Hourglass, Sparkles } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Dialog, Field, Segmented, Select, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { TIME_OF_DAY, errText, type TimeOfDay } from "./util";

type Capacity = { newActive: number; max: number; full: boolean };

/**
 * Create / edit a habit. Each field teaches the method in one line:
 * if-then anchor, 2-minute minimum, stretch, weekly target + reserve skips,
 * time of day, and a parent (Life Area required, optional 12-week goal).
 */
export function HabitDialog({
  open,
  onClose,
  habit,
  capacity,
  today,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  habit?: Doc<"habits"> | null;
  capacity?: Capacity;
  today: string;
  onSaved?: (id: Id<"habits"> | null) => void;
}) {
  const areas = useQuery(api.lifeAreas.list);
  const goals = useQuery(api.goals.list);
  const create = useMutation(api.habits.create);
  const update = useMutation(api.habits.update);

  const editing = !!habit;
  const [title, setTitle] = useState("");
  const [anchor, setAnchor] = useState("");
  const [minVersion, setMinVersion] = useState("");
  const [stretchVersion, setStretchVersion] = useState("");
  const [weeklyTarget, setWeeklyTarget] = useState(7);
  const [reserveSkips, setReserveSkips] = useState(2);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("any");
  const [areaId, setAreaId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [why, setWhy] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle(habit?.title ?? "");
    setAnchor(habit?.anchor ?? "");
    setMinVersion(habit?.minVersion ?? "");
    setStretchVersion(habit?.stretchVersion ?? "");
    setWeeklyTarget(habit?.weeklyTarget ?? (habit?.frequency === "weekly" ? 1 : 7));
    setReserveSkips(habit?.reserveSkips ?? 2);
    setTimeOfDay(habit?.timeOfDay ?? "any");
    setAreaId(habit?.lifeAreaId ?? "");
    setGoalId(habit?.goalId ?? "");
    setWhy(habit?.description ?? "");
    setAmount(habit?.target ?? "");
    // Re-seed only when opening or switching habit (not on live refreshes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, habit?._id]);

  useEffect(() => {
    if (open && !areaId && areas && areas.length) setAreaId(areas.filter((a) => !a.archived)[0]?._id ?? areas[0]._id);
  }, [open, areas, areaId]);

  const goalOptions = useMemo(() => {
    const live = (goals ?? []).filter((g) => g.goalStatus !== "dropped" && g.goalStatus !== "achieved");
    return {
      cycle: live.filter((g) => g.level === "cycle"),
      other: live.filter((g) => g.level !== "cycle"),
    };
  }, [goals]);

  const capFull = !editing && !!capacity?.full;
  const valid = title.trim().length > 0 && !!areaId;
  const sentence = `After I ${anchor.trim().replace(/^(after|when)\s+i\s+/i, "") || "…"}, I will ${title.trim() ? title.trim().charAt(0).toLowerCase() + title.trim().slice(1) : "…"}.`;

  async function save(status: "active" | "queued") {
    if (!valid) return;
    setSaving(true);
    setError(null);
    const cue = anchor.trim().replace(/^(after|when)\s+i\s+/i, "").replace(/[,.]\s*$/, "");
    const frequency = weeklyTarget === 7 ? ("daily" as const) : weeklyTarget === 1 ? ("weekly" as const) : ("custom" as const);
    try {
      if (editing && habit) {
        await update({
          id: habit._id,
          title: title.trim(),
          anchor: cue || null,
          minVersion: minVersion.trim() || null,
          stretchVersion: stretchVersion.trim() || null,
          weeklyTarget,
          reserveSkips,
          timeOfDay,
          lifeAreaId: areaId as Id<"lifeAreas">,
          goalId: goalId ? (goalId as Id<"goals">) : null,
          description: why.trim() || null,
          target: amount.trim() || null,
          frequency,
          today,
        });
        toast("Habit updated", { tone: "success" });
        onSaved?.(habit._id);
      } else {
        const id = await create({
          title: title.trim(),
          anchor: cue || undefined,
          minVersion: minVersion.trim() || undefined,
          stretchVersion: stretchVersion.trim() || undefined,
          weeklyTarget,
          reserveSkips,
          timeOfDay,
          lifeAreaId: areaId as Id<"lifeAreas">,
          goalId: goalId ? (goalId as Id<"goals">) : undefined,
          description: why.trim() || undefined,
          target: amount.trim() || undefined,
          frequency,
          habitStatus: status,
          today,
        });
        if (status === "queued") toast("Added to the queue", { tone: "info", sub: "It starts when one of your current habits sticks." });
        else reward(`New habit: ${title.trim()}`, undefined, false);
        onSaved?.(id);
      }
      onClose();
    } catch (e) {
      setError(errText(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={editing ? "Edit habit" : "Design a new habit"} size="lg">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save(capFull ? "queued" : "active");
        }}
      >
        {/* Live if-then sentence */}
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Your if-then plan
          </p>
          <p className="mt-1 text-sm font-medium leading-snug">{sentence}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="After I… (the cue)" hint="Anchor it to something you already do daily — “pour my coffee”, not “in the morning”.">
            <TextInput autoFocus={!editing} value={anchor} onChange={(e) => setAnchor(e.target.value)} placeholder="pour my morning coffee" maxLength={120} />
          </Field>
          <Field label="I will… (the habit)" hint="One specific behaviour you can see yourself doing.">
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Journal for 5 minutes" maxLength={120} required />
          </Field>
          <Field label="Minimum version (≈2 minutes)" hint="On bad days the tiny version counts fully — it protects the streak.">
            <TextInput value={minVersion} onChange={(e) => setMinVersion(e.target.value)} placeholder="Write one sentence" maxLength={120} />
          </Field>
          <Field label="Stretch version (optional)" hint="For great days. Never required.">
            <TextInput value={stretchVersion} onChange={(e) => setStretchVersion(e.target.value)} placeholder="Write a full page" maxLength={120} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={`Weekly target · ${weeklyTarget === 7 ? "every day" : `${weeklyTarget}× a week`}`} hint="Pick what you can sustain in a bad week, not your best week.">
            <div className="flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setWeeklyTarget(n)}
                  className={cn(
                    "size-9 rounded-lg border text-sm font-medium tabular-nums transition-colors",
                    weeklyTarget === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>
          <Field label={`Reserve skips · ${reserveSkips} a week`} hint="Planned skips keep your streak — people with reserves hit goals up to 40% more often.">
            <div className="flex flex-wrap gap-1">
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReserveSkips(n)}
                  className={cn(
                    "h-9 min-w-9 rounded-lg border px-3 text-sm font-medium tabular-nums transition-colors",
                    reserveSkips === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <Field label="Time of day" hint="Groups it on Today so it shows up when the cue does.">
          <Segmented
            size="sm"
            value={timeOfDay}
            onChange={setTimeOfDay}
            options={TIME_OF_DAY.map((t) => ({ value: t.value, label: t.label }))}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Life Area (required)"
            hint={
              areas && areas.length === 0 ? (
                <>
                  You don&apos;t have a life area yet —{" "}
                  <Link href="/life-areas" className="underline" onClick={onClose}>
                    create one first
                  </Link>
                  .
                </>
              ) : (
                "Every habit lives in one area of your life."
              )
            }
          >
            <Select value={areaId} onChange={(e) => setAreaId(e.target.value)} required>
              <option value="" disabled>
                Pick an area…
              </option>
              {(areas ?? [])
                .filter((a) => !a.archived || a._id === areaId)
                .map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="12-week goal (optional)" hint="Habits linked to a goal count as lead measures in your execution score.">
            <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
              <option value="">No goal</option>
              {goalOptions.cycle.length > 0 && (
                <optgroup label="12-week goals">
                  {goalOptions.cycle.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.title}
                    </option>
                  ))}
                </optgroup>
              )}
              {goalOptions.other.length > 0 && (
                <optgroup label="Other goals">
                  {goalOptions.other.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.title}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
          </Field>
        </div>

        <details className="group rounded-lg border border-border px-3 py-2 [&_summary::-webkit-details-marker]:hidden">
          <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground">More: why it matters · amount</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Why it matters" hint="Read it on the days motivation is low.">
              <TextArea value={why} onChange={(e) => setWhy(e.target.value)} rows={2} className="min-h-[60px]" placeholder="So I think clearly before calls" />
            </Field>
            <Field label="Amount (optional)" hint="e.g. 30 min, 10 pages">
              <TextInput value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5 min" maxLength={40} />
            </Field>
          </div>
        </details>

        {capFull && (
          <div className="flex gap-2.5 rounded-xl border border-border bg-info-soft p-3 text-sm">
            <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-info" />
            <p>
              <span className="font-medium">You&apos;re already building {capacity!.newActive} new habit{capacity!.newActive === 1 ? "" : "s"}</span>{" "}
              (your limit is {capacity!.max}). Habits take about 66 days to stick — add this one to the queue and it&apos;ll get its turn.
            </p>
          </div>
        )}

        {error && <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">{error}</p>}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
            Cancel
          </button>
          {!editing && !capFull && (
            <button type="button" disabled={!valid || saving} onClick={() => void save("queued")} className={buttonVariants({ variant: "outline" })}>
              Add to queue
            </button>
          )}
          <button type="submit" disabled={!valid || saving} className={buttonVariants()}>
            {editing ? "Save changes" : capFull ? "Add to queue" : "Start habit"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
