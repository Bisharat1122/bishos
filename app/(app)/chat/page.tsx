"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Send, Plus, Sparkles, X, FolderKanban, StickyNote, Layers,
  MessageSquarePlus, Trash2, PanelLeft, Square, RotateCcw, Pencil,
  Copy, Check, NotebookPen, FileText,
} from "lucide-react";
import { MarkdownLite } from "@/components/tasks/MarkdownLite";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { AiDots } from "@/components/Skeleton";
import { SaveToNotesModal } from "@/components/chat/SaveToNotesModal";
import { extractFileText } from "@/lib/extractFile";
import { cn } from "@/lib/utils";

const CTX_ICON = { project: FolderKanban, note: StickyNote, lifeArea: Layers } as const;

type Ref = { type: "project" | "note" | "lifeArea"; id: string; label: string };

// Per-conversation model toggle. Keys match `aiThreads.provider` / MODELS in
// convex/openrouter.ts. "openrouter" is Nemotron (legacy key).
type ModelKey = "openrouter" | "gpt-oss" | "owl" | "hy3";
const MODEL_CHIPS: { key: ModelKey; label: string; tag: string; title: string }[] = [
  { key: "openrouter", label: "Nemotron", tag: "FREE", title: "NVIDIA Nemotron 3 Ultra 550B — free, deep reasoning (slower)" },
  { key: "gpt-oss", label: "gpt-oss", tag: "FREE", title: "OpenAI gpt-oss 120B — free, fast, best for actions/tool-use" },
  { key: "owl", label: "Owl", tag: "FREE", title: "Owl Alpha — free, 1M context, agentic generalist" },
  { key: "hy3", label: "Hunyuan", tag: "FREE", title: "Tencent Hunyuan HY3 — free, agentic generalist" },
];

const QUICK = [
  "What's going on in my life right now?",
  "What should I focus on today?",
  "Summarize my week",
  "Find connections across my notes",
];

