"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Link2, Paperclip, Tag, StickyNote, Table, Share2 } from "lucide-react";
import { Topbar, EmptyState, AddButton } from "@/components/ui";
import { NotesGraph } from "@/components/notes/NotesGraph";
import { cn } from "@/lib/utils";

export default function NotesPage() {
  const notes = useQuery(api.notes.list, {});
  const areas = useQuery(api.lifeAreas.list);
  const createNote = useMutation(api.notes.create);
  const router = useRouter();
  const [view, setView] = useState<"list" | "graph">("list");

  const areaName = (id?: Id<"lifeAreas">) =>
    id ? areas?.find((a) => a._id === id)?.name : undefined;

  async function newNote() {
    const id = await createNote({ title: "Untitled note", content: "" });
    router.push(`/notes/${id}`);
  }

  return (
    <div>
      <Topbar action={<AddButton label="New note" onClick={() => void newNote()} />} />
      <div className="px-4 py-7 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your second brain. Use <code className="rounded bg-muted px-1">/</code> for
              blocks and <code className="rounded bg-muted px-1">[[</code> to link notes.
            </p>
          </div>
          <div className="flex rounded-full border border-border p-0.5">
            {([
              { key: "list", label: "List", icon: Table },
              { key: "graph", label: "Graph", icon: Share2 },
            ] as const).map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition",
                  view === v.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <v.icon className="h-4 w-4" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {view === "graph" ? (
          <div className="mt-6">
            <NotesGraph
              notes={notes ?? []}
              areas={areas}
              onOpen={(id) => router.push(`/notes/${id}`)}
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-card/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Life area</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Links</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {notes?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10">
                    <EmptyState title="No notes yet" hint="Create your first note." />
                  </td>
                </tr>
              )}
              {notes?.map((n) => (
                <tr
                  key={n._id}
                  onClick={() => router.push(`/notes/${n._id}`)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium">
                      <StickyNote className="h-4 w-4 text-muted-foreground" />
                      {n.title}
                      {n.attachments && n.attachments.length > 0 && (
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
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
                          className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
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
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
