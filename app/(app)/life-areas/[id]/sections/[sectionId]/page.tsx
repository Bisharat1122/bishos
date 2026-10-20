"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, CheckSquare, Target, StickyNote, ArrowLeft, Layers, Sun } from "lucide-react";
import { PageShell, Section, Select, CheckCircle, EmptyHint, cn, buttonVariants, inputClass } from "@/components/os/kit";
import { toast, errorMessage } from "@/components/os/celebrate";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { relDay, useToday } from "@/lib/day";

/** A section inside a Life Area — its tasks, notes and goals. */
export default function SectionPage() {
  const params = useParams<{ id: string; sectionId: string }>();
  const areaId = params.id as Id<"lifeAreas">;
  const sectionId = params.sectionId as Id<"sections">;
  const today = useToday();

  const data = useQuery(api.sections.overview, { id: sectionId });
  const createTask = useMutation(api.tasks.create);
  const setStatus = useMutation(api.tasks.setStatus);
  const plan = useMutation(api.tasks.plan);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "med" | "high">("med");
  const [when, setWhen] = useState<"" | "today">("");
  const [openTask, setOpenTask] = useState<Id<"tasks"> | null>(null);

  if (data === undefined)
    return (
      <PageShell title={<span className="skeleton inline-block h-7 w-40 align-middle" />} icon={Layers}>
        <div className="skeleton h-10" />
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="skeleton h-56" />
          <div className="skeleton h-56" />
          <div className="skeleton h-56" />
        </div>
      </PageShell>
    );
  if (data === null)
    return (
      <PageShell title="Section not found" icon={Layers}>
        <EmptyHint icon={Layers} title="This section doesn’t exist" action={<Link href={`/life-areas/${areaId}`} className={buttonVariants({ size: "sm" })}>Back to area</Link>} />
      </PageShell>
    );

  const { section, area, tasks, notes, goals } = data;
  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <PageShell
      title={section.name}
      icon={Layers}
      subtitle={
        <>
          Section of{" "}
          <Link href={`/life-areas/${areaId}`} className="font-medium text-foreground underline-offset-2 hover:underline">
            {area?.name ?? "area"}
          </Link>
        </>
      }
      actions={
        <Link href={`/life-areas/${areaId}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft /> {area?.name ?? "Area"}
        </Link>
      }
    >
      {/* Quick-add task scoped to this section */}
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          // The section's own area (not the URL segment) — a section can only hold its area's tasks.
          void createTask({ title: title.trim(), priority, lifeAreaId: section.lifeAreaId, sectionId, plannedFor: when === "today" ? today : undefined })
            .then(() => toast("Task added", { tone: "success" }))
            .catch((err) => toast(errorMessage(err), { tone: "warning" }));
          setTitle("");
        }}
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`New task in ${section.name}…`} className={cn(inputClass, "h-10 min-w-0 flex-1 basis-56")} />
        <Select value={when} onChange={(e) => setWhen(e.target.value as "" | "today")} className="h-10 w-auto" aria-label="When">
          <option value="">Anytime</option>
          <option value="today">Today</option>
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className="h-10 w-auto" aria-label="Priority">
          <option value="low">Low</option>
          <option value="med">Medium</option>
          <option value="high">High</option>
        </Select>
        <button className={buttonVariants({ size: "lg" })} disabled={!title.trim()}>
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title={`Tasks (${open.length} open)`} icon={CheckSquare}>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <ul className="space-y-1">
              {[...open, ...done].map((t) => (
                <li key={t._id} className="group flex items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-accent/40">
                  <CheckCircle
                    size="sm"
                    checked={t.status === "done"}
                    onClick={() =>
                      void setStatus({ id: t._id, status: t.status === "done" ? "not_started" : "done", date: today }).catch((e) =>
                        toast(errorMessage(e), { tone: "warning" }),
                      )
                    }
                  />
                  <button onClick={() => setOpenTask(t._id)} className={cn("min-w-0 flex-1 truncate text-left text-sm hover:underline", t.status === "done" && "text-muted-foreground line-through")}>
                    {t.title}
                  </button>
                  {t.status !== "done" &&
                    (t.plannedFor ? (
                      <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px]", t.plannedFor < today ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground")}>
                        {relDay(t.plannedFor, today)}
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          void plan({ ids: [t._id], plannedFor: today })
                            .then(() => toast("Planned for today", { tone: "success" }))
                            .catch((e) => toast(errorMessage(e), { tone: "warning" }))
                        }
                        title="Do it today"
                        aria-label="Plan for today"
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Sun className="h-3.5 w-3.5" />
                      </button>
                    ))}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Notes (${notes.length})`} icon={StickyNote}>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {notes.map((n) => (
                <li key={n._id}>
                  <Link href={`/notes/${n._id}`} className="block truncate rounded-lg bg-muted/40 px-3 py-2 text-sm hover:bg-muted/70">
                    {n.title || "Untitled"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Goals (${goals.length})`} icon={Target}>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No goals yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {goals.map((g) => (
                <li key={g._id}>
                  <Link href={`/goals/${g._id}`} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm hover:bg-muted/70">
                    <span className="truncate">{g.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{g.progress}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {openTask && <TaskDetailPanel id={openTask} onClose={() => setOpenTask(null)} />}
    </PageShell>
  );
}
