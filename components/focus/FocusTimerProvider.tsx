"use client";

import {
  createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode,
} from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FocusMusicLayer } from "./FocusMusicLayer";

type TimerType = "pomodoro" | "stopwatch";
type Mode = "focus" | "break";

type State = {
  type: TimerType;
  mode: Mode;
  workMin: number;
  breakMin: number;
  running: boolean;
  accumulated: number; // seconds completed before the current run segment
  segmentStart: number | null; // ms when the current run segment started
  taskId: string;
  projectId: string;
  areaId: string;
  taskTitle: string;
};

const DEFAULT: State = {
  type: "pomodoro", mode: "focus", workMin: 25, breakMin: 5,
  running: false, accumulated: 0, segmentStart: null,
  taskId: "", projectId: "", areaId: "", taskTitle: "",
};

const KEY = "bishos.focusTimer.v1";

type Attribution = Partial<Pick<State, "taskId" | "projectId" | "areaId" | "taskTitle">>;

type Ctx = {
  type: TimerType; mode: Mode; workMin: number; breakMin: number; running: boolean;
  taskId: string; projectId: string; areaId: string; taskTitle: string;
  elapsed: number; left: number; total: number; display: number; active: boolean;
  /** Bumps each time a fresh focus session begins (from any screen). The music
   * layer watches this to offer the "play music?" prompt. */
  startSignal: number;
  toggle: () => void;
  stopAndLog: () => void;
  startFocus: (opts: { type: TimerType; taskId?: string; projectId?: string; areaId?: string; taskTitle?: string }) => void;
  switchType: (t: TimerType) => void;
  setMode: (m: Mode) => void;
  setWorkMin: (n: number) => void;
  setBreakMin: (n: number) => void;
  skipBreak: () => void;
  attribute: (a: Attribution) => void;
};

const FocusTimerContext = createContext<Ctx | null>(null);

