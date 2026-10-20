"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Zap } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Dialog, Field, Segmented, Select, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { errorMessage, toast } from "@/components/os/celebrate";
import { AUTO_META } from "./lib";
import { FieldGroup, NoSubmit } from "./viz";

type Metric = Doc<"metrics">;

/** Create or edit a scorecard metric. */
export function MetricDialog({
  open,
  onClose,
  metric,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  metric?: Metric | null;
  currency: string;
}) {
  const create = useMutation(api.scorecard.create);
  const update = useMutation(api.scorecard.update);
  const areas = useQuery(api.lifeAreas.list);

  const [source, setSource] = useState("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [unit, setUnit] = useState("");
  const [areaId, setAreaId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSource(metric?.auto ?? "");
    setName(metric?.name ?? "");
    setTarget(metric ? String(metric.target) : "");
    setDirection(metric?.direction ?? "up");
    setUnit(metric?.unit ?? "");
    setAreaId(metric?.lifeAreaId ?? "");
  }, [open, metric]);

  const pickSource = (s: string) => {
    setSource(s);
    const meta = AUTO_META[s];
    if (!meta) return;
    if (!name.trim() || Object.values(AUTO_META).some((m) => m.suggest === name)) setName(meta.suggest);
    if (!target) setTarget(String(meta.target));
    if (!unit || Object.values(AUTO_META).some((m) => m.unit === unit)) setUnit(s === "revenue" || s === "revenue_cash" ? currency : meta.unit);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = Number(target);
    if (!name.trim()) return toast("Give the metric a name", { tone: "warning" });
    if (target.trim() === "" || !Number.isFinite(t)) return toast("Set a weekly target", { tone: "warning" });
    setBusy(true);
    try {
      if (metric) {
        await update({
          id: metric._id,
          name,
          target: t,
          direction,
          unit: unit || null,
          auto: source || null,
          lifeAreaId: areaId ? (areaId as Id<"lifeAreas">) : null,
        });
        toast("Metric updated", { tone: "success" });
      } else {
        await create({
          name,
          target: t,
          direction,
          unit: unit || undefined,
          auto: source || undefined,
          lifeAreaId: areaId ? (areaId as Id<"lifeAreas">) : undefined,
        });
        toast("Metric added", { tone: "success" });
      }
      onClose();
    } catch (err) {
      toast(errorMessage(err, "Could not save"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={metric ? "Edit metric" : "Add a scorecard metric"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Where does the number come from?">
          <Select value={source} onChange={(e) => pickSource(e.target.value)}>
            <option value="">Manual: I type it in each week</option>
            {Object.entries(AUTO_META).map(([k, m]) => (
              <option key={k} value={k}>
                ⚡ Auto: {m.label}
              </option>
            ))}
          </Select>
        </Field>
        {source && AUTO_META[source] && (
          <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2 text-xs text-info">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {AUTO_META[source].hint}. Calculated for you every week.
          </p>
        )}
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Qualified leads" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Weekly target">
            <TextInput type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="10" />
          </Field>
          <Field label="Unit" hint="h, %, calls, or a currency code">
            <TextInput value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="calls" />
          </Field>
        </div>
        <FieldGroup label="On track when the number is…">
          <NoSubmit>
            <Segmented
              value={direction}
              onChange={setDirection}
              options={[
                { value: "up", label: "At or above target" },
                { value: "down", label: "At or below target" },
              ]}
            />
          </NoSubmit>
        </FieldGroup>
        <Field label="Life Area (optional)">
          <Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">None</option>
            {(areas ?? [])
              .filter((a) => !a.archived)
              .sort((a, b) => a.order - b.order)
              .map((a) => (
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
          <button type="submit" disabled={busy} className={cn(buttonVariants())}>
            {metric ? "Save" : "Add metric"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
