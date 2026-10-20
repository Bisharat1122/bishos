"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus, Repeat, Sparkles } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Dialog, EmptyHint, Metric, PageShell, Ring, buttonVariants } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { useToday } from "@/lib/day";
import { RoutineCard, RoutineEditor, RoutineRunner, type RoutineItem } from "@/components/habits/Routines";
import { errText } from "@/components/habits/util";

export default function RoutinesPage() {
  const today = useToday();
  const routines = useQuery(api.routines.list, { today });
  const seed = useMutation(api.routines.seedDefaults);
  const update = useMutation(api.routines.update);
  const move = useMutation(api.routines.move);
  const remove = useMutation(api.routines.remove);

  const [runId, setRunId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ open: boolean; routine: RoutineItem | null }>({ open: false, routine: null });
  const [confirm, setConfirm] = useState<RoutineItem | null>(null);
  const [seedState, setSeedState] = useState<"idle" | "seeding" | "done">("idle");

  // First visit: seed the four starter routines (idempotent on the server).
  useEffect(() => {
    if (!routines || routines.length > 0 || seedState !== "idle") return;
    setSeedState("seeding");
    seed()
      .then((n) => {
        if (n) toast("Added 4 starter routines", { tone: "success", sub: "Start-up, Shutdown, Morning and Evening — edit them to fit your day." });
      })
      .catch((e) => toast(errText(e), { tone: "warning" }))
      .finally(() => setSeedState("done"));
  }, [routines, seed, seedState]);

  const running = routines?.find((r) => r._id === runId) ?? null;
  const active = routines?.filter((r) => r.active) ?? [];
  const doneToday = active.filter((r) => r.run?.completed).length;
  const avgConsistency = active.length ? Math.round(active.reduce((s, r) => s + r.consistency, 0) / active.length) : 0;

  return (
    <PageShell
      title="Routines"
      icon={Repeat}
      subtitle="Short checklists set off by one cue. Each has a minimum version for bad days."
      actions={
        <button onClick={() => setEditor({ open: true, routine: null })} className={buttonVariants()}>
          <Plus /> New routine
        </button>
      }
      headerExtra={
        routines && active.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <Ring value={(doneToday / active.length) * 100} size={48} stroke={5} tone={doneToday === active.length ? "success" : "primary"}>
                <Sparkles className="h-4 w-4" />
              </Ring>
              <Metric label="Done today" value={`${doneToday}/${active.length}`} />
            </div>
            <Metric label="Consistency · 30d" value={`${avgConsistency}%`} sub="minimum versions count" />
            <Metric
              label="Planned time"
              value={`${active.reduce((s, r) => s + r.plannedMin, 0)} min`}
              sub="start-up ≤15 · shutdown ≤10"
              className="col-span-2 sm:col-span-1"
            />
          </div>
        ) : null
      }
    >
      {routines === undefined || (routines.length === 0 && seedState !== "done") ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-72" />
          ))}
        </div>
      ) : routines.length === 0 ? (
        <EmptyHint
          icon={Repeat}
          title="No routines yet"
          hint="A routine bundles 3–8 small steps behind one cue — like a work start-up (≤15 min) or a shutdown (≤10 min) — so the day starts and ends on purpose."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() =>
                  void seed()
                    .then((n) => n && toast("Added 4 starter routines", { tone: "success" }))
                    .catch((e) => toast(errText(e), { tone: "warning" }))
                }
                className={buttonVariants()}
              >
                Add starter routines
              </button>
              <button onClick={() => setEditor({ open: true, routine: null })} className={buttonVariants({ variant: "outline" })}>
                <Plus /> Build your own
              </button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {routines.map((r) => (
            <RoutineCard
              key={r._id}
              routine={r}
              today={today}
              onRun={() => setRunId(r._id)}
              onEdit={() => setEditor({ open: true, routine: r })}
              onMove={(dir) => void move({ id: r._id, dir }).catch((e) => toast(errText(e), { tone: "warning" }))}
              onToggleActive={() => void update({ id: r._id, active: !r.active }).catch((e) => toast(errText(e), { tone: "warning" }))}
              onDelete={() => setConfirm(r)}
            />
          ))}
        </div>
      )}

      {running && <RoutineRunner routine={running} date={today} onClose={() => setRunId(null)} />}

      <RoutineEditor open={editor.open} routine={editor.routine} onClose={() => setEditor({ open: false, routine: null })} />

      <Dialog open={!!confirm} onClose={() => setConfirm(null)} title="Delete this routine?" size="sm">
        <p className="text-sm text-muted-foreground">
          “{confirm?.name}” and its history will be removed. To take a break, pause it instead — it keeps its history.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={() => {
              if (confirm) void update({ id: confirm._id, active: false }).catch((e) => toast(errText(e), { tone: "warning" }));
              setConfirm(null);
            }}
            className={buttonVariants({ variant: "outline" })}
          >
            Pause instead
          </button>
          <button
            onClick={async () => {
              const r = confirm;
              setConfirm(null);
              if (r) {
                try {
                  await remove({ id: r._id });
                  toast("Routine deleted");
                } catch (e) {
                  toast(errText(e), { tone: "warning" });
                }
              }
            }}
            className={buttonVariants({ variant: "destructive" })}
          >
            Delete
          </button>
        </div>
      </Dialog>
    </PageShell>
  );
}
