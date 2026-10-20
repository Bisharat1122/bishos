"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { BookOpen, Columns3, Pencil, Plus, Trash2, Wind } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Chip, Dialog, EmptyHint, Field, Section, Select, TextArea, TextInput, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { BrandBadge, BrandPicker, FieldGroup } from "./bits";
import { PILLAR_SWATCHES, errMsg, matchesBrand, pillarColor, type Brand, type BrandFilter, type Pillar } from "./model";

const SUGGESTED: { name: string; brand: Brand; description: string }[] = [
  { name: "Founder lessons", brand: "personal", description: "Mistakes, decisions and what building a startup is really like." },
  { name: "Learning in public", brand: "personal", description: "What I'm learning, explained simply." },
  { name: "Building in public", brand: "personal", description: "Numbers, behind the scenes, wins and losses." },
  { name: "Customer results", brand: "company", description: "Case studies and outcomes we delivered." },
  { name: "How-to & product", brand: "company", description: "Practical guides that show what we do." },
  { name: "Industry myths", brand: "company", description: "What our market gets wrong, and the better way." },
];

export function PillarsPanel({ pillars, brand }: { pillars: Pillar[]; brand: BrandFilter }) {
  const create = useMutation(api.content.createPillar);
  const remove = useMutation(api.content.removePillar);
  const capture = useMutation(api.content.captureIdeas);
  const [editing, setEditing] = useState<Pillar | "new" | null>(null);
  const [quick, setQuick] = useState<Record<string, string>>({});

  const shown = pillars.filter((p) => matchesBrand(brand, p.brand));
  const existing = new Set(pillars.map((p) => p.name.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Pillars are the 3–5 themes you want to be known for. Every piece belongs to one, so your feed stays coherent and your learning feeds
          your content.
        </p>
        <button onClick={() => setEditing("new")} className={buttonVariants({ size: "sm" })}>
          <Plus className="h-3.5 w-3.5" /> New pillar
        </button>
      </div>

      {shown.length === 0 ? (
        <EmptyHint
          icon={Columns3}
          title={pillars.length ? "No pillars for this brand" : "Set up your content pillars"}
          hint="Start with 2–3 per brand. Tap a suggestion to add it, then edit freely."
          action={
            <div className="flex max-w-xl flex-wrap justify-center gap-1.5">
              {SUGGESTED.filter((s) => matchesBrand(brand, s.brand) && !existing.has(s.name.toLowerCase())).map((s, i) => (
                <button
                  key={s.name}
                  onClick={() =>
                    void create({ name: s.name, brand: s.brand, description: s.description, color: PILLAR_SWATCHES[i % 5] })
                      .then(() => toast(`Pillar “${s.name}” added`, { tone: "success" }))
                      .catch((e) => toast(errMsg(e), { tone: "warning" }))
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs hover:border-ring/60 hover:bg-accent/50"
                >
                  <Plus className="h-3 w-3" />
                  {s.name}
                  <BrandBadge brand={s.brand} compact />
                </button>
              ))}
            </div>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => {
            const color = pillarColor(p, pillars.indexOf(p));
            return (
              <div key={p._id} className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-card">
                <div className="h-1.5" style={{ background: color }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">{p.name}</h3>
                      <BrandBadge brand={p.brand} className="mt-0.5" />
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:focus-within:opacity-100 sm:group-hover:opacity-100">
                      <button aria-label="Edit pillar" onClick={() => setEditing(p)} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label="Delete pillar"
                        onClick={() => {
                          if (confirm(`Delete the pillar “${p.name}”? Pieces keep existing without a pillar.`))
                            void remove({ id: p._id }).catch((e) => toast(errMsg(e), { tone: "warning" }));
                        }}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "hover:text-danger")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {p.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      { l: "Ideas", n: p.ideas },
                      { l: "In progress", n: p.inProgress },
                      { l: "Published", n: p.live },
                    ].map((x) => (
                      <div key={x.l} className="rounded-lg bg-muted/50 py-2">
                        <div className="text-lg font-semibold leading-none tabular-nums">{x.n}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{x.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Chip tone="muted" className="tabular-nums">{p.last30} in 30 days</Chip>
                    {p.learningAreaName && (
                      <Chip tone="outline" className="gap-1">
                        <BookOpen className="h-3 w-3" /> {p.learningAreaName}
                      </Chip>
                    )}
                  </div>
                  {(p.stale || p.empty) && (
                    <div className={cn("mt-3 rounded-lg p-2.5", p.stale ? "bg-warning-soft" : "bg-muted/60")}>
                      <p className={cn("flex items-center gap-1.5 text-xs font-medium", p.stale ? "text-warning" : "text-muted-foreground")}>
                        {p.stale ? (
                          <>
                            <Wind className="h-3.5 w-3.5" /> Quiet for 30 days. One idea keeps it alive.
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" /> No pieces yet. Bank the first idea.
                          </>
                        )}
                      </p>
                      <form
                        className="mt-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const t = (quick[p._id] ?? "").trim();
                          if (!t) return;
                          void capture({ lines: [t], brand: p.brand, pillarId: p._id })
                            .then(() => {
                              setQuick((q) => ({ ...q, [p._id]: "" }));
                              toast("Idea banked", { tone: "success" });
                            })
                            .catch((err) => toast(errMsg(err), { tone: "warning" }));
                        }}
                      >
                        <input
                          value={quick[p._id] ?? ""}
                          onChange={(e) => setQuick((q) => ({ ...q, [p._id]: e.target.value }))}
                          placeholder={`An idea for ${p.name}…`}
                          className={cn(inputClass, "h-8 w-full text-xs")}
                        />
                      </form>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && <PillarDialog pillar={editing === "new" ? null : editing} defaultBrand={brand === "both" ? "personal" : brand} onClose={() => setEditing(null)} />}
    </div>
  );
}

function PillarDialog({ pillar, defaultBrand, onClose }: { pillar: Pillar | null; defaultBrand: Brand; onClose: () => void }) {
  const create = useMutation(api.content.createPillar);
  const update = useMutation(api.content.updatePillar);
  const areas = useQuery(api.lifeAreas.list);
  const learning = useQuery(api.content.learningAreaOptions);
  const [name, setName] = useState(pillar?.name ?? "");
  const [brand, setBrand] = useState<Brand>(pillar?.brand ?? defaultBrand);
  const [description, setDescription] = useState(pillar?.description ?? "");
  const [color, setColor] = useState<string>(pillar?.color ?? "chart-1");
  const [learningAreaId, setLearningAreaId] = useState<string>(pillar?.learningAreaId ?? "");
  const [busy, setBusy] = useState(false);

  const areaColors = (areas ?? []).filter((a) => a.color).map((a) => ({ name: a.name, color: a.color! }));

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (pillar) {
        await update({
          id: pillar._id,
          name,
          brand,
          description,
          color,
          learningAreaId: (learningAreaId || null) as Id<"learningAreas"> | null,
        });
      } else {
        await create({
          name,
          brand,
          description: description || undefined,
          color,
          learningAreaId: (learningAreaId || undefined) as Id<"learningAreas"> | undefined,
        });
      }
      toast(pillar ? "Pillar saved" : "Pillar created", { tone: "success" });
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={pillar ? "Edit pillar" : "New pillar"}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Field label="Name">
          <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Founder lessons" />
        </Field>
        <FieldGroup label="Brand">
          <div>
            <BrandPicker value={brand} onChange={setBrand} />
          </div>
        </FieldGroup>
        <Field label="What it's about" hint="One line you could say out loud: what you teach, for whom.">
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[64px]" />
        </Field>
        <FieldGroup label="Colour">
          <div className="flex flex-wrap items-center gap-2">
            {PILLAR_SWATCHES.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setColor(s)}
                aria-label={`Colour ${s}`}
                className={cn("size-7 rounded-full border-2 transition-transform", color === s ? "scale-110 border-foreground" : "border-transparent")}
                style={{ background: `var(--${s})` }}
              />
            ))}
            {areaColors.length > 0 && <span className="mx-1 h-5 w-px bg-border" />}
            {areaColors.map((a) => (
              <button
                type="button"
                key={a.name}
                title={`Same as ${a.name}`}
                onClick={() => setColor(a.color)}
                className={cn("size-7 rounded-full border-2 transition-transform", color === a.color ? "scale-110 border-foreground" : "border-transparent")}
                style={{ background: a.color }}
              />
            ))}
          </div>
        </FieldGroup>
        <Field label="Fed by learning area (optional)" hint="Learning in public: what you study becomes content here.">
          <Select value={learningAreaId} onChange={(e) => setLearningAreaId(e.target.value)}>
            <option value="">None</option>
            {(learning ?? []).map((l) => (
              <option key={l._id} value={l._id}>
                {l.name}
                {l.status !== "active" ? ` (${l.status})` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Cancel
          </button>
          <button type="submit" disabled={!name.trim() || busy} className={buttonVariants({ size: "sm" })}>
            {pillar ? "Save" : "Create pillar"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
