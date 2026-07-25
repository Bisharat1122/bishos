import { v } from "convex/values";
import {
  action,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { resolveLinks } from "./notes";
import { computeStreak } from "./habits";
import { callWithTools, MODELS, ToolCall } from "./openrouter";

const DAY = 24 * 60 * 60 * 1000;
const ymd = (ts: number) => new Date(ts).toISOString().slice(0, 10);

/* ------------------------------------------------------------------ *
 * Agentic per-module AI windows.
 * A module dock (e.g. Goals) chats with a tool-calling model. When the
 * user asks to create/modify something, the model emits a tool call which
 * we store as a *pending* action — nothing touches the DB until the user
 * clicks Confirm. Goals is the first module; tasks/notes follow the same
 * shape.
 * ------------------------------------------------------------------ */

const TIMEFRAMES = ["weekly", "monthly", "yearly", "custom"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

// ---- Tool schemas (OpenAI function-calling format), per module ----------

const GOAL_TOOLS = [
  {
    type: "function",
    function: {
      name: "createGoal",
      description:
        "Create a new goal for the user. Apply the SMART framework. Choose a life area from the user's existing areas. Only call this when the user clearly wants to create a goal.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short, action-oriented goal title" },
          description: { type: "string" },
          project: { type: "string", description: "Title of an existing project to attach to — life area is inherited (optional)" },
          lifeArea: { type: "string", description: "Life area name — only for standalone goals not tied to a project" },
          timeframe: { type: "string", enum: [...TIMEFRAMES] },
          deadline: { type: "string", description: "Deadline as ISO date YYYY-MM-DD (optional)" },
          specific: { type: "string", description: "SMART: what exactly will be accomplished" },
          measurable: { type: "string", description: "SMART: how progress is measured" },
          achievable: { type: "string", description: "SMART: why it's realistic" },
          relevant: { type: "string", description: "SMART: why it matters" },
          timeBound: { type: "string", description: "SMART: the time constraint" },
          milestones: {
            type: "array",
            items: { type: "string" },
            description: "2–6 concrete, sequenced milestones",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "addMilestones",
      description: "Add one or more milestones to an existing goal, identified by its title.",
      parameters: {
        type: "object",
        properties: {
          goalTitle: { type: "string", description: "Title of the existing goal" },
          milestones: { type: "array", items: { type: "string" } },
        },
        required: ["goalTitle", "milestones"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateGoal",
      description:
        "Update an existing goal identified by its current title. Set only the fields that change.",
      parameters: {
        type: "object",
        properties: {
          goalTitle: { type: "string", description: "Current title of the goal to update" },
          newTitle: { type: "string" },
          description: { type: "string" },
          timeframe: { type: "string", enum: [...TIMEFRAMES] },
          progress: { type: "number", description: "Progress percent 0–100" },
        },
        required: ["goalTitle"],
      },
    },
  },
];

const PRIORITIES = ["low", "med", "high"] as const;
type Priority = (typeof PRIORITIES)[number];
const STATUSES = ["not_started", "in_progress", "done"] as const;
type Status = (typeof STATUSES)[number];

const TASK_TOOLS = [
  {
    type: "function",
    function: {
      name: "createTask",
      description:
        "Create a new task. Prefer attaching it to a project (the life area is inherited from the project). Only set lifeArea directly for standalone tasks that aren't part of any project. Only call when the user clearly wants to add a task.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: [...PRIORITIES], description: "low, med, or high" },
          project: { type: "string", description: "Title of an existing project to attach to — its life area is inherited (preferred)" },
          lifeArea: { type: "string", description: "Life area name — only for standalone tasks with no project" },
          dueDate: { type: "string", description: "Due date as ISO date YYYY-MM-DD (optional)" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "completeTask",
      description: "Mark an existing task done, identified by its title.",
      parameters: {
        type: "object",
        properties: { taskTitle: { type: "string" } },
        required: ["taskTitle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateTask",
      description:
        "Update an existing task identified by its current title. Set only the fields that change.",
      parameters: {
        type: "object",
        properties: {
          taskTitle: { type: "string", description: "Current title of the task to update" },
          newTitle: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: [...PRIORITIES] },
          status: { type: "string", enum: [...STATUSES] },
          dueDate: { type: "string", description: "ISO date YYYY-MM-DD" },
        },
        required: ["taskTitle"],
      },
    },
  },
];

const NOTE_TOOLS = [
  {
    type: "function",
    function: {
      name: "createNote",
      description:
        "Create a new note. Use markdown. You may link other notes with [[Note Title]]. Only call when the user clearly wants to capture a note.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string", description: "Markdown body" },
          project: { type: "string", description: "Title of an existing project to link — life area is inherited (optional)" },
          lifeArea: { type: "string", description: "Life area name — only if not linking a project (optional)" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "appendNote",
      description: "Append content to the end of an existing note, identified by its title.",
      parameters: {
        type: "object",
        properties: {
          noteTitle: { type: "string" },
          content: { type: "string", description: "Markdown to append" },
        },
        required: ["noteTitle", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateNote",
      description:
        "Update an existing note identified by its current title — rename it and/or replace its content.",
      parameters: {
        type: "object",
        properties: {
          noteTitle: { type: "string", description: "Current title of the note" },
          newTitle: { type: "string" },
          content: { type: "string", description: "New full markdown content (replaces the old)" },
        },
        required: ["noteTitle"],
      },
    },
  },
];

const PROJECT_STATUSES = ["planning", "active", "blocked", "completed"] as const;
type ProjectStatus = (typeof PROJECT_STATUSES)[number];
const KINDS = ["standard", "sprint"] as const;
const FREQUENCIES = ["daily", "weekly", "custom"] as const;
type Frequency = (typeof FREQUENCIES)[number];

const PROJECT_TOOLS = [
  {
    type: "function",
    function: {
      name: "createProject",
      description:
        "Create a new project. Use kind 'sprint' for time-boxed efforts (set outcome + durationDays), else 'standard'. Choose a life area from the user's existing areas.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          lifeArea: { type: "string", description: "Name of an existing life area" },
          status: { type: "string", enum: [...PROJECT_STATUSES] },
          kind: { type: "string", enum: [...KINDS] },
          outcome: { type: "string", description: "Sprint only: the target outcome" },
          durationDays: { type: "number", description: "Sprint only: length in days" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateProject",
      description: "Update an existing project identified by its current title.",
      parameters: {
        type: "object",
        properties: {
          projectTitle: { type: "string" },
          newTitle: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: [...PROJECT_STATUSES] },
          progress: { type: "number", description: "0–100" },
        },
        required: ["projectTitle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "addProjectMilestones",
      description: "Add milestones to an existing project identified by its title.",
      parameters: {
        type: "object",
        properties: {
          projectTitle: { type: "string" },
          milestones: { type: "array", items: { type: "string" } },
        },
        required: ["projectTitle", "milestones"],
      },
    },
  },
];

const HABIT_TOOLS = [
  {
    type: "function",
    function: {
      name: "createHabit",
      description: "Create a new habit to track. Choose a life area from the user's existing areas.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          frequency: { type: "string", enum: [...FREQUENCIES] },
          target: { type: "string", description: "e.g. '8 glasses', '30 min' (optional)" },
          lifeArea: { type: "string", description: "Name of an existing life area" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkHabitToday",
      description: "Mark a habit as done for today, identified by its title. Toggles today's completion.",
      parameters: {
        type: "object",
        properties: { habitTitle: { type: "string" } },
        required: ["habitTitle"],
      },
    },
  },
];

const FOCUS_TOOLS = [
  {
    type: "function",
    function: {
      name: "logFocus",
      description:
        "Log a past focus session in minutes, optionally attributed to a task, project, or life area.",
      parameters: {
        type: "object",
        properties: {
          durationMinutes: { type: "number" },
          task: { type: "string", description: "Title of a task to attribute to (optional)" },
          project: { type: "string", description: "Title of a project to attribute to (optional)" },
          lifeArea: { type: "string", description: "Name of a life area (optional)" },
        },
        required: ["durationMinutes"],
      },
    },
  },
];

const CHECKIN_TOOLS = [
  {
    type: "function",
    function: {
      name: "logCheckIn",
      description:
        "Record (or update) today's daily check-in: energy/mood 1–10, top priorities, and any blockers.",
      parameters: {
        type: "object",
        properties: {
          energyMood: { type: "number", description: "1–10" },
          priorities: { type: "array", items: { type: "string" } },
          blockers: { type: "array", items: { type: "string" } },
        },
        required: ["energyMood"],
      },
    },
  },
];

const MODULE_TOOLS: Record<string, unknown[]> = {
  goals: GOAL_TOOLS,
  tasks: TASK_TOOLS,
  notes: NOTE_TOOLS,
  projects: PROJECT_TOOLS,
  habits: HABIT_TOOLS,
  focus: FOCUS_TOOLS,
  checkin: CHECKIN_TOOLS,
};

// ---- System prompt ------------------------------------------------------

function buildModulePrompt(
  module: string,
  context: string,
  facts: { areas: string[]; summary: string },
  canAct: boolean,
): string {
  const lines = [
    `You are bishOS's ${module} assistant — a focused, agentic helper docked inside the ${module} module.`,
    "Speak in Bish's voice: direct, sharp, practical. Keep replies tight.",
    "",
    `Available life areas: ${facts.areas.join(", ") || "none yet"}.`,
    facts.summary,
    "",
    "=== BACKGROUND LIFE STATE ===",
    context,
  ];
  if (canAct) {
    const VERBS: Record<string, string> = {
      goals: "create/update goals, add milestones",
      tasks: "create/update/complete tasks",
      notes: "create/append/update notes",
      projects: "create/update projects, add milestones",
      habits: "create habits and check them off for today",
      focus: "log past focus sessions",
      checkin: "record today's daily check-in",
    };
    const HINTS: Record<string, string> = {
      goals: "When creating a goal, fill the SMART fields and propose 2–6 milestones unless the user says otherwise.",
      tasks: "Infer a sensible life area and priority for new tasks from context.",
      notes: "Write notes in clean markdown; you may link other notes with [[Title]].",
      projects: "Use kind 'sprint' for time-boxed efforts (set an outcome and duration); else 'standard'.",
      habits: "Default frequency to daily unless the user implies otherwise.",
      focus: "Attribute the session to a task/project/area when the user names one.",
      checkin: "Energy/mood is 1–10. Capture priorities and blockers as short phrases.",
    };
    const verbs = VERBS[module] ?? "take actions";
    const hint = HINTS[module] ?? "";
    lines.push(
      "",
      `You can take real actions via the provided tools (${verbs}).`,
      "When the user wants to create or change something, CALL the matching tool — do NOT ask for confirmation in text; the app shows a confirm button before anything is saved.",
      hint,
      "For questions, advice, or planning talk, just reply in plain text without calling a tool.",
    );
  } else {
    lines.push(
      "",
      "Note: the current model can't take actions. Answer in text; if the user wants to create/modify a goal, tell them to switch to a free model (gpt-oss / Owl / Nemotron) using the toggle.",
    );
  }
  return lines.join("\n");
}

// ---- Internal queries / mutations --------------------------------------

/** Areas + a one-line summary of the module's existing items, for the prompt. */
export const moduleFacts = internalQuery({
  args: { module: v.string(), challengeId: v.optional(v.id("challenges")) },
  handler: async (ctx, { module }) => {
    const userId = await requireUser(ctx);
    const areas = await ctx.db
      .query("lifeAreas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const areaNames = areas.map((a) => a.name);
    const areaName = (id?: Id<"lifeAreas">) => areas.find((a) => a._id === id)?.name ?? "—";

    if (module === "tasks") {
      const [tasks, projects] = await Promise.all([
        ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ]);
      const open = tasks.filter((t) => t.status !== "done").slice(0, 20);
      const summary =
        `Open tasks: ${open.map((t) => `"${t.title}" [${t.priority}, ${areaName(t.lifeAreaId)}]`).join("; ") || "none"}. ` +
        `Projects: ${projects.map((p) => p.title).join(", ") || "none"}.`;
      return { areas: areaNames, summary };
    }

    if (module === "notes") {
      const notes = await ctx.db
        .query("notes")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(25);
      const summary = `Recent notes: ${notes.map((n) => `"${n.title}"`).join("; ") || "none"}.`;
      return { areas: areaNames, summary };
    }

    if (module === "projects") {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const summary = `Existing projects: ${projects.map((p) => `"${p.title}" [${p.kind ?? "standard"}, ${p.status}, ${p.progress}%]`).join("; ") || "none"}.`;
      return { areas: areaNames, summary };
    }

    if (module === "habits") {
      const habits = await ctx.db
        .query("habits")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const summary = `Existing habits: ${habits.map((h) => `"${h.title}" (streak ${h.streak})`).join("; ") || "none"}.`;
      return { areas: areaNames, summary };
    }

    if (module === "focus") {
      const [tasks, projects] = await Promise.all([
        ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ]);
      const open = tasks.filter((t) => t.status !== "done").slice(0, 15);
      const summary =
        `Tasks you could attribute focus to: ${open.map((t) => `"${t.title}"`).join("; ") || "none"}. ` +
        `Projects: ${projects.map((p) => p.title).join(", ") || "none"}.`;
      return { areas: areaNames, summary };
    }

    if (module === "checkin") {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const open = tasks.filter((t) => t.status !== "done").slice(0, 12);
      const summary = `Open tasks that could be today's priorities: ${open.map((t) => `"${t.title}"`).join("; ") || "none"}.`;
      return { areas: areaNames, summary };
    }

    // default: goals
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const summary = `Existing goals: ${goals.map((g) => `"${g.title}" (${g.progress}%)`).join("; ") || "none"}.`;
    return { areas: areaNames, summary };
  },
});

export const insertUser = internalMutation({
  args: { threadId: v.id("aiThreads"), content: v.string() },
  handler: async (ctx, { threadId, content }) => {
    const thread = await ctx.db.get(threadId);
    if (!thread) throw new Error("Thread not found");
    await ctx.db.insert("aiMessages", { userId: thread.userId, threadId, role: "user", content });
  },
});

const actionValidator = v.object({
  tool: v.string(),
  args: v.any(),
  label: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("done"),
    v.literal("cancelled"),
    v.literal("failed"),
  ),
  result: v.optional(v.string()),
});

export const insertAssistant = internalMutation({
  args: {
    threadId: v.id("aiThreads"),
    content: v.string(),
    actions: v.optional(v.array(actionValidator)),
  },
  handler: async (ctx, { threadId, content, actions }) => {
    const thread = await ctx.db.get(threadId);
    if (!thread) throw new Error("Thread not found");
    await ctx.db.insert("aiMessages", {
      userId: thread.userId,
      threadId,
      role: "assistant",
      content,
      actions: actions && actions.length ? actions : undefined,
    });
  },
});

// ---- Turn label from a tool call ---------------------------------------

function labelFor(tc: ToolCall): string {
  const a = tc.args as Record<string, unknown>;
  if (tc.name === "createGoal") {
    const n = Array.isArray(a.milestones) ? a.milestones.length : 0;
    return `Create goal: "${a.title ?? "untitled"}"${n ? ` · ${n} milestones` : ""}`;
  }
  if (tc.name === "addMilestones") {
    const n = Array.isArray(a.milestones) ? a.milestones.length : 0;
    return `Add ${n} milestone${n === 1 ? "" : "s"} to "${a.goalTitle}"`;
  }
  if (tc.name === "updateGoal") return `Update goal "${a.goalTitle}"`;
  if (tc.name === "createTask") {
    return `Create task: "${a.title ?? "untitled"}"${a.priority ? ` [${a.priority}]` : ""}`;
  }
  if (tc.name === "completeTask") return `Complete task "${a.taskTitle}"`;
  if (tc.name === "updateTask") return `Update task "${a.taskTitle}"`;
  if (tc.name === "createNote") return `Create note: "${a.title ?? "untitled"}"`;
  if (tc.name === "appendNote") return `Append to note "${a.noteTitle}"`;
  if (tc.name === "updateNote") return `Update note "${a.noteTitle}"`;
  if (tc.name === "createProject") {
    return `Create ${a.kind === "sprint" ? "sprint" : "project"}: "${a.title ?? "untitled"}"`;
  }
  if (tc.name === "updateProject") return `Update project "${a.projectTitle}"`;
  if (tc.name === "addProjectMilestones") {
    const n = Array.isArray(a.milestones) ? a.milestones.length : 0;
    return `Add ${n} milestone${n === 1 ? "" : "s"} to "${a.projectTitle}"`;
  }
  if (tc.name === "createHabit") return `Create habit: "${a.title ?? "untitled"}"`;
  if (tc.name === "checkHabitToday") return `Check off "${a.habitTitle}" for today`;
  if (tc.name === "logFocus") {
    return `Log ${a.durationMinutes ?? "?"} min focus${a.task ? ` on "${a.task}"` : ""}`;
  }
  if (tc.name === "logCheckIn") return `Record today's check-in (energy ${a.energyMood ?? "?"}/10)`;
  return tc.name;
}

// ---- Main agentic action -----------------------------------------------

export const threadChallengeId = internalQuery({
  args: { threadId: v.id("aiThreads") },
  handler: async (ctx, { threadId }) => {
    const t = await ctx.db.get(threadId);
    return t?.challengeId ?? null;
  },
});

export const moduleChat = action({
  args: { threadId: v.id("aiThreads"), module: v.string(), message: v.string() },
  handler: async (ctx, { threadId, module, message }): Promise<void> => {
    await ctx.runMutation(internal.agent.insertUser, { threadId, content: message });

    const challengeId = await ctx.runQuery(internal.agent.threadChallengeId, { threadId });
    const [context, facts, history, provider] = await Promise.all([
      ctx.runQuery(internal.ai.gatherContext, {}),
      ctx.runQuery(internal.agent.moduleFacts, { module, challengeId: challengeId ?? undefined }),
      ctx.runQuery(internal.ai.historyMessages, { threadId }),
      ctx.runQuery(internal.ai.threadProvider, { threadId }),
    ]);

    const modelKey = (provider ?? "hy3") as string;
    const canAct = (MODELS as Record<string, { toolCalling: boolean }>)[modelKey]?.toolCalling ?? false;
    const tools = canAct ? MODULE_TOOLS[module] ?? [] : [];

    const messages = [
      { role: "system" as const, content: buildModulePrompt(module, context, facts, canAct) },
      ...history,
    ];

    try {
      const { content, toolCalls } = await callWithTools(messages, tools, modelKey);
      const actions = toolCalls.map((tc) => ({
        tool: tc.name,
        // Inject the trusted challengeId (from the thread) so challenge tools
        // act on the right challenge without the model needing to know its id.
        args: challengeId ? { ...(tc.args as Record<string, unknown>), challengeId } : tc.args,
        label: labelFor(tc),
        status: "pending" as const,
      }));
      await ctx.runMutation(internal.agent.insertAssistant, {
        threadId,
        content:
          content ||
          (actions.length ? "Here's what I'll do — confirm below:" : "(no response)"),
        actions: actions.length ? actions : undefined,
      });
    } catch (e) {
      await ctx.runMutation(internal.agent.insertAssistant, {
        threadId,
        content: `⚠️ ${String(e instanceof Error ? e.message : e).slice(0, 180)}`,
      });
    }
  },
});

// ---- Action execution (confirm-before-write) ---------------------------

function progressOf(
  milestones: { done: boolean }[],
  metric?: { current: number; target: number },
): number {
  if (metric && metric.target > 0)
    return Math.max(0, Math.min(100, Math.round((metric.current / metric.target) * 100)));
  if (!milestones.length) return 0;
  return Math.round((milestones.filter((m) => m.done).length / milestones.length) * 100);
}

const str = (x: unknown): string | undefined =>
  typeof x === "string" && x.trim() ? x.trim() : undefined;

async function execAction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  userId: Id<"users">,
  tool: string,
  args: Record<string, unknown>,
): Promise<string> {
  const areas = await ctx.db
    .query("lifeAreas")
    .withIndex("by_user", (q: { eq: (a: string, b: unknown) => unknown }) => q.eq("userId", userId))
    .collect();
  const goals = await ctx.db
    .query("goals")
    .withIndex("by_user", (q: { eq: (a: string, b: unknown) => unknown }) => q.eq("userId", userId))
    .collect();

  const matchArea = (name?: string) => {
    if (!name) return areas[0];
    const n = name.toLowerCase();
    return (
      areas.find((a: { name: string }) => a.name.toLowerCase() === n) ??
      areas.find((a: { name: string }) => a.name.toLowerCase().includes(n)) ??
      areas[0]
    );
  };
  const findGoal = (title?: string) => {
    if (!title) return undefined;
    const n = title.toLowerCase();
    return (
      goals.find((g: { title: string }) => g.title.toLowerCase() === n) ??
      goals.find((g: { title: string }) => g.title.toLowerCase().includes(n))
    );
  };
  const byTitle = (rows: { title: string; _id: unknown }[], title?: string) => {
    if (!title) return undefined;
    const n = title.toLowerCase();
    return rows.find((r) => r.title.toLowerCase() === n) ?? rows.find((r) => r.title.toLowerCase().includes(n));
  };
  const tf = (x: unknown): Timeframe =>
    TIMEFRAMES.includes(x as Timeframe) ? (x as Timeframe) : "monthly";
  const parseDeadline = (x: unknown): number | undefined => {
    const s = str(x);
    if (!s) return undefined;
    const t = Date.parse(s);
    return Number.isNaN(t) ? undefined : t;
  };

  if (tool === "createGoal") {
    const gprojects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q: { eq: (a: string, b: unknown) => unknown }) => q.eq("userId", userId))
      .collect();
    const gproject = byTitle(gprojects, str(args.project)) as
      | { _id: Id<"projects">; lifeAreaId: Id<"lifeAreas"> }
      | undefined;
    const area = gproject
      ? areas.find((a: { _id: Id<"lifeAreas"> }) => a._id === gproject.lifeAreaId)
      : matchArea(str(args.lifeArea));
    if (!area) throw new Error("No life area exists yet — create one first.");
    const milestones = (Array.isArray(args.milestones) ? args.milestones : [])
      .map((m) => str(m))
      .filter((m): m is string => !!m)
      .map((text) => ({ text, done: false }));
    const smartEntries = {
      specific: str(args.specific),
      measurable: str(args.measurable),
      achievable: str(args.achievable),
      relevant: str(args.relevant),
      timeBound: str(args.timeBound),
    };
    const smart = Object.values(smartEntries).some(Boolean) ? smartEntries : undefined;
    const id = await ctx.db.insert("goals", {
      userId,
      title: str(args.title) ?? "Untitled goal",
      description: str(args.description),
      lifeAreaId: area._id,
      projectId: gproject?._id,
      timeframe: tf(args.timeframe),
      deadline: parseDeadline(args.deadline),
      tags: [],
      milestones,
      progress: progressOf(milestones),
      smart,
    });
    return `Created goal in ${area.name}`;
  }

  if (tool === "addMilestones") {
    const goal = findGoal(str(args.goalTitle));
    if (!goal) throw new Error(`Couldn't find a goal matching "${args.goalTitle}".`);
    const add = (Array.isArray(args.milestones) ? args.milestones : [])
      .map((m) => str(m))
      .filter((m): m is string => !!m)
      .map((text) => ({ text, done: false }));
    if (!add.length) throw new Error("No milestones provided.");
    const milestones = [...goal.milestones, ...add];
    await ctx.db.patch(goal._id, { milestones, progress: progressOf(milestones, goal.metric) });
    return `Added ${add.length} milestone${add.length === 1 ? "" : "s"} to "${goal.title}"`;
  }

  if (tool === "updateGoal") {
    const goal = findGoal(str(args.goalTitle));
    if (!goal) throw new Error(`Couldn't find a goal matching "${args.goalTitle}".`);
    const patch: Record<string, unknown> = {};
    if (str(args.newTitle)) patch.title = str(args.newTitle);
    if (str(args.description)) patch.description = str(args.description);
    if (TIMEFRAMES.includes(args.timeframe as Timeframe)) patch.timeframe = args.timeframe;
    if (typeof args.progress === "number")
      patch.progress = Math.max(0, Math.min(100, Math.round(args.progress)));
    if (!Object.keys(patch).length) throw new Error("Nothing to update.");
    await ctx.db.patch(goal._id, patch);
    return `Updated "${goal.title}"`;
  }

  // ---- Tasks ----
  if (tool === "createTask" || tool === "completeTask" || tool === "updateTask") {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q: { eq: (a: string, b: unknown) => unknown }) => q.eq("userId", userId))
      .collect();
    const prio = (x: unknown): Priority =>
      PRIORITIES.includes(x as Priority) ? (x as Priority) : "med";

    if (tool === "createTask") {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_user", (q: { eq: (a: string, b: unknown) => unknown }) => q.eq("userId", userId))
        .collect();
      const project = byTitle(projects, str(args.project)) as
        | { _id: Id<"projects">; lifeAreaId: Id<"lifeAreas"> }
        | undefined;
      // Life area is inherited from the project when one is given, else picked.
      const area = project
        ? areas.find((a: { _id: Id<"lifeAreas"> }) => a._id === project.lifeAreaId)
        : matchArea(str(args.lifeArea));
      if (!area) throw new Error("No life area exists yet — create one first.");
      await ctx.db.insert("tasks", {
        userId,
        title: str(args.title) ?? "Untitled task",
        description: str(args.description),
        priority: prio(args.priority),
        dueDate: parseDeadline(args.dueDate),
        lifeAreaId: area._id,
        projectId: project?._id,
        status: "not_started",
        order: Date.now(),
      });
      return `Created task${project ? ` in ${area.name} (project)` : ` in ${area.name}`}`;
    }

    const task = byTitle(tasks, str(args.taskTitle));
    if (!task) throw new Error(`Couldn't find a task matching "${args.taskTitle}".`);

    if (tool === "completeTask") {
      await ctx.db.patch(task._id, { status: "done", completedAt: Date.now() });
      return `Marked "${task.title}" done`;
    }

    // updateTask
    const patch: Record<string, unknown> = {};
    if (str(args.newTitle)) patch.title = str(args.newTitle);
    if (str(args.description)) patch.description = str(args.description);
    if (PRIORITIES.includes(args.priority as Priority)) patch.priority = args.priority;
    if (STATUSES.includes(args.status as Status)) {
      patch.status = args.status;
      patch.completedAt = args.status === "done" ? Date.now() : undefined;
    }
    const due = parseDeadline(args.dueDate);
    if (due) patch.dueDate = due;
    if (!Object.keys(patch).length) throw new Error("Nothing to update.");
    await ctx.db.patch(task._id, patch);
    return `Updated "${task.title}"`;
  }

  // ---- Notes ----
  if (tool === "createNote" || tool === "appendNote" || tool === "updateNote") {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q: { eq: (a: string, b: unknown) => unknown }) => q.eq("userId", userId))
      .collect();

    if (tool === "createNote") {
      const nprojects = await ctx.db
        .query("projects")
        .withIndex("by_user", (q: { eq: (a: string, b: unknown) => unknown }) => q.eq("userId", userId))
        .collect();
      const nproject = byTitle(nprojects, str(args.project)) as
        | { _id: Id<"projects">; lifeAreaId: Id<"lifeAreas"> }
        | undefined;
      const area = nproject
        ? areas.find((a: { _id: Id<"lifeAreas"> }) => a._id === nproject.lifeAreaId)
        : str(args.lifeArea)
          ? matchArea(str(args.lifeArea))
          : undefined;
      const content = str(args.content) ?? "";
      const tags = (Array.isArray(args.tags) ? args.tags : [])
        .map((t) => str(t))
        .filter((t): t is string => !!t);
      const id = await ctx.db.insert("notes", {
        userId,
        title: str(args.title) ?? "Untitled note",
        content,
        lifeAreaId: area?._id,
        linkedProjectIds: nproject ? [nproject._id] : undefined,
        tags: tags.length ? tags : undefined,
      });
      const linkedNoteIds = await resolveLinks(ctx, userId, content, id);
      if (linkedNoteIds.length) await ctx.db.patch(id, { linkedNoteIds });
      return `Created note "${str(args.title) ?? "Untitled note"}"`;
    }

    const found = byTitle(notes, str(args.noteTitle));
    if (!found) throw new Error(`Couldn't find a note matching "${args.noteTitle}".`);
    const note = found as unknown as { _id: Id<"notes">; title: string; content: string };
    const noteId = note._id;

    if (tool === "appendNote") {
      const add = str(args.content);
      if (!add) throw new Error("No content to append.");
      const newContent = note.content ? `${note.content}\n\n${add}` : add;
      const linkedNoteIds = await resolveLinks(ctx, userId, newContent, noteId);
      await ctx.db.patch(noteId, { content: newContent, linkedNoteIds });
      return `Appended to "${note.title}"`;
    }

    // updateNote
    const patch: Record<string, unknown> = {};
    if (str(args.newTitle)) patch.title = str(args.newTitle);
    if (str(args.content) !== undefined && typeof args.content === "string") {
      patch.content = args.content;
      patch.linkedNoteIds = await resolveLinks(ctx, userId, args.content, noteId);
    }
    if (!Object.keys(patch).length) throw new Error("Nothing to update.");
    await ctx.db.patch(noteId, patch);
    return `Updated "${note.title}"`;
  }

  // ---- Projects ----
  if (tool === "createProject" || tool === "updateProject" || tool === "addProjectMilestones") {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q: { eq: (a: string, b: unknown) => unknown }) => q.eq("userId", userId))
      .collect();
    const pstatus = (x: unknown): ProjectStatus | undefined =>
      PROJECT_STATUSES.includes(x as ProjectStatus) ? (x as ProjectStatus) : undefined;

    if (tool === "createProject") {
      const area = matchArea(str(args.lifeArea));
      if (!area) throw new Error("No life area exists yet — create one first.");
      const isSprint = args.kind === "sprint";
      const start = Date.now();
      const durationDays = typeof args.durationDays === "number" ? args.durationDays : undefined;
      await ctx.db.insert("projects", {
        userId,
        title: str(args.title) ?? "Untitled project",
        description: str(args.description),
        lifeAreaId: area._id,
        status: pstatus(args.status) ?? (isSprint ? "active" : "planning"),
        progress: 0,
        kind: isSprint ? "sprint" : "standard",
        outcome: str(args.outcome),
        startDate: isSprint ? start : undefined,
        durationDays: isSprint ? durationDays : undefined,
        endDate: isSprint && durationDays ? start + durationDays * DAY : undefined,
        milestones: isSprint ? [] : undefined,
      });
      return `Created ${isSprint ? "sprint" : "project"} in ${area.name}`;
    }

    const project = byTitle(projects, str(args.projectTitle)) as
      | { _id: Id<"projects">; title: string; milestones?: { text: string; done: boolean }[] }
      | undefined;
    if (!project) throw new Error(`Couldn't find a project matching "${args.projectTitle}".`);

    if (tool === "addProjectMilestones") {
      const add = (Array.isArray(args.milestones) ? args.milestones : [])
        .map((m) => str(m))
        .filter((m): m is string => !!m)
        .map((text) => ({ text, done: false }));
      if (!add.length) throw new Error("No milestones provided.");
      const milestones = [...(project.milestones ?? []), ...add];
      await ctx.db.patch(project._id, { milestones, progress: progressOf(milestones) });
      return `Added ${add.length} milestone${add.length === 1 ? "" : "s"} to "${project.title}"`;
    }

    // updateProject
    const patch: Record<string, unknown> = {};
    if (str(args.newTitle)) patch.title = str(args.newTitle);
    if (str(args.description)) patch.description = str(args.description);
    if (pstatus(args.status)) patch.status = args.status;
    if (typeof args.progress === "number")
      patch.progress = Math.max(0, Math.min(100, Math.round(args.progress)));
    if (!Object.keys(patch).length) throw new Error("Nothing to update.");
    await ctx.db.patch(project._id, patch);
    return `Updated "${project.title}"`;
  }

  // ---- Habits ----
  if (tool === "createHabit" || tool === "checkHabitToday") {
    if (tool === "createHabit") {
      const area = matchArea(str(args.lifeArea));
      if (!area) throw new Error("No life area exists yet — create one first.");
      const freq = (x: unknown): Frequency =>
        FREQUENCIES.includes(x as Frequency) ? (x as Frequency) : "daily";
      await ctx.db.insert("habits", {
        userId,
        title: str(args.title) ?? "Untitled habit",
        description: str(args.description),
        frequency: freq(args.frequency),
        target: str(args.target),
        lifeAreaId: area._id,
        streak: 0,
      });
      return `Created habit in ${area.name}`;
    }

    // checkHabitToday — idempotently mark today done + recompute streak
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q: { eq: (a: string, b: unknown) => unknown }) => q.eq("userId", userId))
      .collect();
    const habit = byTitle(habits, str(args.habitTitle)) as
      | { _id: Id<"habits">; title: string }
      | undefined;
    if (!habit) throw new Error(`Couldn't find a habit matching "${args.habitTitle}".`);
    const today = ymd(Date.now());
    const existing = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q: { eq: (a: string, b: unknown) => unknown }) => q.eq("habitId", habit._id))
      .filter((q: { eq: (a: unknown, b: unknown) => unknown; field: (f: string) => unknown }) =>
        q.eq(q.field("date"), today),
      )
      .first();
    if (!existing) await ctx.db.insert("habitCompletions", { userId, habitId: habit._id, date: today });
    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q: { eq: (a: string, b: unknown) => unknown }) => q.eq("habitId", habit._id))
      .collect();
    const dates = new Set<string>((completions as { date: string }[]).map((c) => c.date));
    await ctx.db.patch(habit._id, {
      streak: computeStreak(dates),
      lastCompletedAt: Math.max(...[...dates].map((d) => new Date(d).getTime())),
    });
    return `Checked off "${habit.title}" for today`;
  }

  // ---- Focus ----
  if (tool === "logFocus") {
    const minutes = typeof args.durationMinutes === "number" ? args.durationMinutes : 0;
    if (minutes <= 0) throw new Error("Provide a focus duration in minutes.");
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q: { eq: (a: string, b: unknown) => unknown }) => q.eq("userId", userId))
      .collect();
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q: { eq: (a: string, b: unknown) => unknown }) => q.eq("userId", userId))
      .collect();
    const task = byTitle(tasks, str(args.task)) as { _id: Id<"tasks">; lifeAreaId?: Id<"lifeAreas"> } | undefined;
    const project = byTitle(projects, str(args.project)) as { _id: Id<"projects"> } | undefined;
    const area = str(args.lifeArea) ? matchArea(str(args.lifeArea)) : undefined;
    const end = Date.now();
    const duration = Math.round(minutes * 60);
    await ctx.db.insert("focusSessions", {
      userId,
      startTime: end - duration * 1000,
      endTime: end,
      duration,
      taskId: task?._id,
      projectId: project?._id,
      lifeAreaId: area?._id ?? task?.lifeAreaId,
    });
    return `Logged ${minutes} min of focus`;
  }

  // ---- Daily check-in ----
  if (tool === "logCheckIn") {
    const energyMood = typeof args.energyMood === "number"
      ? Math.max(1, Math.min(10, Math.round(args.energyMood)))
      : 5;
    const priorities = (Array.isArray(args.priorities) ? args.priorities : [])
      .map((p) => str(p))
      .filter((p): p is string => !!p);
    const blockers = (Array.isArray(args.blockers) ? args.blockers : [])
      .map((b) => str(b))
      .filter((b): b is string => !!b);
    const todayStr = ymd(Date.now());
    const existing = await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_date", (q: { eq: (a: string, b: unknown) => { eq: (a: string, b: unknown) => unknown } }) =>
        q.eq("userId", userId).eq("date", todayStr),
      )
      .first();
    const payload = { energyMood, priorities, blockers };
    if (existing) await ctx.db.patch(existing._id, payload);
    else await ctx.db.insert("dailyCheckIns", { userId, date: todayStr, ...payload });
    return `Recorded today's check-in (energy ${energyMood}/10)`;
  }

  throw new Error(`Unknown action: ${tool}`);
}

