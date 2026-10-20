/**
 * Tiny window event bus so any screen (command palette, Today, Topbar) can
 * open the global overlays mounted once in the app layout.
 */
export type RitualKind = "startup" | "shutdown";
export type CaptureMode = "inbox" | "task" | "dump";

export function openRitual(kind: RitualKind) {
  window.dispatchEvent(new CustomEvent("os:ritual", { detail: kind }));
}

export function openCapture(mode: CaptureMode = "inbox", text = "") {
  window.dispatchEvent(new CustomEvent("os:capture", { detail: { mode, text } }));
}

export function openPalette() {
  window.dispatchEvent(new CustomEvent("os:palette"));
}

/** True when the keyboard event comes from a text field (skip global shortcuts). */
export function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}
