"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  BookOpen,
  Brain,
  CircleHelp,
  Dumbbell,
  Eye,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  Link2,
  Map as MapIcon,
  Pencil,
  Plus,
  Target,
  Trash2,
  Wand2,
  X,
  AlertTriangle,
  Heart,
} from "lucide-react";
import {
  Chip,
  EmptyHint,
  Field,
  InlineEdit,
  PageShell,
  Ring,
  Section,
  Segmented,
  Select,
  buttonVariants,
  cn,
  toneForPct,
  Bar,
} from "@/components/os/kit";
import { toast, reward } from "@/components/os/celebrate";
import { Breadcrumb } from "@/components/Breadcrumb";
import { MarkdownLite } from "@/components/tasks/MarkdownLite";
import { SkillTree } from "@/components/mind/SkillTree";
import { PracticeHistory, PracticeLogger } from "@/components/mind/Practice";
import { ResourceCard, ResourceCreateDialog, ResourceDrawer, FinishResourceDialog, ResourceRow } from "@/components/mind/Resources";
import { CardBrowser, CardForm, CardsFromNote } from "@/components/mind/Cards";
import { RESOURCE_STATUSES, errMsg, useMinuteNow, useStable } from "@/components/mind/meta";
import { fmtMin, fmtYmd, useToday } from "@/lib/day";

type Tab = "overview" | "skills" | "practice" | "resources" | "cards";
type AreaData = NonNullable<FunctionReturnType<typeof api.learning.getArea>>;
type AreaPatch = Omit<FunctionArgs<typeof api.learning.updateArea>, "id">;

const MAP_TEMPLATE = `## What to learn
- Concepts:
- Facts:
- Procedures:

## How
- Direct practice (do the real thing):
- Drill (my weakest point):
- Feedback from:

## Benchmark
- `;

