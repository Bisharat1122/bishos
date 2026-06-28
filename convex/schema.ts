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
  }).index("by_user", ["userId"]),

  sections: defineTable({
    userId: v.id("users"),
    lifeAreaId: v.id("lifeAreas"),
    name: v.string(),
    order: v.number(),
  }).index("by_lifeArea", ["lifeAreaId"]),

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
    linkedNoteIds: v.optional(v.array(v.id("notes"))),
    tags: v.optional(v.array(v.string())),
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
    .index("by_status", ["userId", "status"])
    .index("by_dueDate", ["userId", "dueDate"]),

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
    .index("by_lifeArea", ["lifeAreaId"]),

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
  })
    .index("by_user", ["userId"])
    .index("by_lifeArea", ["lifeAreaId"])
    .index("by_project", ["projectId"]),

  focusSessions: defineTable({
    userId: v.id("users"),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(), // seconds
    taskId: v.optional(v.id("tasks")),
    projectId: v.optional(v.id("projects")),
    lifeAreaId: v.optional(v.id("lifeAreas")),
    sectionId: v.optional(v.id("sections")),
  })
    .index("by_user", ["userId"])
    .index("by_lifeArea", ["lifeAreaId"])
    .index("by_task", ["taskId"]),

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
    streak: v.number(),
    lastCompletedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"]),

  habitCompletions: defineTable({
    userId: v.id("users"),
    habitId: v.id("habits"),
    date: v.string(), // YYYY-MM-DD
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
    provider: v.optional(
      v.union(
        v.literal("openrouter"),
        v.literal("gpt-oss"),
        v.literal("owl"),
        v.literal("perplexity"),
      ),
    ),
    // Set for the per-module agentic AI windows ("goals" | "tasks" | "notes" …).
    // Absent on the main /chat thread.
    moduleKey: v.optional(v.string()),
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
    ),
    itemId: v.string(),
    titleSnapshot: v.string(),
    why: v.optional(v.string()),
    impact: v.number(), // 1–5
    createdAt: v.number(),
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
});
