"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { BookmarkPlus, Check, CheckCircle2, ClipboardCheck, Layers, Timer, TrendingDown, TrendingUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { Chip, EmptyHint, Section, Select, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { mondayOf } from "@/lib/day";
import { LessonInput } from "./LessonInput";
import { PerformanceDialog } from "./PerformanceEditor";
import { RatioChip } from "./bits";
import { errMsg, type LitePiece, type PerfWindow } from "./model";

type Analytics = FunctionReturnType<typeof api.content.analytics>;

const STEPS = [
  { key: "numbers", label: "Log numbers", min: 4 },
  { key: "top", label: "Top 3 · why?", min: 5 },
  { key: "bottom", label: "Bottom 3 · why?", min: 5 },
  { key: "hooks", label: "Promote hooks", min: 3 },
  { key: "hub", label: "Next hub", min: 3 },
] as const;

/** The weekly 20-minute content review, as a guided card. */
export function WeeklyContentReview({ data, ideas, today }: { data: Analytics; ideas: LitePiece[]; today: string }) {
  const week = mondayOf(today);
  const doneKey = `bishos.content.review.${week}`;
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [perf, setPerf] = useState<{ piece: LitePiece; window: PerfWindow } | null>(null);
  const [hubPick, setHubPick] = useState("");
  const saveHook = useMutation(api.swipes.saveHookFromPiece);
  const update = useMutation(api.content.update);
  const setStage = useMutation(api.content.setStage);

  useEffect(() => {
    try {
      setDone(window.localStorage.getItem(doneKey) === "1");
    } catch {
      /* ignore */
    }
  }, [doneKey]);
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [started]);

  const left = started ? Math.max(0, 20 * 60 - Math.floor((now - started) / 1000)) : 20 * 60;
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  function finish() {
    setDone(true);
    try {
      window.localStorage.setItem(doneKey, "1");
    } catch {
      /* ignore */
    }
    reward("Content review done. See you next week", undefined, true);
  }

  const promotable = data.outlierHooks.filter((h) => !h.inLibrary);
  const hubCandidates = ideas.filter((p) => !p.publishedAt && p.stage !== "archived").slice(0, 60);

  if (done) {
    return (
      <Section title="Weekly content review" icon={ClipboardCheck}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Done for this week</p>
            <p className="text-xs text-muted-foreground">Lessons saved, hooks promoted. The loop is closed.</p>
          </div>
          <button
            onClick={() => {
              setDone(false);
              setStep(0);
            }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Review again
          </button>
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Weekly content review"
      icon={ClipboardCheck}
      hint="20 minutes: numbers in, ask why, keep the lesson, promote what worked."
      action={
        <button
          onClick={() => setStarted(started ? null : Date.now())}
          className={cn(buttonVariants({ variant: started ? "secondary" : "outline", size: "sm" }), "tabular-nums")}
        >
          <Timer className="h-3.5 w-3.5" />
          {started ? clock : "Start 20 min"}
        </button>
      }
    >
      <ol className="mb-4 flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {STEPS.map((s, i) => (
          <li key={s.key}>
            <button
              onClick={() => setStep(i)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs transition-colors",
                i === step ? "border-foreground bg-foreground text-background" : i < step ? "border-border text-foreground" : "border-border text-muted-foreground",
              )}
            >
              {i < step ? <Check className="h-3 w-3" /> : <span className="tabular-nums">{i + 1}</span>}
              {s.label}
            </button>
          </li>
        ))}
      </ol>

      <div className="min-h-[160px]">
        {step === 0 &&
          (data.needsNumbers.length === 0 ? (
            <EmptyHint icon={CheckCircle2} title="All numbers are in" hint="Every published piece has its 24h / 7d / 30d snapshot." className="py-6" />
          ) : (
            <ul className="space-y-1.5">
              {data.needsNumbers.slice(0, 8).map((n) => (
                <li key={n.piece._id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm">{n.piece.title}</span>
                  <Chip tone="info">{n.window} due</Chip>
                  <button onClick={() => setPerf({ piece: n.piece, window: n.window })} className={buttonVariants({ size: "sm" })}>
                    Add
                  </button>
                </li>
              ))}
            </ul>
          ))}

        {step === 1 &&
          (data.review.top.length === 0 ? (
            <EmptyHint
              icon={TrendingUp}
              title="Nothing to compare yet"
              hint="Log views for 2+ published pieces in the last 30 days and the winners show up here."
              className="py-6"
            />
          ) : (
            <ul className="space-y-2">
              {data.review.top.map((p) => (
                <ReviewRow key={p._id} p={p} top placeholder="Why did this work? Hook, topic, format, timing…" />
              ))}
            </ul>
          ))}

        {step === 2 &&
          (data.review.bottom.length === 0 ? (
            <EmptyHint icon={TrendingDown} title="No under-performers to review" hint="Good. Or log a few more numbers first." className="py-6" />
          ) : (
            <ul className="space-y-2">
              {data.review.bottom.map((p) => (
                <ReviewRow key={p._id} p={p} placeholder="What would you change? Hook, length, topic…" />
              ))}
            </ul>
          ))}

        {step === 3 &&
          (promotable.length === 0 ? (
            <EmptyHint
              icon={BookmarkPlus}
              title="No new winning hooks"
              hint="Hooks from pieces at ×1.2 your median or better land here."
              className="py-6"
            />
          ) : (
            <ul className="space-y-1.5">
              {promotable.map((h) => (
                <li key={h.pieceId} className="flex items-start gap-2 rounded-lg border border-border px-3 py-2">
                  <p className="min-w-0 flex-1 text-sm">&ldquo;{h.hook}&rdquo;</p>
                  <RatioChip ratio={h.ratio} />
                  <button
                    onClick={() =>
                      void saveHook({ pieceId: h.pieceId, note: `×${h.ratio} your median` })
                        .then(() => toast("Hook saved to library", { tone: "success" }))
                        .catch((e) => toast(errMsg(e), { tone: "warning" }))
                    }
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" /> Save
                  </button>
                </li>
              ))}
            </ul>
          ))}

        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              One hub a week, cut into 5–10 short pieces. Pick the idea or seed with the most energy (seeds that beat your median are the best bets).
            </p>
            <div className="flex flex-wrap gap-2">
              <Select value={hubPick} onChange={(e) => setHubPick(e.target.value)} className="min-w-[220px] flex-1">
                <option value="">Choose next week&apos;s hub…</option>
                {hubCandidates.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.isHub ? "★ " : ""}
                    {p.title}
                  </option>
                ))}
              </Select>
              <button
                disabled={!hubPick}
                onClick={async () => {
                  const p = hubCandidates.find((x) => x._id === hubPick);
                  if (!p) return;
                  try {
                    await update({ id: p._id, isHub: true });
                    if (p.stage === "idea" || p.stage === "seed") await setStage({ id: p._id, stage: "brief", date: today });
                    toast("Next hub set · it's in Brief", { tone: "success" });
                    setHubPick("");
                  } catch (e) {
                    toast(errMsg(e), { tone: "warning" });
                  }
                }}
                className={buttonVariants({ size: "sm" })}
              >
                <Layers className="h-3.5 w-3.5" /> Make it the hub
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-[11px] text-muted-foreground">
          Step {step + 1} of {STEPS.length} · ~{STEPS[step].min} min
        </span>
        <div className="flex gap-2">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Next
            </button>
          ) : (
            <button onClick={finish} className={buttonVariants({ size: "sm" })}>
              <Check className="h-3.5 w-3.5" /> Finish review
            </button>
          )}
        </div>
      </div>

      {perf && (
        <PerformanceDialog
          open
          onClose={() => setPerf(null)}
          title={perf.piece.title}
          pieceId={perf.piece._id}
          performance={perf.piece.performance}
          defaultWindow={perf.window}
        />
      )}
    </Section>
  );
}

