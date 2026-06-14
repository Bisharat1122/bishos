"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, CheckSquare, Target, StickyNote } from "lucide-react";
import { Card, Topbar, EmptyState } from "@/components/ui";
import { DetailSkeleton } from "@/components/Skeleton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { cn } from "@/lib/utils";

type Status = "not_started" | "in_progress" | "done";

export default function SectionPage() {
  const params = useParams<{ id: string; sectionId: string }>();
  const areaId = params.id as Id<"lifeAreas">;
  const sectionId = params.sectionId as Id<"sections">;

  const data = useQuery(api.sections.overview, { id: sectionId });
  const createTask = useMutation(api.tasks.create);
  const setStatus = useMutation(api.tasks.setStatus);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "med" | "high">("med");

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
          <EmptyState title="Section not found" />
        </div>
      </div>
    );

  const { section, area, tasks, notes, goals } = data;
  const cycle = (s: Status): Status =>
    s === "not_started" ? "in_progress" : s === "in_progress" ? "done" : "not_started";

  return (
    <div>
      <Topbar />
      <div className="px-8 py-7">
        <Breadcrumb
          items={[
            { label: "Life Areas", href: "/life-areas" },
            { label: area?.name ?? "Area", href: `/life-areas/${areaId}` },
            { label: section.name },
          ]}
        />

        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          {section.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything in {area?.name} / {section.name}.
        </p>

        {/* Quick-add task scoped to this section */}
        <form
          className="mt-6 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            void createTask({
              title: title.trim(),
              priority,
              lifeAreaId: areaId,
              sectionId,
            });
            setTitle("");
          }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`New task in ${section.name}…`}
            className="min-w-[16rem] flex-1 rounded-full border border-border bg-muted/40 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
            className="rounded-full border border-border bg-muted/40 px-4 py-2.5 text-sm outline-none"
          >
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
          <button className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Tasks */}
          <Card className="lg:col-span-1">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <CheckSquare className="h-4 w-4 text-primary" /> Tasks ({tasks.length})
            </h3>
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tasks yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {tasks.map((t) => (
                  <li key={t._id} className="flex items-center gap-2.5">
                    <button
                      onClick={() =>
                        void setStatus({ id: t._id, status: cycle(t.status) })
                      }
                      className={cn(
                        "h-4 w-4 shrink-0 rounded-full border-2",
                        t.status === "done"
                          ? "border-primary bg-primary"
                          : t.status === "in_progress"
                            ? "border-warning bg-warning/40"
                            : "border-muted-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        t.status === "done" &&
                          "text-muted-foreground line-through",
                      )}
                    >
                      {t.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Notes */}
          <Card>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <StickyNote className="h-4 w-4 text-primary" /> Notes ({notes.length})
            </h3>
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No notes yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {notes.map((n) => (
                  <li
                    key={n._id}
                    className="rounded-lg bg-muted/30 px-3 py-2 text-sm"
                  >
                    {n.title}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Goals */}
          <Card>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-primary" /> Goals ({goals.length})
            </h3>
            {goals.length === 0 ? (
              <p className="text-xs text-muted-foreground">No goals yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {goals.map((g) => (
                  <li
                    key={g._id}
                    className="rounded-lg bg-muted/30 px-3 py-2 text-sm"
                  >
                    {g.title}{" "}
                    <span className="text-xs text-muted-foreground">
                      — {g.progress}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
