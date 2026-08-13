import type { SpecialCaseHandler } from "./types";

/**
 * The first time a friendly unit dies each turn, draw 1.
 *
 * Edge case: if Wraith of Echoes itself is the unit that dies, it does not trigger its own
 * draw — onAllyUnitDied only broadcasts to instances still on the board, and this one is
 * already removed by the time the broadcast fires (see registry.ts onAllyUnitDied).
 */
export const wraithOfEchoes: SpecialCaseHandler = {
  cardId: "wraith-of-echoes",
  onAllyUnitDied: (ctx) => {
    if (ctx.instance.statuses.wraithDrewThisTurn) return;
    ctx.instance.statuses.wraithDrewThisTurn = true;
    const controller = ctx.game.players[ctx.instance.controller];
    const drawn = controller.mainDeck.shift();
    if (drawn) controller.hand.push(drawn);
  },
};
