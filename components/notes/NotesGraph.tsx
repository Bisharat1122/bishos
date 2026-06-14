"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

const W = 900;
const H = 620;
const FALLBACK = "hsl(var(--primary))";
const clampScale = (v: number) => Math.max(0.4, Math.min(3, v));

type P = { x: number; y: number };
type Area = { _id: Id<"lifeAreas">; name: string; color?: string };

function computeLayout(n: number, edges: [number, number][]): P[] {
  if (n === 0) return [];
  const pos: P[] = Array.from({ length: n }, (_, i) => ({
    x: W / 2 + Math.cos((i / n) * Math.PI * 2) * 200,
    y: H / 2 + Math.sin((i / n) * Math.PI * 2) * 200,
  }));
  const REP = 9000, SPRING = 0.02, LEN = 130;
  for (let iter = 0; iter < 320; iter++) {
    const fx = new Array(n).fill(0);
    const fy = new Array(n).fill(0);
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) d2 = 1;
        const f = REP / d2, d = Math.sqrt(d2);
        fx[i] += (dx / d) * f; fy[i] += (dy / d) * f;
        fx[j] -= (dx / d) * f; fy[j] -= (dy / d) * f;
      }
    for (const [a, b] of edges) {
      const dx = pos[b].x - pos[a].x, dy = pos[b].y - pos[a].y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - LEN) * SPRING;
      fx[a] += (dx / d) * f * d; fy[a] += (dy / d) * f * d;
      fx[b] -= (dx / d) * f * d; fy[b] -= (dy / d) * f * d;
    }
    for (let i = 0; i < n; i++) {
      fx[i] += (W / 2 - pos[i].x) * 0.01; fy[i] += (H / 2 - pos[i].y) * 0.01;
      pos[i].x += Math.max(-12, Math.min(12, fx[i] * 0.02));
      pos[i].y += Math.max(-12, Math.min(12, fy[i] * 0.02));
      pos[i].x = Math.max(30, Math.min(W - 30, pos[i].x));
      pos[i].y = Math.max(30, Math.min(H - 30, pos[i].y));
    }
  }
  return pos;
}

