"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Search, ListTodo, StickyNote, FolderKanban, Target, Repeat, Layers, X,
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
};

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const groups = useQuery(api.search.all, q.trim().length >= 2 ? { q } : "skip");

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
        placeholder="Search tasks, notes, projects, goals…"
        className="w-full rounded-full border border-border bg-muted/40 py-2.5 pl-10 pr-9 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
      />
      {q && (
        <button onClick={() => { setQ(""); setOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      )}

      {showPanel && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-2xl">
            {groups === undefined && <p className="px-3 py-4 text-sm text-muted-foreground">Searching…</p>}
            {groups && total === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground">No matches for &ldquo;{q}&rdquo;</p>
            )}
            {groups?.map((g) => {
              const Icon = ICON[g.type] ?? Search;
              return (
                <div key={g.type} className="mb-1">
                  <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{g.label}</p>
                  {g.items.map((it) => (
                    <Link
                      key={it.id}
                      href={it.href}
                      onClick={() => { setOpen(false); setQ(""); }}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/50"
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
