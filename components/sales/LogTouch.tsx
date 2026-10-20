"use client";

/**
 * Log a touch (outreach, follow-up, call, meeting, email, DM, note).
 * Reusable:
 *   <LogTouchButton personId={id} />                 — opens the dialog
 *   <LogTouchButton personId={id} quick="outreach" /> — one click, no dialog
 *   <LogTouchDialog open onClose personId dealId defaultKind />
 */

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus, Zap } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Dialog, Field, Select, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { useToday } from "@/lib/day";
import { PersonPicker } from "./PersonPicker";
import { Portal } from "./Portal";
import { TOUCH_CHANNELS, TOUCH_KINDS, errMsg, isOpenStage, type TouchKind } from "./meta";

type DayStats = { outreach: number; quota: number; meetings: number; meetingsGoal: number; goalHit: boolean; quotaHit: boolean };

/** Toast copy after a touch: quota progress + "goal hit" moments. */
function announce(kind: TouchKind, xp: number, day: DayStats, before?: { goalHit: boolean; quotaHit: boolean }) {
  if (day.goalHit && before && !before.goalHit) {
    reward("Goal hit — you can stop prospecting today", xp, true);
    return;
  }
  if (day.quotaHit && before && !before.quotaHit) {
    reward(`Outreach quota done: ${day.outreach}/${day.quota}`, xp, true);
    return;
  }
  if (kind === "outreach" || kind === "followup") {
    toast(`Touch logged · ${day.outreach}/${day.quota} today`, { tone: "success", xp: xp || undefined });
  } else if (kind === "note") {
    toast("Note saved", { tone: "success" });
  } else {
    toast("Touch logged", { tone: "success", xp: xp || undefined, sub: kind === "meeting" || kind === "call" ? `Meetings today: ${day.meetings}/${day.meetingsGoal}` : undefined });
  }
}

