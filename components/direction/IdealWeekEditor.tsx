"use client";

/**
 * Ideal Week editor — a visual 7-column template (6am–10pm). Blocks are
 * maker / manager / admin / routine / free (token colours), optionally tagged
 * with a life area. Day types (Focus / Buffer / Free) and a theme per weekday.
 * "Apply" turns the template into real calendar blocks without overlaps.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CalendarPlus, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { AreaDot, Chip, Dialog, Field, InlineEdit, Segmented, Select, TextInput, areaColor, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { addDaysYmd, clockLabel, minToClock, parseClock } from "@/lib/day";
import { BLOCK_TYPES, BLOCK_TYPE_KEYS, BlockType, DAY_TYPES, DayType, errMsg } from "./util";

const START = 6 * 60;
const END = 22 * 60;
const PX = 0.7; // px per minute → 42px per hour
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_CYCLE: DayType[] = ["focus", "buffer", "free"];

type Block = {
  id: string;
  weekday: number;
  startMin: number;
  endMin: number;
  title: string;
  blockType: BlockType;
  lifeAreaId?: Id<"lifeAreas">;
};

/** Greedy lanes so overlapping template blocks sit side by side. */
function layout(blocks: Block[]) {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
  const lanes: number[] = [];
  const out = new Map<string, { lane: number; lanes: number }>();
  const placed: { b: Block; lane: number }[] = [];
  for (const b of sorted) {
    let lane = lanes.findIndex((end) => end <= b.startMin);
    if (lane === -1) {
      lane = lanes.length;
      lanes.push(b.endMin);
    } else lanes[lane] = b.endMin;
    placed.push({ b, lane });
  }
  for (const p of placed) {
    const overlapping = placed.filter((q) => q.b.startMin < p.b.endMin && p.b.startMin < q.b.endMin);
    out.set(p.b.id, { lane: p.lane, lanes: Math.max(...overlapping.map((q) => q.lane)) + 1 });
  }
  return out;
}

