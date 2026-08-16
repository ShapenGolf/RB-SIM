import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction] — [Add] 1 Energy. (Abilities that add resources can't be reacted to.)
 *
 * Moot — entirely gated behind [Add] (deferred, see ancient-henge.ts's identical note).
 */
export const energyConduit: SpecialCaseHandler = {
  cardId: "energy-conduit",
};
