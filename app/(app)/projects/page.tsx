"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Zap, FolderKanban, Plus, Target, Handshake, Building2, AlertTriangle, ArrowRight, Timer, CheckCircle2, Layers,
} from "lucide-react";
import {
  PageShell, Segmented, Kanban, ItemCard, Dialog, Chip, Bar, EmptyHint, Select, TextInput, Field, AreaDot, areaColor,
  cn, buttonVariants, type KanbanColumn,
} from "@/components/os/kit";
import { toast, reward, errorMessage } from "@/components/os/celebrate";
import { useStable } from "@/components/os/useCockpit";
import { NextActionForm } from "@/components/projects/NextActionForm";
import { addDaysYmd, dateOf, fmtMin, mondayOf, relDay, useToday } from "@/lib/day";

type Board = FunctionReturnType<typeof api.projects.board>;
type Row = Board["projects"][number];
type Status = "planning" | "active" | "blocked" | "completed";

const COLUMNS: KanbanColumn[] = [
  { key: "active", label: "Active", hint: "Doing now — capped so finishing beats starting." },
  { key: "planning", label: "Planning", hint: "Shaping the outcome and first steps." },
  { key: "blocked", label: "Blocked", hint: "Waiting on someone or something." },
  { key: "completed", label: "Done", hint: "Shipped. Archive of wins." },
];
const DURATIONS = [15, 30, 60, 90];

/**
 * Projects — GTD projects / PARA projects on a Personal Kanban. Each one
 * belongs to one Life Area, serves at most one goal, and should always have
 * a next action. Client delivery projects link back to their deal/company.
 */
