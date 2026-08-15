import type { SpecialCaseHandler } from "./types";

const HAND_THRESHOLD = 1;

/** At start of your Beginning Phase, draw 1 if you have one or fewer cards in your hand. */
export const looseCannon: SpecialCaseHandler = {
  cardId: "loose-cannon",
  onBeginning: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    if (player.hand.length > HAND_THRESHOLD) return;
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
