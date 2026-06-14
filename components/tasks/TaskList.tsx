"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Paperclip, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_TEXT } from "./TaskCard";

export function TaskList({
  tasks,
  areaName,
  sectionName,
  onSelect,
}: {
  tasks: Doc<"tasks">[];
  areaName: (id: Id<"lifeAreas">) => string | undefined;
  sectionName: (id?: Id<"sections">) => string | undefined;
  onSelect: (id: Id<"tasks">) => void;
}) {
  const setStatus = useMutation(api.tasks.setStatus).withOptimisticUpdate((store, { id, status }) => {
    const cur = store.getQuery(api.tasks.list, {});
    if (!cur) return;
    store.setQuery(api.tasks.list, {}, cur.map((t) => (t._id === id ? { ...t, status } : t)));
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border bg-card/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="w-12 px-4 py-3">Done</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Life area</th>
            <th className="px-4 py-3">Section</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3">Tags</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                No tasks.
              </td>
            </tr>
          )}
          {tasks.map((t) => (
            <tr
              key={t._id}
              className="border-b border-border last:border-0 hover:bg-muted/20"
            >
              <td className="px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={t.status === "done"}
                  onChange={(e) =>
                    void setStatus({
                      id: t._id,
                      status: e.target.checked ? "done" : "not_started",
                    })
                  }
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
              </td>
              <td className="px-4 py-2.5">
                <button
                  onClick={() => onSelect(t._id)}
                  className={cn(
                    "flex items-center gap-2 text-left font-medium hover:text-primary",
                    t.status === "done" && "text-muted-foreground line-through",
                  )}
                >
                  {t.title}
                  {t.attachments && t.attachments.length > 0 && (
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {areaName(t.lifeAreaId) ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {sectionName(t.sectionId ?? undefined) ?? "—"}
              </td>
              <td className="px-4 py-2.5">
                <span className={cn("text-xs font-semibold uppercase", PRIORITY_TEXT[t.priority])}>
                  {t.priority}
                </span>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex flex-wrap gap-1">
                  {(t.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
