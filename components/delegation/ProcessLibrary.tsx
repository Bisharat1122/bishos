"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { BookOpen, Check, Circle, FileText, Plus, Video } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Chip, EmptyHint, Section, Segmented, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { relDay, todayYmd, ymdOf } from "@/lib/day";
import { errText } from "@/components/habits/util";
import { RUNGS, RUNG_LABEL, STATUS_META, safeUrl, type Rung } from "./meta";
import type { ProcessItem } from "./ProcessEditor";

export function ProcessLibrary({
  onOpen,
  onNew,
  rung,
  setRung,
}: {
  onOpen: (id: Id<"processes">) => void;
  onNew: () => void;
  rung: Rung | "all";
  setRung: (r: Rung | "all") => void;
}) {
  const list = useQuery(api.delegation.processes);
  const queue = useQuery(api.delegation.recordQueue);
  const createFromTask = useMutation(api.delegation.createFromTask);
  const markPerformed = useMutation(api.delegation.markPerformed);

  const filtered = useMemo(() => (list ?? []).filter((p) => rung === "all" || p.rung === rung), [list, rung]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list?.length ?? 0 };
    for (const p of list ?? []) c[p.rung] = (c[p.rung] ?? 0) + 1;
    return c;
  }, [list]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented<Rung | "all">
            size="sm"
            value={rung}
            onChange={setRung}
            options={[{ value: "all", label: "All", count: counts.all }, ...RUNGS.map((r) => ({ value: r.key, label: r.label, count: counts[r.key] ?? 0 }))]}
          />
          <button onClick={onNew} className={buttonVariants({ size: "sm" })}>
            <Plus /> New SOP
          </button>
        </div>

        {list === undefined ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="skeleton h-32" />
            <div className="skeleton h-32" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyHint
            icon={BookOpen}
            title={list.length ? "Nothing on this rung yet" : "Your process library is empty"}
            hint="An SOP is the 7–15 steps that produce 80% of the result. Write one for something you repeat — client onboarding and lead-to-close are the best first two."
            action={
              <button onClick={onNew} className={buttonVariants()}>
                <Plus /> Write your first SOP
              </button>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((p) => (
              <ProcessCard
                key={p._id}
                p={p}
                onOpen={() => onOpen(p._id)}
                onPerformed={async () => {
                  try {
                    await markPerformed({ id: p._id });
                    toast("Logged a run", { tone: "success", sub: p.recordingUrl ? undefined : "Tip: record the next run (Camcorder Method)." });
                  } catch (e) {
                    toast(errText(e), { tone: "warning" });
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Section title="Record this next time" icon={Video} hint="Tasks you marked “delegate” that have no SOP yet.">
        {queue === undefined ? (
          <div className="skeleton h-24" />
        ) : queue.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing queued. When a task feels like “this shouldn&apos;t be me”, flag it as <span className="font-medium text-foreground">delegate</span> — it lands here so you can record it the next time you do it.
          </p>
        ) : (
          <ul className="space-y-2">
            {queue.map((t) => (
              <li key={t._id} className="rounded-lg border border-border p-2.5">
                <div className="flex items-start gap-2">
                  <span className={cn("mt-0.5 shrink-0", t.status === "done" ? "text-success" : "text-muted-foreground")}>
                    {t.status === "done" ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{t.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {RUNG_LABEL[t.rung]}
                      {t.areaName ? ` · ${t.areaName}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const id = await createFromTask({ taskId: t._id });
                      toast("Draft SOP created", { tone: "success", sub: "Record the next run, then write the key steps." });
                      onOpen(id);
                    } catch (e) {
                      toast(errText(e), { tone: "warning" });
                    }
                  }}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2 h-7 w-full text-xs")}
                >
                  <FileText className="h-3.5 w-3.5" /> Create SOP from task
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function ProcessCard({ p, onOpen, onPerformed }: { p: ProcessItem; onOpen: () => void; onPerformed: () => void }) {
  const meta = STATUS_META[p.status];
  const n = p.stepCount;
  const link = safeUrl(p.recordingUrl);
  const today = todayYmd();
  const doneToday = p.lastPerformedAt ? ymdOf(p.lastPerformedAt) === today : false;
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-card">
      <button onClick={onOpen} className="min-w-0 text-left">
        <p className="font-medium leading-snug hover:underline">{p.title}</p>
        {p.trigger && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">Starts when: {p.trigger}</p>}
      </button>
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone="outline">{RUNG_LABEL[p.rung]}</Chip>
        <Chip tone={meta.tone}>{meta.label}</Chip>
        <Chip tone={n >= 7 && n <= 15 ? "success" : "muted"} title="7–15 major steps is the sweet spot">
          {n} step{n === 1 ? "" : "s"}
        </Chip>
        {p.frequency && <Chip tone="muted" className="capitalize">{p.frequency === "adhoc" ? "as needed" : p.frequency}</Chip>}
      </div>
      <div className="mt-auto flex items-center gap-2 pt-1 text-xs text-muted-foreground">
        <span className="min-w-0 flex-1 truncate">
          {p.owner && p.owner !== "me" ? `Owner: ${p.owner}` : "Owner: you"}
          {p.lastPerformedAt ? ` · ran ${relDay(ymdOf(p.lastPerformedAt), today).toLowerCase()}` : ""}
        </span>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-info hover:underline" title="Open the Camcorder recording">
            <Video className="h-3.5 w-3.5" /> Video
          </a>
        ) : null}
        <button
          onClick={onPerformed}
          disabled={doneToday}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 px-2 text-xs")}
          title="Log that you ran this process today"
        >
          <Check className="h-3 w-3" /> {doneToday ? "Ran today" : "Ran it"}
        </button>
      </div>
    </div>
  );
}
