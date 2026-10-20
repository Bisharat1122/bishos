"use client";

/**
 * Decision journal UI: the "write it before you know" form, the review flow,
 * the detail drawer and the calibration card.
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { AlarmClock, BrainCircuit, Check, RotateCcw, Scale, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Bar, Chip, Dialog, Drawer, Field, ListEditor, Section, Select, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { errorMessage, reward, toast } from "@/components/os/celebrate";
import { addDaysYmd, fmtYmd } from "@/lib/day";
import { DECISION_STATES, relDayInline } from "./lib";
import { AutoText, ChipPicker, FieldGroup } from "./viz";

export type DecisionList = FunctionReturnType<typeof api.decisions.list>;
type Decision = Doc<"decisions">;

export function confidenceWord(c: number) {
  if (c >= 90) return "Near certain";
  if (c >= 75) return "Confident";
  if (c >= 60) return "Fairly confident";
  if (c >= 45) return "Coin flip";
  if (c >= 25) return "Doubtful";
  return "Long shot";
}

function AreaSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const areas = useQuery(api.lifeAreas.list);
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">None</option>
      {(areas ?? [])
        .filter((a) => !a.archived)
        .sort((a, b) => a.order - b.order)
        .map((a) => (
          <option key={a._id} value={a._id}>
            {a.name}
          </option>
        ))}
    </Select>
  );
}

const REVIEW_PRESETS: [string, number][] = [
  ["2 weeks", 14],
  ["6 weeks", 42],
  ["3 months", 91],
  ["6 months", 182],
];

/** New decision journal entry. */
export function DecisionForm({ open, onClose, today }: { open: boolean; onClose: () => void; today: string }) {
  const create = useMutation(api.decisions.create);
  const blank = () => ({
    title: "",
    context: "",
    options: [] as string[],
    choice: "",
    expected: "",
    confidence: 70,
    states: [] as string[],
    stateNote: "",
    reviewDate: addDaysYmd(today, 42),
    areaId: "",
  });
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setF(blank());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function submit(e?: React.SyntheticEvent) {
    e?.preventDefault();
    if (!f.title.trim()) return toast("What are you deciding?", { tone: "warning" });
    setBusy(true);
    try {
      const state = [...f.states, f.stateNote.trim()].filter(Boolean).join(", ");
      const r = await create({
        title: f.title,
        context: f.context || undefined,
        options: f.options,
        choice: f.choice || undefined,
        expected: f.expected || undefined,
        confidence: f.confidence,
        state: state || undefined,
        reviewDate: f.reviewDate || undefined,
        lifeAreaId: f.areaId ? (f.areaId as Id<"lifeAreas">) : undefined,
        date: today,
      });
      reward("Decision journaled", r.xp || undefined);
      onClose();
    } catch (err) {
      toast(errorMessage(err, "Could not save"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Journal a decision" size="lg">
      {/* Not a <form>: Enter in the options ListEditor adds an option; it must never submit the decision. */}
      <div className="space-y-4">
        <p className="rounded-lg bg-info-soft px-3 py-2 text-xs text-info">
          Write this <span className="font-semibold">before</span> you know the outcome, so hindsight can't rewrite your reasoning.
        </p>
        <Field label="What are you deciding?">
          <TextInput value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Hire a part-time SDR or keep doing outreach myself?" autoFocus />
        </Field>
        <Field label="Context" hint="The situation, what you know, the constraints">
          <TextArea value={f.context} onChange={(e) => setF({ ...f, context: e.target.value })} className="min-h-[70px]" />
        </Field>
        <FieldGroup label="Options you considered">
          <ListEditor items={f.options} onChange={(options) => setF({ ...f, options })} placeholder="Add an option and press Enter" />
        </FieldGroup>
        <Field label="Your choice">
          <TextInput value={f.choice} onChange={(e) => setF({ ...f, choice: e.target.value })} placeholder="What you're going with" />
          {f.options.length > 0 && (
            <span className="flex flex-wrap gap-1 pt-1">
              {f.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setF({ ...f, choice: o });
                  }}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs",
                    f.choice === o ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {o}
                </button>
              ))}
            </span>
          )}
        </Field>
        <Field label="Expected outcome" hint="What you think will happen, and by when">
          <TextArea value={f.expected} onChange={(e) => setF({ ...f, expected: e.target.value })} className="min-h-[60px]" placeholder="Within 6 weeks I'll have 2× the booked calls and 8 more hours a week for delivery" />
        </Field>
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-muted-foreground">How confident are you?</span>
            <span className="text-sm font-semibold tabular-nums">
              {f.confidence}% <span className="font-normal text-muted-foreground">· {confidenceWord(f.confidence)}</span>
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={f.confidence}
            onChange={(e) => setF({ ...f, confidence: Number(e.target.value) })}
            className="mt-2 w-full accent-[var(--foreground)]"
            aria-label="Confidence"
          />
        </div>
        <FieldGroup label="Physical & mental state right now">
          <ChipPicker options={DECISION_STATES} value={f.states} onChange={(states) => setF({ ...f, states })} />
          <TextInput value={f.stateNote} onChange={(e) => setF({ ...f, stateNote: e.target.value })} placeholder="Anything else? (slept 5h, after a tough call…)" className="mt-2" />
        </FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Review on">
            <TextInput type="date" value={f.reviewDate} min={today} onChange={(e) => setF({ ...f, reviewDate: e.target.value })} />
            <span className="flex flex-wrap gap-1 pt-1">
              {REVIEW_PRESETS.map(([label, d]) => (
                <button
                  key={label}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setF({ ...f, reviewDate: addDaysYmd(today, d) });
                  }}
                  className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {label}
                </button>
              ))}
            </span>
          </Field>
          <Field label="Life Area (optional)">
            <AreaSelect value={f.areaId} onChange={(areaId) => setF({ ...f, areaId })} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "outline" })}>
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={busy} className={buttonVariants()}>
            Save to journal
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/** Review flow: outcome, lessons, "was the expectation right?". */
export function ReviewDialog({ decision, onClose, today }: { decision: Decision | null; onClose: () => void; today: string }) {
  const review = useMutation(api.decisions.review);
  const snooze = useMutation(api.decisions.snoozeReview);
  const [outcome, setOutcome] = useState("");
  const [lessons, setLessons] = useState("");
  const [matched, setMatched] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setOutcome(decision?.outcome ?? "");
    setLessons(decision?.lessons ?? "");
    setMatched(decision?.matched ?? null);
  }, [decision]);
  if (!decision) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!decision) return;
    if (!outcome.trim()) return toast("Write what actually happened", { tone: "warning" });
    if (matched == null) return toast("Did it turn out as you expected?", { tone: "warning" });
    setBusy(true);
    try {
      const r = await review({ id: decision._id, outcome, lessons: lessons || undefined, matched, date: today });
      reward("Decision reviewed. Calibration updated", r.xp || undefined, true);
      onClose();
    } catch (err) {
      toast(errorMessage(err, "Could not save"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title="Review a decision" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <p className="font-semibold">{decision.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Written {decision.decidedOn ? fmtYmd(decision.decidedOn, { month: "short", day: "numeric", year: "numeric" }) : "earlier"}
            {decision.state ? ` · state: ${decision.state}` : ""}
          </p>
          {decision.choice && (
            <p className="mt-2">
              <span className="text-muted-foreground">You chose: </span>
              {decision.choice}
            </p>
          )}
          {decision.expected && (
            <p className="mt-1">
              <span className="text-muted-foreground">You expected: </span>
              {decision.expected}
            </p>
          )}
          {decision.confidence != null && (
            <p className="mt-1">
              <span className="text-muted-foreground">Confidence: </span>
              <span className="font-medium tabular-nums">{decision.confidence}%</span>
            </p>
          )}
        </div>
        <Field label="What actually happened?">
          <TextArea value={outcome} onChange={(e) => setOutcome(e.target.value)} autoFocus className="min-h-[80px]" />
        </Field>
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Did it turn out the way you expected?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMatched(true)}
              aria-pressed={matched === true}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
                matched === true ? "border-success bg-success-soft text-success" : "border-border hover:bg-accent",
              )}
            >
              <ThumbsUp className="h-4 w-4" /> Yes, as expected
            </button>
            <button
              type="button"
              onClick={() => setMatched(false)}
              aria-pressed={matched === false}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
                matched === false ? "border-warning bg-warning-soft text-warning" : "border-border hover:bg-accent",
              )}
            >
              <ThumbsDown className="h-4 w-4" /> No, it surprised me
            </button>
          </div>
        </div>
        <Field label="Lessons" hint="Was it a good decision with a bad outcome, or the reverse? What would you do differently?">
          <TextArea value={lessons} onChange={(e) => setLessons(e.target.value)} className="min-h-[70px]" />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={async () => {
              try {
                await snooze({ id: decision._id, days: 14, today });
                toast("Review moved 2 weeks out");
                onClose();
              } catch (err) {
                toast(errorMessage(err, "Could not snooze"), { tone: "warning" });
              }
            }}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <AlarmClock className="h-3.5 w-3.5" /> Too early, remind me in 2 weeks
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={buttonVariants({ variant: "outline" })}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={buttonVariants()}>
              <Check className="h-4 w-4" /> Complete review
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

