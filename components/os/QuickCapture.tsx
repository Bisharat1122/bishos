"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Inbox, ListTodo, Mic, MicOff, Sparkles, Wand2, X, CornerDownLeft, Calendar, Hash, Flag, Clock, Check, Loader2,
} from "lucide-react";
import { cn, buttonVariants, inputClass, Segmented, Kbd, Chip } from "./kit";
import { toast, reward, errorMessage } from "./celebrate";
import { parseQuickTask } from "@/lib/parse";
import { todayYmd } from "@/lib/day";
import { CaptureMode, isTyping } from "@/lib/osEvents";

type DumpType = "task" | "note" | "commitment" | "idea" | "person" | "resource";
type DumpRow = {
  include: boolean;
  type: DumpType;
  title: string;
  areaId?: string;
  plannedFor?: string | null;
  priority?: "low" | "med" | "high";
  direction?: "i_owe" | "owed_to_me";
  brand?: "personal" | "company";
};

const TYPE_LABEL: Record<DumpType, string> = {
  task: "Task",
  note: "Note",
  commitment: "Commitment",
  idea: "Content idea",
  person: "Person",
  resource: "To learn",
};

const LAST_AREA_KEY = "bishos.lastArea";

/** Speech-to-text via the browser (Chrome/Edge). */
function useDictation(onText: (t: string) => void) {
  const [listening, setListening] = useState(false);
  const rec = useRef<{ stop: () => void } | null>(null);
  const supported = typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const start = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any;
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true;
    r.interimResults = false;
    r.lang = navigator.language || "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      let s = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) s += e.results[i][0].transcript;
      if (s.trim()) onText(s.trim());
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
    rec.current = r;
    setListening(true);
  };
  const stop = () => {
    rec.current?.stop();
    setListening(false);
  };
  return { supported, listening, start, stop };
}

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CaptureMode>("inbox");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<DumpRow[] | null>(null);
  const [areaId, setAreaId] = useState<string>("");
  const [count, setCount] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const areas = useQuery(api.lifeAreas.list, open ? {} : "skip");
  const capture = useMutation(api.inbox.capture);
  const captureMany = useMutation(api.inbox.captureMany);
  const toTask = useMutation(api.inbox.toTask);
  const toNote = useMutation(api.inbox.toNote);
  const toCommitment = useMutation(api.inbox.toCommitment);
  const toPerson = useMutation(api.inbox.toPerson);
  const toIdea = useMutation(api.inbox.toContentIdea);
  const toResource = useMutation(api.inbox.toResource);
  const createTask = useMutation(api.tasks.create);
  const brainDump = useAction(api.aiCapture.brainDump);

  const dict = useDictation((t) => setText((p) => (p ? `${p} ${t}` : t)));

  // Global triggers: "c" key and the os:capture event.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Not while a modal (ritual, dialog, drawer) is up — capture would open underneath it.
      if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e) && !open && !document.querySelector('[aria-modal="true"]')) {
        e.preventDefault();
        setMode("inbox");
        setOpen(true);
      }
    };
    const onEvt = (e: Event) => {
      const d = (e as CustomEvent).detail as { mode?: CaptureMode; text?: string } | undefined;
      setMode(d?.mode ?? "inbox");
      if (d?.text) setText(d.text);
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("os:capture", onEvt);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("os:capture", onEvt);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    try {
      const last = localStorage.getItem(LAST_AREA_KEY);
      if (last) setAreaId(last);
    } catch {
      /* storage unavailable */
    }
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open, mode]);

  useEffect(() => {
    // Also replaces a stale remembered area (deleted / archived) — otherwise the
    // select shows the first option while the task is created with a dead id.
    if (areas?.length && !areas.some((a) => a._id === areaId)) setAreaId(areas[0]._id);
  }, [areas, areaId]);

  const parsed = useMemo(() => parseQuickTask(text, areas ?? []), [text, areas]);

  const close = () => {
    dict.stop();
    setOpen(false);
    setText("");
    setRows(null);
    setCount(0);
  };

  async function submitInbox() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      await capture({ text: t, source: "quick" });
      setText("");
      setCount((c) => c + 1);
      toast("Captured to Inbox", { tone: "success", sub: "Process it later — no filing now." });
    } catch (e) {
      toast(errorMessage(e, "Couldn't capture"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  async function submitTask() {
    const p = parsed;
    if (!p.title) return;
    const area = (p.areaId ?? areaId) as Id<"lifeAreas">;
    if (!area) {
      toast("Create a Life Area first", { tone: "warning" });
      return;
    }
    try {
      localStorage.setItem(LAST_AREA_KEY, area);
    } catch {
      /* ignore */
    }
    if (busy) return;
    setBusy(true);
    try {
      await createTask({
        title: p.title,
        priority: p.priority ?? "med",
        lifeAreaId: area,
        plannedFor: p.plannedFor,
        someday: p.someday,
        estimateMin: p.estimateMin,
      });
      setText("");
      setCount((c) => c + 1);
      toast(`Task added${p.plannedFor ? ` · ${p.chips.find((c) => c.kind === "date")?.label}` : ""}`, { tone: "success" });
    } catch (e) {
      toast(errorMessage(e, "Couldn't add the task"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  async function sortDump() {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    try {
      const items = await brainDump({ text: t, areas: (areas ?? []).map((a) => a.name), today: todayYmd() });
      setRows(
        items.map((i) => ({
          include: true,
          type: (["task", "note", "commitment", "idea", "person", "resource"].includes(i.type) ? i.type : "task") as DumpType,
          title: i.title,
          areaId: areas?.find((a) => a.name.toLowerCase() === (i.area ?? "").toLowerCase())?._id ?? areaId,
          plannedFor: i.plannedFor ?? null,
          priority: i.priority,
          direction: i.direction,
          brand: i.brand,
        })),
      );
    } catch (e) {
      toast(errorMessage(e, "AI sort failed"), { tone: "warning", sub: "You can still drop it all in the Inbox." });
    } finally {
      setBusy(false);
    }
  }

  async function dumpToInbox() {
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length || busy) return;
    setBusy(true);
    try {
      const n = await captureMany({ items: lines, source: "brain-dump" });
      toast(`${n} item${n === 1 ? "" : "s"} in your Inbox`, { tone: "success" });
      close();
    } catch (e) {
      toast(errorMessage(e, "Couldn't capture"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  async function applyRows() {
    if (!rows) return;
    setBusy(true);
    const date = todayYmd();
    let n = 0;
    try {
      for (const r of rows) {
        if (!r.include || !r.title.trim()) continue;
        const id = await capture({ text: r.title, source: "brain-dump" });
        if (r.type === "task") {
          const area = (r.areaId ?? areaId) as Id<"lifeAreas">;
          if (!area) continue;
          await toTask({ id, title: r.title, lifeAreaId: area, priority: r.priority, plannedFor: r.plannedFor ?? undefined, date });
        } else if (r.type === "note") await toNote({ id, title: r.title, noteType: "fleeting", date });
        else if (r.type === "commitment")
          await toCommitment({ id, title: r.title, direction: r.direction ?? "i_owe", promisedDate: r.plannedFor ?? undefined, date });
        else if (r.type === "idea") await toIdea({ id, title: r.title, brand: r.brand ?? "personal", date });
        else if (r.type === "person") await toPerson({ id, name: r.title, date });
        else if (r.type === "resource") await toResource({ id, title: r.title, whySaved: "From brain-dump", date });
        n++;
      }
      reward(`${n} item${n === 1 ? "" : "s"} filed from your brain-dump`, n * 2);
      close();
    } catch (e) {
      toast(errorMessage(e, "Couldn't save everything"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={close} />
      <div role="dialog" aria-modal="true" aria-label="Quick capture" className="os-pop relative w-full max-w-xl rounded-2xl border border-border bg-popover text-popover-foreground shadow-raised">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <Segmented
            size="sm"
            value={mode}
            onChange={(m) => {
              setMode(m);
              setRows(null);
            }}
            options={[
              { value: "inbox", label: "Inbox", icon: Inbox },
              { value: "task", label: "Task", icon: ListTodo },
              { value: "dump", label: "Brain dump", icon: Sparkles },
            ]}
          />
          <div className="flex items-center gap-2">
            {count > 0 && <Chip tone="success">{count} captured</Chip>}
            <button onClick={close} aria-label="Close" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!rows && (
          <div className="p-4">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") close();
                if (e.key === "Enter" && !e.shiftKey && mode !== "dump") {
                  e.preventDefault();
                  void (mode === "task" ? submitTask() : submitInbox());
                }
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && mode === "dump") {
                  e.preventDefault();
                  void sortDump();
                }
              }}
              rows={mode === "dump" ? 7 : 2}
              placeholder={
                mode === "inbox"
                  ? "What's on your mind? Dump it — decide later."
                  : mode === "task"
                    ? "Send proposal to Ali tomorrow #sales !high ~45m"
                    : "Everything in your head — calls to make, promises, ideas, people, links to study… one per line or just ramble."
              }
              className={cn(inputClass, "w-full resize-none border-0 bg-transparent px-0 py-0 text-base shadow-none focus-visible:ring-0")}
            />

            {mode === "task" && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {parsed.chips.map((c, i) => {
                  const I = c.kind === "date" || c.kind === "someday" ? Calendar : c.kind === "area" ? Hash : c.kind === "priority" ? Flag : Clock;
                  return (
                    <Chip key={i} tone={c.kind === "priority" ? "warning" : c.kind === "area" ? "info" : "secondary"}>
                      <I /> {c.label}
                    </Chip>
                  );
                })}
                {!parsed.areaId && (
                  <select
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value)}
                    className={cn(inputClass, "h-7 text-xs")}
                    aria-label="Life area"
                  >
                    {(areas ?? []).map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                )}
                <span className="ml-auto text-[11px] text-muted-foreground">today · tmr · fri · #area · !high · ~30m</span>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {dict.supported && (
                  <button
                    onClick={() => (dict.listening ? dict.stop() : dict.start())}
                    className={cn(buttonVariants({ variant: dict.listening ? "destructive" : "outline", size: "sm" }))}
                    title="Dictate"
                  >
                    {dict.listening ? <MicOff /> : <Mic />} {dict.listening ? "Stop" : "Speak"}
                  </button>
                )}
                {dict.listening && <span className="flex items-center gap-1 text-xs text-danger"><span className="ai-dot" /> listening…</span>}
              </div>
              {mode === "dump" ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => void dumpToInbox()} className={buttonVariants({ variant: "outline", size: "sm" })} disabled={!text.trim() || busy}>
                    <Inbox /> All to Inbox
                  </button>
                  <button onClick={() => void sortDump()} className={buttonVariants({ size: "sm" })} disabled={!text.trim() || busy}>
                    {busy ? <Loader2 className="animate-spin" /> : <Wand2 />} Sort with AI
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => void (mode === "task" ? submitTask() : submitInbox())}
                  className={buttonVariants({ size: "sm" })}
                  disabled={!text.trim() || busy}
                >
                  {mode === "task" ? "Add task" : "Capture"} <CornerDownLeft />
                </button>
              )}
            </div>
          </div>
        )}

        {rows && (
          <div className="p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Review before saving — untick anything wrong, change the type with one tap.
            </p>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {rows.map((r, i) => (
                <div key={i} className={cn("rounded-lg border border-border p-2.5", !r.include && "opacity-50")}>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={r.include}
                      onChange={(e) => setRows((p) => p!.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))}
                      className="mt-2 size-4 accent-[var(--primary)]"
                      aria-label="Include"
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <input
                        value={r.title}
                        onChange={(e) => setRows((p) => p!.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                        className={cn(inputClass, "h-8 w-full")}
                      />
                      <div className="flex flex-wrap items-center gap-1">
                        {(Object.keys(TYPE_LABEL) as DumpType[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => setRows((p) => p!.map((x, j) => (j === i ? { ...x, type: t } : x)))}
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[11px] font-medium transition",
                              r.type === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {TYPE_LABEL[t]}
                          </button>
                        ))}
                        {r.type === "task" && (
                          <select
                            value={r.areaId}
                            onChange={(e) => setRows((p) => p!.map((x, j) => (j === i ? { ...x, areaId: e.target.value } : x)))}
                            className={cn(inputClass, "ml-auto h-7 max-w-[11rem] text-[11px]")}
                          >
                            {(areas ?? []).map((a) => (
                              <option key={a._id} value={a._id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        )}
                        {r.type === "commitment" && (
                          <select
                            value={r.direction ?? "i_owe"}
                            onChange={(e) => setRows((p) => p!.map((x, j) => (j === i ? { ...x, direction: e.target.value as DumpRow["direction"] } : x)))}
                            className={cn(inputClass, "ml-auto h-7 text-[11px]")}
                          >
                            <option value="i_owe">I owe</option>
                            <option value="owed_to_me">Owed to me</option>
                          </select>
                        )}
                        {r.plannedFor && <Chip tone="secondary"><Calendar /> {r.plannedFor}</Chip>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {rows.length === 0 && <p className="text-sm text-muted-foreground">Nothing found — try writing a bit more.</p>}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button onClick={() => setRows(null)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Back
              </button>
              <button onClick={() => void applyRows()} className={buttonVariants({ size: "sm" })} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Check />} Save {rows.filter((r) => r.include).length} items
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 rounded-b-2xl border-t border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Kbd>C</Kbd> capture anywhere · <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd> command
          </span>
          <span>{mode === "dump" ? "Ctrl+Enter to sort" : "Enter to save · Shift+Enter new line"}</span>
        </div>
      </div>
    </div>
  );
}
