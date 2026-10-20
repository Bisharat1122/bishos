"use client";

/**
 * Learn in public (swyx): turn a private note into a content seed. Optional
 * AI Feynman draft — a simple explanation, jargon flagged as gaps, a hook and
 * 3 short post variants. You pick/edit, then plant the seed (contentPieces,
 * stage "seed"). Publishing stays a deliberate step in Content Studio.
 */
import { useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowRight, CheckCircle2, Megaphone, Sprout, Wand2, Plus } from "lucide-react";
import { Chip, Dialog, Field, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { AiDots } from "@/components/Skeleton";
import { useToday } from "@/lib/day";
import { errMsg } from "./meta";

type Draft = { explanation: string; jargon: string[]; hook: string; posts: { angle: string; text: string }[] };

export function MakePublicDialog({ noteId, open, onClose }: { noteId: Id<"notes">; open: boolean; onClose: () => void }) {
  const today = useToday();
  const note = useQuery(api.notes.get, { id: noteId });
  const draftAi = useAction(api.aiLearning.feynmanDraft);
  const makePublic = useMutation(api.learning.makePublic);
  const addGap = useMutation(api.learning.addGap);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState<number>(-1); // -1 = the simple explanation
  const [script, setScript] = useState("");
  const [hook, setHook] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ existing: boolean } | null>(null);
  const [gapsAdded, setGapsAdded] = useState(false);

  async function runDraft() {
    setLoading(true);
    setError(null);
    try {
      const d = await draftAi({ noteId });
      setDraft(d);
      setPick(-1);
      setScript(d.explanation);
      setHook(d.hook);
    } catch (e) {
      setError(errMsg(e, "AI is unavailable right now. You can still plant the seed without a draft."));
    } finally {
      setLoading(false);
    }
  }

  async function plant() {
    setSaving(true);
    try {
      const res = await makePublic({ noteId, script: script || undefined, hook: hook || undefined });
      setDone({ existing: res.existing });
      if (res.existing) toast("This note already has a content seed", { tone: "info" });
      else reward("Content seed planted 🌱", undefined, true);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setSaving(false);
    }
  }

  function close() {
    setDraft(null);
    setDone(null);
    setError(null);
    setScript("");
    setHook("");
    setGapsAdded(false);
    onClose();
  }

  return (
    <Dialog open={open} onClose={close} title="Make it public" size="lg">
      {note === undefined ? (
        <div className="skeleton h-40" />
      ) : note === null ? (
        <p className="text-sm text-muted-foreground">Note not found.</p>
      ) : done ? (
        <div className="os-rise py-4 text-center">
          <span className="os-pop mx-auto flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
            <Sprout className="h-7 w-7" />
          </span>
          <h3 className="mt-3 text-lg font-semibold">{done.existing ? "Seed already exists" : "Seed planted"}</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            “{note.title}” is now a content seed in your personal brand pipeline. Test it as a short post; if it beats your median, grow it into the week&apos;s hub piece.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/content" className={buttonVariants()}>
              Open Content Studio <ArrowRight />
            </Link>
            <button onClick={close} className={buttonVariants({ variant: "outline" })}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">From your note</p>
            <p className="mt-0.5 font-medium">{note.title}</p>
            {note.madePublic && (
              <Chip tone="success" className="mt-1.5">
                <CheckCircle2 /> Already public
              </Chip>
            )}
          </div>

          {!draft && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Feynman step: explain it simply, and notice where you reach for words you can&apos;t define — those are your next gaps.
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void runDraft()} disabled={loading} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  {loading ? <AiDots /> : <Wand2 />} {loading ? "Drafting…" : "Draft a simple explanation (AI)"}
                </button>
              </div>
              {error && <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">{error}</p>}
            </div>
          )}

          {draft && (
            <div className="os-rise space-y-3">
              <div className="grid gap-2">
                <PickRow active={pick === -1} onClick={() => (setPick(-1), setScript(draft.explanation))} label="Simple explanation" text={draft.explanation} />
                {draft.posts.map((p, i) => (
                  <PickRow key={i} active={pick === i} onClick={() => (setPick(i), setScript(p.text))} label={p.angle} text={p.text} />
                ))}
              </div>
              {draft.jargon.length > 0 && (
                <div className="rounded-lg border border-dashed border-border p-3">
                  <p className="text-xs font-medium">Jargon you still lean on</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {draft.jargon.map((j) => (
                      <Chip key={j} tone="warning">
                        {j}
                      </Chip>
                    ))}
                  </div>
                  {note.learningAreaId ? (
                    <button
                      disabled={gapsAdded}
                      onClick={() =>
                        void addGap({ id: note.learningAreaId!, text: draft.jargon.join("\n"), date: today })
                          .then((n) => {
                            setGapsAdded(true);
                            toast(n ? `${n} added to “Things I don't know”` : "Already on your gaps list", { tone: "success" });
                          })
                          .catch((e) => toast(errMsg(e), { tone: "warning" }))
                      }
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-2 -ml-2")}
                    >
                      <Plus /> {gapsAdded ? "Added to gaps" : "Add to “Things I don't know”"}
                    </button>
                  ) : (
                    <p className="mt-2 text-[11px] text-muted-foreground">Link this note to a learning area to track these as gaps.</p>
                  )}
                </div>
              )}
            </div>
          )}

          <Field label="Hook (first line)" hint="Optional. What makes someone stop scrolling?">
            <TextInput value={hook} onChange={(e) => setHook(e.target.value)} placeholder="I got this wrong for 3 years…" />
          </Field>
          <Field label="Seed draft" hint="Optional. Saved as the piece's script — edit freely later.">
            <TextArea value={script} onChange={(e) => setScript(e.target.value)} className="min-h-[110px]" placeholder="Leave empty to start from the note itself." />
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Megaphone className="h-3.5 w-3.5" /> Notes stay private. This only creates a draft seed.
            </p>
            <button onClick={() => void plant()} disabled={saving} className={buttonVariants()}>
              <Sprout /> {saving ? "Planting…" : "Create content seed"}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function PickRow({ active, onClick, label, text }: { active: boolean; onClick: () => void; label: string; text: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border p-3 text-left text-sm transition",
        active ? "border-ring bg-accent" : "border-border hover:border-ring/50 hover:bg-accent/40",
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <p className="mt-0.5 line-clamp-4 whitespace-pre-wrap">{text}</p>
    </button>
  );
}
