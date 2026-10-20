"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Rocket, Plus, X, Layers, CalendarDays, Trash2, Target } from "lucide-react";
import { Topbar, EmptyState, AddButton, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/variants";
import { toast, errorMessage } from "@/components/os/celebrate";

type KpiType = "number" | "checkbox" | "text";

export default function ChallengesPage() {
  const challenges = useQuery(api.challenges.list);
  const [creating, setCreating] = useState(false);

  const active = challenges?.filter((c) => c.status === "active") ?? [];
  const past = challenges?.filter((c) => c.status !== "active") ?? [];

  return (
    <div>
      <Topbar action={<AddButton label="New Challenge" onClick={() => setCreating(true)} />} />
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Challenges</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A workspace per goal — split into sections, logged day by day.
        </p>

        {challenges === undefined ? (
          <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-card shadow-card" />)}
          </div>
        ) : challenges.length === 0 ? (
          <div className="mt-8"><EmptyState title="No challenges yet" hint="Create your first — e.g. a 38-Day AI Agency Sprint." /></div>
        ) : (
          <>
            <Grid title="Active" items={active} />
            {past.length > 0 && <Grid title="Past" items={past} muted />}
          </>
        )}
      </div>
      {creating && <CreateModal onClose={() => setCreating(false)} />}
    </div>
  );
}

type Row = { _id: Id<"challenges">; name: string; icon?: string; outcome?: string; color?: string; status: string; sectionCount: number; dayCount: number; goalTitle?: string | null };

function Grid({ title, items, muted }: { title: string; items: Row[]; muted?: boolean }) {
  if (items.length === 0) return null;
  return (
    <>
      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((c) => (
          <Link key={c._id} href={`/challenges/${c._id}`}>
            <div
              className={cn("group h-full rounded-xl border border-border bg-card shadow-card p-4 transition hover:border-ring", muted && "opacity-75")}
              style={c.color ? { borderLeftColor: c.color, borderLeftWidth: 3 } : undefined}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sprint/10 text-lg">{c.icon || <Rocket className="h-4 w-4 text-sprint" />}</span>
                <h3 className="min-w-0 flex-1 truncate font-semibold">{c.name}</h3>
              </div>
              {c.outcome && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{c.outcome}</p>}
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {c.sectionCount} sections</span>
                <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {c.dayCount} days</span>
              </div>
              {c.goalTitle && (
                <p className="mt-2 flex items-center gap-1 truncate text-xs text-muted-foreground" title="Serves this goal">
                  <Target className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{c.goalTitle}</span>
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

type DraftSection = { name: string; kpis: { name: string; type: KpiType; unit?: string; target?: number }[] };

function CreateModal({ onClose }: { onClose: () => void }) {
  const create = useMutation(api.challenges.create);
  const habits = useQuery(api.habits.list, {});
  const router = useRouter();

  const [name, setName] = useState("");
  const [outcome, setOutcome] = useState("");
  const [icon, setIcon] = useState("");
  const [sections, setSections] = useState<DraftSection[]>([{ name: "", kpis: [] }]);
  const [habitIds, setHabitIds] = useState<Id<"habits">[]>([]);
  const [busy, setBusy] = useState(false);

  function setSection(i: number, patch: Partial<DraftSection>) {
    setSections((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function addKpi(i: number) {
    setSection(i, { kpis: [...sections[i].kpis, { name: "", type: "number" }] });
  }
  function setKpi(i: number, ki: number, patch: Partial<{ name: string; type: KpiType; unit?: string; target?: number }>) {
    setSection(i, { kpis: sections[i].kpis.map((k, idx) => (idx === ki ? { ...k, ...patch } : k)) });
  }

  async function submit() {
    const clean = sections
      .map((s) => ({ name: s.name.trim(), kpis: s.kpis.filter((k) => k.name.trim()).map((k) => ({ name: k.name.trim(), type: k.type, unit: k.unit?.trim() || undefined, target: k.target })) }))
      .filter((s) => s.name);
    if (!name.trim() || clean.length === 0 || busy) return;
    setBusy(true);
    try {
      const id = await create({
        name: name.trim(),
        outcome: outcome.trim() || undefined,
        icon: icon.trim() || undefined,
        sections: clean,
        habitIds: habitIds.length ? habitIds : undefined,
      });
      onClose();
      router.push(`/challenges/${id}`);
    } catch (e) {
      toast(errorMessage(e), { tone: "warning" });
      setBusy(false);
    }
  }
  const hasSection = sections.some((s) => s.name.trim());

  return (
    <Modal title="New challenge" onClose={onClose}>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <div className="flex gap-2">
          <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🚀" className="w-14 rounded-md border border-input bg-card shadow-xs px-3 py-2.5 text-center text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30" />
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Challenge name (e.g. 38-Day AI Agency Sprint)" className="flex-1 rounded-md border border-input bg-card shadow-xs px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30" />
        </div>
        <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={2} placeholder="Target outcome — what does winning look like?" className="w-full resize-none rounded-md border border-input bg-card shadow-xs px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30" />

        {/* Sections */}
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Sections</p>
          <div className="space-y-3">
            {sections.map((s, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <input value={s.name} onChange={(e) => setSection(i, { name: e.target.value })} placeholder={`Section ${i + 1} (e.g. Learning)`} className="flex-1 rounded-md border border-input bg-card shadow-xs px-2.5 py-2 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30" />
                  {sections.length > 1 && (
                    <button onClick={() => setSections((x) => x.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-danger"><X className="h-4 w-4" /></button>
                  )}
                </div>
                {/* KPIs */}
                {s.kpis.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {s.kpis.map((k, ki) => (
                      <div key={ki} className="flex items-center gap-1.5">
                        <input value={k.name} onChange={(e) => setKpi(i, ki, { name: e.target.value })} placeholder="KPI name (e.g. Pages read)" className="flex-1 rounded-md border border-input bg-card shadow-xs px-2 py-1.5 text-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30" />
                        <select value={k.type} onChange={(e) => setKpi(i, ki, { type: e.target.value as KpiType })} className="rounded-md border border-input bg-card shadow-xs px-1.5 py-1.5 text-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30">
                          <option value="number">number</option>
                          <option value="checkbox">yes/no</option>
                          <option value="text">text</option>
                        </select>
                        {k.type === "number" && <input value={k.unit ?? ""} onChange={(e) => setKpi(i, ki, { unit: e.target.value })} placeholder="unit" className="w-16 rounded-md border border-input bg-card shadow-xs px-2 py-1.5 text-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30" />}
                        {k.type === "number" && <input type="number" value={k.target ?? ""} onChange={(e) => setKpi(i, ki, { target: e.target.value === "" ? undefined : Number(e.target.value) })} placeholder="target" className="w-16 rounded-md border border-input bg-card shadow-xs px-2 py-1.5 text-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30" />}
                        <button onClick={() => setSection(i, { kpis: s.kpis.filter((_, idx) => idx !== ki) })} className="text-muted-foreground hover:text-danger"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => addKpi(i)} className="mt-2 flex items-center gap-1 text-xs text-sprint hover:underline"><Plus className="h-3 w-3" /> Add KPI</button>
              </div>
            ))}
          </div>
          <button onClick={() => setSections((s) => [...s, { name: "", kpis: [] }])} className="mt-2 flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-ring hover:text-foreground"><Plus className="h-3.5 w-3.5" /> Add section</button>
        </div>

        {/* Habits */}
        {(habits?.length ?? 0) > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Habits (ticked each day)</p>
            <div className="flex flex-wrap gap-1.5">
              {habits?.map((h) => {
                const on = habitIds.includes(h._id);
                return (
                  <button key={h._id} onClick={() => setHabitIds((ids) => (on ? ids.filter((x) => x !== h._id) : [...ids, h._id]))} className={cn("rounded-md border px-2.5 py-1 text-xs", on ? "border-transparent bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
                    {h.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">A Life Area named after this challenge is created automatically — all its tasks live there.</p>

        {!hasSection && <p className="text-xs text-warning">Name at least one section to create the challenge.</p>}
        <button onClick={() => void submit()} disabled={!name.trim() || !hasSection || busy} className={cn(buttonVariants(), "w-full")}>
          {busy ? "Creating…" : "Create challenge"}
        </button>
      </div>
    </Modal>
  );
}
