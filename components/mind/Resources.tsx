"use client";

/**
 * Resource queue UI: create dialog ("why saved" required), card, editor
 * drawer (progress, takeaways, rating) and the finish prompt that turns
 * takeaways into recall cards.
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Brain, ExternalLink, Eye, Pencil, Star, Trash2, Trophy, AlertTriangle } from "lucide-react";
import { Bar, Chip, Dialog, Drawer, Field, ItemCard, Segmented, Select, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { MarkdownLite } from "@/components/tasks/MarkdownLite";
import { RESOURCE_FORMATS, RESOURCE_STATUSES, ResourceStatus, errMsg, formatMeta } from "./meta";
import { CardProposals } from "./Cards";

export type ResourceRow = FunctionReturnType<typeof api.resources.list>[number];

export function Stars({ value, onChange, size = "md" }: { value?: number; onChange?: (n: number | null) => void; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-3 w-3" : "h-5 w-5";
  return (
    <div className="inline-flex items-center gap-0.5" role={onChange ? "radiogroup" : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = (value ?? 0) >= n;
        const Icon = (
          <Star className={cn(s, on ? "fill-warning text-warning" : "text-muted-foreground/40")} />
        );
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(value === n ? null : n)} aria-label={`${n} star${n === 1 ? "" : "s"}`} className="rounded p-0.5 transition hover:scale-110">
            {Icon}
          </button>
        ) : (
          <span key={n}>{Icon}</span>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────────────────────────────────

export function ResourceCreateDialog({
  open,
  onClose,
  learningAreaId,
}: {
  open: boolean;
  onClose: () => void;
  learningAreaId?: Id<"learningAreas">;
}) {
  const areas = useQuery(api.learning.listAreasLite);
  const create = useMutation(api.resources.create);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [format, setFormat] = useState("book");
  const [why, setWhy] = useState("");
  const [area, setArea] = useState<string>(learningAreaId ?? "");
  const [status, setStatus] = useState<"queued" | "active">("queued");
  const [saving, setSaving] = useState(false);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (open) setArea(learningAreaId ?? "");
  }, [open, learningAreaId]);

  async function submit() {
    setTried(true);
    if (!title.trim() || !why.trim()) return;
    setSaving(true);
    try {
      const res = await create({
        title,
        url: url || undefined,
        author: author || undefined,
        format,
        whySaved: why,
        learningAreaId: area ? (area as Id<"learningAreas">) : undefined,
        status,
      });
      toast("Saved to your library", { tone: "success", sub: status === "active" ? "Started" : "Queued" });
      if (res.warn) toast(`${res.activeInArea} active in this area — finishing 1–2 at a time works better`, { tone: "warning" });
      setTitle("");
      setUrl("");
      setAuthor("");
      setWhy("");
      setTried(false);
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Save a resource">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label="Title">
          <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="$100M Offers" aria-invalid={tried && !title.trim()} />
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {RESOURCE_FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFormat(f.value)}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium transition",
                format === f.value ? "border-ring bg-primary text-primary-foreground" : "border-border hover:bg-accent",
              )}
            >
              <f.icon className="h-3.5 w-3.5" /> {f.label}
            </button>
          ))}
        </div>
        <Field
          label="Why are you saving this? (required)"
          hint="What do you hope to be able to do after it? A reason keeps the queue from becoming a guilt pile."
        >
          <TextArea
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="To build a grand-slam offer for the agency before the Q4 push."
            className={cn("min-h-[64px]", tried && !why.trim() && "border-danger ring-[3px] ring-danger/20")}
          />
          {tried && !why.trim() && <span className="text-[11px] text-danger">Add a reason — one line is enough.</span>}
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Link (optional)">
            <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" />
          </Field>
          <Field label="Author (optional)">
            <TextInput value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Alex Hormozi" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Learning area">
            <Select value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">None</option>
              {areas?.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Start">
            <Segmented<"queued" | "active">
              value={status}
              onChange={setStatus}
              options={[
                { value: "queued", label: "Queue it" },
                { value: "active", label: "Start now" },
              ]}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "outline" })}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={buttonVariants()}>
            Save resource
          </button>
        </div>
      </form>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────

export function ResourceCard({ r, onOpen, showArea = true }: { r: ResourceRow; onOpen: () => void; showArea?: boolean }) {
  const f = formatMeta(r.format);
  return (
    <ItemCard onClick={onOpen} className={cn(r.status === "dropped" && "opacity-60")}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <f.icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">{r.title}</p>
          {r.author && <p className="text-xs text-muted-foreground">{r.author}</p>}
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-xs italic text-muted-foreground">“{r.whySaved}”</p>
      {r.status === "active" && (
        <div className="mt-2 flex items-center gap-2">
          <Bar value={r.progress ?? 0} tone="info" className="flex-1" />
          <span className="text-[10px] tabular-nums text-muted-foreground">{r.progress ?? 0}%</span>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {showArea && r.areaName && <Chip tone="outline">{r.areaName}</Chip>}
        <Chip tone="muted">{f.label}</Chip>
        {r.status === "done" && r.rating ? <Stars value={r.rating} size="sm" /> : null}
        {r.cardCount > 0 && (
          <Chip tone="info">
            <Brain /> {r.cardCount}
          </Chip>
        )}
        {r.status === "done" && !r.takeaways && <Chip tone="warning">add takeaways</Chip>}
      </div>
    </ItemCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Editor drawer
// ─────────────────────────────────────────────────────────────────────────

export function ResourceDrawer({ resource, onClose, onFinish }: { resource: ResourceRow | null; onClose: () => void; onFinish: (r: ResourceRow) => void }) {
  const areas = useQuery(api.learning.listAreasLite);
  const update = useMutation(api.resources.update);
  const setStatus = useMutation(api.resources.setStatus);
  const remove = useMutation(api.resources.remove);
  const [takeaways, setTakeaways] = useState("");
  const [preview, setPreview] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    setTakeaways(resource?.takeaways ?? "");
    setPreview(!!resource?.takeaways);
    setShowCards(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource?._id]);
  // Follow server-side progress changes too (e.g. marking it done sets 100%).
  useEffect(() => {
    setProgress(resource?.progress ?? 0);
  }, [resource?._id, resource?.progress]);

  if (!resource) return null;
  const r = resource;
  const save = (patch: Parameters<typeof update>[0]) => update(patch).catch((e) => toast(errMsg(e), { tone: "warning" }));

  async function changeStatus(s: ResourceStatus) {
    if (s === r.status) return;
    try {
      const res = await setStatus({ id: r._id, status: s });
      if (res.warn) toast(`${res.activeInArea} active in this area — try to finish 1–2 at a time`, { tone: "warning" });
      if (s === "done") onFinish(r);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  }

  return (
    <Drawer open onClose={onClose} title={r.title} width="max-w-xl">
      <div className="space-y-5">
        <Segmented<ResourceStatus>
          value={r.status}
          onChange={(s) => void changeStatus(s)}
          options={RESOURCE_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
        />
        <Field label="Title">
          <TextInput defaultValue={r.title} key={`t-${r._id}`} onBlur={(e) => e.target.value.trim() && e.target.value !== r.title && void save({ id: r._id, title: e.target.value })} />
        </Field>
        <Field label="Why saved" hint="Required — what you want to be able to do after it.">
          <TextArea
            key={`w-${r._id}`}
            defaultValue={r.whySaved}
            onBlur={(e) => {
              if (!e.target.value.trim()) {
                e.target.value = r.whySaved;
                toast("“Why saved” can't be empty", { tone: "warning" });
              } else if (e.target.value !== r.whySaved) void save({ id: r._id, whySaved: e.target.value });
            }}
            className="min-h-[60px]"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Format">
            <Select value={r.format} onChange={(e) => void save({ id: r._id, format: e.target.value })}>
              {RESOURCE_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Learning area">
            <Select
              value={r.learningAreaId ?? ""}
              onChange={(e) => void save({ id: r._id, learningAreaId: e.target.value ? (e.target.value as Id<"learningAreas">) : null })}
            >
              <option value="">None</option>
              {areas?.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Author">
            <TextInput key={`a-${r._id}`} defaultValue={r.author ?? ""} onBlur={(e) => e.target.value !== (r.author ?? "") && void save({ id: r._id, author: e.target.value || null })} />
          </Field>
          <Field label="Link">
            <div className="flex gap-1.5">
              <TextInput key={`u-${r._id}`} defaultValue={r.url ?? ""} onBlur={(e) => e.target.value !== (r.url ?? "") && void save({ id: r._id, url: e.target.value || null })} />
              {r.url && (
                <a href={r.url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Open link">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </Field>
        </div>

        <Field label={`Progress · ${progress}%`}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            onMouseUp={() => progress !== (r.progress ?? 0) && void save({ id: r._id, progress })}
            onTouchEnd={() => progress !== (r.progress ?? 0) && void save({ id: r._id, progress })}
            onKeyUp={() => progress !== (r.progress ?? 0) && void save({ id: r._id, progress })}
            className="w-full accent-[var(--primary)]"
          />
        </Field>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Takeaways (in your own words)</span>
            <button onClick={() => setPreview((p) => !p)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {preview ? <Pencil /> : <Eye />} {preview ? "Edit" : "Preview"}
            </button>
          </div>
          {preview ? (
            <div className="min-h-[90px] cursor-text rounded-lg border border-border bg-muted/20 px-3 py-2" onClick={() => setPreview(false)}>
              <MarkdownLite text={takeaways} />
            </div>
          ) : (
            <TextArea
              value={takeaways}
              onChange={(e) => setTakeaways(e.target.value)}
              onBlur={() => takeaways !== (r.takeaways ?? "") && void save({ id: r._id, takeaways: takeaways || null })}
              placeholder={"- The value equation: dream × likelihood ÷ time × effort\n- …"}
              className="min-h-[130px] font-mono text-[13px]"
            />
          )}
        </div>

        <Field label="Rating">
          <Stars value={r.rating} onChange={(n) => void save({ id: r._id, rating: n })} />
        </Field>

        <div className="rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Brain className="h-4 w-4" /> Recall cards {r.cardCount ? <Chip tone="info">{r.cardCount}</Chip> : null}
            </p>
            {!showCards && (
              <button onClick={() => setShowCards(true)} className={buttonVariants({ variant: "secondary", size: "sm" })} disabled={!takeaways.trim()}>
                Create from takeaways
              </button>
            )}
          </div>
          {!takeaways.trim() && <p className="mt-1 text-xs text-muted-foreground">Write a few takeaways first — cards come from your own words.</p>}
          {showCards && takeaways.trim() && (
            <div className="mt-3">
              <CardProposals
                resourceId={r._id}
                text={takeaways}
                title={r.title}
                learningAreaId={r.learningAreaId}
                count={3}
                seedBacks={takeaways.split(/\r?\n/).map((l) => l.replace(/^\s*[-*\d.)]+\s*/, "").trim())}
                onDone={() => setShowCards(false)}
              />
            </div>
          )}
        </div>

        <button
          onClick={() => {
            if (confirm(`Delete “${r.title}”?`))
              void remove({ id: r._id })
                .then(onClose)
                .catch((e) => toast(errMsg(e), { tone: "warning" }));
          }}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-danger")}
        >
          <Trash2 /> Delete resource
        </button>
      </div>
    </Drawer>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Finish prompt
