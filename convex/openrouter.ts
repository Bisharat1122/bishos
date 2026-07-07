// Shared AI caller with retry/backoff. All models are hosted on OpenRouter and
// share the one OPENROUTER_API_KEY; the selected model id is switchable per
// conversation (see MODELS below) or via the AI_PROVIDER / OPENROUTER_MODEL env.

type Msg = { role: "system" | "user" | "assistant"; content: string };

/**
 * Selectable models, keyed by the value stored on `aiThreads.provider`.
 * The legacy key "openrouter" (= Nemotron) is preserved so existing threads
 * keep working without a migration. All models are OpenRouter-hosted and share
 * the one OPENROUTER_API_KEY.
 *
 * `toolCalling` flags whether the model can drive agentic tool/function calls
 * (used by the per-module AI windows).
 */
export const MODELS = {
  openrouter: {
    provider: "openrouter" as const,
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    label: "Nemotron",
    toolCalling: true,
  },
  "gpt-oss": {
    provider: "openrouter" as const,
    model: "openai/gpt-oss-120b:free",
    label: "gpt-oss 120B",
    toolCalling: true,
  },
  owl: {
    provider: "openrouter" as const,
    model: "openrouter/owl-alpha",
    label: "Owl Alpha",
    toolCalling: true,
  },
  hy3: {
    provider: "openrouter" as const,
    model: "tencent/hy3:free",
    label: "Hunyuan",
    toolCalling: true,
  },
} as const;

export type ModelKey = keyof typeof MODELS;

/** Resolve a model's endpoint / key / id. `override` (per-conversation model
 * key) wins over the AI_PROVIDER env default. Unknown keys fall back to
 * Nemotron. */
export function aiConfig(override?: string) {
  const key = (override ?? process.env.AI_PROVIDER ?? "openrouter") as string;
  // Unknown keys (including the retired "perplexity" value on legacy threads)
  // fall back to Nemotron so old conversations keep working.
  const entry = (MODELS as Record<string, (typeof MODELS)[ModelKey]>)[key] ?? MODELS.openrouter;
  return {
    provider: "openrouter" as const,
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: process.env.OPENROUTER_API_KEY,
    // OPENROUTER_MODEL env still overrides the default Nemotron selection only.
    model: key === "openrouter" && process.env.OPENROUTER_MODEL ? process.env.OPENROUTER_MODEL : entry.model,
    keyName: "OPENROUTER_API_KEY",
  };
}

/**
 * Guarantee a valid chat sequence: a leading system message, then strictly
 * alternating user/assistant turns, ending with a user message. Required by
 * Perplexity (it 400s otherwise) and harmless for OpenRouter. Consecutive
 * same-role messages are merged; empties are dropped.
 */
export function enforceAlternation<T extends { role: string; content: string }>(
  messages: T[],
): T[] {
  const system = messages.filter((m) => m.role === "system");
  const convo = messages.filter((m) => m.role !== "system");
  const out: T[] = [];
  for (const m of convo) {
    if (!m.content?.trim()) continue;
    const last = out[out.length - 1];
    if (out.length === 0) {
      if (m.role !== "user") continue; // conversation must start with user
      out.push({ ...m });
    } else if (last.role === m.role) {
      out[out.length - 1] = { ...last, content: `${last.content}\n\n${m.content}` };
    } else {
      out.push({ ...m });
    }
  }
  while (out.length && out[out.length - 1].role !== "user") out.pop();
  return [...system, ...out];
}

/** Remove Perplexity's inline citation markers like [1], [2], [1, 3]. */
export function stripCitations(text: string, provider: string): string {
  if (provider !== "perplexity") return text;
  return text
    .replace(/\s?\[\d+(?:\s*,\s*\d+)*\]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export type ToolCall = { name: string; args: Record<string, unknown> };

/**
 * Call a tool-calling model once. Returns the assistant text plus any proposed
 * tool calls (parsed from `tool_calls`). Used by the agentic per-module windows.
 * `tools` is the OpenAI function-calling schema array; pass [] for plain chat.
 */
export async function callWithTools(
  messages: Msg[],
  tools: unknown[],
  modelKey?: string,
  opts: { maxRetries?: number } = {},
): Promise<{ content: string; toolCalls: ToolCall[] }> {
  const cfg = aiConfig(modelKey);
  if (!cfg.apiKey) throw new Error(`${cfg.keyName} is not set in the Convex environment.`);
  const maxRetries = opts.maxRetries ?? 3;
  const safeMessages = enforceAlternation(messages);
  const body: Record<string, unknown> = { model: cfg.model, messages: safeMessages };
  if (tools.length) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  let lastErr = "AI call failed";
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(cfg.endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const json = await res.json();
      const msg = json.choices?.[0]?.message ?? {};
      const toolCalls: ToolCall[] = Array.isArray(msg.tool_calls)
        ? msg.tool_calls
            .filter((tc: { function?: { name?: string } }) => tc?.function?.name)
            .map((tc: { function: { name: string; arguments?: string } }) => {
              let args: Record<string, unknown> = {};
              try {
                args = JSON.parse(tc.function.arguments || "{}");
              } catch {
                /* model emitted invalid JSON args — leave empty */
              }
              return { name: tc.function.name, args };
            })
        : [];
      return { content: stripCitations(msg.content ?? "", cfg.provider), toolCalls };
    }

    const status = res.status;
    const text = await res.text();
    lastErr = `${cfg.provider} ${status}: ${text}`;
    if (status === 429 && attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, Math.min(1200 * (attempt + 1), 6000)));
      continue;
    }
    break;
  }
  throw new Error(lastErr);
}

export async function callOpenRouter(
  messages: Msg[],
  opts: { maxRetries?: number } = {},
): Promise<string> {
  const cfg = aiConfig();
  if (!cfg.apiKey) throw new Error(`${cfg.keyName} is not set in the Convex environment.`);
  const maxRetries = opts.maxRetries ?? 4;
  const safeMessages = enforceAlternation(messages);

  let lastErr = "AI call failed";
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(cfg.endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: cfg.model, messages: safeMessages }),
    });

    if (res.ok) {
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content ?? "(no response)";
      return stripCitations(content, cfg.provider);
    }

    const status = res.status;
    const text = await res.text();
    lastErr = `${cfg.provider} ${status}: ${text}`;

    if (status === 429 && attempt < maxRetries) {
      let waitMs = 1200 * (attempt + 1);
      try {
        const ra = JSON.parse(text)?.error?.metadata?.retry_after_seconds;
        if (typeof ra === "number" && ra > 0) waitMs = Math.max(600, ra * 1000);
      } catch {
        /* keep backoff default */
      }
      await new Promise((r) => setTimeout(r, Math.min(waitMs, 8000)));
      continue;
    }
    break;
  }
  throw new Error(lastErr);
}
