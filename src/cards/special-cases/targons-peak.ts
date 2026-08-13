import type { SpecialCaseHandler } from "./types";

/** When you conquer here, ready 2 runes at the end of this turn. */
export const targonsPeak: SpecialCaseHandler = {
  cardId: "targons-peak",
  onConquerHere: (ctx) => {
    ctx.game.players[ctx.instance.controller].readyRunesAtEndOfTurn += 2;
  },
};
