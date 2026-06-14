"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  LayoutDashboard,
  Layers,
  CheckSquare,
  FolderKanban,
  StickyNote,
  Target,
  Timer,
  Repeat,
  Sparkles,
  CalendarCheck,
  CalendarRange,
  ClipboardList,
  TrendingUp,
  UserRound,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Modal } from "./ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/life-areas", label: "Life Areas", icon: Layers },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/momentum", label: "Momentum", icon: TrendingUp },
  { href: "/schedule", label: "Schedule", icon: CalendarRange },
  { href: "/focus", label: "Focus Time", icon: Timer },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/check-in", label: "Daily Check-in", icon: CalendarCheck },
  { href: "/review", label: "Weekly Review", icon: ClipboardList },
  { href: "/chat", label: "AI Chat", icon: Sparkles },
];

export function Sidebar({
  onNavigate,
  onNavStart,
  collapsed = false,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  onNavStart?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const [confirmOut, setConfirmOut] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col gap-1 border-r border-border bg-card/40 py-5 transition-all",
        collapsed ? "w-[4.5rem] px-2" : "w-64 px-3",
      )}
    >
      {/* Brand + collapse toggle */}
      <div className={cn("mb-6 flex items-center", collapsed ? "justify-center" : "justify-between px-2")}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && <span className="text-lg font-bold tracking-tight">bishOS</span>}
        </div>
        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            className="text-muted-foreground hover:text-foreground"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {onToggleCollapse && collapsed && (
        <button
          onClick={onToggleCollapse}
          className="mb-2 flex justify-center text-muted-foreground hover:text-foreground"
          title="Expand sidebar"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      )}

      {!collapsed && (
        <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Navigation
        </p>
      )}

      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if (!active) onNavStart?.();
                onNavigate?.();
              }}
              title={collapsed ? label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-full py-2.5 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <Link
          href="/profile"
          onClick={() => { if (pathname !== "/profile") onNavStart?.(); onNavigate?.(); }}
          title={collapsed ? "Profile" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-full py-2.5 text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0" : "px-3",
            pathname === "/profile"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <UserRound className="h-4 w-4" />
          {!collapsed && "Profile"}
        </Link>

        <button
          onClick={() => setConfirmOut(true)}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-full py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed ? "justify-center px-0" : "px-3",
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign out"}
        </button>
      </div>

      {confirmOut && (
        <Modal title="Sign out?" onClose={() => setConfirmOut(false)}>
          <p className="text-sm text-muted-foreground">
            You&apos;ll need to sign back in with your email and password to access bishOS.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setConfirmOut(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => void signOut()}
              className="flex items-center gap-2 rounded-lg bg-warning px-4 py-2 text-sm font-medium text-background"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </Modal>
      )}
    </aside>
  );
}
