"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Copy, Package, Plus, Trash2, Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Chip, Dialog, EmptyHint, Field, PageShell, Ring, Segmented, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { errorMessage, toast } from "@/components/os/celebrate";
import { Kpi } from "@/components/strategy/viz";
import { Menu } from "@/components/strategy/Menu";
import { OFFER_STATUS, fmtMoney, scoreLabel, scoreTone } from "@/components/strategy/lib";

type Filter = "all" | "live" | "testing" | "draft" | "retired";

export default function OffersPage() {
  const router = useRouter();
  const data = useQuery(api.offers.list);
  const create = useMutation(api.offers.create);
  const duplicate = useMutation(api.offers.duplicate);
  const remove = useMutation(api.offers.remove);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", icp: "", dreamOutcome: "", price: "" });
  const [busy, setBusy] = useState(false);

  const items = data?.items ?? [];
  const shown = filter === "all" ? items : items.filter((o) => o.status === filter);
  const count = (s: Filter) => (s === "all" ? items.length : items.filter((o) => o.status === s).length);
  const currency = data?.currency ?? "USD";
  const revenue = items.reduce((s, o) => s + o.revenue, 0);
  const best = items.filter((o) => o.status !== "retired").sort((a, b) => b.score - a.score)[0];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast("Give the offer a working name", { tone: "warning" });
    setBusy(true);
    try {
      const price = form.price.trim() ? Number(form.price) : undefined;
      const id = await create({
        name: form.name,
        icp: form.icp.trim() || undefined,
        dreamOutcome: form.dreamOutcome.trim() || undefined,
        price: price != null && Number.isFinite(price) ? price : undefined,
      });
      setOpen(false);
      setForm({ name: "", icp: "", dreamOutcome: "", price: "" });
      router.push(`/offers/${id}`);
    } catch (err) {
      toast(errorMessage(err, "Could not create the offer"), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  async function dup(id: Id<"offers">) {
    try {
      const nid = await duplicate({ id });
      toast("Offer duplicated", { tone: "success" });
      router.push(`/offers/${nid}`);
    } catch (err) {
      toast(errorMessage(err, "Could not duplicate the offer"), { tone: "warning" });
    }
  }

  function del(id: Id<"offers">, name: string) {
    if (!confirm(`Delete "${name}"? Linked deals keep their data.`)) return;
    remove({ id }).then(
      () => toast("Offer deleted"),
      (err: unknown) => toast(errorMessage(err, "Could not delete the offer"), { tone: "warning" }),
    );
  }

  return (
    <PageShell
      title="Offers"
      icon={Package}
      subtitle="Make offers so good people feel stupid saying no: dream outcome × likelihood ÷ (time × effort)."
      actions={
        <button type="button" onClick={() => setOpen(true)} className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          New offer
        </button>
      }
    >
      {data === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-52" />
          ))}
        </div>
      ) : !items.length ? (
        <EmptyHint
          icon={Package}
          title="Build your first offer"
          hint="Write who it's for, the dream outcome, proof, speed and effort removed. Score it on the value equation, stack bonuses and a guarantee, then name it with MAGIC."
          action={
            <button type="button" onClick={() => setOpen(true)} className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              Build an offer
            </button>
          }
          className="py-16"
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Live offers" value={count("live")} tone={count("live") ? "success" : undefined} sub={`${count("testing")} in testing`} />
            <Kpi label="Revenue from offers" value={fmtMoney(revenue, currency)} sub="Won deals linked to an offer" />
            <Kpi label="Deals linked" value={items.reduce((s, o) => s + o.dealCount, 0)} sub={`${items.reduce((s, o) => s + o.openCount, 0)} still open`} />
            <Kpi label="Strongest offer" value={best ? best.score : "—"} sub={best ? best.name : "Score an offer"} />
          </div>

          <Segmented
            value={filter}
            onChange={setFilter}
            options={(["all", "live", "testing", "draft", "retired"] as Filter[]).map((f) => ({
              value: f,
              label: f === "all" ? "All" : OFFER_STATUS[f].label,
              count: count(f),
            }))}
          />

          {!shown.length ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No {filter} offers.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((o) => (
                <div
                  key={o._id}
                  className={cn(
                    "os-rise group relative flex flex-col rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-ring/60",
                    o.status === "retired" && "opacity-70",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Ring value={o.score} size={56} stroke={6} tone={scoreTone(o.score)}>
                      <span className="text-sm font-semibold tabular-nums">{o.score}</span>
                    </Ring>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 font-semibold leading-snug">
                          <Link href={`/offers/${o._id}`} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:underline">
                            {o.name}
                          </Link>
                        </h3>
                        <div className="relative z-10">
                          <Menu
                            items={[
                              { label: "Duplicate", icon: Copy, onClick: () => void dup(o._id) },
                              {
                                label: "Delete",
                                icon: Trash2,
                                danger: true,
                                onClick: () => del(o._id, o.name),
                              },
                            ]}
                          />
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Chip tone={OFFER_STATUS[o.status].tone}>{OFFER_STATUS[o.status].label}</Chip>
                        <span className="text-xs text-muted-foreground">{scoreLabel(o.score)}</span>
                      </div>
                    </div>
                  </div>
                  {o.icp && (
                    <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-2">{o.icp}</span>
                    </p>
                  )}
                  {o.dreamOutcome && <p className="mt-1.5 line-clamp-2 text-sm">{o.dreamOutcome}</p>}
                  <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                    <div>
                      <div className="text-sm font-semibold tabular-nums">{o.price != null ? fmtMoney(o.price, currency) : "—"}</div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{o.pricingModel || "Price"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold tabular-nums">
                        {o.wonCount}
                        <span className="text-muted-foreground">/{o.dealCount}</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Won / deals</div>
                    </div>
                    <div>
                      <div className={cn("text-sm font-semibold tabular-nums", o.revenue > 0 && "text-success")}>{fmtMoney(o.revenue, currency)}</div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Revenue</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="New offer">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Working name" hint="You can craft a MAGIC name later.">
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 30-day pipeline sprint" autoFocus />
          </Field>
          <Field label="Who is it for?">
            <TextInput value={form.icp} onChange={(e) => setForm({ ...form, icp: e.target.value })} placeholder="Agency owners with 5–20 staff" />
          </Field>
          <Field label="Dream outcome">
            <TextArea
              value={form.dreamOutcome}
              onChange={(e) => setForm({ ...form, dreamOutcome: e.target.value })}
              placeholder="What do they get? In their words."
              className="min-h-[64px]"
            />
          </Field>
          <Field label={`Price (${currency})`}>
            <TextInput type="number" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="2500" />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline" })}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={buttonVariants()}>
              Create and open builder
            </button>
          </div>
        </form>
      </Dialog>
    </PageShell>
  );
}
