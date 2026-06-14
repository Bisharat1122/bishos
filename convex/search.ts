import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./helpers";

type Hit = { id: string; title: string; sub?: string; href: string };
type Group = { type: string; label: string; items: Hit[] };

/** Global search across every module. Case-insensitive substring match on
 * titles (and note bodies). Returns grouped, deep-linkable results. */
export const all = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const userId = await requireUser(ctx);
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [] as Group[];

    const [tasks, notes, projects, goals, habits, areas, sections] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
      ctx.db.query("notes").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
      ctx.db.query("projects").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
      ctx.db.query("goals").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
      ctx.db.query("habits").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
      ctx.db.query("lifeAreas").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
      ctx.db.query("sections").filter((x) => x.eq(x.field("userId"), userId)).collect(),
    ]);

    const areaName = (id?: string) => areas.find((a) => a._id === id)?.name;
    const has = (s?: string) => !!s && s.toLowerCase().includes(needle);
    const LIMIT = 6;

    const groups: Group[] = [];
    const push = (type: string, label: string, items: Hit[]) => {
      if (items.length) groups.push({ type, label, items: items.slice(0, LIMIT) });
    };

    push("task", "Tasks", tasks
      .filter((t) => has(t.title) || has(t.description))
      .map((t) => ({ id: t._id, title: t.title, sub: areaName(t.lifeAreaId), href: "/tasks" })));

    push("note", "Notes", notes
      .filter((n) => has(n.title) || has(n.content))
      .map((n) => ({ id: n._id, title: n.title, sub: areaName(n.lifeAreaId), href: `/notes/${n._id}` })));

    push("project", "Projects", projects
      .filter((p) => has(p.title) || has(p.description) || has(p.outcome))
      .map((p) => ({ id: p._id, title: p.title, sub: `${p.kind ?? "standard"} · ${p.status}`, href: `/projects/${p._id}` })));

    push("goal", "Goals", goals
      .filter((g) => has(g.title) || has(g.description))
      .map((g) => ({ id: g._id, title: g.title, sub: `${g.progress}%`, href: `/goals/${g._id}` })));

    push("habit", "Habits", habits
      .filter((h) => has(h.title) || has(h.description))
      .map((h) => ({ id: h._id, title: h.title, sub: `🔥 ${h.streak}`, href: "/habits" })));

    push("lifeArea", "Life Areas", areas
      .filter((a) => has(a.name) || has(a.description))
      .map((a) => ({ id: a._id, title: a.name, href: `/life-areas/${a._id}` })));

    push("section", "Sections", sections
      .filter((s) => has(s.name))
      .map((s) => ({ id: s._id, title: s.name, sub: areaName(s.lifeAreaId), href: `/life-areas/${s.lifeAreaId}` })));

    return groups;
  },
});
