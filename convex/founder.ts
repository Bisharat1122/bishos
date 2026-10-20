/**
 * Founder HQ — the CEO view aggregate (read-only).
 *
 * Args (all client-local):
 *   today      YYYY-MM-DD
 *   weekStart  local Monday YYYY-MM-DD
 *   from / to  epoch-ms bounds of this local week [Mon 00:00, next Mon 00:00)
 * The client's UTC offset is derived from (weekStart, from), so timestamps
 * (doneAt, endTime…) can be mapped back to local days without `new Date()`.
 */
import { v } from "convex/values";
import { query, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { addDays, DAY_MS, diffDays, getSettings, ymdUtc } from "./os";
import { computeGrid, WeekWindow } from "./scorecard";
import { isReviewDue, rankIssues } from "./decisions";
import { dealFlags } from "./deals";

const OPEN_STAGES = ["target", "contacted", "booked", "discovery", "proposal", "verbal"] as const;
const PRODUCTION_STAGES = new Set([
  "brief",
  "script",
  "ready_to_record",
  "recorded",
  "editing",
  "ready_to_publish",
  "scheduled",
]);
const RUNGS = ["admin", "delivery", "marketing", "sales", "leadership"] as const;

/** Small prefs the strategy pages need (currency etc.). */
export const prefs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const s = await getSettings(ctx, userId);
    return {
      currency: s.currency,
      contentWeeklyTarget: s.contentWeeklyTarget,
      workHoursCap: s.workHoursCap,
      annualIncome: s.annualIncome,
    };
  },
});

async function areaResolver(ctx: QueryCtx) {
  const taskCache = new Map<string, Id<"lifeAreas"> | null>();
  const projCache = new Map<string, Id<"lifeAreas"> | null>();
  return async (x: { lifeAreaId?: Id<"lifeAreas">; taskId?: Id<"tasks">; projectId?: Id<"projects"> }) => {
    if (x.lifeAreaId) return x.lifeAreaId;
    if (x.taskId) {
      if (!taskCache.has(x.taskId)) taskCache.set(x.taskId, (await ctx.db.get(x.taskId))?.lifeAreaId ?? null);
      const a = taskCache.get(x.taskId);
      if (a) return a;
    }
    if (x.projectId) {
      if (!projCache.has(x.projectId)) projCache.set(x.projectId, (await ctx.db.get(x.projectId))?.lifeAreaId ?? null);
      const a = projCache.get(x.projectId);
      if (a) return a;
    }
    return null;
  };
}

