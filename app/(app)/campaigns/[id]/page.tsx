"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { ArrowLeft, Clapperboard, Handshake, Lightbulb, Megaphone, RotateCcw, Target, Trash2, X, Zap } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Bar, Chip, EmptyHint, Field, InlineEdit, PageShell, Ring, Section, Segmented, Select, TextInput, buttonVariants, cn, toneForPct } from "@/components/os/kit";
import { errorMessage, reward, toast } from "@/components/os/celebrate";
import { diffDaysYmd, fmtYmd, relDay, useToday } from "@/lib/day";
import { AiPanel } from "@/components/strategy/AiPanel";
import { Menu } from "@/components/strategy/Menu";
import { AutoNumber, AutoText, ChipPicker, FieldGroup } from "@/components/strategy/viz";
import { CAMPAIGN_STATUS, CHANNELS, CONTENT_STAGE_LABEL, STAGE_LABEL, type CampaignStatus, fmtMoney, pct } from "@/components/strategy/lib";

type UpdateArgs = Omit<FunctionArgs<typeof api.campaigns.update>, "id">;
type ResultKey = "leads" | "conversations" | "deals" | "revenue";

export default function CampaignPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"campaigns">;
  const router = useRouter();
  const today = useToday();
  const data = useQuery(api.campaigns.get, { id });
  const offers = useQuery(api.offers.options);
  const update = useMutation(api.campaigns.update);
  const setStatus = useMutation(api.campaigns.setStatus);
  const setResult = useMutation(api.campaigns.setResult);
  const linkDeal = useMutation(api.campaigns.linkDeal);
  const linkContent = useMutation(api.campaigns.linkContent);
  const remove = useMutation(api.campaigns.remove);
  const ideas = useAction(api.aiStrategy.campaignIdeas);
  const [overriding, setOverriding] = useState<ResultKey | null>(null);

  if (data === undefined) {
    return (
      <PageShell title={<span className="skeleton inline-block h-7 w-56" />} icon={Megaphone}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="skeleton h-64" />
            <div className="skeleton h-56" />
          </div>
          <div className="skeleton h-72" />
        </div>
      </PageShell>
    );
  }
  if (data === null) {
    return (
      <PageShell title="Campaign not found" icon={Megaphone}>
        <EmptyHint
          title="This campaign doesn't exist (or was deleted)."
          action={
            <Link href="/campaigns" className={buttonVariants()}>
              Back to campaigns
            </Link>
          }
        />
      </PageShell>
    );
  }

  const { campaign: c, rollup, currency } = data;
  const save = (patch: UpdateArgs) =>
    update({ id, ...patch }).catch((err: unknown) => toast(errorMessage(err, "Could not save"), { tone: "warning" }));
  const fail = (fallback: string) => (err: unknown) => toast(errorMessage(err, fallback), { tone: "warning" });

  async function changeStatus(s: CampaignStatus) {
    try {
      const r = await setStatus({ id, status: s, date: today });
      if (s === "live" && r.xp) reward("Campaign is live. Make some noise!", r.xp, true);
      else if (s === "done" && r.xp) reward("Campaign wrapped. Write down what you learned.", r.xp);
      else toast(`Status: ${CAMPAIGN_STATUS[s].label}`);
    } catch (err) {
      fail("Could not change the status")(err);
    }
  }

  const rows: { key: ResultKey | "content"; label: string; target: number | undefined; result: number; auto: number; overridden: boolean; money?: boolean; hint: string }[] = [
    { key: "leads", label: "Leads", target: c.targets?.leads, result: rollup.results.leads, auto: rollup.auto.leads, overridden: rollup.overridden.leads, hint: "Deals linked to this campaign" },
    { key: "conversations", label: "Conversations", target: c.targets?.conversations, result: rollup.results.conversations, auto: rollup.auto.conversations, overridden: rollup.overridden.conversations, hint: "Linked deals that reached a booked call" },
    { key: "deals", label: "Deals won", target: c.targets?.deals, result: rollup.results.deals, auto: rollup.auto.deals, overridden: rollup.overridden.deals, hint: "Linked deals won" },
    { key: "revenue", label: "Revenue", target: c.revenueTarget, result: rollup.results.revenue, auto: rollup.auto.revenue, overridden: rollup.overridden.revenue, money: true, hint: "Value of linked deals won" },
    { key: "content", label: "Content published", target: c.contentTarget, result: rollup.published, auto: rollup.published, overridden: false, hint: `${rollup.content} pieces linked, ${rollup.published} published` },
  ];

  const setTarget = (key: ResultKey | "content", v: number | null) => {
    if (key === "revenue") return save({ revenueTarget: v });
    if (key === "content") return save({ contentTarget: v });
    const next = { ...(c.targets ?? {}) } as Record<string, number | undefined>;
    if (v == null) delete next[key];
    else next[key] = v;
    return save({ targets: next });
  };

  const days = c.startDate && c.endDate ? diffDaysYmd(c.startDate, c.endDate) + 1 : null;
  const dayN = c.startDate ? diffDaysYmd(c.startDate, today) + 1 : null;
  const leadsPct = c.targets?.leads ? pct(rollup.results.leads, c.targets.leads) : null;

  const summary = (
    <Section title="Scoreboard" icon={Target}>
      <div className="flex items-center gap-4">
        <Ring value={leadsPct ?? 0} size={76} stroke={8} tone={leadsPct == null ? "primary" : toneForPct(leadsPct)}>
          <div className="text-center leading-none">
            <div className="text-lg font-semibold tabular-nums">{rollup.results.leads}</div>
            <div className="text-[9px] uppercase tracking-wide text-muted-foreground">leads</div>
          </div>
        </Ring>
        <div className="min-w-0 space-y-1 text-sm">
          <p>
            <span className="font-semibold tabular-nums">{rollup.results.conversations}</span> conversations ·{" "}
            <span className="font-semibold tabular-nums">{rollup.results.deals}</span> won
          </p>
          <p className={cn("text-lg font-semibold tabular-nums", rollup.results.revenue > 0 && "text-success")}>{fmtMoney(rollup.results.revenue, currency)}</p>
          {days != null && dayN != null && (
            <p className="text-xs text-muted-foreground">
              {dayN < 1 ? `Starts ${relDay(c.startDate!, today)}` : dayN > days ? `Ended ${relDay(c.endDate!, today)}` : `Day ${dayN} of ${days}`}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
        <div>
          <div className="text-sm font-semibold tabular-nums">{fmtMoney(c.spend ?? 0, currency, { compact: true })}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Spend</div>
        </div>
        <div>
          <div className="text-sm font-semibold tabular-nums">{rollup.costPerLead != null ? fmtMoney(rollup.costPerLead, currency) : "—"}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Per lead</div>
        </div>
        <div>
          <div className={cn("text-sm font-semibold tabular-nums", rollup.roi != null && (rollup.roi >= 0 ? "text-success" : "text-danger"))}>
            {rollup.roi != null ? `${rollup.roi}%` : "—"}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">ROI</div>
        </div>
      </div>
      {c.budget ? (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Budget used</span>
            <span className="tabular-nums">
              {fmtMoney(c.spend ?? 0, currency)} / {fmtMoney(c.budget, currency)}
            </span>
          </div>
          <Bar value={pct(c.spend ?? 0, c.budget)} tone={(c.spend ?? 0) > c.budget ? "danger" : "primary"} />
        </div>
      ) : null}
    </Section>
  );

  return (
    <PageShell
      title={<InlineEdit value={c.name} onSave={(v) => v.trim() && void save({ name: v })} className="-ml-1 text-2xl font-semibold tracking-tight" />}
      icon={Megaphone}
      subtitle={
        <Link href="/campaigns" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> All campaigns
        </Link>
      }
      actions={
        <>
          <Segmented
            size="sm"
            value={c.status}
            onChange={(s) => void changeStatus(s)}
            options={(["idea", "planned", "live", "paused", "done"] as CampaignStatus[]).map((s) => ({ value: s, label: CAMPAIGN_STATUS[s].label }))}
          />
          <Menu
            items={[
              {
                label: "Delete campaign",
                icon: Trash2,
                danger: true,
                onClick: async () => {
                  if (!confirm(`Delete "${c.name}"? Linked deals and content are kept but unlinked.`)) return;
                  try {
                    await remove({ id });
                    toast("Campaign deleted");
                    router.replace("/campaigns");
                  } catch (err) {
                    fail("Could not delete the campaign")(err);
                  }
                },
              },
            ]}
          />
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <div className="lg:hidden">{summary}</div>

          {c.status === "done" && !c.learnings && (
            <div className="os-rise flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p>
                <span className="font-medium">This campaign is done.</span> Write 2–3 learnings below so the next one starts smarter.
              </p>
            </div>
          )}

          <Section title="Plan" icon={Megaphone}>
            <div className="space-y-4">
              <Field label="Objective">
                <AutoText multiline rows={2} value={c.objective} onSave={(v) => void save({ objective: v || null })} placeholder="One measurable goal, e.g. 10 discovery calls with agency owners" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label="Brand">
                  <Segmented
                    size="sm"
                    value={c.brand ?? "none"}
                    onChange={(b) => void save({ brand: b === "none" ? null : (b as "personal" | "company") })}
                    options={[
                      { value: "company", label: "Company" },
                      { value: "personal", label: "Personal" },
                      { value: "none", label: "—" },
                    ]}
                  />
                </FieldGroup>
                <Field
                  label={
                    <span className="flex items-center justify-between">
                      Offer
                      {data.offer && (
                        <Link href={`/offers/${data.offer._id}`} className="text-[11px] font-medium hover:text-foreground">
                          Open offer →
                        </Link>
                      )}
                    </span>
                  }
                >
                  <Select value={c.offerId ?? ""} onChange={(e) => void save({ offerId: e.target.value ? (e.target.value as Id<"offers">) : null })}>
                    <option value="">None</option>
                    {(offers ?? []).map((o) => (
                      <option key={o._id} value={o._id}>
                        {o.name}
                      </option>
                    ))}
                    {data.offer && !(offers ?? []).some((o) => o._id === data.offer!._id) && <option value={data.offer._id}>{data.offer.name}</option>}
                  </Select>
                </Field>
              </div>
              <FieldGroup label="Channels">
                <ChipPicker
                  options={[...CHANNELS, ...(c.channels ?? []).filter((x) => !CHANNELS.includes(x))]}
                  value={c.channels ?? []}
                  onChange={(channels) => void save({ channels })}
                />
              </FieldGroup>
              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="Start">
                  <TextInput type="date" value={c.startDate ?? ""} onChange={(e) => void save({ startDate: e.target.value || null })} />
                </Field>
                <Field label="End">
                  <TextInput type="date" value={c.endDate ?? ""} min={c.startDate} onChange={(e) => void save({ endDate: e.target.value || null })} />
                </Field>
                <Field label={`Budget (${currency})`}>
                  <AutoNumber value={c.budget} onSave={(v) => void save({ budget: v })} placeholder="0" min={0} />
                </Field>
                <Field label={`Spend (${currency})`}>
                  <AutoNumber value={c.spend} onSave={(v) => void save({ spend: v })} placeholder="0" min={0} />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Targets vs results" icon={Target} hint="Results roll up from linked deals and content (⚡). Override any number if you track it elsewhere.">
            <div className="divide-y divide-border">
              {rows.map((r) => {
                const p = r.target ? pct(r.result, r.target) : null;
                const fmt = (n: number) => (r.money ? fmtMoney(n, currency) : String(n));
                return (
                  <div key={r.key} className="grid grid-cols-[minmax(0,1fr)_96px] items-center gap-x-3 gap-y-1.5 py-3 sm:grid-cols-[150px_110px_minmax(0,1fr)_120px]">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{r.label}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{r.hint}</p>
                    </div>
                    <div className="sm:order-none">
                      <AutoNumber value={r.target ?? null} onSave={(v) => void setTarget(r.key, v)} placeholder="Target" ariaLabel={`${r.label} target`} className="h-8" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      {p != null ? (
                        <Bar value={p} tone={p >= 100 ? "success" : toneForPct(p) === "danger" ? "warning" : "primary"} height="h-2" />
                      ) : (
                        <div className="h-2 rounded-full bg-muted" />
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1.5 sm:col-span-1">
                      {overriding === r.key ? (
                        // Leave override mode on blur even when the value is unchanged (AutoNumber
                        // only calls onSave on a change, which used to leave the input stuck open).
                        <div onBlur={() => setOverriding(null)}>
                          <AutoNumber
                            autoFocus
                            value={r.result}
                            onSave={(v) => {
                              setOverriding(null);
                              setResult({ id, field: r.key as ResultKey, value: v }).catch(fail("Could not save"));
                            }}
                            ariaLabel={`${r.label} manual value`}
                            className="h-8 w-24"
                          />
                        </div>
                      ) : (
                        <>
                          {!r.overridden ? (
                            <Zap className="h-3.5 w-3.5 text-info" aria-label="Automatic" />
                          ) : (
                            <Chip tone="warning" title={`Auto value: ${fmt(r.auto)}`}>
                              Manual
                            </Chip>
                          )}
                          <button
                            type="button"
                            disabled={r.key === "content"}
                            onClick={() => setOverriding(r.key as ResultKey)}
                            title={r.key === "content" ? "Link content below" : "Override"}
                            className={cn("rounded-md px-1.5 py-0.5 text-sm font-semibold tabular-nums hover:bg-accent disabled:hover:bg-transparent", p != null && p >= 100 && "text-success")}
                          >
                            {fmt(r.result)}
                            {r.target ? <span className="font-normal text-muted-foreground"> / {fmt(r.target)}</span> : null}
                          </button>
                          {r.overridden && (
                            <button
                              type="button"
                              onClick={() => setResult({ id, field: r.key as ResultKey, value: null }).catch(fail("Could not reset"))}
                              title="Back to automatic"
                              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          <div className="grid gap-5 xl:grid-cols-2">
            <Section
              title={`Deals (${data.deals.length})`}
              icon={Handshake}
              action={
                <Link href="/pipeline" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  Pipeline →
                </Link>
              }
            >
              {data.deals.length ? (
                <ul className="divide-y divide-border">
                  {data.deals.map((d) => (
                    <li key={d._id} className="group flex items-center gap-2 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <Link href={`/pipeline?deal=${d._id}`} className="block truncate font-medium hover:underline">
                          {d.title}
                        </Link>
                        {d.nextStep && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            Next: {d.nextStep}
                            {d.nextStepDate ? ` · ${relDay(d.nextStepDate, today)}` : ""}
                          </p>
                        )}
                      </div>
                      {d.value != null && <span className="text-xs tabular-nums text-muted-foreground">{fmtMoney(d.value, currency, { compact: true })}</span>}
                      <Chip tone={d.stage === "won" ? "success" : d.stage === "lost" || d.stage === "unqualified" ? "muted" : "info"}>{STAGE_LABEL[d.stage] ?? d.stage}</Chip>
                      <button
                        type="button"
                        onClick={() => linkDeal({ id, dealId: d._id, link: false }).catch(fail("Could not unlink the deal"))}
                        aria-label="Unlink deal"
                        className="rounded p-1 text-muted-foreground opacity-60 hover:text-danger group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No deals yet. Link the deals this campaign creates so leads and revenue roll up.</p>
              )}
              {data.linkableDeals.length > 0 && (
                <Select
                  className="mt-3"
                  value=""
                  onChange={(e) => e.target.value && void linkDeal({ id, dealId: e.target.value as Id<"deals">, link: true }).catch(fail("Could not link the deal"))}
                  aria-label="Link a deal"
                >
                  <option value="">+ Link a deal…</option>
                  {data.linkableDeals.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.title} · {STAGE_LABEL[d.stage] ?? d.stage}
                    </option>
                  ))}
                </Select>
              )}
            </Section>

            <Section
              title={`Content (${data.content.length})`}
              icon={Clapperboard}
              action={
                <Link href="/content" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  Content Studio →
                </Link>
              }
            >
              {data.content.length ? (
                <ul className="divide-y divide-border">
                  {data.content.map((p) => (
                    <li key={p._id} className="group flex items-center gap-2 py-2 text-sm">
                      <Link href={`/content/${p._id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                        {p.title}
                      </Link>
                      {p.isHub && <Chip tone="sprint">Hub</Chip>}
                      <Chip tone={p.published ? "success" : "muted"}>{CONTENT_STAGE_LABEL[p.stage] ?? p.stage}</Chip>
                      <button
                        type="button"
                        onClick={() => linkContent({ id, pieceId: p._id, link: false }).catch(fail("Could not unlink the content"))}
                        aria-label="Unlink content"
                        className="rounded p-1 text-muted-foreground opacity-60 hover:text-danger group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Link the posts and videos that belong to this push.</p>
              )}
              {data.linkableContent.length > 0 && (
                <Select
                  className="mt-3"
                  value=""
                  onChange={(e) => e.target.value && void linkContent({ id, pieceId: e.target.value as Id<"contentPieces">, link: true }).catch(fail("Could not link the content"))}
                  aria-label="Link content"
                >
                  <option value="">+ Link a content piece…</option>
                  {data.linkableContent.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title} · {CONTENT_STAGE_LABEL[p.stage] ?? p.stage}
                    </option>
                  ))}
                </Select>
              )}
            </Section>
          </div>

          <Section title="Learnings" icon={Lightbulb} hint="What worked, what didn't, and what you'd do differently next time.">
            <AutoText
              multiline
              rows={5}
              value={c.learnings}
              onSave={(v) => {
                void save({ learnings: v || null });
                if (v.trim() && !c.learnings) toast("Learning captured", { tone: "success" });
              }}
              placeholder={"• LinkedIn DMs after a post converted 3× better than cold\n• Email subject with a number won\n• Next time: start the follow-up sequence on day 3"}
            />
          </Section>

          <Section title="Notes">
            <AutoText multiline rows={5} value={c.notes} onSave={(v) => void save({ notes: v || null })} placeholder="Messaging, assets, links, the angle…" />
          </Section>
        </div>

        <aside className="space-y-5">
          <div className="hidden lg:block">{summary}</div>
          <AiPanel
            title="Plays for this campaign"
            hint="Concrete moves for your channels and offer."
            cta="Suggest 5 plays"
            run={async () => {
              const r = await ideas({ campaignId: id });
              if (!r.ideas.length) return r.text;
              return r.ideas
                .map((i) => [`## ${i.name}`, i.channels.length ? `*${i.channels.join(" · ")}*` : "", i.angle, ...i.steps.map((s) => `- ${s}`)].filter(Boolean).join("\n"))
                .join("\n\n");
            }}
            onApply={(text) => update({ id, notes: [c.notes, `--- AI plays (${fmtYmd(today, { month: "short", day: "numeric" })}) ---\n${text}`].filter(Boolean).join("\n\n") })}
          />
        </aside>
      </div>
    </PageShell>
  );
}
