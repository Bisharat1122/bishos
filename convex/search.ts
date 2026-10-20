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
      ctx.db.query("sections").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
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
      .map((t) => ({ id: t._id, title: t.title, sub: areaName(t.lifeAreaId), href: `/tasks/${t._id}` })));

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
      .map((h) => ({ id: h._id, title: h.title, sub: `🔥 ${h.streak}`, href: `/habits/${h._id}` })));

    push("lifeArea", "Life Areas", areas
      .filter((a) => has(a.name) || has(a.description))
      .map((a) => ({ id: a._id, title: a.name, href: `/life-areas/${a._id}` })));

    push("section", "Sections", sections
      .filter((s) => has(s.name))
      .map((s) => ({ id: s._id, title: s.name, sub: areaName(s.lifeAreaId), href: `/life-areas/${s.lifeAreaId}/sections/${s._id}` })));

    // ── Life OS entities ──
    const [people, companies, deals, commitments, content, swipes, offers, campaigns, learning, resources, decisions, inbox] =
      await Promise.all([
        ctx.db.query("people").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
        ctx.db.query("companies").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
        ctx.db.query("deals").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
        ctx.db.query("commitments").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
        ctx.db.query("contentPieces").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
        ctx.db.query("swipes").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
        ctx.db.query("offers").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
        ctx.db.query("campaigns").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
        ctx.db.query("learningAreas").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
        ctx.db.query("resources").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
        ctx.db.query("decisions").withIndex("by_user", (x) => x.eq("userId", userId)).collect(),
        ctx.db.query("inbox").withIndex("by_user_status", (x) => x.eq("userId", userId).eq("status", "open")).collect(),
      ]);

    push("person", "People", people
      .filter((p) => has(p.name) || has(p.email) || has(p.title) || has(p.notes))
      .map((p) => ({ id: p._id, title: p.name, sub: p.relation, href: `/people/${p._id}` })));
    push("company", "Companies", companies
      .filter((c) => has(c.name) || has(c.industry))
      .map((c) => ({ id: c._id, title: c.name, sub: c.relationship, href: `/companies/${c._id}` })));
    push("deal", "Deals", deals
      .filter((d) => has(d.title) || has(d.nextStep) || has(d.notes))
      .map((d) => ({ id: d._id, title: d.title, sub: d.stage, href: `/pipeline?deal=${d._id}` })));
    push("commitment", "Commitments", commitments
      .filter((c) => c.status === "open" && (has(c.title) || has(c.notes)))
      .map((c) => ({ id: c._id, title: c.title, sub: c.direction === "i_owe" ? "I owe" : "Owed to me", href: `/commitments` })));
    push("content", "Content", content
      .filter((c) => has(c.title) || has(c.hook) || has(c.script))
      .map((c) => ({ id: c._id, title: c.title, sub: `${c.brand} · ${c.stage.replace(/_/g, " ")}`, href: `/content/${c._id}` })));
    push("swipe", "Inspiration", swipes
      .filter((s) => has(s.title) || has(s.hookText) || has(s.creator) || has(s.whyItWorked))
      .map((s) => ({ id: s._id, title: s.title || s.hookText || "Saved inspiration", sub: s.creator, href: `/swipes` })));
    push("offer", "Offers", offers
      .filter((o) => has(o.name) || has(o.dreamOutcome) || has(o.icp))
      .map((o) => ({ id: o._id, title: o.name, sub: o.status, href: `/offers/${o._id}` })));
    push("campaign", "Campaigns", campaigns
      .filter((c) => has(c.name) || has(c.objective))
      .map((c) => ({ id: c._id, title: c.name, sub: c.status, href: `/campaigns/${c._id}` })));
    push("learning", "Learning", learning
      .filter((l) => has(l.name) || has(l.targetPerformance))
      .map((l) => ({ id: l._id, title: l.name, sub: l.status, href: `/learning/${l._id}` })));
    push("resource", "Library", resources
      .filter((r) => has(r.title) || has(r.author) || has(r.whySaved))
      .map((r) => ({ id: r._id, title: r.title, sub: `${r.format} · ${r.status}`, href: `/library` })));
    push("decision", "Decisions", decisions
      .filter((d) => has(d.title) || has(d.context))
      .map((d) => ({ id: d._id, title: d.title, sub: d.status, href: `/decisions?decision=${d._id}` })));
    push("inbox", "Inbox", inbox
      .filter((i) => has(i.text))
      .map((i) => ({ id: i._id, title: i.text.slice(0, 80), href: `/inbox` })));

    return groups;
  },
});
