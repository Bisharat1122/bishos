"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Moon, Inbox, CheckCircle2, Trash2, StickyNote, ListTodo, CalendarClock, Flame, Shield, PartyPopper, Sparkles } from "lucide-react";
import { RitualShell, StepTitle, ChoiceRow } from "./RitualShell";
import { cn, buttonVariants, inputClass, Chip, Ring, AreaDot, areaColor, EmptyHint } from "@/components/os/kit";
import { reward, celebrate, toast, errorMessage } from "@/components/os/celebrate";
import { useCockpit, useCoarseNow, useStable } from "@/components/os/useCockpit";
import { clockLabel, fmtYmd, relDay, ymdOf } from "@/lib/day";

type Decision = "done" | "tomorrow" | "backlog" | "someday" | "drop";
type HabitKind = "done" | "min" | "stretch" | "skip" | "clear";

export function ShutdownRitual({ onClose }: { onClose: () => void }) {
  const { args, data } = useCockpit();
  // Same args as the Inbox page / Warmup (1-min aligned clock, "open" view) → shared, already-warm subscription.
  const inboxNow = useCoarseNow(60_000);
  const inbox = useStable(useQuery(api.inbox.list, { now: inboxNow, view: "open" }));
  const look = useQuery(api.today.lookahead, { date: args.date, dayStart: args.dayStart });
  const toTask = useMutation(api.inbox.toTask);
  const toNote = useMutation(api.inbox.toNote);
  const discard = useMutation(api.inbox.discard);
  const markDone = useMutation(api.inbox.markDone);
  const logHabit = useMutation(api.habits.log);
  const complete = useMutation(api.days.completeShutdown);

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [resumeNote, setResumeNote] = useState("");
  const [progressLine, setProgressLine] = useState("");
  const [lesson, setLesson] = useState("");
  const [win, setWin] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [tomorrowTop, setTomorrowTop] = useState<Id<"tasks">[]>([]);
  const [finished, setFinished] = useState<{ xp: number; score: number } | null>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (!data || seeded.current) return;
    seeded.current = true;
    const d = data.day;
    setResumeNote(d?.resumeNote ?? "");
    setProgressLine(d?.progressLine ?? "");
    setLesson(d?.lesson ?? "");
    setWin(d?.journal?.win ?? "");
    setGratitude(d?.journal?.gratitude ?? "");
  }, [data]);

  useEffect(() => {
    if (look && tomorrowTop.length === 0 && look.tomorrowTop.length) setTomorrowTop(look.tomorrowTop as Id<"tasks">[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look]);

  const leftovers = useMemo(() => {
    if (!data) return [] as Doc<"tasks">[];
    const seen = new Set<string>();
    return [...data.top3, ...data.planned, ...data.scheduledToday].filter((t) => {
      if (t.status === "done" || seen.has(t._id)) return false;
      seen.add(t._id);
      return true;
    });
  }, [data]);

  const steps = [
    { key: "inbox", label: "Inbox zero" },
    { key: "leftovers", label: "Decide leftovers" },
    { key: "habits", label: "Habits" },
    { key: "ahead", label: "Look ahead" },
    { key: "resume", label: "Ready to resume" },
    { key: "reflect", label: "Reflect" },
    { key: "done", label: "Shutdown complete" },
  ];
  const cur = steps[step]?.key;

  if (!data) {
    return (
      <RitualShell kicker="Evening shutdown" kickerIcon={Moon} steps={[{ key: "l", label: "Loading" }]} current={0} onClose={onClose} hideFooter>
        <div className="skeleton h-40" />
      </RitualShell>
    );
  }

  const areaOf = (id?: string) => data.areas.find((a) => a._id === id);
  const undecided = leftovers.filter((t) => !decisions[t._id]).length;
  const defaultArea = data.areas[0]?._id as Id<"lifeAreas"> | undefined;

  const finish = async () => {
    setBusy(true);
    try {
      const topDone = data.top3.filter((t) => t.status === "done" || decisions[t._id] === "done").length;
      const score = Math.min(
        100,
        (data.day?.startupAt ? 20 : 0) +
          (data.top3.length ? Math.round((topDone / data.top3.length) * 30) : 0) +
          (data.habits.length ? Math.round((data.habitsDone / Math.max(1, data.habits.filter((h) => h.kind !== "skip").length)) * 20) : 0) +
          20 +
          (progressLine.trim() || win.trim() ? 10 : 0),
      );
      const r = await complete({
        date: args.date,
        decisions: Object.entries(decisions).map(([taskId, action]) => ({ taskId: taskId as Id<"tasks">, action })),
        resumeNote: resumeNote.trim() || undefined,
        progressLine: progressLine.trim() || undefined,
        lesson: lesson.trim() || undefined,
        journal: win.trim() || gratitude.trim() ? { win: win.trim() || undefined, gratitude: gratitude.trim() || undefined } : undefined,
        tomorrowTop: tomorrowTop.length ? tomorrowTop : undefined,
        dayScore: score,
      });
      try {
        const until = new Date();
        until.setDate(until.getDate() + 1);
        until.setHours(6, 0, 0, 0);
        localStorage.setItem("bishos.eveningUntil", String(until.getTime()));
      } catch {
        /* ignore */
      }
      setFinished({ xp: r.xp, score });
      celebrate(1.3);
      reward("Shutdown complete. You're done for today.", r.xp || undefined);
      setStep(steps.length - 1);
    } catch (e) {
      toast(errorMessage(e, "Couldn't complete the shutdown — try again"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  /** Run an inbox action; surface failures instead of swallowing them. */
  const act = (p: Promise<unknown>) => void p.catch((e) => toast(errorMessage(e, "Couldn't process that item"), { tone: "warning" }));

  const next = () => {
    if (cur === "reflect") return void finish();
    if (cur === "done") return onClose();
    setStep((s) => s + 1);
  };

  const habit = async (id: Id<"habits">, kind: HabitKind) => {
    try {
      await logHabit({ id, date: args.date, kind, today: args.date });
    } catch (e) {
      toast(errorMessage(e, "Couldn't log habit"), { tone: "warning" });
    }
  };

  return (
    <RitualShell
      kicker="Evening shutdown"
      kickerIcon={Moon}
      steps={steps}
      current={step}
      onBack={cur === "done" ? undefined : () => setStep((s) => Math.max(0, s - 1))}
      onNext={next}
      nextLabel={cur === "reflect" ? "Shutdown complete" : cur === "done" ? "Close" : "Continue"}
      busy={busy}
      onClose={onClose}
    >
      {cur === "inbox" && (
        <div>
          <StepTitle title="Empty the inbox" hint="Give every capture a home so your brain can let go. Two-minute items: just do them." />
          {inbox === undefined && <div className="skeleton h-32" />}
          {inbox && inbox.length === 0 && <EmptyHint icon={Inbox} title="Inbox zero 🎉" hint="Nothing waiting. Beautiful." />}
          <div className="space-y-2">
            {inbox?.slice(0, 12).map((i) => (
              <div key={i._id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm">{i.text}</span>
                <div className="flex gap-1">
                  {defaultArea && (
                    <button
                      onClick={() => act(toTask({ id: i._id, title: i.text.slice(0, 200), lifeAreaId: defaultArea, date: args.date }))}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                      title="Make it a task (backlog)"
                    >
                      <ListTodo /> Task
                    </button>
                  )}
                  <button onClick={() => act(toNote({ id: i._id, title: i.text.slice(0, 80), noteType: "fleeting", date: args.date }))} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <StickyNote /> Note
                  </button>
                  <button onClick={() => act(markDone({ id: i._id, date: args.date }))} className={buttonVariants({ variant: "ghost", size: "sm" })} title="Done (2-minute rule)" aria-label="Done (2-minute rule)">
                    <CheckCircle2 />
                  </button>
                  <button onClick={() => act(discard({ id: i._id }))} className={buttonVariants({ variant: "ghost", size: "sm" })} title="Discard" aria-label="Discard">
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))}
            {inbox && inbox.length > 12 && (
              <p className="text-xs text-muted-foreground">+{inbox.length - 12} more — finish them on the Inbox page tomorrow.</p>
            )}
          </div>
        </div>
      )}

      {cur === "leftovers" && (
        <div>
          <StepTitle title="Decide every leftover" hint="Nothing rolls forward silently. Tomorrow, backlog, someday — or drop it with a clear conscience." />
          {leftovers.length === 0 ? (
            <EmptyHint icon={CheckCircle2} title="Everything planned today is done" hint="That's what a good day looks like." />
          ) : (
            <>
              <div className="mb-3 flex gap-2">
                <button onClick={() => setDecisions(Object.fromEntries(leftovers.map((t) => [t._id, "tomorrow"])))} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  All → tomorrow
                </button>
              </div>
              <div className="space-y-2">
                {leftovers.map((t) => (
                  <div key={t._id} className="rounded-xl border border-border bg-card p-3">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <AreaDot color={areaColor(areaOf(t.lifeAreaId))} />
                      <span className="truncate">{t.title}</span>
                      {data.day?.top3?.includes(t._id) && <Chip tone="default">Top</Chip>}
                    </p>
                    <div className="mt-2">
                      <ChoiceRow<Decision>
                        value={decisions[t._id]}
                        onChange={(v) => setDecisions((d) => ({ ...d, [t._id]: v }))}
                        options={[
                          { value: "done", label: "Actually done", tone: "success" },
                          { value: "tomorrow", label: "Tomorrow" },
                          { value: "backlog", label: "Backlog" },
                          { value: "someday", label: "Someday" },
                          { value: "drop", label: "Drop", tone: "danger" },
                        ]}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {undecided > 0 && <p className="mt-3 text-xs text-warning">{undecided} still undecided — they&apos;ll show up tomorrow morning.</p>}
            </>
          )}
        </div>
      )}

      {cur === "habits" && (
        <div>
          <StepTitle title="Tick today's habits" hint="Did the 2-minute version? That counts. Planned skip? Your streak is safe." />
          {data.habits.length === 0 ? (
            <EmptyHint title="No habits yet" hint="Add 1–3 keystone habits on the Habits page." />
          ) : (
            <div className="space-y-2">
              {data.habits.map((h) => (
                <div key={h._id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{h.title}</p>
                    {h.minVersion && <p className="text-xs text-muted-foreground">Minimum: {h.minVersion}</p>}
                  </div>
                  <ChoiceRow<HabitKind>
                    value={(h.kind ?? undefined) as HabitKind | undefined}
                    onChange={(k) => void habit(h._id, h.kind === k ? "clear" : k)}
                    options={[
                      { value: "done", label: "Done", tone: "success" },
                      { value: "min", label: "Minimum" },
                      { value: "skip", label: "Planned skip" },
                    ]}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {cur === "ahead" && (
        <div>
          <StepTitle title="Glance at tomorrow" hint="See what's coming so nothing ambushes you. Optionally pre-pick tomorrow's Top 3." />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tomorrow · {look ? fmtYmd(look.tomorrow) : ""}</p>
              <div className="mt-2 space-y-1.5">
                {look?.blocks.map((b) => (
                  <p key={b._id} className="flex items-center gap-2 text-sm">
                    <span className="w-16 shrink-0 text-xs tabular-nums text-muted-foreground">{clockLabel(b.startMin)}</span>
                    <span className="truncate">{b.title}</span>
                  </p>
                ))}
                {look && look.blocks.length === 0 && <p className="text-sm text-muted-foreground">No blocks yet.</p>}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Deadlines · next 2 weeks</p>
              <div className="mt-2 space-y-1.5">
                {look?.deadlines.map((t) => (
                  <p key={t._id} className="flex items-center gap-2 text-sm">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{relDay(ymdOf(t.dueDate!))}</span>
                  </p>
                ))}
                {look && look.deadlines.length === 0 && <p className="text-sm text-muted-foreground">Clear runway.</p>}
              </div>
            </div>
          </div>
          <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tomorrow&apos;s Top 3 (optional) · {tomorrowTop.length}/3
          </p>
          <div className="max-h-[34vh] space-y-1.5 overflow-y-auto pr-1">
            {[...leftovers.filter((t) => decisions[t._id] === "tomorrow"), ...data.candidates.filter((t) => !leftovers.some((l) => l._id === t._id))]
              .slice(0, 20)
              .map((t) => {
                const on = tomorrowTop.includes(t._id);
                return (
                  <button
                    key={t._id}
                    onClick={() => setTomorrowTop((p) => (on ? p.filter((x) => x !== t._id) : p.length >= 3 ? p : [...p, t._id]))}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition",
                      on ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent/40",
                    )}
                  >
                    <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold", on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                      {on ? tomorrowTop.indexOf(t._id) + 1 : ""}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {cur === "resume" && (
        <div>
          <StepTitle
            title="Leave a note for tomorrow-you"
            hint="Where exactly did you stop, and what's the very next step? This kills 'attention residue' — tomorrow you start in seconds."
          />
          <textarea
            autoFocus
            value={resumeNote}
            onChange={(e) => setResumeNote(e.target.value)}
            rows={5}
            placeholder="Stopped at the pricing section of the Acme proposal. Next: add the 3 package options and send to Sara before 11."
            className={cn(inputClass, "w-full py-3 text-base leading-relaxed")}
          />
        </div>
      )}

      {cur === "reflect" && (
        <div>
          <StepTitle title="What moved forward?" hint="Noticing progress is the #1 driver of good workdays. One line each — it takes a minute." />
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold">Progress today</span>
              <input value={progressLine} onChange={(e) => setProgressLine(e.target.value)} placeholder="Sent the proposal; recorded 2 shorts" className={cn(inputClass, "mt-1.5 h-11 w-full text-base")} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Win of the day</span>
              <input value={win} onChange={(e) => setWin(e.target.value)} placeholder="Client said yes to the call" className={cn(inputClass, "mt-1.5 h-11 w-full text-base")} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Lesson learned</span>
              <input value={lesson} onChange={(e) => setLesson(e.target.value)} placeholder="Booking the next call before hanging up works" className={cn(inputClass, "mt-1.5 h-11 w-full text-base")} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Grateful for (optional)</span>
              <input value={gratitude} onChange={(e) => setGratitude(e.target.value)} className={cn(inputClass, "mt-1.5 h-11 w-full text-base")} />
            </label>
          </div>
        </div>
      )}

      {cur === "done" && (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="os-pop">
            <Ring value={finished?.score ?? data.dayScore} size={140} stroke={10} tone="success">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-semibold tabular-nums">{finished?.score ?? data.dayScore}</span>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">day score</span>
              </div>
            </Ring>
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight">Shutdown complete.</h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Everything is captured, decided and planned. Your brain is allowed to rest now — work can wait until tomorrow.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {finished?.xp ? <Chip tone="default"><Sparkles /> +{finished.xp} XP</Chip> : null}
            <Chip tone="warning"><Flame /> {data.game.streak.streak} day streak</Chip>
            <Chip tone="secondary"><Shield /> {data.game.streak.shieldsLeft} shields left</Chip>
            <Chip tone="secondary"><PartyPopper /> Level {data.game.level.level} · {data.game.level.title}</Chip>
          </div>
        </div>
      )}
    </RitualShell>
  );
}
