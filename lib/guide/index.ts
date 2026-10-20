import type { GuideGroup, GuideSection, GuideTerm } from "./types";
import { sections as core } from "./sections/core";
import { sections as direction } from "./sections/direction";
import { sections as founder } from "./sections/founder";
import { sections as content } from "./sections/content";
import { sections as mind } from "./sections/mind";
import { sections as work } from "./sections/work";
import { sections as finance } from "./sections/finance";

export * from "./types";
export * from "./routine";

export const GROUP_ORDER: GuideGroup[] = ["Start here", "Today", "Direction", "Founder", "Content", "Mind", "Work", "System"];

export const SECTIONS: GuideSection[] = [...core, ...direction, ...founder, ...finance, ...content, ...mind, ...work].sort(
  (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group),
);

export type GlossaryEntry = GuideTerm & { module: string; sectionId: string };

export function glossary(): GlossaryEntry[] {
  const map = new Map<string, GlossaryEntry>();
  for (const s of SECTIONS)
    for (const t of s.frameworks ?? []) {
      const k = t.term.trim().toLowerCase();
      if (!map.has(k)) map.set(k, { ...t, module: s.title, sectionId: s.id });
    }
  return [...map.values()].sort((a, b) => a.term.localeCompare(b.term));
}

export function guideStats() {
  const pages = SECTIONS.reduce((n, s) => n + s.pages.length, 0);
  const elements = SECTIONS.reduce((n, s) => n + s.pages.reduce((m, p) => m + p.elements.length, 0), 0);
  return { sections: SECTIONS.length, pages, elements, terms: glossary().length };
}
