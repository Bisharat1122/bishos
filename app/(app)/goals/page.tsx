"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowUpRight } from "lucide-react";
import { Topbar, EmptyState, AddButton, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";

type Timeframe = "weekly" | "monthly" | "yearly" | "custom";

const TF_META: Record<Timeframe, string> = {
  weekly: "bg-accent/15 text-accent",
  monthly: "bg-primary/15 text-primary",
  yearly: "bg-warning/15 text-warning",
  custom: "bg-muted text-muted-foreground",
};

export default function GoalsPage() {
  const areas = useQuery(api.lifeAreas.list);
  const goals = useQuery(api.goals.list);
  const projects = useQuery(api.projects.list);
  const createGoal = useMutation(api.goals.create);

  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");

  const areaName = (id: Id<"lifeAreas">) =>
    areas?.find((a) => a._id === id)?.name;

  // Optional project → life area inherits from it.
  const chosenProject = projects?.find((p) => p._id === projectId);
  const effectiveAreaId = chosenProject ? chosenProject.lifeAreaId : (areaId as Id<"lifeAreas"> | "");

  const openAdd = () => {
    setProjectId("");
    setAreaId(areas?.[0]?._id ?? "");
    setTitle("");
    setAddOpen(true);
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !effectiveAreaId) return;
    void createGoal({
      title: title.trim(),
      lifeAreaId: effectiveAreaId as Id<"lifeAreas">,
      projectId: projectId ? (projectId as Id<"projects">) : undefined,
      timeframe,
    });
    setTitle("");
    setAddOpen(false);
  }

  return (
    <div>
      <Topbar action={<AddButton label="New goal" onClick={openAdd} />} />
      <div className="px-4 py-7 sm:px-8">
        <h1 className="text-2xl font-bold tracking-tight">Goals & Milestones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track progress across life areas. Click a goal to open its full page.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {goals?.length === 0 && (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState title="No goals yet" hint="Create one above." />
            </div>
          )}
          {goals?.map((g) => (
            <Link key={g._id} href={`/goals/${g._id}`}>
              <div className="group h-full rounded-2xl border border-border bg-card p-4 transition hover:border-primary/60">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{g.title}</h3>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                      TF_META[g.timeframe as Timeframe],
                    )}
                  >
                    {g.timeframe}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {areaName(g.lifeAreaId)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {g.milestoneDone}/{g.milestoneTotal} milestones
                  {g.deadline
                    ? ` · due ${new Date(g.deadline).toLocaleDateString()}`
                    : ""}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{g.progress}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {addOpen && (
        <Modal title="New goal" onClose={() => setAddOpen(false)}>
          <form className="space-y-3" onSubmit={submit}>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Goal title…"
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            />
            {/* Optional project — if set, the life area is inherited from it */}
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none"
            >
              <option value="">No project (goal stands on its own)</option>
              {projects?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              {chosenProject ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm">
                  <span className="text-xs text-muted-foreground">Life area</span>
                  <span className="font-medium">{areaName(chosenProject.lifeAreaId) ?? "—"}</span>
                </div>
              ) : (
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
              )}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <button
              disabled={!title.trim() || !effectiveAreaId}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Add goal
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
