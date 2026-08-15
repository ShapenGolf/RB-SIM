import type { SpecialCaseHandler } from "./types";

const ENERGY_THRESHOLD = 5;

/** When you play a spell that costs 5 Energy or more, draw 1. */
export const ladyOfLuminosityStarter: SpecialCaseHandler = {
  cardId: "lady-of-luminosity-starter",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type !== "spell") return;
    if ((playedCard.energyCost ?? 0) < ENERGY_THRESHOLD) return;
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
