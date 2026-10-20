"use client";

/**
 * Stage moves with the pipeline rules built in:
 *   - into an open stage → ask for the next step + date first
 *   - lost / unqualified → ask for a short reason (person becomes nurture)
 *   - won → celebrate, offer "Create delivery project"
 * Usage:  const mover = useDealMover();  mover.request(deal, "proposal");  {mover.node}
 */

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { FolderKanban, PartyPopper, Trophy } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Dialog, Field, Select, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { addDaysYmd, useToday } from "@/lib/day";
import { DateChips } from "./Commitments";
import { Portal } from "./Portal";
import { LOST_REASONS, STAGE_META, errMsg, isOpenStage, type Stage } from "./meta";

export type MovableDeal = {
  _id: Id<"deals">;
  title: string;
  stage: Stage;
  nextStep?: string;
  nextStepDate?: string;
  value?: number;
  personId?: Id<"people">;
  personName?: string | null;
  companyId?: Id<"companies">;
  companyName?: string | null;
  lostReason?: string;
  projectId?: Id<"projects">;
  qualification?: { pain?: string; budget?: string; decisionMaker?: string; timeline?: string };
};

/** Pick the delivery area: operations / delivery / client, else the first. */
export function useDeliveryAreas() {
  const areas = useQuery(api.lifeAreas.list);
  return useMemo(() => {
    const list = (areas ?? []).filter((a) => !a.archived).sort((a, b) => a.order - b.order);
    const def = list.find((a) => /operation|delivery|client/i.test(a.name)) ?? list[0];
    return { areas: list, defaultId: def?._id as Id<"lifeAreas"> | undefined, loading: areas === undefined };
  }, [areas]);
}

function ProjectFields({
  on,
  setOn,
  areaId,
  setAreaId,
  title,
  setTitle,
}: {
  on: boolean;
  /** Omit for a fixed "always on" block (no checkbox). */
  setOn?: (b: boolean) => void;
  areaId: string;
  setAreaId: (s: string) => void;
  title: string;
  setTitle: (s: string) => void;
}) {
  const { areas } = useDeliveryAreas();
  return (
    <div className="rounded-lg border border-border p-3">
      {setOn ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="size-4 accent-[var(--primary)]" />
          <FolderKanban className="h-4 w-4 text-muted-foreground" /> Create delivery project
        </label>
      ) : (
        <p className="flex items-center gap-2 text-sm font-medium">
          <FolderKanban className="h-4 w-4 text-muted-foreground" /> Delivery project
        </p>
      )}
      {on && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Project name">
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Life area">
            <Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              {areas.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}
    </div>
  );
}

