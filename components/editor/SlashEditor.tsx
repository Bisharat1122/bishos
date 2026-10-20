"use client";

import { useRef, useState } from "react";
import {
  Type,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Minus,
  Paperclip,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Block = {
  key: string;
  label: string;
  icon: typeof Type;
  marker: string | null;
  upload?: boolean;
};

const BLOCKS: Block[] = [
  { key: "text", label: "Text", icon: Type, marker: "" },
  { key: "h1", label: "Heading 1", icon: Heading1, marker: "# " },
  { key: "h2", label: "Heading 2", icon: Heading2, marker: "## " },
  { key: "bullet", label: "Bullet list", icon: List, marker: "- " },
  { key: "numbered", label: "Numbered list", icon: ListOrdered, marker: "1. " },
  { key: "todo", label: "To-do", icon: CheckSquare, marker: "- [ ] " },
  { key: "divider", label: "Divider", icon: Minus, marker: "---\n" },
  { key: "upload", label: "Upload PDF / doc / image", icon: Paperclip, marker: null, upload: true },
];

type Mode =
  | { kind: "none" }
  | { kind: "slash"; start: number; query: string }
  | { kind: "wiki"; start: number; query: string };

export function SlashEditor({
  value,
  onChange,
  onUpload,
  wikiTitles,
  placeholder,
  rows = 8,
}: {
  value: string;
  onChange: (v: string) => void;
  onUpload?: () => void;
  wikiTitles?: string[];
  placeholder?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<Mode>({ kind: "none" });
  const [active, setActive] = useState(0);

  const blockItems =
    mode.kind === "slash"
      ? BLOCKS.filter((b) => b.label.toLowerCase().includes(mode.query.toLowerCase()))
      : [];
  const wikiItems =
    mode.kind === "wiki"
      ? (wikiTitles ?? [])
          .filter((t) => t.toLowerCase().includes(mode.query.toLowerCase()))
          .slice(0, 8)
      : [];
  const open = blockItems.length > 0 || wikiItems.length > 0;

  function recompute(v: string, caret: number) {
    const upto = v.slice(0, caret);

    // wiki link trigger: an unclosed "[[" before the caret
    const wikiStart = upto.lastIndexOf("[[");
    if (wikiStart !== -1 && wikiTitles) {
      const between = upto.slice(wikiStart + 2);
      if (!/[\]\n[]/.test(between)) {
        setMode({ kind: "wiki", start: wikiStart, query: between });
        setActive(0);
        return;
      }
    }

    // slash command trigger
    const slashStart = upto.lastIndexOf("/");
    if (slashStart !== -1) {
      const after = upto.slice(slashStart + 1);
      const valid = (slashStart === 0 || /\s/.test(v[slashStart - 1])) && !/\s/.test(after);
      if (valid) {
        setMode({ kind: "slash", start: slashStart, query: after });
        setActive(0);
        return;
      }
    }

    setMode({ kind: "none" });
  }

  function chooseBlock(block: Block) {
    if (mode.kind !== "slash") return;
    const caret = ref.current?.selectionStart ?? value.length;
    const withoutSlash = value.slice(0, mode.start) + value.slice(caret);
    if (block.upload) {
      onChange(withoutSlash);
      setMode({ kind: "none" });
      onUpload?.();
      return;
    }
    const lineStart = withoutSlash.lastIndexOf("\n", mode.start - 1) + 1;
    const marker = block.marker ?? "";
    const next = withoutSlash.slice(0, lineStart) + marker + withoutSlash.slice(lineStart);
    onChange(next);
    setMode({ kind: "none" });
    requestAnimationFrame(() => {
      const pos = lineStart + marker.length;
      ref.current?.focus();
      ref.current?.setSelectionRange(pos, pos);
    });
  }

  function chooseWiki(title: string) {
    if (mode.kind !== "wiki") return;
    const caret = ref.current?.selectionStart ?? value.length;
    const insert = `[[${title}]]`;
    const next = value.slice(0, mode.start) + insert + value.slice(caret);
    onChange(next);
    setMode({ kind: "none" });
    requestAnimationFrame(() => {
      const pos = mode.start + insert.length;
      ref.current?.focus();
      ref.current?.setSelectionRange(pos, pos);
    });
  }

  function commit(index: number) {
    if (mode.kind === "slash") chooseBlock(blockItems[index]);
    else if (mode.kind === "wiki") chooseWiki(wikiItems[index]);
  }

  const itemCount = mode.kind === "slash" ? blockItems.length : wikiItems.length;

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        rows={rows}
        placeholder={placeholder ?? "Write, / for commands, [[ to link a note…"}
        onChange={(e) => {
          onChange(e.target.value);
          recompute(e.target.value, e.target.selectionStart);
        }}
        onKeyDown={(e) => {
          if (mode.kind === "none" || !open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % itemCount);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a - 1 + itemCount) % itemCount);
          } else if (e.key === "Enter") {
            e.preventDefault();
            commit(active);
          } else if (e.key === "Escape") {
            setMode({ kind: "none" });
          }
        }}
        onClick={(e) => recompute(value, e.currentTarget.selectionStart)}
        className="w-full resize-y rounded-md border border-input bg-card shadow-xs px-3 py-2 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30"
      />

      {open && (
        <div className="absolute left-2 top-2 z-20 w-64 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-raised">
          <p className="border-b border-border px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {mode.kind === "wiki" ? "Link a note" : "Blocks"}
          </p>
          {mode.kind === "slash" &&
            blockItems.map((b, idx) => {
              const Icon = b.icon;
              return (
                <button
                  key={b.key}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => chooseBlock(b)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm",
                    idx === active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {b.label}
                </button>
              );
            })}
          {mode.kind === "wiki" &&
            (wikiItems.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No matching notes.</p>
            ) : (
              wikiItems.map((t, idx) => (
                <button
                  key={t}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => chooseWiki(t)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm",
                    idx === active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  )}
                >
                  <Link2 className="h-4 w-4" />
                  {t}
                </button>
              ))
            ))}
        </div>
      )}
    </div>
  );
}
