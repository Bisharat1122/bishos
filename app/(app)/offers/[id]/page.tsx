"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { ArrowLeft, Copy, Gift, Megaphone, Package, ShieldCheck, Tag, Trash2, Users, Wand2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Chip, EmptyHint, Field, InlineEdit, ListEditor, PageShell, Section, Segmented, Select, buttonVariants, cn } from "@/components/os/kit";
import { errorMessage, reward, toast } from "@/components/os/celebrate";
import { AiPanel } from "@/components/strategy/AiPanel";
import { MagicNameHelper } from "@/components/strategy/MagicNameHelper";
import { Menu } from "@/components/strategy/Menu";
import { AutoNumber, AutoText, Gauge, ScoreSlider } from "@/components/strategy/viz";
import {
  CAMPAIGN_STATUS,
  DEFAULT_SCORES,
  OFFER_STATUS,
  PRICING_MODELS,
  STAGE_LABEL,
  type Scores,
  fmtMoney,
  scoreLabel,
  scoreTone,
  valueRaw,
  valueScore,
} from "@/components/strategy/lib";
import { useToday } from "@/lib/day";

type Status = "draft" | "testing" | "live" | "retired";
type UpdateArgs = Omit<FunctionArgs<typeof api.offers.update>, "id">;

const LEVERS: { key: keyof Scores; label: string; invert?: boolean; fix: string }[] = [
  { key: "dream", label: "Dream outcome", fix: "Make the result bigger and more specific: in their words, with a number." },
  { key: "likelihood", label: "Perceived likelihood", fix: "Add proof: case studies, testimonials, a guarantee, a pilot." },
  { key: "time", label: "Time delay", invert: true, fix: "Deliver a first win faster: a day-1 quick win or a kickoff deliverable." },
  { key: "effort", label: "Effort & sacrifice", invert: true, fix: "Do more for them: done-for-you, templates, fewer steps on their side." },
];

function weakest(s: Scores) {
  const bad = LEVERS.map((l) => ({ l, bad: l.invert ? s[l.key] - 1 : 10 - s[l.key] }));
  return bad.sort((a, b) => b.bad - a.bad)[0];
}