/** Detail drawer: everything editable, plus review/reopen/delete. */
export function DecisionDrawer({
  decision,
  onClose,
  onReview,
  today,
}: {
  decision: (Decision & { reviewDue: boolean }) | null;
  onClose: () => void;
  onReview: (d: Decision) => void;
  today: string;
}) {
  const update = useMutation(api.decisions.update);
  const reopen = useMutation(api.decisions.reopen);
  const remove = useMutation(api.decisions.remove);
  if (!decision) return null;
  const d = decision;
  const save = (patch: Omit<Parameters<typeof update>[0], "id">) =>
    update({ id: d._id, ...patch }).catch((err: unknown) => toast(errorMessage(err, "Could not save"), { tone: "warning" }));
  return (
    <Drawer
      open
      onClose={onClose}
      title={d.title}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Delete this decision from the journal?")) return;
              try {
                await remove({ id: d._id });
                toast("Decision deleted");
                onClose();
              } catch (err) {
                toast(errorMessage(err, "Could not delete"), { tone: "warning" });
              }
            }}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          {d.status === "reviewed" ? (
            <button
              type="button"
              onClick={() => reopen({ id: d._id }).then(() => toast("Review reopened"), (err: unknown) => toast(errorMessage(err, "Could not reopen"), { tone: "warning" }))}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reopen review
            </button>
          ) : (
            <button type="button" onClick={() => onReview(d)} className={buttonVariants({ size: "sm" })}>
              <Scale className="h-3.5 w-3.5" /> Review now
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone={d.status === "reviewed" ? "success" : d.status === "decided" ? "info" : "muted"}>
            {d.status === "reviewed" ? "Reviewed" : d.status === "decided" ? "Decided" : "Open"}
          </Chip>
          {d.confidence != null && <Chip tone="outline">{d.confidence}% confident</Chip>}
          {d.reviewDate && d.status !== "reviewed" && (
            <Chip tone={d.reviewDue ? "warning" : "muted"}>Review {relDayInline(d.reviewDate, today)}</Chip>
          )}
          {d.status === "reviewed" && d.matched != null && (
            <Chip tone={d.matched ? "success" : "warning"}>{d.matched ? "As expected" : "Surprised"}</Chip>
          )}
        </div>
        <Field label="Title">
          <AutoText value={d.title} onSave={(v) => v.trim() && void save({ title: v })} />
        </Field>
        <Field label="Context">
          <AutoText multiline value={d.context} onSave={(v) => void save({ context: v || null })} />
        </Field>
        <FieldGroup label="Options">
          <ListEditor items={d.options ?? []} onChange={(options) => void save({ options })} />
        </FieldGroup>
        <Field label="Choice">
          <AutoText value={d.choice} onSave={(v) => void save({ choice: v || null })} placeholder="Not decided yet" />
        </Field>
        <Field label="Expected outcome">
          <AutoText multiline rows={2} value={d.expected} onSave={(v) => void save({ expected: v || null })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="State when deciding">
            <AutoText value={d.state} onSave={(v) => void save({ state: v || null })} />
          </Field>
          <Field label="Review date">
            <TextInput type="date" value={d.reviewDate ?? ""} onChange={(e) => void save({ reviewDate: e.target.value || null })} />
          </Field>
        </div>
        {d.status === "reviewed" && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <Field label="What happened">
              <AutoText multiline rows={2} value={d.outcome} onSave={(v) => void save({ outcome: v || null })} />
            </Field>
            <Field label="Lessons">
              <AutoText multiline rows={2} value={d.lessons} onSave={(v) => void save({ lessons: v || null })} />
            </Field>
          </div>
        )}
      </div>
    </Drawer>
  );
}