export default function LearningAreaPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"learningAreas">;
  const router = useRouter();
  const today = useToday();
  const now = useMinuteNow();
  const data = useStable(useQuery(api.learning.getArea, { id, date: today, now }), id);
  const update = useMutation(api.learning.updateArea);
  const removeArea = useMutation(api.learning.removeArea);
  const [tab, setTab] = useState<Tab>("overview");

  if (data === undefined)
    return (
      <PageShell title={<span className="skeleton inline-block h-7 w-56" />}>
        <div className="space-y-4">
          <div className="skeleton h-24" />
          <div className="skeleton h-80" />
        </div>
      </PageShell>
    );
  if (data === null)
    return (
      <PageShell title="Learning area">
        <EmptyHint
          icon={GraduationCap}
          title="Learning area not found"
          action={
            <Link href="/learning" className={buttonVariants({ size: "sm" })}>
              Back to Learning
            </Link>
          }
        />
      </PageShell>
    );

  const { area } = data;
  const target = area.weeklyMinutesTarget ?? 0;
  const weekPct = target ? Math.round((data.minutesThisWeek / target) * 100) : 0;
  const save = (patch: AreaPatch) => update({ id, ...patch }).catch((e) => toast(errMsg(e), { tone: "warning" }));

  return (
    <PageShell
      title={<InlineEdit value={area.name} onSave={(v) => v.trim() && void save({ name: v })} className="text-2xl font-semibold tracking-tight" />}
      subtitle={<Breadcrumb items={[{ label: "Learning", href: "/learning" }, { label: area.name }]} />}
      actions={
        <>
          <Segmented<"active" | "paused" | "done">
            size="sm"
            value={area.status}
            onChange={(s) => {
              void save({ status: s });
              if (s === "done") reward(`“${area.name}” complete`, undefined, true);
            }}
            options={[
              { value: "active", label: "Active" },
              { value: "paused", label: "Paused" },
              { value: "done", label: "Done" },
            ]}
          />
          <Link href={`/recall?area=${id}`} className={buttonVariants({ variant: data.cardsDue ? "default" : "outline", size: "sm" })}>
            <Brain /> {data.cardsDue ? `Review ${data.cardsDue} due` : "Recall"}
          </Link>
        </>
      }
      headerExtra={
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="This week"
              value={fmtMin(data.minutesThisWeek)}
              sub={target ? `of ${fmtMin(target)}` : "set a target"}
              ring={<Ring value={weekPct} size={40} stroke={5} tone={toneForPct(weekPct)} />}
            />
            <StatTile label="Skills" value={`${data.skillStats.pct}%`} sub={`${data.skillStats.solid}/${data.skillStats.total} solid`} ring={<Ring value={data.skillStats.pct} size={40} stroke={5} tone="success" />} />
            <StatTile label="Recall" value={data.cardsDue} sub={`due · ${data.cardsTotal} cards`} icon={Brain} />
            <StatTile label="Gaps" value={data.openGaps} sub={`open · ${fmtMin(data.totalMinutes)} total`} icon={CircleHelp} />
          </div>
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: "overview", label: "Overview", icon: LayoutDashboard },
              { value: "skills", label: "Skills", icon: GitBranch, count: data.skillStats.total },
              { value: "practice", label: "Practice", icon: Dumbbell, count: data.sessions.length },
              { value: "resources", label: "Resources", icon: BookOpen, count: data.resources.length },
              { value: "cards", label: "Cards", icon: Brain, count: data.cardsTotal },
            ]}
          />
        </div>
      }
    >
      {tab === "overview" && (
        <Overview
          data={data}
          save={save}
          onDelete={async () => {
            if (!confirm(`Delete “${area.name}”? Its skills and practice log are removed; notes, cards and resources are kept.`)) return;
            try {
              await removeArea({ id });
              router.push("/learning");
            } catch (e) {
              toast(errMsg(e), { tone: "warning" });
            }
          }}
        />
      )}
      {tab === "skills" && <SkillTree areaId={id} skills={data.skills} />}
      {tab === "practice" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Section title="Log a session" icon={Dumbbell} hint="Credit goes to practice, recall and explaining — not rereading.">
            <PracticeLogger areaId={id} areaName={area.name} skills={data.skills} />
          </Section>
          <div className="space-y-6">
            <Section title="This week" hint={target ? `${fmtMin(data.minutesThisWeek)} of ${fmtMin(target)}` : undefined}>
              <WeekBars week={data.week} target={target} today={today} />
            </Section>
            <Section title="History">
              <PracticeHistory sessions={data.sessions} />
            </Section>
          </div>
        </div>
      )}
      {tab === "resources" && <AreaResources areaId={id} activeCount={data.activeResources} />}
      {tab === "cards" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Section title="Cards in this area" icon={Brain}>
            <CardBrowser learningAreaId={id} />
          </Section>
          <div className="space-y-6">
            <Section title="Generate cards from a note" icon={Wand2} hint="AI drafts 3–6 cards. Tick the ones worth keeping.">
              <CardsFromNote learningAreaId={id} />
            </Section>
            <Section title="New card" icon={Plus}>
              <CardForm learningAreaId={id} lockArea />
            </Section>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function StatTile({
  label,
  value,
  sub,
  ring,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  ring?: React.ReactNode;
  icon?: typeof Brain;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
      {ring ??
        (Icon && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
        ))}
      <div className="min-w-0">
        <div className="text-lg font-semibold leading-none tabular-nums">{value}</div>
        <div className="mt-1 truncate text-[11px] text-muted-foreground">
          <span className="font-medium uppercase tracking-wide">{label}</span>
          {sub ? ` · ${sub}` : ""}
        </div>
      </div>
    </div>
  );
}

