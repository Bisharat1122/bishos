"use client";

/** One Wheel of Life rating row: 10 tap targets, debounced save, delta vs last time. */
import { useEffect, useRef, useState } from "react";
import { AreaDot, cn } from "@/components/os/kit";

export function RatingRow({
  name,
  color,
  value,
  prev,
  onSave,
}: {
  name: string;
  color: string;
  value?: number;
  prev?: number;
  onSave: (v: number) => unknown;
}) {
  const [v, setV] = useState<number | undefined>(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setV(value), [value]);
  const change = (n: number) => {
    setV(n);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void onSave(n), 450);
  };
  const delta = v !== undefined && prev !== undefined ? v - prev : null;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          <AreaDot color={color} /> <span className="truncate">{name}</span>
        </span>
        <span className="flex items-center gap-2 text-xs tabular-nums">
          {delta !== null && delta !== 0 && (
            <span className={delta > 0 ? "text-success" : "text-muted-foreground"}>
              {delta > 0 ? "+" : ""}
              {delta}
            </span>
          )}
          <span className="w-6 text-right text-base font-semibold">{v ?? "–"}</span>
        </span>
      </div>
      <div className="flex gap-1" role="radiogroup" aria-label={`Rate ${name}`}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={v === n}
            aria-label={`${n}`}
            onClick={() => change(n)}
            className={cn(
              "h-6 flex-1 rounded-[4px] text-[10px] font-medium transition-colors",
              v !== undefined && n <= v ? "text-background" : "bg-muted text-muted-foreground hover:bg-accent",
              prev === n && (v === undefined || n > v) && "ring-1 ring-inset ring-muted-foreground/50",
            )}
            style={v !== undefined && n <= v ? { background: color } : undefined}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
