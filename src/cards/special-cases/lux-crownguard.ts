import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction] — [Add] 2 Energy. Use only to play spells. (Abilities that add resources
 * can't be reacted to.)
 *
 * Moot — entirely gated behind [Add] (deferred, see ancient-henge.ts's identical note).
 */
export const luxCrownguard: SpecialCaseHandler = {
  cardId: "lux-crownguard",
};
