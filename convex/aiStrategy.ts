/**
 * Strategy AI (actions). Never writes: returns suggestions the user reviews
 * and applies through normal mutations from the UI.
 *   improveOffer({ id })        → { text }  markdown suggestions for one offer
 *   campaignIdeas({ … })        → { ideas, text }  campaign concepts / plays
 */
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { requireUser } from "./helpers";
import { callOpenRouter } from "./openrouter";

/** Business background for prompts (profile + offers + campaigns + pillars). */
export const context = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [profile, offers, campaigns, pillars, settings] = await Promise.all([
      ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).first(),
      ctx.db.query("offers").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("campaigns").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("contentPillars").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("userSettings").withIndex("by_user", (q) => q.eq("userId", userId)).first(),
    ]);
    const lines: string[] = [];
    if (profile?.business) lines.push(`Business: ${profile.business}`);
    if (profile?.occupation) lines.push(`Role: ${profile.occupation}`);
    if (profile?.situation) lines.push(`Situation: ${profile.situation}`);
    lines.push(`Currency: ${settings?.currency ?? "USD"}`);
    const activeOffers = offers.filter((o) => o.status !== "retired").slice(0, 6);
    if (activeOffers.length)
      lines.push(
        "Offers:\n" +
          activeOffers
            .map((o) => `- ${o.name} [${o.status}]${o.icp ? ` · for ${o.icp}` : ""}${o.price != null ? ` · ${o.price}` : ""}`)
            .join("\n"),
      );
    const recent = campaigns.sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    if (recent.length)
      lines.push(
        "Recent campaigns:\n" +
          recent
            .map(
              (c) =>
                `- ${c.name} [${c.status}]${c.channels?.length ? ` · ${c.channels.join(", ")}` : ""}${
                  c.learnings ? ` · learned: ${c.learnings.slice(0, 160)}` : ""
                }`,
            )
            .join("\n"),
      );
    if (pillars.length) lines.push(`Content pillars: ${pillars.map((p) => `${p.name} (${p.brand})`).join(", ")}`);
    return lines.join("\n");
  },
});

const clean = (s: string) => s.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

export const improveOffer = action({
  args: { id: v.id("offers") },
  handler: async (ctx, { id }): Promise<{ text: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const data = await ctx.runQuery(api.offers.get, { id });
    if (!data) throw new ConvexError("Offer not found");
    const background: string = await ctx.runQuery(internal.aiStrategy.context, {});
    const o = data.offer;
    const s = o.scores ?? { dream: 5, likelihood: 5, time: 5, effort: 5 };
    const offerText = [
      `Name: ${o.name} (status: ${o.status})`,
      `Who it's for (ICP): ${o.icp || "(blank)"}`,
      `Problem: ${o.problem || "(blank)"}`,
      `Dream outcome: ${o.dreamOutcome || "(blank)"}`,
      `Proof / likelihood: ${o.proof || "(blank)"}`,
      `Time to result: ${o.timeToResult || "(blank)"}`,
      `Effort removed: ${o.effortRemoved || "(blank)"}`,
      `Self-rated value equation (1–10): dream ${s.dream}, likelihood ${s.likelihood}, time delay ${s.time} (higher = slower), effort ${s.effort} (higher = harder). Score ${data.score}/100.`,
      `Deliverables: ${(o.deliverables ?? []).join("; ") || "(none)"}`,
      `Bonuses: ${(o.bonuses ?? []).join("; ") || "(none)"}`,
      `Guarantee: ${o.guarantee || "(none)"}`,
      `Price: ${o.price != null ? `${o.price} ${data.currency}` : "(not set)"} ${o.pricingModel ? `(${o.pricingModel})` : ""}`,
      `Urgency / scarcity: ${o.urgency || "(none)"}`,
      `Results so far: ${data.stats.dealCount} deals, ${data.stats.wonCount} won, revenue ${data.stats.revenue}.`,
    ].join("\n");
    const text = await callOpenRouter([
      {
        role: "system",
        content:
          "You are a sharp offer strategist for a solo B2B founder, fluent in Alex Hormozi's value equation " +
          "(value = dream outcome × perceived likelihood ÷ (time delay × effort & sacrifice)) and MAGIC naming " +
          "(Magnet, Avatar, Goal, Interval, Container). Be concrete and specific to THIS offer; no generic advice. " +
          "Write in plain, short sentences. Use markdown with these sections, each 2–4 bullets:\n" +
          "## Biggest lever\n## Dream outcome\n## Likelihood & proof\n## Time to result\n## Effort removed\n" +
          "## Bonuses to add\n## Guarantee\n## Urgency & scarcity\n## Price & packaging\n## Name ideas (MAGIC)\n" +
          "End with one line: **Next test:** a single experiment to run this week.",
      },
      { role: "user", content: `Founder background:\n${background}\n\nThe offer:\n${offerText}\n\nHow do I make this offer more irresistible?` },
    ]);
    return { text: clean(text) };
  },
});

