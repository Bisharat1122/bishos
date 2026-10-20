"use client";

import { Fragment } from "react";

/** Render inline text: **bold**, *italic*, `code`, and clickable `[[wiki-links]]`. */
function renderInline(text: string, onWikiLink?: (title: string) => void) {
  const parts = text.split(
    /(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*|_[^_\n]+_)/g,
  );
  return parts.map((p, i) => {
    if (!p) return null;
    let m: RegExpMatchArray | null;
    if ((m = p.match(/^\[\[([^\]]+)\]\]$/))) {
      const title = m[1].trim();
      return (
        <button
          key={i}
          type="button"
          onClick={() => onWikiLink?.(title)}
          className="rounded bg-primary/10 px-1 font-medium text-primary hover:bg-primary/20"
        >
          {title}
        </button>
      );
    }
    if ((m = p.match(/^\*\*([^*]+)\*\*$/)))
      return <strong key={i}>{m[1]}</strong>;
    if ((m = p.match(/^`([^`]+)`$/)))
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
          {m[1]}
        </code>
      );
    if ((m = p.match(/^\*([^*]+)\*$/)) || (m = p.match(/^_([^_]+)_$/)))
      return <em key={i}>{m[1]}</em>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

/**
 * Tiny markdown-ish renderer for task/note content. Supports the `/` slash
 * blocks (headings, bullet/numbered lists, to-dos, dividers) plus inline
 * `[[wiki-links]]`. No dependency.
 */
export function MarkdownLite({
  text,
  onWikiLink,
}: {
  text: string;
  onWikiLink?: (title: string) => void;
}) {
  if (!text.trim())
    return <p className="text-sm text-muted-foreground">Nothing here yet.</p>;

  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  const ri = (t: string) => renderInline(t, onWikiLink);
  const isBullet = (l: string) =>
    /^\s*[-*]\s+/.test(l) && !/^\s*[-*]\s+\[[ xX]\]/.test(l);
  const isTodo = (l: string) => /^\s*[-*]\s+\[[ xX]\]\s*/.test(l);
  const isNum = (l: string) => /^\s*\d+\.\s+/.test(l);

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*#{1,3}\s+/.test(line)) {
      const level = (line.match(/^\s*(#{1,3})/)?.[1] ?? "#").length;
      const txt = line.replace(/^\s*#{1,3}\s+/, "");
      const cls =
        level === 1 ? "text-base font-semibold" : level === 2 ? "text-sm font-semibold" : "text-sm font-semibold";
      blocks.push(
        <p key={key++} className={cls}>
          {ri(txt)}
        </p>,
      );
      i++;
      continue;
    }

    if (/^\s*---\s*$/.test(line)) {
      blocks.push(<hr key={key++} className="my-2 border-border" />);
      i++;
      continue;
    }

    if (isTodo(line)) {
      const items: { text: string; done: boolean }[] = [];
      while (i < lines.length && isTodo(lines[i])) {
        const done = /\[[xX]\]/.test(lines[i]);
        items.push({ text: lines[i].replace(/^\s*[-*]\s+\[[ xX]\]\s*/, ""), done });
        i++;
      }
      blocks.push(
        <ul key={key++} className="space-y-1 text-sm">
          {items.map((it, j) => (
            <li key={j} className="flex items-center gap-2">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border ${it.done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
              >
                {it.done ? "✓" : ""}
              </span>
              <span className={it.done ? "text-muted-foreground line-through" : ""}>
                {ri(it.text)}
              </span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (isBullet(line)) {
      const items: string[] = [];
      while (i < lines.length && isBullet(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc space-y-1 pl-5 text-sm">
          {items.map((it, j) => (
            <li key={j}>{ri(it)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (isNum(line)) {
      const items: string[] = [];
      while (i < lines.length && isNum(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="list-decimal space-y-1 pl-5 text-sm">
          {items.map((it, j) => (
            <li key={j}>{ri(it)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !isBullet(lines[i]) &&
      !isNum(lines[i]) &&
      !isTodo(lines[i]) &&
      !/^\s*#{1,3}\s+/.test(lines[i]) &&
      !/^\s*---\s*$/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="text-sm leading-relaxed">
        {para.map((p, j) => (
          <Fragment key={j}>
            {ri(p)}
            {j < para.length - 1 && <br />}
          </Fragment>
        ))}
      </p>,
    );
  }

  return <div className="space-y-2">{blocks}</div>;
}
