import { Doc } from "@/convex/_generated/dataModel";

const PRANK: Record<string, number> = { high: 0, med: 1, low: 2 };

/**
 * Canonical task ordering used by every view (board, list, calendar):
 *   1. Priority — high first
 *   2. Upcoming due date — soonest first (overdue floats highest; undated last)
 *   3. Manual order / recency — tiebreaker within the same priority+due tier
 * So high-priority and soon-due tasks are always on top, while drag-reorder
 * still fine-tunes within a tier.
 */
export function compareTasks(a: Doc<"tasks">, b: Doc<"tasks">): number {
  const pr = (PRANK[a.priority] ?? 1) - (PRANK[b.priority] ?? 1);
  if (pr !== 0) return pr;

  const ad = a.dueDate ?? Infinity;
  const bd = b.dueDate ?? Infinity;
  if (ad !== bd) return ad - bd;

  return (b.order ?? b._creationTime) - (a.order ?? a._creationTime);
}

export function sortTasks(tasks: Doc<"tasks">[]): Doc<"tasks">[] {
  return [...tasks].sort(compareTasks);
}
