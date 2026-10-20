"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Archive, ArchiveRestore, Landmark, Pencil, PiggyBank, Plus, Tags, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Dialog, EmptyHint, Field, InlineEdit, Ring, Section, Segmented, Select, TextInput, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { celebrate, errorMessage, toast } from "@/components/os/celebrate";
import { useStable } from "@/components/os/useCockpit";
import { diffDaysYmd, relDay, useToday } from "@/lib/day";
import { ScopeChip, ScopePick, StatTile } from "./bits";
import type { Meta } from "./QuickAdd";
import { ACCOUNT_KINDS, kindLabel, parseAmount, useMoney, type AccountKind, type Category, type Money, type Scope, type ScopeFilter } from "./lib";

type Account = Meta["accounts"][number];
type Goal = FunctionReturnType<typeof api.finance.goals>[number];

export function AccountsGoals({ meta, scope }: { meta: Meta; scope: ScopeFilter }) {
  const money = useMoney(meta.currency);
  const [acctDialog, setAcctDialog] = useState<{ account?: Account } | null>(null);
  const [goalDialog, setGoalDialog] = useState<{ goal?: Goal } | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const updateAccount = useMutation(api.finance.updateAccount);
  const removeAccount = useMutation(api.finance.removeAccount);
  const goals = useStable(useQuery(api.finance.goals, { scope }));

  const inView = meta.accounts.filter((a) => scope === "all" || a.scope === scope);
  const open = inView.filter((a) => !a.archived);
  const archived = inView.filter((a) => a.archived);
  const cash = open.filter((a) => a.liquid).reduce((s, a) => s + a.balance, 0);
  const netWorth = open.reduce((s, a) => s + a.balance, 0);
  const debt = open.filter((a) => a.balance < 0).reduce((s, a) => s + a.balance, 0);
  const defaultScope: Scope = scope === "business" ? "business" : "personal";

  async function archive(a: Account) {
    try {
      await updateAccount({ id: a._id, archived: !a.archived });
      toast(a.archived ? `${a.name} restored` : `${a.name} archived. History kept.`);
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    }
  }
  async function del(a: Account) {
    if (!confirm(`Delete the account “${a.name}”?`)) return;
    try {
      await removeAccount({ id: a._id });
      toast("Account deleted");
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label="Cash on hand" icon={Landmark} value={money.fmt(cash)} sub="Bank, cash, wallets, savings" />
        <StatTile label="Net worth" value={money.fmt(netWorth)} sub="All open accounts" tone={netWorth < 0 ? "warning" : undefined} />
        <StatTile label="Owed (cards, loans)" value={money.fmt(Math.abs(debt))} sub={debt < 0 ? "Negative balances" : "Nothing owed"} className="col-span-2 lg:col-span-1" />
      </div>

      <Section
        title="Accounts"
        icon={Landmark}
        hint="Balance = opening balance + income − expenses ± transfers."
        action={
          <button type="button" onClick={() => setAcctDialog({})} className={buttonVariants({ size: "sm" })}>
            <Plus className="h-3.5 w-3.5" /> Add account
          </button>
        }
      >
        {open.length === 0 ? (
          <EmptyHint icon={Landmark} title="No accounts in this view" hint="Add the places your money lives: bank accounts, cash, cards, wallets." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {open.map((a) => (
              <AccountCard key={a._id} a={a} money={money} showScope={scope === "all"} onEdit={() => setAcctDialog({ account: a })} onArchive={() => archive(a)} onDelete={() => del(a)} />
            ))}
          </ul>
        )}
        {archived.length > 0 && (
          <div className="mt-4">
            <button type="button" onClick={() => setShowArchived((s) => !s)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
              {showArchived ? "Hide" : "Show"} {archived.length} archived
            </button>
            {showArchived && (
              <ul className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {archived.map((a) => (
                  <AccountCard key={a._id} a={a} money={money} showScope={scope === "all"} onEdit={() => setAcctDialog({ account: a })} onArchive={() => archive(a)} onDelete={() => del(a)} />
                ))}
              </ul>
            )}
          </div>
        )}
      </Section>

      <Section
        title="Savings goals"
        icon={PiggyBank}
        hint="Track a target by a linked account's balance, or by what you've set aside."
        action={
          <button type="button" onClick={() => setGoalDialog({})} className={buttonVariants({ size: "sm" })}>
            <Plus className="h-3.5 w-3.5" /> Add goal
          </button>
        }
      >
        {!goals ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
          </div>
        ) : goals.length === 0 ? (
          <EmptyHint
            icon={PiggyBank}
            title="No savings goals yet"
            hint="Emergency fund (3–6 months of costs), 6 months of business runway, a new laptop. Name it, set a target, watch it fill."
            action={
              <button type="button" onClick={() => setGoalDialog({})} className={buttonVariants({ size: "sm" })}>
                <Plus className="h-3.5 w-3.5" /> Add a goal
              </button>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {goals.map((g) => (
              <GoalCard key={g._id} g={g} money={money} showScope={scope === "all"} onEdit={() => setGoalDialog({ goal: g })} />
            ))}
          </ul>
        )}
      </Section>

      <CategoriesSection categories={meta.categories} />

      <AccountDialog open={!!acctDialog} account={acctDialog?.account} defaultScope={defaultScope} money={money} onClose={() => setAcctDialog(null)} />
      <GoalDialog open={!!goalDialog} goal={goalDialog?.goal} meta={meta} defaultScope={defaultScope} money={money} onClose={() => setGoalDialog(null)} />
    </div>
  );
}

function AccountCard({
  a,
  money,
  showScope,
  onEdit,
  onArchive,
  onDelete,
}: {
  a: Account;
  money: Money;
  showScope: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <li className={cn("group flex flex-col rounded-lg border border-border bg-background/60 p-4", a.archived && "opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onEdit} className="min-w-0 text-left">
          <div className="truncate text-sm font-medium">{a.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
            {kindLabel(a.kind)}
            {showScope && <ScopeChip scope={a.scope} className="px-1.5 py-0 text-[10px]" />}
          </div>
        </button>
        <div className="flex shrink-0 items-center opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <button type="button" onClick={onEdit} aria-label="Edit" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onArchive} aria-label={a.archived ? "Restore" : "Archive"} title={a.archived ? "Restore" : "Archive"} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
            {a.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          </button>
          {a.txCount === 0 && (
            <button type="button" onClick={onDelete} aria-label="Delete" className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "hover:text-danger" })}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className={cn("mt-3 text-2xl font-semibold tracking-tight", a.balance < 0 && "text-warning")}>{money.fmt(a.balance)}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        Opening {money.fmt(a.openingBalance)} · {a.txCount} transaction{a.txCount === 1 ? "" : "s"}
      </div>
    </li>
  );
}

function GoalCard({ g, money, showScope, onEdit }: { g: Goal; money: Money; showScope: boolean; onEdit: () => void }) {
  const today = useToday();
  const update = useMutation(api.finance.updateGoal);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const monthsLeft = g.deadline ? Math.max(1, Math.ceil(diffDaysYmd(today, g.deadline) / 30.4)) : null;
  const perMonth = monthsLeft && g.left > 0 ? g.left / monthsLeft : null;

  async function contribute(e: FormEvent) {
    e.preventDefault();
    const n = parseAmount(draft);
    if (!Number.isFinite(n) || n === 0) return;
    try {
      const next = (g.saved ?? 0) + n;
      await update({ id: g._id, saved: next });
      setDraft("");
      setAdding(false);
      if (next >= g.target && g.current < g.target) {
        toast(`Goal reached: ${g.name}`, { tone: "success" });
        celebrate(1.2);
      } else toast(`${money.fmt(n)} added to ${g.name}`, { tone: "success" });
    } catch (err) {
      toast(errorMessage(err), { tone: "warning" });
    }
  }

  return (
    <li className="rounded-lg border border-border bg-background/60 p-4">
      <div className="flex items-start gap-3">
        <Ring value={g.pct} size={56} stroke={6} tone={g.pct >= 100 ? "success" : "primary"}>
          <span className="text-xs font-semibold">{g.pct}%</span>
        </Ring>
        <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{g.name}</span>
            {showScope && <ScopeChip scope={g.scope} className="px-1.5 py-0 text-[10px]" />}
          </div>
          <div className="mt-0.5 text-xs tabular-nums">
            {money.fmt(g.current)} <span className="text-muted-foreground">of {money.fmt(g.target)}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {g.pct >= 100 ? "Reached. Nice work." : `${money.fmt(g.left)} to go`}
            {g.deadline && ` · by ${relDay(g.deadline, today)}`}
            {perMonth != null && ` · ${money.fmt(Math.ceil(perMonth))}/mo`}
          </div>
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        {g.accountName ? (
          <span className="truncate">Tracks {g.accountName}</span>
        ) : adding ? (
          <form onSubmit={contribute} className="flex w-full items-center gap-1.5">
            <input
              autoFocus
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), setAdding(false))}
              placeholder="Amount (negative to withdraw)"
              aria-label="Add to goal"
              className={cn(inputClass, "h-7 min-w-0 flex-1 px-2 text-xs")}
            />
            <button type="submit" className={buttonVariants({ size: "sm", className: "h-7 px-2" })}>
              Add
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 px-2" })}>
            <Plus className="h-3 w-3" /> Add money
          </button>
        )}
      </div>
    </li>
  );
}

function AccountDialog({ open, account, defaultScope, money, onClose }: { open: boolean; account?: Account; defaultScope: Scope; money: Money; onClose: () => void }) {
  const create = useMutation(api.finance.createAccount);
  const update = useMutation(api.finance.updateAccount);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<AccountKind>("bank");
  const [scope, setScope] = useState<Scope>(defaultScope);
  const [opening, setOpening] = useState("0");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? "");
    setKind(account?.kind ?? "bank");
    setScope(account?.scope ?? defaultScope);
    setOpening(account ? String(account.openingBalance) : "0");
    // Keyed on the id: `meta` (and so `account`) re-renders after every
    // transaction, which must not wipe what you're typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, account?._id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const raw = opening.trim();
    const neg = raw.startsWith("-");
    const n = raw === "" ? 0 : parseAmount(neg ? raw.slice(1) : raw) * (neg ? -1 : 1);
    if (!name.trim()) return toast("Name the account", { tone: "warning" });
    if (!Number.isFinite(n)) return toast("Enter a valid opening balance", { tone: "warning" });
    setBusy(true);
    try {
      if (account) {
        await update({ id: account._id, name, kind, scope, openingBalance: n });
        toast("Account saved", { tone: "success" });
      } else {
        await create({ name, kind, scope, openingBalance: n });
        toast(`${name.trim()} added`, { tone: "success" });
      }
      onClose();
    } catch (err) {
      toast(errorMessage(err), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={account ? "Edit account" : "Add an account"} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name">
          <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Meezan Business, Cash wallet, Visa" />
        </Field>
        <Field label="Type">
          <Select value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}>
            {ACCOUNT_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="For">
          <ScopePick value={scope} onChange={setScope} />
        </Field>
        <Field
          label={`Opening balance (${money.currency})`}
          hint={kind === "card" || kind === "loan" ? "What you owe today, as a negative number (e.g. -1200)." : "What's in it today, before anything you log here."}
        >
          <TextInput inputMode="decimal" value={opening} onChange={(e) => setOpening(e.target.value)} className="tabular-nums" />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={buttonVariants({ size: "sm" })}>
            {account ? "Save" : "Add account"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function GoalDialog({ open, goal, meta, defaultScope, money, onClose }: { open: boolean; goal?: Goal; meta: Meta; defaultScope: Scope; money: Money; onClose: () => void }) {
  const create = useMutation(api.finance.createGoal);
  const update = useMutation(api.finance.updateGoal);
  const remove = useMutation(api.finance.removeGoal);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [scope, setScope] = useState<Scope>(defaultScope);
  const [mode, setMode] = useState<"manual" | "account">("manual");
  const [accountId, setAccountId] = useState("");
  const [saved, setSaved] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(goal?.name ?? "");
    setTarget(goal ? String(goal.target) : "");
    setScope(goal?.scope ?? defaultScope);
    setMode(goal?.accountId ? "account" : "manual");
    setAccountId(goal?.accountId ?? "");
    setSaved(goal?.saved != null ? String(goal.saved) : "0");
    setDeadline(goal?.deadline ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, goal?._id]);

  // Keep the goal's own account selectable even if it was archived since.
  const accounts = meta.accounts.filter((a) => (!a.archived && a.scope === scope) || a._id === accountId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const t = parseAmount(target);
    const s = saved.trim() === "" ? 0 : parseAmount(saved);
    if (!name.trim()) return toast("Name the goal", { tone: "warning" });
    if (!Number.isFinite(t) || t <= 0) return toast("Set a target above zero", { tone: "warning" });
    if (mode === "account" && !accountId) return toast("Pick the account to track", { tone: "warning" });
    if (mode === "manual" && !Number.isFinite(s)) return toast("Enter a valid saved amount", { tone: "warning" });
    setBusy(true);
    try {
      if (goal) {
        await update({
          id: goal._id,
          name,
          target: t,
          scope,
          accountId: mode === "account" ? (accountId as Id<"finAccounts">) : null,
          ...(mode === "manual" ? { saved: s } : {}),
          deadline: deadline || null,
        });
        toast("Goal saved", { tone: "success" });
      } else {
        await create({
          name,
          target: t,
          scope,
          accountId: mode === "account" ? (accountId as Id<"finAccounts">) : undefined,
          saved: mode === "manual" ? s : undefined,
          deadline: deadline || undefined,
        });
        toast(`Goal added · ${money.fmt(t)}`, { tone: "success" });
      }
      onClose();
    } catch (err) {
      toast(errorMessage(err), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!goal || !confirm(`Delete the goal “${goal.name}”?`)) return;
    try {
      await remove({ id: goal._id });
      toast("Goal deleted");
      onClose();
    } catch (err) {
      toast(errorMessage(err), { tone: "warning" });
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={goal ? "Edit goal" : "Add a savings goal"} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name">
          <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency fund" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Target (${money.currency})`}>
            <TextInput inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0" className="tabular-nums" />
          </Field>
          <Field label="By (optional)">
            <TextInput type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
        </div>
        <Field label="For">
          <ScopePick
            value={scope}
            onChange={(s) => {
              setScope(s);
              setAccountId("");
            }}
          />
        </Field>
        <Field label="Track progress by">
          <Segmented
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: "manual", label: "What I set aside" },
              { value: "account", label: "An account's balance" },
            ]}
          />
        </Field>
        {mode === "account" ? (
          <Field label="Account">
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Pick an account…</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} · {money.fmt(a.balance)}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label={`Saved so far (${money.currency})`}>
            <TextInput inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value)} className="tabular-nums" />
          </Field>
        )}
        <div className="flex items-center justify-between gap-2 pt-1">
          {goal ? (
            <button type="button" onClick={del} className={buttonVariants({ variant: "ghost", size: "sm", className: "text-muted-foreground hover:text-danger" })}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={buttonVariants({ size: "sm" })}>
              {goal ? "Save" : "Add goal"}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

function CategoriesSection({ categories }: { categories: Category[] }) {
  const create = useMutation(api.finance.createCategory);
  const update = useMutation(api.finance.updateCategory);
  const [showArchived, setShowArchived] = useState(false);

  const save = async (id: Id<"finCategories">, patch: { name?: string; scope?: "personal" | "business" | "both"; archived?: boolean }) => {
    try {
      await update({ id, ...patch });
      if (patch.archived !== undefined) toast(patch.archived ? "Category archived. Past transactions keep it." : "Category restored");
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    }
  };

  const column = (type: "expense" | "income") => {
    const list = categories.filter((c) => c.type === type && (showArchived || !c.archived));
    return (
      <div className="min-w-0">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{type === "expense" ? "Spending" : "Income"}</h3>
        <ul className="space-y-0.5">
          {list.map((c) => (
            <li key={c._id} className={cn("group flex items-center gap-2", c.archived && "opacity-60")}>
              <div className="min-w-0 flex-1">
                <InlineEdit value={c.name} onSave={(v) => v.trim() && save(c._id, { name: v })} className="text-sm" />
              </div>
              <select
                value={c.scope}
                onChange={(e) => save(c._id, { scope: e.target.value as "personal" | "business" | "both" })}
                aria-label={`${c.name} scope`}
                className="h-7 rounded-md border border-transparent bg-transparent px-1 text-[11px] text-muted-foreground hover:border-border focus:border-ring focus:outline-none"
              >
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="both">Both</option>
              </select>
              <button
                type="button"
                onClick={() => save(c._id, { archived: !c.archived })}
                aria-label={c.archived ? "Restore" : "Archive"}
                title={c.archived ? "Restore" : "Archive"}
                className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "size-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100" })}
              >
                {c.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
              </button>
            </li>
          ))}
        </ul>
        <AddCategory type={type} onAdd={(name, scope) => create({ name, type, scope })} />
      </div>
    );
  };

  const archivedCount = categories.filter((c) => c.archived).length;
  return (
    <Section
      title="Categories"
      icon={Tags}
      hint="Rename, re-scope or archive. Archived ones stay on old transactions."
      action={
        archivedCount > 0 ? (
          <button type="button" onClick={() => setShowArchived((s) => !s)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            {showArchived ? "Hide archived" : `Show archived (${archivedCount})`}
          </button>
        ) : undefined
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        {column("expense")}
        {column("income")}
      </div>
    </Section>
  );
}

function AddCategory({ type, onAdd }: { type: "expense" | "income"; onAdd: (name: string, scope: "personal" | "business" | "both") => Promise<unknown> }) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"personal" | "business" | "both">("both");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await onAdd(name.trim(), scope);
      setName("");
      toast("Category added", { tone: "success" });
    } catch (err) {
      toast(errorMessage(err), { tone: "warning" });
    }
  }
  return (
    <form onSubmit={submit} className="mt-2 flex items-center gap-1.5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={type === "expense" ? "Add spending category…" : "Add income category…"}
        aria-label={`New ${type} category`}
        className={cn(inputClass, "h-8 min-w-0 flex-1 text-sm")}
      />
      <select
        value={scope}
        onChange={(e) => setScope(e.target.value as typeof scope)}
        aria-label="Scope"
        className={cn(inputClass, "h-8 w-auto px-2 text-xs")}
      >
        <option value="both">Both</option>
        <option value="personal">Personal</option>
        <option value="business">Business</option>
      </select>
      <button type="submit" disabled={!name.trim()} aria-label="Add category" className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

