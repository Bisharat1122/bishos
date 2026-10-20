"use client";

/** Create a deal. The next step + date are required (pipeline rule). */

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Dialog, Field, Select, TextInput, buttonVariants } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { addDaysYmd, useToday } from "@/lib/day";
import { PersonPicker, type PickedPerson } from "./PersonPicker";
import { DateChips } from "./Commitments";
import { OPEN_STAGES, SOURCE_CHANNELS, STAGE_META, errMsg, type Stage } from "./meta";

export function DealDialog({
  open,
  onClose,
  defaults,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  defaults?: { personId?: Id<"people"> | null; companyName?: string | null; stage?: Stage; title?: string };
  onCreated?: (id: Id<"deals">) => void;
}) {
  const today = useToday();
  const create = useMutation(api.deals.create);
  const opts = useQuery(api.deals.options, {});
  const companies = useQuery(api.people.companies, {});
  const [title, setTitle] = useState("");
  const [personId, setPersonId] = useState<Id<"people"> | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<Stage>("target");
  const [nextStep, setNextStep] = useState(STAGE_META.target.nextStep);
  const [nextDate, setNextDate] = useState(today);
  const [source, setSource] = useState("outbound");
  const [offerId, setOfferId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [busy, setBusy] = useState(false);
  const [stepTouched, setStepTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    const s = defaults?.stage ?? "target";
    setTitle(defaults?.title ?? "");
    setPersonId(defaults?.personId ?? null);
    setCompanyName(defaults?.companyName ?? "");
    setValue("");
    setStage(s);
    setNextStep(STAGE_META[s].nextStep);
    setNextDate(s === "target" ? today : addDaysYmd(today, 2));
    setSource("outbound");
    setOfferId("");
    setCampaignId("");
    setStepTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onPerson = (id: Id<"people"> | null, p?: PickedPerson) => {
    setPersonId(id);
    if (p?.companyName && !companyName) setCompanyName(p.companyName);
    if (p && !title.trim()) setTitle(p.companyName ? `${p.companyName}` : p.name);
  };

  const onOffer = (id: string) => {
    setOfferId(id);
    const o = opts?.offers.find((x) => x._id === id);
    if (o?.price && !value) setValue(String(o.price));
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await create({
        title,
        stage,
        personId: personId ?? undefined,
        companyName: companyName.trim() || undefined,
        value: value ? Number(value) : undefined,
        nextStep,
        nextStepDate: nextDate,
        sourceChannel: source || undefined,
        offerId: (offerId || undefined) as Id<"offers"> | undefined,
        campaignId: (campaignId || undefined) as Id<"campaigns"> | undefined,
        date: today,
      });
      if (res.xp) reward(`Deal added · ${STAGE_META[stage].short}`, res.xp);
      else toast("Deal added to the pipeline", { tone: "success" });
      onCreated?.(res.id);
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const valid = title.trim() && nextStep.trim() && nextDate;

  return (
    <Dialog open={open} onClose={onClose} title="New deal" size="lg">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Contact">
            <PersonPicker value={personId} onChange={onPerson} />
          </Field>
          <Field label="Company">
            <TextInput list="b1-company-list" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc." />
            <datalist id="b1-company-list">
              {(companies ?? []).map((c) => (
                <option key={c._id} value={c.name} />
              ))}
            </datalist>
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
          <Field label="Deal name">
            <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Acme: website rebuild" />
          </Field>
          <Field label="Value">
            <TextInput type="number" min={0} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder={opts?.currency ?? "USD"} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Stage">
            <Select
              value={stage}
              onChange={(e) => {
                const s = e.target.value as Stage;
                setStage(s);
                if (!stepTouched) setNextStep(STAGE_META[s].nextStep);
              }}
            >
              {OPEN_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_META[s].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Source channel">
            <Select value={source} onChange={(e) => setSource(e.target.value)}>
              {SOURCE_CHANNELS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Offer">
            <Select value={offerId} onChange={(e) => onOffer(e.target.value)}>
              <option value="">—</option>
              {(opts?.offers ?? []).map((o) => (
                <option key={o._id} value={o._id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {(opts?.campaigns.length ?? 0) > 0 && (
          <Field label="Campaign">
            <Select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
              <option value="">—</option>
              {opts!.campaigns.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Next step (required: no deal without a dated next step)</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
            <TextInput
              value={nextStep}
              onChange={(e) => {
                setNextStep(e.target.value);
                setStepTouched(true);
              }}
              placeholder="Send the first message"
            />
            <TextInput type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
          </div>
          <div className="mt-2">
            <DateChips value={nextDate} onPick={setNextDate} today={today} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
            Cancel
          </button>
          <button type="submit" disabled={busy || !valid} className={buttonVariants()}>
            Add deal
          </button>
        </div>
      </form>
    </Dialog>
  );
}
