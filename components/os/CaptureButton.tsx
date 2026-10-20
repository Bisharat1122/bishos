"use client";

import { Plus } from "lucide-react";
import { buttonVariants, cn } from "./kit";
import { openCapture } from "@/lib/osEvents";

/** Topbar quick-capture button (same as pressing C). */
export function CaptureButton() {
  return (
    <button
      onClick={() => openCapture("inbox")}
      title="Capture (C)"
      aria-label="Capture"
      className={cn(buttonVariants({ variant: "outline", size: "icon" }), "sm:hidden")}
    >
      <Plus className="h-4 w-4" />
    </button>
  );
}
