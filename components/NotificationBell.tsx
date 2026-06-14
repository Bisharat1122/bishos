"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Bell, X, ListTodo, Target, FolderKanban, Repeat, CalendarRange, CalendarCheck, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON: Record<string, typeof Bell> = {
  task: ListTodo,
  goal: Target,
  project: FolderKanban,
  habit: Repeat,
  schedule: CalendarRange,
  checkin: CalendarCheck,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const items = useQuery(api.notifications.list);
  const dismiss = useMutation(api.notifications.dismiss);
  const dismissAll = useMutation(api.notifications.dismissAll);

  const count = items?.length ?? 0;
  const urgent = items?.filter((n) => n.severity === "urgent").length ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className={cn(
            "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white",
            urgent > 0 ? "bg-warning" : "bg-primary",
          )}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">
                Notifications {count > 0 && <span className="text-muted-foreground">({count})</span>}
              </p>
              {count > 0 && (
                <button
                  onClick={() => void dismissAll({ keys: (items ?? []).map((n) => n.key) })}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {count === 0 && (
                <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
                  <Check className="h-6 w-6 text-primary" />
                  <p className="text-sm text-muted-foreground">You&apos;re all caught up</p>
                </div>
              )}
              {items?.map((n) => {
                const Icon = ICON[n.type] ?? Bell;
                return (
                  <div key={n.key} className="group flex items-start gap-2.5 border-b border-border/60 px-3 py-2.5 hover:bg-muted/30">
                    <span className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                      n.severity === "urgent" ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary",
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <Link href={n.href} onClick={() => setOpen(false)} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <p className={cn("text-xs", n.severity === "urgent" ? "text-warning" : "text-muted-foreground")}>{n.meta}</p>
                    </Link>
                    <button
                      onClick={() => void dismiss({ key: n.key })}
                      title="Dismiss"
                      className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
