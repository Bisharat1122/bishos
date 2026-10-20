"use client";

import type { FunctionReturnType } from "convex/server";
import { AlarmClock, ArrowRight, CalendarClock, Hourglass, Moon, PauseCircle, FileText } from "lucide-react";
import type { api } from "@/convex/_generated/api";
import { Avatar, Chip, ItemCard, cn } from "@/components/os/kit";
import { relDay } from "@/lib/day";
import { fmtMoney, STAGE_META } from "./meta";

export type DealRow = FunctionReturnType<typeof api.deals.list>[number];
export type DealFlags = DealRow["flags"];

/** Warning chips: overdue next step, idle, stuck in stage, proposal open. */
export function FlagChips({ flags, max, className }: { flags: DealFlags; max?: number; className?: string }) {
  const chips: { key: string; tone: "warning" | "info"; icon: typeof Moon; text: string; title: string }[] = [];
  if (flags.noNextStep) chips.push({ key: "nn", tone: "warning", icon: AlarmClock, text: "No next step", title: "Open deals need a dated next step" });
  if (flags.overdue) chips.push({ key: "od", tone: "warning", icon: AlarmClock, text: "Overdue", title: "The next step date has passed" });
  if (flags.proposalOpen) chips.push({ key: "po", tone: "warning", icon: FileText, text: `Proposal ${flags.proposalDays}d`, title: "Proposal out 9+ days: chase or close it" });
  if (flags.stuck) chips.push({ key: "st", tone: "warning", icon: PauseCircle, text: `Stuck ${flags.stageDays}d`, title: "14+ days in this stage" });
  if (flags.idle) chips.push({ key: "id", tone: "warning", icon: Moon, text: `Idle ${flags.idleDays}d`, title: "No touch for 7+ days" });
  const shown = max ? chips.slice(0, max) : chips;
  if (!shown.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {shown.map((c) => {
        const I = c.icon;
        return (
          <Chip key={c.key} tone={c.tone} title={c.title} className="px-1.5 py-0 text-[10px]">
            <I />
            {c.text}
          </Chip>
        );
      })}
      {max && chips.length > max && <Chip tone="muted" className="px-1.5 py-0 text-[10px]">+{chips.length - max}</Chip>}
    </div>
  );
}

/** Next-step line with a date chip (overdue = warning). */
export function NextStepLine({ deal, today, className }: { deal: Pick<DealRow, "nextStep" | "nextStepDate" | "flags">; today: string; className?: string }) {
  if (!deal.nextStep && !deal.nextStepDate) return null;
  return (
    <div className={cn("flex items-start gap-1.5 text-xs", className)}>
      <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 leading-snug">{deal.nextStep || "Next step"}</span>
      {deal.nextStepDate && (
        <Chip tone={deal.flags.overdue ? "warning" : deal.flags.dueToday ? "info" : "muted"} className="px-1.5 py-0 text-[10px]">
          <CalendarClock />
          {relDay(deal.nextStepDate, today)}
        </Chip>
      )}
    </div>
  );
}

export function DealCard({ deal, today, currency, onOpen, active }: { deal: DealRow; today: string; currency: string; onOpen: () => void; active?: boolean }) {
  const who = deal.personName ?? deal.companyName;
  return (
    <ItemCard onClick={onOpen} active={active} className="space-y-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 font-medium leading-snug">{deal.title}</p>
        {deal.value ? <span className="shrink-0 text-xs font-semibold tabular-nums">{fmtMoney(deal.value, currency, true)}</span> : null}
      </div>
      {who && (
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Avatar name={who} size={18} />
          <span className="truncate">
            {deal.personName}
            {deal.personName && deal.companyName ? " · " : ""}
            {deal.companyName}
          </span>
        </div>
      )}
      {deal.flags.open && <NextStepLine deal={deal} today={today} />}
      {!deal.flags.open && deal.stage !== "won" && deal.lostReason && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Hourglass className="h-3 w-3" /> {deal.lostReason}
        </p>
      )}
      <FlagChips flags={deal.flags} max={3} />
    </ItemCard>
  );
}

export const stageDot = (s: DealRow["stage"]) => STAGE_META[s].dot;
