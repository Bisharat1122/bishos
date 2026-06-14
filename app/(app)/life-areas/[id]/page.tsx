"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  CheckSquare,
  FolderKanban,
  Target,
  StickyNote,
  ArrowUpRight,
  Pencil,
} from "lucide-react";
import { Card, Topbar, EmptyState } from "@/components/ui";
import { DetailSkeleton } from "@/components/Skeleton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AddToMomentum } from "@/components/momentum/AddToMomentum";
import { cn } from "@/lib/utils";

export default function LifeAreaPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"lifeAreas">;
  const data = useQuery(api.lifeAreas.overview, { id });
  const update = useMutation(api.lifeAreas.update);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

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
          <EmptyState title="Life area not found" />
        </div>
      </div>
    );

  const { area, sections, tasks, projects, goals, notes } = data;
  const openTasks = tasks.filter((t) => t.status !== "done");

  return (
    <div>
      <Topbar />
      <div className="px-8 py-7">
        <Breadcrumb
          items={[
            { label: "Life Areas", href: "/life-areas" },
            { label: area.name },
          ]}
        />

        {/* Header */}
        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{area.name}</h1>
            {editing ? (
              <div className="mt-2 flex gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary/60"
                  placeholder="Describe this life area…"
                />
                <button
                  onClick={async () => {
                    await update({ id, description: draft });
                    setEditing(false);
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setDraft(area.description ?? "");
                  setEditing(true);
                }}
                className="group mt-1 flex items-center gap-1.5 text-left text-sm text-muted-foreground hover:text-foreground"
              >
                {area.description || "Add a description…"}
                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" />
              </button>
            )}
          </div>
          <AddToMomentum type="lifeArea" itemId={id} title={area.name} />
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Open tasks" value={openTasks.length} icon={CheckSquare} />
          <Stat label="Projects" value={projects.length} icon={FolderKanban} />
          <Stat label="Goals" value={goals.length} icon={Target} />
          <Stat label="Notes" value={notes.length} icon={StickyNote} />
        </div>

        {/* Sections */}
        <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Sections
        </h2>
        {sections.length === 0 ? (
          <EmptyState
            title="No sections yet"
            hint="Add sections from the Life Areas list."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sections.map((s) => (
              <Link key={s._id} href={`/life-areas/${id}/sections/${s._id}`}>
                <Card className="group transition hover:border-primary/60">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{s.name}</h3>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {s.taskCount} tasks · {s.noteCount} notes · {s.goalCount} goals
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Area content */}
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ListCard icon={CheckSquare} title={`Tasks (${tasks.length})`}>
            {tasks.map((t) => (
              <li
                key={t._id}
                className={cn(
                  "flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm",
                  t.status === "done" && "text-muted-foreground line-through",
                )}
              >
                <span>{t.title}</span>
                <span className="text-xs uppercase text-muted-foreground">
                  {t.priority}
                </span>
              </li>
            ))}
          </ListCard>

          <ListCard icon={FolderKanban} title={`Projects (${projects.length})`}>
            {projects.map((p) => (
              <li
                key={p._id}
                className="rounded-lg bg-muted/30 px-3 py-2 text-sm"
              >
                {p.title}{" "}
                <span className="text-xs text-muted-foreground">
                  — {p.status}
                </span>
              </li>
            ))}
          </ListCard>

          <ListCard icon={Target} title={`Goals (${goals.length})`}>
            {goals.map((g) => (
              <li key={g._id} className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
                {g.title}{" "}
                <span className="text-xs text-muted-foreground">
                  — {g.progress}%
                </span>
              </li>
            ))}
          </ListCard>

          <ListCard icon={StickyNote} title={`Notes (${notes.length})`}>
            {notes.map((n) => (
              <li key={n._id} className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
                {n.title}
              </li>
            ))}
          </ListCard>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof CheckSquare;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-lg font-bold leading-none">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}

function ListCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof CheckSquare;
  title: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const empty = items.filter(Boolean).length === 0;
  return (
    <Card>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h3>
      {empty ? (
        <p className="text-xs text-muted-foreground">Nothing here yet.</p>
      ) : (
        <ul className="space-y-1.5">{children}</ul>
      )}
    </Card>
  );
}
