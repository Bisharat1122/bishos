"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Link2, Paperclip, Tag, StickyNote, Table, Share2, Brain, Zap, Clock, Megaphone } from "lucide-react";
import { EmptyState, AddButton } from "@/components/ui";
import { NotesGraph } from "@/components/notes/NotesGraph";
import { cn } from "@/lib/utils";
import { Chip, PageShell, Segmented, buttonVariants } from "@/components/os/kit";
import { NoteReview } from "@/components/mind/NoteReview";
import { ProcessInbox, SuggestMaps } from "@/components/mind/NotesInbox";
import { NOTE_TYPES, NoteType, errMsg, noteTypeMeta, noteTypeOf, useMinuteNow } from "@/components/mind/meta";
import { toast } from "@/components/os/celebrate";

const STALE_MS = 48 * 60 * 60 * 1000;

export default function NotesPage() {
  const notes = useQuery(api.notes.list, {});
  const areas = useQuery(api.lifeAreas.list);
  const createNote = useMutation(api.notes.create);
  const router = useRouter();
  const now = useMinuteNow();
  const [view, setView] = useState<"list" | "graph" | "review">("list");
  const [typeFilter, setTypeFilter] = useState<"all" | NoteType>("all");

  const areaName = (id?: Id<"lifeAreas">) =>
    id ? areas?.find((a) => a._id === id)?.name : undefined;

  // Type chips: All, Fleeting, Source, Idea, Map, Project, Daily (untyped = idea).
  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const n of notes ?? []) c[noteTypeOf(n)] = (c[noteTypeOf(n)] ?? 0) + 1;
    return c;
  }, [notes]);
  const shown = useMemo(
    () => (typeFilter === "all" ? notes : notes?.filter((n) => noteTypeOf(n) === typeFilter)),
    [notes, typeFilter],
  );

  // Guard against double-clicks creating duplicate notes; surface failures.
  const [creating, setCreating] = useState(false);
  async function create(args: Parameters<typeof createNote>[0]) {
    if (creating) return;
    setCreating(true);
    try {
      const id = await createNote(args);
      router.push(`/notes/${id}`);
    } catch (e) {
      toast(errMsg(e, "Couldn't create the note."), { tone: "warning" });
      setCreating(false);
    }
  }
  const newNote = () => create({ title: "Untitled note", content: "" });
  const newFleeting = () => create({ title: "Quick thought", content: "", noteType: "fleeting", noteStatus: "inbox" });

  return (
    <PageShell
      title="Notes"
      icon={StickyNote}
      topbarAction={<AddButton label="New note" onClick={() => void newNote()} />}
      subtitle={
        <>
          Your second brain. One idea per note, in your own words. Use <code className="rounded bg-muted px-1">/</code> for
          blocks and <code className="rounded bg-muted px-1">[[</code> to link notes — and say why they link.
        </>
      }
      actions={
        <>
          <button onClick={() => void newFleeting()} disabled={creating} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Zap /> Fleeting
          </button>
          <Segmented<"list" | "graph" | "review">
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: "List", icon: Table },
              { value: "graph", label: "Graph", icon: Share2 },
              { value: "review", label: "Review", icon: Brain },
            ]}
          />
        </>
      }
    >
        {view !== "review" && (
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin">
            <TypeChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")} label="All" count={notes?.length} />
            {NOTE_TYPES.map((t) => (
              <TypeChip
                key={t.value}
                active={typeFilter === t.value}
                onClick={() => setTypeFilter(typeFilter === t.value ? "all" : t.value)}
                label={t.label}
                count={typeCounts[t.value] ?? 0}
                icon={t.icon}
                title={t.hint}
              />
            ))}
          </div>
        )}

        {view === "review" ? (
          <div className="mt-2 space-y-3">
            <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
              Review mode hides each note&apos;s body. Recall it from the title, then reveal — practice testing beats rereading.
            </p>
            <NoteReview />
          </div>
        ) : view === "graph" ? (
          <div className="mt-6">
            {notes === undefined ? (
              <div className="skeleton h-[70vh] rounded-xl" />
            ) : (
              <NotesGraph
                notes={shown ?? []}
                areas={areas}
                onOpen={(id) => router.push(`/notes/${id}`)}
              />
            )}
          </div>
        ) : (
          <>
          <div className="mt-4 space-y-4">
            <ProcessInbox />
            <SuggestMaps />
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-card/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Life area</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Links</th>
                {/* notes has no updatedAt field — this is the creation date. */}
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {notes === undefined && (
                <tr>
                  <td colSpan={6} className="px-4 py-4">
                    <div className="space-y-2">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="skeleton h-8" />
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              {notes?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10">
                    <EmptyState title="No notes yet" hint="Create your first note." />
                  </td>
                </tr>
              )}
              {notes && notes.length > 0 && shown?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No {noteTypeMeta(typeFilter as NoteType).label.toLowerCase()} notes yet. {noteTypeMeta(typeFilter as NoteType).hint}
                  </td>
                </tr>
              )}
              {shown?.map((n) => {
                const type = noteTypeMeta(noteTypeOf(n));
                const TypeIcon = type.icon;
                const stale = n.noteType === "fleeting" && n.noteStatus !== "processed" && now - n._creationTime > STALE_MS;
                return (
                <tr
                  key={n._id}
                  onClick={() => router.push(`/notes/${n._id}`)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium">
                      <StickyNote className="h-4 w-4 text-muted-foreground" />
                      {n.title}
                      {n.attachments && n.attachments.length > 0 && (
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      {n.madePublic && <Megaphone className="h-3.5 w-3.5 text-success" aria-label="Made public" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <Chip tone={type.tone}>
                        <TypeIcon /> {type.label}
                      </Chip>
                      {stale && (
                        <Chip tone="warning" title="Fleeting notes should be processed within 48h">
                          <Clock /> 48h+
                        </Chip>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {areaName(n.lifeAreaId) ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(n.tags ?? []).map((t) => (
                        <span
                          key={t}
                          className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {n.linkedNoteIds && n.linkedNoteIds.length > 0 ? (
                      <span className="flex items-center gap-1">
                        <Link2 className="h-3.5 w-3.5" />
                        {n.linkedNoteIds.length}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(n._creationTime).toLocaleDateString()}
                  </td>
                </tr>
                );
              })}
            </tbody>
            </table>
          </div>
          </>
        )}
    </PageShell>
  );
}

function TypeChip({
  active,
  onClick,
  label,
  count,
  icon: Icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  icon?: typeof StickyNote;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition",
        active ? "border-ring bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
      {count != null && <span className={cn("tabular-nums", active ? "opacity-80" : "opacity-60")}>{count}</span>}
    </button>
  );
}
