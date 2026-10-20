"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CalendarCheck, ExternalLink, PenLine, Plus, Trash2, TrendingUp, Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Bar, Chip, Dialog, EmptyHint, Field, Segmented, Select, TextArea, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { relDay } from "@/lib/day";
import { BrandBadge } from "../bits";
import { BRAND_META, PLATFORMS, detectPlatform, errMsg, matchesBrand, platformMeta, type Brand, type BrandFilter } from "../model";
import { WATCH_MAX, WATCH_MIN, compact, parseCount, tierOf, type Creator } from "./model";

type Sort = "new" | "stale" | "swipes";

/** Creator watchlist CRUD (Swipes → Watchlist tab). */
export function WatchlistPanel({ brand, today, onLogOutlier }: { brand: BrandFilter; today: string; onLogOutlier: (id: Id<"creatorWatch">) => void }) {
  const rows = useQuery(api.contentSystem.watchlist);
  const update = useMutation(api.contentSystem.updateCreator);
  const remove = useMutation(api.contentSystem.removeCreator);
  const [dialog, setDialog] = useState<{ creator: Creator | null } | null>(null);
  const [sort, setSort] = useState<Sort>("stale");

  const shown = useMemo(() => {
    const list = (rows ?? []).filter((r) => matchesBrand(brand, r.brand));
    if (sort === "stale") return [...list].sort((a, b) => (a.lastCheckedOn ?? "").localeCompare(b.lastCheckedOn ?? ""));
    if (sort === "swipes") return [...list].sort((a, b) => b.swipes - a.swipes);
    return list;
  }, [rows, brand, sort]);

  const inRange = shown.filter((r) => tierOf(r.followers).inRange).length;
  const big = shown.filter((r) => tierOf(r.followers).key === "big").length;
  const checkedToday = shown.filter((r) => r.lastCheckedOn === today).length;

  const markChecked = (r: Creator) =>
    void update({ id: r._id, lastCheckedOn: today })
      .then(() => toast(`Checked ${r.name} today`, { tone: "success", sub: "Log any 5×+ outlier you found" }))
      .catch((e) => toast(errMsg(e), { tone: "warning" }));

  const del = (r: Creator) => {
    if (!confirm(`Remove ${r.name} from your watchlist?`)) return;
    void remove({ id: r._id }).catch((e) => toast(errMsg(e), { tone: "warning" }));
  };

  return (
    <div className="space-y-4">
      {/* Guidance + progress */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">Your watchlist</p>
            <p className="text-2xl font-semibold tabular-nums leading-none">
              {rows ? shown.length : "–"}
              <span className="text-sm font-normal text-muted-foreground">/{WATCH_MIN}–{WATCH_MAX}</span>
            </p>
          </div>
          <Bar value={(shown.length / WATCH_MIN) * 100} tone={shown.length >= WATCH_MIN ? "success" : "primary"} className="mt-3" height="h-2" />
          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            <Chip tone="outline" className="tabular-nums">
              {inRange} in the 10K–1M range
            </Chip>
            {big > 0 && (
              <Chip tone="warning" className="tabular-nums">
                {big} over 1M
              </Chip>
            )}
            <Chip tone={checkedToday ? "success" : "muted"} className="tabular-nums">
              {checkedToday} checked today
            </Chip>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Start with ~10 that win in your space, talk about what you want to talk about, to the people you want. Grow to 20–30.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="text-sm font-semibold">Who belongs here</p>
          <ul className="mt-2 grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
            <li>
              <span className="font-medium">Same content type.</span> Short-form video to learn short-form video. Tweets and blogs only seed a topic.
            </li>
            <li>
              <span className="font-medium">10K–1M followers.</span> Micro 10–50K, small 50–250K, medium 250K–1M.
            </li>
            <li>
              <span className="font-medium">Ignore over 1M.</span> Their duds are propped up by brand, so their outliers lie.
            </li>
            <li>
              <span className="font-medium">Small creators&apos; outliers count most.</span> No face credibility, so the idea itself won.
            </li>
            <li>
              <span className="font-medium">Check daily, or 4–5× a week.</span> Log anything ≥5× their average with &gt;2% engagement.
            </li>
            <li>
              <span className="font-medium">Find them</span> via your own list, who top creators follow, keyword search, or a database.
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented<Sort>
          size="sm"
          value={sort}
          onChange={setSort}
          options={[
            { value: "stale", label: "Needs a check" },
            { value: "new", label: "Recently added" },
            { value: "swipes", label: "Most swipes" },
          ]}
        />
        <button type="button" onClick={() => setDialog({ creator: null })} className={buttonVariants({ size: "sm" })}>
          <Plus className="h-3.5 w-3.5" /> Add creator
        </button>
      </div>

      {rows === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-14" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyHint
          icon={Users}
          title="Build your creator watchlist"
          hint="20–30 creators with 10K–1M followers making the same kind of content. Their outliers become your validated ideas."
          action={
            <button type="button" onClick={() => setDialog({ creator: null })} className={buttonVariants({ size: "sm" })}>
              <Plus className="h-3.5 w-3.5" /> Add your first creator
            </button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Creator</th>
                  <th className="px-3 py-2 font-medium">Platform</th>
                  <th className="px-3 py-2 text-right font-medium">Followers</th>
                  <th className="px-3 py-2 text-right font-medium">Avg views</th>
                  <th className="px-3 py-2 font-medium">Brand</th>
                  <th className="px-3 py-2 font-medium">Last checked</th>
                  <th className="px-3 py-2 text-right font-medium">Swipes</th>
                  <th className="px-3 py-2" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const t = tierOf(r.followers);
                  const P = platformMeta(r.platform);
                  const PI = P.icon;
                  return (
                    <tr key={r._id} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="max-w-[240px] px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium" title={r.notes}>
                            {r.name}
                          </span>
                          {r.url && (
                            <a href={r.url} target="_blank" rel="noreferrer" aria-label={`Open ${r.name}`} className="shrink-0 text-muted-foreground hover:text-foreground">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        {r.notes && <p className="truncate text-[11px] text-muted-foreground">{r.notes}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <PI className="h-3.5 w-3.5" /> {r.platform ? P.label : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="tabular-nums">{compact(r.followers)}</span>
                          <Chip tone={t.tone} className="h-4 px-1.5 text-[9px]" title={t.hint}>
                            {t.label}
                          </Chip>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{compact(r.avgViews)}</td>
                      <td className="px-3 py-2">{r.brand ? <BrandBadge brand={r.brand} /> : <span className="text-xs text-muted-foreground">Both</span>}</td>
                      <td className="px-3 py-2">
                        <span className={cn("text-xs", r.lastCheckedOn === today ? "font-medium text-success" : "text-muted-foreground")}>
                          {r.lastCheckedOn ? relDay(r.lastCheckedOn, today) : "Never"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.swipes}</td>
                      <td className="px-3 py-2">
                        <RowActions r={r} today={today} onCheck={() => markChecked(r)} onLog={() => onLogOutlier(r._id)} onEdit={() => setDialog({ creator: r })} onDelete={() => del(r)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-2 md:hidden">
            {shown.map((r) => {
              const t = tierOf(r.followers);
              const P = platformMeta(r.platform);
              const PI = P.icon;
              return (
                <li key={r._id} className="rounded-xl border border-border bg-card p-3 shadow-card">
                  <div className="flex items-start gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <PI className="h-4 w-4" aria-label={P.label} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{r.name}</span>
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noreferrer" aria-label={`Open ${r.name}`} className="shrink-0 text-muted-foreground">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] tabular-nums text-muted-foreground">
                        {compact(r.followers)} followers · {compact(r.avgViews)} avg · {r.swipes} swipe{r.swipes === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Chip tone={t.tone} className="h-5 shrink-0 px-1.5 text-[10px]" title={t.hint}>
                      {t.label}
                    </Chip>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={cn("text-[11px]", r.lastCheckedOn === today ? "font-medium text-success" : "text-muted-foreground")}>
                      Last checked: {r.lastCheckedOn ? relDay(r.lastCheckedOn, today) : "never"}
                    </span>
                    <RowActions r={r} today={today} onCheck={() => markChecked(r)} onLog={() => onLogOutlier(r._id)} onEdit={() => setDialog({ creator: r })} onDelete={() => del(r)} />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <CreatorDialog open={!!dialog} creator={dialog?.creator ?? null} defaultBrand={brand === "both" ? undefined : brand} onClose={() => setDialog(null)} />
    </div>
  );
}

function RowActions({ r, today, onCheck, onLog, onEdit, onDelete }: { r: Creator; today: string; onCheck: () => void; onLog: () => void; onEdit: () => void; onDelete: () => void }) {
  const checked = r.lastCheckedOn === today;
  return (
    <span className="flex items-center justify-end gap-0.5">
      <button
        type="button"
        onClick={onCheck}
        disabled={checked}
        title={checked ? "Checked today" : "Mark checked today"}
        aria-label={checked ? "Checked today" : "Mark checked today"}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), checked && "text-success")}
      >
        <CalendarCheck className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onLog} title="Log an outlier from this creator" aria-label="Log an outlier" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
        <TrendingUp className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onEdit} aria-label="Edit creator" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
        <PenLine className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onDelete} aria-label="Remove creator" className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "hover:text-danger")}>
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

type Form = { name: string; platform: string; url: string; followers: string; avgViews: string; brand: "" | Brand; notes: string };
const EMPTY: Form = { name: "", platform: "", url: "", followers: "", avgViews: "", brand: "", notes: "" };

/** Add / edit one watchlist creator. */
export function CreatorDialog({ open, creator, defaultBrand, onClose }: { open: boolean; creator: Creator | null; defaultBrand?: Brand; onClose: () => void }) {
  const add = useMutation(api.contentSystem.addCreator);
  const update = useMutation(api.contentSystem.updateCreator);
  const [f, setF] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF(
      creator
        ? {
            name: creator.name,
            platform: creator.platform ?? "",
            url: creator.url ?? "",
            followers: creator.followers != null ? String(creator.followers) : "",
            avgViews: creator.avgViews != null ? String(creator.avgViews) : "",
            brand: creator.brand ?? "",
            notes: creator.notes ?? "",
          }
        : { ...EMPTY, brand: defaultBrand ?? "" },
    );
  }, [open, creator, defaultBrand]);

  const followers = parseCount(f.followers);
  const tier = f.followers.trim() ? tierOf(followers) : null;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  async function save() {
    if (!f.name.trim()) {
      toast("Give the creator a name", { tone: "warning" });
      return;
    }
    if ((f.followers.trim() && followers === undefined) || (f.avgViews.trim() && parseCount(f.avgViews) === undefined)) {
      toast("Use a number like 12000, 120k or 1.2m", { tone: "warning" });
      return;
    }
    setBusy(true);
    const body = {
      name: f.name.trim(),
      platform: f.platform || undefined,
      url: f.url.trim() || undefined,
      followers,
      avgViews: parseCount(f.avgViews),
      brand: f.brand || undefined,
      notes: f.notes.trim() || undefined,
    };
    try {
      if (creator) {
        // null = clear: an emptied input must wipe the stored value, not keep it.
        await update({
          id: creator._id,
          name: body.name,
          platform: body.platform ?? null,
          url: body.url ?? null,
          followers: body.followers ?? null,
          avgViews: body.avgViews ?? null,
          brand: body.brand ?? null,
          notes: body.notes ?? null,
        });
        toast("Creator updated", { tone: "success" });
      } else {
        await add(body);
        toast(`${body.name} added to your watchlist`, { tone: "success" });
      }
      onClose();
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={creator ? "Edit creator" : "Add a creator to watch"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="space-y-3"
      >
        <Field label="Name or @handle">
          <TextInput value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="@creator" autoFocus />
        </Field>
        <Field label="Profile URL">
          <TextInput
            value={f.url}
            onChange={(e) => {
              const v = e.target.value;
              set("url", v);
              const p = detectPlatform(v);
              if (p && !f.platform) set("platform", p);
            }}
            placeholder="https://…"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Platform">
            <Select value={f.platform} onChange={(e) => set("platform", e.target.value)}>
              <option value="">—</option>
              {PLATFORMS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="For">
            <Select value={f.brand} onChange={(e) => set("brand", e.target.value as Form["brand"])}>
              <option value="">Both brands</option>
              <option value="personal">{BRAND_META.personal.label}</option>
              <option value="company">{BRAND_META.company.label}</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Followers" hint={tier ? <span className={cn(tier.tone === "warning" && "text-warning")}>{tier.hint}</span> : "e.g. 120k"}>
            <TextInput inputMode="numeric" value={f.followers} onChange={(e) => set("followers", e.target.value)} placeholder="120k" />
          </Field>
          <Field label="Average views" hint="Their usual, last ~3 months">
            <TextInput inputMode="numeric" value={f.avgViews} onChange={(e) => set("avgViews", e.target.value)} placeholder="25k" />
          </Field>
        </div>
        <Field label="Notes">
          <TextArea value={f.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-[56px]" placeholder="What they do well: hooks, visual format, series…" />
        </Field>
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Cancel
          </button>
          <button type="submit" disabled={busy || !f.name.trim()} className={buttonVariants({ size: "sm" })}>
            {creator ? "Save" : "Add creator"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
