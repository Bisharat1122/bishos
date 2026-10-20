/**
 * bishOS Guide content model — ONE source for the in-app Guide page (/guide)
 * and the PDF manual (scripts/build-guide.mjs). Content files in
 * lib/guide/sections/*.ts must be pure data (only `import type` imports) so
 * Node can load them with --experimental-strip-types.
 */

/** Any UI element on a page: card, button, field, tab, chart, badge… */
export type GuideElement = {
  name: string; // exactly as it appears in the UI
  what: string; // what it is / shows, in plain words
  how?: string; // how to use it (click, type, drag…)
};

/** A framework, method, step or term that needs a definition. */
export type GuideTerm = {
  term: string;
  definition: string; // simple explanation a beginner understands
  example?: string; // a concrete example (ideally for a founder like Bish)
  source?: string; // who it comes from (e.g. "Kallaway", "GTD", "12 Week Year")
};

export type GuidePage = {
  route: string; // e.g. "/today"
  title: string;
  purpose: string; // why this page exists
  elements: GuideElement[]; // EVERY element on the page, in visual order
  howTo?: string[]; // step-by-step use
};

export type GuideGroup = "Start here" | "Today" | "Direction" | "Founder" | "Content" | "Mind" | "Work" | "System";

export type GuideSection = {
  id: string; // kebab-case, unique
  group: GuideGroup;
  title: string;
  summary: string; // 1–2 sentences
  why: string; // the benefit for the user
  when: { daily?: string; weekly?: string; monthly?: string; quarterly?: string; oneTime?: string };
  pages: GuidePage[];
  frameworks?: GuideTerm[]; // every framework / step / term used in this module
  testing: string[]; // how to test that it works, step by step
  tips?: string[];
};
