import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction], [Legion] — [Add] 1 Energy. (Abilities that add resources can't be reacted
 * to. Get the effect if you've played a card this turn.)
 *
 * Moot — entirely gated behind [Add] (deferred, see ancient-henge.ts's identical note).
 */
export const handOfNoxus: SpecialCaseHandler = {
  cardId: "hand-of-noxus",
};
