"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { GraduationCap, Sparkles, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { errText } from "./util";

const SCALE = [
  { n: 1, label: "I have to remind myself" },
  { n: 2, label: "Takes real effort" },
  { n: 3, label: "Getting easier" },
  { n: 4, label: "Mostly on autopilot" },
  { n: 5, label: "I do it without thinking" },
];

/**
 * Day 30 / 60 / 90 check: "How automatic does it feel?" (1–5).
 * A high score offers graduation to lighter tracking; otherwise kind copy.
 */
export function AutomaticityPrompt({
  habitId,
  title,
  day,
  onDismiss,
  compact,
}: {
  habitId: Id<"habits">;
  title: string;
  day: number;
  onDismiss?: () => void;
  compact?: boolean;
}) {
  const record = useMutation(api.habits.recordAutomaticity);
  const [score, setScore] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(n: number, graduate: boolean) {
    setBusy(true);
    try {
      await record({ id: habitId, day, score: n, graduate });
      setSaved(true);
      if (graduate) reward(`“${title}” graduated 🎓`, undefined, true);
      else if (n >= 4) toast("Nice — it's becoming part of you", { tone: "success" });
      else toast("Check-in saved", { tone: "success", sub: "Totally normal — habits take ~66 days on average. Keep going." });
      onDismiss?.();
    } catch (e) {
      toast(errText(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  function pick(n: number) {
    setScore(n);
    // Low scores save straight away; 4–5 first offer graduation.
    if (n < 4) void save(n, false);
  }

  return (
    <div className={cn("os-rise relative rounded-xl border border-border bg-card p-4 shadow-card", compact && "p-3")}>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Ask me later" title="Ask me later" className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Sparkles className="h-3 w-3" /> Day {day} check-in
      </p>
      <p className="mt-1 pr-6 text-sm font-medium">How automatic does “{title}” feel now?</p>

      {score == null || score < 4 || saved ? (
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {SCALE.map((s) => (
            <button
              key={s.n}
              type="button"
              disabled={busy}
              onClick={() => void pick(s.n)}
              title={s.label}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center transition-colors hover:bg-accent disabled:opacity-60",
                score === s.n ? "border-primary bg-accent" : "border-border",
              )}
            >
              <span className="text-base font-semibold tabular-nums">{s.n}</span>
              <span className="hidden text-[10px] leading-tight text-muted-foreground sm:block">{s.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted-foreground">It&apos;s sticking. Graduate it to lighter tracking — it leaves your daily list but keeps its history.</p>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => void save(score, true)} className={buttonVariants({ size: "sm" })}>
              <GraduationCap /> Graduate
            </button>
            <button disabled={busy} onClick={() => void save(score, false)} className={buttonVariants({ size: "sm", variant: "outline" })}>
              Keep tracking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
