import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction] — Draw 1. Use only if you've chosen enemy units and/or gear twice this
 * turn with spells or unit abilities.
 *
 * Moot — no generic "chosen as a target" broadcast exists to build the "twice this turn" counter
 * from (deferred, see jae-medarda.ts's identical note). No fallback mode.
 */
export const prodigalExplorer: SpecialCaseHandler = {
  cardId: "prodigal-explorer",
};
