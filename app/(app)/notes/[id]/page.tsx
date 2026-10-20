"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Trash2,
  Pencil,
  Eye,
  Paperclip,
  FileText,
  X,
  Link2,
  CornerUpLeft,
  ArrowUpRight,
  Sparkles,
  Wand2,
  Brain,
  Megaphone,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import { Card, Topbar, EmptyState } from "@/components/ui";
import { Chip, Dialog } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { MakePublicDialog } from "@/components/mind/MakePublicDialog";
import { CardProposals } from "@/components/mind/Cards";
import { NOTE_STATUSES, NOTE_TYPES, NoteStatus, NoteType, errMsg, noteTypeOf } from "@/components/mind/meta";
import { DetailSkeleton } from "@/components/Skeleton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AddToMomentum } from "@/components/momentum/AddToMomentum";
import { SlashEditor } from "@/components/editor/SlashEditor";
import { MarkdownLite } from "@/components/tasks/MarkdownLite";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/variants";

type Attachment = { storageId: Id<"_storage">; name: string; contentType: string; size: number };

export default function NotePage() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"notes">;
  const router = useRouter();

  const note = useQuery(api.notes.get, { id });
  const allTitles = useQuery(api.notes.titles);
  const connections = useQuery(api.notes.connections, { id });
  const areas = useQuery(api.lifeAreas.list);
  const projects = useQuery(api.projects.list);
  const sections = useQuery(api.sections.list, {});
  const update = useMutation(api.notes.update);
  const createNote = useMutation(api.notes.create);
  const removeNote = useMutation(api.notes.remove);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const summarize = useAction(api.ai.summarizeNote);
  const findRelated = useAction(api.ai.relatedNotes);
  // Life OS knowledge layer
  const learningAreas = useQuery(api.learning.listAreasLite);
  // Wait for a valid note: recall.list validates noteId and would throw on a bad URL id.
  const noteCards = useQuery(api.recall.list, note ? { noteId: note._id } : "skip");
  const setLinkReason = useMutation(api.notes.setLinkReason);
  const [publicOpen, setPublicOpen] = useState(false);
  const [cardsOpen, setCardsOpen] = useState(false);

  const [aiResult, setAiResult] = useState<{ kind: string; text: string } | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const [content, setContent] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // init content once note loads
  useEffect(() => {
    if (note && content === null) {
      setContent(note.content);
      setEditing(!note.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  // debounced autosave of content
  const pendingRef = useRef<string | null>(null);
  useEffect(() => {
    if (content === null || !note || content === note.content) {
      pendingRef.current = null;
      return;
    }
    pendingRef.current = content;
    const t = setTimeout(() => {
      pendingRef.current = null;
      void update({ id, content });
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);
  // Flush an unsaved edit when leaving the page (e.g. clicking a [[link]] or
  // backlink right after typing) instead of silently dropping it.
  useEffect(
    () => () => {
      if (pendingRef.current !== null) void update({ id, content: pendingRef.current }).catch(() => {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (note === undefined)
    return (
      <div>
        <Topbar />
        <DetailSkeleton />
      </div>
    );
  if (note === null)
    return (
      <div>
        <Topbar />
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <EmptyState title="Note not found" />
        </div>
      </div>
    );

  const tags = note.tags ?? [];
  const attachments = (note.attachments ?? []) as Attachment[];
  const areaSections = sections?.filter((s) => s.lifeAreaId === note.lifeAreaId) ?? [];
  const linkedProject = projects?.find((p) => (note.linkedProjectIds ?? []).includes(p._id));

  function openByTitle(title: string) {
    // Titles still loading: don't create a duplicate of a note that may exist.
    if (allTitles === undefined) return;
    const match = allTitles.find(
      (t) => t.title.toLowerCase() === title.toLowerCase(),
    );
    if (match) {
      router.push(`/notes/${match._id}`);
    } else {
      // Obsidian-style: clicking a missing link creates the note.
      void createNote({ title })
        .then((newId) => router.push(`/notes/${newId}`))
        .catch((e) => toast(errMsg(e, "Couldn't create that note."), { tone: "warning" }));
    }
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed.");
      const { storageId } = await res.json();
      await update({
        id,
        attachments: [
          ...attachments,
          { storageId, name: file.name, contentType: file.type || "application/octet-stream", size: file.size },
        ],
      });
    } catch (e) {
      toast(errMsg(e, "Upload failed. Try again."), { tone: "warning" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Topbar />
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadFile(f);
          e.target.value = "";
        }}
      />
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Breadcrumb items={[{ label: "Notes", href: "/notes" }, { label: note.title }]} />

        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Editor */}
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between gap-2">
              <input
                defaultValue={note.title}
                onBlur={(e) =>
                  e.target.value.trim() &&
                  e.target.value !== note.title &&
                  update({ id, title: e.target.value.trim() })
                }
                className="flex-1 bg-transparent text-2xl font-semibold tracking-tight outline-none"
              />
              <div className="flex items-center gap-2">
                <AddToMomentum type="note" itemId={id} title={note.title} compact />
                <button
                  onClick={() => setEditing((e) => !e)}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1 text-muted-foreground")}
                >
                  {editing ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                  {editing ? "Preview" : "Edit"}
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Delete “${note.title}”? This can't be undone.`)) return;
                    pendingRef.current = null; // don't autosave into a deleted note
                    try {
                      await removeNote({ id });
                      router.push("/notes");
                    } catch (e) {
                      toast(errMsg(e, "Couldn't delete the note."), { tone: "warning" });
                    }
                  }}
                  title="Delete note"
                  aria-label="Delete note"
                  className="text-muted-foreground hover:text-danger"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Knowledge layer: type · status · learning area · summary */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="-mx-0.5 flex max-w-full gap-1 overflow-x-auto px-0.5 scrollbar-thin" role="radiogroup" aria-label="Note type">
                {NOTE_TYPES.map((t) => {
                  const active = noteTypeOf(note) === t.value;
                  const TIcon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      title={t.hint}
                      onClick={() =>
                        void update({
                          id,
                          noteType: t.value as NoteType,
                          ...(t.value === "fleeting" && !note.noteStatus ? { noteStatus: "inbox" as const } : {}),
                          ...(t.value !== "fleeting" && note.noteStatus === "inbox" ? { noteStatus: "processed" as const } : {}),
                        })
                      }
                      className={cn(
                        "inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition",
                        active ? "border-ring bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <TIcon className="h-3.5 w-3.5" /> {t.label}
                    </button>
                  );
                })}
              </div>
              <select
                value={note.noteStatus ?? ""}
                onChange={(e) => void update({ id, noteStatus: e.target.value ? (e.target.value as NoteStatus) : null })}
                className="h-7 rounded-md border border-input bg-card px-2 text-xs outline-none focus-visible:border-ring"
                aria-label="Note status"
                title={NOTE_STATUSES.find((s) => s.value === note.noteStatus)?.hint}
              >
                <option value="">No status</option>
                {NOTE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <select
                value={note.learningAreaId ?? ""}
                onChange={(e) => void update({ id, learningAreaId: e.target.value ? (e.target.value as Id<"learningAreas">) : null })}
                className="h-7 max-w-[200px] rounded-md border border-input bg-card px-2 text-xs outline-none focus-visible:border-ring"
                aria-label="Learning area"
              >
                <option value="">No learning area</option>
                {learningAreas?.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {note.learningAreaId && (
                <Link href={`/learning/${note.learningAreaId}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <GraduationCap className="h-3.5 w-3.5" /> Open area
                </Link>
              )}
              {note.madePublic && (
                <Chip tone="success">
                  <Megaphone /> Public seed
                </Chip>
              )}
            </div>
            <div className="mt-3">
              <textarea
                key={`summary-${id}`}
                defaultValue={note.summary ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (note.summary ?? "")) void update({ id, summary: v || null });
                }}
                rows={2}
                placeholder="Summary — the gist in one or two lines, in your own words (top layer)…"
                className="w-full resize-y rounded-lg border border-dashed border-border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
              />
            </div>

            <div className="mt-4">
              {editing ? (
                <SlashEditor
                  value={content ?? ""}
                  onChange={setContent}
                  onUpload={() => fileRef.current?.click()}
                  wikiTitles={allTitles?.map((t) => t.title) ?? []}
                  rows={18}
                  placeholder="Write, / for blocks, [[ to link a note…"
                />
              ) : (
                <div
                  className="min-h-[300px] cursor-text rounded-lg border border-border bg-muted/20 px-4 py-3"
                  onClick={() => setEditing(true)}
                >
                  <MarkdownLite text={content ?? ""} onWikiLink={openByTitle} />
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Attachments</h3>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
              <div className="space-y-1.5">
                {attachments.map((a) => (
                  <AttachmentRow
                    key={a.storageId}
                    att={a}
                    onRemove={() =>
                      void update({
                        id,
                        attachments: attachments.filter((x) => x.storageId !== a.storageId),
                      })
                    }
                  />
                ))}
                {attachments.length === 0 && (
                  <p className="text-xs text-muted-foreground">No files attached.</p>
                )}
              </div>
            </div>
          </div>

          {/* Interlinking panel */}
          <div className="space-y-4">
            {/* Learn & share: recall cards + learn in public */}
            <Card>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <GraduationCap className="h-3.5 w-3.5" /> Learn &amp; share
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setCardsOpen(true)}
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "flex-1")}
                >
                  <Brain className="h-3.5 w-3.5" /> Recall cards
                </button>
                <button
                  onClick={() => setPublicOpen(true)}
                  className={cn(buttonVariants({ variant: note.madePublic ? "secondary" : "default", size: "sm" }), "flex-1")}
                >
                  {note.madePublic ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Megaphone className="h-3.5 w-3.5" />}
                  {note.madePublic ? "Public" : "Make it public"}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {noteCards && noteCards.length > 0 ? (
                  <Link href="/recall?tab=browse" className="hover:text-foreground">
                    {noteCards.length} recall card{noteCards.length === 1 ? "" : "s"} from this note →
                  </Link>
                ) : (
                  "Test yourself on this note, or turn it into a content seed."
                )}
              </p>
            </Card>

            {/* AI */}
            <Card>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" /> AI
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setAiLoading("summary");
                    setAiResult(null);
                    try {
                      setAiResult({ kind: "Summary", text: await summarize({ noteId: id }) });
                    } catch {
                      setAiResult({ kind: "Error", text: "AI unavailable (rate limit). Try again." });
                    } finally {
                      setAiLoading(null);
                    }
                  }}
                  disabled={!!aiLoading}
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "flex-1")}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  {aiLoading === "summary" ? "…" : "Summarize"}
                </button>
                <button
                  onClick={async () => {
                    setAiLoading("related");
                    setAiResult(null);
                    try {
                      setAiResult({ kind: "Related notes", text: await findRelated({ noteId: id }) });
                    } catch {
                      setAiResult({ kind: "Error", text: "AI unavailable (rate limit). Try again." });
                    } finally {
                      setAiLoading(null);
                    }
                  }}
                  disabled={!!aiLoading}
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "flex-1")}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  {aiLoading === "related" ? "…" : "Find related"}
                </button>
              </div>
              {aiResult && (
                <div className="mt-3 rounded-lg bg-muted/20 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">{aiResult.kind}</p>
                  <MarkdownLite text={aiResult.text} onWikiLink={openByTitle} />
                </div>
              )}
            </Card>

            <Card>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Organize
              </h3>
              {/* Project — optional; if set, the life area is inherited from it */}
              <select
                value={linkedProject?._id ?? ""}
                onChange={(e) => {
                  const proj = projects?.find((p) => p._id === e.target.value);
                  if (proj) {
                    void update({ id, linkedProjectIds: [proj._id], lifeAreaId: proj.lifeAreaId, sectionId: null });
                  } else {
                    void update({ id, linkedProjectIds: [] });
                  }
                }}
                className="mb-2 w-full rounded-md border border-input bg-card shadow-xs px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
              >
                <option value="">No project</option>
                {projects?.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
              {linkedProject ? (
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-2 py-1.5 text-sm">
                  <span className="text-xs text-muted-foreground">Life area</span>
                  <span className="font-medium">
                    {areas?.find((a) => a._id === note.lifeAreaId)?.name ?? "—"}
                  </span>
                </div>
              ) : (
                <select
                  value={note.lifeAreaId ?? ""}
                  onChange={(e) =>
                    void update({
                      id,
                      lifeAreaId: e.target.value ? (e.target.value as Id<"lifeAreas">) : null,
                      sectionId: null,
                    })
                  }
                  className="mb-2 w-full rounded-md border border-input bg-card shadow-xs px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
                >
                  <option value="">No life area</option>
                  {areas?.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={note.sectionId ?? ""}
                onChange={(e) =>
                  void update({
                    id,
                    sectionId: e.target.value ? (e.target.value as Id<"sections">) : null,
                  })
                }
                className="w-full rounded-md border border-input bg-card shadow-xs px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
              >
                <option value="">No section</option>
                {areaSections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 rounded-md bg-primary/15 px-2.5 py-0.5 text-xs text-primary"
                  >
                    {t}
                    <button
                      onClick={() =>
                        void update({ id, tags: tags.filter((x) => x !== t) })
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const t = tagInput.trim();
                      if (t && !tags.includes(t)) void update({ id, tags: [...tags, t] });
                      setTagInput("");
                    }
                  }}
                  placeholder="Add tag…"
                  className="w-20 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
              </div>
            </Card>

            <Card>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Link2 className="h-3.5 w-3.5" /> Linked notes
              </h3>
              {connections && connections.outgoing.length > 0 ? (
                <div className="space-y-1.5">
                  {(() => {
                    const missing = connections.outgoing.filter(
                      (c) => !(note.linkReasons ?? []).some((r) => r.noteId === c._id && r.reason.trim()),
                    ).length;
                    return missing > 0 ? (
                      <p className="text-[11px] text-warning">
                        {missing} link{missing === 1 ? "" : "s"} without a “why” — the reason is the knowledge.
                      </p>
                    ) : null;
                  })()}
                  {connections.outgoing.map((c) => {
                    const reason = (note.linkReasons ?? []).find((r) => r.noteId === c._id)?.reason ?? "";
                    return (
                      <div key={c._id} className="rounded-lg bg-muted/50 px-3 py-2">
                        <Link href={`/notes/${c._id}`} className="flex items-center justify-between text-sm hover:underline">
                          {c.title}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                        <input
                          key={`${c._id}-${reason}`}
                          defaultValue={reason}
                          onBlur={(e) => {
                            if (e.target.value.trim() !== reason)
                              void setLinkReason({ id, targetId: c._id, reason: e.target.value }).then(() => toast("Link reason saved"));
                          }}
                          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                          placeholder="Why does this connect?"
                          className={cn(
                            "mt-1 w-full border-b border-dashed bg-transparent pb-0.5 text-xs outline-none placeholder:text-muted-foreground focus:border-ring",
                            reason ? "border-transparent text-muted-foreground" : "border-warning/50",
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Type <code className="rounded bg-muted px-1">[[</code> in the note to
                  link others.
                </p>
              )}
            </Card>

            <Card>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <CornerUpLeft className="h-3.5 w-3.5" /> Backlinks
              </h3>
              {connections && connections.backlinks.length > 0 ? (
                <div className="space-y-1">
                  {connections.backlinks.map((c) => (
                    <Link
                      key={c._id}
                      href={`/notes/${c._id}`}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm hover:bg-accent"
                    >
                      {c.title}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No notes link here yet.</p>
              )}
            </Card>
          </div>
        </div>
      </div>
      <MakePublicDialog noteId={id} open={publicOpen} onClose={() => setPublicOpen(false)} />
      <Dialog open={cardsOpen} onClose={() => setCardsOpen(false)} title="Create recall cards" size="lg">
        <CardProposals
          noteId={id}
          learningAreaId={note.learningAreaId}
          onDone={() => setCardsOpen(false)}
          intro={
            <p className="text-sm text-muted-foreground">
              AI drafts 3–6 question → answer cards from “{note.title}”. You approve each one; they join your daily Recall queue.
            </p>
          }
        />
      </Dialog>
    </div>
  );
}

function AttachmentRow({
  att,
  onRemove,
}: {
  att: Attachment;
  onRemove: () => void;
}) {
  const url = useQuery(api.files.getUrl, { storageId: att.storageId });
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
      <FileText className="h-4 w-4 text-primary" />
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="flex-1 truncate hover:text-primary">
          {att.name}
        </a>
      ) : (
        <span className="flex-1 truncate text-muted-foreground">{att.name}</span>
      )}
      <button onClick={onRemove} title="Remove attachment" aria-label="Remove attachment" className="text-muted-foreground hover:text-danger">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