export function IdealWeekEditor({ today, thisWeek }: { today: string; thisWeek: string }) {
  const tpl = useQuery(api.idealWeek.get);
  const areas = useQuery(api.lifeAreas.list);
  const setDay = useMutation(api.idealWeek.setDay);
  const reset = useMutation(api.idealWeek.reset);
  const apply = useMutation(api.idealWeek.applyToWeek);
  const clearWeek = useMutation(api.idealWeek.clearWeek);
  const [edit, setEdit] = useState<Block | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const liveAreas = useMemo(() => (areas ?? []).filter((a) => !a.archived).sort((a, b) => a.order - b.order), [areas]);
  const areaOf = (id?: string) => liveAreas.find((a) => a._id === id);

  const totals = useMemo(() => {
    const t: Record<BlockType, number> = { maker: 0, manager: 0, admin: 0, routine: 0, free: 0 };
    for (const b of tpl?.blocks ?? []) t[b.blockType] += b.endMin - b.startMin;
    return t;
  }, [tpl]);

  if (!tpl) return <div className="skeleton h-[720px]" />;

  const doApply = async (weekStart: string, label: string) => {
    setBusy(label);
    try {
      const r = await apply({ weekStart, today });
      const skipped = [r.overlaps && `${r.overlaps} overlapping`, r.duplicates && `${r.duplicates} already there`, r.past && `${r.past} in the past`, r.free && `${r.free} on the Free Day`]
        .filter(Boolean)
        .join(" · ");
      if (r.created) reward(`Ideal Week applied to ${label} · ${r.created} blocks`, undefined, false);
      else toast(`Nothing new to add to ${label}`, { tone: "info" });
      if (skipped) toast(`Skipped ${skipped}`, { tone: "info" });
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(null);
    }
  };

  const nextWeek = addDaysYmd(thisWeek, 7);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {BLOCK_TYPE_KEYS.map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5" title={BLOCK_TYPES[k].hint}>
              <span className="size-2.5 rounded-sm" style={{ background: BLOCK_TYPES[k].color }} />
              {BLOCK_TYPES[k].label}
              <span className="tabular-nums">{Math.round((totals[k] / 60) * 10) / 10}h</span>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void doApply(thisWeek, "this week")} disabled={!!busy} className={buttonVariants({ size: "sm" })}>
            <CalendarPlus className="h-3.5 w-3.5" /> Apply to this week
          </button>
          <button onClick={() => void doApply(nextWeek, "next week")} disabled={!!busy} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <CalendarPlus className="h-3.5 w-3.5" /> Next week
          </button>
          <button
            onClick={async () => {
              setBusy("undo");
              try {
                const n = await clearWeek({ weekStart: thisWeek, today });
                toast(n ? `Removed ${n} untouched template blocks from this week` : "No untouched template blocks to remove", { tone: "info" });
              } catch (e) {
                toast(errMsg(e), { tone: "warning" });
              } finally {
                setBusy(null);
              }
            }}
            disabled={!!busy}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            title="Remove this week's planned blocks that came from the template (from today on)"
          >
            <Undo2 className="h-3.5 w-3.5" /> Undo apply
          </button>
          <button
            onClick={() =>
              confirm("Reset your Ideal Week to the founder default?") &&
              void reset()
                .then(() => toast("Ideal Week reset", { tone: "success" }))
                .catch((e) => toast(errMsg(e), { tone: "warning" }))
            }
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>
      {tpl.isDefault && (
        <p className="rounded-lg bg-info-soft px-3 py-2 text-xs text-info">
          This is the founder default: maker mornings, manager afternoons, a daily sales block, Wednesday content, Friday buffer + review and a
          protected Free Day. Click any block or empty slot to make it yours.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border scrollbar-thin">
        <div className="grid min-w-[820px] grid-cols-[44px_repeat(7,minmax(0,1fr))]">
          {/* header */}
          <div className="sticky left-0 z-10 border-b border-border bg-card" />
          {ORDER.map((wd) => {
            const d = tpl.days.find((x) => x.weekday === wd)!;
            const meta = DAY_TYPES[d.dayType];
            return (
              <div key={wd} className="space-y-1 border-b border-l border-border bg-card px-2 py-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-semibold">{WD[wd]}</span>
                  <button
                    onClick={() =>
                      void setDay({ weekday: wd, dayType: DAY_CYCLE[(DAY_CYCLE.indexOf(d.dayType) + 1) % 3] }).catch((e) => toast(errMsg(e), { tone: "warning" }))
                    }
                    title={`${meta.label}: ${meta.hint} — click to change`}
                  >
                    <Chip tone={meta.tone} className="cursor-pointer px-1.5 py-0 text-[10px]">
                      {meta.label}
                    </Chip>
                  </button>
                </div>
                <InlineEdit value={d.theme ?? ""} placeholder="Theme…" onSave={(v) => void setDay({ weekday: wd, theme: v })} className="text-[11px] text-muted-foreground" />
              </div>
            );
          })}

          {/* time gutter */}
          <div className="sticky left-0 z-10 bg-card" style={{ height: (END - START) * PX }}>
            {Array.from({ length: (END - START) / 60 + 1 }, (_, i) => (
              <span key={i} className="absolute -translate-y-1/2 pl-1 text-[10px] tabular-nums text-muted-foreground" style={{ top: i * 60 * PX }}>
                {i === 0 ? "" : clockLabel(START + i * 60)}
              </span>
            ))}
          </div>

          {ORDER.map((wd) => {
            const d = tpl.days.find((x) => x.weekday === wd)!;
            const dayBlocks = tpl.blocks.filter((b) => b.weekday === wd) as Block[];
            const lanes = layout(dayBlocks);
            return (
              <div
                key={wd}
                className={cn("relative cursor-copy border-l border-border", d.dayType === "free" && "bg-success-soft/50")}
                style={{ height: (END - START) * PX }}
                onClick={(e) => {
                  if (e.target !== e.currentTarget) return;
                  const y = e.nativeEvent.offsetY;
                  const start = Math.max(START, Math.min(END - 30, START + Math.floor(y / PX / 30) * 30));
                  setEdit({ id: "", weekday: wd, startMin: start, endMin: Math.min(END, start + 60), title: "", blockType: "maker" });
                }}
              >
                {Array.from({ length: (END - START) / 60 }, (_, i) => (
                  <div key={i} className="pointer-events-none absolute inset-x-0 border-t border-border/60" style={{ top: i * 60 * PX }} />
                ))}
                {d.dayType === "free" && dayBlocks.length === 0 && (
                  <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xs font-medium text-success">Free Day</span>
                )}
                {dayBlocks.map((b) => {
                  const top = (Math.max(START, b.startMin) - START) * PX;
                  const h = Math.max(14, (Math.min(END, b.endMin) - Math.max(START, b.startMin)) * PX - 2);
                  if (b.endMin <= START || b.startMin >= END) return null;
                  const l = lanes.get(b.id) ?? { lane: 0, lanes: 1 };
                  const color = BLOCK_TYPES[b.blockType].color;
                  const area = areaOf(b.lifeAreaId);
                  return (
                    <button
                      key={b.id}
                      onClick={() => setEdit(b)}
                      className="absolute overflow-hidden rounded-md border-l-[3px] px-1.5 py-0.5 text-left transition-shadow hover:shadow-raised focus-visible:ring-2 focus-visible:ring-ring"
                      style={{
                        top: top + 1,
                        height: h,
                        left: `calc(${(l.lane / l.lanes) * 100}% + 2px)`,
                        width: `calc(${100 / l.lanes}% - 4px)`,
                        borderColor: color,
                        background: `color-mix(in oklab, ${color} 14%, var(--card))`,
                      }}
                      title={`${b.title} · ${clockLabel(b.startMin)}–${clockLabel(b.endMin)} · ${BLOCK_TYPES[b.blockType].label}${area ? ` · ${area.name}` : ""}`}
                    >
                      <span className="block truncate text-[11px] font-semibold leading-tight">{b.title}</span>
                      {h > 26 && (
                        <span className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                          {area && <AreaDot color={areaColor(area)} className="size-1.5" />}
                          {clockLabel(b.startMin)}–{clockLabel(b.endMin)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {edit && <BlockDialog block={edit} areas={liveAreas} onClose={() => setEdit(null)} />}
    </div>
  );
}

function BlockDialog({ block, areas, onClose }: { block: Block; areas: { _id: Id<"lifeAreas">; name: string }[]; onClose: () => void }) {
  const upsert = useMutation(api.idealWeek.upsertBlock);
  const remove = useMutation(api.idealWeek.removeBlock);
  const [b, setB] = useState<Block>(block);
  const [start, setStart] = useState(minToClock(block.startMin));
  const [end, setEnd] = useState(minToClock(block.endMin));
  const s = parseClock(start);
  const e = parseClock(end);
  const valid = b.title.trim() && s !== null && e !== null && e > s;
  const save = async () => {
    if (!valid) return;
    try {
      await upsert({ block: { ...b, title: b.title.trim(), startMin: s!, endMin: e! } });
      onClose();
    } catch (err) {
      toast(errMsg(err), { tone: "warning" });
    }
  };
  return (
    <Dialog open onClose={onClose} title={block.id ? "Edit block" : "New template block"}>
      <form
        className="space-y-4"
        onSubmit={(ev) => {
          ev.preventDefault();
          void save();
        }}
      >
        <Field label="Title">
          <TextInput autoFocus value={b.title} onChange={(ev) => setB({ ...b, title: ev.target.value })} placeholder="Delivery deep work" />
        </Field>
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Type</span>
          <div>
            <Segmented
              size="sm"
              value={b.blockType}
              onChange={(blockType) => setB({ ...b, blockType })}
              options={BLOCK_TYPE_KEYS.map((k) => ({
                value: k,
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-sm" style={{ background: BLOCK_TYPES[k].color }} />
                    {BLOCK_TYPES[k].label}
                  </span>
                ),
              }))}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">{BLOCK_TYPES[b.blockType].hint}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Day">
            <Select value={b.weekday} onChange={(ev) => setB({ ...b, weekday: Number(ev.target.value) })}>
              {ORDER.map((wd) => (
                <option key={wd} value={wd}>
                  {WD[wd]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Start">
            <TextInput type="time" step={300} value={start} onChange={(ev) => setStart(ev.target.value)} />
          </Field>
          <Field label="End">
            <TextInput type="time" step={300} value={end} onChange={(ev) => setEnd(ev.target.value)} />
          </Field>
        </div>
        <Field label="Life area (optional)" hint="Tags the hours so target vs actual adds up by area.">
          <Select value={b.lifeAreaId ?? ""} onChange={(ev) => setB({ ...b, lifeAreaId: (ev.target.value || undefined) as Id<"lifeAreas"> | undefined })}>
            <option value="">No area</option>
            {areas.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        {s !== null && e !== null && e <= s && <p className="text-xs text-warning">End must be after start.</p>}
        <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
          {block.id ? (
            <button
              type="button"
              onClick={() =>
                void remove({ id: block.id })
                  .then(onClose)
                  .catch((err) => toast(errMsg(err), { tone: "warning" }))
              }
              className={cn(buttonVariants({ variant: "ghost" }), "text-danger hover:text-danger")}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
              Cancel
            </button>
            <button className={buttonVariants()} disabled={!valid}>
              Save
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

