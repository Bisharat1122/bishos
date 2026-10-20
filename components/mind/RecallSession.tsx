"use client";

/**
 * Focused daily recall session — a small game: big card, Space to flip,
 * 1–4 to rate (with FSRS next-interval previews), progress bar, undo, and a
 * celebration screen with stats + XP. Shortcuts are bound only while this
 * component is mounted and ignore keystrokes inside text fields.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Brain, Flame, Undo2, Trophy, Timer, Target, Sparkles, StickyNote, CalendarClock, Plus, X } from "lucide-react";
import { Bar, Chip, Kbd, Metric, Section, buttonVariants, cn, toneForPct, Ring } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { useToday, relDay, fmtYmd, dateOf } from "@/lib/day";
import { CARD_STATES, errMsg, isTypingTarget, useMinuteNow, useStable } from "./meta";

type QueueCard = FunctionReturnType<typeof api.recall.queue>[number];
type Rating = 1 | 2 | 3 | 4;
type LogEntry = { cardId: Id<"recallCards">; rating: Rating; first: boolean; xp: number; logId: Id<"recallLogs">; before: QueueCard };

const RATINGS: { rating: Rating; label: string; cls: string; hint: string }[] = [
  { rating: 1, label: "Again", hint: "Forgot", cls: "border-danger/30 bg-danger-soft text-danger hover:border-danger/60" },
  { rating: 2, label: "Hard", hint: "Struggled", cls: "border-warning/30 bg-warning-soft text-warning hover:border-warning/60" },
  { rating: 3, label: "Good", hint: "Recalled", cls: "border-success/30 bg-success-soft text-success hover:border-success/60" },
  { rating: 4, label: "Easy", hint: "Instant", cls: "border-info/30 bg-info-soft text-info hover:border-info/60" },
];

/** Next card: the first one due (30s grace); if only future short-step cards remain, learn ahead. */
function pickNext(list: QueueCard[]): [QueueCard | null, QueueCard[]] {
  if (!list.length) return [null, []];
  const t = Date.now() + 30_000;
  let idx = list.findIndex((c) => c.due <= t);
  if (idx < 0) idx = list.reduce((best, c, i) => (c.due < list[best].due ? i : best), 0);
  return [list[idx], list.filter((_, i) => i !== idx)];
}

const fmtDuration = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return m ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
};

