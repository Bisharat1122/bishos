"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Rocket, Plus, X, Trash2, Home, CalendarDays, Timer, Check, ChevronUp, ChevronDown, ChevronRight,
  BookOpen, Target, Gauge, Flame, ListChecks, Clock, Pencil, Zap, NotebookPen, Activity, Moon, Table,
} from "lucide-react";
import { Topbar, Card } from "@/components/ui";
import { Breadcrumb } from "@/components/Breadcrumb";
import { MarkdownLite } from "@/components/tasks/MarkdownLite";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { useFocusTimer } from "@/components/focus/FocusTimerProvider";
import { cn } from "@/lib/utils";

const fmtDur = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.round((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/** Local date parts → a default day name like "Saturday - 25/07/2026" + ymd. */
function todayNameAndDate() {
  const now = new Date();
  const weekday = now.toLocaleDateString(undefined, { weekday: "long" });
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return { name: `${weekday} - ${dd}/${mm}/${yyyy}`, date: `${yyyy}-${mm}-${dd}` };
}

type KpiType = "number" | "checkbox" | "text";
type StructSection = {
  _id: Id<"challengeSections">;
  name: string;
  icon?: string;
  syllabus?: string;
  goals: { _id: Id<"challengeGoals">; title: string; done: boolean }[];
  kpiDefs: { _id: Id<"challengeKpiDefs">; name: string; type: KpiType; unit?: string; target?: number }[];
};

export default function ChallengeWorkspace() {
  const { id } = useParams<{ id: string }>();
  const cid = id as Id<"challenges">;
  const challenge = useQuery(api.challenges.get, { id: cid });
  const days = useQuery(api.challengeDays.list, { challengeId: cid });
  const createDay = useMutation(api.challengeDays.create);
  const removeDay = useMutation(api.challengeDays.remove);
  const [selected, setSelected] = useState<Id<"challengeDays"> | "health" | "table" | null>(null);

  // Keep the open view in the URL (?v=…) so leaving (e.g. opening a task as a
  // full page) and coming back restores the same day/tab. Read after mount to
  // avoid a hydration mismatch.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("v");
    if (v) setSelected(v as Id<"challengeDays"> | "health" | "table");
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selected) url.searchParams.set("v", selected);
    else url.searchParams.delete("v");
    window.history.replaceState(null, "", url.toString());
  }, [selected]);

  if (challenge === undefined) {
    return <div><Topbar /><div className="px-4 py-7 sm:px-8"><div className="h-64 animate-pulse rounded-2xl border border-border bg-card" /></div></div>;
  }
  if (challenge === null) {
    return <div><Topbar /><div className="px-4 py-7 sm:px-8"><p className="text-sm text-muted-foreground">Challenge not found.</p><Link href="/challenges" className="text-sm text-sprint">← Challenges</Link></div></div>;
  }

  return (
    <div>
      <Topbar />
      <div className="flex h-[calc(100vh-73px)]">
        {/* Day side panel */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card/40">
          <div className="border-b border-border p-3">
            <Link href="/challenges" className="text-xs text-muted-foreground hover:text-foreground">← Challenges</Link>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-lg">{challenge.icon || "🚀"}</span>
              <h2 className="min-w-0 flex-1 truncate text-sm font-bold">{challenge.name}</h2>
            </div>
          </div>
          <button
            onClick={() => setSelected(null)}
            className={cn("flex items-center gap-2 px-3 py-2 text-sm", selected === null ? "bg-sprint/10 font-medium text-sprint" : "text-muted-foreground hover:bg-muted")}
          >
            <Home className="h-4 w-4" /> Overview &amp; sections
          </button>
          <button
            onClick={() => setSelected("table")}
            className={cn("flex items-center gap-2 px-3 py-2 text-sm", selected === "table" ? "bg-sprint/10 font-medium text-sprint" : "text-muted-foreground hover:bg-muted")}
          >
            <Table className="h-4 w-4" /> Days table
          </button>
          <button
            onClick={() => setSelected("health")}
            className={cn("flex items-center gap-2 px-3 py-2 text-sm", selected === "health" ? "bg-sprint/10 font-medium text-sprint" : "text-muted-foreground hover:bg-muted")}
          >
            <Activity className="h-4 w-4" /> Health tracker
          </button>
          <div className="flex items-center justify-between px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Days
            <button onClick={async () => { const { name, date } = todayNameAndDate(); const d = await createDay({ challengeId: cid, name, date }); setSelected(d); }} className="text-sprint hover:text-sprint" title="New day"><Plus className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {days?.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No days yet. Click + to start.</p>}
            {days?.map((d) => (
              <button
                key={d._id}
                onClick={() => setSelected(d._id)}
                className={cn("group flex w-full items-center gap-2 px-3 py-2 text-left text-sm", selected === d._id ? "bg-sprint/10 font-medium text-sprint" : "text-foreground hover:bg-muted")}
              >
                <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); if (confirm("Delete this day?")) { void removeDay({ id: d._id }); if (selected === d._id) setSelected(null); } }}
                  className="opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          {selected === "health" ? (
            <HealthTracker challengeId={cid} />
          ) : selected === "table" ? (
            <DaysTable challengeId={cid} />
          ) : selected ? (
            <DayView key={selected} dayId={selected} challengeId={cid} />
          ) : (
            <Overview challengeId={cid} />
          )}
        </main>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between text-sm text-muted-foreground">{label}<span>{icon}</span></div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
    </Card>
  );
}

