"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Sun, Moon, Flame, Shield, Inbox, Star, Handshake, Trophy, PhoneCall, Clapperboard, GraduationCap, Brain, ClipboardCheck,
  Target, Repeat, Sparkles, Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Dialog, cn, Bar } from "./kit";
import { toast, celebrate } from "./celebrate";
import { useToday } from "@/lib/day";

const ICONS: Record<string, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  flame: Flame,
  shield: Shield,
  inbox: Inbox,
  star: Star,
  handshake: Handshake,
  trophy: Trophy,
  phone: PhoneCall,
  clapperboard: Clapperboard,
  graduation: GraduationCap,
  brain: Brain,
  clipboard: ClipboardCheck,
  target: Target,
  repeat: Repeat,
  sparkles: Sparkles,
};

const SEEN_KEY = "bishos.achievementsSeen";

/** Toasts + confetti the moment a new achievement unlocks (mounted once). */
export function AchievementWatcher() {
  const today = useToday();
  const data = useQuery(api.game.achievements, { today });
  const first = useRef(true);
  useEffect(() => {
    if (!data) return;
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    } catch {
      /* ignore */
    }
    const unlocked = data.badges.filter((b) => b.unlocked).map((b) => b.key);
    const fresh = unlocked.filter((k) => !seen.includes(k));
    // On the very first load just record what's already unlocked (no spam).
    if (fresh.length && !(first.current && seen.length === 0)) {
      const b = data.badges.find((x) => x.key === fresh[0])!;
      celebrate(1.2);
      toast(`Achievement unlocked: ${b.title}`, { tone: "success", sub: b.hint });
    }
    first.current = false;
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(unlocked));
    } catch {
      /* ignore */
    }
  }, [data]);
  return null;
}

export function TrophyCase({ open, onClose }: { open: boolean; onClose: () => void }) {
  const today = useToday();
  const data = useQuery(api.game.achievements, open ? { today } : "skip");
  return (
    <Dialog open={open} onClose={onClose} title={data ? `Achievements · ${data.unlocked}/${data.total}` : "Achievements"} size="lg">
      {!data ? (
        <div className="skeleton h-64" />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {data.badges.map((b) => {
            const I = ICONS[b.icon] ?? Trophy;
            return (
              <div key={b.key} className={cn("rounded-xl border p-3", b.unlocked ? "border-border bg-card" : "border-dashed border-border opacity-70")}>
                <div className="flex items-center gap-2">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", b.unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {b.unlocked ? <I className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{b.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{b.hint}</p>
                  </div>
                </div>
                {!b.unlocked && b.goal > 1 && (
                  <div className="mt-2">
                    <Bar value={(b.progress / b.goal) * 100} height="h-1" />
                    <p className="mt-1 text-right text-[10px] tabular-nums text-muted-foreground">
                      {b.progress}/{b.goal}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Dialog>
  );
}
