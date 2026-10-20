"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Logo } from "@/components/ui";
import { ModuleDockMount } from "@/components/ai/ModuleDockMount";
import { FocusTimerProvider } from "@/components/focus/FocusTimerProvider";
import { QuickCapture } from "@/components/os/QuickCapture";
import { CommandPalette } from "@/components/os/CommandPalette";
import { Toaster } from "@/components/os/celebrate";
import { RitualHost } from "@/components/rituals/RitualHost";
import { MobileNav } from "@/components/os/MobileNav";
import { AchievementWatcher } from "@/components/os/Achievements";
import { Warmup } from "@/components/os/Warmup";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Register the push service worker once so desktop notifications can be
  // delivered even when the app isn't the focused tab.
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <FocusTimerProvider>
    <div className="flex h-screen overflow-hidden">


      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="absolute right-4 top-3 flex size-9 items-center justify-center rounded-lg bg-card text-foreground shadow-raised"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex h-14 items-center gap-3 border-b border-border px-4 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="flex size-9 items-center justify-center rounded-lg hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
        </div>

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</main>
      </div>

      {/* Floating per-module agentic assistant (renders only on module routes) */}
      <ModuleDockMount />

      {/* Life OS global overlays: capture (C), command palette (Ctrl+K), rituals, toasts */}
      <MobileNav onMenu={() => setOpen(true)} />
      <QuickCapture />
      <CommandPalette />
      <RitualHost />
      <Toaster />
      <AchievementWatcher />
      <Warmup />
    </div>
    </FocusTimerProvider>
  );
}
