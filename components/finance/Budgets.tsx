"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Plus, Target } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyHint, Section, Select, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { errorMessage, toast } from "@/components/os/celebrate";
import { useStable } from "@/components/os/useCockpit";
import { BudgetBar, MonthPicker, ScopeChip, budgetTone } from "./bits";
import type { Meta } from "./QuickAdd";
import { fmtMonth, parseAmount, useMoney, type Money, type ScopeFilter } from "./lib";

export function Budgets({
  meta,
  scope,
  month,
  onMonth,
  curMonth,
}: {
  meta: Meta;
  scope: ScopeFilter;
  month: string;
  onMonth: (m: string) => void;
  curMonth: string;
}) {
  const money = useMoney(meta.currency);
  const data = useStable(useQuery(api.finance.budgets, { month, scope }));
  const setBudget = useMutation(api.finance.setBudget);
  const createCategory = useMutation(api.finance.createCategory);
  const [newName, setNewName] = useState("");
  const [newScope, setNewScope] = useState<"personal" | "business" | "both">(scope === "business" ? "business" : "personal");

  async function save(categoryId: Id<"finCategories">, value: number | null) {
    try {
      await setBudget({ categoryId, amount: value });
      toast(value ? `Budget set · ${money.fmt(value)}/month` : "Budget removed", { tone: value ? "success" : "neutral" });
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    }
  }

  async function addCategory(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createCategory({ name: newName, type: "expense", scope: newScope });
      setNewName("");
      toast("Category added", { tone: "success" });
    } catch (err) {
      toast(errorMessage(err), { tone: "warning" });
    }
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-28" />
        <div className="skeleton h-80" />
      </div>
    );
  }

  const budgeted = data.rows.filter((r) => r.budget > 0);
  const others = data.rows.filter((r) => r.budget <= 0);
  const left = data.totalBudget - data.totalSpent;
  const overallPct = data.totalBudget > 0 ? Math.round((data.totalSpent / data.totalBudget) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthPicker value={month} onChange={onMonth} current={curMonth} />
        <p className="text-xs text-muted-foreground">Budgets repeat every month. Heads-up at 80%, over at 100%.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card sm:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground">Spent of budget · {fmtMonth(month)}</div>
              <div className="mt-1.5 text-2xl font-semibold tracking-tight">
                {money.fmt(data.totalSpent)} <span className="text-base font-normal text-muted-foreground">/ {money.fmt(data.totalBudget)}</span>
              </div>
            </div>
            <div className={cn("text-sm font-medium", left < 0 ? "text-danger" : overallPct >= 80 ? "text-warning" : "text-success")}>
              {data.totalBudget === 0 ? "" : left >= 0 ? `${money.fmt(left)} left` : `${money.fmt(-left)} over`}
            </div>
          </div>
          <BudgetBar spent={data.totalSpent} budget={data.totalBudget} className="mt-3 h-2.5" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="text-xs font-medium text-muted-foreground">Spent outside budgets</div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight">{money.fmt(data.unbudgetedSpent)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Categories with no limit set</div>
        </div>
      </div>

      <Section title="Monthly budgets" icon={Target} hint="Click an amount to change it. Clear it to remove the budget.">
        {data.rows.length === 0 ? (
          <EmptyHint icon={Target} title="No expense categories in this view" hint="Add a category below, then give it a monthly limit." />
        ) : (
          <div className="space-y-6">
            {budgeted.length > 0 && (
              <ul className="space-y-4">
                {budgeted.map((r) => (
                  <BudgetRow key={r.categoryId} row={r} money={money} onSave={save} />
                ))}
              </ul>
            )}
            {others.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">No budget yet</h3>
                <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  {others.map((r) => (
                    <li key={r.categoryId} className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-sm">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate">{r.name}</span>
                        {scope === "all" && <ScopeChip scope={r.scope} className="px-1.5 py-0 text-[10px]" />}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {r.spent > 0 && <span className="text-xs tabular-nums text-muted-foreground">{money.fmt(r.spent)} spent</span>}
                        <AmountEditor value={null} placeholder="Set" money={money} onSave={(n) => save(r.categoryId, n)} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <form onSubmit={addCategory} className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New expense category, e.g. Travel"
            aria-label="New category name"
            className={cn(inputClass, "h-8 min-w-[12rem] flex-1 text-sm")}
          />
          <Select value={newScope} onChange={(e) => setNewScope(e.target.value as typeof newScope)} className="h-8 w-auto text-xs" aria-label="Category scope">
            <option value="personal">Personal</option>
            <option value="business">Business</option>
            <option value="both">Both</option>
          </Select>
          <button type="submit" disabled={!newName.trim()} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Plus className="h-3.5 w-3.5" /> Add category
          </button>
        </form>
      </Section>
    </div>
  );
}

type Row = FunctionReturnType<typeof api.finance.budgets>["rows"][number];

function BudgetRow({ row, money, onSave }: { row: Row; money: Money; onSave: (id: Id<"finCategories">, n: number | null) => void }) {
  const pct = row.pct ?? 0;
  const tone = budgetTone(pct);
  return (
    <li>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
          <span className="truncate">{row.name}</span>
          <ScopeChip scope={row.scope} className="px-1.5 py-0 text-[10px]" />
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="tabular-nums">
            <span className="font-medium text-foreground">{money.fmt(row.spent)}</span> of
          </span>
          <AmountEditor value={row.budget} money={money} onSave={(n) => onSave(row.categoryId, n)} />
        </span>
      </div>
      <BudgetBar spent={row.spent} budget={row.budget} />
      <p className={cn("mt-1 text-[11px]", tone === "success" ? "text-muted-foreground" : tone === "warning" ? "text-warning" : "text-danger")}>
        {row.remaining >= 0 ? `${money.fmt(row.remaining)} left · ${pct}% used` : `${money.fmt(-row.remaining)} over · ${pct}% used`}
        {tone === "warning" && " · heads-up"}
      </p>
    </li>
  );
}

/** Click-to-edit money amount; Enter saves, Escape cancels, empty clears. */
function AmountEditor({ value, money, onSave, placeholder = "Set" }: { value: number | null; money: Money; onSave: (n: number | null) => void; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const done = useRef(false);
  useEffect(() => {
    if (editing) setDraft(value ? String(value) : "");
  }, [editing, value]);
  const commit = () => {
    if (done.current) return;
    done.current = true;
    setEditing(false);
    const t = draft.trim();
    if (!t) {
      if (value) onSave(null);
      return;
    }
    const n = parseAmount(t);
    if (!Number.isFinite(n) || n < 0) return toast("Enter a valid amount", { tone: "warning" });
    if (n !== value) onSave(n || null);
  };
  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          done.current = false;
          setEditing(true);
        }}
        className={cn(
          "rounded-md px-1.5 py-0.5 text-xs tabular-nums transition-colors hover:bg-accent",
          value ? "font-medium text-foreground" : "border border-dashed border-border text-muted-foreground",
        )}
      >
        {value ? money.fmt(value) : placeholder}
      </button>
    );
  }
  return (
    <input
      autoFocus
      inputMode="decimal"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          e.stopPropagation();
          done.current = true;
          setEditing(false);
        }
      }}
      placeholder="0"
      aria-label="Monthly budget"
      className={cn(inputClass, "h-7 w-24 px-2 text-xs tabular-nums")}
    />
  );
}
