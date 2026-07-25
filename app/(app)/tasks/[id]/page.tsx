"use client";

import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Topbar } from "@/components/ui";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";

/** Full-page view of a task (Notion-style "open as page"). */
export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <Topbar />
      <TaskDetailPanel id={id as Id<"tasks">} view="page" />
    </div>
  );
}
