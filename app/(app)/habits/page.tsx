"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  CalendarCheck,
  Flame,
  GraduationCap,
  Hourglass,
  ListChecks,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Shield,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Trash2,
  Wrench,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Chip, Dialog, EmptyHint, Metric, PageShell, Ring, Section, Segmented, buttonVariants, cn } from "@/components/os/kit";
import { celebrate, reward, toast } from "@/components/os/celebrate";
import { addDaysYmd, relDay, useToday } from "@/lib/day";
import { AddToMomentum } from "@/components/momentum/AddToMomentum";
import { HabitDialog } from "@/components/habits/HabitDialog";
import { AutomaticityPrompt } from "@/components/habits/AutomaticityPrompt";
import { HabitOverviewCard, HabitTodayCard, type BoardHabit } from "@/components/habits/HabitCards";
import { HeatLegend } from "@/components/habits/HabitHeatmap";
import { MiniMenu } from "@/components/habits/MiniMenu";
import type { KindPick } from "@/components/habits/KindMenu";
import { TIME_OF_DAY, errText, isDone, lsGet, lsSet, timeOfDayNow, type TimeOfDay } from "@/components/habits/util";

type Tab = "today" | "all" | "queue" | "graduated";

const TIME_ICON: Record<TimeOfDay, typeof Sun> = { morning: Sunrise, afternoon: Sun, evening: Sunset, any: Sparkles };

