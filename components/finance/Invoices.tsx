"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Ban, CheckCircle2, FileText, Handshake, Pencil, Plus, Receipt, RotateCcw, Send, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Chip, Dialog, EmptyHint, Field, Section, Segmented, Select, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { errorMessage, reward, toast } from "@/components/os/celebrate";
import { useStable } from "@/components/os/useCockpit";
import { addDaysYmd, fmtYmd, useToday } from "@/lib/day";
import { StatTile } from "./bits";
import type { Meta } from "./QuickAdd";
import { parseAmount, useMoney, whenLabel, type Money } from "./lib";

type Data = FunctionReturnType<typeof api.finance.invoices>;
type Invoice = Data["rows"][number];
type WonDeal = Data["wonDeals"][number];

type View = "open" | "paid" | "all";

export function Invoices({ meta }: { meta: Meta }) {
  const today = useToday();
  const money = useMoney(meta.currency);
  const data = useStable(useQuery(api.finance.invoices, { today }));
  const markPaid = useMutation(api.finance.markInvoicePaid);
  const setStatus = useMutation(api.finance.setInvoiceStatus);
  const remove = useMutation(api.finance.removeInvoice);
  const [view, setView] = useState<View>("open");
  const [dialog, setDialog] = useState<{ invoice?: Invoice; deal?: WonDeal } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const rows = useMemo(() => {
    const all = data?.rows ?? [];
    if (view === "open") return all.filter((r) => r.status === "draft" || r.status === "sent");
    if (view === "paid") return all.filter((r) => r.status === "paid");
    return all;
  }, [data?.rows, view]);

  async function pay(i: Invoice) {
    setBusy(i._id);
    try {
      const r = await markPaid({ id: i._id, date: today });
      reward(`Cash in: ${i.title} · ${money.fmt(i.amount)}`, r.xp || undefined, true);
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    } finally {
      setBusy(null);
    }
  }
  async function status(i: Invoice, s: "draft" | "sent" | "void") {
    if (i.status === "paid" && !confirm("Mark this invoice unpaid? Its payment transaction will be removed.")) return;
    try {
      await setStatus({ id: i._id, status: s });
      toast(s === "sent" ? (i.status === "paid" ? "Marked unpaid" : "Marked as sent") : s === "void" ? "Invoice voided" : "Back to draft");
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    }
  }
  async function del(i: Invoice) {
    if (!confirm(`Delete invoice “${i.title}”?${i.status === "paid" ? " The recorded payment stays in your transactions." : ""}`)) return;
    try {
      await remove({ id: i._id });
      toast("Invoice deleted");
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

  const toBill = data.wonDeals.filter((d) => !d.invoiced);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Outstanding" icon={Receipt} value={money.fmt(data.outstanding)} sub={`${data.outstandingCount} sent, not paid`} />
        <StatTile
          label="Overdue"
          value={money.fmt(data.overdue)}
          tone={data.overdueCount ? "warning" : undefined}
          sub={data.overdueCount ? `${data.overdueCount} past due · send a nudge` : "Nothing late"}
        />
        <StatTile label="Paid this month" icon={CheckCircle2} value={money.fmt(data.paidThisMonth)} tone={data.paidThisMonth > 0 ? "success" : undefined} sub="Cash collected" />
        <StatTile label="Drafts" icon={FileText} value={data.draftCount} sub={data.draftCount ? "Ready to send?" : "No drafts"} />
      </div>

      {toBill.length > 0 && (
        <Section title="Won deals to bill" icon={Handshake} hint="Turn a won deal into an invoice in one click. Amount, client and title are filled in.">
          <ul className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {toBill.slice(0, 8).map((d) => (
              <li key={d._id} className="w-60 shrink-0 rounded-lg border border-border bg-background/60 p-3">
                <div className="truncate text-sm font-medium">{d.title}</div>
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {d.companyName ?? "No company"} {d.value ? `· ${money.fmt(d.value)}` : ""}
                </div>
                <button type="button" onClick={() => setDialog({ deal: d })} className={buttonVariants({ variant: "outline", size: "sm", className: "mt-2 h-7 w-full" })}>
                  <Plus className="h-3.5 w-3.5" /> Create invoice
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        title="Invoices"
        icon={Receipt}
        action={
          <>
            <Segmented
              size="sm"
              value={view}
              onChange={setView}
              options={[
                { value: "open", label: "Open" },
                { value: "paid", label: "Paid" },
                { value: "all", label: "All" },
              ]}
            />
            <button type="button" onClick={() => setDialog({})} className={buttonVariants({ size: "sm" })}>
              <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">New invoice</span>
            </button>
          </>
        }
      >
        {rows.length === 0 ? (
          <EmptyHint
            icon={Receipt}
            title={view === "paid" ? "No paid invoices yet" : view === "open" ? "No open invoices" : "No invoices yet"}
            hint="Track what clients owe you until the cash lands. Marking one paid logs the income in your business books."
            action={
              <button type="button" onClick={() => setDialog({})} className={buttonVariants({ size: "sm" })}>
                <Plus className="h-3.5 w-3.5" /> New invoice
              </button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((i) => (
              <InvoiceLine
                key={i._id}
                i={i}
                money={money}
                today={today}
                busy={busy === i._id}
                onPay={() => pay(i)}
                onStatus={(s) => status(i, s)}
                onEdit={() => setDialog({ invoice: i })}
                onDelete={() => del(i)}
              />
            ))}
          </ul>
        )}
      </Section>

      <InvoiceDialog
        open={!!dialog}
        invoice={dialog?.invoice}
        deal={dialog?.deal}
        wonDeals={data.wonDeals}
        nextNumber={data.nextNumber}
        money={money}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

function StatusChip({ i, today }: { i: Invoice; today: string }) {
  if (i.status === "paid")
    return (
      <Chip tone="success" className="px-1.5 py-0 text-[10px]">
        Paid{i.paidOn ? ` ${whenLabel(i.paidOn, today)}` : ""}
      </Chip>
    );
  if (i.status === "void")
    return (
      <Chip tone="outline" className="px-1.5 py-0 text-[10px]">
        Void
      </Chip>
    );
  if (i.status === "draft")
    return (
      <Chip tone="muted" className="px-1.5 py-0 text-[10px]">
        Draft
      </Chip>
    );
  if (i.overdue)
    return (
      <Chip tone="warning" className="px-1.5 py-0 text-[10px]">
        {i.daysOverdue}d overdue
      </Chip>
    );
  return (
    <Chip tone="info" className="px-1.5 py-0 text-[10px]">
      Due {whenLabel(i.dueOn, today)}
    </Chip>
  );
}

function InvoiceLine({
  i,
  money,
  today,
  busy,
  onPay,
  onStatus,
  onEdit,
  onDelete,
}: {
  i: Invoice;
  money: Money;
  today: string;
  busy: boolean;
  onPay: () => void;
  onStatus: (s: "draft" | "sent" | "void") => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 py-3", i.status === "void" && "opacity-60")}>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {i.number && <span className="text-xs tabular-nums text-muted-foreground">{i.number}</span>}
          <span className={cn("truncate text-sm font-medium", i.status === "void" && "line-through")}>{i.title}</span>
          <StatusChip i={i} today={today} />
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {i.companyName ?? i.personName ?? "No client set"}
          {i.dealTitle && ` · deal: ${i.dealTitle}`}
          {i.projectTitle && ` · ${i.projectTitle}`} · issued {fmtYmd(i.issuedOn, { month: "short", day: "numeric" })} · due {fmtYmd(i.dueOn, { month: "short", day: "numeric" })}
        </div>
      </button>
      <span className={cn("text-sm font-semibold tabular-nums", i.status === "paid" && "text-success")}>{money.fmt(i.amount)}</span>
      <div className="flex items-center gap-0.5">
        {i.status === "draft" && (
          <button type="button" onClick={() => onStatus("sent")} className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 px-2" })}>
            <Send className="h-3 w-3" /> Sent
          </button>
        )}
        {(i.status === "sent" || i.status === "draft") && (
          <button type="button" disabled={busy} onClick={onPay} className={buttonVariants({ variant: i.overdue ? "default" : "outline", size: "sm", className: "h-7 px-2" })}>
            <CheckCircle2 className="h-3 w-3" /> Paid
          </button>
        )}
        {i.status === "paid" && (
          <button type="button" onClick={() => onStatus("sent")} aria-label="Mark unpaid" title="Mark unpaid" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
        {i.status === "void" ? (
          <button type="button" onClick={() => onStatus("draft")} aria-label="Re-open" title="Re-open as draft" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        ) : (
          i.status !== "paid" && (
            <button type="button" onClick={() => onStatus("void")} aria-label="Void" title="Void" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
              <Ban className="h-3.5 w-3.5" />
            </button>
          )
        )}
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

function InvoiceDialog({
  open,
  invoice,
  deal,
  wonDeals,
  nextNumber,
  money,
  onClose,
}: {
  open: boolean;
  invoice?: Invoice;
  deal?: WonDeal;
  wonDeals: WonDeal[];
  nextNumber: string;
  money: Money;
  onClose: () => void;
}) {
  const today = useToday();
  const create = useMutation(api.finance.createInvoice);
  const update = useMutation(api.finance.updateInvoice);
  const links = useQuery(api.finance.linkOptions, open ? {} : "skip");

  const [dealId, setDealId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [number, setNumber] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [personId, setPersonId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [issuedOn, setIssuedOn] = useState(today);
  const [dueOn, setDueOn] = useState(addDaysYmd(today, 14));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const applyDeal = (d: WonDeal | undefined) => {
    setDealId(d?._id ?? "");
    if (!d) return;
    setTitle(d.title);
    if (d.value) setAmount(String(d.value));
    setCompanyId(d.companyId ?? "");
    setPersonId(d.personId ?? "");
    setProjectId(d.projectId ?? "");
  };

  useEffect(() => {
    if (!open) return;
    if (invoice) {
      setDealId(invoice.dealId ?? "");
      setTitle(invoice.title);
      setAmount(String(invoice.amount));
      setNumber(invoice.number ?? "");
      setCompanyId(invoice.companyId ?? "");
      setPersonId(invoice.personId ?? "");
      setProjectId(invoice.projectId ?? "");
      setIssuedOn(invoice.issuedOn);
      setDueOn(invoice.dueOn);
      setNotes(invoice.notes ?? "");
    } else {
      setTitle("");
      setAmount("");
      setNumber(nextNumber);
      setCompanyId("");
      setPersonId("");
      setProjectId("");
      setIssuedOn(today);
      setDueOn(addDaysYmd(today, 14));
      setNotes("");
      setDealId("");
      if (deal) applyDeal(deal);
    }
    // Keyed on ids: the invoices query re-renders often and must not wipe the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?._id, deal?._id]);

  async function submit(status: "draft" | "sent", e?: FormEvent) {
    e?.preventDefault();
    const n = parseAmount(amount);
    if (!title.trim()) return toast("Give the invoice a title", { tone: "warning" });
    if (!Number.isFinite(n) || n <= 0) return toast("Enter an amount above zero", { tone: "warning" });
    setBusy(true);
    try {
      if (invoice) {
        await update({
          id: invoice._id,
          title,
          amount: n,
          number: number.trim() || null,
          issuedOn,
          dueOn,
          companyId: (companyId || null) as Id<"companies"> | null,
          personId: (personId || null) as Id<"people"> | null,
          dealId: (dealId || null) as Id<"deals"> | null,
          projectId: (projectId || null) as Id<"projects"> | null,
          notes: notes.trim() || null,
        });
        toast("Invoice saved", { tone: "success" });
      } else {
        await create({
          title,
          amount: n,
          number: number.trim() || undefined,
          issuedOn,
          dueOn,
          status,
          companyId: companyId ? (companyId as Id<"companies">) : undefined,
          personId: personId ? (personId as Id<"people">) : undefined,
          dealId: dealId ? (dealId as Id<"deals">) : undefined,
          projectId: projectId ? (projectId as Id<"projects">) : undefined,
          notes: notes.trim() || undefined,
        });
        toast(status === "sent" ? `Invoice sent · ${money.fmt(n)}` : "Draft saved", { tone: "success" });
      }
      onClose();
    } catch (err) {
      toast(errorMessage(err, "Could not save"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  const people = (links?.people ?? []).filter((p) => !companyId || p.companyId === companyId || p._id === personId);

  return (
    <Dialog open={open} onClose={onClose} title={invoice ? "Edit invoice" : "New invoice"}>
      <form onSubmit={(e) => submit(invoice ? (invoice.status === "draft" ? "draft" : "sent") : "sent", e)} className="space-y-4">
        {!invoice && wonDeals.length > 0 && (
          <Field label="From a won deal (optional)" hint="Prefills title, amount, client and project.">
            <Select value={dealId} onChange={(e) => applyDeal(wonDeals.find((d) => d._id === e.target.value))}>
              <option value="">Start from scratch</option>
              {wonDeals.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.title}
                  {d.companyName ? ` · ${d.companyName}` : ""}
                  {d.value ? ` · ${money.fmt(d.value)}` : ""}
                  {d.invoiced ? " (invoiced)" : ""}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
          <Field label="Title">
            <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Website build: milestone 1" />
          </Field>
          <Field label="Number">
            <TextInput value={number} onChange={(e) => setNumber(e.target.value)} placeholder="INV-0001" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label={`Amount (${money.currency})`} className="col-span-2 sm:col-span-1">
            <TextInput inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="tabular-nums" />
          </Field>
          <Field label="Issued">
            <TextInput type="date" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} />
          </Field>
          <Field label="Due">
            <TextInput type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[7, 14, 30].map((d) => (
            <button key={d} type="button" onClick={() => setDueOn(addDaysYmd(issuedOn, d))} className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 px-2 text-[11px]" })}>
              Net {d}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Client company">
            <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)} disabled={links === undefined}>
              <option value="">None</option>
              {(links?.companies ?? []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Contact (optional)">
            <Select value={personId} onChange={(e) => setPersonId(e.target.value)} disabled={links === undefined}>
              <option value="">None</option>
              {people.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Project (optional)">
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={links === undefined}>
            <option value="">None</option>
            {(links?.projects ?? []).map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
                {p.status === "completed" ? " (done)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notes (optional)">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Line items, payment details, PO number…" className="min-h-[64px]" />
        </Field>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Cancel
          </button>
          {invoice ? (
            <button type="submit" disabled={busy} className={buttonVariants({ size: "sm" })}>
              Save
            </button>
          ) : (
            <>
              <button type="button" disabled={busy} onClick={() => submit("draft")} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Save draft
              </button>
              <button type="submit" disabled={busy} className={buttonVariants({ size: "sm" })}>
                <Send className="h-3.5 w-3.5" /> Save as sent
              </button>
            </>
          )}
        </div>
      </form>
    </Dialog>
  );
}