function WeekBars({ week, target, today }: { week: { date: string; minutes: number }[]; target: number; today: string }) {
  const daily = target ? target / 7 : 0;
  const max = Math.max(1, daily, ...week.map((d) => d.minutes));
  return (
    <div>
      <div className="relative flex h-24 items-end gap-2">
        {daily > 0 && (
          <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border" style={{ bottom: `${(daily / max) * 100}%` }} title="Daily pace for your target" />
        )}
        {week.map((d) => (
          <div key={d.date} className="flex h-full flex-1 flex-col justify-end" title={`${fmtYmd(d.date)}: ${d.minutes} min`}>
            <div
              className={cn("w-full rounded-md transition-all duration-700", d.minutes ? "bg-success" : "bg-muted")}
              style={{ height: `${Math.max(4, (d.minutes / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        {week.map((d) => (
          <span key={d.date} className={cn("flex-1 text-center text-[10px] text-muted-foreground", d.date === today && "font-semibold text-foreground")}>
            {fmtYmd(d.date, { weekday: "narrow" })}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────────────────────────────────

function Overview({
  data,
  save,
  onDelete,
}: {
  data: AreaData;
  save: (patch: AreaPatch) => Promise<unknown>;
  onDelete: () => void;
}) {
  const { area } = data;
  const today = useToday();
  const goals = useQuery(api.learning.goalOptions);
  const pillars = useQuery(api.learning.pillarOptions);
  const lifeAreas = useQuery(api.lifeAreas.list);
  const target = area.weeklyMinutesTarget ?? 0;
  const weekPct = target ? Math.round((data.minutesThisWeek / target) * 100) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Section title="Target performance" icon={Target} hint="What you'll be able to DO — make it checkable.">
          <InlineEdit
            multiline
            value={area.targetPerformance ?? ""}
            placeholder="e.g. Record a 60-second explainer with no notes"
            onSave={(v) => void save({ targetPerformance: v.trim() || null })}
            className="text-base"
          />
        </Section>
        <Section title="Why" icon={Heart} hint="Reasons keep you going when it gets hard.">
          <InlineEdit multiline value={area.why ?? ""} placeholder="Why this matters to you and the business…" onSave={(v) => void save({ why: v.trim() || null })} />
        </Section>
        <MapEditor value={area.map ?? ""} onSave={(v) => save({ map: v.trim() ? v : null })} />
      </div>

      <div className="space-y-6">
        <Section title="This week" icon={Dumbbell}>
          <div className="flex items-center gap-4">
            <Ring value={weekPct} size={84} stroke={8} tone={toneForPct(weekPct)}>
              <span className="flex flex-col items-center leading-none">
                <span className="text-base font-semibold tabular-nums">{data.minutesThisWeek}</span>
                <span className="text-[10px] text-muted-foreground">{target ? `of ${target}m` : "min"}</span>
              </span>
            </Ring>
            <div className="min-w-0 flex-1 space-y-1.5">
              <Field label="Weekly target (minutes)">
                <input
                  type="number"
                  min={0}
                  step={15}
                  key={`wt-${target}`}
                  defaultValue={target || ""}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if ((n || 0) !== target) void save({ weeklyMinutesTarget: n > 0 ? n : null });
                  }}
                  className="h-8 w-full rounded-md border border-input bg-card px-2 text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                  placeholder="120"
                />
              </Field>
              <p className="text-[11px] text-muted-foreground">
                {target ? (weekPct >= 100 ? "Target hit — anything more is a bonus." : `${fmtMin(Math.max(0, target - data.minutesThisWeek))} to go`) : "A small weekly budget beats big intentions."}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <WeekBars week={data.week} target={target} today={today} />
          </div>
        </Section>

        <GapsList areaId={area._id} gaps={area.gaps ?? []} />

        <Section title="Links" icon={Link2} hint="Learning feeds goals and content pillars.">
          <div className="space-y-3">
            <Field label="Life area">
              <Select value={area.lifeAreaId ?? ""} onChange={(e) => void save({ lifeAreaId: e.target.value ? (e.target.value as Id<"lifeAreas">) : null })}>
                <option value="">None</option>
                {lifeAreas?.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Goal it serves">
              <Select value={area.goalId ?? ""} onChange={(e) => void save({ goalId: e.target.value ? (e.target.value as Id<"goals">) : null })}>
                <option value="">None</option>
                {goals?.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.title}
                    {g.level === "cycle" ? " · 12-week" : g.level === "annual" ? " · annual" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Content pillar (learn in public)"
              hint={pillars && pillars.length === 0 ? (
                <>
                  No pillars yet — create them in <Link href="/content" className="underline underline-offset-2">Content Studio</Link>.
                </>
              ) : (
                "Seeds made from this area's notes land in this pillar."
              )}
            >
              <Select value={area.pillarId ?? ""} onChange={(e) => void save({ pillarId: e.target.value ? (e.target.value as Id<"contentPillars">) : null })}>
                <option value="">None</option>
                {pillars?.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} · {p.brand}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Section>

        <button onClick={onDelete} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-danger")}>
          <Trash2 /> Delete learning area
        </button>
      </div>
    </div>
  );
}

function MapEditor({ value, onSave }: { value: string; onSave: (v: string) => Promise<unknown> }) {
  const router = useRouter();
  const titles = useQuery(api.notes.titles);
  const createNote = useMutation(api.notes.create);
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(!value);
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const openByTitle = (title: string) => {
    // Titles still loading: don't create a duplicate of a note that may exist.
    if (titles === undefined) return;
    const m = titles.find((t) => t.title.toLowerCase() === title.toLowerCase());
    if (m) router.push(`/notes/${m._id}`);
    else
      void createNote({ title })
        .then((nid) => router.push(`/notes/${nid}`))
        .catch((e) => toast(errMsg(e, "Couldn't create that note."), { tone: "warning" }));
  };

  return (
    <Section
      title="Map"
      icon={MapIcon}
      hint="What to learn and how — concepts, facts, procedures, the real-world practice, the benchmark. [[Links]] open notes."
      action={
        <button
          onClick={() => {
            if (editing && draft !== value) void onSave(draft);
            setEditing((e) => !e);
          }}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {editing ? <Eye /> : <Pencil />} {editing ? "Preview" : "Edit"}
        </button>
      }
    >
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => draft !== value && void onSave(draft)}
            placeholder="## What to learn…"
            className="min-h-[260px] w-full rounded-md border border-input bg-card px-3 py-2 font-mono text-[13px] leading-relaxed shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
          />
          {!draft.trim() && (
            <button onClick={() => setDraft(MAP_TEMPLATE)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <MapIcon /> Start from the Ultralearning template
            </button>
          )}
        </div>
      ) : (
        <div className="min-h-[120px] cursor-text rounded-lg bg-muted/20 px-1 py-1" onClick={() => setEditing(true)}>
          <MarkdownLite text={value} onWikiLink={openByTitle} />
        </div>
      )}
    </Section>
  );
}

function GapsList({ areaId, gaps }: { areaId: Id<"learningAreas">; gaps: { id: string; text: string; resolved: boolean; addedOn?: string; resolvedOn?: string }[] }) {
  const today = useToday();
  const addGap = useMutation(api.learning.addGap);
  const setGap = useMutation(api.learning.setGap);
  const removeGap = useMutation(api.learning.removeGap);
  const [draft, setDraft] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const open = gaps.filter((g) => !g.resolved);
  const resolved = gaps.filter((g) => g.resolved);

  return (
    <Section title="Things I don't know" icon={CircleHelp} hint="Feynman's notebook. Where your explanation stalls, write it here — then go close it.">
      <div className="space-y-1.5">
        {open.length === 0 && <p className="text-xs text-muted-foreground">No open gaps. Practise, explain it out loud, and note where you stall.</p>}
        {open.map((g) => (
          <div key={g.id} className="group flex items-start gap-2">
            <input
              type="checkbox"
              checked={false}
              onChange={() =>
                void setGap({ id: areaId, gapId: g.id, resolved: true, date: today }).then(() => reward("Gap closed", undefined, false))
              }
              className="mt-1 size-4 shrink-0 accent-[var(--success)]"
              aria-label="Mark resolved"
            />
            <div className="min-w-0 flex-1">
              <InlineEdit value={g.text} onSave={(t) => t.trim() && void setGap({ id: areaId, gapId: g.id, text: t, date: today })} className="text-sm" />
            </div>
            <button
              onClick={() => void removeGap({ id: areaId, gapId: g.id })}
              className="rounded p-1 text-muted-foreground opacity-100 transition hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Remove gap"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            void addGap({ id: areaId, text: draft, date: today })
              .then(() => setDraft(""))
              .catch((err) => toast(errMsg(err), { tone: "warning" }));
          }}
          className="pt-1"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a gap… (Enter)"
            className="h-8 w-full rounded-md border border-input bg-card px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
          />
        </form>
        {resolved.length > 0 && (
          <div className="pt-2">
            <button onClick={() => setShowResolved((s) => !s)} className="text-xs text-muted-foreground hover:text-foreground">
              {showResolved ? "Hide" : "Show"} {resolved.length} closed
            </button>
            {showResolved && (
              <div className="mt-1.5 space-y-1">
                {resolved.map((g) => (
                  <label key={g.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked
                      onChange={() => void setGap({ id: areaId, gapId: g.id, resolved: false, date: today })}
                      className="mt-1 size-4 shrink-0 accent-[var(--success)]"
                    />
                    <span className="line-through">{g.text}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Resources tab
// ─────────────────────────────────────────────────────────────────────────

function AreaResources({ areaId, activeCount }: { areaId: Id<"learningAreas">; activeCount: number }) {
  const rows = useQuery(api.resources.list, { learningAreaId: areaId });
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<Id<"resources"> | null>(null);
  const [finishing, setFinishing] = useState<ResourceRow | null>(null);
  const [showDropped, setShowDropped] = useState(false);
  const open = rows?.find((r) => r._id === openId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Keep 1–2 active at a time. Finish, write takeaways, then turn them into cards.
          {activeCount > 2 && (
            <Chip tone="warning" className="ml-2">
              <AlertTriangle /> {activeCount} active
            </Chip>
          )}
        </p>
        <div className="flex gap-2">
          <Link href="/library" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <BookOpen /> Library
          </Link>
          <button onClick={() => setCreating(true)} className={buttonVariants({ size: "sm" })}>
            <Plus /> Resource
          </button>
        </div>
      </div>
      {rows === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyHint
          icon={BookOpen}
          title="No resources for this area"
          hint="Save books, courses and videos with a one-line reason. Start one, finish it, keep the takeaways."
          action={
            <button onClick={() => setCreating(true)} className={buttonVariants({ size: "sm" })}>
              <Plus /> Resource
            </button>
          }
        />
      ) : (
        <div className="space-y-5">
          {RESOURCE_STATUSES.filter((s) => s.value !== "dropped" || showDropped).map((s) => {
            const list = rows.filter((r) => r.status === s.value);
            if (!list.length) return null;
            return (
              <div key={s.value}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: s.dot }} />
                  <h3 className="text-xs font-semibold uppercase tracking-wide">{s.label}</h3>
                  <span className="text-xs text-muted-foreground">{list.length}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((r) => (
                    <ResourceCard key={r._id} r={r} showArea={false} onOpen={() => setOpenId(r._id)} />
                  ))}
                </div>
              </div>
            );
          })}
          {rows.some((r) => r.status === "dropped") && (
            <button onClick={() => setShowDropped((d) => !d)} className="text-xs text-muted-foreground hover:text-foreground">
              {showDropped ? "Hide dropped" : `Show ${rows.filter((r) => r.status === "dropped").length} dropped`}
            </button>
          )}
          {rows.length > 0 && <Bar value={(rows.filter((r) => r.status === "done").length / rows.length) * 100} tone="success" className="max-w-xs" />}
        </div>
      )}
      <ResourceCreateDialog open={creating} onClose={() => setCreating(false)} learningAreaId={areaId} />
      <ResourceDrawer resource={open} onClose={() => setOpenId(null)} onFinish={(r) => setFinishing(r)} />
      <FinishResourceDialog resource={finishing} onClose={() => setFinishing(null)} />
    </div>
  );
}
