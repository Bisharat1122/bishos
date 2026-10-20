"use client";

import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Inbox, ListTodo, StickyNote, Handshake, UserPlus, Clapperboard, GraduationCap, CheckCircle2, Trash2, AlarmClock,
  Wand2, Loader2, RotateCcw, Plus, Hourglass, Sparkles, PartyPopper,
} from "lucide-react";
import { PageShell, Section, Segmented, Chip, Kbd, EmptyHint, cn, buttonVariants, inputClass } from "@/components/os/kit";
import { reward, toast, celebrate, errorMessage } from "@/components/os/celebrate";
import { useCoarseNow, useStable } from "@/components/os/useCockpit";
import { addDaysYmd, dateOf, mondayOf, todayYmd } from "@/lib/day";
import { openCapture, isTyping } from "@/lib/osEvents";

type View = "open" | "snoozed" | "processed";
type Item = Doc<"inbox"> & { ageHours: number; stale: boolean };
type When = "today" | "tomorrow" | "week" | "none" | "someday";

const ACTIONS = [
  { key: "t", label: "Task", icon: ListTodo },
  { key: "n", label: "Note", icon: StickyNote },
  { key: "o", label: "I owe", icon: Handshake },
  { key: "w", label: "Waiting for", icon: Hourglass },
  { key: "p", label: "Person", icon: UserPlus },
  { key: "i", label: "Content idea", icon: Clapperboard },
  { key: "l", label: "To learn", icon: GraduationCap },
  { key: "d", label: "Done (2 min)", icon: CheckCircle2 },
  { key: "s", label: "Snooze", icon: AlarmClock },
  { key: "x", label: "Discard", icon: Trash2 },
] as const;

