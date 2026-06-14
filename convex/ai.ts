import { v } from "convex/values";
import { action, mutation, internalQuery, internalMutation, ActionCtx } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./helpers";
import { callOpenRouter, aiConfig, stripCitations, enforceAlternation } from "./openrouter";

const DAY = 24 * 60 * 60 * 1000;
const ymd = (ts: number) => new Date(ts).toISOString().slice(0, 10);

/**
 * Assemble the user's full life-state (sections A–H) as background memory.
 * Everything is queryable, so memory updates with no manual "teach me" step.
 */
export const gatherContext = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const now = Date.now();
    const { weekStart } = (() => {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - d.getDay());
      return { weekStart: d.getTime() };
    })();

    const [areas, tasks, projects, goals, notes, habits, focus, hcompletions, checkins, profile] =
      await Promise.all([
        ctx.db.query("lifeAreas").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("goals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").take(30),
        ctx.db.query("habits").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("focusSessions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("habitCompletions").withIndex("by_date", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("dailyCheckIns").withIndex("by_date", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).first(),
      ]);

    const profileStr = profile
      ? [
          profile.name ? `Name: ${profile.name}` : "",
          profile.city ? `City: ${profile.city}` : "",
          profile.occupation ? `Does: ${profile.occupation}` : "",
          profile.business ? `Business: ${profile.business}` : "",
          profile.situation ? `Current situation: ${profile.situation}` : "",
          profile.about ? `About: ${profile.about.slice(0, 2500)}` : "",
          profile.preferences ? `How he wants help: ${profile.preferences.slice(0, 1200)}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "No profile filled in yet.";

    const areaName = (id?: string) => areas.find((a) => a._id === id)?.name ?? "—";
    const open = tasks.filter((t) => t.status !== "done");
    const todayStr = ymd(now);

    // focus this week per area
    let focusWeek = 0;
    const focusByArea = new Map<string, number>();
    for (const s of focus) {
      if (s.endTime >= weekStart) {
        focusWeek += s.duration;
        if (s.lifeAreaId) focusByArea.set(s.lifeAreaId, (focusByArea.get(s.lifeAreaId) ?? 0) + s.duration);
      }
    }
    const todayDone = new Set(hcompletions.filter((c) => c.date === todayStr).map((c) => c.habitId));
    const latestCheckin = checkins.sort((a, b) => a.date.localeCompare(b.date)).at(-1);

    const deadlines = open
      .filter((t) => t.dueDate != null && t.dueDate <= now + 7 * DAY)
      .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));

    return [
      `=== WHO YOU'RE TALKING TO (profile) ===\n${profileStr}`,
      `LIFE AREAS: ${areas.map((a) => a.name).join(", ") || "none"}.`,
      `TODAY'S TASKS (${open.length} open): ` +
        open.slice(0, 15).map((t) => `[${t.priority}] ${t.title} (${areaName(t.lifeAreaId)})`).join("; "),
      `PROJECTS: ` +
        projects.map((p) => `${p.title} [${p.kind ?? "standard"}, ${p.status}, ${p.progress}%]`).join("; "),
      `GOALS: ` + goals.map((g) => `${g.title} ${g.progress}%`).join("; "),
      `FOCUS THIS WEEK: ${(focusWeek / 3600).toFixed(1)}h — ` +
        [...focusByArea.entries()].map(([id, s]) => `${areaName(id)} ${(s / 3600).toFixed(1)}h`).join(", "),
      `HABITS: ` +
        habits.map((hh) => `${hh.title} (streak ${hh.streak}, ${todayDone.has(hh._id) ? "done today" : "not yet"})`).join("; "),
      `UPCOMING DEADLINES (7d): ` +
        deadlines.map((t) => `${t.title} (${ymd(t.dueDate!)})`).join("; ") || "none",
      `RECENT NOTES: ` + notes.map((n) => n.title).join("; "),
      latestCheckin
        ? `LATEST CHECK-IN (${latestCheckin.date}): energy ${latestCheckin.energyMood}/10; priorities: ${latestCheckin.priorities.join(", ")}; blockers: ${latestCheckin.blockers.join(", ") || "none"}.`
        : "No check-ins yet.",
    ].join("\n");
  },
});

