import type { SpecialCaseHandler } from "./types";

/** If you have two or fewer cards in your hand, I enter ready. / When I hold, draw 2. */
export const dunebreaker: SpecialCaseHandler = {
  cardId: "dunebreaker",
  selfEntersReady: (ctx) => ctx.game.players[ctx.instance.controller].hand.length <= 2,
  onHold: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < 2; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
