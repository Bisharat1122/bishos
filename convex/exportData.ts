import { query } from "./_generated/server";
import { requireUser } from "./helpers";

/**
 * Full data export (JSON) — the anti lock-in guarantee. Every user-owned table
 * except auth and push secrets. Single-user app, so a scan per table is fine.
 */
const TABLES = [
  "lifeAreas", "sections", "tasks", "projects", "notes", "goals", "focusSessions", "habits",
  "habitCompletions", "dailyCheckIns", "weeklyReviews", "aiThreads", "aiMessages", "aiMemories",
  "dailyFlow", "profiles", "scheduleBlocks", "momentum", "challenges", "challengeSections",
  "challengeGoals", "challengeKpiDefs", "challengeDays", "challengeKpiValues", "challengeDayHabits",
  "inbox", "days", "xpLedger", "userSettings", "compass", "areaRatings", "cycles", "tactics",
  "tacticLogs", "weekPlans", "idealWeek", "routines", "routineRuns", "periodicReviews",
  "companies", "people", "interactions", "deals", "commitments", "metrics", "metricEntries",
  "offers", "campaigns", "contentPillars", "contentPieces", "swipes", "hooks", "decisions",
  "issues", "learningAreas", "skillNodes", "practiceSessions", "resources", "recallCards",
  "recallLogs", "timeAudit", "processes", "contentStrategy", "creatorWatch",
  "finAccounts", "finCategories", "finTransactions", "finBudgets", "finRecurring", "finInvoices", "finGoals",
] as const;

export const all = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const out: Record<string, unknown[]> = {};
    for (const t of TABLES) {
      out[t] = await ctx.db
        .query(t)
        .filter((q) => q.eq(q.field("userId"), userId))
        .collect();
    }
    return { exportedAt: Date.now(), app: "bishOS", version: 2, tables: out };
  },
});
