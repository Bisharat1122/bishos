import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser } from "./helpers";
import { callOpenRouter } from "./openrouter";

const DAY = 24 * 60 * 60 * 1000;
const ymd = (ts: number) => new Date(ts).toISOString().slice(0, 10);

/**
 * Today's check-in + data-adaptive questions derived from the user's current
 * state (tasks due, lagging goals, habits not yet done). No AI dependency, so
 * it's always available; the questions still react to real data.
 */
export const today = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const todayStr = ymd(Date.now());
    const now = Date.now();
    const todayStart = new Date(todayStr).getTime();

    const checkIn = await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_date", (q) => q.eq("userId", userId).eq("date", todayStr))
      .first();

    const [tasks, goals, habits, todayCompletions] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("goals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId).eq("date", todayStr)).collect(),
    ]);

    const adaptive: { id: string; question: string }[] = [];

    const open = tasks.filter((t) => t.status !== "done");
    const dueSoon = open.filter((t) => t.dueDate != null && t.dueDate <= todayStart + DAY);
    const overdue = open.filter((t) => t.dueDate != null && t.dueDate < todayStart);
    if (dueSoon.length > 0) {
      adaptive.push({
        id: "tasks_due",
        question: `You have ${dueSoon.length} task${dueSoon.length > 1 ? "s" : ""} due today${overdue.length ? ` (${overdue.length} overdue)` : ""}. Which 1–2 are non-negotiable?`,
      });
    } else if (open.length >= 5) {
      adaptive.push({
        id: "tasks_many",
        question: `You have ${open.length} open tasks. Which 2 will actually move the needle today?`,
      });
    }

    const laggingGoal = [...goals]
      .filter((g) => g.progress < 60)
      .sort((a, b) => a.progress - b.progress)[0];
    if (laggingGoal) {
      adaptive.push({
        id: `goal_${laggingGoal._id}`,
        question: `Your goal "${laggingGoal.title}" is at ${laggingGoal.progress}%. What's the very next step?`,
      });
    }

    const doneIds = new Set(todayCompletions.map((c) => c.habitId));
    const undoneHabit = habits.find((h) => !doneIds.has(h._id));
    if (undoneHabit) {
      adaptive.push({
        id: `habit_${undoneHabit._id}`,
        question: `You haven't done "${undoneHabit.title}" yet today. When will you?`,
      });
    }

    return { date: todayStr, checkIn, adaptive: adaptive.slice(0, 3), now };
  },
});

export const submit = mutation({
  args: {
    energyMood: v.number(),
    priorities: v.array(v.string()),
    priorityTaskIds: v.optional(v.array(v.id("tasks"))),
    blockers: v.array(v.string()),
    adaptiveAnswers: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const todayStr = ymd(Date.now());
    const existing = await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_date", (q) => q.eq("userId", userId).eq("date", todayStr))
      .first();

    const payload = {
      energyMood: args.energyMood,
      priorities: args.priorities.filter((p) => p.trim()),
      priorityTaskIds: args.priorityTaskIds,
      blockers: args.blockers.filter((b) => b.trim()),
      adaptiveAnswers: args.adaptiveAnswers,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return ctx.db.insert("dailyCheckIns", { userId, date: todayStr, ...payload });
  },
});

/** AI-written reflective check-in questions tailored to the user's current state. */
export const aiQuestions = action({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const context: string = await ctx.runQuery(internal.ai.gatherContext, {});
    const text: string = await callOpenRouter([
      {
        role: "system",
        content:
          "You are Bish's reflective check-in coach. Write sharp, specific questions that reference his actual situation. Output ONLY the questions, one per line, no numbering or preamble.",
      },
      {
        role: "user",
        content: `Here is my current life state:\n${context}\n\nWrite 3 short reflective questions for my check-in today, grounded in the specifics above.`,
      },
    ]);
    return text
      .split("\n")
      .map((l) => l.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
      .filter((l) => l.length > 4)
      .slice(0, 4);
  },
});

/** Recent check-ins for mood/energy trends. */
export const recent = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days }) => {
    const userId = await requireUser(ctx);
    const all = await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_date", (q) => q.eq("userId", userId))
      .collect();
    return all.slice(-(days ?? 14));
  },
});
