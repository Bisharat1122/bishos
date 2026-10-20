"use client";

import { usePathname } from "next/navigation";
import { ModuleDock } from "./ModuleDock";

// Map a route prefix → the agentic module the dock should drive.
const ROUTES: { prefix: string; module: string }[] = [
  { prefix: "/goals", module: "goals" },
  { prefix: "/tasks", module: "tasks" },
  { prefix: "/notes", module: "notes" },
  { prefix: "/projects", module: "projects" },
  { prefix: "/habits", module: "habits" },
  { prefix: "/focus", module: "focus" },
];

/** Renders the right module dock for the current route (or nothing). Mounted
 * once in the app layout so every module page gets its floating ✦ assistant. */
export function ModuleDockMount() {
  const pathname = usePathname() ?? "";
  // Note: the Challenge module (section + day journal) has no AI dock yet —
  // it will be rebuilt for the new model. No dock on /challenges for now.
  const match = ROUTES.find((r) => pathname.startsWith(r.prefix));
  if (!match) return null;
  // key resets the dock's local state when switching modules.
  return <ModuleDock key={match.module} module={match.module} />;
}