export default function HabitsPage() {
  const today = useToday();
  const data = useQuery(api.habits.board, { today });
  const log = useMutation(api.habits.log).withOptimisticUpdate((store, args) => {
    if (!args.today || args.date !== args.today) return;
    const cur = store.getQuery(api.habits.board, { today: args.today });
    if (!cur) return;
    store.setQuery(
      api.habits.board,
      { today: args.today },
      {
        ...cur,
        habits: cur.habits.map((h) =>
          h._id === args.id ? { ...h, stats: { ...h.stats, kindToday: args.kind === "clear" ? null : args.kind } } : h,
        ),
      },
    );
  });
  const update = useMutation(api.habits.update);
  const remove = useMutation(api.habits.remove);

  const [tab, setTab] = useState<Tab>("today");
  const [dialog, setDialog] = useState<{ open: boolean; habit?: Doc<"habits"> | null }>({ open: false });
  const [confirmDelete, setConfirmDelete] = useState<BoardHabit | null>(null);
  const [later, setLater] = useState<Set<string>>(new Set());

  const habits = useMemo(() => data?.habits ?? [], [data]);
  const active = useMemo(() => habits.filter((h) => h.status === "active"), [habits]);
  const queued = habits.filter((h) => h.status === "queued");
  const graduated = habits.filter((h) => h.status === "graduated");
  const capacity = data?.capacity;

  const doneCount = active.filter((h) => isDone(h.stats.kindToday)).length;
  const settled = active.filter((h) => h.stats.kindToday !== null).length; // done-ish or skip
  const allDone = active.length > 0 && settled === active.length && doneCount > 0;

  // Celebrate the moment the last habit of the day is logged (once per day).
  const prevAll = useRef<boolean | null>(null);
  useEffect(() => {
    if (!data) return;
    if (prevAll.current === null) {
      prevAll.current = allDone;
      return;
    }
    if (allDone && !prevAll.current) {
      const key = `bishos-habits-all-${today}`;
      if (lsGet(key) !== "1") {
        lsSet(key, "1");
        celebrate(1.3);
        reward("Every habit done today 🎉", undefined, false);
      }
    }
    prevAll.current = allDone;
  }, [allDone, data, today]);

  async function onPick(h: BoardHabit, kind: KindPick, date = today) {
    try {
      const res = await log({ id: h._id, date, kind, today });
      if (kind === "clear") return;
      const xp = res?.xp || undefined;
      if (kind === "skip") toast("Shield used — streak protected", { tone: "info", sub: "Planned rest is part of the plan." });
      else if (res?.repaired) reward(`Streak repaired · ${h.title}`, xp);
      else if (kind === "min") reward(`2-minute version counts · ${h.title}`, xp);
      else if (kind === "stretch") reward(`Stretch! ${h.title}`, xp);
      else reward(`${h.title} ✓`, xp);
    } catch (e) {
      toast(errText(e), { tone: "warning" });
    }
  }

  async function setStatus(h: BoardHabit, habitStatus: "active" | "queued" | "graduated") {
    try {
      await update({ id: h._id, habitStatus, today });
      if (habitStatus === "active" && h.status === "queued") reward(`Started: ${h.title}`, undefined, true);
      else if (habitStatus === "active") toast(`Tracking “${h.title}” daily again`, { tone: "success" });
      else if (habitStatus === "queued") toast("Moved to the queue", { tone: "info", sub: "No guilt — it'll wait for a better moment." });
      else reward(`“${h.title}” graduated 🎓`, undefined, true);
    } catch (e) {
      toast(errText(e), { tone: "warning" });
    }
  }

  const prompts = active.filter((h) => h.stats.automaticityDue && !later.has(h._id));

  // Repair window: yesterday / the day before, not logged, after the start.
  const repairs = useMemo(() => {
    const out: { habit: BoardHabit; date: string }[] = [];
    for (const h of active) {
      for (const d of [addDaysYmd(today, -1), addDaysYmd(today, -2)]) {
        if (d < h.stats.start) continue;
        if (!h.recent.some((r) => r.date === d)) {
          out.push({ habit: h, date: d });
          break;
        }
      }
    }
    return out.slice(0, 6);
  }, [active, today]);

  const groups = useMemo(() => {
    const now = timeOfDayNow();
    return TIME_OF_DAY.map((t) => ({ ...t, now: t.value === now, items: active.filter((h) => (h.timeOfDay ?? "any") === t.value) })).filter(
      (g) => g.items.length > 0,
    );
  }, [active]);

  const avgConsistency = active.length
    ? Math.round(active.filter((h) => h.stats.possibleDays30 > 0).reduce((s, h) => s + h.stats.consistency, 0) / Math.max(1, active.filter((h) => h.stats.possibleDays30 > 0).length))
    : 0;
  const bestStreak = active.reduce((m, h) => Math.max(m, h.stats.streak), 0);
  const shieldsLeft = active.reduce((s, h) => s + h.stats.shieldsLeft, 0);
  const shieldsTotal = active.reduce((s, h) => s + h.stats.reserves, 0);

  const openNew = () => setDialog({ open: true, habit: null });

  const actionsFor = (h: BoardHabit) => (
    <MiniMenu
      items={[
        { label: "Edit habit", icon: Pencil, onClick: () => setDialog({ open: true, habit: h }) },
        h.status === "queued" && {
          label: capacity?.full ? "Start now (at your limit)" : "Start now",
          icon: Play,
          onClick: () => void setStatus(h, "active"),
          disabled: capacity?.full,
        },
        h.status === "active" && { label: "Graduate (lighter tracking)", icon: GraduationCap, onClick: () => void setStatus(h, "graduated") },
        h.status === "active" && { label: "Pause → queue", icon: Pause, onClick: () => void setStatus(h, "queued") },
        h.status === "graduated" && { label: "Resume daily tracking", icon: RotateCcw, onClick: () => void setStatus(h, "active") },
        { label: "Delete", icon: Trash2, danger: true, onClick: () => setConfirmDelete(h) },
      ]}
    />
  );

  return (
    <PageShell
      title="Habits"
      icon={ListChecks}
      subtitle="Small, anchored and forgiving. Consistency beats perfection."
      actions={
        <button onClick={openNew} className={buttonVariants()}>
          <Plus /> New habit
        </button>
      }
      headerExtra={
        data && active.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-4">
            <div className="flex items-center gap-3">
              <Ring value={active.length ? (doneCount / active.length) * 100 : 0} size={48} stroke={5} tone={allDone ? "success" : "primary"}>
                <CalendarCheck className="h-4 w-4" />
              </Ring>
              <Metric label="Today" value={`${doneCount}/${active.length}`} />
            </div>
            <Metric label="Consistency · 30d" value={`${avgConsistency}%`} sub="before streaks" />
            <Metric label="Best active streak" value={<span className="inline-flex items-center gap-1"><Flame className="h-5 w-5 text-warning" />{bestStreak}</span>} />
            <Metric
              label="Shields left"
              value={<span className="inline-flex items-center gap-1"><Shield className="h-5 w-5 text-info" />{shieldsLeft}<span className="text-sm font-normal text-muted-foreground">/{shieldsTotal}</span></span>}
              sub="refill every Monday"
            />
          </div>
        ) : null
      }
    >
      {data === undefined ? (
        <div className="space-y-3">
          <div className="skeleton h-9 w-80 max-w-full" />
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton h-24" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: "today", label: "Today", count: active.length },
              { value: "all", label: "All habits", count: active.length + graduated.length },
              { value: "queue", label: "Queue", count: queued.length },
              { value: "graduated", label: "Graduated", count: graduated.length },
            ]}
          />

          {tab === "today" && (
            <div className="space-y-5">
              {prompts.map((h) => (
                <AutomaticityPrompt
                  key={`${h._id}-${h.stats.automaticityDue}`}
                  habitId={h._id}
                  title={h.title}
                  day={h.stats.automaticityDue!}
                  onDismiss={() => setLater((s) => new Set(s).add(h._id))}
                />
              ))}

              {allDone && (
                <div className="os-rise flex items-center gap-3 rounded-xl border border-success/40 bg-success-soft p-4">
                  <span className="os-pop flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-background">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-success">All of today&apos;s habits are done.</p>
                    <p className="text-sm text-muted-foreground">Every rep is a vote for who you&apos;re becoming. Enjoy the rest of the day.</p>
                  </div>
                </div>
              )}

              {repairs.length > 0 && (
                <Section
                  title="Repair window"
                  icon={Wrench}
                  hint="Missed a day? Log it within 48 hours — repairs keep your streak. A missed day is normal."
                >
                  <div className="flex flex-wrap gap-2">
                    {repairs.map(({ habit, date }) => (
                      <div key={`${habit._id}-${date}`} className="flex items-center gap-1 rounded-lg border border-border bg-background py-1 pl-3 pr-1 text-sm">
                        <span className="max-w-[12rem] truncate font-medium">{habit.title}</span>
                        <span className="text-xs text-muted-foreground">· {relDay(date, today)}</span>
                        <button onClick={() => void onPick(habit, "done", date)} className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "h-7 px-2")}>
                          Done
                        </button>
                        {habit.minVersion && (
                          <button onClick={() => void onPick(habit, "min", date)} className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "h-7 px-2")}>
                            2-min
                          </button>
                        )}
                        <button
                          onClick={() => void onPick(habit, "skip", date)}
                          className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "h-7 px-2 text-info")}
                          title="Count it as a planned rest day"
                        >
                          <Shield className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {active.length === 0 ? (
                <EmptyHint
                  icon={ListChecks}
                  title="Start with one tiny habit"
                  hint={
                    queued.length
                      ? "Your queue has habits waiting. Start one, or design a new habit anchored to something you already do."
                      : "Habits are small votes for who you're becoming. Anchor one to something you already do daily and give it a 2-minute version for bad days."
                  }
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      <button onClick={openNew} className={buttonVariants()}>
                        <Plus /> New habit
                      </button>
                      {queued.length > 0 && (
                        <button onClick={() => setTab("queue")} className={buttonVariants({ variant: "outline" })}>
                          Open queue ({queued.length})
                        </button>
                      )}
                    </div>
                  }
                />
              ) : (
                groups.map((g) => {
                  const I = TIME_ICON[g.value];
                  const gDone = g.items.filter((h) => isDone(h.stats.kindToday)).length;
                  return (
                    <div key={g.value} className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <I className="h-4 w-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold">{g.label}</h2>
                        {g.now && g.value !== "any" && <Chip tone="info">Now</Chip>}
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {gDone}/{g.items.length}
                        </span>
                      </div>
                      <div className="grid gap-2.5 lg:grid-cols-2">
                        {g.items.map((h) => (
                          <HabitTodayCard key={h._id} habit={h} onPick={(k) => void onPick(h, k)} />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
              {active.length > 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  Tap to log · long-press or ⋯ for the 2-minute version, stretch or a reserve skip.
                </p>
              )}
            </div>
          )}

          {tab === "all" && (
            <div className="space-y-4">
              {active.length + graduated.length === 0 ? (
                <EmptyHint
                  icon={ListChecks}
                  title="No habits yet"
                  hint="Design one habit with an if-then cue, a 2-minute version and a weekly target with reserve skips."
                  action={
                    <button onClick={openNew} className={buttonVariants()}>
                      <Plus /> New habit
                    </button>
                  }
                />
              ) : (
                <>
                  <HeatLegend />
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {[...active, ...graduated].map((h) => (
                      <HabitOverviewCard
                        key={h._id}
                        habit={h}
                        today={today}
                        actions={
                          <div className="flex items-center">
                            <AddToMomentum type="habit" itemId={h._id} title={h.title} compact />
                            {actionsFor(h)}
                          </div>
                        }
                        footer={h.status === "graduated" ? <Chip tone="success"><GraduationCap />Graduated</Chip> : null}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "queue" && (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-info" />
                <div className="text-sm">
                  <p className="font-medium">
                    Building {capacity?.newActive ?? 0} of {capacity?.max ?? 3} new habits this month
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    One to three new habits at a time is the sweet spot. Habits take ~66 days on average — when one feels automatic, start the next from here.
                  </p>
                </div>
              </div>
              {queued.length === 0 ? (
                <EmptyHint
                  icon={Hourglass}
                  title="Nothing waiting"
                  hint="When you're at your new-habit limit, extra ideas wait here instead of overloading your week."
                  action={
                    <button onClick={openNew} className={buttonVariants({ variant: "outline" })}>
                      <Plus /> Add an idea
                    </button>
                  }
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {queued.map((h, i) => (
                    <div key={h._id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">#{i + 1} in queue</p>
                          <p className="font-medium leading-snug">{h.title}</p>
                        </div>
                        {actionsFor(h)}
                      </div>
                      {h.anchor && <p className="text-xs text-muted-foreground">After I {h.anchor}, I will {h.title.toLowerCase()}.</p>}
                      <div className="flex flex-wrap gap-1.5">
                        {h.minVersion && <Chip tone="muted">2-min: {h.minVersion}</Chip>}
                        <Chip tone="muted">{h.stats.target === 7 ? "Daily" : `${h.stats.target}× / week`}</Chip>
                        {h.areaName && <Chip tone="outline">{h.areaName}</Chip>}
                        {h.goalTitle && <Chip tone="sprint">{h.goalTitle}</Chip>}
                      </div>
                      <button
                        onClick={() => void setStatus(h, "active")}
                        disabled={capacity?.full}
                        title={capacity?.full ? "Graduate or pause a current habit first" : undefined}
                        className={cn(buttonVariants({ size: "sm", variant: capacity?.full ? "outline" : "default" }), "mt-1 self-start")}
                      >
                        <Play /> {capacity?.full ? "At your limit — graduate one first" : "Start now"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "graduated" && (
            <div className="space-y-4">
              {graduated.length === 0 ? (
                <EmptyHint
                  icon={GraduationCap}
                  title="No graduates yet"
                  hint="At day 30, 60 and 90 you'll be asked how automatic a habit feels. When it's on autopilot, graduate it to lighter tracking — it lives here with its full history."
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {graduated.map((h) => (
                    <HabitOverviewCard
                      key={h._id}
                      habit={h}
                      today={today}
                      actions={actionsFor(h)}
                      footer={
                        <button onClick={() => void setStatus(h, "active")} className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-6 px-2 text-xs")}>
                          <RotateCcw className="h-3 w-3" /> Resume
                        </button>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <HabitDialog
        open={dialog.open}
        habit={dialog.habit ?? null}
        onClose={() => setDialog({ open: false })}
        capacity={capacity}
        today={today}
      />

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete this habit?" size="sm">
        <p className="text-sm text-muted-foreground">
          “{confirmDelete?.title}” and its full history will be removed. If you just need a break, move it to the queue instead — no guilt.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {confirmDelete?.status === "active" && (
            <button
              onClick={() => {
                const h = confirmDelete;
                setConfirmDelete(null);
                if (h) void setStatus(h, "queued");
              }}
              className={buttonVariants({ variant: "outline" })}
            >
              <Pause /> Move to queue
            </button>
          )}
          <button
            onClick={async () => {
              const h = confirmDelete;
              setConfirmDelete(null);
              if (h) {
                try {
                  await remove({ id: h._id });
                  toast("Habit deleted");
                } catch (e) {
                  toast(errText(e), { tone: "warning" });
                }
              }
            }}
            className={buttonVariants({ variant: "destructive" })}
          >
            <Trash2 /> Delete
          </button>
        </div>
      </Dialog>
    </PageShell>
  );
}
