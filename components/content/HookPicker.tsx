"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Library, Search, Sparkles, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Chip, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { HOOK_TYPES, STARTER_HOOKS, errMsg, hookLabel, type Hook } from "./model";

/** "Pick from hook library" popover. */
export function HookPicker({ onPick, align = "left" }: { onPick: (h: Hook) => void; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const ref = useRef<HTMLDivElement>(null);
  const hooks = useQuery(api.swipes.listHooks, open ? {} : "skip");
  const countUse = useMutation(api.swipes.useHook);
  const addStarter = useMutation(api.swipes.addStarterHooks);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (hooks ?? []).filter((h) => (type === "all" || h.hookType === type) && (!needle || h.text.toLowerCase().includes(needle)));
  }, [hooks, q, type]);
  const types = useMemo(() => HOOK_TYPES.filter((t) => (hooks ?? []).some((h) => h.hookType === t.key)), [hooks]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Library className="h-3.5 w-3.5" /> Hook library
      </button>
      {open && (
        <div
          className={cn(
            "os-pop absolute top-full z-40 mt-1.5 w-[min(420px,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-raised",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hooks" className={cn(inputClass, "h-8 w-full pl-8")} />
            </div>
            <button aria-label="Close" onClick={() => setOpen(false)} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
              <X className="h-4 w-4" />
            </button>
          </div>
          {types.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {[{ key: "all", label: "All" }, ...types].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                    type === t.key ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <div className="max-h-72 overflow-y-auto pr-1 scrollbar-thin">
            {hooks === undefined ? (
              <div className="space-y-1.5">
                <div className="skeleton h-10" />
                <div className="skeleton h-10" />
              </div>
            ) : hooks.length === 0 ? (
              <div className="space-y-2 py-4 text-center">
                <p className="text-sm text-muted-foreground">Your hook library is empty.</p>
                <button
                  onClick={() =>
                    void addStarter({ hooks: STARTER_HOOKS })
                      .then((n) => toast(`${n} starter hooks added`, { tone: "success" }))
                      .catch((e) => toast(errMsg(e), { tone: "warning" }))
                  }
                  className={buttonVariants({ size: "sm" })}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Add 10 starter templates
                </button>
              </div>
            ) : list.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No hooks match.</p>
            ) : (
              <ul className="space-y-1">
                {list.map((h) => (
                  <li key={h._id}>
                    <button
                      onClick={() => {
                        onPick(h);
                        void countUse({ id: h._id }).catch(() => {}); // a missed use count isn't worth an error
                        setOpen(false);
                      }}
                      className="w-full rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent"
                    >
                      <p className="text-sm leading-snug">{h.text}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        {h.hookType && <Chip tone="muted">{hookLabel(h.hookType)}</Chip>}
                        <span className="text-[10px] text-muted-foreground">{h.uses ?? 0} uses</span>
                        {h.note && <span className="truncate text-[10px] text-muted-foreground">· {h.note}</span>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-2 border-t border-border pt-2 text-right">
            <Link href="/swipes?tab=hooks" className="text-xs text-muted-foreground hover:text-foreground">
              Manage library →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