export default function OfferBuilderPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"offers">;
  const router = useRouter();
  const today = useToday();
  const data = useQuery(api.offers.get, { id });
  const update = useMutation(api.offers.update);
  const duplicate = useMutation(api.offers.duplicate);
  const remove = useMutation(api.offers.remove);
  const improve = useAction(api.aiStrategy.improveOffer);

  // Sliders edit a local copy (live gauge); the server copy wins unless dragging.
  const [scores, setScores] = useState<Scores>(DEFAULT_SCORES);
  const scoresRef = useRef(scores);
  scoresRef.current = scores;
  const dragging = useRef(false);
  const serverScores = JSON.stringify(data?.offer?.scores ?? DEFAULT_SCORES);
  useEffect(() => {
    if (!dragging.current) setScores(JSON.parse(serverScores) as Scores);
  }, [serverScores]);

  if (data === undefined) {
    return (
      <PageShell title={<span className="skeleton inline-block h-7 w-56" />} icon={Package}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <div className="skeleton h-40" />
            <div className="skeleton h-72" />
          </div>
          <div className="skeleton h-80" />
        </div>
      </PageShell>
    );
  }
  if (data === null) {
    return (
      <PageShell title="Offer not found" icon={Package}>
        <EmptyHint
          title="This offer doesn't exist (or was deleted)."
          action={
            <Link href="/offers" className={buttonVariants()}>
              Back to offers
            </Link>
          }
        />
      </PageShell>
    );
  }

  const { offer, currency, stats } = data;
  const score = valueScore(scores);
  const save = (patch: UpdateArgs) =>
    update({ id, ...patch }).catch((err: unknown) => toast(errorMessage(err, "Could not save"), { tone: "warning" }));

  const setStatus = async (status: Status) => {
    try {
      const res = await update({ id, status, date: today });
      if (res?.wentLive) reward("Offer is live. Go sell it!", res.xp, true);
      else toast(`Status: ${OFFER_STATUS[status].label}`);
    } catch (err) {
      toast(errorMessage(err, "Could not change the status"), { tone: "warning" });
    }
  };

  const commitScores = () => {
    if (!dragging.current) return;
    dragging.current = false;
    void save({ scores: scoresRef.current });
  };
  const w = weakest(scores);

  const scoreCard = (
    <Section title="Value score" icon={Wand2} hint="(dream × likelihood) ÷ (time × effort), log-scaled">
      <div className="flex flex-col items-center">
        <Gauge value={score} tone={scoreTone(score)} size={210} label={scoreLabel(score)} sub={`raw value ${valueRaw(scores).toFixed(2)}×`} />
      </div>
      <div className="mt-4 rounded-lg bg-muted/60 p-3 text-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Biggest lever</p>
        <p className="mt-1 font-medium">{w.l.label}</p>
        <p className="mt-0.5 text-muted-foreground">{w.l.fix}</p>
      </div>
    </Section>
  );

  const resultsCard = (
    <Section
      title="Results"
      icon={Tag}
      action={
        <Link href="/pipeline" className="text-xs font-medium text-muted-foreground hover:text-foreground">
          Pipeline →
        </Link>
      }
    >
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-semibold tabular-nums">{stats.dealCount}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Deals</div>
        </div>
        <div>
          <div className="text-lg font-semibold tabular-nums">{stats.wonCount}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Won</div>
        </div>
        <div>
          <div className={cn("text-lg font-semibold tabular-nums", stats.revenue > 0 && "text-success")}>{fmtMoney(stats.revenue, currency, { compact: true })}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Revenue</div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {stats.openCount} open · {fmtMoney(stats.openValue, currency)} in pipeline{stats.winRate != null ? ` · ${stats.winRate}% win rate (all time)` : ""}
      </p>
      {data.deals.length > 0 ? (
        <ul className="mt-3 divide-y divide-border">
          {data.deals.map((d) => (
            <li key={d._id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <Link href={`/pipeline?deal=${d._id}`} className="min-w-0 truncate hover:underline">
                {d.title}
              </Link>
              <span className="flex shrink-0 items-center gap-1.5">
                {d.value != null && <span className="text-xs tabular-nums text-muted-foreground">{fmtMoney(d.value, currency)}</span>}
                <Chip tone={d.stage === "won" ? "success" : d.stage === "lost" || d.stage === "unqualified" ? "muted" : "info"}>
                  {STAGE_LABEL[d.stage] ?? d.stage}
                </Chip>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Link deals to this offer from the pipeline to see what it sells.</p>
      )}
      {data.campaigns.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Megaphone className="h-3.5 w-3.5" /> Campaigns promoting it
          </p>
          <ul className="space-y-1">
            {data.campaigns.map((c) => (
              <li key={c._id}>
                <Link href={`/campaigns/${c._id}`} className="flex items-center justify-between gap-2 rounded-md px-1 py-1 text-sm hover:bg-accent">
                  <span className="truncate">{c.name}</span>
                  <Chip tone={CAMPAIGN_STATUS[c.status].tone}>{CAMPAIGN_STATUS[c.status].label}</Chip>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );

  return (
    <PageShell
      title={
        <InlineEdit value={offer.name} onSave={(v) => v.trim() && void save({ name: v })} className="-ml-1 text-2xl font-semibold tracking-tight" />
      }
      icon={Package}
      subtitle={
        <Link href="/offers" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> All offers
        </Link>
      }
      actions={
        <>
          <Segmented
            size="sm"
            value={offer.status}
            onChange={(s) => void setStatus(s)}
            options={(["draft", "testing", "live", "retired"] as Status[]).map((s) => ({ value: s, label: OFFER_STATUS[s].label }))}
          />
          <Menu
            items={[
              {
                label: "Duplicate",
                icon: Copy,
                onClick: async () => {
                  try {
                    const nid = await duplicate({ id });
                    toast("Duplicated as a draft", { tone: "success" });
                    router.push(`/offers/${nid}`);
                  } catch (err) {
                    toast(errorMessage(err, "Could not duplicate"), { tone: "warning" });
                  }
                },
              },
              {
                label: "Delete offer",
                icon: Trash2,
                danger: true,
                onClick: async () => {
                  if (!confirm(`Delete "${offer.name}"? Linked deals and campaigns are kept but unlinked.`)) return;
                  try {
                    await remove({ id });
                    toast("Offer deleted");
                    router.replace("/offers");
                  } catch (err) {
                    toast(errorMessage(err, "Could not delete the offer"), { tone: "warning" });
                  }
                },
              },
            ]}
          />
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <div className="lg:hidden">{scoreCard}</div>

          <Section title="1 · Who it's for & the problem" icon={Users}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ideal customer (ICP)" hint="Who has the problem worst and can pay?">
                <AutoText multiline rows={3} value={offer.icp} onSave={(v) => void save({ icp: v || null })} placeholder="B2B agency owners, 5–20 staff, referrals drying up" />
              </Field>
              <Field label="The painful problem" hint="What keeps them up at night, in their words">
                <AutoText multiline rows={3} value={offer.problem} onSave={(v) => void save({ problem: v || null })} placeholder="Pipeline is feast-or-famine; no outbound system" />
              </Field>
            </div>
          </Section>

          <Section title="2 · Value equation" icon={Wand2} hint="Score each lever honestly from 1–10. The gauge updates live.">
            <div className="space-y-5">
              {(
                [
                  { l: LEVERS[0], field: "dreamOutcome" as const, label: "Dream outcome", ph: "Book 10 qualified sales calls a month without hiring an SDR", hint: "Higher = a bigger, more desirable result" },
                  { l: LEVERS[1], field: "proof" as const, label: "Proof & perceived likelihood", ph: "3 case studies, 40+ calls booked for X, money-back pilot", hint: "Higher = they believe it will work for them" },
                  { l: LEVERS[2], field: "timeToResult" as const, label: "Time to result", ph: "First booked call within 14 days", hint: "Higher = slower (bad)" },
                  { l: LEVERS[3], field: "effortRemoved" as const, label: "Effort & sacrifice removed", ph: "We write the scripts, build the list and run the sequences", hint: "Higher = more work for them (bad)" },
                ]
              ).map(({ l, field, label, ph, hint }) => (
                <div key={l.key} className={cn("grid gap-3 rounded-lg p-3 sm:grid-cols-[220px_minmax(0,1fr)]", w.l.key === l.key ? "bg-warning-soft/60" : "bg-muted/40")}>
                  <ScoreSlider
                    label={l.label}
                    hint={hint}
                    value={scores[l.key]}
                    invert={l.invert}
                    onChange={(v) => {
                      dragging.current = true;
                      setScores((s) => ({ ...s, [l.key]: v }));
                    }}
                    onCommit={commitScores}
                  />
                  <Field label={label}>
                    <AutoText multiline rows={2} value={offer[field]} onSave={(v) => void save({ [field]: v || null } as UpdateArgs)} placeholder={ph} />
                  </Field>
                </div>
              ))}
            </div>
          </Section>

          <Section title="3 · The stack" icon={Gift} hint="What they get, the bonuses that kill objections, and the risk reversal.">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Deliverables</p>
                <ListEditor numbered items={offer.deliverables ?? []} onChange={(next) => void save({ deliverables: next })} placeholder="Add a deliverable and press Enter" />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Bonuses</p>
                <ListEditor items={offer.bonuses ?? []} onChange={(next) => void save({ bonuses: next })} placeholder="Add a bonus (one per objection)" />
              </div>
            </div>
            <div className="mt-4">
              <Field label="Guarantee" hint="Unconditional, conditional, or performance-based">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-2 h-4 w-4 shrink-0 text-success" />
                  <AutoText multiline rows={2} value={offer.guarantee} onSave={(v) => void save({ guarantee: v || null })} placeholder="5 booked calls in 30 days or we work free until you get them" />
                </div>
              </Field>
            </div>
          </Section>

          <Section title="4 · Price, urgency & scarcity" icon={Tag}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`Price (${currency})`}>
                <AutoNumber value={offer.price} onSave={(v) => void save({ price: v })} placeholder="2500" min={0} />
              </Field>
              <Field label="Pricing model">
                <Select value={offer.pricingModel ?? ""} onChange={(e) => void save({ pricingModel: e.target.value || null })}>
                  <option value="">Choose…</option>
                  {PRICING_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  {offer.pricingModel && !PRICING_MODELS.includes(offer.pricingModel) && <option value={offer.pricingModel}>{offer.pricingModel}</option>}
                </Select>
              </Field>
              <Field label="Urgency & scarcity" hint="Real limits only: cohorts, capacity, deadlines, price rises" className="sm:col-span-2">
                <AutoText multiline rows={2} value={offer.urgency} onSave={(v) => void save({ urgency: v || null })} placeholder="Only 3 founding clients this quarter; founding price ends Nov 30" />
              </Field>
            </div>
          </Section>

          <Section title="5 · MAGIC name" icon={Wand2} hint="Magnet · Avatar · Goal · Interval · Container">
            <MagicNameHelper
              magic={offer.magic}
              currentName={offer.name}
              onSave={(m) => void save({ magic: m })}
              onUseName={(n) => {
                void save({ name: n });
                toast("Offer renamed", { tone: "success", sub: n });
              }}
            />
          </Section>

          <AiPanel
            title="Improve this offer"
            hint="AI suggestions per lever. Nothing changes until you apply it."
            cta="Suggest improvements"
            run={async () => (await improve({ id })).text}
            onApply={(text) => update({ id, notes: [offer.notes, `--- AI suggestions (${today}) ---\n${text}`].filter(Boolean).join("\n\n") })}
            applyLabel="Add to notes"
          />

          <Section title="Notes">
            <AutoText multiline rows={6} value={offer.notes} onSave={(v) => void save({ notes: v || null })} placeholder="Objections heard, positioning ideas, test results…" />
          </Section>

          <div className="lg:hidden">{resultsCard}</div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-5">
            {scoreCard}
            {resultsCard}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
