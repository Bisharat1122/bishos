"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { GraduationCap } from "lucide-react";
import { Dialog, Field, Select, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { errMsg, learningLifeArea } from "./meta";

const MINUTES = [60, 120, 180, 300];

/** "+ Learning area": name, target performance, why, weekly minutes, life area. */
export function LearningAreaDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const lifeAreas = useQuery(api.lifeAreas.list);
  const create = useMutation(api.learning.createArea);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [why, setWhy] = useState("");
  const [minutes, setMinutes] = useState(120);
  const [lifeAreaId, setLifeAreaId] = useState("");
  const [saving, setSaving] = useState(false);

  // Default the life area to the one that looks like "Learning & Content" — once
  // per opening, so choosing "None" isn't immediately overwritten again.
  const defaulted = useRef(false);
  useEffect(() => {
    if (!open) {
      defaulted.current = false;
      return;
    }
    if (defaulted.current || !lifeAreas) return;
    defaulted.current = true;
    if (!lifeAreaId) setLifeAreaId(learningLifeArea(lifeAreas)?._id ?? "");
  }, [open, lifeAreas, lifeAreaId]);

  async function submit() {
    if (!name.trim()) {
      toast("Name the learning area.", { tone: "warning" });
      return;
    }
    setSaving(true);
    try {
      const id = await create({
        name,
        targetPerformance: target || undefined,
        why: why || undefined,
        weeklyMinutesTarget: minutes || undefined,
        lifeAreaId: lifeAreaId ? (lifeAreaId as Id<"lifeAreas">) : undefined,
      });
      reward(`Learning area “${name.trim()}” created`);
      setName("");
      setTarget("");
      setWhy("");
      onClose();
      router.push(`/learning/${id}`);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="New learning area">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0" />
          Treat it like a project with a performance goal: what will you be able to <b className="text-foreground">do</b>? Then map skills, practise, and test yourself.
        </div>
        <Field label="Name">
          <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Short-form video" />
        </Field>
        <Field label="Target performance" hint="Something you can do and check. e.g. “Record a 60-second explainer with no notes.”">
          <TextInput value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Record a 60-second explainer with no notes" />
        </Field>
        <Field label="Why it matters">
          <TextArea value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Content is our cheapest lead source and I'm the face of it." className="min-h-[60px]" />
        </Field>
        <Field label="Weekly minutes">
          <div className="flex flex-wrap items-center gap-1.5">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutes(m)}
                className={cn(
                  "h-8 rounded-md border px-2.5 text-xs font-medium tabular-nums transition",
                  minutes === m ? "border-ring bg-primary text-primary-foreground" : "border-border hover:bg-accent",
                )}
              >
                {m >= 60 ? `${m / 60}h` : `${m}m`}
              </button>
            ))}
            <input
              type="number"
              min={0}
              step={15}
              value={minutes || ""}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="h-8 w-20 rounded-md border border-input bg-card px-2 text-xs tabular-nums outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
              aria-label="Weekly minutes"
            />
            <span className="text-xs text-muted-foreground">min / week</span>
          </div>
        </Field>
        <Field label="Life area">
          <Select value={lifeAreaId} onChange={(e) => setLifeAreaId(e.target.value)}>
            <option value="">None</option>
            {lifeAreas?.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "outline" })}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={buttonVariants()}>
            Create area
          </button>
        </div>
      </form>
    </Dialog>
  );
}
