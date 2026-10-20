"use client";

/**
 * Small client islands for the Guide page: full-text search over the
 * server-rendered manual (filters DOM nodes by data-text, opens matching
 * <details>), and the rhythm tabs. Keeps the page's JS tiny.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X, BookMarked } from "lucide-react";
import { cn, inputClass, Segmented, PageShell } from "@/components/os/kit";
import type { RoutineBlock } from "@/lib/guide/routine";

export function GuideSearch({ total }: { total: number }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const root = document.getElementById("guide-content");
      if (!root) return;
      const needle = q.trim().toLowerCase();
      const items = root.querySelectorAll<HTMLElement>("[data-text]");
      const sections = root.querySelectorAll<HTMLElement>("[data-section]");
      const pages = root.querySelectorAll<HTMLDetailsElement>("details[data-page]");
      if (!needle) {
        items.forEach((el) => (el.hidden = false));
        sections.forEach((el) => (el.hidden = false));
        pages.forEach((el) => {
          el.hidden = false;
          el.open = false;
        });
        setHits(null);
        return;
      }
      let n = 0;
      items.forEach((el) => {
        const match = (el.dataset.text ?? "").includes(needle);
        el.hidden = !match;
        if (match) n++;
      });
      pages.forEach((p) => {
        const any = p.querySelector("[data-text]:not([hidden])") || (p.dataset.title ?? "").includes(needle);
        p.hidden = !any;
        p.open = !!any;
        if (any && (p.dataset.title ?? "").includes(needle)) p.querySelectorAll<HTMLElement>("[data-text]").forEach((el) => (el.hidden = false));
      });
      sections.forEach((s) => {
        const any = s.querySelector("[data-text]:not([hidden])") || (s.dataset.title ?? "").includes(needle);
        s.hidden = !any;
      });
      setHits(n);
    }, 120);
  }, [q]);

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`Search ${total.toLocaleString()} explanations — e.g. "LEGO bricks", "execution score", "runway"`}
        className={cn(inputClass, "h-10 w-full pl-9 pr-24")}
        aria-label="Search the guide"
      />
      <span className="absolute right-9 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">{hits != null ? `${hits} found` : ""}</span>
      {q && (
        <button type="button" onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear search">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function RhythmTabs({ blocks, firstWeek, quickTest }: { blocks: RoutineBlock[]; firstWeek: { day: string; focus: string; tasks: string[] }[]; quickTest: string[] }) {
  const [tab, setTab] = useState(blocks[1]?.id ?? "daily");
  const block = blocks.find((b) => b.id === tab);
  return (
    <div>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          ...blocks.map((b) => ({ value: b.id, label: b.title.replace("Every ", "").replace("One-time setup", "Setup") })),
          { value: "first-week", label: "First week" },
          { value: "test", label: "30-min test" },
        ]}
      />
      <div className="mt-4">
        {block && (
          <div>
            <p className="text-sm text-muted-foreground">
              <b className="text-foreground">{block.when}.</b> {block.summary}
            </p>
            <ol className="mt-3 space-y-2">
              {block.steps.map((s, i) => (
                <li key={i} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {s.title}
                      {s.minutes ? <span className="rounded bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">{s.minutes} min</span> : null}
                      {s.where.startsWith("/") ? (
                        <Link href={s.where.split(" ")[0]} className="text-[11px] font-medium text-info hover:underline">
                          {s.where}
                        </Link>
                      ) : (
                        <span className="text-[11px] font-medium text-muted-foreground">{s.where}</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
        {tab === "first-week" && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {firstWeek.map((d) => (
              <div key={d.day} className="rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-semibold">
                  {d.day} · <span className="text-muted-foreground">{d.focus}</span>
                </p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-sm text-muted-foreground">
                  {d.tasks.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {tab === "test" && (
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            {quickTest.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

/** Page frame for the server-rendered Guide (icon set here: components can't cross the server→client boundary as props). */
export function GuideShell({ children, actions, headerExtra }: { children: React.ReactNode; actions?: React.ReactNode; headerExtra?: React.ReactNode }) {
  return (
    <PageShell
      title="Guide — how bishOS works"
      icon={BookMarked}
      subtitle="Every module, page and element explained in simple words — plus your daily routine, one-time setup, the frameworks behind it and how to test everything."
      actions={actions}
      headerExtra={headerExtra}
    >
      {children}
    </PageShell>
  );
}
