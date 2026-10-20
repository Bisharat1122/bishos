"use client";

/**
 * Knowledge inbox + Map of Content suggestions for the Notes page.
 * - ProcessInbox: fleeting notes; older than 48h get a warning chip (Ahrens:
 *   process within a day or two). Keep as idea / turn into a task / discard.
 * - SuggestMaps: clusters of ≥5 linked notes with no map (LYT "mental squeeze point").
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CheckSquare, Clock, Inbox, Lightbulb, Map as MapIcon, Trash2, ArrowUpRight } from "lucide-react";
import { Chip, Section, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { useToday } from "@/lib/day";
import { errMsg, useMinuteNow, useStable } from "./meta";

type InboxItem = FunctionReturnType<typeof api.notes.inbox>["items"][number];

export function ProcessInbox({ className }: { className?: string }) {
  const now = useMinuteNow();
  const data = useStable(useQuery(api.notes.inbox, { now }));
  if (!data || data.count === 0) return null;
  return (
    <Section
      className={className}
      title={
        <span className="flex items-center gap-2">
          Process inbox <Chip tone={data.staleCount ? "warning" : "muted"}>{data.count}</Chip>
        </span>
      }
      icon={Inbox}
      hint={
        data.staleCount
          ? `${data.staleCount} fleeting note${data.staleCount === 1 ? " is" : "s are"} older than 48h — keep the idea in your own words, make it a task, or let it go.`
          : "Fleeting notes are for capture. Process them within 48 hours."
      }
    >
      <div className="space-y-2">
        {data.items.map((n) => (
          <InboxRow key={n._id} n={n} />
        ))}
      </div>
    </Section>
  );
}

function InboxRow({ n }: { n: InboxItem }) {
  const today = useToday();
  const areas = useQuery(api.lifeAreas.list);
  const process = useMutation(api.notes.processFleeting);
  const [title, setTitle] = useState(n.title);
  const [mode, setMode] = useState<"idle" | "task">("idle");
  const [areaId, setAreaId] = useState<string>(n.lifeAreaId ?? "");
  const [busy, setBusy] = useState(false);

  async function act(action: "idea" | "task" | "discard") {
    if (action === "discard" && !confirm(`Discard “${n.title}”? The note is deleted for good.`)) return;
    setBusy(true);
    try {
      const res = await process({
        id: n._id,
        action,
        date: today,
        title: title.trim() !== n.title ? title : undefined,
        lifeAreaId: action === "task" && areaId ? (areaId as Id<"lifeAreas">) : undefined,
      });
      const label = action === "idea" ? "Kept as an idea note" : action === "task" ? "Turned into a task" : "Let it go";
      reward(label, res.xp || undefined);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
      setBusy(false);
    }
  }

  return (
    <div className={cn("rounded-lg border border-border bg-background/40 p-3 transition", busy && "opacity-50")}>
      <div className="flex flex-wrap items-start gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
          aria-label="Title (rename as you keep it)"
        />
        <Chip tone={n.stale ? "warning" : "muted"} title={n.stale ? "Older than 48h" : undefined}>
          <Clock /> {n.ageHours < 1 ? "just now" : n.ageHours < 48 ? `${n.ageHours}h` : `${Math.floor(n.ageHours / 24)}d`}
          {n.stale ? " · process me" : ""}
        </Chip>
      </div>
      {n.content.trim() && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.content}</p>}
      {mode === "task" ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            className="h-8 min-w-0 flex-1 rounded-md border border-input bg-card px-2 text-xs outline-none focus-visible:border-ring sm:flex-none"
            aria-label="Life area for the task"
          >
            <option value="">{areas?.[0] ? `Default (${areas[0].name})` : "Life area…"}</option>
            {areas?.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
          <button disabled={busy} onClick={() => void act("task")} className={buttonVariants({ size: "sm" })}>
            <CheckSquare /> Create task
          </button>
          <button onClick={() => setMode("idle")} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button disabled={busy} onClick={() => void act("idea")} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <Lightbulb /> Keep as idea
          </button>
          <button disabled={busy} onClick={() => setMode("task")} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <CheckSquare /> Turn into task
          </button>
          <button disabled={busy} onClick={() => void act("discard")} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-danger")}>
            <Trash2 /> Discard
          </button>
          <Link href={`/notes/${n._id}`} className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            Open <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

export function SuggestMaps({ className }: { className?: string }) {
  const router = useRouter();
  const suggestions = useQuery(api.notes.suggestMaps);
  const createMap = useMutation(api.notes.createMap);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  // Prevents a double-click from creating two identical maps.
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const list = (suggestions ?? []).filter((s) => !dismissed.has(s.key));
  if (!list.length) return null;

  return (
    <Section
      className={className}
      title="Suggest maps"
      icon={MapIcon}
      hint="These notes keep linking to each other but no Map of Content ties them together yet. A map makes the cluster easy to find and think with."
    >
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((s) => {
          const t = titles[s.key] ?? `${s.tag ? s.tag[0].toUpperCase() + s.tag.slice(1) : s.hubTitle} — map`;
          return (
            <div key={s.key} className="rounded-lg border border-dashed border-border p-3">
              <p className="text-sm font-medium">
                {s.size} linked notes around “{s.hubTitle}”
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {s.titles.map((title, i) => (
                  <Chip key={`${i}-${title}`} tone="muted" className="max-w-[180px] truncate">
                    {title}
                  </Chip>
                ))}
                {s.size > s.titles.length && <Chip tone="outline">+{s.size - s.titles.length}</Chip>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={t}
                  onChange={(e) => setTitles((x) => ({ ...x, [s.key]: e.target.value }))}
                  className="h-8 min-w-0 flex-1 rounded-md border border-input bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                  aria-label="Map title"
                />
                <button
                  disabled={creatingKey !== null}
                  onClick={async () => {
                    setCreatingKey(s.key);
                    try {
                      const id = await createMap({ title: t, noteIds: s.noteIds });
                      reward("Map of Content created");
                      router.push(`/notes/${id}`);
                    } catch (e) {
                      toast(errMsg(e), { tone: "warning" });
                      setCreatingKey(null);
                    }
                  }}
                  className={buttonVariants({ size: "sm" })}
                >
                  <MapIcon /> Create map
                </button>
                <button onClick={() => setDismissed((d) => new Set(d).add(s.key))} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  Not now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
