"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Flame,
  Trophy,
  CalendarCheck,
  Gauge,
  Check,
  Trash2,
  Pencil,
  ArrowUpRight,
} from "lucide-react";
import { Topbar, StatCard, Modal } from "@/components/ui";
import { DetailSkeleton } from "@/components/Skeleton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AddToMomentum } from "@/components/momentum/AddToMomentum";
import { BarChart } from "@/components/Chart";
import { cn } from "@/lib/utils";

type Frequency = "daily" | "weekly" | "custom";
const HEAT_WEEKS = 26;
const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** GitHub-style grid: HEAT_WEEKS columns of 7 days (Sun→Sat), ending this week. */
function buildHeat(doneSet: Set<string>) {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const gridEnd = new Date(end);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - gridEnd.getUTCDay())); // Saturday
  const start = new Date(gridEnd);
  start.setUTCDate(start.getUTCDate() - (HEAT_WEEKS * 7 - 1));
  start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // back to Sunday
  const todayStr = ymd(end);

  const weeks: { date: string; done: boolean; future: boolean }[][] = [];
  const cur = new Date(start);
  while (cur <= gridEnd) {
    const week: { date: string; done: boolean; future: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const ds = ymd(cur);
      week.push({ date: ds, done: doneSet.has(ds), future: ds > todayStr });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export default function HabitDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"habits">;
  const router = useRouter();

  const data = useQuery(api.habits.detail, { id });
  const areas = useQuery(api.lifeAreas.list);
  const sections = useQuery(api.sections.list, {});
  const update = useMutation(api.habits.update);
  const toggleToday = useMutation(api.habits.toggleToday);
  const toggleDate = useMutation(api.habits.toggleDate);
  const removeHabit = useMutation(api.habits.remove);

  const [editOpen, setEditOpen] = useState(false);

  if (data === undefined)
    return (
      <div>
        <Topbar />
        <DetailSkeleton />
      </div>
    );
  if (data === null)
    return (
      <div>
        <Topbar />
        <div className="px-8 py-7">
          <p className="text-sm text-muted-foreground">Habit not found.</p>
        </div>
      </div>
    );

  const { habit } = data;
  const areaName = areas?.find((a) => a._id === habit.lifeAreaId)?.name;
  const sectionName = sections?.find((s) => s._id === habit.sectionId)?.name;
  const weeks = buildHeat(new Set(data.completedDates));
  const monthData = data.monthly.map((m) => ({
    label: m.label,
    segments: [{ name: "Completions", value: m.count, color: "#9AEA3E" }],
  }));

  return (
    <div>
      <Topbar />
      <div className="px-4 py-7 sm:px-8">
        <Breadcrumb
          items={[{ label: "Habits", href: "/habits" }, { label: habit.title }]}
        />

        {/* Header */}
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link
              href={`/life-areas/${habit.lifeAreaId}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              {areaName}
              {sectionName ? ` · ${sectionName}` : ""}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
            <input
              defaultValue={habit.title}
              onBlur={(e) =>
                e.target.value.trim() &&
                e.target.value !== habit.title &&
                update({ id, title: e.target.value.trim() })
              }
              className="mt-1 w-full bg-transparent text-2xl font-bold tracking-tight outline-none"
            />
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5 capitalize">{habit.frequency}</span>
              {habit.target && <span className="rounded-full bg-muted px-2 py-0.5">{habit.target}</span>}
            </div>
            {habit.description && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{habit.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <AddToMomentum type="habit" itemId={id} title={habit.title} />
            <button
              onClick={() => setEditOpen(true)}
              className="text-muted-foreground hover:text-foreground"
              title="Edit habit"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              onClick={async () => {
                await removeHabit({ id });
                router.push("/habits");
              }}
              className="text-muted-foreground hover:text-warning"
              title="Delete habit"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mark today */}
        <button
          onClick={() => void toggleToday({ id })}
          className={cn(
            "mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition",
            data.completedToday
              ? "border-primary bg-primary/15 text-primary"
              : "border-border hover:border-primary/60",
          )}
        >
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full border-2",
              data.completedToday
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40 text-transparent",
            )}
          >
            <Check className="h-4 w-4" />
          </span>
          {data.completedToday ? "Done today — nice." : "Mark done for today"}
        </button>

        {/* Stat tiles */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Current streak"
            value={`${data.currentStreak}d`}
            sub={data.currentStreak > 0 ? "keep it alive" : "start today"}
            icon={<Flame className="h-4 w-4" />}
          />
          <StatCard
            label="Best streak"
            value={`${data.bestStreak}d`}
            sub="lifetime record"
            icon={<Trophy className="h-4 w-4" />}
          />
          <StatCard
            label="Total done"
            value={`${data.total}`}
            sub={`over ${data.daysTracked} day${data.daysTracked === 1 ? "" : "s"}`}
            icon={<CalendarCheck className="h-4 w-4" />}
          />
          <StatCard
            label="Consistency"
            value={`${data.rate30}%`}
            sub="last 30 days"
            icon={<Gauge className="h-4 w-4" />}
          />
        </div>

        {/* Heatmap */}
        <div className="mt-5 rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Last 6 months</h3>
            <span className="text-xs text-muted-foreground">tap a day to edit</span>
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((cell) => (
                    <button
                      key={cell.date}
                      disabled={cell.future}
                      onClick={() => void toggleDate({ id, date: cell.date })}
                      title={cell.date}
                      className={cn(
                        "h-3.5 w-3.5 rounded-sm transition",
                        cell.future
                          ? "bg-transparent"
                          : cell.done
                            ? "bg-primary hover:brightness-110"
                            : "bg-muted hover:bg-muted-foreground/30",
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Not done</span>
            <span className="h-3 w-3 rounded-sm bg-muted" />
            <span className="h-3 w-3 rounded-sm bg-primary" />
            <span>Done</span>
            <span className="ml-auto">
              All-time consistency: <span className="font-medium text-foreground">{data.rateAll}%</span>
            </span>
          </div>
        </div>

        {/* Monthly chart */}
        <div className="mt-5 rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold">Completions per month</h3>
          <BarChart data={monthData} height={180} />
        </div>
      </div>

      {editOpen && (
        <EditHabitModal
          habit={habit}
          areas={areas}
          onClose={() => setEditOpen(false)}
          onSave={async (vals) => {
            await update({ id, ...vals });
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}

function EditHabitModal({
  habit,
  areas,
  onClose,
  onSave,
}: {
  habit: {
    title: string;
    description?: string;
    frequency: Frequency;
    target?: string;
    lifeAreaId: Id<"lifeAreas">;
  };
  areas: { _id: Id<"lifeAreas">; name: string }[] | undefined;
  onClose: () => void;
  onSave: (vals: {
    title: string;
    description: string | null;
    frequency: Frequency;
    target: string | null;
    lifeAreaId: Id<"lifeAreas">;
  }) => void;
}) {
  const [title, setTitle] = useState(habit.title);
  const [description, setDescription] = useState(habit.description ?? "");
  const [frequency, setFrequency] = useState<Frequency>(habit.frequency);
  const [target, setTarget] = useState(habit.target ?? "");
  const [areaId, setAreaId] = useState<string>(habit.lifeAreaId);

  return (
    <Modal title="Edit habit" onClose={onClose}>
      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Habit title"
          className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Why this habit matters (optional)"
          className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
        />
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Target (optional, e.g. 30 min)"
          className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
            className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="custom">Custom</option>
          </select>
          <select
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none"
          >
            {areas?.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <button
          disabled={!title.trim() || !areaId}
          onClick={() =>
            onSave({
              title: title.trim(),
              description: description.trim() || null,
              frequency,
              target: target.trim() || null,
              lifeAreaId: areaId as Id<"lifeAreas">,
            })
          }
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Save changes
        </button>
      </div>
    </Modal>
  );
}
