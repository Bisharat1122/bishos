"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Doc } from "@/convex/_generated/dataModel";
import { Play, Timer, Clock, Square } from "lucide-react";
import { useFocusTimer } from "@/components/focus/FocusTimerProvider";
import { cn } from "@/lib/utils";

const MENU_W = 180;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, "0")}`;

/** Play button on a task → choose Pomodoro or Stopwatch → starts the global
 * focus timer attributed to that task. Shows the live time if it's running. */
export function TaskTimerButton({ task, compact }: { task: Doc<"tasks">; compact?: boolean }) {
  const timer = useFocusTimer();
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const runningThis = timer.active && timer.taskId === task._id;

  function open() {
    if (pos) { setPos(null); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(Math.max(8, r.right - MENU_W), window.innerWidth - MENU_W - 8);
    const top = window.innerHeight - r.bottom > 180 ? r.bottom + 6 : Math.max(8, r.top - 180);
    setPos({ top, left });
  }

  function start(type: "pomodoro" | "stopwatch") {
    timer.startFocus({
      type,
      taskId: task._id,
      areaId: task.lifeAreaId,
      projectId: task.projectId ?? "",
      taskTitle: task.title,
    });
    setPos(null);
  }

  return (
    <span className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={open}
        title="Start a focus timer on this task"
        className={cn(
          "flex items-center gap-1 rounded-full border font-medium transition",
          compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
          runningThis
            ? "border-primary/50 bg-primary/15 text-primary"
            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
        )}
      >
        {runningThis && timer.running ? (
          <>
            <Timer className="h-3.5 w-3.5 animate-pulse" />
            <span className="tabular-nums">{fmt(timer.display)}</span>
          </>
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
      </button>

      {pos &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setPos(null)} />
            <div
              className="fixed z-[61] w-44 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-2xl"
              style={{ top: pos.top, left: pos.left }}
            >
              <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">Start timer</p>
              <button
                onClick={() => start("pomodoro")}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Timer className="h-4 w-4 text-primary" /> Pomodoro
              </button>
              <button
                onClick={() => start("stopwatch")}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Clock className="h-4 w-4 text-primary" /> Stopwatch
              </button>
              {runningThis && (
                <>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={() => { timer.stopAndLog(); setPos(null); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-warning hover:bg-muted"
                  >
                    <Square className="h-3.5 w-3.5" /> Stop &amp; log
                  </button>
                  <button
                    onClick={() => { router.push("/focus"); setPos(null); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                  >
                    <Clock className="h-4 w-4" /> Open Focus
                  </button>
                </>
              )}
            </div>
          </>,
          document.body,
        )}
    </span>
  );
}
