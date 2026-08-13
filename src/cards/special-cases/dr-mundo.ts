import type { SpecialCaseHandler } from "./types";

/**
 * My Might is increased by the number of cards in your trash.
 * At the start of your Beginning Phase, recycle 3 from your trash.
 */
export const drMundo: SpecialCaseHandler = {
  cardId: "dr-mundo",
  staticMightModifier: (ctx) => ctx.game.players[ctx.instance.controller].trash.length,
  onBeginning: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < 3; i += 1) {
      const recycled = controller.trash.shift();
      if (recycled) controller.mainDeck.push(recycled);
    }
  },
};
