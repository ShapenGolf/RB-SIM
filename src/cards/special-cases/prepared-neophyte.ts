import type { SpecialCaseHandler } from "./types";

const THRESHOLD = 4;
const MIGHT_BONUS = 4;

/** If you've spent 4 Energy or more to play a spell this turn, I have +4 Might. */
export const preparedNeophyte: SpecialCaseHandler = {
  cardId: "prepared-neophyte",
  staticMightModifier: (ctx) =>
    ctx.game.players[ctx.instance.controller].maxEnergySpentOnSpellThisTurn >= THRESHOLD ? MIGHT_BONUS : 0,
};
