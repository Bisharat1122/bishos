"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Download, Link2, Pencil, Plus, Repeat, Receipt, Search, Trash2, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Chip, EmptyHint, Segmented, Select, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { errorMessage, toast } from "@/components/os/celebrate";
import { useStable } from "@/components/os/useCockpit";
import { fmtYmd, relDay, useToday } from "@/lib/day";
import { MonthPicker, ScopeChip, SignedAmount } from "./bits";
import { TransactionForm, type Meta, type TxRow } from "./QuickAdd";
import { downloadCsv, fmtMonth, useMoney, whenLabel, type ScopeFilter, type TxType } from "./lib";

export function Transactions({
  meta,
  scope,
  month,
  onMonth,
  curMonth,
  initialCategory,
  onAdd,
}: {
  meta: Meta;
  scope: ScopeFilter;
  month: string;
  onMonth: (m: string) => void;
  curMonth: string;
  initialCategory?: Id<"finCategories">;
  onAdd: () => void;
}) {
  const today = useToday();
  const money = useMoney(meta.currency);
  const remove = useMutation(api.finance.removeTransaction);
  const [allTime, setAllTime] = useState(false);
  const [type, setType] = useState<"all" | TxType>("all");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState<string>(initialCategory ?? "");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory) setCategoryId(initialCategory);
  }, [initialCategory]);
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const data = useStable(
    useQuery(api.finance.transactions, {
      month: allTime ? "all" : month,
      scope,
      type: type === "all" ? undefined : type,
      accountId: accountId ? (accountId as Id<"finAccounts">) : undefined,
      categoryId: categoryId ? (categoryId as Id<"finCategories">) : undefined,
      search: q || undefined,
    }),
  );

  const groups = useMemo(() => {
    const out: { date: string; rows: TxRow[]; net: number }[] = [];
    for (const r of data?.rows ?? []) {
      let g = out[out.length - 1];
      if (!g || g.date !== r.date) {
        g = { date: r.date, rows: [], net: 0 };
        out.push(g);
      }
      g.rows.push(r);
      g.net += r.type === "income" ? r.amount : r.type === "expense" ? -r.amount : 0;
    }
    return out;
  }, [data?.rows]);

  const filtersOn = type !== "all" || !!accountId || !!categoryId || !!q;
  const clearFilters = () => {
    setType("all");
    setAccountId("");
    setCategoryId("");
    setSearch("");
  };

  function exportCsv() {
    if (!data?.rows.length) return toast("Nothing to export in this view", { tone: "info" });
    const header = ["Date", "Type", "Amount", "Signed amount", "Currency", "Account", "To account", "Category", "Scope", "Payee", "Note", "Deal", "Company", "Project"];
    const rows = data.rows.map((r) => [
      r.date,
      r.type,
      r.amount,
      r.type === "expense" ? -r.amount : r.type === "income" ? r.amount : 0,
      meta.currency,
      r.accountName,
      r.toAccountName ?? "",
      r.categoryName ?? "",
      r.scope,
      r.payee ?? "",
      r.note ?? "",
      r.dealName ?? "",
      r.companyName ?? "",
      r.projectName ?? "",
    ]);
    downloadCsv(`finance-${allTime ? "all" : month}${scope !== "all" ? `-${scope}` : ""}.csv`, [header, ...rows]);
    toast(`Exported ${rows.length} transactions`, { tone: "success" });
  }

  async function del(r: TxRow) {
    if (!confirm(`Delete this ${r.type} of ${money.fmt(r.amount)}${r.payee ? ` (${r.payee})` : ""}?`)) return;
    try {
      const res = await remove({ id: r._id });
      toast(
        res.reopenedInvoice
          ? "Deleted. The invoice is unpaid again."
          : res.recurring
            ? `Deleted. ${res.recurring.name} is due ${whenLabel(res.recurring.nextDue, today)} again.`
            : "Transaction deleted",
      );
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    }
  }

  const cats = meta.categories.filter((c) => !c.archived && (type === "all" || type === c.type));

  return (
    <div className="space-y-4">
      {/* Filters: one row above the list */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-card">
        {allTime ? (
          <button type="button" onClick={() => setAllTime(false)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            All time <X className="h-3 w-3" />
          </button>
        ) : (
          <MonthPicker value={month} onChange={onMonth} current={curMonth} />
        )}
        {!allTime && (
          <button type="button" onClick={() => setAllTime(true)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            All time
          </button>
        )}
        <Segmented
          size="sm"
          value={type}
          onChange={(t) => {
            setType(t);
            setCategoryId("");
          }}
          options={[
            { value: "all", label: "All" },
            { value: "income", label: "In" },
            { value: "expense", label: "Out" },
            { value: "transfer", label: "Transfers" },
          ]}
        />
        <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-8 w-auto min-w-[8rem] flex-1 text-xs sm:flex-none" aria-label="Account">
          <option value="">All accounts</option>
          {meta.accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
              {a.archived ? " (archived)" : ""}
            </option>
          ))}
        </Select>
        {type !== "transfer" && (
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-8 w-auto min-w-[8rem] flex-1 text-xs sm:flex-none" aria-label="Category">
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
                {type === "all" ? (c.type === "income" ? " · in" : " · out") : ""}
              </option>
            ))}
          </Select>
        )}
        <div className="relative min-w-[10rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payee, note, amount…"
            aria-label="Search transactions"
            className={cn(inputClass, "h-8 w-full pl-8 text-xs")}
          />
        </div>
        {filtersOn && (
          <button type="button" onClick={clearFilters} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={exportCsv} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button type="button" onClick={onAdd} className={buttonVariants({ size: "sm" })}>
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      {!data ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-14" />
          ))}
        </div>
      ) : data.rows.length === 0 ? (
        <EmptyHint
          icon={Receipt}
          title={filtersOn ? "No transactions match these filters" : `Nothing logged ${allTime ? "yet" : `in ${fmtMonth(month)}`}`}
          hint={filtersOn ? "Try clearing a filter or searching for something else." : "Log what comes in and goes out. Ten seconds each, and the dashboard does the rest."}
          action={
            filtersOn ? (
              <button type="button" onClick={clearFilters} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Clear filters
              </button>
            ) : (
              <button type="button" onClick={onAdd} className={buttonVariants({ size: "sm" })}>
                <Plus className="h-3.5 w-3.5" /> Log a transaction
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
            <span>
              {data.total} transaction{data.total === 1 ? "" : "s"}
              {data.total > data.rows.length ? ` (showing ${data.rows.length})` : ""}
            </span>
            <span>
              In <span className="font-medium text-success tabular-nums">+{money.fmt(data.income)}</span>
            </span>
            <span>
              Out <span className="font-medium text-foreground tabular-nums">−{money.fmt(data.expense)}</span>
            </span>
            <span>
              Net{" "}
              <span className={cn("font-medium tabular-nums", data.net >= 0 ? "text-foreground" : "text-warning")}>
                {data.net >= 0 ? "+" : "−"}
                {money.fmt(Math.abs(data.net))}
              </span>
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            {groups.map((g) => (
              <Fragment key={g.date}>
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-1.5 text-xs">
                  <span className="font-medium">
                    {relDay(g.date, today)}
                    <span className="ml-1.5 font-normal text-muted-foreground">{fmtYmd(g.date, { weekday: "short", month: "short", day: "numeric", year: g.date.slice(0, 4) !== today.slice(0, 4) ? "numeric" : undefined })}</span>
                  </span>
                  {g.net !== 0 && (
                    <span className="tabular-nums text-muted-foreground">
                      {g.net > 0 ? "+" : "−"}
                      {money.fmt(Math.abs(g.net))}
                    </span>
                  )}
                </div>
                <ul className="divide-y divide-border border-b border-border last:border-b-0">
                  {g.rows.map((r) => (
                    <li key={r._id}>
                      {editing === r._id ? (
                        <div className="bg-muted/30 p-4">
                          <TransactionForm meta={meta} initial={r} onDone={() => setEditing(null)} compact />
                        </div>
                      ) : (
                        <TxLine r={r} money={money} onEdit={() => setEditing(r._id)} onDelete={() => del(r)} />
                      )}
                    </li>
                  ))}
                </ul>
              </Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TxLine({ r, money, onEdit, onDelete }: { r: TxRow; money: ReturnType<typeof useMoney>; onEdit: () => void; onDelete: () => void }) {
  const Icon = r.type === "income" ? ArrowDownLeft : r.type === "expense" ? ArrowUpRight : ArrowLeftRight;
  const title = r.type === "transfer" ? `${r.accountName} → ${r.toAccountName}` : r.payee || r.categoryName || (r.type === "income" ? "Income" : "Expense");
  const link = r.dealName ?? r.projectName ?? r.companyName;
  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/30">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
          r.type === "income" && "bg-success-soft text-success",
        )}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left" aria-label={`Edit ${title}`}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{title}</span>
          {r.recurringId && <Repeat className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Recurring" />}
          {r.invoiceId && (
            <Chip tone="info" className="hidden px-1.5 py-0 text-[10px] sm:inline-flex">
              Invoice
            </Chip>
          )}
        </div>
        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
          {r.type !== "transfer" && r.payee && r.categoryName && <span>{r.categoryName}</span>}
          {r.type !== "transfer" && !r.categoryName && <span className="italic">Uncategorised</span>}
          {r.type !== "transfer" && <span>· {r.accountName}</span>}
          <ScopeChip scope={r.scope} className="px-1.5 py-0 text-[10px]" />
          {link && (
            <span className="inline-flex min-w-0 items-center gap-0.5">
              <Link2 className="h-3 w-3" />
              <span className="max-w-[10rem] truncate">{link}</span>
            </span>
          )}
          {r.note && <span className="max-w-[16rem] truncate">· {r.note}</span>}
        </div>
      </button>
      <SignedAmount type={r.type} amount={r.amount} money={money} className="text-sm" />
      <div className="flex shrink-0 items-center opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <button type="button" onClick={onEdit} aria-label="Edit" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onDelete} aria-label="Delete" className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "hover:text-danger" })}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
