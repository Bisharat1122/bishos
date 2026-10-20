"use client";

/**
 * Route a conversation (AI): paste notes / a transcript → review proposals
 * (commitments, tasks, deal update or new deal, new people, content ideas)
 * with checkboxes → apply through the normal mutations. Nothing is written
 * until you press Apply.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Briefcase, HandCoins, Lightbulb, ListTodo, Loader2, MessagesSquare, Sparkles, UserPlus, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { RoutingProposals } from "@/convex/aiRouting";
import { Dialog, Field, Segmented, Select, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { useToday } from "@/lib/day";
import { PersonPicker } from "./PersonPicker";
import { STAGE_META, errMsg, isOpenStage, type Direction, type Stage } from "./meta";

type Row<T> = T & { on: boolean };

function Group({ title, icon: Icon, count, children }: { title: string; icon: LucideIcon; count: number; children: React.ReactNode }) {
  if (!count) return null;
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title} <span className="rounded bg-muted px-1 text-[10px] tabular-nums">{count}</span>
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Check({ on, onChange, children }: { on: boolean; onChange: (b: boolean) => void; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border p-2.5 transition-colors", on ? "border-border bg-card" : "border-dashed border-border bg-muted/30 opacity-70")}>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="mt-2 size-4 shrink-0 accent-[var(--primary)]" aria-label="Include" />
      <div className="min-w-0 flex-1 space-y-2">{children}</div>
    </div>
  );
}

export function RouteConversationDialog({ open, onClose, personId }: { open: boolean; onClose: () => void; personId?: Id<"people"> | null }) {
  const today = useToday();
  const route = useAction(api.aiRouting.routeConversation);
  const areas = useQuery(api.lifeAreas.list, open ? {} : "skip");
  const createPerson = useMutation(api.people.create);
  const createCommitment = useMutation(api.commitments.create);
  const createTask = useMutation(api.tasks.create);
  const updateDeal = useMutation(api.deals.update);
  const createDeal = useMutation(api.deals.create);
  const createIdea = useMutation(api.aiRouting.createContentIdea);
  const logTouch = useMutation(api.people.logInteraction);

  const [text, setText] = useState("");
  const [pid, setPid] = useState<Id<"people"> | null>(personId ?? null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<RoutingProposals | null>(null);
  const [commits, setCommits] = useState<Row<RoutingProposals["commitments"][number]>[]>([]);
  const [tasks, setTasks] = useState<Row<RoutingProposals["tasks"][number]>[]>([]);
  const [deal, setDeal] = useState<Row<NonNullable<RoutingProposals["dealUpdate"]>> | null>(null);
  const [people, setPeople] = useState<Row<RoutingProposals["newPeople"][number]>[]>([]);
  const [ideas, setIdeas] = useState<Row<RoutingProposals["contentIdeas"][number]>[]>([]);
  const [logIt, setLogIt] = useState(true);
  const [areaId, setAreaId] = useState("");
  const createdPeople = useRef(new Map<string, Id<"people">>());

  useEffect(() => {
    if (!open) return;
    setPid(personId ?? null);
    setResult(null);
  }, [open, personId]);

  const salesArea = useMemo(() => {
    const list = (areas ?? []).filter((a) => !a.archived).sort((a, b) => a.order - b.order);
    return list.find((a) => /sales|market/i.test(a.name)) ?? list[0];
  }, [areas]);
  useEffect(() => {
    if (!areaId && salesArea) setAreaId(salesArea._id);
  }, [areaId, salesArea]);

  const analyze = async () => {
    if (text.trim().length < 15 || loading) return;
    setLoading(true);
    try {
      const r = await route({ text, personId: pid ?? undefined, today });
      createdPeople.current = new Map();
      setResult(r);
      setCommits(r.commitments.map((c) => ({ ...c, on: true })));
      setTasks(r.tasks.map((t) => ({ ...t, on: true })));
      setDeal(r.dealUpdate ? { ...r.dealUpdate, on: true } : null);
      setPeople(r.newPeople.filter((p) => !p.existingId).map((p) => ({ ...p, on: true })));
      setIdeas(r.contentIdeas.map((i) => ({ ...i, on: true })));
      setLogIt(true);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setLoading(false);
    }
  };

  const total =
    commits.filter((c) => c.on).length +
    tasks.filter((t) => t.on).length +
    (deal?.on ? 1 : 0) +
    people.filter((p) => p.on).length +
    ideas.filter((i) => i.on).length +
    (logIt && pid ? 1 : 0);

  const apply = async () => {
    if (!result || applying) return;
    if (deal?.on && !deal.dealId) {
      const st = deal.stage ?? "contacted";
      if (!deal.dealTitle.trim()) return toast("Give the new deal a name (or untick it).", { tone: "warning" });
      if (isOpenStage(st) && (!deal.nextStep?.trim() || !deal.nextStepDate))
        return toast("A new open deal needs a next step and a date (or untick it).", { tone: "warning" });
    }
    setApplying(true);
    let done = 0;
    let xp = 0;
    const failures: string[] = [];
    // People created on an earlier (partly failed) attempt stay linkable.
    const nameToId = createdPeople.current;
    // Rows that were applied: unticked afterwards so a retry can't duplicate them.
    const okPeople = new Set<number>();
    const okCommits = new Set<number>();
    const okTasks = new Set<number>();
    const okIdeas = new Set<number>();
    let dealDone: { dealId: Id<"deals"> } | null = null;
    let touchDone = false;
    try {
      // 1 · new people first, so commitments can link to them
      for (const [idx, p] of people.entries()) {
        if (!p.on || !p.name.trim()) continue;
        try {
          const id = await createPerson({ name: p.name, companyName: p.company ?? undefined, title: p.title ?? undefined, source: "conversation" });
          nameToId.set(p.name.trim().toLowerCase(), id);
          okPeople.add(idx);
          done++;
        } catch (e) {
          failures.push(`${p.name}: ${errMsg(e)}`);
        }
      }
      const resolvePerson = (name: string | null, id: Id<"people"> | null) => id ?? (name ? nameToId.get(name.trim().toLowerCase()) ?? null : null) ?? pid;

      // 2 · deal update / new deal
      let dealId: Id<"deals"> | null = deal?.dealId ?? null;
      if (deal?.on) {
        try {
          const stage = deal.stage ?? deal.currentStage ?? "contacted";
          const closedReason = !isOpenStage(stage) && stage !== "won" ? result.summary || "From a routed conversation" : undefined;
          if (deal.dealId) {
            const res = await updateDeal({
              id: deal.dealId,
              date: today,
              stage: deal.stage ?? undefined,
              // blank → leave the deal's current next step alone (a "" would clear it and fail the open-deal rule)
              nextStep: isOpenStage(stage) ? deal.nextStep?.trim() || undefined : undefined,
              nextStepDate: isOpenStage(stage) ? deal.nextStepDate || undefined : undefined,
              lostReason: closedReason,
            });
            xp += res.xp;
          } else {
            const res = await createDeal({
              title: deal.dealTitle,
              stage,
              personId: pid ?? undefined,
              nextStep: deal.nextStep ?? undefined,
              nextStepDate: deal.nextStepDate ?? undefined,
              lostReason: closedReason,
              sourceChannel: "outbound",
              date: today,
            });
            dealId = res.id;
            xp += res.xp;
          }
          if (dealId) dealDone = { dealId };
          done++;
        } catch (e) {
          failures.push(`Deal: ${errMsg(e)}`);
        }
      }

      // 3 · commitments
      for (const [idx, c] of commits.entries()) {
        if (!c.on || !c.title.trim()) continue;
        try {
          await createCommitment({
            title: c.title,
            direction: c.direction,
            personId: resolvePerson(c.personName, c.personId) ?? undefined,
            dealId: dealId ?? undefined,
            promisedDate: c.date ?? undefined,
            source: "meeting",
          });
          okCommits.add(idx);
          done++;
        } catch (e) {
          failures.push(`${c.title}: ${errMsg(e)}`);
        }
      }

      // 4 · tasks (sales area)
      const lifeAreaId = (areaId || salesArea?._id) as Id<"lifeAreas"> | undefined;
      const wantedTasks = tasks.filter((x) => x.on && x.title.trim());
      if (wantedTasks.length && !lifeAreaId) failures.push("Tasks need a life area. Create one first.");
      else
        for (const [idx, t] of tasks.entries()) {
          if (!t.on || !t.title.trim()) continue;
          try {
            await createTask({
              title: t.title,
              priority: "med",
              lifeAreaId: lifeAreaId!,
              plannedFor: t.plannedFor ?? undefined,
              dealId: dealId ?? undefined,
              personId: pid ?? undefined,
              context: "calls",
            });
            okTasks.add(idx);
            done++;
          } catch (e) {
            failures.push(`${t.title}: ${errMsg(e)}`);
          }
        }

      // 5 · content ideas
      for (const [idx, i] of ideas.entries()) {
        if (!i.on || !i.title.trim()) continue;
        try {
          await createIdea({ title: i.title, why: i.why });
          okIdeas.add(idx);
          done++;
        } catch (e) {
          failures.push(`${i.title}: ${errMsg(e)}`);
        }
      }

      // 6 · log the conversation itself as a meeting touch
      if (logIt && pid) {
        try {
          const res = await logTouch({ kind: "meeting", summary: result.summary || text.slice(0, 280), personId: pid, dealId: dealId ?? undefined, date: today });
          xp += res.xp;
          touchDone = true;
          done++;
        } catch (e) {
          failures.push(`Touch: ${errMsg(e)}`);
        }
      }

      if (failures.length) {
        // Keep only what failed ticked, so "Apply" again retries just those.
        const off = <T extends { on: boolean }>(ok: Set<number>) => (rows: T[]) => rows.map((r, j) => (ok.has(j) ? { ...r, on: false } : r));
        setPeople(off(okPeople));
        setCommits(off(okCommits));
        setTasks(off(okTasks));
        setIdeas(off(okIdeas));
        if (dealDone) {
          const created = dealDone.dealId;
          // a created deal becomes the existing deal later items link to
          setDeal((d) => (d ? { ...d, dealId: created, on: false } : d));
        }
        if (touchDone) setLogIt(false);
      }

      if (failures.length) toast(`${done} applied · ${failures.length} skipped`, { tone: "warning", sub: failures[0] });
      else reward(`Conversation routed: ${done} item${done === 1 ? "" : "s"}`, xp || undefined);
      if (!failures.length) {
        setText("");
        setResult(null);
        onClose();
      }
    } finally {
      setApplying(false);
    }
  };

  const patchAt = <T,>(set: React.Dispatch<React.SetStateAction<Row<T>[]>>, i: number, p: Partial<Row<T>>) =>
    set((rows) => rows.map((r, j) => (j === i ? { ...r, ...p } : r)));

  return (
    <Dialog open={open} onClose={onClose} title={<span className="flex items-center gap-2"><Wand2 className="h-5 w-5" /> Route a conversation</span>} size="xl">
      {!result ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste call notes or a transcript. AI proposes the promises, tasks, deal update, new contacts and content ideas. You pick what to keep.
          </p>
          <Field label="Who was it with? (optional)">
            <PersonPicker value={pid} onChange={(id) => setPid(id)} />
          </Field>
          <Field label="Notes or transcript">
            <TextArea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[220px] font-mono text-[13px]"
              placeholder={"Call with Sara (Acme), Tue\n- They're losing ~10h/week on manual reports\n- Budget approved for Q1, CFO signs\n- I'll send the case study + pricing by Friday\n- She'll intro me to their ops lead\n- Worried about migration time…"}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void analyze();
              }}
            />
          </Field>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{text.length.toLocaleString()} characters</span>
            <div className="flex gap-2">
              <button onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
                Cancel
              </button>
              <button onClick={() => void analyze()} disabled={loading || text.trim().length < 15} className={buttonVariants()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Reading…" : "Analyze"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {result.summary && (
            <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
              <span className="font-medium">Summary: </span>
              {result.summary}
            </div>
          )}
          {total === 0 && !result.summary && <p className="text-sm text-muted-foreground">Nothing actionable found. Try adding more detail.</p>}

          {pid && (
            <Check on={logIt} onChange={setLogIt}>
              <p className="flex items-center gap-2 text-sm">
                <MessagesSquare className="h-4 w-4 text-muted-foreground" /> Log this conversation as a meeting touch
              </p>
            </Check>
          )}

          <Group title="Commitments" icon={HandCoins} count={commits.length}>
            {commits.map((c, i) => (
              <Check key={i} on={c.on} onChange={(on) => patchAt(setCommits, i, { on })}>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <TextInput value={c.title} onChange={(e) => patchAt(setCommits, i, { title: e.target.value })} className="flex-1" />
                  <TextInput type="date" value={c.date ?? ""} onChange={(e) => patchAt(setCommits, i, { date: e.target.value || null })} className="sm:w-40" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Segmented
                    size="sm"
                    value={c.direction}
                    onChange={(d: Direction) => patchAt(setCommits, i, { direction: d })}
                    options={[
                      { value: "i_owe", label: "I owe" },
                      { value: "owed_to_me", label: "Owed to me" },
                    ]}
                  />
                  <div className="min-w-[200px] flex-1">
                    <PersonPicker size="sm" value={c.personId} onChange={(id) => patchAt(setCommits, i, { personId: id })} placeholder={c.personName ? `Match “${c.personName}”…` : "Person (optional)"} />
                  </div>
                </div>
              </Check>
            ))}
          </Group>

          {deal && (
            <Group title={deal.dealId ? "Deal update" : "New deal"} icon={Briefcase} count={1}>
              <Check on={deal.on} onChange={(on) => setDeal({ ...deal, on })}>
                <p className="text-sm">
                  {deal.dealId ? (
                    <>
                      Update <span className="font-medium">{deal.dealTitle}</span>
                      {deal.currentStage && <span className="text-muted-foreground"> (now {STAGE_META[deal.currentStage].short})</span>}
                    </>
                  ) : (
                    <>Create a new deal</>
                  )}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {!deal.dealId && <TextInput value={deal.dealTitle} onChange={(e) => setDeal({ ...deal, dealTitle: e.target.value })} placeholder="Deal name" />}
                  <Select value={deal.stage ?? deal.currentStage ?? "contacted"} onChange={(e) => setDeal({ ...deal, stage: e.target.value as Stage })}>
                    {(Object.keys(STAGE_META) as Stage[]).map((s) => (
                      <option key={s} value={s}>
                        {STAGE_META[s].label}
                      </option>
                    ))}
                  </Select>
                </div>
                {isOpenStage(deal.stage ?? deal.currentStage ?? "contacted") && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px]">
                    <TextInput value={deal.nextStep ?? ""} onChange={(e) => setDeal({ ...deal, nextStep: e.target.value })} placeholder="Next step (required)" />
                    <TextInput type="date" value={deal.nextStepDate ?? ""} onChange={(e) => setDeal({ ...deal, nextStepDate: e.target.value || null })} />
                  </div>
                )}
              </Check>
            </Group>
          )}

          <Group title="Tasks" icon={ListTodo} count={tasks.length}>
            {(areas?.length ?? 0) > 1 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                Into area
                <Select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="h-8 w-auto">
                  {(areas ?? []).map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {tasks.map((t, i) => (
              <Check key={i} on={t.on} onChange={(on) => patchAt(setTasks, i, { on })}>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <TextInput value={t.title} onChange={(e) => patchAt(setTasks, i, { title: e.target.value })} className="flex-1" />
                  <TextInput type="date" value={t.plannedFor ?? ""} onChange={(e) => patchAt(setTasks, i, { plannedFor: e.target.value || null })} className="sm:w-40" />
                </div>
              </Check>
            ))}
          </Group>

          <Group title="New people" icon={UserPlus} count={people.length}>
            {people.map((p, i) => (
              <Check key={i} on={p.on} onChange={(on) => patchAt(setPeople, i, { on })}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <TextInput value={p.name} onChange={(e) => patchAt(setPeople, i, { name: e.target.value })} placeholder="Name" />
                  <TextInput value={p.company ?? ""} onChange={(e) => patchAt(setPeople, i, { company: e.target.value || null })} placeholder="Company" />
                  <TextInput value={p.title ?? ""} onChange={(e) => patchAt(setPeople, i, { title: e.target.value || null })} placeholder="Title" />
                </div>
              </Check>
            ))}
          </Group>

          <Group title="Content ideas (their objections & questions)" icon={Lightbulb} count={ideas.length}>
            {ideas.map((x, i) => (
              <Check key={i} on={x.on} onChange={(on) => patchAt(setIdeas, i, { on })}>
                <TextInput value={x.title} onChange={(e) => patchAt(setIdeas, i, { title: e.target.value })} />
                {x.why && <p className="text-xs text-muted-foreground">Because they said: {x.why}</p>}
              </Check>
            ))}
          </Group>

          <div className="sticky bottom-0 -mx-6 -mb-6 flex items-center justify-between gap-2 border-t border-border bg-card px-6 py-3">
            <button onClick={() => setResult(null)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Back to text
            </button>
            <button onClick={() => void apply()} disabled={applying || total === 0} className={buttonVariants()}>
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Apply {total} selected
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
