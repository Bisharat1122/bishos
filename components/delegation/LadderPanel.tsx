"use client";

import { useQuery } from "convex/react";
import { Lightbulb } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Bar, Chip, buttonVariants, cn } from "@/components/os/kit";
import { RUNGS, type Rung } from "./meta";

/** Replacement Ladder: admin → delivery → marketing → sales → leadership. */
export function LadderPanel({ onOpenRung }: { onOpenRung: (rung: Rung) => void }) {
  const l = useQuery(api.delegation.ladder);
  if (l === undefined)
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="skeleton h-20" />
        ))}
      </div>
    );
  const byRung = new Map(l.rungs.map((r) => [r.rung, r]));
  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-info-soft text-info">
          <Lightbulb className="h-4 w-4" />
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-medium">What to hand off first</p>
          <p className="mt-0.5 text-muted-foreground">{l.hint}</p>
        </div>
      </div>

      <ol className="relative space-y-3">
        <span aria-hidden className="absolute bottom-6 left-[19px] top-6 w-px bg-border" />
        {RUNGS.map((meta, i) => {
          const r = byRung.get(meta.key)!;
          const focus = l.focusRung === meta.key;
          return (
            <li key={meta.key} className="relative flex gap-3">
              <span
                className={cn(
                  "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums",
                  r.total > 0 && r.delegated === r.total
                    ? "border-success bg-success text-background"
                    : focus
                      ? "border-primary bg-card"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <div className={cn("min-w-0 flex-1 rounded-xl border bg-card p-4 shadow-card", focus ? "border-ring" : "border-border")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold">
                      {meta.label}
                      {focus && <Chip tone="info">Next</Chip>}
                    </p>
                    <p className="text-xs text-muted-foreground">{meta.desc}</p>
                  </div>
                  <span className="text-xl font-semibold tabular-nums">{r.readiness}%</span>
                </div>
                <Bar value={r.readiness} tone={r.readiness >= 80 ? "success" : "primary"} className="mt-3" height="h-2" />
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {r.total === 0 ? (
                    <span className="text-xs text-muted-foreground">No processes yet.</span>
                  ) : (
                    <>
                      {r.delegated > 0 && <Chip tone="success">{r.delegated} delegated</Chip>}
                      {r.documented > 0 && <Chip tone="info">{r.documented} documented</Chip>}
                      {r.draft > 0 && <Chip tone="muted">{r.draft} draft</Chip>}
                      {r.undocumentedTasks > 0 && <Chip tone="muted">{r.undocumentedTasks} task{r.undocumentedTasks === 1 ? "" : "s"} to record</Chip>}
                    </>
                  )}
                  <button onClick={() => onOpenRung(meta.key)} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "ml-auto h-7 px-2 text-xs")}>
                    Open SOPs
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted-foreground">
        Readiness = documented or delegated processes ÷ everything on that rung (SOPs plus tasks flagged “delegate” without one). When a rung is ready, a first assistant or contractor can take it over.
      </p>
    </div>
  );
}
