import type { SpecialCaseHandler } from "./types";

/** [Reaction] If an enemy unit has died this turn, this costs 2 Energy less. Draw 2. */
export const spoilsOfWar: SpecialCaseHandler = {
  cardId: "spoils-of-war",
  costReduction: (ctx) => (ctx.game.players[ctx.instance.controller].enemyUnitDiedThisTurn ? 2 : 0),
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < 2; i += 1) {
      const drawn = controller.mainDeck.shift();
      if (drawn) controller.hand.push(drawn);
    }
  },
};