export default function ProjectsPage() {
  const today = useToday();
  const weekStart = mondayOf(today);
  const args = useMemo(
    () => ({ weekStartMs: dateOf(weekStart).getTime(), weekEndMs: dateOf(addDaysYmd(weekStart, 7)).getTime() }),
    [weekStart],
  );
  const board = useStable(useQuery(api.projects.board, args));
  const update = useMutation(api.projects.update);
  const createProject = useMutation(api.projects.create);
  const createTask = useMutation(api.tasks.create);
  const router = useRouter();

  const [kind, setKind] = useState<"all" | "standard" | "sprint">("all");
  const [area, setArea] = useState("");
  const [modal, setModal] = useState<null | "choose" | "standard" | "sprint">(null);
  const [nextFor, setNextFor] = useState<Row | null>(null);
  const [showAllDone, setShowAllDone] = useState(false);

  const rows = useMemo(
    () => (board?.projects ?? []).filter((p) => (kind === "all" || p.kind === kind) && (!area || p.lifeAreaId === area)),
    [board, kind, area],
  );
  const active = (board?.projects ?? []).filter((p) => p.status === "active");
  const cap = board?.maxActiveProjects ?? 5;
  const noNext = rows.filter((p) => (p.status === "active" || p.status === "blocked") && !p.nextAction);
  const done = rows.filter((p) => p.status === "completed");
  const shownRows = showAllDone ? rows : rows.filter((p) => p.status !== "completed" || done.slice(0, 8).includes(p));

  async function move(p: Row, to: string) {
    const status = to as Status;
    try {
      await update({ id: p._id, status });
      if (status === "completed") reward(`Project shipped: ${p.title}`, undefined, true);
      else if (status === "active" && active.length >= cap)
        toast(`${active.length + 1} active projects — over your cap of ${cap}. Consider pausing one.`, { tone: "warning" });
      else toast(`Moved to ${COLUMNS.find((c) => c.key === status)?.label}`);
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    }
  }

  return (
    <PageShell
      title="Projects"
      icon={FolderKanban}
      subtitle="Multi-step outcomes. Each lives in one Life Area, serves at most one goal, and always has a next action."
      actions={
        <button onClick={() => setModal("choose")} className={buttonVariants()}>
          <Plus /> New project
        </button>
      }
    >
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          options={[
            { value: "all" as const, label: "All" },
            { value: "standard" as const, label: "Projects", icon: FolderKanban },
            { value: "sprint" as const, label: "Sprints", icon: Zap },
          ]}
          value={kind}
          onChange={setKind}
        />
        <Select value={area} onChange={(e) => setArea(e.target.value)} className="w-auto min-w-40" aria-label="Filter by life area">
          <option value="">All life areas</option>
          {(board?.areas ?? []).map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </Select>
        {board && (
          <span className={cn("ml-auto text-sm tabular-nums", active.length > cap ? "text-warning" : "text-muted-foreground")}>
            <b>{active.length}</b> / {cap} active
          </span>
        )}
      </div>

      {/* WIP cap (Personal Kanban): finishing beats starting */}
      {board && active.length > cap && (
        <div className="mt-4 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          <b>{active.length} active projects</b> — your cap is {cap}. Finish or move one to Planning before starting another; parallel work is slow work.
        </div>
      )}

      {/* Weekly-review check: every active project has a next action */}
      {noNext.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card px-4 py-3 shadow-card">
          <p className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-warning" />
            {noNext.length} active project{noNext.length === 1 ? " has" : "s have"} no next action
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">A project without a next action is a wish. Add the very next physical step.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {noNext.map((p) => (
              <button key={p._id} onClick={() => setNextFor(p)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Plus /> {p.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        {board === undefined ? (
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-72 w-72 shrink-0" />
            ))}
          </div>
        ) : board.projects.length === 0 ? (
          <EmptyHint
            icon={FolderKanban}
            title="No projects yet"
            hint="A project is any outcome that takes more than one step — a client delivery, a launch, a sprint. Give it an area, a goal and a next action."
            action={
              <button onClick={() => setModal("choose")} className={buttonVariants({ size: "sm" })}>
                <Plus /> New project
              </button>
            }
          />
        ) : (
          <>
            <Kanban
              columns={COLUMNS.map((c) =>
                c.key === "active" ? { ...c, label: `Active · ${active.length}/${cap}`, tone: active.length > cap ? "warning" : undefined } : c,
              )}
              items={shownRows}
              columnOf={(p) => p.status}
              onMove={(p, to) => void move(p, to)}
              renderCard={(p) => (
                <ProjectCard
                  p={p}
                  today={today}
                  onOpen={() => router.push(`/projects/${p._id}`)}
                  onAddNext={() => setNextFor(p)}
                />
              )}
              footer={(col) =>
                col.key === "completed" && done.length > 8 ? (
                  <button onClick={() => setShowAllDone((s) => !s)} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full")}>
                    {showAllDone ? "Show recent only" : `Show all ${done.length}`}
                  </button>
                ) : col.key === "planning" ? (
                  <button onClick={() => setModal("standard")} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full justify-start text-muted-foreground")}>
                    <Plus /> Add project
                  </button>
                ) : null
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">Drag a card between columns to change its status.</p>
          </>
        )}
      </div>

      {/* Add next action */}
      <Dialog open={!!nextFor} onClose={() => setNextFor(null)} title="Add the next action" size="sm">
        {nextFor && (
          <NextActionForm
            project={nextFor}
            today={today}
            onCreate={async (title, when) => {
              try {
                await createTask({
                  title,
                  priority: "med",
                  lifeAreaId: nextFor.lifeAreaId,
                  projectId: nextFor._id,
                  goalId: nextFor.goal?._id,
                  plannedFor: when === "today" ? today : when === "tomorrow" ? addDaysYmd(today, 1) : undefined,
                });
                toast("Next action added", { tone: "success" });
                setNextFor(null);
              } catch (e) {
                toast(errorMessage(e), { tone: "warning" });
              }
            }}
          />
        )}
      </Dialog>

      {/* Create */}
      <Dialog open={modal === "choose"} onClose={() => setModal(null)} title="Create new…">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button onClick={() => setModal("standard")} className="rounded-xl border border-border p-4 text-left transition hover:border-ring">
            <FolderKanban className="mb-2 h-6 w-6" />
            <p className="font-semibold">Project</p>
            <p className="mt-1 text-xs text-muted-foreground">An outcome in one Life Area — tasks, notes, an optional goal.</p>
          </button>
          <button onClick={() => setModal("sprint")} className="rounded-xl border border-sprint/40 bg-sprint/5 p-4 text-left transition hover:border-ring">
            <Zap className="mb-2 h-6 w-6 text-sprint" />
            <p className="font-semibold">Sprint</p>
            <p className="mt-1 text-xs text-muted-foreground">Time-boxed push (15–90 days) with countdown, docs & AI plan.</p>
          </button>
        </div>
      </Dialog>
      <Dialog open={modal === "standard" || modal === "sprint"} onClose={() => setModal(null)} title={modal === "sprint" ? "New sprint" : "New project"}>
        {(modal === "standard" || modal === "sprint") && board && (
          <CreateForm
            kind={modal}
            areas={board.areas}
            goals={board.goals.filter((g) => g.goalStatus !== "achieved")}
            defaultArea={area}
            onCreate={async (vals) => {
              try {
                const id = await createProject({ ...vals, kind: modal });
                setModal(null);
                router.push(`/projects/${id}`);
              } catch (e) {
                toast(errorMessage(e), { tone: "warning" });
              }
            }}
          />
        )}
      </Dialog>
    </PageShell>
  );
}

function ProjectCard({ p, today, onOpen, onAddNext }: { p: Row; today: string; onOpen: () => void; onAddNext: () => void }) {
  const isSprint = p.kind === "sprint";
  const daysLeft = p.endDate != null ? Math.max(0, Math.ceil((p.endDate - Date.now()) / 86400000)) : null;
  const needsNext = (p.status === "active" || p.status === "blocked") && !p.nextAction;
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <ItemCard onClick={onOpen} className={cn("space-y-2", isSprint && "border-sprint/40")}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 font-semibold leading-snug">{p.title}</p>
        {isSprint && (
          <Chip tone="sprint" className="shrink-0">
            <Zap /> {daysLeft != null ? `${daysLeft}d` : "Sprint"}
          </Chip>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {p.area && (
          <Link href={`/life-areas/${p.area._id}`} onClick={stop} className="inline-flex items-center gap-1 rounded-md px-1 text-[11px] text-muted-foreground hover:text-foreground">
            <AreaDot color={areaColor(p.area)} /> {p.area.name}
          </Link>
        )}
        {p.goal && (
          <Link href={`/goals/${p.goal._id}`} onClick={stop} title={`Serves goal: ${p.goal.title}`} className="inline-flex max-w-full items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground">
            <Target className="h-3 w-3 shrink-0" /> <span className="truncate">{p.goal.level === "cycle" ? "12w · " : ""}{p.goal.title}</span>
          </Link>
        )}
        {p.deal && (
          <Link href={`/pipeline?deal=${p.deal._id}`} onClick={stop} className="inline-flex max-w-full items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground">
            <Handshake className="h-3 w-3 shrink-0" /> <span className="truncate">{p.deal.title}</span>
          </Link>
        )}
        {p.company && !p.deal && (
          <Link href={`/companies/${p.company._id}`} onClick={stop} className="inline-flex max-w-full items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground">
            <Building2 className="h-3 w-3 shrink-0" /> <span className="truncate">{p.company.name}</span>
          </Link>
        )}
      </div>
      <div>
        <Bar value={p.progress} tone={isSprint ? "sprint" : p.status === "completed" ? "success" : "primary"} />
        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>
            {p.taskDone}/{p.taskTotal} tasks · {p.progress}%
          </span>
          {p.focusWeekMin > 0 && (
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3 w-3" /> {fmtMin(p.focusWeekMin)} this week
            </span>
          )}
        </div>
      </div>
      {p.status !== "completed" &&
        (p.nextAction ? (
          <div className="flex items-start gap-1.5 rounded-md bg-muted/60 px-2 py-1.5 text-xs">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="text-muted-foreground">Next: </span>
              <span className="font-medium">{p.nextAction.title}</span>
              {p.nextAction.plannedFor && <span className="text-muted-foreground"> · {relDay(p.nextAction.plannedFor, today).toLowerCase()}</span>}
            </span>
          </div>
        ) : needsNext ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddNext();
            }}
            className="flex w-full items-center gap-1.5 rounded-md border border-dashed border-warning/50 bg-warning-soft px-2 py-1.5 text-left text-xs font-medium text-warning"
          >
            <AlertTriangle className="h-3 w-3 shrink-0" /> No next action — add one
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddNext();
            }}
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-3 w-3" /> Add next action
          </button>
        ))}
      {p.status === "completed" && (
        <p className="flex items-center gap-1 text-[11px] text-success">
          <CheckCircle2 className="h-3 w-3" /> Shipped
        </p>
      )}
    </ItemCard>
  );
}

