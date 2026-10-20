import Link from "next/link";
import { Download, ArrowUpRight, Lightbulb, FlaskConical, BookA, Repeat2 } from "lucide-react";
import { GuideSearch, RhythmTabs, GuideShell } from "@/components/guide/GuideClient";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { SECTIONS, GROUP_ORDER, glossary, guideStats, RHYTHM, FIRST_WEEK, QUICK_TEST, type GuideSection } from "@/lib/guide";

/**
 * The complete bishOS manual — server-rendered (fast, no client data) from
 * lib/guide (the same content as the PDF in /public/bishOS-Guide.pdf).
 */
export default function GuidePage() {
  const stats = guideStats();
  const terms = glossary();
  const groups = GROUP_ORDER.filter((g) => SECTIONS.some((s) => s.group === g));
  const searchable = stats.elements + stats.terms;

  return (
    <GuideShell
      actions={
        <a href="/bishOS-Guide.pdf" download className={buttonVariants({ variant: "outline" })}>
          <Download /> Download PDF
        </a>
      }
      headerExtra={
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <GuideSearch total={searchable} />
          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            <span className="rounded-md border border-border bg-card px-2 py-1">
              <b className="text-foreground">{stats.sections}</b> modules
            </span>
            <span className="rounded-md border border-border bg-card px-2 py-1">
              <b className="text-foreground">{stats.pages}</b> pages
            </span>
            <span className="rounded-md border border-border bg-card px-2 py-1">
              <b className="text-foreground">{stats.elements}</b> elements
            </span>
            <span className="rounded-md border border-border bg-card px-2 py-1">
              <b className="text-foreground">{stats.terms}</b> terms
            </span>
          </div>
        </div>
      }
    >
      {/* Rhythm */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Repeat2 className="h-4 w-4 text-muted-foreground" /> Your rhythm — what to do and when
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          The whole system in one line: Life Areas → a 12-week cycle with ≤3 goals → weekly tactics → Weekly Big 3 → daily Top 3 → evening shutdown → Friday weekly review.
        </p>
        <div className="mt-4">
          <RhythmTabs blocks={RHYTHM} firstWeek={FIRST_WEEK} quickTest={QUICK_TEST} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        {/* Index */}
        <nav aria-label="Guide contents" className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <div className="rounded-xl border border-border bg-card p-3 shadow-card">
            {groups.map((g) => (
              <div key={g} className="mb-3 last:mb-0">
                <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g}</p>
                {SECTIONS.filter((s) => s.group === g).map((s) => (
                  <a key={s.id} href={`#${s.id}`} className="block truncate rounded-md px-2 py-1 text-sm hover:bg-accent">
                    {s.title}
                  </a>
                ))}
              </div>
            ))}
            <div className="border-t border-border pt-2">
              <a href="#glossary" className="block rounded-md px-2 py-1 text-sm font-medium hover:bg-accent">
                Glossary A–Z
              </a>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div id="guide-content" className="min-w-0 space-y-6">
          {groups.map((g) => (
            <div key={g} className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{g}</h2>
              {SECTIONS.filter((s) => s.group === g).map((s) => (
                <SectionView key={s.id} s={s} />
              ))}
            </div>
          ))}

          {/* Glossary */}
          <section id="glossary" data-section data-title="glossary" className="scroll-mt-20 rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <BookA className="h-5 w-5" /> Glossary A–Z
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Every framework, method and term used in bishOS — {terms.length} in total.</p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {terms.map((t) => (
                <div key={t.term} data-text={`${t.term} ${t.definition} ${t.example ?? ""}`.toLowerCase()} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold">
                    {t.term}
                    {t.source && <span className="ml-2 rounded border border-border px-1.5 text-[10px] font-medium text-muted-foreground">{t.source}</span>}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.definition}</p>
                  {t.example && <p className="mt-1 text-xs text-muted-foreground"><i>Example:</i> {t.example}</p>}
                  <a href={`#${t.sectionId}`} className="mt-1 inline-block text-[11px] text-info hover:underline">
                    {t.module}
                  </a>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </GuideShell>
  );
}

/** Every real page without a dynamic segment (the "Open" link must never 404). */
const STATIC_ROUTES = new Set([
  "/", "/campaigns", "/challenges", "/chat", "/check-in", "/commitments", "/compass", "/content", "/customers",
  "/dashboard", "/decisions", "/delegation", "/finance", "/focus", "/founder", "/goals", "/guide", "/habits", "/inbox",
  "/insights", "/journal", "/learning", "/library", "/life-areas", "/momentum", "/notes", "/offers", "/people",
  "/pipeline", "/profile", "/projects", "/recall", "/review", "/reviews", "/reviews/weekly", "/reviews/monthly",
  "/reviews/quarterly", "/reviews/annual", "/routines", "/schedule", "/scorecard", "/settings", "/swipes", "/tasks",
  "/today", "/week",
]);

/**
 * Guide routes are often descriptive ("/today → click a task title", "/goals, /tasks",
 * "/offers/<id>"). Link only the leading real path (+ query/hash), and only when it exists.
 */
function openHref(route: string): string | null {
  const m = /^\/[^\s,·()]*/.exec(route.trim());
  if (!m || /[[<>]/.test(m[0])) return null;
  const path = m[0].split(/[?#]/)[0].replace(/(.)\/$/, "$1");
  return STATIC_ROUTES.has(path) ? m[0] : null;
}

function SectionView({ s }: { s: GuideSection }) {
  const when = [
    ["One-time", s.when.oneTime],
    ["Daily", s.when.daily],
    ["Weekly", s.when.weekly],
    ["Monthly", s.when.monthly],
    ["Every 12 weeks", s.when.quarterly],
  ].filter((r) => r[1]) as [string, string][];
  return (
    <section id={s.id} data-section data-title={s.title.toLowerCase()} className="scroll-mt-20 rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-sprint">{s.group}</span>
      <h3 className="mt-0.5 text-lg font-semibold">{s.title}</h3>
      <p className="mt-1 text-sm" data-text={`${s.title} ${s.summary}`.toLowerCase()}>
        {s.summary}
      </p>
      <p className="mt-2 text-sm text-muted-foreground" data-text={s.why.toLowerCase()}>
        <b className="text-foreground">Why it helps:</b> {s.why}
      </p>
      {when.length > 0 && (
        <dl className="mt-3 grid gap-x-4 gap-y-1 rounded-lg bg-muted/50 p-3 text-sm sm:grid-cols-[110px_1fr]">
          {when.map(([k, v]) => (
            <div key={k} className="contents" data-text={`${k} ${v}`.toLowerCase()}>
              <dt className="font-medium text-muted-foreground">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {s.pages.length > 0 && (
        <div className="mt-4 space-y-2">
          {s.pages.map((p) => (
            <details key={p.route + p.title} data-page data-title={`${p.title} ${p.route}`.toLowerCase()} className="group rounded-lg border border-border">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-2.5 text-sm">
                <span className="font-semibold">{p.title}</span>
                <code className="rounded bg-muted px-1.5 text-[11px] text-muted-foreground">{p.route}</code>
                <span className="ml-auto text-xs text-muted-foreground">{p.elements.length} elements</span>
              </summary>
              <div className="border-t border-border px-3 py-3">
                <p className="text-sm text-muted-foreground" data-text={p.purpose.toLowerCase()}>
                  {p.purpose}{" "}
                  {openHref(p.route) && (
                    <Link href={openHref(p.route)!} className="inline-flex items-center gap-0.5 text-info hover:underline">
                      Open <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                </p>
                {p.howTo && p.howTo.length > 0 && (
                  <>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">How to use it</p>
                    <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm">
                      {p.howTo.map((h, i) => (
                        <li key={i} data-text={h.toLowerCase()}>
                          {h}
                        </li>
                      ))}
                    </ol>
                  </>
                )}
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Every element</p>
                <div className="mt-1 divide-y divide-border rounded-md border border-border">
                  {p.elements.map((e, i) => (
                    <div key={i} data-text={`${e.name} ${e.what} ${e.how ?? ""}`.toLowerCase()} className="grid gap-1 px-3 py-2 text-sm md:grid-cols-[200px_1fr]">
                      <p className="font-medium">{e.name}</p>
                      <div>
                        <p className="text-muted-foreground">{e.what}</p>
                        {e.how && <p className="mt-0.5 text-xs"><b>How:</b> {e.how}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}

      {s.frameworks && s.frameworks.length > 0 && (
        <details className="mt-3 rounded-lg border border-border" data-page data-title={`${s.title} frameworks terms`.toLowerCase()}>
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-muted-foreground" /> Frameworks & terms <span className="ml-auto text-xs font-normal text-muted-foreground">{s.frameworks.length}</span>
          </summary>
          <div className="grid gap-2 border-t border-border p-3 md:grid-cols-2">
            {s.frameworks.map((t, i) => (
              <div key={i} data-text={`${t.term} ${t.definition} ${t.example ?? ""}`.toLowerCase()} className="rounded-md border-l-2 border-info bg-muted/30 px-3 py-2">
                <p className="text-sm font-semibold">
                  {t.term}
                  {t.source && <span className="ml-2 text-[10px] font-medium text-muted-foreground">{t.source}</span>}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{t.definition}</p>
                {t.example && <p className="mt-0.5 text-xs text-muted-foreground"><i>Example:</i> {t.example}</p>}
              </div>
            ))}
          </div>
        </details>
      )}

      <details className="mt-3 rounded-lg border border-dashed border-border" data-page data-title={`${s.title} testing test`.toLowerCase()}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-semibold">
          <FlaskConical className="h-4 w-4 text-muted-foreground" /> How to test it <span className="ml-auto text-xs font-normal text-muted-foreground">{s.testing.length} steps</span>
        </summary>
        <ol className={cn("list-decimal space-y-1 border-t border-border py-3 pl-8 pr-3 text-sm")}>
          {s.testing.map((t, i) => (
            <li key={i} data-text={t.toLowerCase()}>
              {t}
            </li>
          ))}
        </ol>
      </details>

      {s.tips && s.tips.length > 0 && (
        <ul className="mt-3 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
          {s.tips.map((t, i) => (
            <li key={i} data-text={t.toLowerCase()}>
              {t}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
