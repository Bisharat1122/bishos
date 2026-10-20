"use client";

/**
 * Toasts + celebrations. Fire from anywhere:
 *   toast("Saved")                      — neutral toast
 *   toast("+25 XP · Start-up done", { tone: "success", xp: 25 })
 *   celebrate()                         — confetti burst (respects reduced motion
 *                                         and the user's `celebrate` setting)
 * <Toaster /> is mounted once in the app layout.
 */

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConvexError } from "convex/values";

type ToastTone = "neutral" | "success" | "warning" | "info";
type ToastItem = { id: number; text: string; tone: ToastTone; xp?: number; sub?: string };

const listeners = new Set<(t: ToastItem) => void>();
const confettiListeners = new Set<(o: { intensity: number }) => void>();
let counter = 0;
let celebrationsOn = true;

/** Readable message from a Convex error (ConvexError data, or a wrapped Error). */
export function errorMessage(e: unknown, fallback = "Something went wrong."): string {
  if (e instanceof ConvexError) return typeof e.data === "string" ? e.data : fallback;
  const m = e instanceof Error ? e.message : String(e ?? "");
  const cleaned = m.replace(/^[\s\S]*?Uncaught (?:ConvexError|Error):\s*/, "").replace(/\s+at\s+[\s\S]*$/, "").trim();
  return (cleaned || fallback).slice(0, 160);
}

export function setCelebrations(on: boolean) {
  celebrationsOn = on;
}

export function toast(text: string, opts: { tone?: ToastTone; xp?: number; sub?: string } = {}) {
  const t: ToastItem = { id: ++counter, text, tone: opts.tone ?? "neutral", xp: opts.xp, sub: opts.sub };
  listeners.forEach((l) => l(t));
}

export function celebrate(intensity = 1) {
  if (!celebrationsOn) return;
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  confettiListeners.forEach((l) => l({ intensity }));
}

/** Toast + XP pill + optional confetti in one call. */
export function reward(text: string, xp?: number, big = false) {
  toast(text, { tone: "success", xp });
  if (big) celebrate(1.2);
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const onToast = (t: ToastItem) => {
      setItems((p) => [...p.slice(-3), t]);
      setTimeout(() => setItems((p) => p.filter((x) => x.id !== t.id)), 3200);
    };
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
    };
  }, []);

  return (
    <>
      <Confetti />
      <div className="pointer-events-none fixed bottom-20 left-1/2 z-[80] lg:bottom-4 flex w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2">
        {items.map((t) => {
          const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "warning" ? AlertTriangle : t.tone === "info" ? Info : Sparkles;
          return (
            <div
              key={t.id}
              role="status"
              className="os-toast pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-raised"
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  t.tone === "success" && "text-success",
                  t.tone === "warning" && "text-warning",
                  t.tone === "info" && "text-info",
                  t.tone === "neutral" && "text-muted-foreground",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.text}</p>
                {t.sub && <p className="truncate text-xs text-muted-foreground">{t.sub}</p>}
              </div>
              {t.xp ? (
                <span className="os-pop shrink-0 rounded-md bg-primary px-2 py-0.5 text-xs font-semibold tabular-nums text-primary-foreground">
                  +{t.xp} XP
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}

type Piece = { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; color: string; shape: 0 | 1 };

function Confetti() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pieces = useRef<Piece[]>([]);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const colors = () => {
      const s = getComputedStyle(document.documentElement);
      return ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--success"].map((v) => s.getPropertyValue(v).trim() || "#888");
    };
    const tick = () => {
      const c = canvas.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);
      pieces.current = pieces.current.filter((p) => p.y < c.height + 40);
      for (const p of pieces.current) {
        p.vy += 0.18;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 0) ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, p.r * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (pieces.current.length) raf.current = requestAnimationFrame(tick);
      else raf.current = null;
    };
    const burst = ({ intensity }: { intensity: number }) => {
      const c = canvas.current;
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      const cs = colors();
      const n = Math.round(110 * intensity);
      for (let i = 0; i < n; i++) {
        const fromLeft = i % 2 === 0;
        pieces.current.push({
          x: fromLeft ? c.width * 0.25 : c.width * 0.75,
          y: c.height * 0.55,
          vx: (Math.random() * 7 + 2) * (fromLeft ? 1 : -1) * (Math.random() < 0.3 ? -0.6 : 1),
          vy: -(Math.random() * 11 + 7),
          r: Math.random() * 4 + 3,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          color: cs[i % cs.length],
          shape: Math.random() < 0.7 ? 0 : 1,
        });
      }
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    confettiListeners.add(burst);
    return () => {
      confettiListeners.delete(burst);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-[79]" aria-hidden />;
}
