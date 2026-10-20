"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileText,
  GitFork,
  Layers,
  LineChart,
  Magnet,
  Megaphone,
  NotebookPen,
  Recycle,
  Rocket,
  Scissors,
  Settings2,
  Sparkles,
  StickyNote,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Bar, CheckCircle, Chip, Field, PageShell, Section, Select, TextInput, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { fmtYmd, relDay, useToday } from "@/lib/day";
import { AiBox } from "./AiBox";
import { HookPicker } from "./HookPicker";
import { PerformanceEditor } from "./PerformanceEditor";
import { RepurposeDialog } from "./RepurposeDialog";
import { BrandBadge, BrandPicker, FieldGroup, FormatBadge, HubBadge, PlatformChip, RatioChip, StageChip } from "./bits";
import { combineStatus, useDraft } from "./useDraft";
import { useStageMover, type MovablePiece } from "./useStageMover";
import { WorkflowPanel } from "./kallaway/WorkflowPanel";
import {
  FORMATS,
  HOOK_TYPES,
  PLATFORMS,
  SCRIPT_TEMPLATES,
  STAGE_LABEL,
  STAGE_ORDER,
  TEXT_FORMATS,
  checklistFor,
  errMsg,
  fmtNum,
  fmtRatio,
  formatMeta,
  hookLabel,
  isChecked,
  isPublishMove,
  pillarColor,
  platformMeta,
  scriptStats,
  type FullPiece,
  type Stage,
} from "./model";

type Task<T> = { loading: boolean; error: string | null; data: T | null } | null;

function useAiTask<T>() {
  const [state, setState] = useState<Task<T>>(null);
  const run = async (fn: () => Promise<T>) => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await fn();
      setState({ loading: false, error: null, data });
    } catch (e) {
      setState({ loading: false, error: errMsg(e), data: null });
    }
  };
  return { state, run, clear: () => setState(null) };
}

const copy = (text: string) => {
  void navigator.clipboard
    ?.writeText(text)
    .then(() => toast("Copied"))
    .catch(() => toast("Couldn't copy", { tone: "warning" }));
};

