import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

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

/** Computed notifications: deadlines, at-risk streaks, and reminders. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const now = Date.now();
    const today0 = startOfToday();
    const todayEnd = today0 + DAY;
    const todayStr = ymd(now);

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
        out.push({ key: `task-overdue-${t._id}`, type: "task", title: t.title, meta: `Overdue by ${days}d`, date: t.dueDate, href: "/tasks", severity: "urgent" });
      } else if (t.dueDate < todayEnd) {
        out.push({ key: `task-today-${t._id}`, type: "task", title: t.title, meta: "Due today", date: t.dueDate, href: "/tasks", severity: "urgent" });
      } else if (t.dueDate <= now + 3 * DAY) {
        out.push({ key: `task-soon-${t._id}`, type: "task", title: t.title, meta: `Due ${fmtDate(t.dueDate)}`, date: t.dueDate, href: "/tasks", severity: "info" });
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

    // Habit streaks at risk (streak>0, not done today) — keyed per-day
    const doneTodayHabits = new Set(hcompletions.filter((c) => c.date === todayStr).map((c) => c.habitId));
    for (const h of habits) {
      if (h.streak > 0 && !doneTodayHabits.has(h._id)) {
        out.push({ key: `habit-${h._id}-${todayStr}`, type: "habit", title: h.title, meta: `🔥 ${h.streak}-day streak at risk`, date: today0, href: "/habits", severity: "urgent" });
      }
    }

    // Today's upcoming schedule blocks (planned, start still ahead)
    const nowMin = (now - today0) / 60000;
    for (const b of schedule) {
      if (b.status === "planned" && b.startMin >= nowMin) {
        out.push({ key: `sched-${b._id}`, type: "schedule", title: b.title, meta: `At ${minToLabel(b.startMin)}`, date: today0 + b.startMin * 60000, href: "/schedule", severity: "info" });
      }
    }

    // Daily check-in reminder
    if (checkins.length === 0) {
      out.push({ key: `checkin-${todayStr}`, type: "checkin", title: "Daily check-in", meta: "You haven't checked in today", date: today0, href: "/check-in", severity: "info" });
    }

    const dismissedKeys = new Set(dismissed.map((d) => d.key));
    return out
      .filter((n) => !dismissedKeys.has(n.key))
      .sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === "urgent" ? -1 : 1;
        return a.date - b.date;
      })
      .slice(0, 40);
  },
});

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
