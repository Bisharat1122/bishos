"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Check, Plus, Sparkles } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Chip, Dialog, Field, Segmented, Select, TextInput, buttonVariants, cn } from "@/components/os/kit";
import { errorMessage, toast } from "@/components/os/celebrate";
import { MarkdownLite } from "@/components/tasks/MarkdownLite";
import { CHANNELS } from "./lib";
import { ChipPicker, FieldGroup } from "./viz";

type Idea = { name: string; objective: string; channels: string[]; angle: string; steps: string[] };

/** AI "campaign ideas": brief → 5 concepts → add any to the board as an Idea. */
export function CampaignIdeasDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const offers = useQuery(api.offers.options);
  const run = useAction(api.aiStrategy.campaignIdeas);
  const create = useMutation(api.campaigns.create);
  const [objective, setObjective] = useState("");
  const [brand, setBrand] = useState<"any" | "personal" | "company">("company");
  const [channels, setChannels] = useState<string[]>([]);
  const [offerId, setOfferId] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [text, setText] = useState("");
  const [added, setAdded] = useState<Set<string>>(new Set());

  async function generate() {
    setLoading(true);
    setIdeas([]);
    setText("");
    try {
      const res = await run({
        objective: objective.trim() || undefined,
        brand: brand === "any" ? undefined : brand,
        channels: channels.length ? channels : undefined,
        offerId: offerId ? (offerId as Id<"offers">) : undefined,
      });
      setIdeas(res.ideas);
      setText(res.text);
      setAdded(new Set());
    } catch (err) {
      toast(errorMessage(err, "AI request failed"), { tone: "warning" });
    } finally {
      setLoading(false);
    }
  }

  async function add(i: Idea) {
    try {
      await create({
        name: i.name,
        objective: i.objective || undefined,
        channels: i.channels.filter((c) => CHANNELS.includes(c)),
        brand: brand === "any" ? undefined : brand,
        offerId: offerId ? (offerId as Id<"offers">) : undefined,
        status: "idea",
        notes: [i.angle && `Angle: ${i.angle}`, i.steps.length ? `First steps:\n${i.steps.map((s) => `- ${s}`).join("\n")}` : ""]
          .filter(Boolean)
          .join("\n\n"),
      });
      setAdded((s) => new Set(s).add(i.name));
      toast("Added to the board as an idea", { tone: "success" });
    } catch (err) {
      toast(errorMessage(err, "Could not add the idea"), { tone: "warning" });
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Campaign ideas" size="lg">
      <div className="space-y-4">
        <Field label="What should this campaign achieve?">
          <TextInput value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="e.g. 10 sales calls with agency owners this month" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Brand">
            <Segmented
              size="sm"
              value={brand}
              onChange={setBrand}
              options={[
                { value: "company", label: "Company" },
                { value: "personal", label: "Personal" },
                { value: "any", label: "Either" },
              ]}
            />
          </FieldGroup>
          <Field label="Offer to promote">
            <Select value={offerId} onChange={(e) => setOfferId(e.target.value)}>
              <option value="">Any / none</option>
              {(offers ?? []).map((o) => (
                <option key={o._id} value={o._id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <FieldGroup label="Preferred channels (optional)">
          <ChipPicker options={CHANNELS} value={channels} onChange={setChannels} />
        </FieldGroup>
        <button type="button" onClick={generate} disabled={loading} className={cn(buttonVariants(), "w-full sm:w-auto")}>
          <Sparkles className="h-4 w-4" />
          {loading ? "Thinking…" : ideas.length ? "Generate again" : "Generate ideas"}
        </button>

        {loading && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32" />
            ))}
          </div>
        )}
        {!loading && ideas.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {ideas.map((i, idx) => {
              const done = added.has(i.name);
              return (
                <div key={`${idx}-${i.name}`} className="os-rise flex flex-col rounded-lg border border-border bg-card p-3">
                  <p className="font-semibold leading-snug">{i.name}</p>
                  {i.objective && <p className="mt-1 text-xs text-muted-foreground">{i.objective}</p>}
                  {i.channels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {i.channels.map((c) => (
                        <Chip key={c}>{c}</Chip>
                      ))}
                    </div>
                  )}
                  {i.angle && <p className="mt-2 text-sm">{i.angle}</p>}
                  {i.steps.length > 0 && (
                    <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-xs text-muted-foreground">
                      {i.steps.map((s, k) => (
                        <li key={k}>{s}</li>
                      ))}
                    </ol>
                  )}
                  <button
                    type="button"
                    disabled={done}
                    onClick={() => void add(i)}
                    className={cn(buttonVariants({ variant: done ? "ghost" : "outline", size: "sm" }), "mt-3 self-start")}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {done ? "Added" : "Add to board"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {!loading && !ideas.length && text && (
          <div className="max-h-80 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
            <MarkdownLite text={text} />
          </div>
        )}
      </div>
    </Dialog>
  );
}
