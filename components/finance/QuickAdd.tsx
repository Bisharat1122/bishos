"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CornerDownLeft, Link2, Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Dialog, Field, Segmented, Select, TextInput, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { errorMessage, reward, toast } from "@/components/os/celebrate";
import { relDay, useToday } from "@/lib/day";
import { ScopePick } from "./bits";
import { categoriesFor, guessCategory, parseAmount, parseQuick, useMoney, type Scope, type TxType } from "./lib";

export type Meta = FunctionReturnType<typeof api.finance.meta>;
export type TxRow = FunctionReturnType<typeof api.finance.transactions>["rows"][number];

const TYPE_OPTIONS: { value: TxType; label: string; icon: typeof ArrowUpRight }[] = [
  { value: "expense", label: "Expense", icon: ArrowUpRight },
  { value: "income", label: "Income", icon: ArrowDownLeft },
  { value: "transfer", label: "Transfer", icon: ArrowLeftRight },
];

type LinkValue = "" | `deal:${string}` | `company:${string}` | `project:${string}`;

function linkOf(tx?: TxRow | null): LinkValue {
  if (!tx) return "";
  if (tx.dealId) return `deal:${tx.dealId}`;
  if (tx.projectId) return `project:${tx.projectId}`;
  if (tx.companyId) return `company:${tx.companyId}`;
  return "";
}

