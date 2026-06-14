"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Flame, Check, Trash2 } from "lucide-react";
import { Card, Topbar, EmptyState, AddButton, Modal } from "@/components/ui";
import { AddToMomentum } from "@/components/momentum/AddToMomentum";
import { cn } from "@/lib/utils";

type Frequency = "daily" | "weekly" | "custom";
const WD = ["S", "M", "T", "W", "T", "F", "S"];

export default function HabitsPage() {
  const areas = useQuery(api.lifeAreas.list);
  const habits = useQuery(api.habits.list);
  const createHabit = useMutation(api.habits.create);
  const toggle = useMutation(api.habits.toggleToday).withOptimisticUpdate((store, { id }) => {
    const cur = store.getQuery(api.habits.list, {});
    if (!cur) return;
    store.setQuery(
      api.habits.list,
      {},
      cur.map((h) =>
        h._id === id
          ? {
              ...h,
              completedToday: !h.completedToday,
              streak: h.completedToday ? Math.max(0, h.streak - 1) : h.streak + 1,
            }
          : h,
      ),
    );
  });
  const removeHabit = useMutation(api.habits.remove);

  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [target, setTarget] = useState("");

  const areaName = (id: Id<"lifeAreas">) =>
    areas?.find((a) => a._id === id)?.name;

  const doneToday = habits?.filter((h) => h.completedToday).length ?? 0;

  const openAdd = () => {
    setAreaId(areas?.[0]?._id ?? "");
    setTitle("");
    setTarget("");
    setAddOpen(true);
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !areaId) return;
    void createHabit({
      title: title.trim(),
      frequency,
      lifeAreaId: areaId as Id<"lifeAreas">,
      target: target.trim() || undefined,
    });
    setTitle("");
    setTarget("");
    setAddOpen(false);
  }

  return (
    <div>
      <Topbar action={<AddButton label="New habit" onClick={openAdd} />} />
      <div className="px-4 py-7 sm:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build consistency. {habits ? `${doneToday}/${habits.length} done today.` : ""}
          </p>
        </div>

        {/* List */}
        <div className="mt-6 space-y-3">
          {habits?.length === 0 && (
            <EmptyState title="No habits yet" hint="Add your first habit above." />
          )}
          {habits?.map((h) => (
            <Card key={h._id} className="flex items-center gap-4">
              {/* toggle today */}
              <button
                onClick={() => void toggle({ id: h._id })}
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition",
                  h.completedToday
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40 text-transparent hover:border-primary",
                )}
              >
                <Check className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{h.title}</h3>
                  {h.target && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {h.target}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {areaName(h.lifeAreaId)} · {h.frequency}
                </p>
              </div>

              {/* 7-day trail */}
              <div className="hidden items-center gap-1 sm:flex">
                {h.trail.map((d, i) => (
                  <div key={d.date} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "h-6 w-6 rounded-md",
                        d.done ? "bg-primary" : "bg-muted",
                      )}
                    />
                    <span className="text-[9px] text-muted-foreground">{WD[i]}</span>
                  </div>
                ))}
              </div>

              {/* streak */}
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold",
                  h.streak > 0 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground",
                )}
              >
                <Flame className="h-4 w-4" />
                {h.streak}
              </div>

              <AddToMomentum type="habit" itemId={h._id} title={h.title} compact />

              <button
                onClick={() => void removeHabit({ id: h._id })}
                className="text-muted-foreground hover:text-warning"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      </div>

      {addOpen && (
        <Modal title="New habit" onClose={() => setAddOpen(false)}>
          <form className="space-y-3" onSubmit={submit}>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Habit (e.g. Study 30 min Copywriting)"
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
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
                <option value="">Life area…</option>
                {areas?.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              disabled={!title.trim() || !areaId}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Add habit
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
