"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Clock, History, Plus, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AreaDot, Bar, Chip, EmptyHint, Field, Section, Select, TextInput, areaColor, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { clockLabel, fmtMin, minToClock, parseClock, relDay } from "@/lib/day";
import { errText } from "@/components/habits/util";
import { ENERGY, QUADRANTS, VALUE_HINT, VALUE_LABEL, quadrantOf, type Energy } from "./meta";

const QUICK = [15, 30, 45, 60, 90, 120];

export function AuditLogger({ today }: { today: string }) {
  const data = useQuery(api.delegation.audit, { today });
  const areas = useQuery(api.lifeAreas.list);
  const logAudit = useMutation(api.delegation.logAudit);
  const removeAudit = useMutation(api.delegation.removeAudit);

  const [activity, setActivity] = useState("");
  const [mode, setMode] = useState<"minutes" | "clock">("minutes");
  const [minutes, setMinutes] = useState<number | "">(30);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [value, setValue] = useState(2);
  const [energy, setEnergy] = useState<Energy>("neutral");
  const [areaId, setAreaId] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const day = date ?? today;
  const areaById = useMemo(() => new Map((areas ?? []).map((a) => [a._id as string, a])), [areas]);
  const q = quadrantOf(value, energy);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!activity.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const s = parseClock(start);
      const en = parseClock(end);
      if (mode === "clock" && (s == null || en == null)) throw new Error("Add a start and end time (e.g. 09:00 – 09:45).");
      await logAudit({
        date: day,
        activity: activity.trim(),
        minutes: mode === "minutes" ? Number(minutes) || 0 : undefined,
        startMin: mode === "clock" ? s ?? undefined : undefined,
        endMin: mode === "clock" ? en ?? undefined : undefined,
        lifeAreaId: areaId ? (areaId as Id<"lifeAreas">) : undefined,
        value,
        energy,
      });
      toast(`Logged · ${activity.trim()}`, { tone: "success", sub: `${QUADRANTS[q].label} quadrant` });
      setActivity("");
      if (mode === "clock" && en != null) {
        setStart(minToClock(en));
        setEnd("");
      }
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  }

  const grouped = useMemo(() => {
    const m = new Map<string, NonNullable<typeof data>["entries"]>();
    for (const e of data?.entries ?? []) {
      if (!m.has(e.date)) m.set(e.date, []);
      m.get(e.date)!.push(e);
    }
    return [...m.entries()];
  }, [data]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <Section title="Log a block" icon={Clock} hint="Every 15–30 minutes, jot what you did, what it's worth and how it felt.">
          <form onSubmit={submit} className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <TextInput
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="What did you just do? e.g. Invoices, client call, LinkedIn post"
                list="audit-activities"
                maxLength={120}
                className="sm:flex-1"
                autoComplete="off"
              />
              <datalist id="audit-activities">
                {(data?.recentActivities ?? []).map((r) => (
                  <option key={r.activity} value={r.activity} />
                ))}
              </datalist>
              <button type="submit" disabled={busy || !activity.trim()} className={cn(buttonVariants(), "sm:w-auto")}>
                <Plus /> Log
              </button>
            </div>

            {data && data.recentActivities.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                {data.recentActivities.slice(0, 8).map((r) => (
                  <button
                    key={r.activity}
                    type="button"
                    onClick={() => {
                      setActivity(r.activity);
                      setValue(r.value);
                      setEnergy(r.energy);
                      setAreaId(r.lifeAreaId ?? "");
                      if (mode === "minutes") setMinutes(r.minutes);
                    }}
                    className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  >
                    {r.activity}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="How long">
                <div className="space-y-2">
                  <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs">
                    {(["minutes", "clock"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={cn("rounded-md px-2.5 py-1 font-medium", mode === m ? "bg-card shadow-xs" : "text-muted-foreground")}
                      >
                        {m === "minutes" ? "Minutes" : "Start – end"}
                      </button>
                    ))}
                  </div>
                  {mode === "minutes" ? (
                    <div className="flex flex-wrap items-center gap-1">
                      {QUICK.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setMinutes(n)}
                          className={cn(
                            "h-8 rounded-md border px-2 text-xs font-medium tabular-nums transition-colors",
                            minutes === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
                          )}
                        >
                          {fmtMin(n)}
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={1440}
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value ? Number(e.target.value) : "")}
                        aria-label="Minutes"
                        className="h-8 w-16 rounded-md border border-input bg-card px-2 text-sm tabular-nums shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <TextInput type="time" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Start time" className="h-8" />
                      <span className="text-muted-foreground">–</span>
                      <TextInput type="time" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="End time" className="h-8" />
                    </div>
                  )}
                </div>
              </Field>
              <Field label="Area (optional)">
                <Select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="h-8">
                  <option value="">No area</option>
                  {(areas ?? [])
                    .filter((a) => !a.archived)
                    .map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label={`What's it worth? ${VALUE_HINT[value]}`} hint="If you hired someone for it, what would they cost?">
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setValue(n)}
                      className={cn(
                        "h-9 rounded-md border text-sm font-semibold tracking-tight transition-colors",
                        value === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
                      )}
                    >
                      {VALUE_LABEL[n]}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="How did it feel?">
                <div className="grid grid-cols-3 gap-1">
                  {(Object.keys(ENERGY) as Energy[]).map((k) => {
                    const I = ENERGY[k].icon;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setEnergy(k)}
                        className={cn(
                          "flex h-9 items-center justify-center gap-1 rounded-md border text-xs font-medium transition-colors",
                          energy === k ? "border-primary bg-accent" : "border-border hover:bg-accent",
                        )}
                      >
                        <I className={cn("h-3.5 w-3.5", ENERGY[k].cls)} />
                        {ENERGY[k].label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: QUADRANTS[q].color }} />
                Lands in <span className="font-medium text-foreground">{QUADRANTS[q].label}</span> — {QUADRANTS[q].action.toLowerCase()}
              </span>
              <label className="inline-flex items-center gap-1.5">
                Day
                <input
                  type="date"
                  value={day}
                  max={today}
                  onChange={(e) => setDate(e.target.value || null)}
                  className="h-7 rounded-md border border-input bg-card px-2 text-xs shadow-xs outline-none focus-visible:border-ring"
                />
              </label>
            </div>
            {error && <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">{error}</p>}
          </form>
        </Section>

        <Section title="Logged blocks" hint="Last 14 days">
          {data === undefined ? (
            <div className="space-y-2">
              <div className="skeleton h-10" />
              <div className="skeleton h-10" />
            </div>
          ) : grouped.length === 0 ? (
            <EmptyHint
              icon={Clock}
              title="Nothing logged yet"
              hint="The time audit is how you find what to hand off. Log a few blocks today — it takes seconds each."
            />
          ) : (
            <div className="space-y-4">
              {grouped.map(([d, list]) => (
                <div key={d}>
                  <p className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>{relDay(d, today)}</span>
                    <span className="tabular-nums">{fmtMin(list.reduce((s, e) => s + e.minutes, 0))}</span>
                  </p>
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {list.map((e) => {
                      const qq = quadrantOf(e.value, e.energy);
                      const E = ENERGY[e.energy];
                      const area = e.lifeAreaId ? areaById.get(e.lifeAreaId) : undefined;
                      return (
                        <li key={e._id} className="group flex items-center gap-2.5 px-3 py-2 text-sm">
                          <span className="size-2 shrink-0 rounded-full" style={{ background: QUADRANTS[qq].color }} title={QUADRANTS[qq].label} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{e.activity}</span>
                            <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                              {e.startMin != null ? `${clockLabel(e.startMin)} · ` : ""}
                              {fmtMin(e.minutes)}
                              {area && (
                                <span className="inline-flex items-center gap-1">
                                  <AreaDot color={areaColor(area)} />
                                  {area.name}
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{VALUE_LABEL[e.value]}</span>
                          <E.icon className={cn("h-3.5 w-3.5 shrink-0", E.cls)} aria-label={E.label} />
                          <button
                            onClick={() => removeAudit({ id: e._id }).catch((err) => toast(errText(err), { tone: "warning" }))}
                            aria-label="Delete entry"
                            className="shrink-0 rounded p-1 text-muted-foreground opacity-60 transition hover:text-danger group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="min-w-0 space-y-5">
        <Section title="2-week audit">
          {data === undefined ? (
            <div className="skeleton h-28" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-2">
                <p className="text-2xl font-semibold tabular-nums tracking-tight">
                  {data.daysLogged}
                  <span className="text-base font-normal text-muted-foreground"> / 14 days</span>
                </p>
                {data.daysLogged >= 14 ? <Chip tone="success">Complete</Chip> : <Chip tone="muted">{14 - data.daysLogged} to go</Chip>}
              </div>
              <Bar value={(data.daysLogged / 14) * 100} tone={data.daysLogged >= 14 ? "success" : "primary"} height="h-2" />
              <div className="grid grid-cols-7 gap-1">
                {data.byDay.map((b) => (
                  <span
                    key={b.date}
                    title={`${relDay(b.date, today)} · ${b.minutes ? fmtMin(b.minutes) : "not logged"}`}
                    className={cn(
                      "aspect-square rounded-md",
                      b.minutes === 0 ? "bg-muted" : b.minutes < 120 ? "bg-primary/30" : b.minutes < 300 ? "bg-primary/60" : "bg-primary",
                      b.date === today && "ring-2 ring-ring/50 ring-offset-1 ring-offset-card",
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {fmtMin(data.totalMin)} logged. Two weeks of honest logs show exactly which work to buy back.
              </p>
            </div>
          )}
        </Section>
        <Section title="How to rate">
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">$ – $$$$</span> what you&apos;d pay someone to do it: $ ≈ minimum wage, $$$$ ≈ only you.
            </li>
            <li>
              <span className="font-semibold text-foreground">Energy</span> — did it leave you more or less charged? Neutral counts as energizing in the DRIP matrix.
            </li>
            <li>Rough and fast beats precise. A rating takes one tap.</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
