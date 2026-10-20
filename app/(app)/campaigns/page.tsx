"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { CalendarRange, Kanban as KanbanIcon, Megaphone, Plus, Sparkles } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Bar,
  Chip,
  Dialog,
  EmptyHint,
  Field,
  Kanban,
  PageShell,
  Segmented,
  Select,
  TextArea,
  TextInput,
  buttonVariants,
  type KanbanColumn,
} from "@/components/os/kit";
import { errorMessage, reward, toast } from "@/components/os/celebrate";
import { fmtYmd, useToday } from "@/lib/day";
import { CampaignTimeline } from "@/components/strategy/CampaignTimeline";
import { CampaignIdeasDialog } from "@/components/strategy/CampaignIdeasDialog";
import { CardButton, ChipPicker, FieldGroup, Kpi, NoSubmit } from "@/components/strategy/viz";
import { Menu } from "@/components/strategy/Menu";
import { CAMPAIGN_STATUS, CHANNELS, type CampaignStatus, fmtMoney, pct } from "@/components/strategy/lib";

type View = "board" | "timeline";

export default function CampaignsPage() {
  const router = useRouter();
  const today = useToday();
  const data = useQuery(api.campaigns.list);
  const offers = useQuery(api.offers.options);
  const create = useMutation(api.campaigns.create);
  const setStatus = useMutation(api.campaigns.setStatus);
  const [view, setView] = useState<View>("board");
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const blank = { name: "", objective: "", brand: "company" as "company" | "personal", channels: [] as string[], offerId: "", startDate: "", endDate: "", budget: "" };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  const items = data?.items ?? [];
  const currency = data?.currency ?? "USD";
  const live = items.filter((c) => c.status === "live");
  const leads = items.reduce((s, c) => s + c.rollup.results.leads, 0);
  const revenue = items.reduce((s, c) => s + c.rollup.results.revenue, 0);
  const spend = items.reduce((s, c) => s + (c.spend ?? 0), 0);
  const budget = items.reduce((s, c) => s + (c.budget ?? 0), 0);

  // Every status is a column (an empty Paused column must still accept drops).
  const STATUSES: CampaignStatus[] = ["idea", "planned", "live", "paused", "done"];
  const columns: KanbanColumn[] = STATUSES.map((s) => ({ key: s, label: CAMPAIGN_STATUS[s].label, dot: CAMPAIGN_STATUS[s].dot }));

  async function move(id: Id<"campaigns">, status: CampaignStatus, name: string) {
    try {
      const r = await setStatus({ id, status, date: today });
      if (status === "live" && r.xp) reward(`${name} is live`, r.xp, true);
      else if (status === "done" && r.xp) reward(`${name} wrapped. Capture the learnings!`, r.xp);
    } catch (err) {
      toast(errorMessage(err, "Could not move"), { tone: "warning" });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast("Name the campaign", { tone: "warning" });
    setBusy(true);
    try {
      const b = form.budget.trim() ? Number(form.budget) : undefined;
      const id = await create({
        name: form.name,
        objective: form.objective.trim() || undefined,
        brand: form.brand,
        channels: form.channels,
        offerId: form.offerId ? (form.offerId as Id<"offers">) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        budget: b != null && Number.isFinite(b) ? b : undefined,
        status: form.startDate ? "planned" : "idea",
      });
      setOpen(false);
      setForm(blank);
      router.push(`/campaigns/${id}`);
    } catch (err) {
      toast(errorMessage(err, "Could not create"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      title="Campaigns"
      icon={Megaphone}
      subtitle="Objective → channels → offer → results. Every campaign earns its learnings."
      actions={
        <>
          <button type="button" onClick={() => setIdeasOpen(true)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Sparkles className="h-4 w-4" />
            AI ideas
          </button>
          <button type="button" onClick={() => setOpen(true)} className={buttonVariants({ size: "sm" })}>
            <Plus className="h-4 w-4" />
            New campaign
          </button>
        </>
      }
    >
      {data === undefined ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24" />
            ))}
          </div>
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-72 w-72 shrink-0" />
            ))}
          </div>
        </div>
      ) : !items.length ? (
        <EmptyHint
          icon={Megaphone}
          title="Plan your first campaign"
          hint="A campaign is a focused push: one objective, a few channels, one offer and a deadline. Results roll up from the deals and content you link."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => setOpen(true)} className={buttonVariants()}>
                <Plus className="h-4 w-4" />
                New campaign
              </button>
              <button type="button" onClick={() => setIdeasOpen(true)} className={buttonVariants({ variant: "outline" })}>
                <Sparkles className="h-4 w-4" />
                Get AI ideas
              </button>
            </div>
          }
          className="py-16"
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Live now" value={live.length} tone={live.length ? "success" : undefined} sub={`${items.filter((c) => c.status === "planned").length} planned`} />
            <Kpi label="Leads generated" value={leads} sub="Deals linked to campaigns" />
            <Kpi label="Revenue attributed" value={fmtMoney(revenue, currency)} tone={revenue > 0 ? "success" : undefined} sub="Won deals from campaigns" />
            <Kpi
              label="Spend"
              value={fmtMoney(spend, currency)}
              sub={budget ? `${pct(spend, budget)}% of ${fmtMoney(budget, currency)} budget` : "No budgets set"}
              tone={budget && spend > budget ? "warning" : undefined}
            />
          </div>

          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "board", label: "Board", icon: KanbanIcon },
              { value: "timeline", label: "Timeline", icon: CalendarRange },
            ]}
          />

          {view === "board" ? (
            <Kanban
              columns={columns}
              items={items}
              columnOf={(c) => c.status}
              onMove={(c, to) => void move(c._id, to as CampaignStatus, c.name)}
              renderCard={(c) => {
                const t = c.targets?.leads;
                return (
                  <CardButton onClick={() => router.push(`/campaigns/${c._id}`)} label={`Open campaign: ${c.name}`} className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-snug">{c.name}</p>
                      <div className="-mr-1.5 -mt-1 flex shrink-0 items-center gap-1">
                        {c.brand && <Chip tone="outline">{c.brand === "personal" ? "Personal" : "Company"}</Chip>}
                        {/* Non-drag way to change status (touch screens, keyboard). */}
                        <Menu
                          label={`Move ${c.name}`}
                          items={STATUSES.filter((s) => s !== c.status).map((s) => ({
                            label: `Move to ${CAMPAIGN_STATUS[s].label}`,
                            onClick: () => void move(c._id, s, c.name),
                          }))}
                        />
                      </div>
                    </div>
                    {c.objective && <p className="line-clamp-2 text-xs text-muted-foreground">{c.objective}</p>}
                    {(c.channels?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.channels!.slice(0, 3).map((ch) => (
                          <Chip key={ch}>{ch}</Chip>
                        ))}
                        {c.channels!.length > 3 && <Chip>+{c.channels!.length - 3}</Chip>}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {c.startDate ? fmtYmd(c.startDate, { month: "short", day: "numeric" }) : "No dates"}
                        {c.endDate ? ` → ${fmtYmd(c.endDate, { month: "short", day: "numeric" })}` : ""}
                      </span>
                      {c.offerName && <span className="truncate pl-2">{c.offerName}</span>}
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                        <span>
                          {c.rollup.results.leads} leads{t ? ` / ${t}` : ""} · {c.rollup.results.deals} won
                        </span>
                        {c.rollup.results.revenue > 0 && <span className="font-medium text-success">{fmtMoney(c.rollup.results.revenue, currency, { compact: true })}</span>}
                      </div>
                      {t ? <Bar value={pct(c.rollup.results.leads, t)} tone={c.rollup.results.leads >= t ? "success" : "primary"} /> : null}
                    </div>
                  </CardButton>
                );
              }}
            />
          ) : (
            <CampaignTimeline campaigns={items} today={today} />
          )}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="New campaign" size="lg">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name">
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. November LinkedIn + cold email push" autoFocus />
          </Field>
          <Field label="Objective" hint="One measurable goal">
            <TextArea value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="Book 10 discovery calls with agency owners" className="min-h-[60px]" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Brand">
              <NoSubmit>
                <Segmented
                  size="sm"
                  value={form.brand}
                  onChange={(b) => setForm({ ...form, brand: b })}
                  options={[
                    { value: "company", label: "Company" },
                    { value: "personal", label: "Personal" },
                  ]}
                />
              </NoSubmit>
            </FieldGroup>
            <Field label="Offer">
              <Select value={form.offerId} onChange={(e) => setForm({ ...form, offerId: e.target.value })}>
                <option value="">None yet</option>
                {(offers ?? []).map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <FieldGroup label="Channels">
            <ChipPicker options={CHANNELS} value={form.channels} onChange={(channels) => setForm({ ...form, channels })} />
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Start">
              <TextInput type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="End">
              <TextInput type="date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
            <Field label={`Budget (${currency})`}>
              <TextInput type="number" inputMode="decimal" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline" })}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={buttonVariants()}>
              Create campaign
            </button>
          </div>
        </form>
      </Dialog>

      <CampaignIdeasDialog open={ideasOpen} onClose={() => setIdeasOpen(false)} />
    </PageShell>
  );
}
