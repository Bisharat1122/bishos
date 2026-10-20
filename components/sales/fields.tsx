"use client";

/** Save-on-blur inputs used by the deal drawer and profile pages. */

import { useEffect, useState } from "react";
import { cn, inputClass } from "@/components/os/kit";

export function BlurInput({
  value,
  onSave,
  className,
  type = "text",
  placeholder,
  list,
  min,
  inputMode,
  "aria-label": ariaLabel,
}: {
  value: string;
  onSave: (v: string) => void | Promise<unknown>;
  className?: string;
  type?: string;
  placeholder?: string;
  list?: string;
  min?: string | number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  "aria-label"?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);
  const commit = () => {
    setFocused(false);
    if (draft !== value) void Promise.resolve(onSave(draft)).catch(() => setDraft(value));
  };
  return (
    <input
      type={type}
      value={draft}
      list={list}
      min={min}
      inputMode={inputMode}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        setDraft(e.target.value);
        // date pickers commit on change (no reliable blur on mobile)
        if (type === "date" && e.target.value !== value) void Promise.resolve(onSave(e.target.value)).catch(() => setDraft(value));
      }}
      onBlur={type === "date" ? () => setFocused(false) : commit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && type !== "date") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setDraft(value);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={cn(inputClass, "h-9 w-full", className)}
    />
  );
}

export function BlurTextArea({
  value,
  onSave,
  className,
  placeholder,
}: {
  value: string;
  onSave: (v: string) => void | Promise<unknown>;
  className?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);
  return (
    <textarea
      value={draft}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setFocused(false);
        if (draft !== value) void Promise.resolve(onSave(draft)).catch(() => setDraft(value));
      }}
      className={cn(inputClass, "min-h-[80px] w-full py-2 leading-relaxed", className)}
    />
  );
}

/**
 * Like the kit `Field`, but a <div>: the kit Field is a <label>, so clicking
 * its text "clicks" the first button inside (e.g. picks a Segmented option).
 */
export function FieldGroup({ label, hint, children, className }: { label: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

/** Wrap a kit `Segmented` inside a <form>: its buttons have no type, so they would submit it. */
export function NoSubmit({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} onClick={(e) => e.preventDefault()}>
      {children}
    </div>
  );
}
