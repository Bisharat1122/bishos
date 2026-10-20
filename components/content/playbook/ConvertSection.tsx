"use client";

import { Fragment } from "react";
import { ArrowDown, ArrowRight, Mail, X } from "lucide-react";
import { Chip, cn } from "@/components/os/kit";
import { CTA_RAMPS, FUNNEL_SWITCHES, LEAD_MAGNET_TYPES, OWNED_STACK, TRUST_LADDER } from "@/lib/kallaway";
import type { IterRow, SectionState, Strategy } from "./model";
import { Block, Rules, StepCard } from "./ui";

export function ConvertSection({ s, st, rows }: { s: SectionState; st: Strategy | null; rows: IterRow[] }) {
  const magnet = st?.leadMagnet?.trim();
  const magnetType = LEAD_MAGNET_TYPES.find((t) => t.key === st?.leadMagnetType)?.label;
  const leads = rows.reduce((a, r) => a + (r.leads ?? 0), 0);
  const funnel = [
    { t: "Content", d: "Aggravate one pain in the video" },
    { t: "Lead magnet", d: magnet ? `${magnet}${magnetType ? ` (${magnetType})` : ""}` : "The band-aid for that exact pain" },
    { t: "Keyword DM / page", d: "'Comment STORY' → collect the email" },
    { t: "Email + nurture", d: "Keep sending value. An email isn't ownership yet" },
    { t: "Low-ticket", d: "Same problem, deeper solve" },
    { t: "High-ticket", d: "Same problem, done-with-you" },
  ];

  return (
    <StepCard
      id="pb-convert"
      n={s.n}
      title={s.title}
      phase={s.phase}
      pct={s.pct}
      done={s.done}
      summary={s.summary}
      why={[
        "Views aren't money. Value is captured at the offer, so every video needs a ramp from rented attention to an owned email list.",
        "Followers are rented; emails are owned. Ramp people from rented to owned as fast as you can.",
      ]}
    >
      {/* Four switches */}
      <Block title="The attention conversion funnel" hint="Four switches, multiplied. Any one at zero makes the whole thing zero.">
        <div className="flex flex-col items-stretch gap-1.5 lg:flex-row lg:items-center">
          {FUNNEL_SWITCHES.map((f, i) => (
            <Fragment key={f.key}>
              <div className="flex-1 rounded-lg border border-border p-3">
                <p className="text-sm font-semibold">{f.label}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{f.hint}</p>
              </div>
              {i < FUNNEL_SWITCHES.length - 1 && (
                <span className="flex items-center justify-center text-muted-foreground" aria-hidden>
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
            </Fragment>
          ))}
        </div>
      </Block>

      {/* Owned stack */}
      <Block title="Your owned stack" hint={OWNED_STACK}>
        <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
          <div className="grid gap-2">
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-semibold">Short form</p>
              <p className="text-xs text-muted-foreground">The cash cow: broad, eager viewers, the most sign-ups</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-semibold">Long form</p>
              <p className="text-xs text-muted-foreground">The GOAT: ~10 ideas and ~10 minutes of trust per video</p>
            </div>
          </div>
          <span className="flex items-center justify-center text-muted-foreground" aria-hidden>
            <ArrowRight className="hidden h-4 w-4 sm:block" />
            <ArrowDown className="h-4 w-4 sm:hidden" />
          </span>
          <div className="flex h-full flex-col justify-center rounded-lg border border-foreground p-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Mail className="h-4 w-4" /> Email (owned)
            </p>
            <p className="text-xs text-muted-foreground">Each feeds email on its own. Don&apos;t cross-promote short ↔ long.</p>
            <p className="mt-2 text-xs">
              <span className="font-semibold tabular-nums">{leads}</span> <span className="text-muted-foreground">emails logged from your last {rows.length || 0} reps</span>
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Solo? Start with short form. With a team? Long form.</p>
      </Block>

      {/* Same-problem funnel */}
      <Block title="The aligned funnel" hint="The problem never changes from the first video to the high-ticket offer. That's what the pros do.">
        <ol className="grid gap-1.5 sm:grid-cols-3 xl:grid-cols-6">
          {funnel.map((f, i) => (
            <li key={f.t} className={cn("relative rounded-lg border p-2.5", i === 1 && magnet ? "border-success/40 bg-success-soft/40" : "border-border")}>
              <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
              <p className="text-sm font-semibold leading-tight">{f.t}</p>
              <p className="mt-0.5 line-clamp-3 text-[11px] leading-snug text-muted-foreground">{f.d}</p>
            </li>
          ))}
        </ol>
        <Rules
          items={[
            "One lead magnet per video, tightly aligned to that video's pain. 'Give me your email' gets nothing.",
            "Less is more: promise one click to the answer, not a 10-page PDF. Name it like copy.",
            "Native embeds, not ad breaks: weave the magnet in as the answer to the topic, early and often. Ad breaks break the spell and viewers leave.",
          ]}
        />
        <div className="flex flex-wrap gap-1.5">
          {CTA_RAMPS.map((r) => (
            <Chip key={r.key} tone="outline" title={r.hint}>
              {r.label}
            </Chip>
          ))}
          <span className="text-[11px] text-muted-foreground">· one ramp per video</span>
        </div>
      </Block>

      <div className="grid gap-5 lg:grid-cols-2">
        <Block title="The trust ladder" hint="Rung 1 is the strongest. Stack 2+ rungs in every video; higher pain needs less trust.">
          <ol className="space-y-1">
            {TRUST_LADDER.map((t) => (
              <li key={t.n} className="flex items-center gap-2.5 rounded-md px-2 py-1 odd:bg-muted/40">
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background tabular-nums"
                  style={{ opacity: 1 - (t.n - 1) * 0.09 }}
                >
                  {t.n}
                </span>
                <span className="min-w-0 text-sm">
                  <span className="font-medium">{t.label}</span> <span className="text-xs text-muted-foreground">· {t.hint}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="text-[11px] text-muted-foreground">No proof yet? Demonstrate ability: ~2 non-obvious light-bulb moments per video, video after video.</p>
        </Block>

        <Block title="Content minutes" hint="People have to watch a certain number of minutes before they act. Only minutes watched by people who trust you and have the problem count.">
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: "4–5", u: "min", d: "earns a follow" },
              { v: "~90", u: "min", d: "makes a superfan" },
              { v: "1 = 20", u: "", d: "one long-form ≈ 20 shorts in trust" },
            ].map((x) => (
              <div key={x.d} className="rounded-lg border border-border p-3">
                <p className="text-lg font-semibold tabular-nums leading-none">
                  {x.v}
                  {x.u && <span className="ml-0.5 text-xs font-normal text-muted-foreground">{x.u}</span>}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
          <Rules
            items={[
              "Bingeability stacks minutes in one session: numbered series ('Day 4 of 30') make people go back for 1–3.",
              "Profile-grid covers tell a visitor what each video is and what to click next. Most shares happen in DMs, where only the cover shows.",
              "Promising a daily series? Stack a buffer first, so you never break the promise.",
            ]}
          />
        </Block>
      </div>
    </StepCard>
  );
}
