"use client";

/**
 * Life OS UI kit — shared building blocks for every Life OS screen.
 * Built only on the Syncora tokens (see app/globals.css + lib/variants):
 * monochrome surfaces, colour reserved for meaning (success/warning/danger/
 * info, chart-1..5 for categories). Works in light and dark.
 */

import { ReactNode, useEffect, useRef, useState, DragEvent } from "react";
import { X, Inbox as InboxIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Topbar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { badgeVariants, buttonVariants, inputClass } from "@/lib/variants";

export { buttonVariants, badgeVariants, inputClass, cn };

// ─────────────────────────────────────────────────────────────────────────
// Page scaffolding
// ─────────────────────────────────────────────────────────────────────────

/** Standard page: sticky Topbar + padded container + header row. */
export function PageShell({
  title,
  subtitle,
  icon: Icon,
  actions,
  topbarAction,
  children,
  className,
  headerExtra,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  topbarAction?: ReactNode;
  children: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
}) {
  return (
    <div>
      <Topbar action={topbarAction} />
      <div className={cn("mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8", className)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-card">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {headerExtra}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

/** Card with an optional header row (title + icon + right-side action). */
export function Section({
  title,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
  hint,
}: {
  title?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  hint?: ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-card", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
          <div className="min-w-0">
            {title && (
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />}
                {title}
              </h2>
            )}
            {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
        </div>
      )}
      <div className={cn("p-4 sm:p-5", (title || action) && "pt-3 sm:pt-3", bodyClassName)}>{children}</div>
    </section>
  );
}

export type Tone = "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "info" | "muted" | "accent" | "sprint";

export function Chip({ tone = "muted", children, className, title }: { tone?: Tone; children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cn(badgeVariants({ variant: tone }), className)}>
      {children}
    </span>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 font-sans text-[10px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Progress
// ─────────────────────────────────────────────────────────────────────────

const TONE_STROKE: Record<string, string> = {
  primary: "stroke-primary",
  success: "stroke-success",
  warning: "stroke-warning",
  danger: "stroke-danger",
  info: "stroke-info",
  sprint: "stroke-sprint",
};
const TONE_BG: Record<string, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  sprint: "bg-sprint",
};

export type MeterTone = "primary" | "success" | "warning" | "danger" | "info" | "sprint";

/** Tone by percentage: ≥85 success, ≥60 primary, ≥35 warning, else danger. */
export function toneForPct(pct: number): MeterTone {
  if (pct >= 85) return "success";
  if (pct >= 60) return "primary";
  if (pct >= 35) return "warning";
  return "danger";
}

export function Ring({
  value,
  size = 56,
  stroke = 6,
  tone = "primary",
  children,
  className,
  color,
}: {
  value: number; // 0–100
  size?: number;
  stroke?: number;
  tone?: MeterTone;
  children?: ReactNode;
  className?: string;
  color?: string; // explicit css colour (e.g. area colour)
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-muted" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={cn("fill-none transition-[stroke-dashoffset] duration-700 ease-out", !color && TONE_STROKE[tone])}
          style={color ? { stroke: color } : undefined}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </span>
  );
}

export function Bar({
  value,
  tone = "primary",
  className,
  color,
  height = "h-1.5",
}: {
  value: number;
  tone?: MeterTone;
  className?: string;
  color?: string;
  height?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-muted", height, className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", !color && TONE_BG[tone])}
        style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  );
}

/** A big number with label (and optional sub line / delta). */
export function Metric({
  label,
  value,
  sub,
  tone,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div
        className={cn(
          "text-2xl font-semibold leading-none tracking-tight tabular-nums",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
          tone === "info" && "text-info",
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Inputs
// ─────────────────────────────────────────────────────────────────────────

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: {
  options: { value: T; label: ReactNode; icon?: LucideIcon; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="tablist" className={cn("inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-muted p-0.5 scrollbar-thin", className)}>
      {options.map((o) => {
        const active = o.value === value;
        const I = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm",
              active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {I && <I className="h-3.5 w-3.5" />}
            {o.label}
            {o.count != null && (
              <span className={cn("rounded px-1 text-[10px] tabular-nums", active ? "bg-muted" : "bg-background/60")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    // A <div>, not a <label>: a label forwards caption clicks to its first control,
    // which misfires when the field wraps buttons / Segmented.
    <div className={cn("block space-y-1.5", className)}>
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={cn(inputClass, "h-9 w-full", className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={cn(inputClass, "min-h-[80px] w-full py-2 leading-relaxed", className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select {...rest} className={cn(inputClass, "h-9 w-full", className)} />;
}

/** Inline-editable text: shows text, becomes an input on click, saves on blur/Enter. */
export function InlineEdit({
  value,
  onSave,
  placeholder,
  className,
  multiline,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  // Set once this edit session has been committed or cancelled, so the blur that
  // follows Enter/Escape (input unmounting) doesn't save again — or save a cancelled draft.
  const settled = useRef(false);
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);
  const commit = () => {
    if (settled.current) return;
    settled.current = true;
    setEditing(false);
    if (draft !== value) onSave(draft);
  };
  const cancel = () => {
    settled.current = true;
    setDraft(value);
    setEditing(false);
  };
  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          settled.current = false;
          setEditing(true);
        }}
        className={cn("w-full rounded-md px-1 py-0.5 text-left hover:bg-accent", !value && "text-muted-foreground", className)}
      >
        {value || placeholder || "Click to edit"}
      </button>
    );
  }
  return multiline ? (
    <textarea
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      className={cn(inputClass, "min-h-[80px] w-full py-2", className)}
    />
  ) : (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // don't submit an enclosing form
          commit();
        }
        if (e.key === "Escape") {
          e.stopPropagation(); // cancel the edit, not the surrounding Dialog/Drawer
          cancel();
        }
      }}
      className={cn(inputClass, "h-8 w-full", className)}
    />
  );
}

/** Editable list of short strings (values, deliverables, steps…). */
export function ListEditor({
  items,
  onChange,
  placeholder = "Add item…",
  numbered,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  numbered?: boolean;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <div key={i} className="group flex items-center gap-2">
          {numbered && <span className="w-5 text-right text-xs tabular-nums text-muted-foreground">{i + 1}.</span>}
          <InlineEdit
            value={it}
            onSave={(v) => onChange(v.trim() ? items.map((x, j) => (j === i ? v.trim() : x)) : items.filter((_, j) => j !== i))}
            className="text-sm"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-danger group-hover:opacity-100"
            aria-label="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {/* No nested <form> (ListEditor is used inside other forms) — Enter adds. */}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
          e.preventDefault();
          if (!draft.trim()) return;
          onChange([...items, draft.trim()]);
          setDraft("");
        }}
        placeholder={placeholder}
        className={cn(inputClass, "h-8 w-full")}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Overlays
// ─────────────────────────────────────────────────────────────────────────

/**
 * Stack of open Drawers/Dialogs so Escape closes only the top-most one
 * (a Dialog opened from a Drawer, a Drawer over a page…). The latest close
 * handler is read through a ref so re-renders never reorder the stack.
 */
const overlayStack: symbol[] = [];
function useEscapeLayer(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const id = Symbol("overlay");
    overlayStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && overlayStack[overlayStack.length - 1] === id) closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const i = overlayStack.lastIndexOf(id);
      if (i >= 0) overlayStack.splice(i, 1);
    };
  }, [open]);
}

/** Right-side sheet for details/editing. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  width = "max-w-xl",
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  width?: string;
  footer?: ReactNode;
}) {
  useEscapeLayer(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={cn("os-rise relative flex h-full w-full flex-col border-l border-border bg-card shadow-raised", width)}>
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-5">
          <div className="min-w-0 truncate text-base font-semibold">{title}</div>
          <button type="button" onClick={onClose} aria-label="Close" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="shrink-0 border-t border-border px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** Centered dialog with optional wide size. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEscapeLayer(open, onClose);
  if (!open) return null;
  const w = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={cn("os-pop relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-xl border border-border bg-card p-6 text-card-foreground shadow-raised", w)}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-sm opacity-70 transition-opacity hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyHint({
  icon: Icon = InboxIcon,
  title,
  hint,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center", className)}>
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {hint && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Kanban (HTML5 drag & drop, no deps)
// ─────────────────────────────────────────────────────────────────────────

export type KanbanColumn = { key: string; label: string; hint?: string; tone?: Tone; dot?: string };

export function Kanban<T extends { _id: string }>({
  columns,
  items,
  columnOf,
  renderCard,
  onMove,
  footer,
  className,
  columnClassName,
}: {
  columns: KanbanColumn[];
  items: T[];
  columnOf: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  onMove: (item: T, toColumn: string) => void;
  footer?: (col: KanbanColumn) => ReactNode;
  className?: string;
  columnClassName?: string;
}) {
  const [over, setOver] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);
  const onDrop = (e: DragEvent, col: string) => {
    e.preventDefault();
    setOver(null);
    const id = dragId.current ?? e.dataTransfer.getData("text/plain");
    const it = items.find((x) => x._id === id);
    if (it && columnOf(it) !== col) onMove(it, col);
    dragId.current = null;
  };
  return (
    <div className={cn("flex gap-3 overflow-x-auto pb-3 scrollbar-thin", className)}>
      {columns.map((col) => {
        const colItems = items.filter((i) => columnOf(i) === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col.key);
            }}
            onDragLeave={() => setOver((o) => (o === col.key ? null : o))}
            onDrop={(e) => onDrop(e, col.key)}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/40 transition-colors",
              over === col.key && "border-ring bg-accent",
              columnClassName,
            )}
          >
            <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-3">
              <div className="flex min-w-0 items-center gap-2">
                {col.dot && <span className="size-2 shrink-0 rounded-full" style={{ background: col.dot }} />}
                <span className="truncate text-xs font-semibold uppercase tracking-wide">{col.label}</span>
                <span className="rounded bg-background px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">{colItems.length}</span>
              </div>
            </div>
            {col.hint && <p className="px-3 pb-2 text-[11px] text-muted-foreground">{col.hint}</p>}
            <div className="flex min-h-[60px] flex-1 flex-col gap-2 px-2 pb-2">
              {colItems.map((it) => (
                <div
                  key={it._id}
                  draggable
                  onDragStart={(e) => {
                    dragId.current = it._id;
                    e.dataTransfer.setData("text/plain", it._id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  {renderCard(it)}
                </div>
              ))}
            </div>
            {footer && <div className="px-2 pb-2">{footer(col)}</div>}
          </div>
        );
      })}
    </div>
  );
}

/** A card used inside boards and lists. */
export function ItemCard({ children, className, onClick, active }: { children: ReactNode; className?: string; onClick?: () => void; active?: boolean }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              // Keyboard parity for the clickable card (only when the card itself is focused).
              if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "rounded-lg border border-border bg-card p-3 text-sm shadow-card transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        onClick && "cursor-pointer hover:border-ring/60 hover:bg-accent/40",
        active && "border-ring",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Round check button (tasks, habits, commitments). */
export function CheckCircle({
  checked,
  onClick,
  tone = "success",
  size = "md",
  label,
}: {
  checked: boolean;
  onClick: () => void;
  tone?: "success" | "primary";
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const s = { sm: "size-4", md: "size-5", lg: "size-6" }[size];
  return (
    <button
      type="button"
      aria-label={label ?? (checked ? "Mark not done" : "Mark done")}
      aria-pressed={checked}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 transition-all",
        s,
        checked
          ? tone === "success"
            ? "os-pop border-success bg-success text-background"
            : "os-pop border-primary bg-primary text-primary-foreground"
          : "border-muted-foreground/40 hover:border-foreground",
      )}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      )}
    </button>
  );
}

/** Initials avatar for people/companies. */
export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 5, 0) + 1;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-background", className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `var(--chart-${hue})` }}
      aria-hidden
    >
      {initials || "?"}
    </span>
  );
}

/** Colour for a life area (its own colour or a stable chart colour). */
export function areaColor(area: { color?: string; order?: number } | undefined | null, fallbackIndex = 0) {
  if (area?.color) return area.color;
  const i = ((area?.order ?? fallbackIndex) % 5) + 1;
  return `var(--chart-${i})`;
}

export function AreaDot({ color, className }: { color?: string; className?: string }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", className)} style={{ background: color ?? "var(--muted-foreground)" }} />;
}