/** Resolve a `/add` reference to focused context text. */
async function resolveContextRef(
  ctx: ActionCtx,
  ref: { type: string; id: string },
): Promise<string> {
  if (ref.type === "project") {
    const d = (await ctx.runQuery(api.projects.detail, { id: ref.id as Id<"projects"> })) as
      | { project: { title: string; outcome?: string; status: string }; tasks: { title: string }[]; notes: { title: string; content: string }[] }
      | null;
    if (!d) return "";
    return [
      `PROJECT "${d.project.title}" (${d.project.status})${d.project.outcome ? ` — outcome: ${d.project.outcome}` : ""}.`,
      `Tasks: ${d.tasks.map((t) => t.title).join("; ") || "none"}.`,
      `Linked notes: ${d.notes.map((n) => `${n.title}: ${n.content.slice(0, 3000)}`).join("\n") || "none"}.`,
    ].join("\n");
  }
  if (ref.type === "note") {
    const n = (await ctx.runQuery(api.notes.get, { id: ref.id as Id<"notes"> })) as
      | { title: string; content: string }
      | null;
    return n ? `NOTE "${n.title}":\n${n.content.slice(0, 20000)}` : "";
  }
  if (ref.type === "lifeArea") {
    const d = (await ctx.runQuery(api.lifeAreas.overview, { id: ref.id as Id<"lifeAreas"> })) as
      | { area: { name: string }; sections: { name: string }[]; tasks: { title: string }[]; goals: { title: string }[] }
      | null;
    if (!d) return "";
    return [
      `LIFE AREA "${d.area.name}".`,
      `Sections: ${d.sections.map((s) => s.name).join(", ")}.`,
      `Tasks: ${d.tasks.map((t) => t.title).join("; ")}.`,
      `Goals: ${d.goals.map((g) => g.title).join("; ")}.`,
    ].join("\n");
  }
  return "";
}

function buildSystemPrompt(context: string, focused: string): string {
  return [
    "You are bishOS — Bish's lifelong second brain and Life OS.",
    "You know everything in his system and speak in his voice: direct, sharp, practical.",
    "Use the PROFILE below to address him by name and tailor every answer to his city, business, and current situation. Reference these facts naturally; never ask him for details that are already in his profile.",
    "Use the life-state below as background memory. Be concise and actionable. When he asks",
    "'what's going on in my life', cover: today's tasks, projects, goals, focus, habits, deadlines, recent learning, and one clear suggestion.",
    "",
    "=== CURRENT LIFE STATE ===",
    context,
    focused ? "\n=== FOCUSED CONTEXT (/add) ===\n" + focused : "",
  ].join("\n");
}

const attachmentMeta = v.object({
  storageId: v.id("_storage"),
  name: v.string(),
  contentType: v.string(),
});

export const createTurn = internalMutation({
  args: {
    threadId: v.id("aiThreads"),
    userMessage: v.string(),
    attachments: v.optional(v.array(attachmentMeta)),
  },
  handler: async (ctx, { threadId, userMessage, attachments }) => {
    const thread = await ctx.db.get(threadId);
    if (!thread) throw new Error("Thread not found");
    await ctx.db.insert("aiMessages", {
      userId: thread.userId,
      threadId,
      role: "user",
      content: userMessage,
      attachments: attachments && attachments.length ? attachments : undefined,
    });
    return ctx.db.insert("aiMessages", { userId: thread.userId, threadId, role: "assistant", content: "", streaming: true });
  },
});

