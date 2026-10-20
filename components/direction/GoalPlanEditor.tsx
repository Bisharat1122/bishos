"use client";

/**
 * Compose one 12-week goal: type (outcome | learning), ranked reasons, key
 * results (lag) and 1–3 tactics (lead) with weekly targets. Used by the cycle
 * wizard and the "new 12-week goal" dialog.
 */
import { useState } from "react";
import Link from "next/link";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Sparkles, Trash2, Loader2, Flag, Footprints } from "lucide-react";
import { Field, ListEditor, Segmented, Select, TextInput, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { errMsg } from "./util";

export type KR = { title: string; current: number; target: number; unit: string };
export type TacticDraft = { title: string; weeklyTarget: number; ifThen?: string };
export type GoalDraft = {
  key: string;
  goalId?: Id<"goals">;
  source?: "new" | "annual" | "backlog" | "legacy" | "carry";
  title: string;
  lifeAreaId: string;
  goalType: "outcome" | "learning";
  reasons: string[];
  parentGoalId?: Id<"goals">;
  keyResults: KR[];
  tactics: TacticDraft[];
};

export const emptyGoal = (lifeAreaId = "", over: Partial<GoalDraft> = {}): GoalDraft => ({
  key: Math.random().toString(36).slice(2),
  source: "new",
  title: "",
  lifeAreaId,
  goalType: "outcome",
  reasons: [],
  keyResults: [{ title: "", current: 0, target: 0, unit: "" }],
  tactics: [{ title: "", weeklyTarget: 3 }],
  ...over,
});

/** Problems that block saving this goal (empty = ready). */
export function goalProblems(g: GoalDraft, existingTactics = 0): string[] {
  const out: string[] = [];
  if (!g.title.trim()) out.push("a title");
  if (!g.lifeAreaId) out.push("a life area");
  // Existing (non-annual) goals may already carry tactics; new goals need one.
  const mayHaveTactics = !!g.goalId && g.source !== "annual";
  if (!g.tactics.some((t) => t.title.trim()) && existingTactics === 0 && !mayHaveTactics) out.push("at least one tactic");
  return out;
}

export function cleanGoal(g: GoalDraft) {
  return {
    goalId: g.goalId,
    title: g.title.trim(),
    lifeAreaId: g.lifeAreaId as Id<"lifeAreas">,
    goalType: g.goalType,
    reasons: g.reasons.map((r) => r.trim()).filter(Boolean),
    parentGoalId: g.parentGoalId,
    keyResults: g.keyResults
      .filter((k) => k.title.trim())
      .map((k) => ({ title: k.title.trim(), current: Number(k.current) || 0, target: Number(k.target) || 0, unit: k.unit.trim() })),
    tactics: g.tactics
      .filter((t) => t.title.trim())
      .slice(0, 3)
      .map((t) => ({ title: t.title.trim(), weeklyTarget: Math.max(1, Math.round(Number(t.weeklyTarget) || 1)), ifThen: t.ifThen?.trim() || undefined })),
  };
}

export function GoalPlanEditor({
  draft,
  onChange,
  areas,
  weekStart,
}: {
  draft: GoalDraft;
  onChange: (next: GoalDraft) => void;
  areas: { _id: string; name: string }[];
  weekStart?: string;
}) {
  const suggest = useAction(api.goals.aiTactics);
  const existing = useQuery(api.tactics.forGoal, draft.goalId && weekStart ? { goalId: draft.goalId, weekStart } : "skip");
  const [busy, setBusy] = useState(false);
  const [ideas, setIdeas] = useState<TacticDraft[]>([]);
  const set = (patch: Partial<GoalDraft>) => onChange({ ...draft, ...patch });
  const activeExisting = (existing ?? []).filter((t) => t.active);
  const tacticSlots = Math.max(0, 3 - activeExisting.length);

  const runSuggest = async () => {
    if (!draft.title.trim()) return toast("Write the goal first, then ask for tactics.", { tone: "info" });
    setBusy(true);
    try {
      const out = await suggest({
        title: draft.title,
        goalType: draft.goalType,
        keyResult: draft.keyResults[0]?.title ? `${draft.keyResults[0].title} → ${draft.keyResults[0].target} ${draft.keyResults[0].unit}` : undefined,
        area: areas.find((a) => a._id === draft.lifeAreaId)?.name,
      });
      setIdeas(out);
      if (!out.length) toast("No suggestions this time — try rephrasing the goal.", { tone: "info" });
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <Field label="Goal">
          <TextInput
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder={draft.goalType === "learning" ? "Run 10 pricing experiments" : "Reach $10k MRR"}
          />
        </Field>
        <Field
          label="Life area"
          hint={
            areas.length === 0 ? (
              <>
                No life areas yet —{" "}
                <Link href="/life-areas" className="underline">
                  create one
                </Link>
                .
              </>
            ) : undefined
          }
        >
          <Select value={draft.lifeAreaId} onChange={(e) => set({ lifeAreaId: e.target.value })}>
            <option value="">Pick an area…</option>
            {areas.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Type</span>
        <div>
          <Segmented
            size="sm"
            value={draft.goalType}
            onChange={(goalType) => set({ goalType })}
            options={[
              { value: "outcome", label: "Outcome" },
              { value: "learning", label: "Learning" },
            ]}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {draft.goalType === "outcome"
            ? "A result you want (revenue, clients, launches). Best when you know how to get there."
            : "A capability to build (\"find 5 strategies\"). Beats outcome goals on new, complex work."}
        </p>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Why it matters — ranked reasons</span>
        <ListEditor items={draft.reasons} onChange={(reasons) => set({ reasons })} numbered placeholder="Add a reason and press Enter…" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Flag className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Key result (lag) — how you'll know it worked</span>
        </div>
        {draft.keyResults.map((k, i) => (
          <div key={i} className="grid grid-cols-[1fr_64px_68px_auto] items-center gap-1.5 sm:gap-2">
            <input
              value={k.title}
              onChange={(e) => set({ keyResults: draft.keyResults.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })}
              placeholder={i === 0 ? "New monthly recurring revenue" : "Another key result"}
              className={cn(inputClass, "h-9 min-w-0")}
              aria-label="Key result"
            />
            <input
              type="number"
              min={0}
              value={k.target || ""}
              onChange={(e) => set({ keyResults: draft.keyResults.map((x, j) => (j === i ? { ...x, target: Number(e.target.value) } : x)) })}
              placeholder="Target"
              className={cn(inputClass, "h-9 min-w-0")}
              aria-label="Target"
            />
            <input
              value={k.unit}
              onChange={(e) => set({ keyResults: draft.keyResults.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)) })}
              placeholder="unit"
              className={cn(inputClass, "h-9 min-w-0")}
              aria-label="Unit"
            />
            <button
              type="button"
              onClick={() => set({ keyResults: draft.keyResults.filter((_, j) => j !== i) })}
              className="rounded p-1.5 text-muted-foreground hover:text-danger"
              aria-label="Remove key result"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {draft.keyResults.length < 3 && (
          <button
            type="button"
            onClick={() => set({ keyResults: [...draft.keyResults, { title: "", current: 0, target: 0, unit: "" }] })}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <Plus className="h-3.5 w-3.5" /> Key result
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Footprints className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Tactics (lead) — what you do every week</span>
          </div>
          <button type="button" onClick={() => void runSuggest()} disabled={busy} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Suggest tactics
          </button>
        </div>
        {activeExisting.length > 0 && (
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Kept: {activeExisting.map((t) => `${t.title} (${t.weeklyTarget}×/wk)`).join(" · ")}
          </div>
        )}
        {draft.tactics.slice(0, Math.max(1, tacticSlots)).map((t, i) => (
          <div key={i} className="space-y-1.5 rounded-lg border border-border p-2.5">
            <div className="grid grid-cols-[1fr_92px_auto] items-center gap-2">
              <input
                value={t.title}
                onChange={(e) => set({ tactics: draft.tactics.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })}
                placeholder={i === 0 ? "Send 20 outreach messages" : "Another weekly action"}
                className={cn(inputClass, "h-9 min-w-0")}
                aria-label="Tactic"
              />
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={t.weeklyTarget}
                  onChange={(e) => set({ tactics: draft.tactics.map((x, j) => (j === i ? { ...x, weeklyTarget: Number(e.target.value) } : x)) })}
                  className={cn(inputClass, "h-9 w-14 px-2")}
                  aria-label="Times per week"
                />
                /wk
              </label>
              <button
                type="button"
                onClick={() => set({ tactics: draft.tactics.filter((_, j) => j !== i) })}
                className="rounded p-1.5 text-muted-foreground hover:text-danger"
                aria-label="Remove tactic"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <input
              value={t.ifThen ?? ""}
              onChange={(e) => set({ tactics: draft.tactics.map((x, j) => (j === i ? { ...x, ifThen: e.target.value } : x)) })}
              placeholder="If-then: If it's 9:00 and I open my laptop, then I…"
              className={cn(inputClass, "h-8 w-full text-xs")}
              aria-label="If-then plan"
            />
          </div>
        ))}
        {draft.tactics.length < tacticSlots && (
          <button
            type="button"
            onClick={() => set({ tactics: [...draft.tactics, { title: "", weeklyTarget: 3 }] })}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <Plus className="h-3.5 w-3.5" /> Tactic
          </button>
        )}
        {ideas.length > 0 && (
          <div className="os-rise space-y-1.5 rounded-lg border border-dashed border-border p-2.5">
            <p className="text-[11px] font-medium text-muted-foreground">AI suggestions — click to use</p>
            {ideas.map((idea, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const filled = draft.tactics.filter((t) => t.title.trim());
                  if (filled.length >= tacticSlots) return toast("Three tactics max — remove one first.", { tone: "info" });
                  set({ tactics: [...filled, idea] });
                  setIdeas(ideas.filter((_, j) => j !== i));
                }}
                className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <span className="font-medium">{idea.title}</span>
                <span className="text-muted-foreground"> · {idea.weeklyTarget}×/wk</span>
                {idea.ifThen && <span className="block text-[11px] text-muted-foreground">{idea.ifThen}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