/** Stand-alone "Create delivery project" for a won deal. */
export function DeliveryProjectDialog({ deal, onClose }: { deal: MovableDeal; onClose: () => void }) {
  const createProject = useMutation(api.deals.createDeliveryProject);
  const { defaultId } = useDeliveryAreas();
  const [areaId, setAreaId] = useState<string>("");
  const [title, setTitle] = useState(`${deal.companyName ?? deal.title}: delivery`);
  const [companyName, setCompanyName] = useState(deal.companyName ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!areaId && defaultId) setAreaId(defaultId);
  }, [areaId, defaultId]);
  const submit = async () => {
    setBusy(true);
    try {
      const res = await createProject({
        dealId: deal._id,
        lifeAreaId: (areaId || undefined) as Id<"lifeAreas"> | undefined,
        title,
        companyName: !deal.companyId && companyName.trim() ? companyName.trim() : undefined,
      });
      toast("Delivery project created", { tone: "success", sub: `In ${res.areaName}` });
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onClose={onClose} title="Create delivery project">
      <div className="space-y-3">
        <ProjectFields on areaId={areaId} setAreaId={setAreaId} title={title} setTitle={setTitle} />
        {!deal.companyId && (
          <Field label="Customer account" hint="Files this deal under Customers">
            <TextInput value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={deal.personName ?? "Company name"} />
          </Field>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
            Cancel
          </button>
          <button onClick={() => void submit()} disabled={busy || !title.trim()} className={buttonVariants()}>
            Create project
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function MoveDealDialog({ deal, to, onClose, onDone }: { deal: MovableDeal; to: Stage; onClose: () => void; onDone?: (stage: Stage) => void }) {
  const today = useToday();
  const move = useMutation(api.deals.move);
  const createProject = useMutation(api.deals.createDeliveryProject);
  const { defaultId } = useDeliveryAreas();
  const meta = STAGE_META[to];
  const open = isOpenStage(to);
  const keepCurrent = !!deal.nextStep && !!deal.nextStepDate && deal.nextStepDate >= today;
  const [nextStep, setNextStep] = useState(open ? meta.nextStep : "");
  const [nextDate, setNextDate] = useState(keepCurrent ? deal.nextStepDate! : addDaysYmd(today, to === "target" ? 0 : 2));
  const [reason, setReason] = useState(deal.lostReason ?? "");
  const [value, setValue] = useState(deal.value ? String(deal.value) : "");
  const [companyName, setCompanyName] = useState(deal.companyName ?? "");
  const [makeProject, setMakeProject] = useState(!deal.projectId);
  const [areaId, setAreaId] = useState("");
  const [projTitle, setProjTitle] = useState(`${deal.companyName ?? deal.title}: delivery`);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!areaId && defaultId) setAreaId(defaultId);
  }, [areaId, defaultId]);

  const q = deal.qualification ?? {};
  const missingQual = to === "discovery" ? (["pain", "budget", "decisionMaker"] as const).filter((k) => !q[k]?.trim()) : [];

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (open) {
        const res = await move({ id: deal._id, stage: to, date: today, nextStep, nextStepDate: nextDate });
        if (res.goalJustHit) reward("Goal hit — you can stop prospecting today", res.xp || undefined, true);
        else if (res.xp) reward(`${deal.title} → ${meta.short}`, res.xp);
        else toast(`Moved to ${meta.label}`, { tone: "success" });
      } else if (to === "won") {
        const res = await move({
          id: deal._id,
          stage: "won",
          date: today,
          value: value ? Number(value) : undefined,
          companyName: !deal.companyId && companyName.trim() ? companyName.trim() : undefined,
        });
        reward(`Deal won 🎉 ${deal.title}`, res.xp || undefined, true);
        if (makeProject && !deal.projectId) {
          try {
            const p = await createProject({
              dealId: deal._id,
              lifeAreaId: (areaId || undefined) as Id<"lifeAreas"> | undefined,
              title: projTitle,
            });
            toast("Delivery project created", { tone: "success", sub: `In ${p.areaName}` });
          } catch (e) {
            toast(errMsg(e), { tone: "warning" });
          }
        }
      } else {
        await move({ id: deal._id, stage: to, date: today, lostReason: reason });
        toast(to === "lost" ? "Closed as lost. Kept as a nurture contact" : "Marked unqualified", {
          tone: "neutral",
          sub: deal.personName ? `${deal.personName} stays in People with a 90-day cadence` : undefined,
        });
      }
      onDone?.(to);
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const valid = open ? !!nextStep.trim() && !!nextDate : to === "won" ? true : !!reason.trim();

  let body: ReactNode;
  if (open) {
    body = (
      <>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{meta.label}:</span> {meta.hint}. Every open deal needs a dated next step.
        </p>
        {missingQual.length > 0 && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
            Discovery is done when pain, budget and the decision-maker are confirmed. Still missing:{" "}
            {missingQual.map((k) => (k === "decisionMaker" ? "decision-maker" : k)).join(", ")}. You can fill them in the deal.
          </p>
        )}
        <Field label="Next step">
          <TextInput autoFocus value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder={meta.nextStep} />
          {deal.nextStep && deal.nextStep !== nextStep && (
            <button type="button" onClick={() => setNextStep(deal.nextStep!)} className="text-left text-[11px] text-muted-foreground hover:text-foreground">
              Keep current: “{deal.nextStep}”
            </button>
          )}
        </Field>
        <Field label="When">
          <TextInput type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
          <DateChips value={nextDate} onPick={setNextDate} today={today} />
        </Field>
      </>
    );
  } else if (to === "won") {
    body = (
      <>
        <div className="os-pop flex items-center gap-3 rounded-xl bg-success-soft p-4 text-success">
          <Trophy className="h-8 w-8 shrink-0" />
          <div>
            <p className="font-semibold">Close it as won</p>
            <p className="text-xs">+100 XP, and the company moves to Customers.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Deal value">
            <TextInput type="number" min={0} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
          </Field>
          {!deal.companyId && (
            <Field label="Customer account" hint="Files it under Customers">
              <TextInput value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={deal.personName ?? "Company name"} />
            </Field>
          )}
        </div>
        {!deal.projectId && (
          <ProjectFields on={makeProject} setOn={setMakeProject} areaId={areaId} setAreaId={setAreaId} title={projTitle} setTitle={setProjTitle} />
        )}
      </>
    );
  } else {
    body = (
      <>
        <p className="text-sm text-muted-foreground">
          {to === "lost" ? "Not this time." : "Not a fit."} A one-line reason makes your qualification sharper.
          {deal.personName ? ` ${deal.personName} stays in People as a nurture contact.` : ""}
        </p>
        <Field label="Reason">
          <TextArea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[64px]" placeholder="They went with an in-house team" />
        </Field>
        <div className="flex flex-wrap gap-1">
          {LOST_REASONS.map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setReason(r)}
              className={cn(
                "rounded-md border px-2 py-0.5 text-[11px] font-medium",
                reason === r ? "border-ring bg-accent" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={
        to === "won" ? (
          <span className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-success" /> {deal.title}
          </span>
        ) : (
          `Move to ${meta.label}`
        )
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {body}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
            Cancel
          </button>
          <button type="submit" disabled={busy || !valid} className={buttonVariants()}>
            {to === "won" ? "Mark as won" : open ? `Move to ${meta.short}` : `Close as ${meta.label.toLowerCase()}`}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

/** Hook: request a stage move; renders the right prompt in `node`. */
export function useDealMover(onDone?: (deal: MovableDeal, stage: Stage) => void) {
  const [pending, setPending] = useState<{ deal: MovableDeal; to: Stage } | null>(null);
  const node = pending ? (
    <Portal>
      <MoveDealDialog deal={pending.deal} to={pending.to} onClose={() => setPending(null)} onDone={(s) => onDone?.(pending.deal, s)} />
    </Portal>
  ) : null;
  return {
    request: (deal: MovableDeal, to: Stage) => {
      if (deal.stage === to) return;
      setPending({ deal, to });
    },
    node,
  };
}
