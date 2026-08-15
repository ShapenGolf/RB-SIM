import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] Prevent all spell and ability damage this turn.
 *
 * Reaction timing isn't modeled — resolves immediately.
 */
export const unyieldingSpirit: SpecialCaseHandler = {
  cardId: "unyielding-spirit",
  onPlay: (ctx) => {
    ctx.game.preventAllSpellDamageThisTurn = true;
  },
};
