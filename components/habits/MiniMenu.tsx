"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type MiniMenuItem = {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  hint?: string;
};

/** "⋯" button with a small dropdown of actions (closes on outside click / Esc). */
export function MiniMenu({ items, label = "More actions", className }: { items: (MiniMenuItem | false | null | undefined)[]; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const list = items.filter(Boolean) as MiniMenuItem[];
  return (
    <div ref={ref} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div role="menu" className="os-pop absolute right-0 top-full z-40 mt-1 w-52 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-raised">
          {list.map((it, i) => {
            const I = it.icon;
            return (
              <button
                key={i}
                role="menuitem"
                type="button"
                disabled={it.disabled}
                title={it.hint}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  it.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
                  it.danger && "text-danger hover:bg-danger-soft",
                )}
              >
                {I && <I className="h-4 w-4 shrink-0" />}
                <span className="truncate">{it.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
