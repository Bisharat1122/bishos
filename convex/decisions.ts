/**
 * Decision journal (Farnam Street) + Issues list (EOS IDS).
 *
 * Decisions are written BEFORE the outcome is known: context, options, the
 * choice, the expected outcome, confidence 0–100 and your state. A review is
 * scheduled (default +6 weeks). At review you record the outcome, lessons and
 * whether it matched your expectation → calibration (avg confidence vs hit
 * rate, plus a Brier score).
 *
 * Issues: priority 1–3, open → discussing → solved / dropped, with root cause
 * and solution. Solving can create a follow-up task.
 */
import { v, ConvexError } from "convex/values";
import { query, mutation, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, awardXp, revokeXp } from "./os";

export const DECISION_XP = 10;
export const DECISION_REVIEW_XP = 20;
export const ISSUE_SOLVED_XP = 25;
export const REVIEW_DEFAULT_DAYS = 42;

// ─────────────────────────────────────────────────────────────────────────
// Decisions
// ─────────────────────────────────────────────────────────────────────────

async function ownDecision(ctx: QueryCtx | MutationCtx, userId: Id<"users">, id: Id<"decisions">) {
  const d = await ctx.db.get(id);
  if (!d || d.userId !== userId) throw new ConvexError("Decision not found");
  return d;
}

/** A client-supplied life area id must belong to the caller. */
async function assertArea(ctx: QueryCtx | MutationCtx, userId: Id<"users">, id: Id<"lifeAreas"> | null | undefined) {
  if (!id) return;
  const a = await ctx.db.get(id);
  if (!a || a.userId !== userId) throw new ConvexError("Life Area not found");
}

export const isReviewDue = (d: Doc<"decisions">, today: string) =>
  d.status !== "reviewed" && !!d.reviewDate && d.reviewDate <= today;

export function calibration(decisions: Doc<"decisions">[]) {
  const scored = decisions.filter((d) => d.status === "reviewed" && d.matched != null && d.confidence != null);
  const n = scored.length;
  const reviewed = decisions.filter((d) => d.status === "reviewed").length;
  if (!n) return { n, reviewed, avgConfidence: null, hitRate: null, brier: null, gap: null, verdict: null, buckets: [] as Bucket[] };
  const avgConfidence = Math.round(scored.reduce((s, d) => s + (d.confidence as number), 0) / n);
  const hits = scored.filter((d) => d.matched).length;
  const hitRate = Math.round((hits / n) * 100);
  const brier =
    Math.round((scored.reduce((s, d) => s + ((d.confidence as number) / 100 - (d.matched ? 1 : 0)) ** 2, 0) / n) * 1000) / 1000;
  const gap = avgConfidence - hitRate;
  const verdict = n < 3 ? "early" : gap > 10 ? "overconfident" : gap < -10 ? "underconfident" : "calibrated";
  const ranges: [number, number, string][] = [
    [0, 49, "0–49%"],
    [50, 69, "50–69%"],
    [70, 89, "70–89%"],
    [90, 100, "90–100%"],
  ];
  const buckets: Bucket[] = ranges.map(([lo, hi, label]) => {
    const inB = scored.filter((d) => (d.confidence as number) >= lo && (d.confidence as number) <= hi);
    return {
      label,
      n: inB.length,
      avgConfidence: inB.length ? Math.round(inB.reduce((s, d) => s + (d.confidence as number), 0) / inB.length) : null,
      hitRate: inB.length ? Math.round((inB.filter((d) => d.matched).length / inB.length) * 100) : null,
    };
  });
  return { n, reviewed, avgConfidence, hitRate, brier, gap, verdict, buckets };
}
type Bucket = { label: string; n: number; avgConfidence: number | null; hitRate: number | null };

export const list = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db.query("decisions").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const items = rows
      .map((d) => ({ ...d, reviewDue: isReviewDue(d, today) }))
      .sort((a, b) => Number(b.reviewDue) - Number(a.reviewDue) || b.createdAt - a.createdAt);
    return {
      items,
      dueCount: items.filter((d) => d.reviewDue).length,
      calibration: calibration(rows),
    };
  },
});

export const get = query({
  args: { id: v.id("decisions") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const d = await ctx.db.get(id);
    if (!d || d.userId !== userId) return null;
    return d;
  },
});

const clampConf = (n: number | undefined) => (n == null ? undefined : Math.max(0, Math.min(100, Math.round(n))));

