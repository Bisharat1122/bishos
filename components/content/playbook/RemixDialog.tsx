"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Lock, Shuffle, Sparkles, TrendingUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Dialog, Field, Select, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { ARCHETYPES, BEGINNER_HOLD, BRICKS } from "@/lib/kallaway";
import { BrandPicker } from "../bits";
import { FORMATS, errMsg, type Brand, type Swipe } from "../model";

/**
 * Hold-and-remix an outlier: keep the world-class bricks, change the rest.
 * Beginners hold hook, story and visual format; topic + angle change every rep.
 */
export function RemixDialog({ open, onClose, swipe, defaultBrand }: { open: boolean; onClose: () => void; swipe: Swipe | null; defaultBrand?: Brand }) {
  const router = useRouter();
  const remix = useMutation(api.contentSystem.remixFromSwipe);
  const [hold, setHold] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState<Brand>("personal");
  const [format, setFormat] = useState("short_video");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !swipe) return;
    setHold(new Set<string>([...BEGINNER_HOLD, ...(swipe.hold ?? [])]));
    setTitle("");
    setBrand(swipe.brand ?? defaultBrand ?? "personal");
    setFormat(swipe.format || "short_video");
  }, [open, swipe, defaultBrand]);

  if (!swipe) return null;
  const b = (swipe.bricks ?? {}) as Record<string, string | undefined>;
  const value = (k: string) => b[k]?.trim() || (k === "hookStructure" ? swipe.hookText : k === "storyStructure" ? swipe.structure : undefined) || "";
  const archetype = ARCHETYPES.find((a) => a.key === swipe.archetype);
  const toggle = (k: string) =>
    setHold((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  const changing = BRICKS.filter((x) => !hold.has(x.key));

  async function go() {
    setBusy(true);
    try {
      const id = await remix({ swipeId: swipe!._id, hold: BRICKS.map((x) => x.key).filter((k) => hold.has(k)), title: title.trim(), brand, format });
      toast("Remix started", { tone: "success", sub: `Holding ${hold.size} brick${hold.size === 1 ? "" : "s"}. Now write your topic + angle.` });
      onClose();
      router.push(`/content/${id}`);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Remix this outlier" size="lg">
      <div className="-mt-2 mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {swipe.outlier != null && (
          <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums", swipe.outlier >= 5 ? "bg-success-soft text-success" : "bg-muted")}>
            <TrendingUp className="h-3 w-3" /> {swipe.outlier}×
          </span>
        )}
        <span className="min-w-0 truncate">{swipe.title || swipe.hookText || swipe.creator || "Saved outlier"}</span>
        {archetype && <span className="text-xs">· {archetype.label} hook</span>}
      </div>
      <p className="mb-3 text-sm">
        Hold the bricks that are world class, remix the rest. <span className="text-muted-foreground">Beginners: hold hook, story and visual format; change topic + angle every rep.</span>
      </p>

      <ul className="space-y-1.5">
        {BRICKS.map((x) => {
          const on = hold.has(x.key);
          const v = value(x.key);
          return (
            <li key={x.key}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(x.key)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-2.5 text-left transition-colors",
                  on ? "border-foreground bg-accent/50" : "border-dashed border-border hover:border-ring/60",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                    on ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                  )}
                >
                  {on ? <Lock className="h-3.5 w-3.5" /> : <Shuffle className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{x.label}</span>
                    <span className={cn("text-[10px] font-semibold uppercase tracking-wide", on ? "text-foreground" : "text-muted-foreground")}>{on ? "Hold" : "Remix"}</span>
                  </span>
                  <span className={cn("mt-0.5 block text-xs leading-snug", v ? "" : "italic text-muted-foreground")}>{v || `Not broken down yet (${x.hint.toLowerCase()})`}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {changing.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          You&apos;ll write new: {changing.map((x) => x.label.toLowerCase()).join(", ")}.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void go();
        }}
        className="mt-4 space-y-3 border-t border-border pt-4"
      >
        <Field label="Working title for your version">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your topic, your angle" autoFocus />
        </Field>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Brand">
            <BrandPicker value={brand} onChange={setBrand} />
          </Field>
          <Field label="Format" className="min-w-[160px] flex-1">
            <Select value={format} onChange={(e) => setFormat(e.target.value)}>
              {FORMATS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={buttonVariants({ size: "sm" })}>
            <Sparkles className="h-3.5 w-3.5" /> {busy ? "Creating…" : "Create remix"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
