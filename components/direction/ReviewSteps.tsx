"use client";

/**
 * Step bodies for the review wizards. Each step reads the pre-filled numbers
 * (`pre`) and saves its answers through `save(key, value)` (autosaved).
 */
import { useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarPlus,
  Check,
  Copy,
  Inbox,
  Loader2,
  Plus,
  Rocket,
  Sparkles,
  Star,
  Trophy,
  X,
} from "lucide-react";
import {
  AreaDot,
  Bar,
  CheckCircle,
  Chip,
  EmptyHint,
  ListEditor,
  Metric,
  Segmented,
  Select,
  TextInput,
  areaColor,
  buttonVariants,
  cn,
  inputClass,
} from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { addDaysYmd, fmtYmd, mondayOf, todayYmd } from "@/lib/day";
import { AutoInput, AutoTextArea } from "./AutoField";
import { ExecBars, ExecRing, RadarChart } from "./charts";
import { Big3Editor, FreeDayPicker, HoursByArea } from "./widgets";
import { RatingRow } from "./RatingRow";
import { CycleWizard, Candidate } from "./CycleWizard";
import { BURNOUT_QS, ReviewKind } from "./reviewMeta";
import { errMsg, fmtMonth, fmtRange } from "./util";

export type Prefill = FunctionReturnType<typeof api.periodicReviews.prefill>;
type P<K extends Prefill["kind"]> = Extract<Prefill, { kind: K }>;
type Answers = Record<string, unknown>;

export type StepCtx = {
  kind: ReviewKind;
  review: Doc<"periodicReviews">;
  pre: Prefill;
  answers: Answers;
  save: (key: string, value: unknown) => Promise<unknown>;
  today: string;
  tz: number;
};

const str = (a: Answers, k: string) => (typeof a[k] === "string" ? (a[k] as string) : "");
const arr = (a: Answers, k: string) => (Array.isArray(a[k]) ? (a[k] as string[]) : []);

// ─────────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────────

function Stats({ items }: { items: { label: string; value: React.ReactNode; tone?: "success" | "warning" | "danger" | "info" }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="rounded-lg border border-border bg-background/60 p-3">
          <Metric label={i.label} value={i.value} tone={i.tone} />
        </div>
      ))}
    </div>
  );
}

