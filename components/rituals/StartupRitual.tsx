"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Sun, Moon as MoonIcon, BatteryLow, Flame, Plus, Target, CalendarClock, AlertTriangle, Sparkles, Shield, Zap, Coffee, Palmtree,
} from "lucide-react";
import { RitualShell, StepTitle, FaceScale, ChoiceRow } from "./RitualShell";
import { cn, buttonVariants, inputClass, Chip, Ring, Bar, AreaDot, areaColor, Segmented } from "@/components/os/kit";
import { reward, celebrate, toast, errorMessage } from "@/components/os/celebrate";
import { useCockpit } from "@/components/os/useCockpit";
import { parseQuickTask } from "@/lib/parse";
import { addDaysYmd, fmtMin, fmtYmd, greeting } from "@/lib/day";

type Decision = "today" | "tomorrow" | "backlog" | "someday" | "drop";
type Shape = "big3" | "ivylee" | "135";
type DayType = "focus" | "buffer" | "free";

const SHAPE_MAX: Record<Shape, number> = { big3: 3, ivylee: 6, "135": 9 };
const SHAPE_INFO: Record<Shape, { label: string; hint: string }> = {
  big3: { label: "Big 3", hint: "Three things that make today a win." },
  ivylee: { label: "Ivy Lee 6", hint: "Six ranked items, worked strictly in order." },
  "135": { label: "1 · 3 · 5", hint: "One big, three medium, five small." },
};
const ESTIMATES = [15, 30, 60, 90, 120];
const IF_THEN_IDEAS = [
  { trigger: "I reach for my phone during a focus block", response: "I put it in another room and do 5 more minutes" },
  { trigger: "a client message pops up before noon", response: "I note it in the Inbox and reply in my afternoon office hours" },
  { trigger: "I feel stuck on my Top 1", response: "I write the very next physical step and do only that" },
  { trigger: "it's 4 pm and I haven't done outreach", response: "I send 10 messages before anything else" },
];

