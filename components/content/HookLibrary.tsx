"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Copy, Library, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Chip, EmptyHint, InlineEdit, Section, Select, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { HOOK_TYPES, STARTER_HOOKS, errMsg } from "./model";

const SOURCE_LABEL = { swipe: "From a swipe", own: "Your outlier", manual: "Added" } as const;

/** Hook library: winning hooks from swipes and your own outliers, as reusable templates. */
export function HookLibrary() {
  const hooks = useQuery(api.swipes.listHooks);
  const create = useMutation(api.swipes.createHook);
  const update = useMutation(api.swipes.updateHook);
  const remove = useMutation(api.swipes.removeHook);
  const countUse = useMutation(api.swipes.useHook);
  const addStarter = useMutation(api.swipes.addStarterHooks);

  const [text, setText] = useState("");
  const [type, setType] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of hooks ?? []) m.set(h.hookType ?? "", (m.get(h.hookType ?? "") ?? 0) + 1);
    return m;
  }, [hooks]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (hooks ?? []).filter(
      (h) => (filter === "all" || (h.hookType ?? "") === filter) && (!needle || h.text.toLowerCase().includes(needle) || (h.note ?? "").toLowerCase().includes(needle)),
    );
  }, [hooks, filter, q]);

  async function add() {
    if (!text.trim()) return;
    try {
      const r = await create({ text, hookType: type || undefined, note: note || undefined });
      toast(r.existed ? "Already in your library" : "Hook added", { tone: "success" });
      setText("");
      setNote("");
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  }

  function copy(id: (typeof list)[number]["_id"], t: string) {
    void navigator.clipboard
      ?.writeText(t)
      .then(() => {
        toast("Hook copied", { sub: "Counted as a use" });
        void countUse({ id }).catch(() => {}); // a missed use count isn't worth an error
      })
      .catch(() => toast("Couldn't copy", { tone: "warning" }));
  }

  return (
    <div className="space-y-4">
      <Section title="Add a hook" icon={Plus} hint="Use [brackets] for the parts you swap, e.g. “I spent [time] doing [X] so you don't have to.”">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
          className="grid gap-2 md:grid-cols-[1fr_160px_200px_auto]"
        >
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write or paste a hook…" className={cn(inputClass, "h-9 w-full")} />
          <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Hook type">
            <option value="">Type…</option>
            {HOOK_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </Select>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className={cn(inputClass, "h-9 w-full")} />
          <button type="submit" disabled={!text.trim()} className={buttonVariants({ size: "default" })}>
            Add
          </button>
        </form>
      </Section>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hooks" className={cn(inputClass, "h-8 w-full pl-8")} />
        </div>
        <div className="flex flex-wrap gap-1">
          {[{ key: "all", label: "All" }, ...HOOK_TYPES, { key: "", label: "Untyped" }]
            .filter((t) => t.key === "all" || counts.get(t.key))
            .map((t) => (
              <button
                key={t.key || "untyped"}
                onClick={() => setFilter(t.key)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  filter === t.key ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span className="tabular-nums opacity-70">{t.key === "all" ? hooks?.length ?? 0 : counts.get(t.key)}</span>
              </button>
            ))}
        </div>
      </div>

      {hooks === undefined ? (
        <div className="space-y-2">
          <div className="skeleton h-16" />
          <div className="skeleton h-16" />
          <div className="skeleton h-16" />
        </div>
      ) : hooks.length === 0 ? (
        <EmptyHint
          icon={Library}
          title="Your hook library is empty"
          hint="Winning hooks land here from your swipes and your own outliers. Start with 10 proven templates."
          action={
            <button
              onClick={() =>
                void addStarter({ hooks: STARTER_HOOKS })
                  .then((n) => toast(`${n} starter hooks added`, { tone: "success" }))
                  .catch((e) => toast(errMsg(e), { tone: "warning" }))
              }
              className={buttonVariants({ size: "sm" })}
            >
              <Sparkles className="h-3.5 w-3.5" /> Add starter hooks
            </button>
          }
        />
      ) : list.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No hooks match these filters.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {list.map((h) => (
            <li key={h._id} className="group flex flex-wrap items-start gap-3 px-4 py-3 sm:flex-nowrap">
              <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                <InlineEdit
                  value={h.text}
                  onSave={(v) => v.trim() && void update({ id: h._id, text: v }).catch((e) => toast(errMsg(e), { tone: "warning" }))}
                  className="text-sm font-medium"
                />
                <div className="mt-1 flex flex-wrap items-center gap-1.5 px-1">
                  <Chip tone="muted">{SOURCE_LABEL[h.source]}</Chip>
                  {h.note && <span className="truncate text-[11px] text-muted-foreground">{h.note}</span>}
                  {h.source === "own" && h.sourceId && (
                    <Link href={`/content/${h.sourceId}`} className="text-[11px] text-muted-foreground underline-offset-2 hover:underline">
                      open piece
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Select
                  value={h.hookType ?? ""}
                  onChange={(e) => void update({ id: h._id, hookType: e.target.value || null }).catch((err) => toast(errMsg(err), { tone: "warning" }))}
                  className="h-7 w-[118px] text-xs"
                  aria-label="Hook type"
                >
                  <option value="">Untyped</option>
                  {HOOK_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </Select>
                <span className="w-14 text-right text-[11px] tabular-nums text-muted-foreground" title="Times copied or inserted">
                  {h.uses ?? 0} use{h.uses === 1 ? "" : "s"}
                </span>
                <button onClick={() => copy(h._id, h.text)} title="Copy" aria-label="Copy hook" className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => confirm("Delete this hook?") && void remove({ id: h._id }).catch((e) => toast(errMsg(e), { tone: "warning" }))}
                  aria-label="Delete hook"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-sm" }),
                    "text-muted-foreground hover:text-danger sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100",
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {hooks && hooks.length > 0 && (
        <p className="text-center text-[11px] text-muted-foreground">
          Tip: in any piece, the <span className="font-medium text-foreground">Hook library</span> button inserts these in one click.
        </p>
      )}
    </div>
  );
}
