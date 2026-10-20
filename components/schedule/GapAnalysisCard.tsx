"use client";

import { useState } from "react";
import { Scale, Clock, Gauge, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Row = {
  taskId: string;
  title: string;
  area?: string;
  scheduledMin: number;
  focusMin: number;
  gapMin: number;
  blocks: number;
  sessions: number;
  adherence: number;
};

type Data = {
  rows: Row[];
  totalScheduledMin: number;
  totalFocusMin: number;
  avgGapMin: number;
  taskCount: number;
  trackedCount: number;
};

/** "1.5h", "45m", "0m" */
const fmtDur = (min: number) => {
  const a = Math.abs(Math.round(min));
  if (a < 60) return `${a}m`;
  const h = a / 60;
  return `${Math.round(h * 10) / 10}h`;
};
const signed = (min: number) => (min > 0 ? `+${fmtDur(min)}` : min < 0 ? `−${fmtDur(min)}` : "0m");

export function GapAnalysisCard({
  data,
  view,
}: {
  data: Data | undefined;
  view: string;
}) {
  const [open, setOpen] = useState(true);

  if (data === undefined) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card p-5">
        <Header />
        <div className="skeleton mt-3 h-20" />
      </div>
    );
  }

  if (data.taskCount === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card p-5">
        <Header />
        <div className="mt-3 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Link tasks to your schedule blocks and track focus on them — this card
          then shows how your planned time compares to the focus you actually put in.
        </div>
      </div>
    );
  }

  const { avgGapMin, totalScheduledMin, totalFocusMin, rows, trackedCount, taskCount } = data;
  // overall calibration verdict
  const over = avgGapMin > 4; // >4 min average → meaningfully over-scheduled
  const under = avgGapMin < -4;
  const verdict = over ? "Over-scheduled" : under ? "Under-scheduled" : "Well calibrated";
  const verdictCls = over ? "text-warning" : under ? "text-info" : "text-success";
  const VerdictIcon = over ? TrendingDown : under ? TrendingUp : Gauge;

  const max = Math.max(1, ...rows.map((r) => Math.max(r.scheduledMin, r.focusMin)));
  const shown = open ? rows.slice(0, 8) : rows.slice(0, 3);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5">
      <Header />

      {/* Headline calibration + totals */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <VerdictIcon className={cn("h-3.5 w-3.5", verdictCls)} /> Avg gap / task
          </div>
          <div className={cn("mt-1 text-2xl font-semibold tabular-nums", verdictCls)}>
            {signed(avgGapMin)}
          </div>
          <div className={cn("text-xs font-medium", verdictCls)}>{verdict}</div>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Scheduled
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{fmtDur(totalScheduledMin)}</div>
          <div className="text-xs text-muted-foreground">across {taskCount} task{taskCount === 1 ? "" : "s"}</div>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" /> Real focus
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-primary">{fmtDur(totalFocusMin)}</div>
          <div className="text-xs text-muted-foreground">{trackedCount} tracked</div>
        </div>
      </div>

      {/* Per-task gap list */}
      <div className="mt-4 space-y-2.5">
        {shown.map((r) => {
          const gOver = r.gapMin > 0;
          const gUnder = r.gapMin < 0;
          const chipCls = gOver
            ? "bg-warning-soft text-warning"
            : gUnder
              ? "bg-info-soft text-info"
              : "bg-success-soft text-success";
          return (
            <div key={r.taskId}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {[r.area, `${r.blocks} block${r.blocks === 1 ? "" : "s"}`, r.sessions ? `${r.sessions} session${r.sessions === 1 ? "" : "s"}` : "no focus tracked"]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums", chipCls)}>
                  {signed(r.gapMin)}
                </span>
              </div>
              {/* dual bars: scheduled (track) vs real focus (fill) */}
              <div className="mt-1.5 space-y-1">
                <Bar label="Plan" min={r.scheduledMin} max={max} cls="bg-muted-foreground/40" />
                <Bar label="Focus" min={r.focusMin} max={max} cls="bg-primary" />
              </div>
            </div>
          );
        })}
      </div>

      {rows.length > 3 && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {open ? "Show less" : `Show all ${Math.min(8, rows.length)} tasks`}
        </button>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Gap = scheduled − real focus over this {view}.{" "}
        <span className="text-warning">Over</span> means you blocked more than you focused (tighten the block or focus more);{" "}
        <span className="text-info">under</span> means you out-worked the plan (give it more time). Block completions aren&apos;t counted as focus.
      </p>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-2">
      <Scale className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-semibold">Schedule vs. focus gap</h3>
      <span className="text-xs text-muted-foreground">— planning accuracy per task</span>
    </div>
  );
}

function Bar({ label, min, max, cls }: { label: string; min: number; max: number; cls: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", cls)} style={{ width: `${(min / max) * 100}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">{fmtDur(min)}</span>
    </div>
  );
}