/** Average confidence vs hit rate (+ buckets, Brier score). */
export function CalibrationCard({ cal }: { cal: DecisionList["calibration"] }) {
  const verdict: Record<string, { text: string; cls: string }> = {
    early: { text: "Review a few more decisions to see a trend.", cls: "bg-info-soft text-info" },
    calibrated: { text: "Well calibrated: your confidence matches reality.", cls: "bg-success-soft text-success" },
    overconfident: { text: "Overconfident: outcomes match less often than you expect. Widen your options.", cls: "bg-warning-soft text-warning" },
    underconfident: { text: "Underconfident: you're right more often than you think. Decide faster.", cls: "bg-info-soft text-info" },
  };
  return (
    <Section title="Calibration" icon={BrainCircuit} hint="How often your expectations come true vs how sure you were">
      {cal.n === 0 ? (
        <p className="text-sm text-muted-foreground">
          {cal.reviewed ? "Mark whether reviewed decisions matched your expectation to see calibration." : "Review your first decision to start measuring your judgement."}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2.5">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Average confidence</span>
                <span className="font-semibold tabular-nums">{cal.avgConfidence}%</span>
              </div>
              <Bar value={cal.avgConfidence ?? 0} tone="info" height="h-2" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Turned out as expected</span>
                <span className="font-semibold tabular-nums">{cal.hitRate}%</span>
              </div>
              <Bar value={cal.hitRate ?? 0} tone="success" height="h-2" />
            </div>
          </div>
          {cal.verdict && (
            <p className={cn("rounded-lg px-3 py-2 text-xs", verdict[cal.verdict].cls)}>{verdict[cal.verdict].text}</p>
          )}
          <div className="grid grid-cols-4 gap-2">
            {cal.buckets.map((b) => (
              <div key={b.label} className="text-center">
                <div className="relative mx-auto h-16 w-6 overflow-hidden rounded bg-muted">
                  {b.hitRate != null && <div className="absolute inset-x-0 bottom-0 bg-success/80" style={{ height: `${b.hitRate}%` }} />}
                  {b.avgConfidence != null && <div className="absolute inset-x-0 h-0.5 bg-foreground" style={{ bottom: `${b.avgConfidence}%` }} />}
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">{b.label}</div>
                <div className="text-[10px] tabular-nums">{b.n ? `${b.n}×` : "—"}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Bars = hit rate per confidence band; line = your average confidence. Brier score{" "}
            <span className="font-medium tabular-nums text-foreground">{cal.brier}</span> (0 is perfect, 0.25 is a coin flip) across {cal.n} decisions.
          </p>
        </div>
      )}
    </Section>
  );
}
