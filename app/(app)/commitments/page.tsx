"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { HandCoins, Hourglass, Plus, Wand2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyHint, Metric, PageShell, Ring, Section, Segmented, TextInput, buttonVariants, cn, toneForPct } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { addDaysYmd, fmtYmd, useToday } from "@/lib/day";
import { CommitmentDialog, CommitmentList, type CommitmentItem } from "@/components/sales/Commitments";
import { PersonPicker } from "@/components/sales/PersonPicker";
import { NoSubmit } from "@/components/sales/fields";
import { RouteConversationDialog } from "@/components/sales/RouteConversationDialog";
import { errMsg, type Direction } from "@/components/sales/meta";

type View = "open" | "due" | "closed";

function groupOpen(items: CommitmentItem[], today: string) {
  const week = addDaysYmd(today, 7);
  const g = { overdue: [] as CommitmentItem[], today: [] as CommitmentItem[], check: [] as CommitmentItem[], week: [] as CommitmentItem[], later: [] as CommitmentItem[], none: [] as CommitmentItem[] };
  for (const c of items) {
    const d = c.promisedDate;
    if (d && d < today) g.overdue.push(c);
    else if (d === today) g.today.push(c);
    else if (c.direction === "owed_to_me" && c.checkDate && c.checkDate <= today) g.check.push(c);
    else if (d && d <= week) g.week.push(c);
    else if (d) g.later.push(c);
    else g.none.push(c);
  }
  return g;
}

function Group({ label, items, today, tone }: { label: string; items: CommitmentItem[]; today: string; tone?: "warning" | "info" }) {
  if (!items.length) return null;
  return (
    <div>
      <p className={cn("mb-1 text-[11px] font-semibold uppercase tracking-wide", tone === "warning" ? "text-warning" : tone === "info" ? "text-info" : "text-muted-foreground")}>
        {label} <span className="tabular-nums">· {items.length}</span>
      </p>
      <CommitmentList items={items} today={today} />
    </div>
  );
}

function Column({ title, hint, icon: Icon, items, today, view, empty }: { title: string; hint: string; icon: typeof HandCoins; items: CommitmentItem[]; today: string; view: View; empty: string }) {
  const g = useMemo(() => groupOpen(items, today), [items, today]);
  return (
    <Section title={title} icon={Icon} hint={hint} action={<span className="rounded bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{items.length}</span>}>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{empty}</p>
      ) : view === "closed" ? (
        <CommitmentList items={items} today={today} />
      ) : (
        <div className="space-y-4">
          <Group label="Overdue" items={g.overdue} today={today} tone="warning" />
          <Group label="Today" items={g.today} today={today} tone="info" />
          <Group label="Check in today" items={g.check} today={today} tone="info" />
          {view === "open" && (
            <>
              <Group label="Next 7 days" items={g.week} today={today} />
              <Group label="Later" items={g.later} today={today} />
              <Group label="No date" items={g.none} today={today} />
            </>
          )}
        </div>
      )}
    </Section>
  );
}

