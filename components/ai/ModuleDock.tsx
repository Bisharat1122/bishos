"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Sparkles, X, Send, Check, Ban, Loader2, Trash2, CornerDownLeft,
} from "lucide-react";
import { MarkdownLite } from "@/components/tasks/MarkdownLite";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { AiDots } from "@/components/Skeleton";
import { toast, errorMessage } from "@/components/os/celebrate";
import { cn } from "@/lib/utils";

type ModelKey = "gpt-oss" | "owl" | "openrouter" | "hy3";
const DOCK_MODELS: { key: ModelKey; label: string }[] = [
  { key: "gpt-oss", label: "gpt-oss" },
  { key: "owl", label: "Owl" },
  { key: "openrouter", label: "Nemotron" },
  { key: "hy3", label: "Hunyuan" },
];

const PROMPTS: Record<string, string[]> = {
  goals: [
    "Create a SMART goal to launch bishOS by August",
    "Add 3 milestones to my top goal",
    "What goal am I behind on?",
  ],
  tasks: [
    "Add a high-priority task to finish the landing page by Friday",
    "Mark my design review task done",
    "What should I tackle first today?",
  ],
  notes: [
    "Create a note summarizing my bishOS launch plan",
    "Append today's standup notes to my Work Log note",
    "What have I been writing about lately?",
  ],
  projects: [
    "Start a 30-day sprint to ship the bishOS marketing site",
    "Set my landing-page project to 60%",
    "Add 3 milestones to my top project",
  ],
  habits: [
    "Create a daily habit to journal for 10 minutes",
    "Check off my meditation habit for today",
    "Which habit has my longest streak?",
  ],
  focus: [
    "Log 45 minutes of focus on my design task",
    "Log 2 hours of deep work today",
    "How much have I focused this week?",
  ],
  checkin: [
    "Record my check-in: energy 7, priorities ship landing page and reply to clients",
    "Log today's blockers: waiting on copy review",
    "How's my energy been trending?",
  ],
  challenge: [
    "Log 60 minutes on my Learn block and mark Outreach done",
    "Check me in: energy 4, mood 4, priority ship the landing page",
    "Add a milestone: first paying client by day 20",
  ],
};

