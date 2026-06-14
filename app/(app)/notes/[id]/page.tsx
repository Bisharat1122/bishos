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
} from "lucide-react";
import { Card, Topbar, EmptyState } from "@/components/ui";
import { DetailSkeleton } from "@/components/Skeleton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AddToMomentum } from "@/components/momentum/AddToMomentum";
import { SlashEditor } from "@/components/editor/SlashEditor";
import { MarkdownLite } from "@/components/tasks/MarkdownLite";

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
  useEffect(() => {
    if (content === null || !note || content === note.content) return;
    const t = setTimeout(() => void update({ id, content }), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

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
        <div className="px-8 py-7">
          <EmptyState title="Note not found" />
        </div>
      </div>
    );

  const tags = note.tags ?? [];
  const attachments = (note.attachments ?? []) as Attachment[];
  const areaSections = sections?.filter((s) => s.lifeAreaId === note.lifeAreaId) ?? [];
  const linkedProject = projects?.find((p) => (note.linkedProjectIds ?? []).includes(p._id));

  function openByTitle(title: string) {
    const match = allTitles?.find(
      (t) => t.title.toLowerCase() === title.toLowerCase(),
    );
    if (match) {
      router.push(`/notes/${match._id}`);
    } else {
      // Obsidian-style: clicking a missing link creates the note.
      void createNote({ title }).then((newId) => router.push(`/notes/${newId}`));
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
      const { storageId } = await res.json();
      await update({
        id,
        attachments: [
          ...attachments,
          { storageId, name: file.name, contentType: file.type, size: file.size },
        ],
      });
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
      <div className="px-8 py-7">
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
                className="flex-1 bg-transparent text-2xl font-bold tracking-tight outline-none"
              />
              <div className="flex items-center gap-2">
                <AddToMomentum type="note" itemId={id} title={note.title} compact />
                <button
                  onClick={() => setEditing((e) => !e)}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  {editing ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                  {editing ? "Preview" : "Edit"}
                </button>
                <button
                  onClick={async () => {
                    await removeNote({ id });
                    router.push("/notes");
                  }}
                  className="text-muted-foreground hover:text-warning"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
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
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/15 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/25 disabled:opacity-50"
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
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/15 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/25 disabled:opacity-50"
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
                className="mb-2 w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-sm outline-none"
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
                  className="mb-2 w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-sm outline-none"
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
                className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-sm outline-none"
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
                    className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs text-primary"
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
                <div className="space-y-1">
                  {connections.outgoing.map((c) => (
                    <Link
                      key={c._id}
                      href={`/notes/${c._id}`}
                      className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm hover:text-primary"
                    >
                      {c.title}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
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
                      className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm hover:text-primary"
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
    <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm">
      <FileText className="h-4 w-4 text-primary" />
      <a href={url ?? "#"} target="_blank" rel="noreferrer" className="flex-1 truncate hover:text-primary">
        {att.name}
      </a>
      <button onClick={onRemove} className="text-muted-foreground hover:text-warning">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
