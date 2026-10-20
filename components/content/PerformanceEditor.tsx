"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Dialog, Segmented, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { holdAdvice, rankAdvice } from "@/lib/kallaway";
import { errMsg, type PerfWindow } from "./model";
import { Note } from "./kallaway/parts";

type Snap = {
  window: PerfWindow;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  follows?: number;
  leads?: number;
  hold3s?: number;
  avdSec?: number;
  ctr?: number;
  at: number;
};

const FIELDS = [
  { key: "views", label: "Views" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "shares", label: "Shares" },
  { key: "saves", label: "Saves" },
  { key: "follows", label: "Follows" },
  { key: "leads", label: "Leads" },
] as const;
type FieldKey = (typeof FIELDS)[number]["key"];

/** Retention / click metrics (Kallaway: 3s hold for shorts; YouTube: CTR + AVD). */
const EXTRA = [
  { key: "hold3s", label: "3s hold %", placeholder: "e.g. 72", hint: "% still watching at 3 seconds", show: (long: boolean | null) => long !== true },
  { key: "avdSec", label: "Avg view", placeholder: "m:ss", hint: "Average view duration", show: () => true },
  { key: "ctr", label: "CTR %", placeholder: "e.g. 6.5", hint: "Impressions click-through rate", show: (long: boolean | null) => long !== false },
] as const;
type ExtraKey = (typeof EXTRA)[number]["key"];
type ValKey = FieldKey | ExtraKey;

/** 24h / 7d / 30d snapshot inputs. */
export function PerformanceEditor({
  pieceId,
  performance,
  defaultWindow,
  onSaved,
  format,
  brand,
}: {
  pieceId: Id<"contentPieces">;
  performance: Snap[];
  defaultWindow?: PerfWindow;
  onSaved?: () => void;
  /** When known, shows only the relevant retention fields (3s hold for shorts, CTR for long video). */
  format?: string;
  brand?: "personal" | "company";
}) {
  const log = useMutation(api.content.logPerformance);
  const long = format == null ? null : format === "long_video";
  const extras = EXTRA.filter((f) => f.show(long));
  // YouTube "1-of-10": where this video ranks by views among your last 10.
  const iteration = useQuery(api.contentSystem.iteration, long ? { brand, limit: 200 } : "skip");
  const rank = iteration?.find((x) => x._id === pieceId)?.rank ?? null;
  const clear = useMutation(api.content.clearPerformance);
  const latest = (["30d", "7d", "24h"] as PerfWindow[]).find((w) => performance.some((s) => s.window === w));
  const [win, setWin] = useState<PerfWindow>(defaultWindow ?? latest ?? "24h");
  const snap = performance.find((s) => s.window === win);
  const [vals, setVals] = useState<Record<ValKey, string>>(() => toVals(snap));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setVals(toVals(performance.find((s) => s.window === win)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win, snap?.at]);

  async function save() {
    const nums: Partial<Record<ValKey, number>> = {};
    for (const f of FIELDS) {
      const raw = vals[f.key].replace(/[, ]/g, "").trim();
      if (!raw) continue;
      const n = parseHuman(raw);
      if (n == null) {
        toast(`${f.label}: enter a number`, { tone: "warning" });
        return;
      }
      nums[f.key] = n;
    }
    for (const f of extras) {
      const raw = vals[f.key].trim();
      if (!raw) continue;
      const n = f.key === "avdSec" ? parseDuration(raw) : parsePct(raw);
      if (n == null) {
        toast(f.key === "avdSec" ? "Avg view: enter seconds or m:ss" : `${f.label}: enter a percentage (0–100)`, { tone: "warning" });
        return;
      }
      nums[f.key] = n;
    }
    if (nums.views == null) {
      toast("Views are needed to compare with your median", { tone: "warning" });
      return;
    }
    setBusy(true);
    try {
      await log({ id: pieceId, window: win, ...nums });
      toast(`${win} numbers saved`, { tone: "success" });
      onSaved?.();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Segmented<PerfWindow>
        size="sm"
        value={win}
        onChange={setWin}
        options={(["24h", "7d", "30d"] as PerfWindow[]).map((w) => ({
          value: w,
          label: (
            <span className="inline-flex items-center gap-1">
              {w}
              {performance.some((s) => s.window === w) && <span className="size-1.5 rounded-full bg-success" aria-label="has data" />}
            </span>
          ),
        }))}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FIELDS.map((f) => (
          <label key={f.key} className={cn("block", f.key === "views" && "col-span-2 sm:col-span-1")}>
            <span className="text-[11px] font-medium text-muted-foreground">{f.label}</span>
            <input
              inputMode="numeric"
              value={vals[f.key]}
              onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && void save()}
              placeholder="—"
              className={cn(inputClass, "mt-1 h-8 w-full tabular-nums", f.key === "views" && "font-medium")}
            />
          </label>
        ))}
        {extras.map((f) => (
          <label key={f.key} className="block" title={f.hint}>
            <span className="text-[11px] font-medium text-muted-foreground">{f.label}</span>
            <input
              inputMode="decimal"
              value={vals[f.key]}
              onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && void save()}
              placeholder={f.placeholder}
              className={cn(inputClass, "mt-1 h-8 w-full tabular-nums")}
            />
          </label>
        ))}
      </div>
      {long !== true && snap?.hold3s != null && <AdviceNote {...holdAdvice(snap.hold3s)} />}
      {long === true && rank && <AdviceNote {...rankAdvice(rank.rank)} prefix={`#${rank.rank} of your last ${rank.of} long videos.`} />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">Tip: 1.2k and 3m work too.</p>
        <div className="flex gap-2">
          {snap && (
            <button
              onClick={() => void clear({ id: pieceId, window: win }).catch((e) => toast(errMsg(e), { tone: "warning" }))}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Clear {win}
            </button>
          )}
          <button onClick={() => void save()} disabled={busy} className={buttonVariants({ size: "sm" })}>
            Save {win}
          </button>
        </div>
      </div>
    </div>
  );
}