/** Full transaction form (create or edit). Keyboard: amount is focused, Enter saves. */
export function TransactionForm({
  meta,
  initial,
  defaultScope = "personal",
  defaultType = "expense",
  onDone,
  compact,
}: {
  meta: Meta;
  initial?: TxRow | null;
  defaultScope?: Scope;
  defaultType?: TxType;
  onDone: () => void;
  compact?: boolean;
}) {
  const today = useToday();
  const money = useMoney(meta.currency);
  const add = useMutation(api.finance.addTransaction);
  const update = useMutation(api.finance.updateTransaction);
  const openAccounts = meta.accounts.filter((a) => !a.archived || a._id === initial?.accountId || a._id === initial?.toAccountId);

  const [type, setType] = useState<TxType>(initial?.type ?? defaultType);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.date ?? today);
  const [scope, setScopeState] = useState<Scope>(initial?.scope ?? defaultScope);
  const [accountId, setAccountId] = useState<string>(initial?.accountId ?? meta.defaults[defaultScope] ?? openAccounts[0]?._id ?? "");
  const [toAccountId, setToAccountId] = useState<string>(initial?.toAccountId ?? "");
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? "");
  const [payee, setPayee] = useState(initial?.payee ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [link, setLink] = useState<LinkValue>(linkOf(initial));
  const [showLink, setShowLink] = useState(!!linkOf(initial));
  const [keepOpen, setKeepOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const categoryTouched = useRef(!!initial?.categoryId);

  const links = useQuery(api.finance.linkOptions, showLink ? {} : "skip");
  // Keep the transaction's own category selectable when editing (even if archived / other scope).
  const cats = useMemo(() => {
    const list = categoriesFor(meta.categories, type, scope);
    const own = initial?.categoryId ? meta.categories.find((c) => c._id === initial.categoryId && c.type === type) : undefined;
    return own && !list.some((c) => c._id === own._id) ? [...list, own] : list;
  }, [meta.categories, type, scope, initial?.categoryId]);

  // Keep the category valid for the type + scope.
  useEffect(() => {
    if (categoryId && !cats.some((c) => c._id === categoryId)) setCategoryId("");
  }, [cats, categoryId]);

  const setScope = (s: Scope) => {
    setScopeState(s);
    const acct = meta.accounts.find((a) => a._id === accountId);
    if (!initial && acct && acct.scope !== s && meta.defaults[s]) setAccountId(meta.defaults[s]!);
  };
  const pickAccount = (id: string) => {
    setAccountId(id);
    const acct = meta.accounts.find((a) => a._id === id);
    if (acct && type !== "transfer") setScopeState(acct.scope);
  };
  const onPayeeBlur = () => {
    if (type === "transfer" || categoryTouched.current || categoryId) return;
    const g = guessCategory(payee, type, scope, meta.categories, meta.payees);
    if (g.categoryId) setCategoryId(g.categoryId);
  };

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const n = parseAmount(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast("Enter an amount above zero", { tone: "warning" });
      amountRef.current?.focus();
      return;
    }
    if (!accountId) return toast("Pick an account", { tone: "warning" });
    if (type === "transfer" && (!toAccountId || toAccountId === accountId)) return toast("Pick a different account to move money to", { tone: "warning" });
    const [kind, linkId] = link ? (link.split(":") as [string, string]) : ["", ""];
    let dealId: Id<"deals"> | undefined;
    let companyId: Id<"companies"> | undefined;
    let projectId: Id<"projects"> | undefined;
    if (kind === "deal") {
      dealId = linkId as Id<"deals">;
      const d = links?.deals.find((x) => x._id === linkId);
      companyId = (d?.companyId ?? initial?.companyId ?? undefined) as Id<"companies"> | undefined;
    } else if (kind === "project") projectId = linkId as Id<"projects">;
    else if (kind === "company") companyId = linkId as Id<"companies">;
    setBusy(true);
    try {
      if (initial) {
        // The picker shows one link; an invoice payment can carry deal + company
        // + project. Leave links alone unless the picker was actually changed.
        const linkChanged = link !== linkOf(initial);
        await update({
          id: initial._id,
          type,
          amount: n,
          date,
          accountId: accountId as Id<"finAccounts">,
          toAccountId: type === "transfer" ? (toAccountId as Id<"finAccounts">) : null,
          categoryId: type === "transfer" ? null : ((categoryId || null) as Id<"finCategories"> | null),
          scope,
          payee: payee.trim() || null,
          note: note.trim() || null,
          ...(linkChanged ? { dealId: dealId ?? null, companyId: companyId ?? null, projectId: projectId ?? null } : {}),
        });
        toast("Transaction updated", { tone: "success" });
        onDone();
      } else {
        const res = await add({
          type,
          amount: n,
          date,
          accountId: accountId as Id<"finAccounts">,
          toAccountId: type === "transfer" ? (toAccountId as Id<"finAccounts">) : undefined,
          categoryId: type !== "transfer" && categoryId ? (categoryId as Id<"finCategories">) : undefined,
          scope,
          payee: payee.trim() || undefined,
          note: note.trim() || undefined,
          dealId,
          companyId,
          projectId,
        });
        const what = type === "income" ? "Income" : type === "expense" ? "Expense" : "Transfer";
        reward(`${what} logged · ${money.fmt(n)}`, res.xp || undefined);
        if (keepOpen) {
          setAmount("");
          setPayee("");
          setNote("");
          categoryTouched.current = false;
          setCategoryId("");
          amountRef.current?.focus();
        } else onDone();
      }
    } catch (err) {
      toast(errorMessage(err, "Could not save"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  const payeeList = meta.payees.filter((p) => type === "transfer" || p.type === type);
  const accountOptions = (exclude?: string) =>
    openAccounts
      .filter((a) => a._id !== exclude)
      .map((a) => (
        <option key={a._id} value={a._id}>
          {a.name} · {a.scope === "business" ? "Business" : "Personal"}
          {a.archived ? " (archived)" : ""}
        </option>
      ));

  return (
    <form onSubmit={submit} className={cn("space-y-4", compact && "space-y-3")}>
      <Segmented value={type} onChange={setType} options={TYPE_OPTIONS} className="w-full sm:w-auto" />

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Field label={`Amount (${money.currency})`}>
          <input
            ref={amountRef}
            autoFocus={!compact}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            aria-label="Amount"
            className={cn(inputClass, "h-11 w-full text-lg font-semibold tabular-nums")}
          />
        </Field>
        <Field label="Date">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
        </Field>
      </div>

      {type === "transfer" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="From">
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accountOptions()}
            </Select>
          </Field>
          <Field label="To" hint="Business → personal counts as an owner draw in scoped views.">
            <Select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
              <option value="">Pick an account…</option>
              {accountOptions(accountId)}
            </Select>
          </Field>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={type === "income" ? "Into account" : "Paid from"}>
              <Select value={accountId} onChange={(e) => pickAccount(e.target.value)}>
                {accountOptions()}
              </Select>
            </Field>
            <Field label="Category">
              <Select
                value={categoryId}
                onChange={(e) => {
                  categoryTouched.current = true;
                  setCategoryId(e.target.value);
                }}
              >
                <option value="">Uncategorised</option>
                {cats.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
            <Field label="For">
              <ScopePick value={scope} onChange={setScope} />
            </Field>
            <Field label={type === "income" ? "From (payer)" : "Payee"}>
              <TextInput
                list="fin-payees"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                onBlur={onPayeeBlur}
                placeholder={type === "income" ? "e.g. Acme Inc." : "e.g. Figma, landlord, grocery store"}
              />
              <datalist id="fin-payees">
                {payeeList.map((p) => (
                  <option key={p.name} value={p.name} />
                ))}
              </datalist>
            </Field>
          </div>
        </>
      )}

      <Field label="Note (optional)">
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything to remember" />
      </Field>

      {showLink ? (
        <Field label="Linked to" hint="Ties this money to your pipeline, a client or a project.">
          <Select value={link} onChange={(e) => setLink(e.target.value as LinkValue)} disabled={links === undefined}>
            <option value="">{links === undefined ? "Loading…" : "Nothing"}</option>
            {links && links.deals.length > 0 && (
              <optgroup label="Deals">
                {links.deals.map((d) => (
                  <option key={d._id} value={`deal:${d._id}`}>
                    {d.title}
                    {d.stage === "won" ? " · won" : ""}
                  </option>
                ))}
              </optgroup>
            )}
            {links && links.companies.length > 0 && (
              <optgroup label="Companies">
                {links.companies.map((c) => (
                  <option key={c._id} value={`company:${c._id}`}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            )}
            {links && links.projects.length > 0 && (
              <optgroup label="Projects">
                {links.projects.map((p) => (
                  <option key={p._id} value={`project:${p._id}`}>
                    {p.title}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        </Field>
      ) : (
        <button type="button" onClick={() => setShowLink(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <Link2 className="h-3.5 w-3.5" /> Link to a deal, company or project
        </button>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {!initial ? (
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={keepOpen} onChange={(e) => setKeepOpen(e.target.checked)} className="size-3.5 accent-[var(--primary)]" />
            Add another after this
          </label>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button type="button" onClick={onDone} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={buttonVariants({ size: "sm" })}>
            {initial ? "Save" : `Add ${type}`}
            <CornerDownLeft className="h-3.5 w-3.5 opacity-60" aria-hidden />
          </button>
        </div>
      </div>
    </form>
  );
}

/** Dialog wrapper around the transaction form. */
export function TransactionDialog({
  open,
  onClose,
  meta,
  initial,
  defaultScope,
  defaultType,
}: {
  open: boolean;
  onClose: () => void;
  meta: Meta | undefined;
  initial?: TxRow | null;
  defaultScope?: Scope;
  defaultType?: TxType;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={initial ? "Edit transaction" : "Log money in or out"}>
      {meta ? (
        <TransactionForm key={initial?._id ?? "new"} meta={meta} initial={initial} defaultScope={defaultScope} defaultType={defaultType} onDone={onClose} />
      ) : (
        <div className="skeleton h-64" />
      )}
    </Dialog>
  );
}

/**
 * One-line quick add: type "45 groceries" or "1.2k Figma", press Enter.
 * The category and account are guessed from your history; tweak before saving.
 */
export function InlineQuickAdd({ meta, defaultScope = "personal", className }: { meta: Meta; defaultScope?: Scope; className?: string }) {
  const today = useToday();
  const money = useMoney(meta.currency);
  const add = useMutation(api.finance.addTransaction);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [text, setText] = useState("");
  const [scope, setScope] = useState<Scope>(defaultScope);
  const [categoryId, setCategoryId] = useState<string>("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setScope(defaultScope), [defaultScope]);

  const parsed = parseQuick(text);
  const guess = useMemo(() => guessCategory(parsed.text, type, scope, meta.categories, meta.payees), [parsed.text, type, scope, meta.categories, meta.payees]);
  const effScope = !touched && guess.scope ? guess.scope : scope;
  const cats = categoriesFor(meta.categories, type, effScope);
  const effCategory = touched ? categoryId : (guess.categoryId ?? "");
  const accountId = (guess.accountId && meta.accounts.some((a) => a._id === guess.accountId && !a.archived) ? guess.accountId : null) ?? meta.defaults[effScope];
  const account = meta.accounts.find((a) => a._id === accountId);
  const catName = meta.categories.find((c) => c._id === effCategory)?.name;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (parsed.amount == null || parsed.amount <= 0) {
      toast("Start with an amount, like “45 groceries”", { tone: "warning" });
      return;
    }
    if (!accountId) return toast(`Add a ${effScope} account first`, { tone: "warning" });
    setBusy(true);
    try {
      const res = await add({
        type,
        amount: parsed.amount,
        date: today,
        accountId,
        categoryId: effCategory ? (effCategory as Id<"finCategories">) : undefined,
        scope: effScope,
        payee: parsed.text || undefined,
      });
      reward(`${type === "income" ? "Income" : "Expense"} logged · ${money.fmt(parsed.amount)}`, res.xp || undefined);
      setText("");
      setTouched(false);
      setCategoryId("");
      inputRef.current?.focus();
    } catch (err) {
      toast(errorMessage(err, "Could not save"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={cn("rounded-xl border border-border bg-card p-3 shadow-card", className)}>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <Segmented
          size="sm"
          value={type}
          onChange={(t) => {
            setType(t);
            setTouched(false);
          }}
          options={[
            { value: "expense", label: "Out" },
            { value: "income", label: "In" },
          ]}
        />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={type === "income" ? "1200 client payment" : "45 groceries · 1.2k Figma"}
          aria-label="Quick add: amount and what it was for"
          className={cn(inputClass, "h-9 min-w-0 flex-1")}
        />
        <div className="flex min-w-0 flex-wrap gap-2">
          <Select
            value={effCategory}
            onChange={(e) => {
              setTouched(true);
              setScope(effScope);
              setCategoryId(e.target.value);
            }}
            aria-label="Category"
            className="min-w-[9rem] flex-1 lg:w-44 lg:flex-none"
          >
            <option value="">Uncategorised</option>
            {cats.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
          <ScopePick
            value={effScope}
            onChange={(s) => {
              setTouched(true);
              // Keep the category only if it fits the new scope.
              setCategoryId(categoriesFor(meta.categories, type, s).some((c) => c._id === effCategory) ? effCategory : "");
              setScope(s);
            }}
          />
          <button type="submit" disabled={busy} className={buttonVariants({ size: "sm", className: "h-9" })} aria-label="Add">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
      <p className="mt-2 truncate px-1 text-xs text-muted-foreground" aria-live="polite">
        {parsed.amount ? (
          <>
            <span className={cn("font-medium", type === "income" ? "text-success" : "text-foreground")}>
              {type === "income" ? "+" : "−"}
              {money.fmt(parsed.amount)}
            </span>
            {parsed.text && <> · {parsed.text}</>} · {catName ?? "Uncategorised"} · {account?.name ?? "no account"} · {relDay(today, today)}
            <span className="hidden sm:inline"> · Enter to add</span>
          </>
        ) : (
          "Type an amount and what it was for. We guess the category from your history."
        )}
      </p>
    </form>
  );
}
