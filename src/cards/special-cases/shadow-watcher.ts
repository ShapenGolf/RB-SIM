import type { SpecialCaseHandler } from "./types";

/** If a friendly unit died during your Beginning Phase this turn, I enter ready. */
export const shadowWatcher: SpecialCaseHandler = {
  cardId: "shadow-watcher",
  selfEntersReady: (ctx) => Boolean(ctx.game.players[ctx.instance.controller].friendlyUnitDiedDuringBeginningThisTurn),
};