export function PieceEditor({ piece }: { piece: FullPiece }) {
  const router = useRouter();
  const today = useToday();
  const id = piece._id;

  const update = useMutation(api.content.update);
  const remove = useMutation(api.content.remove);
  const toggle = useMutation(api.content.toggleChecklist);
  const create = useMutation(api.content.create);
  const linkSwipe = useMutation(api.content.linkSwipe);
  const unlinkSwipe = useMutation(api.content.unlinkSwipe);
  const recycle = useMutation(api.content.recycle);
  const saveHook = useMutation(api.swipes.saveHookFromPiece);
  const createHook = useMutation(api.swipes.createHook);

  const pillars = useQuery(api.content.listPillars, { today });
  const campaigns = useQuery(api.content.campaignOptions);
  const notes = useQuery(api.content.noteOptions);
  const swipes = useQuery(api.swipes.list);
  const mover = useStageMover();

  const hookVariations = useAction(api.aiContent.hookVariations);
  const repurposeDrafts = useAction(api.aiContent.repurposeDrafts);
  const tightenScript = useAction(api.aiContent.tightenScript);
  const feynman = useAction(api.aiContent.feynman);
  const hooksAi = useAiTask<{ text: string; hookType: string }[]>();
  const tightenAi = useAiTask<string>();
  const draftsAi = useAiTask<{ format: string; platform: string; title: string; body: string }[]>();
  const feynmanAi = useAiTask<{ explanation: string; jargon: string[]; posts: { angle: string; text: string }[] }>();
  const [createdDrafts, setCreatedDrafts] = useState<Set<number>>(new Set());
  const [repurposeOpen, setRepurposeOpen] = useState(false);

  const patch = (a: Omit<Parameters<typeof update>[0], "id">) =>
    update({ id, ...a }).catch((e) => {
      toast(errMsg(e), { tone: "warning" });
    });

  const title = useDraft(piece.title, (v) => (v.trim() ? update({ id, title: v }) : Promise.resolve()));
  const hook = useDraft(piece.hook ?? "", (v) => update({ id, hook: v }));
  const brief = useDraft(piece.brief ?? "", (v) => update({ id, brief: v }));
  const script = useDraft(piece.script ?? "", (v) => update({ id, script: v }), 1000);
  const cta = useDraft(piece.cta ?? "", (v) => update({ id, cta: v }));
  const url = useDraft(piece.url ?? "", (v) => update({ id, url: v }));
  const lesson = useDraft(piece.lesson ?? "", (v) => update({ id, lesson: v }));
  // Date inputs keep a local draft too: a controlled input bound straight to
  // the server value is reset by React on every keystroke until the mutation
  // round-trips, which garbles typed dates (e.g. "25" saved as "05").
  const sched = useDraft(piece.scheduledFor ?? "", (v) => update({ id, scheduledFor: v || null }), 600);
  const pubOn = useDraft(piece.publishedOn ?? "", (v) => (v ? update({ id, publishedOn: v }) : Promise.resolve()), 600);
  const status = combineStatus([
    title.status,
    hook.status,
    brief.status,
    script.status,
    cta.status,
    url.status,
    lesson.status,
    sched.status,
    pubOn.status,
  ]);

  const movable: MovablePiece = {
    _id: id,
    title: piece.title,
    format: piece.format,
    stage: piece.stage,
    checklist: piece.checklist,
    pillarId: piece.pillarId,
    childCount: piece.children.length,
    publishedAt: piece.publishedAt,
    isHub: piece.isHub,
  };
  const items = checklistFor(piece.format);
  const checkState = { ...movable, checklist: piece.checklist ?? [] };
  const doneCount = items.filter((c) => isChecked(c.key, checkState)).length;
  const stats = useMemo(() => scriptStats(script.value), [script.value]);
  const isText = TEXT_FORMATS.has(piece.format);
  const published = !!piece.publishedAt;
  const pillarList = pillars ?? [];
  const brandPillars = pillarList.filter((p) => p.brand === piece.brand || p._id === piece.pillarId);
  const linkedIds = new Set((piece.swipeIds ?? []) as string[]);

  function insertTemplate(key: string) {
    const t = SCRIPT_TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    if (!script.value.trim()) script.onChange(t.body);
    else {
      script.onChange(`${script.value.trimEnd()}\n\n---\n\n${t.body}`);
      toast("Template added below your script");
    }
  }

  async function del() {
    if (!confirm(`Delete “${piece.title}”? This can't be undone.`)) return;
    try {
      await remove({ id });
      // replace: Back must not land on the deleted piece.
      router.replace("/content");
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  }

  const savedLabel = status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Couldn't save. Retrying on next edit." : "";

  return (
    <PageShell
      title={
        <input
          value={title.value}
          onChange={(e) => title.onChange(e.target.value)}
          onBlur={() => void title.flush()}
          aria-label="Title"
          placeholder="Working title"
          size={Math.max(14, Math.min(64, title.value.length + 2))}
          className="max-w-full rounded-md bg-transparent outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      }
      subtitle={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/content" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Content Studio
          </Link>
          <BrandBadge brand={piece.brand} />
          <FormatBadge format={piece.format} />
          {piece.isHub && <HubBadge />}
          {piece.pillar && (
            <span className="inline-flex items-center gap-1.5 text-[11px]">
              <span className="size-2 rounded-full" style={{ background: pillarColor(piece.pillar) }} />
              {piece.pillar.name}
            </span>
          )}
          {savedLabel && <span className={cn("text-[11px]", status === "error" ? "text-warning" : "text-muted-foreground")}>{savedLabel}</span>}
        </span>
      }
      actions={
        <>
          <StageChip stage={piece.stage} />
          <Select
            aria-label="Stage"
            value={piece.stage}
            onChange={(e) => void mover.move(movable, e.target.value as Stage)}
            className="h-8 w-auto min-w-[150px]"
          >
            {STAGE_ORDER.map((s) => (
              <option key={s} value={s} disabled={isText && ["ready_to_record", "recorded", "editing"].includes(s)}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </Select>
          {piece.next && !isPublishMove(piece.next, piece) && (
            <button onClick={() => void mover.advance(movable)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              {STAGE_LABEL[piece.next]} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {!published && (
            <button onClick={() => void mover.move(movable, "published")} className={buttonVariants({ size: "sm" })}>
              <Rocket className="h-3.5 w-3.5" /> Publish
            </button>
          )}
          {piece.isHub && (
            <button onClick={() => setRepurposeOpen(true)} className={buttonVariants({ variant: published ? "default" : "outline", size: "sm" })}>
              <GitFork className="h-3.5 w-3.5" /> Repurpose
            </button>
          )}
          <button aria-label="Delete piece" onClick={() => void del()} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "hover:text-danger")}>
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ───────────── Main column ───────────── */}
        <div className="min-w-0 space-y-4">
          {/* Kallaway per-video workflow; writes the script through the same draft so autosave stays intact. */}
          <WorkflowPanel piece={piece} script={script.value} setScript={script.onChange} />

          <Section
            title="Hook"
            icon={Magnet}
            hint="The first 2 seconds / first line. Worth 10 minutes of your time."
            action={
              <HookPicker
                align="right"
                onPick={(h) => {
                  hook.onChange(h.text);
                  if (h.hookType) void patch({ hookType: h.hookType });
                }}
              />
            }
          >
            <textarea
              value={hook.value}
              onChange={(e) => hook.onChange(e.target.value)}
              onBlur={() => void hook.flush()}
              rows={2}
              placeholder="Write the line that stops the scroll…"
              className={cn(inputClass, "w-full resize-y py-2 text-base font-medium leading-snug sm:text-lg")}
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {HOOK_TYPES.map((t) => {
                const on = piece.hookType === t.key;
                return (
                  <button
                    key={t.key}
                    title={t.hint}
                    onClick={() => void patch({ hookType: on ? null : t.key })}
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                      on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  void hooksAi.run(async () => {
                    await hook.flush();
                    return hookVariations({ pieceId: id, hook: hook.value || undefined, hookType: piece.hookType || undefined });
                  })
                }
                disabled={hooksAi.state?.loading}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Sparkles className="h-3.5 w-3.5" /> 10 hook variations
              </button>
              {hook.value.trim() && (
                <button
                  onClick={async () => {
                    await hook.flush();
                    try {
                      const r = await saveHook({ pieceId: id });
                      toast(r.existed ? "Already in your hook library" : "Hook saved to library", { tone: "success" });
                    } catch (e) {
                      toast(errMsg(e), { tone: "warning" });
                    }
                  }}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  <BookmarkPlus className="h-3.5 w-3.5" /> Save to library
                </button>
              )}
            </div>
            {hooksAi.state && (
              <AiBox
                title="Hook variations"
                className="mt-3"
                loading={hooksAi.state.loading}
                error={hooksAi.state.error}
                onClose={hooksAi.clear}
                onRetry={() => void hooksAi.run(() => hookVariations({ pieceId: id, hook: hook.value || undefined, hookType: piece.hookType || undefined }))}
              >
                <ul className="space-y-1">
                  {(hooksAi.state.data ?? []).map((h, i) => (
                    <li key={i} className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-card">
                      <span className="mt-0.5 w-4 shrink-0 text-[11px] tabular-nums text-muted-foreground">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">{h.text}</p>
                        {h.hookType && <span className="text-[10px] text-muted-foreground">{hookLabel(h.hookType)}</span>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => {
                            hook.onChange(h.text);
                            if (h.hookType) void patch({ hookType: h.hookType });
                            toast("Hook updated");
                          }}
                          className={cn(buttonVariants({ size: "sm" }), "h-7 px-2 text-xs")}
                        >
                          Use
                        </button>
                        <button
                          title="Save to hook library"
                          aria-label="Save to hook library"
                          onClick={() =>
                            void createHook({ text: h.text, hookType: h.hookType || undefined, note: `AI variation for ${piece.title}` })
                              .then((r) => toast(r.existed ? "Already in your library" : "Saved to library", { tone: "success" }))
                              .catch((e) => toast(errMsg(e), { tone: "warning" }))
                          }
                          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-7")}
                        >
                          <BookmarkPlus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </AiBox>
            )}
          </Section>

          <Section
            title="Brief"
            icon={NotebookPen}
            hint="Who it's for, the one idea, the angle, the proof you'll use."
            action={
              (piece.sourceNote || brief.value.trim().length > 20) && (
                <button
                  onClick={() =>
                    void feynmanAi.run(async () => {
                      await brief.flush();
                      // Use the resolved note: a stale sourceNoteId (note deleted) would fail with "Note not found".
                      return piece.sourceNote ? feynman({ noteId: piece.sourceNote._id }) : feynman({ text: `${piece.title}\n\n${brief.value}` });
                    })
                  }
                  disabled={feynmanAi.state?.loading}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  title="Explain it simply, flag jargon, draft 3 short posts"
                >
                  <Wand2 className="h-3.5 w-3.5" /> Simple explanation
                </button>
              )
            }
          >
            <textarea
              value={brief.value}
              onChange={(e) => brief.onChange(e.target.value)}
              onBlur={() => void brief.flush()}
              rows={4}
              placeholder={"Audience: …\nOne idea: …\nAngle: …\nProof: …"}
              className={cn(inputClass, "w-full resize-y py-2 leading-relaxed")}
            />
            {feynmanAi.state && (
              <AiBox
                title="Simple explanation"
                className="mt-3"
                loading={feynmanAi.state.loading}
                error={feynmanAi.state.error}
                onClose={feynmanAi.clear}
              >
                {feynmanAi.state.data && (
                  <div className="space-y-3">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{feynmanAi.state.data.explanation}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => brief.onChange(`${brief.value.trimEnd()}${brief.value.trim() ? "\n\n" : ""}${feynmanAi.state!.data!.explanation}`)}
                        className={cn(buttonVariants({ size: "sm" }), "h-7 text-xs")}
                      >
                        Insert into brief
                      </button>
                      <button onClick={() => copy(feynmanAi.state!.data!.explanation)} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs")}>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                    </div>
                    {feynmanAi.state.data.jargon.length > 0 && (
                      <div>
                        <p className="mb-1 text-[11px] font-medium text-muted-foreground">Jargon to define (or gaps to learn)</p>
                        <div className="flex flex-wrap gap-1">
                          {feynmanAi.state.data.jargon.map((j) => (
                            <Chip key={j} tone="info">
                              {j}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                    {feynmanAi.state.data.posts.map((p, i) => (
                      <div key={i} className="rounded-lg border border-border bg-card p-2.5">
                        <Chip tone="muted" className="mb-1.5 uppercase">
                          {p.angle}
                        </Chip>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.text}</p>
                        <div className="mt-2 flex gap-1.5">
                          <button
                            onClick={async () => {
                              try {
                                const nid = await create({
                                  title: p.text.split("\n")[0].slice(0, 120) || `${p.angle} · ${piece.title}`,
                                  brand: piece.brand,
                                  format: "text_post",
                                  stage: "seed",
                                  script: p.text,
                                  pillarId: piece.pillar?._id,
                                  sourceNoteId: piece.sourceNote?._id,
                                  learningAreaId: piece.learningArea?._id,
                                  hookType: p.angle === "mistake" ? "mistake" : p.angle === "myth-bust" ? "myth" : undefined,
                                });
                                toast("Seed created", { tone: "success", sub: "It's in your Ideas column" });
                                void nid;
                              } catch (e) {
                                toast(errMsg(e), { tone: "warning" });
                              }
                            }}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}
                          >
                            Create as seed
                          </button>
                          <button onClick={() => copy(p.text)} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs")}>
                            <Copy className="h-3.5 w-3.5" /> Copy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AiBox>
            )}
          </Section>

          <Section
            title="Script"
            icon={FileText}
            hint={`${stats.words} words · ≈ ${stats.label} spoken at 150 wpm`}
            action={
              <Select
                aria-label="Insert a script template"
                value=""
                onChange={(e) => insertTemplate(e.target.value)}
                className="h-8 w-auto max-w-[180px] text-xs"
              >
                <option value="">Template…</option>
                {SCRIPT_TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </Select>
            }
          >
            <textarea
              value={script.value}
              onChange={(e) => script.onChange(e.target.value)}
              onBlur={() => void script.flush()}
              placeholder="Write the script here. Pick a template above to start from a proven structure."
              className={cn(inputClass, "min-h-[360px] w-full resize-y py-3 leading-7 sm:min-h-[460px]")}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  void tightenAi.run(async () => {
                    await script.flush();
                    return tightenScript({ script: script.value, format: piece.format, pieceId: id });
                  })
                }
                disabled={tightenAi.state?.loading || script.value.trim().length < 30}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Scissors className="h-3.5 w-3.5" /> Tighten script
              </button>
              <button
                onClick={() =>
                  void draftsAi.run(async () => {
                    await script.flush();
                    setCreatedDrafts(new Set());
                    return repurposeDrafts({ pieceId: id, script: script.value || undefined });
                  })
                }
                disabled={draftsAi.state?.loading || (script.value.trim().length < 40 && brief.value.trim().length < 40)}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <GitFork className="h-3.5 w-3.5" /> Draft repurposed posts
              </button>
              <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                {stats.words} words · ≈ {stats.label}
              </span>
            </div>

            {tightenAi.state && (
              <AiBox title="Tightened script" className="mt-3" loading={tightenAi.state.loading} error={tightenAi.state.error} onClose={tightenAi.clear}>
                {tightenAi.state.data && (
                  <>
                    <p className="mb-2 text-[11px] text-muted-foreground">
                      {scriptStats(tightenAi.state.data).words} words (was {stats.words}) · ≈ {scriptStats(tightenAi.state.data).label}
                    </p>
                    <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-sm leading-relaxed scrollbar-thin">
                      {tightenAi.state.data}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          script.onChange(tightenAi.state!.data!);
                          tightenAi.clear();
                          toast("Script replaced", { tone: "success" });
                        }}
                        className={cn(buttonVariants({ size: "sm" }), "h-7 text-xs")}
                      >
                        <Check className="h-3.5 w-3.5" /> Accept &amp; replace
                      </button>
                      <button onClick={() => copy(tightenAi.state!.data!)} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs")}>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                    </div>
                  </>
                )}
              </AiBox>
            )}

            {draftsAi.state && (
              <AiBox title="Repurposed drafts" className="mt-3" loading={draftsAi.state.loading} error={draftsAi.state.error} onClose={draftsAi.clear}>
                <div className="space-y-2">
                  {(draftsAi.state.data ?? []).map((d, i) => {
                    const done = createdDrafts.has(i);
                    return (
                      <div key={i} className="rounded-lg border border-border bg-card p-3">
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                          <FormatBadge format={d.format} />
                          {d.platform && <PlatformChip platform={d.platform} />}
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">{d.title}</span>
                        </div>
                        <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground scrollbar-thin">{d.body}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <button
                            disabled={done}
                            onClick={async () => {
                              try {
                                await create({
                                  title: `${formatMeta(d.format).label} · ${d.title}`.slice(0, 200),
                                  brand: piece.brand,
                                  format: d.format,
                                  platforms: d.platform ? [d.platform] : undefined,
                                  stage: "script",
                                  parentId: id,
                                  pillarId: piece.pillar?._id,
                                  campaignId: piece.campaign?._id,
                                  script: d.body,
                                });
                                setCreatedDrafts((s) => new Set(s).add(i));
                                toast("Child piece created", { tone: "success" });
                              } catch (e) {
                                toast(errMsg(e), { tone: "warning" });
                              }
                            }}
                            className={cn(buttonVariants({ variant: done ? "secondary" : "default", size: "sm" }), "h-7 text-xs")}
                          >
                            {done ? (
                              <>
                                <Check className="h-3.5 w-3.5" /> Created
                              </>
                            ) : (
                              "Create as child piece"
                            )}
                          </button>
                          <button onClick={() => copy(d.body)} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs")}>
                            <Copy className="h-3.5 w-3.5" /> Copy
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AiBox>
            )}

            <div className="mt-4">
              <Field label="Call to action">
                <TextInput
                  value={cta.value}
                  onChange={(e) => cta.onChange(e.target.value)}
                  onBlur={() => void cta.flush()}
                  placeholder="e.g. Comment “TEMPLATE” and I'll send it"
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* ───────────── Sidebar ───────────── */}
        <aside className="min-w-0 space-y-4">
          <Section title="Details" icon={Settings2}>
            <div className="space-y-3">
              <FieldGroup label="Brand">
                <div>
                  <BrandPicker value={piece.brand} onChange={(b) => void patch({ brand: b })} />
                </div>
              </FieldGroup>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Pillar">
                  <Select
                    value={piece.pillarId ?? ""}
                    onChange={(e) => void patch({ pillarId: (e.target.value || null) as Id<"contentPillars"> | null })}
                  >
                    <option value="">No pillar</option>
                    {/* While the pillar list loads, still show the current pillar instead of "No pillar". */}
                    {piece.pillar && !brandPillars.some((p) => p._id === piece.pillar!._id) && <option value={piece.pillar._id}>{piece.pillar.name}</option>}
                    {brandPillars.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Format">
                  <Select value={piece.format} onChange={(e) => void patch({ format: e.target.value })}>
                    {FORMATS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <FieldGroup label="Platforms">
                <div className="flex flex-wrap gap-1">
                  {PLATFORMS.map((p) => {
                    const on = piece.platforms?.includes(p.key) ?? false;
                    const I = p.icon;
                    return (
                      <button
                        type="button"
                        key={p.key}
                        aria-pressed={on}
                        onClick={() =>
                          void patch({ platforms: on ? (piece.platforms ?? []).filter((x) => x !== p.key) : [...(piece.platforms ?? []), p.key] })
                        }
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                          on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <I className="h-3 w-3" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </FieldGroup>
              <button
                type="button"
                onClick={() => void patch({ isHub: !piece.isHub })}
                aria-pressed={!!piece.isHub}
                className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2 text-left transition-colors hover:bg-accent/50"
              >
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">Hub piece</span>
                  <span className="block text-[11px] text-muted-foreground">The weekly long piece you cut into 5–10 short ones</span>
                </span>
                <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", piece.isHub ? "bg-primary" : "bg-muted")}>
                  <span className={cn("absolute top-0.5 size-4 rounded-full bg-background shadow-xs transition-[left]", piece.isHub ? "left-[18px]" : "left-0.5")} />
                </span>
              </button>
              {published ? (
                <Field label="Published on">
                  <TextInput type="date" value={pubOn.value} onChange={(e) => pubOn.onChange(e.target.value)} onBlur={() => void pubOn.flush()} />
                </Field>
              ) : (
                <Field label="Publish on" hint={sched.value ? relDay(sched.value, today) : "Pick a day; drag it around in the calendar later."}>
                  <div className="flex gap-1">
                    <TextInput type="date" value={sched.value} onChange={(e) => sched.onChange(e.target.value)} onBlur={() => void sched.flush()} />
                    {sched.value && (
                      <button
                        aria-label="Clear date"
                        onClick={() => {
                          sched.onChange("");
                          void sched.flush();
                        }}
                        className={buttonVariants({ variant: "ghost", size: "icon" })}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </Field>
              )}
              <Field label="Live URL">
                <div className="flex gap-1">
                  <TextInput value={url.value} onChange={(e) => url.onChange(e.target.value)} onBlur={() => void url.flush()} placeholder="https://…" />
                  {url.value.trim() && (
                    <a href={url.value} target="_blank" rel="noreferrer" aria-label="Open" className={buttonVariants({ variant: "ghost", size: "icon" })}>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </Field>
              <Field label="Campaign">
                <Select value={piece.campaignId ?? ""} onChange={(e) => void patch({ campaignId: (e.target.value || null) as Id<"campaigns"> | null })}>
                  <option value="">{campaigns && campaigns.length === 0 ? "No campaigns yet" : "None"}</option>
                  {(campaigns ?? []).map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Section>

          <Section
            title="Publish checklist"
            icon={ClipboardCheck}
            action={<span className="text-xs tabular-nums text-muted-foreground">{doneCount}/{items.length}</span>}
          >
            <Bar value={(doneCount / items.length) * 100} tone={doneCount === items.length ? "success" : "primary"} className="mb-3" />
            <ul className="space-y-0.5">
              {items.map((c) => {
                const on = isChecked(c.key, checkState);
                const auto = !!c.auto && on && !(piece.checklist ?? []).includes(c.key);
                return (
                  <li key={c.key} className="flex items-start gap-2.5 rounded-md px-1 py-1">
                    <CheckCircle
                      size="sm"
                      checked={on}
                      label={c.label}
                      onClick={() => !auto && void toggle({ id, key: c.key, done: !on }).catch((e) => toast(errMsg(e), { tone: "warning" }))}
                    />
                    <span className="min-w-0">
                      <span className={cn("block text-sm leading-tight", on && "text-muted-foreground")}>{c.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{auto ? "Done automatically" : c.hint}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            {published ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                Published {piece.publishedOn ? relDay(piece.publishedOn, today).toLowerCase() : ""}
                {piece.recycleAt && <span className="ml-auto text-[11px]">Recycle {fmtYmd(piece.recycleAt, { month: "short", year: "numeric" })}</span>}
              </div>
            ) : (
              <button onClick={() => void mover.move(movable, "published")} className={cn(buttonVariants({ size: "sm" }), "mt-3 w-full")}>
                <Rocket className="h-3.5 w-3.5" /> Publish
              </button>
            )}
          </Section>

          <Section title="Performance" icon={LineChart} hint="Snapshots at 24h, 7d and 30d, compared to your own median.">
            {published ? (
              <>
                {piece.perf ? (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-2xl font-semibold tabular-nums leading-none">{fmtNum(piece.perf.views)}</span>
                    <span className="text-xs text-muted-foreground">views · {piece.perf.window}</span>
                    {piece.perf.ratio != null ? (
                      <RatioChip ratio={piece.perf.ratio} basis={piece.perf.basis} long className="ml-auto" />
                    ) : (
                      <span className="ml-auto text-[11px] text-muted-foreground">Median appears after 2+ pieces</span>
                    )}
                  </div>
                ) : null}
                {piece.perf?.median != null && (
                  <p className="-mt-1 mb-3 text-[11px] text-muted-foreground">
                    Your median: {fmtNum(piece.perf.median)} ({piece.perf.basis === "format" ? `${formatMeta(piece.format).label.toLowerCase()}s` : "all formats"},{" "}
                    {piece.perf.window})
                  </p>
                )}
                <PerformanceEditor pieceId={id} performance={piece.performance ?? []} format={piece.format} brand={piece.brand} />
                {piece.perf?.ratio != null && piece.perf.ratio >= 1.2 && piece.hook && (
                  <button
                    onClick={() =>
                      void saveHook({ pieceId: id, note: `${fmtRatio(piece.perf!.ratio!)} your median` })
                        .then((r) => toast(r.existed ? "Already in your hook library" : "Winning hook saved", { tone: "success" }))
                        .catch((e) => toast(errMsg(e), { tone: "warning" }))
                    }
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 w-full")}
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" /> Outlier! Save hook to library
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Numbers unlock once it&apos;s published.</p>
            )}
          </Section>

          <Section title="Lesson" icon={BookOpen} hint={published ? "Why did it work (or not)? One line you'll reuse." : "Fill this in after the 7-day numbers."}>
            <textarea
              value={lesson.value}
              onChange={(e) => lesson.onChange(e.target.value)}
              onBlur={() => void lesson.flush()}
              rows={3}
              placeholder="e.g. Specific numbers in the hook doubled the saves"
              className={cn(inputClass, "w-full resize-y py-2 text-sm leading-relaxed")}
            />
            {published && (
              <button
                onClick={async () => {
                  try {
                    const nid = await recycle({ id, date: today });
                    reward("Recycled · fresh copy ready", undefined, false);
                    router.push(`/content/${nid}`);
                  } catch (e) {
                    toast(errMsg(e), { tone: "warning" });
                  }
                }}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-2")}
              >
                <Recycle className="h-3.5 w-3.5" /> Recycle now
              </button>
            )}
          </Section>

          <Section
            title="Repurpose tree"
            icon={GitFork}
            action={
              piece.isHub ? (
                <button onClick={() => setRepurposeOpen(true)} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}>
                  Repurpose…
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await patch({ isHub: true });
                    setRepurposeOpen(true);
                  }}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs")}
                >
                  Make it a hub
                </button>
              )
            }
          >
            <div className="text-sm">
              {piece.parent && (
                <Link href={`/content/${piece.parent._id}`} className="mb-1 flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent/50">
                  <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{piece.parent.title}</span>
                  <StageChip stage={piece.parent.stage} />
                </Link>
              )}
              <div className={cn("flex items-center gap-2 rounded-md bg-muted/60 px-1.5 py-1 font-medium", piece.parent && "ml-4")}>
                <FormatBadge format={piece.format} iconOnly />
                <span className="min-w-0 flex-1 truncate">{title.value || piece.title}</span>
                <span className="text-[10px] text-muted-foreground">this</span>
              </div>
              {piece.children.length > 0 && (
                <ul className={cn("mt-1 space-y-0.5 border-l border-border pl-3", piece.parent ? "ml-8" : "ml-3")}>
                  {piece.children.map((c) => (
                    <li key={c._id}>
                      <Link href={`/content/${c._id}`} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent/50">
                        <FormatBadge format={c.format} iconOnly />
                        <span className="min-w-0 flex-1 truncate">{c.title}</span>
                        <StageChip stage={c.stage} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {piece.parent && piece.siblings.length > 0 && (
                <p className="ml-4 mt-1 text-[11px] text-muted-foreground">
                  +{piece.siblings.length} sibling{piece.siblings.length === 1 ? "" : "s"} from the same hub
                </p>
              )}
              {!piece.parent && piece.children.length === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {piece.isHub ? "No children yet. Cut this hub into shorts, posts and a thread." : "Standalone piece. Make it a hub to cut it into 5–10 short pieces."}
                </p>
              )}
            </div>
          </Section>

          <Section title="Inspiration" icon={Sparkles} action={<Link href="/swipes" className="text-xs text-muted-foreground hover:text-foreground">Library →</Link>}>
            {piece.swipes.length > 0 && (
              <ul className="mb-3 space-y-1.5">
                {piece.swipes.map((s) => {
                  const P = platformMeta(s.platform).icon;
                  const ratio = s.views != null && s.creatorAvgViews ? Math.round((s.views / s.creatorAvgViews) * 10) / 10 : null;
                  return (
                    <li key={s._id} className="group rounded-lg border border-border p-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <P className="h-3 w-3" />
                        <span className="truncate">{s.creator ? `@${s.creator.replace(/^@/, "")}` : platformMeta(s.platform).label}</span>
                        {ratio != null && <Chip tone={ratio >= 3 ? "success" : "muted"}>{ratio}× outlier</Chip>}
                        <button
                          aria-label="Unlink"
                          onClick={() => void unlinkSwipe({ id, swipeId: s._id }).catch((e) => toast(errMsg(e), { tone: "warning" }))}
                          className="ml-auto rounded p-0.5 opacity-60 hover:bg-accent hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      {s.hookText && <p className="mt-1 text-sm leading-snug">&ldquo;{s.hookText}&rdquo;</p>}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">Why: </span>
                        {s.whyItWorked}
                      </p>
                      {s.whatToSteal && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground">Steal: </span>
                          {s.whatToSteal}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <Select
              aria-label="Link inspiration"
              value=""
              onChange={(e) =>
                e.target.value &&
                void linkSwipe({ id, swipeId: e.target.value as Id<"swipes"> })
                  .then(() => toast("Inspiration linked", { tone: "success" }))
                  .catch((err) => toast(errMsg(err), { tone: "warning" }))
              }
            >
              <option value="">{swipes && swipes.length === 0 ? "No swipes saved yet" : "+ Link a saved swipe…"}</option>
              {(swipes ?? [])
                .filter((s) => !linkedIds.has(s._id))
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {(s.hookText || s.title || s.creator || "Swipe").slice(0, 70)}
                  </option>
                ))}
            </Select>
          </Section>

          <Section title="Source" icon={StickyNote}>
            <div className="space-y-2">
              {piece.sourceNote ? (
                <div className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2">
                  <StickyNote className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <Link href={`/notes/${piece.sourceNote._id}`} className="min-w-0 flex-1 truncate text-sm hover:underline">
                    {piece.sourceNote.title}
                  </Link>
                  <button aria-label="Remove source note" onClick={() => void patch({ sourceNoteId: null })} className="rounded p-0.5 text-muted-foreground hover:bg-accent">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Select
                  aria-label="Source note"
                  value=""
                  onChange={(e) => e.target.value && void patch({ sourceNoteId: e.target.value as Id<"notes"> })}
                >
                  <option value="">{notes && notes.length === 0 ? "No notes yet" : "+ Link a source note…"}</option>
                  {(notes ?? []).map((n) => (
                    <option key={n._id} value={n._id}>
                      {n.title.slice(0, 80)}
                    </option>
                  ))}
                </Select>
              )}
              {piece.learningArea && (
                <Chip tone="outline" className="gap-1">
                  <BookOpen className="h-3 w-3" /> Learning: {piece.learningArea.name}
                </Chip>
              )}
              {piece.campaign && (
                <Chip tone="outline" className="ml-1 gap-1">
                  <Megaphone className="h-3 w-3" /> {piece.campaign.name}
                </Chip>
              )}
            </div>
          </Section>
        </aside>
      </div>

      <RepurposeDialog open={repurposeOpen} onClose={() => setRepurposeOpen(false)} piece={{ _id: id, title: piece.title }} />
      {mover.gateEl}
    </PageShell>
  );
}
