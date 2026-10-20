"use client";

/** Quick-add a person or a company. */

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Dialog, Field, Segmented, Select, TextInput, buttonVariants } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { FieldGroup, NoSubmit } from "./fields";
import { CADENCES, COMPANY_RELS, HEALTH, RELATIONS, SOURCE_CHANNELS, errMsg, type CompanyRel, type Health, type Relation, type Tier } from "./meta";

export function PersonDialog({
  open,
  onClose,
  defaults,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  defaults?: { name?: string; companyName?: string; relation?: Relation };
  onCreated?: (id: Id<"people">) => void;
}) {
  const create = useMutation(api.people.create);
  const companies = useQuery(api.people.companies, open ? {} : "skip");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [relation, setRelation] = useState<Relation>("lead");
  const [tier, setTier] = useState<Tier | "">("");
  const [cadence, setCadence] = useState("");
  const [email, setEmail] = useState("");
  const [social, setSocial] = useState("");
  const [source, setSource] = useState("");
  const [howMet, setHowMet] = useState("");
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(defaults?.name ?? "");
    setCompanyName(defaults?.companyName ?? "");
    setTitle("");
    setRelation(defaults?.relation ?? "lead");
    setTier("");
    setCadence("");
    setEmail("");
    setSocial("");
    setSource("");
    setHowMet("");
    setMore(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const id = await create({
        name,
        companyName: companyName.trim() || undefined,
        title: title || undefined,
        relation,
        tier: tier || undefined,
        cadenceDays: cadence ? Number(cadence) : undefined,
        email: email || undefined,
        social: social || undefined,
        source: source || undefined,
        howMet: howMet || undefined,
      });
      toast(`Added ${name.trim()}`, { tone: "success" });
      onCreated?.(id);
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Add a person">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Name">
            <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Sara Khan" />
          </Field>
          <Field label="Company">
            <TextInput list="b1-person-companies" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme" />
            <datalist id="b1-person-companies">
              {(companies ?? []).map((c) => (
                <option key={c._id} value={c.name} />
              ))}
            </datalist>
          </Field>
          <Field label="Relation">
            <Select value={relation} onChange={(e) => setRelation(e.target.value as Relation)}>
              {RELATIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Keep in touch">
            <Select value={cadence} onChange={(e) => setCadence(e.target.value)}>
              <option value="">No cadence</option>
              {CADENCES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <FieldGroup label="Tier" hint="A = closest / most valuable relationships">
          <NoSubmit>
            <Segmented
              size="sm"
              value={tier || "none"}
              onChange={(v) => setTier(v === "none" ? "" : (v as Tier))}
              options={[
                { value: "none", label: "—" },
                { value: "A", label: "A" },
                { value: "B", label: "B" },
                { value: "C", label: "C" },
              ]}
            />
          </NoSubmit>
        </FieldGroup>
        {more ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Job title">
              <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Head of Ops" />
            </Field>
            <Field label="Email">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="LinkedIn / social">
              <TextInput value={social} onChange={(e) => setSocial(e.target.value)} placeholder="https://linkedin.com/in/…" />
            </Field>
            <Field label="Source">
              <Select value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="">—</option>
                {SOURCE_CHANNELS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="How we met" className="sm:col-span-2">
              <TextInput value={howMet} onChange={(e) => setHowMet(e.target.value)} placeholder="Intro from Ali at the SaaS meetup" />
            </Field>
          </div>
        ) : (
          <button type="button" onClick={() => setMore(true)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
            + Title, email, social, source…
          </button>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
            Cancel
          </button>
          <button type="submit" disabled={busy || !name.trim()} className={buttonVariants()}>
            Add person
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function CompanyDialog({
  open,
  onClose,
  defaults,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  defaults?: { relationship?: CompanyRel };
  onCreated?: (id: Id<"companies">) => void;
}) {
  const create = useMutation(api.people.createCompany);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [relationship, setRelationship] = useState<CompanyRel>("prospect");
  const [health, setHealth] = useState<Health>("green");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setName("");
    setWebsite("");
    setIndustry("");
    setRelationship(defaults?.relationship ?? "prospect");
    setHealth("green");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const id = await create({
        name,
        website: website || undefined,
        industry: industry || undefined,
        relationship,
        health: relationship === "customer" ? health : undefined,
      });
      toast(`Added ${name.trim()}`, { tone: "success" });
      onCreated?.(id);
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title="Add a company">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Name">
            <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." />
          </Field>
          <Field label="Relationship">
            <Select value={relationship} onChange={(e) => setRelationship(e.target.value as CompanyRel)}>
              {COMPANY_RELS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Website">
            <TextInput value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="acme.com" />
          </Field>
          <Field label="Industry">
            <TextInput value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Logistics" />
          </Field>
        </div>
        {relationship === "customer" && (
          <FieldGroup label="Health">
            <NoSubmit>
              <Segmented size="sm" value={health} onChange={setHealth} options={HEALTH.map((h) => ({ value: h.value, label: h.label }))} />
            </NoSubmit>
          </FieldGroup>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
            Cancel
          </button>
          <button type="submit" disabled={busy || !name.trim()} className={buttonVariants()}>
            Add company
          </button>
        </div>
      </form>
    </Dialog>
  );
}
