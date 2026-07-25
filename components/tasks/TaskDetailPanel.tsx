"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
} from "lucide-react";
import { SlashEditor } from "@/components/editor/SlashEditor";
import { MarkdownLite } from "./MarkdownLite";
import { AddToMomentum } from "@/components/momentum/AddToMomentum";
import { TaskTimerButton } from "./TaskTimerButton";
import { DuplicateTaskModal } from "./DuplicateTaskModal";
import { cn } from "@/lib/utils";

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
  { key: "high", label: "High", cls: "data-[on=true]:bg-warning/20 data-[on=true]:text-warning" },
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
  const sections = useQuery(api.sections.list, {});
  const update = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const time = useQuery(api.focus.byTask, { taskId: id });
  const logManual = useMutation(api.focus.logManual);
  const removeSession = useMutation(api.focus.remove);

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
        <p className="text-sm text-muted-foreground">
          {task === null ? "Task not found." : "Loading…"}
        </p>
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
      const { storageId } = await res.json();
      await update({
        id,
        attachments: [
          ...attachments,
          { storageId, name: file.name, contentType: file.type, size: file.size },
        ],
      });
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
        className="w-full bg-transparent text-lg font-bold outline-none"
      />

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <TaskTimerButton task={task} />
        <AddToMomentum type="task" itemId={id} title={task.title} compact />
      </div>

      {/* Status */}
      <Field label="Status">
        <div className="flex gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              data-on={task.status === s.key}
              onClick={() => void update({ id, status: s.key })}
              className="rounded-full border border-border px-3 py-1 text-xs data-[on=true]:border-transparent data-[on=true]:bg-primary data-[on=true]:text-primary-foreground"
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
                "rounded-full border border-border px-3 py-1 text-xs",
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
            className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-sm outline-none"
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
            className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-sm outline-none"
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

      {/* Start (optional) — date + time, separate */}
      <Field label="Start">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={dateOf(task.startAt)}
            onChange={(e) => setStart(e.target.value, timeOf(task.startAt))}
            className="rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-sm outline-none [color-scheme:dark]"
          />
          <input
            type="time"
            value={timeOf(task.startAt)}
            onChange={(e) => setStart(dateOf(task.startAt), e.target.value)}
            className="rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-sm outline-none [color-scheme:dark]"
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
            className="rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-sm outline-none [color-scheme:dark]"
          />
          <input
            type="time"
            value={timeOf(task.dueDate)}
            onChange={(e) => setDue(dateOf(task.dueDate), e.target.value)}
            className="rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-sm outline-none [color-scheme:dark]"
          />
        </div>
      </Field>

      {/* Tags */}
      <Field label="Tags">
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs text-primary"
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
              <div className="absolute z-20 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                <button
                  onClick={() => {
                    setAddOpen(false);
                    fileRef.current?.click();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Paperclip className="h-4 w-4" /> Upload PDF / doc / image
                </button>
                <button
                  onClick={() => {
                    setAddOpen(false);
                    setEditing(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
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
            className="flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/25"
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
            className="w-16 rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-sm outline-none"
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
            }
            className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/70"
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
                  className="text-muted-foreground opacity-0 transition hover:text-warning group-hover:opacity-100"
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
            await removeTask({ id });
            if (onClose) onClose();
            else router.push("/tasks");
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-warning"
        >
          <Trash2 className="h-4 w-4" /> Delete task
        </button>
      </div>

      {dupOpen && (
        <DuplicateTaskModal task={task} onClose={() => setDupOpen(false)} />
      )}
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
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8">
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
      ? "absolute left-1/2 top-1/2 flex max-h-[88vh] w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl"
      : "absolute right-0 top-0 flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-border bg-background p-6 shadow-2xl";

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={frame}>
        <div className="flex items-center justify-between">
          <ViewSwitcher view={view} setView={setView} taskId={taskId} onClose={onClose} />
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
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
    <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm">
      <FileText className="h-4 w-4 text-primary" />
      <a
        href={url ?? "#"}
        target="_blank"
        rel="noreferrer"
        className="flex-1 truncate hover:text-primary"
      >
        {att.name}
      </a>
      <button onClick={onRemove} className="text-muted-foreground hover:text-warning">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
