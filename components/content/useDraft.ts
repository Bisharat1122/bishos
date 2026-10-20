"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DraftStatus = "idle" | "saving" | "saved" | "error";

/**
 * Local text draft with debounced autosave. Adopts server changes only while
 * the user has nothing unsaved, and flushes on blur and unmount.
 */
export function useDraft(serverValue: string, save: (v: string) => Promise<unknown>, delay = 800) {
  const [value, setValue] = useState(serverValue);
  const [status, setStatus] = useState<DraftStatus>("idle");
  const latest = useRef(serverValue);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (!dirty.current) {
      setValue(serverValue);
      latest.current = serverValue;
    }
  }, [serverValue]);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!dirty.current) return;
    const v = latest.current;
    setStatus("saving");
    try {
      await saveRef.current(v);
      if (latest.current === v) dirty.current = false;
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, []);

  const onChange = useCallback(
    (v: string) => {
      setValue(v);
      latest.current = v;
      dirty.current = true;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), delay);
    },
    [delay, flush],
  );

  useEffect(
    () => () => {
      void flush();
    },
    [flush],
  );

  return { value, onChange, flush, status };
}

/** Combine several draft statuses into one header indicator. */
export function combineStatus(list: DraftStatus[]): DraftStatus {
  if (list.includes("error")) return "error";
  if (list.includes("saving")) return "saving";
  if (list.includes("saved")) return "saved";
  return "idle";
}
