"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Check, Plus, Quote, Repeat2, Target, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Chip, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import {
  BRICKS,
  CTA_RAMPS,
  FLOP_DIAGNOSIS,
  FUNNEL_SWITCHES,
  PACKAGING_LONG,
  PACKAGING_SHORT,
  TRUST_LADDER,
  holdAdvice,
  rankAdvice,
  type BrickKey,
} from "@/lib/kallaway";
import { BIG_VIDEO_TESTS, INTRO_45, STAKES, TITLE_RULES, lintTitle } from "@/lib/youtube";
import { useStable } from "@/components/os/useCockpit";
import { errMsg, fmtNum } from "../model";
import { toggleIn, type KwPatch } from "./useKw";
import { CheckRow, Count, LintList, Note, Pill, SubHead } from "./parts";
import { isLongForm, type StepProps } from "./types";

const Galloway = () => (
  <Chip tone="outline" className="text-[10px] font-normal text-muted-foreground">
    Paddy Galloway
  </Chip>
);

// ─────────────────────────────────────────────────────────────────────────
// Step 6 · Convert
// ─────────────────────────────────────────────────────────────────────────

const CTA_PLACEHOLDER: Record<string, string> = {
  lead_magnet: "Comment “PLAYBOOK” and I'll DM you the free template",
  sales_page: "The full system is linked in my bio",
  dm: "DM me “AUDIT” if you want us to do this for you",
  follow: "Follow for part 2 tomorrow",
  none: "No ask this time: pure trust",
};

