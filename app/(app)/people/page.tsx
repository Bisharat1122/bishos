"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Building2, HeartHandshake, Plus, Search, Users, Wand2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Avatar, Chip, EmptyHint, PageShell, Section, Segmented, Select, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { diffDaysYmd, useToday } from "@/lib/day";
import { LogTouchButton } from "@/components/sales/LogTouch";
import { PersonDialog, CompanyDialog } from "@/components/sales/PersonDialog";
import { RouteConversationDialog } from "@/components/sales/RouteConversationDialog";
import { CadenceChip, HealthPicker, LastContact, RelationChip } from "@/components/sales/chips";
import { COMPANY_RELS, COMPANY_REL_TONE, RELATIONS, agoLabel, cadenceLabel, errMsg, fmtMoney, type Relation, type Tier } from "@/components/sales/meta";

type Tab = "people" | "companies";
type SortKey = "name" | "oldest" | "overdue" | "recent";

export default function PeoplePage() {
  const today = useToday();
  const router = useRouter();
  const people = useQuery(api.people.list, { today });
  const companies = useQuery(api.people.companies, {});
  const due = useQuery(api.people.dueToReconnect, { today, limit: 12 });
  const options = useQuery(api.deals.options, {});
  const updateCompany = useMutation(api.people.updateCompany);

  const [tab, setTab] = useState<Tab>("people");
  const [q, setQ] = useState("");
  const [relation, setRelation] = useState<Relation | "">("");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [dueOnly, setDueOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("name");
  const [addPerson, setAddPerson] = useState(false);
  const [addCompany, setAddCompany] = useState(false);
  const [routing, setRouting] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "companies") setTab("companies");
  }, []);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    const list = (people ?? []).filter((p) => {
      if (n && ![p.name, p.email, p.title, p.companyName, p.howMet, ...(p.tags ?? [])].filter(Boolean).join(" ").toLowerCase().includes(n)) return false;
      if (relation && p.relation !== relation) return false;
      if (tier !== "all" && p.tier !== tier) return false;
      if (dueOnly && !(p.status === "due" || p.status === "overdue")) return false;
      return true;
    });
    if (sort === "oldest") list.sort((a, b) => (b.daysSince ?? 1e6) - (a.daysSince ?? 1e6));
    else if (sort === "recent") list.sort((a, b) => (a.daysSince ?? 1e6) - (b.daysSince ?? 1e6));
    else if (sort === "overdue") list.sort((a, b) => (a.dueIn ?? 1e6) - (b.dueIn ?? 1e6));
    return list;
  }, [people, q, relation, tier, dueOnly, sort]);

  const companyRows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (companies ?? []).filter((c) => !n || [c.name, c.industry, c.website].filter(Boolean).join(" ").toLowerCase().includes(n));
  }, [companies, q]);

  const currency = options?.currency ?? "USD";
  const dueCount = (people ?? []).filter((p) => p.status === "due" || p.status === "overdue").length;

  return (
    <PageShell
      title="People"
      icon={Users}
      subtitle="One record per person, shared by the pipeline, commitments and your personal CRM."
      actions={
        <>
          <button onClick={() => setRouting(true)} className={buttonVariants({ variant: "outline" })}>
            <Wand2 className="h-4 w-4" /> <span className="hidden sm:inline">Route a conversation</span>
            <span className="sm:hidden">Route</span>
          </button>
          {tab === "people" ? (
            <button onClick={() => setAddPerson(true)} className={buttonVariants()}>
              <Plus className="h-4 w-4" /> Add person
            </button>
          ) : (
            <button onClick={() => setAddCompany(true)} className={buttonVariants()}>
              <Plus className="h-4 w-4" /> Add company
            </button>
          )}
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "people", label: "People", icon: Users, count: people?.length },
            { value: "companies", label: "Companies", icon: Building2, count: companies?.length },
          ]}
        />
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "people" ? "Search name, company, email, tag…" : "Search companies…"} className={cn(inputClass, "h-9 w-full pl-8")} />
        </div>
      </div>

      {tab === "people" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Section bodyClassName="p-0 sm:p-0" className="min-w-0 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5 sm:px-4">
              <Select value={relation} onChange={(e) => setRelation(e.target.value as Relation | "")} className="h-8 w-auto text-xs">
                <option value="">All relations</option>
                {RELATIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
              <Segmented
                size="sm"
                value={tier}
                onChange={setTier}
                options={[
                  { value: "all", label: "All tiers" },
                  { value: "A", label: "A" },
                  { value: "B", label: "B" },
                  { value: "C", label: "C" },
                ]}
              />
              <button
                onClick={() => setDueOnly((d) => !d)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
                  dueOnly ? "border-ring bg-accent" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Due to reconnect <span className="rounded bg-muted px-1 text-[10px] tabular-nums">{dueCount}</span>
              </button>
              <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="ml-auto h-8 w-auto text-xs" aria-label="Sort">
                <option value="name">Name</option>
                <option value="overdue">Most overdue</option>
                <option value="oldest">Longest since contact</option>
                <option value="recent">Recently contacted</option>
              </Select>
            </div>
            {people === undefined ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-11" />
                ))}
              </div>
            ) : people.length === 0 ? (
              <div className="p-4">
                <EmptyHint
                  icon={Users}
                  title="No people yet"
                  hint="Add leads, customers, mentors and friends. Give the important ones a cadence and they'll surface when it's time to reconnect."
                  action={
                    <button onClick={() => setAddPerson(true)} className={buttonVariants()}>
                      <Plus className="h-4 w-4" /> Add a person
                    </button>
                  }
                />
              </div>
            ) : rows.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No one matches these filters.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-medium sm:px-4">Name</th>
                    <th className="hidden px-3 py-2 font-medium md:table-cell">Relation</th>
                    <th className="hidden px-3 py-2 font-medium lg:table-cell">Tier</th>
                    <th className="hidden px-3 py-2 font-medium md:table-cell">Company</th>
                    <th className="hidden px-3 py-2 font-medium sm:table-cell">Last contact</th>
                    <th className="px-3 py-2 font-medium">Cadence</th>
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr
                      key={p._id}
                      onClick={() => router.push(`/people/${p._id}`)}
                      onKeyDown={(e) => {
                        // only when the row itself is focused (not keys bubbling from the log-touch dialog)
                        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          router.push(`/people/${p._id}`);
                        }
                      }}
                      tabIndex={0}
                      aria-label={`Open ${p.name}`}
                      className="cursor-pointer border-b border-border/60 outline-none transition-colors last:border-0 hover:bg-accent/40 focus-visible:bg-accent/40"
                    >
                      <td className="w-full max-w-0 px-3 py-2.5 sm:px-4">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar name={p.name} size={30} />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              <span className="md:hidden">{p.companyName ? `${p.companyName} · ` : ""}</span>
                              {p.title ?? (p.openDeals ? `${p.openDeals} open deal${p.openDeals > 1 ? "s" : ""}` : "")}
                              <span className="sm:hidden"> · {agoLabel(p.daysSince)}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-3 py-2.5 md:table-cell">
                        <RelationChip relation={p.relation} />
                      </td>
                      <td className="hidden px-3 py-2.5 lg:table-cell">{p.tier ? <Chip tone={p.tier === "A" ? "default" : "muted"}>{p.tier}</Chip> : <span className="text-xs text-muted-foreground">—</span>}</td>
                      <td className="hidden max-w-[180px] truncate px-3 py-2.5 text-muted-foreground md:table-cell">{p.companyName ?? "—"}</td>
                      <td className="hidden px-3 py-2.5 sm:table-cell">
                        <LastContact daysSince={p.daysSince} />
                      </td>
                      <td className="px-3 py-2.5" title={cadenceLabel(p.cadenceDays)}>
                        <CadenceChip status={p.status} dueIn={p.dueIn} />
                      </td>
                      <td className="px-2 py-2.5">
                        <LogTouchButton personId={p._id} lockPerson iconOnly variant="ghost" label={`Log touch with ${p.name}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* Due to reconnect rail */}
          <Section title="Due to reconnect" icon={HeartHandshake} hint="Cadence elapsed since your last touch" className="h-fit lg:sticky lg:top-20">
            {due === undefined ? (
              <div className="space-y-2">
                <div className="skeleton h-12" />
                <div className="skeleton h-12" />
              </div>
            ) : due.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody is due. Give the people who matter a cadence (weekly → yearly) and they&apos;ll show up here on time.</p>
            ) : (
              <ul className="-mx-1 space-y-1">
                {due.map((p) => (
                  <li key={p._id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-accent/40">
                    <button onClick={() => router.push(`/people/${p._id}`)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                      <Avatar name={p.name} size={28} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{p.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {p.dueIn === 0 ? "Due today" : `${-(p.dueIn ?? 0)}d over`} · {cadenceLabel(p.cadenceDays).toLowerCase()} · last {agoLabel(p.daysSince).toLowerCase()}
                        </span>
                      </span>
                    </button>
                    <LogTouchButton personId={p._id} lockPerson defaultKind="dm" iconOnly variant="outline" label={`Log touch with ${p.name}`} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      ) : (
        <Section bodyClassName="p-0 sm:p-0" className="overflow-hidden">
          {companies === undefined ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-11" />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="p-4">
              <EmptyHint
                icon={Building2}
                title="No companies yet"
                hint="Companies are created automatically when you add a person with a company, or add one here."
                action={
                  <button onClick={() => setAddCompany(true)} className={buttonVariants()}>
                    <Plus className="h-4 w-4" /> Add a company
                  </button>
                }
              />
            </div>
          ) : companyRows.length === 0 ? (
            <div className="p-4">
              <EmptyHint
                icon={Search}
                title={<>No companies match &ldquo;{q.trim()}&rdquo;</>}
                hint="Try a different name, industry or website."
                action={
                  <button onClick={() => setQ("")} className={buttonVariants({ variant: "outline" })}>
                    Clear search
                  </button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Company</th>
                    <th className="px-3 py-2 font-medium">Relationship</th>
                    <th className="px-3 py-2 font-medium">Health</th>
                    <th className="px-3 py-2 text-right font-medium">People</th>
                    <th className="px-3 py-2 text-right font-medium">Open pipeline</th>
                    <th className="px-3 py-2 text-right font-medium">Revenue</th>
                    <th className="px-3 py-2 font-medium">Last contact</th>
                  </tr>
                </thead>
                <tbody>
                  {companyRows.map((c) => (
                    <tr
                      key={c._id}
                      onClick={() => router.push(`/companies/${c._id}`)}
                      onKeyDown={(e) => {
                        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          router.push(`/companies/${c._id}`);
                        }
                      }}
                      tabIndex={0}
                      aria-label={`Open ${c.name}`}
                      className="cursor-pointer border-b border-border/60 outline-none last:border-0 hover:bg-accent/40 focus-visible:bg-accent/40"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={c.name} size={28} className="rounded-lg" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{c.name}</p>
                            {c.industry && <p className="truncate text-xs text-muted-foreground">{c.industry}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Chip tone={COMPANY_REL_TONE[c.relationship]}>{COMPANY_RELS.find((r) => r.value === c.relationship)?.label}</Chip>
                      </td>
                      <td className="px-3 py-2.5">
                        {c.relationship === "customer" ? (
                          <HealthPicker
                            value={c.health}
                            onChange={(h) => void updateCompany({ id: c._id, health: h }).catch((e) => toast(errMsg(e), { tone: "warning" }))}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{c.peopleCount}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{c.openDeals ? `${fmtMoney(c.openValue, currency, true)} · ${c.openDeals}` : "—"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{c.revenue ? fmtMoney(c.revenue, currency, true) : "—"}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{c.lastContactDay ? agoLabel(diffDaysYmd(c.lastContactDay, today)) : "Never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      <PersonDialog open={addPerson} onClose={() => setAddPerson(false)} />
      <CompanyDialog open={addCompany} onClose={() => setAddCompany(false)} />
      <RouteConversationDialog open={routing} onClose={() => setRouting(false)} />
    </PageShell>
  );
}