export const create = mutation({
  args: {
    title: v.string(),
    context: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    choice: v.optional(v.string()),
    expected: v.optional(v.string()),
    confidence: v.optional(v.number()),
    state: v.optional(v.string()),
    reviewDate: v.optional(v.string()),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    date: v.string(), // client-local today
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const title = args.title.trim();
    if (!title) throw new ConvexError("What are you deciding?");
    await assertArea(ctx, userId, args.lifeAreaId);
    const choice = args.choice?.trim() || undefined;
    const id = await ctx.db.insert("decisions", {
      userId,
      title,
      context: args.context?.trim() || undefined,
      options: (args.options ?? []).map((o) => o.trim()).filter(Boolean),
      choice,
      expected: args.expected?.trim() || undefined,
      confidence: clampConf(args.confidence),
      state: args.state?.trim() || undefined,
      reviewDate: args.reviewDate || addDays(args.date, REVIEW_DEFAULT_DAYS),
      lifeAreaId: args.lifeAreaId,
      status: choice ? "decided" : "open",
      decidedOn: args.date,
      createdAt: Date.now(),
    });
    const gained = await awardXp(ctx, userId, `decision-${id}`, DECISION_XP, `Decision journaled: ${title}`, args.date);
    return { id, xp: gained ? DECISION_XP : 0 };
  },
});

const str = v.optional(v.union(v.string(), v.null()));

export const update = mutation({
  args: {
    id: v.id("decisions"),
    title: v.optional(v.string()),
    context: str,
    options: v.optional(v.array(v.string())),
    choice: str,
    expected: str,
    confidence: v.optional(v.union(v.number(), v.null())),
    state: str,
    reviewDate: str,
    lifeAreaId: v.optional(v.union(v.id("lifeAreas"), v.null())),
    outcome: str,
    lessons: str,
    matched: v.optional(v.union(v.boolean(), v.null())),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    const d = await ownDecision(ctx, userId, id);
    await assertArea(ctx, userId, rest.lifeAreaId);
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      if (k === "title") {
        const t = String(val).trim();
        if (!t) throw new ConvexError("The decision needs a title.");
        patch.title = t;
      } else if (k === "confidence") patch.confidence = val === null ? undefined : clampConf(val as number);
      else if (k === "options") patch.options = (val as string[]).map((o) => o.trim()).filter(Boolean);
      else patch[k] = val === null ? undefined : val;
    }
    // choosing an option moves an open decision to "decided"
    if (d.status === "open" && typeof patch.choice === "string" && patch.choice.trim()) patch.status = "decided";
    await ctx.db.patch(id, patch as Partial<Doc<"decisions">>);
  },
});

/** The review: outcome, lessons and "was the expectation right?". */
export const review = mutation({
  args: {
    id: v.id("decisions"),
    outcome: v.string(),
    lessons: v.optional(v.string()),
    matched: v.boolean(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const d = await ownDecision(ctx, userId, args.id);
    if (!args.outcome.trim()) throw new ConvexError("Write what actually happened.");
    await ctx.db.patch(args.id, {
      outcome: args.outcome.trim(),
      lessons: args.lessons?.trim() || undefined,
      matched: args.matched,
      status: "reviewed",
      reviewedAt: Date.now(),
    });
    const gained = await awardXp(ctx, userId, `decision-review-${args.id}`, DECISION_REVIEW_XP, `Decision reviewed: ${d.title}`, args.date);
    return { xp: gained ? DECISION_REVIEW_XP : 0 };
  },
});

/** Undo a review (back to decided) — revokes its XP. */
export const reopen = mutation({
  args: { id: v.id("decisions") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const d = await ownDecision(ctx, userId, id);
    await ctx.db.patch(id, { status: d.choice ? "decided" : "open", reviewedAt: undefined, matched: undefined });
    await revokeXp(ctx, userId, `decision-review-${id}`);
  },
});

/** Push the review date out (e.g. "not enough signal yet"). */
export const snoozeReview = mutation({
  args: { id: v.id("decisions"), days: v.number(), today: v.string() },
  handler: async (ctx, { id, days, today }) => {
    const userId = await requireUser(ctx);
    await ownDecision(ctx, userId, id);
    await ctx.db.patch(id, { reviewDate: addDays(today, Math.max(1, Math.round(days))) });
  },
});

export const remove = mutation({
  args: { id: v.id("decisions") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await ownDecision(ctx, userId, id);
    await revokeXp(ctx, userId, `decision-${id}`);
    await revokeXp(ctx, userId, `decision-review-${id}`);
    await ctx.db.delete(id);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Issues (IDS)
// ─────────────────────────────────────────────────────────────────────────

async function ownIssue(ctx: QueryCtx | MutationCtx, userId: Id<"users">, id: Id<"issues">) {
  const i = await ctx.db.get(id);
  if (!i || i.userId !== userId) throw new ConvexError("Issue not found");
  return i;
}

const ACTIVE = new Set(["open", "discussing"]);

/** Active issues by priority (1 first), oldest first within a priority. */
export function rankIssues(issues: Doc<"issues">[]) {
  return issues
    .filter((i) => ACTIVE.has(i.status))
    .sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt);
}

export const listIssues = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db.query("issues").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const ranked = rankIssues(rows);
    const top3 = ranked.slice(0, 3).map((i) => i._id);
    const closed = rows
      .filter((i) => !ACTIVE.has(i.status))
      .sort((a, b) => (b.solvedAt ?? b.createdAt) - (a.solvedAt ?? a.createdAt));
    return {
      items: [...ranked, ...closed],
      top3,
      openCount: ranked.length,
      solvedCount: rows.filter((i) => i.status === "solved").length,
    };
  },
});

