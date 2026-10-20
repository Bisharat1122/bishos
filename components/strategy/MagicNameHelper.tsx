"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Wand2 } from "lucide-react";
import { Field, TextInput, buttonVariants, cn } from "@/components/os/kit";

export type Magic = { magnet?: string; avatar?: string; goal?: string; interval?: string; container?: string };

const PARTS: { key: keyof Magic; label: string; hint: string; placeholder: string; ideas: string[] }[] = [
  { key: "magnet", label: "Magnet", hint: "A reason to act now", placeholder: "Free / Done-for-you", ideas: ["Free", "Done-for-you", "Founding-client", "Guaranteed", "Limited"] },
  { key: "avatar", label: "Avatar", hint: "Who it's for, in their words", placeholder: "Agency owner", ideas: [] },
  { key: "goal", label: "Goal", hint: "The result they want", placeholder: "10 qualified calls", ideas: [] },
  { key: "interval", label: "Interval", hint: "How fast", placeholder: "30-day", ideas: ["7-day", "14-day", "30-day", "6-week", "90-day"] },
  { key: "container", label: "Container", hint: "What it's called", placeholder: "Sprint", ideas: ["Sprint", "Challenge", "Blueprint", "Accelerator", "System", "Intensive", "Program", "Kit"] },
];

const clean = (s: string) => s.replace(/\s+/g, " ").replace(/\s([,:)])/g, "$1").trim();

export function composeNames(m: Magic): string[] {
  const { magnet = "", avatar = "", goal = "", interval = "", container = "" } = Object.fromEntries(
    Object.entries(m).map(([k, v]) => [k, (v ?? "").trim()]),
  ) as Required<Magic>;
  const out = new Set<string>();
  const a = clean([magnet, avatar, goal, interval, container].filter(Boolean).join(" "));
  if (a) out.add(a);
  if (goal && container) {
    out.add(clean(`The ${interval} ${goal} ${container}${avatar ? ` for ${avatar}` : ""}`));
    out.add(clean(`${magnet ? `${magnet}: ` : ""}${avatar} ${goal} ${container}`));
  }
  if (avatar && container && interval) out.add(clean(`${interval} ${avatar} ${container}`));
  return [...out].filter((n) => n.split(" ").length >= 2).slice(0, 4);
}

/** Five inputs (Magnet · Avatar · Goal · Interval · Container) → name ideas. */
export function MagicNameHelper({
  magic,
  currentName,
  onSave,
  onUseName,
}: {
  magic: Magic | undefined;
  currentName: string;
  onSave: (m: Magic) => void;
  onUseName: (name: string) => void;
}) {
  const [draft, setDraft] = useState<Magic>(magic ?? {});
  // Sync from the server only when the saved MAGIC parts really change (any other offer
  // save hands us a new object) and never while a field is focused, so typing isn't wiped.
  const focused = useRef(false);
  const magicKey = JSON.stringify(magic ?? {});
  useEffect(() => {
    if (!focused.current) setDraft(JSON.parse(magicKey) as Magic);
  }, [magicKey]);
  const names = composeNames(draft);
  const set = (k: keyof Magic, v: string, save = false) => {
    const next = { ...draft, [k]: v };
    setDraft(next);
    if (save) onSave(next);
  };
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {PARTS.map((p) => (
          <Field key={p.key} label={p.label} hint={p.hint}>
            <TextInput
              value={draft[p.key] ?? ""}
              placeholder={p.placeholder}
              onChange={(e) => set(p.key, e.target.value)}
              onFocus={() => (focused.current = true)}
              onBlur={() => {
                focused.current = false;
                // Only write when a part actually changed (tabbing through used to save every time).
                if (JSON.stringify(draft) !== magicKey) onSave(draft);
              }}
            />
            {p.ideas.length > 0 && (
              <span className="flex flex-wrap gap-1 pt-0.5">
                {p.ideas.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      set(p.key, idea, true);
                    }}
                    className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {idea}
                  </button>
                ))}
              </span>
            )}
          </Field>
        ))}
      </div>
      <div className="rounded-lg border border-dashed border-border p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Wand2 className="h-3.5 w-3.5" /> Suggested names
        </p>
        {names.length ? (
          <ul className="space-y-1.5">
            {names.map((n) => {
              const using = n === currentName;
              return (
                <li key={n} className="flex items-center justify-between gap-2">
                  <span className={cn("min-w-0 truncate text-sm font-medium", using && "text-success")}>{n}</span>
                  <button
                    type="button"
                    disabled={using}
                    onClick={() => onUseName(n)}
                    className={buttonVariants({ variant: using ? "ghost" : "outline", size: "sm" })}
                  >
                    {using ? <Check className="h-3.5 w-3.5" /> : null}
                    {using ? "In use" : "Use"}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Fill in at least an avatar, goal and container to get name ideas.</p>
        )}
      </div>
    </div>
  );
}
