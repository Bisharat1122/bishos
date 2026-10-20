import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { requireUser } from "./helpers";
import { addDays } from "./os";
import { habitStats, habitStatusOf, recordMap } from "./habits";

const DAY = 24 * 60 * 60 * 1000;
const ymd = (ts: number) => new Date(ts).toISOString().slice(0, 10);
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const minToLabel = (m: number) => {
  let h = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h < 12 ? "AM" : "PM";
  h = h % 12 === 0 ? 12 : h % 12;
  return mm ? `${h}:${String(mm).padStart(2, "0")} ${ap}` : `${h} ${ap}`;
};
const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });

type Severity = "urgent" | "info";
type Notif = {
  key: string;
  type: string;
  title: string;
  meta: string;
  date: number;
  href: string;
  severity: Severity;
};

/** Computed notifications: deadlines, at-risk streaks, and reminders.
 * Legacy no-arg form (server UTC day). Prefer `listForDay`. */
export const list = query({
  args: {},
  handler: async (ctx) => computeNotifications(ctx, {}),
});

/** Same as `list`, for the client-LOCAL `today` (YYYY-MM-DD) and `dayStart`
 * (local midnight, ms) so "due today" / habit / ritual nudges match the user's timezone. */
export const listForDay = query({
  args: { today: v.string(), dayStart: v.number() },
  handler: async (ctx, args) => computeNotifications(ctx, args),
});

