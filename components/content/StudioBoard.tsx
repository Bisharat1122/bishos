"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { Layers, Plus, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Kanban, Select, buttonVariants, cn, inputClass, type KanbanColumn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { PieceCard } from "./PieceCard";
import type { NewPieceDefaults } from "./NewPieceDialog";
import { FORMATS, GROUPS, STAGE_ORDER, dropStageFor, errMsg, groupOf, pillarColor, type Brand, type GroupKey, type LitePiece, type Pillar } from "./model";
import type { useStageMover } from "./useStageMover";

const DONE_LIMIT = 20;

export function StudioBoard({
  pieces,
  pillars,
  today,
  brand,
  mover,
  onNew,
}: {
  pieces: LitePiece[];
  pillars: Pillar[];
  today: string;
  brand: Brand;
  mover: ReturnType<typeof useStageMover>;
  onNew: (d: NewPieceDefaults) => void;
}) {
  const [q, setQ] = useState("");
  const [pillarF, setPillarF] = useState<string>("all");
  const [formatF, setFormatF] = useState<string>("all");
  const [hubsOnly, setHubsOnly] = useState(false);
  const [showAllDone, setShowAllDone] = useState(false);
  const [quick, setQuick] = useState("");
  const capture = useMutation(api.content.captureIdeas);

  const pillarById = useMemo(() => new Map(pillars.map((p, i) => [p._id, { name: p.name, color: pillarColor(p, i) }])), [pillars]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return pieces
      .filter((p) => (pillarF === "all" ? true : pillarF === "none" ? !p.pillarId : p.pillarId === pillarF))
      .filter((p) => formatF === "all" || p.format === formatF)
      .filter((p) => !hubsOnly || p.isHub)
      .filter((p) => !needle || p.title.toLowerCase().includes(needle) || (p.hook ?? "").toLowerCase().includes(needle))
      .sort(
        (a, b) =>
          STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) ||
          (a.scheduledFor ?? "9999").localeCompare(b.scheduledFor ?? "9999") ||
          b.createdAt - a.createdAt,
      );
  }, [pieces, q, pillarF, formatF, hubsOnly]);

  const doneAll = filtered.filter((p) => groupOf(p.stage) === "done");
  const doneShown = new Set(
    [...doneAll]
      .sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt))
      .slice(0, showAllDone ? doneAll.length : DONE_LIMIT)
      .map((p) => p._id),
  );
  const items = filtered.filter((p) => groupOf(p.stage) !== "done" || doneShown.has(p._id));

  const columns: KanbanColumn[] = GROUPS.map((g) => ({ key: g.key, label: g.label, hint: g.hint }));

  async function quickAdd() {
    const t = quick.trim();
    if (!t) return;
    try {
      await capture({
        lines: [t],
        brand,
        pillarId: pillarF !== "all" && pillarF !== "none" ? (pillarF as Id<"contentPillars">) : undefined,
      });
      setQuick("");
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles and hooks"
            className={cn(inputClass, "h-8 w-full pl-8")}
          />
        </div>
        <Select value={pillarF} onChange={(e) => setPillarF(e.target.value)} className="h-8 w-auto min-w-[140px]">
          <option value="all">All pillars</option>
          {pillars.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
          <option value="none">No pillar</option>
        </Select>
        <Select value={formatF} onChange={(e) => setFormatF(e.target.value)} className="h-8 w-auto min-w-[130px]">
          <option value="all">All formats</option>
          {FORMATS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </Select>
        <button
          onClick={() => setHubsOnly(!hubsOnly)}
          aria-pressed={hubsOnly}
          className={buttonVariants({ variant: hubsOnly ? "default" : "outline", size: "sm" })}
        >
          <Layers className="h-3.5 w-3.5" />
          Hubs
        </button>
        <span className="ml-auto hidden text-xs text-muted-foreground md:inline">Drag cards between columns, or tap a card&apos;s stage · → advances one stage</span>
      </div>

      <Kanban<LitePiece>
        columns={columns}
        items={items}
        columnOf={(p) => groupOf(p.stage)}
        onMove={(p, col) => void mover.move(p, dropStageFor(col as GroupKey, p))}
        renderCard={(p) => (
          <PieceCard
            piece={p}
            today={today}
            pillar={p.pillarId ? pillarById.get(p.pillarId) : undefined}
            onAdvance={() => void mover.advance(p)}
            onMove={(to) => void mover.move(p, to)}
          />
        )}
        footer={(col) => {
          if (col.key === "ideas")
            return (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void quickAdd();
                }}
                className="flex items-center gap-1"
              >
                <input
                  value={quick}
                  onChange={(e) => setQuick(e.target.value)}
                  placeholder="+ Capture an idea"
                  className={cn(inputClass, "h-8 w-full bg-card text-xs")}
                />
              </form>
            );
          if (col.key === "planning")
            return (
              <button
                onClick={() => onNew({ stage: "brief", brand })}
                className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs text-muted-foreground hover:bg-card hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> New brief
              </button>
            );
          if (col.key === "done" && doneAll.length > DONE_LIMIT)
            return (
              <button
                onClick={() => setShowAllDone(!showAllDone)}
                className="w-full rounded-md py-1.5 text-xs text-muted-foreground hover:bg-card hover:text-foreground"
              >
                {showAllDone ? "Show recent only" : `Show all ${doneAll.length}`}
              </button>
            );
          return null;
        }}
      />
    </div>
  );
}