export const createAssistant = internalMutation({
  args: { threadId: v.id("aiThreads") },
  handler: async (ctx, { threadId }) => {
    const thread = await ctx.db.get(threadId);
    if (!thread) throw new Error("Thread not found");
    return ctx.db.insert("aiMessages", { userId: thread.userId, threadId, role: "assistant", content: "", streaming: true });
  },
});

export const patchMessage = internalMutation({
  args: { messageId: v.id("aiMessages"), content: v.string(), streaming: v.optional(v.boolean()) },
  handler: async (ctx, { messageId, content, streaming }) => {
    const patch: Record<string, unknown> = { content };
    if (streaming !== undefined) patch.streaming = streaming;
    await ctx.db.patch(messageId, patch);
  },
});

export const messageStreaming = internalQuery({
  args: { messageId: v.id("aiMessages") },
  handler: async (ctx, { messageId }) => (await ctx.db.get(messageId))?.streaming === true,
});

export const threadProvider = internalQuery({
  args: { threadId: v.id("aiThreads") },
  handler: async (ctx, { threadId }) => (await ctx.db.get(threadId))?.provider,
});

export const lastUserMessage = internalQuery({
  args: { threadId: v.id("aiThreads") },
  handler: async (ctx, { threadId }) => {
    const msgs = await ctx.db.query("aiMessages").withIndex("by_thread", (q) => q.eq("threadId", threadId)).collect();
    for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].role === "user") return msgs[i].content;
    return null;
  },
});

/** Full prior conversation (for memory), excluding the streaming placeholder. */
export const historyMessages = internalQuery({
  args: { threadId: v.id("aiThreads"), excludeId: v.optional(v.id("aiMessages")) },
  handler: async (ctx, { threadId, excludeId }) => {
    const msgs = await ctx.db.query("aiMessages").withIndex("by_thread", (q) => q.eq("threadId", threadId)).collect();
    return msgs
      .filter((m) => m._id !== excludeId && m.content.trim().length > 0)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
      .slice(-30); // cap to last 30 turns to bound context size
  },
});

export const deleteLastAssistant = internalMutation({
  args: { threadId: v.id("aiThreads") },
  handler: async (ctx, { threadId }) => {
    const msgs = await ctx.db.query("aiMessages").withIndex("by_thread", (q) => q.eq("threadId", threadId)).collect();
    const last = msgs[msgs.length - 1];
    if (last && last.role === "assistant") await ctx.db.delete(last._id);
  },
});

/** Public: stop a streaming reply (Stop button sets the flag; the action sees it and ends). */
export const stopStream = mutation({
  args: { messageId: v.id("aiMessages") },
  handler: async (ctx, { messageId }) => {
    await requireUser(ctx);
    await ctx.db.patch(messageId, { streaming: false });
  },
});