function CreateForm({
  kind,
  areas,
  goals,
  defaultArea,
  onCreate,
}: {
  kind: "standard" | "sprint";
  areas: { _id: Id<"lifeAreas">; name: string }[];
  goals: { _id: Id<"goals">; title: string; level: string | null; lifeAreaId: Id<"lifeAreas"> }[];
  defaultArea: string;
  onCreate: (v: {
    title: string;
    lifeAreaId: Id<"lifeAreas">;
    goalId?: Id<"goals">;
    outcome?: string;
    durationDays?: number;
    startDate?: number;
  }) => void | Promise<void>;
}) {
  const today = useToday();
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState(defaultArea || areas[0]?._id || "");
  const [goalId, setGoalId] = useState("");
  const [outcome, setOutcome] = useState("");
  const [duration, setDuration] = useState(30);
  const [start, setStart] = useState(today);
  const isSprint = kind === "sprint";
  const areaGoals = goals.filter((g) => !areaId || g.lifeAreaId === areaId);
  const otherGoals = goals.filter((g) => areaId && g.lifeAreaId !== areaId);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !areaId || (isSprint && duration < 1)) return;
        void onCreate({
          title: title.trim(),
          lifeAreaId: areaId as Id<"lifeAreas">,
          goalId: goalId ? (goalId as Id<"goals">) : undefined,
          ...(isSprint
            ? { outcome: outcome.trim() || undefined, durationDays: duration, startDate: start ? new Date(start + "T09:00:00").getTime() : undefined }
            : {}),
        });
      }}
    >
      <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isSprint ? "Sprint name (e.g. Sales Mastery — 30 days)" : "Project outcome (e.g. Acme website delivered)"} />
      {isSprint && (
        <textarea
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="Outcome — what does success look like by the end?"
          rows={2}
          className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
        />
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Life area (one)">
          <Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">Select…</option>
            {areas.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Serves goal (optional)">
          <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">None — maintenance project</option>
            {areaGoals.map((g) => (
              <option key={g._id} value={g._id}>
                {g.level === "cycle" ? "12w · " : g.level === "annual" ? "Year · " : ""}
                {g.title}
              </option>
            ))}
            {otherGoals.length > 0 && (
              <optgroup label="Other areas">
                {otherGoals.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.title}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        </Field>
      </div>
      {isSprint && (
        <>
          <Field label="Duration">
            <div className="flex flex-wrap items-center gap-2">
              {DURATIONS.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDuration(d)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm",
                    duration === d ? "border-transparent bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {d} days
                </button>
              ))}
              <input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="h-9 w-20 rounded-md border border-input bg-card px-3 text-sm shadow-xs" aria-label="Custom duration" />
            </div>
          </Field>
          <Field label="Start">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs" />
          </Field>
        </>
      )}
      {!areas.length && (
        <p className="text-xs text-muted-foreground">
          Create a <Link href="/life-areas" className="underline">Life Area</Link> first.
        </p>
      )}
      <button disabled={!title.trim() || !areaId || (isSprint && !(duration >= 1))} className={cn(buttonVariants(), "w-full")}>
        {isSprint ? "Launch sprint" : "Create project"}
      </button>
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Layers className="h-3 w-3" /> Next: add a next action so it shows up in your plan.
      </p>
    </form>
  );
}
