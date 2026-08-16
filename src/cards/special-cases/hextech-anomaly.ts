import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction] — Pay any amount of Rune to [Add] that much Energy. (Abilities that add
 * resources can't be reacted to.)
 *
 * Moot — entirely gated behind [Add] (deferred, see ancient-henge.ts's identical note).
 */
export const hextechAnomaly: SpecialCaseHandler = {
  cardId: "hextech-anomaly",
};