export function ModuleDock({ module, challengeId }: { module: string; challengeId?: string }) {
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState<Id<"aiThreads"> | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [model, setModel] = useState<ModelKey>("hy3");

  const ensureThread = useMutation(api.agent.ensureModuleThread);
  const setProvider = useMutation(api.aiThreads.setProvider);
  const confirmAction = useMutation(api.agent.confirmAction);
  const cancelAction = useMutation(api.agent.cancelAction);
  const clearThread = useMutation(api.agent.clearModuleThread);
  const moduleChat = useAction(api.agent.moduleChat);

  const messages = useQuery(
    api.aiThreads.messages,
    threadId ? { threadId } : "skip",
  );
  // Show the thread's real stored model (older threads were created with gpt-oss).
  const storedModel = useQuery(api.aiThreads.provider, threadId ? { threadId } : "skip");
  useEffect(() => {
    if (storedModel && storedModel !== "perplexity") setModel(storedModel);
  }, [storedModel]);

  const bottomRef = useRef<HTMLDivElement>(null);

  const cid = challengeId as Id<"challenges"> | undefined;

  // Lazily create/find the module thread the first time the dock opens.
  useEffect(() => {
    if (open && !threadId) void ensureThread({ module, challengeId: cid }).then(setThreadId).catch(() => {});
  }, [open, threadId, module, cid, ensureThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  function chooseModel(p: ModelKey) {
    setModel(p);
    if (threadId) void setProvider({ threadId, provider: p }).catch(() => {});
  }

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput("");
    setSending(true);
    try {
      let id = threadId;
      if (!id) {
        id = await ensureThread({ module, challengeId: cid });
        setThreadId(id);
        if (model !== "hy3") await setProvider({ threadId: id, provider: model });
      }
      await moduleChat({ threadId: id, module, message: msg });
    } catch (e) {
      // Give the message back so it isn't lost.
      if (!text) setInput((cur) => cur || msg);
      toast(errorMessage(e, "The assistant couldn't reply. Try again."), { tone: "warning" });
    } finally {
      setSending(false);
    }
  }

  const empty = (messages?.length ?? 0) === 0;

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title={`${module} assistant`}
          className="fixed bottom-24 right-5 z-40 flex h-12 w-12 lg:bottom-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-raised transition hover:scale-105"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-24 right-5 z-40 flex h-[min(560px,calc(100dvh-8rem))] lg:bottom-5 w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-raised">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold capitalize">{module} assistant</span>
            <div className="ml-auto flex items-center gap-1">
              {!empty && (
                <button
                  onClick={() => {
                    if (threadId && confirm("Clear this conversation?")) void clearThread({ threadId }).catch(() => {});
                  }}
                  title="Clear conversation"
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Model toggle */}
          <div className="flex flex-wrap gap-1 border-b border-border px-3 py-2">
            {DOCK_MODELS.map((m) => (
              <button
                key={m.key}
                onClick={() => chooseModel(m.key)}
                title={`${m.label} — free, can take actions`}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium transition",
                  model === m.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 text-sm">
            {empty && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground">
                  Ask me to create or change {module}. I&apos;ll show a confirm button before saving anything.
                </p>
                {(PROMPTS[module] ?? []).map((p) => (
                  <button
                    key={p}
                    onClick={() => void send(p)}
                    className="block w-full rounded-lg border border-border px-2.5 py-1.5 text-left text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {messages?.map((m) => (
              <div key={m._id} className={cn(m.role === "user" ? "flex justify-end" : "")}>
                <div
                  className={cn(
                    "max-w-[90%] rounded-xl px-3 py-2",
                    m.role === "user"
                      ? "bg-primary/10 text-foreground"
                      : "bg-muted/50 text-foreground",
                  )}
                >
                  {m.role === "assistant" ? (
                    <MarkdownLite text={m.content} />
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}

                  {/* Proposed agentic actions */}
                  {m.actions?.map((a, i) => (
                    <ActionCard
                      key={i}
                      label={a.label}
                      status={a.status}
                      result={a.result}
                      onConfirm={() =>
                        void confirmAction({ messageId: m._id, index: i }).catch((e) =>
                          toast(errorMessage(e, "Couldn't apply that action."), { tone: "warning" }),
                        )
                      }
                      onCancel={() => void cancelAction({ messageId: m._id, index: i }).catch(() => {})}
                    />
                  ))}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AiDots /> <span className="text-xs">thinking…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="border-t border-border p-2">
            <div className="flex items-end gap-2 rounded-xl border border-input bg-card px-2 py-1.5 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30">
              <AutoGrowTextarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                maxRows={5}
                placeholder={`Message the ${module} assistant…`}
                className="flex-1 bg-transparent py-1 text-sm leading-6 outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => void send()}
                disabled={sending || !input.trim()}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground transition disabled:opacity-40"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
              <CornerDownLeft className="h-3 w-3" /> to send · actions need your confirm
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function ActionCard({
  label,
  status,
  result,
  onConfirm,
  onCancel,
}: {
  label: string;
  status: "pending" | "done" | "cancelled" | "failed";
  result?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className={cn(
        "mt-2 rounded-lg border px-2.5 py-2 text-xs",
        status === "pending" && "border-primary/40 bg-primary/5",
        status === "done" && "border-success/30 bg-success-soft",
        status === "failed" && "border-danger/30 bg-danger-soft",
        status === "cancelled" && "border-border bg-muted/30 opacity-70",
      )}
    >
      <div className="flex items-start gap-1.5">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="font-medium">{label}</span>
      </div>

      {status === "pending" && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={onConfirm}
            className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <Check className="h-3.5 w-3.5" /> Confirm
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <Ban className="h-3.5 w-3.5" /> Cancel
          </button>
        </div>
      )}
      {status === "done" && (
        <p className="mt-1.5 flex items-center gap-1 text-success">
          <Check className="h-3.5 w-3.5" /> {result ?? "Done"}
        </p>
      )}
      {status === "failed" && (
        <p className="mt-1.5 flex items-center gap-1 text-danger">
          <Ban className="h-3.5 w-3.5" /> {result ?? "Failed"}
        </p>
      )}
      {status === "cancelled" && <p className="mt-1.5 text-muted-foreground">Cancelled</p>}
    </div>
  );
}
