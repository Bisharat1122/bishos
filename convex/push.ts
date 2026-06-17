import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { requireUser } from "./helpers";

/** The VAPID public key the client needs to subscribe. Null if push isn't
 * configured on this deployment. */
export const publicKey = query({
  args: {},
  handler: async () => process.env.VAPID_PUBLIC_KEY ?? null,
});

/** Does the current user have any push subscription? (for UI status) */
export const myStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const subs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return { devices: subs.length };
  },
});

/** Store (or refresh) this browser's push subscription. Upsert by endpoint so
 * re-subscribing never creates duplicates. */
export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .collect();
    for (const e of existing) await ctx.db.delete(e._id);
    await ctx.db.insert("pushSubscriptions", { userId, ...args, createdAt: Date.now() });
  },
});

export const unsubscribe = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    await requireUser(ctx);
    const rows = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .collect();
    for (const r of rows) await ctx.db.delete(r._id);
  },
});

// ---- internal: used by the send cron action ----

type Event = { userId: string; key: string; title: string; body: string; href: string };

/** Task start/end events whose time crossed (lastScanAt, now], not done and
 * not already sent. Seeds the cursor to now on the very first run so past
 * tasks never fire retroactively. */
export const dueEvents = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const state = await ctx.db.query("pushState").first();
    if (!state) {
      // First ever run — establish the cursor, emit nothing.
      return { events: [] as Event[], scanNow: now, seed: true };
    }
    const since = state.lastScanAt;

    const tasks = await ctx.db.query("tasks").collect();
    const fresh: Event[] = [];
    const consider = (key: string, time: number, title: string, body: string, userId: string) => {
      if (time > since && time <= now) fresh.push({ userId, key, title, body, href: "/tasks" });
    };
    for (const t of tasks) {
      if (t.status === "done") continue;
      if (t.startAt != null) {
        consider(`task-start-${t._id}-${t.startAt}`, t.startAt, t.title, "Starting now", t.userId);
      }
      if (t.dueDate != null) {
        consider(`task-end-${t._id}-${t.dueDate}`, t.dueDate, t.title, "Due now", t.userId);
      }
    }

    // Drop any already-sent (dedup).
    const events: Event[] = [];
    for (const e of fresh) {
      const sent = await ctx.db
        .query("sentPushes")
        .withIndex("by_key", (q) => q.eq("key", e.key))
        .first();
      if (!sent) events.push(e);
    }
    return { events, scanNow: now, seed: false };
  },
});

/** Advance the scan cursor (creating the singleton on first run). */
export const commitScan = internalMutation({
  args: { scanNow: v.number() },
  handler: async (ctx, { scanNow }) => {
    const state = await ctx.db.query("pushState").first();
    if (state) await ctx.db.patch(state._id, { lastScanAt: scanNow });
    else await ctx.db.insert("pushState", { lastScanAt: scanNow });
  },
});

export const recordSent = internalMutation({
  args: { userId: v.id("users"), key: v.string() },
  handler: async (ctx, { userId, key }) => {
    const dup = await ctx.db
      .query("sentPushes")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (!dup) await ctx.db.insert("sentPushes", { userId, key, sentAt: Date.now() });
  },
});

/** Subscriptions for a set of users (for the send action). */
export const subsForUsers = internalQuery({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, { userIds }) => {
    const set = new Set(userIds as string[]);
    const out: {
      userId: string;
      endpoint: string;
      p256dh: string;
      auth: string;
    }[] = [];
    for (const uid of set) {
      const subs = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_user", (q) => q.eq("userId", uid as never))
        .collect();
      for (const s of subs) out.push({ userId: s.userId, endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth });
    }
    return out;
  },
});

/** Remove a dead subscription (push endpoint returned 404/410). */
export const pruneSub = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const rows = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .collect();
    for (const r of rows) await ctx.db.delete(r._id);
  },
});