function ReviewRow({ p, placeholder, top }: { p: LitePiece; placeholder: string; top?: boolean }) {
  const saveHook = useMutation(api.swipes.saveHookFromPiece);
  return (
    <li className="rounded-lg border border-border p-3">
      <div className="flex items-start gap-2">
        <Link href={`/content/${p._id}`} className="min-w-0 flex-1 text-sm font-medium hover:underline">
          {p.title}
        </Link>
        <RatioChip ratio={p.perf?.ratio} basis={p.perf?.basis} long />
      </div>
      {p.hook && <p className="mt-1 line-clamp-1 text-xs italic text-muted-foreground">&ldquo;{p.hook}&rdquo;</p>}
      <LessonInput pieceId={p._id} initial={p.lesson} placeholder={placeholder} className="mt-2" />
      {top && p.hook && (
        <button
          onClick={() =>
            void saveHook({ pieceId: p._id, note: p.perf?.ratio ? `×${p.perf.ratio} your median` : undefined })
              .then((r) => toast(r.existed ? "Already in your hook library" : "Hook saved to library", { tone: "success" }))
              .catch((e) => toast(errMsg(e), { tone: "warning" }))
          }
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-1 h-7 px-2 text-xs")}
        >
          <BookmarkPlus className="h-3.5 w-3.5" /> Save hook
        </button>
      )}
    </li>
  );
}
