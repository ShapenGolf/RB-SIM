import type { SpecialCaseHandler } from "./types";

/** At the start of each player's first Beginning Phase, that player gains 1 point. */
export const theArenasGreatest: SpecialCaseHandler = {
  cardId: "the-arenas-greatest",
  onFirstBeginningPhase: (ctx) => {
    ctx.game.players[ctx.instance.controller].points += 1;
  },
};
