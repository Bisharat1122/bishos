"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw, Sparkles } from "lucide-react";
import { Section, buttonVariants, cn } from "@/components/os/kit";
import { errorMessage, toast } from "@/components/os/celebrate";
import { MarkdownLite } from "@/components/tasks/MarkdownLite";

/**
 * "Ask the AI" card: runs an action, shows the text, and lets the user copy it
 * or apply it (e.g. append to notes). Nothing is written without a click.
 */
export function AiPanel({
  title,
  hint,
  cta,
  run,
  onApply,
  applyLabel = "Add to notes",
  className,
}: {
  title: string;
  hint?: string;
  cta: string;
  run: () => Promise<string>;
  onApply?: (text: string) => unknown;
  applyLabel?: string;
  className?: string;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  async function go() {
    setLoading(true);
    setApplied(false);
    try {
      const t = await run();
      setText(t || "The AI returned nothing. Try again.");
    } catch (err) {
      toast(errorMessage(err, "AI request failed"), { tone: "warning" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section
      title={title}
      icon={Sparkles}
      hint={hint}
      className={className}
      action={
        text && !loading ? (
          <button type="button" onClick={go} className={buttonVariants({ variant: "ghost", size: "sm" })} aria-label="Regenerate">
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Again</span>
          </button>
        ) : null
      }
    >
      {!text && !loading && (
        <button type="button" onClick={go} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
          <Sparkles className="h-4 w-4" />
          {cta}
        </button>
      )}
      {loading && (
        <div className="space-y-2" aria-live="polite">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            Thinking
            <span className="inline-flex gap-1">
              <span className="ai-dot" />
              <span className="ai-dot" style={{ animationDelay: "0.15s" }} />
              <span className="ai-dot" style={{ animationDelay: "0.3s" }} />
            </span>
          </p>
          <div className="skeleton h-3 w-11/12" />
          <div className="skeleton h-3 w-9/12" />
          <div className="skeleton h-3 w-10/12" />
        </div>
      )}
      {text && !loading && (
        <div className="fade-in space-y-3">
          <div className="max-h-[480px] space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 scrollbar-thin">
            <MarkdownLite text={text} />
          </div>
          <div className="flex flex-wrap gap-2">
            {onApply && (
              <button
                type="button"
                disabled={applied || applying}
                onClick={async () => {
                  setApplying(true);
                  try {
                    await onApply(text);
                    setApplied(true);
                    toast("Added", { tone: "success" });
                  } catch (err) {
                    toast(errorMessage(err, "Could not add it"), { tone: "warning" });
                  } finally {
                    setApplying(false);
                  }
                }}
                className={buttonVariants({ size: "sm" })}
              >
                {applied ? <Check className="h-3.5 w-3.5" /> : null}
                {applied ? "Added" : applyLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (!navigator.clipboard) return toast("Copy isn't available here", { tone: "warning" });
                navigator.clipboard.writeText(text).then(
                  () => toast("Copied"),
                  () => toast("Couldn't copy", { tone: "warning" }),
                );
              }}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}
