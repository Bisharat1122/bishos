import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import type { FullPiece } from "../model";
import type { KwStore } from "./useKw";

export type Strategy = FunctionReturnType<typeof api.contentSystem.strategy>;

export type StepProps = {
  store: KwStore;
  piece: FullPiece;
  /** The live script draft from the editor (unsaved keystrokes included). */
  script: string;
  /** Write through the editor's own script draft so its autosave keeps working. */
  setScript: (v: string) => void;
  strategy: Strategy | undefined;
};

/**
 * Extra checklists stored inside existing kw arrays (saveKw has no field for
 * them): dopamine-ladder levels live in `storylocks` as "dl:<key>", and the
 * minimum-viable-visual checks live in `hookAudit` as "mvv:<index>".
 */
export const DL = "dl:";
export const MVV = "mvv:";

/**
 * `kw.ytChecks` key space (long-form packaging step only): BIG_VIDEO_TESTS keys
 * (ccn, glance, universal, unpause) + INTRO_45 keys (promise10, intrigue, flow).
 * ELIMINATION_TESTS reuse "ccn"/"glance" but are reference-only in the Playbook
 * and never stored. If they ever become tickable per piece, store them as
 * `${YT_ELIM}<key>` so they can't tick (or count) the big-video tests too.
 */
export const YT_ELIM = "elim:";

export const isLongForm = (format: string) => format === "long_video";
