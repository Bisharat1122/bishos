"use client";

/**
 * Skill tree for a learning area (parentId tree). Status todo → learning →
 * practicing → solid is colour-coded; click the dot to advance. Inline add
 * (root or child), rename, reorder, delete, and an AI "map the subject"
 * suggestion you approve node by node.
 */
import { useMemo, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, GitBranch, Plus, Trash2, Wand2, X } from "lucide-react";
import { EmptyHint, InlineEdit, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { AiDots } from "@/components/Skeleton";
import { SKILL_STATUSES, SkillStatus, errMsg, nextSkillStatus, skillMeta } from "./meta";

type Skill = Doc<"skillNodes">;

export function SkillTree({ areaId, skills }: { areaId: Id<"learningAreas">; skills: Skill[] }) {
  const addSkill = useMutation(api.learning.addSkill);
  const [rootDraft, setRootDraft] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const children = useMemo(() => {
    const ids = new Set(skills.map((s) => s._id as string));
    const m = new Map<string, Skill[]>();
    for (const s of skills) {
      const key = s.parentId && ids.has(s.parentId) ? s.parentId : "root";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(s);
    }
    for (const list of m.values()) list.sort((a, b) => a.order - b.order);
    return m;
  }, [skills]);

  const counts = SKILL_STATUSES.map((s) => ({ ...s, n: skills.filter((k) => k.status === s.value).length }));
  const weight = { todo: 0, learning: 1 / 3, practicing: 2 / 3, solid: 1 } as const;
  const pct = skills.length ? Math.round((skills.reduce((a, s) => a + weight[s.status], 0) / skills.length) * 100) : 0;

  async function addRoot() {
    const t = rootDraft.trim();
    if (!t) return;
    try {
      await addSkill({ learningAreaId: areaId, title: t });
      setRootDraft("");
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Skill progress</p>
            <p className="text-2xl font-semibold tabular-nums">{pct}%</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {counts.find((c) => c.value === "solid")!.n} of {skills.length} solid
          </p>
        </div>
        {/* Segmented bar by status */}
        <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
          {counts
            .filter((c) => c.value !== "todo" && c.n)
            .reverse()
            .map((c) => (
              <div key={c.value} className="h-full transition-all duration-700" style={{ width: `${(c.n / Math.max(1, skills.length)) * 100}%`, background: c.color }} />
            ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {counts.map((c) => (
            <span key={c.value} className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: c.color }} />
              {c.label} <b className="tabular-nums text-foreground">{c.n}</b>
            </span>
          ))}
        </div>
      </div>

      <SkillSuggestions areaId={areaId} />

      {skills.length === 0 ? (
        <EmptyHint
          icon={GitBranch}
          title="Map the skill first"
          hint="Break the area into skills you can practise (Ultralearning: map the subject before diving in). Add a few, or let AI suggest a tree."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card p-2 shadow-card sm:p-3">
          <ul className="space-y-0.5">
            {(children.get("root") ?? []).map((s, i, arr) => (
              <SkillNode
                key={s._id}
                skill={s}
                childrenMap={children}
                collapsed={collapsed}
                toggle={(id) =>
                  setCollapsed((c) => {
                    const n = new Set(c);
                    if (n.has(id)) n.delete(id);
                    else n.add(id);
                    return n;
                  })
                }
                depth={0}
                first={i === 0}
                last={i === arr.length - 1}
              />
            ))}
          </ul>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void addRoot();
        }}
        className="flex gap-2"
      >
        <input
          value={rootDraft}
          onChange={(e) => setRootDraft(e.target.value)}
          placeholder="Add a top-level skill… (e.g. “Write hooks”)"
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
        />
        <button type="submit" className={buttonVariants({ size: "sm" })} disabled={!rootDraft.trim()}>
          <Plus /> Add
        </button>
      </form>
    </div>
  );
}

function SkillNode({
  skill,
  childrenMap,
  collapsed,
  toggle,
  depth,
  first,
  last,
}: {
  skill: Skill;
  childrenMap: Map<string, Skill[]>;
  collapsed: Set<string>;
  toggle: (id: string) => void;
  depth: number;
  first: boolean;
  last: boolean;
}) {
  const update = useMutation(api.learning.updateSkill);
  const move = useMutation(api.learning.moveSkill);
  const remove = useMutation(api.learning.removeSkill);
  const addSkill = useMutation(api.learning.addSkill);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const kids = childrenMap.get(skill._id) ?? [];
  const isCollapsed = collapsed.has(skill._id);
  const meta = skillMeta(skill.status);
  const solidKids = kids.filter((k) => k.status === "solid").length;

  async function setStatus(s: SkillStatus) {
    await update({ id: skill._id, status: s });
    if (s === "solid") reward(`“${skill.title}” is solid`, undefined, false);
  }

  return (
    <li>
      <div
        className="group flex items-center gap-1.5 rounded-lg py-1 pr-1 transition-colors hover:bg-accent/50"
        style={{ paddingLeft: depth ? Math.min(depth, 4) * 16 : 4 }}
      >
        <button
          type="button"
          onClick={() => kids.length && toggle(skill._id)}
          className={cn("flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground", !kids.length && "invisible")}
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => void setStatus(nextSkillStatus(skill.status))}
          title={`${meta.label} — click to advance`}
          aria-label={`Status ${meta.label}. Click to advance.`}
          className="relative flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-transform active:scale-90"
          style={{ borderColor: meta.color, background: skill.status === "solid" ? meta.color : "transparent" }}
        >
          {skill.status === "learning" && <span className="size-1.5 rounded-full" style={{ background: meta.color }} />}
          {skill.status === "practicing" && <span className="size-2.5 rounded-full" style={{ background: meta.color }} />}
          {skill.status === "solid" && (
            <svg viewBox="0 0 16 16" className="h-3 w-3 text-background" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.5 8.5l3 3 6-7" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <InlineEdit
            value={skill.title}
            onSave={(t) => t.trim() && void update({ id: skill._id, title: t })}
            className={cn("text-sm", depth === 0 && "font-medium", skill.status === "solid" && "text-muted-foreground")}
          />
        </div>
        {kids.length > 0 && (
          <span className="hidden shrink-0 text-[10px] tabular-nums text-muted-foreground sm:inline">
            {solidKids}/{kids.length}
          </span>
        )}
        <select
          value={skill.status}
          onChange={(e) => void setStatus(e.target.value as SkillStatus)}
          className="h-7 shrink-0 rounded-md border border-transparent bg-transparent px-1 text-[11px] font-medium outline-none hover:border-border focus-visible:border-ring"
          style={{ color: meta.color }}
          aria-label="Skill status"
        >
          {SKILL_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="flex shrink-0 items-center opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <Mini label="Add sub-skill" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" />
          </Mini>
          <Mini label="Move up" onClick={() => void move({ id: skill._id, direction: "up" })} disabled={first}>
            <ArrowUp className="h-3.5 w-3.5" />
          </Mini>
          <Mini label="Move down" onClick={() => void move({ id: skill._id, direction: "down" })} disabled={last}>
            <ArrowDown className="h-3.5 w-3.5" />
          </Mini>
          <Mini
            label="Delete"
            danger
            onClick={() => {
              if (confirm(kids.length ? `Delete “${skill.title}”? Its sub-skills move up a level.` : `Delete “${skill.title}”?`)) void remove({ id: skill._id });
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Mini>
        </div>
      </div>

      {adding && (
        <form
          className="my-1 flex items-center gap-1.5"
          style={{ paddingLeft: Math.min(depth + 1, 4) * 16 + 30 }}
          onSubmit={(e) => {
            e.preventDefault();
            const t = draft.trim();
            if (!t) return;
            void addSkill({ learningAreaId: skill.learningAreaId, title: t, parentId: skill._id }).then(() => setDraft(""));
          }}
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && (setAdding(false), setDraft(""))}
            placeholder="Sub-skill… (Enter to add, Esc to close)"
            className="h-8 min-w-0 flex-1 rounded-md border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
          />
          <button type="button" onClick={() => (setAdding(false), setDraft(""))} className="rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      )}

      {kids.length > 0 && !isCollapsed && (
        <ul
          className="relative space-y-0.5 before:absolute before:bottom-2 before:left-[var(--indent)] before:top-0 before:w-px before:bg-border"
          style={{ ["--indent" as string]: `${Math.min(depth, 4) * 16 + 14}px` } as React.CSSProperties}
        >
          {kids.map((k, i) => (
            <SkillNode
              key={k._id}
              skill={k}
              childrenMap={childrenMap}
              collapsed={collapsed}
              toggle={toggle}
              depth={depth + 1}
              first={i === 0}
              last={i === kids.length - 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function Mini({ label, onClick, children, disabled, danger }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn("rounded p-1 text-muted-foreground transition hover:bg-accent disabled:opacity-30", danger ? "hover:text-danger" : "hover:text-foreground")}
    >
      {children}
    </button>
  );
}

type Proposal = { title: string; keep: boolean; children: { title: string; keep: boolean }[] };

/** AI "map the subject" — propose a tree, approve node by node. */
function SkillSuggestions({ areaId }: { areaId: Id<"learningAreas"> }) {
  const suggest = useAction(api.aiLearning.suggestSkillMap);
  const addSkills = useMutation(api.learning.addSkills);
  const [items, setItems] = useState<Proposal[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await suggest({ learningAreaId: areaId });
      setItems(res.map((s) => ({ title: s.title, keep: true, children: s.children.map((c) => ({ title: c, keep: true })) })));
    } catch (e) {
      toast(errMsg(e, "AI is unavailable right now. Try again in a moment."), { tone: "warning" });
    } finally {
      setLoading(false);
    }
  }

  async function apply() {
    if (!items) return;
    const chosen = items.filter((i) => i.keep).map((i) => ({ title: i.title, children: i.children.filter((c) => c.keep).map((c) => c.title) }));
    if (!chosen.length) return setItems(null);
    setSaving(true);
    try {
      const n = await addSkills({ learningAreaId: areaId, items: chosen });
      reward(`${n} skills added to the tree`);
      setItems(null);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setSaving(false);
    }
  }

  if (!items) {
    return (
      <button onClick={() => void run()} disabled={loading} className={buttonVariants({ variant: "secondary", size: "sm" })}>
        {loading ? <AiDots /> : <Wand2 />} {loading ? "Mapping the subject…" : "Suggest a skill map (AI)"}
      </button>
    );
  }

  const toggle = (i: number, j?: number) =>
    setItems((p) =>
      p
        ? p.map((x, k) =>
            k !== i ? x : j === undefined ? { ...x, keep: !x.keep } : { ...x, children: x.children.map((c, m) => (m === j ? { ...c, keep: !c.keep } : c)) },
          )
        : p,
    );

  return (
    <div className="os-rise rounded-xl border border-dashed border-border bg-card/60 p-4">
      <p className="text-sm font-medium">Suggested skill map</p>
      <p className="text-xs text-muted-foreground">Untick anything that doesn&apos;t fit. Only ticked skills are added.</p>
      <ul className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li key={i}>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={it.keep} onChange={() => toggle(i)} className="size-4 accent-[var(--primary)]" />
              {it.title}
            </label>
            {it.children.length > 0 && (
              <ul className={cn("ml-6 mt-1 space-y-1 border-l border-border pl-3", !it.keep && "opacity-40")}>
                {it.children.map((c, j) => (
                  <li key={j}>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={c.keep && it.keep} disabled={!it.keep} onChange={() => toggle(i, j)} className="size-3.5 accent-[var(--primary)]" />
                      {c.title}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={() => setItems(null)} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Dismiss
        </button>
        <button onClick={() => void apply()} disabled={saving} className={buttonVariants({ size: "sm" })}>
          <Plus /> Add selected
        </button>
      </div>
    </div>
  );
}
