"use client";

/**
 * WOOP coach (Wish · Outcome · Obstacle · Plan). Mental contrasting works
 * better through interaction, so each step has a "Coach me" button: the AI asks
 * one probing question and offers a draft; the user answers or uses it.
 */
import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Loader2, MessageCircleQuestion, Sparkles, Wand2 } from "lucide-react";
import { buttonVariants, cn, inputClass } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { AutoTextArea } from "./AutoField";
import { errMsg } from "./util";

type Woop = { wish?: string; outcome?: string; obstacle?: string; plan?: string };
type StepKey = keyof Woop;

const STEPS: { key: StepKey; letter: string; label: string; hint: string }[] = [
  { key: "wish", letter: "W", label: "Wish", hint: "A challenging but feasible wish for these 12 weeks." },
  { key: "outcome", letter: "O", label: "Outcome", hint: "The best result if it comes true — picture it vividly." },
  { key: "obstacle", letter: "O", label: "Obstacle", hint: "The main INNER obstacle: a habit, feeling or belief of yours." },
  { key: "plan", letter: "P", label: "Plan", hint: "If <obstacle moment>, then I will <specific action>." },
];

export function WoopCoach({ goalId, woop }: { goalId: Id<"goals">; woop: Woop }) {
  const update = useMutation(api.goals.update);
  const coach = useAction(api.goals.aiWoop);
  const [busy, setBusy] = useState<StepKey | null>(null);
  const [turn, setTurn] = useState<Partial<Record<StepKey, { question: string; suggestion: string }>>>({});
  const [reply, setReply] = useState<Partial<Record<StepKey, string>>>({});
  const filled = STEPS.filter((s) => (woop[s.key] ?? "").trim()).length;

  const save = (key: StepKey, value: string) => update({ id: goalId, woop: { ...woop, [key]: value } });

  const ask = async (key: StepKey) => {
    setBusy(key);
    try {
      const r = await coach({ goalId, step: key, woop, reply: reply[key] || undefined });
      setTurn((t) => ({ ...t, [key]: r }));
      setReply((x) => ({ ...x, [key]: "" }));
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5">
        {STEPS.map((s) => (
          <span
            key={s.key}
            className={cn(
              "flex size-7 items-center justify-center rounded-lg text-xs font-semibold",
              (woop[s.key] ?? "").trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
            title={s.label}
          >
            {s.letter}
          </span>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">{filled}/4 — mental contrasting + an if-then plan</span>
      </div>
      {STEPS.map((s) => {
        const t = turn[s.key];
        return (
          <div key={s.key} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">
                <span className="mr-1.5 text-muted-foreground">{s.letter}</span>
                {s.label}
              </p>
              <button type="button" onClick={() => void ask(s.key)} disabled={busy !== null} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                {busy === s.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                Coach me
              </button>
            </div>
            <AutoTextArea value={woop[s.key] ?? ""} onSave={(v) => save(s.key, v)} placeholder={s.hint} rows={2} />
            {t && (t.question || t.suggestion) && (
              <div className="os-rise mt-2 space-y-2 rounded-lg bg-muted/60 p-3 text-sm">
                {t.question && (
                  <p className="flex gap-2">
                    <MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                    <span>{t.question}</span>
                  </p>
                )}
                {t.suggestion && (
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="flex-1 text-muted-foreground">
                      <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                      {t.suggestion}
                    </p>
                    <button
                      type="button"
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                      onClick={() => {
                        void save(s.key, t.suggestion).catch((e) => toast(errMsg(e), { tone: "warning" }));
                        setTurn((x) => ({ ...x, [s.key]: undefined }));
                      }}
                    >
                      Use this
                    </button>
                  </div>
                )}
                {t.question && (
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (reply[s.key]?.trim()) void ask(s.key);
                    }}
                  >
                    <input
                      value={reply[s.key] ?? ""}
                      onChange={(e) => setReply((x) => ({ ...x, [s.key]: e.target.value }))}
                      placeholder="Answer the coach…"
                      className={cn(inputClass, "h-8 flex-1")}
                    />
                    <button className={buttonVariants({ size: "sm" })} disabled={busy !== null || !reply[s.key]?.trim()}>
                      Reply
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
