"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  BookOpenText, ChevronLeft, ChevronRight, Sun, Moon, Star, Repeat, Timer, Inbox, StickyNote, PhoneCall, Clapperboard, Check, CalendarRange,
} from "lucide-react";
import { PageShell, Section, Chip, EmptyHint, cn, buttonVariants, inputClass, Metric } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { addDaysYmd, clockLabel, dateOf, fmtMin, fmtYmd, todayYmd } from "@/lib/day";
import { openRitual } from "@/lib/osEvents";

type Journal = { win?: string; gratitude?: string; hard?: string; improve?: string; free?: string };

export default function DayPage() {
  const { date } = useParams<{ date: string }>();
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const data = useQuery(api.days.detail, valid ? { date, dayStart: dateOf(date).getTime() } : "skip");
  const update = useMutation(api.days.update);
  const today = todayYmd();

  const [j, setJ] = useState<Journal>({});
  const [progress, setProgress] = useState("");
  const [lesson, setLesson] = useState("");
  const [resume, setResume] = useState("");
  const loaded = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (data === undefined || loaded.current === date) return;
    loaded.current = date;
    setJ(data.day?.journal ?? {});
    setProgress(data.day?.progressLine ?? "");
    setLesson(data.day?.lesson ?? "");
    setResume(data.day?.resumeNote ?? "");
  }, [data, date]);

  // Merge field edits and flush once (so fast edits to two fields both save).
  const pending = useRef<Record<string, unknown>>({});
  const flush = () => {
    if (timer.current) clearTimeout(timer.current);
    const p = pending.current;
    pending.current = {};
    if (Object.keys(p).length)
      void update({ ...(p as Omit<Parameters<typeof update>[0], "date">), date }).catch(() =>
        toast("Couldn't save your journal — check your connection and try again.", { tone: "warning" }),
      );
  };
  const save = (patch: Parameters<typeof update>[0]) => {
    const { date: _d, ...rest } = patch;
    void _d;
    pending.current = { ...pending.current, ...rest };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 600);
  };
  useEffect(() => () => flush(), // flush on unmount / day change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [date]);

  if (!valid)
    return (
      <PageShell title="Not a valid day" icon={BookOpenText}>
        <EmptyHint
          icon={BookOpenText}
          title="That page doesn't exist"
          hint="Journal pages are dated YYYY-MM-DD."
          action={
            <Link href="/journal" className={buttonVariants({ size: "sm" })}>
              Open the journal
            </Link>
          }
        />
      </PageShell>
    );
  const d = data?.day;
  const isToday = date === today;

  return (
    <PageShell
      title={fmtYmd(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
      icon={BookOpenText}
      subtitle={isToday ? "Today's page — fills itself as you live it." : "A page from your journal."}
      actions={
        <div className="flex items-center gap-1">
          <Link href={`/journal/${addDaysYmd(date, -1)}`} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Previous day">
            <ChevronLeft />
          </Link>
          <Link href="/journal" className={buttonVariants({ variant: "outline" })}>
            Journal
          </Link>
          <Link
            href={`/journal/${addDaysYmd(date, 1)}`}
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), date >= today && "pointer-events-none opacity-40")}
            aria-label="Next day"
            aria-disabled={date >= today || undefined}
            tabIndex={date >= today ? -1 : undefined}
          >
            <ChevronRight />
          </Link>
        </div>
      }
    >
      {data === undefined ? (
        <div className="skeleton h-96" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Day score" value={d?.dayScore ?? "—"} />
              <Stat label="Energy" value={d?.checkIn?.energy ? `${d.checkIn.energy}/5` : "—"} />
              <Stat label="Sleep" value={d?.checkIn?.sleepHours ? `${d.checkIn.sleepHours}h` : "—"} />
              <Stat label="Focus" value={fmtMin(data.focusMin)} />
            </div>

            <Section title="Reflection" icon={Moon} hint="Autosaves as you type.">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Progress — what moved forward?" value={progress} onChange={(v) => { setProgress(v); save({ date, progressLine: v }); }} />
                <Field label="Win of the day" value={j.win ?? ""} onChange={(v) => { const n = { ...j, win: v }; setJ(n); save({ date, journal: n }); }} />
                <Field label="Lesson learned" value={lesson} onChange={(v) => { setLesson(v); save({ date, lesson: v }); }} />
                <Field label="Grateful for" value={j.gratitude ?? ""} onChange={(v) => { const n = { ...j, gratitude: v }; setJ(n); save({ date, journal: n }); }} />
                <Field label="What was hard?" value={j.hard ?? ""} onChange={(v) => { const n = { ...j, hard: v }; setJ(n); save({ date, journal: n }); }} />
                <Field label="Do differently tomorrow" value={j.improve ?? ""} onChange={(v) => { const n = { ...j, improve: v }; setJ(n); save({ date, journal: n }); }} />
              </div>
              <label className="mt-3 block">
                <span className="text-xs font-medium text-muted-foreground">Free writing</span>
                <textarea
                  value={j.free ?? ""}
                  onChange={(e) => {
                    const n = { ...j, free: e.target.value };
                    setJ(n);
                    save({ date, journal: n });
                  }}
                  rows={5}
                  className={cn(inputClass, "mt-1 w-full py-2 leading-relaxed")}
                  placeholder="Anything on your mind…"
                />
              </label>
              <label className="mt-3 block">
                <span className="text-xs font-medium text-muted-foreground">Ready-to-resume note</span>
                <textarea
                  value={resume}
                  onChange={(e) => {
                    setResume(e.target.value);
                    save({ date, resumeNote: e.target.value });
                  }}
                  rows={2}
                  className={cn(inputClass, "mt-1 w-full py-2")}
                />
              </label>
            </Section>

            <Section title="Priorities" icon={Star}>
              {data.top3.length === 0 ? (
                <p className="text-sm text-muted-foreground">No Top priorities were set{isToday ? " yet" : ""}.</p>
              ) : (
                <ol className="space-y-1.5">
                  {data.top3.map((t, i) =>
                    t ? (
                      <li key={t._id} className="flex items-center gap-2 text-sm">
                        <span className={cn("flex size-5 items-center justify-center rounded-full text-[10px] font-semibold", t.status === "done" ? "bg-success text-background" : "bg-muted")}>
                          {t.status === "done" ? <Check className="h-3 w-3" /> : i + 1}
                        </span>
                        <span className={cn(t.status === "done" && "os-done-text")}>{t.title}</span>
                      </li>
                    ) : null,
                  )}
                </ol>
              )}
              {d?.intention && <p className="mt-3 text-sm">Intention: “{d.intention}”</p>}
              {d?.ifThen && (
                <p className="mt-1 text-sm text-muted-foreground">
                  If {d.ifThen.trigger}, then {d.ifThen.response}.
                </p>
              )}
              {isToday && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openRitual("startup")} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <Sun /> {d?.startupAt ? "Re-plan" : "Start-up"}
                  </button>
                  <button onClick={() => openRitual("shutdown")} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <Moon /> Shutdown
                  </button>
                </div>
              )}
            </Section>
          </div>

          <div className="space-y-4">
            <Section title={`Completed (${data.completed.length})`} icon={Check}>
              {data.completed.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing ticked off.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {data.completed.map((t) => (
                    <li key={t._id} className="truncate">
                      ✓ {t.title}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            {data.habits.length > 0 && (
              <Section title="Habits" icon={Repeat}>
                <div className="flex flex-wrap gap-1.5">
                  {data.habits.map((h, i) => (
                    <Chip key={i} tone={h.kind === "skip" ? "muted" : "success"}>
                      {h.title}
                      {h.kind !== "done" ? ` · ${h.kind}` : ""}
                    </Chip>
                  ))}
                </div>
              </Section>
            )}
            {data.blocks.length > 0 && (
              <Section title="Time blocks" icon={CalendarRange}>
                <div className="space-y-1 text-sm">
                  {data.blocks.map((b) => (
                    <p key={b._id} className={cn("flex gap-2", b.status === "done" ? "" : "text-muted-foreground")}>
                      <span className="w-14 shrink-0 text-xs tabular-nums">{clockLabel(b.startMin)}</span>
                      <span className="truncate">{b.title}</span>
                    </p>
                  ))}
                </div>
              </Section>
            )}
            {(data.interactions.length > 0 || data.published.length > 0) && (
              <Section title="Business" icon={PhoneCall}>
                <div className="space-y-1 text-sm">
                  {data.interactions.map((i) => (
                    <p key={i._id} className="truncate">
                      <span className="text-muted-foreground">{i.kind}:</span> {i.summary}
                    </p>
                  ))}
                  {data.published.map((c) => (
                    <p key={c._id} className="flex items-center gap-1.5 truncate">
                      <Clapperboard className="h-3.5 w-3.5" /> Published “{c.title}”
                    </p>
                  ))}
                </div>
              </Section>
            )}
            {(data.captures.length > 0 || data.notes.length > 0) && (
              <Section title="Captured" icon={Inbox}>
                <div className="space-y-1 text-sm">
                  {data.notes.map((n) => (
                    <Link key={n._id} href={`/notes/${n._id}`} className="flex items-center gap-1.5 truncate hover:underline">
                      <StickyNote className="h-3.5 w-3.5 shrink-0" /> {n.title}
                    </Link>
                  ))}
                  {data.captures.map((c) => (
                    <p key={c._id} className="truncate text-muted-foreground">
                      • {c.text}
                    </p>
                  ))}
                </div>
              </Section>
            )}
            <Section title="Rituals" icon={Timer}>
              <p className="flex items-center gap-2 text-sm">
                <Sun className="h-4 w-4" /> Start-up {d?.startupAt ? <Chip tone="success">done</Chip> : <Chip>—</Chip>}
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-sm">
                <Moon className="h-4 w-4" /> Shutdown {d?.shutdownAt ? <Chip tone="success">done</Chip> : <Chip>—</Chip>}
              </p>
            </Section>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-card">
      <Metric label={label} value={value} />
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, "mt-1 h-9 w-full")} />
    </label>
  );
}
