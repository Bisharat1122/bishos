"use client";

import { useState } from "react";
import { Segmented, TextInput, Field, cn, buttonVariants } from "@/components/os/kit";

/** GTD: the very next physical step for a project (used on /projects and /projects/[id]). */
export function NextActionForm({
  project,
  onCreate,
}: {
  project: { title: string };
  today?: string;
  onCreate: (title: string, when: "today" | "tomorrow" | "") => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState<"today" | "tomorrow" | "">("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim()) void onCreate(title.trim(), when);
      }}
    >
      <p className="text-sm text-muted-foreground">
        For <b className="text-foreground">{project.title}</b> — the very next physical, visible step.
      </p>
      <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Email Sara the kickoff agenda" />
      <Field label="When">
        <Segmented
          size="sm"
          options={[
            { value: "today" as const, label: "Today" },
            { value: "tomorrow" as const, label: "Tomorrow" },
            { value: "" as const, label: "Anytime" },
          ]}
          value={when}
          onChange={setWhen}
        />
      </Field>
      <button disabled={!title.trim()} className={cn(buttonVariants(), "w-full")}>
        Add next action
      </button>
    </form>
  );
}
