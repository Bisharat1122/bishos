"use client";

import { useLayoutEffect, useRef, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Textarea that grows with its content (so no line ever gets hidden) up to
 * `maxRows`, then scrolls. Starts at a single row. Font/spacing come from
 * `className` so it matches the surrounding design system.
 */
export function AutoGrowTextarea({
  value,
  maxRows = 6,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string; maxRows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const cs = window.getComputedStyle(el);
    const lineHeight = parseFloat(cs.lineHeight) || 20;
    const padding = parseFloat(cs.paddingTop || "0") + parseFloat(cs.paddingBottom || "0");
    const maxH = lineHeight * maxRows + padding;
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
    el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
  }, [value, maxRows]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      className={cn("resize-none", className)}
      {...props}
    />
  );
}
