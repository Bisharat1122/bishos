"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Briefcase, Coins, Sparkles, User, Wallet } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Field, Select, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { celebrate, errorMessage, toast } from "@/components/os/celebrate";
import { CURRENCIES, isValidCurrency, makeMoney } from "./lib";

/** First run: pick a currency, name two accounts, optionally add balances. */
export function FinanceSetup({ currency }: { currency: string }) {
  const setup = useMutation(api.finance.setup);
  const updateSettings = useMutation(api.settings.update);
  const [cur, setCur] = useState(currency);
  const [personalName, setPersonalName] = useState("Personal account");
  const [businessName, setBusinessName] = useState("Business account");
  const [personal, setPersonal] = useState("");
  const [business, setBusiness] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setCur(currency), [currency]);
  const money = makeMoney(cur);

  const num = (s: string) => {
    const t = s.replace(/,/g, "").trim();
    if (!t) return 0;
    const n = Number(t);
    return Number.isFinite(n) ? n : Number.NaN;
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const p = num(personal);
    const b = num(business);
    if (Number.isNaN(p) || Number.isNaN(b)) return toast("Balances must be numbers", { tone: "warning" });
    setBusy(true);
    try {
      if (cur !== currency) await updateSettings({ currency: cur });
      await setup({ personalName, businessName, personalOpening: p, businessOpening: b });
      toast("Finance is ready. Log your first transaction!", { tone: "success" });
      celebrate(0.8);
    } catch (err) {
      toast(errorMessage(err), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="os-rise mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
      <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <Wallet className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">Set up your money in 30 seconds</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        One calm place for personal and business money: what comes in, what goes out, your runway, bills and invoices. We&apos;ll add ready-made categories
        (rent, food, SaaS, contractors, client revenue…) and one account for each side.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <Field label="Currency" hint="You can change it any time from the Finance header.">
          <Select value={cur} onChange={(e) => setCur(e.target.value)} className="sm:w-72">
            {!CURRENCIES.some((c) => c.code === cur) && <option value={cur}>{cur}</option>}
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-border bg-background/60 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" /> Personal
            </div>
            <Field label="Account name">
              <TextInput value={personalName} onChange={(e) => setPersonalName(e.target.value)} />
            </Field>
            <Field label={`Balance today (${money.symbol})`} hint="Optional">
              <TextInput inputMode="decimal" value={personal} onChange={(e) => setPersonal(e.target.value)} placeholder="0" className="tabular-nums" />
            </Field>
          </div>
          <div className="space-y-3 rounded-lg border border-border bg-background/60 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Briefcase className="h-4 w-4 text-muted-foreground" /> Business
            </div>
            <Field label="Account name">
              <TextInput value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </Field>
            <Field label={`Balance today (${money.symbol})`} hint="Optional · powers your runway">
              <TextInput inputMode="decimal" value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="0" className="tabular-nums" />
            </Field>
          </div>
        </div>

        <button type="submit" disabled={busy} className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
          <Sparkles className="h-4 w-4" /> Set up finance
        </button>
      </form>
    </div>
  );
}

/** Header currency switcher (writes settings.currency). */
export function CurrencyPicker({ currency, className }: { currency: string; className?: string }) {
  const update = useMutation(api.settings.update);
  async function change(code: string) {
    if (code === "__other") {
      const v = window.prompt("3-letter currency code (e.g. NOK, JPY, KES)", "")?.trim().toUpperCase();
      if (!v) return;
      if (!isValidCurrency(v)) return toast(`“${v}” isn't a currency code we recognise`, { tone: "warning" });
      code = v;
    }
    if (code === currency) return;
    try {
      await update({ currency: code });
      toast(`Currency set to ${code}. Amounts aren't converted.`, { tone: "info" });
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
    }
  }
  return (
    <label className={cn("relative inline-flex items-center", className)}>
      <Coins className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      <select
        value={currency}
        onChange={(e) => change(e.target.value)}
        aria-label="Currency"
        className="h-8 appearance-none rounded-lg border border-border bg-background pl-8 pr-3 text-xs font-medium shadow-xs hover:bg-accent focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 dark:bg-transparent"
      >
        {!CURRENCIES.some((c) => c.code === currency) && <option value={currency}>{currency}</option>}
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code}
          </option>
        ))}
        <option value="__other">Other…</option>
      </select>
    </label>
  );
}
