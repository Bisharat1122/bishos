"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Search, ListTodo, StickyNote, FolderKanban, Target, Repeat, Layers, X, Users, Building2, Kanban, Handshake,
  Clapperboard, Lightbulb, Gift, Megaphone, GraduationCap, Library, Scale, Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON: Record<string, typeof Search> = {
  task: ListTodo,
  note: StickyNote,
  project: FolderKanban,
  goal: Target,
  habit: Repeat,
  lifeArea: Layers,
  section: Layers,
  person: Users,
  company: Building2,
  deal: Kanban,
  commitment: Handshake,
  content: Clapperboard,
  swipe: Lightbulb,
  offer: Gift,
  campaign: Megaphone,
  learning: GraduationCap,
  resource: Library,
  decision: Scale,
  inbox: Inbox,
};

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  // Debounce so each keystroke doesn't open a fresh full-table search subscription.
  const [dq, setDq] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 180);
    return () => clearTimeout(t);
  }, [q]);
  const groups = useQuery(api.search.all, dq.length >= 2 ? { q: dq } : "skip");

  const total = groups?.reduce((s, g) => s + g.items.length, 0) ?? 0;
  const showPanel = open && q.trim().length >= 2;

  return (
    <div className="relative max-w-md flex-1 sm:max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Escape") { setQ(""); setOpen(false); (e.target as HTMLInputElement).blur(); } }}
        placeholder="Search everything — tasks, people, deals, content…"
        className="h-9 w-full rounded-lg border border-transparent bg-muted pl-9 pr-9 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
      />
      {q && (
        <button type="button" aria-label="Clear search" onClick={() => { setQ(""); setOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      )}

      {showPanel && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-raised">
            {groups === undefined && <p className="px-3 py-4 text-sm text-muted-foreground">Searching…</p>}
            {groups && total === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground">No matches for &ldquo;{q}&rdquo;</p>
            )}
            {groups?.map((g) => {
              const Icon = ICON[g.type] ?? Search;
              return (
                <div key={g.type} className="mb-1">
                  <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">{g.label}</p>
                  {g.items.map((it) => (
                    <Link
                      key={it.id}
                      href={it.href}
                      onClick={() => { setOpen(false); setQ(""); }}
                      className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm">{it.title}</span>
                      {it.sub && <span className="shrink-0 truncate text-xs text-muted-foreground">{it.sub}</span>}
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
