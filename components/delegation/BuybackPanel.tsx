"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Calculator, HandCoins, ListTodo } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Chip, EmptyHint, Field, Metric, Section, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { fmtMin } from "@/lib/day";
import { errText, money } from "@/components/habits/util";
import { ENERGY, QUADRANTS, VALUE_LABEL } from "./meta";

const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "INR", "AED", "SAR", "CAD", "AUD"];

export function BuybackPanel({ today, onDelegate, onGoAudit }: { today: string; onDelegate: (activity: string) => void; onGoAudit: () => void }) {
  const b = useQuery(api.delegation.buyback, { today });
  const setIncome = useMutation(api.delegation.setIncome);
  const [income, setIncomeDraft] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!b) return;
    setIncomeDraft(b.annualIncome ? String(b.annualIncome) : "");
    setCurrency(b.currency);
  }, [b?.annualIncome, b?.currency]); // eslint-disable-line react-hooks/exhaustive-deps

  if (b === undefined)
    return (
      <div className="space-y-3">
        <div className="skeleton h-32" />
        <div className="skeleton h-56" />
      </div>
    );

  const preview = Number(income) || 0;
  const dirty = preview !== b.annualIncome || currency !== b.currency;
  const cur = currency || b.currency;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await setIncome({ annualIncome: preview, currency: cur });
      toast("Buyback rate updated", { tone: "success" });
    } catch (err) {
      toast(errText(err), { tone: "warning" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div className="min-w-0 space-y-5">
        <Section title="Your Buyback Rate" icon={Calculator} hint="Annual income ÷ 2,000 hours ÷ 4">
          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-[1fr_96px] gap-2">
              <Field label="Annual income (or target)">
                <TextInput type="number" inputMode="numeric" min={0} value={income} onChange={(e) => setIncomeDraft(e.target.value)} placeholder="100000" />
              </Field>
              <Field label="Currency">
                <TextInput list="buyback-currencies" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={6} />
                <datalist id="buyback-currencies">
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
              <Metric label="Your hour" value={money(preview / 2000, cur)} />
              <Metric label="Buyback rate" value={money(preview / 2000 / 4, cur)} tone="info" />
            </div>
            <p className="text-xs text-muted-foreground">
              If someone could do a task for {money(preview / 8000, cur)}/h or less, it&apos;s a candidate to buy back. At {money(100000, cur)} a year that&apos;s {money(12.5, cur)}/h.
            </p>
            <button type="submit" disabled={!dirty || saving} className={cn(buttonVariants({ size: "sm" }), "w-full")}>
              Save
            </button>
          </form>
        </Section>
      </div>

      <div className="min-w-0 space-y-5">
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-3">
          <Metric label="Hours to buy back" value={`${b.totalHoursPerWeek}h`} sub="per week (est.)" />
          <Metric label="Cost at buyback rate" value={b.rate ? money(b.totalCostPerWeek, b.currency) : "—"} sub="per week" />
          <Metric label="Your time's worth" value={b.hourly ? money(b.valueOfHoursPerWeek, b.currency) : "—"} sub="per week, at your hourly" className="col-span-2 sm:col-span-1" />
        </div>

        <Section title="Delegate candidates" icon={HandCoins} hint={`Low-$ work ($–$$) from your audit · ${b.daysLogged} day${b.daysLogged === 1 ? "" : "s"} logged`}>
          {b.candidates.length === 0 ? (
            <EmptyHint
              icon={HandCoins}
              title="No low-$ work logged yet"
              hint="Rate time-audit blocks $ or $$ and they show up here with the hours you could buy back each week."
              action={
                <button onClick={onGoAudit} className={buttonVariants({ variant: "outline" })}>
                  Open the time audit
                </button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {b.candidates.map((c) => {
                const E = ENERGY[c.energy];
                return (
                  <li key={c.activity} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 text-sm sm:flex-nowrap">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: QUADRANTS[c.quadrant].color }} title={QUADRANTS[c.quadrant].label} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{c.activity}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {VALUE_LABEL[c.value]} · <E.icon className={cn("h-3 w-3", E.cls)} /> {E.label} · {fmtMin(c.minutes)} logged
                      </span>
                    </span>
                    <span className="w-20 shrink-0 text-right tabular-nums">
                      <span className="block font-medium">{c.hoursPerWeek}h/wk</span>
                      <span className="block text-xs text-muted-foreground">{b.rate ? money(c.costPerWeek, b.currency) : "set income"}</span>
                    </span>
                    <button onClick={() => onDelegate(c.activity)} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 shrink-0 px-2 text-xs")}>
                      Write SOP
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {b.tasks.length > 0 && (
          <Section title="Tasks you flagged “delegate”" icon={ListTodo} hint="Open tasks marked as not-for-you">
            <ul className="divide-y divide-border">
              {b.tasks.map((t) => (
                <li key={t._id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  {t.estimateMin ? <Chip tone="muted">{fmtMin(t.estimateMin)}</Chip> : null}
                  {t.cost != null && b.rate ? <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{money(t.cost, b.currency)}</span> : null}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}