export function ConvertStep({ store, piece, strategy }: StepProps) {
  const { kw, set } = store;
  const update = useMutation(api.content.update);
  const rungs = kw.trustRungs ?? [];
  const ramp = CTA_RAMPS.find((r) => r.key === kw.ctaRamp);
  const ctaText = kw.ctaText ?? "";
  const isPieceCta = !!ctaText.trim() && ctaText.trim() === (piece.cta ?? "").trim();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <SubHead hint="They multiply: any switch at zero makes sales zero.">The 4 funnel switches</SubHead>
        <ol className="grid gap-2 sm:grid-cols-4">
          {FUNNEL_SWITCHES.map((f, i) => (
            <li key={f.key} className="rounded-lg border border-border bg-muted/40 p-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {i > 0 && "× "}
                {i + 1}
              </span>
              <p className="text-sm font-medium leading-tight">{f.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{f.hint}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-2">
        <SubHead
          hint="Stack 2+ rungs in the video. Rung 1 is the strongest."
          right={<span className={cn("text-[11px] font-medium tabular-nums", rungs.length >= 2 ? "text-success" : "text-muted-foreground")}>{rungs.length} used · aim 2+</span>}
        >
          Trust ladder
        </SubHead>
        <div className="grid gap-0.5 sm:grid-cols-2">
          {TRUST_LADDER.map((t) => (
            <CheckRow
              key={t.n}
              checked={rungs.includes(t.n)}
              ariaLabel={`Rung ${t.n}: ${t.label}`}
              onToggle={() => set((c) => ({ trustRungs: toggleIn(c.trustRungs, t.n).sort((a, b) => a - b) }))}
              label={
                <span className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{t.n}</span>
                  {t.label}
                </span>
              }
              hint={t.hint}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <SubHead hint="One off-ramp per video, tightly aligned with the topic.">CTA ramp</SubHead>
        <div className="flex flex-wrap gap-1.5">
          {CTA_RAMPS.map((r) => (
            <Pill key={r.key} on={kw.ctaRamp === r.key} onClick={() => set({ ctaRamp: kw.ctaRamp === r.key ? "" : r.key })} title={r.hint}>
              {r.label}
            </Pill>
          ))}
        </div>
        {ramp && <p className="text-[11px] text-muted-foreground">{ramp.hint}</p>}
        {kw.ctaRamp === "lead_magnet" && strategy?.leadMagnet && (
          <p className="text-[11px] text-muted-foreground">
            Your {piece.brand} lead magnet: <span className="font-medium text-foreground">{strategy.leadMagnet}</span>
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <TextInput value={ctaText} onChange={(e) => set({ ctaText: e.target.value })} placeholder={CTA_PLACEHOLDER[kw.ctaRamp ?? ""] ?? "The exact words of your ask"} />
          <button
            type="button"
            disabled={!ctaText.trim() || isPieceCta}
            onClick={() =>
              void update({ id: piece._id, cta: ctaText.trim() })
                .then(() => toast("Piece CTA updated", { tone: "success" }))
                .catch((e) => toast(errMsg(e), { tone: "warning" }))
            }
            className={cn(buttonVariants({ variant: isPieceCta ? "secondary" : "outline", size: "sm" }), "h-9 shrink-0")}
          >
            {isPieceCta ? (
              <>
                <Check className="h-3.5 w-3.5" /> The piece&apos;s CTA
              </>
            ) : (
              "Use as the piece's CTA"
            )}
          </button>
        </div>
      </div>

      <Note tone="info">
        <span className="font-medium">Native embed:</span> weave the offer in as <span className="font-medium">the answer to the topic</span>, not an ad break. e.g.
        &ldquo;If you want the exact template I use for this, it&apos;s free below.&rdquo; Early and often, wherever it fits naturally.
      </Note>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 7 · Packaging
// ─────────────────────────────────────────────────────────────────────────

/** Rough count of thumbnail elements: one per line / comma / "+" / ";". */
const elements = (s: string) => s.split(/\n|,|;|\+/).map((x) => x.trim()).filter(Boolean).length;

/** Does the thumbnail repeat the title (3+ shared meaningful words)? */
function repeatsTitle(title: string, thumb: string) {
  const w = (s: string) => new Set(s.toLowerCase().match(/[a-z0-9$%]{4,}/g) ?? []);
  const t = w(title);
  return [...w(thumb)].filter((x) => t.has(x)).length >= 3;
}

export function PackageStep(props: StepProps) {
  const long = isLongForm(props.piece.format);
  return (
    <div className="space-y-5">
      <Note tone="info" icon={Target}>
        <span className="font-medium">Clickbait yes, bait-and-switch never.</span> Bait, then give: the intro must confirm the click and pay it off early.
      </Note>
      {long ? <LongPackaging {...props} /> : <ShortPackaging {...props} />}
    </div>
  );
}

function ShortPackaging({ store }: StepProps) {
  const { kw, set } = store;
  const checks = kw.packaging ?? [];
  return (
    <>
      <div className="space-y-2">
        <SubHead hint="Short form has no packaging step: the hook IS the package. These three still matter." right={<Count n={PACKAGING_SHORT.filter((p) => checks.includes(p.key)).length} of={PACKAGING_SHORT.length} />}>
          Short-form packaging
        </SubHead>
        <div className="space-y-0.5">
          {PACKAGING_SHORT.map((p) => (
            <CheckRow key={p.key} checked={checks.includes(p.key)} onToggle={() => set((c) => ({ packaging: toggleIn(c.packaging, p.key) }))} label={p.label} hint={p.hint} />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <SubHead hint="Written like a headline with a curiosity loop: it shows above the fold.">First caption line</SubHead>
        <TextInput value={kw.firstCaption ?? ""} onChange={(e) => set({ firstCaption: e.target.value })} placeholder="e.g. The $0 hiring trick nobody uses" />
      </div>
      <div className="space-y-2">
        <SubHead hint="Bingeability: seeing part 4 makes a profile visitor go back for parts 1–3. Stack a buffer before you promise a daily series.">Series</SubHead>
        <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2">
          <TextInput value={kw.series ?? ""} onChange={(e) => set({ series: e.target.value })} placeholder="Series name, e.g. Founder lessons" aria-label="Series name" />
          <TextInput
            type="number"
            min={1}
            inputMode="numeric"
            aria-label="Episode number"
            placeholder="No."
            value={kw.seriesNo ? String(kw.seriesNo) : ""}
            onChange={(e) => set({ seriesNo: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
          />
        </div>
        {kw.series?.trim() && kw.seriesNo ? (
          <p className="text-[11px] text-muted-foreground">
            On the cover: <span className="font-medium text-foreground">{kw.series.trim()} · #{kw.seriesNo}</span>
          </p>
        ) : null}
      </div>
    </>
  );
}

function LongPackaging({ store }: StepProps) {
  const { kw, set } = store;
  const checks = kw.packaging ?? [];
  const yt = kw.ytChecks ?? [];
  const stakes = kw.stakes ?? [];
  const title = kw.ytTitle ?? "";
  const concept = kw.thumbConcept ?? "";
  const els = elements(concept);

  return (
    <>
      <ListLab
        title="Title lab"
        hint="≥10 titles first, before anything else. Pick the one you'd bet your career on."
        target={10}
        items={kw.titles ?? []}
        onChange={(titles) => set({ titles })}
        chosen={title}
        onUse={(t) => set({ ytTitle: t })}
        placeholder="Another title variant… (Enter)"
        lint={(t) => lintTitle(t).filter((i) => i.kind !== "good")}
        meta={(t) => `${t.trim().length}`}
      />
      <div className="space-y-1.5">
        <SubHead hint="Trigger a desire loop: solve a pain, FOMO about missing the fix, or a benefit they want. Shorter wins.">Chosen YouTube title</SubHead>
        <TextInput value={title} onChange={(e) => set({ ytTitle: e.target.value })} placeholder="The title you'll publish with" className="font-medium" />
        <LintList issues={lintTitle(title)} />
        <ul className="grid gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground sm:grid-cols-2">
          {TITLE_RULES.map((r) => (
            <li key={r} className="flex gap-1.5">
              <span aria-hidden>·</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      <ListLab
        title="Thumbnail brief"
        hint="~5 concepts, not designs. Each ≤3 elements and adds to the title instead of repeating it."
        target={5}
        items={kw.thumbConcepts ?? []}
        onChange={(thumbConcepts) => set({ thumbConcepts })}
        chosen={concept}
        onUse={(t) => set({ thumbConcept: t })}
        placeholder="Concept: face + big number + arrow… (Enter)"
        lint={(t) => [
          ...(elements(t) > 3 ? [{ kind: "warn" as const, text: `${elements(t)} elements: keep it to 3.` }] : []),
          ...(title && repeatsTitle(title, t) ? [{ kind: "tip" as const, text: "Repeats the title: make it add something new." }] : []),
        ]}
      />
      <div className="space-y-1.5">
        <SubHead hint="Thumbnail → title → thumbnail → click. Readable at 1/16 size in dark mode, bottom-right corner clear.">Chosen thumbnail concept</SubHead>
        <TextArea rows={2} className="min-h-0" value={concept} onChange={(e) => set({ thumbConcept: e.target.value })} placeholder="One element per line or comma" />
        {concept.trim() && (
          <LintList
            issues={[
              els > 3 ? { kind: "warn", text: `${els} elements: keep it to 3 or fewer.` } : { kind: "good", text: `${els} element${els === 1 ? "" : "s"}.` },
              ...(title && repeatsTitle(title, concept) ? [{ kind: "tip" as const, text: "The thumbnail repeats the title. Complement it instead." }] : []),
            ]}
          />
        )}
      </div>

      <div className="space-y-2">
        <SubHead right={<Count n={PACKAGING_LONG.filter((p) => checks.includes(p.key)).length} of={PACKAGING_LONG.length} />}>YouTube packaging checklist</SubHead>
        <div className="space-y-0.5">
          {PACKAGING_LONG.map((p) => (
            <CheckRow key={p.key} checked={checks.includes(p.key)} onToggle={() => set((c) => ({ packaging: toggleIn(c.packaging, p.key) }))} label={p.label} hint={p.hint} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <SubHead right={<Galloway />}>Big-video tests</SubHead>
        <div className="space-y-0.5">
          {BIG_VIDEO_TESTS.map((t) => (
            <CheckRow key={t.key} checked={yt.includes(t.key)} onToggle={() => set((c) => ({ ytChecks: toggleIn(c.ytChecks, t.key) }))} label={t.label} hint={t.hint} />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <SubHead hint="60–70% can leave in the first seconds if the promise isn't confirmed." right={<Galloway />}>
          The 45-second intro
        </SubHead>
        <div className="space-y-0.5">
          {INTRO_45.map((t) => (
            <CheckRow key={t.key} checked={yt.includes(t.key)} onToggle={() => set((c) => ({ ytChecks: toggleIn(c.ytChecks, t.key) }))} label={t.label} hint={t.hint} />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <SubHead hint="Raise the stakes so leaving feels like a loss." right={<Galloway />}>
          Stakes
        </SubHead>
        <div className="flex flex-wrap gap-1.5">
          {STAKES.map((s) => (
            <Pill key={s.key} on={stakes.includes(s.key)} onClick={() => set((c) => ({ stakes: toggleIn(c.stakes, s.key) }))} title={s.hint}>
              {s.label}
            </Pill>
          ))}
        </div>
      </div>
    </>
  );
}

/** Editable list of variants with live lint, "Use" to pick one. */
function ListLab({
  title,
  hint,
  target,
  items,
  onChange,
  chosen,
  onUse,
  placeholder,
  lint,
  meta,
}: {
  title: string;
  hint: string;
  target: number;
  items: string[];
  onChange: (next: string[]) => void;
  chosen: string;
  onUse: (v: string) => void;
  placeholder: string;
  lint: (v: string) => { kind: "warn" | "tip" | "good"; text: string }[];
  meta?: (v: string) => string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...items, t]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <SubHead
        hint={hint}
        right={
          <span className="flex items-center gap-2">
            <span className={cn("text-[11px] font-medium tabular-nums", items.length >= target ? "text-success" : "text-muted-foreground")}>
              {items.length}/{target}
            </span>
            <Galloway />
          </span>
        }
      >
        {title}
      </SubHead>
      {items.length > 0 && (
        <ol className="space-y-1">
          {items.map((t, i) => {
            const inUse = !!t.trim() && t.trim() === chosen.trim();
            const issues = lint(t);
            return (
              <li key={i} className="rounded-lg border border-border p-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{i + 1}</span>
                  <input
                    value={t}
                    aria-label={`${title} ${i + 1}`}
                    onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
                    className="h-7 min-w-0 flex-1 rounded-md bg-transparent px-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                  {meta && <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{meta(t)}</span>}
                  {inUse ? (
                    <Chip tone="success" className="shrink-0 gap-1">
                      <Check className="h-3 w-3" /> In use
                    </Chip>
                  ) : (
                    <button type="button" disabled={!t.trim()} onClick={() => onUse(t.trim())} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 shrink-0 px-2 text-xs")}>
                      Use
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => onChange(items.filter((_, j) => j !== i))}
                    className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-7 shrink-0 hover:text-danger")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {issues.length > 0 && <LintList issues={issues} className="mt-1 pl-7" />}
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex gap-2">
        <TextInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
            e.preventDefault();
            add();
          }}
          placeholder={placeholder}
          className="h-8"
        />
        <button type="button" aria-label="Add" disabled={!draft.trim()} onClick={add} className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "shrink-0")}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 8 · Post-mortem
// ─────────────────────────────────────────────────────────────────────────

const FLOP_BRICK: Record<string, BrickKey> = { topic: "topic", angle: "angle", hook: "hookStructure" };

function fmtDur(s?: number) {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  return m ? `${m}:${String(Math.round(s % 60)).padStart(2, "0")}` : `${Math.round(s)}s`;
}

export function ReviewStep({ store, piece }: StepProps) {
  const { kw, set, flush } = store;
  const router = useRouter();
  const create = useMutation(api.content.create);
  const saveKw = useMutation(api.contentSystem.saveKw);
  const [busy, setBusy] = useState(false);
  const published = !!piece.publishedAt;
  const long = isLongForm(piece.format);
  const iteration = useStable(useQuery(api.contentSystem.iteration, published && long ? { brand: piece.brand, limit: 200 } : "skip"));
  const rank = iteration?.find((x) => x._id === piece._id)?.rank ?? null;

  const perf = piece.performance ?? [];
  const snap = perf.find((s) => s.window === "30d") ?? perf.find((s) => s.window === "7d") ?? perf.find((s) => s.window === "24h") ?? null;
  const weak = kw.weakBricks ?? [];

  async function nextRep() {
    setBusy(true);
    try {
      await flush().catch(() => {});
      const k = store.kw;
      const w = new Set(k.weakBricks ?? []);
      const held = BRICKS.filter((b) => !w.has(b.key));
      const brief = [
        `Next rep of “${piece.title}”.`,
        k.nextFix?.trim() ? `Fix this rep: ${k.nextFix.trim()}` : "",
        w.size ? `Weak last time: ${BRICKS.filter((b) => w.has(b.key)).map((b) => b.label).join(", ")}` : "",
        `Held bricks: ${held.map((b) => b.label).join(", ") || "none"}`,
        piece.lesson?.trim() ? `Lesson: ${piece.lesson.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      const nid = await create({
        title: `Next rep · ${piece.title}`.slice(0, 200),
        brand: piece.brand,
        format: piece.format,
        pillarId: piece.pillarId,
        platforms: piece.platforms,
        stage: "brief",
        brief,
      });
      // Hold the strong bricks; change the weak ones.
      const patch: KwPatch = {};
      if (!w.has("topic") && k.topic) patch.topic = k.topic;
      if (!w.has("angle")) {
        if (k.angle) patch.angle = k.angle;
        if (k.commonBelief) patch.commonBelief = k.commonBelief;
        if (k.contrarianTake) patch.contrarianTake = k.contrarianTake;
        if (k.emotion) patch.emotion = k.emotion;
      }
      if (!w.has("hookStructure")) {
        if (k.archetype) patch.archetype = k.archetype;
        if (k.hookFormat) patch.hookFormat = k.hookFormat;
      }
      if (!w.has("storyStructure") && k.structure) patch.structure = k.structure;
      if (!w.has("visualFormat") && k.visualFormat) patch.visualFormat = k.visualFormat;
      if (!w.has("keyVisuals") && k.keyVisual) {
        patch.keyVisual = k.keyVisual;
        if (k.visualCategory) patch.visualCategory = k.visualCategory;
      }
      if (!w.has("audio") && k.audioNote) patch.audioNote = k.audioNote;
      if (k.ctaRamp) patch.ctaRamp = k.ctaRamp;
      if (k.bucketId) patch.bucketId = k.bucketId;
      if (k.series) {
        patch.series = k.series;
        if (k.seriesNo) patch.seriesNo = k.seriesNo + 1;
      }
      if (Object.keys(patch).length) await saveKw({ id: nid, patch });
      set((c) => ({ steps: (c.steps ?? []).includes("review") ? c.steps : [...(c.steps ?? []), "review"] }));
      await flush().catch(() => {});
      reward("Next rep ready", undefined, false);
      router.push(`/content/${nid}`);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  if (!published && !long) {
    return <Note>Unlocks after you publish. Log the numbers (with the 3-second hold %) in Performance, then come back to find the weak brick.</Note>;
  }

  return (
    <div className="space-y-5">
      {long && <PredictRank store={store} rank={rank} publishedAt={piece.publishedAt} />}

      {!published ? (
        <Note>The rest of the post-mortem unlocks after you publish.</Note>
      ) : (
        <>
          <div className="space-y-2">
            <SubHead hint={snap ? `Latest snapshot · ${snap.window}` : undefined}>The numbers</SubHead>
            {snap ? (
              <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[
                  { k: "Views", v: fmtNum(snap.views) },
                  ...(long ? [] : [{ k: "3s hold", v: snap.hold3s != null ? `${snap.hold3s}%` : "—" }]),
                  { k: "Avg view", v: fmtDur(snap.avdSec) },
                  ...(long ? [{ k: "CTR", v: snap.ctr != null ? `${snap.ctr}%` : "—" }] : []),
                  { k: "Follows", v: fmtNum(snap.follows) },
                  { k: "Leads", v: fmtNum(snap.leads) },
                ].map((m) => (
                  <div key={m.k} className="rounded-lg border border-border p-2">
                    <dd className="text-base font-semibold tabular-nums leading-none">{m.v}</dd>
                    <dt className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{m.k}</dt>
                  </div>
                ))}
              </dl>
            ) : (
              <Note>Log your 24h / 7d numbers in Performance (including {long ? "CTR and average view duration" : "the 3-second hold %"}).</Note>
            )}
            {!long && snap?.hold3s != null && <Advice {...holdAdvice(snap.hold3s)} />}
            {long &&
              (rank ? (
                <Advice {...rankAdvice(rank.rank)} prefix={`#${rank.rank} of your last ${rank.of} long videos.`} />
              ) : (
                <p className="text-[11px] text-muted-foreground">Your 1-of-10 rank appears once you&apos;ve published 3+ long videos with view counts.</p>
              ))}
          </div>

          <div className="space-y-2">
            <SubHead hint="Diagnose a flop in this order. Tap the first one that fails: it marks that brick weak.">Flop diagnosis</SubHead>
            <ol className="space-y-1">
              {FLOP_DIAGNOSIS.map((f, i) => {
                const brick = FLOP_BRICK[f.key];
                const on = !!brick && weak.includes(brick);
                return (
                  <li key={f.key} className="flex items-start gap-2.5 rounded-lg border border-border px-2.5 py-2">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-tight">{f.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{f.hint}</span>
                    </span>
                    {brick && (
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => set((c) => ({ weakBricks: toggleIn(c.weakBricks, brick) }))}
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                          on ? "border-warning bg-warning-soft text-warning" : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {on ? "Weak" : "This was it"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="space-y-2">
            <SubHead hint="Compare each piece A vs B against the winner in your niche.">Which brick was weak?</SubHead>
            <div className="flex flex-wrap gap-1.5">
              {BRICKS.map((b) => (
                <Pill key={b.key} on={weak.includes(b.key)} onClick={() => set((c) => ({ weakBricks: toggleIn(c.weakBricks, b.key) }))} title={b.hint}>
                  {b.label}
                </Pill>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <SubHead hint="Close 1–2 gaps per rep. Be egoless about it.">Fix for the next rep</SubHead>
            <TextArea rows={2} className="min-h-0" value={kw.nextFix ?? ""} onChange={(e) => set({ nextFix: e.target.value })} placeholder="e.g. Show the key visual in the first second, not the third" />
          </div>

          <figure className="flex gap-2 rounded-lg bg-muted px-3 py-2.5">
            <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <blockquote className="text-sm leading-snug">
              The distance of iteration between reps is where the sauce is.
              <figcaption className="mt-0.5 text-[11px] text-muted-foreground">Kane Kallaway</figcaption>
            </blockquote>
          </figure>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void nextRep()} disabled={busy} className={buttonVariants({ size: "sm" })}>
              <Repeat2 className="h-3.5 w-3.5" /> Start next rep
            </button>
            <span className="text-[11px] text-muted-foreground">Same brand, format and pillar. Strong bricks held, the fix carried into the brief.</span>
          </div>
        </>
      )}
    </div>
  );
}

function Advice({ tone, text, prefix }: { tone: "success" | "info" | "warning"; text: string; prefix?: string }) {
  return (
    <Note tone={tone}>
      {prefix && <span className="font-medium">{prefix} </span>}
      {text}
    </Note>
  );
}

type Win = "h1" | "d1" | "w1";
const WIN_LABEL: Record<Win, string> = { h1: "Hour 1", d1: "Day 1", w1: "Week 1" };

function PredictRank({ store, rank, publishedAt }: { store: StepProps["store"]; rank: { rank: number; of: number } | null; publishedAt?: number }) {
  const { kw, set } = store;
  const pr = kw.predictRank ?? {};
  const setWin = (k: Win, raw: string) =>
    set((c) => {
      const next = { ...(c.predictRank ?? {}) };
      const n = Math.round(Number(raw));
      if (!raw.trim() || !Number.isFinite(n)) delete next[k];
      else next[k] = Math.max(1, Math.min(10, n));
      return { predictRank: next };
    });

  // Compare with the prediction for the window we're in now.
  const ageH = publishedAt ? (Date.now() - publishedAt) / 3_600_000 : 0;
  const nowWin: Win = ageH < 24 ? "h1" : ageH < 24 * 7 ? "d1" : "w1";
  const order: Win[] = nowWin === "h1" ? ["h1", "d1", "w1"] : nowWin === "d1" ? ["d1", "h1", "w1"] : ["w1", "d1", "h1"];
  const vsWin = order.find((w) => pr[w] != null);
  const predicted = vsWin ? pr[vsWin] : undefined;
  const gap = rank && predicted != null ? rank.rank - predicted : null;

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <SubHead hint="Before you publish: where will it rank among your last 10 uploads? Judge it against expectation, not your average." right={<Galloway />}>
        Predict your 1-of-10 rank
      </SubHead>
      <div className="grid grid-cols-3 gap-2">
        {(["h1", "d1", "w1"] as Win[]).map((w) => (
          <label key={w} className="block">
            <span className="text-[11px] font-medium text-muted-foreground">{WIN_LABEL[w]}</span>
            <TextInput
              type="number"
              min={1}
              max={10}
              inputMode="numeric"
              placeholder="1–10"
              value={pr[w] != null ? String(pr[w]) : ""}
              onChange={(e) => setWin(w, e.target.value)}
              className="mt-1 h-8 tabular-nums"
            />
          </label>
        ))}
      </div>
      {publishedAt ? (
        rank ? (
          <p className="text-xs">
            Actual now: <span className="font-semibold tabular-nums">#{rank.rank}</span> of {rank.of}
            {predicted != null && vsWin && (
              <span className="text-muted-foreground">
                {" "}
                · you predicted #{predicted} for {WIN_LABEL[vsWin].toLowerCase()}
              </span>
            )}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">The actual rank appears once you have 3+ long videos with view counts.</p>
        )
      ) : null}
      {gap != null &&
        (gap >= 2 ? (
          <Note tone="warning">
            Under expectation. Let the A/B test pick the thumbnail, then try the title. No data is better than bad data: change it now, don&apos;t &ldquo;give it more
            time&rdquo;.
          </Note>
        ) : gap <= 0 ? (
          <Note tone="success">At or above expectation: don&apos;t touch it. Good data is better than no data.</Note>
        ) : (
          <Note tone="info">Just under expectation. Don&apos;t change things constantly: make a big change only if it falls well short.</Note>
        ))}
      <p className="text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">No data is better than bad data.</span> Don&apos;t tinker with 10 title changes on day 1.
      </p>
    </div>
  );
}
