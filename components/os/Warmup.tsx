"use client";

/**
 * Speed: keeps the main pages' data subscribed in the background (after first
 * paint), so opening a page renders instantly from the Convex client cache
 * instead of showing a skeleton. Args here MUST match the pages' args exactly
 * (same date strings / aligned "now" from useCoarseNow) to share the cache.
 */

import { Component, ReactNode, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCoarseNow, useDayArgs } from "./useCockpit";
import { addDaysYmd, dateOf, mondayOf } from "@/lib/day";
import { shiftMonth, useTz } from "@/components/direction/util";
import { weekWindow, weekWindows } from "@/components/strategy/lib";

/** Swallow any warm-up query error — warming must never break the app. */
class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* ignore — the real page will surface errors itself */
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Queries() {
  const day = useDayArgs();
  const today = day.date;
  const weekStart = mondayOf(today);
  const weekEnd = addDaysYmd(weekStart, 6);
  const month = today.slice(0, 7);
  const now1 = useCoarseNow(60_000);
  const tz = useTz();

  // Today + rituals
  useQuery(api.today.cockpit, day);
  useQuery(api.onboarding.status, {});
  useQuery(api.tactics.execution, { weekStart, today });
  useQuery(api.habits.today, { date: today });
  useQuery(api.content.today, { date: today });
  useQuery(api.today.challengesToday, { date: today });
  useQuery(api.finance.today, { date: today });
  // Core lists used across many pages
  useQuery(api.lifeAreas.list, {});
  useQuery(api.tasks.list, {});
  useQuery(api.projects.list, {});
  useQuery(api.sections.list, {});
  useQuery(api.settings.get, {});
  useQuery(api.goals.list, {});
  useQuery(api.tasks.lookups, { date: today });
  useQuery(api.focus.taskTotals, {});
  useQuery(api.projects.board, { weekStartMs: dateOf(weekStart).getTime(), weekEndMs: dateOf(addDaysYmd(weekStart, 7)).getTime() });
  // Inbox
  useQuery(api.inbox.list, { now: now1, view: "open" });
  useQuery(api.inbox.counts, { now: now1 });
  // Direction
  useQuery(api.cycles.cockpit, { today });
  useQuery(api.weekPlans.week, { weekStart, today, tz });
  useQuery(api.habits.board, { today });
  useQuery(api.routines.list, { today });
  useQuery(api.compass.get, {});
  useQuery(api.compass.ratings, { period: month });
  useQuery(api.idealWeek.get, {});
  useQuery(api.periodicReviews.hub, { today });
  useQuery(api.cycles.suggestStart, { today });
  useQuery(api.cycles.current, { today });
  // Journal month grid (same window as app/(app)/journal at offset 0)
  useQuery(api.days.range, { from: addDaysYmd(`${month}-01`, -60), to: addDaysYmd(`${shiftMonth(month, 1)}-01`, -1) });
  // Work
  useQuery(api.focus.week, { weekStartMs: dateOf(weekStart).getTime(), todayStartMs: day.dayStart });
  useQuery(api.weekPlans.hoursByArea, { weekStart, tz });
  useQuery(api.focus.list, {});
  useQuery(api.momentum.wins, { today, tz, rangeDays: 30 });
  useQuery(api.challenges.list, {});
  useQuery(api.schedule.range, { startDate: weekStart, endDate: weekEnd });
  useQuery(api.schedule.analytics, { startDate: weekStart, endDate: weekEnd, tz });
  useQuery(api.schedule.gapAnalysis, { startDate: weekStart, endDate: weekEnd, tz });
  // Founder
  useQuery(api.deals.list, { today });
  useQuery(api.deals.stats, { today });
  useQuery(api.people.list, { today });
  useQuery(api.commitments.list, {});
  useQuery(api.commitments.stats, { today });
  // Content + mind
  useQuery(api.content.list, {});
  useQuery(api.contentSystem.strategies, {});
  useQuery(api.content.listPillars, { today });
  useQuery(api.notes.list, {});
  useQuery(api.notes.titles, {});
  useQuery(api.notes.inbox, { now: now1 });
  useQuery(api.notes.suggestMaps, {});
  useQuery(api.learning.listAreasLite, {});
  useQuery(api.learning.listAreas, { date: today, now: now1 });
  useQuery(api.learning.weekSummary, { weekStart });
  useQuery(api.recall.dueCount, { now: now1 });
  useQuery(api.recall.queue, { now: now1, limit: 30 });
  useQuery(api.recall.stats, { now: now1, date: today, startOfToday: day.dayStart });
  useQuery(api.resources.list, {});
  useQuery(api.aiThreads.listThreads, {});
  // System
  useQuery(api.delegation.processes, {});
  useQuery(api.delegation.audit, { today });
  useQuery(api.insights.energy, { today, tzOffsetMin: tz });
  useQuery(api.insights.signals, { today, tzOffsetMin: tz });
  useQuery(api.insights.pulse, { today });
  // Founder group (args mirror each page exactly)
  const fw = weekWindow(today);
  useQuery(api.founder.hq, { today, weekStart: fw.weekStart, from: fw.from, to: fw.to });
  useQuery(api.finance.summary, { today });
  useQuery(api.finance.meta, {});
  useQuery(api.people.customers, { today });
  useQuery(api.people.companies, {});
  useQuery(api.people.dueToReconnect, { today, limit: 12 });
  useQuery(api.people.outreachToday, { today });
  useQuery(api.deals.options, {});
  useQuery(api.offers.list, {});
  useQuery(api.offers.options, {});
  useQuery(api.campaigns.list, {});
  useQuery(api.scorecard.grid, { weeks: weekWindows(today, 13), includeInactive: false });
  useQuery(api.decisions.list, { today });
  useQuery(api.decisions.listIssues, {});
  // Inspiration
  useQuery(api.swipes.list, {});
  useQuery(api.swipes.stats, {});
  useQuery(api.contentSystem.watchlist, {});

  return null;
}

export function Warmup() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Start after the first page has painted, when the browser is idle.
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 2500 });
      return () => (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(t);
  }, []);
  if (!ready) return null;
  return (
    <Quiet>
      <Queries />
    </Quiet>
  );
}
