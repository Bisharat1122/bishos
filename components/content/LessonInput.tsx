"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn, inputClass } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { errMsg } from "./model";

/** Small lesson field that saves on blur. */
export function LessonInput({
  pieceId,
  initial,
  placeholder = "Why? Save one lesson…",
  className,
}: {
  pieceId: Id<"contentPieces">;
  initial?: string;
  placeholder?: string;
  className?: string;
}) {
  const update = useMutation(api.content.update);
  const [val, setVal] = useState(initial ?? "");
  const [saved, setSaved] = useState(false);
  useEffect(() => setVal(initial ?? ""), [initial]);

  async function commit() {
    if (val.trim() === (initial ?? "").trim()) return;
    try {
      await update({ id: pieceId, lesson: val.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  }

  return (
    <div className={cn("relative", className)}>
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => void commit()}
        rows={2}
        placeholder={placeholder}
        className={cn(inputClass, "min-h-[52px] w-full resize-y py-1.5 text-xs leading-relaxed")}
      />
      {saved && <span className="os-pop absolute bottom-1.5 right-2 text-[10px] font-medium text-success">Saved</span>}
    </div>
  );
}
