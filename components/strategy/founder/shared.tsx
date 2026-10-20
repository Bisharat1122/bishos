"use client";

/** Shared bits for the Founder HQ panels: the `hq` type, sub-headings, empty lines, stat cells. */
import { ReactNode } from "react";
import Link from "next/link";
import type { FunctionReturnType } from "convex/server";
import { ArrowRight } from "lucide-react";
import type { api } from "@/convex/_generated/api";
import { Chip, cn, type Tone } from "@/components/os/kit";

export type HQ = FunctionReturnType<typeof api.founder.hq>;

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** h3 sub-heading inside a panel: label, optional count chip, optional "→" link. */
export function SubHead({
  children,
  count,
  countTone = "muted",
  href,
  linkLabel = "View all",
  right,
  className,
}: {
  children: ReactNode;
  count?: number;
  countTone?: Tone;
  href?: string;
  linkLabel?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2 flex min-h-6 items-center justify-between gap-2", className)}>
      <h3 className="flex min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="truncate">{children}</span>
        {count != null && count > 0 && <Chip tone={countTone}>{count}</Chip>}
      </h3>
      {(right || href) && (
        <div className="flex shrink-0 items-center gap-2">
          {right}
          {href && (
            <Link
              href={href}
              className="-mr-1.5 inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {linkLabel}
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/** One-line empty state that teaches the next action. */
export function EmptyLine({ children, href, cta }: { children: ReactNode; href?: string; cta?: string }) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {children}{" "}
      {href && (
        <Link href={href} className="font-medium text-foreground underline-offset-4 hover:underline">
          {cta ?? "Open"} →
        </Link>
      )}
    </p>
  );
}

/** Small linked stat (number + label), used in panel stat rows. */
export function StatCell({
  value,
  label,
  sub,
  href,
  tone,
}: {
  value: ReactNode;
  label: ReactNode;
  sub?: ReactNode;
  href?: string;
  tone?: "success" | "warning" | "danger" | "info";
}) {
  const body = (
    <>
      <div
        className={cn(
          "text-lg font-semibold leading-6 tabular-nums",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
          tone === "info" && "text-info",
        )}
      >
        {value}
      </div>
      <div className="break-words text-xs leading-4 text-foreground/80">{label}</div>
      {sub != null && <div className="break-words text-[11px] leading-4 text-muted-foreground">{sub}</div>}
    </>
  );
  const cls = "block min-w-0 rounded-lg border border-border px-2.5 py-2 sm:px-3";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-ring/60 hover:bg-accent/40")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Skeleton lines for a panel body while `hq` loads (keeps the frame and size). */
export function SkeletonRows({ rows, h = "h-5", className }: { rows: number; h?: string; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={cn("skeleton", h)} style={{ width: `${92 - ((i * 17) % 30)}%` }} />
      ))}
    </div>
  );
}
