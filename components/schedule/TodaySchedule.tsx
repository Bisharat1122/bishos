"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Check, CalendarRange, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui";
import { ymdLocal } from "./ScheduleBlockModal";
import { cn } from "@/lib/utils";
import { useTz } from "@/components/direction/util";

const minToLabel = (m: number) => {
  let h = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h < 12 ? "AM" : "PM";
  h = h % 12 === 0 ? 12 : h % 12;
  return mm ? `${h}:${String(mm).padStart(2, "0")} ${ap}` : `${h} ${ap}`;
};

/** Today's schedule with quick done-toggles. Used on the check-in & dashboard. */
export function TodaySchedule({ className }: { className?: string }) {
  const today = ymdLocal(new Date());
  const tz = useTz();
  const blocks = useQuery(api.schedule.day, { date: today });
  const setStatus = useMutation(api.schedule.setStatus).withOptimisticUpdate((store, { id, status }) => {
    const cur = store.getQuery(api.schedule.day, { date: today });
    if (!cur) return;
    store.setQuery(api.schedule.day, { date: today }, cur.map((b) => (b._id === id ? { ...b, status } : b)));
  });
  const areas = useQuery(api.lifeAreas.list);
  const areaName = (id?: string) => areas?.find((a) => a._id === id)?.name;

  return (
    <Card className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <CalendarRange className="h-4 w-4 text-primary" /> Today&apos;s schedule
        </h2>
        <Link href="/schedule" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          Open <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {blocks && blocks.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nothing scheduled.{" "}
          <Link href="/schedule" className="text-primary hover:underline">Plan your day →</Link>
        </p>
      )}

      <div className="space-y-1.5">
        {blocks?.map((b) => {
          const done = b.status === "done";
          return (
            <div
              key={b._id}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2",
                done ? "border-primary/40 bg-primary/5" : b.status === "skipped" ? "border-border bg-muted/20 opacity-60" : "border-border bg-muted/20",
              )}
            >
              <button
                onClick={() => void setStatus({ id: b._id, status: done ? "planned" : "done", tz }).catch(() => {})}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition",
                  done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 text-transparent hover:border-primary",
                )}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm", done && "text-muted-foreground line-through")}>{b.title}</p>
                <p className="text-xs text-muted-foreground">
                  {minToLabel(b.startMin)}–{minToLabel(b.endMin)}
                  {areaName(b.lifeAreaId) ? ` · ${areaName(b.lifeAreaId)}` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