function Sub({ title, children, action }: { title: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function CheckList({ ctx, k, items }: { ctx: StepCtx; k: string; items: string[] }) {
  const done = arr(ctx.answers, k);
  return (
    <div className="space-y-1.5">
      {items.map((it) => {
        const on = done.includes(it);
        return (
          <div key={it} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent/40">
            <CheckCircle checked={on} onClick={() => void ctx.save(k, on ? done.filter((x) => x !== it) : [...done, it])} size="sm" />
            <span className={cn("text-sm", on && "text-muted-foreground line-through")}>{it}</span>
          </div>
        );
      })}
    </div>
  );
}

/** "Draft with AI" → editable text → "Save" (the user confirms every word). */
export function AiDraft({ ctx, focus, label = "Draft with AI" }: { ctx: StepCtx; focus: string; label?: string }) {
  const draft = useAction(api.periodicReviews.aiDraft);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const saved = str(ctx.answers, `ai.${focus}`);
  const run = async () => {
    setBusy(true);
    try {
      const t = await draft({ kind: ctx.kind, periodKey: ctx.review.periodKey, today: ctx.today, tz: ctx.tz, focus });
      setText(t);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> AI draft — from your numbers; edit before saving
        </span>
        <button type="button" onClick={() => void run()} disabled={busy} className={buttonVariants({ variant: "secondary", size: "sm" })}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {text || saved ? "Redraft" : label}
        </button>
      </div>
      {text !== null && (
        <div className="os-rise space-y-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className={cn(inputClass, "w-full py-2 text-sm leading-relaxed")} />
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setText(null)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Discard
            </button>
            <button
              type="button"
              onClick={() => {
                void ctx.save(`ai.${focus}`, text);
                setText(null);
                toast("Saved to the review", { tone: "success" });
              }}
              className={buttonVariants({ size: "sm" })}
            >
              <Check className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </div>
      )}
      {text === null && saved && <AutoTextArea value={saved} onSave={(v) => ctx.save(`ai.${focus}`, v)} rows={5} />}
    </div>
  );
}

function StaleTasks({ tasks }: { tasks: { _id: Id<"tasks">; title: string; ageDays: number; deferCount: number }[] }) {
  const plan = useMutation(api.tasks.plan);
  const remove = useMutation(api.tasks.remove);
  const [handled, setHandled] = useState<Record<string, string>>({});
  const nextMonday = addDaysYmd(mondayOf(todayYmd()), 7);
  const act = async (id: Id<"tasks">, what: "schedule" | "someday" | "drop") => {
    try {
      if (what === "schedule") await plan({ ids: [id], plannedFor: nextMonday });
      if (what === "someday") await plan({ ids: [id], plannedFor: null, someday: true });
      if (what === "drop") await remove({ id });
      setHandled((h) => ({ ...h, [id]: what }));
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  };
  if (!tasks.length) return <p className="text-sm text-muted-foreground">No tasks have waited 30+ days. Nice and fresh.</p>;
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-muted-foreground">No silent rollover: each one gets a decision.</p>
      {tasks.map((t) => (
        <div key={t._id} className={cn("flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2", handled[t._id] && "opacity-50")}>
          <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
          <span className="text-[11px] tabular-nums text-muted-foreground">{t.ageDays}d</span>
          {handled[t._id] ? (
            <Chip tone="success">{handled[t._id]}</Chip>
          ) : (
            <div className="flex gap-1">
              <button onClick={() => void act(t._id, "schedule")} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7")}>
                Next week
              </button>
              <button onClick={() => void act(t._id, "someday")} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7")}>
                Someday
              </button>
              <button onClick={() => confirm(`Delete “${t.title}”?`) && void act(t._id, "drop")} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 hover:text-danger")}>
                Drop
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Burnout({ ctx, prefix }: { ctx: StepCtx; prefix: "pulse" | "burnout" }) {
  const vals = BURNOUT_QS.map((q) => Number(ctx.answers[`${prefix}.${q.key}`]) || 0);
  const answered = vals.filter(Boolean);
  const avg = answered.length ? answered.reduce((a, b) => a + b, 0) / answered.length : 0;
  return (
    <div className="space-y-4">
      {BURNOUT_QS.map((q, i) => (
        <div key={q.key} className="space-y-1.5">
          <p className="text-sm font-medium">{q.q}</p>
          <div className="flex items-center gap-2">
            <span className="w-16 text-right text-[11px] text-muted-foreground">{q.low}</span>
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => void ctx.save(`${prefix}.${q.key}`, n)}
                  aria-pressed={vals[i] === n}
                  className={cn(
                    "h-8 flex-1 rounded-md border text-sm font-medium transition-colors",
                    vals[i] === n ? "border-ring bg-primary text-primary-foreground" : "border-border hover:bg-accent",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <span className="w-16 text-[11px] text-muted-foreground">{q.high}</span>
          </div>
        </div>
      ))}
      {answered.length === 3 &&
        (avg >= 3.5 ? (
          <div className="flex gap-2 rounded-lg bg-warning-soft p-3 text-sm text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              These are signs of running hot. Protect two Free Days next week, drop or pause one goal, and move one recurring task to someone else.
              If this persists, talk to someone you trust. (This is an observation, not a diagnosis.)
            </span>
          </div>
        ) : avg >= 2.5 ? (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">Some strain. Keep the Free Day sacred and watch sleep this month.</p>
        ) : (
          <p className="rounded-lg bg-success-soft p-3 text-sm text-success">You're in a good place. Keep the rhythm that got you here.</p>
        ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// WEEKLY
// ─────────────────────────────────────────────────────────────────────────

function WCelebrate({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"weekly">;
  const [more, setMore] = useState(false);
  const wins = more ? pre.wins : pre.wins.slice(0, 10);
  return (
    <div className="space-y-5">
      <Stats
        items={[
          { label: "Tasks done", value: pre.tasksDone, tone: pre.tasksDone ? "success" : undefined },
          { label: "Focus hours", value: pre.focusH },
          { label: "Big 3", value: pre.big3.length ? `${pre.big3Done}/${pre.big3.length}` : "—" },
          { label: "Progress lines", value: pre.progressLines.length },
        ]}
      />
      {pre.wins.length > 0 && (
        <Sub title="Done this week">
          <ul className="grid gap-1 sm:grid-cols-2">
            {wins.map((w) => (
              <li key={w._id} className="flex items-center gap-2 text-sm">
                <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                <span className="truncate">{w.title}</span>
                {w.area && <span className="shrink-0 text-[11px] text-muted-foreground">{w.area}</span>}
              </li>
            ))}
          </ul>
          {pre.wins.length > 10 && (
            <button onClick={() => setMore(!more)} className="text-xs text-muted-foreground underline">
              {more ? "Show less" : `+${pre.wins.length - 10} more`}
            </button>
          )}
        </Sub>
      )}
      {(pre.progressLines.length > 0 || pre.journalWins.length > 0) && (
        <Sub title="From your days">
          <ul className="space-y-1">
            {[...pre.progressLines, ...pre.journalWins].map((p, i) => (
              <li key={i} className="text-sm">
                <span className="mr-2 text-[11px] text-muted-foreground">{fmtYmd(p.date, { weekday: "short" })}</span>
                {p.text}
              </li>
            ))}
          </ul>
        </Sub>
      )}
      {pre.wins.length === 0 && pre.progressLines.length === 0 && (
        <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">Quiet week on the record — progress still happened. What moved, even a little?</p>
      )}
      <AutoTextArea label="My three proudest wins" value={str(ctx.answers, "celebrate.wins")} onSave={(v) => ctx.save("celebrate.wins", v)} placeholder="1. Closed … 2. Shipped … 3. Finally …" rows={4} />
    </div>
  );
}

function WScore({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"weekly">;
  const ex = pre.execution;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <ExecRing score={ex.score} size={140} label="execution" sub={ex.target ? `${ex.achieved}/${ex.target} reps` : pre.cycle ? "No tactics scored" : "No 12-week cycle yet"} />
        <div className="space-y-3">
          {pre.history.length > 0 && <ExecBars points={pre.history} />}
          {ex.items.length > 0 && (
            <ul className="space-y-1">
              {ex.items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">
                    {i.title} <span className="text-[11px] text-muted-foreground">· {i.goalTitle}</span>
                  </span>
                  <span className={cn("tabular-nums", i.done >= i.target ? "text-success" : "text-muted-foreground")}>
                    {i.done}/{i.target}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Sub title={`Big 3 · ${pre.big3.length ? Math.round((pre.big3Done / pre.big3.length) * 100) : 0}%`}>
          {pre.big3.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Big 3 was set for this week — you'll set next week's at the end.</p>
          ) : (
            <ul className="space-y-1">
              {pre.big3.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className={cn("flex size-4 items-center justify-center rounded-full border", b.done ? "border-success bg-success text-background" : "border-muted-foreground/40")}>
                    {b.done && <Check className="h-3 w-3" />}
                  </span>
                  <span className={cn(b.done && "text-muted-foreground line-through")}>{b.text}</span>
                </li>
              ))}
            </ul>
          )}
        </Sub>
        <Sub title={`Habits · ${pre.habits.pct === null ? "—" : `${pre.habits.pct}%`}`}>
          {pre.habits.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active habits.</p>
          ) : (
            <ul className="space-y-1.5">
              {pre.habits.rows.slice(0, 8).map((h) => (
                <li key={h._id} className="space-y-0.5">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{h.title}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {h.done}/{h.target}
                      {h.skips ? ` · ${h.skips} skip` : ""}
                    </span>
                  </div>
                  <Bar value={h.pct} tone={h.pct >= 85 ? "success" : "primary"} />
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-muted-foreground">
            Rituals: {pre.rituals.startups}/7 start-ups · {pre.rituals.shutdowns}/7 shutdowns
          </p>
        </Sub>
      </div>
      <AutoTextArea label="What drove the score?" value={str(ctx.answers, "score.note")} onSave={(v) => ctx.save("score.note", v)} placeholder="What helped, what got in the way…" rows={3} />
    </div>
  );
}

function WReflect({ ctx }: { ctx: StepCtx }) {
  const fields = [
    ["reflect.keep", "Keep", "What worked and should stay?"],
    ["reflect.improve", "Improve", "What worked, but could be better?"],
    ["reflect.start", "Start", "What will you try next week?"],
    ["reflect.stop", "Stop", "What will you stop doing?"],
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([k, l, p]) => (
          <AutoTextArea key={k} label={l} value={str(ctx.answers, k)} onSave={(v) => ctx.save(k, v)} placeholder={p} rows={3} />
        ))}
      </div>
      <AiDraft ctx={ctx} focus="reflect" />
    </div>
  );
}

function WClear({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"weekly">;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-muted">
            <Inbox className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{pre.inbox.open}</p>
            <p className="text-xs text-muted-foreground">
              open in the bishOS inbox{pre.inbox.older48h ? ` · ${pre.inbox.older48h} older than 48h` : ""}
            </p>
          </div>
        </div>
        {pre.inbox.open > 0 ? (
          <Link href="/inbox" className={buttonVariants({ size: "sm" })}>
            Process inbox <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <Chip tone="success">
            <Check /> Inbox zero
          </Chip>
        )}
      </div>
      <CheckList
        ctx={ctx}
        k="clear.checks"
        items={[
          "bishOS inbox at zero",
          "Email inbox processed",
          "Messages & DMs answered or captured",
          "Notes, voice memos & screenshots captured",
          "Desktop & downloads cleared",
          "Head emptied — brain dump below",
        ]}
      />
      <AutoTextArea
        label="Brain dump"
        value={str(ctx.answers, "clear.braindump")}
        onSave={(v) => ctx.save("clear.braindump", v)}
        placeholder="Anything still on your mind — ideas, worries, promises, errands…"
        rows={4}
        hint="Capture items into the Inbox when you're done; this note stays with the review."
      />
    </div>
  );
}

function WCurrent({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"weekly">;
  return (
    <div className="space-y-6">
      <Sub
        title="Calendar"
        action={
          <Link href="/schedule" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Open calendar <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        <CheckList ctx={ctx} k="current.checks" items={["Last 2 weeks: loose ends captured", "Next 4 weeks: prep and travel planned", "Waiting-for list checked"]} />
      </Sub>
      <Sub title={`Projects without a next action · ${pre.projectsNoNext.length}`}>
        {pre.projectsNoNext.length === 0 ? (
          <p className="text-sm text-muted-foreground">Every open project has a next action.</p>
        ) : (
          <ul className="space-y-1">
            {pre.projectsNoNext.map((p) => (
              <li key={p._id}>
                <Link href={`/projects/${p._id}`} className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent">
                  <span className="truncate">{p.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {p.area} · {p.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Sub>
      <Sub title={`Untouched 30+ days · ${pre.staleTasks.length}`}>
        <StaleTasks tasks={pre.staleTasks} />
      </Sub>
      <div className="grid gap-5 md:grid-cols-2">
        <Sub
          title="Pipeline"
          action={
            <Link href="/pipeline" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Pipeline <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {pre.dealsNoNextStep.length === 0 && pre.idleDeals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Every open deal has a dated next step and a recent touch.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {pre.dealsNoNextStep.map((d) => (
                <li key={d._id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{d.title}</span>
                  <Chip tone="warning">no next step</Chip>
                </li>
              ))}
              {pre.idleDeals.map((d) => (
                <li key={`i${d._id}`} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {d.title}
                    {d.person && <span className="text-[11px] text-muted-foreground"> · {d.person}</span>}
                  </span>
                  <Chip tone="muted">idle {d.idleDays}d</Chip>
                </li>
              ))}
            </ul>
          )}
          {pre.dealsOverdueStep > 0 && <p className="text-[11px] text-warning">{pre.dealsOverdueStep} next steps are past their date.</p>}
        </Sub>
        <Sub
          title="Commitments"
          action={
            <Link href="/commitments" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Ledger <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {pre.commitments.iOwe.length === 0 && pre.commitments.owedToMe.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open promises either way.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {pre.commitments.iOwe.length > 0 && <p className="text-[11px] font-medium text-muted-foreground">I owe ({pre.commitments.iOwe.length}) — handle these first</p>}
              {pre.commitments.iOwe.slice(0, 6).map((c) => (
                <div key={c._id} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {c.title}
                    {c.person && <span className="text-[11px] text-muted-foreground"> · {c.person}</span>}
                  </span>
                  {c.date && <Chip tone={c.overdue ? "warning" : "muted"}>{fmtYmd(c.date, { month: "short", day: "numeric" })}</Chip>}
                </div>
              ))}
              {pre.commitments.owedToMe.length > 0 && <p className="pt-1 text-[11px] font-medium text-muted-foreground">Waiting for ({pre.commitments.owedToMe.length})</p>}
              {pre.commitments.owedToMe.slice(0, 6).map((c) => (
                <div key={c._id} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {c.title}
                    {c.person && <span className="text-[11px] text-muted-foreground"> · {c.person}</span>}
                  </span>
                  {c.date && <Chip tone={c.overdue ? "info" : "muted"}>{fmtYmd(c.date, { month: "short", day: "numeric" })}</Chip>}
                </div>
              ))}
            </div>
          )}
        </Sub>
      </div>
      <AutoTextArea label="Notes" value={str(ctx.answers, "current.note")} onSave={(v) => ctx.save("current.note", v)} placeholder="Follow-ups to send, things to prep…" rows={2} />
    </div>
  );
}

function WScorecard({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"weekly">;
  return (
    <div className="space-y-6">
      <Sub
        title="Scorecard"
        action={
          <Link href="/scorecard" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Scorecard <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {pre.scorecard.length === 0 ? (
          <p className="text-sm text-muted-foreground">No weekly numbers yet. Set up 5–7 founder numbers on the Scorecard to see on/off track here.</p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {pre.scorecard.map((m) => (
              <div key={m._id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="truncate">{m.name}</span>
                <span className="flex items-center gap-2 tabular-nums">
                  <span>
                    {m.value ?? "—"}
                    <span className="text-muted-foreground">
                      /{m.target}
                      {m.unit ? ` ${m.unit}` : ""}
                    </span>
                  </span>
                  {m.onTrack === null ? <Chip tone="muted">{m.auto ? "auto" : "no entry"}</Chip> : m.onTrack ? <Chip tone="success">on track</Chip> : <Chip tone="warning">off track</Chip>}
                </span>
              </div>
            ))}
          </div>
        )}
      </Sub>
      <Sub
        title="Top issues · IDS"
        action={
          <Link href="/decisions" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Issues <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {pre.issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open issues.</p>
        ) : (
          <ol className="space-y-1">
            {pre.issues.map((i, n) => (
              <li key={i._id} className={cn("flex items-center gap-2 rounded-md px-2 py-1 text-sm", n < 3 && "bg-muted/60 font-medium")}>
                <span className="w-4 text-[11px] tabular-nums text-muted-foreground">{n + 1}</span>
                <span className="truncate">{i.title}</span>
                <Chip tone="muted" className="ml-auto">
                  {i.status}
                </Chip>
              </li>
            ))}
          </ol>
        )}
        <AutoTextArea value={str(ctx.answers, "scorecard.ids")} onSave={(v) => ctx.save("scorecard.ids", v)} placeholder="Identify the real issue → discuss → decide the solution and the to-do." rows={3} />
      </Sub>
      <Sub title={`Someday / maybe · ${pre.someday.count}`}>
        {pre.someday.items.length > 0 && <p className="text-sm text-muted-foreground">{pre.someday.items.map((t) => t.title).join(" · ")}</p>}
        <AutoTextArea value={str(ctx.answers, "scorecard.someday")} onSave={(v) => ctx.save("scorecard.someday", v)} placeholder="Anything ready to become active? Anything to delete?" rows={2} />
      </Sub>
    </div>
  );
}

function WPlan({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"weekly">;
  const apply = useMutation(api.idealWeek.applyToWeek);
  const next = pre.nextWeek.weekStart;
  const tactics = pre.execution.items.filter((i) => i.kind === "tactic");
  return (
    <div className="space-y-6">
      <Sub title={`Next week's Big 3 · ${fmtRange(next, addDaysYmd(next, 6))}`}>
        <Big3Editor weekStart={next} big3={pre.nextWeek.big3} goals={pre.goals} today={ctx.today} checkable={false} />
      </Sub>
      {tactics.length > 0 && (
        <Sub title="Tactics to place first">
          <ul className="grid gap-1 sm:grid-cols-2">
            {tactics.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1 text-sm">
                <span className="truncate">{t.title}</span>
                <span className="text-[11px] tabular-nums text-muted-foreground">{t.target}×/wk</span>
              </li>
            ))}
          </ul>
        </Sub>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <Sub title="Protect next week's Free Day">
          <FreeDayPicker weekStart={next} freeDay={pre.nextWeek.freeDay} today={ctx.today} />
        </Sub>
        <Sub title="Shape the week">
          <p className="text-sm text-muted-foreground">Place maker blocks first, then calls. Your Ideal Week does it in one click — overlaps are skipped.</p>
          <button
            type="button"
            onClick={async () => {
              try {
                const r = await apply({ weekStart: next, today: ctx.today });
                toast(r.created ? `Added ${r.created} blocks to next week` : "Next week already has these blocks", { tone: "success" });
              } catch (e) {
                toast(errMsg(e), { tone: "warning" });
              }
            }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <CalendarPlus className="h-3.5 w-3.5" /> Apply Ideal Week to next week
          </button>
        </Sub>
      </div>
      <Sub title="WOOP the riskiest item">
        <div className="grid gap-3 md:grid-cols-2">
          <AutoInput label="Riskiest item & its obstacle" value={str(ctx.answers, "plan.risk")} onSave={(v) => ctx.save("plan.risk", v)} placeholder="Proposal for Acme — I'll procrastinate on pricing" />
          <AutoInput label="If-then plan" value={str(ctx.answers, "plan.ifthen")} onSave={(v) => ctx.save("plan.ifthen", v)} placeholder="If it's Tuesday 9:00, then I draft pricing before email" />
        </div>
      </Sub>
      <AiDraft ctx={ctx} focus="plan" label="Suggest a Big 3" />
    </div>
  );
}

function WShare({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"weekly">;
  const composed = [
    `Week of ${fmtRange(pre.period.periodStart, pre.period.periodEnd)}`,
    `Execution: ${pre.execution.score === null ? "—" : `${pre.execution.score}%`}${pre.execution.target ? ` (${pre.execution.achieved}/${pre.execution.target})` : ""}`,
    `Big 3: ${pre.big3Done}/${pre.big3.length}`,
    `Tasks done: ${pre.tasksDone} · Focus: ${pre.focusH}h`,
    str(ctx.answers, "celebrate.wins") && `Wins:\n${str(ctx.answers, "celebrate.wins")}`,
    pre.nextWeek.big3.length > 0 && `Next week's Big 3:\n${pre.nextWeek.big3.map((b, i) => `${i + 1}. ${b.text}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const text = str(ctx.answers, "share.text") || composed;
  return (
    <div className="space-y-4">
      <AutoTextArea label="Update to share" value={text} onSave={(v) => ctx.save("share.text", v)} rows={10} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (!navigator.clipboard) return void toast("Copy isn't available here — select the text and copy it manually.", { tone: "warning" });
            navigator.clipboard
              .writeText(text)
              .then(() => toast("Copied — paste it to your co-founder", { tone: "success" }))
              .catch(() => toast("Couldn't copy — select the text and copy it manually.", { tone: "warning" }));
          }}
          className={buttonVariants({ size: "sm" })}
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
        <button type="button" onClick={() => void ctx.save("share.text", composed)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Rebuild from numbers
        </button>
      </div>
      <AiDraft ctx={ctx} focus="share" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MONTHLY
// ─────────────────────────────────────────────────────────────────────────

function MRate({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"monthly">;
  const rate = useMutation(api.compass.rate);
  const cur: Record<string, number | undefined> = {};
  const prev: Record<string, number | undefined> = {};
  for (const a of pre.areas) {
    cur[a._id] = a.rating ?? undefined;
    prev[a._id] = a.previous ?? undefined;
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <RadarChart axes={pre.areas.map((a) => ({ id: a._id, name: a.name }))} current={cur} previous={prev} currentLabel={fmtMonth(pre.period.periodKey)} previousLabel="Last month" size={260} />
      <div className="space-y-3">
        {pre.areas.map((a, i) => (
          <RatingRow
            key={a._id}
            name={a.name}
            color={areaColor(a, i)}
            value={a.rating ?? undefined}
            prev={a.previous ?? undefined}
            onSave={(rating) => rate({ lifeAreaId: a._id, period: pre.period.periodKey, rating }).catch((e) => toast(errMsg(e), { tone: "warning" }))}
          />
        ))}
        {pre.areas.some((a) => a.standard) && (
          <p className="text-[11px] text-muted-foreground">Rate against each area's standard (set on the Compass), not against perfection.</p>
        )}
        <AutoTextArea label="What stands out?" value={str(ctx.answers, "rate.note")} onSave={(v) => ctx.save("rate.note", v)} placeholder="The lowest spoke and one small move for it…" rows={2} />
      </div>
    </div>
  );
}

function MGoals({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"monthly">;
  if (!pre.goals.length)
    return (
      <EmptyHint
        title="No active goals"
        hint="Goals turn the Wheel of Life into action. Start a 12-week cycle when you're ready."
        action={
          <Link href="/goals" className={buttonVariants({ size: "sm" })}>
            Goals
          </Link>
        }
      />
    );
  return (
    <div className="space-y-3">
      {pre.goals.map((g) => {
        const k = `goals.status.${g._id}`;
        const v = (str(ctx.answers, k) || "on") as "on" | "risk" | "off";
        return (
          <div key={g._id} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/goals/${g._id}`} className="min-w-0 truncate text-sm font-medium hover:underline">
                {g.title}
              </Link>
              <Segmented
                size="sm"
                value={v}
                onChange={(x) => void ctx.save(k, x)}
                options={[
                  { value: "on", label: "On track" },
                  { value: "risk", label: "At risk" },
                  { value: "off", label: "Off track" },
                ]}
              />
            </div>
            <div className="flex items-center gap-2">
              <Chip tone="muted">{g.level === "annual" ? "Annual" : "12-week"}</Chip>
              <Bar value={g.progress} className="flex-1" tone={g.progress >= 100 ? "success" : "primary"} />
              <span className="text-xs tabular-nums">{g.progress}%</span>
            </div>
          </div>
        );
      })}
      <AutoTextArea label="Why — and what changes" value={str(ctx.answers, "goals.note")} onSave={(v) => ctx.save("goals.note", v)} rows={2} />
    </div>
  );
}

function MHabits({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"monthly">;
  const update = useMutation(api.habits.update);
  if (!pre.habits.rows.length) return <p className="text-sm text-muted-foreground">No active habits to tune this month.</p>;
  const apply = async (id: Id<"habits">, decision: string, title: string) => {
    try {
      if (decision === "graduate") {
        await update({ id, habitStatus: "graduated" });
        reward(`Graduated · ${title}`, undefined, true);
      } else if (decision === "drop") {
        await update({ id, habitStatus: "archived" });
        toast(`Archived · ${title}`, { tone: "info" });
      }
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  };
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">Last 30 days, skips excluded. Suggestions: ≥85% for 60+ days → graduate · under 30% → shrink or drop.</p>
      {pre.habits.rows.map((h) => {
        const k = `habits.decision.${h._id}`;
        const d = str(ctx.answers, k) || h.suggestion;
        return (
          <div key={h._id} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/habits/${h._id}`} className="min-w-0 truncate text-sm font-medium hover:underline">
                {h.title}
              </Link>
              <span className="text-xs tabular-nums text-muted-foreground">
                {h.pct}% · day {h.ageDays}
              </span>
            </div>
            <Bar value={h.pct} tone={h.pct >= 85 ? "success" : "primary"} />
            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                size="sm"
                value={d}
                onChange={(x) => void ctx.save(k, x)}
                options={[
                  { value: "graduate", label: "Graduate" },
                  { value: "keep", label: "Keep" },
                  { value: "shrink", label: "Shrink" },
                  { value: "drop", label: "Drop" },
                ]}
              />
              {(d === "graduate" || d === "drop") && (
                <button onClick={() => void apply(h._id, d, h.title)} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "h-7")}>
                  Apply
                </button>
              )}
              {d === "shrink" && (
                <Link href={`/habits/${h._id}`} className="text-xs text-muted-foreground underline">
                  Edit the minimum version{h.minVersion ? ` (now: ${h.minVersion})` : ""}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MTime({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"monthly">;
  return (
    <div className="space-y-4">
      <HoursByArea rows={pre.hours.rows} totals={pre.hours.totals} />
      <AutoTextArea label="Re-weight next month" value={str(ctx.answers, "time.note")} onSave={(v) => ctx.save("time.note", v)} placeholder="More sales, less admin? Adjust targets on the Compass." rows={2} />
    </div>
  );
}

function MMigrate({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"monthly">;
  return <StaleTasks tasks={pre.staleTasks} />;
}

function MNext({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"monthly">;
  return (
    <div className="space-y-4">
      <Stats
        items={[
          { label: "Tasks done", value: pre.tasksDone },
          { label: "Focus hours", value: pre.focusH },
          { label: "Deals won", value: pre.dealsWon, tone: pre.dealsWon ? "success" : undefined },
          { label: "Published", value: pre.contentPublished },
        ]}
      />
      <AutoInput label="One focus for next month" value={str(ctx.answers, "next.focus")} onSave={(v) => ctx.save("next.focus", v)} placeholder="e.g. Fill the pipeline: 3 discovery calls a week" />
      <AutoTextArea label="Adjustments" value={str(ctx.answers, "next.adjust")} onSave={(v) => ctx.save("next.adjust", v)} rows={3} placeholder="What you'll change in your week, habits or targets…" />
      <AiDraft ctx={ctx} focus="next" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// QUARTERLY
// ─────────────────────────────────────────────────────────────────────────

const defaultOutcome = (grade: number | null) => ((grade ?? 0) >= 0.7 ? "achieved" : "carry");

function QGrade({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"quarterly">;
  const updateGoal = useMutation(api.goals.update);
  const update = (args: { id: Id<"goals">; grade: number }) => updateGoal(args).catch((e) => toast(errMsg(e), { tone: "warning" }));
  if (!pre.cycle)
    return (
      <EmptyHint
        title="No 12-week cycle in this period"
        hint="Grades apply to cycle goals. Use this review for the scan and pruning, then launch your first cycle at the end."
      />
    );
  if (!pre.goals.length) return <p className="text-sm text-muted-foreground">This cycle had no goals to grade.</p>;
  return (
    <div className="space-y-3">
      {pre.goals.map((g) => {
        const grade = g.grade ?? g.suggestedGrade ?? 0;
        const k = `grade.outcome.${g._id}`;
        const outcome = (str(ctx.answers, k) || defaultOutcome(g.grade ?? g.suggestedGrade)) as "achieved" | "carry" | "dropped";
        return (
          <div key={g._id} className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/goals/${g._id}`} className="min-w-0 truncate font-medium hover:underline">
                {g.title}
              </Link>
              <span className={cn("text-xl font-semibold tabular-nums", grade >= 0.7 ? "text-success" : "")}>{grade.toFixed(2)}</span>
            </div>
            {g.keyResults.map((kr, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate">{kr.title}</span>
                <span className="tabular-nums text-muted-foreground">
                  {kr.current}/{kr.target} {kr.unit}
                </span>
                <Bar value={kr.target ? (kr.current / kr.target) * 100 : 0} className="w-24" />
              </div>
            ))}
            <input
              key={`${g._id}-${g.grade}`}
              type="range"
              min={0}
              max={1}
              step={0.05}
              defaultValue={grade}
              onMouseUp={(e) => void update({ id: g._id, grade: Number((e.target as HTMLInputElement).value) })}
              onTouchEnd={(e) => void update({ id: g._id, grade: Number((e.target as HTMLInputElement).value) })}
              onKeyUp={(e) => void update({ id: g._id, grade: Number((e.target as HTMLInputElement).value) })}
              className="w-full accent-[var(--primary)]"
              aria-label={`Grade for ${g.title}`}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">
                {g.suggestedGrade !== null ? `Suggested from key results: ${g.suggestedGrade.toFixed(2)}` : "No key results — grade by judgement."}
              </span>
              <Segmented
                size="sm"
                value={outcome}
                onChange={(x) => void ctx.save(k, x)}
                options={[
                  { value: "achieved", label: "Achieved" },
                  { value: "carry", label: "Carry to backlog" },
                  { value: "dropped", label: "Drop" },
                ]}
              />
            </div>
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground">0.6–0.7 on a stretch goal counts as success. 1.0 every time means the goals were too easy.</p>
    </div>
  );
}

function QExecution({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"quarterly">;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <ExecRing score={pre.avgExecution} size={132} label="avg execution" sub={`${pre.weeksOver85} week${pre.weeksOver85 === 1 ? "" : "s"} at ≥85%`} />
        {pre.history.length > 0 ? <ExecBars points={pre.history} /> : <p className="text-sm text-muted-foreground">No execution history for this period.</p>}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Sub title="Key successes">
          <ListEditor items={arr(ctx.answers, "execution.successes")} onChange={(v) => void ctx.save("execution.successes", v)} placeholder="What worked…" />
        </Sub>
        <Sub title="Key mistakes & lessons">
          <ListEditor items={arr(ctx.answers, "execution.mistakes")} onChange={(v) => void ctx.save("execution.mistakes", v)} placeholder="What you'd do differently…" />
        </Sub>
      </div>
      <AiDraft ctx={ctx} focus="execution" />
    </div>
  );
}

function QScan({ ctx }: { ctx: StepCtx }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 p-3 text-sm">
        <span className="text-muted-foreground">Scan each life area on the Wheel of Life — which spoke needs the next goal?</span>
        <Link href="/compass" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Wheel of Life <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <Burnout ctx={ctx} prefix="burnout" />
      <AutoTextArea label="Notes" value={str(ctx.answers, "scan.note")} onSave={(v) => ctx.save("scan.note", v)} rows={2} placeholder="Energy, health, relationships, money…" />
    </div>
  );
}

function QPrune({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"quarterly">;
  const updateProject = useMutation(api.projects.update);
  const updateHabit = useMutation(api.habits.update);
  const archiveArea = useMutation(api.compass.archiveArea);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const mark = (id: string) => setDone((d) => ({ ...d, [id]: true }));
  const run = (id: string, p: Promise<unknown>) =>
    p.then(() => mark(id)).catch((e) => toast(errMsg(e), { tone: "warning" }));
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
        <Sub title={`Projects · ${pre.prune.projects.length}`}>
          {pre.prune.projects.map((p) => (
            <div key={p._id} className={cn("flex items-center gap-2 text-sm", done[p._id] && "opacity-40")}>
              <span className="min-w-0 flex-1 truncate">{p.title}</span>
              {!done[p._id] && (
                <button onClick={() => void run(p._id, updateProject({ id: p._id, status: "completed" }))} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7")}>
                  Close
                </button>
              )}
            </div>
          ))}
        </Sub>
        <Sub title={`Habits · ${pre.prune.habits.length}`}>
          {pre.prune.habits.map((h) => (
            <div key={h._id} className={cn("flex items-center gap-2 text-sm", done[h._id] && "opacity-40")}>
              <span className="min-w-0 flex-1 truncate">{h.title}</span>
              {!done[h._id] && (
                <button onClick={() => void run(h._id, updateHabit({ id: h._id, habitStatus: "archived" }))} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7")}>
                  Archive
                </button>
              )}
            </div>
          ))}
        </Sub>
        <Sub title={`Life areas · ${pre.prune.areas.length}`}>
          {pre.prune.areas.map((a) => (
            <div key={a._id} className={cn("flex items-center gap-2 text-sm", done[a._id] && "opacity-40")}>
              <span className="min-w-0 flex-1 truncate">{a.name}</span>
              {!done[a._id] && (
                <button
                  onClick={() => confirm(`Archive the area “${a.name}”? It disappears from the Wheel and pickers.`) && void run(a._id, archiveArea({ lifeAreaId: a._id, archived: true }))}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7")}
                >
                  Archive
                </button>
              )}
            </div>
          ))}
        </Sub>
      </div>
      <AutoTextArea label="What else to prune?" value={str(ctx.answers, "prune.note")} onSave={(v) => ctx.save("prune.note", v)} rows={2} placeholder="Tools, subscriptions, meetings, commitments…" />
    </div>
  );
}

function QNext({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"quarterly">;
  const close = useMutation(api.cycles.close);
  const [wizard, setWizard] = useState(false);
  const [busy, setBusy] = useState(false);
  const cycle = pre.cycle;
  const closed = !cycle || cycle.status === "done";
  const candidates: Candidate[] = pre.backlog.map((g) => ({
    _id: g._id,
    title: g.title,
    lifeAreaId: g.lifeAreaId,
    source: g.level === "annual" ? "annual" : "backlog",
    goalType: g.goalType,
    reasons: g.reasons,
    keyResults: g.keyResults,
  }));
  const doClose = async () => {
    if (!cycle) return;
    setBusy(true);
    try {
      await close({
        id: cycle._id,
        grades: pre.goals.map((g) => ({
          goalId: g._id,
          grade: g.grade ?? g.suggestedGrade ?? 0,
          outcome: (str(ctx.answers, `grade.outcome.${g._id}`) || defaultOutcome(g.grade ?? g.suggestedGrade)) as "achieved" | "carry" | "dropped",
        })),
      });
      reward(`${cycle.name} closed — well played`, undefined, true);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5">
      {cycle && !closed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
          <div>
            <p className="font-medium">Close “{cycle.name}”</p>
            <p className="text-xs text-muted-foreground">Saves each goal's grade and outcome. Carried goals move to the backlog.</p>
          </div>
          <button onClick={() => void doClose()} disabled={busy} className={buttonVariants()}>
            <Trophy className="h-4 w-4" /> {busy ? "Closing…" : "Close cycle"}
          </button>
        </div>
      )}
      {closed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-success-soft p-4">
          <div className="text-success">
            <p className="font-medium">{cycle ? `${cycle.name} is closed.` : "Ready for a fresh cycle."}</p>
            <p className="text-xs">Pick ≤3 goals with tactics. Give the riskiest one a WOOP on its goal page.</p>
          </div>
          <button onClick={() => setWizard(true)} className={buttonVariants()}>
            <Rocket className="h-4 w-4" /> Launch the next cycle
          </button>
        </div>
      )}
      <AutoTextArea label="Intentions for the next 12 weeks" value={str(ctx.answers, "next.intent")} onSave={(v) => ctx.save("next.intent", v)} rows={3} placeholder="Theme, what to protect, what to say no to…" />
      <CycleWizardMount open={wizard} onClose={() => setWizard(false)} today={ctx.today} candidates={candidates} />
    </div>
  );
}

function CycleWizardMount({ open, onClose, today, candidates }: { open: boolean; onClose: () => void; today: string; candidates: Candidate[] }) {
  const cockpit = useQuery(api.cycles.cockpit, { today });
  const max = cockpit?.maxActiveGoals ?? 3;
  const cur = cockpit?.cycle;
  const closePrevious = cur && (cur.state.phase === "buffer" || cur.state.phase === "ended") ? { _id: cur._id, name: cur.name } : null;
  return (
    <CycleWizard
      open={open}
      onClose={onClose}
      today={today}
      candidates={candidates}
      maxGoals={max}
      closePrevious={closePrevious}
      onLaunched={() => toast("Your new cycle is on the Goals page", { tone: "info" })}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ANNUAL
// ─────────────────────────────────────────────────────────────────────────

function APeaks({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"annual">;
  const compass = useQuery(api.compass.get);
  const update = useMutation(api.compass.update);
  const negatives = arr(ctx.answers, "peaks.negative");
  return (
    <div className="space-y-5">
      <Stats
        items={[
          { label: "Tasks done", value: pre.tasksDone },
          { label: "Focus hours", value: Math.round(pre.focusH) },
          { label: "Deals won", value: pre.dealsWon, tone: pre.dealsWon ? "success" : undefined },
          { label: "Published", value: pre.contentPublished },
        ]}
      />
      {pre.peaks.length > 0 && (
        <Sub title="Your momentum log — biggest moments">
          <ul className="space-y-1">
            {pre.peaks.map((m) => (
              <li key={m._id} className="flex items-center gap-2 text-sm">
                <span className="flex shrink-0">
                  {Array.from({ length: m.impact }, (_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current text-chart-3" />
                  ))}
                </span>
                <span className="truncate">{m.title}</span>
                {m.why && <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">— {m.why}</span>}
              </li>
            ))}
          </ul>
        </Sub>
      )}
      {pre.months.some((m) => m.avg !== null) && (
        <Sub title="Life-area average by month">
          <div className="flex h-14 items-end gap-1">
            {pre.months.map((m) => (
              <div
                key={m.period}
                title={`${fmtMonth(m.period)}: ${m.avg ?? "not rated"}`}
                className={cn("flex-1 rounded-t-[4px]", m.avg === null ? "h-1 bg-muted" : "bg-chart-1/70")}
                style={m.avg === null ? undefined : { height: `${(m.avg / 10) * 100}%` }}
              />
            ))}
          </div>
        </Sub>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <Sub title="Positive peaks — book more of these">
          <ListEditor items={arr(ctx.answers, "peaks.positive")} onChange={(v) => void ctx.save("peaks.positive", v)} placeholder="People, projects, trips that lit you up…" />
        </Sub>
        <Sub
          title="Negative peaks — avoid"
          action={
            negatives.length > 0 && compass ? (
              <button
                onClick={() =>
                  void update({ notToDo: [...compass.compass.notToDo, ...negatives.filter((n) => !compass.compass.notToDo.includes(n))] })
                    .then(() => toast("Added to your Not-To-Do list", { tone: "success" }))
                    .catch((e) => toast(errMsg(e), { tone: "warning" }))
                }
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <Plus className="h-3.5 w-3.5" /> Not-To-Do
              </button>
            ) : undefined
          }
        >
          <ListEditor items={negatives} onChange={(v) => void ctx.save("peaks.negative", v)} placeholder="What drained you…" />
        </Sub>
      </div>
      <AiDraft ctx={ctx} focus="peaks" />
    </div>
  );
}

function ALists({ ctx }: { ctx: StepCtx }) {
  const well = arr(ctx.answers, "lists.well");
  const badly = arr(ctx.answers, "lists.badly");
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Sub title={`Went well · ${well.length}/6–8`}>
          <ListEditor items={well} onChange={(v) => void ctx.save("lists.well", v)} numbered placeholder="Something that went well…" />
        </Sub>
        <Sub title={`Went badly · ${badly.length}/6–8`}>
          <ListEditor items={badly} onChange={(v) => void ctx.save("lists.badly", v)} numbered placeholder="Something that went badly…" />
        </Sub>
      </div>
      <AiDraft ctx={ctx} focus="lists" />
    </div>
  );
}

function AGoals({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"annual">;
  const create = useMutation(api.goals.createWithPlan);
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const p = pre.achievedPct;
  const verdict =
    p === null
      ? "No graded cycle goals this year yet."
      : p >= 95
        ? "Nearly everything achieved — your goals may have been too safe. Stretch a little."
        : p >= 70
          ? "Healthy: about 80% is the sweet spot between ambition and follow-through."
          : "Below 70% — aim for fewer goals, or smaller ones, next year.";
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const a = area || pre.areas[0]?._id;
    if (!title.trim() || !a) return;
    try {
      await create({ title: title.trim(), lifeAreaId: a as Id<"lifeAreas">, level: "annual" });
      setTitle("");
      toast("Annual goal added", { tone: "success" });
    } catch (err) {
      toast(errMsg(err), { tone: "warning" });
    }
  };
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <ExecRing score={p} size={120} label="achieved" sub={`${pre.goalsAchieved}/${pre.goalsDecided} graded goals`} />
        <div className="space-y-2">
          <p className="text-sm">{verdict}</p>
          {pre.cycles.length > 0 && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {pre.cycles.map((c) => (
                <li key={c._id}>
                  {c.name} · {c.goals} goals · avg grade {c.avgGrade ?? "—"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Sub title={`Annual goals · ${pre.annualGoals.length}/8`}>
        <div className="space-y-1">
          {pre.annualGoals.map((g) => {
            const a = pre.areas.find((x) => x._id === g.lifeAreaId);
            return (
              <Link key={g._id} href={`/goals/${g._id}`} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent">
                <AreaDot color={areaColor(a)} />
                <span className="truncate">{g.title}</span>
                {g.goalStatus === "achieved" && <Chip tone="success">achieved</Chip>}
              </Link>
            );
          })}
        </div>
        <form onSubmit={(e) => void add(e)} className="flex flex-col gap-2 sm:flex-row">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A measurable goal for next year…" className="flex-1" />
          <Select value={area} onChange={(e) => setArea(e.target.value)} className="sm:w-44" aria-label="Life area">
            {pre.areas.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </Select>
          <button className={buttonVariants({ variant: "secondary" })} disabled={!title.trim()}>
            Add
          </button>
        </form>
      </Sub>
    </div>
  );
}

function ATheme({ ctx }: { ctx: StepCtx }) {
  const compass = useQuery(api.compass.get);
  const update = useMutation(api.compass.update);
  const theme = str(ctx.answers, "theme.text");
  return (
    <div className="space-y-4">
      <AutoInput label="Theme for the year ahead" value={theme} onSave={(v) => ctx.save("theme.text", v)} placeholder="e.g. “Year of leverage”" />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!theme.trim()}
          onClick={() =>
            void update({ yearTheme: theme.trim() })
              .then(() => reward(`Year theme set · ${theme.trim()}`))
              .catch((e) => toast(errMsg(e), { tone: "warning" }))
          }
          className={buttonVariants({ size: "sm" })}
        >
          Save as year theme
        </button>
        {compass?.compass.yearTheme && <span className="text-xs text-muted-foreground">Current: “{compass.compass.yearTheme}”</span>}
      </div>
    </div>
  );
}

function AFreeDays({ ctx }: { ctx: StepCtx }) {
  const pre = ctx.pre as P<"annual">;
  const addFree = useMutation(api.periodicReviews.addFreeDays);
  // The year ahead of the reviewed year — also when reviewing last year in January.
  const nextYear = String(Number(pre.period.periodKey) + 1);
  const list = Array.isArray(ctx.answers["freedays.list"]) ? (ctx.answers["freedays.list"] as { date: string; label: string }[]) : [];
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Holidays, long weekends and Free Days go on the {nextYear} calendar first. Everything else fits around them.
      </p>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!date || list.some((x) => x.date === date)) return;
          void ctx.save("freedays.list", [...list, { date, label: label.trim() }].sort((a, b) => a.date.localeCompare(b.date)));
          setDate("");
          setLabel("");
        }}
      >
        <TextInput type="date" value={date} min={`${nextYear}-01-01`} onChange={(e) => setDate(e.target.value)} className="sm:w-44" aria-label="Date" />
        <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional) — e.g. Family trip" className="flex-1" />
        <button className={buttonVariants({ variant: "secondary" })} disabled={!date}>
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>
      {list.length > 0 && (
        <ul className="grid gap-1 sm:grid-cols-2">
          {list.map((x) => (
            <li key={x.date} className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1 text-sm">
              <span className="tabular-nums">{fmtYmd(x.date, { weekday: "short", month: "short", day: "numeric" })}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{x.label}</span>
              <button onClick={() => void ctx.save("freedays.list", list.filter((y) => y.date !== x.date))} aria-label="Remove" className="text-muted-foreground hover:text-danger">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        disabled={!list.length || busy}
        onClick={async () => {
          setBusy(true);
          try {
            let created = 0;
            const labels = [...new Set(list.map((x) => x.label))];
            for (const l of labels) created += await addFree({ dates: list.filter((x) => x.label === l).map((x) => x.date), label: l || undefined });
            reward(`${created} Free Day${created === 1 ? "" : "s"} protected on the calendar`, undefined, true);
          } catch (e) {
            toast(errMsg(e), { tone: "warning" });
          } finally {
            setBusy(false);
          }
        }}
        className={buttonVariants()}
      >
        <CalendarPlus className="h-4 w-4" /> Put {list.length || ""} on the calendar
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────

const REGISTRY: Record<ReviewKind, Record<string, (p: { ctx: StepCtx }) => React.ReactElement>> = {
  weekly: { celebrate: WCelebrate, score: WScore, reflect: WReflect, clear: WClear, current: WCurrent, scorecard: WScorecard, plan: WPlan, share: WShare },
  monthly: { rate: MRate, goals: MGoals, habits: MHabits, time: MTime, migrate: MMigrate, pulse: ({ ctx }) => <Burnout ctx={ctx} prefix="pulse" />, next: MNext },
  quarterly: { grade: QGrade, execution: QExecution, scan: QScan, prune: QPrune, next: QNext },
  annual: { peaks: APeaks, lists: ALists, goals: AGoals, theme: ATheme, freedays: AFreeDays },
};

export function StepBody({ step, ctx }: { step: string; ctx: StepCtx }) {
  const C = REGISTRY[ctx.kind][step];
  if (!C) return null;
  return <C ctx={ctx} />;
}

