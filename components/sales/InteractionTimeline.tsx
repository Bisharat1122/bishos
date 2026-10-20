"use client";

/** Vertical timeline of touches (person, deal or company). */

import Link from "next/link";
import { useMutation } from "convex/react";
import { Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { relDay } from "@/lib/day";
import { RowMenu } from "./Menu";
import { errMsg, touchMeta } from "./meta";

export type TimelineItem = Doc<"interactions"> & { personName?: string | null; dealTitle?: string | null };

export function InteractionTimeline({
  items,
  today,
  showPerson = false,
  showDeal = true,
  limit,
  empty = "No touches yet. Log the first one.",
}: {
  items: TimelineItem[];
  today: string;
  showPerson?: boolean;
  showDeal?: boolean;
  limit?: number;
  empty?: string;
}) {
  const remove = useMutation(api.people.removeInteraction);
  const rows = limit ? items.slice(0, limit) : items;
  if (!rows.length) return <p className="py-2 text-sm text-muted-foreground">{empty}</p>;
  return (
    <ol className="relative space-y-1">
      <span className="absolute bottom-3 left-[13px] top-3 w-px bg-border" aria-hidden />
      {rows.map((i) => {
        const m = touchMeta(i.kind);
        const I = m.icon;
        return (
          <li key={i._id} className="group relative flex gap-3 rounded-lg py-1.5 pl-0 pr-1">
            <span
              className={cn(
                "relative z-[1] mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-card",
                i.kind === "meeting" || i.kind === "call" ? "text-info" : i.kind === "note" ? "text-muted-foreground" : "text-foreground",
              )}
            >
              <I className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{m.label}</span>
                <span>{relDay(i.date, today)}</span>
                {i.channel && <span>· {i.channel}</span>}
                {showPerson && i.personName && i.personId && (
                  <Link href={`/people/${i.personId}`} className="hover:text-foreground hover:underline">
                    · {i.personName}
                  </Link>
                )}
                {showDeal && i.dealTitle && <span className="truncate">· {i.dealTitle}</span>}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-snug">{i.summary}</p>
            </div>
            <RowMenu
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"
              items={[
                {
                  label: "Delete touch",
                  icon: Trash2,
                  danger: true,
                  onSelect: () => {
                    if (!confirm("Delete this touch? Its XP is removed too.")) return;
                    remove({ id: i._id }).then(
                      () => toast("Touch deleted"),
                      (e) => toast(errMsg(e), { tone: "warning" }),
                    );
                  },
                },
              ]}
            />
          </li>
        );
      })}
    </ol>
  );
}