export function useFocusTimer(): Ctx {
  const c = useContext(FocusTimerContext);
  if (!c) throw new Error("useFocusTimer must be used within FocusTimerProvider");
  return c;
}

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const log = useMutation(api.focus.log);
  const [s, setS] = useState<State>(DEFAULT);
  const [now, setNow] = useState(0);
  const [startSignal, setStartSignal] = useState(0);
  const hydrated = useRef(false);
  // mirror of the latest state so callbacks can read it without stale closures
  const stateRef = useRef(s);
  stateRef.current = s;

  // hydrate from localStorage (survives refresh)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setNow(Date.now());
    hydrated.current = true;
  }, []);

  // persist
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s]);

  // tick while running (timestamp-based, so background throttling can't drift it)
  useEffect(() => {
    if (!s.running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 500);
    const onVis = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [s.running]);

  const runSec = s.running && s.segmentStart ? Math.max(0, (now - s.segmentStart) / 1000) : 0;
  const elapsedInSeg = s.accumulated + runSec;
  const total = (s.mode === "focus" ? s.workMin : s.breakMin) * 60;
  const elapsed = Math.floor(elapsedInSeg);
  const left = Math.max(0, Math.ceil(total - elapsedInSeg));
  const display = s.type === "stopwatch" ? elapsed : left;
  const active = s.running || s.accumulated > 0;

  const logFocus = useCallback(
    (seconds: number) => {
      const sec = Math.round(seconds);
      if (sec < 30) return;
      const end = Date.now();
      void log({
        startTime: end - sec * 1000,
        endTime: end,
        duration: sec,
        taskId: s.taskId ? (s.taskId as Id<"tasks">) : undefined,
        projectId: s.projectId ? (s.projectId as Id<"projects">) : undefined,
        lifeAreaId: s.areaId ? (s.areaId as Id<"lifeAreas">) : undefined,
      });
    },
    [log, s.taskId, s.projectId, s.areaId],
  );

  // pomodoro block transition when the countdown reaches zero
  useEffect(() => {
    if (s.type !== "pomodoro" || !s.running || !s.segmentStart) return;
    const tot = (s.mode === "focus" ? s.workMin : s.breakMin) * 60;
    const done = s.accumulated + (now - s.segmentStart) / 1000;
    if (done < tot) return;
    if (s.mode === "focus") {
      logFocus(s.workMin * 60);
      setS((p) => ({ ...p, mode: "break", accumulated: 0, segmentStart: Date.now() }));
    } else {
      setS((p) => ({ ...p, mode: "focus", running: false, accumulated: 0, segmentStart: null }));
    }
  }, [now, s, logFocus]);

  const toggle = useCallback(() => {
    // starting from a clean idle state counts as a fresh session (offer music)
    const fresh = !stateRef.current.running && stateRef.current.accumulated === 0;
    setS((p) => {
      if (p.running) {
        const seg = p.segmentStart ? (Date.now() - p.segmentStart) / 1000 : 0;
        return { ...p, running: false, accumulated: p.accumulated + seg, segmentStart: null };
      }
      return { ...p, running: true, segmentStart: Date.now() };
    });
    if (fresh) setStartSignal((n) => n + 1);
  }, []);

  const stopAndLog = useCallback(() => {
    setS((p) => {
      const seg = p.running && p.segmentStart ? (Date.now() - p.segmentStart) / 1000 : 0;
      const acc = p.accumulated + seg;
      if (p.type === "stopwatch" || p.mode === "focus") logFocus(acc);
      return { ...p, running: false, accumulated: 0, segmentStart: null, mode: "focus" };
    });
  }, [logFocus]);

  const startFocus = useCallback(
    (opts: { type: TimerType; taskId?: string; projectId?: string; areaId?: string; taskTitle?: string }) => {
      setS((p) => {
        // log any in-progress focus time under the PREVIOUS attribution first
        const seg = p.running && p.segmentStart ? (Date.now() - p.segmentStart) / 1000 : 0;
        const acc = p.accumulated + seg;
        if (p.type === "stopwatch" || p.mode === "focus") logFocus(acc);
        return {
          ...p,
          type: opts.type,
          mode: "focus",
          accumulated: 0,
          segmentStart: Date.now(),
          running: true,
          taskId: opts.taskId ?? "",
          projectId: opts.projectId ?? "",
          areaId: opts.areaId ?? "",
          taskTitle: opts.taskTitle ?? "",
        };
      });
      setStartSignal((n) => n + 1);
    },
    [logFocus],
  );

  const switchType = useCallback((t: TimerType) =>
    setS((p) => ({ ...p, type: t, running: false, mode: "focus", accumulated: 0, segmentStart: null })), []);
  const setModeFn = useCallback((m: Mode) =>
    setS((p) => ({ ...p, mode: m, running: false, accumulated: 0, segmentStart: null })), []);
  const setWorkMin = useCallback((n: number) => setS((p) => ({ ...p, workMin: Math.max(1, n) })), []);
  const setBreakMin = useCallback((n: number) => setS((p) => ({ ...p, breakMin: Math.max(1, n) })), []);
  const skipBreak = useCallback(() =>
    setS((p) => ({ ...p, mode: "focus", running: false, accumulated: 0, segmentStart: null })), []);
  const attribute = useCallback((a: Attribution) => setS((p) => ({ ...p, ...a })), []);

  const value: Ctx = {
    type: s.type, mode: s.mode, workMin: s.workMin, breakMin: s.breakMin, running: s.running,
    taskId: s.taskId, projectId: s.projectId, areaId: s.areaId, taskTitle: s.taskTitle,
    elapsed, left, total, display, active, startSignal,
    toggle, stopAndLog, startFocus, switchType, setMode: setModeFn, setWorkMin, setBreakMin, skipBreak, attribute,
  };

  return (
    <FocusTimerContext.Provider value={value}>
      {children}
      <FocusMusicLayer />
    </FocusTimerContext.Provider>
  );
}
