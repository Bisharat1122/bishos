"use client";

/**
 * Deal drawer: edit everything — next step, contact, value, qualification,
 * source, offer, campaign, notes — plus the touch timeline, commitments,
 * linked tasks, delivery project, and won / lost actions.
 */

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowUpRight,
  Building2,
  Check,
  CircleDot,
  FolderKanban,
  HandCoins,
  ListChecks,
  MessagesSquare,
  Plus,
  RotateCcw,
  StickyNote,
  Target,
  Trash2,
  Trophy,
  XCircle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Avatar, Bar, Chip, Drawer, Field, Select, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { relDay, useToday } from "@/lib/day";
import { PersonPicker } from "./PersonPicker";
import { LogTouchButton } from "./LogTouch";
import { InteractionTimeline } from "./InteractionTimeline";
import { CommitmentDialog, CommitmentList } from "./Commitments";
import { DeliveryProjectDialog, useDealMover } from "./DealMove";
import { FlagChips } from "./DealCard";
import { BlurInput, BlurTextArea } from "./fields";
import { Portal } from "./Portal";
import { OPEN_STAGES, SOURCE_CHANNELS, STAGE_META, errMsg, fmtMoney, isOpenStage, type Stage } from "./meta";

const QUAL: { key: "pain" | "budget" | "decisionMaker" | "timeline"; label: string; placeholder: string }[] = [
  { key: "pain", label: "Pain", placeholder: "What hurts, in their words?" },
  { key: "budget", label: "Budget", placeholder: "Range they confirmed" },
  { key: "decisionMaker", label: "Decision-maker", placeholder: "Who signs? Who else weighs in?" },
  { key: "timeline", label: "Timeline", placeholder: "When do they need it live?" },
];