export default function ChatPage() {
  const threads = useQuery(api.aiThreads.listThreads);
  const createThread = useMutation(api.aiThreads.createThread);
  const renameThread = useMutation(api.aiThreads.rename);
  const removeThread = useMutation(api.aiThreads.removeThread);
  const setProvider = useMutation(api.aiThreads.setProvider);
  const chat = useAction(api.ai.chat);
  const regenerate = useAction(api.ai.regenerate);
  const stopStream = useMutation(api.ai.stopStream);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const projects = useQuery(api.projects.list);
  const notes = useQuery(api.notes.list, {});
  const areas = useQuery(api.lifeAreas.list);

  const [threadId, setThreadId] = useState<Id<"aiThreads"> | null>(null);
  const messages = useQuery(api.aiThreads.messages, threadId ? { threadId } : "skip");

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [ref, setRef] = useState<Ref | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [attachments, setAttachments] = useState<
    { name: string; text: string; storageId: string; contentType: string }[]
  >([]);
  const [extracting, setExtracting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // "/" at the start of the input opens the context picker
  const slashQuery = input.startsWith("/") ? input.slice(1).toLowerCase() : null;
  const contextItems: Ref[] = [
    ...(projects ?? []).map((p) => ({ type: "project" as const, id: p._id, label: p.title })),
    ...(notes ?? []).map((n) => ({ type: "note" as const, id: n._id, label: n.title })),
    ...(areas ?? []).map((a) => ({ type: "lifeArea" as const, id: a._id, label: a.name })),
  ];
  const slashItems =
    slashQuery !== null
      ? contextItems.filter((it) => it.label.toLowerCase().includes(slashQuery)).slice(0, 8)
      : [];

  function pickContext(it: Ref) {
    setRef(it);
    setInput("");
  }

  async function handleFile(file: File) {
    setExtracting(true);
    try {
      const text = await extractFileText(file);
      // store the file so it's downloadable from the chat later
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      const { storageId } = await res.json();
      setAttachments((a) => [
        ...a,
        { name: file.name, text, storageId, contentType: file.type },
      ]);
    } finally {
      setExtracting(false);
    }
  }
  const [editingId, setEditingId] = useState<Id<"aiThreads"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [saveContent, setSaveContent] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<ModelKey>("hy3");

  // Legacy threads may still carry the retired "perplexity" value — map those to
  // the default so the toggle stays type-safe and shows a valid active model.
  const storedProvider = threads?.find((t) => t._id === threadId)?.provider;
  const activeProvider: ModelKey = threadId
    ? storedProvider && storedProvider !== "perplexity"
      ? storedProvider
      : "hy3"
    : pendingProvider;

  function chooseProvider(p: ModelKey) {
    if (threadId) void setProvider({ threadId, provider: p });
    else setPendingProvider(p);
  }

  const contextTokens = Math.round(
    (messages?.reduce((s, m) => s + m.content.length, 0) ?? 0) / 4,
  );

  function copyMsg(id: string, text: string) {
    void navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
  }

  useEffect(() => {
    if (threads && threads.length > 0 && !threadId) setThreadId(threads[0]._id);
  }, [threads, threadId]);

  const streamingMsg = messages?.find((m) => m.streaming);
  const isStreaming = Boolean(streamingMsg);
  const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1] : null;

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending || isStreaming) return;
    if (!text && msg.startsWith("/")) return; // slash is a command, not a message
    const attachmentText = attachments
      .filter((a) => a.text.trim())
      .map((a) => `[File: ${a.name}]\n${a.text}`)
      .join("\n\n");
    const attachmentMeta = attachments.map((a) => ({
      storageId: a.storageId as Id<"_storage">,
      name: a.name,
      contentType: a.contentType,
    }));
    setInput("");
    setSending(true);
    try {
      let id = threadId;
      const isNew = !id || (messages?.length ?? 0) === 0;
      if (!id) {
        id = await createThread({});
        setThreadId(id);
        await setProvider({ threadId: id, provider: pendingProvider });
      }
      if (isNew && id) await renameThread({ threadId: id, title: msg });
      await chat({
        threadId: id,
        message: msg,
        contextRef: ref ? { type: ref.type, id: ref.id } : undefined,
        attachmentText: attachmentText || undefined,
        attachments: attachmentMeta.length ? attachmentMeta : undefined,
      });
      setAttachments([]);
    } finally {
      setSending(false);
    }
  }

  async function doRegenerate() {
    if (!threadId || isStreaming) return;
    setSending(true);
    try {
      await regenerate({ threadId });
    } finally {
      setSending(false);
    }
  }

  async function newChat() {
    const id = await createThread({});
    setThreadId(id);
    setHistoryOpen(false);
  }

  const ThreadList = (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card/30">
      <div className="p-3">
        <button onClick={() => void newChat()} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
          <MessageSquarePlus className="h-4 w-4" /> New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {threads?.map((t) => (
          <div
            key={t._id}
            className={cn(
              "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              threadId === t._id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            {editingId === t._id ? (
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => {
                  if (editTitle.trim()) void renameThread({ threadId: t._id, title: editTitle.trim() });
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (editTitle.trim()) void renameThread({ threadId: t._id, title: editTitle.trim() });
                    setEditingId(null);
                  } else if (e.key === "Escape") setEditingId(null);
                }}
                className="flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-sm outline-none"
              />
            ) : (
              <>
                <button onClick={() => { setThreadId(t._id); setHistoryOpen(false); }} className="flex-1 truncate text-left">
                  {t.title}
                </button>
                <button
                  onClick={() => { setEditingId(t._id); setEditTitle(t.title); }}
                  className="text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100"
                  title="Rename"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { void removeThread({ threadId: t._id }); if (threadId === t._id) setThreadId(null); }}
                  className="text-muted-foreground opacity-0 transition hover:text-warning group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
        {threads?.length === 0 && <p className="px-3 py-6 text-center text-xs text-muted-foreground">No conversations yet.</p>}
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      <div className="hidden md:block">{ThreadList}</div>
      {historyOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setHistoryOpen(false)} />
          <div className="absolute left-0 top-0 h-full">{ThreadList}</div>
        </div>
      )}

      <div className="flex h-full flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4 sm:px-8">
          <button onClick={() => setHistoryOpen(true)} className="md:hidden"><PanelLeft className="h-5 w-5" /></button>
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="hidden font-semibold sm:block">AI Chat</h1>

          <div className="ml-auto flex items-center gap-2">
            {/* per-conversation model toggle */}
            <div className="flex rounded-full border border-border p-0.5 text-xs">
              {MODEL_CHIPS.map((m) => {
                const active = activeProvider === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => chooseProvider(m.key)}
                    title={m.title}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {m.label}
                    <span
                      className={cn(
                        "rounded px-1 text-[9px]",
                        active ? "bg-primary-foreground/20" : "bg-muted",
                      )}
                    >
                      {m.tag}
                    </span>
                  </button>
                );
              })}
            </div>
            {contextTokens > 0 && (
              <span
                className="hidden rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground lg:inline"
                title="Approximate tokens of this conversation kept in context"
              >
                ~{contextTokens.toLocaleString()} tokens
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-8">
          {(!messages || messages.length === 0) && (
            <div className="mx-auto max-w-lg pt-16 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
              <p className="font-medium">Ask me anything about your life.</p>
              <p className="mt-1 text-sm text-muted-foreground">I know your tasks, projects, goals, focus, habits, notes and check-ins.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => void send(q)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/60 hover:text-foreground">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages?.map((m) => {
            const isLastAssistant = m.role === "assistant" && m._id === lastMsg?._id;
            return (
              <div key={m._id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className="max-w-[75%]">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm",
                      m.role === "user"
                        ? "whitespace-pre-wrap bg-primary text-primary-foreground"
                        : "border border-border bg-card",
                    )}
                  >
                    {m.role === "user" ? (
                      m.content
                    ) : m.content ? (
                      <>
                        <MarkdownLite text={m.content} />
                        {m.streaming && <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-primary align-middle" />}
                      </>
                    ) : (
                      <AiDots />
                    )}
                  </div>

                  {m.role === "user" && m.attachments && m.attachments.length > 0 && (
                    <div className="mt-1 flex flex-wrap justify-end gap-1.5">
                      {m.attachments.map((a) => (
                        <AttachmentDownload key={a.storageId} att={a} />
                      ))}
                    </div>
                  )}

                  {m.role === "assistant" && !m.streaming && m.content && (
                    <div className="mt-1 flex items-center gap-1 pl-1">
                      <ActionIcon title="Copy" onClick={() => copyMsg(m._id, m.content)}>
                        {copiedId === m._id ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </ActionIcon>
                      <ActionIcon title="Save to notes" onClick={() => setSaveContent(m.content)}>
                        <NotebookPen className="h-3.5 w-3.5" />
                      </ActionIcon>
                      {isLastAssistant && (
                        <ActionIcon title="Regenerate" onClick={() => void doRegenerate()}>
                          <RotateCcw className="h-3.5 w-3.5" />
                        </ActionIcon>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {sending && !isStreaming && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <AiDots />
              </div>
            </div>
          )}
        </div>

        <div className="relative border-t border-border px-4 py-4 sm:px-8">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.pptx,.xlsx,.xls,.csv,.txt,.md,.json,.yaml,.yml,.log"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />

          {/* attached context + files */}
          {(ref || attachments.length > 0 || extracting) && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {extracting && (
                <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Reading file…
                </span>
              )}
              {ref && (
                <span className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs text-primary">
                  {(() => {
                    const I = CTX_ICON[ref.type];
                    return <I className="h-3 w-3" />;
                  })()}
                  {ref.label}
                  <button onClick={() => setRef(null)}><X className="h-3 w-3" /></button>
                </span>
              )}
              {attachments.map((a, i) => (
                <span key={i} className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  {a.name}
                  {a.text.trim() ? (
                    <span className="text-primary">· {Math.max(1, Math.round(a.text.length / 4))} tok</span>
                  ) : (
                    <span className="text-warning">· couldn&apos;t read</span>
                  )}
                  <button onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* slash context menu */}
          {slashQuery !== null && slashItems.length > 0 && (
            <div className="absolute bottom-20 left-4 z-20 max-h-72 w-80 overflow-y-auto rounded-xl border border-border bg-card shadow-xl sm:left-8">
              <p className="border-b border-border px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                Attach context
              </p>
              {slashItems.map((it) => {
                const I = CTX_ICON[it.type];
                return (
                  <button
                    key={`${it.type}-${it.id}`}
                    onClick={() => pickContext(it)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <I className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{it.label}</span>
                    <span className="ml-auto text-[10px] uppercase text-muted-foreground/60">
                      {it.type === "lifeArea" ? "area" : it.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-border bg-muted/30 px-3 py-2">
            <button
              onClick={() => fileRef.current?.click()}
              title="Attach a document (PDF, Word, PowerPoint, Excel, text) for the AI to analyze"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            >
              {extracting ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
            <AutoGrowTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  if (slashQuery !== null && slashItems.length > 0) {
                    e.preventDefault();
                    pickContext(slashItems[0]);
                  } else {
                    e.preventDefault();
                    void send();
                  }
                }
              }}
              placeholder="Ask anything…  ( / to attach context · + to upload a file )"
              className="flex-1 bg-transparent py-1 text-sm leading-6 outline-none placeholder:text-muted-foreground"
            />
            {isStreaming && streamingMsg ? (
              <button onClick={() => void stopStream({ messageId: streamingMsg._id })} title="Stop" className="flex h-9 w-9 items-center justify-center rounded-full bg-warning text-background">
                <Square className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={() => void send()} disabled={sending} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {saveContent !== null && (
        <SaveToNotesModal content={saveContent} onClose={() => setSaveContent(null)} />
      )}
    </div>
  );
}

function AttachmentDownload({
  att,
}: {
  att: { storageId: Id<"_storage">; name: string };
}) {
  const url = useQuery(api.files.getUrl, { storageId: att.storageId });
  return (
    <a
      href={url ?? "#"}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:text-primary"
    >
      <FileText className="h-3 w-3" />
      <span className="max-w-[12rem] truncate">{att.name}</span>
    </a>
  );
}

function ActionIcon({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

