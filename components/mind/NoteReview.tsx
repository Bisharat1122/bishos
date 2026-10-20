"use client";

/**
 * Review mode for notes: practice testing over your own knowledge base.
 * Shows a processed note's title, you recall what it says, then reveal the
 * body and self-rate Easy/Hard (hard notes resurface first next time).
 * Keys while mounted: Space reveals, 1 = Hard, 2 = Easy.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowUpRight, Eye, RefreshCcw, StickyNote, ThumbsDown, ThumbsUp, Sparkles } from "lucide-react";
import { Bar, Chip, EmptyHint, Kbd, buttonVariants, cn } from "@/components/os/kit";
import { celebrate, toast } from "@/components/os/celebrate";
import { MarkdownLite } from "@/components/tasks/MarkdownLite";
import { isTypingTarget, noteTypeMeta, noteTypeOf } from "./meta";

type Item = FunctionReturnType<typeof api.notes.reviewSet>["items"][number];

export function NoteReview({ learningAreaId, size = 10 }: { learningAreaId?: Id<"learningAreas">; size?: number }) {
  const router = useRouter();
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const data = useQuery(api.notes.reviewSet, { seed, limit: size, learningAreaId });
  const titles = useQuery(api.notes.titles);
  const mark = useMutation(api.notes.markReviewed);
  const [items, setItems] = useState<Item[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [attempt, setAttempt] = useState("");
  const [results, setResults] = useState<("easy" | "hard")[]>([]);

  // Freeze the set once loaded so marking notes doesn't reshuffle it mid-run.
  useEffect(() => {
    if (data && items === null) setItems(data.items);
  }, [data, items]);

  const current = items?.[index];
  const done = items !== null && index >= items.length;

  const rate = useCallback(
    async (result: "easy" | "hard") => {
      if (!current || !revealed) return;
      void mark({ id: current._id, result });
      const next = [...results, result];
      setResults(next);
      setRevealed(false);
      setAttempt("");
      setIndex((i) => i + 1);
      if (items && index + 1 >= items.length) {
        celebrate(0.6);
        toast(`Reviewed ${next.length} notes`, { tone: "success", sub: "Recalling beats rereading — nice." });
      }
    },
    [current, revealed, mark, results, items, index],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e) || e.altKey || e.ctrlKey || e.metaKey || done || !current) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && e.key === "1") {
        e.preventDefault();
        void rate("hard");
      } else if (revealed && e.key === "2") {
        e.preventDefault();
        void rate("easy");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, rate, done, current]);

  const restart = () => {
    setSeed(Math.floor(Math.random() * 1e9));
    setItems(null);
    setIndex(0);
    setResults([]);
    setRevealed(false);
    setAttempt("");
  };

  const openByTitle = (title: string) => {
    const m = titles?.find((t) => t.title.toLowerCase() === title.toLowerCase());
    if (m) router.push(`/notes/${m._id}`);
  };

  if (items === null) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-56" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyHint
        icon={StickyNote}
        title="No notes to review yet"
        hint="Review mode tests you on processed notes: see the title, recall the idea, then reveal it. Write a few idea notes (40+ characters) and come back."
        action={
          <Link href="/notes" className={buttonVariants({ size: "sm" })}>
            Go to notes
          </Link>
        }
      />
    );
  }

  if (done || !current) {
    const hard = results.filter((r) => r === "hard").length;
    return (
      <div className="os-rise mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center shadow-raised">
        <span className="os-pop mx-auto flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
          <Sparkles className="h-7 w-7" />
        </span>
        <h3 className="mt-4 text-xl font-semibold">Notes reviewed: {results.length}</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {hard
            ? `${hard} felt hard — they'll come back first next time. Consider turning them into recall cards.`
            : "Everything felt easy. Your notes are doing their job."}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button onClick={restart} className={buttonVariants()}>
            <RefreshCcw /> New set
          </button>
        </div>
      </div>
    );
  }

  const meta = noteTypeMeta(noteTypeOf(current));
  const TypeIcon = meta.icon;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <Bar value={(index / items.length) * 100} tone="info" height="h-2" className="flex-1" />
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {index + 1} / {items.length}
        </span>
        <button onClick={restart} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} title="Shuffle a new set" aria-label="Shuffle a new set">
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>

      <div key={current._id} className="os-rise rounded-2xl border border-border bg-card p-5 shadow-raised sm:p-8">
        <div className="flex items-center justify-between gap-2">
          <Chip tone={meta.tone}>
            <TypeIcon /> {meta.label}
          </Chip>
          <Link href={`/notes/${current._id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            Open <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <h3 className="mt-5 text-center text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{current.title}</h3>
        {!revealed ? (
          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-muted-foreground">What does this note say? Recall it before you look.</p>
            <textarea
              value={attempt}
              onChange={(e) => setAttempt(e.target.value)}
              placeholder="Jot what you remember (optional)…"
              className="min-h-[72px] w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
            />
            <button onClick={() => setRevealed(true)} className={cn(buttonVariants({ size: "lg" }), "h-12 w-full")}>
              <Eye /> Reveal note <Kbd className="ml-1 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground">Space</Kbd>
            </button>
          </div>
        ) : (
          <div className="os-rise mt-5 space-y-4">
            {attempt.trim() && (
              <div className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                <span className="text-[10px] font-semibold uppercase tracking-wide">You recalled</span>
                <p className="mt-0.5 whitespace-pre-wrap">{attempt}</p>
              </div>
            )}
            {current.summary && (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Summary</span>
                {current.summary}
              </p>
            )}
            <div className="max-h-[42vh] overflow-y-auto rounded-lg border border-border bg-muted/20 px-4 py-3">
              <MarkdownLite text={current.content} onWikiLink={openByTitle} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => void rate("hard")}
                className="flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-warning/30 bg-warning-soft font-semibold text-warning transition active:scale-[0.97]"
              >
                <ThumbsDown className="h-4 w-4" /> Hard <span className="text-[10px] opacity-70">1</span>
              </button>
              <button
                onClick={() => void rate("easy")}
                className="flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-success/30 bg-success-soft font-semibold text-success transition active:scale-[0.97]"
              >
                <ThumbsUp className="h-4 w-4" /> Easy <span className="text-[10px] opacity-70">2</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {data?.total ?? items.length} notes in rotation · hard ones come back first
      </p>
    </div>
  );
}