export function RecallSession({
  learningAreaId,
  onReviewNotes,
  onCreate,
}: {
  learningAreaId?: Id<"learningAreas">;
  onReviewNotes?: () => void;
  onCreate?: () => void;
}) {
  const today = useToday();
  const now = useMinuteNow();
  const queue = useStable(useQuery(api.recall.queue, { now, limit: 30, learningAreaId }), learningAreaId ?? "");
  const stats = useStable(useQuery(api.recall.stats, { now, date: today, startOfToday: dateOf(today).getTime() }));
  const review = useMutation(api.recall.review);
  const undoReview = useMutation(api.recall.undoReview);

  const [phase, setPhase] = useState<"intro" | "active" | "done">("intro");
  const [pending, setPending] = useState<QueueCard[]>([]);
  const [current, setCurrent] = useState<QueueCard | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pressed, setPressed] = useState<Rating | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [planned, setPlanned] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [endedAt, setEndedAt] = useState(0);
  const [xpPulse, setXpPulse] = useState(0);
  const busyRef = useRef(false);

  const cleared = useMemo(() => {
    const inPlay = new Set([...pending.map((c) => c._id), ...(current ? [current._id] : [])]);
    return new Set(log.map((l) => l.cardId).filter((id) => !inPlay.has(id))).size;
  }, [log, pending, current]);
  const xpTotal = log.reduce((a, l) => a + l.xp, 0);

  const start = useCallback(() => {
    if (!queue?.length) return;
    const [first, rest] = pickNext(queue);
    setPending(rest);
    setCurrent(first);
    setRevealed(false);
    setLog([]);
    setPlanned(queue.length);
    setStartedAt(Date.now());
    setPhase("active");
  }, [queue]);

  const finish = useCallback(
    (entries: LogEntry[]) => {
      setPhase("done");
      setEndedAt(Date.now());
      setCurrent(null);
      setPending([]);
      const xp = entries.reduce((a, l) => a + l.xp, 0);
      if (entries.length) reward(`Recall session complete · ${entries.length} reviews`, xp || undefined, true);
    },
    [],
  );

  const rate = useCallback(
    async (g: Rating) => {
      if (!current || !revealed || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setPressed(g);
      const card = current;
      try {
        const res = await review({ cardId: card._id, rating: g, date: today });
        const entry: LogEntry = {
          cardId: card._id,
          rating: g,
          first: !log.some((l) => l.cardId === card._id),
          xp: res.xp,
          logId: res.logId,
          before: card,
        };
        const nextLog = [...log, entry];
        setLog(nextLog);
        if (res.xp) setXpPulse((p) => p + 1);
        let list = pending;
        if (res.again) list = [...list, { ...card, ...res.card, previews: res.card.previews }];
        const [next, rest] = pickNext(list);
        setPending(rest);
        setRevealed(false);
        if (next) setCurrent(next);
        else finish(nextLog);
      } catch (e) {
        toast(errMsg(e, "Couldn't save that rating."), { tone: "warning" });
      } finally {
        busyRef.current = false;
        setBusy(false);
        setTimeout(() => setPressed(null), 180);
      }
    },
    [current, revealed, review, today, log, pending, finish],
  );

  const undo = useCallback(async () => {
    const last = log[log.length - 1];
    if (!last || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await undoReview({ logId: last.logId });
      const withoutCopy = pending.filter((c) => c._id !== last.cardId);
      const back = current && current._id !== last.cardId ? [current, ...withoutCopy] : withoutCopy;
      setPending(back);
      setCurrent(last.before);
      setRevealed(true);
      setLog(log.slice(0, -1));
      if (phase === "done") setPhase("active");
      toast("Last rating undone");
    } catch (e) {
      toast(errMsg(e, "Couldn't undo."), { tone: "warning" });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [log, pending, current, phase, undoReview]);

  // Page-scoped keys: Space/Enter reveal (or start), 1–4 rate, Ctrl/⌘+Z undo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e) || e.altKey) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (phase !== "intro" && log.length) {
          e.preventDefault();
          void undo();
        }
        return;
      }
      if (e.ctrlKey || e.metaKey) return;
      const isSpace = e.key === " " || e.code === "Space";
      if (phase === "intro") {
        if ((isSpace || e.key === "Enter") && queue?.length) {
          e.preventDefault();
          start();
        }
        return;
      }
      if (phase !== "active") return;
      if (isSpace || e.key === "Enter") {
        e.preventDefault();
        if (!revealed) setRevealed(true);
        return;
      }
      if (["1", "2", "3", "4"].includes(e.key) && revealed) {
        e.preventDefault();
        void rate(Number(e.key) as Rating);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, revealed, rate, start, undo, queue, log.length]);

  // ── Loading ──
  if (queue === undefined) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="skeleton h-8 w-1/2" />
        <div className="skeleton h-72" />
        <div className="skeleton h-14" />
      </div>
    );
  }

  // ── Done screen ──
  if (phase === "done") {
    const firsts = log.filter((l) => l.first);
    const retention = firsts.length ? Math.round((firsts.filter((l) => l.rating > 1).length / firsts.length) * 100) : 0;
    const dist = RATINGS.map((r) => ({ ...r, n: log.filter((l) => l.rating === r.rating).length }));
    const tomorrow = stats?.forecast?.[1]?.count;
    return (
      <div className="os-rise mx-auto max-w-2xl">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-center shadow-raised sm:p-10">
          <span className="os-pop mx-auto flex size-16 items-center justify-center rounded-2xl bg-success-soft text-success">
            <Trophy className="h-8 w-8" />
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Session complete</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Testing yourself is the study habit with the strongest evidence. That was real learning.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Reviews" value={log.length} sub={`${new Set(log.map((l) => l.cardId)).size} cards`} />
            <Metric label="First-try recall" value={`${retention}%`} tone={retention >= 85 ? "success" : retention >= 70 ? "info" : "warning"} />
            <Metric label="XP earned" value={`+${xpTotal}`} tone="success" />
            <Metric label="Time" value={fmtDuration((endedAt || Date.now()) - startedAt)} />
          </div>
          {log.length > 0 && (
            <div className="mt-6">
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                {dist.map((d) =>
                  d.n ? (
                    <div
                      key={d.rating}
                      className={cn("h-full", d.rating === 1 ? "bg-danger" : d.rating === 2 ? "bg-warning" : d.rating === 3 ? "bg-success" : "bg-info")}
                      style={{ width: `${(d.n / log.length) * 100}%` }}
                    />
                  ) : null,
                )}
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {dist.map((d) => (
                  <span key={d.rating}>
                    {d.label} <b className="tabular-nums text-foreground">{d.n}</b>
                  </span>
                ))}
              </div>
            </div>
          )}
          {tomorrow != null && (
            <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" /> Tomorrow: {tomorrow} card{tomorrow === 1 ? "" : "s"} due
              {stats?.streak ? (
                <>
                  {" · "}
                  <Flame className="h-3.5 w-3.5 text-warning" /> {stats.streak}-day streak
                </>
              ) : null}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {queue.length > 0 && (
              <button onClick={start} className={buttonVariants()}>
                <Brain /> Keep going · {queue.length} more
              </button>
            )}
            {onReviewNotes && (
              <button onClick={onReviewNotes} className={buttonVariants({ variant: queue.length ? "outline" : "default" })}>
                <StickyNote /> Review notes too
              </button>
            )}
            <Link href="/today" className={buttonVariants({ variant: "outline" })}>
              Back to Today
            </Link>
            {log.length > 0 && (
              <button onClick={() => void undo()} disabled={busy} className={buttonVariants({ variant: "ghost" })}>
                <Undo2 /> Undo last
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Intro / empty ──
  if (phase === "intro" || !current) {
    if (!queue.length) {
      const nextDay = stats?.forecast.find((f, i) => i > 0 && f.count > 0);
      return (
        <div className="os-rise mx-auto max-w-2xl rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center sm:p-12">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
            <Sparkles className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-xl font-semibold">All caught up</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {stats?.total
              ? nextDay
                ? `Nothing due right now. Next up: ${nextDay.count} card${nextDay.count === 1 ? "" : "s"} ${relDay(nextDay.date, today).toLowerCase()}.`
                : "Nothing due this week. Your memory is in good shape."
              : "Recall cards turn what you learn into what you remember. Make one from a note, a book takeaway, or by hand."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {onCreate && (
              <button onClick={onCreate} className={buttonVariants()}>
                <Plus /> Create a card
              </button>
            )}
            {onReviewNotes && (
              <button onClick={onReviewNotes} className={buttonVariants({ variant: "outline" })}>
                <StickyNote /> Review notes instead
              </button>
            )}
          </div>
        </div>
      );
    }
    const byArea = new Map<string, number>();
    for (const c of queue) byArea.set(c.areaName ?? "No area", (byArea.get(c.areaName ?? "No area") ?? 0) + 1);
    const nNew = queue.filter((c) => c.fsrsState === "new").length;
    const minutes = Math.max(1, Math.round((queue.length * 12) / 60));
    return (
      <div className="os-rise mx-auto max-w-2xl">
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-raised sm:p-10">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Brain className="h-7 w-7" />
          </span>
          <div className="mt-5 text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">{queue.length}</div>
          <p className="mt-1 text-sm text-muted-foreground">
            card{queue.length === 1 ? "" : "s"} ready · about {minutes} min{nNew ? ` · ${nNew} new` : ""}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {[...byArea.entries()].map(([name, n]) => (
              <Chip key={name} tone="outline">
                {name} <span className="tabular-nums text-muted-foreground">{n}</span>
              </Chip>
            ))}
          </div>
          <button onClick={start} className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full sm:w-auto sm:min-w-[220px]")}>
            Start session <Kbd className="ml-1 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground">Space</Kbd>
          </button>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {stats?.streak ? (
              <span className="inline-flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-warning" /> {stats.streak}-day streak
              </span>
            ) : null}
            {stats?.retention != null && (
              <span className="inline-flex items-center gap-1">
                <Target className="h-3.5 w-3.5" /> {stats.retention}% retention (30d)
              </span>
            )}
            {stats ? <span>{stats.reviewedToday} reviewed today</span> : null}
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          <Kbd>Space</Kbd> reveal · <Kbd>1</Kbd>–<Kbd>4</Kbd> rate · <Kbd>Ctrl</Kbd>+<Kbd>Z</Kbd> undo
        </p>
      </div>
    );
  }

  // ── Active ──
  const remaining = pending.length + 1;
  const pct = planned ? (cleared / Math.max(planned, cleared + remaining)) * 100 : 0;
  const state = CARD_STATES[current.fsrsState] ?? CARD_STATES.new;
  return (
    <div className="mx-auto max-w-2xl">
      {/* HUD */}
      <div className="mb-4 flex items-center gap-3">
        <Bar value={pct} tone="success" height="h-2" className="flex-1" />
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{remaining} left</span>
        <span
          key={xpPulse}
          className={cn("shrink-0 rounded-md bg-primary px-2 py-0.5 text-xs font-semibold tabular-nums text-primary-foreground", xpPulse > 0 && "os-pop")}
        >
          +{xpTotal} XP
        </span>
      </div>

      {/* Card (both faces share one grid cell so height fits the longer side) */}
      <div key={`${current._id}-${current.reps}`} className="os-rise [perspective:1400px]">
        <div
          onClick={() => !revealed && setRevealed(true)}
          className={cn(
            "grid transition-transform duration-500 ease-out [transform-style:preserve-3d] motion-reduce:transition-none",
            revealed ? "[transform:rotateY(180deg)]" : "cursor-pointer",
          )}
        >
          <CardFace card={current} stateLabel={state.label} stateTone={state.tone}>
            <p className="whitespace-pre-wrap text-center text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{current.front}</p>
            <p className="mt-6 text-center text-xs text-muted-foreground">Answer in your head, then flip.</p>
          </CardFace>
          <CardFace card={current} stateLabel={state.label} stateTone={state.tone} back>
            <p className="whitespace-pre-wrap text-center text-sm text-muted-foreground">{current.front}</p>
            <div className="mx-auto my-4 h-px w-16 bg-border" />
            <p className="whitespace-pre-wrap text-center text-lg leading-relaxed sm:text-xl">{current.back}</p>
          </CardFace>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4">
        {!revealed ? (
          <button onClick={() => setRevealed(true)} className={cn(buttonVariants({ size: "lg" }), "h-14 w-full text-base")}>
            Show answer <Kbd className="ml-1 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground">Space</Kbd>
          </button>
        ) : (
          <div className="os-rise grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RATINGS.map((r) => {
              const p = current.previews.find((x) => x.rating === r.rating);
              return (
                <button
                  key={r.rating}
                  onClick={() => void rate(r.rating)}
                  disabled={busy}
                  className={cn(
                    "group flex h-[76px] flex-col items-center justify-center gap-0.5 rounded-xl border-2 font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-70",
                    r.cls,
                    pressed === r.rating && "os-pop scale-[0.97]",
                  )}
                >
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="text-lg font-semibold leading-none tabular-nums">{p?.label ?? "—"}</span>
                  <span className="text-[10px] opacity-70">
                    {r.hint} · {r.rating}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <button
            onClick={() => void undo()}
            disabled={!log.length || busy}
            className="inline-flex items-center gap-1 rounded px-1.5 py-1 hover:text-foreground disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" /> Undo
          </button>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <Timer className="h-3.5 w-3.5" /> {log.length} reviewed
          </span>
          <button
            onClick={() => finish(log)}
            className="inline-flex items-center gap-1 rounded px-1.5 py-1 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> End session
          </button>
        </div>
      </div>
    </div>
  );
}

function CardFace({
  card,
  back,
  stateLabel,
  stateTone,
  children,
}: {
  card: QueueCard;
  back?: boolean;
  stateLabel: string;
  stateTone: Parameters<typeof Chip>[0]["tone"];
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col rounded-2xl border border-border bg-card p-5 shadow-raised [backface-visibility:hidden] [grid-area:1/1] sm:min-h-[340px] sm:p-8",
        back && "[transform:rotateY(180deg)]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {card.areaName && (
            <Chip tone="outline" className="max-w-[160px] truncate">
              <span className="size-1.5 shrink-0 rounded-full" style={{ background: card.areaColor ?? "var(--chart-2)" }} />
              {card.areaName}
            </Chip>
          )}
          <Chip tone={stateTone}>{stateLabel}</Chip>
        </div>
        {back && card.noteId && (
          <Link
            href={`/notes/${card.noteId}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex max-w-[45%] items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"
          >
            <StickyNote className="h-3 w-3 shrink-0" />
            <span className="truncate">{card.noteTitle ?? "Source note"}</span>
          </Link>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center py-6">{children}</div>
    </div>
  );
}

/** Compact stats strip used at the top of the Recall page. */
export function RecallStatsStrip() {
  const today = useToday();
  const now = useMinuteNow();
  const stats = useStable(useQuery(api.recall.stats, { now, date: today, startOfToday: dateOf(today).getTime() }));
  if (!stats) return <div className="skeleton h-[92px]" />;
  const max = Math.max(1, ...stats.forecast.map((f) => f.count));
  return (
    <Section bodyClassName="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.6fr)] sm:items-center">
      <Metric label="Due now" value={stats.dueNow} sub={`${stats.dueToday} today`} />
      <Metric label="Reviewed today" value={stats.reviewedToday} sub={`${stats.cardsReviewedToday} cards`} />
      <div className="flex items-center gap-3">
        <Ring value={stats.retention ?? 0} size={44} stroke={5} tone={stats.retention == null ? "primary" : toneForPct(stats.retention)}>
          <span className="text-[10px] font-semibold tabular-nums">{stats.retention == null ? "—" : `${stats.retention}`}</span>
        </Ring>
        <Metric label="Retention 30d" value={stats.retention == null ? "—" : `${stats.retention}%`} sub="target 90%" />
      </div>
      <Metric
        label="Streak"
        value={
          <span className="inline-flex items-center gap-1">
            {stats.streak}
            <Flame className={cn("h-5 w-5", stats.streak ? "text-warning" : "text-muted-foreground")} />
          </span>
        }
        sub={`${stats.total} cards · ${stats.matureCount} mature`}
      />
      <div className="col-span-2 sm:col-span-1">
        <div className="flex h-12 items-end gap-1.5">
          {stats.forecast.map((f, i) => (
            <div key={f.date} className="flex flex-1 flex-col items-center gap-1" title={`${relDay(f.date, today)}: ${f.count}`}>
              <div
                className={cn("w-full rounded-sm transition-all", i === 0 ? "bg-primary" : "bg-chart-2")}
                style={{ height: `${Math.max(3, (f.count / max) * 36)}px`, opacity: f.count ? 1 : 0.35 }}
              />
              <span className="text-[9px] text-muted-foreground">{i === 0 ? "Today" : fmtYmd(f.date, { weekday: "short" })}</span>
            </div>
          ))}
        </div>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">7-day forecast</p>
      </div>
    </Section>
  );
}