/** Stream an assistant reply into an existing message doc; returns the final text. */
async function streamAssistant(
  ctx: ActionCtx,
  assistantId: Id<"aiMessages">,
  messages: { role: string; content: string }[],
  providerOverride?: string,
): Promise<string> {
  const cfg = aiConfig(providerOverride);
  if (!cfg.apiKey) {
    await ctx.runMutation(internal.ai.patchMessage, { messageId: assistantId, content: `⚠️ ${cfg.keyName} not set.`, streaming: false });
    return "";
  }
  const { endpoint, apiKey, model } = cfg;
  const safeMessages = enforceAlternation(messages);

  let res: Response | null = null;
  for (let a = 0; a < 5; a++) {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: safeMessages, stream: true }),
    });
    if (res.ok) break;
    if (res.status === 429 && a < 4) {
      await new Promise((r) => setTimeout(r, 1200 * (a + 1)));
      continue;
    }
    const t = await res.text();
    await ctx.runMutation(internal.ai.patchMessage, { messageId: assistantId, content: `⚠️ AI error ${res.status}. ${t.slice(0, 140)}`, streaming: false });
    return "";
  }
  if (!res || !res.body) {
    await ctx.runMutation(internal.ai.patchMessage, { messageId: assistantId, content: "⚠️ No response stream.", streaming: false });
    return "";
  }

  let acc = "";
  try {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "", lastFlush = 0, lastCheck = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n");
      buf = parts.pop() ?? "";
      for (const p of parts) {
        const l = p.trim();
        if (!l.startsWith("data:")) continue;
        const d = l.slice(5).trim();
        if (d === "[DONE]") continue;
        try {
          const delta = JSON.parse(d)?.choices?.[0]?.delta?.content;
          if (typeof delta === "string") acc += delta;
        } catch {
          /* partial json line */
        }
      }
      const now = Date.now();
      if (now - lastFlush > 250 && acc) {
        lastFlush = now;
        await ctx.runMutation(internal.ai.patchMessage, { messageId: assistantId, content: stripCitations(acc, cfg.provider) });
      }
      if (now - lastCheck > 600) {
        lastCheck = now;
        const still = await ctx.runQuery(internal.ai.messageStreaming, { messageId: assistantId });
        if (!still) {
          try { await reader.cancel(); } catch { /* ignore */ }
          break;
        }
      }
    }
  } catch {
    // Streaming not supported / failed mid-way — fall back to a single non-streaming call.
    if (!acc) {
      try {
        const r2 = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages: safeMessages }),
        });
        if (r2.ok) acc = (await r2.json())?.choices?.[0]?.message?.content ?? "";
      } catch {
        /* give up gracefully below */
      }
    }
  }
  const finalText = stripCitations(acc, cfg.provider);
  await ctx.runMutation(internal.ai.patchMessage, { messageId: assistantId, content: finalText || "(no response)", streaming: false });
  return finalText;
}

export const chat = action({
  args: {
    threadId: v.id("aiThreads"),
    message: v.string(),
    contextRef: v.optional(v.object({ type: v.string(), id: v.string() })),
    attachmentText: v.optional(v.string()),
    attachments: v.optional(v.array(attachmentMeta)),
  },
  handler: async (ctx, args): Promise<string> => {
    const context: string = await ctx.runQuery(internal.ai.gatherContext, {});
    const refText = args.contextRef ? await resolveContextRef(ctx, args.contextRef) : "";
    const fileText = args.attachmentText?.trim()
      ? "Attached file(s):\n" + args.attachmentText.slice(0, 100000)
      : "";
    const focused = [refText, fileText].filter(Boolean).join("\n\n");
    const systemPrompt = buildSystemPrompt(context, "");
    const assistantId = await ctx.runMutation(internal.ai.createTurn, {
      threadId: args.threadId,
      userMessage: args.message,
      attachments: args.attachments,
    });
    // include the whole conversation so the AI has memory of this chat
    const history = await ctx.runQuery(internal.ai.historyMessages, {
      threadId: args.threadId,
      excludeId: assistantId,
    });
    const provider = await ctx.runQuery(internal.ai.threadProvider, { threadId: args.threadId });

    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...history,
    ];
    // Inject the explicitly attached (/add) context right beside the question
    // so the model can't miss it.
    if (focused && messages.length > 1) {
      const last = messages[messages.length - 1];
      messages[messages.length - 1] = {
        role: last.role,
        content:
          "The user attached this specific context with /add — base your answer primarily on it:\n\n" +
          focused +
          "\n\n--- User's message ---\n" +
          last.content,
      };
    }

    return streamAssistant(ctx, assistantId, messages, provider ?? undefined);
  },
});