export type CampaignIdea = { name: string; objective: string; channels: string[]; angle: string; steps: string[] };

const KNOWN_CHANNELS = [
  "LinkedIn",
  "Instagram",
  "TikTok",
  "YouTube",
  "X",
  "Email",
  "Ads",
  "Events",
  "Partnerships",
  "Cold outreach",
];

function parseIdeas(raw: string): CampaignIdea[] {
  const txt = clean(raw).replace(/```(?:json)?/g, "");
  const start = txt.indexOf("[");
  const end = txt.lastIndexOf("]");
  if (start < 0 || end <= start) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(txt.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  const norm = (c: string) => KNOWN_CHANNELS.find((k) => k.toLowerCase() === c.trim().toLowerCase()) ?? c.trim();
  return arr
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({
      name: String(x.name ?? "").trim().slice(0, 120),
      objective: String(x.objective ?? "").trim().slice(0, 400),
      channels: Array.isArray(x.channels) ? (x.channels as unknown[]).map((c) => norm(String(c))).filter(Boolean).slice(0, 6) : [],
      angle: String(x.angle ?? x.hook ?? "").trim().slice(0, 500),
      steps: Array.isArray(x.steps) ? (x.steps as unknown[]).map((s) => String(s).trim()).filter(Boolean).slice(0, 6) : [],
    }))
    .filter((i) => i.name)
    .slice(0, 8);
}

export const campaignIdeas = action({
  args: {
    campaignId: v.optional(v.id("campaigns")),
    objective: v.optional(v.string()),
    brand: v.optional(v.string()),
    channels: v.optional(v.array(v.string())),
    offerId: v.optional(v.id("offers")),
  },
  handler: async (ctx, args): Promise<{ ideas: CampaignIdea[]; text: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const background: string = await ctx.runQuery(internal.aiStrategy.context, {});
    let focus = "";
    if (args.campaignId) {
      const c = await ctx.runQuery(api.campaigns.get, { id: args.campaignId });
      if (!c) throw new ConvexError("Campaign not found");
      const cp = c.campaign;
      focus =
        `Generate 5 concrete PLAYS to run inside this existing campaign (each idea = one play):\n` +
        `Campaign: ${cp.name} [${cp.status}]\nObjective: ${cp.objective || "(blank)"}\nBrand: ${cp.brand ?? "either"}\n` +
        `Channels: ${(cp.channels ?? []).join(", ") || "(none chosen)"}\nOffer: ${c.offer?.name ?? "(none)"}\n` +
        `Dates: ${cp.startDate ?? "?"} → ${cp.endDate ?? "?"}\nBudget: ${cp.budget ?? "(none)"} ${c.currency}\n` +
        `Results so far: ${c.rollup.results.leads} leads, ${c.rollup.results.conversations} conversations, ${c.rollup.results.deals} won.`;
    } else {
      let offerLine = "";
      if (args.offerId) {
        const o = await ctx.runQuery(api.offers.get, { id: args.offerId });
        if (o) offerLine = `Offer to promote: ${o.offer.name}${o.offer.icp ? ` for ${o.offer.icp}` : ""}${o.offer.dreamOutcome ? ` → ${o.offer.dreamOutcome}` : ""}`;
      }
      focus =
        `Generate 5 distinct NEW campaign concepts.\n` +
        `${args.objective ? `Objective: ${args.objective}\n` : ""}${args.brand ? `Brand: ${args.brand}\n` : ""}` +
        `${args.channels?.length ? `Preferred channels: ${args.channels.join(", ")}\n` : ""}${offerLine}`;
    }
    const raw = await callOpenRouter([
      {
        role: "system",
        content:
          "You are a pragmatic growth marketer for a solo founder with no team and little budget. Favour founder-led, " +
          "low-cost plays (content, cold outreach, partnerships, email) that produce sales conversations within 2–4 weeks. " +
          `Use only these channel names: ${KNOWN_CHANNELS.join(", ")}. ` +
          "Reply with ONLY a JSON array, no prose, like: " +
          '[{"name":"…","objective":"measurable goal","channels":["LinkedIn","Email"],"angle":"the hook / why people care","steps":["step 1","step 2","step 3"]}]',
      },
      { role: "user", content: `Founder background:\n${background}\n\n${focus}` },
    ]);
    const ideas = parseIdeas(raw);
    return { ideas, text: ideas.length ? "" : clean(raw) };
  },
});
