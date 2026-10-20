"use client";

/**
 * Recall card building blocks: CardForm (create/edit), CardBrowser (filter,
 * edit, suspend, reset, delete) and CardProposals (AI-generated cards from a
 * note / takeaways with approve checkboxes — nothing is saved until you
 * confirm).
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Brain, Pause, Pencil, Play, Plus, RotateCcw, Search, Sparkles, StickyNote, Trash2, Wand2, X } from "lucide-react";
import { Chip, Dialog, EmptyHint, Field, ItemCard, Segmented, Select, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { AiDots } from "@/components/Skeleton";
import { CARD_STATES, dueLabel, errMsg, useMinuteNow } from "./meta";

// ─────────────────────────────────────────────────────────────────────────
// CardForm
// ─────────────────────────────────────────────────────────────────────────

export function CardForm({
  card,
  learningAreaId,
  noteId,
  resourceId,
  lockArea,
  onSaved,
  submitLabel,
}: {
  card?: Doc<"recallCards">;
  learningAreaId?: Id<"learningAreas">;
  noteId?: Id<"notes">;
  resourceId?: Id<"resources">;
  lockArea?: boolean;
  onSaved?: () => void;
  submitLabel?: string;
}) {
  const areas = useQuery(api.learning.listAreasLite);
  const create = useMutation(api.recall.create);
  const update = useMutation(api.recall.update);
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [area, setArea] = useState<string>(card?.learningAreaId ?? learningAreaId ?? "");
  const [saving, setSaving] = useState(false);
  const [count, setCount] = useState(0);

  async function submit() {
    if (!front.trim() || !back.trim()) {
      toast("Add both a question and an answer.", { tone: "warning" });
      return;
    }
    setSaving(true);
    try {
      if (card) {
        await update({ id: card._id, front, back, learningAreaId: area ? (area as Id<"learningAreas">) : null });
        toast("Card updated", { tone: "success" });
      } else {
        await create({
          front,
          back,
          learningAreaId: area ? (area as Id<"learningAreas">) : undefined,
          noteId,
          resourceId,
        });
        setCount((c) => c + 1);
        toast("Card added — it's due now", { tone: "success" });
        setFront("");
        setBack("");
      }
      onSaved?.();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          void submit();
        }
      }}
    >
      <Field label="Question (front)" hint="Ask something you must answer from memory. One idea per card.">
        <TextArea value={front} onChange={(e) => setFront(e.target.value)} placeholder="Why do spaced reviews beat cramming?" className="min-h-[70px]" autoFocus={!card} />
      </Field>
      <Field label="Answer (back)">
        <TextArea value={back} onChange={(e) => setBack(e.target.value)} placeholder="Each retrieval at the edge of forgetting strengthens memory more…" className="min-h-[70px]" />
      </Field>
      {!lockArea && (
        <Field label="Learning area">
          <Select value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">No area</option>
            {areas?.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{count ? `${count} added this round · ` : ""}Ctrl+Enter to save</span>
        <button type="submit" disabled={saving} className={buttonVariants({ size: "sm" })}>
          {card ? "Save card" : (
            <>
              <Plus /> {submitLabel ?? "Add card"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CardBrowser
// ─────────────────────────────────────────────────────────────────────────

type StateFilter = "all" | "due" | "new" | "learning" | "review" | "suspended";

export function CardBrowser({ learningAreaId, onCreate }: { learningAreaId?: Id<"learningAreas">; onCreate?: () => void }) {
  const now = useMinuteNow();
  const areas = useQuery(api.learning.listAreasLite);
  const [area, setArea] = useState<string>("");
  const effectiveArea = (learningAreaId ?? (area || undefined)) as Id<"learningAreas"> | undefined;
  const cards = useQuery(api.recall.list, { learningAreaId: effectiveArea });
  const update = useMutation(api.recall.update);
  const remove = useMutation(api.recall.remove);
  const reset = useMutation(api.recall.reset);
  const [filter, setFilter] = useState<StateFilter>("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Doc<"recallCards"> | null>(null);

  const counts = useMemo(() => {
    const c = { all: 0, due: 0, new: 0, learning: 0, review: 0, suspended: 0 };
    for (const k of cards ?? []) {
      c.all++;
      if (k.suspended) c.suspended++;
      else {
        if (k.due <= now) c.due++;
        if (k.fsrsState === "new") c.new++;
        else if (k.fsrsState === "review") c.review++;
        else c.learning++;
      }
    }
    return c;
  }, [cards, now]);

  const shown = (cards ?? []).filter((k) => {
    if (filter === "suspended" && !k.suspended) return false;
    if (filter !== "suspended" && filter !== "all" && k.suspended) return false;
    if (filter === "due" && k.due > now) return false;
    if (filter === "new" && k.fsrsState !== "new") return false;
    if (filter === "review" && k.fsrsState !== "review") return false;
    if (filter === "learning" && k.fsrsState !== "learning" && k.fsrsState !== "relearning") return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!k.front.toLowerCase().includes(s) && !k.back.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented<StateFilter>
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "due", label: "Due", count: counts.due },
            { value: "new", label: "New", count: counts.new },
            { value: "learning", label: "Learning", count: counts.learning },
            { value: "review", label: "Review", count: counts.review },
            { value: "suspended", label: "Suspended", count: counts.suspended },
          ]}
        />
        {!learningAreaId && (
          <Select value={area} onChange={(e) => setArea(e.target.value)} className="h-8 w-auto min-w-[150px] text-xs">
            <option value="">All areas</option>
            {areas?.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </Select>
        )}
        <div className="relative min-w-[160px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cards…" className="h-8 pl-8 text-xs" />
        </div>
      </div>

      {cards === undefined ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyHint
          icon={Brain}
          title={cards.length ? "No cards match" : "No recall cards yet"}
          hint={cards.length ? "Try another filter." : "Cards turn notes and takeaways into memory. Make one by hand or let AI draft some from a note."}
          action={
            onCreate && !cards.length ? (
              <button onClick={onCreate} className={buttonVariants({ size: "sm" })}>
                <Plus /> Create card
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {shown.map((k) => {
            const st = CARD_STATES[k.fsrsState] ?? CARD_STATES.new;
            return (
              <ItemCard key={k._id} className={cn("group", k.suspended && "opacity-60")}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{k.front}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{k.back}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Chip tone={k.suspended ? "outline" : st.tone}>{k.suspended ? "Suspended" : st.label}</Chip>
                      {!k.suspended && <Chip tone={k.due <= now ? "warning" : "muted"}>{dueLabel(k.due, now)}</Chip>}
                      {k.fsrsState === "review" && <Chip tone="muted">S {k.stability < 1 ? "<1" : Math.round(k.stability)}d</Chip>}
                      {k.lapses > 0 && <Chip tone="muted">{k.lapses} lapse{k.lapses === 1 ? "" : "s"}</Chip>}
                      {!learningAreaId && k.areaName && <Chip tone="outline">{k.areaName}</Chip>}
                      {k.noteId && (
                        <Link href={`/notes/${k.noteId}`} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                          <StickyNote className="h-3 w-3" /> note
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 sm:opacity-60 sm:transition sm:group-hover:opacity-100">
                    <IconBtn label="Edit" onClick={() => setEditing(k)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      label={k.suspended ? "Resume" : "Suspend"}
                      onClick={() => void update({ id: k._id, suspended: !k.suspended }).then(() => toast(k.suspended ? "Card resumed" : "Card suspended")).catch((e) => toast(errMsg(e), { tone: "warning" }))}
                    >
                      {k.suspended ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    </IconBtn>
                    <IconBtn
                      label="Reset schedule"
                      onClick={() => {
                        if (confirm("Reset this card to new? Its schedule starts over.")) void reset({ id: k._id }).then(() => toast("Card reset")).catch((e) => toast(errMsg(e), { tone: "warning" }));
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      label="Delete"
                      danger
                      onClick={() => {
                        if (confirm("Delete this card?")) void remove({ id: k._id }).then(() => toast("Card deleted")).catch((e) => toast(errMsg(e), { tone: "warning" }));
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </div>
              </ItemCard>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} title="Edit card">
        {editing && <CardForm card={editing} onSaved={() => setEditing(null)} />}
      </Dialog>
    </div>
  );
}

function IconBtn({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn("rounded-md p-1.5 text-muted-foreground transition hover:bg-accent", danger ? "hover:text-danger" : "hover:text-foreground")}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CardProposals (AI, approve before saving)
// ─────────────────────────────────────────────────────────────────────────

type Proposal = { front: string; back: string; keep: boolean };

export function CardProposals({
  noteId,
  resourceId,
  text,
  title,
  learningAreaId,
  count = 5,
  seedBacks,
  onDone,
  intro,
}: {
  noteId?: Id<"notes">;
  resourceId?: Id<"resources">;
  text?: string;
  title?: string;
  learningAreaId?: Id<"learningAreas">;
  count?: number;
  /** Manual fallback: pre-fill answers (e.g. takeaway lines) and write questions yourself. */
  seedBacks?: string[];
  onDone?: (n: number) => void;
  intro?: React.ReactNode;
}) {
  const generate = useAction(api.aiLearning.generateCards);
  const createMany = useMutation(api.recall.createMany);
  const [items, setItems] = useState<Proposal[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const cards = await generate({ noteId, resourceId, text, title, count });
      setItems(cards.map((c) => ({ ...c, keep: true })));
    } catch (e) {
      setError(errMsg(e, "AI is unavailable right now (rate limit?). Try again, or write cards by hand."));
    } finally {
      setLoading(false);
    }
  }

  function manual() {
    const backs = (seedBacks ?? []).filter((s) => s.trim()).slice(0, count);
    setItems(backs.length ? backs.map((b) => ({ front: "", back: b, keep: true })) : [{ front: "", back: "", keep: true }]);
  }

  async function save() {
    const chosen = (items ?? []).filter((p) => p.keep && p.front.trim() && p.back.trim());
    if (!chosen.length) {
      toast("Tick at least one complete card.", { tone: "warning" });
      return;
    }
    setSaving(true);
    try {
      await createMany({ cards: chosen.map(({ front, back }) => ({ front, back })), learningAreaId, noteId, resourceId });
      reward(`${chosen.length} recall card${chosen.length === 1 ? "" : "s"} added`, undefined, chosen.length >= 3);
      setItems(null);
      onDone?.(chosen.length);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setSaving(false);
    }
  }

  const set = (i: number, patch: Partial<Proposal>) => setItems((p) => (p ? p.map((x, j) => (j === i ? { ...x, ...patch } : x)) : p));
  const kept = (items ?? []).filter((p) => p.keep && p.front.trim() && p.back.trim()).length;

  if (!items) {
    return (
      <div className="space-y-3">
        {intro}
        {loading ? (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <AiDots /> Drafting cards…
            </p>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-14" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void run()} className={buttonVariants({ size: "sm" })}>
              <Wand2 /> Draft {count} cards with AI
            </button>
            <button type="button" onClick={manual} className={buttonVariants({ size: "sm", variant: "outline" })}>
              <Pencil /> {seedBacks?.length ? "Write questions myself" : "Write by hand"}
            </button>
          </div>
        )}
        {error && <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" /> Review each card. Untick or edit anything that isn&apos;t right — nothing is saved until you add them.
      </p>
      <div className="space-y-2">
        {items.map((p, i) => (
          <div key={i} className={cn("rounded-lg border border-border bg-background/40 p-2.5 transition", !p.keep && "opacity-50")}>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={p.keep}
                onChange={(e) => set(i, { keep: e.target.checked })}
                className="mt-2 size-4 shrink-0 accent-[var(--primary)]"
                aria-label="Keep this card"
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <TextInput value={p.front} onChange={(e) => set(i, { front: e.target.value })} placeholder="Question" className="h-8 text-sm font-medium" />
                <TextArea value={p.back} onChange={(e) => set(i, { back: e.target.value })} placeholder="Answer" className="min-h-[52px] text-sm" />
              </div>
              <button
                type="button"
                onClick={() => setItems((x) => (x ? x.filter((_, j) => j !== i) : x))}
                className="rounded p-1 text-muted-foreground hover:text-danger"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setItems((x) => [...(x ?? []), { front: "", back: "", keep: true }])}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <Plus /> Add another
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={() => setItems(null)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Cancel
          </button>
          <button type="button" onClick={() => void save()} disabled={saving || !kept} className={buttonVariants({ size: "sm" })}>
            <Brain /> Add {kept} card{kept === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Pick a note, then draft cards from it (Learning area → Cards tab, Recall → Create). */
export function CardsFromNote({ learningAreaId }: { learningAreaId?: Id<"learningAreas"> }) {
  const notes = useQuery(api.notes.list, {});
  const [noteId, setNoteId] = useState<string>("");
  const sorted = useMemo(() => {
    const list = (notes ?? []).filter((n) => n.content.trim().length >= 20);
    if (!learningAreaId) return list;
    return [...list.filter((n) => n.learningAreaId === learningAreaId), ...list.filter((n) => n.learningAreaId !== learningAreaId)];
  }, [notes, learningAreaId]);
  const inArea = learningAreaId ? sorted.filter((n) => n.learningAreaId === learningAreaId).length : 0;
  const chosen = sorted.find((n) => n._id === noteId);
  return (
    <div className="space-y-3">
      <Field label="Source note" hint={learningAreaId && inArea ? `${inArea} note${inArea === 1 ? "" : "s"} from this area are listed first.` : undefined}>
        <Select value={noteId} onChange={(e) => setNoteId(e.target.value)}>
          <option value="">Choose a note…</option>
          {sorted.map((n) => (
            <option key={n._id} value={n._id}>
              {n.title}
            </option>
          ))}
        </Select>
      </Field>
      {chosen ? (
        <CardProposals
          key={chosen._id}
          noteId={chosen._id}
          learningAreaId={learningAreaId ?? chosen.learningAreaId}
          onDone={() => setNoteId("")}
        />
      ) : notes !== undefined && sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground">Write a note with a few lines first — cards come from what you&apos;ve written.</p>
      ) : null}
    </div>
  );
}
