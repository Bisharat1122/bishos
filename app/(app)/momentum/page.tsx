"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Trophy, Star, Flame, PenLine, Handshake, Clapperboard, HeartHandshake, Target, CalendarCheck, Gift, Trash2, Plus,
  BookOpenText, ArrowUpRight, Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageShell, Section, Segmented, Metric, Dialog, EmptyHint, Field, TextInput, TextArea, Select, cn, buttonVariants } from "@/components/os/kit";
import { reward, toast, errorMessage } from "@/components/os/celebrate";
import { useStable } from "@/components/os/useCockpit";
import { useTz } from "@/components/direction/util";
import { fmtYmd, relDay, useToday } from "@/lib/day";

type Data = FunctionReturnType<typeof api.momentum.wins>;
type Win = Data["items"][number];
type Source = Win["source"];

const SOURCE: Record<Source, { label: string; icon: LucideIcon; group: Filter }> = {
  logged: { label: "Logged", icon: Star, group: "logged" },
  progress: { label: "Progress line", icon: PenLine, group: "day" },
  journal: { label: "Journal win", icon: BookOpenText, group: "day" },
  top3: { label: "Top 3 done", icon: Target, group: "plan" },
  big3: { label: "Weekly Big 3", icon: CalendarCheck, group: "plan" },
  deal: { label: "Deal won", icon: Handshake, group: "business" },
  content: { label: "Published", icon: Clapperboard, group: "business" },
  promise: { label: "Promise kept", icon: HeartHandshake, group: "business" },
  offer: { label: "Offer live", icon: Gift, group: "business" },
};

type Filter = "all" | "logged" | "day" | "plan" | "business";
const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
] as const;

/**
 * Wins — the progress principle (Amabile): progress is the strongest
 * motivator, so make it visible. One feed merges what you log by hand with
 * the wins the system already knows: progress lines and journal wins, Top 3
 * and Big 3 done, deals won, content published, promises kept.
 */
