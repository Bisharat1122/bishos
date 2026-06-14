"use client";

import { useRouter } from "next/navigation";
import { Timer, Pause, Play, Square } from "lucide-react";
import { useFocusTimer } from "./FocusTimerProvider";
import { cn } from "@/lib/utils";

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, "0")}`;

/** Compact running-timer indicator for the Topbar (shows on every page while a
 * Pomodoro/stopwatch is active). Click the time to jump to Focus. */
export function FocusTimerPill() {
  const t = useFocusTimer();
  const router = useRouter();
  if (!t.active) return null;

  const isBreak = t.type === "pomodoro" && t.mode === "break";
  return (
    <div
      className={cn(
        "flex h-10 items-center gap-0.5 rounded-full border pl-1 pr-1",
        isBreak ? "border-accent/40 bg-accent/10" : "border-primary/40 bg-primary/10",
        t.running && "animate-[pulse_2.5s_ease-in-out_infinite]",
      )}
    >
      <button
        onClick={() => router.push("/focus")}
        title="Open Focus Time"
        className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium"
      >
        <Timer className={cn("h-4 w-4", isBreak ? "text-accent" : "text-primary")} />
        <span className="tabular-nums">{fmt(t.display)}</span>
        {t.taskTitle && (
          <span className="hidden max-w-[10rem] truncate text-xs text-muted-foreground md:inline">
            {t.taskTitle}
          </span>
        )}
      </button>
      <button
        onClick={t.toggle}
        title={t.running ? "Pause" : "Resume"}
        className="flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-muted"
      >
        {t.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={t.stopAndLog}
        title="Stop & log focused time"
        className="flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-muted"
      >
        <Square className="h-3 w-3" />
      </button>
    </div>
  );
}