function Block({ title, icon: Icon, action, children }: { title: string; icon: typeof Target; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DealDrawer({ dealId, onClose }: { dealId: Id<"deals"> | null; onClose: () => void }) {
  const today = useToday();
  const data = useQuery(api.deals.get, dealId ? { id: dealId, today } : "skip");
  const opts = useQuery(api.deals.options, {});
  const companies = useQuery(api.people.companies, {});
  const update = useMutation(api.deals.update);
  const remove = useMutation(api.deals.remove);
  const mover = useDealMover();
  const [commitOpen, setCommitOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);

  const save = async (patch: Omit<Parameters<typeof update>[0], "id">) => {
    if (!dealId) return;
    try {
      await update({ id: dealId, date: today, ...patch });
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
      throw e;
    }
  };

  const deal = data?.deal;
  const currency = opts?.currency ?? "USD";
  const open = deal ? isOpenStage(deal.stage) : false;
  const stageIdx = deal ? OPEN_STAGES.indexOf(deal.stage) : -1;

  const footer = deal ? (
    <div className="flex flex-wrap items-center gap-2">
      {open ? (
        <>
          <button onClick={() => mover.request(deal, "won")} className={buttonVariants({ size: "sm" })}>
            <Trophy className="h-3.5 w-3.5" /> Won
          </button>
          <button onClick={() => mover.request(deal, "lost")} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <XCircle className="h-3.5 w-3.5" /> Lost
          </button>
          <button onClick={() => mover.request(deal, "unqualified")} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Unqualified
          </button>
        </>
      ) : (
        <button onClick={() => mover.request(deal, deal.stage === "won" ? "verbal" : "contacted")} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <RotateCcw className="h-3.5 w-3.5" /> Reopen
        </button>
      )}
      <button
        onClick={async () => {
          if (!confirm(`Delete "${deal.title}"? Touches and commitments stay, unlinked.`)) return;
          try {
            await remove({ id: deal._id });
            toast("Deal deleted");
            onClose();
          } catch (e) {
            toast(errMsg(e), { tone: "warning" });
          }
        }}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "ml-auto text-muted-foreground hover:text-danger")}
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
    </div>
  ) : null;

  return (
    <Drawer open={!!dealId} onClose={onClose} width="max-w-2xl" title={deal?.title ?? "Deal"} footer={footer}>
      {data === undefined ? (
        <div className="space-y-3">
          <div className="skeleton h-10" />
          <div className="skeleton h-24" />
          <div className="skeleton h-40" />
        </div>
      ) : data === null || !deal ? (
        <p className="text-sm text-muted-foreground">This deal no longer exists.</p>
      ) : (
        <div className="space-y-6">
          {/* Title + stage + value */}
          <div className="space-y-3">
            <BlurInput value={deal.title} onSave={(v) => save({ title: v })} className="h-10 text-base font-semibold" aria-label="Deal name" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
              <Field label="Stage">
                <Select value={deal.stage} onChange={(e) => mover.request(deal, e.target.value as Stage)}>
                  {(Object.keys(STAGE_META) as Stage[]).map((s) => (
                    <option key={s} value={s}>
                      {STAGE_META[s].label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={`Value (${currency})`}>
                <BlurInput
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={deal.value ? String(deal.value) : ""}
                  placeholder="0"
                  onSave={(v) => save({ value: v ? Number(v) : null })}
                />
              </Field>
            </div>
            {/* stage stepper */}
            {open && (
              <div className="flex items-center gap-1" aria-label="Stage progress">
                {OPEN_STAGES.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    title={`${STAGE_META[s].label}: ${STAGE_META[s].hint}`}
                    aria-label={`Move to ${STAGE_META[s].label}`}
                    aria-current={s === deal.stage ? "step" : undefined}
                    onClick={() => mover.request(deal, s)}
                    className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= stageIdx ? "bg-primary" : "bg-muted hover:bg-accent")}
                  />
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip tone={STAGE_META[deal.stage].tone}>
                <CircleDot />
                {STAGE_META[deal.stage].label}
              </Chip>
              {deal.flags.open && <Chip tone="muted">{deal.flags.stageDays}d in stage</Chip>}
              {deal.stage === "won" && deal.closedDate && <Chip tone="success">Won {relDay(deal.closedDate, today)}</Chip>}
              {deal.value ? <Chip tone="outline">{fmtMoney(deal.value, currency)}</Chip> : null}
              <FlagChips flags={deal.flags} />
            </div>
            {(deal.stage === "lost" || deal.stage === "unqualified") && (
              <Field label="Why it didn't close">
                <BlurInput value={deal.lostReason ?? ""} placeholder="Short reason" onSave={(v) => save({ lostReason: v || null })} />
              </Field>
            )}
          </div>

          {/* Next step */}
          {open && (
            <div className={cn("rounded-xl border p-3", deal.flags.overdue || deal.flags.noNextStep ? "border-warning/50 bg-warning-soft" : "border-border bg-muted/40")}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next step</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_170px]">
                <BlurInput value={deal.nextStep ?? ""} onSave={(v) => save({ nextStep: v || null })} placeholder={STAGE_META[deal.stage].nextStep} aria-label="Next step" />
                <BlurInput type="date" value={deal.nextStepDate ?? ""} onSave={(v) => save({ nextStepDate: v || null })} aria-label="Next step date" />
              </div>
              {deal.flags.overdue && <p className="mt-2 text-xs text-warning">This was due {relDay(deal.nextStepDate!, today).toLowerCase()}. Do it, or pick a new date.</p>}
            </div>
          )}

          {/* Contact */}
          <Block title="Contact" icon={Building2}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Person">
                <PersonPicker value={deal.personId ?? null} onChange={(id) => void save({ personId: id ?? null }).catch(() => undefined)} />
              </Field>
              <Field label="Company">
                <BlurInput
                  list="b1-drawer-companies"
                  value={deal.companyName ?? ""}
                  placeholder="Company"
                  onSave={(v) => save({ companyName: v })}
                />
                <datalist id="b1-drawer-companies">
                  {(companies ?? []).map((c) => (
                    <option key={c._id} value={c.name} />
                  ))}
                </datalist>
              </Field>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {deal.personId && (
                <Link href={`/people/${deal.personId}`} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 hover:bg-accent">
                  <Avatar name={deal.personName ?? "?"} size={16} /> {deal.personName} <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
              {deal.companyId && (
                <Link href={`/companies/${deal.companyId}`} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 hover:bg-accent">
                  <Building2 className="h-3 w-3" /> {deal.companyName} <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </Block>

          {/* Qualification */}
          <Block title="Qualification" icon={ListChecks}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {QUAL.map((q) => {
                const val = deal.qualification?.[q.key] ?? "";
                return (
                  <Field
                    key={q.key}
                    label={
                      <span className="inline-flex items-center gap-1">
                        {val ? <Check className="h-3 w-3 text-success" /> : <span className="size-3 rounded-full border border-muted-foreground/40" />} {q.label}
                      </span>
                    }
                  >
                    <BlurInput value={val} placeholder={q.placeholder} onSave={(v) => save({ qualification: { [q.key]: v.trim() } })} />
                  </Field>
                );
              })}
            </div>
          </Block>

          {/* Source, offer, campaign */}
          <Block title="Source & offer" icon={Target}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Source channel">
                <Select value={deal.sourceChannel ?? ""} onChange={(e) => void save({ sourceChannel: e.target.value || null }).catch(() => undefined)}>
                  <option value="">—</option>
                  {SOURCE_CHANNELS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Offer">
                <Select
                  value={deal.offerId ?? ""}
                  onChange={(e) => void save({ offerId: (e.target.value || null) as Id<"offers"> | null }).catch(() => undefined)}
                >
                  <option value="">—</option>
                  {(opts?.offers ?? []).map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.name}
                      {o.status === "retired" ? " (retired)" : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Campaign">
                <Select
                  value={deal.campaignId ?? ""}
                  onChange={(e) => void save({ campaignId: (e.target.value || null) as Id<"campaigns"> | null }).catch(() => undefined)}
                >
                  <option value="">—</option>
                  {(opts?.campaigns ?? []).map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Block>

          {/* Delivery project */}
          {deal.stage === "won" && (
            <Block title="Delivery" icon={FolderKanban}>
              {data.project ? (
                <Link href={`/projects/${data.project._id}`} className="block rounded-lg border border-border p-3 transition hover:border-ring/60">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{data.project.title}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{data.project.progress}%</span>
                  </div>
                  <Bar value={data.project.progress} tone="success" className="mt-2" />
                </Link>
              ) : (
                <button onClick={() => setProjectOpen(true)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <FolderKanban className="h-3.5 w-3.5" /> Create delivery project
                </button>
              )}
            </Block>
          )}

          {/* Timeline */}
          <Block
            title={`Touches (${data.interactions.length})`}
            icon={MessagesSquare}
            action={<LogTouchButton personId={deal.personId} dealId={deal._id} lockPerson={!!deal.personId} defaultKind="followup" />}
          >
            <InteractionTimeline items={data.interactions} today={today} showDeal={false} />
          </Block>

          {/* Commitments */}
          <Block
            title="Commitments"
            icon={HandCoins}
            action={
              <button onClick={() => setCommitOpen(true)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            }
          >
            <CommitmentList items={data.commitments} today={today} showDirection empty="No promises on this deal yet." />
          </Block>

          {data.tasks.length > 0 && (
            <Block title="Linked tasks" icon={ListChecks}>
              <ul className="space-y-1 text-sm">
                {data.tasks.map((t) => (
                  <li key={t._id} className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", t.status === "done" ? "bg-success" : t.status === "in_progress" ? "bg-info" : "bg-muted-foreground/40")} />
                    <span className={cn("min-w-0 flex-1 truncate", t.status === "done" && "text-muted-foreground line-through")}>{t.title}</span>
                    {t.plannedFor && <span className="text-xs text-muted-foreground">{relDay(t.plannedFor, today)}</span>}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {/* Notes */}
          <Block title="Notes" icon={StickyNote}>
            <BlurTextArea value={deal.notes ?? ""} onSave={(v) => save({ notes: v || null })} placeholder="Context, objections, what they care about…" />
          </Block>
        </div>
      )}
      {mover.node}
      {commitOpen && deal && (
        <Portal>
          <CommitmentDialog open onClose={() => setCommitOpen(false)} defaults={{ dealId: deal._id, personId: deal.personId ?? null }} />
        </Portal>
      )}
      {projectOpen && deal && (
        <Portal>
          <DeliveryProjectDialog deal={deal} onClose={() => setProjectOpen(false)} />
        </Portal>
      )}
    </Drawer>
  );
}
