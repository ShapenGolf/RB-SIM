import type { SpecialCaseHandler } from "./types";

/** If you control fewer runes than an opponent at the start of your Beginning Phase, give me +1 Might this turn. */
export const forsakenBaccai: SpecialCaseHandler = {
  cardId: "forsaken-baccai",
  onBeginning: (ctx) => {
    const controller = ctx.instance.controller;
    const opponentId = controller === "0" ? "1" : "0";
    const myRunes = ctx.game.players[controller].runePool.length;
    const opponentRunes = ctx.game.players[opponentId].runePool.length;
    if (myRunes < opponentRunes) ctx.instance.tempMightBonus += 1;
  },
};
