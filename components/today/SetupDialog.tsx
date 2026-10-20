"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Briefcase, TrendingUp, GraduationCap, Dumbbell, Plus, Check, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Dialog, cn, buttonVariants, inputClass, Chip } from "@/components/os/kit";
import { reward, toast, errorMessage } from "@/components/os/celebrate";

type Draft = {
  include: boolean;
  name: string;
  kind: "business" | "personal";
  standard: string;
  weeklyHoursTarget: number;
  color: string;
  icon: string;
  Icon: LucideIcon;
  hint: string;
};

/** Bish's Life Areas (the spine everything hangs from). */
const PRESETS: Draft[] = [
  {
    include: true,
    name: "Company Operations",
    kind: "business",
    standard: "Every client delivered on time with no surprises; admin, finance and invoices current every Friday.",
    weeklyHoursTarget: 20,
    color: "var(--chart-1)",
    icon: "briefcase",
    Icon: Briefcase,
    hint: "Delivery, clients, admin, finance",
  },
  {
    include: true,
    name: "Company Sales & Marketing",
    kind: "business",
    standard: "Daily outreach done; every open deal has a dated next step; one campaign live; pipeline covers 3× the monthly target.",
    weeklyHoursTarget: 12,
    color: "var(--chart-2)",
    icon: "trending-up",
    Icon: TrendingUp,
    hint: "Pipeline, offers, campaigns, outreach",
  },
  {
    include: true,
    name: "Personal Learning & Content",
    kind: "personal",
    standard: "3+ hours of deliberate learning a week and one hub content piece published weekly (personal + company).",
    weeklyHoursTarget: 6,
    color: "var(--chart-4)",
    icon: "graduation-cap",
    Icon: GraduationCap,
    hint: "Skills, courses, personal brand, content",
  },
  {
    include: true,
    name: "Fitness",
    kind: "personal",
    standard: "Move 4× a week, 7+ hours of sleep, energy ≥ 3/5 most days.",
    weeklyHoursTarget: 4,
    color: "var(--chart-3)",
    icon: "dumbbell",
    Icon: Dumbbell,
    hint: "Training, sleep, energy (starting soon)",
  },
];

export function SetupDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const status = useQuery(api.onboarding.status, open ? {} : "skip");
  const setup = useMutation(api.onboarding.setupAreas);
  const finish = useMutation(api.onboarding.finish);
  const [drafts, setDrafts] = useState<Draft[]>(PRESETS);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"areas" | "next">("areas");

  // Pre-fill from existing areas that match by name (keep their colour).
  useEffect(() => {
    if (!status) return;
    setDrafts((prev) =>
      prev.map((d) => {
        const m = status.areas.find((a) => a.name.trim().toLowerCase() === d.name.toLowerCase());
        return m ? { ...d, standard: m.standard ?? d.standard, weeklyHoursTarget: m.weeklyHoursTarget ?? d.weeklyHoursTarget } : d;
      }),
    );
  }, [status]);

  const others = (status?.areas ?? []).filter((a) => !drafts.some((d) => d.name.toLowerCase() === a.name.trim().toLowerCase()));

  const save = async () => {
    setBusy(true);
    try {
      await setup({
        areas: drafts
          .filter((d) => d.include && d.name.trim())
          .map((d) => ({ name: d.name.trim(), kind: d.kind, standard: d.standard, weeklyHoursTarget: d.weeklyHoursTarget, color: d.color, icon: d.icon })),
      });
      await finish({});
      reward("Your Life OS spine is ready", undefined, true);
      setStep("next");
    } catch (e) {
      toast(errorMessage(e, "Couldn't save your areas"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={step === "areas" ? "Set up your Life Areas" : "You're set. What next?"} size="lg">
      {step === "areas" ? (
        <div>
          <p className="text-sm text-muted-foreground">
            Areas are the spine of the system. Every goal, project, habit and hour hangs off one. Each gets a <b>standard</b> (what &quot;maintained&quot; looks like) and a <b>weekly hour budget</b>.
          </p>
          <div className="mt-4 space-y-3">
            {drafts.map((d, i) => (
              <div key={i} className={cn("rounded-xl border p-3 transition", d.include ? "border-border bg-card" : "border-dashed border-border opacity-60")}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={d.include}
                    onChange={(e) => setDrafts((p) => p.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))}
                    className="size-4 accent-[var(--primary)]"
                    aria-label="Include"
                  />
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-background" style={{ background: d.color }}>
                    <d.Icon className="h-4 w-4" />
                  </span>
                  <input
                    value={d.name}
                    onChange={(e) => setDrafts((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    className={cn(inputClass, "h-9 flex-1 font-medium")}
                  />
                  <Chip tone={d.kind === "business" ? "info" : "secondary"}>{d.kind}</Chip>
                </div>
                {d.include && (
                  <div className="mt-2 grid gap-2 pl-7 sm:grid-cols-[1fr_7rem]">
                    <textarea
                      value={d.standard}
                      onChange={(e) => setDrafts((p) => p.map((x, j) => (j === i ? { ...x, standard: e.target.value } : x)))}
                      rows={2}
                      className={cn(inputClass, "w-full py-1.5 text-xs leading-relaxed")}
                      aria-label="Standard"
                    />
                    <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                      Hours / week
                      <input
                        type="number"
                        min={0}
                        max={80}
                        value={d.weeklyHoursTarget}
                        onChange={(e) => setDrafts((p) => p.map((x, j) => (j === i ? { ...x, weeklyHoursTarget: Number(e.target.value) } : x)))}
                        className={cn(inputClass, "h-8 w-full text-sm")}
                      />
                    </label>
                    <p className="text-[11px] text-muted-foreground sm:col-span-2">{d.hint}</p>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() =>
                setDrafts((p) => [
                  ...p,
                  { include: true, name: "", kind: "personal", standard: "", weeklyHoursTarget: 2, color: "var(--chart-5)", icon: "layers", Icon: Plus, hint: "Your own area" },
                ])
              }
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Plus /> Add another area
            </button>
          </div>
          {others.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Your other existing areas stay as they are: {others.map((a) => a.name).join(", ")}. You can archive or edit them in Life Areas.
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
              Later
            </button>
            <button onClick={() => void save()} disabled={busy} className={buttonVariants()}>
              <Check /> Save my areas
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="mb-3 text-sm text-muted-foreground">Do these in order over the next few days. Each one takes 5–15 minutes.</p>
          {(status?.steps ?? [])
            .filter((s) => s.key !== "areas")
            .map((s, i) => (
              <Link
                key={s.key}
                href={s.href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm transition hover:bg-accent"
              >
                <span className={cn("flex size-6 items-center justify-center rounded-full text-xs font-semibold", s.done ? "bg-success text-background" : "bg-muted")}>
                  {s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="flex-1">{s.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
        </div>
      )}
    </Dialog>
  );
}
