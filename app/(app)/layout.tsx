"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { ModuleDockMount } from "@/components/ai/ModuleDockMount";
import { FocusTimerProvider } from "@/components/focus/FocusTimerProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  const startNav = () => setProgress(18);

  // ramp toward 90% while a navigation is pending
  useEffect(() => {
    if (progress > 0 && progress < 90) {
      const t = setTimeout(() => setProgress((p) => Math.min(90, p + (90 - p) * 0.3)), 180);
      return () => clearTimeout(t);
    }
  }, [progress]);

  // complete the bar when the route actually changes
  useEffect(() => {
    setProgress((p) => (p > 0 ? 100 : 0));
    const t = setTimeout(() => setProgress(0), 260);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <FocusTimerProvider>
    <div className="flex h-screen overflow-hidden">
      {/* top navigation progress bar */}
      {progress > 0 && (
        <div
          className="pointer-events-none fixed left-0 top-0 z-[70] h-[3px] bg-primary shadow-[0_0_8px_hsl(var(--primary))] transition-all duration-200 ease-out"
          style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onNavStart={startNav}
        />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onNavigate={() => setOpen(false)} onNavStart={startNav} />
          </div>
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold tracking-tight">bishOS</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Floating per-module agentic assistant (renders only on module routes) */}
      <ModuleDockMount />
    </div>
    </FocusTimerProvider>
  );
}
