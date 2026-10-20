"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { ArrowRight, Layers, Lightbulb, Sprout, Trash2, Zap } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Bar, Chip, EmptyHint, InlineEdit, Kbd, Ring, Section, Select, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { relDay, ymdOf } from "@/lib/day";
import { BrandPicker, FormatBadge, StageChip } from "./bits";
import { FORMATS, IDEA_GOAL, IDEA_SPARKS, errMsg, pillarColor, type Brand, type LitePiece, type Pillar } from "./model";

export function IdeasBank({
  pieces,
  allPieces,
  pillars,
  today,
  defaultBrand,
}: {
  pieces: LitePiece[];
  allPieces: LitePiece[];
  pillars: Pillar[];
  today: string;
  defaultBrand: Brand;
}) {
  const capture = useMutation(api.content.captureIdeas);
  const update = useMutation(api.content.update);
  const setStage = useMutation(api.content.setStage);
  const remove = useMutation(api.content.remove);

  const [text, setText] = useState("");
  const [brand, setBrand] = useState<Brand>(defaultBrand);
  const [pillarId, setPillarId] = useState("");
  const [format, setFormat] = useState("text_post");
  const [busy, setBusy] = useState(false);
  const [listPillar, setListPillar] = useState("all");
  const ta = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    setBrand(defaultBrand);
    setPillarId("");
  }, [defaultBrand]);

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const ideas = useMemo(() => pieces.filter((p) => p.stage === "idea" || p.stage === "seed"), [pieces]);
  const bankTotal = allPieces.filter((p) => p.stage === "idea" || p.stage === "seed").length;
  const pct = Math.min(100, (bankTotal / IDEA_GOAL) * 100);

  const byPillar = useMemo(() => {
    const rows = pillars.map((p, i) => ({
      id: p._id as string,
      name: p.name,
      color: pillarColor(p, i),
      count: ideas.filter((x) => x.pillarId === p._id).length,
    }));
    const none = ideas.filter((x) => !x.pillarId).length;
    if (none) rows.push({ id: "none", name: "No pillar", color: "var(--muted-foreground)", count: none });
    return rows;
  }, [ideas, pillars]);
  const maxPillar = Math.max(1, ...byPillar.map((r) => r.count));

  const shown = ideas
    .filter((p) => (listPillar === "all" ? true : listPillar === "none" ? !p.pillarId : p.pillarId === listPillar))
    .sort((a, b) => b.createdAt - a.createdAt);

  const brandPillars = pillars.filter((p) => p.brand === brand);

  async function submit() {
    if (!lines.length) return;
    setBusy(true);
    try {
      const n = await capture({
        lines,
        brand,
        format,
        pillarId: (pillarId || undefined) as Id<"contentPillars"> | undefined,
      });
      setText("");
      const total = bankTotal + n;
      if (bankTotal < IDEA_GOAL && total >= IDEA_GOAL) reward(`Idea bank full: ${total} ideas`, undefined, true);
      else toast(`${n} idea${n === 1 ? "" : "s"} banked`, { tone: "success", sub: `${total} in the bank` });
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  function spark(s: string) {
    setText((t) => (t && !t.endsWith("\n") ? `${t}\n${s} ` : `${t}${s} `));
    requestAnimationFrame(() => {
      const el = ta.current;
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = el.value.length;
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Capture ideas" icon={Zap} className="lg:col-span-2" hint="One idea per line. Dump them now, judge them later.">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {IDEA_SPARKS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => spark(s)}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-ring/60 hover:text-foreground"
              >
                {s.replace(/:$/, "")}
              </button>
            ))}
          </div>
          <textarea
            ref={ta}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void submit();
              }
            }}
            rows={6}
            placeholder={"Why most founders post for 3 weeks and quit\nThe objection I hear on every sales call\nWhat I learned shipping v1 in 30 days"}
            className={cn(inputClass, "w-full resize-y py-2 font-[inherit] leading-relaxed")}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <BrandPicker value={brand} onChange={(b) => { setBrand(b); setPillarId(""); }} />
            <Select value={pillarId} onChange={(e) => setPillarId(e.target.value)} className="h-8 w-auto min-w-[130px]">
              <option value="">No pillar</option>
              {brandPillars.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select value={format} onChange={(e) => setFormat(e.target.value)} className="h-8 w-auto min-w-[120px]">
              {FORMATS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </Select>
            <span className="ml-auto hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
              <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd>
            </span>
            <button onClick={() => void submit()} disabled={!lines.length || busy} className={buttonVariants({ size: "sm" })}>
              <Lightbulb className="h-3.5 w-3.5" />
              {lines.length > 1 ? `Add ${lines.length} ideas` : "Add idea"}
            </button>
          </div>
        </Section>

        <Section title="Idea bank" icon={Lightbulb} hint="Aim for ~100 so the pipeline never runs dry.">
          <div className="flex items-center gap-4">
            <Ring value={pct} size={84} stroke={8} tone={pct >= 100 ? "success" : "primary"}>
              <div className="text-center leading-none">
                <div className="text-xl font-semibold tabular-nums">{bankTotal}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">/ {IDEA_GOAL}</div>
              </div>
            </Ring>
            <p className="text-sm text-muted-foreground">
              {bankTotal >= IDEA_GOAL
                ? "Full bank. Now pick the best one for this week's hub."
                : `${IDEA_GOAL - bankTotal} more to a full bank. Two minutes a day gets you there.`}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {byPillar.length === 0 && <p className="text-xs text-muted-foreground">Add pillars to see ideas per theme.</p>}
            {byPillar.map((r) => (
              <button
                key={r.id}
                onClick={() => setListPillar(listPillar === r.id ? "all" : r.id)}
                className={cn("block w-full rounded-md px-1 py-0.5 text-left transition-colors hover:bg-accent/50", listPillar === r.id && "bg-accent")}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: r.color }} />
                    <span className="truncate">{r.name}</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">{r.count}</span>
                </div>
                <Bar value={(r.count / maxPillar) * 100} color={r.color} height="h-1" />
              </button>
            ))}
          </div>
        </Section>
      </div>

      <Section
        title={`Ideas (${shown.length})`}
        icon={Sprout}
        action={
          <Select value={listPillar} onChange={(e) => setListPillar(e.target.value)} className="h-8 w-auto min-w-[130px]">
            <option value="all">All pillars</option>
            {pillars.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
            <option value="none">No pillar</option>
          </Select>
        }
        bodyClassName="p-0 sm:p-0"
      >
        {shown.length === 0 ? (
          <div className="p-4">
            <EmptyHint
              icon={Lightbulb}
              title="No ideas here yet"
              hint="Every objection, question and lesson is a post. Capture them above, one per line."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {shown.map((p) => {
              const pl = pillars.find((x) => x._id === p.pillarId);
              return (
                <li key={p._id} className="group flex flex-wrap items-center gap-2 px-4 py-2 sm:flex-nowrap sm:px-5">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: pl ? pillarColor(pl, pillars.indexOf(pl)) : "var(--border)" }} />
                  <div className="min-w-0 flex-1 basis-[60%]">
                    <InlineEdit
                      value={p.title}
                      onSave={(v) => v.trim() && void update({ id: p._id, title: v }).catch((e) => toast(errMsg(e), { tone: "warning" }))}
                      className="text-sm"
                    />
                  </div>
                  <span className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
                    {p.stage === "seed" && <StageChip stage="seed" />}
                    <FormatBadge format={p.format} iconOnly />
                    <span className="hidden text-[11px] text-muted-foreground md:inline">{relDay(ymdOf(p.createdAt), today)}</span>
                    <Select
                      value={p.pillarId ?? ""}
                      onChange={(e) =>
                        void update({ id: p._id, pillarId: (e.target.value || null) as Id<"contentPillars"> | null }).catch((err) =>
                          toast(errMsg(err), { tone: "warning" }),
                        )
                      }
                      className="h-7 w-[120px] text-xs"
                      aria-label="Pillar"
                    >
                      <option value="">No pillar</option>
                      {pillars
                        .filter((x) => x.brand === p.brand)
                        .map((x) => (
                          <option key={x._id} value={x._id}>
                            {x.name}
                          </option>
                        ))}
                    </Select>
                    {p.stage === "idea" && (
                      <button
                        title="Mark as seed (tested as a short post)"
                        onClick={() => void setStage({ id: p._id, stage: "seed", date: today }).catch((e) => toast(errMsg(e), { tone: "warning" }))}
                        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                      >
                        <Sprout className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      title="Make it this week's hub"
                      onClick={async () => {
                        try {
                          await update({ id: p._id, isHub: true });
                          await setStage({ id: p._id, stage: "brief", date: today });
                          toast("Promoted to hub · now in Brief", { tone: "success" });
                        } catch (e) {
                          toast(errMsg(e), { tone: "warning" });
                        }
                      }}
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                    >
                      <Layers className="h-3.5 w-3.5" />
                    </button>
                    <button
                      title="Move to Brief"
                      onClick={async () => {
                        try {
                          await setStage({ id: p._id, stage: "brief", date: today });
                          toast("Moved to Brief");
                        } catch (e) {
                          toast(errMsg(e), { tone: "warning" });
                        }
                      }}
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    {/* Visible on phones too: the title is inline-editable, so this is the only way into the piece. */}
                    <Link href={`/content/${p._id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      Open
                    </Link>
                    <button
                      title="Delete idea"
                      aria-label="Delete idea"
                      onClick={() => {
                        if (confirm(`Delete “${p.title}”?`)) void remove({ id: p._id }).catch((e) => toast(errMsg(e), { tone: "warning" }));
                      }}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        "text-muted-foreground hover:text-danger sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100",
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {shown.some((p) => p.stage === "seed") && (
          <p className="border-t border-border px-5 py-2 text-[11px] text-muted-foreground">
            <Chip tone="muted" className="mr-1">Seed</Chip> = tested as a short post. Seeds that beat your median make great hubs.
          </p>
        )}
      </Section>
    </div>
  );
}