export default function CommitmentsPage() {
  const today = useToday();
  const all = useQuery(api.commitments.list, {});
  const stats = useQuery(api.commitments.stats, { today });
  const create = useMutation(api.commitments.create);
  const [view, setView] = useState<View>("open");
  const [dialog, setDialog] = useState(false);
  const [routing, setRouting] = useState(false);

  // quick add
  const [dir, setDir] = useState<Direction>("i_owe");
  const [title, setTitle] = useState("");
  const [personId, setPersonId] = useState<Id<"people"> | null>(null);
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  const quickAdd = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await create({ title, direction: dir, personId: personId ?? undefined, promisedDate: date || addDaysYmd(today, 1) });
      toast(dir === "i_owe" ? "Promise logged" : "Added to Waiting for", { tone: "success" });
      setTitle("");
      setDate("");
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const rows = useMemo(() => {
    const list = all ?? [];
    if (view === "closed") return list.filter((c) => c.status !== "open").sort((a, b) => (b.doneAt ?? b.createdAt) - (a.doneAt ?? a.createdAt));
    const open = list.filter((c) => c.status === "open");
    if (view === "due")
      return open.filter((c) => (c.promisedDate && c.promisedDate <= today) || (c.direction === "owed_to_me" && c.checkDate && c.checkDate <= today));
    return open;
  }, [all, view, today]);

  const iOwe = rows.filter((c) => c.direction === "i_owe");
  const owed = rows.filter((c) => c.direction === "owed_to_me");
  const rate = stats?.rate ?? null;

  return (
    <PageShell
      title="Commitments"
      icon={HandCoins}
      subtitle="Promises are the currency of trust. Keep them, or renegotiate early."
      actions={
        <>
          <button onClick={() => setRouting(true)} className={buttonVariants({ variant: "outline" })}>
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">Route a conversation</span>
            <span className="sm:hidden">Route</span>
          </button>
          <button onClick={() => setDialog(true)} className={buttonVariants()}>
            <Plus className="h-4 w-4" /> New
          </button>
        </>
      }
      headerExtra={
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-[minmax(260px,1.3fr)_repeat(3,minmax(0,1fr))]">
          {stats === undefined ? (
            <>
              <div className="skeleton col-span-2 h-24 lg:col-span-1" />
              <div className="skeleton h-24" />
              <div className="skeleton h-24" />
              <div className="skeleton h-24" />
            </>
          ) : (
            <>
              <div className="col-span-2 flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card lg:col-span-1">
                <Ring value={rate ?? 0} size={72} stroke={7} tone={rate === null ? "primary" : toneForPct(rate)}>
                  <span className="text-sm font-semibold tabular-nums">{rate === null ? "—" : `${rate}%`}</span>
                </Ring>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Promise-keeping · 4 weeks</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.due ? `${stats.kept} of ${stats.due} "I owe" kept on time` : "Nothing came due yet. Make a promise, keep it."}
                  </p>
                  <div className="mt-2 flex items-end gap-1" aria-label="Weekly rate">
                    {stats.weeks.map((w) => (
                      <div key={w.weekStart} className="flex flex-1 flex-col items-center gap-0.5" title={`Week of ${fmtYmd(w.weekStart, { month: "short", day: "numeric" })}: ${w.rate === null ? "nothing due" : `${w.rate}%`}`}>
                        <div className="flex h-6 w-full items-end overflow-hidden rounded-sm bg-muted">
                          <div className={cn("w-full rounded-sm", w.rate === null ? "" : w.rate >= 85 ? "bg-success" : w.rate >= 60 ? "bg-primary" : "bg-warning")} style={{ height: `${w.rate ?? 0}%` }} />
                        </div>
                        <span className="text-[9px] tabular-nums text-muted-foreground">{fmtYmd(w.weekStart, { day: "numeric", month: "numeric" })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <Metric label="I owe · open" value={stats.iOweOpen} tone={stats.overdueIOwe ? "warning" : undefined} sub={stats.overdueIOwe ? `${stats.overdueIOwe} overdue` : "None overdue"} />
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <Metric label="Owed to me" value={stats.owedOpen} sub={stats.checksDue ? `${stats.checksDue} to check on` : "Nothing to chase"} tone={stats.checksDue ? "info" : undefined} />
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <Metric label="Due today" value={stats.dueToday} tone={stats.dueToday ? "info" : "success"} sub={`${stats.keptAllTime} kept all-time`} />
              </div>
            </>
          )}
        </div>
      }
    >
      {/* quick add */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void quickAdd();
        }}
        className="mb-4 flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-card md:flex-row md:items-center"
      >
        <NoSubmit>
          <Segmented
            size="sm"
            value={dir}
            onChange={setDir}
            options={[
              { value: "i_owe", label: "I owe" },
              { value: "owed_to_me", label: "Owed to me" },
            ]}
          />
        </NoSubmit>
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder={dir === "i_owe" ? "I promised to… (send the deck)" : "They'll… (send the signed SOW)"} className="md:flex-1" />
        <div className="md:w-56">
          <PersonPicker value={personId} onChange={(id) => setPersonId(id)} placeholder="Person" />
        </div>
        <div className="flex gap-2">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="md:w-40" aria-label="Date" title="Defaults to tomorrow" />
          <button type="submit" disabled={busy || !title.trim()} className={buttonVariants()}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </form>

      <Segmented
        size="sm"
        className="mb-4"
        value={view}
        onChange={setView}
        options={[
          { value: "open", label: "All open" },
          { value: "due", label: "Due & overdue" },
          { value: "closed", label: "History" },
        ]}
      />

      {all === undefined ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      ) : all.length === 0 ? (
        <EmptyHint
          icon={HandCoins}
          title="No commitments yet"
          hint={'Log every "I\'ll send it Friday" and every "they\'ll get back to me". Keep promises on time for XP, and see your promise-keeping rate.'}
          action={
            <button onClick={() => setDialog(true)} className={buttonVariants()}>
              <Plus className="h-4 w-4" /> Log a promise
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Column
            title="I owe"
            hint="What I promised others"
            icon={HandCoins}
            items={iOwe}
            today={today}
            view={view}
            empty={view === "due" ? "Nothing due. You're square." : view === "closed" ? "No history yet." : "No open promises."}
          />
          <Column
            title="Owed to me"
            hint='"Waiting for": what others promised me'
            icon={Hourglass}
            items={owed}
            today={today}
            view={view}
            empty={view === "due" ? "Nothing to chase today." : view === "closed" ? "No history yet." : "Nobody owes you anything right now."}
          />
        </div>
      )}

      <CommitmentDialog open={dialog} onClose={() => setDialog(false)} defaults={{ direction: dir }} />
      <RouteConversationDialog open={routing} onClose={() => setRouting(false)} />
    </PageShell>
  );
}
