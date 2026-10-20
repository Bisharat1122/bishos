"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { CalendarClock, Pause, Pencil, Play, Plus, Repeat, SkipForward, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Chip, Dialog, EmptyHint, Field, Section, Segmented, Select, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { errorMessage, reward, toast } from "@/components/os/celebrate";
import { useStable } from "@/components/os/useCockpit";
import { addDaysYmd, fmtYmd, useToday } from "@/lib/day";
import { ScopeChip, ScopePick, StatTile } from "./bits";
import type { Meta } from "./QuickAdd";
import { CADENCES, RECURRING_KINDS, cadencePer, categoriesFor, parseAmount, recurringKindLabel, useMoney, whenLabel, type Cadence, type Money, type Scope, type ScopeFilter } from "./lib";

type Item = FunctionReturnType<typeof api.finance.recurring>["rows"][number];

export function Recurring({ meta, scope }: { meta: Meta; scope: ScopeFilter }) {
  const today = useToday();
  const money = useMoney(meta.currency);
  const data = useStable(useQuery(api.finance.recurring, { today, scope }));
  const pay = useMutation(api.finance.markRecurringPaid);
  const skip = useMutation(api.finance.skipRecurring);
  const update = useMutation(api.finance.updateRecurring);
  const remove = useMutation(api.finance.removeRecurring);
  const [dialog, setDialog] = useState<{ item?: Item } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function markPaid(r: Item) {
    if (busy) return;
    setBusy(r._id);
    try {
      const res = await pay({ id: r._id, date: today });
      reward(`${r.type === "income" ? "Received" : "Paid"} ${r.name} · next due ${whenLabel(res.nextDue, today)}`, res.xp || undefined);
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    } finally {
      setBusy(null);
    }
  }
  async function skipIt(r: Item) {
    if (busy) return; // a double tap must not skip two cycles
    setBusy(r._id);
    try {
      const res = await skip({ id: r._id });
      toast(`Skipped. Next due ${whenLabel(res.nextDue, today)}`);
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    } finally {
      setBusy(null);
    }
  }
  async function toggle(r: Item) {
    try {
      await update({ id: r._id, active: !r.active });
      toast(r.active ? `${r.name} paused` : `${r.name} resumed`);
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    }
  }
  async function del(r: Item) {
    if (!confirm(`Delete “${r.name}”? Past payments stay in your transactions.`)) return;
    try {
      await remove({ id: r._id });
      toast("Deleted");
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    }
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
        <div className="skeleton h-72" />
      </div>
    );
  }

  const dueNow = data.rows.filter((r) => r.status === "overdue" || r.status === "due");
  const rest = data.rows.filter((r) => !(r.status === "overdue" || r.status === "due"));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Subscriptions / month" icon={Repeat} value={money.fmt(data.subscriptionsMonthly)} sub={`${money.fmt(data.subscriptionsMonthly * 12)} a year`} />
        <StatTile label="All recurring costs / month" icon={CalendarClock} value={money.fmt(data.expensesMonthly)} sub="Bills, payroll, subscriptions" />
        <StatTile label="Recurring income / month" value={money.fmt(data.incomeMonthly)} tone={data.incomeMonthly > 0 ? "success" : undefined} sub="Retainers and salaries" />
        <StatTile label="Due now" value={data.dueCount} tone={data.dueCount > 0 ? "warning" : undefined} sub={data.dueCount ? "Overdue or due in 3 days" : "You're all caught up"} />
      </div>

      {dueNow.length > 0 && (
        <Section title="Due now" icon={CalendarClock} className="border-warning/40" hint="Mark paid to log it and roll the date forward.">
          <ul className="grid gap-2 md:grid-cols-2">
            {dueNow.map((r) => (
              <li key={r._id} className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3">
                <button type="button" onClick={() => setDialog({ item: r })} className="min-w-0 flex-1 text-left" aria-label={`Edit ${r.name}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{r.name}</span>
                    {r.type === "income" && (
                      <Chip tone="success" className="px-1.5 py-0 text-[10px]">
                        Income
                      </Chip>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {r.status === "overdue" ? (
                      <span className="font-medium text-warning">{-r.days === 1 ? "1 day late" : `${-r.days} days late`}</span>
                    ) : (
                      <span>Due {whenLabel(r.nextDue, today)}</span>
                    )}{" "}
                    · {money.fmt(r.amount)}
                  </div>
                </button>
                <button type="button" onClick={() => toggle(r)} aria-label="Pause" title="Pause (stop reminders)" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
                  <Pause className="h-3.5 w-3.5" />
                </button>
                <button type="button" disabled={busy === r._id} onClick={() => skipIt(r)} aria-label="Skip this time" title="Skip this time" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
                <button type="button" disabled={busy === r._id} onClick={() => markPaid(r)} className={buttonVariants({ size: "sm" })}>
                  {r.type === "income" ? "Received" : "Mark paid"}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        title="Subscriptions, bills & retainers"
        icon={Repeat}
        action={
          <button type="button" onClick={() => setDialog({})} className={buttonVariants({ size: "sm" })}>
            <Plus className="h-3.5 w-3.5" /> Add recurring
          </button>
        }
      >
        {data.rows.length === 0 ? (
          <EmptyHint
            icon={Repeat}
            title="No recurring money yet"
            hint="Add rent, SaaS tools, payroll or a client retainer once. You'll see what's due, the true monthly cost, and log each payment in one tap."
            action={
              <button type="button" onClick={() => setDialog({})} className={buttonVariants({ size: "sm" })}>
                <Plus className="h-3.5 w-3.5" /> Add the first one
              </button>
            }
          />
        ) : rest.length === 0 ? (
          <p className="text-sm text-muted-foreground">Everything here is due now (above).</p>
        ) : (
          <ul className="divide-y divide-border">
            {rest.map((r) => (
              <RecurringLine
                key={r._id}
                r={r}
                money={money}
                today={today}
                busy={busy === r._id}
                showScope={scope === "all"}
                onPay={() => markPaid(r)}
                onSkip={() => skipIt(r)}
                onEdit={() => setDialog({ item: r })}
                onToggle={() => toggle(r)}
                onDelete={() => del(r)}
              />
            ))}
          </ul>
        )}
      </Section>

      <RecurringDialog open={!!dialog} item={dialog?.item} meta={meta} defaultScope={scope === "business" ? "business" : "personal"} onClose={() => setDialog(null)} />
    </div>
  );
}

function RecurringLine({
  r,
  money,
  today,
  busy,
  showScope,
  onPay,
  onSkip,
  onEdit,
  onToggle,
  onDelete,
}: {
  r: Item;
  money: Money;
  today: string;
  busy: boolean;
  showScope: boolean;
  onPay: () => void;
  onSkip: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li className={cn("group flex flex-wrap items-center gap-x-3 gap-y-2 py-3", !r.active && "opacity-60")}>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium">{r.name}</span>
          <Chip tone={r.type === "income" ? "success" : "muted"} className="px-1.5 py-0 text-[10px]">
            {recurringKindLabel(r.kind)}
          </Chip>
          {showScope && <ScopeChip scope={r.scope} className="px-1.5 py-0 text-[10px]" />}
          {!r.active && (
            <Chip tone="outline" className="px-1.5 py-0 text-[10px]">
              Paused
            </Chip>
          )}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {r.active ? <>Due {whenLabel(r.nextDue, today)}{r.days >= 2 && r.days < 7 ? ` · ${fmtYmd(r.nextDue, { weekday: "short", month: "short", day: "numeric" })}` : ""}</> : "Not running"}
          {r.categoryName && ` · ${r.categoryName}`}
          {r.accountName && ` · ${r.accountName}`}
          {r.companyName && ` · ${r.companyName}`}
        </div>
      </button>
      <div className="text-right">
        <div className={cn("text-sm font-semibold tabular-nums", r.type === "income" && "text-success")}>
          {r.type === "income" ? "+" : ""}
          {money.fmt(r.amount)}
          <span className="text-xs font-normal text-muted-foreground">/{cadencePer(r.cadence)}</span>
        </div>
        {r.cadence !== "monthly" && <div className="text-[11px] tabular-nums text-muted-foreground">≈ {money.fmt(r.monthly)}/mo</div>}
      </div>
      <div className="flex items-center gap-0.5">
        {r.active && (
          <button type="button" disabled={busy} onClick={onPay} className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 px-2" })}>
            {r.type === "income" ? "Received" : "Paid"}
          </button>
        )}
        {r.active && (
          <button type="button" disabled={busy} onClick={onSkip} aria-label="Skip this time" title="Skip this time" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        )}
        <button type="button" onClick={onToggle} aria-label={r.active ? "Pause" : "Resume"} title={r.active ? "Pause" : "Resume"} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
          {r.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={onEdit} aria-label="Edit" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onDelete} aria-label="Delete" className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "hover:text-danger" })}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

export function RecurringDialog({
  open,
  item,
  meta,
  defaultScope,
  onClose,
}: {
  open: boolean;
  item?: Item;
  meta: Meta;
  defaultScope: Scope;
  onClose: () => void;
}) {
  const today = useToday();
  const money = useMoney(meta.currency);
  const create = useMutation(api.finance.createRecurring);
  const update = useMutation(api.finance.updateRecurring);
  const links = useQuery(api.finance.linkOptions, {});

  const [type, setType] = useState<"expense" | "income">("expense");
  const [name, setName] = useState("");
  const [kind, setKind] = useState("subscription");
  const [amount, setAmount] = useState("");
  const [cadence, setCadence] = useState<Cadence>("monthly");
  const [nextDue, setNextDue] = useState(today);
  const [scope, setScope] = useState<Scope>(defaultScope);
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(item?.type ?? "expense");
    setName(item?.name ?? "");
    setKind(item?.kind ?? "subscription");
    setAmount(item ? String(item.amount) : "");
    setCadence(item?.cadence ?? "monthly");
    setNextDue(item?.nextDue ?? addDaysYmd(today, 0));
    setScope(item?.scope ?? defaultScope);
    setAccountId(item?.accountId ?? "");
    setCategoryId(item?.categoryId ?? "");
    setCompanyId(item?.companyId ?? "");
    setNote(item?.note ?? "");
    // Reset only when the dialog opens or switches item — not every time the
    // recurring list re-renders (that would wipe what you're typing).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?._id]);

  const cats = categoriesFor(meta.categories, type, scope);
  const accounts = meta.accounts.filter((a) => !a.archived || a._id === item?.accountId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = parseAmount(amount);
    if (!name.trim()) return toast("Give it a name", { tone: "warning" });
    if (!Number.isFinite(n) || n <= 0) return toast("Enter an amount above zero", { tone: "warning" });
    setBusy(true);
    try {
      if (item) {
        await update({
          id: item._id,
          name,
          type,
          kind,
          amount: n,
          cadence,
          nextDue,
          scope,
          accountId: (accountId || null) as Id<"finAccounts"> | null,
          categoryId: (categoryId && cats.some((c) => c._id === categoryId) ? categoryId : null) as Id<"finCategories"> | null,
          companyId: (companyId || null) as Id<"companies"> | null,
          note: note.trim() || null,
        });
        toast("Saved", { tone: "success" });
      } else {
        await create({
          name,
          type,
          kind,
          amount: n,
          cadence,
          nextDue,
          scope,
          accountId: accountId ? (accountId as Id<"finAccounts">) : undefined,
          categoryId: categoryId && cats.some((c) => c._id === categoryId) ? (categoryId as Id<"finCategories">) : undefined,
          companyId: companyId ? (companyId as Id<"companies">) : undefined,
          note: note.trim() || undefined,
        });
        toast(`${name.trim()} added · ${money.fmt(n)}/${cadencePer(cadence)}`, { tone: "success" });
      }
      onClose();
    } catch (err) {
      toast(errorMessage(err, "Could not save"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={item ? "Edit recurring" : "Add a subscription, bill or retainer"}>
      <form onSubmit={submit} className="space-y-4">
        <Segmented
          value={type}
          onChange={(t) => {
            setType(t);
            setKind(t === "income" ? "retainer" : "subscription");
            setCategoryId("");
          }}
          options={[
            { value: "expense", label: "Money out" },
            { value: "income", label: "Money in" },
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Field label="Name">
            <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={type === "income" ? "e.g. Acme monthly retainer" : "e.g. Figma, office rent"} />
          </Field>
          <Field label="Kind">
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              {RECURRING_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label={`Amount (${money.currency})`}>
            <TextInput inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="tabular-nums" />
          </Field>
          <Field label="Every">
            <Select value={cadence} onChange={(e) => setCadence(e.target.value as Cadence)}>
              {CADENCES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Next due" className="col-span-2 sm:col-span-1">
            <TextInput type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
          </Field>
        </div>
        <Field label="For">
          <ScopePick
            value={scope}
            onChange={(s) => {
              setScope(s);
              setCategoryId("");
            }}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Account (optional)" hint="Used when you mark it paid.">
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Default {scope} account</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Uncategorised</option>
              {cats.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={type === "income" ? "Client (optional)" : "Vendor company (optional)"}>
            <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)} disabled={links === undefined}>
              <option value="">None</option>
              {(links?.companies ?? []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Note (optional)">
            <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Plan, login hint, renewal terms…" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={buttonVariants({ size: "sm" })}>
            {item ? "Save" : "Add"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
