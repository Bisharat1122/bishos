"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Trash2,
  Paperclip,
  FileText,
  Plus,
  Pencil,
  Eye,
  Tag,
  Clock,
  Timer,
  Copy,
  PanelRight,
  Square,
  Maximize2,
  Star,
  FolderKanban,
  Handshake,
  User,
  Clapperboard,
  GraduationCap,
} from "lucide-react";
import { useToday } from "@/lib/day";
import { toast, errorMessage } from "@/components/os/celebrate";
import { SlashEditor } from "@/components/editor/SlashEditor";
import { MarkdownLite } from "./MarkdownLite";
import { AddToMomentum } from "@/components/momentum/AddToMomentum";
import { TaskTimerButton } from "./TaskTimerButton";
import { DuplicateTaskModal } from "./DuplicateTaskModal";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/variants";

type Status = "not_started" | "in_progress" | "done";
type Priority = "low" | "med" | "high";
type Attachment = { storageId: Id<"_storage">; name: string; contentType: string; size: number };

const STATUSES: { key: Status; label: string }[] = [
  { key: "not_started", label: "Not started" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];
const PRIORITIES: { key: Priority; label: string; cls: string }[] = [
  { key: "low", label: "Low", cls: "data-[on=true]:bg-muted data-[on=true]:text-foreground" },
  { key: "med", label: "Medium", cls: "data-[on=true]:bg-primary/20 data-[on=true]:text-primary" },
  { key: "high", label: "High", cls: "data-[on=true]:bg-warning-soft data-[on=true]:text-warning" },
];

const fmtDur = (sec: number) => {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

/** Notion-style views: side peek (default), center peek, or full page. */
export type TaskView = "side" | "center" | "page";

export function TaskDetailPanel({
  id,
  onClose,
  view: initialView = "side",
}: {
  id: Id<"tasks">;
  onClose?: () => void;
  view?: TaskView;
}) {
  const [view, setView] = useState<TaskView>(initialView);
  const router = useRouter();
  const task = useQuery(api.tasks.get, { id });
  const areas = useQuery(api.lifeAreas.list);
  const goals = useQuery(api.goals.list);
  const sections = useQuery(api.sections.list, {});
  const update = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const time = useQuery(api.focus.byTask, { taskId: id });
  const logManual = useMutation(api.focus.logManual);
  const removeSession = useMutation(api.focus.remove);
  // Life OS: names for linked deal/person + today's Top 3 (shared with /tasks).
  const today = useToday();
  const lookups = useQuery(api.tasks.lookups, { date: today });
  const setTop3 = useMutation(api.days.setTop3);

  const [logMin, setLogMin] = useState(25);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [dupOpen, setDupOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Track the latest typed description + what's been persisted so we can
  // autosave (debounced) and flush on close — never lose typing.
  const descRef = useRef<string | null>(null);
  descRef.current = desc;
  const savedDescRef = useRef<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      if (desc === null) {
        setDesc(task.description ?? "");
        savedDescRef.current = task.description ?? "";
        setEditing(!task.description);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  // Debounced autosave of the description as you type.
  useEffect(() => {
    if (desc === null) return;
    const t = setTimeout(() => {
      if (savedDescRef.current !== desc) {
        void update({ id, description: desc });
        savedDescRef.current = desc;
      }
    }, 500);
    return () => clearTimeout(t);
  }, [desc, id, update]);

  // Flush any unsaved description when the panel unmounts/closes.
  useEffect(() => {
    return () => {
      const d = descRef.current;
      if (d !== null && savedDescRef.current !== d) {
        void update({ id, description: d });
      }
    };
  }, [id, update]);

  if (task === undefined || task === null) {
    return (
      <Shell onClose={onClose} view={view} setView={setView} taskId={id}>
        {task === null ? (
          <p className="text-sm text-muted-foreground">Task not found.</p>
        ) : (
          <div className="space-y-3">
            <div className="skeleton h-7 w-3/4" />
            <div className="skeleton h-8 w-1/2" />
            <div className="skeleton h-32" />
            <div className="skeleton h-24" />
          </div>
        )}
      </Shell>
    );
  }

  const tags = task.tags ?? [];
  const attachments = (task.attachments ?? []) as Attachment[];
  const areaSections =
    sections?.filter((s) => s.lifeAreaId === task.lifeAreaId) ?? [];
  const p2 = (n: number) => String(n).padStart(2, "0");
  const dateOf = (ts?: number) =>
    ts ? `${new Date(ts).getFullYear()}-${p2(new Date(ts).getMonth() + 1)}-${p2(new Date(ts).getDate())}` : "";
  const timeOf = (ts?: number) => (ts ? `${p2(new Date(ts).getHours())}:${p2(new Date(ts).getMinutes())}` : "");
  const setStart = (date: string, time: string) =>
    void update({ id, startAt: date ? new Date(`${date}T${time || "09:00"}`).getTime() : null });
  const setDue = (date: string, time: string) =>
    void update({ id, dueDate: date ? new Date(`${date}T${time || "23:59"}`).getTime() : null });

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed — try again.");
      const { storageId } = await res.json();
      await update({
        id,
        attachments: [
          ...attachments,
          { storageId, name: file.name, contentType: file.type, size: file.size },
        ],
      });
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    } finally {
      setUploading(false);
    }
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    void update({ id, tags: [...tags, t] });
    setTagInput("");
  }

  return (
    <Shell onClose={onClose} view={view} setView={setView} taskId={id}>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadFile(f);
          e.target.value = "";
        }}
      />

      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && title !== task.title && update({ id, title: title.trim() })}
        className="w-full bg-transparent text-lg font-semibold outline-none"
      />

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <TaskTimerButton task={task} />
        <AddToMomentum type="task" itemId={id} title={task.title} compact />
        {lookups && task.status !== "done" && (() => {
          const top = lookups.top3;
          const inTop = top.includes(id);
          const cap = lookups.dailyShape === "ivylee" ? 6 : lookups.dailyShape === "135" ? 9 : 3;
          const full = !inTop && top.length >= cap;
          return (
            <button
              onClick={() => {
                if (full) return toast(`Top ${cap} is full — swap one on Today.`, { tone: "warning" });
                void setTop3({ date: today, taskIds: inTop ? top.filter((x) => x !== id) : [...top, id] })
                  .then(() => toast(inTop ? "Removed from Top 3" : "Added to today's Top 3", { tone: "success" }))
                  .catch((e) => toast(errorMessage(e), { tone: "warning" }));
              }}
              aria-pressed={inTop}
              title={inTop ? "Remove from today's Top 3" : "Add to today's Top 3 (plans it for today)"}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition",
                inTop ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Star className={cn("h-3.5 w-3.5", inTop && "fill-current")} /> {inTop ? "In Top 3" : "Top 3"}
            </button>
          );
        })()}
      </div>

      {/* Status */}
      <Field label="Status">
        <div className="flex gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              data-on={task.status === s.key}
              onClick={() => void update({ id, status: s.key, date: today }).catch((e) => toast(errorMessage(e), { tone: "warning" }))}
              className="rounded-md border border-border px-3 py-1 text-xs data-[on=true]:border-transparent data-[on=true]:bg-primary data-[on=true]:text-primary-foreground"
            >
              {s.label}
            </button>
          ))}
        </div>
      </Field>

      {/* Priority */}
      <Field label="Priority">
        <div className="flex gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p.key}
              data-on={task.priority === p.key}
              onClick={() => void update({ id, priority: p.key })}
              className={cn(
                "rounded-md border border-border px-3 py-1 text-xs",
                p.cls,
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Field>

      {/* Life area + section */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Life area">
          <select
            value={task.lifeAreaId}
            onChange={(e) =>
              void update({
                id,
                lifeAreaId: e.target.value as Id<"lifeAreas">,
                sectionId: null,
              })
            }
            className="w-full rounded-md border border-input bg-card shadow-xs px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
          >
            {areas?.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Section">
          <select
            value={task.sectionId ?? ""}
            onChange={(e) =>
              void update({
                id,
                sectionId: e.target.value
                  ? (e.target.value as Id<"sections">)
                  : null,
              })
            }
            className="w-full rounded-md border border-input bg-card shadow-xs px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
          >
            <option value="">None</option>
            {areaSections.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Life OS planning: "when" (≠ deadline), estimate, energy, goal, delegate */}
      <TaskPlanFields task={task} goals={goals ?? []} onUpdate={(patch) => void update({ id, ...patch })} />

      {/* Links into the founder engines (set from Pipeline / People / Content / Learning) */}
      {(task.dealId || task.personId || task.contentId || task.learningAreaId || task.projectId) && (
        <Field label="Linked">
          <div className="flex flex-wrap gap-1.5">
            {task.projectId && (
              <Link href={`/projects/${task.projectId}`} className="inline-flex items-center gap-1 rounded-md bg-sprint/15 px-2 py-1 text-xs text-sprint hover:underline">
                <FolderKanban className="h-3 w-3" /> {lookups?.projects.find((p) => p._id === task.projectId)?.title ?? "Project"}
              </Link>
            )}
            {task.dealId && (
              <Link href={`/pipeline?deal=${task.dealId}`} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                <Handshake className="h-3 w-3" /> {lookups?.deals.find((d) => d._id === task.dealId)?.title ?? "Deal"}
              </Link>
            )}
            {task.personId && (
              <Link href={`/people/${task.personId}`} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                <User className="h-3 w-3" /> {lookups?.people.find((p) => p._id === task.personId)?.name ?? "Person"}
              </Link>
            )}
            {task.contentId && (
              <Link href={`/content/${task.contentId}`} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                <Clapperboard className="h-3 w-3" /> Content piece
              </Link>
            )}
            {task.learningAreaId && (
              <Link href={`/learning/${task.learningAreaId}`} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                <GraduationCap className="h-3 w-3" /> Learning area
              </Link>
            )}
          </div>
        </Field>
      )}

      {/* Start (optional) — date + time, separate */}
      <Field label="Start">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={dateOf(task.startAt)}
            onChange={(e) => setStart(e.target.value, timeOf(task.startAt))}
            className="rounded-md border border-input bg-card shadow-xs px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
          />
          <input
            type="time"
            value={timeOf(task.startAt)}
            onChange={(e) => setStart(dateOf(task.startAt), e.target.value)}
            className="rounded-md border border-input bg-card shadow-xs px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
          />
        </div>
      </Field>

      {/* Due / end — the deadline (date + time, separate) */}
      <Field label="Due / end">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={dateOf(task.dueDate)}
            onChange={(e) => setDue(e.target.value, timeOf(task.dueDate))}
            className="rounded-md border border-input bg-card shadow-xs px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
          />
          <input
            type="time"
            value={timeOf(task.dueDate)}
            onChange={(e) => setDue(dateOf(task.dueDate), e.target.value)}
            className="rounded-md border border-input bg-card shadow-xs px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
          />
        </div>
      </Field>

      {/* Tags */}
      <Field label="Tags">
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 rounded-md bg-primary/15 px-2.5 py-0.5 text-xs text-primary"
            >
              <Tag className="h-3 w-3" />
              {t}
              <button
                onClick={() =>
                  void update({ id, tags: tags.filter((x) => x !== t) })
                }
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Add tag…"
            className="w-24 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
      </Field>

      {/* Description with slash editor */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Description
          </span>
          <button
            onClick={() => {
              // Persist immediately when leaving edit mode (autosave also covers this).
              if (editing && desc !== null && savedDescRef.current !== desc) {
                void update({ id, description: desc });
                savedDescRef.current = desc;
              }
              setEditing((e) => !e);
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {editing ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {editing ? "Preview" : "Edit"}
          </button>
        </div>
        {editing ? (
          <SlashEditor
            value={desc ?? ""}
            onChange={setDesc}
            onUpload={() => fileRef.current?.click()}
            placeholder="Write, or press / for commands…"
          />
        ) : (
          <div
            className="cursor-text rounded-lg border border-border bg-muted/20 px-3 py-2"
            onClick={() => setEditing(true)}
          >
            <MarkdownLite text={desc ?? ""} />
          </div>
        )}
      </div>

      {/* Attachments */}
      <Field label="Attachments">
        <div className="space-y-1.5">
          {attachments.map((a) => (
            <AttachmentRow
              key={a.storageId}
              att={a}
              onRemove={() =>
                void update({
                  id,
                  attachments: attachments.filter((x) => x.storageId !== a.storageId),
                })
              }
            />
          ))}
          {/* Add dropdown */}
          <div className="relative">
            <button
              onClick={() => setAddOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              {uploading ? "Uploading…" : "Add to task"}
            </button>
            {addOpen && (
              <div className="absolute z-20 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-raised">
                <button
                  onClick={() => {
                    setAddOpen(false);
                    fileRef.current?.click();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Paperclip className="h-4 w-4" /> Upload PDF / doc / image
                </button>
                <button
                  onClick={() => {
                    setAddOpen(false);
                    setEditing(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <FileText className="h-4 w-4" /> Add description block (/)
                </button>
              </div>
            )}
          </div>
        </div>
      </Field>

      {/* Time tracked */}
      <Field label="Time tracked">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-semibold">{fmtDur(time?.total ?? 0)}</span>
            <span className="text-xs text-muted-foreground">
              · {time?.sessions.length ?? 0} session{(time?.sessions.length ?? 0) === 1 ? "" : "s"}
            </span>
          </span>
          <Link
            href={`/focus?task=${id}`}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <Timer className="h-3.5 w-3.5" /> Focus on this
          </Link>
        </div>

        {/* quick manual log */}
        <div className="mb-2 flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={logMin}
            onChange={(e) => setLogMin(Math.max(1, Number(e.target.value)))}
            className="w-16 rounded-md border border-input bg-card shadow-xs px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
          />
          <span className="text-xs text-muted-foreground">min</span>
          <button
            onClick={() =>
              void logManual({
                durationMinutes: logMin,
                taskId: id,
                lifeAreaId: task.lifeAreaId,
                projectId: task.projectId ?? undefined,
              })
                .then(() => toast(`Logged ${logMin} min`, { tone: "success" }))
                .catch((e) => toast(errorMessage(e), { tone: "warning" }))
            }
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Log time
          </button>
        </div>

        {/* session log list */}
        {time && time.sessions.length > 0 && (
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {time.sessions.map((s) => (
              <div key={s._id} className="group flex items-center gap-2 rounded-lg bg-muted/20 px-2.5 py-1.5 text-xs">
                <span className="font-medium tabular-nums">{Math.round(s.duration / 60)}m</span>
                <span className="ml-auto text-muted-foreground">
                  {new Date(s.endTime).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <button
                  onClick={() => void removeSession({ id: s._id })}
                  className="text-muted-foreground opacity-0 transition hover:text-danger group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      {/* Actions */}
      <div className="mt-2 flex items-center gap-4">
        <button
          onClick={() => setDupOpen(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <Copy className="h-4 w-4" /> Duplicate task
        </button>
        <button
          onClick={async () => {
            if (!confirm(`Delete “${task.title}”? This can't be undone.`)) return;
            try {
              await removeTask({ id, date: today });
              if (onClose) onClose();
              else router.push("/tasks");
            } catch (e) {
              toast(errorMessage(e), { tone: "warning" });
            }
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-danger"
        >
          <Trash2 className="h-4 w-4" /> Delete task
        </button>
      </div>

      {/* Portal: the centre-peek frame is CSS-transformed, which would trap a
          fixed-position modal inside (and clip it to) the panel. */}
      {dupOpen &&
        typeof document !== "undefined" &&
        createPortal(<DuplicateTaskModal task={task} onClose={() => setDupOpen(false)} />, document.body)}
    </Shell>
  );
}

/** View switcher — side peek · center peek · full page (Notion-style). */
function ViewSwitcher({
  view,
  setView,
  taskId,
  onClose,
}: {
  view: TaskView;
  setView: (v: TaskView) => void;
  taskId: Id<"tasks">;
  onClose?: () => void;
}) {
  const router = useRouter();
  const btn = (active: boolean) =>
    cn(
      "flex h-7 w-7 items-center justify-center rounded-md transition",
      active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );
  return (
    <div className="flex items-center gap-0.5">
      <button title="Side peek" onClick={() => setView("side")} className={btn(view === "side")}>
        <PanelRight className="h-4 w-4" />
      </button>
      <button title="Center peek" onClick={() => setView("center")} className={btn(view === "center")}>
        <Square className="h-4 w-4" />
      </button>
      <button
        title="Open as full page"
        onClick={() => {
          // Remember exactly where this was opened from (path + query), so
          // "Back" returns to the same page/tab instead of guessing.
          const from = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
          onClose?.();
          router.push(`/tasks/${taskId}${from ? `?from=${encodeURIComponent(from)}` : ""}`);
        }}
        className={btn(false)}
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function Shell({
  children,
  onClose,
  view,
  setView,
  taskId,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  view: TaskView;
  setView: (v: TaskView) => void;
  taskId: Id<"tasks">;
}) {
  const router = useRouter();

  // Full page — rendered inline by /tasks/[id], no overlay.
  if (view === "page") {
    // Return to wherever the task was opened from (?from=…), else browser back.
    const goBack = () => {
      if (onClose) return onClose();
      const from = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;
      if (from) router.push(from);
      else router.back();
    };
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={goBack} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </button>
          <div className="flex items-center gap-0.5">
            <button title="Side peek" onClick={goBack} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
              <PanelRight className="h-4 w-4" />
            </button>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-foreground" title="Full page">
              <Maximize2 className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    );
  }

  const frame =
    view === "center"
      ? "absolute left-1/2 top-1/2 flex max-h-[88vh] w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl"
      : "absolute right-0 top-0 flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-border bg-card p-6 shadow-xl";

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className={frame}>
        <div className="flex items-center justify-between">
          <ViewSwitcher view={view} setView={setView} taskId={taskId} onClose={onClose} />
          <button
            onClick={onClose}
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type PlanPatch = {
  plannedFor?: string | null;
  someday?: boolean | null;
  estimateMin?: number | null;
  energy?: "high" | "med" | "low" | null;
  goalId?: Id<"goals"> | null;
  delegate?: boolean | null;
};

/** "When" day (separate from the deadline), estimate, energy, goal link, delegate flag. */
function TaskPlanFields({
  task,
  goals,
  onUpdate,
}: {
  task: Doc<"tasks">;
  goals: { _id: Id<"goals">; title: string; goalStatus?: string }[];
  onUpdate: (p: PlanPatch) => void;
}) {
  const ymd = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const chip = (on: boolean) =>
    `rounded-md border px-2 py-1 text-xs font-medium transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"}`;
  const sel = "h-8 w-full rounded-md border border-input bg-card px-2 text-sm shadow-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30";
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
      <Field label="When (plan to work on it)">
        <div className="flex flex-wrap items-center gap-1.5">
          <button className={chip(task.plannedFor === ymd(0))} onClick={() => onUpdate({ plannedFor: ymd(0), someday: false })}>Today</button>
          <button className={chip(task.plannedFor === ymd(1))} onClick={() => onUpdate({ plannedFor: ymd(1), someday: false })}>Tomorrow</button>
          <button className={chip(!!task.someday)} onClick={() => onUpdate({ plannedFor: null, someday: true })}>Someday</button>
          <button className={chip(!task.plannedFor && !task.someday)} onClick={() => onUpdate({ plannedFor: null, someday: false })}>Backlog</button>
          <input
            type="date"
            value={task.plannedFor ?? ""}
            onChange={(e) => onUpdate({ plannedFor: e.target.value || null, someday: false })}
            className="h-7 rounded-md border border-input bg-card px-2 text-xs shadow-xs outline-none"
            aria-label="Planned day"
          />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Estimate">
          <select value={task.estimateMin ?? ""} onChange={(e) => onUpdate({ estimateMin: e.target.value ? Number(e.target.value) : null })} className={sel}>
            <option value="">—</option>
            {[5, 15, 30, 45, 60, 90, 120, 180, 240].map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} min` : `${m / 60} h`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Energy needed">
          <select value={task.energy ?? ""} onChange={(e) => onUpdate({ energy: (e.target.value || null) as PlanPatch["energy"] })} className={sel}>
            <option value="">—</option>
            <option value="high">High (deep work)</option>
            <option value="med">Medium</option>
            <option value="low">Low (admin)</option>
          </select>
        </Field>
      </div>
      <Field label="Moves goal">
        <select value={task.goalId ?? ""} onChange={(e) => onUpdate({ goalId: (e.target.value || null) as Id<"goals"> | null })} className={sel}>
          <option value="">— none (maintenance)</option>
          {goals
            .filter((g) => !g.goalStatus || g.goalStatus === "active" || g._id === task.goalId)
            .map((g) => (
              <option key={g._id} value={g._id}>
                {g.title}
              </option>
            ))}
        </select>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!task.delegate} onChange={(e) => onUpdate({ delegate: e.target.checked })} className="size-4 accent-[var(--primary)]" />
        Should not be me — <span className="text-muted-foreground">record it next time (Delegation)</span>
      </label>
      {(task.deferCount ?? 0) >= 3 && (
        <p className="rounded-md bg-warning-soft px-2 py-1.5 text-xs text-warning">
          Moved {task.deferCount}× — keep, schedule for real, or drop it?
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function AttachmentRow({
  att,
  onRemove,
}: {
  att: Attachment;
  onRemove: () => void;
}) {
  const url = useQuery(api.files.getUrl, {
    storageId: att.storageId as Id<"_storage">,
  });
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
      <FileText className="h-4 w-4 text-primary" />
      <a
        href={url ?? undefined}
        target="_blank"
        rel="noreferrer"
        className="flex-1 truncate hover:text-primary"
      >
        {att.name}
      </a>
      <button onClick={onRemove} className="text-muted-foreground hover:text-danger">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
