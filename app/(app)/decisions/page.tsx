"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { Gavel, Hourglass, Plus, Scale, Siren } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Chip, EmptyHint, PageShell, Segmented, buttonVariants, cn } from "@/components/os/kit";
import { fmtYmd, useToday } from "@/lib/day";
import { CalibrationCard, DecisionDrawer, DecisionForm, ReviewDialog, confidenceWord } from "@/components/strategy/decisions";
import { IssuesPanel } from "@/components/strategy/issues";
import { CardButton, Kpi } from "@/components/strategy/viz";
import { relDayInline } from "@/components/strategy/lib";
import { useStable } from "@/components/os/useCockpit";

type Tab = "decisions" | "issues";
type Filter = "all" | "due" | "pending" | "reviewed";

export default function DecisionsPage() {
  const today = useToday();
  const [tab, setTab] = useState<Tab>("decisions");
  const decisions = useStable(useQuery(api.decisions.list, { today }));
  const issues = useQuery(api.decisions.listIssues);
  const [filter, setFilter] = useState<Filter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [openId, setOpenId] = useState<Id<"decisions"> | null>(null);
  const [reviewing, setReviewing] = useState<Doc<"decisions"> | null>(null);
  // Deep links (read once on mount; no Suspense needed):
  //   ?tab=issues · ?issue=<id> (opens that issue) · ?decision=<id> (opens it) · ?review=<id> (starts its review)
  const [issueParam, setIssueParam] = useState<string | null>(null);
  const [pending, setPending] = useState<{ kind: "decision" | "review"; id: string } | null>(null);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("tab");
    const issue = sp.get("issue");
    if (issue) {
      setTab("issues");
      setIssueParam(issue);
    } else if (t === "issues" || t === "decisions") setTab(t);
    const review = sp.get("review");
    const decision = sp.get("decision");
    if (review) setPending({ kind: "review", id: review });
    else if (decision) setPending({ kind: "decision", id: decision });
    // One-shot: drop the item params so a refresh doesn't reopen a closed (or deleted) item.
    if (issue || review || decision) {
      const url = new URL(window.location.href);
      ["issue", "review", "decision"].forEach((k) => url.searchParams.delete(k));
      if (issue) url.searchParams.set("tab", "issues");
      window.history.replaceState(null, "", url.toString());
    }
  }, []);
  const changeTab = (t: Tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    window.history.replaceState(null, "", url.toString());
  };

  const items = decisions?.items ?? [];
  const due = items.filter((d) => d.reviewDue);
  const shown =
    filter === "due" ? due : filter === "pending" ? items.filter((d) => d.status !== "reviewed") : filter === "reviewed" ? items.filter((d) => d.status === "reviewed") : items;
  const openDecision = openId ? items.find((d) => d._id === openId) ?? null : null;

  // Resolve a ?decision= / ?review= deep link once the journal has loaded.
  useEffect(() => {
    if (!pending || !decisions) return;
    const d = decisions.items.find((x) => x._id === pending.id);
    setPending(null);
    if (!d) return;
    setTab("decisions");
    if (pending.kind === "review" && d.status !== "reviewed") setReviewing(d);
    else setOpenId(d._id);
  }, [pending, decisions]);

  return (
    <PageShell
      title="Decisions & Issues"
      icon={Gavel}
      subtitle="Judge your judgement: journal big calls before the outcome, and work the issues list with IDS."
      actions={
        tab === "decisions" ? (
          <button type="button" onClick={() => setFormOpen(true)} className={buttonVariants({ size: "sm" })}>
            <Plus className="h-4 w-4" /> Journal a decision
          </button>
        ) : null
      }
      headerExtra={
        <div className="mt-5">
          <Segmented
            value={tab}
            onChange={changeTab}
            options={[
              { value: "decisions", label: "Decisions", icon: Scale, count: decisions?.dueCount || undefined },
              { value: "issues", label: "Issues", icon: Siren, count: issues?.openCount || undefined },
            ]}
          />
        </div>
      }
    >
      {tab === "decisions" ? (
        decisions === undefined ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-32" />
              ))}
            </div>
            <div className="skeleton h-64" />
          </div>
        ) : (
          <div className="space-y-5">
            {due.length > 0 && (
              <div className="os-rise flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 sm:flex-row sm:items-center">
                <Hourglass className="h-5 w-5 shrink-0 text-warning" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">
                    Review due: {due.length} decision{due.length === 1 ? "" : "s"}
                  </p>
                  <p className="text-muted-foreground">Compare what you expected with what actually happened. It takes two minutes.</p>
                </div>
                <button type="button" onClick={() => setReviewing(due[0])} className={buttonVariants({ size: "sm" })}>
                  <Scale className="h-3.5 w-3.5" /> Review now
                </button>
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 space-y-4">
                {items.length === 0 ? (
                  <EmptyHint
                    icon={Scale}
                    title="Start your decision journal"
                    hint="For any call that matters (a hire, a price, a pivot, a big client) write the options, your choice, what you expect and how sure you are. Review it in 6 weeks."
                    action={
                      <button type="button" onClick={() => setFormOpen(true)} className={buttonVariants()}>
                        <Plus className="h-4 w-4" /> Journal a decision
                      </button>
                    }
                    className="py-14"
                  />
                ) : (
                  <>
                    <Segmented
                      size="sm"
                      value={filter}
                      onChange={setFilter}
                      options={[
                        { value: "all", label: "All", count: items.length },
                        { value: "due", label: "Review due", count: due.length },
                        { value: "pending", label: "Awaiting outcome", count: items.filter((d) => d.status !== "reviewed").length },
                        { value: "reviewed", label: "Reviewed", count: items.filter((d) => d.status === "reviewed").length },
                      ]}
                    />
                    {shown.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">Nothing here.</p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {shown.map((d) => (
                          <CardButton
                            key={d._id}
                            onClick={() => setOpenId(d._id)}
                            label={`Open decision: ${d.title}`}
                            className={cn("os-rise flex flex-col gap-2 p-4", d.reviewDue && "border-warning/50")}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold leading-snug">{d.title}</p>
                              {d.confidence != null && (
                                <span title={confidenceWord(d.confidence)} className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums">
                                  {d.confidence}%
                                </span>
                              )}
                            </div>
                            {d.choice ? (
                              <p className="line-clamp-2 text-sm">
                                <span className="text-muted-foreground">Chose: </span>
                                {d.choice}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">No choice recorded yet</p>
                            )}
                            {d.status === "reviewed" && d.outcome && <p className="line-clamp-2 text-xs text-muted-foreground">Outcome: {d.outcome}</p>}
                            <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                              {d.status === "reviewed" ? (
                                <Chip tone={d.matched === false ? "warning" : "success"}>
                                  {d.matched == null ? "Reviewed" : d.matched ? "As expected" : "Surprised"}
                                </Chip>
                              ) : d.reviewDue ? (
                                <Chip tone="warning">Review due</Chip>
                              ) : d.reviewDate ? (
                                <Chip tone="muted">Review {relDayInline(d.reviewDate, today)}</Chip>
                              ) : null}
                              <span className="ml-auto text-[11px] text-muted-foreground">
                                {d.decidedOn ? fmtYmd(d.decidedOn, { month: "short", day: "numeric" }) : ""}
                              </span>
                            </div>
                            {d.reviewDue && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReviewing(d);
                                }}
                                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "self-start")}
                              >
                                Review now
                              </button>
                            )}
                          </CardButton>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <aside className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Kpi label="Awaiting outcome" value={items.filter((d) => d.status !== "reviewed").length} />
                  <Kpi label="Reviewed" value={items.filter((d) => d.status === "reviewed").length} />
                </div>
                <CalibrationCard cal={decisions.calibration} />
              </aside>
            </div>
          </div>
        )
      ) : issues === undefined ? (
        <div className="space-y-4">
          <div className="skeleton h-14" />
          <div className="grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-36" />
            ))}
          </div>
        </div>
      ) : (
        <IssuesPanel data={issues} today={today} initialOpenId={issueParam} />
      )}

      <DecisionForm open={formOpen} onClose={() => setFormOpen(false)} today={today} />
      <DecisionDrawer
        decision={openDecision}
        onClose={() => setOpenId(null)}
        onReview={(d) => {
          setOpenId(null);
          setReviewing(d);
        }}
        today={today}
      />
      <ReviewDialog decision={reviewing} onClose={() => setReviewing(null)} today={today} />
    </PageShell>
  );
}
