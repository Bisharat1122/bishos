"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { BookOpen, Columns3, List, Plus, Search, AlertTriangle } from "lucide-react";
import { EmptyHint, Kanban, PageShell, Segmented, Select, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { FinishResourceDialog, ResourceCard, ResourceCreateDialog, ResourceDrawer, ResourceRow, Stars } from "@/components/mind/Resources";
import { RESOURCE_FORMATS, RESOURCE_STATUSES, ResourceStatus, errMsg, formatMeta } from "@/components/mind/meta";

type View = "board" | "list";

export default function LibraryPage() {
  const rows = useQuery(api.resources.list, {});
  const areas = useQuery(api.learning.listAreasLite);
  const setStatus = useMutation(api.resources.setStatus);
  const [view, setView] = useState<View>("board");
  const [area, setArea] = useState("");
  const [format, setFormat] = useState("");
  const [showDropped, setShowDropped] = useState(false);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<Id<"resources"> | null>(null);
  const [finishing, setFinishing] = useState<ResourceRow | null>(null);

  const filtered = useMemo(
    () =>
      (rows ?? []).filter((r) => {
        if (area === "none" ? r.learningAreaId : area && r.learningAreaId !== area) return false;
        if (format && r.format !== format) return false;
        if (q.trim()) {
          const s = q.toLowerCase();
          if (![r.title, r.author ?? "", r.whySaved, r.takeaways ?? ""].some((x) => x.toLowerCase().includes(s))) return false;
        }
        return true;
      }),
    [rows, area, format, q],
  );
  const visible = filtered.filter((r) => showDropped || r.status !== "dropped");
  const open = rows?.find((r) => r._id === openId) ?? null;

  // Active per area (for the "max 2" nudge).
  const activeByArea = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) if (r.status === "active") m.set(r.learningAreaId ?? "none", (m.get(r.learningAreaId ?? "none") ?? 0) + 1);
    return m;
  }, [rows]);
  const overloaded = [...activeByArea.entries()].filter(([k, n]) => k !== "none" && n > 2);

  async function move(r: ResourceRow, to: ResourceStatus) {
    try {
      const res = await setStatus({ id: r._id, status: to });
      if (res.warn) toast(`${res.activeInArea} active in ${r.areaName ?? "this area"} — finishing 1–2 at a time works better`, { tone: "warning" });
      if (to === "done") setFinishing({ ...r, status: "done" });
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  }

  const columns = RESOURCE_STATUSES.filter((s) => s.value !== "dropped" || showDropped).map((s) => ({
    key: s.value,
    label: s.label,
    hint: s.hint,
    dot: s.dot,
  }));

  const counts = {
    queued: filtered.filter((r) => r.status === "queued").length,
    active: filtered.filter((r) => r.status === "active").length,
    done: filtered.filter((r) => r.status === "done").length,
  };

  return (
    <PageShell
      title="Library"
      icon={BookOpen}
      subtitle="Your learning queue. Save with a reason, keep 1–2 active per area, finish with takeaways — then recall them."
      actions={
        <>
          <Segmented<View>
            value={view}
            onChange={setView}
            options={[
              { value: "board", label: "Board", icon: Columns3 },
              { value: "list", label: "List", icon: List },
            ]}
          />
          <button onClick={() => setCreating(true)} className={buttonVariants()}>
            <Plus /> Resource
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, why, takeaways…" className="h-8 pl-8 text-xs" />
          </div>
          <Select value={area} onChange={(e) => setArea(e.target.value)} className="h-8 w-auto min-w-[150px] text-xs">
            <option value="">All learning areas</option>
            <option value="none">No area</option>
            {areas?.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </Select>
          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 text-xs">
            <input type="checkbox" checked={showDropped} onChange={(e) => setShowDropped(e.target.checked)} className="size-3.5 accent-[var(--primary)]" />
            Show dropped
          </label>
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin">
          <FormatChip active={!format} onClick={() => setFormat("")} label="All formats" />
          {RESOURCE_FORMATS.map((f) => {
            const n = (rows ?? []).filter((r) => r.format === f.value).length;
            if (!n && format !== f.value) return null;
            return <FormatChip key={f.value} active={format === f.value} onClick={() => setFormat(format === f.value ? "" : f.value)} label={`${f.label} ${n}`} icon={f.icon} />;
          })}
        </div>

        {overloaded.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {overloaded
              .map(([k, n]) => `${areas?.find((a) => a._id === k)?.name ?? "An area"} has ${n} active`)
              .join(" · ")}
            <span className="text-warning/80">— finish or drop one; 1–2 at a time gets things finished.</span>
          </div>
        )}

        {rows === undefined ? (
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-72 w-72 shrink-0" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyHint
            icon={BookOpen}
            title="Your library is empty"
            hint="Save books, courses, videos and articles here — each with a line on why. Saving isn't learning; finishing with takeaways and recalling them is."
            action={
              <button onClick={() => setCreating(true)} className={buttonVariants()}>
                <Plus /> Save a resource
              </button>
            }
          />
        ) : view === "board" ? (
          <Kanban<ResourceRow>
            columns={columns}
            items={visible}
            columnOf={(r) => r.status}
            onMove={(r, to) => void move(r, to as ResourceStatus)}
            renderCard={(r) => <ResourceCard r={r} onOpen={() => setOpenId(r._id)} />}
            footer={(col) =>
              col.key === "queued" ? (
                <button onClick={() => setCreating(true)} className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Why saved</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Nothing matches these filters.
                    </td>
                  </tr>
                )}
                {visible.map((r) => {
                  const F = formatMeta(r.format).icon;
                  return (
                    <tr key={r._id} onClick={() => setOpenId(r._id)} className={cn("cursor-pointer border-b border-border last:border-0 hover:bg-muted/50", r.status === "dropped" && "opacity-60")}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-medium">
                          <F className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="line-clamp-1">{r.title}</span>
                        </div>
                        {r.author && <div className="pl-6 text-xs text-muted-foreground">{r.author}</div>}
                      </td>
                      <td className="max-w-[280px] px-4 py-3 text-xs italic text-muted-foreground">
                        <span className="line-clamp-2">{r.whySaved}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">{r.areaName ?? "—"}</td>
                      <td className="px-4 py-3 text-xs tabular-nums">{r.status === "done" ? r.rating ? <Stars value={r.rating} size="sm" /> : "Done" : `${r.progress ?? 0}%`}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={r.status}
                          onChange={(e) => void move(r, e.target.value as ResourceStatus)}
                          className="h-7 rounded-md border border-input bg-card px-1.5 text-xs outline-none focus-visible:border-ring"
                          aria-label="Status"
                        >
                          {RESOURCE_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rows && rows.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {counts.queued} queued · {counts.active} active · {counts.done} done
            {view === "board" ? " · drag cards between columns" : ""}
          </p>
        )}
      </div>

      <ResourceCreateDialog open={creating} onClose={() => setCreating(false)} learningAreaId={area && area !== "none" ? (area as Id<"learningAreas">) : undefined} />
      <ResourceDrawer resource={open} onClose={() => setOpenId(null)} onFinish={(r) => setFinishing(r)} />
      <FinishResourceDialog resource={finishing} onClose={() => setFinishing(null)} />
    </PageShell>
  );
}

function FormatChip({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string; icon?: typeof BookOpen }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition",
        active ? "border-ring bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
