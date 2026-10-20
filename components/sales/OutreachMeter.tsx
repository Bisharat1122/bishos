"use client";

/**
 * Today's outreach quota + "open to goal" meetings meter.
 * Reusable on Today / Founder HQ:  <OutreachMeter />  or  <OutreachMeter compact />
 */

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CalendarCheck, PartyPopper, Settings2, UserPlus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Bar, Field, Ring, TextInput, buttonVariants, cn, toneForPct } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { useToday } from "@/lib/day";
import { LogTouchButton, LogTouchDialog } from "./LogTouch";
import { errMsg } from "./meta";
import { Portal } from "./Portal";

function QuotaEditor({ quota, goal, onClose }: { quota: number; goal: number; onClose: () => void }) {
  const update = useMutation(api.settings.update);
  const [q, setQ] = useState(String(quota));
  const [g, setG] = useState(String(goal));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (ref.current && !ref.current.contains(t) && !t.closest?.("[data-quota-toggle]")) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);
  const save = async () => {
    try {
      await update({ outreachQuota: Math.max(0, Math.round(Number(q) || 0)), meetingsGoal: Math.max(0, Math.round(Number(g) || 0)) });
      toast("Sales targets updated", { tone: "success" });
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  };
  return (
    <div ref={ref} className="os-pop absolute right-0 top-[calc(100%+6px)] z-40 w-64 space-y-3 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-raised">
      <Field label="Daily outreach touches" hint="20–30 during heavy delivery weeks">
        <TextInput type="number" min={0} value={q} onChange={(e) => setQ(e.target.value)} />
      </Field>
      <Field label="Meetings goal (open to goal)" hint="Stop prospecting once this many are booked">
        <TextInput type="number" min={0} value={g} onChange={(e) => setG(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Cancel
        </button>
        <button onClick={() => void save()} className={buttonVariants({ size: "sm" })}>
          Save
        </button>
      </div>
    </div>
  );
}

export function OutreachMeter({ compact, className }: { compact?: boolean; className?: string }) {
  const today = useToday();
  const day = useQuery(api.people.outreachToday, { today });
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState(false);

  if (day === undefined) return <div className={cn("skeleton", compact ? "h-16" : "h-28", className)} />;

  const pct = day.quota > 0 ? Math.min(100, (day.outreach / day.quota) * 100) : 0;
  const tone = day.quotaHit ? "success" : toneForPct(pct) === "danger" ? "primary" : toneForPct(pct);
  const meetPct = day.meetingsGoal > 0 ? Math.min(100, (day.meetings / day.meetingsGoal) * 100) : 0;

  return (
    <div className={cn("relative rounded-xl border border-border bg-card p-3 shadow-card sm:p-4", className)}>
      <div className="flex items-center gap-3">
        <Ring value={pct} size={compact ? 46 : 58} stroke={compact ? 5 : 6} tone={tone}>
          <span className="text-xs font-semibold tabular-nums">
            {day.outreach}
            <span className="text-muted-foreground">/{day.quota}</span>
          </span>
        </Ring>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">Outreach today</p>
            <button
              data-quota-toggle
              onClick={() => setEditing((x) => !x)}
              aria-label="Adjust sales targets"
              title="Adjust quota & meetings goal"
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-7 text-muted-foreground")}
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {day.quotaHit ? "Quota done. Anything more is a bonus." : `${Math.max(0, day.quota - day.outreach)} to go · outreach + follow-ups`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <LogTouchButton quick="outreach" variant="default" size="sm" label="+1 touch" className="h-7 px-2.5" />
            <button onClick={() => setDialog(true)} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 px-2.5")}>
              <UserPlus className="h-3.5 w-3.5" />
              <span>With person</span>
            </button>
          </div>
        </div>
      </div>

      {!compact && day.meetingsGoal > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          {day.goalHit ? (
            <div className="os-pop flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-xs font-medium text-success">
              <PartyPopper className="h-4 w-4 shrink-0" />
              Goal hit — you can stop prospecting today
            </div>
          ) : (
            <>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" /> Meetings booked
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {day.meetings}/{day.meetingsGoal}
                </span>
              </div>
              <Bar value={meetPct} tone="info" />
            </>
          )}
        </div>
      )}
      {compact && day.goalHit && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success">
          <PartyPopper className="h-3.5 w-3.5" /> Goal hit — you can stop prospecting today
        </p>
      )}

      {editing && <QuotaEditor quota={day.quota} goal={day.meetingsGoal} onClose={() => setEditing(false)} />}
      {dialog && (
        <Portal>
          <LogTouchDialog open onClose={() => setDialog(false)} defaultKind="outreach" />
        </Portal>
      )}
    </div>
  );
}
