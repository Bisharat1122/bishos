"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Activity, RotateCcw } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Section, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { fmtYmd } from "@/lib/day";
import { errText } from "./util";

type Key = "exhaustion" | "cynicism" | "efficacy";
const QUESTIONS: { key: Key; q: string; low: string; high: string }[] = [
  { key: "exhaustion", q: "How often did work leave you drained of energy this month?", low: "Rarely", high: "Constantly" },
  { key: "cynicism", q: "How often did you feel detached from, or negative about, your work?", low: "Rarely", high: "Constantly" },
  { key: "efficacy", q: "How confident are you that you're accomplishing worthwhile things?", low: "Not at all", high: "Very" },
];

/** Monthly 3-question burnout pulse (WHO dimensions). Not a validated instrument. */
export function PulseCard({ today }: { today: string }) {
  const data = useQuery(api.insights.pulse, { today });
  const save = useMutation(api.insights.savePulse);
  const [vals, setVals] = useState<Partial<Record<Key, number>>>({});
  const [retake, setRetake] = useState(false);
  const [busy, setBusy] = useState(false);

  const ready = QUESTIONS.every((q) => vals[q.key]);
  const showForm = data && (data.due || retake);

  async function submit() {
    if (!ready) return;
    setBusy(true);
    try {
      await save({ date: today, exhaustion: vals.exhaustion!, cynicism: vals.cynicism!, efficacy: vals.efficacy! });
      toast("Pulse saved — thank you for checking in", { tone: "success" });
      setRetake(false);
      setVals({});
    } catch (e) {
      toast(errText(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Monthly burnout pulse" icon={Activity} hint="3 questions, once a month · exhaustion, detachment, efficacy">
      {data === undefined ? (
        <div className="skeleton h-40" />
      ) : showForm ? (
        <div className="space-y-4">
          {QUESTIONS.map((q) => (
            <div key={q.key}>
              <p className="text-sm">{q.q}</p>
              <div className="mt-1.5 grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setVals((v) => ({ ...v, [q.key]: n }))}
                    aria-pressed={vals[q.key] === n}
                    className={cn(
                      "h-9 rounded-md border text-sm font-medium tabular-nums transition-colors",
                      vals[q.key] === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
                <span>{q.low}</span>
                <span>{q.high}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button disabled={!ready || busy} onClick={() => void submit()} className={buttonVariants({ size: "sm" })}>
              Save this month&apos;s pulse
            </button>
            {retake && (
              <button onClick={() => setRetake(false)} className={buttonVariants({ size: "sm", variant: "ghost" })}>
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.current && (
            <div className="grid grid-cols-3 gap-2 text-center">
              {QUESTIONS.map((q) => (
                <div key={q.key} className="rounded-lg bg-muted/50 p-2">
                  <p className="text-lg font-semibold tabular-nums">{data.current![q.key]}/5</p>
                  <p className="text-[11px] capitalize text-muted-foreground">{q.key === "cynicism" ? "detachment" : q.key}</p>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Done for this month. Next pulse opens on the 1st — fresh starts work best on landmarks.</p>
          <button onClick={() => setRetake(true)} className={buttonVariants({ size: "sm", variant: "ghost" })}>
            <RotateCcw /> Retake
          </button>
        </div>
      )}
      {data && data.history.length > 1 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">History</p>
          <ul className="space-y-1 text-xs">
            {data.history.slice(0, 6).map((h) => (
              <li key={h.date} className="flex justify-between gap-2 tabular-nums">
                <span className="text-muted-foreground">{fmtYmd(h.date, { month: "short", year: "numeric" })}</span>
                <span>
                  E {h.exhaustion} · D {h.cynicism} · Ef {h.efficacy}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}
