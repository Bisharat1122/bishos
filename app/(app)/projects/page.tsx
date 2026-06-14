"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Zap, FolderKanban, X, ArrowUpRight } from "lucide-react";
import { Card, Topbar, EmptyState, AddButton } from "@/components/ui";
import { cn } from "@/lib/utils";

type Status = "planning" | "active" | "blocked" | "completed";
const STATUS_META: Record<Status, { label: string; cls: string }> = {
  planning: { label: "Planning", cls: "bg-muted text-muted-foreground" },
  active: { label: "Active", cls: "bg-primary/15 text-primary" },
  blocked: { label: "Blocked", cls: "bg-warning/15 text-warning" },
  completed: { label: "Completed", cls: "bg-accent/15 text-accent" },
};
const DURATIONS = [15, 30, 60, 90];
const DAY = 24 * 60 * 60 * 1000;

export default function ProjectsPage() {
  const areas = useQuery(api.lifeAreas.list);
  const projects = useQuery(api.projects.list);
  const createProject = useMutation(api.projects.create);
  const router = useRouter();

  const [modal, setModal] = useState<null | "choose" | "standard" | "sprint">(null);

  const areaName = (id: Id<"lifeAreas">) =>
    areas?.find((a) => a._id === id)?.name;

  const standardProjects = projects?.filter((p) => p.kind !== "sprint") ?? [];
  const sprints = projects?.filter((p) => p.kind === "sprint") ?? [];

  return (
    <div>
      <Topbar action={<AddButton label="New Project" onClick={() => setModal("choose")} />} />
      <div className="px-4 py-7 sm:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Standard projects organize your life areas. Sprints are time-boxed pushes.
          </p>
        </div>

        {/* Sprints */}
        {sprints.length > 0 && (
          <>
            <h2 className="mt-8 mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sprint">
              <Zap className="h-4 w-4" /> Sprints
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sprints.map((p) => {
                const daysLeft =
                  p.endDate != null
                    ? Math.max(0, Math.ceil((p.endDate - Date.now()) / DAY))
                    : null;
                return (
                  <Link key={p._id} href={`/projects/${p._id}`}>
                    <div className="group h-full rounded-2xl border border-sprint/40 bg-sprint/5 p-4 transition hover:border-sprint">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs font-semibold text-sprint">
                          <Zap className="h-3 w-3" /> SPRINT
                        </span>
                        <span className="text-xs font-medium text-sprint">
                          {daysLeft != null ? `${daysLeft}d left` : ""}
                        </span>
                      </div>
                      <h3 className="mt-2 font-semibold">{p.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {areaName(p.lifeAreaId)} · {p.durationDays}-day · {p.taskDone}/
                        {p.taskTotal} tasks
                      </p>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-sprint"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Standard projects */}
        <h2 className="mt-8 mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <FolderKanban className="h-4 w-4" /> Projects
        </h2>
        {standardProjects.length === 0 ? (
          <EmptyState title="No projects yet" hint="Create one with New Project." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {standardProjects.map((p) => {
              const pct =
                p.taskTotal > 0
                  ? Math.round((p.taskDone / p.taskTotal) * 100)
                  : p.progress;
              return (
                <Link key={p._id} href={`/projects/${p._id}`}>
                  <div className="group h-full rounded-2xl border border-border bg-card p-4 transition hover:border-primary/60">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">{p.title}</h3>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          STATUS_META[p.status as Status].cls,
                        )}
                      >
                        {STATUS_META[p.status as Status].label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {areaName(p.lifeAreaId)} · {p.taskDone}/{p.taskTotal} tasks done
                    </p>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === "choose" && (
        <Modal onClose={() => setModal(null)} title="Create new…">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setModal("standard")}
              className="rounded-xl border border-border p-4 text-left transition hover:border-primary/60"
            >
              <FolderKanban className="mb-2 h-6 w-6 text-primary" />
              <p className="font-semibold">Standard Project</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ongoing project tied to a life area — tasks, goals, notes.
              </p>
            </button>
            <button
              onClick={() => setModal("sprint")}
              className="rounded-xl border border-sprint/40 bg-sprint/5 p-4 text-left transition hover:border-sprint"
            >
              <Zap className="mb-2 h-6 w-6 text-sprint" />
              <p className="font-semibold">Sprint</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Time-boxed push (15–90 days) with countdown, docs & AI plan.
              </p>
            </button>
          </div>
        </Modal>
      )}

      {modal === "standard" && (
        <StandardForm
          areas={areas}
          onClose={() => setModal(null)}
          onCreate={async (vals) => {
            const newId = await createProject({ ...vals, kind: "standard" });
            setModal(null);
            router.push(`/projects/${newId}`);
          }}
        />
      )}

      {modal === "sprint" && (
        <SprintForm
          areas={areas}
          onClose={() => setModal(null)}
          onCreate={async (vals) => {
            const newId = await createProject({ ...vals, kind: "sprint" });
            setModal(null);
            router.push(`/projects/${newId}`);
          }}
        />
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type AreaList = { _id: Id<"lifeAreas">; name: string }[] | undefined;

function StandardForm({
  areas,
  onClose,
  onCreate,
}: {
  areas: AreaList;
  onClose: () => void;
  onCreate: (v: { title: string; lifeAreaId: Id<"lifeAreas"> }) => void;
}) {
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState("");
  return (
    <Modal title="New standard project" onClose={onClose}>
      <div className="space-y-3">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project title…"
          className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
        />
        <select
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none"
        >
          <option value="">Life area…</option>
          {areas?.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>
        <button
          disabled={!title.trim() || !areaId}
          onClick={() =>
            onCreate({ title: title.trim(), lifeAreaId: areaId as Id<"lifeAreas"> })
          }
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Create project
        </button>
      </div>
    </Modal>
  );
}

function SprintForm({
  areas,
  onClose,
  onCreate,
}: {
  areas: AreaList;
  onClose: () => void;
  onCreate: (v: {
    title: string;
    lifeAreaId: Id<"lifeAreas">;
    outcome?: string;
    durationDays: number;
    startDate: number;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState("");
  const [outcome, setOutcome] = useState("");
  const [duration, setDuration] = useState(30);
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));

  return (
    <Modal title="New sprint" onClose={onClose}>
      <div className="space-y-3">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sprint name (e.g. Charlie Morgan — Sales Mastery)"
          className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-sprint/60"
        />
        <textarea
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="Outcome — what does success look like by the end?"
          rows={2}
          className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-sprint/60"
        />
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Duration
          </p>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm",
                  duration === d
                    ? "border-transparent bg-sprint text-white"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {d} days
              </button>
            ))}
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-20 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-sm outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Start
            </p>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none [color-scheme:dark]"
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Life area
            </p>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none"
            >
              <option value="">Select…</option>
              {areas?.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          disabled={!title.trim() || !areaId || duration < 1}
          onClick={() =>
            onCreate({
              title: title.trim(),
              lifeAreaId: areaId as Id<"lifeAreas">,
              outcome: outcome.trim() || undefined,
              durationDays: duration,
              startDate: new Date(start + "T09:00:00").getTime(),
            })
          }
          className="w-full rounded-lg bg-sprint py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Launch sprint
        </button>
      </div>
    </Modal>
  );
}
