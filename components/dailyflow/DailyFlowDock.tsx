"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Sun, Moon, Check, X, RotateCcw, Flame, ArrowUpRight, ChevronRight,
  CalendarCheck, ListTodo, Target, StickyNote, FolderKanban, CalendarRange,
  Repeat, Timer, PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = "start" | "shutdown";
type Step = { key: string; phase: Phase; title: string; prompt: string; href?: string; cta?: string; icon: typeof Sun };

const STEPS: Step[] = [
  { key: "checkin", phase: "start", title: "Daily check-in", prompt: "Set your energy and pick today's top 3 priorities.", href: "/check-in", cta: "Open check-in", icon: CalendarCheck },
  { key: "tasks", phase: "start", title: "Review upcoming tasks", prompt: "Scan tasks due in the next 2 days and your deadlines.", href: "/tasks", cta: "Open tasks", icon: ListTodo },
  { key: "goals", phase: "start", title: "Glance at your goals", prompt: "Are you on track? Anything slipping behind?", href: "/goals", cta: "Open goals", icon: Target },
  { key: "notes", phase: "start", title: "Scan recent notes", prompt: "Anything to turn into a task or act on today?", href: "/notes", cta: "Open notes", icon: StickyNote },
  { key: "projects", phase: "start", title: "Projects & life-area balance", prompt: "Where should today's attention go?", href: "/projects", cta: "Open projects", icon: FolderKanban },
  { key: "scheduleToday", phase: "start", title: "Time-block today", prompt: "Lay out today's schedule so the day runs itself.", href: "/schedule", cta: "Open schedule", icon: CalendarRange },
  { key: "habits", phase: "shutdown", title: "Mark today's habits", prompt: "Tick off the habits you kept today.", href: "/habits", cta: "Open habits", icon: Repeat },
  { key: "focus", phase: "shutdown", title: "Confirm focus time", prompt: "Log or review the deep work you did today.", href: "/focus", cta: "Open focus", icon: Timer },
  { key: "scheduleTomorrow", phase: "shutdown", title: "Plan tomorrow", prompt: "Time-block tomorrow so you start fast and sharp.", href: "/schedule", cta: "Open schedule", icon: CalendarRange },
  { key: "complete", phase: "shutdown", title: "Shutdown complete", prompt: "Everything's captured and planned. Switch off — you're done.", icon: PartyPopper },
];

const ymdLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const VIEW_KEY = "bishos.dailyFlow.view";

export function DailyFlowDock() {
  const today = ymdLocal(new Date());
  const data = useQuery(api.dailyFlow.today, { date: today });
  const streak = useQuery(api.dailyFlow.streak, {});
  const completeStep = useMutation(api.dailyFlow.completeStep);
  const reset = useMutation(api.dailyFlow.reset);

  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(localStorage.getItem(VIEW_KEY) === "open");
  }, []);
  const setView = (o: boolean) => {
    setOpen(o);
    try { localStorage.setItem(VIEW_KEY, o ? "open" : "pill"); } catch { /* ignore */ }
  };

  const doneSet = new Set(data?.done ?? []);
  if (data?.checkInDone) doneSet.add("checkin");

  const totalDone = STEPS.filter((s) => doneSet.has(s.key)).length;
  const pct = Math.round((totalDone / STEPS.length) * 100);
  const current = STEPS.find((s) => !doneSet.has(s.key)) ?? null;
  const allDone = !current;

  function finish(key: string) {
    void completeStep({ date: today, key });
  }

  // ---- minimized pill ----
  if (!open) {
    return (
      <button
        onClick={() => setView(true)}
        title="Daily Flow"
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3 shadow-lg transition hover:border-primary/50"
      >
        <Ring pct={pct} done={allDone} />
        <span className="text-sm font-medium">Daily Flow</span>
        <span className="text-xs text-muted-foreground">{totalDone}/{STEPS.length}</span>
      </button>
    );
  }

  // ---- expanded card ----
  return (
    <div className="fixed bottom-5 left-5 z-40 w-[min(360px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Ring pct={pct} done={allDone} small />
        <div className="leading-tight">
          <p className="text-sm font-semibold">Daily Flow</p>
          <p className="text-[11px] text-muted-foreground">{totalDone} of {STEPS.length} done today</p>
        </div>
        {!!streak && streak > 0 && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
            <Flame className="h-3.5 w-3.5" /> {streak}
          </span>
        )}
        <button onClick={() => setView(false)} className={cn("rounded p-1 text-muted-foreground hover:text-foreground", !(streak && streak > 0) && "ml-auto")}>
          <X className="h-4 w-4" />
        </button>
      </div>

      {allDone ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <PartyPopper className="h-8 w-8 text-primary" />
          <p className="font-semibold">Daily Flow complete</p>
          <p className="text-sm text-muted-foreground">Everything reviewed and planned. Shutdown complete.</p>
          <button
            onClick={() => void reset({ date: today })}
            className="mt-2 flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Run it again
          </button>
        </div>
      ) : (
        <CurrentStep step={current!} onDone={() => finish(current!.key)} />
      )}

      {/* progress bar */}
      <div className="h-1 w-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CurrentStep({ step, onDone }: { step: Step; onDone: () => void }) {
  const router = useRouter();
  const Icon = step.icon;
  const isStart = step.phase === "start";
  return (
    <div className="px-4 py-4">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
          isStart ? "bg-primary/10 text-primary" : "bg-sprint/15 text-sprint",
        )}
      >
        {isStart ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
        {isStart ? "Morning · Start" : "Evening · Shutdown"}
      </span>

      <div className="mt-3 flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="font-semibold">{step.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{step.prompt}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {step.href && step.cta && (
          <button
            onClick={() => router.push(step.href!)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:border-primary/50"
          >
            {step.cta} <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={onDone}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {step.key === "complete" ? (
            <><Check className="h-4 w-4" /> Done</>
          ) : (
            <>Done <ChevronRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}

function Ring({ pct, done, small }: { pct: number; done?: boolean; small?: boolean }) {
  const size = small ? 28 : 30;
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-muted" strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="fill-none stroke-primary"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <span className="absolute">
        {done ? <Check className="h-3.5 w-3.5 text-primary" /> : <span className="text-[9px] font-bold tabular-nums">{pct}</span>}
      </span>
    </span>
  );
}
