import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, diffDays, getSettings, mondayOf } from "./os";
import { gameState } from "./game";

const PRANK = { high: 0, med: 1, low: 2 } as const;
const byPriority = (a: Doc<"tasks">, b: Doc<"tasks">) =>
  PRANK[a.priority] - PRANK[b.priority] || (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity);

/**
 * The Today cockpit — one reactive query for the whole home screen.
 * `date` = client-local today, `dayStart` = local midnight (ms), `now` = ms.
 */
export const cockpit = query({
  args: { date: v.string(), dayStart: v.number(), now: v.number() },
  handler: async (ctx, { date, dayStart, now }) => {
    const userId = await requireUser(ctx);
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const yesterday = addDays(date, -1);
    const weekStart = mondayOf(date);

    const [
      settings,
      areas,
      tasks,
      days,
      blocks,
      habits,
      completions,
      routines,
      runs,
      commitments,
      deals,
      people,
      interactionsToday,
      recallDue,
      content,
      inbox,
      weekPlan,
      cycles,
      focus,
      profile,
    ] = await Promise.all([
      getSettings(ctx, userId),
      ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("days").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("scheduleBlocks").withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date)).collect(),
      ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId).gte("date", addDays(date, -1)).lte("date", date)).collect(),
      ctx.db.query("routines").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("routineRuns").withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date)).collect(),
      ctx.db.query("commitments").withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "open")).collect(),
      ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("people").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("interactions").withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date)).collect(),
      ctx.db.query("recallCards").withIndex("by_user_due", (q) => q.eq("userId", userId).lte("due", now)).collect(),
      ctx.db.query("contentPieces").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("inbox").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("weekPlans").withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekStart", weekStart)).first(),
      ctx.db.query("cycles").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").take(400),
      ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).first(),
    ]);

    const day = days.find((d) => d.date === date) ?? null;
    const yDay = days.find((d) => d.date === yesterday) ?? null;
    const taskById = new Map(tasks.map((t) => [t._id, t]));

    // ── Tasks ────────────────────────────────────────────────────────────
    const topIds = (day?.top3 ?? []).filter((id) => taskById.has(id));
    const top3 = topIds.map((id) => taskById.get(id)!);
    const topSet = new Set(topIds);
    const planned = tasks
      .filter((t) => t.plannedFor === date && !topSet.has(t._id))
      .sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || byPriority(a, b));
    const listed = new Set([...topIds, ...planned.map((t) => t._id)]);
    const scheduledToday = tasks.filter(
      (t) => !listed.has(t._id) && t.status !== "done" && t.startAt != null && t.startAt >= dayStart && t.startAt < dayEnd,
    );
    scheduledToday.forEach((t) => listed.add(t._id));
    const dueToday = tasks
      .filter((t) => !listed.has(t._id) && t.status !== "done" && t.dueDate != null && t.dueDate >= dayStart && t.dueDate < dayEnd)
      .sort(byPriority);
    dueToday.forEach((t) => listed.add(t._id));
    const leftovers = tasks
      .filter((t) => t.status !== "done" && !t.someday && !!t.plannedFor && t.plannedFor < date)
      .sort((a, b) => (a.plannedFor ?? "").localeCompare(b.plannedFor ?? "") || byPriority(a, b));
    const overdue = tasks.filter((t) => t.status !== "done" && t.dueDate != null && t.dueDate < dayStart).sort(byPriority);
    // Candidates for picking Top 3: open, not someday, sensible order.
    const candidates = tasks
      .filter((t) => t.status !== "done" && !t.someday)
      .sort((a, b) => {
        const score = (t: Doc<"tasks">) =>
          (t.plannedFor === date ? -30 : 0) +
          (t.dueDate != null && t.dueDate < dayEnd ? -20 : 0) +
          (t.goalId ? -8 : 0) +
          PRANK[t.priority] * 5;
        return score(a) - score(b);
      })
      .slice(0, 40);

    // ── Capacity check (Sunsama) ─────────────────────────────────────────
    const openToday = [...top3, ...planned, ...scheduledToday].filter((t) => t.status !== "done");
    const plannedMin = openToday.reduce((s, t) => s + (t.estimateMin ?? 30), 0);
    const meetingMin = blocks
      .filter((b) => b.blockType === "manager" && b.status !== "skipped")
      .reduce((s, b) => s + Math.max(0, b.endMin - b.startMin), 0);
    const capacityMin = day?.capacityMin ?? settings.capacityMin;
    const doneTodayCount = tasks.filter((t) => t.status === "done" && t.completedAt != null && t.completedAt >= dayStart && t.completedAt < dayEnd).length;

    // ── Habits ───────────────────────────────────────────────────────────
    const habitsOut = habits
      .filter((h) => !h.habitStatus || h.habitStatus === "active")
      .map((h) => {
        const c = completions.find((x) => x.habitId === h._id && x.date === date);
        const y = completions.find((x) => x.habitId === h._id && x.date === yesterday);
        return {
          _id: h._id,
          title: h.title,
          anchor: h.anchor,
          minVersion: h.minVersion,
          timeOfDay: h.timeOfDay ?? "any",
          lifeAreaId: h.lifeAreaId,
          streak: h.streak,
          kind: c ? (c.kind ?? "done") : null,
          yesterdayMissed: !y,
        };
      });
    const habitsDone = habitsOut.filter((h) => h.kind && h.kind !== "skip").length;
    const habitsCountable = habitsOut.filter((h) => h.kind !== "skip").length;

    // ── Routines ─────────────────────────────────────────────────────────
    const routinesOut = routines
      .filter((r) => r.active)
      .sort((a, b) => a.order - b.order)
      .map((r) => {
        const run = runs.find((x) => x.routineId === r._id);
        return {
          _id: r._id,
          name: r.name,
          kind: r.kind,
          steps: r.steps.length,
          minutes: r.steps.reduce((s, x) => s + (x.minutes ?? 0), 0),
          doneSteps: run?.doneStepIds.length ?? 0,
          completed: !!run?.completed,
        };
      });

    // ── Commitments & sales ──────────────────────────────────────────────
    const personName = (id?: string) => people.find((p) => p._id === id)?.name;
    const iOwe = commitments
      .filter((c) => c.direction === "i_owe" && !!c.promisedDate && c.promisedDate <= addDays(date, 1))
      .sort((a, b) => (a.promisedDate ?? "").localeCompare(b.promisedDate ?? ""))
      .map((c) => ({ _id: c._id, title: c.title, date: c.promisedDate!, person: personName(c.personId), overdue: c.promisedDate! < date }));
    const waiting = commitments
      .filter((c) => c.direction === "owed_to_me" && !!c.checkDate && c.checkDate <= date)
      .map((c) => ({ _id: c._id, title: c.title, date: c.checkDate!, person: personName(c.personId) }));
    const OPEN = new Set(["target", "contacted", "booked", "discovery", "proposal", "verbal"]);
    const dealSteps = deals
      .filter((d) => OPEN.has(d.stage) && (!d.nextStepDate || d.nextStepDate <= date))
      .sort((a, b) => (a.nextStepDate ?? "").localeCompare(b.nextStepDate ?? ""))
      .slice(0, 8)
      .map((d) => ({
        _id: d._id,
        title: d.title,
        stage: d.stage,
        nextStep: d.nextStep,
        nextStepDate: d.nextStepDate,
        person: personName(d.personId),
        missing: !d.nextStepDate,
        value: d.value,
      }));
    const outreachToday = interactionsToday.filter((i) => i.kind === "outreach" || i.kind === "followup").length;
    const meetingsToday = interactionsToday.filter((i) => i.kind === "meeting" || i.kind === "call").length;
    const reconnect = people
      .filter((p) => p.cadenceDays && (now - (p.lastContactAt ?? p.createdAt)) / 86400000 >= p.cadenceDays)
      .slice(0, 5)
      .map((p) => ({ _id: p._id, name: p.name, relation: p.relation }));

    // ── Content ──────────────────────────────────────────────────────────
    const UNPUB = new Set(["idea", "seed", "brief", "script", "ready_to_record", "recorded", "editing", "ready_to_publish", "scheduled"]);
    const contentToday = content
      .filter((c) => UNPUB.has(c.stage) && !!c.scheduledFor && c.scheduledFor <= date)
      .sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""))
      .slice(0, 6)
      .map((c) => ({ _id: c._id, title: c.title, stage: c.stage, brand: c.brand, format: c.format, scheduledFor: c.scheduledFor!, overdue: c.scheduledFor! < date }));
    const weekStartMs = dayStart - diffDays(weekStart, date) * 86400000;
    const publishedThisWeek = content.filter((c) => c.publishedAt != null && c.publishedAt >= weekStartMs).length;
    const ideaCount = content.filter((c) => c.stage === "idea" || c.stage === "seed").length;

    // ── Inbox ────────────────────────────────────────────────────────────
    const openInbox = inbox.filter((i) => i.status === "open" || (i.status === "snoozed" && (i.snoozeUntil ?? 0) <= now));
    const staleInbox = openInbox.filter((i) => now - i.createdAt > 48 * 3600 * 1000).length;

    // ── Cycle / week ─────────────────────────────────────────────────────
    // A cycle launched for a future Monday is stored as "planned" and nothing flips
    // it to "active" when that Monday arrives — so treat any open, started cycle as live.
    const active =
      cycles
        .filter((c) => c.status !== "done" && c.startDate <= date)
        .sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null;
    const cycle = active
      ? { _id: active._id, name: active.name, week: Math.min(13, Math.floor(diffDays(active.startDate, date) / 7) + 1), theme: active.theme }
      : null;

    // ── Focus today ──────────────────────────────────────────────────────
    const focusMin = Math.round(focus.filter((f) => f.endTime >= dayStart && f.endTime < dayEnd).reduce((s, f) => s + f.duration, 0) / 60);

    // ── Day score (live) ─────────────────────────────────────────────────
    const topDone = top3.filter((t) => t.status === "done").length;
    const score =
      (day?.startupAt ? 20 : 0) +
      (top3.length ? Math.round((topDone / top3.length) * 30) : 0) +
      (habitsCountable ? Math.round((habitsDone / habitsCountable) * 20) : 0) +
      (day?.shutdownAt ? 20 : 0) +
      (day?.progressLine || day?.journal?.win ? 10 : 0);

    // ── Fresh start: back after a gap ───────────────────────────────────
    const ritualDays = days.filter((d) => d.startupAt || d.shutdownAt).map((d) => d.date).sort();
    const lastRitual = ritualDays.filter((d) => d < date).at(-1);
    const daysAway = lastRitual ? diffDays(lastRitual, date) : null;
    const freshStart = daysAway != null && daysAway >= 3 && !day?.startupAt ? { daysAway, overdue: overdue.length + leftovers.length } : null;

    const game = await gameState(ctx, userId, date);
    const needsSetup = areas.length === 0 || !settings.onboardedAt;

    return {
      date,
      name: profile?.name?.trim().split(/\s+/)[0] ?? null,
      day,
      yesterday: yDay
        ? { shutdownDone: !!yDay.shutdownAt, resumeNote: yDay.resumeNote, progressLine: yDay.progressLine, lesson: yDay.lesson }
        : null,
      settings: {
        capacityMin: settings.capacityMin,
        outreachQuota: settings.outreachQuota,
        meetingsGoal: settings.meetingsGoal,
        celebrate: settings.celebrate,
        contentWeeklyTarget: settings.contentWeeklyTarget,
        reviewWeekday: settings.reviewWeekday,
      },
      areas: areas
        .filter((a) => !a.archived)
        .sort((a, b) => a.order - b.order)
        .map((a) => ({ _id: a._id, name: a.name, color: a.color, order: a.order })),
      top3,
      planned,
      scheduledToday,
      dueToday,
      leftovers,
      overdue: { count: overdue.length, top: overdue.slice(0, 5) },
      candidates,
      capacity: { plannedMin, meetingMin, capacityMin, over: plannedMin + meetingMin - capacityMin },
      doneTodayCount,
      blocks: blocks.sort((a, b) => a.startMin - b.startMin),
      habits: habitsOut,
      habitsDone,
      routines: routinesOut,
      commitments: { iOwe, waiting },
      deals: dealSteps,
      outreach: { today: outreachToday, quota: settings.outreachQuota, meetings: meetingsToday, meetingsGoal: settings.meetingsGoal },
      reconnect,
      recallDue: recallDue.filter((c) => !c.suspended).length,
      content: { today: contentToday, publishedThisWeek, weeklyTarget: settings.contentWeeklyTarget, ideaCount },
      inbox: { open: openInbox.length, stale: staleInbox },
      week: { weekStart, big3: weekPlan?.big3 ?? [], freeDay: weekPlan?.freeDay ?? null, reviewed: !!weekPlan?.reviewedAt },
      cycle,
      focusMin,
      dayScore: score,
      freshStart,
      game,
      needsSetup,
    };
  },
});

