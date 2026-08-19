import type { SpecialCaseHandler } from "./types";

/**
 * [Shield 3] (+3 Might while I'm a defender.)
 * [Tank] (I must be assigned combat damage first.)
 * When an opponent moves to a battlefield other than mine, draw 1. (Bases are not a battlefield.)
 *
 * [Shield]/[Tank] are printed keywords, already generic. The move-triggered draw uses
 * onAnyoneArrivedAtBattlefield (see cards/special-cases/types.ts), a broadcast fired from both
 * the attack/Ganking move path (game/moves.ts attackBattlefield) and forced relocations
 * (move-helpers.ts moveInstanceToBattlefield). Simplification: only fires while I'm myself at a
 * battlefield (if I'm at base, there's no "mine" to compare the mover's destination against).
 */
export const volibearImposing: SpecialCaseHandler = {
  cardId: "volibear-imposing",
  onAnyoneArrivedAtBattlefield: (ctx, moverController, battlefieldIndex) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    if (moverController === ctx.instance.controller) return;
    if (battlefieldIndex === ctx.instance.battlefieldIndex) return;
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
