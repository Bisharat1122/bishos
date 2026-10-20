"use client";

import { ReactNode, useCallback, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { Check, ChevronDown, CircleAlert, Lightbulb, Loader2, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Chip, Ring, TextArea, TextInput, cn, inputClass } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { useDraft, type DraftStatus } from "../useDraft";
import { errMsg, type Brand } from "../model";
import type { StrategyPatch } from "./model";

// ─────────────────────────────────────────────────────────────────────────
// Saving
// ─────────────────────────────────────────────────────────────────────────

/** saveStrategy for one brand, with a combined status for the header pill. */
export function useStrategySaver(brand: Brand) {
  const mut = useMutation(api.contentSystem.saveStrategy);
  const [status, setStatus] = useState<DraftStatus>("idle");
  const inflight = useRef(0);
  const save = useCallback(
    async (patch: StrategyPatch) => {
      inflight.current++;
      setStatus("saving");
      try {
        await mut({ brand, ...patch });
        inflight.current--;
        if (!inflight.current) setStatus("saved");
      } catch (e) {
        inflight.current--;
        setStatus("error");
        toast(errMsg(e), { tone: "warning" });
        throw e;
      }
    },
    [mut, brand],
  );
  return { save, status };
}

export function SaveStatus({ status, className }: { status: DraftStatus; className?: string }) {
  if (status === "idle") return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground", status === "error" && "text-danger", className)} aria-live="polite">
      {status === "saving" ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
        </>
      ) : status === "saved" ? (
        <>
          <Check className="h-3 w-3 text-success" /> Saved
        </>
      ) : (
        <>
          <CircleAlert className="h-3 w-3" /> Not saved
        </>
      )}
    </span>
  );
}

/** Text field with debounced autosave (flushes on blur). */
export function DraftField({
  value,
  onSave,
  placeholder,
  multiline,
  className,
  rows,
  ariaLabel,
}: {
  value: string;
  onSave: (v: string) => Promise<unknown>;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  rows?: number;
  ariaLabel?: string;
}) {
  const d = useDraft(value, onSave, 900);
  return multiline ? (
    <TextArea
      value={d.value}
      onChange={(e) => d.onChange(e.target.value)}
      onBlur={() => void d.flush()}
      placeholder={placeholder}
      rows={rows}
      aria-label={ariaLabel}
      className={cn("min-h-[72px]", className)}
    />
  ) : (
    <TextInput value={d.value} onChange={(e) => d.onChange(e.target.value)} onBlur={() => void d.flush()} placeholder={placeholder} aria-label={ariaLabel} className={className} />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────────

/** One program section: numbered progress ring, phase, why-lines, collapsible body. */
export function StepCard({
  id,
  n,
  title,
  phase,
  pct,
  done,
  summary,
  why,
  action,
  children,
}: {
  id: string;
  n: number;
  title: string;
  phase: string;
  pct: number;
  done: boolean;
  summary: ReactNode;
  why?: string[];
  action?: ReactNode;
  children: ReactNode;
}) {
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = userOpen ?? !done;
  return (
    <section id={id} className={cn("os-rise scroll-mt-20 rounded-xl border bg-card text-card-foreground shadow-card", done ? "border-success/40" : "border-border")}>
      <header className="flex items-center gap-3 p-4 sm:px-5">
        <Ring value={done ? 100 : pct} size={46} stroke={4} tone={done ? "success" : "primary"}>
          {done ? <Check className="os-pop h-4 w-4 text-success" strokeWidth={3} /> : <span className="text-sm font-semibold tabular-nums">{n}</span>}
        </Ring>
        <button type="button" onClick={() => setUserOpen(!open)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-base font-semibold tracking-tight">{title}</span>
            <Chip tone="outline" className="h-5 px-1.5 text-[10px] font-medium">
              {phase}
            </Chip>
            {done && (
              <Chip tone="success" className="h-5 px-1.5 text-[10px]">
                Complete
              </Chip>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {summary} {!done && <span className="tabular-nums">· {pct}%</span>}
          </span>
        </button>
        {action && <div className="hidden shrink-0 items-center gap-1.5 sm:flex">{action}</div>}
        <button
          type="button"
          onClick={() => setUserOpen(!open)}
          aria-label={open ? "Collapse section" : "Expand section"}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      </header>
      {open && (
        <div className="fade-in space-y-5 border-t border-border px-4 pb-5 pt-4 sm:px-5">
          {action && <div className="flex flex-wrap gap-1.5 sm:hidden">{action}</div>}
          {why && why.length > 0 && <Why lines={why} />}
          {children}
        </div>
      )}
    </section>
  );
}

/** Plain-English "why this matters" lines. */
export function Why({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <div className={cn("flex gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5", className)}>
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <ul className="space-y-1 text-sm leading-snug">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

/** A sub-block inside a section: title, done tick, optional hint. */
export function Block({
  id,
  title,
  done,
  hint,
  right,
  children,
  className,
}: {
  id?: string;
  title: ReactNode;
  done?: boolean;
  hint?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div id={id} className={cn("scroll-mt-20 space-y-2.5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            {done !== undefined && (
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border",
                  done ? "border-success bg-success text-background" : "border-muted-foreground/40",
                )}
                aria-label={done ? "Done" : "To do"}
              >
                {done && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
              </span>
            )}
            {title}
          </h3>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

/** Checked rule list (reference copy). */
export function Rules({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <ul className={cn("space-y-1.5 text-sm", className)}>
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 leading-snug">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/** Pick-one cards / chips. */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: ReactNode; hint?: string }[];
  value?: string;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} role="radiogroup">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-ring/60 hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Chip list + "Enter to add" input. */
export function TagInput({
  items,
  onChange,
  placeholder,
  max,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    if (items.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...items, t]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((t, i) => (
            <span key={`${t}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 py-0.5 pl-2.5 pr-1 text-xs">
              {t}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label={`Remove ${t}`}
                className="rounded-full p-0.5 text-muted-foreground hover:text-danger"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {(max == null || items.length < max) && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
            e.preventDefault();
            add();
          }}
          onBlur={add}
          placeholder={placeholder}
          className={cn(inputClass, "h-8 w-full")}
        />
      )}
    </div>
  );
}

/** Small count-vs-target pill ("3/5"). */
export function Target({ have, min, max, unit }: { have: number; min: number; max?: number; unit?: string }) {
  const ok = have >= min;
  return (
    <Chip tone={ok ? "success" : "muted"} className="tabular-nums">
      {have}/{max ? `${min}–${max}` : min}
      {unit ? ` ${unit}` : ""}
    </Chip>
  );
}

/** Keep the last value for the same key (no skeleton flash when a ticking arg changes). */
export function useStableFor<T>(value: T | undefined, key: string): T | undefined {
  const ref = useRef<{ key: string; value: T } | null>(null);
  if (value !== undefined) ref.current = { key, value };
  if (value !== undefined) return value;
  return ref.current && ref.current.key === key ? ref.current.value : undefined;
}
