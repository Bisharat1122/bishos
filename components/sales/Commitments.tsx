"use client";

/**
 * Commitments UI — reusable by any module.
 *   <CommitmentDialog open onClose defaults={{ direction: "i_owe", personId, dealId }} />
 *   <CommitmentRow c={commitment} today={today} />
 *   <CommitmentList items={rows} today={today} />
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { ArrowRightLeft, Ban, CalendarClock, HandCoins, Hourglass, Pencil, RotateCcw, Trash2, XCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { CheckCircle, Chip, Dialog, Field, Segmented, Select, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { reward, toast } from "@/components/os/celebrate";
import { addDaysYmd, relDay, useToday } from "@/lib/day";
import { PersonPicker } from "./PersonPicker";
import { RowMenu } from "./Menu";
import { Portal } from "./Portal";
import { NoSubmit } from "./fields";
import { COMMIT_SOURCES, errMsg, isOpenStage, type Direction } from "./meta";

export type CommitmentItem = Doc<"commitments"> & {
  personName?: string | null;
  dealTitle?: string | null;
  companyName?: string | null;
  projectTitle?: string | null;
};

type Defaults = {
  direction?: Direction;
  personId?: Id<"people"> | null;
  dealId?: Id<"deals"> | null;
  projectId?: Id<"projects"> | null;
  companyId?: Id<"companies"> | null;
  title?: string;
  promisedDate?: string | null;
  source?: string;
};

function DateChips({ value, onPick, today }: { value: string; onPick: (d: string) => void; today: string }) {
  const opts: [string, string][] = [
    ["Today", today],
    ["Tomorrow", addDaysYmd(today, 1)],
    ["+3 days", addDaysYmd(today, 3)],
    ["Next week", addDaysYmd(today, 7)],
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {opts.map(([label, d]) => (
        <button
          type="button"
          key={label}
          onClick={() => onPick(d)}
          className={cn(
            "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
            value === d ? "border-ring bg-accent text-foreground" : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
export { DateChips };

/** Create (or edit) a commitment. */
export function CommitmentDialog({
  open,
  onClose,
  defaults,
  editing,
  lockPerson,
}: {
  open: boolean;
  onClose: () => void;
  defaults?: Defaults;
  editing?: CommitmentItem | null;
  lockPerson?: boolean;
}) {
  const today = useToday();
  const create = useMutation(api.commitments.create);
  const update = useMutation(api.commitments.update);
  const deals = useQuery(api.deals.list, open ? { today } : "skip");
  const [title, setTitle] = useState("");
  const [direction, setDirection] = useState<Direction>("i_owe");
  const [personId, setPersonId] = useState<Id<"people"> | null>(null);
  const [dealId, setDealId] = useState<Id<"deals"> | null>(null);
  const [promisedDate, setPromisedDate] = useState("");
  const [checkDate, setCheckDate] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const src = editing;
    setTitle(src?.title ?? defaults?.title ?? "");
    setDirection(src?.direction ?? defaults?.direction ?? "i_owe");
    setPersonId(src?.personId ?? defaults?.personId ?? null);
    setDealId(src?.dealId ?? defaults?.dealId ?? null);
    setPromisedDate(src?.promisedDate ?? defaults?.promisedDate ?? (src ? "" : addDaysYmd(today, 1)));
    setCheckDate(src?.checkDate ?? "");
    setSource(src?.source ?? defaults?.source ?? "");
    setNotes(src?.notes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?._id]);

  const dealOptions = (deals ?? []).filter((d) => isOpenStage(d.stage) || d.stage === "won" || d._id === dealId).filter((d) => !personId || d.personId === personId || d._id === dealId);

  const submit = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      if (editing) {
        await update({
          id: editing._id,
          title,
          direction,
          personId: personId ?? null,
          dealId: dealId ?? null,
          promisedDate: promisedDate || null,
          checkDate: checkDate || null,
          source: source || null,
          notes: notes || null,
        });
        toast("Commitment updated", { tone: "success" });
      } else {
        await create({
          title,
          direction,
          personId: personId ?? undefined,
          dealId: dealId ?? undefined,
          projectId: defaults?.projectId ?? undefined,
          companyId: defaults?.companyId ?? undefined,
          promisedDate: promisedDate || undefined,
          checkDate: checkDate || undefined,
          source: source || undefined,
          notes: notes || undefined,
        });
        toast(direction === "i_owe" ? "Promise logged. Keep it and earn XP" : "Added to Waiting for", { tone: "success" });
      }
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={editing ? "Edit commitment" : "New commitment"}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <NoSubmit>
          <Segmented
            value={direction}
            onChange={setDirection}
            options={[
              { value: "i_owe", label: "I owe", icon: HandCoins },
              { value: "owed_to_me", label: "Owed to me", icon: Hourglass },
            ]}
          />
        </NoSubmit>
        <Field label={direction === "i_owe" ? "What did I promise?" : "What are they going to do?"}>
          <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={direction === "i_owe" ? "Send the case study" : "Send the signed contract"} />
        </Field>
        {!lockPerson && (
          <Field label={direction === "i_owe" ? "To whom" : "From whom"}>
            <PersonPicker value={personId} onChange={(id) => setPersonId(id)} />
          </Field>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={direction === "i_owe" ? "Promised by" : "Expected by"}>
            <TextInput type="date" value={promisedDate} onChange={(e) => setPromisedDate(e.target.value)} />
            <DateChips value={promisedDate} onPick={setPromisedDate} today={today} />
          </Field>
          {direction === "owed_to_me" ? (
            <Field label="Check again on" hint="Defaults to the expected day">
              <TextInput type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
            </Field>
          ) : (
            <Field label="Source">
              <Select value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="">—</option>
                {COMMIT_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
        <Field label="Deal (optional)">
          <Select value={dealId ?? ""} onChange={(e) => setDealId((e.target.value || null) as Id<"deals"> | null)}>
            <option value="">No deal</option>
            {dealOptions.map((d) => (
              <option key={d._id} value={d._id}>
                {d.title}
              </option>
            ))}
          </Select>
        </Field>
        {editing && (
          <Field label="Notes">
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[60px]" />
          </Field>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
            Cancel
          </button>
          <button type="submit" disabled={busy || !title.trim()} className={buttonVariants()}>
            {editing ? "Save" : "Add commitment"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function RenegotiateDialog({ c, onClose }: { c: CommitmentItem; onClose: () => void }) {
  const today = useToday();
  const renegotiate = useMutation(api.commitments.renegotiate);
  const [date, setDate] = useState(addDaysYmd(c.promisedDate && c.promisedDate > today ? c.promisedDate : today, 3));
  const [note, setNote] = useState("");
  const submit = async () => {
    try {
      await renegotiate({ id: c._id, newDate: date, note: note || undefined });
      toast("Renegotiated. That's how trust stays intact", { tone: "success" });
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  };
  return (
    <Dialog open onClose={onClose} title="Renegotiate the date" size="sm">
      <p className="mb-3 text-sm text-muted-foreground">
        Telling them early beats breaking it. The old promise is closed as renegotiated and a new one opens.
      </p>
      <div className="space-y-3">
        <Field label="New date">
          <TextInput type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
          <DateChips value={date} onPick={setDate} today={today} />
        </Field>
        <Field label="Note (optional)">
          <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Agreed with them on a call" />
        </Field>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={buttonVariants({ variant: "ghost" })}>
            Cancel
          </button>
          <button onClick={() => void submit()} className={buttonVariants()}>
            Move the date
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/** A commitment row: tick to keep it, date chip, person/deal, actions. */
export function CommitmentRow({
  c,
  today,
  showPerson = true,
  showDirection = false,
  className,
}: {
  c: CommitmentItem;
  today: string;
  showPerson?: boolean;
  showDirection?: boolean;
  className?: string;
}) {
  const setStatus = useMutation(api.commitments.setStatus);
  const remove = useMutation(api.commitments.remove);
  const [edit, setEdit] = useState(false);
  const [reneg, setReneg] = useState(false);
  const done = c.status === "done";
  const closed = c.status !== "open";
  const late = !closed && !!c.promisedDate && c.promisedDate < today;
  const dueToday = !closed && c.promisedDate === today;
  const checkDue = !closed && c.direction === "owed_to_me" && !!c.checkDate && c.checkDate <= today;

  const toggle = async () => {
    try {
      const res = await setStatus({ id: c._id, status: done ? "open" : "done", date: today });
      if (!done) {
        if (res.xp) reward(c.direction === "i_owe" ? "Promise kept" : "Received", res.xp);
        else toast(c.direction === "i_owe" ? (res.onTime ? "Promise kept" : "Done. Late, but closed the loop") : "Marked received", { tone: "success" });
      }
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  };
  const set = async (status: "broken" | "cancelled" | "open") => {
    try {
      await setStatus({ id: c._id, status, date: today });
      toast(status === "open" ? "Reopened" : status === "broken" ? "Marked broken. Repair it with a quick note to them" : "Cancelled", { tone: status === "broken" ? "warning" : "neutral" });
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  };

  return (
    <div className={cn("group flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/40", className)}>
      <div className="pt-0.5">
        <CheckCircle checked={done} onClick={() => void toggle()} label={done ? "Reopen" : c.direction === "i_owe" ? "Mark kept" : "Mark received"} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-snug", closed && "text-muted-foreground", (done || c.status === "cancelled") && "line-through")}>{c.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {showDirection && <Chip tone={c.direction === "i_owe" ? "accent" : "outline"}>{c.direction === "i_owe" ? "I owe" : "Owed to me"}</Chip>}
          {c.promisedDate && (
            <Chip tone={late ? "warning" : dueToday ? "info" : "muted"} title={c.promisedDate}>
              <CalendarClock />
              {late ? `Due ${relDay(c.promisedDate, today).toLowerCase()}` : relDay(c.promisedDate, today)}
            </Chip>
          )}
          {checkDue && !late && !dueToday && <Chip tone="info">Check in today</Chip>}
          {c.status === "broken" && <Chip tone="warning">Broken</Chip>}
          {c.status === "renegotiated" && <Chip tone="muted">Renegotiated</Chip>}
          {c.status === "cancelled" && <Chip tone="muted">Cancelled</Chip>}
          {showPerson && c.personName && c.personId && (
            <Link href={`/people/${c.personId}`} className="truncate hover:text-foreground hover:underline" onClick={(e) => e.stopPropagation()}>
              {c.direction === "i_owe" ? "to" : "from"} {c.personName}
            </Link>
          )}
          {c.dealTitle && <span className="truncate">· {c.dealTitle}</span>}
        </div>
      </div>
      <RowMenu
        items={[
          { label: "Edit", icon: Pencil, onSelect: () => setEdit(true) },
          { label: "Renegotiate date", icon: ArrowRightLeft, onSelect: () => setReneg(true), hidden: closed },
          { label: "Mark broken", icon: XCircle, onSelect: () => void set("broken"), hidden: closed || c.direction !== "i_owe" },
          { label: "Cancel", icon: Ban, onSelect: () => void set("cancelled"), hidden: closed },
          { label: "Reopen", icon: RotateCcw, onSelect: () => void set("open"), hidden: !closed || done },
          {
            label: "Delete",
            icon: Trash2,
            danger: true,
            onSelect: () => {
              if (!confirm("Delete this commitment?")) return;
              remove({ id: c._id }).then(
                () => toast("Commitment deleted"),
                (e) => toast(errMsg(e), { tone: "warning" }),
              );
            },
          },
        ]}
      />
      {edit && (
        <Portal>
          <CommitmentDialog open onClose={() => setEdit(false)} editing={c} />
        </Portal>
      )}
      {reneg && (
        <Portal>
          <RenegotiateDialog c={c} onClose={() => setReneg(false)} />
        </Portal>
      )}
    </div>
  );
}

export function CommitmentList({
  items,
  today,
  showPerson = true,
  showDirection = false,
  empty,
}: {
  items: CommitmentItem[];
  today: string;
  showPerson?: boolean;
  showDirection?: boolean;
  empty?: string;
}) {
  if (!items.length) return empty ? <p className="px-2 py-3 text-sm text-muted-foreground">{empty}</p> : null;
  return (
    <div className="-mx-2 divide-y divide-border/60">
      {items.map((c) => (
        <CommitmentRow key={c._id} c={c} today={today} showPerson={showPerson} showDirection={showDirection} />
      ))}
    </div>
  );
}
