"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Trash2,
  Plus,
  X,
  Zap,
  CalendarClock,
  CheckSquare,
  Target,
  StickyNote,
  FileText,
  Paperclip,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Card, Topbar, EmptyState } from "@/components/ui";
import { DetailSkeleton } from "@/components/Skeleton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AddToMomentum } from "@/components/momentum/AddToMomentum";
import { MarkdownLite } from "@/components/tasks/MarkdownLite";
import { extractPdfText } from "@/lib/pdf";
import { cn } from "@/lib/utils";

const STATUS = ["planning", "active", "blocked", "completed"] as const;
const DAY = 24 * 60 * 60 * 1000;

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"projects">;
  const router = useRouter();

  const data = useQuery(api.projects.detail, { id });
  const areas = useQuery(api.lifeAreas.list);
  const update = useMutation(api.projects.update);
  const removeProject = useMutation(api.projects.remove);
  const addMilestone = useMutation(api.projects.addMilestone);
  const toggleMilestone = useMutation(api.projects.toggleMilestone);
  const removeMilestone = useMutation(api.projects.removeMilestone);
  const createTask = useMutation(api.tasks.create);
  const setStatus = useMutation(api.tasks.setStatus);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const genPlan = useAction(api.projects.generateSprintPlan);

  const [taskTitle, setTaskTitle] = useState("");
  const [ms, setMs] = useState("");
  const [planning, setPlanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (data === undefined)
    return (
      <div>
        <Topbar />
        <DetailSkeleton />
      </div>
    );
  if (data === null)
    return (
      <div>
        <Topbar />
        <div className="px-8 py-7">
          <EmptyState title="Project not found" />
        </div>
      </div>
    );

  const { project, tasks, goals, notes } = data;
  const isSprint = project.kind === "sprint";
  const milestones = project.milestones ?? [];
  const attachments = project.attachments ?? [];

  // countdown
  const now = Date.now();
  const daysLeft =
    project.endDate != null ? Math.ceil((project.endDate - now) / DAY) : null;
  const timePct =
    project.startDate != null && project.endDate != null
      ? Math.min(100, Math.max(0, ((now - project.startDate) / (project.endDate - project.startDate)) * 100))
      : 0;

  function addTask() {
    if (!taskTitle.trim()) return;
    void createTask({
      title: taskTitle.trim(),
      priority: "med",
      lifeAreaId: project.lifeAreaId,
      projectId: id,
    });
    setTaskTitle("");
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      // Extract text from PDFs so the AI planner can read them.
      const text = await extractPdfText(file);
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
          {
            storageId,
            name: file.name,
            contentType: file.type,
            size: file.size,
            text: text || undefined,
          },
        ],
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Topbar />
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
      <div className="px-8 py-7">
        <Breadcrumb
          items={[
            { label: "Projects", href: "/projects" },
            { label: project.title },
          ]}
        />

        {/* Header */}
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isSprint && (
                <span className="flex items-center gap-1 rounded-full bg-sprint/15 px-2.5 py-0.5 text-xs font-semibold text-sprint">
                  <Zap className="h-3 w-3" /> SPRINT
                </span>
              )}
              <Link
                href={`/life-areas/${project.lifeAreaId}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                {areas?.find((a) => a._id === project.lifeAreaId)?.name}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <input
              defaultValue={project.title}
              onBlur={(e) =>
                e.target.value.trim() &&
                e.target.value !== project.title &&
                update({ id, title: e.target.value.trim() })
              }
              className="mt-1 w-full bg-transparent text-2xl font-bold tracking-tight outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <AddToMomentum type="project" itemId={id} title={project.title} />
            <button
              onClick={async () => {
                await removeProject({ id });
                router.push("/projects");
              }}
              className="text-muted-foreground hover:text-warning"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sprint hero */}
        {isSprint && (
          <Card className="mt-5 border-sprint/30 bg-sprint/5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-3xl font-bold text-sprint">
                    {daysLeft != null ? Math.max(0, daysLeft) : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">days left</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4" />
                    {project.durationDays}-day sprint
                  </div>
                  {project.startDate && project.endDate && (
                    <div className="mt-1 text-xs">
                      {new Date(project.startDate).toLocaleDateString()} →{" "}
                      {new Date(project.endDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-[40%] flex-1">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Time elapsed</span>
                  <span>{Math.round(timePct)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-sprint transition-all"
                    style={{ width: `${timePct}%` }}
                  />
                </div>
                <div className="mt-2 mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Milestone progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Outcome
              </p>
              <input
                defaultValue={project.outcome ?? ""}
                onBlur={(e) => update({ id, outcome: e.target.value })}
                placeholder="What does success look like by the end?"
                className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-sprint/60"
              />
            </div>
          </Card>
        )}

        {/* Standard status/progress */}
        {!isSprint && (
          <Card className="mt-5">
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={project.status}
                onChange={(e) =>
                  void update({
                    id,
                    status: e.target.value as (typeof STATUS)[number],
                  })
                }
                className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm capitalize outline-none"
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="flex flex-1 items-center gap-2">
                <span className="text-xs text-muted-foreground">Progress</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={project.progress}
                  onChange={(e) =>
                    void update({ id, progress: Number(e.target.value) })
                  }
                  className="flex-1 accent-[hsl(var(--primary))]"
                />
                <span className="w-9 text-right text-xs font-medium">
                  {project.progress}%
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Content grid */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Tasks (synced to main module) */}
          <Card>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <CheckSquare className={cn("h-4 w-4", isSprint ? "text-sprint" : "text-primary")} /> Tasks ({tasks.length})
              <span className="ml-auto text-[10px] font-normal text-muted-foreground">
                synced to Tasks module
              </span>
            </h3>
            <form
              className="mb-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addTask();
              }}
            >
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Add a task…"
                className="flex-1 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
              <button className="rounded-lg bg-muted px-3 py-2 text-sm font-medium">
                Add
              </button>
            </form>
            <div className="space-y-1.5">
              {tasks.map((t) => (
                <div key={t._id} className="flex items-center gap-2.5">
                  <button
                    onClick={() =>
                      void setStatus({
                        id: t._id,
                        status: t.status === "done" ? "not_started" : "done",
                      })
                    }
                    className={cn(
                      "h-4 w-4 shrink-0 rounded-full border-2",
                      t.status === "done"
                        ? "border-primary bg-primary"
                        : "border-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm",
                      t.status === "done" && "text-muted-foreground line-through",
                    )}
                  >
                    {t.title}
                  </span>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-xs text-muted-foreground">No tasks yet.</p>
              )}
            </div>
          </Card>

          {/* Milestones (sprint) or Goals (standard) */}
          {isSprint ? (
            <Card>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4 text-sprint" /> Milestones (
                {milestones.filter((m) => m.done).length}/{milestones.length})
              </h3>
              <div className="space-y-1.5">
                {milestones.map((m, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2"
                  >
                    <button
                      onClick={() => void toggleMilestone({ id, index: i })}
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                        m.done
                          ? "border-sprint bg-sprint text-white"
                          : "border-muted-foreground",
                      )}
                    >
                      {m.done ? "✓" : ""}
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        m.done && "text-muted-foreground line-through",
                      )}
                    >
                      {m.text}
                    </span>
                    <button
                      onClick={() => void removeMilestone({ id, index: i })}
                      className="text-muted-foreground opacity-0 transition hover:text-warning group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!ms.trim()) return;
                  void addMilestone({ id, text: ms.trim() });
                  setMs("");
                }}
              >
                <input
                  value={ms}
                  onChange={(e) => setMs(e.target.value)}
                  placeholder="Add milestone…"
                  className="flex-1 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm outline-none focus:border-sprint/60"
                />
                <button className="rounded-lg bg-muted px-3 py-2 text-sm font-medium">
                  Add
                </button>
              </form>
            </Card>
          ) : (
            <Card>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4 text-primary" /> Goals ({goals.length})
              </h3>
              {goals.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nothing linked.</p>
              ) : (
                <ul className="space-y-1.5">
                  {goals.map((g) => (
                    <li key={g._id} className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
                      {g.title}{" "}
                      <span className="text-xs text-muted-foreground">— {g.progress}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {/* Document library (sprint) */}
          {isSprint && (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4 text-sprint" /> Documents & notes
                </h3>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
              <div className="space-y-1.5">
                {attachments.map((a) => (
                  <AttachmentRow key={a.storageId} att={a} />
                ))}
                {notes.map((n) => (
                  <div
                    key={n._id}
                    className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm"
                  >
                    <StickyNote className="h-4 w-4 text-muted-foreground" />
                    {n.title}
                  </div>
                ))}
                {attachments.length === 0 && notes.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Upload course PDFs/docs, or link notes to this sprint.
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* AI plan (sprint) or Notes (standard) */}
          {isSprint ? (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-sprint" /> AI learning plan
                </h3>
                <button
                  onClick={async () => {
                    setPlanning(true);
                    try {
                      await genPlan({ id });
                    } finally {
                      setPlanning(false);
                    }
                  }}
                  disabled={planning}
                  className="rounded-lg bg-sprint px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  {planning ? "Analyzing…" : project.aiPlan ? "Regenerate" : "Analyze & plan"}
                </button>
              </div>
              {project.aiPlan ? (
                <div className="max-h-80 overflow-y-auto rounded-lg bg-muted/20 p-3">
                  <MarkdownLite text={project.aiPlan} />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Upload your course PDFs/notes and set an outcome, then let AI
                  break the material into a day-by-day schedule. PDFs marked
                  &ldquo;AI-readable&rdquo; are included automatically.
                </p>
              )}
            </Card>
          ) : (
            <Card>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <StickyNote className="h-4 w-4 text-primary" /> Notes ({notes.length})
              </h3>
              {notes.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nothing linked.</p>
              ) : (
                <ul className="space-y-1.5">
                  {notes.map((n) => (
                    <li key={n._id} className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
                      {n.title}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function AttachmentRow({
  att,
}: {
  att: { storageId: Id<"_storage">; name: string; text?: string };
}) {
  const url = useQuery(api.files.getUrl, { storageId: att.storageId });
  return (
    <a
      href={url ?? "#"}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm hover:text-sprint"
    >
      <FileText className="h-4 w-4 text-sprint" />
      <span className="flex-1 truncate">{att.name}</span>
      {att.text && (
        <span className="flex items-center gap-1 rounded-full bg-sprint/15 px-2 py-0.5 text-[10px] text-sprint">
          <Sparkles className="h-2.5 w-2.5" /> AI-readable
        </span>
      )}
    </a>
  );
}
