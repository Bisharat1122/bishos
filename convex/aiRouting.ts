/**
 * B1 · Route a conversation: paste call/meeting notes or a transcript and get
 * PROPOSALS (commitments, tasks, a deal update or new deal, new people and
 * content ideas from objections/questions). Nothing is written here: the UI
 * shows checkboxes and applies the chosen ones through the normal mutations.
 */
import { v, ConvexError } from "convex/values";
import { action, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { callOpenRouter } from "./openrouter";

const STAGES = ["target", "contacted", "booked", "discovery", "proposal", "verbal", "won", "lost", "unqualified"] as const;
type Stage = (typeof STAGES)[number];
const OPEN = new Set<string>(["target", "contacted", "booked", "discovery", "proposal", "verbal"]);
const YMD = /^\d{4}-\d{2}-\d{2}$/;

export type RoutingContext = {
  person: { _id: Id<"people">; name: string; companyName: string | null } | null;
  people: { _id: Id<"people">; name: string; companyName: string | null }[];
  deals: { _id: Id<"deals">; title: string; stage: Stage; personId: Id<"people"> | null; personName: string | null }[];
};

export type RoutingProposals = {
  summary: string;
  commitments: { title: string; direction: "i_owe" | "owed_to_me"; personName: string | null; personId: Id<"people"> | null; date: string | null }[];
  tasks: { title: string; plannedFor: string | null }[];
  dealUpdate: {
    dealTitle: string;
    dealId: Id<"deals"> | null; // matched existing deal (null → propose a new deal)
    currentStage: Stage | null;
    stage: Stage | null;
    nextStep: string | null;
    nextStepDate: string | null;
  } | null;
  newPeople: { name: string; company: string | null; title: string | null; existingId: Id<"people"> | null }[];
  contentIdeas: { title: string; why: string }[];
};

/** Names the model can match against (people, open deals, the chosen person). */
export const routingContext = internalQuery({
  args: { personId: v.optional(v.id("people")) },
  handler: async (ctx, { personId }): Promise<RoutingContext> => {
    const userId = await requireUser(ctx);
    const [people, companies, deals] = await Promise.all([
      ctx.db.query("people").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("companies").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const cname = new Map(companies.map((c) => [c._id as string, c.name]));
    const pname = new Map(people.map((p) => [p._id as string, p.name]));
    const row = (p: (typeof people)[number]) => ({ _id: p._id, name: p.name, companyName: p.companyId ? cname.get(p.companyId) ?? null : null });
    const chosen = personId ? people.find((p) => p._id === personId) : undefined;
    return {
      person: chosen ? row(chosen) : null,
      people: people.map(row),
      deals: deals
        .filter((d) => OPEN.has(d.stage) || (personId && d.personId === personId))
        .sort((a, b) => b.stageChangedAt - a.stageChangedAt)
        .slice(0, 80)
        .map((d) => ({ _id: d._id, title: d.title, stage: d.stage, personId: d.personId ?? null, personName: d.personId ? pname.get(d.personId) ?? null : null })),
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Defensive parsing helpers
// ─────────────────────────────────────────────────────────────────────────

/** Strip code fences and grab the first balanced {...} block. */
export function extractJson(raw: string): unknown {
  let s = raw.replace(/```(?:json)?/gi, "").trim();
  const start = s.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  s = end > 0 ? s.slice(start, end + 1) : s.slice(start);
  const attempts = [s, s.replace(/,\s*([}\]])/g, "$1")];
  for (const a of attempts) {
    try {
      return JSON.parse(a);
    } catch {
      /* try the next repair */
    }
  }
  return null;
}

const str = (x: unknown, max = 300): string => (typeof x === "string" ? x.trim().slice(0, max) : typeof x === "number" ? String(x) : "");
const dateOrNull = (x: unknown): string | null => {
  const s = str(x, 20);
  return YMD.test(s) ? s : null;
};
const arr = (x: unknown): Record<string, unknown>[] =>
  Array.isArray(x) ? x.filter((i): i is Record<string, unknown> => !!i && typeof i === "object") : [];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

function matchPerson(name: string, ctx: RoutingContext): Id<"people"> | null {
  const n = norm(name);
  if (!n) return null;
  const exact = ctx.people.find((p) => norm(p.name) === n);
  if (exact) return exact._id;
  const first = n.split(" ")[0];
  const partial = ctx.people.filter((p) => norm(p.name).split(" ")[0] === first || norm(p.name).includes(n));
  return partial.length === 1 ? partial[0]._id : null;
}

function matchDeal(title: string, ctx: RoutingContext, personId?: Id<"people"> | null) {
  const n = norm(title);
  const byTitle = n
    ? ctx.deals.find((d) => norm(d.title) === n) ?? ctx.deals.find((d) => norm(d.title).includes(n) || n.includes(norm(d.title)))
    : undefined;
  if (byTitle) return byTitle;
  if (personId) {
    const theirs = ctx.deals.filter((d) => d.personId === personId && OPEN.has(d.stage));
    if (theirs.length === 1) return theirs[0];
  }
  return undefined;
}

function toStage(x: unknown): Stage | null {
  const s = norm(str(x, 40)).replace(/ /g, "_");
  if ((STAGES as readonly string[]).includes(s)) return s as Stage;
  const alias: Record<string, Stage> = {
    conversation_booked: "booked",
    meeting_booked: "booked",
    call_booked: "booked",
    discovery_done: "discovery",
    proposal_sent: "proposal",
    verbal_yes: "verbal",
    closed_won: "won",
    closed_lost: "lost",
  };
  return alias[s] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────
// The action
// ─────────────────────────────────────────────────────────────────────────

export const routeConversation = action({
  args: { text: v.string(), personId: v.optional(v.id("people")), today: v.optional(v.string()) },
  handler: async (ctx, { text, personId, today }): Promise<RoutingProposals> => {
    const body = text.trim();
    if (body.length < 15) throw new ConvexError("Paste a bit more of the conversation first.");
    const c: RoutingContext = await ctx.runQuery(internal.aiRouting.routingContext, { personId });
    const day = today && YMD.test(today) ? today : new Date().toISOString().slice(0, 10);

    const peopleList = c.people.slice(0, 150).map((p) => `- ${p.name}${p.companyName ? ` (${p.companyName})` : ""}`).join("\n");
    const dealList = c.deals.map((d) => `- "${d.title}" [stage: ${d.stage}]${d.personName ? ` with ${d.personName}` : ""}`).join("\n");

    const prompt = [
      `Today is ${day}. I am Bish, a startup co-founder who runs sales himself.`,
      c.person ? `This conversation was with ${c.person.name}${c.person.companyName ? ` from ${c.person.companyName}` : ""}.` : "",
      "",
      "Known people:",
      peopleList || "(none yet)",
      "",
      "Open deals:",
      dealList || "(none yet)",
      "",
      "Read the conversation below and extract follow-ups. Reply with ONE JSON object and nothing else, exactly this shape:",
      `{
  "summary": "one sentence: what happened",
  "commitments": [{"title": "short promise", "direction": "i_owe" | "owed_to_me", "personName": "name or null", "date": "YYYY-MM-DD or null"}],
  "tasks": [{"title": "concrete next action for me", "plannedFor": "YYYY-MM-DD or null"}],
  "dealUpdate": {"dealTitle": "existing deal title or a short new one", "stage": "target|contacted|booked|discovery|proposal|verbal|won|lost|unqualified", "nextStep": "what happens next", "nextStepDate": "YYYY-MM-DD"} or null,
  "newPeople": [{"name": "full name", "company": "company or null", "title": "job title or null"}],
  "contentIdeas": [{"title": "post idea that answers it", "why": "the objection or question they raised"}]
}`,
      "Rules:",
      "- i_owe = something I promised to do. owed_to_me = something they promised me.",
      "- Resolve relative dates (\"Friday\", \"next week\") against today. Unknown → null.",
      "- dealUpdate only if this conversation is about a sale. Prefer an existing deal title from the list.",
      "- newPeople only for people NOT in the known list.",
      "- contentIdeas: every objection, worry or question the other side raised is a content idea.",
      "- Keep every title under 90 characters. Use [] for none. No markdown, no prose outside the JSON.",
      "",
      "Conversation:",
      '"""',
      body.slice(0, 30000),
      '"""',
    ]
      .filter((l) => l !== undefined)
      .join("\n");

    const raw = await callOpenRouter([
      { role: "system", content: "You turn sales conversations into structured follow-ups. You reply with strict JSON only." },
      { role: "user", content: prompt },
    ]);
    const parsed = extractJson(raw);
    if (!parsed || typeof parsed !== "object") throw new ConvexError("The AI reply wasn't readable. Try again, or trim the text.");
    const o = parsed as Record<string, unknown>;

    const defaultPerson = c.person?._id ?? null;
    const commitments = arr(o.commitments)
      .map((x) => {
        const personName = str(x.personName, 80) || null;
        const dir = str(x.direction, 20).toLowerCase();
        return {
          title: str(x.title, 140),
          direction: (dir.includes("owed") || dir.includes("them") ? "owed_to_me" : "i_owe") as "i_owe" | "owed_to_me",
          personName: personName && personName.toLowerCase() !== "null" ? personName : c.person?.name ?? null,
          personId: (personName ? matchPerson(personName, c) : null) ?? defaultPerson,
          date: dateOrNull(x.date),
        };
      })
      .filter((x) => x.title)
      .slice(0, 12);

    const tasks = arr(o.tasks)
      .map((x) => ({ title: str(x.title, 140), plannedFor: dateOrNull(x.plannedFor) }))
      .filter((x) => x.title)
      .slice(0, 12);

    let dealUpdate: RoutingProposals["dealUpdate"] = null;
    if (o.dealUpdate && typeof o.dealUpdate === "object") {
      const d = o.dealUpdate as Record<string, unknown>;
      const dealTitle = str(d.dealTitle, 120);
      const hit = matchDeal(dealTitle, c, defaultPerson);
      if (dealTitle || hit) {
        dealUpdate = {
          dealTitle: hit?.title ?? dealTitle,
          dealId: hit?._id ?? null,
          currentStage: hit?.stage ?? null,
          stage: toStage(d.stage),
          nextStep: str(d.nextStep, 160) || null,
          nextStepDate: dateOrNull(d.nextStepDate),
        };
      }
    }

    const seen = new Set<string>();
    const newPeople = arr(o.newPeople)
      .map((x) => {
        const name = str(x.name, 80);
        return { name, company: str(x.company, 80) || null, title: str(x.title, 80) || null, existingId: name ? matchPerson(name, c) : null };
      })
      .filter((x) => {
        const k = norm(x.name);
        if (!k || seen.has(k) || k === "null") return false;
        seen.add(k);
        return true;
      })
      .slice(0, 10);

    const contentIdeas = arr(o.contentIdeas)
      .map((x) => ({ title: str(x.title, 140), why: str(x.why, 300) }))
      .filter((x) => x.title)
      .slice(0, 10);

    return { summary: str(o.summary, 400), commitments, tasks, dealUpdate, newPeople, contentIdeas };
  },
});

/**
 * Save an objection/question as a content idea (company brand, text post).
 * Lives here so routing can apply it without depending on the Content module.
 */
export const createContentIdea = mutation({
  args: { title: v.string(), why: v.optional(v.string()), brand: v.optional(v.union(v.literal("company"), v.literal("personal"))) },
  handler: async (ctx, { title, why, brand }) => {
    const userId = await requireUser(ctx);
    const t = title.trim();
    if (!t) throw new ConvexError("A content idea needs a title.");
    return ctx.db.insert("contentPieces", {
      userId,
      title: t.slice(0, 200),
      brand: brand ?? "company",
      format: "text_post",
      stage: "idea",
      brief: why?.trim() ? `From a sales conversation. They asked or objected: ${why.trim()}` : "From a sales conversation.",
      createdAt: Date.now(),
    });
  },
});
