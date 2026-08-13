import type { SpecialCaseHandler } from "./types";

const THRESHOLD = 8;
const BONUS = 4;

/** While you have 8+ runes, I have +4 Might. */
export const yiMeditative: SpecialCaseHandler = {
  cardId: "yi-meditative",
  staticMightModifier: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const totalRunes = player.runeDeck.length + player.runePool.length;
    return totalRunes >= THRESHOLD ? BONUS : 0;
  },
};
