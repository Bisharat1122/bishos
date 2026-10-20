/**
 * Content Studio — pillars, pieces (14-stage pipeline), publish gate,
 * repurposing tree, performance vs your own median, calendar, analytics and
 * the weekly content review.
 *
 * Dates: every `date`/`today` arg is the client-LOCAL "YYYY-MM-DD".
 */
import { ConvexError, v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, awardXp, diffDays, getSettings, mondayOf, monthKey, revokeXp, XP, ymdUtc } from "./os";

// ─────────────────────────────────────────────────────────────────────────
// Model
// ─────────────────────────────────────────────────────────────────────────

type Piece = Doc<"contentPieces">;
type Stage = Piece["stage"];
type Snapshot = NonNullable<Piece["performance"]>[number];
type Window = Snapshot["window"];

export const STAGE_ORDER: Stage[] = [
  "idea",
  "seed",
  "brief",
  "script",
  "ready_to_record",
  "recorded",
  "editing",
  "ready_to_publish",
  "scheduled",
  "published",
  "repurposing",
  "measured",
  "recycle_due",
  "archived",
];

const stageV = v.union(
  v.literal("idea"),
  v.literal("seed"),
  v.literal("brief"),
  v.literal("script"),
  v.literal("ready_to_record"),
  v.literal("recorded"),
  v.literal("editing"),
  v.literal("ready_to_publish"),
  v.literal("scheduled"),
  v.literal("published"),
  v.literal("repurposing"),
  v.literal("measured"),
  v.literal("recycle_due"),
  v.literal("archived"),
);
const brandV = v.union(v.literal("personal"), v.literal("company"));
const windowV = v.union(v.literal("24h"), v.literal("7d"), v.literal("30d"));

/** Text formats skip the recording stages. */
export const TEXT_FORMATS = new Set(["text_post", "thread", "carousel", "newsletter", "article"]);
/** Formats where captions/subtitles apply. */
const VIDEO_FORMATS = new Set(["short_video", "long_video", "story"]);
const RECORDING_STAGES = new Set<Stage>(["ready_to_record", "recorded", "editing"]);
const PRE_PUBLISH = new Set<Stage>(["idea", "seed", "brief", "script", "ready_to_record", "recorded", "editing", "ready_to_publish", "scheduled"]);
/** Moving into one of these from an unpublished state IS publishing. */
const PUBLISH_STAGES = new Set<Stage>(["published", "repurposing", "measured", "recycle_due"]);

export const CHECKLIST_KEYS = ["hook", "aligned", "lockin", "eyes_closed", "visual_match", "two_hits", "cta", "captions", "thumbnail", "pillar", "repurpose"] as const;
/** Gate items that only apply to video formats. */
const VIDEO_ONLY_KEYS = new Set(["aligned", "lockin", "eyes_closed", "visual_match", "captions"]);

const FORMAT_LABEL: Record<string, string> = {
  short_video: "Short video",
  long_video: "Long video",
  carousel: "Carousel",
  text_post: "Text post",
  thread: "Thread",
  newsletter: "Newsletter",
  article: "Article",
  podcast: "Podcast",
  story: "Story",
};
const formatLabel = (f: string) => FORMAT_LABEL[f] ?? f.replace(/_/g, " ");

function checklistKeysFor(format: string): string[] {
  return CHECKLIST_KEYS.filter((k) => !VIDEO_ONLY_KEYS.has(k) || VIDEO_FORMATS.has(format));
}

/** Checklist items still open (pillar + repurpose are auto-satisfied by data). */
function missingChecklist(p: Piece, childCount: number): string[] {
  const done = new Set(p.checklist ?? []);
  if (p.pillarId) done.add("pillar");
  if (childCount > 0) done.add("repurpose");
  return checklistKeysFor(p.format).filter((k) => !done.has(k));
}

function nextStage(stage: Stage, format: string, isHub: boolean): Stage | null {
  if (stage === "archived") return null;
  if (stage === "recycle_due") return "archived";
  let i = STAGE_ORDER.indexOf(stage) + 1;
  while (i < STAGE_ORDER.length) {
    const s = STAGE_ORDER[i];
    if (TEXT_FORMATS.has(format) && RECORDING_STAGES.has(s)) {
      i++;
      continue;
    }
    if (s === "repurposing" && !isHub) {
      i++;
      continue;
    }
    if (s === "recycle_due") {
      i++;
      continue;
    }
    return s;
  }
  return null;
}

