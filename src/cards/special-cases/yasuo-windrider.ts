import type { SpecialCaseHandler } from "./types";

const MOVE_COUNT_TO_SCORE = 3;

/**
 * [Ganking] (I can move from battlefield to battlefield.)
 * The third time I move in a turn, you score 1 point.
 *
 * [Ganking] is a printed keyword, already generic. Uses CardInstance.movesThisTurn (see
 * kayn-unleashed.ts's identical note on how it's tracked) — onMove fires after the counter is
 * incremented (game/moves.ts attackBattlefield), so checking for exactly 3 fires once, on the
 * move that crosses the threshold, not on every move after it.
 */
export const yasuoWindrider: SpecialCaseHandler = {
  cardId: "yasuo-windrider",
  onMove: (ctx) => {
    if (ctx.instance.movesThisTurn === MOVE_COUNT_TO_SCORE) {
      ctx.game.players[ctx.instance.controller].points += 1;
    }
  },
};
