import type { SpecialCaseHandler } from "./types";

const MOVES_REQUIRED = 2;

/**
 * [Ganking] (I can move from battlefield to battlefield.)
 * If I have moved twice this turn, I don't take damage.
 *
 * [Ganking] is a printed keyword, already generic. "Moved twice this turn" uses
 * CardInstance.movesThisTurn (incremented in game/moves.ts attackBattlefield, the sole chokepoint
 * for both the initial attack and any subsequent Ganking move — reset at Awaken), checked via the
 * generic preventsAllDamage hook consulted in both spellDamage.ts and combat.ts.
 */
export const kaynUnleashed: SpecialCaseHandler = {
  cardId: "kayn-unleashed",
  preventsAllDamage: (ctx) => ctx.instance.movesThisTurn >= MOVES_REQUIRED,
};