/** Shutdown look-ahead: tomorrow's blocks + plan, and deadlines in the next 14 days. */
export const lookahead = query({
  args: { date: v.string(), dayStart: v.number() },
  handler: async (ctx, { date, dayStart }) => {
    const userId = await requireUser(ctx);
    const tomorrow = addDays(date, 1);
    const [blocks, tasks, tDay] = await Promise.all([
      ctx.db.query("scheduleBlocks").withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", tomorrow)).collect(),
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("days").withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", tomorrow)).first(),
    ]);
    const horizon = dayStart + 15 * 24 * 60 * 60 * 1000;
    const deadlines = tasks
      .filter((t) => t.status !== "done" && t.dueDate != null && t.dueDate >= dayStart && t.dueDate < horizon)
      .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0))
      .slice(0, 10);
    const plannedTomorrow = tasks.filter((t) => t.plannedFor === tomorrow && t.status !== "done");
    return {
      tomorrow,
      blocks: blocks.sort((a, b) => a.startMin - b.startMin),
      deadlines,
      plannedTomorrow,
      tomorrowTop: tDay?.top3 ?? [],
    };
  },
});


/** Sidebar badges: inbox to process, recall cards due, promises overdue. */
export const badges = query({
  args: { now: v.number(), date: v.string() },
  handler: async (ctx, { now, date }) => {
    const userId = await requireUser(ctx);
    const [inbox, snoozed, recall, commitments] = await Promise.all([
      ctx.db.query("inbox").withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "open")).collect(),
      ctx.db.query("inbox").withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "snoozed")).collect(),
      ctx.db.query("recallCards").withIndex("by_user_due", (q) => q.eq("userId", userId).lte("due", now)).collect(),
      ctx.db.query("commitments").withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "open")).collect(),
    ]);
    return {
      // Same rule as the Inbox page / cockpit: expired snoozes are back in the inbox.
      inbox: inbox.length + snoozed.filter((i) => (i.snoozeUntil ?? 0) <= now).length,
      recall: recall.filter((c) => !c.suspended).length,
      promisesOverdue: commitments.filter((c) => c.direction === "i_owe" && !!c.promisedDate && c.promisedDate < date).length,
    };
  },
});

/** Active challenges and whether today's day page exists (Today rail). */
export const challengesToday = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    const active = await ctx.db
      .query("challenges")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .collect();
    const out = [];
    for (const c of active) {
      const days = await ctx.db.query("challengeDays").withIndex("by_challenge", (q) => q.eq("challengeId", c._id)).collect();
      const today = days.find((d) => d.date === date);
      out.push({ _id: c._id, name: c.name, color: c.color, dayCount: days.length, todayDay: today ? { _id: today._id, name: today.name } : null });
    }
    return out;
  },
});
