"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Trash2, ArrowUpRight } from "lucide-react";
import { Card, Topbar, EmptyState, AddButton, Modal } from "@/components/ui";

export default function LifeAreasPage() {
  const areas = useQuery(api.lifeAreas.list);
  const sections = useQuery(api.sections.list, {});
  const createArea = useMutation(api.lifeAreas.create);
  const removeArea = useMutation(api.lifeAreas.remove);
  const createSection = useMutation(api.sections.create);
  const removeSection = useMutation(api.sections.remove);

  const [addOpen, setAddOpen] = useState(false);
  const [newArea, setNewArea] = useState("");
  const [sectionDraft, setSectionDraft] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!newArea.trim()) return;
    void createArea({ name: newArea.trim() });
    setNewArea("");
    setAddOpen(false);
  }

  return (
    <div>
      <Topbar
        action={
          <AddButton
            label="New area"
            onClick={() => {
              setNewArea("");
              setAddOpen(true);
            }}
          />
        }
      />
      <div className="px-4 py-7 sm:px-8">
        <h1 className="text-2xl font-bold tracking-tight">Life Areas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The top-level domains of your life. Each holds sections, tasks, notes,
          projects and goals.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {areas?.length === 0 && (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState
                title="No life areas yet"
                hint="Add your first domain above."
              />
            </div>
          )}
          {areas?.map((area) => {
            const areaSections =
              sections?.filter((s) => s.lifeAreaId === area._id) ?? [];
            return (
              <Card key={area._id}>
                <div className="flex items-center justify-between">
                  <Link
                    href={`/life-areas/${area._id}`}
                    className="group flex items-center gap-1.5 font-semibold hover:text-primary"
                  >
                    {area.name}
                    <ArrowUpRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                  </Link>
                  <button
                    onClick={() => void removeArea({ id: area._id })}
                    className="text-muted-foreground hover:text-warning"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {area.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {area.description}
                  </p>
                )}

                <div className="mt-3 space-y-1.5">
                  {areaSections.map((s) => (
                    <div
                      key={s._id}
                      className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-1.5 text-sm"
                    >
                      <Link
                        href={`/life-areas/${area._id}/sections/${s._id}`}
                        className="hover:text-primary"
                      >
                        {s.name}
                      </Link>
                      <button
                        onClick={() => void removeSection({ id: s._id })}
                        className="text-muted-foreground hover:text-warning"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = sectionDraft[area._id]?.trim();
                    if (!val) return;
                    void createSection({
                      lifeAreaId: area._id as Id<"lifeAreas">,
                      name: val,
                    });
                    setSectionDraft((d) => ({ ...d, [area._id]: "" }));
                  }}
                >
                  <input
                    value={sectionDraft[area._id] ?? ""}
                    onChange={(e) =>
                      setSectionDraft((d) => ({
                        ...d,
                        [area._id]: e.target.value,
                      }))
                    }
                    placeholder="Add section…"
                    className="flex-1 rounded-lg border border-border bg-muted/20 px-3 py-1.5 text-xs outline-none focus:border-primary/60"
                  />
                  <button className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium">
                    Add
                  </button>
                </form>
              </Card>
            );
          })}
        </div>
      </div>

      {addOpen && (
        <Modal title="New life area" onClose={() => setAddOpen(false)}>
          <form className="space-y-3" onSubmit={submit}>
            <input
              autoFocus
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              placeholder="Life area (e.g. Business & Ventures)"
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            />
            <button
              disabled={!newArea.trim()}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Add life area
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
