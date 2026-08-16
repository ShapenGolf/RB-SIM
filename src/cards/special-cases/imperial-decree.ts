import type { SpecialCaseHandler } from "./types";

/**
 * [Action] (Play on your turn or in showdowns.)
 * When any unit takes damage this turn, kill it.
 *
 * [Action] timing isn't modeled — resolves instantly like every other spell. Uses the new
 * anyDamageKillsThisTurn global flag, checked at the two damage chokepoints (game/spellDamage.ts
 * dealSpellDamage, game/combat.ts assignDamage) right after damage is applied.
 */
export const imperialDecree: SpecialCaseHandler = {
  cardId: "imperial-decree",
  onPlay: (ctx) => {
    ctx.game.anyDamageKillsThisTurn = true;
  },
};
