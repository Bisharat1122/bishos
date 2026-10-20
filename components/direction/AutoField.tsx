"use client";

/**
 * Autosaving text fields: local draft, debounced save, flush on blur/unmount,
 * and a quiet "Saved" indicator. Server updates flow in while not editing.
 */
import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn, inputClass } from "@/components/os/kit";

export function useAutosave(value: string, onSave: (v: string) => unknown, delay = 700) {
  const [draft, setDraft] = useState(value);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const dirty = useRef(false);
  const draftRef = useRef(value);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dirty.current) {
      setDraft(value);
      draftRef.current = value;
    }
  }, [value]);

  const flush = async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!dirty.current) return;
    const v = draftRef.current;
    setState("saving");
    try {
      await saveRef.current(v);
      if (draftRef.current === v) dirty.current = false;
      setState("saved");
    } catch {
      setState("idle");
    }
  };

  const change = (v: string) => {
    setDraft(v);
    draftRef.current = v;
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), delay);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (dirty.current) void saveRef.current(draftRef.current);
    },
    [],
  );

  useEffect(() => {
    if (state !== "saved") return;
    const t = setTimeout(() => setState("idle"), 1600);
    return () => clearTimeout(t);
  }, [state]);

  return { draft, change, flush, state };
}

export function SaveState({ state, className }: { state: "idle" | "saving" | "saved"; className?: string }) {
  if (state === "idle") return null;
  return (
    <span className={cn("fade-in inline-flex items-center gap-1 text-[11px] text-muted-foreground", className)}>
      {state === "saving" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-success" />}
      {state === "saving" ? "Saving" : "Saved"}
    </span>
  );
}

export function AutoTextArea({
  value,
  onSave,
  placeholder,
  className,
  rows = 3,
  label,
  hint,
  delay,
}: {
  value: string;
  onSave: (v: string) => unknown;
  placeholder?: string;
  className?: string;
  rows?: number;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  delay?: number;
}) {
  const { draft, change, flush, state } = useAutosave(value, onSave, delay);
  return (
    <div className="space-y-1.5">
      {(label || state !== "idle") && (
        <div className="flex items-center justify-between gap-2">
          {label ? <span className="text-xs font-medium text-muted-foreground">{label}</span> : <span />}
          <SaveState state={state} />
        </div>
      )}
      <textarea
        value={draft}
        rows={rows}
        onChange={(e) => change(e.target.value)}
        onBlur={() => void flush()}
        placeholder={placeholder}
        className={cn(inputClass, "w-full resize-y py-2 leading-relaxed", className)}
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AutoInput({
  value,
  onSave,
  placeholder,
  className,
  label,
  delay,
}: {
  value: string;
  onSave: (v: string) => unknown;
  placeholder?: string;
  className?: string;
  label?: React.ReactNode;
  delay?: number;
}) {
  const { draft, change, flush, state } = useAutosave(value, onSave, delay);
  return (
    <div className="space-y-1.5">
      {(label || state !== "idle") && (
        <div className="flex items-center justify-between gap-2">
          {label ? <span className="text-xs font-medium text-muted-foreground">{label}</span> : <span />}
          <SaveState state={state} />
        </div>
      )}
      <input
        value={draft}
        onChange={(e) => change(e.target.value)}
        onBlur={() => void flush()}
        onKeyDown={(e) => e.key === "Enter" && void flush()}
        placeholder={placeholder}
        className={cn(inputClass, "h-9 w-full", className)}
      />
    </div>
  );
}
