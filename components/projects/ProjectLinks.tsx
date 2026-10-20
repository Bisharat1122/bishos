"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Target, Handshake, Building2, ArrowRight, AlertTriangle, Play, Plus, Timer, Sun, Compass, ArrowUpRight } from "lucide-react";
import { Section, Select, Field, Bar, Chip, CheckCircle, Dialog, cn, buttonVariants } from "@/components/os/kit";
import { toast, reward, errorMessage } from "@/components/os/celebrate";
import { useStable } from "@/components/os/useCockpit";
import { useFocusTimer } from "@/components/focus/FocusTimerProvider";
import { NextActionForm } from "./NextActionForm";
import { addDaysYmd, dateOf, fmtMin, mondayOf, relDay, useToday } from "@/lib/day";

type Status = "planning" | "active" | "blocked" | "completed";
const STATUS: { value: Status; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
  { value: "completed", label: "Done" },
];

/**
 * Life OS links for one project: its Life Area + status, the goal it serves
 * (≤1), the deal/company for client delivery, the next action, and focus
 * time this week. Shown at the top of /projects/[id].
 */
export function ProjectLinks({ project }: { project: Doc<"projects"> }) {
  const today = useToday();
  const weekStart = mondayOf(today);
  const args = useMemo(
    () => ({ id: project._id, weekStartMs: dateOf(weekStart).getTime(), weekEndMs: dateOf(addDaysYmd(weekStart, 7)).getTime() }),
    [project._id, weekStart],
  );
  const links = useStable(useQuery(api.projects.links, args));
  const areas = useQuery(api.lifeAreas.list);
  const update = useMutation(api.projects.update);
  const createTask = useMutation(api.tasks.create);
  const setStatus = useMutation(api.tasks.setStatus);
  const plan = useMutation(api.tasks.plan);
  const timer = useFocusTimer();
  const [addOpen, setAddOpen] = useState(false);

  const save = (patch: Parameters<typeof update>[0]) =>
    update(patch)
      .then(() => toast("Saved", { tone: "success" }))
      .catch((e) => toast(errorMessage(e), { tone: "warning" }));

  if (links === undefined)
    return (
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="skeleton h-48" />
        <div className="skeleton h-48" />
        <div className="skeleton h-48" />
      </div>
    );
  if (links === null) return null;

  const next = links.nextAction;
  const needsNext = !next && (project.status === "active" || project.status === "blocked");
  const liveAreas = (areas ?? []).filter((a) => !a.archived || a._id === project.lifeAreaId).sort((a, b) => a.order - b.order);
  const cycleGoals = links.goalOptions.filter((g) => g.level === "cycle");
  const annualGoals = links.goalOptions.filter((g) => g.level === "annual");
  const otherGoals = links.goalOptions.filter((g) => !g.level);

  return (
    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Direction: area · status · goal */}
      <Section title="Direction" icon={Compass} hint="One Life Area, at most one goal.">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Life area">
              <Select value={project.lifeAreaId} onChange={(e) => void save({ id: project._id, lifeAreaId: e.target.value as Id<"lifeAreas"> })}>
                {liveAreas.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={project.status}
                onChange={(e) => {
                  const s = e.target.value as Status;
                  void update({ id: project._id, status: s })
                    .then(() => (s === "completed" ? reward(`Project shipped: ${project.title}`, undefined, true) : toast("Saved", { tone: "success" })))
                    .catch((err) => toast(errorMessage(err), { tone: "warning" }));
                }}
              >
                {STATUS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Serves goal">
            <Select value={project.goalId ?? ""} onChange={(e) => void save({ id: project._id, goalId: (e.target.value || null) as Id<"goals"> | null })}>
              <option value="">None — maintenance project</option>
              {cycleGoals.length > 0 && (
                <optgroup label="12-week goals">
                  {cycleGoals.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.title}
                      {g.goalStatus && g.goalStatus !== "active" ? ` (${g.goalStatus})` : ""}
                    </option>
                  ))}
                </optgroup>
              )}
              {annualGoals.length > 0 && (
                <optgroup label="Annual goals">
                  {annualGoals.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.title}
                    </option>
                  ))}
                </optgroup>
              )}
              {otherGoals.length > 0 && (
                <optgroup label="Other goals">
                  {otherGoals.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.title}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
          </Field>
          {links.goal ? (
            <Link href={`/goals/${links.goal._id}`} className="block rounded-lg border border-border p-2.5 transition-colors hover:border-ring">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-1.5 font-medium">
                  <Target className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{links.goal.title}</span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </div>
              <Bar value={links.goal.progress} className="mt-2" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {links.goal.level === "cycle" ? "12-week goal" : links.goal.level === "annual" ? "Annual goal" : "Goal"} · {links.goal.progress}%
              </p>
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground">
              Most projects are maintenance — that’s fine. Link one only if finishing it moves a goal. <Link href="/goals" className="underline-offset-2 hover:underline">See goals</Link>
            </p>
          )}
        </div>
      </Section>

      {/* Next action + focus */}
      <Section
        title="Next action"
        icon={ArrowRight}
        hint={`${links.openTasks} open task${links.openTasks === 1 ? "" : "s"}`}
        action={
          <button onClick={() => setAddOpen(true)} className={buttonVariants({ variant: "ghost", size: "sm" })} aria-label="Add next action">
            <Plus /> Add
          </button>
        }
      >
        {next ? (
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5">
                <CheckCircle
                  checked={false}
                  onClick={() =>
                    void setStatus({ id: next._id as Id<"tasks">, status: "done", date: today })
                      .then(() => reward("Next action done — what’s next?"))
                      .catch((e) => toast(errorMessage(e), { tone: "warning" }))
                  }
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{next.title}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {next.status === "in_progress" && <Chip tone="info">In progress</Chip>}
                  {next.plannedFor ? <Chip tone={next.plannedFor < today ? "warning" : "muted"}>{relDay(next.plannedFor, today)}</Chip> : <Chip>No “when” yet</Chip>}
                  {next.estimateMin != null && <Chip>{fmtMin(next.estimateMin)}</Chip>}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                onClick={() =>
                  timer.startFocus({
                    type: timer.type,
                    taskId: next._id,
                    areaId: next.lifeAreaId,
                    projectId: project._id,
                    taskTitle: next.title,
                    blockType: next.energy === "high" ? "maker" : next.energy === "low" ? "manager" : undefined,
                  })
                }
                className={buttonVariants({ size: "sm" })}
              >
                <Play /> Focus
              </button>
              {next.plannedFor !== today && (
                <button
                  onClick={() =>
                    void plan({ ids: [next._id as Id<"tasks">], plannedFor: today })
                      .then(() => toast("Planned for today", { tone: "success" }))
                      .catch((e) => toast(errorMessage(e), { tone: "warning" }))
                  }
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Sun /> Do today
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddOpen(true)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-3 text-left text-sm",
              needsNext ? "border-warning/50 bg-warning-soft text-warning" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {needsNext ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
            {needsNext ? "Active but no next action — add the very next step" : "Add the first next action"}
          </button>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-sm">
          <div>
            <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Timer className="h-3 w-3" /> This week
            </p>
            <p className="mt-0.5 font-semibold tabular-nums">{fmtMin(links.focus.weekMin)}</p>
            {links.focus.makerWeekMin > 0 && <p className="text-[11px] text-muted-foreground">{fmtMin(links.focus.makerWeekMin)} deep</p>}
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">All time</p>
            <p className="mt-0.5 font-semibold tabular-nums">{fmtMin(links.focus.totalMin)}</p>
            <Link href="/focus" className="text-[11px] text-muted-foreground underline-offset-2 hover:underline">
              Open Focus
            </Link>
          </div>
        </div>
      </Section>

      {/* Client delivery: deal + company */}
      <Section title="Client" icon={Handshake} hint="For delivery projects — link the won deal or customer.">
        <div className="space-y-3">
          <Field label="Deal">
            <Select
              value={project.dealId ?? ""}
              onChange={(e) => {
                const dealId = (e.target.value || null) as Id<"deals"> | null;
                const deal = links.dealOptions.find((d) => d._id === dealId);
                void save({ id: project._id, dealId, ...(deal?.companyId && !project.companyId ? { companyId: deal.companyId } : {}) });
              }}
            >
              <option value="">No deal</option>
              {links.dealOptions.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.title} {d.stage === "won" ? "· won" : `· ${d.stage}`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Company">
            <Select value={project.companyId ?? ""} onChange={(e) => void save({ id: project._id, companyId: (e.target.value || null) as Id<"companies"> | null })}>
              <option value="">No company</option>
              {links.companyOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {c.relationship === "customer" ? " · customer" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {links.deal && (
              <Link href={`/pipeline?deal=${links.deal._id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Handshake /> Open deal
              </Link>
            )}
            {links.company && (
              <Link href={`/companies/${links.company._id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Building2 /> {links.company.name}
              </Link>
            )}
            {!links.deal && !links.company && (
              <Link href="/customers" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                See customers
              </Link>
            )}
          </div>
        </div>
      </Section>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add the next action" size="sm">
        <NextActionForm
          project={project}
          onCreate={async (title, when) => {
            try {
              await createTask({
                title,
                priority: "med",
                lifeAreaId: project.lifeAreaId,
                projectId: project._id,
                goalId: project.goalId,
                plannedFor: when === "today" ? today : when === "tomorrow" ? addDaysYmd(today, 1) : undefined,
              });
              toast("Next action added", { tone: "success" });
              setAddOpen(false);
            } catch (e) {
              toast(errorMessage(e), { tone: "warning" });
            }
          }}
        />
      </Dialog>
    </div>
  );
}
