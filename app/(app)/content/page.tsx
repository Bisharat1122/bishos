"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clapperboard,
  Clock,
  Columns3,
  GraduationCap,
  Layers,
  Lightbulb,
  Plus,
  Recycle,
  Sparkles,
  SquareKanban,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { EmptyHint, PageShell, Ring, Segmented, buttonVariants, cn } from "@/components/os/kit";
import { useToday } from "@/lib/day";
import { useStable } from "@/components/os/useCockpit";
import { AnalyticsPanel } from "@/components/content/AnalyticsPanel";
import { ContentCalendar } from "@/components/content/ContentCalendar";
import { IdeasBank } from "@/components/content/IdeasBank";
import { NewPieceDialog, type NewPieceDefaults } from "@/components/content/NewPieceDialog";
import { PillarsPanel } from "@/components/content/PillarsPanel";
import { PlaybookTab } from "@/components/content/playbook/PlaybookTab";
import { StudioBoard } from "@/components/content/StudioBoard";
import { BrandToggle, StageChip } from "@/components/content/bits";
import { useStageMover } from "@/components/content/useStageMover";
import { IDEA_GOAL, STAGE_ORDER, STAGE_LABEL, matchesBrand, nextStage, useBrandFilter, type Brand } from "@/components/content/model";

type Tab = "playbook" | "board" | "calendar" | "ideas" | "pillars" | "analytics";
const TABS: Tab[] = ["playbook", "board", "calendar", "ideas", "pillars", "analytics"];

export default function ContentPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8"><div className="skeleton h-40" /></div>}>
      <Studio />
    </Suspense>
  );
}

