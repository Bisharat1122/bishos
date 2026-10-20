"use client";

import { DragEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Inbox, Layers, Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyHint, Section, Segmented, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { addDaysYmd, dateOf, fmtYmd, mondayOf, relDay } from "@/lib/day";
import { PieceCard } from "./PieceCard";
import { StageChip } from "./bits";
import type { NewPieceDefaults } from "./NewPieceDialog";
import { errMsg, formatMeta, matchesBrand, pillarColor, type BrandFilter, type LitePiece, type Pillar } from "./model";

type CalItem = LitePiece & { day?: string };

const firstOfMonth = (ymd: string) => `${ymd.slice(0, 7)}-01`;
function addMonthsYmd(ymd: string, n: number) {
  const d = dateOf(firstOfMonth(ymd));
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function ContentCalendar({
  pillars,
  today,
  brand,
  onNew,
}: {
  pillars: Pillar[];
  today: string;
  brand: BrandFilter;
  onNew: (d: NewPieceDefaults) => void;
}) {
  const router = useRouter();
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(today);
  const [selected, setSelected] = useState<string>(today);
  const [over, setOver] = useState<string | null>(null);
  const update = useMutation(api.content.update);

  const range = useMemo(() => {
    if (view === "week") {
      const from = mondayOf(cursor);
      return { from, to: addDaysYmd(from, 6), days: Array.from({ length: 7 }, (_, i) => addDaysYmd(from, i)) };
    }
    const from = mondayOf(firstOfMonth(cursor));
    const days = Array.from({ length: 42 }, (_, i) => addDaysYmd(from, i));
    return { from, to: days[41], days };
  }, [view, cursor]);

  const data = useQuery(api.content.calendar, { from: range.from, to: range.to });
  const pillarById = useMemo(() => new Map(pillars.map((p, i) => [p._id as string, { name: p.name, color: pillarColor(p, i) }])), [pillars]);

  const byDay = useMemo(() => {
    const m = new Map<string, CalItem[]>();
    for (const it of data?.items ?? []) {
      if (!matchesBrand(brand, it.brand) || !it.day) continue;
      m.set(it.day, [...(m.get(it.day) ?? []), it]);
    }
    for (const list of m.values()) list.sort((a, b) => Number(!!b.isHub) - Number(!!a.isHub) || a.title.localeCompare(b.title));
    return m;
  }, [data, brand]);
  const tray = (data?.unscheduled ?? []).filter((p) => matchesBrand(brand, p.brand));

  async function reschedule(id: string, day: string | null) {
    try {
      await update({ id: id as Id<"contentPieces">, scheduledFor: day });
      toast(day ? `Scheduled for ${relDay(day, today)}` : "Unscheduled");
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  }

  const dropHandlers = (day: string | null) => ({
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      setOver(day ?? "tray");
    },
    onDragLeave: () => setOver((o) => (o === (day ?? "tray") ? null : o)),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setOver(null);
      const id = e.dataTransfer.getData("text/content-piece");
      if (id) void reschedule(id, day);
    },
  });

  const label =
    view === "month"
      ? dateOf(firstOfMonth(cursor)).toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : `${fmtYmd(range.from, { month: "short", day: "numeric" })} – ${fmtYmd(range.to, { month: "short", day: "numeric" })}`;
  const step = (n: number) => setCursor(view === "month" ? addMonthsYmd(cursor, n) : addDaysYmd(cursor, 7 * n));
  const selectedItems = byDay.get(selected) ?? [];
  const inMonth = (d: string) => view === "week" || d.slice(0, 7) === firstOfMonth(cursor).slice(0, 7);

  const calChip = (it: CalItem, big?: boolean) => {
    const pl = it.pillarId ? pillarById.get(it.pillarId) : undefined;
    const F = formatMeta(it.format).icon;
    const draggable = !it.publishedAt;
    return (
      <div
        key={it._id}
        draggable={draggable}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/content-piece", it._id);
          e.dataTransfer.effectAllowed = "move";
        }}
        role="link"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/content/${it._id}`);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          e.stopPropagation();
          router.push(`/content/${it._id}`);
        }}
        title={`${it.title}${it.publishedAt ? " · published" : ""}`}
        className={cn(
          "flex w-full min-w-0 items-center gap-1 rounded-md border border-transparent px-1.5 py-0.5 text-[11px] leading-tight transition-colors hover:border-ring/50",
          it.publishedAt ? "bg-success-soft text-foreground" : "bg-muted text-foreground",
          draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
          big && "py-1 text-xs",
        )}
      >
        <span className="size-1.5 shrink-0 rounded-full" style={{ background: pl?.color ?? "var(--muted-foreground)" }} />
        {it.publishedAt ? <CheckCircle2 className="h-3 w-3 shrink-0 text-success" /> : <F className="h-3 w-3 shrink-0 text-muted-foreground" />}
        {it.isHub && <Layers className="h-3 w-3 shrink-0" />}
        <span className={cn("truncate", it.isHub && "font-semibold")}>{it.title}</span>
      </div>
    );
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Section bodyClassName="p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button aria-label="Previous" onClick={() => step(-1)} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button aria-label="Next" onClick={() => step(1)} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h3 className="text-base font-semibold tracking-tight">{label}</h3>
          <button
            onClick={() => {
              setCursor(today);
              setSelected(today);
            }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Today
          </button>
          <Segmented
            size="sm"
            className="ml-auto"
            value={view}
            onChange={setView}
            options={[
              { value: "month", label: "Month" },
              { value: "week", label: "Week" },
            ]}
          />
        </div>

        {data === undefined ? (
          <div className="skeleton h-[420px]" />
        ) : view === "month" ? (
          <div>
            <div className="grid grid-cols-7 gap-px pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
              {range.days.map((d) => {
                const items = byDay.get(d) ?? [];
                const isToday = d === today;
                return (
                  <div
                    key={d}
                    {...dropHandlers(d)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Show ${fmtYmd(d)}${items.length ? ` · ${items.length} piece${items.length === 1 ? "" : "s"}` : ""}`}
                    aria-pressed={selected === d}
                    onClick={() => setSelected(d)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
                      e.preventDefault();
                      setSelected(d);
                    }}
                    className={cn(
                      "group relative flex min-h-[64px] cursor-pointer flex-col gap-0.5 bg-card p-1 transition-colors sm:min-h-[104px] sm:p-1.5",
                      !inMonth(d) && "bg-muted/40 text-muted-foreground",
                      selected === d && "ring-2 ring-inset ring-ring/60",
                      over === d && "bg-accent",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full text-[11px] tabular-nums",
                          isToday && "bg-primary font-semibold text-primary-foreground",
                        )}
                      >
                        {Number(d.slice(8))}
                      </span>
                      <button
                        aria-label={`New piece on ${fmtYmd(d)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onNew({ scheduledFor: d, brand: brand === "both" ? undefined : brand });
                        }}
                        className="hidden rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 sm:block"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    {/* phones: dots */}
                    <div className="flex flex-wrap gap-0.5 sm:hidden">
                      {items.slice(0, 4).map((it) => (
                        <span
                          key={it._id}
                          className="size-1.5 rounded-full"
                          style={{ background: it.pillarId ? pillarById.get(it.pillarId)?.color : "var(--muted-foreground)" }}
                        />
                      ))}
                    </div>
                    <div className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                      {items.slice(0, 3).map((it) => calChip(it))}
                      {items.length > 3 && <span className="px-1 text-[10px] text-muted-foreground">+{items.length - 3} more</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-7">
            {range.days.map((d) => {
              const items = byDay.get(d) ?? [];
              return (
                <div
                  key={d}
                  {...dropHandlers(d)}
                  className={cn(
                    "flex min-h-[90px] flex-col gap-1.5 rounded-lg border border-border bg-muted/30 p-2 transition-colors md:min-h-[320px]",
                    over === d && "border-ring bg-accent",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs font-medium", d === today && "text-foreground", d !== today && "text-muted-foreground")}>
                      {fmtYmd(d, { weekday: "short", day: "numeric" })}
                      {d === today && <span className="ml-1 rounded bg-primary px-1 text-[10px] text-primary-foreground">Today</span>}
                    </span>
                    <button
                      aria-label={`New piece on ${fmtYmd(d)}`}
                      onClick={() => onNew({ scheduledFor: d, brand: brand === "both" ? undefined : brand })}
                      className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {items.map((it) => (
                    <div
                      key={it._id}
                      draggable={!it.publishedAt}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/content-piece", it._id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className={cn(!it.publishedAt && "cursor-grab active:cursor-grabbing")}
                    >
                      <PieceCard piece={it} today={today} compact pillar={it.pillarId ? pillarById.get(it.pillarId) : undefined} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">
          Drag a piece to another day to reschedule. Published pieces sit on the day they went out.
        </p>
      </Section>

      <div className="space-y-4">
        {view === "month" && (
          <Section
            title={`${selected === today ? "Today · " : ""}${fmtYmd(selected, { weekday: "long", month: "short", day: "numeric" })}`}
            icon={CalendarDays}
          >
            {selectedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing on this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedItems.map((it) => (
                  <PieceCard key={it._id} piece={it} today={today} compact pillar={it.pillarId ? pillarById.get(it.pillarId) : undefined} />
                ))}
              </div>
            )}
            <button
              onClick={() => onNew({ scheduledFor: selected, brand: brand === "both" ? undefined : brand })}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 w-full")}
            >
              <Plus className="h-3.5 w-3.5" /> Plan a piece here
            </button>
          </Section>
        )}

        <div {...dropHandlers(null)} className={cn("rounded-xl transition-colors", over === "tray" && "bg-accent")}>
          <Section title={`Ready to schedule (${tray.length})`} icon={Inbox} hint="Drag onto a day. Drop here to unschedule.">
            {data === undefined ? (
              <div className="skeleton h-24" />
            ) : tray.length === 0 ? (
              <EmptyHint icon={Inbox} title="Nothing waiting" hint="Pieces from Brief onwards without a date show up here." className="py-6" />
            ) : (
              <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
                {tray.map((it) => (
                  <div key={it._id} className="space-y-1 rounded-lg border border-border bg-card p-1.5">
                    {calChip(it, true)}
                    <div className="px-1">
                      <StageChip stage={it.stage} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
