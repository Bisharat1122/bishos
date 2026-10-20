"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { UserRound, LogOut, PanelLeftClose, PanelLeftOpen, ChevronDown, Plus, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Logo, Modal } from "./ui";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/lib/nav";
import { openCapture, openPalette } from "@/lib/osEvents";
import { useCoarseNow, useStable } from "./os/useCockpit";
import { useToday } from "@/lib/day";

const navItem = (active: boolean) =>
  cn(
    "group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
  );

const navIcon = (active: boolean) =>
  cn(
    "h-4 w-4 shrink-0",
    active ? "text-sidebar-accent-foreground" : "text-sidebar-muted group-hover:text-sidebar-accent-foreground",
  );

const COLLAPSE_KEY = "bishos.navGroups";

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
  const router = useRouter();
  const { signOut } = useAuthActions();
  const [confirmOut, setConfirmOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [closedGroups, setClosedGroups] = useState<string[]>([]);
  const now = useCoarseNow();
  const today = useToday();
  const badges = useStable(useQuery(api.today.badges, { now, date: today }));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (raw) setClosedGroups(JSON.parse(raw));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleGroup = (key: string) =>
    setClosedGroups((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

  const badgeFor = (b?: "inbox" | "recall") => (b === "inbox" ? badges?.inbox : b === "recall" ? badges?.recall : undefined);

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all",
        collapsed ? "w-[4.25rem]" : "w-60",
      )}
    >
      {/* Brand + collapse toggle */}
      <div className={cn("flex h-14 shrink-0 items-center", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        <Logo showWordmark={!collapsed} />
        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            className="rounded-md p-1 text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {onToggleCollapse && collapsed && (
        <button
          onClick={onToggleCollapse}
          className="mx-auto mb-1 flex size-9 items-center justify-center rounded-lg text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {/* Capture + command */}
      <div className={cn("flex shrink-0 gap-1.5 pb-2", collapsed ? "flex-col items-center px-2" : "px-3")}>
        <button
          onClick={() => {
            openCapture("inbox");
            onNavigate?.();
          }}
          title="Capture (C)"
          className={cn(buttonVariants({ size: "sm" }), collapsed ? "size-9 px-0" : "flex-1")}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && "Capture"}
          {!collapsed && <span className="ml-auto rounded bg-primary-foreground/15 px-1 text-[10px] font-medium">C</span>}
        </button>
        <button
          onClick={() => {
            openPalette();
            onNavigate?.();
          }}
          title="Command palette (Ctrl+K)"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), collapsed ? "size-9 px-0" : "px-2.5")}
        >
          <Search className="h-4 w-4" />
          {!collapsed && <span className="text-[10px] text-muted-foreground">⌘K</span>}
        </button>
      </div>

      <div className={cn("flex-1 overflow-y-auto pb-3 scrollbar-thin", collapsed ? "px-2" : "px-3")}>
        <nav aria-label="Main navigation" className="flex flex-col gap-3">
          {NAV_GROUPS.map((g) => {
            const closed = !collapsed && closedGroups.includes(g.key);
            const hasActive = g.items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
            return (
              <div key={g.key}>
                {!collapsed ? (
                  <button
                    onClick={() => toggleGroup(g.key)}
                    className="mb-0.5 flex w-full items-center justify-between rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sidebar-muted hover:text-sidebar-accent-foreground"
                    aria-expanded={!closed}
                  >
                    {g.label}
                    <ChevronDown className={cn("h-3 w-3 transition-transform", closed && "-rotate-90")} />
                  </button>
                ) : (
                  <div className="mx-auto mb-1 h-px w-6 bg-sidebar-border" />
                )}
                {(!closed || hasActive) && (
                  <div className="flex flex-col gap-0.5">
                    {g.items
                      .filter((i) => !closed || pathname === i.href || pathname.startsWith(i.href + "/"))
                      .map(({ href, label, icon: Icon, badge }) => {
                        const active = pathname === href || pathname.startsWith(href + "/");
                        const count = badgeFor(badge);
                        return (
                          <Link
                            key={href}
                            href={href}
                            prefetch
                            onClick={() => {
                              if (!active) onNavStart?.();
                              onNavigate?.();
                            }}
                            title={collapsed ? label : undefined}
                            aria-current={active ? "page" : undefined}
                            className={cn(navItem(active), collapsed && "relative justify-center px-0")}
                          >
                            <Icon className={navIcon(active)} aria-hidden />
                            {!collapsed && <span className="flex-1 truncate">{label}</span>}
                            {!!count && count > 0 && (
                              <span
                                className={cn(
                                  "rounded-full bg-primary px-1.5 text-[10px] font-semibold tabular-nums leading-4 text-primary-foreground",
                                  collapsed && "absolute -right-0.5 -top-0.5",
                                )}
                              >
                                {count > 99 ? "99+" : count}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className={cn("shrink-0 space-y-0.5 border-t border-sidebar-border py-2", collapsed ? "px-2" : "px-3")}>
        <Link
          href="/profile"
          prefetch
          onClick={() => {
            if (pathname !== "/profile") onNavStart?.();
            onNavigate?.();
          }}
          title={collapsed ? "Profile" : undefined}
          aria-current={pathname === "/profile" ? "page" : undefined}
          className={cn(navItem(pathname === "/profile"), collapsed && "justify-center px-0")}
        >
          <UserRound className={navIcon(pathname === "/profile")} aria-hidden />
          {!collapsed && "Profile"}
        </Link>

        <button
          onClick={() => setConfirmOut(true)}
          title={collapsed ? "Sign out" : undefined}
          className={cn(navItem(false), "w-full", collapsed && "justify-center px-0")}
        >
          <LogOut className={navIcon(false)} aria-hidden />
          {!collapsed && "Sign out"}
        </button>
      </div>

      {confirmOut && (
        <Modal title="Sign out?" onClose={() => setConfirmOut(false)}>
          <p className="text-sm text-muted-foreground">
            You&apos;ll need to sign back in with your email and password to access bishOS.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setConfirmOut(false)} className={buttonVariants({ variant: "outline" })}>
              Cancel
            </button>
            <button
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                try {
                  await signOut();
                } finally {
                  // Leave the authed screen — otherwise it stays mounted with dead queries.
                  router.replace("/signin");
                }
              }}
              className={buttonVariants({ variant: "destructive" })}
            >
              <LogOut className="h-4 w-4" /> {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </Modal>
      )}
    </aside>
  );
}
