import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction][>] Rune Rune, Exhaust: [Add] 2 Energy. Spend this Energy only to play units or
 * activated abilities of units.
 *
 * Moot — entirely gated behind [Add] (deferred, see ancient-henge.ts's identical note).
 */
export const butcherOfTheSands: SpecialCaseHandler = {
  cardId: "butcher-of-the-sands",
};
