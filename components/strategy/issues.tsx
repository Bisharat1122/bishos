"use client";

/**
 * Issues list worked with IDS (Identify → Discuss → Solve): top-3 strip,
 * quick add, board, detail drawer and the solve dialog (optional task).
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Ban, CheckCircle2, CircleDot, ListChecks, MessagesSquare, Plus, RotateCcw, Siren, Star, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Chip,
  Dialog,
  Drawer,
  EmptyHint,
  Field,
  InlineEdit,
  Kanban,
  Segmented,
  Select,
  TextArea,
  TextInput,
  buttonVariants,
  cn,
  type KanbanColumn,
} from "@/components/os/kit";
import { errorMessage, reward, toast } from "@/components/os/celebrate";
import { fmtYmd, ymdOf } from "@/lib/day";
import { PRIORITY_META } from "./lib";
import { AutoText, CardButton, NoSubmit } from "./viz";

export type IssueList = FunctionReturnType<typeof api.decisions.listIssues>;
type Issue = Doc<"issues">;
type IssueStatus = Issue["status"];

const STATUS_LABEL: Record<IssueStatus, string> = { open: "Identify", discussing: "Discuss", solved: "Solved", dropped: "Dropped" };

function PriorityPicker({ value, onChange }: { value: number; onChange: (p: number) => void }) {
  // NoSubmit: used inside the quick-add <form>, where the kit Segmented's untyped
  // buttons would otherwise submit the form (creating the issue with the old priority).
  return (
    <NoSubmit>
      <Segmented
        size="sm"
        value={String(value) as "1" | "2" | "3"}
        onChange={(v) => onChange(Number(v))}
        options={[
          { value: "1", label: "P1" },
          { value: "2", label: "P2" },
          { value: "3", label: "P3" },
        ]}
      />
    </NoSubmit>
  );
}

const failToast = (fallback: string) => (err: unknown) => toast(errorMessage(err, fallback), { tone: "warning" });

/** The whole Issues tab. `initialOpenId` (from ?issue=<id>) opens that issue's drawer. */
export function IssuesPanel({ data, today, initialOpenId }: { data: IssueList; today: string; initialOpenId?: string | null }) {
  const create = useMutation(api.decisions.createIssue);
  const setStatus = useMutation(api.decisions.setIssueStatus);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(2);
  const [showDropped, setShowDropped] = useState(false);
  const [openId, setOpenId] = useState<Id<"issues"> | null>((initialOpenId as Id<"issues"> | null | undefined) ?? null);
  useEffect(() => {
    if (initialOpenId) setOpenId(initialOpenId as Id<"issues">);
  }, [initialOpenId]);
  const [solving, setSolving] = useState<Issue | null>(null);

  const top3 = new Set(data.top3 as string[]);
  const topIssues = data.top3.map((id) => data.items.find((i) => i._id === id)).filter((x): x is Issue => !!x);
  const dropped = data.items.filter((i) => i.status === "dropped");
  const solvedRecent = data.items.filter((i) => i.status === "solved").slice(0, 12);
  const boardItems = [...data.items.filter((i) => i.status === "open" || i.status === "discussing"), ...solvedRecent, ...(showDropped ? dropped : [])];
  const columns: KanbanColumn[] = [
    { key: "open", label: "Identify", hint: "Name the real issue in one line" },
    { key: "discussing", label: "Discuss", hint: "Dig for the root cause" },
    { key: "solved", label: "Solved", hint: "Recently solved", dot: "var(--success)" },
    // Always rendered so it's a drop target; the dropped cards themselves stay behind the toggle.
    {
      key: "dropped",
      label: "Dropped",
      dot: "var(--muted-foreground)",
      hint: !showDropped && dropped.length ? `${dropped.length} hidden: use "Dropped" above to show them` : "Issues you decided not to work on",
    },
  ];
  const openIssue = openId ? data.items.find((i) => i._id === openId) ?? null : null;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await create({ title, priority });
      setTitle("");
      toast("Issue added", { tone: "success" });
    } catch (err) {
      toast(errorMessage(err, "Could not add the issue"), { tone: "warning" });
    }
  }

  function move(i: Issue, to: string) {
    if (to === "solved") return setSolving(i);
    setStatus({ id: i._id, status: to as "open" | "discussing" | "dropped" }).catch(failToast("Could not move the issue"));
  }

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center">
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name an issue: a problem, obstacle, idea or opportunity…"
          className="flex-1"
          aria-label="New issue"
        />
        <div className="flex items-center gap-2">
          <PriorityPicker value={priority} onChange={setPriority} />
          <button type="submit" className={buttonVariants({ size: "sm" })}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </form>

      {topIssues.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Star className="h-3.5 w-3.5 text-warning" /> Top {topIssues.length}: solve these first
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {topIssues.map((i, n) => (
              <div key={i._id} className="os-rise relative flex flex-col rounded-xl border border-border bg-card p-4 shadow-card">
                <span className="absolute right-3 top-2 text-3xl font-semibold tabular-nums text-muted-foreground/30">{n + 1}</span>
                <div className="flex items-center gap-1.5">
                  <Chip tone={PRIORITY_META[i.priority]?.tone ?? "muted"}>{PRIORITY_META[i.priority]?.label ?? `P${i.priority}`}</Chip>
                  <Chip tone={i.status === "discussing" ? "info" : "outline"}>{STATUS_LABEL[i.status]}</Chip>
                </div>
                <button type="button" onClick={() => setOpenId(i._id)} className="mt-2 pr-6 text-left font-medium leading-snug hover:underline">
                  {i.title}
                </button>
                {i.rootCause && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">Root cause: {i.rootCause}</p>}
                <div className="mt-auto flex gap-2 pt-3">
                  {i.status === "open" && (
                    <button
                      type="button"
                      onClick={() => setStatus({ id: i._id, status: "discussing" }).catch(failToast("Could not move the issue"))}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      <MessagesSquare className="h-3.5 w-3.5" /> Discuss
                    </button>
                  )}
                  <button type="button" onClick={() => setSolving(i)} className={buttonVariants({ size: "sm" })}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Solve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.items.length === 0 ? (
        <EmptyHint
          icon={Siren}
          title="No issues on the list"
          hint="Anything blocking the business goes here: a client problem, a broken process, an opportunity. Work the top 3 each week: Identify, Discuss, Solve."
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {data.openCount} open · {data.solvedCount} solved all-time
            </p>
            {dropped.length > 0 && (
              <button type="button" onClick={() => setShowDropped((s) => !s)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <Ban className="h-3.5 w-3.5" />
                {showDropped ? "Hide dropped" : `Dropped (${dropped.length})`}
              </button>
            )}
          </div>
          <Kanban
            columns={columns}
            items={boardItems}
            columnOf={(i) => i.status}
            onMove={move}
            renderCard={(i) => (
              <CardButton onClick={() => setOpenId(i._id)} label={`Open issue: ${i.title}`} className={cn("space-y-1.5", i.status === "solved" && "opacity-80")}>
                <div className="flex items-center gap-1.5">
                  <Chip tone={PRIORITY_META[i.priority]?.tone ?? "muted"}>{PRIORITY_META[i.priority]?.label ?? `P${i.priority}`}</Chip>
                  {top3.has(i._id) && (
                    <span title="Top 3" className="text-warning">
                      <Star className="h-3.5 w-3.5 fill-current" />
                    </span>
                  )}
                  {i.taskId && (
                    <Chip tone="info" className="ml-auto">
                      <ListChecks /> Task
                    </Chip>
                  )}
                </div>
                <p className={cn("font-medium leading-snug", i.status === "solved" && "os-done-text")}>{i.title}</p>
                {i.status === "solved" && i.solution ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">✓ {i.solution}</p>
                ) : i.rootCause ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">Root cause: {i.rootCause}</p>
                ) : null}
              </CardButton>
            )}
          />
        </>
      )}

      <IssueDrawer issue={openIssue} onClose={() => setOpenId(null)} onSolve={(i) => setSolving(i)} />
      <SolveDialog issue={solving} onClose={() => setSolving(null)} today={today} />
    </div>
  );
}

function IssueDrawer({ issue, onClose, onSolve }: { issue: Issue | null; onClose: () => void; onSolve: (i: Issue) => void }) {
  const update = useMutation(api.decisions.updateIssue);
  const setStatus = useMutation(api.decisions.setIssueStatus);
  const remove = useMutation(api.decisions.removeIssue);
  if (!issue) return null;
  const i = issue;
  const save = (patch: Omit<Parameters<typeof update>[0], "id">) =>
    update({ id: i._id, ...patch }).catch(failToast("Could not save"));
  const move = (status: "open" | "discussing" | "dropped") => setStatus({ id: i._id, status }).catch(failToast("Could not move the issue"));
  const active = i.status === "open" || i.status === "discussing";
  return (
    <Drawer
      open
      onClose={onClose}
      title={STATUS_LABEL[i.status]}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Delete this issue?")) return;
              try {
                await remove({ id: i._id });
                toast("Issue deleted");
                onClose();
              } catch (err) {
                failToast("Could not delete")(err);
              }
            }}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          <div className="flex flex-wrap gap-2">
            {active ? (
              <>
                <button type="button" onClick={() => void move("dropped")} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  <Ban className="h-3.5 w-3.5" /> Drop
                </button>
                {i.status === "open" ? (
                  <button type="button" onClick={() => void move("discussing")} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <MessagesSquare className="h-3.5 w-3.5" /> Discuss
                  </button>
                ) : (
                  <button type="button" onClick={() => void move("open")} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <RotateCcw className="h-3.5 w-3.5" /> Back to Identify
                  </button>
                )}
                <button type="button" onClick={() => onSolve(i)} className={buttonVariants({ size: "sm" })}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Solve
                </button>
              </>
            ) : (
              <button type="button" onClick={() => void move("open")} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <RotateCcw className="h-3.5 w-3.5" /> Reopen
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <InlineEdit value={i.title} onSave={(v) => v.trim() && void save({ title: v })} className="text-lg font-semibold" />
        <div className="flex flex-wrap items-center gap-2">
          <PriorityPicker value={i.priority} onChange={(priority) => void save({ priority })} />
          {i.solvedAt && i.status === "solved" && <Chip tone="success">Solved {fmtYmd(ymdOf(i.solvedAt), { month: "short", day: "numeric" })}</Chip>}
          {i.taskId && (
            <Link href="/tasks" className="text-xs font-medium text-info hover:underline">
              Follow-up task created →
            </Link>
          )}
        </div>
        <Field label="Identify: what's really going on?">
          <AutoText multiline rows={3} value={i.description} onSave={(v) => void save({ description: v || null })} placeholder="Describe the issue and its impact" />
        </Field>
        <Field label="Discuss: root cause" hint="Ask “why?” until you hit something you can change.">
          <AutoText multiline rows={3} value={i.rootCause} onSave={(v) => void save({ rootCause: v || null })} />
        </Field>
        <Field label="Solve: the solution">
          <AutoText multiline rows={3} value={i.solution} onSave={(v) => void save({ solution: v || null })} placeholder="The decision or action that makes it go away" />
        </Field>
      </div>
    </Drawer>
  );
}

function SolveDialog({ issue, onClose, today }: { issue: Issue | null; onClose: () => void; today: string }) {
  const solve = useMutation(api.decisions.solveIssue);
  const areas = useQuery(api.lifeAreas.list);
  const [rootCause, setRootCause] = useState("");
  const [solution, setSolution] = useState("");
  const [makeTask, setMakeTask] = useState(true);
  const [taskTitle, setTaskTitle] = useState("");
  const [areaId, setAreaId] = useState("");
  const [plannedFor, setPlannedFor] = useState(today);
  const [busy, setBusy] = useState(false);
  const sortedAreas = useMemo(() => (areas ?? []).filter((a) => !a.archived).sort((a, b) => a.order - b.order), [areas]);

  useEffect(() => {
    if (!issue) return;
    setRootCause(issue.rootCause ?? "");
    setSolution(issue.solution ?? "");
    setMakeTask(true);
    setTaskTitle("");
    setAreaId(issue.lifeAreaId ?? "");
    setPlannedFor(today);
  }, [issue, today]);
  useEffect(() => {
    if (!areaId && sortedAreas[0]) setAreaId(sortedAreas[0]._id);
  }, [areaId, sortedAreas]);

  if (!issue) return null;
  const suggestedTask = solution.trim() ? solution.trim().split("\n")[0].slice(0, 120) : `Fix: ${issue.title}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!issue) return;
    setBusy(true);
    try {
      const r = await solve({
        id: issue._id,
        rootCause: rootCause || undefined,
        solution: solution || undefined,
        task: makeTask
          ? { title: taskTitle.trim() || suggestedTask, lifeAreaId: areaId ? (areaId as Id<"lifeAreas">) : undefined, plannedFor: plannedFor || undefined }
          : undefined,
        date: today,
      });
      reward(r.taskId ? "Issue solved · follow-up task created" : "Issue solved", r.xp || undefined, true);
      onClose();
    } catch (err) {
      toast(errorMessage(err, "Could not solve"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title="Solve this issue">
      <form onSubmit={submit} className="space-y-4">
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm font-medium">{issue.title}</p>
        <Field label="Root cause">
          <TextArea value={rootCause} onChange={(e) => setRootCause(e.target.value)} className="min-h-[60px]" placeholder="Why did this really happen?" />
        </Field>
        <Field label="Solution">
          <TextArea value={solution} onChange={(e) => setSolution(e.target.value)} className="min-h-[60px]" placeholder="What will you do (or have done)?" autoFocus />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={makeTask} onChange={(e) => setMakeTask(e.target.checked)} className="size-4 accent-[var(--foreground)]" />
          <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
          Create a follow-up task
        </label>
        {makeTask && (
          <div className="space-y-3 rounded-lg border border-border p-3">
            <Field label="Task">
              <TextInput value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder={suggestedTask} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Life Area">
                <Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                  {sortedAreas.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="When">
                <TextInput type="date" value={plannedFor} onChange={(e) => setPlannedFor(e.target.value)} />
              </Field>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "outline" })}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={buttonVariants()}>
            <CheckCircle2 className="h-4 w-4" /> Mark solved
          </button>
        </div>
      </form>
    </Dialog>
  );
}
