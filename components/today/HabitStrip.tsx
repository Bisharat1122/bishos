"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Repeat, Check, Flame, ChevronDown, Plus } from "lucide-react";
import { cn, Section, buttonVariants } from "@/components/os/kit";
import { reward, toast, celebrate, errorMessage } from "@/components/os/celebrate";

type Kind = "done" | "min" | "stretch" | "skip";
export type StripHabit = {
  _id: Id<"habits">;
  title: string;
  anchor?: string | null;
  minVersion?: string | null;
  streak: number;
  kind: string | null;
  timeOfDay: string;
  shieldsLeft?: number;
  consistency?: number;
};

const KIND_LABEL: Record<Kind, string> = { done: "Done", min: "Minimum", stretch: "Stretch", skip: "Planned skip" };

export function HabitStrip({ habits: fallback, date, lowEnergy }: { habits: StripHabit[]; date: string; lowEnergy?: boolean }) {
  const log = useMutation(api.habits.log);
  // Live, forgiving-streak view from the Habits module (falls back to the cockpit list).
  const live = useQuery(api.habits.today, { date });
  const habits: StripHabit[] = (live as StripHabit[] | undefined) ?? fallback;
  const [menu, setMenu] = useState<string | null>(null);
  const done = habits.filter((h) => h.kind && h.kind !== "skip").length;
  const countable = habits.filter((h) => h.kind !== "skip").length;

  const set = async (h: StripHabit, kind: Kind | "clear") => {
    try {
      await log({ id: h._id, date, kind, today: date });
      if (kind !== "clear" && kind !== "skip") {
        const willBeAll = habits.every((x) => x._id === h._id || (x.kind && x.kind !== "skip") || x.kind === "skip");
        if (willBeAll) {
          celebrate(0.8);
          reward("All habits done today 🔥", kind === "min" ? 3 : 5);
        } else toast(kind === "min" ? "Minimum counts. Streak safe." : `${h.title} ✓`, { tone: "success", xp: kind === "min" ? 3 : 5 });
      }
    } catch (e) {
      toast(errorMessage(e, "Couldn't log"), { tone: "warning" });
    }
  };

  return (
    <Section
      title="Habits"
      icon={Repeat}
      hint={lowEnergy ? "Low-energy day: the minimum version counts fully." : "Tap to tick. Menu for minimum, stretch or a planned skip."}
      action={
        <span className="text-xs tabular-nums text-muted-foreground">
          {done}/{countable}
        </span>
      }
    >
      {habits.length === 0 ? (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>No habits yet. Start with one keystone habit.</span>
          <Link href="/habits" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Plus /> Add habit
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {habits.map((h) => {
            const k = h.kind as Kind | null;
            const on = !!k && k !== "skip";
            return (
              <div key={h._id} className="relative">
                <div
                  className={cn(
                    "flex items-stretch overflow-hidden rounded-xl border text-sm transition",
                    on ? "border-success/50 bg-success-soft" : k === "skip" ? "border-dashed border-border bg-muted/50" : "border-border bg-card hover:border-ring/60",
                  )}
                >
                  <button
                    onClick={() => void set(h, on ? "clear" : lowEnergy && h.minVersion ? "min" : "done")}
                    title={h.anchor ? `After ${h.anchor}` : undefined}
                    className="flex items-center gap-2 px-3 py-2"
                  >
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full border-2",
                        on ? "os-pop border-success bg-success text-background" : "border-muted-foreground/40",
                      )}
                    >
                      {on && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className={cn("max-w-[12rem] truncate font-medium", k === "skip" && "text-muted-foreground line-through")}>{h.title}</span>
                    {k === "min" && <span className="text-[10px] font-semibold uppercase text-success">min</span>}
                    {k === "stretch" && <span className="text-[10px] font-semibold uppercase text-success">stretch</span>}
                    {h.streak > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-warning" title={h.shieldsLeft != null ? `${h.shieldsLeft} reserve skips left this week` : undefined}>
                        <Flame className="h-3 w-3" /> {h.streak}
                      </span>
                    )}
                    {h.consistency != null && <span className="text-[10px] tabular-nums text-muted-foreground">{h.consistency}%</span>}
                  </button>
                  <button
                    onClick={() => setMenu((m) => (m === h._id ? null : h._id))}
                    className="border-l border-border/60 px-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="Habit options"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                {menu === h._id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
                    <div className="os-pop absolute left-0 z-50 mt-1 w-56 rounded-lg border border-border bg-popover p-1 text-sm shadow-raised">
                      {h.anchor && <p className="px-2 py-1.5 text-[11px] text-muted-foreground">After {h.anchor}</p>}
                      {(Object.keys(KIND_LABEL) as Kind[]).map((kk) => (
                        <button
                          key={kk}
                          onClick={() => {
                            setMenu(null);
                            void set(h, kk);
                          }}
                          className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent", k === kk && "font-semibold")}
                        >
                          {KIND_LABEL[kk]}
                          {kk === "min" && h.minVersion && <span className="ml-2 truncate text-[11px] text-muted-foreground">{h.minVersion}</span>}
                        </button>
                      ))}
                      {k && (
                        <button
                          onClick={() => {
                            setMenu(null);
                            void set(h, "clear");
                          }}
                          className="flex w-full items-center rounded-md px-2 py-1.5 text-muted-foreground hover:bg-accent"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

/** Today rail: active challenges, with a jump to today's challenge day. */
export function ChallengesToday({ date }: { date: string }) {
  const rows = useQuery(api.today.challengesToday, { date });
  if (!rows || rows.length === 0) return null;
  return (
    <Section title="Challenges" icon={Flame} action={<Link href="/challenges" className="text-xs text-muted-foreground hover:text-foreground">All</Link>}>
      <div className="space-y-1.5">
        {rows.map((c) => (
          <Link key={c._id} href={`/challenges/${c._id}`} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-accent">
            <span className="size-2 shrink-0 rounded-full bg-sprint" />
            <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
            <span className={cn("shrink-0 text-xs", c.todayDay ? "text-success" : "text-muted-foreground")}>
              {c.todayDay ? `Today: ${c.todayDay.name}` : `Day ${c.dayCount + 1} not started`}
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}