/* ================= Overview + section management ================= */

function Overview({ challengeId }: { challengeId: Id<"challenges"> }) {
  const data = useQuery(api.challenges.overview, { id: challengeId });
  const structure = useQuery(api.challengeSections.structure, { challengeId }) as StructSection[] | undefined;
  const addSection = useMutation(api.challengeSections.addSection);
  const [newSection, setNewSection] = useState("");

  if (!data || !structure) return <div className="p-6"><div className="h-40 animate-pulse rounded-2xl border border-border bg-card" /></div>;
  const t = data.totals;
  const rollup = new Map(data.sections.map((s) => [s._id as string, s]));
  const c = data.challenge;

  return (
    <div className="p-4 sm:p-6">
      {/* Challenge header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">{c.icon || "🚀"}</span>
        <h1 className="text-2xl font-bold tracking-tight">{c.name}</h1>
      </div>
      {c.description && <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>}
      {c.outcome && <p className="mt-1 text-sm"><span className="text-muted-foreground">Outcome: </span>{c.outcome}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat icon={<Clock className="h-4 w-4" />} label="Total focus" value={`${t.focusHours}h`} />
        <Stat icon={<ListChecks className="h-4 w-4" />} label="Tasks done" value={`${t.tasksDone}/${t.tasksTotal}`} />
        <Stat icon={<Flame className="h-4 w-4" />} label="Habit checks" value={`${t.habitChecks}`} />
        <Stat icon={<Zap className="h-4 w-4" />} label="Avg energy" value={t.avgEnergy != null ? `${t.avgEnergy}/5` : "—"} />
        <Stat icon={<CalendarDays className="h-4 w-4" />} label="Days" value={`${t.days}`} />
      </div>

      <h2 className="mt-6 mb-2 text-sm font-semibold">Sections</h2>
      <p className="mb-3 text-xs text-muted-foreground">Define each section&apos;s syllabus, goals and KPIs here. Daily tasks &amp; KPI values are logged inside each day.</p>
      <div className="space-y-2">
        {structure.map((s, i) => (
          <SectionManager
            key={s._id}
            section={s}
            index={i}
            count={structure.length}
            focusHours={rollup.get(s._id as string)?.focusHours ?? 0}
            tasksDone={rollup.get(s._id as string)?.tasksDone ?? 0}
            tasksTotal={rollup.get(s._id as string)?.tasksTotal ?? 0}
          />
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input value={newSection} onChange={(e) => setNewSection(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newSection.trim()) { void addSection({ challengeId, name: newSection.trim() }); setNewSection(""); } }} placeholder="Add a section…" className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-sprint/60" />
        <button onClick={() => { if (newSection.trim()) { void addSection({ challengeId, name: newSection.trim() }); setNewSection(""); } }} className="rounded-lg bg-sprint px-4 py-2 text-sm font-medium text-white">Add</button>
      </div>

      <h2 className="mt-6 mb-2 text-sm font-semibold">Habits</h2>
      <p className="mb-3 text-xs text-muted-foreground">These show as a strip on every day, ticked per day.</p>
      <HabitsManager challengeId={challengeId} />

      <p className="mt-6 text-center text-xs text-muted-foreground">Create a day from the side panel to start logging.</p>
    </div>
  );
}

function HabitsManager({ challengeId }: { challengeId: Id<"challenges"> }) {
  const opts = useQuery(api.challenges.habitOptions, { id: challengeId });
  const link = useMutation(api.challenges.linkHabit);
  const unlink = useMutation(api.challenges.unlinkHabit);
  const create = useMutation(api.challenges.createHabit);
  const [name, setName] = useState("");

  if (!opts) return <div className="h-10 animate-pulse rounded-xl bg-muted/40" />;

  return (
    <Card>
      {opts.linked.length === 0 && opts.available.length === 0 ? (
        <p className="text-xs text-muted-foreground">No habits yet — create one below.</p>
      ) : (
        <>
          {opts.linked.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {opts.linked.map((h) => (
                <span key={h._id} className="flex items-center gap-1 rounded-full bg-sprint px-2.5 py-1 text-xs text-white">
                  <Flame className="h-3 w-3" /> {h.title}
                  <button onClick={() => void unlink({ habitId: h._id })} className="hover:text-white/70"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
          {opts.available.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Add an existing habit</p>
              <div className="flex flex-wrap gap-1.5">
                {opts.available.map((h) => (
                  <button key={h._id} onClick={() => void link({ id: challengeId, habitId: h._id })} className="flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-sprint/60 hover:text-foreground">
                    <Plus className="h-3 w-3" /> {h.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <div className="mt-3 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { void create({ id: challengeId, title: name.trim() }); setName(""); } }} placeholder="New habit (e.g. Gym, Quran, Journal)…" className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-sprint/60" />
        <button onClick={() => { if (name.trim()) { void create({ id: challengeId, title: name.trim() }); setName(""); } }} className="rounded-lg bg-sprint px-4 py-2 text-sm font-medium text-white">Create</button>
      </div>
    </Card>
  );
}

/** A section row in Overview — expand to edit syllabus, goals and KPI defs. */
function SectionManager({ section, index, count, focusHours, tasksDone, tasksTotal }: {
  section: StructSection; index: number; count: number; focusHours: number; tasksDone: number; tasksTotal: number;
}) {
  const reorder = useMutation(api.challengeSections.reorderSection);
  const removeSection = useMutation(api.challengeSections.removeSection);
  const updateSection = useMutation(api.challengeSections.updateSection);
  const addGoal = useMutation(api.challengeSections.addGoal);
  const toggleGoal = useMutation(api.challengeSections.toggleGoal);
  const removeGoal = useMutation(api.challengeSections.removeGoal);
  const addKpiDef = useMutation(api.challengeSections.addKpiDef);
  const removeKpiDef = useMutation(api.challengeSections.removeKpiDef);

  const [open, setOpen] = useState(false);
  const [editSyl, setEditSyl] = useState(false);
  const [syllabus, setSyllabus] = useState(section.syllabus ?? "");
  const [newGoal, setNewGoal] = useState("");
  const [kName, setKName] = useState("");
  const [kType, setKType] = useState<KpiType>("number");
  const [kUnit, setKUnit] = useState("");
  const [kTarget, setKTarget] = useState("");

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition", open && "rotate-90")} />
          <span className="truncate font-semibold">{section.icon} {section.name}</span>
          <span className="text-xs text-muted-foreground">· {section.goals.length} goals · {section.kpiDefs.length} KPIs</span>
        </button>
        <span className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {focusHours}h</span>
          <span className="flex items-center gap-1"><ListChecks className="h-3 w-3" /> {tasksDone}/{tasksTotal}</span>
        </span>
        <button onClick={() => void reorder({ id: section._id, direction: "up" })} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
        <button onClick={() => void reorder({ id: section._id, direction: "down" })} disabled={index === count - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
        <button onClick={() => { if (confirm(`Delete section "${section.name}"?`)) void removeSection({ id: section._id }); }} className="text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>

      {open && (
        <div className="grid grid-cols-1 gap-4 border-t border-border p-3 md:grid-cols-2">
          {/* Goals */}
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Target className="h-3.5 w-3.5" /> Goals</h4>
            <div className="space-y-1.5">
              {section.goals.map((g) => (
                <div key={g._id} className="flex items-center gap-2">
                  <button onClick={() => void toggleGoal({ id: g._id })} className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", g.done ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{g.done && <Check className="h-2.5 w-2.5" />}</button>
                  <span className={cn("min-w-0 flex-1 truncate text-sm", g.done && "text-muted-foreground line-through")}>{g.title}</span>
                  <button onClick={() => void removeGoal({ id: g._id })} className="text-muted-foreground hover:text-red-400"><X className="h-3 w-3" /></button>
                </div>
              ))}
              {section.goals.length === 0 && <p className="text-xs text-muted-foreground">No goals yet.</p>}
            </div>
            <input value={newGoal} onChange={(e) => setNewGoal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newGoal.trim()) { void addGoal({ sectionId: section._id, title: newGoal.trim() }); setNewGoal(""); } }} placeholder="Add goal…" className="mt-2 w-full rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs outline-none focus:border-sprint/60" />
          </div>

          {/* KPI defs */}
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Gauge className="h-3.5 w-3.5" /> KPIs</h4>
            <div className="space-y-1.5">
              {section.kpiDefs.map((k) => (
                <div key={k._id} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{k.name}</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{k.type}{k.unit ? ` · ${k.unit}` : ""}{k.target != null ? ` · target ${k.target}` : ""}</span>
                  <button onClick={() => void removeKpiDef({ id: k._id })} className="text-muted-foreground hover:text-red-400"><X className="h-3 w-3" /></button>
                </div>
              ))}
              {section.kpiDefs.length === 0 && <p className="text-xs text-muted-foreground">No KPIs yet.</p>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <input value={kName} onChange={(e) => setKName(e.target.value)} placeholder="KPI name" className="min-w-0 flex-1 rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-xs outline-none" />
              <select value={kType} onChange={(e) => setKType(e.target.value as KpiType)} className="rounded-lg border border-border bg-muted/30 px-1.5 py-1.5 text-xs outline-none"><option value="number">number</option><option value="checkbox">yes/no</option><option value="text">text</option></select>
              {kType === "number" && <input value={kUnit} onChange={(e) => setKUnit(e.target.value)} placeholder="unit" className="w-14 rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-xs outline-none" />}
              {kType === "number" && <input type="number" value={kTarget} onChange={(e) => setKTarget(e.target.value)} placeholder="target" className="w-16 rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-xs outline-none" />}
              <button onClick={() => { if (kName.trim()) { void addKpiDef({ sectionId: section._id, name: kName.trim(), type: kType, unit: kUnit.trim() || undefined, target: kTarget ? Number(kTarget) : undefined }); setKName(""); setKUnit(""); setKTarget(""); } }} className="rounded-lg bg-sprint px-2.5 py-1.5 text-xs font-medium text-white">Add</button>
            </div>
          </div>

          {/* Syllabus */}
          <div className="md:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><BookOpen className="h-3.5 w-3.5" /> Syllabus</h4>
              <button onClick={() => setEditSyl((s) => !s)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
            </div>
            {editSyl ? (
              <div>
                <textarea value={syllabus} onChange={(e) => setSyllabus(e.target.value)} rows={6} placeholder="Curriculum / reference (markdown)…" className="w-full resize-none rounded-lg border border-border bg-muted/30 px-2.5 py-2 text-xs outline-none focus:border-sprint/60" />
                <button onClick={() => { void updateSection({ id: section._id, syllabus }); setEditSyl(false); }} className="mt-2 rounded-lg bg-sprint px-3 py-1.5 text-xs font-medium text-white">Save</button>
              </div>
            ) : section.syllabus ? (
              <div className="prose-sm rounded-lg border border-border bg-muted/20 p-3 text-sm"><MarkdownLite text={section.syllabus} /></div>
            ) : (
              <p className="text-xs text-muted-foreground">No syllabus yet — click the pencil to add one.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= Day view ================= */

type DayData = NonNullable<FunctionReturnType<typeof api.challengeDays.dayData>>;

function DayView({ dayId, challengeId }: { dayId: Id<"challengeDays">; challengeId: Id<"challenges"> }) {
  const data = useQuery(api.challengeDays.dayData, { dayId });
  const structure = useQuery(api.challengeSections.structure, { challengeId }) as StructSection[] | undefined;
  const rename = useMutation(api.challengeDays.rename);
  const [tab, setTab] = useState<string>("overview");

  // Persist the active section tab in the URL (?tab=…) so returning from a
  // task's full-page view lands back on the same tab.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t) setTab(t);
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url.toString());
  }, [tab]);

  if (!data || !structure) return <div className="p-6"><div className="h-40 animate-pulse rounded-2xl border border-border bg-card" /></div>;

  const section = tab === "overview" ? null : structure.find((s) => s._id === tab);
  const tabCls = (active: boolean) => cn("flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium", active ? "border-sprint text-foreground" : "border-transparent text-muted-foreground hover:text-foreground");

  return (
    <div className="p-4 sm:p-6">
      <Breadcrumb items={[{ label: "Challenges", href: "/challenges" }, { label: "Day" }]} />
      <input
        defaultValue={data.day.name}
        onBlur={(e) => e.target.value.trim() && e.target.value !== data.day.name && rename({ id: dayId, name: e.target.value.trim() })}
        className="mt-3 w-full bg-transparent text-2xl font-bold tracking-tight outline-none"
      />
      <p className="text-xs text-muted-foreground">{data.day.date}</p>

      {/* Tabs: Overview first, then sections */}
      <div className="mt-5 flex flex-wrap gap-1 border-b border-border">
        <button onClick={() => setTab("overview")} className={tabCls(tab === "overview")}><Home className="h-4 w-4" /> Overview</button>
        {structure.map((s) => (
          <button key={s._id} onClick={() => setTab(s._id)} className={tabCls(tab === s._id)}>{s.icon} {s.name}</button>
        ))}
      </div>

      {tab === "overview" ? (
        <DayOverview dayId={dayId} data={data} structure={structure} />
      ) : section ? (
        <SectionPanel
          key={section._id}
          dayId={dayId}
          section={section}
          tasks={data.tasks.filter((t) => t.sectionId === section._id)}
          kpiValues={data.kpiValues.filter((k) => k.sectionId === section._id)}
        />
      ) : null}
    </div>
  );
}

function kpiDisplay(type: KpiType, val: KpiVal | undefined, unit?: string): string {
  if (type === "checkbox") return val?.bool ? "Yes" : "—";
  if (type === "text") return val?.text || "—";
  return val?.num != null ? `${val.num}${unit ? ` ${unit}` : ""}` : "—";
}

/** The day's first tab — a dashboard of that day's details. */
function DayOverview({ dayId, data, structure }: { dayId: Id<"challengeDays">; data: DayData; structure: StructSection[] }) {
  const toggleHabit = useMutation(api.challengeDays.toggleHabit);
  const ov = data.overview;

  const tasksBySection = new Map<string, { done: number; total: number }>();
  for (const t of data.tasks) {
    const k = (t.sectionId as string) ?? "none";
    const c = tasksBySection.get(k) ?? { done: 0, total: 0 };
    c.total++;
    if (t.status === "done") c.done++;
    tasksBySection.set(k, c);
  }
  const focusOf = (sid: string) => ov.focusBySection.find((f) => f.sectionId === sid)?.seconds ?? 0;

  const kpiRows = structure.flatMap((s) =>
    s.kpiDefs.map((k) => ({ section: s.name, name: k.name, type: k.type, unit: k.unit, val: data.kpiValues.find((v) => v.kpiDefId === k._id) })),
  );

  return (
    <div className="mt-4 space-y-4">
      {/* Most important daily numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Clock className="h-4 w-4" />} label="Focus today" value={fmtDur(ov.focusTotal)} />
        <Stat icon={<ListChecks className="h-4 w-4" />} label="Tasks done" value={`${ov.tasksDone}/${ov.tasksTotal}`} />
        <Stat icon={<Flame className="h-4 w-4" />} label="Habits done" value={`${ov.habitsDone}/${ov.habitsTotal}`} />
        <Stat icon={<Zap className="h-4 w-4" />} label="Energy" value={data.day.journal?.energy ? `${data.day.journal.energy}/5` : "—"} />
      </div>

      {/* Habits strip */}
      {data.habits.length > 0 && (
        <Card>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Flame className="h-4 w-4 text-sprint" /> Habits</h3>
          <div className="flex flex-wrap gap-2">
            {data.habits.map((h) => (
              <button key={h._id} onClick={() => void toggleHabit({ dayId, habitId: h._id })} className={cn("flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs", h.done ? "border-transparent bg-sprint text-white" : "border-border text-muted-foreground hover:text-foreground")}>
                {h.done && <Check className="h-3 w-3" />} {h.title}
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* By section */}
        <Card>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ListChecks className="h-4 w-4 text-sprint" /> By section</h3>
          <div className="space-y-2">
            {structure.map((s) => {
              const tb = tasksBySection.get(s._id as string) ?? { done: 0, total: 0 };
              return (
                <div key={s._id} className="flex items-center gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate">{s.icon} {s.name}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {fmtDur(focusOf(s._id as string))}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><ListChecks className="h-3 w-3" /> {tb.done}/{tb.total}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* KPI values today */}
        <Card>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Gauge className="h-4 w-4 text-sprint" /> KPIs — today</h3>
          {kpiRows.length === 0 ? (
            <p className="text-xs text-muted-foreground">No KPIs defined. Add them per section in Overview.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {kpiRows.map((r, i) => (
                  <tr key={i} className="border-t border-border first:border-0">
                    <td className="py-1.5 pr-2 text-muted-foreground">{r.section}</td>
                    <td className="py-1.5 pr-2">{r.name}</td>
                    <td className="py-1.5 text-right font-medium">{kpiDisplay(r.type, r.val, r.unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Health tracker (today) */}
      <HealthCard dayId={dayId} initial={data.day.health} />

      {/* Today's journaling */}
      <JournalCard dayId={dayId} initial={data.day.journal} />
    </div>
  );
}

function HealthCard({ dayId, initial }: { dayId: Id<"challengeDays">; initial?: DayData["day"]["health"] }) {
  const save = useMutation(api.challengeDays.setHealth);
  const box = "w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-sprint/60";
  const numOr = (v: string) => (v === "" ? undefined : Number(v));
  return (
    <Card>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-sprint" /> Health — today</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Labeled label="Sleep duration (h)">
          <input type="number" step="0.1" defaultValue={initial?.sleepDuration ?? ""} onBlur={(e) => save({ dayId, sleepDuration: numOr(e.target.value) })} className={box} />
        </Labeled>
        <Labeled label="Time awake">
          <input type="time" defaultValue={initial?.timeAwake ?? ""} onBlur={(e) => save({ dayId, timeAwake: e.target.value || undefined })} className={cn(box, "[color-scheme:dark]")} />
        </Labeled>
        <Labeled label="Time in bed">
          <input type="time" defaultValue={initial?.timeInBed ?? ""} onBlur={(e) => save({ dayId, timeInBed: e.target.value || undefined })} className={cn(box, "[color-scheme:dark]")} />
        </Labeled>
        <Labeled label="Cheat meal (bad)">
          <button onClick={() => save({ dayId, cheatMeal: !initial?.cheatMeal })} className={cn("flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm", initial?.cheatMeal ? "border-red-500 bg-red-500/15 font-medium text-red-400" : "border-border text-muted-foreground")}>{initial?.cheatMeal ? <><X className="h-4 w-4" /> Yes</> : "No"}</button>
        </Labeled>
      </div>
    </Card>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

/* ================= Health tracker (challenge-wide) ================= */

function SleepChart({ series }: { series: { date: string; value: number }[] }) {
  const [start, setStart] = useState(0);
  if (series.length === 0) return <p className="text-xs text-muted-foreground">No sleep data yet — log it on your days.</p>;

  const W = 640, H = 240;
  const padL = 36, padR = 14, padT = 18, padB = 40;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const windowSize = Math.min(series.length, 14);
  const maxStart = Math.max(0, series.length - windowSize);
  const s0 = Math.min(start, maxStart);
  const view = series.slice(s0, s0 + windowSize);

  // Y scale across the full series so the axis stays stable while you pan.
  const vals = series.map((s) => s.value);
  const min = Math.floor(Math.min(...vals) - 0.5);
  const max = Math.ceil(Math.max(...vals) + 0.5);
  const step = Math.max(1, Math.ceil((max - min) / 5));
  const ticks: number[] = [];
  for (let t = min; t <= max; t += step) ticks.push(t);

  const x = (i: number) => padL + (windowSize <= 1 ? innerW / 2 : (i / (windowSize - 1)) * innerW);
  const y = (v: number) => padT + innerH - ((v - min) / Math.max(1, max - min)) * innerH;
  const pts = view.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const dm = (ymd: string) => { const p = ymd.split("-"); return `${p[2]}/${p[1]}`; };
  const showLabel = (i: number) => windowSize <= 8 || i % 2 === 0;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-sprint" preserveAspectRatio="xMidYMid meet">
        {/* Y gridlines + labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} className="stroke-border" strokeWidth={1} />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">{t}</text>
          </g>
        ))}
        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} className="stroke-border" strokeWidth={1} />
        <line x1={padL} y1={padT + innerH} x2={W - padR} y2={padT + innerH} className="stroke-border" strokeWidth={1} />
        {/* X ticks + date labels */}
        {view.map((d, i) => (
          <g key={d.date}>
            <line x1={x(i)} y1={padT + innerH} x2={x(i)} y2={padT + innerH + 4} className="stroke-border" strokeWidth={1} />
            {showLabel(i) && <text x={x(i)} y={padT + innerH + 16} textAnchor="middle" className="fill-muted-foreground text-[9px]">{dm(d.date)}</text>}
          </g>
        ))}
        {/* Line + points + value labels */}
        <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
        {view.map((d, i) => (
          <g key={d.date}>
            <circle cx={x(i)} cy={y(d.value)} r={3.5} fill="currentColor" />
            <text x={x(i)} y={y(d.value) - 8} textAnchor="middle" className="fill-foreground text-[9px] font-medium">{d.value}</text>
          </g>
        ))}
      </svg>

      {/* Pan slider (only when there are more days than fit) */}
      {series.length > windowSize && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{dm(view[0].date)}</span>
          <input
            type="range"
            min={0}
            max={maxStart}
            value={s0}
            onChange={(e) => setStart(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer accent-sprint"
          />
          <span className="text-[10px] text-muted-foreground">{dm(view[view.length - 1].date)}</span>
        </div>
      )}
    </div>
  );
}

function HealthTracker({ challengeId }: { challengeId: Id<"challenges"> }) {
  const data = useQuery(api.challengeDays.health, { challengeId });
  if (!data) return <div className="p-6"><div className="h-40 animate-pulse rounded-2xl border border-border bg-card" /></div>;
  const a = data.averages;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight"><Activity className="h-5 w-5 text-sprint" /> Health Tracker</h1>

      {/* Big average cards + sleep graph */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <BigStat icon={<Moon className="h-4 w-4" />} label="Average Sleep Duration" value={a.sleep != null ? `${a.sleep}` : "—"} />
        </div>
        <Card className="lg:col-span-2">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Moon className="h-4 w-4 text-sprint" /> Sleep Duration</h3>
          <SleepChart series={data.sleepSeries} />
        </Card>
      </div>

      {/* Table */}
      <Card className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Date</th>
              <th className="py-2 pr-3 font-medium">Sleep Duration</th>
              <th className="py-2 pr-3 font-medium">Time Awake</th>
              <th className="py-2 pr-3 font-medium">Time In Bed</th>
              <th className="py-2 font-medium">Cheat Meal</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-xs text-muted-foreground">No days yet.</td></tr>}
            {data.rows.map((r) => (
              <tr key={r._id} className="border-b border-border last:border-0">
                <td className="py-2 pr-3">{r.name}</td>
                <td className="py-2 pr-3">{r.health.sleepDuration ?? "—"}</td>
                <td className="py-2 pr-3">{r.health.timeAwake ?? "—"}</td>
                <td className="py-2 pr-3">{r.health.timeInBed ?? "—"}</td>
                <td className="py-2">{r.health.cheatMeal ? <span className="flex items-center gap-1 font-medium text-red-400"><X className="h-3.5 w-3.5" /> Yes</span> : <span className="text-muted-foreground">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function BigStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between text-xs text-muted-foreground">{label}<span>{icon}</span></div>
      <div className="mt-1 text-4xl font-bold tracking-tight text-sprint">{value}</div>
    </Card>
  );
}

function JournalCard({ dayId, initial }: { dayId: Id<"challengeDays">; initial?: DayData["day"]["journal"] }) {
  const save = useMutation(api.challengeDays.setJournal);
  const [good, setGood] = useState(initial?.good ?? "");
  const [bad, setBad] = useState(initial?.bad ?? "");
  const [improve, setImprove] = useState(initial?.improve ?? "");
  const [lessons, setLessons] = useState(initial?.lessons ?? "");
  const [energy, setEnergy] = useState(initial?.energy ?? 0);

  const box = "w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-sprint/60";

  return (
    <Card>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><NotebookPen className="h-4 w-4 text-sprint" /> Today&apos;s journaling</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">What I did well today</p>
          <textarea rows={3} value={good} onChange={(e) => setGood(e.target.value)} onBlur={() => good !== (initial?.good ?? "") && save({ dayId, good })} className={box} />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">What wasn&apos;t good</p>
          <textarea rows={3} value={bad} onChange={(e) => setBad(e.target.value)} onBlur={() => bad !== (initial?.bad ?? "") && save({ dayId, bad })} className={box} />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">How I&apos;ll improve tomorrow</p>
          <textarea rows={3} value={improve} onChange={(e) => setImprove(e.target.value)} onBlur={() => improve !== (initial?.improve ?? "") && save({ dayId, improve })} className={box} />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Key lessons / notes</p>
          <textarea rows={3} value={lessons} onChange={(e) => setLessons(e.target.value)} onBlur={() => lessons !== (initial?.lessons ?? "") && save({ dayId, lessons })} className={box} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"><Zap className="h-3.5 w-3.5" /> Energy</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => { const v = n === energy ? 0 : n; setEnergy(v); void save({ dayId, energy: v }); }} className={cn("h-8 w-8 rounded-full text-xs font-medium transition", n <= energy ? "bg-sprint text-white" : "border border-border text-muted-foreground hover:text-foreground")}>{n}</button>
        ))}
      </div>
    </Card>
  );
}

/* --------- Section panel inside a day: tasks + KPI values + reference --------- */

type DayTask = { _id: Id<"tasks">; title: string; status: string; sectionId?: Id<"challengeSections">; focusSeconds: number };
type KpiVal = { kpiDefId: Id<"challengeKpiDefs">; num?: number; bool?: boolean; text?: string };

function SectionPanel({ dayId, section, tasks, kpiValues }: { dayId: Id<"challengeDays">; section: StructSection; tasks: DayTask[]; kpiValues: KpiVal[] }) {
  const addTask = useMutation(api.challengeDays.addTask);
  const toggleTask = useMutation(api.challengeDays.toggleTask);
  const removeTask = useMutation(api.challengeDays.removeTask);
  const setKpi = useMutation(api.challengeDays.setKpiValue);
  const timer = useFocusTimer();

  const [newTask, setNewTask] = useState("");
  const [showRef, setShowRef] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Id<"tasks"> | null>(null);
  const kpiVal = (id: string) => kpiValues.find((k) => k.kpiDefId === id);

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Tasks + KPIs (the daily work) */}
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ListChecks className="h-4 w-4 text-sprint" /> Tasks</h3>
          <div className="space-y-1.5">
            {tasks.length === 0 && <p className="text-xs text-muted-foreground">No tasks yet for this section today.</p>}
            {tasks.map((t) => {
              const running = timer.active && timer.taskId === t._id;
              return (
                <div key={t._id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-2.5 py-2">
                  <button onClick={() => void toggleTask({ taskId: t._id })} className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", t.status === "done" ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                    {t.status === "done" && <Check className="h-3 w-3" />}
                  </button>
                  <button onClick={() => setSelectedTask(t._id)} className={cn("min-w-0 flex-1 truncate text-left text-sm hover:text-sprint", t.status === "done" && "text-muted-foreground line-through")}>{t.title}</button>
                  {t.focusSeconds > 0 && <span className="text-[11px] text-muted-foreground">{fmtDur(t.focusSeconds)}</span>}
                  <button onClick={() => timer.startFocus({ type: "stopwatch", taskId: t._id, taskTitle: t.title })} title="Start focus timer" className={cn("flex h-7 w-7 items-center justify-center rounded-full border", running ? "border-sprint bg-sprint/10 text-sprint" : "border-border text-muted-foreground hover:text-foreground")}>
                    <Timer className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => void removeTask({ taskId: t._id })} className="text-muted-foreground hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newTask.trim()) { void addTask({ dayId, sectionId: section._id, title: newTask.trim() }); setNewTask(""); } }} placeholder="Add a task…" className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-sprint/60" />
            <button onClick={() => { if (newTask.trim()) { void addTask({ dayId, sectionId: section._id, title: newTask.trim() }); setNewTask(""); } }} className="rounded-lg bg-sprint px-3 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /></button>
          </div>
        </Card>

        {section.kpiDefs.length > 0 && (
          <Card>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Gauge className="h-4 w-4 text-sprint" /> KPIs — today</h3>
            <div className="space-y-2">
              {section.kpiDefs.map((k) => {
                const val = kpiVal(k._id);
                return (
                  <div key={k._id} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm">{k.name}{k.unit ? <span className="text-muted-foreground"> ({k.unit})</span> : null}</span>
                    {k.type === "number" && <input type="number" defaultValue={val?.num ?? ""} onBlur={(e) => setKpi({ dayId, kpiDefId: k._id, num: e.target.value === "" ? undefined : Number(e.target.value) })} className="w-24 rounded-lg border border-border bg-card px-2 py-1.5 text-sm outline-none" />}
                    {k.type === "number" && k.target != null && <span className="text-xs text-muted-foreground">/ {k.target}</span>}
                    {k.type === "checkbox" && <button onClick={() => setKpi({ dayId, kpiDefId: k._id, bool: !val?.bool })} className={cn("flex h-7 w-7 items-center justify-center rounded-full border", val?.bool ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{val?.bool && <Check className="h-3.5 w-3.5" />}</button>}
                    {k.type === "text" && <input defaultValue={val?.text ?? ""} onBlur={(e) => setKpi({ dayId, kpiDefId: k._id, text: e.target.value || undefined })} className="w-40 rounded-lg border border-border bg-card px-2 py-1.5 text-sm outline-none" />}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Reference (read-only): section goals + syllabus */}
      <div>
        <Card>
          <button onClick={() => setShowRef((s) => !s)} className="flex w-full items-center gap-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4 text-sprint" /> Section reference
            <ChevronRight className={cn("ml-auto h-4 w-4 text-muted-foreground transition", showRef && "rotate-90")} />
          </button>
          {showRef && (
            <div className="mt-3 space-y-4">
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Target className="h-3.5 w-3.5" /> Goals</p>
                {section.goals.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None. Add them in Overview.</p>
                ) : (
                  <ul className="space-y-1">
                    {section.goals.map((g) => (
                      <li key={g._id} className="flex items-center gap-2 text-sm">
                        <span className={cn("h-3 w-3 shrink-0 rounded-full border", g.done ? "border-primary bg-primary" : "border-border")} />
                        <span className={cn("truncate", g.done && "text-muted-foreground line-through")}>{g.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><BookOpen className="h-3.5 w-3.5" /> Syllabus</p>
                {section.syllabus ? <div className="prose-sm text-sm"><MarkdownLite text={section.syllabus} /></div> : <p className="text-xs text-muted-foreground">None. Add it in Overview.</p>}
              </div>
            </div>
          )}
          {!showRef && <p className="mt-2 text-xs text-muted-foreground">Goals &amp; syllabus for this section — managed in Overview.</p>}
        </Card>
      </div>

      {selectedTask && <TaskDetailPanel id={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

/* ================= Days table (challenge-wide) ================= */

function fmtKpi(type: KpiType, v: { num?: number; bool?: boolean; text?: string } | undefined, unit?: string, target?: number): string {
  if (type === "checkbox") return v?.bool ? "Yes" : "—";
  if (type === "text") return v?.text || "—";
  const val = v?.num;
  const u = unit ? ` ${unit}` : "";
  if (target != null) return `${val ?? "—"} / ${target}${u}`;
  return val != null ? `${val}${u}` : "—";
}

function DaysTable({ challengeId }: { challengeId: Id<"challenges"> }) {
  const data = useQuery(api.challengeDays.daysTable, { challengeId });
  if (!data) return <div className="p-6"><div className="h-40 animate-pulse rounded-2xl border border-border bg-card" /></div>;

  const th = "whitespace-nowrap px-3 py-2 text-left font-medium";
  const td = "whitespace-nowrap border-b border-border px-3 py-2";
  // Opaque backgrounds are required on sticky cells, otherwise scrolled
  // columns show through them.
  const stickyHead = "sticky top-0 z-20 border-b border-border bg-muted";
  const stickyCell = "sticky left-0 z-10 border-r border-border bg-card font-medium group-hover:bg-muted";
  const colCount = 10 + data.habitCols.length + data.kpiCols.length;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight"><Table className="h-5 w-5 text-sprint" /> Days table</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every day and all its key metrics, side by side.</p>

      <Card className="mt-4 max-h-[70vh] overflow-auto p-0">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className={cn(th, stickyHead, "left-0 z-30 border-r")}>Day</th>
              <th className={cn(th, stickyHead)}>Date</th>
              <th className={cn(th, stickyHead)}>Focus</th>
              <th className={cn(th, stickyHead)}>Tasks</th>
              <th className={cn(th, stickyHead)}>Habits</th>
              <th className={cn(th, stickyHead)}>Energy</th>
              <th className={cn(th, stickyHead)}>Sleep</th>
              <th className={cn(th, stickyHead)}>Wake</th>
              <th className={cn(th, stickyHead)}>Bedtime</th>
              <th className={cn(th, stickyHead)}>Cheat</th>
              {data.habitCols.map((h) => (
                <th key={h._id} className={cn(th, stickyHead)} title="Habit">{h.title}</th>
              ))}
              {data.kpiCols.map((k) => (
                <th key={k._id} className={cn(th, stickyHead)} title={k.section}>{k.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 && (
              <tr><td colSpan={colCount} className="px-3 py-6 text-center text-xs text-muted-foreground">No days yet.</td></tr>
            )}
            {data.rows.map((r) => (
              <tr key={r._id} className="group hover:bg-muted/20">
                <td className={cn(td, stickyCell)}>{r.name}</td>
                <td className={cn(td, "text-muted-foreground")}>{r.date}</td>
                <td className={td}>{fmtDur(r.focusSeconds)}</td>
                <td className={td}>{r.tasksDone}/{r.tasksTotal}</td>
                <td className={td}>{r.habitsDone}/{r.habitsTotal}</td>
                <td className={td}>{r.energy != null ? `${r.energy}/5` : "—"}</td>
                <td className={td}>{r.sleep ?? "—"}</td>
                <td className={td}>{r.wakeUp ?? "—"}</td>
                <td className={td}>{r.bedtime ?? "—"}</td>
                <td className={td}>{r.cheatMeal ? <span className="flex items-center gap-1 font-medium text-red-400"><X className="h-3.5 w-3.5" /> Yes</span> : <span className="text-muted-foreground">—</span>}</td>
                {data.habitCols.map((h) => (
                  <td key={h._id} className={cn(td, "text-center")}>{r.habitDone[h._id] ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> : <span className="text-muted-foreground">—</span>}</td>
                ))}
                {data.kpiCols.map((k) => {
                  const cell = r.kpi[k._id];
                  if (k.type !== "number") return <td key={k._id} className={td}>{fmtKpi(k.type, cell, k.unit)}</td>;
                  const has = cell?.num != null || k.target != null;
                  return (
                    <td key={k._id} className={td}>
                      {has ? (
                        <span>
                          <span className="font-medium">{cell?.num ?? 0}</span>
                          {k.target != null && <span className="text-muted-foreground"> / {k.target}</span>}
                          {k.unit ? <span className="text-muted-foreground"> {k.unit}</span> : null}
                        </span>
                      ) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