export function NotesGraph({
  notes: allNotes,
  areas,
  onOpen,
}: {
  notes: Doc<"notes">[];
  areas?: Area[];
  onOpen: (id: Id<"notes">) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<P>({ x: 0, y: 0 });
  const [hover, setHover] = useState<number | null>(null);

  const notes = useMemo(
    () => (areaFilter ? allNotes.filter((n) => n.lifeAreaId === areaFilter) : allNotes),
    [allNotes, areaFilter],
  );

  const indexOf = useMemo(() => {
    const m = new Map<string, number>();
    notes.forEach((n, i) => m.set(n._id, i));
    return m;
  }, [notes]);

  const edges = useMemo<[number, number][]>(() => {
    const e: [number, number][] = [];
    notes.forEach((n, i) => {
      for (const lid of n.linkedNoteIds ?? []) {
        const j = indexOf.get(lid);
        if (j !== undefined && j !== i) e.push([i, j]);
      }
    });
    return e;
  }, [notes, indexOf]);

  const degree = useMemo(() => {
    const d = new Array(notes.length).fill(0);
    for (const [a, b] of edges) { d[a]++; d[b]++; }
    return d;
  }, [edges, notes.length]);

  const sig = notes.map((n) => n._id).join(",");
  const layout = useMemo(() => computeLayout(notes.length, edges), [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pos, setPos] = useState<P[]>(layout);
  useEffect(() => setPos(layout), [layout]);

  const drag = useRef<
    | { type: "node"; i: number; moved: boolean }
    | { type: "pan"; lastX: number; lastY: number }
    | null
  >(null);

  const colorFor = (n: Doc<"notes">) =>
    areas?.find((a) => a._id === n.lifeAreaId)?.color ?? FALLBACK;

  const usedAreas = useMemo(() => {
    const ids = new Set(notes.map((n) => n.lifeAreaId).filter(Boolean));
    return (areas ?? []).filter((a) => ids.has(a._id));
  }, [notes, areas]);

  function rawPoint(e: React.PointerEvent): P {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  }
  // invert the group transform to get layout-space coords
  const toLayout = (r: P): P => ({ x: (r.x - pan.x) / scale, y: (r.y - pan.y) / scale });

  function zoom(factor: number) {
    setScale((s) => clampScale(s * factor));
  }
  function reset() {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }

  return (
    <div className="rounded-2xl border border-border bg-card/40">
      {/* toolbar */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-xs outline-none"
        >
          <option value="">All life areas</option>
          {(areas ?? []).map((a) => (
            <option key={a._id} value={a._id}>{a.name}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          {notes.length} notes · {edges.length} links
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => zoom(1 / 1.2)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border hover:bg-muted">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center text-xs text-muted-foreground">{Math.round(scale * 100)}%</span>
          <button onClick={() => zoom(1.2)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border hover:bg-muted">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button onClick={reset} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border hover:bg-muted" title="Reset view">
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
          No notes to graph in this filter.
        </div>
      ) : (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-[70vh] w-full touch-none"
          onPointerMove={(e) => {
            if (!drag.current) return;
            const r = rawPoint(e);
            if (drag.current.type === "node") {
              drag.current.moved = true;
              const p = toLayout(r);
              const i = drag.current.i;
              setPos((prev) => prev.map((pp, idx) => (idx === i ? p : pp)));
            } else {
              const dx = r.x - drag.current.lastX;
              const dy = r.y - drag.current.lastY;
              drag.current.lastX = r.x;
              drag.current.lastY = r.y;
              setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
            }
          }}
          onPointerUp={() => {
            if (drag.current?.type === "node" && !drag.current.moved) onOpen(notes[drag.current.i]._id);
            drag.current = null;
          }}
          onPointerLeave={() => (drag.current = null)}
        >
          {/* background pan target */}
          <rect
            x={0}
            y={0}
            width={W}
            height={H}
            fill="transparent"
            onPointerDown={(e) => {
              const r = rawPoint(e);
              drag.current = { type: "pan", lastX: r.x, lastY: r.y };
            }}
          />
          <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
            {edges.map(([a, b], i) => (
              <line
                key={i}
                x1={pos[a]?.x} y1={pos[a]?.y} x2={pos[b]?.x} y2={pos[b]?.y}
                stroke="hsl(var(--border))"
                strokeWidth={hover === a || hover === b ? 2.5 : 1}
                opacity={hover === null || hover === a || hover === b ? 0.9 : 0.2}
              />
            ))}
            {notes.map((n, i) => {
              const r = 8 + Math.min(14, degree[i] * 3);
              const connected =
                hover === null || hover === i ||
                edges.some(([a, b]) => (a === i && b === hover) || (b === i && a === hover));
              return (
                <g
                  key={n._id}
                  transform={`translate(${pos[i]?.x ?? 0},${pos[i]?.y ?? 0})`}
                  className="cursor-pointer"
                  opacity={connected ? 1 : 0.3}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.target as Element).setPointerCapture?.(e.pointerId);
                    drag.current = { type: "node", i, moved: false };
                  }}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                >
                  <circle r={hover === i ? r + 2 : r} style={{ fill: colorFor(n) }} stroke="hsl(var(--background))" strokeWidth={2} />
                  <text y={r + 15} textAnchor="middle" className="pointer-events-none fill-foreground text-[12px]">
                    {n.title.length > 22 ? n.title.slice(0, 22) + "…" : n.title}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-4 py-2 text-xs text-muted-foreground">
        {usedAreas.map((a) => (
          <span key={a._id} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color ?? FALLBACK }} />
            {a.name}
          </span>
        ))}
        <span className="ml-auto">drag node to move · drag background to pan · click to open</span>
      </div>
    </div>
  );
}