async function computeNotifications(ctx: QueryCtx, args: { today?: string; dayStart?: number }) {
    const userId = await requireUser(ctx);
    const now = Date.now();
    const today0 = args.dayStart ?? startOfToday();
    const todayEnd = today0 + DAY;
    const todayStr = args.today ?? ymd(now);

    const [tasks, goals, projects, habits, hcompletions, schedule, checkins, dismissed] =
      await Promise.all([
        ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("goals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("scheduleBlocks").withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", todayStr)).collect(),
        ctx.db.query("dailyCheckIns").withIndex("by_date", (q) => q.eq("userId", userId).eq("date", todayStr)).collect(),
        ctx.db.query("dismissedNotifications").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ]);

    const out: Notif[] = [];

    // Tasks with due dates
    for (const t of tasks) {
      if (t.status === "done" || t.dueDate == null) continue;
      if (t.dueDate < today0) {
        const days = Math.floor((today0 - t.dueDate) / DAY) + 1;
        out.push({ key: `task-overdue-${t._id}`, type: "task", title: t.title, meta: `Overdue by ${days}d`, date: t.dueDate, href: `/tasks/${t._id}`, severity: "urgent" });
      } else if (t.dueDate < todayEnd) {
        out.push({ key: `task-today-${t._id}`, type: "task", title: t.title, meta: "Due today", date: t.dueDate, href: `/tasks/${t._id}`, severity: "urgent" });
      } else if (t.dueDate <= now + 3 * DAY) {
        out.push({ key: `task-soon-${t._id}`, type: "task", title: t.title, meta: `Due ${fmtDate(t.dueDate)}`, date: t.dueDate, href: `/tasks/${t._id}`, severity: "info" });
      }
    }

    // Goals with deadlines
    for (const g of goals) {
      if (g.deadline == null || g.progress >= 100) continue;
      if (g.deadline < now) {
        out.push({ key: `goal-late-${g._id}`, type: "goal", title: g.title, meta: `Deadline passed · ${g.progress}%`, date: g.deadline, href: `/goals/${g._id}`, severity: "urgent" });
      } else if (g.deadline <= now + 7 * DAY) {
        out.push({ key: `goal-soon-${g._id}`, type: "goal", title: g.title, meta: `Due ${fmtDate(g.deadline)} · ${g.progress}%`, date: g.deadline, href: `/goals/${g._id}`, severity: "info" });
      }
    }

    // Sprint projects ending
    for (const p of projects) {
      if (p.kind !== "sprint" || p.status === "completed" || p.endDate == null) continue;
      if (p.endDate < now) {
        out.push({ key: `proj-late-${p._id}`, type: "project", title: p.title, meta: `Sprint ended · ${p.progress}%`, date: p.endDate, href: `/projects/${p._id}`, severity: "urgent" });
      } else if (p.endDate <= now + 3 * DAY) {
        const days = Math.ceil((p.endDate - now) / DAY);
        out.push({ key: `proj-soon-${p._id}`, type: "project", title: p.title, meta: `Sprint ends in ${days}d · ${p.progress}%`, date: p.endDate, href: `/projects/${p._id}`, severity: "info" });
      }
    }

    // Habit streaks at risk (active habits, live forgiving streak > 0, nothing
    // logged today) — keyed per-day. The stored `streak` is only refreshed on
    // log, so it goes stale, and queued/graduated/archived habits keep theirs.
    const compsByHabit = new Map<string, typeof hcompletions>();
    for (const c of hcompletions) {
      if (!compsByHabit.has(c.habitId)) compsByHabit.set(c.habitId, []);
      compsByHabit.get(c.habitId)!.push(c);
    }
    for (const h of habits) {
      if (habitStatusOf(h) !== "active") continue;
      const map = recordMap(compsByHabit.get(h._id) ?? []);
      if (map.has(todayStr)) continue;
      const streak = habitStats(h, map, todayStr).streak;
      if (streak > 0) {
        out.push({ key: `habit-${h._id}-${todayStr}`, type: "habit", title: h.title, meta: `🔥 ${streak}-day streak — the minimum version counts`, date: today0, href: `/habits/${h._id}`, severity: "info" });
      }
    }

    // Today's upcoming schedule blocks (planned, start still ahead)
    const nowMin = (now - today0) / 60000;
    for (const b of schedule) {
      if (b.status === "planned" && b.startMin >= nowMin) {
        out.push({ key: `sched-${b._id}`, type: "schedule", title: b.title, meta: `At ${minToLabel(b.startMin)}`, date: today0 + b.startMin * 60000, href: "/schedule", severity: "info" });
      }
    }

    // ── Life OS ──
    const [recentDays, deals, commitments, inboxOpen, recallDue] = await Promise.all([
      // Latest days up to today by DATE (by_user would order by creation, and the
      // Ideal Week creates future day rows that would hide today's start-up).
      ctx.db
        .query("days")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).lte("date", args.today ?? addDays(todayStr, 1)))
        .order("desc")
        .take(3),
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("commitments").withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "open")).collect(),
      ctx.db.query("inbox").withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "open")).collect(),
      ctx.db.query("recallCards").withIndex("by_user_due", (q) => q.eq("userId", userId).lte("due", now)).collect(),
    ]);
    // Morning start-up reminder (no ritual in the last 16h) — replaces the old check-in nudge.
    const startedRecently = recentDays.some((d) => d.startupAt != null && d.startupAt > now - 16 * 60 * 60 * 1000);
    if (!startedRecently && checkins.length === 0) {
      out.push({ key: `startup-${todayStr}`, type: "ritual", title: "Start your day", meta: "5-minute start-up: check-in, Top 3, capacity", date: today0, href: "/today", severity: "info" });
    }
    // Deals: overdue or missing next step
    const OPEN = new Set(["target", "contacted", "booked", "discovery", "proposal", "verbal"]);
    for (const d of deals) {
      if (!OPEN.has(d.stage)) continue;
      if (!d.nextStepDate) {
        out.push({ key: `deal-nostep-${d._id}`, type: "deal", title: d.title, meta: "Open deal with no next step", date: d.stageChangedAt, href: `/pipeline?deal=${d._id}`, severity: "urgent" });
      } else if (d.nextStepDate <= todayStr) {
        out.push({ key: `deal-step-${d._id}-${d.nextStepDate}`, type: "deal", title: d.title, meta: `Next step ${d.nextStepDate < todayStr ? "overdue" : "today"}: ${d.nextStep ?? ""}`, date: today0, href: `/pipeline?deal=${d._id}`, severity: d.nextStepDate < todayStr ? "urgent" : "info" });
      }
    }
    // Promises I owe, and waiting-for checks
    for (const c of commitments) {
      if (c.direction === "i_owe" && c.promisedDate && c.promisedDate <= todayStr) {
        out.push({ key: `promise-${c._id}-${c.promisedDate}`, type: "commitment", title: c.title, meta: c.promisedDate < todayStr ? "Promise overdue — deliver or renegotiate" : "Promised for today", date: today0, href: "/commitments", severity: "urgent" });
      } else if (c.direction === "owed_to_me" && c.checkDate && c.checkDate <= todayStr) {
        out.push({ key: `waiting-${c._id}-${c.checkDate}`, type: "commitment", title: c.title, meta: "Waiting for — time to check in", date: today0, href: "/commitments", severity: "info" });
      }
    }
    const stale = inboxOpen.filter((i) => now - i.createdAt > 2 * DAY).length;
    if (stale > 0) out.push({ key: `inbox-stale-${todayStr}`, type: "inbox", title: `${stale} inbox item${stale === 1 ? "" : "s"} older than 48h`, meta: "Process or discard", date: today0, href: "/inbox", severity: "info" });
    const due = recallDue.filter((c) => !c.suspended).length;
    if (due >= 5) out.push({ key: `recall-${todayStr}`, type: "recall", title: `${due} recall cards due`, meta: "10 minutes keeps what you learn", date: today0, href: "/recall", severity: "info" });

    const dismissedKeys = new Set(dismissed.map((d) => d.key));
    return out
      .filter((n) => !dismissedKeys.has(n.key))
      .sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === "urgent" ? -1 : 1;
        return a.date - b.date;
      })
      .slice(0, 40);
}

export const dismiss = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("dismissedNotifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (existing.some((d) => d.key === key)) return;
    await ctx.db.insert("dismissedNotifications", { userId, key, dismissedAt: Date.now() });
  },
});

export const dismissAll = mutation({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, { keys }) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("dismissedNotifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const have = new Set(existing.map((d) => d.key));
    const at = Date.now();
    for (const key of keys) {
      if (!have.has(key)) await ctx.db.insert("dismissedNotifications", { userId, key, dismissedAt: at });
    }
  },
});
