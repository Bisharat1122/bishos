"use client";

import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { Chip, EmptyHint, cn } from "@/components/os/kit";
import { addDaysYmd, dateOf, diffDaysYmd, fmtYmd } from "@/lib/day";
import { CAMPAIGN_STATUS, type CampaignStatus } from "./lib";

export type TimelineCampaign = {
  _id: string;
  name: string;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  channels?: string[];
};

const firstOfMonth = (ymd: string) => `${ymd.slice(0, 7)}-01`;
function lastOfMonth(ymd: string) {
  const d = dateOf(firstOfMonth(ymd));
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Gantt-style view of campaigns by start/end dates, with a today marker. */
export function CampaignTimeline({ campaigns, today }: { campaigns: TimelineCampaign[]; today: string }) {
  const dated = campaigns
    .filter((c) => c.startDate)
    .map((c) => ({ ...c, start: c.startDate as string, end: c.endDate && c.endDate >= (c.startDate as string) ? c.endDate : addDaysYmd(c.startDate as string, 13), open: !c.endDate }))
    .sort((a, b) => a.start.localeCompare(b.start));
  const undated = campaigns.filter((c) => !c.startDate);

  if (!dated.length) {
    return (
      <EmptyHint
        icon={CalendarRange}
        title="No dated campaigns yet"
        hint="Give a campaign a start and end date to see it on the timeline."
      />
    );
  }

  const minStart = dated.reduce((m, c) => (c.start < m ? c.start : m), addDaysYmd(today, -21));
  const maxEnd = dated.reduce((m, c) => (c.end > m ? c.end : m), addDaysYmd(today, 45));
  const rangeStart = firstOfMonth(minStart);
  const rangeEnd = lastOfMonth(maxEnd);
  const total = diffDaysYmd(rangeStart, rangeEnd) + 1;
  const months: { key: string; label: string; left: number; width: number }[] = [];
  let m = rangeStart;
  while (m <= rangeEnd) {
    const end = lastOfMonth(m);
    months.push({
      key: m,
      label: fmtYmd(m, { month: "short", year: m.slice(0, 4) === today.slice(0, 4) ? undefined : "2-digit" }),
      left: (diffDaysYmd(rangeStart, m) / total) * 100,
      width: ((diffDaysYmd(m, end) + 1) / total) * 100,
    });
    m = addDaysYmd(end, 1);
  }
  const todayLeft = (diffDaysYmd(rangeStart, today) / total) * 100;
  const todayIn = todayLeft >= 0 && todayLeft <= 100;
  const minW = Math.max(640, months.length * 110);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card scrollbar-thin">
        <div style={{ minWidth: minW + 160 }}>
          <div className="flex border-b border-border">
            <div className="sticky left-0 z-10 w-40 shrink-0 bg-card px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Campaign</div>
            <div className="relative h-8 flex-1">
              {months.map((mo) => (
                <div
                  key={mo.key}
                  className="absolute top-0 flex h-full items-center border-l border-border px-2 text-[11px] font-medium text-muted-foreground"
                  style={{ left: `${mo.left}%`, width: `${mo.width}%` }}
                >
                  {mo.label}
                </div>
              ))}
              {todayIn && (
                <span
                  className="absolute top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 rounded bg-danger px-1 text-[9px] font-semibold uppercase text-background"
                  style={{ left: `${todayLeft}%` }}
                >
                  Today
                </span>
              )}
            </div>
          </div>
          {dated.map((c) => {
            const meta = CAMPAIGN_STATUS[c.status];
            const left = (diffDaysYmd(rangeStart, c.start) / total) * 100;
            const width = Math.max(1.2, ((diffDaysYmd(c.start, c.end) + 1) / total) * 100);
            return (
              <div key={c._id} className="flex border-b border-border last:border-b-0">
                <div className="sticky left-0 z-10 w-40 shrink-0 bg-card px-3 py-2.5">
                  <Link href={`/campaigns/${c._id}`} className="block truncate text-sm font-medium hover:underline">
                    {c.name}
                  </Link>
                  <span className="text-[11px] text-muted-foreground">{meta.label}</span>
                </div>
                <div className="relative flex-1">
                  {months.map((mo) => (
                    <div key={mo.key} className="absolute inset-y-0 border-l border-border/60" style={{ left: `${mo.left}%` }} />
                  ))}
                  {todayIn && <div className="pointer-events-none absolute inset-y-0 w-px bg-danger/70" style={{ left: `${todayLeft}%` }} aria-hidden />}
                  <Link
                    href={`/campaigns/${c._id}`}
                    title={`${c.name}: ${fmtYmd(c.start)} → ${c.open ? "no end date" : fmtYmd(c.end)}`}
                    className={cn(
                      "absolute top-1/2 flex h-7 -translate-y-1/2 items-center overflow-hidden rounded-md border px-2 text-xs font-medium transition-[filter] hover:brightness-95",
                      c.open && "border-dashed",
                    )}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      background: `color-mix(in oklab, ${meta.dot} 18%, transparent)`,
                      borderColor: meta.dot,
                    }}
                  >
                    <span className="truncate">{c.channels?.slice(0, 2).join(" · ") || c.name}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {undated.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Not scheduled</p>
          <div className="flex flex-wrap gap-2">
            {undated.map((c) => (
              <Link key={c._id} href={`/campaigns/${c._id}`} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm shadow-card hover:border-ring/60">
                {c.name} <Chip tone={CAMPAIGN_STATUS[c.status].tone} className="ml-1">{CAMPAIGN_STATUS[c.status].label}</Chip>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