const clampPriority = (p: number | undefined) => Math.max(1, Math.min(3, Math.round(p ?? 2)));

export const createIssue = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(v.number()),
    lifeAreaId: v.optional(v.id("lifeAreas")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const title = args.title.trim();
    if (!title) throw new ConvexError("Name the issue in one line.");
    await assertArea(ctx, userId, args.lifeAreaId);
    return ctx.db.insert("issues", {
      userId,
      title,
      description: args.description?.trim() || undefined,
      priority: clampPriority(args.priority),
      status: "open",
      lifeAreaId: args.lifeAreaId,
      owner: "me",
      createdAt: Date.now(),
    });
  },
});

export const updateIssue = mutation({
  args: {
    id: v.id("issues"),
    title: v.optional(v.string()),
    description: str,
    priority: v.optional(v.number()),
    rootCause: str,
    solution: str,
    lifeAreaId: v.optional(v.union(v.id("lifeAreas"), v.null())),
  },
  handler: async (ctx, { id, ...rest }) => {
    const userId = await requireUser(ctx);
    await ownIssue(ctx, userId, id);
    await assertArea(ctx, userId, rest.lifeAreaId);
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      if (k === "title") {
        const t = String(val).trim();
        if (!t) throw new ConvexError("The issue needs a title.");
        patch.title = t;
      } else if (k === "priority") patch.priority = clampPriority(val as number);
      else patch[k] = val === null ? undefined : val;
    }
    await ctx.db.patch(id, patch as Partial<Doc<"issues">>);
  },
});

/** open / discussing / dropped (use solveIssue to solve). Re-opening a solved issue revokes its XP. */
export const setIssueStatus = mutation({
  args: { id: v.id("issues"), status: v.union(v.literal("open"), v.literal("discussing"), v.literal("dropped")) },
  handler: async (ctx, { id, status }) => {
    const userId = await requireUser(ctx);
    const i = await ownIssue(ctx, userId, id);
    if (i.status === "solved") await revokeXp(ctx, userId, `issue-solved-${id}`);
    await ctx.db.patch(id, { status, solvedAt: status === "dropped" ? Date.now() : undefined });
  },
});

const TASK_PRIORITY = { 1: "high", 2: "med", 3: "low" } as const;

/**
 * Solve: record root cause + solution, mark solved, and optionally create a
 * follow-up task (life area = chosen → the issue's → your first area).
 */
export const solveIssue = mutation({
  args: {
    id: v.id("issues"),
    rootCause: v.optional(v.string()),
    solution: v.optional(v.string()),
    task: v.optional(
      v.object({
        title: v.string(),
        lifeAreaId: v.optional(v.id("lifeAreas")),
        plannedFor: v.optional(v.string()),
      }),
    ),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const issue = await ownIssue(ctx, userId, args.id);
    let taskId: Id<"tasks"> | undefined;
    if (args.task && args.task.title.trim()) {
      let lifeAreaId = args.task.lifeAreaId ?? issue.lifeAreaId;
      if (lifeAreaId) {
        const a = await ctx.db.get(lifeAreaId);
        if (!a || a.userId !== userId) lifeAreaId = undefined;
      }
      if (!lifeAreaId) {
        const areas = await ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
        const first = areas.filter((a) => !a.archived).sort((a, b) => a.order - b.order)[0] ?? areas[0];
        if (!first) throw new ConvexError("Create a Life Area first so the task has a home.");
        lifeAreaId = first._id;
      }
      const solution = (args.solution ?? issue.solution)?.trim();
      taskId = await ctx.db.insert("tasks", {
        userId,
        title: args.task.title.trim(),
        description: [`From issue: ${issue.title}`, solution ? `Solution: ${solution}` : ""].filter(Boolean).join("\n"),
        status: "not_started",
        priority: TASK_PRIORITY[clampPriority(issue.priority) as 1 | 2 | 3],
        lifeAreaId,
        plannedFor: args.task.plannedFor,
        order: Date.now(),
      });
    }
    await ctx.db.patch(args.id, {
      status: "solved",
      solvedAt: Date.now(),
      rootCause: args.rootCause?.trim() || issue.rootCause,
      solution: args.solution?.trim() || issue.solution,
      ...(taskId ? { taskId } : {}),
    });
    const gained = await awardXp(ctx, userId, `issue-solved-${args.id}`, ISSUE_SOLVED_XP, `Issue solved: ${issue.title}`, args.date);
    return { xp: gained ? ISSUE_SOLVED_XP : 0, taskId: taskId ?? null };
  },
});

export const removeIssue = mutation({
  args: { id: v.id("issues") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await ownIssue(ctx, userId, id);
    await revokeXp(ctx, userId, `issue-solved-${id}`);
    await ctx.db.delete(id);
  },
});

