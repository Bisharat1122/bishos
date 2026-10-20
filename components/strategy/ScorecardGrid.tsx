"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowDown, ArrowUp, Archive, ArchiveRestore, ChevronDown, ChevronUp, Pencil, Plus, Trash2, Zap } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { cn, inputClass } from "@/components/os/kit";
import { errorMessage, reward, toast } from "@/components/os/celebrate";
import { fmtYmd } from "@/lib/day";
import { AUTO_META, fmtMetric, unitSuffix } from "./lib";
import { Sparkline } from "./viz";
import { Menu } from "./Menu";

export type GridData = FunctionReturnType<typeof api.scorecard.grid>;
type Row = GridData["metrics"][number];

/**
 * Metrics × weeks. Columns run newest → oldest (this week first). Manual
 * cells are inline-editable; auto cells are read-only (⚡).
 */
export function ScorecardGrid({
  data,
  today,
  onEdit,
}: {
  data: GridData;
  today: string;
  onEdit: (m: Doc<"metrics">) => void;
}) {
  const update = useMutation(api.scorecard.update);
  const remove = useMutation(api.scorecard.remove);
  const reorder = useMutation(api.scorecard.reorder);

  const fail = (fallback: string) => (err: unknown) => toast(errorMessage(err, fallback), { tone: "warning" });

  const order = data.weeks.map((_, i) => data.weeks.length - 1 - i); // newest first
  const currentIdx = data.weeks.length - 1;
  const active = data.metrics.filter((m) => m.active);

  const move = (m: Row, dir: -1 | 1) => {
    const ids = active.map((x) => x._id);
    const i = ids.indexOf(m._id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorder({ ids }).catch(fail("Could not reorder"));
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card scrollbar-thin">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <th className="sticky left-0 z-10 w-[168px] min-w-[168px] border-b border-border bg-card px-3 py-2.5 sm:w-[220px] sm:min-w-[220px]">
              Metric
            </th>
            <th className="border-b border-border px-2 py-2.5">Trend</th>
            {order.map((i) => (
              <th
                key={data.weeks[i]}
                className={cn(
                  "whitespace-nowrap border-b border-border px-2 py-2.5 text-right",
                  i === currentIdx && "bg-muted/60 text-foreground",
                )}
              >
                {i === currentIdx ? "This week" : fmtYmd(data.weeks[i], { month: "short", day: "numeric" })}
              </th>
            ))}
            <th className="border-b border-border px-2 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {data.metrics.map((m) => {
            const auto = !!m.source;
            const hit = m.weeksWithData ? Math.round((m.onTrackCount / m.weeksWithData) * 100) : null;
            const activeIdx = active.findIndex((x) => x._id === m._id);
            return (
              <tr key={m._id} className={cn("group", !m.active && "opacity-60")}>
                <td className="sticky left-0 z-10 border-b border-border bg-card px-3 py-2.5 align-middle">
                  <div className="flex min-w-0 items-center gap-1.5">
                    {auto && (
                      <span title={`Auto: ${AUTO_META[m.source as string]?.hint ?? "calculated"}`} className="shrink-0 text-info">
                        <Zap className="h-3.5 w-3.5" aria-label="Automatic" />
                      </span>
                    )}
                    <button type="button" onClick={() => onEdit(m)} className="truncate text-left font-medium hover:underline">
                      {m.name}
                    </button>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    {m.direction === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    <span className="tabular-nums">{fmtMetric(m.target, m.unit, data.currency)}</span>
                    {unitSuffix(m.unit, data.currency) && <span>{unitSuffix(m.unit, data.currency)}</span>}
                    {hit != null && <span className="ml-1 hidden sm:inline">· {hit}% hit</span>}
                  </div>
                </td>
                <td className="border-b border-border px-2 py-2 align-middle">
                  <Sparkline values={m.values} target={m.target} direction={m.direction} width={84} height={26} label={`${m.name} trend`} />
                </td>
                {order.map((i) => (
                  <Cell
                    key={data.weeks[i]}
                    row={m}
                    idx={i}
                    weekStart={data.weeks[i]}
                    current={i === currentIdx}
                    currency={data.currency}
                    today={today}
                  />
                ))}
                <td className="border-b border-border px-1 py-2 text-right align-middle">
                  <Menu
                    items={[
                      { label: "Edit", icon: Pencil, onClick: () => onEdit(m) },
                      { label: "Move up", icon: ChevronUp, onClick: () => move(m, -1), disabled: !m.active || activeIdx <= 0 },
                      { label: "Move down", icon: ChevronDown, onClick: () => move(m, 1), disabled: !m.active || activeIdx >= active.length - 1 },
                      m.active
                        ? { label: "Archive", icon: Archive, onClick: () => void update({ id: m._id, active: false }).then(() => toast("Metric archived"), fail("Could not archive")) }
                        : { label: "Restore", icon: ArchiveRestore, onClick: () => void update({ id: m._id, active: true }).then(() => toast("Metric restored"), fail("Could not restore")) },
                      {
                        label: "Delete",
                        icon: Trash2,
                        danger: true,
                        onClick: () => {
                          if (confirm(`Delete "${m.name}" and its history?`)) remove({ id: m._id as Id<"metrics"> }).catch(fail("Could not delete"));
                        },
                      },
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Cell({
  row,
  idx,
  weekStart,
  current,
  currency,
  today,
}: {
  row: Row;
  idx: number;
  weekStart: string;
  current: boolean;
  currency: string;
  today: string;
}) {
  const setEntry = useMutation(api.scorecard.setEntry);
  const value = row.values[idx];
  const status = row.status[idx];
  const auto = !!row.source;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // Escape unmounts the input; some browsers then fire blur → commit. This flag cancels that save.
  const cancelled = useRef(false);
  useEffect(() => {
    if (editing) {
      cancelled.current = false;
      inputRef.current?.select();
    }
  }, [editing]);

  const tone =
    status === "on" ? "bg-success-soft text-success" : status === "off" ? "bg-danger-soft text-danger" : "text-muted-foreground";

  async function commit() {
    setEditing(false);
    if (cancelled.current) return;
    const t = draft.trim();
    const next = t === "" ? null : Number(t.replace(/,/g, ""));
    if (next != null && !Number.isFinite(next)) return toast("Enter a number", { tone: "warning" });
    if (next === value) return;
    try {
      const res = await setEntry({ metricId: row._id, weekStart, value: next, date: today });
      if (res.xp) reward("Scorecard updated", res.xp);
    } catch (err) {
      toast(errorMessage(err, "Could not save"), { tone: "warning" });
    }
  }

  return (
    <td className={cn("border-b border-border px-1.5 py-1.5 text-right align-middle", current && "bg-muted/40")}>
      {editing ? (
        <input
          ref={inputRef}
          autoFocus
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              cancelled.current = true;
              setEditing(false);
            }
          }}
          aria-label={`${row.name}, week of ${weekStart}`}
          className={cn(inputClass, "h-8 w-20 px-2 text-right tabular-nums")}
        />
      ) : auto ? (
        <span
          title="Calculated automatically"
          className={cn("inline-flex min-w-[3.5rem] justify-end rounded-md px-2 py-1 font-medium tabular-nums", tone)}
        >
          {fmtMetric(value, row.unit, currency)}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(value == null ? "" : String(value));
            setEditing(true);
          }}
          aria-label={`Edit ${row.name} for week of ${weekStart}`}
          className={cn(
            "inline-flex min-w-[3.5rem] items-center justify-end gap-1 rounded-md px-2 py-1 font-medium tabular-nums transition-colors",
            value == null ? "border border-dashed border-border text-muted-foreground hover:border-ring hover:text-foreground" : cn(tone, "hover:ring-1 hover:ring-ring"),
          )}
        >
          {value == null ? current ? <><Plus className="h-3 w-3" />Add</> : "—" : fmtMetric(value, row.unit, currency)}
        </button>
      )}
    </td>
  );
}
