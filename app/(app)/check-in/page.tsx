"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Sparkles, Check } from "lucide-react";
import { Card, Topbar } from "@/components/ui";
import { LineChart } from "@/components/Chart";
import { TodaySchedule } from "@/components/schedule/TodaySchedule";
import { cn } from "@/lib/utils";

const moodEmoji = (v: number) =>
  v <= 2 ? "😞" : v <= 4 ? "😕" : v <= 6 ? "😐" : v <= 8 ? "🙂" : "😄";

const MAX_PRIORITIES = 3; // "Most Important Tasks" — change to 5 if you prefer
const PRANK = { high: 0, med: 1, low: 2 } as const;

export default function CheckInPage() {
  const today = useQuery(api.checkins.today);
  const recent = useQuery(api.checkins.recent, { days: 14 });
  const tasks = useQuery(api.tasks.list, {});
  const submit = useMutation(api.checkins.submit);
  const fetchAiQuestions = useAction(api.checkins.aiQuestions);

  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [energy, setEnergy] = useState(6);
  const [selected, setSelected] = useState<Id<"tasks">[]>([]);
  const [blockers, setBlockers] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    if (today && !seeded.current) {
      seeded.current = true;
      const c = today.checkIn;
      if (c) {
        setEnergy(c.energyMood);
        setSelected((c.priorityTaskIds as Id<"tasks">[]) ?? []);
        setBlockers((c.blockers ?? []).join("\n"));
        setAnswers((c.adaptiveAnswers as Record<string, string>) ?? {});
      }
    }
  }, [today]);

  const openTasks = (tasks ?? [])
    .filter((t) => t.status !== "done")
    .sort(
      (a, b) =>
        PRANK[a.priority] - PRANK[b.priority] ||
        (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity),
    );

  function toggleTask(id: Id<"tasks">) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_PRIORITIES
          ? prev
          : [...prev, id],
    );
  }

  async function save() {
    const titles = selected
      .map((id) => tasks?.find((t) => t._id === id)?.title)
      .filter((x): x is string => Boolean(x));
    await submit({
      energyMood: energy,
      priorities: titles,
      priorityTaskIds: selected,
      blockers: blockers.split("\n"),
      adaptiveAnswers: answers,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <Topbar />
      <div className="mx-auto max-w-3xl px-8 py-7">
        <h1 className="text-2xl font-bold tracking-tight">Daily Check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A few minutes to set your day. {today?.checkIn ? "You've checked in today — edit anytime." : ""}
        </p>

        {/* Today's schedule — plan for the day, check blocks off as you go */}
        <TodaySchedule className="mt-6" />

        {/* Energy / mood */}
        <Card className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">How&apos;s your energy &amp; mood?</h2>
            <span className="text-3xl">{moodEmoji(energy)}</span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
              <button
                key={v}
                onClick={() => setEnergy(v)}
                className={cn(
                  "h-9 flex-1 rounded-lg text-sm font-medium transition",
                  v <= energy
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </Card>

        {/* Priorities — pick from your tasks */}
        <Card className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">
              Your top {MAX_PRIORITIES} tasks today
            </h2>
            <span className="text-xs text-muted-foreground">
              {selected.length}/{MAX_PRIORITIES} chosen
            </span>
          </div>
          {openTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open tasks. Add some in the Tasks module first.
            </p>
          ) : (
            <div className="max-h-72 space-y-1.5 overflow-y-auto">
              {openTasks.map((t) => {
                const rank = selected.indexOf(t._id);
                const on = rank !== -1;
                const full = !on && selected.length >= MAX_PRIORITIES;
                return (
                  <button
                    key={t._id}
                    onClick={() => toggleTask(t._id)}
                    disabled={full}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition",
                      on
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-muted/20 hover:border-border/80",
                      full && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {on ? rank + 1 : ""}
                    </span>
                    <span className="flex-1">{t.title}</span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase",
                        t.priority === "high"
                          ? "text-warning"
                          : t.priority === "med"
                            ? "text-primary"
                            : "text-muted-foreground",
                      )}
                    >
                      {t.priority}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Blockers */}
        <Card className="mt-4">
          <h2 className="mb-3 font-semibold">Any blockers or concerns?</h2>
          <textarea
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="One per line…"
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        </Card>

        {/* Adaptive questions — data-driven, with optional AI-written ones */}
        {today && (
          <Card className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4 text-primary" /> For you, today
              </h2>
              <button
                onClick={async () => {
                  setAiLoading(true);
                  setAiError(null);
                  try {
                    setAiQuestions(await fetchAiQuestions());
                  } catch {
                    setAiError("Couldn't reach the AI (free model rate limit). Try again.");
                  } finally {
                    setAiLoading(false);
                  }
                }}
                disabled={aiLoading}
                className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/25 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {aiLoading ? "Writing…" : "AI questions"}
              </button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Grounded in what&apos;s actually going on in your system.
            </p>
            <div className="space-y-3">
              {today.adaptive.map((q) => (
                <QuestionField
                  key={q.id}
                  question={q.question}
                  value={answers[q.id] ?? ""}
                  onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                />
              ))}
              {aiQuestions.map((q, i) => (
                <QuestionField
                  key={`ai_${i}`}
                  question={q}
                  ai
                  value={answers[`ai_${i}`] ?? ""}
                  onChange={(v) => setAnswers((prev) => ({ ...prev, [`ai_${i}`]: v }))}
                />
              ))}
              {aiError && <p className="text-xs text-warning">{aiError}</p>}
              {today.adaptive.length === 0 && aiQuestions.length === 0 && !aiError && (
                <p className="text-sm text-muted-foreground">
                  You&apos;re all caught up — tap <span className="text-primary">AI questions</span> for a tailored prompt.
                </p>
              )}
            </div>
          </Card>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => void save()}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Check className="h-4 w-4" />
            {today?.checkIn ? "Update check-in" : "Save check-in"}
          </button>
          {saved && <span className="text-sm text-primary">Saved ✓</span>}
        </div>

        {/* Mood trend */}
        {recent && recent.length > 1 && (
          <Card className="mt-6">
            <h2 className="mb-4 font-semibold">Energy &amp; mood — last {recent.length} check-ins</h2>
            <LineChart
              data={recent.map((c) => ({ label: c.date.slice(5), value: c.energyMood }))}
              max={10}
            />
          </Card>
        )}

        {/* Past check-ins */}
        {recent && recent.length > 0 && (
          <Card className="mt-6">
            <h2 className="mb-3 font-semibold">Past check-ins</h2>
            <div className="space-y-2">
              {[...recent].reverse().map((c) => (
                <div key={c._id} className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.date}</span>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      {moodEmoji(c.energyMood)} {c.energyMood}/10
                      <span className="text-xs">
                        {new Date(c._creationTime).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                  </div>
                  {c.priorities.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Priorities:</span>{" "}
                      {c.priorities.join(" · ")}
                    </p>
                  )}
                  {c.blockers.length > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Blockers:</span>{" "}
                      {c.blockers.join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
  ai,
}: {
  question: string;
  value: string;
  onChange: (v: string) => void;
  ai?: boolean;
}) {
  return (
    <div>
      <p className="flex items-start gap-2 text-sm font-medium">
        {ai && (
          <span className="mt-0.5 shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-primary">
            AI
          </span>
        )}
        {question}
      </p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your answer…"
        className="mt-1 w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm outline-none focus:border-primary/60"
      />
    </div>
  );
}
