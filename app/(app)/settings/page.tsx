"use client";

import { useState } from "react";
import Link from "next/link";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Settings, Download, Sparkles, Sun, Kanban, ShieldCheck, HeartPulse, Keyboard, Loader2, Layers } from "lucide-react";
import { PageShell, Section, Field, TextInput, Select, Kbd, cn, buttonVariants } from "@/components/os/kit";
import { toast, celebrate, setCelebrations, errorMessage } from "@/components/os/celebrate";
import { todayYmd } from "@/lib/day";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SettingsPage() {
  const s = useQuery(api.settings.get);
  const update = useMutation(api.settings.update);
  const convex = useConvex();
  const [exporting, setExporting] = useState(false);

  const set = async (patch: Parameters<typeof update>[0]) => {
    try {
      await update(patch);
      toast("Saved", { tone: "success" });
    } catch (e) {
      toast(errorMessage(e, "Couldn't save"), { tone: "warning" });
    }
  };
  type NumKey = "outreachQuota" | "meetingsGoal" | "contentWeeklyTarget" | "annualIncome" | "maxActiveGoals" | "maxActiveProjects" | "maxNewHabits" | "workHoursCap";
  /** Save a whole-number field on blur — only when it's valid and actually changed (no "Saved" spam while tabbing). */
  const saveNum = (key: NumKey, input: HTMLInputElement, min = 0, blank?: number) => {
    if (!s) return;
    const raw = input.value.trim();
    if (raw === "" && blank === undefined) {
      input.value = String(s[key]); // emptied: restore the saved value instead of saving nothing
      return;
    }
    const n = raw === "" ? blank! : Math.round(Number(raw));
    if (!Number.isFinite(n) || n < min) {
      toast(`Enter a number of ${min} or more`, { tone: "warning" });
      input.value = String(s[key]);
      return;
    }
    if (raw !== "") input.value = String(n);
    if (n !== s[key]) void set({ [key]: n } as Partial<Record<NumKey, number>>);
  };

  const exportAll = async () => {
    setExporting(true);
    try {
      const data = await convex.query(api.exportData.all, {});
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bishos-export-${todayYmd()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Export downloaded", { tone: "success", sub: "Your data is yours — always." });
    } catch (e) {
      toast(errorMessage(e, "Export failed"), { tone: "warning" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageShell title="Settings" icon={Settings} subtitle="Defaults that shape your days. Every number here is a sensible starting point, not a law — tune it.">
      {!s ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Daily rhythm" icon={Sun}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Daily capacity (hours)" hint="~5.5h of planned work on a 9–5 day leaves room for the unexpected.">
                <TextInput
                  type="number"
                  step={0.5}
                  min={1}
                  max={14}
                  defaultValue={s.capacityMin / 60}
                  onBlur={(e) => {
                    // An emptied field would save 0 capacity (every day "over capacity").
                    const h = Number(e.target.value);
                    if (e.target.value.trim() && h > 0) {
                      const min = Math.round(h * 60);
                      if (min !== s.capacityMin) void set({ capacityMin: min });
                    } else e.target.value = String(s.capacityMin / 60);
                  }}
                />
              </Field>
              <Field label="Protected Free Day" hint="No work, midnight to midnight.">
                <Select defaultValue={s.freeWeekday} onChange={(e) => void set({ freeWeekday: Number(e.target.value) })}>
                  {WEEKDAYS.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Weekly review day">
                <Select defaultValue={s.reviewWeekday} onChange={(e) => void set({ reviewWeekday: Number(e.target.value) })}>
                  {WEEKDAYS.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Celebrations" hint="Confetti + XP toasts on wins.">
                <button
                  onClick={() => {
                    const next = !s.celebrate;
                    setCelebrations(next);
                    void set({ celebrate: next });
                    if (next) celebrate(0.8);
                  }}
                  className={cn(buttonVariants({ variant: s.celebrate ? "default" : "outline" }), "w-full")}
                >
                  <Sparkles /> {s.celebrate ? "On" : "Off"}
                </button>
              </Field>
            </div>
          </Section>

          <Section title="Founder engines" icon={Kanban}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Daily outreach quota" hint="Rule of 100 is ~4h/day — pick what fits alongside delivery.">
                <TextInput type="number" min={0} defaultValue={s.outreachQuota} onBlur={(e) => saveNum("outreachQuota", e.target)} />
              </Field>
              <Field label="Daily meetings goal" hint="'Open to goal': stop prospecting once you've booked this many.">
                <TextInput type="number" min={0} defaultValue={s.meetingsGoal} onBlur={(e) => saveNum("meetingsGoal", e.target)} />
              </Field>
              <Field label="Hub content pieces / week">
                <TextInput type="number" min={0} defaultValue={s.contentWeeklyTarget} onBlur={(e) => saveNum("contentWeeklyTarget", e.target)} />
              </Field>
              <Field label="Currency">
                <TextInput
                  defaultValue={s.currency}
                  maxLength={6}
                  onBlur={(e) => {
                    const c = e.target.value.trim().toUpperCase() || "USD";
                    e.target.value = c;
                    if (c !== s.currency) void set({ currency: c });
                  }}
                />
              </Field>
              <Field label="Annual income (for your Buyback Rate)" hint="Buyback Rate = income ÷ 2000 ÷ 4.">
                <TextInput type="number" min={0} defaultValue={s.annualIncome || ""} onBlur={(e) => saveNum("annualIncome", e.target, 0, 0)} />
              </Field>
            </div>
          </Section>

          <Section title="Caps (anti-overload)" icon={ShieldCheck} hint="Fewer, bigger bets. The system blocks you from going over.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Active 12-week goals">
                <TextInput type="number" min={1} max={8} defaultValue={s.maxActiveGoals} onBlur={(e) => saveNum("maxActiveGoals", e.target, 1)} />
              </Field>
              <Field label="Active projects">
                <TextInput type="number" min={1} max={20} defaultValue={s.maxActiveProjects} onBlur={(e) => saveNum("maxActiveProjects", e.target, 1)} />
              </Field>
              <Field label="New habits at once">
                <TextInput type="number" min={1} max={6} defaultValue={s.maxNewHabits} onBlur={(e) => saveNum("maxNewHabits", e.target, 1)} />
              </Field>
            </div>
          </Section>

          <Section title="Wellbeing" icon={HeartPulse} hint="Observations only — not a clinical tool.">
            <Field label="Weekly work-hours warning" hint="55h+ a week is linked to real health risk (WHO/ILO).">
              <TextInput type="number" min={20} max={90} defaultValue={s.workHoursCap} onBlur={(e) => saveNum("workHoursCap", e.target, 1)} />
            </Field>
          </Section>

          <Section title="Life Areas & setup" icon={Layers}>
            <p className="text-sm text-muted-foreground">Re-run the area setup (standards + weekly hour budgets) or manage areas in detail.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/today?setup=1" className={buttonVariants({ variant: "outline" })}>
                Run setup
              </Link>
              <Link href="/life-areas" className={buttonVariants({ variant: "outline" })}>
                Manage areas
              </Link>
            </div>
          </Section>

          <Section title="Your data" icon={Download} hint="Full export, any time. No lock-in.">
            <button onClick={() => void exportAll()} disabled={exporting} className={buttonVariants()}>
              {exporting ? <Loader2 className="animate-spin" /> : <Download />} Export everything (JSON)
            </button>
          </Section>

          <Section title="Keyboard" icon={Keyboard} className="lg:col-span-2">
            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Shortcut keys={["C"]} label="Quick capture (anywhere)" />
              <Shortcut keys={["Ctrl", "K"]} label="Command palette" />
              <Shortcut keys={["J", "K"]} label="Move in Inbox" />
              <Shortcut keys={["T"]} label="Inbox → task" />
              <Shortcut keys={["N"]} label="Inbox → note" />
              <Shortcut keys={["D"]} label="Inbox → done (2-minute rule)" />
              <Shortcut keys={["X"]} label="Inbox → discard" />
              <Shortcut keys={["Space"]} label="Recall: reveal card" />
              <Shortcut keys={["1", "4"]} label="Recall: rate" />
            </div>
          </Section>
        </div>
      )}
    </PageShell>
  );
}

function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <p className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex gap-1">
        {keys.map((k) => (
          <Kbd key={k}>{k}</Kbd>
        ))}
      </span>
    </p>
  );
}
