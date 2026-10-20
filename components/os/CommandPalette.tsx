"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Search, Sun, Moon, Inbox, ListTodo, Sparkles, ClipboardCheck, ArrowRight, Timer, Target, Kanban, Clapperboard,
  Handshake, Brain, CalendarDays, CornerDownLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, Kbd } from "./kit";
import { ALL_NAV } from "@/lib/nav";
import { openCapture, openRitual } from "@/lib/osEvents";

type Item = { id: string; label: string; sub?: string; icon: LucideIcon; run: () => void; group: string };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Debounced so typing doesn't open a new full search subscription per keystroke.
  const [dq, setDq] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 160);
    return () => clearTimeout(t);
  }, [q]);
  const search = useQuery(api.search.all, open && dq.length >= 2 ? { q: dq } : "skip");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onEvt = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("os:palette", onEvt);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("os:palette", onEvt);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const close = () => setOpen(false);
  const go = (href: string) => () => {
    close();
    router.push(href);
  };

  const actions: Item[] = useMemo(
    () => [
      { id: "a-startup", group: "Actions", label: "Start my day", sub: "Morning start-up ritual", icon: Sun, run: () => { close(); openRitual("startup"); } },
      { id: "a-shutdown", group: "Actions", label: "Shutdown", sub: "Evening shutdown ritual", icon: Moon, run: () => { close(); openRitual("shutdown"); } },
      { id: "a-capture", group: "Actions", label: "Capture to Inbox", sub: "C", icon: Inbox, run: () => { close(); openCapture("inbox"); } },
      { id: "a-task", group: "Actions", label: "New task", sub: "natural language", icon: ListTodo, run: () => { close(); openCapture("task"); } },
      { id: "a-dump", group: "Actions", label: "Brain dump", sub: "AI sorts it", icon: Sparkles, run: () => { close(); openCapture("dump"); } },
      { id: "a-review", group: "Actions", label: "Weekly review", icon: ClipboardCheck, run: go("/reviews/weekly") },
      { id: "a-week", group: "Actions", label: "Plan this week", icon: CalendarDays, run: go("/week") },
      { id: "a-focus", group: "Actions", label: "Start focus session", icon: Timer, run: go("/focus") },
      { id: "a-goals", group: "Actions", label: "12-week goals", icon: Target, run: go("/goals") },
      { id: "a-deal", group: "Actions", label: "Open pipeline", icon: Kanban, run: go("/pipeline") },
      { id: "a-content", group: "Actions", label: "Content Studio", icon: Clapperboard, run: go("/content") },
      { id: "a-commit", group: "Actions", label: "Commitments", icon: Handshake, run: go("/commitments") },
      { id: "a-recall", group: "Actions", label: "Recall session", icon: Brain, run: go("/recall") },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const needle = q.trim().toLowerCase();
  const items: Item[] = useMemo(() => {
    const nav: Item[] = ALL_NAV.map((n) => ({ id: `n-${n.href}`, group: "Go to", label: n.label, sub: n.href, icon: n.icon, run: go(n.href) }));
    const match = (it: Item, extra = "") => !needle || `${it.label} ${it.sub ?? ""} ${extra}`.toLowerCase().includes(needle);
    const act = actions.filter((a) => match(a));
    const navF = nav.filter((n) => match(n, ALL_NAV.find((x) => `n-${x.href}` === n.id)?.keywords ?? ""));
    const found: Item[] =
      search?.flatMap((g) =>
        g.items.map((it) => ({ id: `s-${g.type}-${it.id}`, group: g.label, label: it.title, sub: it.sub, icon: ArrowRight, run: go(it.href) })),
      ) ?? [];
    if (!needle) return [...act.slice(0, 6), ...navF];
    return [...act, ...navF, ...found];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle, search, actions]);

  useEffect(() => setIdx(0), [needle]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${idx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  if (!open) return null;

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[65] flex items-start justify-center p-4 pt-[10vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={close} />
      <div className="os-pop relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-raised">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIdx((i) => Math.min(items.length - 1, i + 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setIdx((i) => Math.max(0, i - 1));
              }
              if (e.key === "Enter") {
                e.preventDefault();
                items[idx]?.run();
              }
            }}
            placeholder="Type a command, page or search…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-1.5">
          {items.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matches.</p>}
          {items.map((it, i) => {
            const header = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            const I = it.icon;
            return (
              <div key={it.id}>
                {header && <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{header}</p>}
                <button
                  data-idx={i}
                  onMouseMove={() => setIdx(i)}
                  onClick={it.run}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm",
                    i === idx ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                  )}
                >
                  <I className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{it.label}</span>
                  {it.sub && <span className="max-w-[40%] shrink-0 truncate text-xs text-muted-foreground">{it.sub}</span>}
                  {i === idx && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
