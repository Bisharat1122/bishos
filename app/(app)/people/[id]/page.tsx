"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Briefcase, Building2, ExternalLink, HandCoins, ListChecks, Mail, MessagesSquare, Phone, Plus, StickyNote, Trash2, UserRound, Wand2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Avatar, Chip, EmptyHint, Field, PageShell, Section, Segmented, Select, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { relDay, useToday } from "@/lib/day";
import { LogTouchButton } from "@/components/sales/LogTouch";
import { InteractionTimeline } from "@/components/sales/InteractionTimeline";
import { CommitmentDialog, CommitmentList } from "@/components/sales/Commitments";
import { DealDrawer } from "@/components/sales/DealDrawer";
import { DealDialog } from "@/components/sales/DealDialog";
import { RouteConversationDialog } from "@/components/sales/RouteConversationDialog";
import { BlurInput, BlurTextArea, FieldGroup } from "@/components/sales/fields";
import { RowMenu } from "@/components/sales/Menu";
import { CadenceChip, RelationChip, StageChip } from "@/components/sales/chips";
import { CADENCES, RELATIONS, SOURCE_CHANNELS, agoLabel, cadenceLabel, errMsg, fmtMoney, isOpenStage, type Relation, type Tier } from "@/components/sales/meta";

export default function PersonPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"people">;
  const router = useRouter();
  const today = useToday();
  const data = useQuery(api.people.get, { id, today });
  const companies = useQuery(api.people.companies, {});
  const options = useQuery(api.deals.options, {});
  const update = useMutation(api.people.update);
  const remove = useMutation(api.people.remove);

  const [dealId, setDealId] = useState<Id<"deals"> | null>(null);
  const [newDeal, setNewDeal] = useState(false);
  const [commit, setCommit] = useState(false);
  const [routing, setRouting] = useState(false);

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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
          <div className="skeleton h-96" />
          <div className="space-y-4">
            <div className="skeleton h-40" />
            <div className="skeleton h-64" />
          </div>
        </div>
      </PageShell>
    );
  }
  if (data === null) {
    return (
      <PageShell title="Person not found">
        <EmptyHint
          icon={UserRound}
          title="This person doesn't exist anymore"
          action={
            <Link href="/people" className={buttonVariants({ variant: "outline" })}>
              Back to People
            </Link>
          }
        />
      </PageShell>
    );
  }

  const p = data.person;
  const currency = options?.currency ?? "USD";
  const openCommits = data.commitments.filter((c) => c.status === "open");
  const closedCommits = data.commitments.filter((c) => c.status !== "open");
  const openDeals = data.deals.filter((d) => isOpenStage(d.stage));
  const revenue = data.deals.filter((d) => d.stage === "won").reduce((s, d) => s + (d.value ?? 0), 0);
  const socialHref = p.social ? (/^https?:\/\//.test(p.social) ? p.social : `https://${p.social}`) : null;

  return (
    <PageShell
      title={
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={p.name} size={40} />
          <span className="truncate">{p.name}</span>
        </span>
      }
      subtitle={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {[p.title, p.companyName].filter(Boolean).join(" @ ") || "No title yet"}
          <RelationChip relation={p.relation} />
          {p.tier && <Chip tone={p.tier === "A" ? "default" : "muted"}>Tier {p.tier}</Chip>}
        </span>
      }
      actions={
        <>
          <Link href="/people" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
            <ArrowLeft className="h-3.5 w-3.5" /> People
          </Link>
          <LogTouchButton personId={id} lockPerson variant="default" size="default" defaultKind="dm" />
          <button onClick={() => setRouting(true)} className={buttonVariants({ variant: "outline" })} title="Paste call notes for this person">
            <Wand2 className="h-4 w-4" /> <span className="hidden sm:inline">Route notes</span>
          </button>
          <RowMenu
            items={[
              { label: "New deal", icon: Briefcase, onSelect: () => setNewDeal(true) },
              { label: "Add commitment", icon: HandCoins, onSelect: () => setCommit(true) },
              {
                label: "Delete person",
                icon: Trash2,
                danger: true,
                onSelect: async () => {
                  if (!confirm(`Delete ${p.name}? Their deals, touches and commitments stay, unlinked.`)) return;
                  try {
                    await remove({ id });
                    toast(`${p.name} deleted`);
                    router.replace("/people");
                  } catch (e) {
                    toast(errMsg(e), { tone: "warning" });
                  }
                },
              },
            ]}
          />
        </>
      }
      headerExtra={
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5">
            <MessagesSquare className="h-3.5 w-3.5 text-muted-foreground" /> Last contact: <span className="font-medium">{agoLabel(p.daysSince)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5">
            {cadenceLabel(p.cadenceDays)} <CadenceChip status={p.status} dueIn={p.dueIn} />
          </span>
          {openDeals.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> {openDeals.length} open deal{openDeals.length > 1 ? "s" : ""}
            </span>
          )}
          {revenue > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-success-soft px-2.5 py-1.5 text-success">
              {fmtMoney(revenue, currency)} won
            </span>
          )}
          {openCommits.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5">
              <HandCoins className="h-3.5 w-3.5 text-muted-foreground" /> {openCommits.length} open promise{openCommits.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Profile */}
        <div className="space-y-4">
          <Section title="Profile" icon={UserRound}>
            <div className="space-y-3">
              <Field label="Name">
                <BlurInput value={p.name} onSave={(v) => save({ name: v })} />
              </Field>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
                <Field label="Company">
                  <BlurInput list="b1-p-companies" value={p.companyName ?? ""} placeholder="Company" onSave={(v) => save({ companyName: v })} />
                  <datalist id="b1-p-companies">
                    {(companies ?? []).map((c) => (
                      <option key={c._id} value={c.name} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Job title">
                  <BlurInput value={p.title ?? ""} placeholder="Founder" onSave={(v) => save({ title: v || null })} />
                </Field>
                <Field label="Relation">
                  <Select value={p.relation} onChange={(e) => void save({ relation: e.target.value as Relation }).catch(() => undefined)}>
                    {RELATIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Keep in touch">
                  <Select
                    value={p.cadenceDays ? String(p.cadenceDays) : ""}
                    onChange={(e) => void save({ cadenceDays: e.target.value ? Number(e.target.value) : null }).catch(() => undefined)}
                  >
                    <option value="">No cadence</option>
                    {CADENCES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                    {p.cadenceDays && !CADENCES.some((c) => c.value === p.cadenceDays) && <option value={p.cadenceDays}>Every {p.cadenceDays} days</option>}
                  </Select>
                </Field>
              </div>
              <FieldGroup label="Tier">
                <Segmented
                  size="sm"
                  value={p.tier ?? "none"}
                  onChange={(v) => void save({ tier: v === "none" ? null : (v as Tier) }).catch(() => undefined)}
                  options={[
                    { value: "none", label: "—" },
                    { value: "A", label: "A" },
                    { value: "B", label: "B" },
                    { value: "C", label: "C" },
                  ]}
                />
              </FieldGroup>
              <Field label={<span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> Email</span>}>
                <BlurInput type="email" value={p.email ?? ""} placeholder="name@company.com" onSave={(v) => save({ email: v || null })} />
              </Field>
              <Field label={<span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</span>}>
                <BlurInput value={p.phone ?? ""} placeholder="+92…" onSave={(v) => save({ phone: v || null })} />
              </Field>
              <Field
                label={
                  <span className="inline-flex items-center gap-1">
                    LinkedIn / social
                    {socialHref && (
                      <a href={socialHref} target="_blank" rel="noreferrer" className="text-foreground hover:underline" aria-label="Open profile">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </span>
                }
              >
                <BlurInput value={p.social ?? ""} placeholder="linkedin.com/in/…" onSave={(v) => save({ social: v || null })} />
              </Field>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
                <Field label="Source">
                  <Select value={p.source ?? ""} onChange={(e) => void save({ source: e.target.value || null }).catch(() => undefined)}>
                    <option value="">—</option>
                    {SOURCE_CHANNELS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                    {p.source && !SOURCE_CHANNELS.some((s) => s.value === p.source) && <option value={p.source}>{p.source}</option>}
                  </Select>
                </Field>
                <Field label="Tags" hint="Comma separated">
                  <BlurInput
                    value={(p.tags ?? []).join(", ")}
                    placeholder="founder, saas"
                    onSave={(v) => {
                      const tags = v.split(",").map((t) => t.trim()).filter(Boolean);
                      return save({ tags: tags.length ? tags : null });
                    }}
                  />
                </Field>
              </div>
              <Field label="How we met">
                <BlurInput value={p.howMet ?? ""} placeholder="Intro from…" onSave={(v) => save({ howMet: v || null })} />
              </Field>
              {p.companyId && (
                <Link href={`/companies/${p.companyId}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                  <Building2 className="h-3.5 w-3.5" /> Open {p.companyName}
                </Link>
              )}
            </div>
          </Section>
          <Section title="Notes" icon={StickyNote}>
            <BlurTextArea value={p.notes ?? ""} onSave={(v) => save({ notes: v || null })} placeholder="Family, interests, what they care about, what you promised to remember…" className="min-h-[120px]" />
          </Section>
        </div>

        {/* Activity */}
        <div className="min-w-0 space-y-4">
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
              <p className="text-sm text-muted-foreground">No deals with {p.name.split(" ")[0]} yet.</p>
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

          <Section
            title="Commitments"
            icon={HandCoins}
            hint="What you owe them, and what they owe you"
            action={
              <button onClick={() => setCommit(true)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            }
          >
            <CommitmentList items={openCommits} today={today} showPerson={false} showDirection empty="No open promises either way." />
            {closedCommits.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">{closedCommits.length} closed</summary>
                <CommitmentList items={closedCommits} today={today} showPerson={false} showDirection />
              </details>
            )}
          </Section>

          <Section title="Timeline" icon={MessagesSquare} action={<LogTouchButton personId={id} lockPerson defaultKind="dm" />}>
            <InteractionTimeline items={data.interactions} today={today} empty={`No touches with ${p.name.split(" ")[0]} yet. Log the first one.`} />
          </Section>

          {data.tasks.length > 0 && (
            <Section title="Linked tasks" icon={ListChecks}>
              <ul className="space-y-1.5 text-sm">
                {data.tasks.map((t) => (
                  <li key={t._id} className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", t.status === "done" ? "bg-success" : t.status === "in_progress" ? "bg-info" : "bg-muted-foreground/40")} />
                    <span className={cn("min-w-0 flex-1 truncate", t.status === "done" && "text-muted-foreground line-through")}>{t.title}</span>
                    {t.plannedFor && <span className="text-xs text-muted-foreground">{relDay(t.plannedFor, today)}</span>}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>

      <DealDrawer dealId={dealId} onClose={() => setDealId(null)} />
      <DealDialog open={newDeal} onClose={() => setNewDeal(false)} defaults={{ personId: id, companyName: p.companyName, title: p.companyName ?? p.name }} />
      <CommitmentDialog open={commit} onClose={() => setCommit(false)} defaults={{ personId: id }} lockPerson />
      <RouteConversationDialog open={routing} onClose={() => setRouting(false)} personId={id} />
    </PageShell>
  );
}