export default function WinsPage() {
  const today = useToday();
  const tz = useTz();
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const [filter, setFilter] = useState<Filter>("all");
  const [logOpen, setLogOpen] = useState(false);
  const data = useStable(useQuery(api.momentum.wins, { today, tz, rangeDays: Number(range) }));
  const removeEntry = useMutation(api.momentum.remove);

  const items = useMemo(() => (data?.items ?? []).filter((w) => filter === "all" || SOURCE[w.source].group === filter), [data, filter]);
  const byDay = useMemo(() => {
    const m = new Map<string, Win[]>();
    for (const w of items) {
      if (!m.has(w.date)) m.set(w.date, []);
      m.get(w.date)!.push(w);
    }
    return [...m.entries()];
  }, [items]);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, logged: 0, day: 0, plan: 0, business: 0 };
    for (const w of data?.items ?? []) {
      c.all++;
      c[SOURCE[w.source].group]++;
    }
    return c;
  }, [data]);

  return (
    <PageShell
      title="Wins"
      icon={Trophy}
      subtitle="Progress you made — the fuel for tomorrow. Automatic wins from your day, plus the moments you log."
      actions={
        <>
          <Link href={`/journal/${today}`} className={buttonVariants({ variant: "outline" })}>
            <BookOpenText /> <span className="hidden sm:inline">Today’s journal</span>
          </Link>
          <button onClick={() => setLogOpen(true)} className={buttonVariants()}>
            <Plus /> Log a win
          </button>
        </>
      }
    >
      {/* Numbers */}
      <Section>
        {data === undefined ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-12" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric
              label="Wins this week"
              value={data.weekCount}
              sub={data.lastWeekCount ? `${data.lastWeekCount} last week` : "Mon – today"}
              tone={data.weekCount > 0 ? "success" : undefined}
            />
            <Metric
              label="Win streak"
              value={
                <span className="inline-flex items-center gap-1">
                  {data.streak}
                  {data.streak > 0 && <Flame className="h-5 w-5 text-warning" />}
                </span>
              }
              sub={data.todayCount ? "days in a row · today counted" : data.streak ? "days — log one today to keep it" : "days with at least one win"}
            />
            <Metric label="Best streak" value={data.bestStreak} sub="last 12 months" />
            <Metric label="Win days this week" value={`${data.winDaysThisWeek}`} sub="days with progress" />
          </div>
        )}
      </Section>

      {/* 12-week heat strip */}
      <Section className="mt-4" title="Last 12 weeks" icon={Sparkles} hint="Each square is a day; darker = more wins.">
        {data === undefined ? (
          <div className="skeleton h-24" />
        ) : (
          <HeatStrip heat={data.heat} today={today} />
        )}
      </Section>

      {/* Feed */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Segmented
          options={[
            { value: "all" as Filter, label: "All", count: counts.all },
            { value: "logged" as Filter, label: "Logged", count: counts.logged },
            { value: "day" as Filter, label: "Day wins", count: counts.day },
            { value: "plan" as Filter, label: "Top 3 · Big 3", count: counts.plan },
            { value: "business" as Filter, label: "Business", count: counts.business },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <Segmented className="ml-auto" size="sm" options={RANGES.map((r) => ({ value: r.value, label: r.label }))} value={range} onChange={setRange} />
      </div>

      <div className="mt-4 space-y-4">
        {data === undefined ? (
          <>
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
          </>
        ) : byDay.length === 0 ? (
          <EmptyHint
            icon={Trophy}
            title={filter === "all" ? "No wins in this range yet" : "Nothing here in this range"}
            hint="Finish a Top 3 task, write a progress line at shutdown, or log a win — small progress counts."
            action={
              <button onClick={() => setLogOpen(true)} className={buttonVariants({ size: "sm" })}>
                <Plus /> Log a win
              </button>
            }
          />
        ) : (
          byDay.map(([date, wins]) => (
            <section key={date} className="rounded-xl border border-border bg-card shadow-card">
              <div className="flex items-center justify-between gap-2 px-4 pt-3">
                <h2 className="text-sm font-semibold">
                  {relDay(date, today)} <span className="font-normal text-muted-foreground">· {fmtYmd(date)}</span>
                </h2>
                <Link href={`/journal/${date}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  Open day <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <ul className="p-2">
                {wins.map((w) => (
                  <WinRow key={w.id} w={w} onRemove={
                    w.momentumId
                      ? () =>
                          void removeEntry({ id: w.momentumId as Id<"momentum"> })
                            .then(() => toast("Removed"))
                            .catch((e) => toast(errorMessage(e), { tone: "warning" }))
                      : undefined
                  } />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <LogWinDialog open={logOpen} onClose={() => setLogOpen(false)} />
    </PageShell>
  );
}

function WinRow({ w, onRemove }: { w: Win; onRemove?: () => void }) {
  const meta = SOURCE[w.source];
  const Icon = meta.icon;
  const body = (
    <>
      <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg", w.source === "logged" ? "bg-warning-soft text-warning" : w.source === "deal" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground")}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{w.title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
          <span>{meta.label}</span>
          {w.impact != null && (
            <span className="inline-flex items-center gap-0.5" aria-label={`Impact ${w.impact} of 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={cn("size-1.5 rounded-full", n <= (w.impact ?? 0) ? "bg-foreground" : "bg-muted")} />
              ))}
            </span>
          )}
          {w.sub && <span className="truncate">{w.sub}</span>}
        </span>
      </span>
    </>
  );
  return (
    <li className="group flex items-start gap-1 rounded-lg hover:bg-accent/40">
      {w.href ? (
        <Link href={w.href} className="flex min-w-0 flex-1 items-start gap-3 px-2 py-2">
          {body}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-start gap-3 px-2 py-2">{body}</div>
      )}
      {onRemove && (
        <button onClick={onRemove} aria-label="Remove win" className="m-2 shrink-0 rounded p-1 text-muted-foreground transition hover:text-danger sm:opacity-0 sm:group-hover:opacity-100">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

/** 12 columns (weeks) × 7 rows (Mon–Sun), oldest left. */
function HeatStrip({ heat, today }: { heat: Data["heat"]; today: string }) {
  // Pad the front so columns align to Monday.
  const first = heat[0]?.date;
  const pad = first ? (new Date(`${first}T00:00:00`).getDay() + 6) % 7 : 0;
  const cells: (Data["heat"][number] | null)[] = [...Array.from({ length: pad }, () => null), ...heat];
  const cols: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7));
  const level = (n: number) => (n === 0 ? 0 : n === 1 ? 0.35 : n <= 3 ? 0.65 : 1);
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="flex gap-1">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, ri) => {
              const c = col[ri];
              if (!c) return <span key={ri} className="size-3.5 sm:size-4" />;
              return (
                <Link
                  key={ri}
                  href={`/journal/${c.date}`}
                  title={`${fmtYmd(c.date)} — ${c.count} win${c.count === 1 ? "" : "s"}`}
                  className={cn("relative size-3.5 overflow-hidden rounded-[3px] bg-muted sm:size-4", c.date === today && "ring-1 ring-foreground")}
                >
                  {c.count > 0 && <span className="absolute inset-0 bg-success" style={{ opacity: level(c.count) }} />}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        Less
        {[0, 0.35, 0.65, 1].map((o) => (
          <span key={o} className="relative size-3 overflow-hidden rounded-[3px] bg-muted">
            {o > 0 && <span className="absolute inset-0 bg-success" style={{ opacity: o }} />}
          </span>
        ))}
        More
      </div>
    </div>
  );
}

/** Free-text win (optionally tied to a Life Area). */
function LogWinDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const add = useMutation(api.momentum.add);
  const areas = useQuery(api.lifeAreas.list);
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [impact, setImpact] = useState(3);
  const [areaId, setAreaId] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await add({
        type: "win",
        itemId: `win-${Date.now()}`,
        titleSnapshot: title.trim(),
        why: why.trim() || undefined,
        impact,
        lifeAreaId: areaId ? (areaId as Id<"lifeAreas">) : undefined,
      });
      reward("Win logged", undefined, impact >= 4);
      setTitle("");
      setWhy("");
      setImpact(3);
      onClose();
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onClose={onClose} title="Log a win" size="sm">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What went well? e.g. Closed the Acme proposal" />
        <Field label="Impact">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setImpact(n)}
                aria-pressed={n <= impact}
                className={cn(
                  "size-8 rounded-full border text-xs font-semibold transition",
                  n <= impact ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-ring",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Life area (optional)">
          <Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">—</option>
            {(areas ?? [])
              .filter((a) => !a.archived)
              .sort((a, b) => a.order - b.order)
              .map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
          </Select>
        </Field>
        <TextArea value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Why did it matter? (optional)" className="min-h-[64px]" />
        <button disabled={!title.trim() || busy} className={cn(buttonVariants(), "w-full")}>
          {busy ? "Saving…" : "Save win"}
        </button>
      </form>
    </Dialog>
  );
}