/** ymd + n calendar months (day clamped to the month's length). */
function addMonths(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return `${ny}-${String(nm).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

/** Local publish day (publishedOn, else a UTC approximation of publishedAt). */
const pubDay = (p: Piece) => p.publishedOn ?? (p.publishedAt ? ymdUtc(p.publishedAt) : undefined);

// ─────────────────────────────────────────────────────────────────────────
// Performance vs your own median
// ─────────────────────────────────────────────────────────────────────────

const WINDOWS_BY_MATURITY: Window[] = ["30d", "7d", "24h"];

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function snapOf(p: Piece, w: Window): Snapshot | undefined {
  return p.performance?.find((s) => s.window === w && s.views != null);
}

/** The most mature snapshot that has views. */
function bestSnap(p: Piece): Snapshot | undefined {
  for (const w of WINDOWS_BY_MATURITY) {
    const s = snapOf(p, w);
    if (s) return s;
  }
  return undefined;
}

type Baseline = Map<Window, { id: Id<"contentPieces">; format: string; views: number }[]>;

function buildBaseline(pieces: Piece[]): Baseline {
  const b: Baseline = new Map();
  for (const w of WINDOWS_BY_MATURITY) b.set(w, []);
  for (const p of pieces) {
    if (!p.publishedAt) continue;
    for (const w of WINDOWS_BY_MATURITY) {
      const s = snapOf(p, w);
      if (s?.views != null) b.get(w)!.push({ id: p._id, format: p.format, views: s.views });
    }
  }
  return b;
}

export type Perf = {
  window: Window;
  views: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  follows?: number;
  leads?: number;
  median: number | null;
  ratio: number | null;
  basis: "format" | "all" | null;
};

/** Compare a piece's most mature window with the median of your OTHER pieces
 * at that window: same format when ≥3 peers exist, else all formats. */
function perfOf(p: Piece, baseline: Baseline): Perf | null {
  const s = bestSnap(p);
  if (!s || s.views == null) return null;
  const peers = (baseline.get(s.window) ?? []).filter((x) => x.id !== p._id);
  const sameFormat = peers.filter((x) => x.format === p.format).map((x) => x.views);
  let med: number | null = null;
  let basis: Perf["basis"] = null;
  if (sameFormat.length >= 3) {
    med = median(sameFormat);
    basis = "format";
  } else if (peers.length >= 1) {
    med = median(peers.map((x) => x.views));
    basis = "all";
  }
  const ratio = med && med > 0 ? Math.round((s.views / med) * 100) / 100 : null;
  return {
    window: s.window,
    views: s.views,
    likes: s.likes,
    comments: s.comments,
    shares: s.shares,
    saves: s.saves,
    follows: s.follows,
    leads: s.leads,
    median: med,
    ratio,
    basis: ratio == null ? null : basis,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Loading + lite projection (the board/calendar never need the script)
// ─────────────────────────────────────────────────────────────────────────

async function loadAll(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  return ctx.db
    .query("contentPieces")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
}

async function ownPiece(ctx: QueryCtx | MutationCtx, userId: Id<"users">, id: Id<"contentPieces">) {
  const p = await ctx.db.get(id);
  if (!p || p.userId !== userId) throw new ConvexError("That content piece no longer exists.");
  return p;
}

function childCounts(pieces: Piece[]) {
  const m = new Map<string, number>();
  for (const p of pieces) if (p.parentId) m.set(p.parentId, (m.get(p.parentId) ?? 0) + 1);
  return m;
}

const wordCount = (s?: string) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0);

function lite(p: Piece, baseline: Baseline, kids: Map<string, number>) {
  return {
    _id: p._id,
    _creationTime: p._creationTime,
    title: p.title,
    brand: p.brand,
    pillarId: p.pillarId,
    platforms: p.platforms ?? [],
    format: p.format,
    stage: p.stage,
    isHub: p.isHub ?? false,
    parentId: p.parentId,
    hook: p.hook,
    hookType: p.hookType,
    scheduledFor: p.scheduledFor,
    publishedAt: p.publishedAt,
    publishedOn: pubDay(p),
    recycleAt: p.recycleAt,
    url: p.url,
    checklist: p.checklist ?? [],
    childCount: kids.get(p._id) ?? 0,
    swipeCount: p.swipeIds?.length ?? 0,
    hasLesson: !!p.lesson?.trim(),
    lesson: p.lesson,
    words: wordCount(p.script),
    campaignId: p.campaignId,
    perf: perfOf(p, baseline),
    performance: p.performance ?? [],
    // Kallaway workflow: how many of the 8 per-piece steps are marked done.
    kwSteps: Math.min(8, new Set(p.kw?.steps ?? []).size),
    createdAt: p.createdAt,
  };
}
export type LitePiece = ReturnType<typeof lite>;

// ─────────────────────────────────────────────────────────────────────────
// Pillars
// ─────────────────────────────────────────────────────────────────────────

export const listPillars = query({
  args: { today: v.optional(v.string()) },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const [pillars, pieces, areas] = await Promise.all([
      ctx.db.query("contentPillars").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      loadAll(ctx, userId),
      ctx.db.query("learningAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    const since = today ? addDays(today, -30) : null;
    return pillars
      .sort((a, b) => a.order - b.order)
      .map((pl) => {
        const mine = pieces.filter((p) => p.pillarId === pl._id);
        const activityDay = (p: Piece) =>
          [ymdUtc(p.createdAt), p.scheduledFor, pubDay(p)].filter((x): x is string => !!x).sort().at(-1) ?? "";
        const last30 = since ? mine.filter((p) => activityDay(p) >= since).length : mine.length;
        return {
          ...pl,
          learningAreaName: areas.find((a) => a._id === pl.learningAreaId)?.name,
          total: mine.length,
          ideas: mine.filter((p) => p.stage === "idea" || p.stage === "seed").length,
          inProgress: mine.filter((p) => PRE_PUBLISH.has(p.stage) && p.stage !== "idea" && p.stage !== "seed").length,
          live: mine.filter((p) => !!p.publishedAt).length,
          last30,
          // Quiet for 30 days (a brand-new pillar isn't "quiet", just empty).
          stale: since ? last30 === 0 && ymdUtc(pl._creationTime) < since : false,
          empty: mine.length === 0,
        };
      });
  },
});

export const createPillar = mutation({
  args: {
    name: v.string(),
    brand: brandV,
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    learningAreaId: v.optional(v.id("learningAreas")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const name = args.name.trim();
    if (!name) throw new ConvexError("Give the pillar a name.");
    if (args.learningAreaId) {
      const la = await ctx.db.get(args.learningAreaId);
      if (!la || la.userId !== userId) throw new ConvexError("Learning area not found.");
    }
    const existing = await ctx.db.query("contentPillars").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return ctx.db.insert("contentPillars", {
      userId,
      name,
      brand: args.brand,
      description: args.description?.trim() || undefined,
      color: args.color,
      learningAreaId: args.learningAreaId,
      order: existing.reduce((m, p) => Math.max(m, p.order), 0) + 1,
    });
  },
});

export const updatePillar = mutation({
  args: {
    id: v.id("contentPillars"),
    name: v.optional(v.string()),
    brand: v.optional(brandV),
    description: v.optional(v.string()),
    color: v.optional(v.union(v.string(), v.null())),
    learningAreaId: v.optional(v.union(v.id("learningAreas"), v.null())),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const pl = await ctx.db.get(id);
    if (!pl || pl.userId !== userId) throw new ConvexError("Pillar not found.");
    const patch: Partial<Doc<"contentPillars">> = {};
    if (rest.name !== undefined) {
      if (!rest.name.trim()) throw new ConvexError("Give the pillar a name.");
      patch.name = rest.name.trim();
    }
    if (rest.brand !== undefined) patch.brand = rest.brand;
    if (rest.description !== undefined) patch.description = rest.description.trim() || undefined;
    if (rest.color !== undefined) patch.color = rest.color ?? undefined;
    if (rest.order !== undefined) patch.order = rest.order;
    if (rest.learningAreaId !== undefined) {
      if (rest.learningAreaId) {
        const la = await ctx.db.get(rest.learningAreaId);
        if (!la || la.userId !== userId) throw new ConvexError("Learning area not found.");
      }
      patch.learningAreaId = rest.learningAreaId ?? undefined;
    }
    await ctx.db.patch(id, patch);
  },
});

export const removePillar = mutation({
  args: { id: v.id("contentPillars") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const pl = await ctx.db.get(id);
    if (!pl || pl.userId !== userId) throw new ConvexError("Pillar not found.");
    const pieces = await loadAll(ctx, userId);
    for (const p of pieces) if (p.pillarId === id) await ctx.db.patch(p._id, { pillarId: undefined });
    const swipes = await ctx.db.query("swipes").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const s of swipes) if (s.pillarId === id) await ctx.db.patch(s._id, { pillarId: undefined });
    const areas = await ctx.db.query("learningAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const a of areas) if (a.pillarId === id) await ctx.db.patch(a._id, { pillarId: undefined });
    await ctx.db.delete(id);
  },
});

/** Read-only pickers for the pillar + piece forms. */
export const learningAreaOptions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const areas = await ctx.db.query("learningAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return areas.map((a) => ({ _id: a._id, name: a.name, status: a.status, pillarId: a.pillarId }));
  },
});

export const campaignOptions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const cs = await ctx.db.query("campaigns").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return cs
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((c) => ({ _id: c._id, name: c.name, status: c.status, brand: c.brand }));
  },
});

export const noteOptions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const notes = await ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").take(400);
    return notes.map((n) => ({ _id: n._id, title: n.title || "Untitled note" }));
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Pieces — queries
// ─────────────────────────────────────────────────────────────────────────

/** Every piece (lite) with its performance vs your median. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const pieces = await loadAll(ctx, userId);
    const baseline = buildBaseline(pieces);
    const kids = childCounts(pieces);
    return pieces.sort((a, b) => b.createdAt - a.createdAt).map((p) => lite(p, baseline, kids));
  },
});

/** One piece, fully loaded, with its repurpose tree and links. */
export const get = query({
  // A plain string (from the URL): a malformed or foreign-table id must
  // return null ("not found"), not throw a validator error into the page.
  args: { id: v.string() },
  handler: async (ctx, { id: raw }) => {
    const userId = await requireUser(ctx);
    const id = ctx.db.normalizeId("contentPieces", raw);
    if (!id) return null;
    const p = await ctx.db.get(id);
    if (!p || p.userId !== userId) return null;
    const pieces = await loadAll(ctx, userId);
    const baseline = buildBaseline(pieces);
    const kids = childCounts(pieces);
    const parent = p.parentId ? pieces.find((x) => x._id === p.parentId) : undefined;
    const children = pieces.filter((x) => x.parentId === p._id).sort((a, b) => a.createdAt - b.createdAt);
    const siblings = parent ? pieces.filter((x) => x.parentId === parent._id && x._id !== p._id) : [];
    const swipes = [];
    for (const sid of p.swipeIds ?? []) {
      const s = await ctx.db.get(sid);
      if (s && s.userId === userId) swipes.push(s);
    }
    const note = p.sourceNoteId ? await ctx.db.get(p.sourceNoteId) : null;
    const pillar = p.pillarId ? await ctx.db.get(p.pillarId) : null;
    const campaign = p.campaignId ? await ctx.db.get(p.campaignId) : null;
    const learningArea = p.learningAreaId ? await ctx.db.get(p.learningAreaId) : null;
    return {
      ...p,
      publishedOn: pubDay(p),
      perf: perfOf(p, baseline),
      checklistKeys: checklistKeysFor(p.format),
      missing: missingChecklist(p, children.length),
      next: nextStage(p.stage, p.format, p.isHub ?? false),
      pillar: pillar && pillar.userId === userId ? pillar : null,
      parent: parent ? lite(parent, baseline, kids) : null,
      children: children.map((c) => lite(c, baseline, kids)),
      siblings: siblings.map((c) => lite(c, baseline, kids)),
      swipes,
      sourceNote: note && note.userId === userId ? { _id: note._id, title: note.title || "Untitled note" } : null,
      campaign: campaign && campaign.userId === userId ? { _id: campaign._id, name: campaign.name } : null,
      learningArea: learningArea && learningArea.userId === userId ? { _id: learningArea._id, name: learningArea.name } : null,
    };
  },
});

/**
 * For the Today page: pieces scheduled for `date`, overdue ones (scheduled
 * before today and not published), plus a few small counters.
 */
export const today = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    const pieces = await loadAll(ctx, userId);
    const settings = await getSettings(ctx, userId);
    const baseline = buildBaseline(pieces);
    const kids = childCounts(pieces);
    const open = pieces.filter((p) => !p.publishedAt && p.stage !== "archived");
    const week = mondayOf(date);
    const pubThisWeek = pieces.filter((p) => {
      const d = pubDay(p);
      return d && d >= week && d <= addDays(week, 6);
    });
    return {
      scheduled: open.filter((p) => p.scheduledFor === date).map((p) => lite(p, baseline, kids)),
      overdue: open
        .filter((p) => p.scheduledFor && p.scheduledFor < date)
        .sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""))
        .map((p) => lite(p, baseline, kids)),
      ideaCount: pieces.filter((p) => p.stage === "idea" || p.stage === "seed").length,
      recycleDue: pieces.filter((p) => isRecycleDue(p, date)).length,
      needsNumbers: needsNumbers(pieces, date).length,
      week: {
        published: pubThisWeek.length,
        hubs: pubThisWeek.filter((p) => p.isHub).length,
        target: settings.contentWeeklyTarget,
      },
      lab: await labToday(ctx, userId, pieces, date),
    };
  },
});

// Kallaway 60-day short-form lab (3, 5, then 7 a week for 6 weeks ≈ 50 reps).
// Same counting rule as contentSystem.progress: published shorts/stories by publishedOn.
const LAB_RAMP = [3, 5, 7, 7, 7, 7, 7, 7];
const LAB_SHORTS = new Set(["short_video", "story"]);

/** This week's lab reps, summed over the brands whose lab is running (null when none is). */
async function labToday(ctx: QueryCtx, userId: Id<"users">, pieces: Piece[], date: string) {
  const rows = await ctx.db
    .query("contentStrategy")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  let done = 0;
  let target = 0;
  let total = 0;
  let week = 0;
  const brands: ("personal" | "company")[] = [];
  for (const st of rows) {
    if (!st.labStartDate) continue;
    const w = Math.floor(diffDays(st.labStartDate, date) / 7) + 1;
    if (w < 1 || w > LAB_RAMP.length) continue; // not started yet, or finished
    const start = st.labStartDate;
    const end = addDays(start, LAB_RAMP.length * 7 - 1);
    const wkStart = addDays(start, (w - 1) * 7);
    const wkEnd = addDays(wkStart, 6);
    const shorts = pieces.filter((p) => p.brand === st.brand && LAB_SHORTS.has(p.format) && !!p.publishedOn);
    done += shorts.filter((p) => p.publishedOn! >= wkStart && p.publishedOn! <= wkEnd).length;
    total += shorts.filter((p) => p.publishedOn! >= start && p.publishedOn! <= end).length;
    target += LAB_RAMP[w - 1];
    week = Math.max(week, w);
    brands.push(st.brand);
  }
  if (!brands.length) return null;
  return { week, done, target, total, totalTarget: LAB_RAMP.reduce((a, b) => a + b, 0) * brands.length, brands };
}

/** Calendar: pieces whose day (publishedOn for published, else scheduledFor) is in [from, to]. */
export const calendar = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }) => {
    const userId = await requireUser(ctx);
    const pieces = await loadAll(ctx, userId);
    const baseline = buildBaseline(pieces);
    const kids = childCounts(pieces);
    const items = [];
    for (const p of pieces) {
      const day = p.publishedAt ? pubDay(p) : p.scheduledFor;
      if (!day || day < from || day > to) continue;
      items.push({ ...lite(p, baseline, kids), day });
    }
    const unscheduled = pieces
      .filter(
        (p) =>
          !p.publishedAt &&
          !p.scheduledFor &&
          p.stage !== "archived" &&
          (p.isHub || ["brief", "script", "ready_to_record", "recorded", "editing", "ready_to_publish", "scheduled"].includes(p.stage)),
      )
      .sort((a, b) => STAGE_ORDER.indexOf(b.stage) - STAGE_ORDER.indexOf(a.stage))
      .map((p) => lite(p, baseline, kids));
    return { items, unscheduled };
  },
});

function isRecycleDue(p: Piece, today: string) {
  if (p.stage === "recycle_due") return true;
  return !!p.publishedAt && !!p.recycleAt && p.recycleAt <= today && p.stage !== "archived";
}

/** Published pieces whose 24h / 7d / 30d snapshot is due but missing. */
function needsNumbers(pieces: Piece[], today: string) {
  const out: { piece: Piece; window: Window }[] = [];
  for (const p of pieces) {
    const d = pubDay(p);
    if (!d || p.stage === "archived") continue;
    const age = diffDays(d, today);
    const has = (w: Window) => !!p.performance?.some((s) => s.window === w);
    // Only ask for the most mature missing window that's due (one ask per piece).
    if (age >= 30 && !has("30d") && age <= 75) out.push({ piece: p, window: "30d" });
    else if (age >= 7 && age < 30 && !has("7d")) out.push({ piece: p, window: "7d" });
    else if (age >= 1 && age < 7 && !has("24h")) out.push({ piece: p, window: "24h" });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Analytics + weekly content review
// ─────────────────────────────────────────────────────────────────────────

export const analytics = query({
  args: { today: v.string(), brand: v.optional(brandV) },
  handler: async (ctx, { today, brand }) => {
    const userId = await requireUser(ctx);
    const all = await loadAll(ctx, userId);
    const settings = await getSettings(ctx, userId);
    const hooks = await ctx.db.query("hooks").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    // The baseline always uses ALL your pieces; the views below filter by brand.
    const baseline = buildBaseline(all);
    const kids = childCounts(all);
    const pieces = brand ? all.filter((p) => p.brand === brand) : all;
    const published = pieces.filter((p) => !!p.publishedAt);
    const L = (p: Piece) => lite(p, baseline, kids);

    const month = monthKey(today);
    const thisMonth = published.filter((p) => pubDay(p)?.startsWith(month));
    const since30 = addDays(today, -30);
    const last30 = published.filter((p) => (pubDay(p) ?? "") >= since30);

    const ranked = (list: Piece[]) =>
      list
        .map((p) => ({ piece: L(p), ratio: perfOf(p, baseline)?.ratio ?? null }))
        .filter((x): x is { piece: LitePiece; ratio: number } => x.ratio != null)
        .sort((a, b) => b.ratio - a.ratio);
    const topBottom = (list: Piece[]) => {
      const r = ranked(list);
      const top = r.slice(0, 3);
      const topIds = new Set(top.map((x) => x.piece._id));
      const bottom = r
        .slice(-3)
        .reverse()
        .filter((x) => !topIds.has(x.piece._id));
      return { top: top.map((x) => x.piece), bottom: bottom.map((x) => x.piece) };
    };

    // Cadence: published per local week for 12 weeks, split by brand.
    const thisWeek = mondayOf(today);
    const cadence = Array.from({ length: 12 }, (_, i) => {
      const ws = addDays(thisWeek, -7 * (11 - i));
      const we = addDays(ws, 6);
      const inWeek = published.filter((p) => {
        const d = pubDay(p);
        return !!d && d >= ws && d <= we;
      });
      return {
        weekStart: ws,
        personal: inWeek.filter((p) => p.brand === "personal").length,
        company: inWeek.filter((p) => p.brand === "company").length,
        hubs: inWeek.filter((p) => p.isHub).length,
        titles: inWeek.map((p) => ({ title: p.title, brand: p.brand, format: p.format })),
      };
    });

    // Publishing streak: consecutive weeks (ending this or last week) with ≥1 publish.
    let streak = 0;
    {
      let ws = cadence[11].personal + cadence[11].company > 0 ? thisWeek : addDays(thisWeek, -7);
      for (let guard = 0; guard < 104; guard++) {
        const we = addDays(ws, 6);
        const any = published.some((p) => {
          const d = pubDay(p);
          return !!d && d >= ws && d <= we;
        });
        if (!any) break;
        streak++;
        ws = addDays(ws, -7);
      }
    }

    // Personal vs company (always both, ignoring the brand filter).
    const brandSplit = (["personal", "company"] as const).map((b) => {
      const pub = all.filter((p) => p.brand === b && p.publishedAt);
      const ratios = pub.map((p) => perfOf(p, baseline)?.ratio).filter((r): r is number => r != null);
      return {
        brand: b,
        published: pub.length,
        thisMonth: pub.filter((p) => pubDay(p)?.startsWith(month)).length,
        inPipeline: all.filter((p) => p.brand === b && !p.publishedAt && p.stage !== "archived" && p.stage !== "idea" && p.stage !== "seed").length,
        ideas: all.filter((p) => p.brand === b && (p.stage === "idea" || p.stage === "seed")).length,
        views: pub.reduce((s, p) => s + (bestSnap(p)?.views ?? 0), 0),
        leads: pub.reduce((s, p) => s + (bestSnap(p)?.leads ?? 0), 0),
        medianRatio: median(ratios),
      };
    });

    // Best hook types by median ratio.
    const byType = new Map<string, number[]>();
    for (const p of published) {
      const r = perfOf(p, baseline)?.ratio;
      if (r == null) continue;
      const t = p.hookType || "untyped";
      byType.set(t, [...(byType.get(t) ?? []), r]);
    }
    const hookTypes = [...byType.entries()]
      .map(([hookType, rs]) => ({ hookType, count: rs.length, medianRatio: median(rs) ?? 0 }))
      .sort((a, b) => b.medianRatio - a.medianRatio);

    // Outlier hooks worth promoting to the library.
    const libraryTexts = new Set(hooks.map((h) => h.text.trim().toLowerCase()));
    const outlierHooks = published
      .map((p) => ({ p, r: perfOf(p, baseline)?.ratio ?? null }))
      .filter((x) => x.r != null && x.r >= 1.2 && x.p.hook?.trim())
      .sort((a, b) => (b.r ?? 0) - (a.r ?? 0))
      .slice(0, 8)
      .map((x) => ({
        pieceId: x.p._id,
        title: x.p.title,
        hook: x.p.hook!,
        hookType: x.p.hookType,
        format: x.p.format,
        ratio: x.r!,
        inLibrary: libraryTexts.has(x.p.hook!.trim().toLowerCase()),
      }));

    const allMedian = median(published.map((p) => bestSnap(p)?.views).filter((x): x is number => x != null));
    const wkPub = published.filter((p) => (pubDay(p) ?? "") >= thisWeek);

    return {
      totals: {
        published: published.length,
        thisMonth: thisMonth.length,
        viewsThisMonth: thisMonth.reduce((s, p) => s + (bestSnap(p)?.views ?? 0), 0),
        leadsThisMonth: thisMonth.reduce((s, p) => s + (bestSnap(p)?.leads ?? 0), 0),
        savesThisMonth: thisMonth.reduce((s, p) => s + (bestSnap(p)?.saves ?? 0), 0),
        ideas: pieces.filter((p) => p.stage === "idea" || p.stage === "seed").length,
        inPipeline: pieces.filter((p) => !p.publishedAt && p.stage !== "archived" && p.stage !== "idea" && p.stage !== "seed").length,
        medianViews: allMedian,
        streakWeeks: streak,
      },
      week: { published: wkPub.length, hubs: wkPub.filter((p) => p.isHub).length, target: settings.contentWeeklyTarget },
      month: topBottom(thisMonth),
      review: { ...topBottom(last30), publishedLast30: last30.length },
      cadence,
      brandSplit,
      hookTypes,
      outlierHooks,
      recycleDue: pieces.filter((p) => isRecycleDue(p, today)).map(L),
      needsNumbers: needsNumbers(pieces, today).map((x) => ({ piece: L(x.piece), window: x.window })),
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Pieces — mutations
// ─────────────────────────────────────────────────────────────────────────

async function checkLinks(
  ctx: MutationCtx,
  userId: Id<"users">,
  a: {
    pillarId?: Id<"contentPillars"> | null;
    parentId?: Id<"contentPieces"> | null;
    sourceNoteId?: Id<"notes"> | null;
    campaignId?: Id<"campaigns"> | null;
    learningAreaId?: Id<"learningAreas"> | null;
    swipeIds?: Id<"swipes">[];
  },
) {
  const own = async (id: Id<"contentPillars"> | Id<"contentPieces"> | Id<"notes"> | Id<"campaigns"> | Id<"learningAreas"> | Id<"swipes">, what: string) => {
    const d = await ctx.db.get(id);
    if (!d || (d as { userId?: Id<"users"> }).userId !== userId) throw new ConvexError(`${what} not found.`);
  };
  if (a.pillarId) await own(a.pillarId, "Pillar");
  if (a.parentId) await own(a.parentId, "Parent piece");
  if (a.sourceNoteId) await own(a.sourceNoteId, "Note");
  if (a.campaignId) await own(a.campaignId, "Campaign");
  if (a.learningAreaId) await own(a.learningAreaId, "Learning area");
  for (const s of a.swipeIds ?? []) await own(s, "Swipe");
}

const createArgs = {
  title: v.string(),
  brand: brandV,
  format: v.optional(v.string()),
  stage: v.optional(stageV),
  pillarId: v.optional(v.id("contentPillars")),
  platforms: v.optional(v.array(v.string())),
  isHub: v.optional(v.boolean()),
  parentId: v.optional(v.id("contentPieces")),
  hook: v.optional(v.string()),
  hookType: v.optional(v.string()),
  brief: v.optional(v.string()),
  script: v.optional(v.string()),
  cta: v.optional(v.string()),
  scheduledFor: v.optional(v.string()),
  sourceNoteId: v.optional(v.id("notes")),
  learningAreaId: v.optional(v.id("learningAreas")),
  campaignId: v.optional(v.id("campaigns")),
  swipeIds: v.optional(v.array(v.id("swipes"))),
};

export const create = mutation({
  args: createArgs,
  handler: async (ctx, a) => {
    const userId = await requireUser(ctx);
    const title = a.title.trim();
    if (!title) throw new ConvexError("Give the piece a working title.");
    await checkLinks(ctx, userId, a);
    const stage = a.stage ?? "idea";
    if (PUBLISH_STAGES.has(stage)) throw new ConvexError("New pieces start before publishing. Use the publish gate.");
    return ctx.db.insert("contentPieces", {
      userId,
      title,
      brand: a.brand,
      format: a.format || "text_post",
      stage,
      pillarId: a.pillarId,
      platforms: a.platforms,
      isHub: a.isHub || undefined,
      parentId: a.parentId,
      hook: a.hook?.trim() || undefined,
      hookType: a.hookType || undefined,
      brief: a.brief || undefined,
      script: a.script || undefined,
      cta: a.cta || undefined,
      scheduledFor: a.scheduledFor || undefined,
      sourceNoteId: a.sourceNoteId,
      learningAreaId: a.learningAreaId,
      campaignId: a.campaignId,
      swipeIds: a.swipeIds?.length ? a.swipeIds : undefined,
      createdAt: Date.now(),
    });
  },
});

/**
 * Create a content seed (stage "seed") from another module, e.g. a note made
 * public or a sales-call objection. Pillar defaults to the learning area's.
 */
export const createSeed = mutation({
  args: {
    title: v.string(),
    brand: v.optional(brandV),
    format: v.optional(v.string()),
    pillarId: v.optional(v.id("contentPillars")),
    sourceNoteId: v.optional(v.id("notes")),
    learningAreaId: v.optional(v.id("learningAreas")),
    hook: v.optional(v.string()),
    brief: v.optional(v.string()),
    stage: v.optional(v.union(v.literal("idea"), v.literal("seed"))),
  },
  handler: async (ctx, a) => {
    const userId = await requireUser(ctx);
    const title = a.title.trim();
    if (!title) throw new ConvexError("A seed needs a title.");
    await checkLinks(ctx, userId, a);
    let pillarId = a.pillarId;
    if (!pillarId && a.learningAreaId) {
      const la = await ctx.db.get(a.learningAreaId);
      if (la?.pillarId) pillarId = la.pillarId;
    }
    return ctx.db.insert("contentPieces", {
      userId,
      title,
      brand: a.brand ?? "personal",
      format: a.format || "text_post",
      stage: a.stage ?? "seed",
      pillarId,
      sourceNoteId: a.sourceNoteId,
      learningAreaId: a.learningAreaId,
      hook: a.hook?.trim() || undefined,
      brief: a.brief || undefined,
      createdAt: Date.now(),
    });
  },
});

/** Idea bank: one idea per line → pieces in stage "idea". */
export const captureIdeas = mutation({
  args: {
    lines: v.array(v.string()),
    brand: brandV,
    pillarId: v.optional(v.id("contentPillars")),
    format: v.optional(v.string()),
  },
  handler: async (ctx, { lines, brand, pillarId, format }) => {
    const userId = await requireUser(ctx);
    await checkLinks(ctx, userId, { pillarId });
    const clean = lines
      .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
      .filter((l) => l.length > 0)
      .slice(0, 200);
    const now = Date.now();
    let i = 0;
    for (const title of clean) {
      await ctx.db.insert("contentPieces", {
        userId,
        title: title.slice(0, 300),
        brand,
        format: format || "text_post",
        stage: "idea",
        pillarId,
        createdAt: now + i++,
      });
    }
    return clean.length;
  },
});

export const update = mutation({
  args: {
    id: v.id("contentPieces"),
    title: v.optional(v.string()),
    brand: v.optional(brandV),
    pillarId: v.optional(v.union(v.id("contentPillars"), v.null())),
    platforms: v.optional(v.array(v.string())),
    format: v.optional(v.string()),
    isHub: v.optional(v.boolean()),
    hook: v.optional(v.string()),
    hookType: v.optional(v.union(v.string(), v.null())),
    brief: v.optional(v.string()),
    script: v.optional(v.string()),
    cta: v.optional(v.string()),
    scheduledFor: v.optional(v.union(v.string(), v.null())),
    url: v.optional(v.string()),
    lesson: v.optional(v.string()),
    sourceNoteId: v.optional(v.union(v.id("notes"), v.null())),
    campaignId: v.optional(v.union(v.id("campaigns"), v.null())),
    learningAreaId: v.optional(v.union(v.id("learningAreas"), v.null())),
    swipeIds: v.optional(v.array(v.id("swipes"))),
    recycleAt: v.optional(v.union(v.string(), v.null())),
    publishedOn: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...a }) => {
    const userId = await requireUser(ctx);
    const p = await ownPiece(ctx, userId, id);
    await checkLinks(ctx, userId, a);
    const patch: Partial<Piece> = {};
    if (a.title !== undefined) {
      if (!a.title.trim()) throw new ConvexError("The title can't be empty.");
      patch.title = a.title.trim();
    }
    if (a.brand !== undefined) patch.brand = a.brand;
    if (a.pillarId !== undefined) patch.pillarId = a.pillarId ?? undefined;
    if (a.platforms !== undefined) patch.platforms = a.platforms;
    if (a.format !== undefined && a.format) {
      patch.format = a.format;
      // A text piece can't sit in a recording stage.
      if (TEXT_FORMATS.has(a.format) && RECORDING_STAGES.has(p.stage)) patch.stage = "ready_to_publish";
    }
    if (a.isHub !== undefined) patch.isHub = a.isHub || undefined;
    if (a.hook !== undefined) patch.hook = a.hook;
    if (a.hookType !== undefined) patch.hookType = a.hookType ?? undefined;
    if (a.brief !== undefined) patch.brief = a.brief;
    if (a.script !== undefined) patch.script = a.script;
    if (a.cta !== undefined) patch.cta = a.cta;
    if (a.scheduledFor !== undefined) patch.scheduledFor = a.scheduledFor || undefined;
    if (a.url !== undefined) patch.url = a.url.trim() || undefined;
    if (a.lesson !== undefined) patch.lesson = a.lesson;
    if (a.sourceNoteId !== undefined) patch.sourceNoteId = a.sourceNoteId ?? undefined;
    if (a.campaignId !== undefined) patch.campaignId = a.campaignId ?? undefined;
    if (a.learningAreaId !== undefined) patch.learningAreaId = a.learningAreaId ?? undefined;
    if (a.swipeIds !== undefined) patch.swipeIds = a.swipeIds.length ? a.swipeIds : undefined;
    if (a.recycleAt !== undefined) patch.recycleAt = a.recycleAt ?? undefined;
    if (a.publishedOn !== undefined && p.publishedAt) patch.publishedOn = a.publishedOn;
    await ctx.db.patch(id, patch);
  },
});

export const toggleChecklist = mutation({
  args: { id: v.id("contentPieces"), key: v.string(), done: v.optional(v.boolean()) },
  handler: async (ctx, { id, key, done }) => {
    const userId = await requireUser(ctx);
    const p = await ownPiece(ctx, userId, id);
    const set = new Set(p.checklist ?? []);
    const on = done ?? !set.has(key);
    if (on) set.add(key);
    else set.delete(key);
    await ctx.db.patch(id, { checklist: [...set] });
  },
});

/** Shared stage move with the publish gate, XP and recycle date. */
async function applyStage(ctx: MutationCtx, userId: Id<"users">, p: Piece, to: Stage, date: string, force: boolean) {
  const patch: Partial<Piece> = { stage: to };
  let published = false;
  let awarded = false;
  if (PUBLISH_STAGES.has(to) && !p.publishedAt) {
    const kids = await ctx.db
      .query("contentPieces")
      .withIndex("by_parent", (q) => q.eq("parentId", p._id))
      .collect();
    const missing = missingChecklist(p, kids.length);
    if (missing.length && !force) {
      throw new ConvexError(`The publish checklist has ${missing.length} open item${missing.length === 1 ? "" : "s"}. Tick them or choose "Publish anyway".`);
    }
    patch.publishedAt = Date.now();
    patch.publishedOn = date;
    patch.recycleAt = addMonths(date, 6);
    awarded = await awardXp(ctx, userId, `content-pub-${p._id}`, XP.contentPublished, `Published: ${p.title}`, date);
    published = true;
  } else if (PRE_PUBLISH.has(to) && p.publishedAt) {
    // Moved back before publishing → undo the publish.
    patch.publishedAt = undefined;
    patch.publishedOn = undefined;
    patch.recycleAt = undefined;
    await revokeXp(ctx, userId, `content-pub-${p._id}`);
  }
  await ctx.db.patch(p._id, patch);
  return { stage: to, published, awarded, xp: awarded ? XP.contentPublished : 0 };
}

export const setStage = mutation({
  args: { id: v.id("contentPieces"), stage: stageV, date: v.string(), force: v.optional(v.boolean()) },
  handler: async (ctx, { id, stage, date, force }) => {
    const userId = await requireUser(ctx);
    const p = await ownPiece(ctx, userId, id);
    if (p.stage === stage) return { stage, published: false, awarded: false, xp: 0 };
    return applyStage(ctx, userId, p, stage, date, force ?? false);
  },
});

/** Move to the next applicable stage (text formats skip recording). */
export const advance = mutation({
  args: { id: v.id("contentPieces"), date: v.string(), force: v.optional(v.boolean()) },
  handler: async (ctx, { id, date, force }) => {
    const userId = await requireUser(ctx);
    const p = await ownPiece(ctx, userId, id);
    const to = nextStage(p.stage, p.format, p.isHub ?? false);
    if (!to) throw new ConvexError("This piece is at the end of the pipeline.");
    return applyStage(ctx, userId, p, to, date, force ?? false);
  },
});

export const remove = mutation({
  args: { id: v.id("contentPieces") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await ownPiece(ctx, userId, id);
    const kids = await ctx.db
      .query("contentPieces")
      .withIndex("by_parent", (q) => q.eq("parentId", id))
      .collect();
    for (const k of kids) if (k.userId === userId) await ctx.db.patch(k._id, { parentId: undefined });
    const tasks = await ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const t of tasks) if (t.contentId === id) await ctx.db.patch(t._id, { contentId: undefined });
    // publish → delete → recreate must not farm XP
    await revokeXp(ctx, userId, `content-pub-${id}`);
    await ctx.db.delete(id);
  },
});

/** Save one performance snapshot (24h / 7d / 30d), replacing that window. */
export const logPerformance = mutation({
  args: {
    id: v.id("contentPieces"),
    window: windowV,
    views: v.optional(v.number()),
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    shares: v.optional(v.number()),
    saves: v.optional(v.number()),
    follows: v.optional(v.number()),
    leads: v.optional(v.number()),
    hold3s: v.optional(v.number()), // % still watching at 3s
    avdSec: v.optional(v.number()),
    ctr: v.optional(v.number()),
  },
  handler: async (ctx, { id, window, ...nums }) => {
    const userId = await requireUser(ctx);
    const p = await ownPiece(ctx, userId, id);
    for (const [k, n] of Object.entries(nums)) {
      if (n !== undefined && (!Number.isFinite(n) || n < 0)) throw new ConvexError(`${k} must be a positive number.`);
    }
    const snap: Snapshot = { window, at: Date.now() };
    for (const [k, n] of Object.entries(nums))
      if (n !== undefined) (snap as Record<string, unknown>)[k] = k === "ctr" || k === "hold3s" ? Math.round(n * 10) / 10 : Math.round(n);
    const rest = (p.performance ?? []).filter((s) => s.window !== window);
    const order: Record<Window, number> = { "24h": 0, "7d": 1, "30d": 2 };
    await ctx.db.patch(id, { performance: [...rest, snap].sort((a, b) => order[a.window] - order[b.window]) });
  },
});

export const clearPerformance = mutation({
  args: { id: v.id("contentPieces"), window: windowV },
  handler: async (ctx, { id, window }) => {
    const userId = await requireUser(ctx);
    const p = await ownPiece(ctx, userId, id);
    await ctx.db.patch(id, { performance: (p.performance ?? []).filter((s) => s.window !== window) });
  },
});

/**
 * Repurpose a hub: create child drafts (same pillar/brand) titled
 * "<format> · <parent title>". Marks the repurpose checklist item and moves a
 * published hub into "repurposing".
 */
export const repurpose = mutation({
  args: {
    id: v.id("contentPieces"),
    stage: v.union(v.literal("idea"), v.literal("brief")),
    children: v.array(v.object({ format: v.string(), count: v.number(), platforms: v.optional(v.array(v.string())) })),
  },
  handler: async (ctx, { id, stage, children }) => {
    const userId = await requireUser(ctx);
    const p = await ownPiece(ctx, userId, id);
    const plan = children.filter((c) => c.count > 0 && c.format);
    const total = plan.reduce((s, c) => s + Math.min(20, Math.floor(c.count)), 0);
    if (!total) throw new ConvexError("Pick at least one child piece.");
    if (total > 40) throw new ConvexError("That's a lot. Keep it to 40 children or fewer.");
    const now = Date.now();
    const ids: Id<"contentPieces">[] = [];
    let i = 0;
    for (const c of plan) {
      const n = Math.min(20, Math.floor(c.count));
      for (let k = 1; k <= n; k++) {
        const label = n > 1 ? `${formatLabel(c.format)} ${k}` : formatLabel(c.format);
        ids.push(
          await ctx.db.insert("contentPieces", {
            userId,
            title: `${label} · ${p.title}`.slice(0, 300),
            brand: p.brand,
            pillarId: p.pillarId,
            format: c.format,
            platforms: c.platforms?.length ? c.platforms : undefined,
            stage,
            parentId: p._id,
            hookType: p.hookType,
            brief: stage === "brief" ? `Cut from the hub "${p.title}".${p.hook ? `\nHub hook: ${p.hook}` : ""}` : undefined,
            campaignId: p.campaignId,
            learningAreaId: p.learningAreaId,
            createdAt: now + i++,
          }),
        );
      }
    }
    const set = new Set(p.checklist ?? []);
    set.add("repurpose");
    await ctx.db.patch(p._id, {
      checklist: [...set],
      isHub: true,
      ...(p.stage === "published" ? { stage: "repurposing" as const } : {}),
    });
    return ids;
  },
});

/** Recycle a winner: a fresh copy to refresh + republish, and the next recycle in 6 months. */
export const recycle = mutation({
  args: { id: v.id("contentPieces"), date: v.string() },
  handler: async (ctx, { id, date }) => {
    const userId = await requireUser(ctx);
    const p = await ownPiece(ctx, userId, id);
    const copy = await ctx.db.insert("contentPieces", {
      userId,
      title: `Recycle · ${p.title.replace(/^Recycle · /, "")}`.slice(0, 300),
      brand: p.brand,
      pillarId: p.pillarId,
      platforms: p.platforms,
      format: p.format,
      stage: p.script ? "script" : "brief",
      parentId: p._id,
      hook: p.hook,
      hookType: p.hookType,
      brief: [`Republish of a winner (first out ${pubDay(p) ?? "earlier"}). Refresh the hook, keep the core.`, p.lesson ? `Lesson: ${p.lesson}` : ""]
        .filter(Boolean)
        .join("\n"),
      script: p.script,
      cta: p.cta,
      campaignId: p.campaignId,
      createdAt: Date.now(),
    });
    await ctx.db.patch(p._id, {
      recycleAt: addMonths(date, 6),
      ...(p.stage === "recycle_due" ? { stage: "measured" as const } : {}),
    });
    return copy;
  },
});

export const snoozeRecycle = mutation({
  args: { id: v.id("contentPieces"), date: v.string(), months: v.optional(v.number()) },
  handler: async (ctx, { id, date, months }) => {
    const userId = await requireUser(ctx);
    const p = await ownPiece(ctx, userId, id);
    await ctx.db.patch(id, {
      recycleAt: addMonths(date, Math.max(1, Math.min(24, months ?? 6))),
      ...(p.stage === "recycle_due" ? { stage: "measured" as const } : {}),
    });
  },
});

/** Link an existing swipe to a piece (counts as a use). */
export const linkSwipe = mutation({
  args: { id: v.id("contentPieces"), swipeId: v.id("swipes") },
  handler: async (ctx, { id, swipeId }) => {
    const userId = await requireUser(ctx);
    const p = await ownPiece(ctx, userId, id);
    const s = await ctx.db.get(swipeId);
    if (!s || s.userId !== userId) throw new ConvexError("Swipe not found.");
    const ids = p.swipeIds ?? [];
    if (ids.includes(swipeId)) return;
    await ctx.db.patch(id, { swipeIds: [...ids, swipeId] });
    await ctx.db.patch(swipeId, { used: (s.used ?? 0) + 1 });
  },
});

export const unlinkSwipe = mutation({
  args: { id: v.id("contentPieces"), swipeId: v.id("swipes") },
  handler: async (ctx, { id, swipeId }) => {
    const userId = await requireUser(ctx);
    const p = await ownPiece(ctx, userId, id);
    const ids = (p.swipeIds ?? []).filter((x) => x !== swipeId);
    await ctx.db.patch(id, { swipeIds: ids.length ? ids : undefined });
  },
});