function age(h: number) {
  if (h < 1) return "just now";
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function InboxPage() {
  const now = useCoarseNow(60_000);
  const [view, setView] = useState<View>("open");
  // Keep rows stable across the minute tick, but never show (or triage) the
  // previous tab's rows under a new tab while its query loads.
  const rawItems = useQuery(api.inbox.list, { now, view }) as Item[] | undefined;
  const stableItems = useStable(rawItems ? { view, rows: rawItems } : undefined);
  const items = stableItems && stableItems.view === view ? stableItems.rows : undefined;
  const counts = useStable(useQuery(api.inbox.counts, { now }));
  const allAreas = useQuery(api.lifeAreas.list);
  // Archived areas can't receive new work; keep the picker in area order.
  const areas = useMemo(
    () => (allAreas ? allAreas.filter((a) => !a.archived).sort((a, b) => a.order - b.order) : undefined),
    [allAreas],
  );
  const sortAi = useAction(api.aiCapture.sortInbox);

  const toTask = useMutation(api.inbox.toTask);
  const toNote = useMutation(api.inbox.toNote);
  const toCommitment = useMutation(api.inbox.toCommitment);
  const toPerson = useMutation(api.inbox.toPerson);
  const toIdea = useMutation(api.inbox.toContentIdea);
  const toResource = useMutation(api.inbox.toResource);
  const markDone = useMutation(api.inbox.markDone);
  const snooze = useMutation(api.inbox.snooze);
  const discard = useMutation(api.inbox.discard);
  const restore = useMutation(api.inbox.restore);
  const update = useMutation(api.inbox.update);

  const [sel, setSel] = useState(0);
  const [mode, setMode] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState<string>("");
  const [when, setWhen] = useState<When>("none");
  const [priority, setPriority] = useState<"low" | "med" | "high">("med");
  const [brand, setBrand] = useState<"personal" | "company">("personal");
  const [why, setWhy] = useState("");
  const [promised, setPromised] = useState("");
  const [sorting, setSorting] = useState(false);

  const list = items ?? [];
  // Clamp: processing the last row shrinks the list under the selection.
  const selIdx = Math.min(sel, Math.max(0, list.length - 1));
  const current = list[selIdx];
  const today = todayYmd();

  useEffect(() => {
    if (!areaId && areas?.length) setAreaId(areas[0]._id);
  }, [areas, areaId]);

  useEffect(() => {
    if (!current) return;
    const s = current.suggestion as { title?: string; area?: string; type?: string } | undefined;
    setTitle(s?.title || current.text.split("\n")[0].slice(0, 200));
    const sa = areas?.find((a) => a.name.toLowerCase() === (s?.area ?? "").toLowerCase());
    if (sa) setAreaId(sa._id);
    setWhy("");
    setPromised("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?._id]);

  // "This week" = Friday, but never a past day (on Sat/Sun that Friday is gone).
  const fridayOrToday = () => {
    const fri = addDaysYmd(mondayOf(today), 4);
    return fri < today ? today : fri;
  };
  const whenToDate = (w: When) =>
    w === "today" ? today : w === "tomorrow" ? addDaysYmd(today, 1) : w === "week" ? fridayOrToday() : undefined;

  const after = (msg: string, xp = 2) => {
    setMode(null);
    const remaining = list.length - 1;
    if (remaining === 0 && view === "open") {
      celebrate(1.2);
      reward("Inbox zero. Mind like water.", xp);
    } else toast(msg, { tone: "success", xp });
  };

  async function run(key: string) {
    if (!current || view !== "open") return;
    const id = current._id as Id<"inbox">;
    const date = today;
    try {
      if (key === "t") {
        if (mode !== "t") return setMode("t");
        if (!areaId) return toast("Pick a Life Area", { tone: "warning" });
        await toTask({ id, title, lifeAreaId: areaId as Id<"lifeAreas">, priority, plannedFor: whenToDate(when), someday: when === "someday", date });
        after("Task created");
      } else if (key === "n") {
        await toNote({ id, title, noteType: "fleeting", lifeAreaId: (areaId || undefined) as Id<"lifeAreas"> | undefined, date });
        after("Saved as a note");
      } else if (key === "o" || key === "w") {
        if (mode !== key) return setMode(key);
        await toCommitment({
          id,
          title,
          direction: key === "o" ? "i_owe" : "owed_to_me",
          promisedDate: key === "o" ? promised || undefined : undefined,
          checkDate: key === "w" ? promised || undefined : undefined,
          date,
        });
        after(key === "o" ? "Commitment logged" : "Added to Waiting for");
      } else if (key === "p") {
        await toPerson({ id, name: title, date });
        after("Person added");
      } else if (key === "i") {
        if (mode !== "i") return setMode("i");
        await toIdea({ id, title, brand, date });
        after("Content idea saved");
      } else if (key === "l") {
        if (mode !== "l") return setMode("l");
        if (!why.trim()) return toast("Why are you saving it? One line.", { tone: "warning" });
        await toResource({ id, title, whySaved: why, date });
        after("Added to your Library");
      } else if (key === "d") {
        await markDone({ id, date });
        after("Done in under 2 minutes ✓");
      } else if (key === "s") {
        const t = dateOf(addDaysYmd(today, 1));
        t.setHours(9, 0, 0, 0);
        await snooze({ id, until: t.getTime() });
        after("Snoozed until tomorrow 9am", 0);
      } else if (key === "x") {
        await discard({ id });
        after("Discarded", 0);
      }
    } catch (e) {
      toast(errorMessage(e, "Couldn't process"), { tone: "warning" });
    }
  }

  // keyboard triage
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      // A ritual/dialog over the page: don't triage (X would discard) or eat its arrow keys.
      if (document.querySelector('[aria-modal="true"]')) return;
      const k = e.key.toLowerCase();
      if (k === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSel((s) => Math.min(list.length - 1, s + 1));
        setMode(null);
      } else if (k === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSel((s) => Math.max(0, s - 1));
        setMode(null);
      } else if (e.key === "Escape") setMode(null);
      else if (ACTIONS.some((a) => a.key === k)) {
        e.preventDefault();
        void run(k);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function aiSort() {
    if (!list.length || !areas) return;
    setSorting(true);
    try {
      const n = await sortAi({ items: list.slice(0, 30).map((i) => ({ id: i._id, text: i.text })), areas: areas.map((a) => a.name) });
      toast(`AI suggested a home for ${n} items`, { tone: "info", sub: "Tap a suggestion to accept it." });
    } catch (e) {
      toast(errorMessage(e, "AI sort failed"), { tone: "warning" });
    } finally {
      setSorting(false);
    }
  }

  const sug = current?.suggestion as { type?: string; title?: string; area?: string; twoMinute?: boolean } | undefined;
  const sugKey = sug?.type
    ? ({ task: "t", note: "n", commitment: "o", idea: "i", person: "p", resource: "l", trash: "x" } as Record<string, string>)[sug.type]
    : undefined;

  return (
    <PageShell
      title="Inbox"
      icon={Inbox}
      subtitle="Everything you capture lands here. Give each item a home — the 2-minute rule decides what to just do."
      actions={
        <>
          <button onClick={() => openCapture("inbox")} className={buttonVariants({ variant: "outline" })}>
            <Plus /> Capture <Kbd className="ml-1">C</Kbd>
          </button>
          <button onClick={() => void aiSort()} disabled={sorting || !list.length || view !== "open"} className={buttonVariants()}>
            {sorting ? <Loader2 className="animate-spin" /> : <Wand2 />} Sort with AI
          </button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented<View>
          value={view}
          onChange={(v) => {
            setView(v);
            setSel(0);
            setMode(null);
          }}
          options={[
            { value: "open", label: "To process", count: counts?.open },
            { value: "snoozed", label: "Snoozed" },
            { value: "processed", label: "History" },
          ]}
        />
        {counts && counts.stale > 0 && view === "open" && (
          <Chip tone="warning">
            <AlarmClock /> {counts.stale} older than 48h — process or discard
          </Chip>
        )}
      </div>

      {items === undefined ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="skeleton h-80" />
          <div className="skeleton h-80" />
        </div>
      ) : list.length === 0 ? (
        view === "open" ? (
          <EmptyHint
            icon={PartyPopper}
            title="Inbox zero"
            hint="Your head is clear. Press C anywhere to capture the next thought in two seconds."
            action={
              <button onClick={() => openCapture("dump")} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Sparkles /> Brain dump
              </button>
            }
          />
        ) : (
          <EmptyHint title={view === "snoozed" ? "Nothing snoozed" : "No history yet"} />
        )
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          {/* list */}
          <Section bodyClassName="p-1.5 sm:p-1.5">
            <div className="max-h-[65vh] space-y-0.5 overflow-y-auto">
              {list.map((it, i) => (
                <button
                  key={it._id}
                  onClick={() => {
                    setSel(i);
                    setMode(null);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition",
                    i === selIdx ? "bg-accent" : "hover:bg-accent/50",
                  )}
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", it.stale ? "bg-warning" : "bg-muted-foreground/40")} />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm">{it.text}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      {age(it.ageHours)} · {it.source ?? "quick"}
                      {it.suggestion && (it.suggestion as { type?: string }).type && (
                        <span className="inline-flex items-center gap-0.5 text-info">
                          <Sparkles className="h-3 w-3" /> {(it.suggestion as { type: string }).type}
                        </span>
                      )}
                      {it.processedTo && <span>→ {it.processedTo.type}</span>}
                    </span>
                  </span>
                  {view !== "open" && (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        restore({ id: it._id }).then(
                          () => toast("Back in the inbox", { tone: "success" }),
                          (err) => toast(errorMessage(err, "Couldn't restore"), { tone: "warning" }),
                        );
                      }}
                      className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                      title="Back to inbox"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* processor */}
          {current && view === "open" && (
            <Section title="Give it a home" hint={<span>Shortcut keys shown on each button · <Kbd>J</Kbd>/<Kbd>K</Kbd> to move</span>}>
              <textarea
                key={current._id}
                defaultValue={current.text}
                onBlur={(e) => {
                  const t = e.target.value.trim();
                  if (!t) e.target.value = current.text; // never blank an item
                  else if (t !== current.text) update({ id: current._id, text: t }).catch((err) => toast(errorMessage(err, "Couldn't save"), { tone: "warning" }));
                }}
                rows={3}
                className={cn(inputClass, "w-full py-2 text-sm")}
              />
              {sug?.type && sugKey && (
                <button
                  onClick={() => {
                    if (sug.title) setTitle(sug.title);
                    void run(sugKey);
                  }}
                  className="mt-3 flex w-full items-center gap-2 rounded-lg border border-info/30 bg-info-soft px-3 py-2 text-left text-sm text-info"
                >
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span className="flex-1">
                    AI suggests: <b>{sug.type}</b>
                    {sug.area ? ` in ${sug.area}` : ""}
                    {sug.twoMinute ? " · under 2 minutes — just do it" : ""}
                  </span>
                  <Kbd>{sugKey.toUpperCase()}</Kbd>
                </button>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {ACTIONS.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => void run(a.key)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition",
                      mode === a.key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
                      a.key === "x" && mode !== a.key && "hover:border-danger/40 hover:text-danger",
                    )}
                  >
                    <a.icon className="h-4 w-4" />
                    <span className="truncate">{a.label}</span>
                    <Kbd className={cn(mode === a.key && "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground")}>{a.key.toUpperCase()}</Kbd>
                  </button>
                ))}
              </div>

              {mode && (
                <div className="os-rise mt-4 space-y-3 rounded-xl border border-border bg-muted/40 p-3">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Title
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void run(mode);
                        }
                        if (e.key === "Escape") setMode(null);
                      }}
                      className={cn(inputClass, "mt-1 h-9 w-full text-sm text-foreground")}
                      autoFocus
                    />
                  </label>
                  {mode === "t" && (
                    <>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block text-xs font-medium text-muted-foreground">
                          Area
                          <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className={cn(inputClass, "mt-1 h-9 w-full text-sm text-foreground")}>
                            {areas?.map((a) => (
                              <option key={a._id} value={a._id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-xs font-medium text-muted-foreground">
                          Priority
                          <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className={cn(inputClass, "mt-1 h-9 w-full text-sm text-foreground")}>
                            <option value="high">High</option>
                            <option value="med">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </label>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">When</p>
                        <Segmented<When>
                          size="sm"
                          value={when}
                          onChange={setWhen}
                          options={[
                            { value: "today", label: "Today" },
                            { value: "tomorrow", label: "Tomorrow" },
                            { value: "week", label: "This week" },
                            { value: "none", label: "Backlog" },
                            { value: "someday", label: "Someday" },
                          ]}
                        />
                      </div>
                    </>
                  )}
                  {(mode === "o" || mode === "w") && (
                    <label className="block text-xs font-medium text-muted-foreground">
                      {mode === "o" ? "Promised by" : "Check again on"}
                      <input type="date" value={promised} onChange={(e) => setPromised(e.target.value)} className={cn(inputClass, "mt-1 h-9 w-full text-sm text-foreground")} />
                    </label>
                  )}
                  {mode === "i" && (
                    <Segmented
                      size="sm"
                      value={brand}
                      onChange={setBrand}
                      options={[
                        { value: "personal", label: "Personal brand" },
                        { value: "company", label: "Company" },
                      ]}
                    />
                  )}
                  {mode === "l" && (
                    <label className="block text-xs font-medium text-muted-foreground">
                      Why are you saving it? (required — fights the collector&apos;s fallacy)
                      <input value={why} onChange={(e) => setWhy(e.target.value)} placeholder="To improve my cold-call opener" className={cn(inputClass, "mt-1 h-9 w-full text-sm text-foreground")} />
                    </label>
                  )}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setMode(null)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      Cancel
                    </button>
                    <button onClick={() => void run(mode)} className={buttonVariants({ size: "sm" })}>
                      Save <Kbd className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground">{mode.toUpperCase()}</Kbd>
                    </button>
                  </div>
                </div>
              )}
            </Section>
          )}
        </div>
      )}
    </PageShell>
  );
}
