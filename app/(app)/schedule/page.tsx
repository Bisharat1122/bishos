"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

/** minutes-from-midnight (local) for a timestamp */
const tsMin = (ts: number) => {
  const d = new Date(ts);
  return d.getHours() * 60 + d.getMinutes();
};
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Clock, Target, Gauge } from "lucide-react";
import { Topbar, StatCard } from "@/components/ui";
import {
  startOfDay, startOfWeek, addDays, addMonths, monthMatrix, isSameDay, isToday,
  WEEKDAYS, fmtMonthYear, fmtRange, fmtDay,
} from "@/lib/date";
import { ScheduleBlockModal, ymdLocal } from "@/components/schedule/ScheduleBlockModal";
import { cn } from "@/lib/utils";

type View = "day" | "week" | "month";
const HOUR_PX = 48;
const minToLabel = (m: number) => {
  let h = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h < 12 ? "AM" : "PM";
  h = h % 12 === 0 ? 12 : h % 12;
  return mm ? `${h}:${String(mm).padStart(2, "0")} ${ap}` : `${h} ${ap}`;
};

export default function SchedulePage() {
  const router = useRouter();
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [modal, setModal] = useState<
    | { mode: "create"; date: string; startMin: number }
    | { mode: "edit"; block: Doc<"scheduleBlocks"> }
    | null
  >(null);

  // Visible render window + analytics window
  const { renderStart, renderEnd, analyticsStart, analyticsEnd, days } = useMemo(() => {
    if (view === "day") {
      const d = startOfDay(anchor);
      return { renderStart: d, renderEnd: d, analyticsStart: d, analyticsEnd: d, days: [d] };
    }
    if (view === "week") {
      const ws = startOfWeek(anchor);
      const we = addDays(ws, 6);
      return {
        renderStart: ws, renderEnd: we, analyticsStart: ws, analyticsEnd: we,
        days: Array.from({ length: 7 }, (_, i) => addDays(ws, i)),
      };
    }
    const grid = monthMatrix(anchor);
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    return { renderStart: grid[0], renderEnd: grid[41], analyticsStart: first, analyticsEnd: last, days: grid };
  }, [view, anchor]);

  const blocks = useQuery(api.schedule.range, {
    startDate: ymdLocal(renderStart),
    endDate: ymdLocal(renderEnd),
  });
  const stats = useQuery(api.schedule.analytics, {
    startDate: ymdLocal(analyticsStart),
    endDate: ymdLocal(analyticsEnd),
  });

  // resolve link names/colors
  const areas = useQuery(api.lifeAreas.list);
  const tasks = useQuery(api.tasks.list, {});
  const byDate = useMemo(() => {
    const m = new Map<string, Doc<"scheduleBlocks">[]>();
    for (const b of blocks ?? []) {
      const arr = m.get(b.date) ?? [];
      arr.push(b);
      m.set(b.date, arr);
    }
    return m;
  }, [blocks]);

  // Tasks with a scheduled start time appear on the timeline alongside blocks.
  const taskByDate = useMemo(() => {
    const m = new Map<string, Doc<"tasks">[]>();
    for (const t of tasks ?? []) {
      if (t.startAt == null) continue;
      const key = ymdLocal(new Date(t.startAt));
      const arr = m.get(key) ?? [];
      arr.push(t);
      m.set(key, arr);
    }
    return m;
  }, [tasks]);

  const areaColor = (id?: string) => areas?.find((a) => a._id === id)?.color;

  const shift = (dir: number) =>
    setAnchor((a) => (view === "month" ? addMonths(a, dir) : addDays(a, view === "week" ? dir * 7 : dir)));

  const title =
    view === "month"
      ? fmtMonthYear(anchor)
      : view === "week"
        ? fmtRange(startOfWeek(anchor), addDays(startOfWeek(anchor), 6))
        : fmtDay(anchor);

  return (
    <div>
      <Topbar
        action={
          <button
            onClick={() => setModal({ mode: "create", date: ymdLocal(anchor), startMin: 9 * 60 })}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> New block
          </button>
        }
      />
      <div className="px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Time-block your day and link it to tasks, projects, goals & life areas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-border p-0.5 text-sm">
              {(["day", "week", "month"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-full px-3 py-1 font-medium capitalize transition",
                    view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics cards */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Scheduled" value={stats ? `${stats.scheduledHours}h` : "—"} sub={`${view} plan`} icon={<Clock className="h-4 w-4" />} />
          <StatCard label="Actually focused" value={stats ? `${stats.actualHours}h` : "—"} sub="Logged this window" icon={<Gauge className="h-4 w-4" />} />
          <StatCard label="Adherence" value={stats ? `${stats.adherence}%` : "—"} sub={stats ? `${stats.done}/${stats.totalBlocks} done` : "blocks completed"} icon={<Target className="h-4 w-4" />} />
          <StatCard label="Top area" value={stats?.byArea[0]?.name ?? "—"} sub={stats?.byArea[0] ? `${stats.byArea[0].hours}h scheduled` : "by scheduled time"} icon={<CalendarDays className="h-4 w-4" />} />
        </div>

        {/* Nav */}
        <div className="mt-5 flex items-center gap-3">
          <button onClick={() => shift(-1)} className="rounded-lg border border-border p-1.5 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => setAnchor(startOfDay(new Date()))} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted">Today</button>
          <button onClick={() => shift(1)} className="rounded-lg border border-border p-1.5 hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
          <span className="ml-1 font-semibold">{title}</span>
        </div>

        {/* Calendar body */}
        <div className="mt-4">
          {view === "month" ? (
            <MonthGrid
              days={days}
              anchor={anchor}
              byDate={byDate}
              areaColor={areaColor}
              onDay={(d) => { setAnchor(d); setView("day"); }}
              onAdd={(d) => setModal({ mode: "create", date: ymdLocal(d), startMin: 9 * 60 })}
            />
          ) : (
            <Timeline
              days={days}
              byDate={byDate}
              areaColor={areaColor}
              onSlot={(date, startMin) => setModal({ mode: "create", date, startMin })}
              onBlock={(b) => setModal({ mode: "edit", block: b })}
            />
          )}
        </div>
      </div>

      {modal && (
        <ScheduleBlockModal
          init={modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );

  // ---- inner components ----
  function Timeline({
    days, byDate, areaColor, onSlot, onBlock,
  }: {
    days: Date[];
    byDate: Map<string, Doc<"scheduleBlocks">[]>;
    areaColor: (id?: string) => string | undefined;
    onSlot: (date: string, startMin: number) => void;
    onBlock: (b: Doc<"scheduleBlocks">) => void;
  }) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return (
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        {/* header */}
        <div className="flex border-b border-border">
          <div className="w-14 shrink-0" />
          {days.map((d) => (
            <div key={+d} className={cn("flex-1 border-l border-border px-2 py-2 text-center", isToday(d) && "bg-primary/5")}>
              <div className="text-xs text-muted-foreground">{WEEKDAYS[d.getDay()]}</div>
              <div className={cn("text-sm font-semibold", isToday(d) && "text-primary")}>{d.getDate()}</div>
            </div>
          ))}
        </div>
        {/* body */}
        <div className="flex max-h-[60vh] overflow-y-auto">
          {/* hour gutter */}
          <div className="w-14 shrink-0">
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_PX }} className="relative border-b border-border/40">
                <span className="absolute -top-2 right-1.5 text-[10px] text-muted-foreground">{h === 0 ? "" : minToLabel(h * 60)}</span>
              </div>
            ))}
          </div>
          {/* day columns */}
          {days.map((d) => {
            const ds = ymdLocal(d);
            const items = byDate.get(ds) ?? [];
            return (
              <div key={+d} className="relative flex-1 border-l border-border" style={{ height: 24 * HOUR_PX }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{ height: HOUR_PX }}
                    onClick={() => onSlot(ds, h * 60)}
                    className="border-b border-border/40 hover:bg-muted/30"
                  />
                ))}
                {items.map((b) => {
                  const top = (b.startMin / 60) * HOUR_PX;
                  const height = Math.max(18, ((b.endMin - b.startMin) / 60) * HOUR_PX - 2);
                  const color = areaColor(b.lifeAreaId) ?? b.color;
                  return (
                    <button
                      key={b._id}
                      onClick={(e) => { e.stopPropagation(); onBlock(b); }}
                      style={{ top, height, borderLeftColor: color ?? undefined }}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded-md border-l-[3px] px-1.5 py-0.5 text-left text-[11px] shadow-sm transition hover:brightness-110",
                        b.status === "done" ? "bg-primary/20" : b.status === "skipped" ? "bg-muted line-through opacity-60" : "bg-sprint/15",
                      )}
                    >
                      <p className="truncate font-medium">{b.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{minToLabel(b.startMin)}</p>
                    </button>
                  );
                })}
                {/* scheduled tasks (start/end time) — read-only, dashed */}
                {(taskByDate.get(ds) ?? []).map((t) => {
                  const startMin = tsMin(t.startAt!);
                  let endMin = t.dueDate ? tsMin(t.dueDate) : startMin + 30;
                  if (endMin <= startMin) endMin = startMin + 30;
                  const top = (startMin / 60) * HOUR_PX;
                  const height = Math.max(18, ((endMin - startMin) / 60) * HOUR_PX - 2);
                  return (
                    <button
                      key={t._id}
                      onClick={(e) => { e.stopPropagation(); router.push("/tasks"); }}
                      style={{ top, height }}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded-md border border-dashed border-primary/60 bg-primary/10 px-1.5 py-0.5 text-left text-[11px] transition hover:brightness-110",
                        t.status === "done" && "line-through opacity-60",
                      )}
                    >
                      <p className="truncate font-medium">{t.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{minToLabel(startMin)} · task</p>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function MonthGrid({
    days, anchor, byDate, areaColor, onDay, onAdd,
  }: {
    days: Date[];
    anchor: Date;
    byDate: Map<string, Doc<"scheduleBlocks">[]>;
    areaColor: (id?: string) => string | undefined;
    onDay: (d: Date) => void;
    onAdd: (d: Date) => void;
  }) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const ds = ymdLocal(d);
            const items = byDate.get(ds) ?? [];
            const inMonth = d.getMonth() === anchor.getMonth();
            return (
              <div
                key={+d}
                className={cn("group min-h-[96px] border-b border-l border-border p-1.5", !inMonth && "bg-muted/20")}
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onDay(d)}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      isToday(d) ? "bg-primary font-semibold text-primary-foreground" : inMonth ? "hover:bg-muted" : "text-muted-foreground",
                    )}
                  >
                    {d.getDate()}
                  </button>
                  <button onClick={() => onAdd(d)} className="opacity-0 transition group-hover:opacity-100" title="Add block">
                    <Plus className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 3).map((b) => (
                    <button
                      key={b._id}
                      onClick={() => onDay(d)}
                      style={{ borderLeftColor: areaColor(b.lifeAreaId) ?? b.color ?? undefined }}
                      className={cn(
                        "block w-full truncate rounded border-l-2 px-1 py-0.5 text-left text-[10px]",
                        b.status === "done" ? "bg-primary/15" : b.status === "skipped" ? "bg-muted line-through opacity-60" : "bg-sprint/10",
                      )}
                    >
                      {minToLabel(b.startMin)} {b.title}
                    </button>
                  ))}
                  {(taskByDate.get(ds) ?? []).slice(0, 2).map((t) => (
                    <button
                      key={t._id}
                      onClick={() => router.push("/tasks")}
                      className="block w-full truncate rounded border border-dashed border-primary/40 bg-primary/5 px-1 py-0.5 text-left text-[10px]"
                    >
                      {minToLabel(tsMin(t.startAt!))} {t.title}
                    </button>
                  ))}
                  {items.length > 3 && (
                    <button onClick={() => onDay(d)} className="px-1 text-[10px] text-muted-foreground hover:text-foreground">
                      +{items.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
