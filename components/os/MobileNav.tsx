"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sun, Inbox, Plus, CalendarDays, Menu } from "lucide-react";
import { cn } from "./kit";
import { openCapture } from "@/lib/osEvents";
import { useCoarseNow, useStable } from "./useCockpit";
import { useToday } from "@/lib/day";

/** Phone bottom bar — capture-first, Today one tap away. Hidden on desktop. */
export function MobileNav({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const now = useCoarseNow();
  const today = useToday();
  const badges = useStable(useQuery(api.today.badges, { now, date: today }));
  const item = (href: string, label: string, Icon: typeof Sun, badge?: number) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link href={href} prefetch className={cn("relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium", active ? "text-foreground" : "text-muted-foreground")}>
        <Icon className="h-5 w-5" />
        {label}
        {!!badge && badge > 0 && (
          <span className="absolute right-[calc(50%-1.1rem)] top-1 rounded-full bg-primary px-1 text-[9px] font-semibold leading-3.5 text-primary-foreground">{badge}</span>
        )}
      </Link>
    );
  };
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Quick navigation">
      {item("/today", "Today", Sun)}
      {item("/inbox", "Inbox", Inbox, badges?.inbox)}
      <button onClick={() => openCapture("inbox")} className="flex flex-1 flex-col items-center justify-center" aria-label="Capture">
        <span className="-mt-5 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-raised">
          <Plus className="h-6 w-6" />
        </span>
      </button>
      {item("/week", "Week", CalendarDays)}
      <button onClick={onMenu} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground">
        <Menu className="h-5 w-5" />
        Menu
      </button>
    </nav>
  );
}
