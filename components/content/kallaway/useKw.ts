"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { toast } from "@/components/os/celebrate";
import { errMsg } from "../model";

export type Kw = NonNullable<Doc<"contentPieces">["kw"]>;
export type KwPatch = Partial<Kw>;
export type KwStatus = "idle" | "saving" | "saved" | "error";

/**
 * Local copy of `piece.kw` with debounced, merged autosave through
 * contentSystem.saveKw. Edits land in a pending patch; a flush sends it and
 * any edits made while a save is in flight queue up for the next one, so a
 * fast second edit is never lost. Server updates are adopted for every key
 * that has no unsaved local change.
 */
export function useKw(id: Id<"contentPieces">, server: Kw | undefined, delay = 700) {
  const save = useMutation(api.contentSystem.saveKw);
  const [kw, setKw] = useState<Kw>(() => server ?? {});
  const [status, setStatus] = useState<KwStatus>("idle");
  const kwRef = useRef<Kw>(server ?? {});
  const pending = useRef<KwPatch>({});
  const inflight = useRef<KwPatch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const warned = useRef(false);

  const serverKey = JSON.stringify(server ?? {});
  useEffect(() => {
    const next = { ...(server ?? {}), ...inflight.current, ...pending.current } as Kw;
    kwRef.current = next;
    setKw(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  const flush = useCallback(
    (opts: { alsoHook?: boolean; patch?: KwPatch } = {}) => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      const run = async () => {
        const toSend = { ...pending.current, ...(opts.patch ?? {}) } as KwPatch;
        pending.current = {};
        if (!Object.keys(toSend).length && !opts.alsoHook) return;
        inflight.current = { ...inflight.current, ...toSend };
        setStatus("saving");
        try {
          await save({ id, patch: toSend, alsoHook: opts.alsoHook || undefined });
          setStatus("saved");
          warned.current = false;
        } catch (e) {
          // Keep the edits for the next flush (newer pending edits win).
          pending.current = { ...toSend, ...pending.current };
          setStatus("error");
          if (!warned.current) {
            warned.current = true;
            toast(errMsg(e), { tone: "warning" });
          }
          throw e;
        } finally {
          const inf = inflight.current as Record<string, unknown>;
          for (const [k, val] of Object.entries(toSend)) if (inf[k] === val) delete inf[k];
        }
      };
      const p = chain.current.then(run, run);
      chain.current = p.catch(() => {});
      return p;
    },
    [id, save],
  );

  /** Merge a patch (or a patch computed from the latest kw) and autosave. */
  const set = useCallback(
    (patch: KwPatch | ((cur: Kw) => KwPatch)) => {
      const p = typeof patch === "function" ? patch(kwRef.current) : patch;
      kwRef.current = { ...kwRef.current, ...p };
      pending.current = { ...pending.current, ...p };
      setKw(kwRef.current);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush().catch(() => {}), delay);
    },
    [delay, flush],
  );

  // Save what's left when the panel unmounts or the tab is hidden.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush().catch(() => {});
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      void flush().catch(() => {});
    };
  }, [flush]);

  return { kw, set, flush, status };
}

export type KwStore = ReturnType<typeof useKw>;

/** Toggle a value in a string/number list. */
export function toggleIn<T>(list: T[] | undefined, v: T): T[] {
  const l = list ?? [];
  return l.includes(v) ? l.filter((x) => x !== v) : [...l, v];
}
