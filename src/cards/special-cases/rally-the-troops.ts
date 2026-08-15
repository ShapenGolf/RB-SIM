import type { SpecialCaseHandler } from "./types";

/**
 * [Action] When a friendly unit is played this turn, buff it. Draw 1.
 */
export const rallyTheTroops: SpecialCaseHandler = {
  cardId: "rally-the-troops",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    player.buffUnitsPlayedThisTurn = true;
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
