"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Layers } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Dialog, Field, Select, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { BrandPicker, FieldGroup } from "./bits";
import { FORMATS, errMsg, type Brand, type Pillar, type Stage } from "./model";

export type NewPieceDefaults = { brand?: Brand; scheduledFor?: string; isHub?: boolean; stage?: Stage; format?: string; title?: string };

export function NewPieceDialog({
  open,
  onClose,
  pillars,
  defaults,
}: {
  open: boolean;
  onClose: () => void;
  pillars: Pillar[];
  defaults?: NewPieceDefaults;
}) {
  const router = useRouter();
  const create = useMutation(api.content.create);
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState<Brand>("personal");
  const [format, setFormat] = useState("short_video");
  const [pillarId, setPillarId] = useState<string>("");
  const [stage, setStage] = useState<Stage>("idea");
  const [isHub, setIsHub] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(defaults?.title ?? "");
    setBrand(defaults?.brand ?? "personal");
    setFormat(defaults?.format ?? (defaults?.isHub ? "long_video" : "short_video"));
    setPillarId("");
    setStage(defaults?.stage ?? (defaults?.scheduledFor ? "brief" : "idea"));
    setIsHub(defaults?.isHub ?? false);
    setScheduledFor(defaults?.scheduledFor ?? "");
  }, [open, defaults]);

  const brandPillars = pillars.filter((p) => p.brand === brand);

  async function submit(openAfter: boolean) {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const id = await create({
        title,
        brand,
        format,
        stage,
        isHub: isHub || undefined,
        pillarId: (pillarId || undefined) as Id<"contentPillars"> | undefined,
        scheduledFor: scheduledFor || undefined,
      });
      toast("Piece created", { tone: "success" });
      onClose();
      if (openAfter) router.push(`/content/${id}`);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="New piece" size="lg">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(true);
        }}
      >
        <Field label="Working title">
          <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's the one idea?" />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <BrandPicker value={brand} onChange={(b) => { setBrand(b); setPillarId(""); }} />
          <button
            type="button"
            onClick={() => setIsHub(!isHub)}
            aria-pressed={isHub}
            className={cn(
              buttonVariants({ variant: isHub ? "default" : "outline", size: "sm" }),
            )}
            title="The weekly long piece you cut into 5–10 short ones"
          >
            <Layers className="h-3.5 w-3.5" />
            Hub piece
          </button>
        </div>
        <FieldGroup label="Format">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {FORMATS.map((f) => {
              const I = f.icon;
              const on = format === f.key;
              return (
                <button
                  type="button"
                  key={f.key}
                  onClick={() => setFormat(f.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors",
                    on ? "border-ring bg-accent font-medium" : "border-border hover:bg-accent/50",
                  )}
                >
                  <I className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{f.label}</span>
                </button>
              );
            })}
          </div>
        </FieldGroup>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Pillar">
            <Select value={pillarId} onChange={(e) => setPillarId(e.target.value)}>
              <option value="">No pillar</option>
              {brandPillars.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Start at">
            <Select value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
              <option value="idea">Idea</option>
              <option value="seed">Seed (tested)</option>
              <option value="brief">Brief</option>
              <option value="script">Script</option>
            </Select>
          </Field>
          <Field label="Publish on (optional)">
            <TextInput type="date" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button type="button" className={buttonVariants({ variant: "ghost", size: "sm" })} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={buttonVariants({ variant: "outline", size: "sm" })}
            disabled={!title.trim() || busy}
            onClick={() => void submit(false)}
          >
            Create
          </button>
          <button type="submit" className={buttonVariants({ size: "sm" })} disabled={!title.trim() || busy}>
            Create &amp; open
          </button>
        </div>
      </form>
    </Dialog>
  );
}