// ─────────────────────────────────────────────────────────────────────────

export function FinishResourceDialog({ resource, onClose }: { resource: ResourceRow | null; onClose: () => void }) {
  const update = useMutation(api.resources.update);
  const [takeaways, setTakeaways] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [step, setStep] = useState<"takeaways" | "cards">("takeaways");

  useEffect(() => {
    if (!resource) return;
    setTakeaways(resource.takeaways ?? "");
    setRating(resource.rating ?? null);
    setStep("takeaways");
    reward(`Finished “${resource.title}”`, undefined, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource?._id]);

  if (!resource) return null;

  async function saveTakeaways(next: "cards" | "close") {
    try {
      await update({ id: resource!._id, takeaways: takeaways.trim() || null, rating });
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
      return;
    }
    if (next === "cards") setStep("cards");
    else onClose();
  }

  const lines = takeaways
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*\d.)]+\s*/, "").trim())
    .filter(Boolean);

  return (
    <Dialog open onClose={onClose} title="Finished — lock it in" size="lg">
      {step === "takeaways" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-success-soft px-3 py-2 text-success">
            <Trophy className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{resource.title}</p>
          </div>
          <Field label="Your 3 biggest takeaways" hint="Write them from memory first — that retrieval is the learning.">
            <TextArea autoFocus value={takeaways} onChange={(e) => setTakeaways(e.target.value)} placeholder={"- …\n- …\n- …"} className="min-h-[120px]" />
          </Field>
          <Field label="Rating">
            <Stars value={rating ?? undefined} onChange={setRating} />
          </Field>
          <div className="rounded-xl border border-dashed border-border p-3">
            <p className="text-sm font-medium">Create 3 recall cards from your takeaways?</p>
            <p className="text-xs text-muted-foreground">Spaced recall is how a book becomes something you actually use.</p>
            {!lines.length && (
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-warning">
                <AlertTriangle className="h-3 w-3" /> Write at least one takeaway first.
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={() => void saveTakeaways("close")} className={buttonVariants({ variant: "outline" })}>
              Save, no cards
            </button>
            <button onClick={() => void saveTakeaways("cards")} disabled={!lines.length} className={buttonVariants()}>
              <Brain /> Yes, create cards
            </button>
          </div>
        </div>
      ) : (
        <CardProposals
          resourceId={resource._id}
          text={takeaways}
          title={resource.title}
          learningAreaId={resource.learningAreaId}
          count={3}
          seedBacks={lines}
          onDone={onClose}
          intro={<p className="text-sm text-muted-foreground">Let AI draft 3 questions from your takeaways, or write the questions yourself (answers pre-filled).</p>}
        />
      )}
    </Dialog>
  );
}
