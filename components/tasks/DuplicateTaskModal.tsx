"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Modal } from "@/components/ui";
import { Copy } from "lucide-react";
import { toast, errorMessage } from "@/components/os/celebrate";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/variants";

const p2 = (n: number) => String(n).padStart(2, "0");
const dateStrOf = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
};
const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * Duplicate a task onto a chosen day. Everything is copied; only the dates
 * move — each keeps its time-of-day, and the gap between start and due is
 * preserved (multi-day tasks stay multi-day, just shifted).
 */
export function DuplicateTaskModal({
  task,
  onClose,
  onDuplicated,
}: {
  task: Doc<"tasks">;
  onClose: () => void;
  onDuplicated?: (id: Id<"tasks">) => void;
}) {
  const duplicate = useMutation(api.tasks.duplicate);

  // Anchor the picker on the task's own schedule (start wins, else due), else today.
  const anchor = task.startAt ?? task.dueDate;
  const [date, setDate] = useState<string>(
    anchor != null ? dateStrOf(anchor) : dateStrOf(Date.now()),
  );
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || busy) return;
    setBusy(true);
    try {
      const target = new Date(`${date}T00:00`).getTime();
      let newStart = task.startAt ?? null;
      let newDue = task.dueDate ?? null;

      if (anchor != null) {
        // Shift both dates by the difference between the chosen day and the
        // anchor's day — preserves times-of-day and the start→due gap.
        const delta = target - startOfDay(anchor);
        if (task.startAt != null) newStart = task.startAt + delta;
        if (task.dueDate != null) newDue = task.dueDate + delta;
      } else {
        // Task had no dates: put the due at end of the chosen day.
        newDue = new Date(`${date}T23:59`).getTime();
      }

      const id = await duplicate({ id: task._id, startAt: newStart, dueDate: newDue });
      toast("Task duplicated", { tone: "success" });
      onDuplicated?.(id);
      onClose();
    } catch (err) {
      toast(errorMessage(err), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Duplicate task" onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <p className="text-sm text-muted-foreground">
          Creates an exact copy of{" "}
          <span className="font-medium text-foreground">“{task.title}”</span>{" "}
          with the same priority, life area, tags, description and attachments.
          Pick the day it should land on — the time of day stays the same.
        </p>

        <div>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Move to date
          </span>
          <input
            autoFocus
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-input bg-card shadow-xs px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
          />
        </div>

        <button
          type="submit"
          disabled={!date || busy}
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          <Copy className="h-4 w-4" />
          {busy ? "Duplicating…" : "Duplicate task"}
        </button>
      </form>
    </Modal>
  );
}
