import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const DAY = 24 * 60 * 60 * 1000;
const ymd = (ts: number) => new Date(ts).toISOString().slice(0, 10);

/**
 * Populate every table with realistic dummy data for the single signed-up user.
 * Run once the test account exists:  npx convex run seed:run
 * Idempotent — it clears prior data for the user first.
 */
export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.query("users").first();
    if (!user) {
      throw new Error(
        "No user found. Sign up first (or run seed:ensureUser), then re-run seed:run.",
      );
    }
    const userId = user._id;
    const now = Date.now();

    // --- clear existing data (idempotent) ---
    const tables = [
      "aiMessages",
      "aiThreads",
      "aiMemories",
      "weeklyReviews",
      "dailyCheckIns",
      "habitCompletions",
      "habits",
      "focusSessions",
      "goals",
      "notes",
      "tasks",
      "projects",
      "sections",
      "lifeAreas",
    ] as const;
    for (const t of tables) {
      const rows = await ctx.db.query(t).collect();
      for (const r of rows) {
        // only wipe this user's rows where applicable
        if ("userId" in r && r.userId !== userId) continue;
        await ctx.db.delete(r._id);
      }
    }

    // --- life areas ---
    const areaDefs = [
      { name: "Business & Ventures", icon: "briefcase", color: "#22c55e" },
      { name: "Learning", icon: "book", color: "#84cc16" },
      { name: "Health & Fitness", icon: "heart", color: "#10b981" },
      { name: "Spirituality", icon: "moon", color: "#14b8a6" },
      { name: "Finance & Money", icon: "wallet", color: "#f59e0b" },
    ];
    const areas: Record<string, Id<"lifeAreas">> = {};
    let i = 0;
    for (const a of areaDefs) {
      areas[a.name] = await ctx.db.insert("lifeAreas", {
        userId,
        name: a.name,
        icon: a.icon,
        color: a.color,
        order: i++,
      });
    }

    // --- sections ---
    const sectionDefs: { area: string; name: string }[] = [
      { area: "Learning", name: "Copywriting" },
      { area: "Learning", name: "Quran" },
      { area: "Learning", name: "Sales" },
      { area: "Business & Ventures", name: "DevZelo" },
      { area: "Health & Fitness", name: "Gym" },
      { area: "Finance & Money", name: "Investing" },
    ];
    const sections: Record<string, Id<"sections">> = {};
    let si = 0;
    for (const s of sectionDefs) {
      sections[s.name] = await ctx.db.insert("sections", {
        userId,
        lifeAreaId: areas[s.area],
        name: s.name,
        order: si++,
      });
    }

    // --- projects ---
    const coachingApp = await ctx.db.insert("projects", {
      userId,
      title: "Launch Coaching App",
      description: "MVP for the 1:1 coaching platform.",
      status: "active",
      lifeAreaId: areas["Business & Ventures"],
      progress: 45,
    });
    const devzeloSite = await ctx.db.insert("projects", {
      userId,
      title: "DevZelo Website Revamp",
      description: "New marketing site for DevZelo.",
      status: "planning",
      lifeAreaId: areas["Business & Ventures"],
      progress: 10,
    });
    await ctx.db.insert("projects", {
      userId,
      title: "Master Copywriting",
      description: "Self-study program across 8 weeks.",
      status: "active",
      lifeAreaId: areas["Learning"],
      progress: 60,
    });

    // --- notes ---
    const note1 = await ctx.db.insert("notes", {
      userId,
      title: "Copywriting: AIDA framework",
      content:
        "Attention, Interest, Desire, Action.\n\nLead with a hook, build tension, then a single clear CTA.",
      lifeAreaId: areas["Learning"],
      sectionId: sections["Copywriting"],
      tags: ["copywriting", "framework"],
      linkedProjectIds: [coachingApp],
    });
    await ctx.db.insert("notes", {
      userId,
      title: "Quran reflection — Surah Al-Asr",
      content:
        "Time is the asset. Those who lose are those who don't act on truth and patience.",
      lifeAreaId: areas["Spirituality"],
      tags: ["quran", "reflection"],
    });
    await ctx.db.insert("notes", {
      userId,
      title: "DevZelo positioning ideas",
      content: "We build fast, founder-friendly software. Lead with speed + design quality.",
      lifeAreaId: areas["Business & Ventures"],
      sectionId: sections["DevZelo"],
      tags: ["business", "branding"],
      linkedNoteIds: [note1],
    });

    // --- goals ---
    await ctx.db.insert("goals", {
      userId,
      title: "Master copywriting fundamentals",
      description: "Be able to write a full sales page confidently.",
      lifeAreaId: areas["Learning"],
      sectionId: sections["Copywriting"],
      timeframe: "monthly",
      tags: ["learning"],
      deadline: now + 20 * DAY,
      milestones: [
        { text: "Finish AIDA + PAS frameworks", done: true },
        { text: "Write 5 practice headlines daily", done: true },
        { text: "Draft one full sales page", done: false },
      ],
      progress: 66,
    });
    await ctx.db.insert("goals", {
      userId,
      title: "Launch coaching app MVP",
      lifeAreaId: areas["Business & Ventures"],
      projectId: coachingApp,
      timeframe: "yearly",
      tags: ["business"],
      deadline: now + 60 * DAY,
      milestones: [
        { text: "Finish onboarding flow", done: true },
        { text: "Payment integration", done: false },
      ],
      progress: 40,
    });
    await ctx.db.insert("goals", {
      userId,
      title: "Read 10 Quran chapters this month",
      lifeAreaId: areas["Spirituality"],
      timeframe: "monthly",
      tags: ["deen"],
      deadline: now + 18 * DAY,
      milestones: [{ text: "5 chapters", done: true }],
      progress: 50,
    });

    // --- tasks (spanning last week, this week, next week) ---
    const taskDefs = [
      { title: "Write sales page draft for coaching app", area: "Business & Ventures", section: undefined, project: coachingApp, status: "in_progress" as const, priority: "high" as const, due: 1, doneAgo: 0 },
      { title: "Practice 5 headlines", area: "Learning", section: "Copywriting", project: undefined, status: "not_started" as const, priority: "med" as const, due: 0, doneAgo: 0 },
      { title: "Read Surah Al-Mulk", area: "Spirituality", section: undefined, project: undefined, status: "not_started" as const, priority: "high" as const, due: 0, doneAgo: 0 },
      { title: "Review DevZelo wireframes", area: "Business & Ventures", section: "DevZelo", project: devzeloSite, status: "not_started" as const, priority: "low" as const, due: 3, doneAgo: 0 },
      { title: "Track monthly expenses", area: "Finance & Money", section: "Investing", project: undefined, status: "not_started" as const, priority: "med" as const, due: 5, doneAgo: 0 },
      { title: "Outline coaching app onboarding", area: "Business & Ventures", section: undefined, project: coachingApp, status: "not_started" as const, priority: "med" as const, due: 8, doneAgo: 0 },
      { title: "Draft 2 cold emails", area: "Learning", section: "Sales", project: undefined, status: "not_started" as const, priority: "med" as const, due: 9, doneAgo: 0 },
      { title: "Gym — push day", area: "Health & Fitness", section: "Gym", project: undefined, status: "done" as const, priority: "med" as const, due: -1, doneAgo: 1 },
      { title: "Finish AIDA module", area: "Learning", section: "Copywriting", project: undefined, status: "done" as const, priority: "high" as const, due: -2, doneAgo: 2 },
      { title: "Set up sprint workspace", area: "Business & Ventures", section: undefined, project: coachingApp, status: "done" as const, priority: "med" as const, due: -8, doneAgo: 8 },
      { title: "Read 3 Quran pages", area: "Spirituality", section: undefined, project: undefined, status: "done" as const, priority: "low" as const, due: -9, doneAgo: 9 },
      { title: "Leg day workout", area: "Health & Fitness", section: "Gym", project: undefined, status: "done" as const, priority: "med" as const, due: -10, doneAgo: 10 },
    ];
    const taskIds: Id<"tasks">[] = [];
    for (const t of taskDefs) {
      const id = await ctx.db.insert("tasks", {
        userId,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: now + t.due * DAY,
        completedAt: t.status === "done" ? now - t.doneAgo * DAY : undefined,
        lifeAreaId: areas[t.area],
        sectionId: t.section ? sections[t.section] : undefined,
        projectId: t.project,
      });
      taskIds.push(id);
    }

    // --- focus sessions (last 14 days, varied areas, some per-task) ---
    const focusAreaIds = [
      areas["Business & Ventures"],
      areas["Learning"],
      areas["Health & Fitness"],
      areas["Spirituality"],
    ];
    for (let d = 0; d < 14; d++) {
      const count = d % 3 === 0 ? 2 : 1;
      for (let k = 0; k < count; k++) {
        const start = now - d * DAY - (9 + k * 3) * 60 * 60 * 1000;
        const dur = (25 + ((d + k) % 3) * 15) * 60;
        await ctx.db.insert("focusSessions", {
          userId,
          startTime: start,
          endTime: start + dur * 1000,
          duration: dur,
          lifeAreaId: focusAreaIds[(d + k) % focusAreaIds.length],
          taskId: (d + k) % 2 === 0 ? taskIds[(d + k) % taskIds.length] : undefined,
          projectId: (d + k) % 3 === 0 ? coachingApp : undefined,
        });
      }
    }

    // --- habits ---
    const habitStudy = await ctx.db.insert("habits", {
      userId,
      title: "Study 30 min Copywriting",
      description: "Daily deliberate practice.",
      frequency: "daily",
      target: "30 min",
      lifeAreaId: areas["Learning"],
      sectionId: sections["Copywriting"],
      streak: 4,
      lastCompletedAt: now - DAY,
    });
    const habitQuran = await ctx.db.insert("habits", {
      userId,
      title: "Read Quran",
      frequency: "daily",
      target: "1 page",
      lifeAreaId: areas["Spirituality"],
      streak: 7,
      lastCompletedAt: now,
    });
    await ctx.db.insert("habits", {
      userId,
      title: "Write 2 sales emails",
      frequency: "weekly",
      target: "2 emails",
      lifeAreaId: areas["Learning"],
      sectionId: sections["Sales"],
      streak: 2,
    });

    // --- habit completions (last 21 days, with realistic gaps) ---
    for (let d = 0; d < 21; d++) {
      if (d % 5 !== 0) await ctx.db.insert("habitCompletions", { userId, habitId: habitStudy, date: ymd(now - d * DAY) });
      if (d % 7 !== 2) await ctx.db.insert("habitCompletions", { userId, habitId: habitQuran, date: ymd(now - d * DAY) });
    }

    // --- daily check-ins (last 12 days) ---
    for (let d = 0; d < 12; d++) {
      await ctx.db.insert("dailyCheckIns", {
        userId,
        date: ymd(now - d * DAY),
        energyMood: 5 + ((d * 3) % 5),
        priorities: ["Sales page", "Gym", "Quran"].slice(0, 1 + (d % 3)),
        blockers: d % 4 === 0 ? ["Low energy after lunch"] : [],
        adaptiveAnswers: { focusedArea: "Copywriting" },
      });
    }

    // --- weekly review for LAST week (aligned to Sunday so it loads when navigating) ---
    const lw = new Date(now);
    lw.setHours(0, 0, 0, 0);
    lw.setDate(lw.getDate() - lw.getDay() - 7);
    await ctx.db.insert("weeklyReviews", {
      userId,
      weekStart: ymd(lw.getTime()),
      weekEnd: ymd(lw.getTime() + 6 * DAY),
      content: {
        aiInsights:
          "## What went well\nStrong copywriting momentum and the coaching-app sprint kicked off.\n\n## Plan for next week\n- Ship the sales page draft\n- 3× 25-min focus blocks before noon\n- Keep the Quran streak alive",
      },
      userNotes: "Felt good. Want more focus on Finance next week.",
    });

    // --- AI thread + messages ---
    const thread = await ctx.db.insert("aiThreads", { userId, title: "What's going on in my life?" });
    await ctx.db.insert("aiMessages", {
      userId,
      threadId: thread,
      role: "user",
      content: "What's going on in my life right now?",
    });
    await ctx.db.insert("aiMessages", {
      userId,
      threadId: thread,
      role: "assistant",
      content:
        "You're mid-sprint on the Coaching App (45%) with the sales page as today's high-priority task. Copywriting goal is 66% — keep the daily practice streak (4 days). Quran streak is strong at 7. Focus this week: 24.9h. Suggestion: write the sales page before noon when your focus peaks.",
    });

    // --- AI memories ---
    await ctx.db.insert("aiMemories", {
      userId,
      type: "style",
      content: "Bish writes directly and practically, prefers short punchy sentences.",
    });
    await ctx.db.insert("aiMemories", {
      userId,
      type: "context",
      content: "Building DevZelo (software company) with a friend; aiming to become a polymath.",
    });

    return { ok: true, userId, areas: Object.keys(areas).length };
  },
});
