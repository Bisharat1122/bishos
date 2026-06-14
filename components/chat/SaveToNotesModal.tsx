"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Modal } from "@/components/ui";
import { FilePlus2, FilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Save an AI message into a note — new note or appended to an existing one. */
export function SaveToNotesModal({
  content,
  onClose,
}: {
  content: string;
  onClose: () => void;
}) {
  const areas = useQuery(api.lifeAreas.list);
  const sections = useQuery(api.sections.list, {});
  const notes = useQuery(api.notes.list, {});
  const createNote = useMutation(api.notes.create);
  const appendNote = useMutation(api.notes.append);

  const [mode, setMode] = useState<"new" | "existing">("new");
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [existingId, setExistingId] = useState("");
  const [saving, setSaving] = useState(false);

  const areaSections = sections?.filter((s) => s.lifeAreaId === areaId) ?? [];

  async function save() {
    setSaving(true);
    try {
      if (mode === "new") {
        await createNote({
          title: title.trim() || "From AI chat",
          content,
          lifeAreaId: areaId ? (areaId as Id<"lifeAreas">) : undefined,
          sectionId: sectionId ? (sectionId as Id<"sections">) : undefined,
        });
      } else if (existingId) {
        await appendNote({ id: existingId as Id<"notes">, content });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const canSave = mode === "new" ? true : Boolean(existingId);

  return (
    <Modal title="Save to notes" onClose={onClose}>
      {/* mode toggle */}
      <div className="mb-4 flex rounded-full border border-border p-0.5">
        {([
          { k: "new", label: "New note", icon: FilePlus2 },
          { k: "existing", label: "Existing note", icon: FilePlus },
        ] as const).map((t) => (
          <button
            key={t.k}
            onClick={() => setMode(t.k)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-medium transition",
              mode === t.k ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* preview of what's being saved */}
      <div className="mb-4 max-h-28 overflow-y-auto rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        {content.slice(0, 400)}
        {content.length > 400 ? "…" : ""}
      </div>

      {mode === "new" ? (
        <div className="space-y-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title…"
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={areaId}
              onChange={(e) => {
                setAreaId(e.target.value);
                setSectionId("");
              }}
              className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none"
            >
              <option value="">No life area</option>
              {areas?.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              disabled={!areaId}
              className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none disabled:opacity-50"
            >
              <option value="">No section</option>
              {areaSections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <select
          value={existingId}
          onChange={(e) => setExistingId(e.target.value)}
          className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none"
        >
          <option value="">Choose a note…</option>
          {notes?.map((n) => (
            <option key={n._id} value={n._id}>
              {n.title}
            </option>
          ))}
        </select>
      )}

      <button
        onClick={() => void save()}
        disabled={!canSave || saving}
        className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {saving ? "Saving…" : mode === "new" ? "Create note" : "Append to note"}
      </button>
    </Modal>
  );
}
