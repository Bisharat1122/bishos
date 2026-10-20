"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowDown, ArrowUp, Check, ExternalLink, Plus, Trash2, Video, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Drawer, Field, Select, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { errText } from "@/components/habits/util";
import { RUNGS, STATUS_META, safeUrl, type ProcStatus, type Rung } from "./meta";

export type ProcessItem = FunctionReturnType<typeof api.delegation.processes>[number];
type Freq = "daily" | "weekly" | "monthly" | "adhoc";
type Step = { id: string; text: string };

export type ProcessDraft = { title?: string; rung?: Rung; notes?: string };

/** SOP editor (EOS Process Documenter: the 7–15 steps that give 80% of the result). */
export function ProcessEditor({
  open,
  process,
  draft,
  onClose,
}: {
  open: boolean;
  process: ProcessItem | null;
  draft?: ProcessDraft | null;
  onClose: () => void;
}) {
  const areas = useQuery(api.lifeAreas.list);
  const create = useMutation(api.delegation.createProcess);
  const update = useMutation(api.delegation.updateProcess);
  const remove = useMutation(api.delegation.removeProcess);
  const markPerformed = useMutation(api.delegation.markPerformed);

  const [title, setTitle] = useState("");
  const [rung, setRung] = useState<Rung>("admin");
  const [status, setStatus] = useState<ProcStatus>("draft");
  const [trigger, setTrigger] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepDraft, setStepDraft] = useState("");
  const [tools, setTools] = useState("");
  const [owner, setOwner] = useState("me");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [frequency, setFrequency] = useState<Freq | "">("");
  const [areaId, setAreaId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [armDelete, setArmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(process?.title ?? draft?.title ?? "");
    setRung(process?.rung ?? draft?.rung ?? "admin");
    setStatus(process?.status ?? "draft");
    setTrigger(process?.trigger ?? "");
    setSteps((process?.steps ?? []).map((s) => ({ ...s })));
    setStepDraft("");
    setTools((process?.tools ?? []).join(", "));
    setOwner(process?.owner ?? "me");
    setRecordingUrl(process?.recordingUrl ?? "");
    setFrequency(process?.frequency ?? "");
    setAreaId(process?.lifeAreaId ?? "");
    setNotes(process?.notes ?? draft?.notes ?? "");
    setArmDelete(false);
    setError(null);
    // Re-seed only when opening or switching process (not on live refreshes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, process?._id, draft]);

  const n = steps.length + (stepDraft.trim() ? 1 : 0);
  const counter =
    n === 0
      ? { text: "Write the 7–15 major steps", cls: "text-muted-foreground" }
      : n < 7
        ? { text: `${n} step${n === 1 ? "" : "s"} · aim for 7–15`, cls: "text-muted-foreground" }
        : n <= 15
          ? { text: `${n} steps · sweet spot`, cls: "text-success" }
          : { text: `${n} steps · trim to the 20% that gives 80%`, cls: "text-warning" };

  const moveStep = (i: number, d: -1 | 1) =>
    setSteps((xs) => {
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const c = [...xs];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const allSteps = stepDraft.trim() ? [...steps, { id: "", text: stepDraft.trim() }] : steps;
    const payload = {
      title: title.trim(),
      rung,
      status,
      trigger: trigger.trim() || null,
      steps: allSteps,
      tools: tools.split(",").map((t) => t.trim()).filter(Boolean),
      owner: owner.trim() || null,
      recordingUrl: recordingUrl.trim() || null,
      frequency: frequency || null,
      lifeAreaId: areaId ? (areaId as Id<"lifeAreas">) : null,
      notes: notes.trim() || null,
    };
    try {
      if (process) {
        const promoted = process.status !== status && status !== "draft";
        await update({ id: process._id, ...payload });
        if (promoted) reward(status === "delegated" ? `Handed off: ${payload.title} 🙌` : `SOP documented: ${payload.title}`, undefined, status === "delegated");
        else toast("SOP saved", { tone: "success" });
      } else {
        await create({
          ...payload,
          trigger: payload.trigger ?? undefined,
          owner: payload.owner ?? undefined,
          recordingUrl: payload.recordingUrl ?? undefined,
          frequency: payload.frequency ?? undefined,
          lifeAreaId: payload.lifeAreaId ?? undefined,
          notes: payload.notes ?? undefined,
        });
        toast("SOP created", { tone: "success", sub: "Record the next run to fill in the steps." });
      }
      onClose();
    } catch (e) {
      setError(errText(e));
    } finally {
      setSaving(false);
    }
  }

  const link = safeUrl(recordingUrl);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={process ? "Edit SOP" : "New SOP"}
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {process && (
            <button
              onClick={async () => {
                if (!armDelete) return setArmDelete(true);
                try {
                  await remove({ id: process._id });
                  toast("SOP deleted");
                  onClose();
                } catch (e) {
                  setError(errText(e));
                }
              }}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-danger hover:bg-danger-soft")}
            >
              <Trash2 /> {armDelete ? "Tap again" : "Delete"}
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
              Cancel
            </button>
            <button onClick={() => void save()} disabled={!title.trim() || saving} className={buttonVariants()}>
              Save
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Process name">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Client onboarding" maxLength={120} autoFocus={!process} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ladder rung">
            <Select value={rung} onChange={(e) => setRung(e.target.value as Rung)}>
              {RUNGS.map((r, i) => (
                <option key={r.key} value={r.key}>
                  {i + 1}. {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="How often">
            <Select value={frequency} onChange={(e) => setFrequency(e.target.value as Freq | "")}>
              <option value="">—</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="adhoc">As needed</option>
            </Select>
          </Field>
        </div>
        <Field label="Status">
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-0.5">
            {(Object.keys(STATUS_META) as ProcStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn("h-8 rounded-md text-xs font-medium transition-colors", status === s ? "bg-card shadow-xs" : "text-muted-foreground hover:text-foreground")}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Trigger" hint="What starts this process? e.g. “A client signs the proposal”.">
          <TextInput value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder="When a new client signs…" maxLength={160} />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Steps</span>
            <span className={cn("text-xs tabular-nums", counter.cls)}>{counter.text}</span>
          </div>
          <ol className="space-y-1.5">
            {steps.map((s, i) => (
              <li key={s.id || i} className="flex items-center gap-1.5">
                <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{i + 1}.</span>
                <TextInput
                  value={s.text}
                  onChange={(e) => setSteps((xs) => xs.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                  className="h-8 min-w-0 flex-1"
                  maxLength={200}
                />
                <button type="button" onClick={() => moveStep(i, -1)} aria-label="Move up" className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => moveStep(i, 1)} aria-label="Move down" className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setSteps((xs) => xs.filter((_, j) => j !== i))} aria-label="Remove step" className="shrink-0 rounded p-1 text-muted-foreground hover:text-danger">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ol>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!stepDraft.trim()) return;
              setSteps((xs) => [...xs, { id: "", text: stepDraft.trim() }]);
              setStepDraft("");
            }}
          >
            <TextInput value={stepDraft} onChange={(e) => setStepDraft(e.target.value)} placeholder={`Step ${steps.length + 1}…`} className="h-8" maxLength={200} />
            <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Plus /> Add
            </button>
          </form>
        </div>

        <Field label="Camcorder recording" hint="Record yourself doing it once (Loom, screen recording) — whoever takes it over writes the steps from the video.">
          <div className="flex gap-2">
            <TextInput value={recordingUrl} onChange={(e) => setRecordingUrl(e.target.value)} placeholder="https://loom.com/share/…" inputMode="url" />
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Open recording">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tools" hint="Comma-separated">
            <TextInput value={tools} onChange={(e) => setTools(e.target.value)} placeholder="Notion, Stripe, Gmail" />
          </Field>
          <Field label="Owner" hint="“me” until it's handed off">
            <TextInput value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="me" maxLength={60} />
          </Field>
        </div>
        <Field label="Life Area (optional)">
          <Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">—</option>
            {(areas ?? []).filter((a) => !a.archived || a._id === areaId).map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notes">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Gotchas, quality bar, what “done” looks like…" />
        </Field>

        {process && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <Video className="h-3.5 w-3.5" />
            {process.lastPerformedAt ? `Last performed ${new Date(process.lastPerformedAt).toLocaleDateString()}` : "Not performed yet"}
            <button
              onClick={async () => {
                try {
                  await markPerformed({ id: process._id });
                  toast("Marked as performed today", { tone: "success" });
                } catch (e) {
                  setError(errText(e));
                }
              }}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-auto h-7 px-2 text-xs")}
            >
              <Check className="h-3 w-3" /> Did it today
            </button>
          </div>
        )}
        {process?.sourceTaskTitle && <p className="text-xs text-muted-foreground">Created from task: “{process.sourceTaskTitle}”</p>}
        {error && <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">{error}</p>}
      </div>
    </Drawer>
  );
}
