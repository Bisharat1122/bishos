"use client";

/**
 * PersonPicker — searchable combobox over People with inline "create".
 * Reusable by any module:
 *   <PersonPicker value={personId} onChange={(id, p) => setPersonId(id)} />
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Check, Plus, Search, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Avatar, cn, inputClass } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { useToday } from "@/lib/day";
import { errMsg } from "./meta";

export type PickedPerson = { _id: Id<"people">; name: string; companyName: string | null; companyId?: Id<"companies"> };

export function PersonPicker({
  value,
  onChange,
  placeholder = "Search or add a person…",
  allowCreate = true,
  allowClear = true,
  className,
  autoFocus,
  size = "md",
}: {
  value?: Id<"people"> | null;
  onChange: (id: Id<"people"> | null, person?: PickedPerson) => void;
  placeholder?: string;
  allowCreate?: boolean;
  allowClear?: boolean;
  className?: string;
  autoFocus?: boolean;
  size?: "sm" | "md";
}) {
  // same args as the People page + Warmup ({ today }) → one shared, pre-warmed subscription
  const today = useToday();
  const people = useQuery(api.people.list, { today });
  const create = useMutation(api.people.create);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const selected = value ? people?.find((p) => p._id === value) : undefined;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const matches = useMemo(() => {
    const n = q.trim().toLowerCase();
    const list = people ?? [];
    const hits = n
      ? list.filter((p) => [p.name, p.email, p.title, p.companyName].filter(Boolean).join(" ").toLowerCase().includes(n))
      : [...list].sort((a, b) => (b.lastContactAt ?? b.createdAt) - (a.lastContactAt ?? a.createdAt));
    return hits.slice(0, 8);
  }, [people, q]);

  const exact = matches.some((p) => p.name.toLowerCase() === q.trim().toLowerCase());
  const showCreate = allowCreate && q.trim().length > 1 && !exact;
  const total = matches.length + (showCreate ? 1 : 0);

  const pick = (p: (typeof matches)[number]) => {
    onChange(p._id, { _id: p._id, name: p.name, companyName: p.companyName, companyId: p.companyId });
    setQ("");
    setOpen(false);
  };

  const createNew = async () => {
    const raw = q.trim();
    if (!raw || busy) return;
    // "Jane Doe @ Acme" or "Jane Doe, Acme" → name + company
    const m = /^(.+?)\s*(?:@|,|\bfrom\b)\s*(.+)$/i.exec(raw);
    const name = (m?.[1] ?? raw).trim();
    const companyName = m?.[2]?.trim();
    setBusy(true);
    try {
      const id = await create({ name, companyName });
      onChange(id, { _id: id, name, companyName: companyName ?? null });
      toast(`Added ${name}`, { tone: "success", sub: companyName ? `at ${companyName}` : "New person in People" });
      setQ("");
      setOpen(false);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const h = size === "sm" ? "h-8" : "h-9";

  if (selected && !open) {
    return (
      <div className={cn(inputClass, h, "flex w-full items-center gap-2 px-2", className)}>
        <Avatar name={selected.name} size={20} />
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setTimeout(() => input.current?.focus(), 0);
          }}
          className="min-w-0 flex-1 truncate text-left"
        >
          <span className="font-medium">{selected.name}</span>
          {selected.companyName && <span className="text-muted-foreground"> · {selected.companyName}</span>}
        </button>
        {allowClear && (
          <button type="button" aria-label="Clear person" onClick={() => onChange(null)} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={box} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={input}
          autoFocus={autoFocus}
          value={q}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setHi(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHi((i) => Math.min(total - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHi((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (hi < matches.length && matches[hi]) pick(matches[hi]);
              else if (showCreate) void createNew();
            } else if (e.key === "Escape") {
              e.stopPropagation();
              setOpen(false);
            }
          }}
          className={cn(inputClass, h, "w-full pl-8")}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
      </div>
      {open && (
        <div className="os-pop absolute left-0 right-0 top-[calc(100%+4px)] z-[60] max-h-72 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-raised" role="listbox">
          {people === undefined && <div className="skeleton m-1 h-8" />}
          {people !== undefined && total === 0 && (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">{q ? "No match." : "No people yet. Type a name to add one."}</p>
          )}
          {matches.map((p, i) => (
            <button
              type="button"
              key={p._id}
              role="option"
              aria-selected={p._id === value}
              onMouseEnter={() => setHi(i)}
              onClick={() => pick(p)}
              className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm", hi === i && "bg-accent")}
            >
              <Avatar name={p.name} size={22} />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">{p.name}</span>
                {(p.companyName || p.title) && <span className="text-muted-foreground"> · {[p.title, p.companyName].filter(Boolean).join(" @ ")}</span>}
              </span>
              {p._id === value && <Check className="h-3.5 w-3.5 text-success" />}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onMouseEnter={() => setHi(matches.length)}
              onClick={() => void createNew()}
              disabled={busy}
              className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm", hi === matches.length && "bg-accent")}
            >
              <span className="flex size-[22px] items-center justify-center rounded-full border border-dashed border-border">
                <Plus className="h-3 w-3" />
              </span>
              <span className="truncate">
                Add <span className="font-medium">&ldquo;{q.trim()}&rdquo;</span>
                <span className="text-muted-foreground"> (tip: Name @ Company)</span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