function Studio() {
  const today = useToday();
  const router = useRouter();
  const search = useSearchParams();
  const raw = search.get("tab") as Tab | null;
  const explicit = raw && TABS.includes(raw) ? raw : null;

  const [brand, setBrand] = useBrandFilter();
  const pieces = useQuery(api.content.list);
  const strategies = useQuery(api.contentSystem.strategies);
  // First run (no positioning yet AND no pieces) opens the Kallaway Playbook. Decided
  // once per visit, so saving the first strategy field doesn't yank you to the board.
  const [landing, setLanding] = useState<Tab | null>(null);
  useEffect(() => {
    if (landing || pieces === undefined || strategies === undefined) return;
    setLanding(strategies.length === 0 && pieces.length === 0 ? "playbook" : "board");
  }, [landing, pieces, strategies]);
  const tab: Tab = explicit ?? landing ?? "board";
  const resolving = !explicit && !landing;
  const setTab = (t: Tab) => router.replace(t === "board" && landing !== "playbook" ? "/content" : `/content?tab=${t}`, { scroll: false });
  // useStable: keep the last result when `today` rolls over at midnight, so the
  // whole Studio doesn't flash back to skeletons while the queries resubscribe.
  const pillars = useStable(useQuery(api.content.listPillars, { today }));
  const info = useStable(useQuery(api.content.today, { date: today }));
  const mover = useStageMover();
  const [newDefaults, setNewDefaults] = useState<NewPieceDefaults | null>(null);

  const defaultBrand: Brand = brand === "both" ? "personal" : brand;
  const shown = useMemo(() => (pieces ?? []).filter((p) => matchesBrand(brand, p.brand)), [pieces, brand]);
  const ideaCount = shown.filter((p) => p.stage === "idea" || p.stage === "seed").length;

  // This week's hub: the most advanced unpublished hub.
  const hub = useMemo(
    () =>
      shown
        .filter((p) => p.isHub && !p.publishedAt && p.stage !== "archived")
        .sort((a, b) => STAGE_ORDER.indexOf(b.stage) - STAGE_ORDER.indexOf(a.stage))[0],
    [shown],
  );
  const hubNext = hub ? nextStage(hub.stage, hub.format, true) : null;
  const week = info?.week;
  const hubPct = week ? Math.min(100, (week.hubs / Math.max(1, week.target)) * 100) : 0;

  const openNew = (d: NewPieceDefaults = {}) => setNewDefaults({ brand: defaultBrand, ...d });

  // One obvious next move every time you open the Studio.
  const nextMove: { text: string; cta: string; href?: string; tab?: Tab } | null = (() => {
    if (!info) return null;
    const first = info.scheduled.find((p) => matchesBrand(brand, p.brand));
    if (first) return { text: `Publish “${first.title}” today`, cta: "Open", href: `/content/${first._id}` };
    if (info.needsNumbers > 0)
      return { text: `${info.needsNumbers} piece${info.needsNumbers === 1 ? " needs" : "s need"} numbers. Two minutes, then you know what works.`, cta: "Log numbers", tab: "analytics" };
    if (hub && hubNext) return { text: `Move your hub forward: ${STAGE_LABEL[hub.stage]} → ${STAGE_LABEL[hubNext]}`, cta: "Open hub", href: `/content/${hub._id}` };
    if (!hub && info.week.hubs < info.week.target) return { text: "Pick this week's hub from your idea bank", cta: "Ideas", tab: "ideas" };
    if (info.ideaCount < IDEA_GOAL) return { text: `Bank 3 ideas. You're at ${info.ideaCount}/${IDEA_GOAL}.`, cta: "Capture", tab: "ideas" };
    return { text: "Save one post that stopped your scroll, and write why it worked", cta: "Inspiration", href: "/swipes" };
  })();

  const stat = (label: string, value: number | string, icon: typeof Clock, onClick: () => void, tone?: "info" | "warning") => {
    const I = icon;
    return (
      <button
        onClick={onClick}
        className="flex min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent/60"
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
            tone === "info" && "bg-info-soft text-info",
            tone === "warning" && "bg-warning-soft text-warning",
          )}
        >
          <I className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-base font-semibold leading-none tabular-nums">{value}</span>
          <span className="mt-1 block truncate text-[11px] text-muted-foreground">{label}</span>
        </span>
      </button>
    );
  };

  return (
    <PageShell
      title="Content Studio"
      subtitle="One hub a week, cut into many. Ideas → script → publish → measure → recycle."
      icon={Clapperboard}
      actions={
        <>
          <BrandToggle value={brand} onChange={setBrand} />
          <Link href="/swipes" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Sparkles className="h-3.5 w-3.5" /> Inspiration
          </Link>
          <button onClick={() => openNew()} className={buttonVariants({ size: "sm" })}>
            <Plus className="h-3.5 w-3.5" /> New piece
          </button>
        </>
      }
      headerExtra={
        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]">
          {/* This week's hub */}
          <div className="os-rise flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
            <Ring value={hubPct} size={60} stroke={6} tone={hubPct >= 100 ? "success" : "primary"}>
              <span className="text-xs font-semibold tabular-nums">
                {week ? `${week.hubs}/${week.target}` : "–"}
              </span>
            </Ring>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">This week&apos;s hub</p>
              {week && week.hubs >= week.target ? (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Shipped. Now cut it into shorts.
                </p>
              ) : hub ? (
                <>
                  <Link href={`/content/${hub._id}`} className="mt-0.5 block truncate text-sm font-medium hover:underline">
                    {hub.title}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StageChip stage={hub.stage} />
                    {hubNext && (
                      <button
                        onClick={() => void mover.advance(hub)}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-6 px-2 text-[11px]")}
                      >
                        {STAGE_LABEL[hubNext]} <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-sm text-muted-foreground">No hub in progress.</p>
                  <button onClick={() => openNew({ isHub: true, stage: "brief" })} className={cn(buttonVariants({ size: "sm" }), "h-7 text-xs")}>
                    <Layers className="h-3.5 w-3.5" /> Start one
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Daily glance */}
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-2 shadow-card sm:grid-cols-4">
            {stat(
              info?.overdue.length ? `today · ${info.overdue.length} slipped` : "scheduled today",
              info ? info.scheduled.length : "–",
              CalendarDays,
              () => setTab("calendar"),
              info?.overdue.length ? "warning" : undefined,
            )}
            <button
              onClick={() => setTab("ideas")}
              className="flex min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent/60"
            >
              <Ring value={Math.min(100, ((info?.ideaCount ?? 0) / IDEA_GOAL) * 100)} size={32} stroke={4} tone="primary">
                <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
              </Ring>
              <span className="min-w-0">
                <span className="block text-base font-semibold leading-none tabular-nums">
                  {info?.ideaCount ?? "–"}
                  <span className="text-xs font-normal text-muted-foreground">/{IDEA_GOAL}</span>
                </span>
                <span className="mt-1 block truncate text-[11px] text-muted-foreground">idea bank</span>
              </span>
            </button>
            {stat("need numbers", info?.needsNumbers ?? "–", Clock, () => setTab("analytics"), info?.needsNumbers ? "info" : undefined)}
            {stat("recycle due", info?.recycleDue ?? "–", Recycle, () => setTab("analytics"), info?.recycleDue ? "info" : undefined)}
          </div>
        </div>
      }
    >
      {nextMove && (
        <div className="os-rise mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2">
          <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Next move</span>
          <span className="min-w-0 flex-1 text-sm">{nextMove.text}</span>
          {nextMove.href ? (
            <Link href={nextMove.href} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}>
              {nextMove.cta} <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <button onClick={() => nextMove.tab && setTab(nextMove.tab)} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}>
              {nextMove.cta} <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "playbook", label: "Playbook", icon: GraduationCap },
            { value: "board", label: "Board", icon: SquareKanban },
            { value: "calendar", label: "Calendar", icon: CalendarDays },
            { value: "ideas", label: "Ideas", icon: Lightbulb, count: pieces ? ideaCount : undefined },
            { value: "pillars", label: "Pillars", icon: Columns3, count: pillars?.length },
            { value: "analytics", label: "Analytics", icon: BarChart3 },
          ]}
        />
      </div>

      {pieces === undefined || pillars === undefined || resolving ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-80 w-72 shrink-0" />
          ))}
        </div>
      ) : (
        <div className="fade-in">
          {tab === "playbook" && <PlaybookTab initialBrand={defaultBrand} pillars={pillars} today={today} />}
          {tab === "board" &&
            (pieces.length === 0 ? (
              <EmptyHint
                icon={Clapperboard}
                title="Your content pipeline starts with ideas"
                hint="Dump 10 ideas in two minutes, set up 2–3 pillars per brand, then pick one idea as this week's hub."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <button onClick={() => setTab("playbook")} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <GraduationCap className="h-3.5 w-3.5" /> Start the Playbook
                    </button>
                    <button onClick={() => setTab("ideas")} className={buttonVariants({ size: "sm" })}>
                      <Lightbulb className="h-3.5 w-3.5" /> Capture ideas
                    </button>
                    <button onClick={() => setTab("pillars")} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <Columns3 className="h-3.5 w-3.5" /> Set up pillars
                    </button>
                  </div>
                }
              />
            ) : (
              <StudioBoard pieces={shown} pillars={pillars} today={today} brand={defaultBrand} mover={mover} onNew={openNew} />
            ))}
          {tab === "calendar" && <ContentCalendar pillars={pillars} today={today} brand={brand} onNew={openNew} />}
          {tab === "ideas" && <IdeasBank pieces={shown} allPieces={pieces} pillars={pillars} today={today} defaultBrand={defaultBrand} />}
          {tab === "pillars" && <PillarsPanel pillars={pillars} brand={brand} />}
          {tab === "analytics" && (
            <AnalyticsPanel brand={brand} today={today} ideas={shown.filter((p) => ["idea", "seed", "brief", "script"].includes(p.stage))} />
          )}
        </div>
      )}

      <NewPieceDialog open={!!newDefaults} onClose={() => setNewDefaults(null)} pillars={pillars ?? []} defaults={newDefaults ?? undefined} />
      {mover.gateEl}
    </PageShell>
  );
}

