import type { SpecialCaseHandler } from "./types";

/** When you play your second card in a turn, give me +2 Might this turn and ready me. */
export const dariusTrifarian: SpecialCaseHandler = {
  cardId: "darius-trifarian",
  onAllyCardPlayed: (ctx, _playedCard, playCountThisTurn) => {
    if (playCountThisTurn !== 2) return;
    ctx.instance.tempMightBonus += 2;
    ctx.instance.exhausted = false;
  },
};
