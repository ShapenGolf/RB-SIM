import type { KeywordHandler } from "../types";

/**
 * Legion: triggers if the controller has already played another Main Deck
 * card this turn. Callers MUST evaluate this before marking the current
 * play's own `playedMainDeckCardThisTurn` flag, otherwise every card would
 * see its own play and always trigger.
 */
export const legionHandler: KeywordHandler = {
  name: "legion",
  conditionalTriggerActive: (ctx) =>
    Boolean(ctx.game.players[ctx.instance.controller]?.playedMainDeckCardThisTurn),
};