export const hq = query({
  args: { today: v.string(), weekStart: v.string(), from: v.number(), to: v.number() },
  handler: async (ctx, { today, weekStart, from, to }) => {
    const userId = await requireUser(ctx);
    const settings = await getSettings(ctx, userId);
    // local-day mapping for timestamps: localYmd(t) = ymdUtc(t + shift)
    const shift = Date.parse(`${weekStart}T00:00:00Z`) - from;
    const localYmd = (t: number) => ymdUtc(t + shift);
    const todayStart = from + diffDays(weekStart, today) * DAY_MS; // local midnight today
    const weekEnd = addDays(weekStart, 6);
    const inWeek = (t: number | undefined) => t != null && t >= from && t < to;

    // ── Week's Big 3 ────────────────────────────────────────────────────
    const plan = await ctx.db
      .query("weekPlans")
      .withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekStart", weekStart))
      .first();

    // ── Scorecard (last 8 weeks, oldest → newest; last = this week) ─────
    const HIST = 8;
    const wins: WeekWindow[] = Array.from({ length: HIST }, (_, i) => {
      const k = HIST - 1 - i;
      return k === 0
        ? { weekStart, from, to }
        : { weekStart: addDays(weekStart, -7 * k), from: from - k * 7 * DAY_MS, to: from - (k - 1) * 7 * DAY_MS };
    });
    const grid = await computeGrid(ctx, userId, wins);
    const cur = HIST - 1;
    const scoreRows = grid.map((m) => ({
      _id: m._id,
      name: m.name,
      unit: m.unit,
      target: m.target,
      direction: m.direction,
      auto: m.source,
      value: m.values[cur],
      last: m.values[cur - 1],
      status: m.status[cur],
      /** 8 weekly values, oldest → newest (null = no entry that week). */
      history: m.values,
    }));
    const scorecard = {
      total: scoreRows.length,
      on: scoreRows.filter((r) => r.status === "on").length,
      off: scoreRows.filter((r) => r.status === "off").length,
      missing: scoreRows.filter((r) => r.status == null).length,
      metrics: scoreRows,
      /** Per week: numbers on track vs numbers with a value (oldest → newest). */
      weekly: wins.map((w, i) => ({
        weekStart: w.weekStart,
        on: grid.filter((m) => m.status[i] === "on").length,
        tracked: grid.filter((m) => m.status[i] != null).length,
      })),
    };

    // ── Hours by Life Area (focus + done blocks without a focus session) ─
    const areas = (await ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect())
      .filter((a) => !a.archived)
      .sort((a, b) => a.order - b.order);
    // Reach back 8 weeks too, for the weekly-hours trend below.
    const restWindowStart = Math.min(from - 7 * 7 * DAY_MS, todayStart - 28 * DAY_MS);
    const sessions = await ctx.db
      .query("focusSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("endTime"), restWindowStart))
      .collect();
    const blocks = await ctx.db
      .query("scheduleBlocks")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", weekStart).lte("date", weekEnd))
      .collect();
    const resolveArea = await areaResolver(ctx);
    const focusBy = new Map<string, number>();
    const blockBy = new Map<string, number>();
    let focusTotal = 0;
    let blockTotal = 0;
    for (const s of sessions) {
      if (!inWeek(s.endTime)) continue;
      const h = s.duration / 3600;
      const a = (await resolveArea(s)) ?? "none";
      focusBy.set(a, (focusBy.get(a) ?? 0) + h);
      focusTotal += h;
    }
    for (const b of blocks) {
      if (b.status !== "done" || b.focusSessionId) continue;
      const h = Math.max(0, b.endMin - b.startMin) / 60;
      const a = (await resolveArea(b)) ?? "none";
      blockBy.set(a, (blockBy.get(a) ?? 0) + h);
      blockTotal += h;
    }
    const r1 = (n: number) => Math.round(n * 10) / 10;
    const hoursByArea = areas.map((a) => ({
      _id: a._id as string,
      name: a.name,
      color: a.color,
      order: a.order,
      kind: a.kind,
      target: a.weeklyHoursTarget ?? null,
      focus: r1(focusBy.get(a._id) ?? 0),
      blocks: r1(blockBy.get(a._id) ?? 0),
      actual: r1((focusBy.get(a._id) ?? 0) + (blockBy.get(a._id) ?? 0)),
    }));
    const unassigned = r1((focusBy.get("none") ?? 0) + (blockBy.get("none") ?? 0));
    const hoursThisWeek = r1(focusTotal + blockTotal);

    // 8-week hours trend (oldest → newest; the last entry is this week).
    const pastBlocks = await ctx.db
      .query("scheduleBlocks")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", addDays(weekStart, -7 * (HIST - 1))).lt("date", weekStart))
      .collect();
    const hoursWeekly = wins.map((w, i) => {
      if (i === cur) return { weekStart: w.weekStart, hours: hoursThisWeek };
      const wEnd = addDays(w.weekStart, 7);
      let h = 0;
      for (const s of sessions) if (s.endTime >= w.from && s.endTime < w.to) h += s.duration / 3600;
      for (const b of pastBlocks) {
        if (b.status !== "done" || b.focusSessionId || b.date < w.weekStart || b.date >= wEnd) continue;
        h += Math.max(0, b.endMin - b.startMin) / 60;
      }
      return { weekStart: w.weekStart, hours: r1(h) };
    });

    // ── Pipeline ─────────────────────────────────────────────────────────
    const deals = await ctx.db.query("deals").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const open = deals.filter((d) => (OPEN_STAGES as readonly string[]).includes(d.stage));
    const dealRow = (d: Doc<"deals">) => ({
      _id: d._id,
      title: d.title,
      stage: d.stage,
      value: d.value ?? null,
      nextStep: d.nextStep ?? null,
      nextStepDate: d.nextStepDate ?? null,
      lastTouchAt: d.lastTouchAt ?? null,
    });
    const nextDue = open
      .filter((d) => d.nextStepDate && d.nextStepDate <= today)
      .sort((a, b) => (a.nextStepDate as string).localeCompare(b.nextStepDate as string));
    // Same idle rule as Pipeline (convex/deals.ts dealFlags): last touch OR stage change, 7+ days.
    const touchedAt = (d: Doc<"deals">) => Math.max(d.lastTouchAt ?? 0, d.stageChangedAt);
    const idle = open.filter((d) => dealFlags(d, today).idle).sort((a, b) => touchedAt(a) - touchedAt(b));
    const closedWon = deals.filter((d) => d.stage === "won");
    // Win rate = Pipeline's definition (convex/deals.ts stats): deals closed in the last 90 days.
    const closedDay = (d: Doc<"deals">) => d.closedDate ?? (d.closedAt ? ymdUtc(d.closedAt) : undefined);
    const since90 = addDays(today, -89);
    const closed90 = deals.filter((d) => !(OPEN_STAGES as readonly string[]).includes(d.stage) && (closedDay(d) ?? "") >= since90);
    const won90 = closed90.filter((d) => d.stage === "won").length;
    const lost90 = closed90.filter((d) => d.stage === "lost").length;
    const wonWeek = closedWon.filter((d) => inWeek(d.closedAt));
    const pipeline = {
      openCount: open.length,
      openValue: open.reduce((s, d) => s + (d.value ?? 0), 0),
      byStage: OPEN_STAGES.map((st) => {
        const ds = open.filter((d) => d.stage === st);
        return { stage: st, count: ds.length, value: ds.reduce((s, d) => s + (d.value ?? 0), 0) };
      }),
      dueCount: nextDue.length,
      overdueCount: nextDue.filter((d) => (d.nextStepDate as string) < today).length,
      nextDue: nextDue.slice(0, 5).map(dealRow),
      noNextStep: open.filter((d) => !d.nextStep || !d.nextStepDate).length,
      idleCount: idle.length,
      idle: idle.slice(0, 5).map(dealRow),
      wonThisWeek: wonWeek.length,
      wonValueThisWeek: wonWeek.reduce((s, d) => s + (d.value ?? 0), 0),
      /** Deals won per week, last 8 weeks (oldest → newest). */
      wonWeekly: wins.map((w) => {
        const ds = closedWon.filter((d) => d.closedAt != null && d.closedAt >= w.from && d.closedAt < w.to);
        return { weekStart: w.weekStart, count: ds.length, value: ds.reduce((s, d) => s + (d.value ?? 0), 0) };
      }),
      /** % of deals closed in the last 90 days that were won (same as Pipeline). */
      winRate: won90 + lost90 ? Math.round((won90 / (won90 + lost90)) * 100) : null,
    };

    // ── Content cadence ─────────────────────────────────────────────────
    const pieces = await ctx.db.query("contentPieces").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const weeksBack = 8;
    const cadence = Array.from({ length: weeksBack }, (_, i) => {
      const k = weeksBack - 1 - i; // oldest → newest
      const f = from - k * 7 * DAY_MS;
      const t = f + 7 * DAY_MS;
      const pub = pieces.filter((p) => p.publishedAt != null && p.publishedAt >= f && p.publishedAt < t);
      return { weekStart: addDays(weekStart, -7 * k), hubs: pub.filter((p) => p.isHub).length, published: pub.length };
    });
    const production = pieces
      .filter((p) => PRODUCTION_STAGES.has(p.stage))
      .sort((a, b) => (a.scheduledFor ?? "9999").localeCompare(b.scheduledFor ?? "9999"));
    const content = {
      target: settings.contentWeeklyTarget,
      hubsThisWeek: cadence[weeksBack - 1].hubs,
      publishedThisWeek: cadence[weeksBack - 1].published,
      inProductionCount: production.length,
      inProduction: production.slice(0, 5).map((p) => ({
        _id: p._id,
        title: p.title,
        stage: p.stage,
        isHub: !!p.isHub,
        scheduledFor: p.scheduledFor ?? null,
        brand: p.brand,
      })),
      ideas: pieces.filter((p) => p.stage === "idea" || p.stage === "seed").length,
      cadence,
      // consecutive weeks (ending last complete week or this one) that hit the hub target
      hubStreak: (() => {
        let n = 0;
        const target = Math.max(1, settings.contentWeeklyTarget);
        for (let i = weeksBack - 1; i >= 0; i--) {
          if (cadence[i].hubs >= target) n++;
          else if (i === weeksBack - 1) continue; // this week still in progress
          else break;
        }
        return n;
      })(),
    };

    // ── Promise-keeping (last 28 days) ──────────────────────────────────
    const commitments = await ctx.db.query("commitments").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const pkStart = addDays(today, -27);
    const iOwe = commitments.filter((c) => c.direction === "i_owe");
    // Same rule as convex/commitments.ts (rateFor/keptOnTime) so the KPI matches /commitments:
    // renegotiated + cancelled are left out; open ones count only once late; broken counts as missed.
    const dueWindow = iOwe.filter(
      (c) =>
        c.promisedDate &&
        c.promisedDate >= pkStart &&
        c.promisedDate <= today &&
        (c.status === "done" || c.status === "broken" || (c.status === "open" && c.promisedDate < today)),
    );
    const kept = dueWindow.filter((c) => {
      if (c.status !== "done") return false;
      const doneDay = c.doneDate ?? (c.doneAt != null ? localYmd(c.doneAt) : undefined);
      return !doneDay || doneDay <= (c.promisedDate as string);
    });
    const overdueOwe = iOwe
      .filter((c) => c.status === "open" && c.promisedDate && c.promisedDate < today)
      .sort((a, b) => (a.promisedDate as string).localeCompare(b.promisedDate as string));
    const upcomingOwe = iOwe
      .filter((c) => c.status === "open" && c.promisedDate && c.promisedDate >= today && c.promisedDate <= addDays(today, 6))
      .sort((a, b) => (a.promisedDate as string).localeCompare(b.promisedDate as string));
    const promises = {
      rate: dueWindow.length ? Math.round((kept.length / dueWindow.length) * 100) : null,
      kept: kept.length,
      due: dueWindow.length,
      overdueCount: overdueOwe.length,
      overdue: overdueOwe.slice(0, 4).map((c) => ({ _id: c._id, title: c.title, promisedDate: c.promisedDate ?? null })),
      dueToday: iOwe.filter((c) => c.status === "open" && c.promisedDate === today).length,
      /** Open "I owe" promises due today … in 6 days (soonest first; first 4 rows). */
      upcoming: upcomingOwe.slice(0, 4).map((c) => ({ _id: c._id, title: c.title, promisedDate: c.promisedDate ?? null })),
      /** How many promises are due in the next 7 days (the full count, not the 4 rows). */
      upcomingCount: upcomingOwe.length,
      waitingCheck: commitments.filter(
        (c) => c.direction === "owed_to_me" && c.status === "open" && (c.checkDate ?? c.promisedDate ?? "9999") <= today,
      ).length,
      openOwe: iOwe.filter((c) => c.status === "open").length,
    };

    // ── Offers & campaigns live ─────────────────────────────────────────
    const offers = await ctx.db.query("offers").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const campaigns = await ctx.db.query("campaigns").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const liveOffers = offers.filter((o) => o.status === "live");
    const liveCampaigns = campaigns.filter((c) => c.status === "live");
    const growth = {
      offersLive: liveOffers.length,
      offersTesting: offers.filter((o) => o.status === "testing").length,
      offers: liveOffers.slice(0, 4).map((o) => ({ _id: o._id, name: o.name, price: o.price ?? null })),
      campaignsLive: liveCampaigns.length,
      campaignsPlanned: campaigns.filter((c) => c.status === "planned").length,
      campaigns: liveCampaigns.slice(0, 4).map((c) => ({
        _id: c._id,
        name: c.name,
        endDate: c.endDate ?? null,
        leads: deals.filter((d) => d.campaignId === c._id).length,
      })),
    };

    // ── Delegation readiness ────────────────────────────────────────────
    const processes = await ctx.db.query("processes").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const openTasks = [
      ...(await ctx.db
        .query("tasks")
        .withIndex("by_status", (q) => q.eq("userId", userId).eq("status", "not_started"))
        .collect()),
      ...(await ctx.db
        .query("tasks")
        .withIndex("by_status", (q) => q.eq("userId", userId).eq("status", "in_progress"))
        .collect()),
    ];
    const byRung = RUNGS.map((rung) => {
      const ps = processes.filter((p) => p.rung === rung);
      const ready = ps.filter((p) => p.status === "documented" || p.status === "delegated").length;
      return {
        rung,
        total: ps.length,
        ready,
        delegated: ps.filter((p) => p.status === "delegated").length,
        pct: ps.length ? Math.round((ready / ps.length) * 100) : null,
      };
    });
    const readyTotal = byRung.reduce((s, r) => s + r.ready, 0);
    const delegation = {
      total: processes.length,
      ready: readyTotal,
      pct: processes.length ? Math.round((readyTotal / processes.length) * 100) : null,
      byRung,
      recordNext: openTasks.filter((t) => t.delegate).length,
    };

    // ── Wellbeing observations ──────────────────────────────────────────
    const dayDocs = await ctx.db
      .query("days")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", addDays(today, -60)).lte("date", today))
      .collect();
    const last7 = dayDocs.filter((d) => d.date >= addDays(today, -6));
    const sleeps = last7.map((d) => d.checkIn?.sleepHours).filter((x): x is number => typeof x === "number");
    const energies = last7.map((d) => d.checkIn?.energy).filter((x): x is number => typeof x === "number");
    const avgSleep = sleeps.length ? r1(sleeps.reduce((a, b) => a + b, 0) / sleeps.length) : null;
    const avgEnergy = energies.length ? r1(energies.reduce((a, b) => a + b, 0) / energies.length) : null;
    const lastFree = dayDocs
      .filter((d) => d.dayType === "free" && d.date <= today)
      .map((d) => d.date)
      .sort()
      .pop();
    const focusDays = new Set(sessions.map((s) => localYmd(s.endTime)));
    let lastNoFocus: string | undefined;
    for (let i = 1; i <= 28; i++) {
      const d = addDays(today, -i);
      if (!focusDays.has(d)) {
        lastNoFocus = d;
        break;
      }
    }
    const lastRest = [lastFree, lastNoFocus].filter((x): x is string => !!x).sort().pop() ?? null;
    const daysSinceRest = lastRest ? diffDays(lastRest, today) : 29;
    const cap = settings.workHoursCap;
    const observations: { key: string; tone: "warning" | "info" | "success"; text: string; href: string }[] = [];
    if (hoursThisWeek >= cap)
      observations.push({ key: "hours", tone: "warning", text: `${hoursThisWeek}h logged this week, at or above your ${cap}h cap.`, href: "/insights" });
    else if (hoursThisWeek >= cap * 0.85)
      observations.push({ key: "hours", tone: "info", text: `${hoursThisWeek}h this week, close to your ${cap}h cap.`, href: "/insights" });
    if (avgSleep != null && sleeps.length >= 3 && avgSleep < 6.5)
      observations.push({ key: "sleep", tone: "warning", text: `Sleep averaged ${avgSleep}h over the last 7 days (under 6.5h).`, href: "/insights" });
    if (daysSinceRest >= 14)
      observations.push({
        key: "rest",
        tone: "warning",
        text: daysSinceRest > 28 ? "No full day off in the last 4 weeks." : `${daysSinceRest} days since a day off.`,
        href: "/week",
      });
    if (!observations.length)
      observations.push({ key: "ok", tone: "success", text: "No load warnings this week. Sustainable pace.", href: "/insights" });
    const wellbeing = {
      hoursThisWeek,
      cap,
      avgSleep,
      sleepDays: sleeps.length,
      avgEnergy,
      daysSinceRest,
      lastRest,
      freeDayPlanned: plan?.freeDay ?? null,
      observations,
    };

    // ── Issues & decisions ──────────────────────────────────────────────
    const issues = await ctx.db.query("issues").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const ranked = rankIssues(issues);
    const decisions = await ctx.db.query("decisions").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const due = decisions
      .filter((d) => isReviewDue(d, today))
      .sort((a, b) => (a.reviewDate ?? "").localeCompare(b.reviewDate ?? ""));

    return {
      today,
      weekStart,
      currency: settings.currency,
      big3: plan?.big3 ?? [],
      scorecard,
      hours: { byArea: hoursByArea, unassigned, total: hoursThisWeek, focus: r1(focusTotal), blocks: r1(blockTotal), weekly: hoursWeekly },
      pipeline,
      content,
      promises,
      growth,
      delegation,
      wellbeing,
      issues: {
        openCount: ranked.length,
        top: ranked.slice(0, 3).map((i) => ({ _id: i._id, title: i.title, priority: i.priority, status: i.status })),
      },
      decisions: {
        dueCount: due.length,
        due: due.slice(0, 4).map((d) => ({ _id: d._id, title: d.title, reviewDate: d.reviewDate ?? null, confidence: d.confidence ?? null })),
        openCount: decisions.filter((d) => d.status !== "reviewed").length,
      },
    };
  },
});
