"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BookOpenText, ChevronLeft, ChevronRight, Sun, Moon, Sparkles, Lightbulb, Trophy, BatteryMedium } from "lucide-react";
import { PageShell, Section, Chip, EmptyHint, cn, buttonVariants } from "@/components/os/kit";
import { addDaysYmd, fmtYmd, useToday, weekdayOf } from "@/lib/day";

/** Journal — every day as a page; a heatmap of ritual consistency + day scores. */
export default function JournalPage() {
  const today = useToday();
  const [monthOffset, setMonthOffset] = useState(0);
  const { from, to, label, cells } = useMemo(() => {
    // Derived from `today` (not a fresh Date) so it rolls over at midnight and matches the warm-up cache key.
    const [ty, tm] = today.split("-").map(Number);
    const d = new Date(ty, tm - 1 + monthOffset, 1);
    const first = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const lastY = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
    const lead = (weekdayOf(first) + 6) % 7; // Monday-first grid
    const n = last.getDate();
    const c: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => addDaysYmd(first, i))];
    return { from: first, to: lastY, label: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }), cells: c };
  }, [monthOffset, today]);
  const days = useQuery(api.days.range, { from: addDaysYmd(from, -60), to });
  const byDate = useMemo(() => new Map((days ?? []).map((d) => [d.date, d])), [days]);
  const entries = (days ?? [])
    .filter((d) => d.date <= today && (d.progressLine || d.lesson || d.journal?.win || d.resumeNote || d.checkIn))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 40);

  const monthDays = (days ?? []).filter((d) => d.date >= from && d.date <= to);
  const rituals = monthDays.filter((d) => d.startupAt || d.shutdownAt).length;
  const scored = monthDays.filter((d) => d.dayScore != null);
  const avgScore = scored.length ? Math.round(scored.reduce((s, d) => s + (d.dayScore ?? 0), 0) / scored.length) : null;
  const energies = monthDays.map((d) => d.checkIn?.energy).filter((x): x is number => x != null);
  const avgEnergy = energies.length ? (energies.reduce((a, b) => a + b, 0) / energies.length).toFixed(1) : null;

  return (
    <PageShell
      title="Journal"
      icon={BookOpenText}
      subtitle="Every day is a page: check-in, priorities, progress, lessons. Patterns show up here first."
      actions={
        <>
          <Link href="/momentum" className={buttonVariants({ variant: "outline" })}>
            Wins
          </Link>
          <Link href={`/journal/${today}`} className={buttonVariants()}>
            Today&apos;s page
          </Link>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="space-y-4">
          <Section
            title={label}
            action={
              <div className="flex gap-1">
                <button onClick={() => setMonthOffset((m) => m - 1)} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Previous month">
                  <ChevronLeft />
                </button>
                <button onClick={() => setMonthOffset((m) => Math.min(0, m + 1))} disabled={monthOffset >= 0} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Next month">
                  <ChevronRight />
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-muted-foreground">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-1.5">
              {cells.map((c, i) => {
                if (!c) return <span key={i} />;
                const d = byDate.get(c);
                const score = d?.dayScore ?? (d?.startupAt && d?.shutdownAt ? 70 : d?.startupAt || d?.shutdownAt ? 40 : 0);
                const future = c > today;
                // Future days aren't pages yet — render a plain cell (no "#" link that jumps to the top).
                if (future) {
                  return (
                    <span
                      key={c}
                      title={fmtYmd(c)}
                      className="flex aspect-square items-center justify-center rounded-md border border-dashed border-border text-[11px] font-medium text-muted-foreground/40"
                    >
                      {Number(c.slice(8))}
                    </span>
                  );
                }
                return (
                  <Link
                    key={c}
                    href={`/journal/${c}`}
                    title={`${fmtYmd(c)}${d?.dayScore != null ? ` · score ${d.dayScore}` : ""}`}
                    className={cn(
                      "relative flex aspect-square items-center justify-center rounded-md border border-border text-[11px] font-medium transition hover:border-ring",
                      c === today && "ring-2 ring-ring",
                      d?.dayType === "free" && "border-dashed",
                    )}
                    style={score ? { background: `color-mix(in oklab, var(--success) ${Math.round(score * 0.55)}%, transparent)` } : undefined}
                  >
                    {Number(c.slice(8))}
                    {d?.startupAt && <Sun className="absolute left-0.5 top-0.5 h-2 w-2 opacity-60" />}
                    {d?.shutdownAt && <Moon className="absolute right-0.5 top-0.5 h-2 w-2 opacity-60" />}
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
              <div>
                <p className="text-xl font-semibold tabular-nums">{rituals}</p>
                <p className="text-[11px] text-muted-foreground">ritual days</p>
              </div>
              <div>
                <p className="text-xl font-semibold tabular-nums">{avgScore ?? "—"}</p>
                <p className="text-[11px] text-muted-foreground">avg day score</p>
              </div>
              <div>
                <p className="text-xl font-semibold tabular-nums">{avgEnergy ?? "—"}</p>
                <p className="text-[11px] text-muted-foreground">avg energy /5</p>
              </div>
            </div>
          </Section>
          <p className="px-1 text-xs text-muted-foreground">
            Colour = day score. ☀ start-up done · ☾ shutdown done · dashed = free day.
          </p>
        </div>

        <div className="space-y-3">
          {days === undefined && <div className="skeleton h-64" />}
          {days && entries.length === 0 && (
            <EmptyHint icon={BookOpenText} title="Your journal starts tonight" hint="Finish today's shutdown — your progress line, win and lesson appear here." />
          )}
          {entries.map((d) => (
            <Link key={d._id} href={`/journal/${d.date}`} className="block rounded-xl border border-border bg-card p-4 shadow-card transition hover:border-ring/60">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{fmtYmd(d.date, { weekday: "long", month: "short", day: "numeric" })}</p>
                {d.dayScore != null && <Chip tone={d.dayScore >= 80 ? "success" : "secondary"}>{d.dayScore}</Chip>}
                {d.checkIn?.energy && (
                  <Chip tone="outline">
                    <BatteryMedium /> {d.checkIn.energy}/5
                  </Chip>
                )}
                {d.dayType === "free" && <Chip tone="info">Free day</Chip>}
              </div>
              <div className="mt-2 space-y-1 text-sm">
                {d.progressLine && (
                  <p className="flex gap-2">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" /> {d.progressLine}
                  </p>
                )}
                {d.journal?.win && (
                  <p className="flex gap-2">
                    <Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" /> {d.journal.win}
                  </p>
                )}
                {d.lesson && (
                  <p className="flex gap-2 text-muted-foreground">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {d.lesson}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
