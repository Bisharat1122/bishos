"use client";

import { cn } from "@/components/os/kit";

/**
 * Niche targeting bullseye: ring 1 (innermost) is the narrowest niche, each
 * outer ring is the next expansion. With 5 rings the outermost is the banned
 * ring (viral there = no buyers + ruined targeting). Tokens only (light + dark).
 */
export function Bullseye({ rings, size = 200, className }: { rings: string[]; size?: number; className?: string }) {
  const shown = rings.filter((r) => r.trim()).slice(0, 5);
  const n = Math.max(shown.length, 3);
  const c = size / 2;
  const step = (size / 2 - 4) / n;
  // Outer → inner so inner rings paint on top.
  const order = Array.from({ length: n }, (_, i) => n - 1 - i);
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={shown.length ? `Niche bullseye: ${shown.map((r, i) => `ring ${i + 1}, ${r}`).join("; ")}` : "Empty niche bullseye"}
      className={cn("max-w-full shrink-0", className)}
    >
      {order.map((i) => {
        const r = step * (i + 1);
        const has = i < shown.length;
        const banned = has && i === 4;
        return (
          <circle
            key={i}
            cx={c}
            cy={c}
            r={r}
            className={cn(
              "transition-all duration-500",
              banned ? "fill-danger-soft stroke-danger" : i === 0 && has ? "fill-primary stroke-primary" : has ? "fill-muted stroke-border" : "fill-card stroke-border",
            )}
            strokeWidth={banned ? 1.5 : 1.25}
            strokeDasharray={has && !banned ? undefined : "3 4"}
            style={has && i > 0 && !banned ? { fillOpacity: Math.max(0.35, 1 - i * 0.16) } : undefined}
          />
        );
      })}
      {order.map((i) => {
        if (i >= shown.length) return null;
        const y = i === 0 ? c : c - step * i - step / 2;
        return (
          <text
            key={`t${i}`}
            x={c}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            className={cn("text-[11px] font-semibold tabular-nums", i === 0 ? "fill-primary-foreground" : i === 4 ? "fill-danger" : "fill-foreground")}
          >
            {i === 4 ? "✕" : i + 1}
          </text>
        );
      })}
    </svg>
  );
}
