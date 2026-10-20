import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * bishOS schema — single-user "Second Brain + Life OS".
 * authTables provides `users`, `authSessions`, etc. from @convex-dev/auth.
 * Relationship spine: lifeArea -> section -> {tasks, notes, projects, goals}.
 */
export default defineSchema({
  ...authTables,

  lifeAreas: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.number(),
    // Life OS: what "maintained" means for this area (GTD Area standard).
    standard: v.optional(v.string()),
    // Weekly time budget for the area (hours) → target vs actual by domain.
    weeklyHoursTarget: v.optional(v.number()),
    kind: v.optional(v.union(v.literal("business"), v.literal("personal"))),
    archived: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  sections: defineTable({
    userId: v.id("users"),
    lifeAreaId: v.id("lifeAreas"),
    name: v.string(),
    order: v.number(),
  })
    .index("by_lifeArea", ["lifeAreaId"])
    .index("by_user", ["userId"]),

  tasks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("done"),
    ),
    priority: v.union(v.literal("low"), v.literal("med"), v.literal("high")),
    // The end/due moment (date + time). Doubles as the deadline.
    dueDate: v.optional(v.number()),
    // Optional scheduled start (date + time). With dueDate as the end, the task
    // shows on the Schedule timeline and Calendar at that exact window.
    startAt: v.optional(v.number()),
    // Deprecated: superseded by dueDate (end = due). Kept optional so existing
    // production docs that still carry it validate; no longer written/read.
    endAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    lifeAreaId: v.id("lifeAreas"),
    sectionId: v.optional(v.id("sections")),
    projectId: v.optional(v.id("projects")),
    // Challenge module links (all optional, additive). A task belongs to a
    // challenge, one of its sections, and one of its days.
    challengeId: v.optional(v.id("challenges")),
    challengeSectionId: v.optional(v.id("challengeSections")),
    challengeDayId: v.optional(v.id("challengeDays")),
    linkedNoteIds: v.optional(v.array(v.id("notes"))),
    tags: v.optional(v.array(v.string())),
    // ── Life OS fields (all optional, additive) ──
    // "When" — the local day you plan to work on it (YYYY-MM-DD). Separate
    // from dueDate (the real deadline), like Things 3.
    plannedFor: v.optional(v.string()),
    someday: v.optional(v.boolean()),
    estimateMin: v.optional(v.number()),
    energy: v.optional(v.union(v.literal("high"), v.literal("med"), v.literal("low"))),
    context: v.optional(v.string()), // "calls" | "computer" | "errands" | free text
    goalId: v.optional(v.id("goals")),
    tacticId: v.optional(v.id("tactics")),
    dealId: v.optional(v.id("deals")),
    personId: v.optional(v.id("people")),
    contentId: v.optional(v.id("contentPieces")),
    learningAreaId: v.optional(v.id("learningAreas")),
    delegate: v.optional(v.boolean()), // marked "should not be me" → SOP prompt
    deferCount: v.optional(v.number()), // times rolled/deferred (stale filter)
    // Manual ordering within a Kanban column (higher = nearer the top).
    // New tasks get a large value so they land on top; drag-reorder rewrites it.
    order: v.optional(v.number()),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          name: v.string(),
          contentType: v.string(),
          size: v.number(),
        }),
      ),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_lifeArea", ["lifeAreaId"])
    .index("by_section", ["sectionId"])
    .index("by_project", ["projectId"])
    .index("by_challenge", ["challengeId"])
    .index("by_challengeDay", ["challengeDayId"])
    .index("by_status", ["userId", "status"])
    .index("by_dueDate", ["userId", "dueDate"])
    .index("by_plannedFor", ["userId", "plannedFor"])
    .index("by_goal", ["goalId"])
    .index("by_deal", ["dealId"]),

  projects: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("blocked"),
      v.literal("completed"),
    ),
    lifeAreaId: v.id("lifeAreas"),
    progress: v.number(), // 0-100
    // A challenge can contain projects (optional, additive).
    challengeId: v.optional(v.id("challenges")),
    // "standard" (default) or "sprint" (time-boxed). Missing => standard.
    kind: v.optional(v.union(v.literal("standard"), v.literal("sprint"))),
    // sprint-only fields
    outcome: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    durationDays: v.optional(v.number()),
    milestones: v.optional(v.array(v.object({ text: v.string(), done: v.boolean() }))),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          name: v.string(),
          contentType: v.string(),
          size: v.number(),
          text: v.optional(v.string()), // extracted PDF text (AI-readable)
        }),
      ),
    ),
    aiPlan: v.optional(v.string()),
    // Life OS: a project serves at most one goal; client delivery projects
    // link back to the won deal / customer company.
    goalId: v.optional(v.id("goals")),
    dealId: v.optional(v.id("deals")),
    companyId: v.optional(v.id("companies")),
    // Sprint Command Center: extra life areas this sprint spans (primary stays
    // in lifeAreaId), and the editable Now/30/60/90 plan matrix per area.
    areaIds: v.optional(v.array(v.id("lifeAreas"))),
    planGrid: v.optional(
      v.array(
        v.object({
          areaId: v.id("lifeAreas"),
          now: v.string(),
          d30: v.string(),
          d60: v.string(),
          d90: v.string(),
          status: v.optional(v.string()),
        }),
      ),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_lifeArea", ["lifeAreaId"])
    .index("by_challenge", ["challengeId"]),

  notes: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(), // markdown
    lifeAreaId: v.optional(v.id("lifeAreas")),
    sectionId: v.optional(v.id("sections")),
    tags: v.optional(v.array(v.string())),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          name: v.string(),
          contentType: v.string(),
          size: v.number(),
        }),
      ),
    ),
    linkedNoteIds: v.optional(v.array(v.id("notes"))),
    linkedProjectIds: v.optional(v.array(v.id("projects"))),
    linkedGoalIds: v.optional(v.array(v.id("goals"))),
    linkedChallengeIds: v.optional(v.array(v.id("challenges"))),
    // ── Life OS knowledge fields ──
    noteType: v.optional(
      v.union(
        v.literal("fleeting"),
        v.literal("source"),
        v.literal("idea"),
        v.literal("map"),
        v.literal("project"),
        v.literal("daily"),
      ),
    ),
    // Zettelkasten: every link states WHY the two notes connect.
    linkReasons: v.optional(v.array(v.object({ noteId: v.id("notes"), reason: v.string() }))),
    noteStatus: v.optional(v.union(v.literal("inbox"), v.literal("processed"), v.literal("evergreen"))),
    summary: v.optional(v.string()), // progressive summarization top layer
    resourceId: v.optional(v.id("resources")),
    learningAreaId: v.optional(v.id("learningAreas")),
    madePublic: v.optional(v.boolean()), // turned into a content seed
    // Light "review mode" (title → recall → reveal) bookkeeping.
    lastReviewedAt: v.optional(v.number()),
    reviewHard: v.optional(v.boolean()), // last self-rating was "hard" → resurfaces sooner
  })
    .index("by_user", ["userId"])
    .index("by_lifeArea", ["lifeAreaId"])
    .index("by_section", ["sectionId"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["userId", "lifeAreaId"],
    }),

  goals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    lifeAreaId: v.id("lifeAreas"),
    sectionId: v.optional(v.id("sections")),
    projectId: v.optional(v.id("projects")),
    challengeId: v.optional(v.id("challenges")),
    timeframe: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly"),
      v.literal("custom"),
    ),
    tags: v.optional(v.array(v.string())),
    deadline: v.optional(v.number()),
    milestones: v.array(v.object({ text: v.string(), done: v.boolean() })),
    progress: v.number(), // 0-100
    // SMART framework fields
    smart: v.optional(
      v.object({
        specific: v.optional(v.string()),
        measurable: v.optional(v.string()),
        achievable: v.optional(v.string()),
        relevant: v.optional(v.string()),
        timeBound: v.optional(v.string()),
      }),
    ),
    // optional quantitative target — drives progress when set
    metric: v.optional(
      v.object({ current: v.number(), target: v.number(), unit: v.string() }),
    ),
    // ── Life OS goal model (12 Week Year + Full Focus + OKR) ──
    // level: "annual" (≤8/yr backlog) or "cycle" (12-week, ≤3 active).
    level: v.optional(v.union(v.literal("annual"), v.literal("cycle"))),
    cycleId: v.optional(v.id("cycles")),
    parentGoalId: v.optional(v.id("goals")), // cycle goal → its annual goal
    goalType: v.optional(v.union(v.literal("outcome"), v.literal("learning"))),
    goalStatus: v.optional(
      v.union(v.literal("active"), v.literal("backlog"), v.literal("achieved"), v.literal("dropped")),
    ),
    reasons: v.optional(v.array(v.string())), // ranked "why this matters"
    // Lag measures (outcomes) — graded 0–1 at cycle end.
    keyResults: v.optional(
      v.array(v.object({ title: v.string(), current: v.number(), target: v.number(), unit: v.string() })),
    ),
    woop: v.optional(
      v.object({
        wish: v.optional(v.string()),
        outcome: v.optional(v.string()),
        obstacle: v.optional(v.string()),
        plan: v.optional(v.string()),
      }),
    ),
    grade: v.optional(v.number()), // 0–1 final grade
  })
    .index("by_user", ["userId"])
    .index("by_lifeArea", ["lifeAreaId"])
    .index("by_project", ["projectId"])
    .index("by_challenge", ["challengeId"])
    .index("by_cycle", ["cycleId"]),

  focusSessions: defineTable({
    userId: v.id("users"),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(), // seconds
    taskId: v.optional(v.id("tasks")),
    projectId: v.optional(v.id("projects")),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    sectionId: v.optional(v.id("sections")),
    challengeId: v.optional(v.id("challenges")),
    // Life OS: deep "maker" work vs shallow "manager" work (Paul Graham).
    // Missing = not marked.
    blockType: v.optional(v.union(v.literal("maker"), v.literal("manager"))),
  })
    .index("by_user", ["userId"])
    .index("by_lifeArea", ["lifeAreaId"])
    .index("by_task", ["taskId"])
    .index("by_challenge", ["challengeId"]),

  habits: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("custom"),
    ),
    target: v.optional(v.string()),
    lifeAreaId: v.id("lifeAreas"),
    sectionId: v.optional(v.id("sections")),
    projectId: v.optional(v.id("projects")), // linked sprint (Command Center)
    challengeId: v.optional(v.id("challenges")), // linked challenge
    streak: v.number(),
    lastCompletedAt: v.optional(v.number()),
    // ── Life OS habit design (Atomic Habits + Tiny Habits + reserves) ──
    anchor: v.optional(v.string()), // if-then cue: "After I pour my coffee…"
    minVersion: v.optional(v.string()), // 2-minute version for bad days
    stretchVersion: v.optional(v.string()),
    weeklyTarget: v.optional(v.number()), // e.g. 5 of 7 (default 7 for daily)
    reserveSkips: v.optional(v.number()), // planned skips per week (default 2)
    goalId: v.optional(v.id("goals")), // habit as a 12-week lead measure
    habitStatus: v.optional(
      v.union(v.literal("active"), v.literal("queued"), v.literal("graduated"), v.literal("archived")),
    ),
    startedOn: v.optional(v.string()), // YYYY-MM-DD → day 30/60/90 checks
    automaticity: v.optional(v.array(v.object({ day: v.number(), score: v.number() }))),
    timeOfDay: v.optional(v.union(v.literal("morning"), v.literal("afternoon"), v.literal("evening"), v.literal("any"))),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_challenge", ["challengeId"]),

  habitCompletions: defineTable({
    userId: v.id("users"),
    habitId: v.id("habits"),
    date: v.string(), // YYYY-MM-DD
    // Missing kind = "done". "skip" = planned reserve skip (keeps the streak).
    kind: v.optional(v.union(v.literal("done"), v.literal("min"), v.literal("stretch"), v.literal("skip"))),
    repaired: v.optional(v.boolean()), // back-filled within the 48h repair window
  })
    .index("by_habit", ["habitId"])
    .index("by_date", ["userId", "date"]),

  dailyCheckIns: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    energyMood: v.number(), // 1-10
    priorities: v.array(v.string()), // selected task titles (readable)
    priorityTaskIds: v.optional(v.array(v.id("tasks"))), // links to the chosen tasks
    blockers: v.array(v.string()),
    adaptiveAnswers: v.optional(v.any()),
    challengeId: v.optional(v.id("challenges")), // optional challenge scope
  }).index("by_date", ["userId", "date"]),

  weeklyReviews: defineTable({
    userId: v.id("users"),
    weekStart: v.string(), // YYYY-MM-DD
    weekEnd: v.string(),
    content: v.any(), // assembled sections A-H + AI insights
    userNotes: v.optional(v.string()),
  }).index("by_weekStart", ["userId", "weekStart"]),

  aiThreads: defineTable({
    userId: v.id("users"),
    title: v.string(),
    contextRefs: v.optional(v.array(v.any())), // /add targets
    // per-conversation AI model override (keys map to MODELS in openrouter.ts).
    // "openrouter" = Nemotron (legacy value, kept for back-compat).
    // "perplexity" is retired and no longer selectable, but the literal stays
    // here so existing threads that stored it still validate; those threads now
    // fall back to Nemotron at runtime (see aiConfig).
    provider: v.optional(
      v.union(
        v.literal("openrouter"),
        v.literal("gpt-oss"),
        v.literal("owl"),
        v.literal("hy3"),
        v.literal("perplexity"),
      ),
    ),
    // Set for the per-module agentic AI windows ("goals" | "tasks" | "notes" …).
    // Absent on the main /chat thread. Challenge coach threads use the key
    // `challenge:<id>` and also set challengeId below.
    moduleKey: v.optional(v.string()),
    // The specific challenge a challenge-coach thread is scoped to.
    challengeId: v.optional(v.id("challenges")),
  })
    .index("by_user", ["userId"])
    .index("by_module", ["userId", "moduleKey"]),

  aiMessages: defineTable({
    userId: v.id("users"),
    threadId: v.id("aiThreads"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    streaming: v.optional(v.boolean()),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          name: v.string(),
          contentType: v.string(),
        }),
      ),
    ),
    // Agentic actions proposed by the AI (confirm-before-write). Each is a
    // tool call the user can approve/cancel from the chat.
    actions: v.optional(
      v.array(
        v.object({
          tool: v.string(), // "createGoal" | "addMilestones" | "updateGoal" | …
          args: v.any(),
          label: v.string(), // human summary shown on the confirm card
          status: v.union(
            v.literal("pending"),
            v.literal("done"),
            v.literal("cancelled"),
            v.literal("failed"),
          ),
          result: v.optional(v.string()), // doc id or error message
        }),
      ),
    ),
  }).index("by_thread", ["threadId"]),

  aiMemories: defineTable({
    userId: v.id("users"),
    type: v.string(),
    content: v.string(),
    relatedIds: v.optional(v.array(v.string())),
  }).index("by_type", ["userId", "type"]),

  // "Daily Flow" — the guided daily ritual (Morning Start + Evening Shutdown).
  // One doc per day; `done` holds the keys of completed/skipped steps.
  dailyFlow: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD (client-local)
    done: v.array(v.string()),
  }).index("by_date", ["userId", "date"]),

  // Single-user profile — also feeds the AI chat so it knows who Bish is.
  profiles: defineTable({
    userId: v.id("users"),
    name: v.optional(v.string()),
    city: v.optional(v.string()),
    occupation: v.optional(v.string()), // what he's doing / role
    business: v.optional(v.string()),
    situation: v.optional(v.string()), // current situation
    about: v.optional(v.string()), // detailed multi-paragraph bio
    preferences: v.optional(v.string()), // preferences / needs / how AI should help
    avatarId: v.optional(v.id("_storage")),
  }).index("by_user", ["userId"]),

  // Notifications are computed on the fly from deadlines/streaks/reminders.
  // This table only records which computed alerts the user has dismissed
  // (keyed by a stable notification key).
  dismissedNotifications: defineTable({
    userId: v.id("users"),
    key: v.string(),
    dismissedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Schedule — clock-timed plan blocks, interlinked with task/project/goal/area.
  // Recurring series are materialized (one row per occurrence, shared seriesId).
  // Completing a block auto-logs a focusSession (focusSessionId links them).
  scheduleBlocks: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD (the occurrence's day)
    startMin: v.number(), // minutes from midnight
    endMin: v.number(),
    title: v.string(),
    status: v.union(v.literal("planned"), v.literal("done"), v.literal("skipped")),
    // interlinks (all optional)
    taskId: v.optional(v.id("tasks")),
    projectId: v.optional(v.id("projects")),
    goalId: v.optional(v.id("goals")),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    sectionId: v.optional(v.id("sections")),
    color: v.optional(v.string()),
    notes: v.optional(v.string()),
    // recurrence (materialized occurrences share a seriesId)
    seriesId: v.optional(v.string()),
    recurrence: v.optional(v.union(v.literal("daily"), v.literal("weekly"))),
    // set when the block is marked done and auto-logged as focus
    focusSessionId: v.optional(v.id("focusSessions")),
    // Life OS: maker (deep, half-day) vs manager (calls/office hours) etc.
    blockType: v.optional(
      v.union(
        v.literal("maker"),
        v.literal("manager"),
        v.literal("admin"),
        v.literal("routine"),
        v.literal("free"),
      ),
    ),
    fromTemplate: v.optional(v.boolean()), // created by "apply Ideal Week"
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  // "Momentum" — manually-curated log of things that moved the needle.
  // Repeatable: the same item can be logged many times (each a distinct moment).
  // titleSnapshot preserves a readable label even if the source item is gone.
  momentum: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("task"),
      v.literal("goal"),
      v.literal("project"),
      v.literal("note"),
      v.literal("habit"),
      v.literal("lifeArea"),
      v.literal("section"),
      v.literal("challenge"),
      // Life OS "Wins": a free-text win not tied to one item.
      v.literal("win"),
    ),
    itemId: v.string(),
    titleSnapshot: v.string(),
    why: v.optional(v.string()),
    impact: v.number(), // 1–5
    createdAt: v.number(),
    // Optional Life Area the win belongs to (free-text wins → area hub).
    lifeAreaId: v.optional(v.id("lifeAreas")),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),

  // Web Push subscriptions (one per browser/device). Used to deliver native
  // desktop notifications at task start/end times even when no tab is open.
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  // Dedup ledger so a given task-start/-end event is pushed at most once.
  // Key embeds the timestamp (`task-start-<id>-<startAt>`) so rescheduling
  // a task re-arms a fresh notification.
  sentPushes: defineTable({
    userId: v.id("users"),
    key: v.string(),
    sentAt: v.number(),
  }).index("by_key", ["key"]),

  // Singleton scan cursor — the push cron only fires for times crossing
  // (lastScanAt, now], so enabling never backfires on past-due tasks.
  pushState: defineTable({
    lastScanAt: v.number(),
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // Challenge module (v2) — a section + day-journal workspace.
  // A challenge has fixed SECTIONS (each with a syllabus, goals, KPI defs).
  // DAYS are freeform + named (like ChatGPT sessions). A day holds tasks
  // (reused global `tasks` tagged with section+day), per-day KPI values, and
  // per-day habit checks. Tasks & habits reuse the global modules; focus time
  // rolls up through the task. See specs/2026-07-23-challenge-module.md.
  // ─────────────────────────────────────────────────────────────────────────
  challenges: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    outcome: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("archived")),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    primaryLifeAreaId: v.optional(v.id("lifeAreas")),
    startDate: v.optional(v.number()),
    order: v.optional(v.number()),
    pinned: v.optional(v.boolean()),
    // Life OS: the 12-week goal this challenge serves (optional link).
    goalId: v.optional(v.id("goals")),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  challengeSections: defineTable({
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.number(),
    syllabus: v.optional(v.string()), // markdown reference for the section
  }).index("by_challenge", ["challengeId"]),

  challengeGoals: defineTable({
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    sectionId: v.id("challengeSections"),
    title: v.string(),
    done: v.boolean(),
    order: v.number(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_section", ["sectionId"]),

  challengeKpiDefs: defineTable({
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    sectionId: v.id("challengeSections"),
    name: v.string(),
    type: v.union(v.literal("number"), v.literal("checkbox"), v.literal("text")),
    unit: v.optional(v.string()),
    target: v.optional(v.number()), // daily target for number KPIs
    order: v.number(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_section", ["sectionId"]),

  challengeDays: defineTable({
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    name: v.string(),
    date: v.string(), // YYYY-MM-DD (defaults to today, editable)
    order: v.number(),
    note: v.optional(v.string()),
    // End-of-day journaling on the Overview tab.
    journal: v.optional(
      v.object({
        good: v.optional(v.string()),
        bad: v.optional(v.string()),
        improve: v.optional(v.string()),
        lessons: v.optional(v.string()),
        energy: v.optional(v.number()), // 1-5
      }),
    ),
    // Health tracker fields (per day).
    health: v.optional(
      v.object({
        sleepDuration: v.optional(v.number()), // hours
        timeAwake: v.optional(v.string()), // clock "HH:MM"
        timeInBed: v.optional(v.string()), // clock "HH:MM"
        deepRest: v.optional(v.number()), // Stage 3+ rest, hours
        perceivedEnergy: v.optional(v.number()), // percent
        cheatMeal: v.optional(v.boolean()),
      }),
    ),
  }).index("by_challenge", ["challengeId"]),

  challengeKpiValues: defineTable({
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    dayId: v.id("challengeDays"),
    sectionId: v.id("challengeSections"),
    kpiDefId: v.id("challengeKpiDefs"),
    num: v.optional(v.number()),
    bool: v.optional(v.boolean()),
    text: v.optional(v.string()),
  })
    .index("by_day", ["dayId"])
    .index("by_kpiDef", ["kpiDefId"])
    .index("by_challenge", ["challengeId"]),

  challengeDayHabits: defineTable({
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    dayId: v.id("challengeDays"),
    habitId: v.id("habits"),
    done: v.boolean(),
  })
    .index("by_day", ["dayId"])
    .index("by_challenge", ["challengeId"]),

  // ═════════════════════════════════════════════════════════════════════════
  // LIFE OS — see specs/2026-10-20-life-os.md for the full design.
  // Every table is single-user (userId) and indexed by_user.
  // `date` fields are client-LOCAL YYYY-MM-DD strings; `weekStart` is the
  // local Monday of that week (YYYY-MM-DD).
  // ═════════════════════════════════════════════════════════════════════════

  // ── Phase 1 · Daily loop ────────────────────────────────────────────────
  // Universal inbox: every capture lands here with no filing decision.
  inbox: defineTable({
    userId: v.id("users"),
    text: v.string(),
    source: v.optional(v.string()), // "quick" | "palette" | "voice" | "brain-dump" | "today" | "ai"
    status: v.union(v.literal("open"), v.literal("processed"), v.literal("snoozed"), v.literal("discarded")),
    snoozeUntil: v.optional(v.number()),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
    // What it became when processed ({ type: "task", id }).
    processedTo: v.optional(v.object({ type: v.string(), id: v.string() })),
    // AI/heuristic filing suggestion shown as one-tap chips.
    suggestion: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  // The Day page — the time hub. One doc per local day: morning start-up,
  // check-in, Top 3, if-then plan, evening shutdown, journal lines.
  days: defineTable({
    userId: v.id("users"),
    date: v.string(),
    dayType: v.optional(v.union(v.literal("focus"), v.literal("buffer"), v.literal("free"))),
    checkIn: v.optional(
      v.object({
        sleepHours: v.optional(v.number()),
        sleepQuality: v.optional(v.number()), // 1–5
        energy: v.optional(v.number()), // 1–5
        mood: v.optional(v.number()), // 1–5
        at: v.number(),
      }),
    ),
    top3: v.optional(v.array(v.id("tasks"))),
    dailyShape: v.optional(v.union(v.literal("big3"), v.literal("ivylee"), v.literal("135"))),
    intention: v.optional(v.string()), // one-line theme for the day
    ifThen: v.optional(v.object({ trigger: v.string(), response: v.string() })),
    capacityMin: v.optional(v.number()), // available focused minutes
    lowEnergy: v.optional(v.boolean()), // Top 1 + minimum habits mode
    startupAt: v.optional(v.number()),
    shutdownAt: v.optional(v.number()),
    resumeNote: v.optional(v.string()), // where I stopped / next step
    progressLine: v.optional(v.string()), // Amabile progress principle
    lesson: v.optional(v.string()),
    journal: v.optional(
      v.object({
        win: v.optional(v.string()),
        gratitude: v.optional(v.string()),
        hard: v.optional(v.string()),
        improve: v.optional(v.string()),
        free: v.optional(v.string()),
      }),
    ),
    dayScore: v.optional(v.number()), // 0–100 snapshot at shutdown
    // Monthly 3-question burnout pulse (WHO dimensions, 1–5 each; module E).
    // Not a validated instrument — an observation aid only.
    pulse: v.optional(
      v.object({
        exhaustion: v.number(), // 1 = rarely drained … 5 = constantly drained
        cynicism: v.number(), // 1 = engaged … 5 = detached/negative
        efficacy: v.number(), // 1 = not accomplishing … 5 = very effective
        at: v.number(),
      }),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  // XP ledger — every reward has a stable key so toggling can't farm XP and
  // undoing an action revokes it. Level = f(total XP).
  xpLedger: defineTable({
    userId: v.id("users"),
    key: v.string(),
    amount: v.number(),
    reason: v.string(),
    date: v.string(),
    at: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_key", ["userId", "key"]),

  // Per-user settings (single doc). All optional; code applies defaults.
  userSettings: defineTable({
    userId: v.id("users"),
    capacityMin: v.optional(v.number()), // default planned work/day (330 = 5.5h)
    outreachQuota: v.optional(v.number()), // daily sales touches target
    meetingsGoal: v.optional(v.number()), // "open to goal": stop when booked
    contentWeeklyTarget: v.optional(v.number()), // hub pieces / week
    maxActiveGoals: v.optional(v.number()), // default 3
    maxActiveProjects: v.optional(v.number()), // default 5
    maxNewHabits: v.optional(v.number()), // default 3
    annualIncome: v.optional(v.number()), // Buyback Rate input
    currency: v.optional(v.string()),
    freeWeekday: v.optional(v.number()), // 0=Sun … protected Free Day
    reviewWeekday: v.optional(v.number()), // default 5 (Friday)
    workHoursCap: v.optional(v.number()), // burnout flag threshold (default 55)
    celebrate: v.optional(v.boolean()), // confetti + XP toasts (default on)
    onboardedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  // ── Phase 2 · Direction & rhythm ────────────────────────────────────────
  // Compass: purpose, values, vision, not-to-do list, year theme (one doc).
  compass: defineTable({
    userId: v.id("users"),
    purpose: v.optional(v.string()),
    values: v.optional(v.array(v.string())),
    vision: v.optional(v.string()), // 3–5 year picture (markdown)
    visionByArea: v.optional(v.array(v.object({ lifeAreaId: v.id("lifeAreas"), text: v.string() }))),
    notToDo: v.optional(v.array(v.string())),
    yearTheme: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  // Wheel of Life ratings (monthly re-rate, 1–10).
  areaRatings: defineTable({
    userId: v.id("users"),
    lifeAreaId: v.id("lifeAreas"),
    period: v.string(), // YYYY-MM
    rating: v.number(),
    note: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_area", ["lifeAreaId"]),

  // 12-week cycles ("12 Week Year"). Week N = floor((today - start)/7)+1.
  cycles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    startDate: v.string(), // a Monday
    endDate: v.string(), // start + 83 days (Sunday of week 12)
    theme: v.optional(v.string()),
    status: v.union(v.literal("planned"), v.literal("active"), v.literal("done")),
  }).index("by_user", ["userId"]),

  // Lead measures for a goal: what you do each week (you control these).
  tactics: defineTable({
    userId: v.id("users"),
    goalId: v.id("goals"),
    title: v.string(),
    weeklyTarget: v.number(), // times per week
    ifThen: v.optional(v.string()),
    active: v.boolean(),
    order: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_goal", ["goalId"]),

  tacticLogs: defineTable({
    userId: v.id("users"),
    tacticId: v.id("tactics"),
    goalId: v.id("goals"),
    weekStart: v.string(),
    done: v.number(),
    target: v.number(), // snapshot of weeklyTarget for that week
  })
    .index("by_user", ["userId"])
    .index("by_tactic", ["tacticId"])
    .index("by_user_week", ["userId", "weekStart"]),

  // The week plan: Weekly Big 3 outcomes + scores (objectives, not a schedule).
  weekPlans: defineTable({
    userId: v.id("users"),
    weekStart: v.string(),
    big3: v.array(v.object({ text: v.string(), done: v.boolean(), goalId: v.optional(v.id("goals")) })),
    freeDay: v.optional(v.string()), // protected Free Day (YYYY-MM-DD)
    notes: v.optional(v.string()),
    executionScore: v.optional(v.number()), // 0–100 frozen at weekly review
    reviewedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_week", ["userId", "weekStart"]),

  // Ideal Week template (one doc): day types + template blocks per weekday.
  idealWeek: defineTable({
    userId: v.id("users"),
    days: v.array(
      v.object({
        weekday: v.number(), // 0=Sun … 6=Sat
        dayType: v.union(v.literal("focus"), v.literal("buffer"), v.literal("free")),
        theme: v.optional(v.string()),
      }),
    ),
    blocks: v.array(
      v.object({
        id: v.string(),
        weekday: v.number(),
        startMin: v.number(),
        endMin: v.number(),
        title: v.string(),
        blockType: v.union(
          v.literal("maker"),
          v.literal("manager"),
          v.literal("admin"),
          v.literal("routine"),
          v.literal("free"),
        ),
        lifeAreaId: v.optional(v.id("lifeAreas")),
      }),
    ),
  }).index("by_user", ["userId"]),

  // Routines: short checklists triggered by one anchor, tracked as one unit.
  routines: defineTable({
    userId: v.id("users"),
    name: v.string(),
    kind: v.union(
      v.literal("morning"),
      v.literal("startup"),
      v.literal("shutdown"),
      v.literal("evening"),
      v.literal("weekly"),
      v.literal("custom"),
    ),
    anchor: v.optional(v.string()),
    steps: v.array(v.object({ id: v.string(), text: v.string(), minutes: v.optional(v.number()), minimum: v.optional(v.boolean()) })),
    active: v.boolean(),
    order: v.number(),
  }).index("by_user", ["userId"]),

  routineRuns: defineTable({
    userId: v.id("users"),
    routineId: v.id("routines"),
    date: v.string(),
    doneStepIds: v.array(v.string()),
    completed: v.boolean(),
    minimum: v.optional(v.boolean()), // completed via the minimum version
    durationSec: v.optional(v.number()), // elapsed time in Run mode (module E)
    completedAt: v.optional(v.number()),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_routine", ["routineId"]),

  // Weekly / monthly / quarterly / annual reviews (resumable wizards).
  periodicReviews: defineTable({
    userId: v.id("users"),
    kind: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("annual")),
    periodKey: v.string(), // weekly: weekStart · monthly: YYYY-MM · quarterly: cycleId|YYYY-Qn · annual: YYYY
    periodStart: v.string(),
    periodEnd: v.string(),
    answers: v.any(), // { [stepKey]: string | string[] | number }
    stepsDone: v.optional(v.array(v.string())),
    scores: v.optional(v.any()), // frozen numbers (execution %, big3, habits…)
    aiDraft: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("done")),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_kind", ["userId", "kind", "periodKey"]),

  // ── Phase 3 · Founder engines ───────────────────────────────────────────
  companies: defineTable({
    userId: v.id("users"),
    name: v.string(),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    relationship: v.union(
      v.literal("prospect"),
      v.literal("customer"),
      v.literal("partner"),
      v.literal("past"),
      v.literal("other"),
    ),
    health: v.optional(v.union(v.literal("green"), v.literal("yellow"), v.literal("red"))),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // One Person record shared by pipeline, personal CRM, commitments, meetings.
  people: defineTable({
    userId: v.id("users"),
    name: v.string(),
    companyId: v.optional(v.id("companies")),
    title: v.optional(v.string()), // job title
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    social: v.optional(v.string()), // LinkedIn / X / IG url
    relation: v.union(
      v.literal("lead"),
      v.literal("customer"),
      v.literal("partner"),
      v.literal("investor"),
      v.literal("mentor"),
      v.literal("peer"),
      v.literal("friend"),
      v.literal("family"),
      v.literal("team"),
      v.literal("other"),
    ),
    tier: v.optional(v.union(v.literal("A"), v.literal("B"), v.literal("C"))),
    cadenceDays: v.optional(v.number()), // 7/30/90/182/365 → "due to reconnect"
    lastContactAt: v.optional(v.number()),
    lastContactDate: v.optional(v.string()), // B1: local YYYY-MM-DD of the last touch
    source: v.optional(v.string()), // channel they came from
    howMet: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_company", ["companyId"]),

  // Touches: calls, meetings, emails, DMs, outreach. Updates lastContactAt.
  interactions: defineTable({
    userId: v.id("users"),
    personId: v.optional(v.id("people")),
    companyId: v.optional(v.id("companies")),
    dealId: v.optional(v.id("deals")),
    kind: v.union(
      v.literal("outreach"),
      v.literal("followup"),
      v.literal("call"),
      v.literal("meeting"),
      v.literal("email"),
      v.literal("dm"),
      v.literal("note"),
    ),
    channel: v.optional(v.string()),
    summary: v.string(),
    date: v.string(), // local day (quota counting)
    at: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_person", ["personId"])
    .index("by_deal", ["dealId"]),

  // Founder-led sales pipeline. Every OPEN deal must carry a dated next step.
  deals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    personId: v.optional(v.id("people")),
    companyId: v.optional(v.id("companies")),
    offerId: v.optional(v.id("offers")),
    campaignId: v.optional(v.id("campaigns")),
    stage: v.union(
      v.literal("target"),
      v.literal("contacted"),
      v.literal("booked"),
      v.literal("discovery"),
      v.literal("proposal"),
      v.literal("verbal"),
      v.literal("won"),
      v.literal("lost"),
      v.literal("unqualified"),
    ),
    value: v.optional(v.number()),
    sourceChannel: v.optional(v.string()), // content | referral | outbound | inbound | network | ads | event | other
    nextStep: v.optional(v.string()),
    nextStepDate: v.optional(v.string()),
    stageChangedAt: v.number(),
    lastTouchAt: v.optional(v.number()),
    proposalSentAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    closedDate: v.optional(v.string()), // B1: local day it was won/lost (win rate, month value)
    bookedDate: v.optional(v.string()), // B1: local day it entered "booked" (meetings goal)
    lostReason: v.optional(v.string()),
    qualification: v.optional(
      v.object({
        pain: v.optional(v.string()),
        budget: v.optional(v.string()),
        decisionMaker: v.optional(v.string()),
        timeline: v.optional(v.string()),
      }),
    ),
    notes: v.optional(v.string()),
    projectId: v.optional(v.id("projects")), // delivery project created on win
    order: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_stage", ["userId", "stage"])
    .index("by_person", ["personId"])
    .index("by_company", ["companyId"]),

  // Commitments ledger: what I owe, and what others owe me ("waiting for").
  commitments: defineTable({
    userId: v.id("users"),
    title: v.string(),
    direction: v.union(v.literal("i_owe"), v.literal("owed_to_me")),
    personId: v.optional(v.id("people")),
    companyId: v.optional(v.id("companies")),
    dealId: v.optional(v.id("deals")),
    projectId: v.optional(v.id("projects")),
    source: v.optional(v.string()), // call | email | meeting | message | other
    promisedDate: v.optional(v.string()),
    checkDate: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("done"),
      v.literal("broken"),
      v.literal("renegotiated"),
      v.literal("cancelled"),
    ),
    doneAt: v.optional(v.number()),
    doneDate: v.optional(v.string()), // B1: local day it was kept (on-time check)
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_person", ["personId"]),

  // Scorecard: 5–10 weekly numbers (EOS). `auto` metrics are computed.
  metrics: defineTable({
    userId: v.id("users"),
    name: v.string(),
    unit: v.optional(v.string()),
    target: v.number(), // per week
    direction: v.union(v.literal("up"), v.literal("down")), // higher or lower is better
    auto: v.optional(v.string()), // "outreach" | "meetings" | "deals_won" | "revenue" | "content_published" | "focus_hours" | "tasks_done" | "recall_reviews"
    goalId: v.optional(v.id("goals")),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    owner: v.optional(v.string()), // "me" until the company layer
    order: v.number(),
    active: v.boolean(),
  }).index("by_user", ["userId"]),

  metricEntries: defineTable({
    userId: v.id("users"),
    metricId: v.id("metrics"),
    weekStart: v.string(),
    value: v.number(),
  })
    .index("by_metric", ["metricId"])
    .index("by_user_week", ["userId", "weekStart"]),

  // Offer creation (Hormozi value equation + MAGIC naming).
  offers: defineTable({
    userId: v.id("users"),
    name: v.string(),
    status: v.union(v.literal("draft"), v.literal("testing"), v.literal("live"), v.literal("retired")),
    icp: v.optional(v.string()), // who it is for
    problem: v.optional(v.string()),
    dreamOutcome: v.optional(v.string()),
    proof: v.optional(v.string()), // perceived likelihood of achievement
    timeToResult: v.optional(v.string()),
    effortRemoved: v.optional(v.string()),
    scores: v.optional(
      v.object({ dream: v.number(), likelihood: v.number(), time: v.number(), effort: v.number() }),
    ), // 1–10 each; time & effort: higher = longer/harder (bad)
    deliverables: v.optional(v.array(v.string())),
    bonuses: v.optional(v.array(v.string())),
    guarantee: v.optional(v.string()),
    price: v.optional(v.number()),
    pricingModel: v.optional(v.string()),
    urgency: v.optional(v.string()), // scarcity / urgency
    notes: v.optional(v.string()),
    createdAt: v.number(),
    // B2: MAGIC name helper inputs (Magnet · Avatar · Goal · Interval · Container).
    magic: v.optional(
      v.object({
        magnet: v.optional(v.string()),
        avatar: v.optional(v.string()),
        goal: v.optional(v.string()),
        interval: v.optional(v.string()),
        container: v.optional(v.string()),
      }),
    ),
    wentLiveAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  // Marketing campaigns: objective → channels → offer → results.
  campaigns: defineTable({
    userId: v.id("users"),
    name: v.string(),
    objective: v.optional(v.string()),
    brand: v.optional(v.union(v.literal("personal"), v.literal("company"))),
    channels: v.optional(v.array(v.string())),
    offerId: v.optional(v.id("offers")),
    status: v.union(v.literal("idea"), v.literal("planned"), v.literal("live"), v.literal("paused"), v.literal("done")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    budget: v.optional(v.number()),
    spend: v.optional(v.number()),
    targets: v.optional(v.object({ leads: v.optional(v.number()), conversations: v.optional(v.number()), deals: v.optional(v.number()) })),
    results: v.optional(
      v.object({
        leads: v.optional(v.number()),
        conversations: v.optional(v.number()),
        deals: v.optional(v.number()),
        revenue: v.optional(v.number()),
      }),
    ),
    notes: v.optional(v.string()),
    learnings: v.optional(v.string()),
    createdAt: v.number(),
    // B2: extra targets beyond `targets` (revenue goal, content pieces to ship).
    revenueTarget: v.optional(v.number()),
    contentTarget: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  contentPillars: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    brand: v.union(v.literal("personal"), v.literal("company")),
    color: v.optional(v.string()),
    learningAreaId: v.optional(v.id("learningAreas")),
    order: v.number(),
  }).index("by_user", ["userId"]),

  // Content pipeline: Idea → Seed → … → Published → Repurposing → Measured.
  contentPieces: defineTable({
    userId: v.id("users"),
    title: v.string(),
    brand: v.union(v.literal("personal"), v.literal("company")),
    pillarId: v.optional(v.id("contentPillars")),
    platforms: v.optional(v.array(v.string())), // linkedin | instagram | tiktok | youtube | x | facebook | newsletter | blog
    format: v.string(), // short_video | long_video | carousel | text_post | thread | newsletter | article | podcast | story
    stage: v.union(
      v.literal("idea"),
      v.literal("seed"),
      v.literal("brief"),
      v.literal("script"),
      v.literal("ready_to_record"),
      v.literal("recorded"),
      v.literal("editing"),
      v.literal("ready_to_publish"),
      v.literal("scheduled"),
      v.literal("published"),
      v.literal("repurposing"),
      v.literal("measured"),
      v.literal("recycle_due"),
      v.literal("archived"),
    ),
    isHub: v.optional(v.boolean()), // the weekly long "hub" piece
    parentId: v.optional(v.id("contentPieces")), // repurposed from
    hook: v.optional(v.string()),
    hookType: v.optional(v.string()),
    brief: v.optional(v.string()),
    script: v.optional(v.string()), // markdown
    cta: v.optional(v.string()),
    scheduledFor: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    // Content Studio: client-LOCAL "YYYY-MM-DD" of the publish (calendar + weekly cadence).
    publishedOn: v.optional(v.string()),
    url: v.optional(v.string()),
    checklist: v.optional(v.array(v.string())), // done publish-checklist keys
    performance: v.optional(
      v.array(
        v.object({
          window: v.union(v.literal("24h"), v.literal("7d"), v.literal("30d")),
          views: v.optional(v.number()),
          likes: v.optional(v.number()),
          comments: v.optional(v.number()),
          shares: v.optional(v.number()),
          saves: v.optional(v.number()),
          follows: v.optional(v.number()),
          leads: v.optional(v.number()),
          hold3s: v.optional(v.number()), // % still watching at 3s (Kallaway: ≥70 banger, <50 problem)
          avdSec: v.optional(v.number()), // average view duration (seconds)
          ctr: v.optional(v.number()), // YouTube click-through rate %
          at: v.number(),
        }),
      ),
    ),
    lesson: v.optional(v.string()),
    // Kallaway content workflow for this piece (idea gate → LEGO bricks → hook
    // → structure → retention → convert → packaging → post-mortem).
    kw: v.optional(
      v.object({
        gate: v.optional(v.array(v.string())), // idea-gate checks passed
        topic: v.optional(v.string()),
        angle: v.optional(v.string()),
        commonBelief: v.optional(v.string()),
        contrarianTake: v.optional(v.string()),
        shockFacts: v.optional(v.array(v.object({ text: v.string(), score: v.number() }))),
        emotion: v.optional(v.string()), // awe | amusement | excitement | anger | surprise | sadness
        archetype: v.optional(v.string()), // fortune_teller | experimenter | teacher | magician | investigator | contrarian
        hookFormat: v.optional(v.string()), // 9 spoken-hook formats
        lean: v.optional(v.string()), // 3-step hook: context lean-in
        interjection: v.optional(v.string()), // scroll-stop interjection
        snapback: v.optional(v.string()), // contrarian snapback
        textHook: v.optional(v.string()),
        keyVisual: v.optional(v.string()),
        visualCategory: v.optional(v.string()),
        audioNote: v.optional(v.string()),
        hookAudit: v.optional(v.array(v.string())),
        structure: v.optional(v.string()), // story structure key
        visualFormat: v.optional(v.string()), // layout: green screen, POV, split…
        storylocks: v.optional(v.array(v.string())),
        lastLine: v.optional(v.string()), // "last dab" written first
        trustRungs: v.optional(v.array(v.number())), // Trust Ladder rungs 1–8 used
        ctaRamp: v.optional(v.string()), // lead_magnet | sales_page | dm | follow | none
        ctaText: v.optional(v.string()),
        packaging: v.optional(v.array(v.string())), // packaging checks passed
        ytTitle: v.optional(v.string()),
        thumbConcept: v.optional(v.string()),
        firstCaption: v.optional(v.string()),
        series: v.optional(v.string()),
        seriesNo: v.optional(v.number()),
        formulaId: v.optional(v.string()),
        bucketId: v.optional(v.string()), // 3-2-1 bucket (or "chaos")
        weakBricks: v.optional(v.array(v.string())), // post-mortem: which bricks to fix next rep
        nextFix: v.optional(v.string()),
        steps: v.optional(v.array(v.string())), // workflow steps marked done
        // YouTube layer (Paddy Galloway): title lab, thumbnail brief, CCN, stakes, predicted 1-of-10 rank
        titles: v.optional(v.array(v.string())), // ≥10 title variants
        thumbConcepts: v.optional(v.array(v.string())), // ~5 thumbnail concepts
        ytChecks: v.optional(v.array(v.string())), // big-video tests + 45s intro checks (elimination tests would use the "elim:" prefix)
        stakes: v.optional(v.array(v.string())),
        predictRank: v.optional(v.object({ h1: v.optional(v.number()), d1: v.optional(v.number()), w1: v.optional(v.number()) })),
      }),
    ),
    sourceNoteId: v.optional(v.id("notes")),
    swipeIds: v.optional(v.array(v.id("swipes"))),
    learningAreaId: v.optional(v.id("learningAreas")),
    campaignId: v.optional(v.id("campaigns")),
    recycleAt: v.optional(v.string()), // +6 / +12 months
    order: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_parent", ["parentId"]),

  // Inspiration library: saved posts/videos broken down at save time.
  swipes: defineTable({
    userId: v.id("users"),
    url: v.optional(v.string()),
    platform: v.optional(v.string()),
    creator: v.optional(v.string()),
    title: v.optional(v.string()),
    hookText: v.optional(v.string()),
    hookVisual: v.optional(v.string()), // what you see in frame 1
    hookSpoken: v.optional(v.string()), // what is said
    hookOnScreen: v.optional(v.string()), // on-screen text
    hookType: v.optional(v.string()), // curiosity | contrarian | result | question | mistake | myth | list | story
    format: v.optional(v.string()),
    structure: v.optional(v.string()),
    views: v.optional(v.number()),
    creatorAvgViews: v.optional(v.number()), // outlier ratio = views / avg
    whyItWorked: v.string(), // required
    whatToSteal: v.optional(v.string()),
    pillarId: v.optional(v.id("contentPillars")),
    brand: v.optional(v.union(v.literal("personal"), v.literal("company"))),
    tags: v.optional(v.array(v.string())),
    transcript: v.optional(v.string()),
    used: v.optional(v.number()),
    // Kallaway: explode an outlier into 7 LEGO bricks, hold the world-class ones.
    bricks: v.optional(
      v.object({
        topic: v.optional(v.string()),
        angle: v.optional(v.string()),
        hookStructure: v.optional(v.string()),
        storyStructure: v.optional(v.string()),
        visualFormat: v.optional(v.string()),
        keyVisuals: v.optional(v.string()),
        audio: v.optional(v.string()),
      }),
    ),
    hold: v.optional(v.array(v.string())), // brick keys to keep when remixing
    archetype: v.optional(v.string()),
    creatorWatchId: v.optional(v.id("creatorWatch")),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Kallaway positioning per brand (personal / company): content game, KPI,
  // authority statement, audience of one, bullseye, contrarian vault, terms to
  // own, uniqueness, hero platform, lead magnet, content formulas, lab dates.
  contentStrategy: defineTable({
    userId: v.id("users"),
    brand: v.union(v.literal("personal"), v.literal("company")),
    game: v.optional(v.string()), // entertainment | education_media | commodity_product | explained_product | authority
    kpi: v.optional(v.string()), // views | followers | emails | conversions | dollars_per_view
    authorityStatement: v.optional(v.string()), // "I help X with Y in Z way"
    avatar: v.optional(v.string()), // audience of one
    pains: v.optional(v.array(v.string())), // the buyer's max-pain steps
    bullseye: v.optional(v.array(v.string())), // narrowest → wider rings
    contrarianTakes: v.optional(v.array(v.string())), // contrarian take vault
    terms: v.optional(v.array(v.string())), // niche terms to own
    objects: v.optional(v.array(v.string())), // signature association objects
    uniqueness: v.optional(
      v.object({
        topic: v.optional(v.string()),
        substance: v.optional(v.string()),
        avatar: v.optional(v.string()),
        format: v.optional(v.string()),
        visuals: v.optional(v.string()),
      }),
    ),
    heroPlatform: v.optional(v.string()),
    leadMagnet: v.optional(v.string()),
    leadMagnetType: v.optional(v.string()), // doc | email_course | community | waitlist | form
    formulas: v.optional(
      v.array(
        v.object({
          id: v.string(),
          topic: v.string(),
          format: v.string(),
          layout: v.string(),
          status: v.union(v.literal("testing"), v.literal("winner"), v.literal("retired")),
        }),
      ),
    ),
    // 3-2-1 plan: 3 topic buckets (1 broad + 2 narrow) × 2/week + 1 chaos agent.
    buckets: v.optional(v.array(v.object({ id: v.string(), name: v.string(), kind: v.string() }))),
    standOut: v.optional(v.array(v.string())), // which of the 4 ways you lean on
    pyramidLevel: v.optional(v.string()), // facts | explanation | application | stories
    labStartDate: v.optional(v.string()), // short-form 60-day lab start (Monday)
    longFormStartDate: v.optional(v.string()), // weekly long-form track start
    batchSize: v.optional(v.number()), // 1 = one rep at a time (first ~300 reps)
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // ── Finance (personal + business) ──────────────────────────────────────
  finAccounts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    kind: v.union(
      v.literal("bank"),
      v.literal("cash"),
      v.literal("card"),
      v.literal("wallet"),
      v.literal("savings"),
      v.literal("investment"),
      v.literal("loan"),
    ),
    scope: v.union(v.literal("personal"), v.literal("business")),
    currency: v.optional(v.string()),
    openingBalance: v.number(),
    archived: v.optional(v.boolean()),
    order: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  finCategories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    scope: v.union(v.literal("personal"), v.literal("business"), v.literal("both")),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    archived: v.optional(v.boolean()),
    order: v.number(),
  }).index("by_user", ["userId"]),

  finTransactions: defineTable({
    userId: v.id("users"),
    date: v.string(), // local YYYY-MM-DD
    amount: v.number(), // always positive; `type` gives the direction
    type: v.union(v.literal("income"), v.literal("expense"), v.literal("transfer")),
    accountId: v.id("finAccounts"),
    toAccountId: v.optional(v.id("finAccounts")), // transfers only
    categoryId: v.optional(v.id("finCategories")),
    scope: v.union(v.literal("personal"), v.literal("business")),
    payee: v.optional(v.string()),
    note: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    dealId: v.optional(v.id("deals")),
    companyId: v.optional(v.id("companies")),
    projectId: v.optional(v.id("projects")),
    recurringId: v.optional(v.id("finRecurring")),
    // The due date a recurring payment covered (its nextDue before "mark paid"),
    // so deleting the payment can roll the item's nextDue back safely.
    recurringDue: v.optional(v.string()),
    invoiceId: v.optional(v.id("finInvoices")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_account", ["accountId"]),

  // Monthly budget per category (applies every month unless `month` is set).
  finBudgets: defineTable({
    userId: v.id("users"),
    categoryId: v.id("finCategories"),
    amount: v.number(),
    month: v.optional(v.string()), // YYYY-MM override; absent = every month
  }).index("by_user", ["userId"]),

  // Subscriptions, bills, salaries, retainers.
  finRecurring: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    kind: v.optional(v.string()), // subscription | bill | salary | retainer | loan | other
    amount: v.number(),
    cadence: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    nextDue: v.string(), // YYYY-MM-DD
    // Day of month the item is anchored to (1–31), so monthly/quarterly/yearly
    // dates don't drift after a short month (Jan 31 → Feb 28 → Mar 31).
    dueDay: v.optional(v.number()),
    accountId: v.optional(v.id("finAccounts")),
    categoryId: v.optional(v.id("finCategories")),
    scope: v.union(v.literal("personal"), v.literal("business")),
    companyId: v.optional(v.id("companies")),
    active: v.boolean(),
    note: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Receivables: invoices you send to clients.
  finInvoices: defineTable({
    userId: v.id("users"),
    number: v.optional(v.string()),
    title: v.string(),
    companyId: v.optional(v.id("companies")),
    personId: v.optional(v.id("people")),
    dealId: v.optional(v.id("deals")),
    projectId: v.optional(v.id("projects")),
    amount: v.number(),
    currency: v.optional(v.string()),
    issuedOn: v.string(),
    dueOn: v.string(),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("paid"), v.literal("void")),
    paidOn: v.optional(v.string()),
    transactionId: v.optional(v.id("finTransactions")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Savings / money targets (emergency fund, runway, a purchase…).
  finGoals: defineTable({
    userId: v.id("users"),
    name: v.string(),
    target: v.number(),
    accountId: v.optional(v.id("finAccounts")), // progress = that account's balance
    saved: v.optional(v.number()), // manual progress when no account linked
    deadline: v.optional(v.string()),
    scope: v.union(v.literal("personal"), v.literal("business")),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Creator watchlist (20–30 creators, 10K–1M followers, same content type).
  creatorWatch: defineTable({
    userId: v.id("users"),
    name: v.string(),
    platform: v.optional(v.string()),
    url: v.optional(v.string()),
    followers: v.optional(v.number()),
    avgViews: v.optional(v.number()),
    brand: v.optional(v.union(v.literal("personal"), v.literal("company"))),
    notes: v.optional(v.string()),
    lastCheckedOn: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Hook library — winning hooks from swipes and your own outliers.
  hooks: defineTable({
    userId: v.id("users"),
    text: v.string(),
    hookType: v.optional(v.string()),
    source: v.union(v.literal("swipe"), v.literal("own"), v.literal("manual")),
    sourceId: v.optional(v.string()),
    note: v.optional(v.string()),
    uses: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Decision journal (Farnam Street): written BEFORE the outcome is known.
  decisions: defineTable({
    userId: v.id("users"),
    title: v.string(),
    context: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    choice: v.optional(v.string()),
    expected: v.optional(v.string()),
    confidence: v.optional(v.number()), // 0–100
    state: v.optional(v.string()), // physical / mental state when deciding
    reviewDate: v.optional(v.string()),
    outcome: v.optional(v.string()),
    lessons: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("decided"), v.literal("reviewed")),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    createdAt: v.number(),
    // B2: calibration — did the outcome match the expectation? (set at review)
    matched: v.optional(v.boolean()),
    decidedOn: v.optional(v.string()), // local YYYY-MM-DD the entry was written
    reviewedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  // Issues list worked with IDS (Identify · Discuss · Solve).
  issues: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.number(), // 1 (top) – 3
    status: v.union(v.literal("open"), v.literal("discussing"), v.literal("solved"), v.literal("dropped")),
    rootCause: v.optional(v.string()),
    solution: v.optional(v.string()),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    createdAt: v.number(),
    solvedAt: v.optional(v.number()),
    // B2: the follow-up task created when solved, and an owner ("me" for now).
    taskId: v.optional(v.id("tasks")),
    owner: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // ── Phase 4 · Knowledge, learning & delegation ──────────────────────────
  learningAreas: defineTable({
    userId: v.id("users"),
    name: v.string(),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    goalId: v.optional(v.id("goals")),
    pillarId: v.optional(v.id("contentPillars")), // learn in public → pillar
    targetPerformance: v.optional(v.string()), // "record a 60-second explainer with no notes"
    why: v.optional(v.string()),
    map: v.optional(v.string()), // what/how to learn (markdown)
    weeklyMinutesTarget: v.optional(v.number()),
    gaps: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          resolved: v.boolean(),
          addedOn: v.optional(v.string()), // local YYYY-MM-DD (weekly review: gaps added)
          resolvedOn: v.optional(v.string()), // local YYYY-MM-DD (weekly review: gaps closed)
        }),
      ),
    ),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("done")),
    color: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  skillNodes: defineTable({
    userId: v.id("users"),
    learningAreaId: v.id("learningAreas"),
    title: v.string(),
    parentId: v.optional(v.id("skillNodes")),
    status: v.union(v.literal("todo"), v.literal("learning"), v.literal("practicing"), v.literal("solid")),
    order: v.number(),
    notes: v.optional(v.string()),
  }).index("by_area", ["learningAreaId"]),

  practiceSessions: defineTable({
    userId: v.id("users"),
    learningAreaId: v.id("learningAreas"),
    skillNodeId: v.optional(v.id("skillNodes")),
    date: v.string(),
    minutes: v.number(),
    kind: v.union(v.literal("study"), v.literal("practice"), v.literal("project"), v.literal("recall"), v.literal("teach")),
    whatPracticed: v.optional(v.string()),
    gapsFound: v.optional(v.string()),
    explainNow: v.optional(v.string()), // "what can you now explain?" → idea note
    ideaNoteId: v.optional(v.id("notes")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_area", ["learningAreaId"]),

  // Resource queue (books, courses, videos…). "Why saved" is required.
  resources: defineTable({
    userId: v.id("users"),
    title: v.string(),
    url: v.optional(v.string()),
    format: v.string(), // book | course | video | article | podcast | paper | tool | other
    author: v.optional(v.string()),
    whySaved: v.string(),
    status: v.union(v.literal("queued"), v.literal("active"), v.literal("done"), v.literal("dropped")),
    progress: v.optional(v.number()), // 0–100
    learningAreaId: v.optional(v.id("learningAreas")),
    rating: v.optional(v.number()),
    takeaways: v.optional(v.string()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  // Spaced-repetition recall cards scheduled with FSRS.
  recallCards: defineTable({
    userId: v.id("users"),
    front: v.string(),
    back: v.string(),
    learningAreaId: v.optional(v.id("learningAreas")),
    noteId: v.optional(v.id("notes")),
    resourceId: v.optional(v.id("resources")),
    due: v.number(), // ms
    stability: v.number(),
    difficulty: v.number(),
    reps: v.number(),
    lapses: v.number(),
    fsrsState: v.union(v.literal("new"), v.literal("learning"), v.literal("review"), v.literal("relearning")),
    lastReview: v.optional(v.number()),
    suspended: v.optional(v.boolean()),
    createdAt: v.number(),
    skillNodeId: v.optional(v.id("skillNodes")),
    step: v.optional(v.number()), // index into the (re)learning steps while learning/relearning
    scheduledDays: v.optional(v.number()), // last interval given (days; 0 = intraday step)
    lastRating: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_due", ["userId", "due"]),

  recallLogs: defineTable({
    userId: v.id("users"),
    cardId: v.id("recallCards"),
    rating: v.number(), // 1 again · 2 hard · 3 good · 4 easy
    date: v.string(),
    at: v.number(),
    learningAreaId: v.optional(v.id("learningAreas")),
    state: v.optional(v.string()), // FSRS state BEFORE this review (retention uses "review")
    elapsedDays: v.optional(v.number()),
    scheduledDays: v.optional(v.number()), // interval given by this review (days)
    prev: v.optional(v.any()), // card scheduling snapshot before this review (undo)
  }).index("by_user_date", ["userId", "date"]),

  // Time & energy audit (Buy Back Your Time): log blocks, rate $ + energy.
  timeAudit: defineTable({
    userId: v.id("users"),
    date: v.string(),
    startMin: v.optional(v.number()),
    minutes: v.number(),
    activity: v.string(),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    value: v.number(), // 1–4 ($ … $$$$)
    energy: v.union(v.literal("energizing"), v.literal("neutral"), v.literal("draining")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  // Process library (SOPs) — the bridge to the company layer.
  processes: defineTable({
    userId: v.id("users"),
    title: v.string(),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    rung: v.union(
      v.literal("admin"),
      v.literal("delivery"),
      v.literal("marketing"),
      v.literal("sales"),
      v.literal("leadership"),
    ),
    trigger: v.optional(v.string()),
    steps: v.array(v.object({ id: v.string(), text: v.string() })),
    tools: v.optional(v.array(v.string())),
    owner: v.optional(v.string()), // "me" until delegated
    recordingUrl: v.optional(v.string()), // Camcorder Method
    status: v.union(v.literal("draft"), v.literal("documented"), v.literal("delegated")),
    frequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("adhoc"))),
    lastPerformedAt: v.optional(v.number()),
    sourceTaskId: v.optional(v.id("tasks")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
