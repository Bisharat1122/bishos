"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { buttonVariants, cn } from "@/components/os/kit";

export type MenuItem = { label: string; icon?: LucideIcon; onSelect: () => void; danger?: boolean; hidden?: boolean };

/** Tiny "…" overflow menu for rows and cards. */
export function RowMenu({ items, label = "More actions", className, trigger }: { items: MenuItem[]; label?: string; className?: string; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const visible = items.filter((i) => !i.hidden);
  if (!visible.length) return null;
  return (
    <div ref={ref} className={cn("relative", className)} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-7 text-muted-foreground")}
      >
        {trigger ?? <MoreHorizontal className="h-4 w-4" />}
      </button>
      {open && (
        <div role="menu" className="os-pop absolute right-0 top-[calc(100%+4px)] z-40 min-w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-raised">
          {visible.map((it) => {
            const I = it.icon;
            return (
              <button
                key={it.label}
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  it.onSelect();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                  it.danger && "text-danger",
                )}
              >
                {I && <I className="h-3.5 w-3.5" />}
                {it.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