export const confirmAction = mutation({
  args: { messageId: v.id("aiMessages"), index: v.number() },
  handler: async (ctx, { messageId, index }) => {
    const userId = await requireUser(ctx);
    const msg = await ctx.db.get(messageId);
    if (!msg || msg.userId !== userId || !msg.actions || !msg.actions[index]) return;
    const target = msg.actions[index];
    if (target.status !== "pending") return;

    let status: "done" | "failed" = "done";
    let result: string;
    try {
      result = await execAction(ctx, userId, target.tool, target.args);
    } catch (e) {
      status = "failed";
      result = e instanceof Error ? e.message : String(e);
    }
    const actions = msg.actions.map((a, i) => (i === index ? { ...a, status, result } : a));
    await ctx.db.patch(messageId, { actions });
  },
});

export const cancelAction = mutation({
  args: { messageId: v.id("aiMessages"), index: v.number() },
  handler: async (ctx, { messageId, index }) => {
    const userId = await requireUser(ctx);
    const msg = await ctx.db.get(messageId);
    if (!msg || msg.userId !== userId || !msg.actions || !msg.actions[index]) return;
    if (msg.actions[index].status !== "pending") return;
    const actions = msg.actions.map((a, i) =>
      i === index ? { ...a, status: "cancelled" as const } : a,
    );
    await ctx.db.patch(messageId, { actions });
  },
});

// ---- Module thread management ------------------------------------------

export const ensureModuleThread = mutation({
  args: { module: v.string(), challengeId: v.optional(v.id("challenges")) },
  handler: async (ctx, { module, challengeId }) => {
    const userId = await requireUser(ctx);
    // Challenge coach threads are scoped per challenge via a unique module key.
    const moduleKey = challengeId ? `challenge:${challengeId}` : module;
    const existing = await ctx.db
      .query("aiThreads")
      .withIndex("by_module", (q) => q.eq("userId", userId).eq("moduleKey", moduleKey))
      .first();
    if (existing) return existing._id;
    const title = `${module.charAt(0).toUpperCase()}${module.slice(1)} assistant`;
    return ctx.db.insert("aiThreads", { userId, title, moduleKey, provider: "hy3", challengeId });
  },
});

export const clearModuleThread = mutation({
  args: { threadId: v.id("aiThreads") },
  handler: async (ctx, { threadId }) => {
    await requireUser(ctx);
    const msgs = await ctx.db
      .query("aiMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
    for (const m of msgs) await ctx.db.delete(m._id);
  },
});
