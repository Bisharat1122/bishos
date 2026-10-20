"use client";

/**
 * Practice: log a session (kind, minutes, skill, what you practised, gaps
 * found, "What can you now explain?"). The explanation becomes an idea note;
 * from there one click plants a learn-in-public content seed.
 */
import { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { ArrowRight, CheckCircle2, Dumbbell, Lightbulb, Megaphone, Trash2 } from "lucide-react";
import { Chip, EmptyHint, Field, Segmented, Select, TextArea, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { fmtMin, relDay, useToday } from "@/lib/day";
import { PRACTICE_KINDS, PracticeKind, errMsg } from "./meta";
import { MakePublicDialog } from "./MakePublicDialog";

type Skill = Doc<"skillNodes">;

/** Flatten the skill tree depth-first for a select. */
export function flattenSkills(skills: Skill[]): { skill: Skill; depth: number }[] {
  const ids = new Set(skills.map((s) => s._id as string));
  const kids = new Map<string, Skill[]>();
  for (const s of skills) {
    const k = s.parentId && ids.has(s.parentId) ? s.parentId : "root";
    if (!kids.has(k)) kids.set(k, []);
    kids.get(k)!.push(s);
  }
  const out: { skill: Skill; depth: number }[] = [];
  const walk = (key: string, depth: number) => {
    for (const s of (kids.get(key) ?? []).sort((a, b) => a.order - b.order)) {
      out.push({ skill: s, depth });
      walk(s._id, depth + 1);
    }
  };
  walk("root", 0);
  return out;
}

const MINUTE_CHIPS = [10, 15, 25, 45, 60, 90];

export function PracticeLogger({ areaId, areaName, skills }: { areaId: Id<"learningAreas">; areaName: string; skills: Skill[] }) {
  const today = useToday();
  const log = useMutation(api.learning.logPractice);
  const [kind, setKind] = useState<PracticeKind>("practice");
  const [minutes, setMinutes] = useState(25);
  const [skillId, setSkillId] = useState("");
  const [what, setWhat] = useState("");
  const [gaps, setGaps] = useState("");
  const [explain, setExplain] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastIdea, setLastIdea] = useState<{ id: Id<"notes">; title: string } | null>(null);
  const [publicFor, setPublicFor] = useState<Id<"notes"> | null>(null);
  const flat = flattenSkills(skills);

  async function submit() {
    if (!minutes || minutes < 1) {
      toast("How many minutes?", { tone: "warning" });
      return;
    }
    setSaving(true);
    try {
      const res = await log({
        learningAreaId: areaId,
        date: today,
        minutes,
        kind,
        skillNodeId: skillId ? (skillId as Id<"skillNodes">) : undefined,
        whatPracticed: what || undefined,
        gapsFound: gaps || undefined,
        explainNow: explain || undefined,
      });
      reward(`Practice logged · ${fmtMin(minutes)} ${areaName}`, res.xp || undefined, minutes >= 45);
      if (res.gapsAdded) toast(`${res.gapsAdded} gap${res.gapsAdded === 1 ? "" : "s"} added to “Things I don't know”`, { tone: "info" });
      setLastIdea(res.ideaNoteId ? { id: res.ideaNoteId, title: explain.split(/\r?\n/)[0].slice(0, 90) } : null);
      setWhat("");
      setGaps("");
      setExplain("");
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setSaving(false);
    }
  }

  const kindHint = PRACTICE_KINDS.find((k) => k.value === kind)?.hint;

  return (
    <div className="space-y-4">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-1.5">
          <Segmented<PracticeKind> value={kind} onChange={setKind} size="sm" options={PRACTICE_KINDS.map((k) => ({ value: k.value, label: k.label }))} />
          {kindHint && <p className="text-[11px] text-muted-foreground">{kindHint}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minutes">
            <div className="flex flex-wrap items-center gap-1.5">
              {MINUTE_CHIPS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutes(m)}
                  className={cn(
                    "h-8 rounded-md border px-2.5 text-xs font-medium tabular-nums transition",
                    minutes === m ? "border-ring bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent",
                  )}
                >
                  {m}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={600}
                value={minutes || ""}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="h-8 w-16 rounded-md border border-input bg-card px-2 text-xs tabular-nums outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                aria-label="Custom minutes"
              />
            </div>
          </Field>
          <Field label="Skill (optional)">
            <Select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
              <option value="">Whole area</option>
              {flat.map(({ skill, depth }) => (
                <option key={skill._id} value={skill._id}>
                  {"  ".repeat(depth)}
                  {depth ? "↳ " : ""}
                  {skill.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="What did you practise?">
          <TextArea value={what} onChange={(e) => setWhat(e.target.value)} placeholder="Recorded 3 takes of a 60-second explainer on pricing…" className="min-h-[64px]" />
        </Field>
        <Field label="Gaps found" hint="One per line — they go to “Things I don't know”. Drill your weakest point next time.">
          <TextArea value={gaps} onChange={(e) => setGaps(e.target.value)} placeholder={"How to handle the price objection\nWhat a good hook length is"} className="min-h-[64px]" />
        </Field>
        <Field
          label={
            <span className="inline-flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-success" /> What can you now explain?
            </span>
          }
          hint="In your own words, as if to a smart 12-year-old. Saved as an idea note — and it can become a post."
        >
          <TextArea value={explain} onChange={(e) => setExplain(e.target.value)} placeholder="Price anchoring works because…" className="min-h-[90px]" />
        </Field>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className={buttonVariants()}>
            <Dumbbell /> {saving ? "Logging…" : "Log session"}
          </button>
        </div>
      </form>

      {lastIdea && (
        <div className="os-rise flex flex-wrap items-center gap-3 rounded-xl border border-success/30 bg-success-soft p-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Idea note saved</p>
            <p className="truncate text-xs text-muted-foreground">{lastIdea.title}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/notes/${lastIdea.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Open note
            </Link>
            <button onClick={() => setPublicFor(lastIdea.id)} className={buttonVariants({ size: "sm" })}>
              Make it public <ArrowRight />
            </button>
          </div>
        </div>
      )}
      {publicFor && <MakePublicDialog noteId={publicFor} open onClose={() => setPublicFor(null)} />}
    </div>
  );
}

type SessionRow = Doc<"practiceSessions"> & { skillTitle?: string; ideaNote?: { title: string; madePublic: boolean } };

export function PracticeHistory({ sessions }: { sessions: SessionRow[] }) {
  const today = useToday();
  const remove = useMutation(api.learning.removePractice);
  const [publicFor, setPublicFor] = useState<Id<"notes"> | null>(null);
  if (!sessions.length)
    return (
      <EmptyHint
        icon={Dumbbell}
        title="No sessions yet"
        hint="Log what you practised and the gaps you found. Practice and recall earn credit here — rereading and highlighting don't."
      />
    );
  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div key={s._id} className="group rounded-lg border border-border bg-card p-3 text-sm shadow-card">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium">{relDay(s.date, today)}</span>
            <Chip tone="outline">{PRACTICE_KINDS.find((k) => k.value === s.kind)?.label ?? s.kind}</Chip>
            <Chip tone="muted">{fmtMin(s.minutes)}</Chip>
            {s.skillTitle && <Chip tone="info">{s.skillTitle}</Chip>}
            <button
              onClick={() => {
                if (confirm("Delete this session? Its XP is removed (the idea note stays).")) void remove({ id: s._id });
              }}
              className="ml-auto rounded p-1 text-muted-foreground opacity-100 transition hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Delete session"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {s.whatPracticed && <p className="mt-1.5 whitespace-pre-wrap">{s.whatPracticed}</p>}
          {s.gapsFound && (
            <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
              <span className="font-medium text-warning">Gaps: </span>
              {s.gapsFound}
            </p>
          )}
          {s.ideaNoteId && s.ideaNote && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
              <Lightbulb className="h-3.5 w-3.5 shrink-0 text-success" />
              <Link href={`/notes/${s.ideaNoteId}`} className="min-w-0 flex-1 truncate text-xs font-medium hover:underline">
                {s.ideaNote.title}
              </Link>
              {s.ideaNote.madePublic ? (
                <Chip tone="success">
                  <Megaphone /> Public
                </Chip>
              ) : (
                <button onClick={() => setPublicFor(s.ideaNoteId!)} className="text-xs font-medium text-foreground underline-offset-2 hover:underline">
                  Make it public →
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      {publicFor && <MakePublicDialog noteId={publicFor} open onClose={() => setPublicFor(null)} />}
    </div>
  );
}
