"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Archive, Gauge, Plus, Sparkles, Zap } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { EmptyHint, PageShell, Ring, Section, buttonVariants, cn, toneForPct } from "@/components/os/kit";
import { celebrate, errorMessage, toast } from "@/components/os/celebrate";
import { useToday, fmtYmd, addDaysYmd } from "@/lib/day";
import { MetricDialog } from "@/components/strategy/MetricDialog";
import { ScorecardGrid } from "@/components/strategy/ScorecardGrid";
import { Kpi } from "@/components/strategy/viz";
import { weekWindows } from "@/components/strategy/lib";
import { useStable } from "@/components/os/useCockpit";

export default function ScorecardPage() {
  const today = useToday();
  const [showArchived, setShowArchived] = useState(false);
  const weeks = useMemo(() => weekWindows(today, 13), [today]);
  // useStable: keep the last grid while args change (Archived toggle, midnight) instead of flashing skeletons.
  const data = useStable(useQuery(api.scorecard.grid, { weeks, includeInactive: showArchived }));
  const seed = useMutation(api.scorecard.seedDefaults);
  const [dialog, setDialog] = useState<{ open: boolean; metric: Doc<"metrics"> | null }>({ open: false, metric: null });
  const [seeding, setSeeding] = useState(false);

  const current = weeks[weeks.length - 1];
  const activeRows = data?.metrics.filter((m) => m.active) ?? [];
  const cur = activeRows.map((m) => m.status[m.status.length - 1]);
  const on = cur.filter((s) => s === "on").length;
  const off = cur.filter((s) => s === "off").length;
  const missing = activeRows.filter((m) => !m.source && m.values[m.values.length - 1] == null).length;
  const measured = on + off;
  const hitAll = activeRows.reduce((s, m) => s + m.onTrackCount, 0);
  const dataAll = activeRows.reduce((s, m) => s + m.weeksWithData, 0);
  const hitRate = dataAll ? Math.round((hitAll / dataAll) * 100) : null;

  async function startDefaults() {
    setSeeding(true);
    try {
      const r = await seed({});
      if (r.created) {
        toast("Founder scorecard ready", { tone: "success", sub: `${r.created} numbers, 6 of them automatic` });
        celebrate(0.8);
      }
    } catch (err) {
      toast(errorMessage(err, "Could not set up the scorecard"), { tone: "warning" });
    } finally {
      setSeeding(false);
    }
  }

  return (
    <PageShell
      title="Scorecard"
      icon={Gauge}
      subtitle="5–10 weekly numbers that tell you in 60 seconds whether the business is on track."
      actions={
        data?.hasAny ? (
          <>
            {data.inactiveCount > 0 && (
              <button
                type="button"
                onClick={() => setShowArchived((s) => !s)}
                className={buttonVariants({ variant: showArchived ? "secondary" : "ghost", size: "sm" })}
              >
                <Archive className="h-3.5 w-3.5" />
                {showArchived ? "Hide archived" : `Archived (${data.inactiveCount})`}
              </button>
            )}
            <button type="button" onClick={() => setDialog({ open: true, metric: null })} className={buttonVariants({ size: "sm" })}>
              <Plus className="h-4 w-4" />
              Add metric
            </button>
          </>
        ) : null
      }
    >
      {data === undefined ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24" />
            ))}
          </div>
          <div className="skeleton h-80" />
        </div>
      ) : !data.hasAny ? (
        <EmptyHint
          icon={Gauge}
          title="Start with the founder scorecard"
          hint="Seven numbers a solo founder should watch every week: outreach, sales conversations, deals won, revenue, content, deep work and recall. Six fill themselves in from your data."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={startDefaults} disabled={seeding} className={buttonVariants()}>
                <Sparkles className="h-4 w-4" />
                Start with the founder scorecard
              </button>
              <button type="button" onClick={() => setDialog({ open: true, metric: null })} className={buttonVariants({ variant: "outline" })}>
                Add my own metric
              </button>
            </div>
          }
          className="py-16"
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="col-span-2 flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card lg:col-span-1">
              <Ring value={measured ? (on / measured) * 100 : 0} size={64} stroke={7} tone={measured ? toneForPct((on / measured) * 100) : "primary"}>
                <span className="text-sm font-semibold tabular-nums">
                  {on}/{activeRows.length}
                </span>
              </Ring>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">On track this week</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fmtYmd(current.weekStart, { month: "short", day: "numeric" })} – {fmtYmd(addDaysYmd(current.weekStart, 6), { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
            <Kpi label="Off track" value={off} tone={off ? "danger" : "success"} sub={off ? "Discuss in your weekly review" : "Nothing off track"} />
            <Kpi
              label="Numbers to fill"
              value={missing}
              tone={missing ? "warning" : "success"}
              sub={missing ? "Manual numbers missing this week" : "All numbers in"}
            />
            <Kpi label="13-week hit rate" value={hitRate == null ? "—" : `${hitRate}%`} sub="Weeks on track ÷ weeks measured" />
          </div>

          <ScorecardGrid data={data} today={today} onEdit={(m) => setDialog({ open: true, metric: m })} />

          <Section>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-success-soft ring-1 ring-success/40" /> On track
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-danger-soft ring-1 ring-danger/40" /> Off track
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-info" /> Calculated from your pipeline, content, focus and recall data
              </span>
              <span className={cn("ml-auto hidden md:inline")}>Click a manual cell to edit. Empty clears it.</span>
            </div>
          </Section>
        </div>
      )}

      <MetricDialog
        open={dialog.open}
        metric={dialog.metric}
        currency={data?.currency ?? "USD"}
        onClose={() => setDialog({ open: false, metric: null })}
      />
    </PageShell>
  );
}
