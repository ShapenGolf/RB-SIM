import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";

/** When you play your second card in a turn, give me +2 Might this turn and ready me. */
export const dariusTrifarian: SpecialCaseHandler = {
  cardId: "darius-trifarian",
  onAllyCardPlayed: (ctx, _playedCard, playCountThisTurn) => {
    if (playCountThisTurn !== 2) return;
    ctx.instance.tempMightBonus += 2;
    readyInstance(ctx.game, getCard, ctx.instance.instanceId);
  },
};
