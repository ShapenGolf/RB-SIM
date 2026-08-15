import type { SpecialCaseHandler } from "./types";

const UNIT_THRESHOLD = 4;
const DRAW_AMOUNT = 2;

/** When you conquer, if you have 4+ units at that battlefield, draw 2. */
export const mightOfDemaciaStarter: SpecialCaseHandler = {
  cardId: "might-of-demacia-starter",
  onConquer: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    if (slot.units[ctx.instance.controller].length < UNIT_THRESHOLD) return;
    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < DRAW_AMOUNT; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
