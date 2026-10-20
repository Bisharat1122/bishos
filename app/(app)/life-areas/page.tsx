"use client";

import { useMemo, useState } from "react";
import { useTz } from "@/components/direction/util";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Trash2, ArrowUpRight, Layers, Plus, Archive, ArchiveRestore, Wand2 } from "lucide-react";
import { PageShell, Section, InlineEdit, Chip, Bar, Dialog, EmptyHint, areaColor, cn, buttonVariants, inputClass, toneForPct } from "@/components/os/kit";
import { toast, errorMessage } from "@/components/os/celebrate";
import { mondayOf, useToday } from "@/lib/day";

/** Life Areas — the spine. Each area: a standard, a weekly hour budget, sections. */
export default function LifeAreasPage() {
  const today = useToday();
  const weekStart = mondayOf(today);
  const tz = useTz();
  const areas = useQuery(api.lifeAreas.list);
  // Same hours maths as the area hub + Focus page (focus sessions + done
  // blocks; a session without an area is attributed via its task / project).
  const hoursData = useQuery(api.weekPlans.hoursByArea, { weekStart, tz });
  const hours = useMemo(
    () => (hoursData ? Object.fromEntries(hoursData.rows.map((r) => [r.areaId, r.actualH])) as Record<string, number> : undefined),
    [hoursData],
  );
  const unassignedH = hours?.none ?? 0;
  const sections = useQuery(api.sections.list, {});
  const createArea = useMutation(api.lifeAreas.create);
  const updateArea = useMutation(api.lifeAreas.update);
  const removeArea = useMutation(api.lifeAreas.remove);
  const createSection = useMutation(api.sections.create);
  const removeSection = useMutation(api.sections.remove);

  const [addOpen, setAddOpen] = useState(false);
  const [newArea, setNewArea] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: Id<"lifeAreas">; name: string } | null>(null);
  const [sectionDraft, setSectionDraft] = useState<Record<string, string>>({});
  const [showArchived, setShowArchived] = useState(false);

  const sorted = (areas ?? []).slice().sort((a, b) => a.order - b.order);
  const visible = sorted.filter((a) => showArchived || !a.archived);
  const totalTarget = visible.filter((a) => !a.archived).reduce((s, a) => s + (a.weeklyHoursTarget ?? 0), 0);
  const totalActual = visible.filter((a) => !a.archived).reduce((s, a) => s + (hours?.[a._id] ?? 0), 0);

  return (
    <PageShell
      title="Life Areas"
      icon={Layers}
      subtitle="The spine of your Life OS. Every goal, project, habit and hour belongs to one area. Each area has a standard — what 'maintained' looks like."
      actions={
        <>
          <Link href="/today?setup=1" className={buttonVariants({ variant: "outline" })}>
            <Wand2 /> Setup wizard
          </Link>
          <button
            onClick={() => {
              setNewArea("");
              setAddOpen(true);
            }}
            className={buttonVariants()}
          >
            <Plus /> New area
          </button>
        </>
      }
    >
      {areas && areas.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-card">
          <p className="text-sm">
            <b className="tabular-nums">{totalActual.toFixed(1)}h</b> <span className="text-muted-foreground">attributed to areas this week</span>
            {unassignedH > 0 && <span className="text-muted-foreground"> · {unassignedH.toFixed(1)}h unassigned</span>}
            {totalTarget > 0 && (
              <>
                {" "}
                <span className="text-muted-foreground">· budget</span> <b className="tabular-nums">{totalTarget}h</b>
              </>
            )}
          </p>
          <button onClick={() => setShowArchived((s) => !s)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            {showArchived ? "Hide archived" : "Show archived"}
          </button>
        </div>
      )}

      {areas === undefined ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="skeleton h-56" />
          <div className="skeleton h-56" />
          <div className="skeleton h-56" />
        </div>
      ) : areas.length === 0 ? (
        <EmptyHint
          icon={Layers}
          title="No life areas yet"
          hint="Start with the setup wizard — it creates Company Operations, Sales & Marketing, Learning & Content and Fitness with sensible standards."
          action={
            <Link href="/today?setup=1" className={buttonVariants({ size: "sm" })}>
              <Wand2 /> Run setup
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((area, idx) => {
            const areaSections = sections?.filter((s) => s.lifeAreaId === area._id) ?? [];
            const h = hours?.[area._id] ?? 0;
            const target = area.weeklyHoursTarget ?? 0;
            const pct = target ? (h / target) * 100 : 0;
            const color = areaColor(area, idx);
            return (
              <Section key={area._id} className={cn(area.archived && "opacity-60")}>
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/life-areas/${area._id}`} className="group flex min-w-0 items-center gap-2.5">
                    <span className="size-3 shrink-0 rounded-full" style={{ background: color }} />
                    <span className="truncate font-semibold group-hover:underline">{area.name}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 opacity-0 transition group-hover:opacity-100" />
                  </Link>
                  <div className="flex shrink-0 items-center gap-1">
                    {area.kind && <Chip tone={area.kind === "business" ? "info" : "secondary"}>{area.kind}</Chip>}
                    <button
                      onClick={() => void updateArea({ id: area._id, archived: !area.archived })}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      title={area.archived ? "Restore" : "Archive"}
                    >
                      {area.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setConfirmDelete({ id: area._id, name: area.name })} className="rounded p-1 text-muted-foreground hover:text-danger" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Standard</p>
                  <InlineEdit
                    value={area.standard ?? ""}
                    placeholder="What does 'maintained' look like? e.g. Clients delivered on time; invoices sent every Friday."
                    onSave={(v) => void updateArea({ id: area._id, standard: v })}
                    multiline
                    className="text-sm"
                  />
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">This week</span>
                    <span className="flex items-center gap-1 tabular-nums">
                      <b>{h.toFixed(1)}h</b>
                      <span className="text-muted-foreground">of</span>
                      <input
                        type="number"
                        min={0}
                        max={80}
                        defaultValue={target || ""}
                        placeholder="—"
                        onBlur={(e) => {
                          const n = e.target.value === "" ? null : Number(e.target.value);
                          if (n !== (area.weeklyHoursTarget ?? null)) void updateArea({ id: area._id, weeklyHoursTarget: n }).then(() => toast("Budget saved", { tone: "success" }));
                        }}
                        className={cn(inputClass, "h-6 w-12 px-1 text-right text-xs")}
                        aria-label="Weekly hour budget"
                      />
                      <span className="text-muted-foreground">h</span>
                    </span>
                  </div>
                  <Bar value={pct} color={target ? undefined : color} tone={target ? toneForPct(pct) : "primary"} />
                </div>

                <div className="mt-4 space-y-1.5">
                  {areaSections.map((s) => (
                    <div key={s._id} className="group flex items-center justify-between rounded-lg bg-muted/40 px-3 py-1.5 text-sm">
                      <Link href={`/life-areas/${area._id}/sections/${s._id}`} className="truncate hover:underline">
                        {s.name}
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Delete section “${s.name}”? Its tasks and notes stay in ${area.name}.`))
                            void removeSection({ id: s._id }).catch((e) => toast(errorMessage(e), { tone: "warning" }));
                        }}
                        aria-label={`Delete section ${s.name}`}
                        className="text-muted-foreground opacity-0 transition hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = sectionDraft[area._id]?.trim();
                    if (!val) return;
                    void createSection({ lifeAreaId: area._id as Id<"lifeAreas">, name: val }).catch((err) => toast(errorMessage(err), { tone: "warning" }));
                    setSectionDraft((d) => ({ ...d, [area._id]: "" }));
                  }}
                >
                  <input
                    value={sectionDraft[area._id] ?? ""}
                    onChange={(e) => setSectionDraft((d) => ({ ...d, [area._id]: e.target.value }))}
                    placeholder="Add section…"
                    className={cn(inputClass, "h-8 flex-1 text-xs")}
                  />
                  <button className={buttonVariants({ variant: "secondary", size: "sm" })}>Add</button>
                </form>
              </Section>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="New life area" size="sm">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newArea.trim()) return;
            void createArea({ name: newArea.trim() })
              .then(() => toast("Life area added", { tone: "success" }))
              .catch((err) => toast(errorMessage(err), { tone: "warning" }));
            setNewArea("");
            setAddOpen(false);
          }}
        >
          <input autoFocus value={newArea} onChange={(e) => setNewArea(e.target.value)} placeholder="e.g. Fitness" className={cn(inputClass, "h-10 w-full")} />
          <button disabled={!newArea.trim()} className={cn(buttonVariants(), "w-full")}>
            Add life area
          </button>
        </form>
      </Dialog>

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={`Delete “${confirmDelete?.name}”?`} size="sm">
        <p className="text-sm text-muted-foreground">
          This removes the area and its sections; notes inside it stay but lose their area. An area that still has tasks, projects, goals or habits can&apos;t be deleted — archive it instead.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => {
              if (confirmDelete) void updateArea({ id: confirmDelete.id, archived: true });
              setConfirmDelete(null);
            }}
            className={buttonVariants({ variant: "outline" })}
          >
            <Archive /> Archive instead
          </button>
          <button
            onClick={() => {
              if (confirmDelete) void removeArea({ id: confirmDelete.id }).catch((err) => toast(errorMessage(err), { tone: "warning" }));
              setConfirmDelete(null);
            }}
            className={buttonVariants({ variant: "destructive" })}
          >
            Delete
          </button>
        </div>
      </Dialog>
    </PageShell>
  );
}
