"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TrendingUp, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type MomentumType = "task" | "goal" | "project" | "note" | "habit" | "lifeArea" | "section";

const POPOVER_W = 288; // px (w-72)

/**
 * "Moved the needle" button + popover. Logs the given item into the Momentum
 * module with a why + 1–5 impact. The popover renders in a portal with fixed
 * positioning so it's never clipped by a scrolling panel/overflow container.
 */
export function AddToMomentum({
  type,
  itemId,
  title,
  compact = false,
  className,
}: {
  type: MomentumType;
  itemId: string;
  title: string;
  compact?: boolean;
  className?: string;
}) {
  const add = useMutation(api.momentum.add);
  const count = useQuery(api.momentum.countForItem, { itemId });

  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [impact, setImpact] = useState(3);
  const [why, setWhy] = useState("");
  const [busy, setBusy] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  function toggle() {
    if (pos) { setPos(null); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(Math.max(8, r.right - POPOVER_W), window.innerWidth - POPOVER_W - 8);
    const top = window.innerHeight - r.bottom > 280 ? r.bottom + 8 : Math.max(8, r.top - 280);
    setPos({ top, left });
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      await add({ type, itemId, titleSnapshot: title, why: why.trim() || undefined, impact });
      setWhy("");
      setImpact(3);
      setPos(null);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("inline-block", className)}>
      <button
        ref={btnRef}
        onClick={toggle}
        title="Add to Momentum — log this as something that moved the needle"
        className={cn(
          "flex items-center gap-1.5 rounded-full border font-medium transition",
          compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
          justAdded
            ? "border-primary bg-primary/15 text-primary"
            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
        )}
      >
        {justAdded ? <Check className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
        {justAdded ? "Added" : "Momentum"}
        {!!count && !justAdded && <span className="rounded-full bg-muted px-1.5 text-[10px]">{count}</span>}
      </button>

      {pos &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setPos(null)} />
            <div
              className="fixed z-[61] w-72 rounded-xl border border-border bg-card p-3 shadow-2xl"
              style={{ top: pos.top, left: pos.left }}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Moved the needle</p>
                <button onClick={() => setPos(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mb-2 line-clamp-1 text-xs text-muted-foreground">{title}</p>

              <div className="mb-2">
                <p className="mb-1 text-xs text-muted-foreground">Impact</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setImpact(n)}
                      className={cn(
                        "h-7 w-7 rounded-full border text-xs font-semibold transition",
                        n <= impact
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                rows={2}
                placeholder="Why did it move the needle? (optional)"
                className="mb-2 w-full resize-none rounded-lg border border-border bg-muted/30 px-2.5 py-2 text-sm outline-none focus:border-primary/60"
              />

              <button
                onClick={() => void submit()}
                disabled={busy}
                className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition disabled:opacity-50"
              >
                {busy ? "Adding…" : "Add to Momentum"}
              </button>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
