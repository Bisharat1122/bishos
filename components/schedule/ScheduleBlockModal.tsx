"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Trash2, Check, Ban, Repeat } from "lucide-react";
import { Modal } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Local YYYY-MM-DD (matches the server-side helper in convex/schedule.ts). */
export function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const minToTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const timeToMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
const WD = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type Init =
  | { mode: "create"; date: string; startMin: number }
  | { mode: "edit"; block: Doc<"scheduleBlocks"> };

export function ScheduleBlockModal({ init, onClose }: { init: Init; onClose: () => void }) {
  const editing = init.mode === "edit";
  const b = editing ? init.block : null;

  const areas = useQuery(api.lifeAreas.list);
  const tasks = useQuery(api.tasks.list, {});
  const projects = useQuery(api.projects.list);
  const goals = useQuery(api.goals.list);

  const createBlock = useMutation(api.schedule.create);
  const updateBlock = useMutation(api.schedule.update);
  const setStatus = useMutation(api.schedule.setStatus);
  const removeBlock = useMutation(api.schedule.remove);
  const removeSeries = useMutation(api.schedule.removeSeries);

  const [title, setTitle] = useState(b?.title ?? "");
  const [date, setDate] = useState(b?.date ?? (init.mode === "create" ? init.date : ""));
  const [start, setStart] = useState(minToTime(b?.startMin ?? (init.mode === "create" ? init.startMin : 540)));
  const [end, setEnd] = useState(minToTime(b ? b.endMin : (init.mode === "create" ? init.startMin + 60 : 600)));
  const [lifeAreaId, setLifeAreaId] = useState<string>(b?.lifeAreaId ?? "");
  const [projectId, setProjectId] = useState<string>(b?.projectId ?? "");
  const [goalId, setGoalId] = useState<string>(b?.goalId ?? "");
  const [taskId, setTaskId] = useState<string>(b?.taskId ?? "");
  const [notes, setNotes] = useState(b?.notes ?? "");
  const [busy, setBusy] = useState(false);

  // recurrence (create only)
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly">("none");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [until, setUntil] = useState("");

  function pickTask(id: string) {
    setTaskId(id);
    const t = tasks?.find((x) => x._id === id);
    if (t) {
      if (!title.trim()) setTitle(t.title);
      if (!lifeAreaId) setLifeAreaId(t.lifeAreaId);
      if (!projectId && t.projectId) setProjectId(t.projectId);
    }
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      const links = {
        taskId: (taskId || undefined) as Id<"tasks"> | undefined,
        projectId: (projectId || undefined) as Id<"projects"> | undefined,
        goalId: (goalId || undefined) as Id<"goals"> | undefined,
        lifeAreaId: (lifeAreaId || undefined) as Id<"lifeAreas"> | undefined,
      };
      if (editing && b) {
        await updateBlock({
          id: b._id,
          title: title.trim() || "Untitled block",
          date,
          startMin: timeToMin(start),
          endMin: timeToMin(end),
          taskId: links.taskId ?? null,
          projectId: links.projectId ?? null,
          goalId: links.goalId ?? null,
          lifeAreaId: links.lifeAreaId ?? null,
          notes: notes.trim() || undefined,
        });
      } else {
        await createBlock({
          title: title.trim() || "Untitled block",
          date,
          startMin: timeToMin(start),
          endMin: timeToMin(end),
          ...links,
          notes: notes.trim() || undefined,
          recurrence: recurrence === "none" ? undefined : recurrence,
          weekdays: recurrence === "weekly" && weekdays.length ? weekdays : undefined,
          untilDate: until || undefined,
        });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const sel = "rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary/60";

  return (
    <Modal title={editing ? "Edit block" : "New schedule block"} onClose={onClose}>
      <div className="space-y-3">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you doing?"
          className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
        />

        {/* date + time */}
        <div className="grid grid-cols-3 gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(sel, "[color-scheme:dark]")} />
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={cn(sel, "[color-scheme:dark]")} />
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={cn(sel, "[color-scheme:dark]")} />
        </div>

        {/* interlinks */}
        <div className="grid grid-cols-2 gap-2">
          <select value={lifeAreaId} onChange={(e) => setLifeAreaId(e.target.value)} className={sel}>
            <option value="">Life area…</option>
            {areas?.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
          <select value={taskId} onChange={(e) => pickTask(e.target.value)} className={sel}>
            <option value="">Task…</option>
            {tasks?.filter((t) => t.status !== "done").map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
          </select>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={sel}>
            <option value="">Project…</option>
            {projects?.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
          <select value={goalId} onChange={(e) => setGoalId(e.target.value)} className={sel}>
            <option value="">Goal…</option>
            {goals?.map((g) => <option key={g._id} value={g._id}>{g.title}</option>)}
          </select>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notes (optional)"
          className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary/60"
        />

        {/* recurrence (create only) */}
        {!editing && (
          <div className="rounded-lg border border-border p-2.5">
            <div className="flex items-center gap-2 text-sm">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Repeat</span>
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as "none" | "daily" | "weekly")} className={cn(sel, "ml-auto py-1")}>
                <option value="none">Doesn&apos;t repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            {recurrence === "weekly" && (
              <div className="mt-2 flex gap-1">
                {WD.map((w, i) => (
                  <button
                    key={i}
                    onClick={() => setWeekdays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))}
                    className={cn(
                      "h-7 w-7 rounded-full text-xs font-medium",
                      weekdays.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {w}
                  </button>
                ))}
              </div>
            )}
            {recurrence !== "none" && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Until</span>
                <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className={cn(sel, "[color-scheme:dark] py-1")} />
                <span className="text-xs text-muted-foreground">(optional)</span>
              </div>
            )}
          </div>
        )}

        {/* status (edit only) */}
        {editing && b && (
          <div className="flex gap-1.5">
            {(["planned", "done", "skipped"] as const).map((s) => (
              <button
                key={s}
                onClick={() => void setStatus({ id: b._id, status: s })}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition",
                  b.status === s ? "border-transparent bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {s === "done" && <Check className="h-3.5 w-3.5" />}
                {s === "skipped" && <Ban className="h-3.5 w-3.5" />}
                {s}
              </button>
            ))}
            <span className="ml-auto self-center text-[11px] text-muted-foreground">
              {b.status === "done" ? "✓ logged as focus time" : ""}
            </span>
          </div>
        )}

        {/* actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => void save()}
            disabled={busy || !date}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Saving…" : editing ? "Save changes" : "Add to schedule"}
          </button>
          {editing && b && (
            <button
              onClick={async () => { await removeBlock({ id: b._id }); onClose(); }}
              title="Delete block"
              className="rounded-lg border border-border p-2.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        {editing && b?.seriesId && (
          <button
            onClick={async () => { await removeSeries({ seriesId: b.seriesId!, fromDate: b.date }); onClose(); }}
            className="w-full text-center text-xs text-muted-foreground hover:text-destructive"
          >
            Delete this & all future occurrences in the series
          </button>
        )}
      </div>
    </Modal>
  );
}
