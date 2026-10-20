"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Rocket, ShieldCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Bar, CheckCircle, Dialog, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { useToday } from "@/lib/day";
import { STAGE_LABEL, checklistFor, errMsg, isChecked, isPublishMove, nextStage, type Stage } from "./model";

export type MovablePiece = {
  _id: Id<"contentPieces">;
  title: string;
  format: string;
  stage: Stage;
  checklist?: string[];
  pillarId?: unknown;
  childCount?: number;
  publishedAt?: number;
  isHub?: boolean;
};

/**
 * Stage moves with the publish gate. Returns `move`, `advance` and the gate
 * dialog element to render once.
 */
export function useStageMover() {
  const today = useToday();
  const setStage = useMutation(api.content.setStage);
  const [gate, setGate] = useState<{ piece: MovablePiece; to: Stage } | null>(null);

  async function run(piece: MovablePiece, to: Stage, force = false) {
    try {
      const r = await setStage({ id: piece._id, stage: to, date: today, force });
      if (r.published) reward("Published", r.xp || undefined, true);
      else toast(`${piece.title.slice(0, 40)} → ${STAGE_LABEL[to]}`, { tone: "neutral" });
      return true;
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
      return false;
    }
  }

  async function move(piece: MovablePiece, to: Stage) {
    if (piece.stage === to) return;
    if (isPublishMove(to, piece) && checklistFor(piece.format).some((c) => !isChecked(c.key, piece))) {
      setGate({ piece, to });
      return;
    }
    await run(piece, to);
  }

  async function advance(piece: MovablePiece) {
    const to = nextStage(piece.stage, piece.format, piece.isHub ?? false);
    if (to) await move(piece, to);
  }

  const gateEl = gate ? (
    <PublishGate
      piece={gate.piece}
      to={gate.to}
      onClose={() => setGate(null)}
      onPublish={async (force) => {
        const ok = await run(gate.piece, gate.to, force);
        if (ok) setGate(null);
      }}
    />
  ) : null;

  return { move, advance, gateEl };
}

function PublishGate({
  piece,
  to,
  onClose,
  onPublish,
}: {
  piece: MovablePiece;
  to: Stage;
  onClose: () => void;
  onPublish: (force: boolean) => Promise<void>;
}) {
  const toggle = useMutation(api.content.toggleChecklist);
  const [ticked, setTicked] = useState<Set<string>>(() => new Set(piece.checklist ?? []));
  const [busy, setBusy] = useState(false);
  const items = checklistFor(piece.format);
  const local = { ...piece, checklist: [...ticked] };
  const doneCount = items.filter((c) => isChecked(c.key, local)).length;
  const allDone = doneCount === items.length;

  return (
    <Dialog open onClose={onClose} title="Publish checklist">
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{piece.title}</span> is moving to {STAGE_LABEL[to]}. A 30-second check
        before it goes out.
      </p>
      <div className="mb-3 flex items-center gap-3">
        <Bar value={(doneCount / items.length) * 100} tone={allDone ? "success" : "primary"} />
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {doneCount}/{items.length}
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((c) => {
          const on = isChecked(c.key, local);
          const auto = !!c.auto && on && !ticked.has(c.key);
          return (
            <li key={c.key} className="flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-accent/50">
              <CheckCircle
                size="sm"
                checked={on}
                label={c.label}
                onClick={() => {
                  if (auto) return;
                  const next = new Set(ticked);
                  if (on) next.delete(c.key);
                  else next.add(c.key);
                  setTicked(next);
                  void toggle({ id: piece._id, key: c.key, done: !on }).catch((e) => toast(errMsg(e), { tone: "warning" }));
                }}
              />
              <div className="min-w-0">
                <p className={cn("text-sm", on && "text-muted-foreground line-through decoration-muted-foreground/40")}>{c.label}</p>
                <p className="text-[11px] text-muted-foreground">{auto ? "Done automatically" : c.hint}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
        <button className={buttonVariants({ variant: "ghost", size: "sm" })} onClick={onClose}>
          Not yet
        </button>
        {!allDone && (
          <button
            className={buttonVariants({ variant: "outline", size: "sm" })}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onPublish(true);
              setBusy(false);
            }}
          >
            Publish anyway
          </button>
        )}
        <button
          className={buttonVariants({ size: "sm" })}
          disabled={!allDone || busy}
          onClick={async () => {
            setBusy(true);
            await onPublish(false);
            setBusy(false);
          }}
        >
          {allDone ? <Rocket className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          Publish
        </button>
      </div>
    </Dialog>
  );
}
