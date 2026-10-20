"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { ArrowUpRight, Briefcase, FolderKanban, HeartHandshake, Lightbulb, Plus, ShieldAlert, Wallet } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Avatar, Bar, Chip, EmptyHint, Metric, PageShell, Segmented, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { fmtYmd, useToday } from "@/lib/day";
import { LogTouchButton } from "@/components/sales/LogTouch";
import { CommitmentList } from "@/components/sales/Commitments";
import { CompanyDialog } from "@/components/sales/PersonDialog";
import { HealthPicker, StageChip } from "@/components/sales/chips";
import { agoLabel, errMsg, fmtMoney } from "@/components/sales/meta";

type Filter = "all" | "attention" | "healthy";

const IDEA_TONE: Record<string, string> = {
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  muted: "bg-muted text-muted-foreground",
};

export default function CustomersPage() {
  const today = useToday();
  const data = useQuery(api.people.customers, { today });
  const update = useMutation(api.people.updateCompany);
  const [add, setAdd] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const rows = data?.customers ?? [];
  const currency = data?.currency ?? "USD";
  const revenue = rows.reduce((s, c) => s + c.revenue, 0);
  const atRisk = rows.filter((c) => c.health === "red" || c.health === "yellow").length;
  const openIOwe = rows.reduce((s, c) => s + c.commitments.filter((x) => x.direction === "i_owe").length, 0);
  const visible = rows.filter((c) =>
    filter === "attention" ? c.health === "red" || c.health === "yellow" || (c.daysSince ?? 99) >= 30 : filter === "healthy" ? c.health === "green" || !c.health : true,
  );

  return (
    <PageShell
      title="Customers"
      icon={HeartHandshake}
      subtitle="Deliver, check in, ask for the referral. Keep every account green."
      actions={
        <button onClick={() => setAdd(true)} className={buttonVariants()}>
          <Plus className="h-4 w-4" /> Add customer
        </button>
      }
      headerExtra={
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {data === undefined ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20" />)
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <Metric label="Customers" value={rows.length} />
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <Metric label="Revenue won" value={fmtMoney(revenue, currency, revenue >= 100000)} tone={revenue ? "success" : undefined} />
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <Metric label="Need attention" value={atRisk} tone={atRisk ? "warning" : "success"} sub={atRisk ? "Yellow or red health" : "All green"} />
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <Metric label="Promises I owe" value={openIOwe} tone={openIOwe ? "info" : undefined} sub="Open, across customers" />
              </div>
            </>
          )}
        </div>
      }
    >
      {data === undefined ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="skeleton h-72" />
          <div className="skeleton h-72" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyHint
          icon={HeartHandshake}
          title="No customers yet"
          hint="When you win a deal its company lands here with its delivery project, promises and health. You can also add an existing customer."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/pipeline" className={buttonVariants({ variant: "outline" })}>
                Open the pipeline
              </Link>
              <button onClick={() => setAdd(true)} className={buttonVariants()}>
                <Plus className="h-4 w-4" /> Add customer
              </button>
            </div>
          }
        />
      ) : (
        <>
          <Segmented
            size="sm"
            className="mb-4"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: rows.length },
              { value: "attention", label: "Needs attention", count: rows.filter((c) => c.health === "red" || c.health === "yellow" || (c.daysSince ?? 99) >= 30).length },
              { value: "healthy", label: "Healthy" },
            ]}
          />
          {visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nothing here. Nice.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visible.map((c) => {
                const stale = (c.daysSince ?? 999) >= 30;
                return (
                  <article key={c._id} className="os-rise flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
                    {/* header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <Link href={`/companies/${c._id}`} className="group flex min-w-0 items-center gap-3">
                        <Avatar name={c.name} size={38} className="rounded-xl" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate font-semibold group-hover:underline">
                            {c.name} <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {c.customerSince ? `Customer since ${fmtYmd(c.customerSince, { month: "short", year: "numeric" })}` : c.industry ?? "Customer"}
                          </p>
                        </div>
                      </Link>
                      <HealthPicker value={c.health} onChange={(h) => void update({ id: c._id, health: h }).catch((e) => toast(errMsg(e), { tone: "warning" }))} />
                    </div>

                    {/* numbers */}
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3">
                      <div>
                        <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                          <Wallet className="h-3 w-3" /> Revenue
                        </p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums">{fmtMoney(c.revenue, currency, c.revenue >= 100000)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Last contact</p>
                        <p className={cn("mt-0.5 text-sm font-semibold", stale && "text-warning")}>{agoLabel(c.daysSince)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Deals won</p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums">{c.wonCount}</p>
                      </div>
                    </div>

                    {/* next idea */}
                    <div className={cn("flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-medium", IDEA_TONE[c.idea.tone])}>
                      <Lightbulb className="mt-px h-3.5 w-3.5 shrink-0" />
                      <span>Next: {c.idea.text}</span>
                    </div>

                    {/* delivery */}
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <FolderKanban className="h-3.5 w-3.5" /> Delivery
                      </p>
                      {c.projects.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No delivery project linked. Create one from the won deal in the pipeline.</p>
                      ) : (
                        <div className="space-y-2">
                          {c.projects.map((p) => (
                            <Link key={p._id} href={`/projects/${p._id}`} className="block rounded-md px-1 py-0.5 hover:bg-accent/40">
                              <div className="flex items-center justify-between gap-2 text-sm">
                                <span className="truncate">{p.title}</span>
                                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{p.progress}%</span>
                              </div>
                              <Bar value={p.progress} tone={p.status === "completed" ? "success" : p.status === "blocked" ? "warning" : "primary"} className="mt-1" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* promises */}
                    {c.commitments.length > 0 && (
                      <div>
                        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Open promises <span className="rounded bg-muted px-1 text-[10px] tabular-nums">{c.commitments.length}</span>
                        </p>
                        <CommitmentList items={c.commitments.slice(0, 3)} today={today} showDirection />
                        {c.commitments.length > 3 && (
                          <Link href={`/companies/${c._id}`} className="text-xs text-muted-foreground hover:text-foreground">
                            +{c.commitments.length - 3} more
                          </Link>
                        )}
                      </div>
                    )}

                    {/* expansion deals */}
                    {c.openDeals.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.openDeals.map((d) => (
                          <Link key={d._id} href={`/pipeline?deal=${d._id}`} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-xs hover:bg-accent">
                            {d.title} <StageChip stage={d.stage} />
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* footer */}
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <div className="flex min-w-0 items-center -space-x-1.5">
                        {c.people.slice(0, 5).map((p) => (
                          <Link key={p._id} href={`/people/${p._id}`} title={p.name} className="rounded-full ring-2 ring-card">
                            <Avatar name={p.name} size={26} />
                          </Link>
                        ))}
                        {c.people.length === 0 && <span className="text-xs text-muted-foreground">No contacts linked</span>}
                        {c.people.length > 5 && <Chip tone="muted" className="ml-2">+{c.people.length - 5}</Chip>}
                      </div>
                      <LogTouchButton companyId={c._id} personId={c.people.length === 1 ? c.people[0]._id : undefined} defaultKind="call" label="Log check-in" />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {atRisk > 0 && filter === "all" && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5" /> Red and yellow accounts are listed first.
            </p>
          )}
        </>
      )}
      <CompanyDialog open={add} onClose={() => setAdd(false)} defaults={{ relationship: "customer" }} />
    </PageShell>
  );
}
