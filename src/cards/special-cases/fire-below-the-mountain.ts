import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction] — [Add] Rune. Use only to play gear or use gear abilities. (Abilities that
 * add resources can't be reacted to.)
 *
 * Moot — entirely gated behind [Add] (deferred, see ancient-henge.ts's identical note).
 */
export const fireBelowTheMountain: SpecialCaseHandler = {
  cardId: "fire-below-the-mountain",
};
