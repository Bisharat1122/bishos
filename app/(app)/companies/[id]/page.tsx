"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Briefcase, Building2, ExternalLink, FolderKanban, HandCoins, MessagesSquare, Plus, StickyNote, Trash2, UserPlus, Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Avatar, Bar, Chip, EmptyHint, Field, PageShell, Section, Select, buttonVariants } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { relDay, useToday } from "@/lib/day";
import { LogTouchButton } from "@/components/sales/LogTouch";
import { InteractionTimeline } from "@/components/sales/InteractionTimeline";
import { CommitmentDialog, CommitmentList } from "@/components/sales/Commitments";
import { DealDrawer } from "@/components/sales/DealDrawer";
import { DealDialog } from "@/components/sales/DealDialog";
import { PersonDialog } from "@/components/sales/PersonDialog";
import { BlurInput, BlurTextArea, FieldGroup } from "@/components/sales/fields";
import { RowMenu } from "@/components/sales/Menu";
import { CadenceChip, HealthPicker, StageChip } from "@/components/sales/chips";
import { COMPANY_RELS, COMPANY_REL_TONE, errMsg, fmtMoney, isOpenStage, relationLabel, type CompanyRel } from "@/components/sales/meta";

export default function CompanyPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"companies">;
  const router = useRouter();
  const today = useToday();
  const data = useQuery(api.people.getCompany, { id, today });
  const options = useQuery(api.deals.options, {});
  const update = useMutation(api.people.updateCompany);
  const remove = useMutation(api.people.removeCompany);
  const [dealId, setDealId] = useState<Id<"deals"> | null>(null);
  const [newDeal, setNewDeal] = useState(false);
  const [addPerson, setAddPerson] = useState(false);
  const [commit, setCommit] = useState(false);

  const save = async (patch: Omit<Parameters<typeof update>[0], "id">) => {
    try {
      await update({ id, ...patch });
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
      throw e;
    }
  };

  if (data === undefined) {
    return (
      <PageShell title={<span className="skeleton inline-block h-7 w-48" />}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          <div className="skeleton h-80" />
          <div className="skeleton h-96" />
        </div>
      </PageShell>
    );
  }
  if (data === null) {
    return (
      <PageShell title="Company not found">
        <EmptyHint
          icon={Building2}
          title="This company doesn't exist anymore"
          action={
            <Link href="/people?tab=companies" className={buttonVariants({ variant: "outline" })}>
              Back to companies
            </Link>
          }
        />
      </PageShell>
    );
  }

  const c = data.company;
  const currency = options?.currency ?? "USD";
  const site = c.website ? (/^https?:\/\//.test(c.website) ? c.website : `https://${c.website}`) : null;
  const openCommits = data.commitments.filter((x) => x.status === "open");

  return (
    <PageShell
      title={
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={c.name} size={40} className="rounded-xl" />
          <span className="truncate">{c.name}</span>
        </span>
      }
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <Chip tone={COMPANY_REL_TONE[c.relationship]}>{COMPANY_RELS.find((r) => r.value === c.relationship)?.label}</Chip>
          {c.industry && <span>{c.industry}</span>}
          {data.revenue > 0 && <span className="text-success">{fmtMoney(data.revenue, currency)} won</span>}
        </span>
      }
      actions={
        <>
          <Link href={c.relationship === "customer" ? "/customers" : "/people?tab=companies"} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{c.relationship === "customer" ? "Customers" : "Companies"}</span>
          </Link>
          <LogTouchButton companyId={id} variant="default" size="default" defaultKind="email" />
          <RowMenu
            items={[
              { label: "New deal", icon: Briefcase, onSelect: () => setNewDeal(true) },
              { label: "Add person", icon: UserPlus, onSelect: () => setAddPerson(true) },
              { label: "Add commitment", icon: HandCoins, onSelect: () => setCommit(true) },
              {
                label: "Delete company",
                icon: Trash2,
                danger: true,
                onSelect: async () => {
                  if (!confirm(`Delete ${c.name}? People, deals and projects stay, unlinked.`)) return;
                  try {
                    await remove({ id });
                    toast(`${c.name} deleted`);
                    router.replace("/people?tab=companies");
                  } catch (e) {
                    toast(errMsg(e), { tone: "warning" });
                  }
                },
              },
            ]}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Section title="Account" icon={Building2}>
            <div className="space-y-3">
              <Field label="Name">
                <BlurInput value={c.name} onSave={(v) => save({ name: v })} />
              </Field>
              <Field label="Relationship">
                <Select value={c.relationship} onChange={(e) => void save({ relationship: e.target.value as CompanyRel }).catch(() => undefined)}>
                  {COMPANY_RELS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {c.relationship === "customer" && (
                <FieldGroup label="Health">
                  <HealthPicker value={c.health} onChange={(h) => void save({ health: h }).catch(() => undefined)} size="md" />
                </FieldGroup>
              )}
              <Field
                label={
                  <span className="inline-flex items-center gap-1">
                    Website
                    {site && (
                      <a href={site} target="_blank" rel="noreferrer" aria-label="Open website" className="text-foreground">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </span>
                }
              >
                <BlurInput value={c.website ?? ""} placeholder="acme.com" onSave={(v) => save({ website: v || null })} />
              </Field>
              <Field label="Industry">
                <BlurInput value={c.industry ?? ""} placeholder="Logistics" onSave={(v) => save({ industry: v || null })} />
              </Field>
            </div>
          </Section>
          <Section title="Notes" icon={StickyNote}>
            <BlurTextArea value={c.notes ?? ""} onSave={(v) => save({ notes: v || null })} placeholder="How they buy, who decides, what success looks like…" />
          </Section>
        </div>

        <div className="min-w-0 space-y-4">
          <Section
            title={`People (${data.people.length})`}
            icon={Users}
            action={
              <button onClick={() => setAddPerson(true)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            }
          >
            {data.people.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody linked yet. Multi-thread the account: add the champion, the decision-maker and the user.</p>
            ) : (
              <div className="-mx-2 divide-y divide-border/60">
                {data.people.map((p) => (
                  <div key={p._id} className="flex items-center gap-3 px-2 py-2">
                    <Link href={`/people/${p._id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                      <Avatar name={p.name} size={28} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{p.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{p.title ?? relationLabel(p.relation)}</span>
                      </span>
                    </Link>
                    <CadenceChip status={p.status} dueIn={p.dueIn} />
                    <LogTouchButton personId={p._id} lockPerson iconOnly variant="ghost" label={`Log touch with ${p.name}`} />
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Deals"
            icon={Briefcase}
            action={
              <button onClick={() => setNewDeal(true)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Plus className="h-3.5 w-3.5" /> New deal
              </button>
            }
          >
            {data.deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deals yet.</p>
            ) : (
              <div className="-mx-2 divide-y divide-border/60">
                {data.deals.map((d) => (
                  <button key={d._id} onClick={() => setDealId(d._id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-accent/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {isOpenStage(d.stage) && d.nextStep ? `${d.nextStep}${d.nextStepDate ? ` · ${relDay(d.nextStepDate, today)}` : ""}` : d.lostReason ?? ""}
                      </p>
                    </div>
                    <StageChip stage={d.stage} />
                    <span className="w-16 shrink-0 text-right text-xs tabular-nums">{d.value ? fmtMoney(d.value, currency, true) : "—"}</span>
                  </button>
                ))}
              </div>
            )}
          </Section>

          {data.projects.length > 0 && (
            <Section title="Delivery projects" icon={FolderKanban}>
              <div className="space-y-2">
                {data.projects.map((p) => (
                  <Link key={p._id} href={`/projects/${p._id}`} className="block rounded-lg border border-border p-3 transition hover:border-ring/60">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{p.title}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {p.taskTotal ? `${p.taskDone}/${p.taskTotal} tasks · ` : ""}
                        {p.progress}%
                      </span>
                    </div>
                    <Bar value={p.progress} tone={p.status === "completed" ? "success" : p.status === "blocked" ? "warning" : "primary"} className="mt-2" />
                  </Link>
                ))}
              </div>
            </Section>
          )}

          <Section
            title="Commitments"
            icon={HandCoins}
            action={
              <button onClick={() => setCommit(true)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            }
          >
            <CommitmentList items={openCommits} today={today} showDirection empty="No open promises." />
          </Section>

          <Section title="Timeline" icon={MessagesSquare} action={<LogTouchButton companyId={id} defaultKind="email" />}>
            <InteractionTimeline items={data.interactions} today={today} showPerson empty="No touches with this account yet." />
          </Section>
        </div>
      </div>

      <DealDrawer dealId={dealId} onClose={() => setDealId(null)} />
      <DealDialog open={newDeal} onClose={() => setNewDeal(false)} defaults={{ companyName: c.name, title: c.name }} />
      <PersonDialog open={addPerson} onClose={() => setAddPerson(false)} defaults={{ companyName: c.name, relation: c.relationship === "customer" ? "customer" : "lead" }} />
      <CommitmentDialog open={commit} onClose={() => setCommit(false)} defaults={{ companyId: id }} />
    </PageShell>
  );
}