export const regenerate = action({
  args: { threadId: v.id("aiThreads") },
  handler: async (ctx, { threadId }): Promise<string> => {
    const lastUser = await ctx.runQuery(internal.ai.lastUserMessage, { threadId });
    if (!lastUser) return "";
    await ctx.runMutation(internal.ai.deleteLastAssistant, { threadId });
    const context: string = await ctx.runQuery(internal.ai.gatherContext, {});
    const assistantId = await ctx.runMutation(internal.ai.createAssistant, { threadId });
    const history = await ctx.runQuery(internal.ai.historyMessages, { threadId, excludeId: assistantId });
    const provider = await ctx.runQuery(internal.ai.threadProvider, { threadId });
    return streamAssistant(
      ctx,
      assistantId,
      [{ role: "system", content: buildSystemPrompt(context, "") }, ...history],
      provider ?? undefined,
    );
  },
});

/** Summarize a note (Second Brain summarizer). */
export const summarizeNote = action({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }): Promise<string> => {
    const note = await ctx.runQuery(api.notes.get, { id: noteId });
    if (!note) throw new Error("Note not found.");
    return callOpenRouter([
      { role: "system", content: "You summarize Bish's notes crisply and faithfully." },
      {
        role: "user",
        content: `Summarize this note in 3–5 tight bullet points, then one key takeaway.\n\nTitle: ${note.title}\n\n${note.content.slice(0, 40000)}`,
      },
    ]);
  },
});

/** Knowledge connector — suggest which other notes relate to this one. */
export const relatedNotes = action({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }): Promise<string> => {
    const note = await ctx.runQuery(api.notes.get, { id: noteId });
    if (!note) throw new Error("Note not found.");
    const titles = await ctx.runQuery(api.notes.titles, {});
    const list = titles.filter((t) => t._id !== noteId).map((t) => `- ${t.title}`).join("\n");
    return callOpenRouter([
      { role: "system", content: "You are Bish's knowledge connector. Find genuine conceptual links between notes; don't force weak ones." },
      {
        role: "user",
        content: `Here is a note:\nTitle: ${note.title}\n${note.content.slice(0, 20000)}\n\nFrom my other notes below, list up to 5 most related (use the exact titles as [[Title]]) with one short reason each. If none clearly relate, say so.\n\n${list || "(no other notes)"}`,
      },
    ]);
  },
});

/** Break a goal into concrete milestones and add them to the goal. */
export const goalMilestones = action({
  args: { goalId: v.id("goals") },
  handler: async (ctx, { goalId }): Promise<string[]> => {
    const goal = await ctx.runQuery(api.goals.get, { id: goalId });
    if (!goal) throw new Error("Goal not found.");
    const text = await callOpenRouter([
      { role: "system", content: "You break goals into concrete, sequenced action milestones. Output ONLY milestones, one per line, no numbering or preamble." },
      {
        role: "user",
        content: `Break this goal into 4–6 concrete, sequenced milestones.\n\nGoal: ${goal.title}\n${goal.description ?? ""}\nSMART: ${JSON.stringify(goal.smart ?? {})}`,
      },
    ]);
    const lines = text
      .split("\n")
      .map((l) => l.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
      .filter((l) => l.length > 2)
      .slice(0, 6);
    for (const m of lines) await ctx.runMutation(api.goals.addMilestone, { id: goalId, text: m });
    return lines;
  },
});

/** Dashboard AI insights — 3 specific, data-grounded suggestions. */
export const insights = action({
  args: {},
  handler: async (ctx): Promise<{ title: string; body: string }[]> => {
    const context: string = await ctx.runQuery(internal.ai.gatherContext, {});
    const text = await callOpenRouter([
      { role: "system", content: "You are Bish's analyst. Output exactly 3 insights. Each on its own line as 'Title :: one concrete, actionable sentence'. No preamble." },
      { role: "user", content: `Based on my current state, give 3 specific insights about focus balance, habits, and priorities.\n\n${context}` },
    ]);
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const i = l.indexOf("::");
        const clean = (s: string) => s.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim();
        return i > 0
          ? { title: clean(l.slice(0, i)), body: l.slice(i + 2).trim() }
          : { title: "Insight", body: clean(l) };
      })
      .filter((x) => x.body)
      .slice(0, 3);
  },
});
