"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Brain, Layers, Plus, StickyNote, Wand2, X } from "lucide-react";
import { Chip, PageShell, Section, Segmented } from "@/components/os/kit";
import { RecallSession, RecallStatsStrip } from "@/components/mind/RecallSession";
import { NoteReview } from "@/components/mind/NoteReview";
import { CardBrowser, CardForm, CardsFromNote } from "@/components/mind/Cards";

type Tab = "review" | "notes" | "browse" | "create";
const TABS: Tab[] = ["review", "notes", "browse", "create"];

export default function RecallPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8"><div className="skeleton h-64" /></div>}>
      <RecallInner />
    </Suspense>
  );
}

function RecallInner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = (TABS.includes(params.get("tab") as Tab) ? params.get("tab") : "review") as Tab;
  const rawArea = params.get("area") || undefined;
  const areas = useQuery(api.learning.listAreasLite);
  // Only filter by an area we know exists — a stale/malformed ?area= would make
  // every v.id("learningAreas") query below throw and crash the page.
  const areaId = rawArea ? (areas?.find((a) => a._id === rawArea)?._id as Id<"learningAreas"> | undefined) : undefined;
  const areaName = areaId ? areas?.find((a) => a._id === areaId)?.name : undefined;

  const go = (next: Partial<{ tab: Tab; area: string | null }>) => {
    const sp = new URLSearchParams(params.toString());
    if (next.tab) {
      if (next.tab === "review") sp.delete("tab");
      else sp.set("tab", next.tab);
    }
    if (next.area !== undefined) {
      if (next.area) sp.set("area", next.area);
      else sp.delete("area");
    }
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <PageShell
      title="Recall"
      icon={Brain}
      subtitle="Test yourself, spaced out over time — the two study habits with the strongest evidence. 10–15 minutes a day."
      actions={
        <Segmented<Tab>
          value={tab}
          onChange={(t) => go({ tab: t })}
          options={[
            { value: "review", label: "Review", icon: Brain },
            { value: "notes", label: "Notes", icon: StickyNote },
            { value: "browse", label: "Browse", icon: Layers },
            { value: "create", label: "Create", icon: Plus },
          ]}
        />
      }
    >
      <div className="space-y-6">
        {tab !== "create" && <RecallStatsStrip />}
        {areaName && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Filtered to</span>
            <Chip tone="outline">
              {areaName}
              <button onClick={() => go({ area: null })} aria-label="Clear area filter" className="ml-0.5 rounded hover:text-danger">
                <X className="h-3 w-3" />
              </button>
            </Chip>
          </div>
        )}

        {/* With ?area=, wait for the areas list so the session/forms start already filtered. */}
        {rawArea && areas === undefined && <div className="skeleton mx-auto h-72 max-w-2xl" />}

        {tab === "review" && !(rawArea && areas === undefined) && (
          <RecallSession learningAreaId={areaId} onReviewNotes={() => go({ tab: "notes" })} onCreate={() => go({ tab: "create" })} />
        )}

        {tab === "notes" && !(rawArea && areas === undefined) && (
          <div className="space-y-3">
            <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
              Review mode: see a note&apos;s title, recall what it says, then reveal it. Browsing becomes practice testing.
            </p>
            {/* keyed: NoteReview freezes its set once loaded, so a filter change must remount it */}
            <NoteReview key={areaId ?? "all"} learningAreaId={areaId} />
          </div>
        )}

        {tab === "browse" && !(rawArea && areas === undefined) && (
          <Section>
            <CardBrowser learningAreaId={areaId} onCreate={() => go({ tab: "create" })} />
          </Section>
        )}

        {tab === "create" && !(rawArea && areas === undefined) && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="New card" icon={Plus} hint="One idea per card. Phrase the front as a question you must answer from memory.">
              <CardForm learningAreaId={areaId} />
            </Section>
            <Section title="Draft cards from a note" icon={Wand2} hint="AI proposes 3–6 cards; you approve each one before it's saved.">
              <CardsFromNote learningAreaId={areaId} />
            </Section>
          </div>
        )}
      </div>
    </PageShell>
  );
}