function toVals(s?: Snap): Record<ValKey, string> {
  const o = {} as Record<ValKey, string>;
  for (const f of FIELDS) o[f.key] = s?.[f.key] != null ? String(s[f.key]) : "";
  o.hold3s = s?.hold3s != null ? String(s.hold3s) : "";
  o.ctr = s?.ctr != null ? String(s.ctr) : "";
  o.avdSec = s?.avdSec != null ? fmtDuration(s.avdSec) : "";
  return o;
}

function AdviceNote({ tone, text, prefix }: { tone: "success" | "info" | "warning"; text: string; prefix?: string }) {
  return (
    <Note tone={tone}>
      {prefix && <span className="font-medium">{prefix} </span>}
      {text}
    </Note>
  );
}

/** "72", "72%", "6.5" → number in 0–100. */
function parsePct(raw: string): number | null {
  const n = Number(raw.replace(/[%\s]/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

/** "83", "83s", "1:23", "1m 23s" → seconds. */
function parseDuration(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  const mmss = /^(\d+):([0-5]?\d)$/.exec(s);
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
  const ms = /^(?:(\d+(?:\.\d+)?)\s*m(?:in)?)?\s*(?:(\d+(?:\.\d+)?)\s*s(?:ec)?)?$/.exec(s);
  if (ms && (ms[1] || ms[2])) return Math.round(Number(ms[1] ?? 0) * 60 + Number(ms[2] ?? 0));
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  return m ? `${m}:${String(Math.round(sec % 60)).padStart(2, "0")}` : String(Math.round(sec));
}

/** "1.2k" → 1200, "3m" → 3000000, "450" → 450. */
function parseHuman(raw: string): number | null {
  const m = /^(\d+(?:\.\d+)?)([km])?$/i.exec(raw);
  if (!m) return null;
  const n = Number(m[1]) * (m[2]?.toLowerCase() === "k" ? 1000 : m[2]?.toLowerCase() === "m" ? 1_000_000 : 1);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function PerformanceDialog({
  open,
  onClose,
  title,
  pieceId,
  performance,
  defaultWindow,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  pieceId: Id<"contentPieces">;
  performance: Snap[];
  defaultWindow?: PerfWindow;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={`Numbers · ${title}`}>
      <PerformanceEditor pieceId={pieceId} performance={performance} defaultWindow={defaultWindow} onSaved={onClose} />
    </Dialog>
  );
}