export function StartupRitual({ onClose }: { onClose: () => void }) {
  const { args, data } = useCockpit();
  const saveCheckIn = useMutation(api.days.saveCheckIn);
  const complete = useMutation(api.days.completeStartup);
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState<number | undefined>();
  const [energy, setEnergy] = useState<number | undefined>();
  const [mood, setMood] = useState<number | undefined>();
  const [lowEnergy, setLowEnergy] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [dayType, setDayType] = useState<DayType>("focus");
  const [shape, setShape] = useState<Shape>("big3");
  const [intention, setIntention] = useState("");
  const [top, setTop] = useState<Id<"tasks">[]>([]);
  const [quick, setQuick] = useState("");
  const [capacityH, setCapacityH] = useState(5.5);
  const [trigger, setTrigger] = useState("");
  const [response, setResponse] = useState("");
  const seeded = useRef(false);

  // Seed from an existing day doc (re-running the ritual) and settings.
  useEffect(() => {
    if (!data || seeded.current) return;
    seeded.current = true;
    const d = data.day;
    const ci = d?.checkIn;
    if (ci?.sleepHours != null) setSleepHours(ci.sleepHours);
    setSleepQuality(ci?.sleepQuality);
    setEnergy(ci?.energy);
    setMood(ci?.mood);
    if (d?.dayType) setDayType(d.dayType);
    else if (data.week.freeDay === data.date) setDayType("free");
    if (d?.dailyShape) setShape(d.dailyShape);
    if (d?.intention) setIntention(d.intention);
    if (d?.ifThen) {
      setTrigger(d.ifThen.trigger);
      setResponse(d.ifThen.response);
    }
    if (d?.lowEnergy) setLowEnergy(true);
    // From the cockpit's top3 (existing tasks only): raw day.top3 can hold ids of
    // deleted/dropped tasks, which would be invisible yet still use up a slot.
    setTop(data.top3.map((t) => t._id));
    setCapacityH(Math.round(((d?.capacityMin ?? data.capacity.capacityMin) / 60) * 2) / 2);
  }, [data]);

  const leftovers = data?.leftovers ?? [];
  const max = lowEnergy ? 1 : SHAPE_MAX[shape];

  const steps = useMemo(() => {
    const s = [
      { key: "hello", label: "Good morning" },
      { key: "checkin", label: "Check-in" },
    ];
    if (leftovers.length) s.push({ key: "yesterday", label: "Close yesterday" });
    s.push(
      { key: "shape", label: "Day shape" },
      { key: "top", label: lowEnergy ? "Top 1" : "Top priorities" },
      { key: "capacity", label: "Capacity" },
      { key: "ifthen", label: "If–then plan" },
      { key: "commit", label: "Lock it in" },
    );
    return s;
  }, [leftovers.length, lowEnergy]);
  const cur = steps[step]?.key;

  const taskMap = useMemo(() => {
    const m = new Map<string, Doc<"tasks">>();
    if (!data) return m;
    for (const t of [...data.candidates, ...data.top3, ...data.planned, ...data.scheduledToday, ...data.dueToday, ...data.leftovers]) m.set(t._id, t);
    return m;
  }, [data]);

  const areaOf = (id?: string) => data?.areas.find((a) => a._id === id);

  if (!data) {
    return (
      <RitualShell kicker="Morning start-up" kickerIcon={Sun} steps={[{ key: "l", label: "Loading" }]} current={0} onClose={onClose} hideFooter>
        <div className="space-y-3">
          <div className="skeleton h-10 w-2/3" />
          <div className="skeleton h-40" />
        </div>
      </RitualShell>
    );
  }

  const next = async () => {
    if (cur === "checkin") {
      setBusy(true);
      try {
        const r = await saveCheckIn({ date: args.date, sleepHours, sleepQuality, energy, mood });
        if (r.lowEnergySuggested && !lowEnergy) {
          setLowEnergy(true);
          toast("Low-energy day mode on", { tone: "info", sub: "Top 1 only, habits at minimum. Be kind to yourself." });
        }
      } catch (e) {
        // Don't block the ritual on the check-in — it can be re-saved later.
        toast(errorMessage(e, "Couldn't save the check-in"), { tone: "warning" });
      } finally {
        setBusy(false);
      }
    }
    if (cur === "commit") return finish();
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };

  const finish = async () => {
    setBusy(true);
    try {
      const r = await complete({
        date: args.date,
        top3: top.slice(0, max),
        dailyShape: shape,
        intention: intention.trim() || undefined,
        ifThen: trigger.trim() && response.trim() ? { trigger: trigger.trim(), response: response.trim() } : undefined,
        capacityMin: Math.round(capacityH * 60),
        dayType,
        lowEnergy,
        decisions: Object.entries(decisions).map(([taskId, action]) => ({ taskId: taskId as Id<"tasks">, action })),
      });
      celebrate(1.1);
      reward("Day locked in. Go win it.", r.xp || undefined);
      onClose();
    } catch (e) {
      toast(errorMessage(e, "Couldn't lock in your day — try again"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const addQuick = async () => {
    const p = parseQuickTask(quick, data.areas);
    if (!p.title) return;
    const area = (p.areaId ?? data.areas[0]?._id) as Id<"lifeAreas"> | undefined;
    if (!area) {
      toast("Create a Life Area first (Settings → Areas)", { tone: "warning" });
      return;
    }
    try {
      const id = await createTask({
        title: p.title,
        priority: p.priority ?? "high",
        lifeAreaId: area,
        plannedFor: args.date,
        estimateMin: p.estimateMin,
      });
      setQuick("");
      setTop((t) => (t.length < max ? [...t, id] : t));
    } catch (e) {
      toast(errorMessage(e, "Couldn't add the task"), { tone: "warning" });
    }
  };

  const toggleTop = (id: Id<"tasks">) =>
    setTop((t) => (t.includes(id) ? t.filter((x) => x !== id) : t.length >= max ? t : [...t, id]));

  // capacity numbers
  const todayOpen = [
    ...top.map((id) => taskMap.get(id)).filter(Boolean),
    ...data.planned.filter((t) => t.status !== "done" && !top.includes(t._id)),
    ...data.scheduledToday.filter((t) => !top.includes(t._id)),
    ...leftovers.filter((t) => decisions[t._id] === "today" && !top.includes(t._id)),
  ] as Doc<"tasks">[];
  const plannedMin = todayOpen.reduce((s, t) => s + (t.estimateMin ?? 30), 0) + data.capacity.meetingMin;
  const capMin = Math.round(capacityH * 60);
  const over = plannedMin - capMin;

  return (
    <RitualShell
      kicker="Morning start-up"
      kickerIcon={Sun}
      steps={steps}
      current={step}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={() => void next()}
      nextLabel={cur === "commit" ? "Lock in my day" : cur === "hello" ? "Let's go" : "Continue"}
      nextDisabled={cur === "top" && top.length === 0 && dayType !== "free"}
      busy={busy}
      onClose={onClose}
    >
      {cur === "hello" && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">{fmtYmd(data.date, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting()}
            {data.name ? `, ${data.name}` : ""}.
          </h1>
          <p className="mt-3 text-muted-foreground">Five calm minutes now buy you a focused day. Let&apos;s set it up.</p>

          {data.freshStart && (
            <div className="mt-6 rounded-xl border border-info/30 bg-info-soft p-4 text-sm text-info">
              <p className="font-semibold">Fresh start ✨</p>
              <p className="mt-1 opacity-90">
                You&apos;ve been away {data.freshStart.daysAway} days — that&apos;s normal. No guilt: we&apos;ll decide what still matters and start clean today.
              </p>
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {data.yesterday?.resumeNote && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Where you stopped</p>
                <p className="mt-1.5 text-sm">{data.yesterday.resumeNote}</p>
              </div>
            )}
            {data.yesterday?.progressLine && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Yesterday&apos;s progress</p>
                <p className="mt-1.5 text-sm">{data.yesterday.progressLine}</p>
              </div>
            )}
            {data.cycle && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">12-week cycle</p>
                <p className="mt-1.5 text-sm font-medium">
                  Week {Math.min(12, data.cycle.week)} of 12 · {data.cycle.name}
                </p>
                <Bar value={(Math.min(12, data.cycle.week) / 12) * 100} className="mt-2" />
              </div>
            )}
            {data.week.big3.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">This week&apos;s Big 3</p>
                <ul className="mt-1.5 space-y-1 text-sm">
                  {data.week.big3.map((b, i) => (
                    <li key={i} className={cn(b.done && "os-done-text")}>
                      {i + 1}. {b.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
            <Flame className="h-4 w-4 text-warning" />
            <span>
              Ritual streak <b className="text-foreground">{data.game.streak.streak}</b> days ·
              <Shield className="mx-1 inline h-3.5 w-3.5" /> {data.game.streak.shieldsLeft} shields left this week
            </span>
          </div>
        </div>
      )}

      {cur === "checkin" && (
        <div>
          <StepTitle title="How are you, really?" hint="Ten seconds. Your energy decides how ambitious today should be." />
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Sleep last night</span>
                <span className="tabular-nums text-muted-foreground">{sleepHours}h</span>
              </div>
              <input
                type="range"
                min={3}
                max={11}
                step={0.5}
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Sleep quality</p>
              <FaceScale value={sleepQuality} onChange={setSleepQuality} faces={["😵", "😪", "😐", "😌", "😴"]} labels={["Awful", "Poor", "OK", "Good", "Great"]} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Energy</p>
              <FaceScale value={energy} onChange={setEnergy} faces={["🪫", "😮‍💨", "🙂", "⚡", "🚀"]} labels={["Empty", "Low", "OK", "Good", "Charged"]} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Mood</p>
              <FaceScale value={mood} onChange={setMood} labels={["Rough", "Meh", "Fine", "Good", "Great"]} />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm">
              <input type="checkbox" checked={lowEnergy} onChange={(e) => setLowEnergy(e.target.checked)} className="size-4 accent-[var(--primary)]" />
              <BatteryLow className="h-4 w-4 text-muted-foreground" />
              <span>
                <b>Low-energy day</b> — Top 1 only, habits at their minimum version.
              </span>
            </label>
          </div>
        </div>
      )}

      {cur === "yesterday" && (
        <div>
          <StepTitle
            title="Close the loops from before"
            hint="Nothing rolls forward silently. If it isn't worth deciding, it probably isn't worth doing."
          />
          <div className="mb-3 flex flex-wrap gap-2">
            <button onClick={() => setDecisions(Object.fromEntries(leftovers.map((t) => [t._id, "today"])))} className={buttonVariants({ variant: "outline", size: "sm" })}>
              All → today
            </button>
            <button onClick={() => setDecisions(Object.fromEntries(leftovers.map((t) => [t._id, "backlog"])))} className={buttonVariants({ variant: "outline", size: "sm" })}>
              All → backlog
            </button>
          </div>
          <div className="space-y-2">
            {leftovers.map((t) => (
              <div key={t._id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <AreaDot color={areaColor(areaOf(t.lifeAreaId))} />
                      <span className="truncate">{t.title}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Planned {t.plannedFor ? fmtYmd(t.plannedFor) : ""}
                      {(t.deferCount ?? 0) >= 2 && <span className="ml-2 text-warning">· moved {t.deferCount}× — keep or drop?</span>}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <ChoiceRow<Decision>
                    value={decisions[t._id]}
                    onChange={(v) => setDecisions((d) => ({ ...d, [t._id]: v }))}
                    options={[
                      { value: "today", label: "Today" },
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
          <p className="mt-3 text-xs text-muted-foreground">
            {Object.keys(decisions).length}/{leftovers.length} decided · undecided items stay where they are.
          </p>
        </div>
      )}

      {cur === "shape" && (
        <div>
          <StepTitle title="What kind of day is it?" hint="Protect maker time on Focus days. Buffer days are for admin and prep. Free days are fully off." />
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { v: "focus", label: "Focus day", hint: "Revenue + deep work", icon: Zap },
                { v: "buffer", label: "Buffer day", hint: "Admin, prep, catch-up", icon: Coffee },
                { v: "free", label: "Free day", hint: "No work. Recharge.", icon: Palmtree },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                onClick={() => setDayType(o.v)}
                className={cn(
                  "rounded-xl border p-4 text-left transition",
                  dayType === o.v ? "os-pop border-primary bg-primary/5" : "border-border hover:bg-accent",
                )}
              >
                <o.icon className="h-5 w-5" />
                <p className="mt-2 font-semibold">{o.label}</p>
                <p className="text-xs text-muted-foreground">{o.hint}</p>
              </button>
            ))}
          </div>
          {dayType !== "free" && !lowEnergy && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Daily shape</p>
              <Segmented<Shape>
                value={shape}
                onChange={setShape}
                options={(Object.keys(SHAPE_INFO) as Shape[]).map((s) => ({ value: s, label: SHAPE_INFO[s].label }))}
              />
              <p className="mt-2 text-xs text-muted-foreground">{SHAPE_INFO[shape].hint}</p>
            </div>
          )}
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">One-line intention (optional)</p>
            <input
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="e.g. Close the Acme deal and ship the onboarding video"
              className={cn(inputClass, "h-11 w-full text-base")}
            />
          </div>
        </div>
      )}

      {cur === "top" && (
        <div>
          <StepTitle
            title={lowEnergy ? "Your one thing" : `Pick your ${SHAPE_INFO[shape].label}`}
            hint={
              dayType === "free"
                ? "It's a free day — pick nothing, or one tiny thing that recharges you."
                : "Aim for at least one delivery item and one revenue item (sales or marketing)."
            }
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void addQuick();
            }}
            className="mb-4 flex gap-2"
          >
            <input
              value={quick}
              onChange={(e) => setQuick(e.target.value)}
              placeholder="Add a new one… e.g. Call Sara about the proposal #sales ~30m"
              className={cn(inputClass, "h-10 flex-1")}
            />
            <button className={buttonVariants({ variant: "outline" })} disabled={!quick.trim()}>
              <Plus /> Add
            </button>
          </form>

          {top.length > 0 && (
            <div className="mb-4 space-y-2">
              {top.map((id, i) => {
                const t = taskMap.get(id);
                if (!t) return null;
                return (
                  <div key={id} className="os-pop flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                    {shape === "135" && !lowEnergy && (
                      <Chip tone="secondary">{i === 0 ? "Big" : i <= 3 ? "Medium" : "Small"}</Chip>
                    )}
                    <button onClick={() => toggleTop(id)} className="text-xs text-muted-foreground hover:text-foreground">
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Suggestions · {top.length}/{max} picked
          </p>
          <div className="max-h-[42vh] space-y-1.5 overflow-y-auto pr-1">
            {data.candidates
              .filter((t) => !top.includes(t._id))
              .map((t) => {
                const a = areaOf(t.lifeAreaId);
                const dueSoon = t.dueDate != null && t.dueDate < args.dayStart + 86400000;
                return (
                  <button
                    key={t._id}
                    onClick={() => toggleTop(t._id)}
                    disabled={top.length >= max}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm transition hover:border-ring/60 hover:bg-accent/40 disabled:opacity-50"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/40" />
                    <AreaDot color={areaColor(a)} />
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    {t.goalId && <Chip tone="sprint"><Target /> goal</Chip>}
                    {dueSoon && <Chip tone="warning"><CalendarClock /> due</Chip>}
                    {t.plannedFor === args.date && <Chip tone="info">today</Chip>}
                    {t.priority === "high" && <Chip tone="danger">high</Chip>}
                  </button>
                );
              })}
            {data.candidates.length === 0 && <p className="text-sm text-muted-foreground">No open tasks yet — add your first above.</p>}
          </div>
        </div>
      )}

      {cur === "capacity" && (
        <div>
          <StepTitle
            title="Will it fit?"
            hint="Plan about 5–6 focused hours on a normal day. Over-planning is the #1 reason daily plans collapse."
          />
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-4">
              <Ring value={Math.min(100, (plannedMin / Math.max(1, capMin)) * 100)} size={72} stroke={7} tone={over > 0 ? "warning" : "success"}>
                <span className="text-xs font-semibold tabular-nums">{Math.round((plannedMin / Math.max(1, capMin)) * 100)}%</span>
              </Ring>
              <div className="flex-1">
                <p className="text-lg font-semibold tabular-nums">
                  {fmtMin(plannedMin)} <span className="text-sm font-normal text-muted-foreground">planned of</span> {fmtMin(capMin)}
                </p>
                {data.capacity.meetingMin > 0 && <p className="text-xs text-muted-foreground">incl. {fmtMin(data.capacity.meetingMin)} of calls/meetings</p>}
                {over > 0 ? (
                  <p className="mt-1 flex items-center gap-1 text-sm text-warning">
                    <AlertTriangle className="h-4 w-4" /> {fmtMin(over)} over — defer something below.
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-success">Realistic. You&apos;ve left room for the unexpected.</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Available today</span>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={capacityH}
                onChange={(e) => setCapacityH(Number(e.target.value))}
                className="flex-1 accent-[var(--primary)]"
              />
              <span className="w-12 text-right tabular-nums">{capacityH}h</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {todayOpen.map((t) => (
              <div key={t._id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                {top.includes(t._id) && <Chip tone="default">Top</Chip>}
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <div className="flex gap-1">
                  {ESTIMATES.map((m) => (
                    <button
                      key={m}
                      onClick={() => void updateTask({ id: t._id, estimateMin: m }).catch((e) => toast(errorMessage(e), { tone: "warning" }))}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[11px] tabular-nums",
                        (t.estimateMin ?? 30) === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m < 60 ? `${m}m` : `${m / 60}h`}
                    </button>
                  ))}
                </div>
                {!top.includes(t._id) && (
                  <button
                    onClick={() => void updateTask({ id: t._id, plannedFor: addDaysYmd(args.date, 1) }).catch((e) => toast(errorMessage(e), { tone: "warning" }))}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    → tomorrow
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {cur === "ifthen" && (
        <div>
          <StepTitle
            title="What will try to derail you?"
            hint="If–then plans are one of the best-proven tools in behaviour science. Name the obstacle, decide the response now."
          />
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <label className="block">
              <span className="text-sm font-semibold">If…</span>
              <input value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder="I feel the urge to check messages before my Top 1 is done" className={cn(inputClass, "mt-1.5 h-11 w-full text-base")} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">…then I will</span>
              <input value={response} onChange={(e) => setResponse(e.target.value)} placeholder="write it in the Inbox and go back for 10 more minutes" className={cn(inputClass, "mt-1.5 h-11 w-full text-base")} />
            </label>
          </div>
          <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ideas</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {IF_THEN_IDEAS.map((x, i) => (
              <button
                key={i}
                onClick={() => {
                  setTrigger(x.trigger);
                  setResponse(x.response);
                }}
                className="rounded-lg border border-border p-3 text-left text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <b className="text-foreground">If</b> {x.trigger}, <b className="text-foreground">then</b> {x.response}.
              </button>
            ))}
          </div>
        </div>
      )}

      {cur === "commit" && (
        <div>
          <StepTitle title="Here's your day" hint="Read it once. Then close everything else and start with #1." />
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="secondary">{dayType === "focus" ? "Focus day" : dayType === "buffer" ? "Buffer day" : "Free day"}</Chip>
              {lowEnergy && <Chip tone="info"><BatteryLow /> Low-energy mode</Chip>}
              <Chip tone="outline">{fmtMin(capMin)} capacity</Chip>
              {energy && <Chip tone="outline">Energy {energy}/5</Chip>}
            </div>
            {intention && <p className="text-lg font-semibold">“{intention}”</p>}
            <ol className="space-y-2">
              {top.slice(0, max).map((id, i) => (
                <li key={id} className="flex items-center gap-3 text-sm">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span>
                  {taskMap.get(id)?.title}
                </li>
              ))}
            </ol>
            {trigger && response && (
              <p className="rounded-lg bg-muted p-3 text-sm">
                <b>If</b> {trigger}, <b>then</b> {response}.
              </p>
            )}
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" /> +25 XP for the start-up · +15 XP for each Top item you finish
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MoonIcon className="h-4 w-4" /> Tonight: a 5-minute shutdown closes the loop.
          </div>
        </div>
      )}
    </RitualShell>
  );
}
