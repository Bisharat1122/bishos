"use client";

import { useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { ChevronDown, Lock, Sparkles, TrendingUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Chip, Dialog, Field, Segmented, Select, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { ARCHETYPES, BEGINNER_HOLD, BRICKS, type BrickKey } from "@/lib/kallaway";
import { FieldGroup } from "./bits";
import { BRAND_META, FORMATS, HOOK_TYPES, PLATFORMS, detectPlatform, errMsg, type Brand, type Pillar, type Swipe } from "./model";

type Form = {
  url: string;
  platform: string;
  creator: string;
  title: string;
  views: string;
  creatorAvgViews: string;
  transcript: string;
  hookText: string;
  hookVisual: string;
  hookSpoken: string;
  hookOnScreen: string;
  hookType: string;
  format: string;
  structure: string;
  whyItWorked: string;
  whatToSteal: string;
  pillarId: string;
  brand: "" | Brand;
};

const EMPTY: Form = {
  url: "",
  platform: "",
  creator: "",
  title: "",
  views: "",
  creatorAvgViews: "",
  transcript: "",
  hookText: "",
  hookVisual: "",
  hookSpoken: "",
  hookOnScreen: "",
  hookType: "",
  format: "",
  structure: "",
  whyItWorked: "",
  whatToSteal: "",
  pillarId: "",
  brand: "",
};

const fromSwipe = (s: Swipe): Form => ({
  url: s.url ?? "",
  platform: s.platform ?? "",
  creator: s.creator ?? "",
  title: s.title ?? "",
  views: s.views != null ? String(s.views) : "",
  creatorAvgViews: s.creatorAvgViews != null ? String(s.creatorAvgViews) : "",
  transcript: s.transcript ?? "",
  hookText: s.hookText ?? "",
  hookVisual: s.hookVisual ?? "",
  hookSpoken: s.hookSpoken ?? "",
  hookOnScreen: s.hookOnScreen ?? "",
  hookType: s.hookType ?? "",
  format: s.format ?? "",
  structure: s.structure ?? "",
  whyItWorked: s.whyItWorked ?? "",
  whatToSteal: s.whatToSteal ?? "",
  pillarId: s.pillarId ?? "",
  brand: s.brand ?? "",
});

const AI_KEYS = ["title", "hookText", "hookVisual", "hookSpoken", "hookOnScreen", "hookType", "format", "structure", "whyItWorked", "whatToSteal"] as const;

// Kallaway's 7 LEGO bricks (saved via contentSystem.saveBricks).
type Bricks = Record<BrickKey, string>;
const NO_BRICKS: Bricks = { topic: "", angle: "", hookStructure: "", storyStructure: "", visualFormat: "", keyVisuals: "", audio: "" };
const bricksOf = (s?: Swipe | null): Bricks => {
  const b = (s?.bricks ?? {}) as Partial<Record<BrickKey, string>>;
  return Object.fromEntries(BRICKS.map((x) => [x.key, b[x.key] ?? ""])) as Bricks;
};
/** Research bar: an outlier is >=5x the creator's average. */
const OUTLIER_BAR = 5;

function num(s: string): number | undefined {
  const m = /^(\d+(?:\.\d+)?)([km])?$/i.exec(s.replace(/[, ]/g, "").trim());
  if (!m) return undefined;
  return Math.round(Number(m[1]) * (m[2]?.toLowerCase() === "k" ? 1000 : m[2]?.toLowerCase() === "m" ? 1_000_000 : 1));
}

export function SaveSwipeDialog({
  open,
  onClose,
  pillars,
  swipe,
  defaultBrand,
  preset,
}: {
  open: boolean;
  onClose: () => void;
  pillars: Pillar[];
  swipe?: Swipe | null;
  defaultBrand?: Brand;
  /** Pre-select a watchlist creator (e.g. "log an outlier" from the Watchlist). */
  preset?: { creatorWatchId?: Id<"creatorWatch"> };
}) {
  const create = useMutation(api.swipes.create);
  const update = useMutation(api.swipes.update);
  const saveBricks = useMutation(api.contentSystem.saveBricks);
  const analyse = useAction(api.aiContent.analyseSwipe);
  const watch = useQuery(api.contentSystem.watchlist, {});
  const [bricks, setBricks] = useState<Bricks>(NO_BRICKS);
  const [archetype, setArchetype] = useState("");
  const [creatorWatchId, setCreatorWatchId] = useState("");
  const [bricksOpen, setBricksOpen] = useState(false);
  const presetApplied = useRef(false);
  const [f, setF] = useState<Form>(EMPTY);
  const [aiFilled, setAiFilled] = useState<Set<string>>(new Set());
  const [analysing, setAnalysing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [triedSave, setTriedSave] = useState(false);
  const fRef = useRef(f);
  fRef.current = f;

  useEffect(() => {
    if (!open) return;
    setF(swipe ? fromSwipe(swipe) : { ...EMPTY, brand: defaultBrand ?? "" });
    setAiFilled(new Set());
    setTriedSave(false);
    const b = bricksOf(swipe);
    setBricks(b);
    setArchetype(swipe?.archetype ?? "");
    setCreatorWatchId(swipe?.creatorWatchId ?? preset?.creatorWatchId ?? "");
    setBricksOpen(Object.values(b).some((v) => v.trim()) || !!swipe?.archetype);
    presetApplied.current = false;
  }, [open, swipe, defaultBrand, preset?.creatorWatchId]);

  /** Fill blank source fields from a watchlist creator. */
  const fillFromCreator = (id: string) => {
    const c = (watch ?? []).find((x) => x._id === id);
    if (!c) return;
    setF((x) => ({
      ...x,
      creator: x.creator.trim() ? x.creator : c.name,
      platform: x.platform || c.platform || "",
      creatorAvgViews: x.creatorAvgViews.trim() ? x.creatorAvgViews : c.avgViews != null ? String(c.avgViews) : "",
      brand: x.brand || c.brand || "",
    }));
  };

  // A preset creator fills in once the watchlist has loaded.
  useEffect(() => {
    if (!open || swipe || !preset?.creatorWatchId || !watch || presetApplied.current) return;
    presetApplied.current = true;
    fillFromCreator(preset.creatorWatchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, swipe, preset?.creatorWatchId, watch]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    if (aiFilled.has(k)) setAiFilled((s) => {
      const n = new Set(s);
      n.delete(k);
      return n;
    });
  };

  const views = num(f.views);
  const avg = num(f.creatorAvgViews);
  const ratio = views != null && avg ? Math.round((views / avg) * 10) / 10 : null;
  const whyMissing = !f.whyItWorked.trim();

  async function runAnalyse() {
    if (f.transcript.trim().length < 15) {
      toast("Paste the transcript or caption first", { tone: "warning" });
      return;
    }
    setAnalysing(true);
    try {
      const r = await analyse({
        transcript: f.transcript,
        url: f.url || undefined,
        platform: f.platform || undefined,
        creator: f.creator || undefined,
      });
      // Decide what to fill from the LATEST form (the user may have typed while
      // the AI ran). Don't collect this inside the setF updater: React may run
      // it later (or twice), leaving `filled` empty when it's read below.
      const cur = fRef.current;
      const filled = AI_KEYS.filter((k) => r[k] && !cur[k].trim());
      setF((x) => {
        const n = { ...x };
        for (const k of filled) if (!x[k].trim()) n[k] = r[k];
        return n;
      });
      const brickFill = BRICKS.map((x) => x.key).filter((k) => r.bricks?.[k] && !bricks[k].trim());
      if (brickFill.length) {
        setBricks((x) => {
          const n = { ...x };
          for (const k of brickFill) if (!x[k].trim()) n[k] = r.bricks[k];
          return n;
        });
        setBricksOpen(true);
      }
      const archFill = !!r.archetype && !archetype;
      if (archFill) setArchetype(r.archetype);
      setAiFilled(new Set<string>([...filled, ...brickFill.map((k) => `brick:${k}`), ...(archFill ? ["archetype"] : [])]));
      const n = filled.length + brickFill.length + (archFill ? 1 : 0);
      toast(
        n ? `AI filled ${n} fields${brickFill.length ? `, incl. ${brickFill.length} LEGO bricks` : ""}. Review them.` : "Your fields are already filled; nothing overwritten.",
        { tone: "info" },
      );
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setAnalysing(false);
    }
  }

  async function save() {
    setTriedSave(true);
    if (whyMissing) return;
    setBusy(true);
    const common = {
      url: f.url,
      platform: f.platform,
      creator: f.creator,
      title: f.title,
      hookText: f.hookText,
      hookVisual: f.hookVisual,
      hookSpoken: f.hookSpoken,
      hookOnScreen: f.hookOnScreen,
      hookType: f.hookType,
      format: f.format,
      structure: f.structure,
      whatToSteal: f.whatToSteal,
      transcript: f.transcript,
      whyItWorked: f.whyItWorked,
    };
    const cleanBricks = Object.fromEntries(BRICKS.map((x) => [x.key, bricks[x.key].trim()]).filter(([, v]) => v)) as Partial<Bricks>;
    const hadKw = !!swipe && (!!swipe.bricks || !!swipe.archetype || !!swipe.creatorWatchId);
    const hasKw = Object.keys(cleanBricks).length > 0 || !!archetype || !!creatorWatchId;
    const kwPatch = (swipeId: Id<"swipes">) =>
      saveBricks({
        swipeId,
        bricks: cleanBricks,
        archetype: archetype || (swipe?.archetype ? "" : undefined),
        creatorWatchId: creatorWatchId ? (creatorWatchId as Id<"creatorWatch">) : swipe?.creatorWatchId ? null : undefined,
      });
    try {
      if (swipe) {
        await update({
          id: swipe._id,
          ...common,
          views: views ?? null,
          creatorAvgViews: avg ?? null,
          pillarId: (f.pillarId || null) as Id<"contentPillars"> | null,
          brand: f.brand || null,
        });
        if (hasKw || hadKw) await kwPatch(swipe._id);
        toast("Inspiration updated", { tone: "success" });
      } else {
        const id = await create({
          ...common,
          views,
          creatorAvgViews: avg,
          pillarId: (f.pillarId || undefined) as Id<"contentPillars"> | undefined,
          brand: f.brand || undefined,
        });
        if (hasKw) await kwPatch(id);
        const nb = Object.keys(cleanBricks).length;
        toast(ratio != null && ratio >= OUTLIER_BAR ? `${ratio}× outlier saved` : "Saved to your inspiration library", {
          tone: "success",
          sub: nb ? `${nb}/7 bricks broken down. Ready to remix.` : "Broken down, ready to steal from",
        });
      }
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  const clearAi = (k: string) => {
    if (aiFilled.has(k))
      setAiFilled((s) => {
        const n = new Set(s);
        n.delete(k);
        return n;
      });
  };
  const setBrick = (k: BrickKey, v: string) => {
    setBricks((b) => ({ ...b, [k]: v }));
    clearAi(`brick:${k}`);
  };
  const brickCount = Object.values(bricks).filter((v) => v.trim()).length;

  const aiTag = (k: string) =>
    aiFilled.has(k) ? (
      <Chip tone="info" className="ml-1 h-4 px-1 text-[9px]">
        AI
      </Chip>
    ) : null;

  return (
    <Dialog open={open} onClose={onClose} title={swipe ? "Edit inspiration" : "Save inspiration"} size="xl">
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        Break it down now, while it&apos;s fresh. A saved post without <em>why it worked</em> is just a bookmark.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="grid gap-5 lg:grid-cols-2"
      >
        {/* Source */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</h3>
          <Field label="URL">
            <TextInput
              value={f.url}
              onChange={(e) => {
                const v = e.target.value;
                set("url", v);
                const p = detectPlatform(v);
                if (p && !f.platform) set("platform", p);
              }}
              placeholder="Paste the link"
              autoFocus={!swipe}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Platform">
              <Select value={f.platform} onChange={(e) => set("platform", e.target.value)}>
                <option value="">—</option>
                {PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Creator">
              <TextInput value={f.creator} onChange={(e) => set("creator", e.target.value)} placeholder="@handle" />
            </Field>
          </div>
          <Field label="From your watchlist" hint={watch && !watch.length ? "Add creators in Inspiration → Watchlist to link outliers to them." : undefined}>
            <Select
              value={creatorWatchId}
              onChange={(e) => {
                setCreatorWatchId(e.target.value);
                if (e.target.value) fillFromCreator(e.target.value);
              }}
              disabled={!watch?.length}
            >
              <option value="">{watch === undefined ? "Loading…" : "Not linked"}</option>
              {(watch ?? []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {c.avgViews != null ? ` · avg ${Intl.NumberFormat(undefined, { notation: "compact" }).format(c.avgViews)}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Views">
              <TextInput inputMode="numeric" value={f.views} onChange={(e) => set("views", e.target.value)} placeholder="e.g. 1.2m" />
            </Field>
            <Field label="Creator's usual views">
              <TextInput inputMode="numeric" value={f.creatorAvgViews} onChange={(e) => set("creatorAvgViews", e.target.value)} placeholder="e.g. 80k" />
            </Field>
          </div>
          {ratio != null && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                ratio >= OUTLIER_BAR ? "bg-success-soft text-success" : ratio >= 2 ? "bg-info-soft text-info" : "bg-muted text-muted-foreground",
              )}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold tabular-nums">{ratio}× outlier</span>
              <span className="text-xs">
                {ratio >= OUTLIER_BAR ? "5× or more: a real outlier, research it" : ratio >= 2 ? "above their usual, under the 5× research bar" : "about their usual"}
              </span>
            </div>
          )}
          <Field label={<span>Title {aiTag("title")}</span>}>
            <TextInput value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Short label (optional)" />
          </Field>
          <Field label="Transcript or caption" hint="Paste it and let AI pre-fill the breakdown. You confirm everything.">
            <TextArea value={f.transcript} onChange={(e) => set("transcript", e.target.value)} className="min-h-[150px] text-xs" placeholder="Paste the spoken words or the caption…" />
          </Field>
          <button type="button" onClick={() => void runAnalyse()} disabled={analysing || f.transcript.trim().length < 15} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Sparkles className={cn("h-3.5 w-3.5", analysing && "animate-pulse")} />
            {analysing ? "Analysing…" : "Analyse with AI"}
          </button>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Breakdown</h3>
          <Field label={<span>Hook {aiTag("hookText")}</span>}>
            <TextInput value={f.hookText} onChange={(e) => set("hookText", e.target.value)} placeholder="The line that stopped you" />
          </Field>
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label={<span>Seen {aiTag("hookVisual")}</span>}>
              <TextInput value={f.hookVisual} onChange={(e) => set("hookVisual", e.target.value)} placeholder="Frame 1" />
            </Field>
            <Field label={<span>Said {aiTag("hookSpoken")}</span>}>
              <TextInput value={f.hookSpoken} onChange={(e) => set("hookSpoken", e.target.value)} placeholder="First words" />
            </Field>
            <Field label={<span>On screen {aiTag("hookOnScreen")}</span>}>
              <TextInput value={f.hookOnScreen} onChange={(e) => set("hookOnScreen", e.target.value)} placeholder="Text overlay" />
            </Field>
          </div>
          <FieldGroup label={<span>Hook type {aiTag("hookType")}</span>}>
            <div className="flex flex-wrap gap-1">
              {HOOK_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.key}
                  title={t.hint}
                  onClick={() => set("hookType", f.hookType === t.key ? "" : t.key)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                    f.hookType === t.key ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </FieldGroup>
          <div className="grid grid-cols-2 gap-2">
            <Field label={<span>Format {aiTag("format")}</span>}>
              <Select value={f.format} onChange={(e) => set("format", e.target.value)}>
                <option value="">—</option>
                {FORMATS.map((x) => (
                  <option key={x.key} value={x.key}>
                    {x.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Pillar">
              <Select value={f.pillarId} onChange={(e) => set("pillarId", e.target.value)}>
                <option value="">—</option>
                {pillars.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label={<span>Structure {aiTag("structure")}</span>}>
            <TextInput value={f.structure} onChange={(e) => set("structure", e.target.value)} placeholder="Hook → Problem → 3 tips → CTA" />
          </Field>
          <Field
            label={
              <span className={cn(triedSave && whyMissing && "text-danger")}>
                Why it worked <span className="text-danger">*</span> {aiTag("whyItWorked")}
              </span>
            }
            hint={triedSave && whyMissing ? <span className="text-danger">Required. One honest sentence is enough.</span> : "The reason, not the topic. This is what you'll reuse."}
          >
            <TextArea
              value={f.whyItWorked}
              onChange={(e) => set("whyItWorked", e.target.value)}
              className={cn("min-h-[64px]", triedSave && whyMissing && "border-danger")}
              placeholder="e.g. Opens on a specific number, then breaks a belief everyone holds"
            />
          </Field>
          <Field label={<span>What to steal {aiTag("whatToSteal")}</span>}>
            <TextArea value={f.whatToSteal} onChange={(e) => set("whatToSteal", e.target.value)} className="min-h-[56px]" placeholder="The transferable move" />
          </Field>
          <FieldGroup label="For">
            {/* kit Segmented buttons have no type: inside this <form> a click would submit it */}
            <div onClick={(e) => e.preventDefault()}>
            <Segmented<"" | Brand>
              size="sm"
              value={f.brand}
              onChange={(v) => set("brand", v)}
              options={[
                { value: "", label: "Both" },
                { value: "personal", label: "Personal", icon: BRAND_META.personal.icon },
                { value: "company", label: "Company", icon: BRAND_META.company.icon },
              ]}
            />
            </div>
          </FieldGroup>
        </div>

        {/* 7 LEGO bricks */}
        <div className="rounded-xl border border-border lg:col-span-2">
          <button
            type="button"
            onClick={() => setBricksOpen((o) => !o)}
            aria-expanded={bricksOpen}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                7 LEGO bricks
                <Chip tone={brickCount === 7 ? "success" : "muted"} className="tabular-nums">
                  {brickCount}/7
                </Chip>
                {archetype && <Chip tone="outline">{ARCHETYPES.find((a) => a.key === archetype)?.label}</Chip>}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Explode the outlier into 7 pieces. Hold the world-class ones, remix the rest.</span>
            </span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", bricksOpen && "rotate-180")} />
          </button>
          {bricksOpen && (
            <div className="fade-in grid gap-3 border-t border-border p-4 sm:grid-cols-2">
              {BRICKS.map((x) => (
                <Field
                  key={x.key}
                  label={
                    <span className="inline-flex items-center gap-1">
                      {x.label}
                      {BEGINNER_HOLD.includes(x.key) && <Lock className="h-3 w-3" aria-label="Beginners hold this brick" />}
                      {aiTag(`brick:${x.key}`)}
                    </span>
                  }
                >
                  {x.key === "angle" || x.key === "topic" ? (
                    <TextArea
                      value={bricks[x.key]}
                      onChange={(e) => setBrick(x.key, e.target.value)}
                      placeholder={x.hint}
                      className="min-h-[64px] text-sm"
                    />
                  ) : (
                    <TextInput value={bricks[x.key]} onChange={(e) => setBrick(x.key, e.target.value)} placeholder={x.hint} />
                  )}
                </Field>
              ))}
              <Field label={<span>Hook archetype {aiTag("archetype")}</span>}>
                <Select
                  value={archetype}
                  onChange={(e) => {
                    setArchetype(e.target.value);
                    clearAi("archetype");
                  }}
                >
                  <option value="">—</option>
                  {ARCHETYPES.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.label} · {a.contrast}
                    </option>
                  ))}
                </Select>
              </Field>
              <p className="flex items-start gap-1 text-[11px] text-muted-foreground sm:col-span-2">
                <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                Beginners hold hook structure, story structure and visual format, and change topic + angle every rep.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4 lg:col-span-2">
          {whyMissing && <span className="mr-auto text-xs text-muted-foreground">Add “why it worked” to save.</span>}
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={buttonVariants({ size: "sm" })}>
            {swipe ? "Save changes" : "Save inspiration"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
