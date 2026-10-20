"use client";

import { useQuery } from "convex/react";
import { Grid2x2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { EmptyHint, buttonVariants, cn } from "@/components/os/kit";
import { fmtMin } from "@/lib/day";
import { ENERGY, QUADRANTS, VALUE_LABEL, type Quadrant } from "./meta";

const LAYOUT: Quadrant[] = ["replacement", "production", "delegation", "investment"];

export function DripMatrix({ today, onGoAudit, onDelegate }: { today: string; onGoAudit: () => void; onDelegate: (activity: string) => void }) {
  const d = useQuery(api.delegation.drip, { today });

  if (d === undefined)
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-48" />
        ))}
      </div>
    );

  if (d.entries === 0)
    return (
      <EmptyHint
        icon={Grid2x2}
        title="Your DRIP matrix fills from the time audit"
        hint="Log what you do for a few days — rated $ to $$$$ and energizing or draining — and every block lands in one of four quadrants."
        action={
          <button onClick={onGoAudit} className={buttonVariants()}>
            Start the time audit
          </button>
        }
      />
    );

  const byKey = new Map(d.quadrants.map((q) => [q.key, q]));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{d.energizingPct}% of your logged time energizes you</p>
            <p className="text-xs text-muted-foreground">EOS&apos;s Delegate &amp; Elevate suggests getting ~80% of your work into the energizing quadrants.</p>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">{fmtMin(d.totalMin)} logged · last 14 days</span>
        </div>
        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
          {(["production", "investment", "replacement", "delegation"] as Quadrant[]).map((k) => {
            const q = byKey.get(k)!;
            return q.pct > 0 ? (
              <span key={k} title={`${QUADRANTS[k].label} ${q.pct}%`} className="h-full border-r-2 border-card last:border-r-0" style={{ width: `${q.pct}%`, background: QUADRANTS[k].color }} />
            ) : null;
          })}
        </div>
      </div>

      <div>
        <div className="mb-1.5 grid grid-cols-2 gap-3 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>Draining</span>
          <span>Energizing</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {LAYOUT.map((k, i) => {
            const q = byKey.get(k)!;
            const meta = QUADRANTS[k];
            return (
              <div key={k} className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
                <span className="h-1 w-full" style={{ background: meta.color }} />
                <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{meta.label}</p>
                      <p className="text-[11px] text-muted-foreground">{i < 2 ? "High $" : "Low $"} · {meta.short.split(" · ")[1]}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold tabular-nums leading-none sm:text-xl">{(q.minutes / 60).toFixed(1)}h</p>
                      <p className="text-[11px] tabular-nums text-muted-foreground">{q.pct}%</p>
                    </div>
                  </div>
                  <p className="mt-2 hidden text-xs text-muted-foreground sm:block">
                    {meta.hint} <span className="font-medium text-foreground">{meta.action}.</span>
                  </p>
                  <ul className="mt-2 space-y-1">
                    {q.activities.slice(0, 5).map((a) => {
                      const E = ENERGY[a.energy];
                      return (
                        <li key={a.activity} className="flex items-center gap-1.5 text-xs">
                          <span className="min-w-0 flex-1 truncate" title={a.activity}>
                            {a.activity}
                          </span>
                          <span className="hidden shrink-0 font-semibold text-muted-foreground sm:inline">{VALUE_LABEL[a.value]}</span>
                          <E.icon className={cn("hidden h-3 w-3 shrink-0 sm:block", E.cls)} />
                          <span className="shrink-0 tabular-nums text-muted-foreground">{fmtMin(a.minutes)}</span>
                        </li>
                      );
                    })}
                    {q.activities.length === 0 && <li className="text-xs text-muted-foreground">Nothing here yet.</li>}
                    {q.activities.length > 5 && <li className="text-[11px] text-muted-foreground">+{q.activities.length - 5} more</li>}
                  </ul>
                  {(k === "delegation" || k === "replacement") && q.activities[0] && (
                    <button
                      onClick={() => onDelegate(q.activities[0].activity)}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 h-7 self-start px-2 text-xs")}
                    >
                      Write SOP: {q.activities[0].activity.length > 16 ? q.activities[0].activity.slice(0, 16) + "…" : q.activities[0].activity}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
