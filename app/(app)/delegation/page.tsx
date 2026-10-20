"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { BookOpen, Calculator, Clock, Grid2x2, Handshake, Plus, TrendingUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PageShell, Segmented, buttonVariants } from "@/components/os/kit";
import { useToday } from "@/lib/day";
import { lsGet, lsSet } from "@/components/habits/util";
import { AuditLogger } from "@/components/delegation/AuditLogger";
import { DripMatrix } from "@/components/delegation/DripMatrix";
import { BuybackPanel } from "@/components/delegation/BuybackPanel";
import { ProcessLibrary } from "@/components/delegation/ProcessLibrary";
import { ProcessEditor, type ProcessDraft } from "@/components/delegation/ProcessEditor";
import { LadderPanel } from "@/components/delegation/LadderPanel";
import type { Rung } from "@/components/delegation/meta";

type Tab = "audit" | "drip" | "buyback" | "processes" | "ladder";
const TABS: Tab[] = ["audit", "drip", "buyback", "processes", "ladder"];
const TAB_KEY = "bishos-delegation-tab";

export default function DelegationPage() {
  const today = useToday();
  const processes = useQuery(api.delegation.processes);
  const [tab, setTabState] = useState<Tab>("audit");
  const [rung, setRung] = useState<Rung | "all">("all");
  const [editor, setEditor] = useState<{ open: boolean; id: Id<"processes"> | null; draft: ProcessDraft | null }>({
    open: false,
    id: null,
    draft: null,
  });

  useEffect(() => {
    const saved = lsGet(TAB_KEY) as Tab | null;
    if (saved && TABS.includes(saved)) setTabState(saved);
  }, []);
  const setTab = (t: Tab) => {
    setTabState(t);
    lsSet(TAB_KEY, t);
  };

  const editing = editor.id ? processes?.find((p) => p._id === editor.id) ?? null : null;
  const writeSop = (activity: string) => setEditor({ open: true, id: null, draft: { title: activity, rung: "admin" } });

  return (
    <PageShell
      title="Delegation"
      icon={Handshake}
      subtitle="Buy back your time: audit it, sort it, document it, hand it off."
      actions={
        <button onClick={() => setEditor({ open: true, id: null, draft: null })} className={buttonVariants({ variant: "outline" })}>
          <Plus /> New SOP
        </button>
      }
    >
      <div className="space-y-5">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "audit", label: "Time audit", icon: Clock },
            { value: "drip", label: "DRIP", icon: Grid2x2 },
            { value: "buyback", label: "Buyback", icon: Calculator },
            { value: "processes", label: "Processes", icon: BookOpen, count: processes?.length },
            { value: "ladder", label: "Ladder", icon: TrendingUp },
          ]}
        />

        {tab === "audit" && <AuditLogger today={today} />}
        {tab === "drip" && <DripMatrix today={today} onGoAudit={() => setTab("audit")} onDelegate={writeSop} />}
        {tab === "buyback" && <BuybackPanel today={today} onDelegate={writeSop} onGoAudit={() => setTab("audit")} />}
        {tab === "processes" && (
          <ProcessLibrary
            rung={rung}
            setRung={setRung}
            onOpen={(id) => setEditor({ open: true, id, draft: null })}
            onNew={() => setEditor({ open: true, id: null, draft: rung !== "all" ? { rung } : null })}
          />
        )}
        {tab === "ladder" && (
          <LadderPanel
            onOpenRung={(r) => {
              setRung(r);
              setTab("processes");
            }}
          />
        )}
      </div>

      <ProcessEditor
        open={editor.open && (!editor.id || !!editing)}
        process={editing}
        draft={editor.draft}
        onClose={() => setEditor({ open: false, id: null, draft: null })}
      />
    </PageShell>
  );
}
