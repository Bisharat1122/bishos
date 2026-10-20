"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sun, Moon, Check, Flame, Shield, Sparkles, ArrowUpRight } from "lucide-react";
import { StartupRitual } from "./StartupRitual";
import { ShutdownRitual } from "./ShutdownRitual";
import { cn, Ring, Bar, buttonVariants } from "@/components/os/kit";
import { setCelebrations } from "@/components/os/celebrate";
import { RitualKind, openRitual } from "@/lib/osEvents";
import { useToday } from "@/lib/day";

/** Mounted once in the app layout; opens rituals on `os:ritual`. */
export function RitualHost() {
  const [kind, setKind] = useState<RitualKind | null>(null);
  const settings = useQuery(api.settings.get);
  useEffect(() => {
    if (settings) setCelebrations(settings.celebrate);
  }, [settings]);
  useEffect(() => {
    const on = (e: Event) => setKind((e as CustomEvent).detail as RitualKind);
    window.addEventListener("os:ritual", on);
    return () => window.removeEventListener("os:ritual", on);
  }, []);
  if (kind === "startup") return <StartupRitual onClose={() => setKind(null)} />;
  if (kind === "shutdown") return <ShutdownRitual onClose={() => setKind(null)} />;
  return null;
}

/** Topbar: today's ritual progress ring + quick access to start-up/shutdown. */
export function DayButton() {
  const date = useToday();
  const day = useQuery(api.days.get, { date });
  const game = useQuery(api.game.stats, { today: date });
  const [open, setOpen] = useState(false);

  const top = day?.top3Tasks ?? [];
  const topDone = top.filter((t) => t.status === "done").length;
  const parts = [!!day?.startupAt, top.length > 0 && topDone === top.length, !!day?.shutdownAt];
  const pct = Math.round((parts.filter(Boolean).length / 3) * 100);
  const allDone = parts.every(Boolean);
  const evening = new Date().getHours() >= 16;
  const needsAttention = !day?.startupAt || (evening && !day?.shutdownAt);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Your day"
        className={cn(
          "flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-1.5 shadow-xs transition hover:bg-accent sm:pr-3",
          needsAttention && "daily-glow",
        )}
      >
        <Ring value={pct} size={28} stroke={3} tone={allDone ? "success" : "primary"}>
          {allDone ? <Check className="h-3.5 w-3.5 text-success" /> : <span className="text-[9px] font-semibold tabular-nums">{pct}</span>}
        </Ring>
        <span className="hidden text-sm font-medium sm:inline">{!day?.startupAt ? "Start day" : evening && !day?.shutdownAt ? "Shutdown" : "My day"}</span>
        {game && game.streak.streak > 0 && (
          <span className="hidden items-center gap-0.5 text-xs font-medium text-warning sm:flex">
            <Flame className="h-3.5 w-3.5" />
            {game.streak.streak}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="os-pop absolute right-0 z-50 mt-2 w-[min(340px,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-raised">
            {game && (
              <div className="border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Level {game.level.level}</p>
                    <p className="font-semibold">{game.level.title}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 font-medium text-warning">
                      <Flame className="h-4 w-4" /> {game.streak.streak}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground" title="Reserve shields left this week">
                      <Shield className="h-4 w-4" /> {game.streak.shieldsLeft}
                    </span>
                  </div>
                </div>
                <Bar value={game.level.pct} className="mt-3" />
                <p className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {game.level.into}/{game.level.span} XP
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> +{game.todayXp} today
                  </span>
                </p>
              </div>
            )}
            <div className="space-y-1 p-2">
              <RitualRow
                icon={Sun}
                title="Morning start-up"
                sub={day?.startupAt ? "Done — day locked in" : "Check-in · Top 3 · capacity · if–then"}
                done={!!day?.startupAt}
                onClick={() => {
                  setOpen(false);
                  openRitual("startup");
                }}
              />
              <div className="px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Top priorities</span>
                  <span className="tabular-nums">
                    {topDone}/{top.length}
                  </span>
                </div>
                <Bar value={top.length ? (topDone / top.length) * 100 : 0} tone="success" className="mt-1.5" />
              </div>
              <RitualRow
                icon={Moon}
                title="Evening shutdown"
                sub={day?.shutdownAt ? "Shutdown complete" : "Inbox zero · leftovers · resume note"}
                done={!!day?.shutdownAt}
                onClick={() => {
                  setOpen(false);
                  openRitual("shutdown");
                }}
              />
            </div>
            <div className="border-t border-border p-2">
              <Link href="/today" onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full justify-between")}>
                Open Today <ArrowUpRight />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RitualRow({ icon: I, title, sub, done, onClick }: { icon: typeof Sun; title: string; sub: string; done: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", done ? "bg-success-soft text-success" : "bg-muted")}>
        {done ? <Check className="h-4 w-4" /> : <I className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}
