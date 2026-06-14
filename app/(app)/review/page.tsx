"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Sparkles,
  CheckSquare,
  Target,
  FolderKanban,
  Clock,
  Repeat,
  StickyNote,
  Smile,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
} from "lucide-react";
import { Card, Topbar } from "@/components/ui";
import { DetailSkeleton } from "@/components/Skeleton";
import { MarkdownLite } from "@/components/tasks/MarkdownLite";

const h = (sec: number) => (sec / 3600).toFixed(1);

export default function ReviewPage() {
  const [offset, setOffset] = useState(0);
  const s = useQuery(api.reviews.summary, { weekOffset: offset });
  const past = useQuery(api.reviews.list);
  const generate = useAction(api.reviews.generate);
  const save = useMutation(api.reviews.save);

  const [generating, setGenerating] = useState(false);
  const [ai, setAi] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);
  const lastWeek = useRef<string | null>(null);

  // re-seed editable fields whenever the viewed week changes
  useEffect(() => {
    if (s && lastWeek.current !== s.weekStart) {
      lastWeek.current = s.weekStart;
      setAi((s.saved?.content?.aiInsights as string) ?? null);
      setNotes(s.saved?.userNotes ?? "");
    }
  }, [s]);

  const offsetLabel =
    offset === 0 ? "This week" : offset === -1 ? "Last week" : offset === 1 ? "Next week" : `${offset > 0 ? "+" : ""}${offset} weeks`;

  if (!s)
    return (
      <div>
        <Topbar />
        <DetailSkeleton />
      </div>
    );

  async function runGenerate() {
    setGenerating(true);
    try {
      const text = await generate({ weekOffset: offset });
      setAi(text);
    } catch (e) {
      setAi(`⚠️ Could not generate (likely the free model rate limit). ${String(e)}`);
    } finally {
      setGenerating(false);
    }
  }

  async function saveNotes() {
    await save({ weekStart: s!.weekStart, weekEnd: s!.weekEnd, userNotes: notes });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 1500);
  }

  return (
    <div>
      <Topbar />
      <div className="mx-auto max-w-5xl px-8 py-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Weekly Review</h1>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setOffset((o) => o - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOffset((o) => o + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {offset !== 0 && (
                <button
                  onClick={() => setOffset(0)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  This week
                </button>
              )}
              <span className="text-sm text-muted-foreground">
                {offsetLabel} · {s.weekStart} → {s.weekEnd}
              </span>
            </div>
          </div>
          <button
            onClick={() => void runGenerate()}
            disabled={generating}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? "Generating…" : ai ? "Regenerate AI review" : "Generate AI review & plan"}
          </button>
        </div>

        {/* Stat row */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat icon={CheckSquare} label="Tasks done" value={s.tasksCompleted.total} />
          <Stat icon={Clock} label="Focus" value={`${h(s.focus.totalSeconds)}h`} />
          <Stat icon={Smile} label="Avg mood" value={s.mood.avg != null ? `${s.mood.avg}/10` : "—"} />
          <Stat icon={StickyNote} label="Notes added" value={s.notes.count} />
        </div>

        {/* AI review */}
        <Card className="mt-6 bg-card-2">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> AI review &amp; next-week plan
          </h2>
          {ai ? (
            <div className="rounded-lg bg-muted/20 p-4">
              <MarkdownLite text={ai} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generate a reflection and a concrete plan for next week from this week&apos;s data.
            </p>
          )}
        </Card>

        {/* Sections grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Section icon={CheckSquare} title="Tasks completed (by area)">
            {Object.keys(s.tasksCompleted.byArea).length === 0 ? (
              <Empty />
            ) : (
              Object.entries(s.tasksCompleted.byArea).map(([area, n]) => (
                <Row key={area} label={area} value={`${n}`} />
              ))
            )}
          </Section>

          <Section icon={Clock} title="Focus time (by area)">
            {s.focus.byArea.length === 0 ? (
              <Empty />
            ) : (
              s.focus.byArea.map((a) => <Row key={a.name} label={a.name} value={`${h(a.seconds)}h`} />)
            )}
          </Section>

          <Section icon={CalendarRange} title="Schedule (plan vs actual)">
            {s.schedule.totalBlocks === 0 ? (
              <Empty />
            ) : (
              <>
                <Row label="Adherence" value={`${s.schedule.adherence}% (${s.schedule.done}/${s.schedule.totalBlocks})`} />
                <Row label="Planned" value={`${s.schedule.scheduledHours}h`} />
                <Row label="Actually focused" value={`${s.schedule.actualHours}h`} />
                {s.schedule.byArea.slice(0, 4).map((a) => (
                  <Row key={a.name} label={`· ${a.name}`} value={`${a.hours}h planned`} />
                ))}
              </>
            )}
          </Section>

          <Section icon={Target} title="Goals progress">
            {s.goals.length === 0 ? (
              <Empty />
            ) : (
              s.goals.map((g) => (
                <div key={g.title} className="rounded-lg bg-muted/30 px-3 py-2">
                  <div className="flex justify-between text-sm">
                    <span>{g.title}</span>
                    <span className="text-muted-foreground">
                      {g.progress}% · {g.done}/{g.total}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${g.progress}%` }} />
                  </div>
                </div>
              ))
            )}
          </Section>

          <Section icon={FolderKanban} title="Projects status">
            {s.projects.length === 0 ? (
              <Empty />
            ) : (
              s.projects.map((p) => (
                <Row key={p.title} label={p.title} value={`${p.status} · ${p.progress}%`} />
              ))
            )}
          </Section>

          <Section icon={Repeat} title="Habits & streaks">
            {s.habits.length === 0 ? (
              <Empty />
            ) : (
              s.habits.map((hb) => (
                <Row key={hb.title} label={hb.title} value={`${hb.thisWeek}× · 🔥${hb.streak}`} />
              ))
            )}
          </Section>

          <Section icon={StickyNote} title="Notes & learning">
            {s.notes.titles.length === 0 ? (
              <Empty />
            ) : (
              s.notes.titles.map((t, i) => <Row key={i} label={t} value="" />)
            )}
          </Section>
        </div>

        {/* Your notes */}
        <Card className="mt-6">
          <h2 className="mb-3 font-semibold">Your reflections</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your own thoughts on the week…"
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => void saveNotes()}
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
            >
              Save reflections
            </button>
            {savedMsg && <span className="text-sm text-primary">Saved ✓</span>}
          </div>
        </Card>

        {/* Past reviews */}
        {past && past.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Past reviews
            </h2>
            <div className="space-y-1.5">
              {past.map((r) => (
                <div
                  key={r._id}
                  className="rounded-lg border border-border bg-card/50 px-4 py-2 text-sm"
                >
                  {r.weekStart} → {r.weekEnd}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CheckSquare;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-lg font-bold leading-none">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof CheckSquare;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
      <span className="truncate">{label}</span>
      {value && <span className="text-muted-foreground">{value}</span>}
    </div>
  );
}

function Empty() {
  return <p className="text-xs text-muted-foreground">Nothing this week.</p>;
}
