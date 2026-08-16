import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction] — [Add] Rune. Use only to play spells. (Abilities that add resources can't
 * be reacted to.)
 *
 * Moot — entirely gated behind [Add] (deferred, see ancient-henge.ts's identical note).
 */
export const daughterOfTheVoid: SpecialCaseHandler = {
  cardId: "daughter-of-the-void",
};
