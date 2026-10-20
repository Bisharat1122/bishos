"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { BookmarkPlus, Clapperboard, Library, Plus, Search, Sparkles, TrendingUp, Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyHint, PageShell, Segmented, Select, buttonVariants, cn, inputClass } from "@/components/os/kit";
import { toast } from "@/components/os/celebrate";
import { BrandToggle } from "@/components/content/bits";
import { HookLibrary } from "@/components/content/HookLibrary";
import { SaveSwipeDialog } from "@/components/content/SaveSwipeDialog";
import { SwipeCard } from "@/components/content/SwipeCard";
import { RemixDialog } from "@/components/content/playbook/RemixDialog";
import { WatchlistPanel } from "@/components/content/playbook/WatchlistPanel";
import { useToday } from "@/lib/day";
import { FORMATS, HOOK_TYPES, PLATFORMS, errMsg, matchesBrand, pillarColor, useBrandFilter, type Swipe } from "@/components/content/model";

type Tab = "library" | "hooks" | "watchlist";
type Sort = "new" | "outlier" | "used";

export default function SwipesPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8"><div className="skeleton h-40" /></div>}>
      <Swipes />
    </Suspense>
  );
}

function Swipes() {
  const router = useRouter();
  const search = useSearchParams();
  const rawTab = search.get("tab");
  const tab: Tab = rawTab === "hooks" || rawTab === "watchlist" ? rawTab : "library";
  const setTab = (t: Tab) => router.replace(t === "library" ? "/swipes" : `/swipes?tab=${t}`, { scroll: false });
  const today = useToday();

  const [brand, setBrand] = useBrandFilter();
  const swipes = useQuery(api.swipes.list);
  const stats = useQuery(api.swipes.stats);
  // Same args as Warmup + the Studio ({ today }) so the cached result is shared.
  const pillars = useQuery(api.content.listPillars, { today });
  const startPiece = useMutation(api.swipes.useInPiece);
  const saveHook = useMutation(api.swipes.saveHookFromSwipe);
  const remove = useMutation(api.swipes.remove);

  const [dialog, setDialog] = useState<{ swipe: Swipe | null; creatorWatchId?: Id<"creatorWatch"> } | null>(null);
  const [remixing, setRemixing] = useState<Swipe | null>(null);
  const watchCount = useQuery(api.contentSystem.watchlist)?.length;
  const [q, setQ] = useState("");
  const [hookType, setHookType] = useState("all");
  const [format, setFormat] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [pillar, setPillar] = useState("all");
  const [sort, setSort] = useState<Sort>("new");

  const pillarById = useMemo(() => new Map((pillars ?? []).map((p, i) => [p._id as string, { name: p.name, color: pillarColor(p, i) }])), [pillars]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = (swipes ?? []).filter(
      (s) =>
        matchesBrand(brand, s.brand) &&
        (hookType === "all" || s.hookType === hookType) &&
        (format === "all" || s.format === format) &&
        (platform === "all" || s.platform === platform) &&
        (pillar === "all" || (pillar === "none" ? !s.pillarId : s.pillarId === pillar)) &&
        (!needle ||
          [s.hookText, s.creator, s.title, s.whyItWorked, s.whatToSteal, s.structure].some((x) => (x ?? "").toLowerCase().includes(needle))),
    );
    if (sort === "outlier") return [...list].sort((a, b) => (b.outlier ?? -1) - (a.outlier ?? -1));
    if (sort === "used") return [...list].sort((a, b) => (b.used ?? 0) - (a.used ?? 0));
    return list;
  }, [swipes, brand, hookType, format, platform, pillar, q, sort]);

  const filtersOn = hookType !== "all" || format !== "all" || platform !== "all" || pillar !== "all" || q.trim();

  async function use(s: Swipe) {
    try {
      const id = await startPiece({ id: s._id, brand: brand === "both" ? undefined : brand });
      toast("New piece started from this swipe", { tone: "success", sub: "Linked as inspiration" });
      router.push(`/content/${id}`);
    } catch (e) {
      toast(errMsg(e), { tone: "warning" });
    }
  }

  return (
    <PageShell
      title="Inspiration"
      subtitle="Saved posts are raw material, not a collection. Break each one down when you save it, then steal the move."
      icon={Sparkles}
      actions={
        <>
          <BrandToggle value={brand} onChange={setBrand} />
          <Link href="/content" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Clapperboard className="h-3.5 w-3.5" /> Studio
          </Link>
          <button onClick={() => setDialog({ swipe: null })} className={buttonVariants({ size: "sm" })}>
            <Plus className="h-3.5 w-3.5" /> Save inspiration
          </button>
        </>
      }
      headerExtra={
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-2 shadow-card sm:grid-cols-4">
          {[
            { label: "saved", value: stats?.saved ?? "–", icon: BookmarkPlus },
            {
              label: stats && stats.saved ? `used in pieces · ${stats.usedPct}%` : "used in pieces",
              value: stats?.used ?? "–",
              icon: Clapperboard,
            },
            { label: "median outlier", value: stats?.medianOutlier != null ? `${stats.medianOutlier}×` : "–", icon: TrendingUp },
            { label: "hooks in library", value: stats?.hooks ?? "–", icon: Library, onClick: () => setTab("hooks") },
          ].map((s) => {
            const I = s.icon;
            const inner = (
              <>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <I className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold leading-none tabular-nums">{s.value}</span>
                  <span className="mt-1 block truncate text-[11px] text-muted-foreground">{s.label}</span>
                </span>
              </>
            );
            return s.onClick ? (
              <button key={s.label} onClick={s.onClick} className="flex min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-accent/60">
                {inner}
              </button>
            ) : (
              <div key={s.label} className="flex min-w-0 items-center gap-2.5 px-2.5 py-2">
                {inner}
              </div>
            );
          })}
        </div>
      }
    >
      <div className="mb-4">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "library", label: "Library", icon: Sparkles, count: swipes?.length },
            { value: "hooks", label: "Hooks", icon: Library, count: stats?.hooks },
            { value: "watchlist", label: "Watchlist", icon: Users, count: watchCount },
          ]}
        />
      </div>

      {tab === "hooks" ? (
        <HookLibrary />
      ) : tab === "watchlist" ? (
        <WatchlistPanel brand={brand} today={today} onLogOutlier={(id) => setDialog({ swipe: null, creatorWatchId: id })} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hooks, creators, lessons" className={cn(inputClass, "h-8 w-full pl-8")} />
            </div>
            <Select value={hookType} onChange={(e) => setHookType(e.target.value)} className="h-8 w-auto min-w-[120px]" aria-label="Hook type">
              <option value="all">All hook types</option>
              {HOOK_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Select value={format} onChange={(e) => setFormat(e.target.value)} className="h-8 w-auto min-w-[120px]" aria-label="Format">
              <option value="all">All formats</option>
              {FORMATS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </Select>
            <Select value={platform} onChange={(e) => setPlatform(e.target.value)} className="h-8 w-auto min-w-[120px]" aria-label="Platform">
              <option value="all">All platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </Select>
            <Select value={pillar} onChange={(e) => setPillar(e.target.value)} className="h-8 w-auto min-w-[120px]" aria-label="Pillar">
              <option value="all">All pillars</option>
              {(pillars ?? []).map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
              <option value="none">No pillar</option>
            </Select>
            <Segmented<Sort>
              size="sm"
              className="ml-auto"
              value={sort}
              onChange={setSort}
              options={[
                { value: "new", label: "Newest" },
                { value: "outlier", label: "Outliers" },
                { value: "used", label: "Most used" },
              ]}
            />
          </div>

          {swipes === undefined ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="skeleton h-72" />
              ))}
            </div>
          ) : swipes.length === 0 ? (
            <EmptyHint
              icon={Sparkles}
              title="Start your inspiration library"
              hint="Saw a post or reel that stopped your scroll? Paste the link and caption, let AI break down the hook, and write one line on why it worked."
              action={
                <button onClick={() => setDialog({ swipe: null })} className={buttonVariants({ size: "sm" })}>
                  <Plus className="h-3.5 w-3.5" /> Save your first one
                </button>
              }
            />
          ) : shown.length === 0 ? (
            <EmptyHint
              icon={Search}
              title="Nothing matches"
              hint={filtersOn ? "Try fewer filters." : "No swipes for this brand yet."}
              action={
                filtersOn ? (
                  <button
                    onClick={() => {
                      setQ("");
                      setHookType("all");
                      setFormat("all");
                      setPlatform("all");
                      setPillar("all");
                    }}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((s) => (
                <SwipeCard
                  key={s._id}
                  swipe={s}
                  pillar={s.pillarId ? pillarById.get(s.pillarId) : undefined}
                  onUse={() => void use(s)}
                  onRemix={() => setRemixing(s)}
                  onSaveHook={() =>
                    void saveHook({ swipeId: s._id })
                      .then((r) => toast(r.existed ? "Already in your hook library" : "Hook saved to library", { tone: "success" }))
                      .catch((e) => toast(errMsg(e), { tone: "warning" }))
                  }
                  onEdit={() => setDialog({ swipe: s })}
                  onDelete={() => {
                    if (confirm("Delete this inspiration?")) void remove({ id: s._id }).catch((e) => toast(errMsg(e), { tone: "warning" }));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <SaveSwipeDialog
        open={!!dialog}
        onClose={() => setDialog(null)}
        swipe={dialog?.swipe ?? null}
        pillars={pillars ?? []}
        defaultBrand={brand === "both" ? undefined : brand}
        preset={dialog?.creatorWatchId ? { creatorWatchId: dialog.creatorWatchId } : undefined}
      />
      <RemixDialog open={!!remixing} swipe={remixing} onClose={() => setRemixing(null)} defaultBrand={brand === "both" ? undefined : brand} />
    </PageShell>
  );
}
