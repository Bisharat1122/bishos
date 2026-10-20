"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { GitFork, Minus, Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Dialog, Segmented, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { FORMATS, PLATFORMS, errMsg, formatMeta } from "./model";

type Row = { format: string; count: number; platforms: string[] };

const DEFAULT_PLAN: Row[] = [
  { format: "short_video", count: 3, platforms: ["tiktok", "instagram", "youtube_shorts"] },
  { format: "carousel", count: 1, platforms: ["instagram", "linkedin"] },
  { format: "text_post", count: 3, platforms: ["linkedin", "x"] },
  { format: "thread", count: 1, platforms: ["x"] },
  { format: "newsletter", count: 0, platforms: ["newsletter"] },
  { format: "article", count: 0, platforms: ["blog"] },
];

/** Cut a hub into child pieces (hub-and-spoke). */
export function RepurposeDialog({
  open,
  onClose,
  piece,
}: {
  open: boolean;
  onClose: () => void;
  piece: { _id: Id<"contentPieces">; title: string };
}) {
  const repurpose = useMutation(api.content.repurpose);
  const [rows, setRows] = useState<Row[]>(DEFAULT_PLAN);
  const [stage, setStage] = useState<"idea" | "brief">("brief");
  const [busy, setBusy] = useState(false);
  const [extra, setExtra] = useState("");

  const total = rows.reduce((s, r) => s + r.count, 0);
  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function go() {
    setBusy(true);
    try {
      const ids = await repurpose({
        id: piece._id,
        stage,
        children: rows.filter((r) => r.count > 0).map((r) => ({ format: r.format, count: r.count, platforms: r.platforms })),
      });
      reward(`${ids.length} pieces cut from your hub`, undefined, ids.length >= 5);
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  const unused = FORMATS.filter((f) => !rows.some((r) => r.format === f.key));

  return (
    <Dialog open={open} onClose={onClose} title="Repurpose this hub" size="lg">
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        One hub, many spokes. Each child is created as a draft linked to <span className="font-medium text-foreground">{piece.title}</span>, with the
        same pillar and brand.
      </p>
      <div className="space-y-2">
        {rows.map((r, i) => {
          const F = formatMeta(r.format);
          const I = F.icon;
          return (
            <div key={r.format} className={cn("rounded-lg border border-border p-3 transition-colors", r.count === 0 && "opacity-60")}>
              <div className="flex items-center gap-3">
                <I className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{F.label}</span>
                <div className="flex items-center gap-1">
                  <button
                    aria-label={`Fewer ${F.label}`}
                    onClick={() => setRow(i, { count: Math.max(0, r.count - 1) })}
                    className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold tabular-nums">{r.count}</span>
                  <button
                    aria-label={`More ${F.label}`}
                    onClick={() => setRow(i, { count: Math.min(10, r.count + 1) })}
                    className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {r.count > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 pl-7">
                  {PLATFORMS.map((p) => {
                    const on = r.platforms.includes(p.key);
                    const PI = p.icon;
                    return (
                      <button
                        key={p.key}
                        onClick={() => setRow(i, { platforms: on ? r.platforms.filter((x) => x !== p.key) : [...r.platforms, p.key] })}
                        aria-pressed={on}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                          on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <PI className="h-3 w-3" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {unused.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <select
            value={extra}
            onChange={(e) => {
              const f = e.target.value;
              if (f) setRows((rs) => [...rs, { format: f, count: 1, platforms: [] }]);
              setExtra("");
            }}
            className="h-8 rounded-md border border-input bg-card px-2 text-xs text-muted-foreground"
          >
            <option value="">+ Add another format…</option>
            {unused.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground">Children start in</span>
        <Segmented
          size="sm"
          value={stage}
          onChange={setStage}
          options={[
            { value: "idea", label: "Idea" },
            { value: "brief", label: "Brief" },
          ]}
        />
        <div className="ml-auto flex gap-2">
          <button onClick={onClose} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Cancel
          </button>
          <button onClick={() => void go()} disabled={!total || busy} className={buttonVariants({ size: "sm" })}>
            <GitFork className="h-3.5 w-3.5" />
            Create {total} piece{total === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
