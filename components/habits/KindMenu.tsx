"use client";

import { useEffect, useRef } from "react";
import { Check, Feather, Rocket, RotateCcw, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HabitKind } from "./util";

export type KindPick = HabitKind | "clear";

/**
 * Small popover to log a habit as done / 2-min / stretch / reserve skip / clear.
 * Positioned (fixed) next to the element whose rect is passed in.
 */
export function KindMenu({
  anchor,
  onClose,
  onPick,
  current,
  minVersion,
  stretchVersion,
  shieldsLeft,
  heading,
}: {
  anchor: DOMRect | null;
  onClose: () => void;
  onPick: (k: KindPick) => void;
  current: HabitKind | null;
  minVersion?: string | null;
  stretchVersion?: string | null;
  shieldsLeft: number;
  heading?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!anchor) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onScroll = () => onClose();
    // Defer so the opening pointer-up doesn't immediately close it.
    const t = window.setTimeout(() => {
      window.addEventListener("pointerdown", onDown);
      window.addEventListener("keydown", onKey);
      window.addEventListener("scroll", onScroll, true);
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [anchor, onClose]);

  if (!anchor) return null;
  const W = 260;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const left = Math.max(8, Math.min(anchor.left, vw - W - 8));
  const below = anchor.bottom + 6;
  const estH = 250;
  const top = below + estH > vh ? Math.max(8, anchor.top - estH - 6) : below;

  const items: { k: KindPick; label: string; sub?: string; icon: typeof Check; disabled?: boolean }[] = [
    { k: "done", label: "Done", sub: "The standard version", icon: Check },
    { k: "min", label: "2-minute version", sub: minVersion || "The tiny version still counts", icon: Feather },
    { k: "stretch", label: "Stretch", sub: stretchVersion || "Went above and beyond", icon: Rocket },
    {
      k: "skip",
      label: "Use a reserve skip",
      sub: shieldsLeft > 0 ? `${shieldsLeft} shield${shieldsLeft === 1 ? "" : "s"} left this week · keeps the streak` : "No shields left this week — try the 2-min version",
      icon: Shield,
      disabled: shieldsLeft <= 0 && current !== "skip",
    },
  ];

  return (
    <div
      ref={ref}
      role="menu"
      className="os-pop fixed z-[70] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-raised"
      style={{ top, left, width: W }}
    >
      {heading && <p className="truncate px-2.5 pb-1 pt-1 text-xs font-medium text-muted-foreground">{heading}</p>}
      {items.map((it) => {
        const I = it.icon;
        const active = current === it.k;
        return (
          <button
            key={it.k}
            role="menuitem"
            type="button"
            disabled={it.disabled}
            onClick={() => {
              onPick(it.k);
              onClose();
            }}
            className={cn(
              "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
              active && "bg-accent",
            )}
          >
            <I className={cn("mt-0.5 h-4 w-4 shrink-0", it.k === "skip" ? "text-info" : "text-success")} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {it.label}
                {active && <Check className="h-3 w-3 text-muted-foreground" />}
              </span>
              {it.sub && <span className="line-clamp-2 text-xs text-muted-foreground">{it.sub}</span>}
            </span>
          </button>
        );
      })}
      {current && (
        <button
          role="menuitem"
          type="button"
          onClick={() => {
            onPick("clear");
            onClose();
          }}
          className="mt-0.5 flex w-full items-center gap-2.5 rounded-lg border-t border-border px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Clear this day
        </button>
      )}
    </div>
  );
}