export function LogTouchDialog({
  open,
  onClose,
  personId,
  dealId,
  companyId,
  defaultKind = "outreach",
  lockPerson,
  onLogged,
}: {
  open: boolean;
  onClose: () => void;
  personId?: Id<"people"> | null;
  dealId?: Id<"deals"> | null;
  companyId?: Id<"companies"> | null;
  defaultKind?: TouchKind;
  lockPerson?: boolean;
  onLogged?: (id: Id<"interactions">) => void;
}) {
  const today = useToday();
  const log = useMutation(api.people.logInteraction);
  const deals = useQuery(api.deals.list, open ? { today } : "skip");
  const dayBefore = useQuery(api.people.outreachToday, open ? { today } : "skip");
  const [kind, setKind] = useState<TouchKind>(defaultKind);
  const [summary, setSummary] = useState("");
  const [pid, setPid] = useState<Id<"people"> | null>(personId ?? null);
  const [did, setDid] = useState<Id<"deals"> | null>(dealId ?? null);
  const [channel, setChannel] = useState("");
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind(defaultKind);
    setSummary("");
    setPid(personId ?? null);
    setDid(dealId ?? null);
    setChannel("");
    setDate(today);
  }, [open, defaultKind, personId, dealId, today]);

  // only this person's open deals (or all open deals if no person picked)
  const dealOptions = (deals ?? []).filter((d) => isOpenStage(d.stage) && (!pid || d.personId === pid || d._id === did));

  const autoFor = useRef<string | null>(null);
  useEffect(() => {
    // picking a person with exactly one open deal links it (once per person)
    if (!open || !pid || !deals || autoFor.current === pid) return;
    autoFor.current = pid;
    if (did) return;
    const theirs = deals.filter((d) => d.personId === pid && isOpenStage(d.stage));
    if (theirs.length === 1) setDid(theirs[0]._id);
  }, [open, pid, did, deals]);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await log({
        kind,
        summary,
        personId: pid ?? undefined,
        dealId: did ?? undefined,
        companyId: companyId ?? undefined,
        date,
        channel: channel || undefined,
      });
      // res.day is the logged day's block; only compare with "before" (today) when it's today
      if (date === today) announce(kind, res.xp, res.day, dayBefore ?? undefined);
      else toast(kind === "note" ? "Note saved" : "Touch logged", { tone: "success", xp: res.xp || undefined, sub: `For ${date}` });
      onLogged?.(res.id);
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Log a touch">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
          {TOUCH_KINDS.map((k) => {
            const I = k.icon;
            const active = kind === k.value;
            return (
              <button
                type="button"
                key={k.value}
                title={k.hint}
                onClick={() => setKind(k.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[11px] font-medium transition-colors",
                  active ? "border-ring bg-accent text-foreground" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <I className="h-4 w-4" />
                {k.label}
              </button>
            );
          })}
        </div>

        {!lockPerson && (
          <Field label="Who (optional)">
            <PersonPicker value={pid} onChange={(id) => setPid(id)} />
          </Field>
        )}

        <Field label={kind === "note" ? "Note" : "What happened?"}>
          <TextArea
            autoFocus
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={kind === "outreach" ? "Sent a personalised DM about…" : kind === "meeting" || kind === "call" ? "Talked about… They need… Next…" : "Short summary"}
            className="min-h-[72px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
            }}
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Deal">
            <Select value={did ?? ""} onChange={(e) => setDid((e.target.value || null) as Id<"deals"> | null)}>
              <option value="">No deal</option>
              {dealOptions.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Channel">
            <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="">—</option>
              {TOUCH_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Day">
            <TextInput type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="text-xs text-muted-foreground">
            {dayBefore ? `${dayBefore.outreach}/${dayBefore.quota} outreach today` : " "}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={buttonVariants()}>
              {busy ? "Saving…" : kind === "note" ? "Save note" : "Log touch"}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

/**
 * Button that logs a touch. With `quick`, one click logs that kind right away
 * (no dialog); otherwise it opens LogTouchDialog.
 */
export function LogTouchButton({
  personId,
  dealId,
  companyId,
  defaultKind = "outreach",
  quick,
  label,
  variant = "outline",
  size = "sm",
  iconOnly,
  className,
  lockPerson,
  onLogged,
}: {
  personId?: Id<"people"> | null;
  dealId?: Id<"deals"> | null;
  companyId?: Id<"companies"> | null;
  defaultKind?: TouchKind;
  quick?: TouchKind;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "sm" | "default" | "icon-sm";
  iconOnly?: boolean;
  className?: string;
  lockPerson?: boolean;
  onLogged?: (id: Id<"interactions">) => void;
}) {
  const [open, setOpen] = useState(false);
  const today = useToday();
  const log = useMutation(api.people.logInteraction);
  const before = useQuery(api.people.outreachToday, quick ? { today } : "skip");
  const [busy, setBusy] = useState(false);
  const text = label ?? (quick ? "+1 touch" : "Log touch");
  const Icon = quick ? Zap : Plus;

  const onClick = async () => {
    if (!quick) return setOpen(true);
    if (busy) return;
    setBusy(true);
    try {
      const res = await log({ kind: quick, summary: "", personId: personId ?? undefined, dealId: dealId ?? undefined, companyId: companyId ?? undefined, date: today });
      announce(quick, res.xp, res.day, before ?? undefined);
      onLogged?.(res.id);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void onClick();
        }}
        disabled={busy}
        aria-label={text}
        title={text}
        className={cn(buttonVariants({ variant, size: iconOnly ? "icon-sm" : size }), className)}
      >
        <Icon className="h-3.5 w-3.5" />
        {!iconOnly && <span>{text}</span>}
      </button>
      {!quick && open && (
        <Portal>
          <LogTouchDialog
            open={open}
            onClose={() => setOpen(false)}
            personId={personId}
            dealId={dealId}
            companyId={companyId}
            defaultKind={defaultKind}
            lockPerson={lockPerson}
            onLogged={onLogged}
          />
        </Portal>
      )}
    </>
  );
}
