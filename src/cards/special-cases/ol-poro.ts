import type { SpecialCaseHandler } from "./types";

const LAST_BLOCKED_TURN = 3;

/** I can't be played on your first, second, or third turns. */
export const olPoro: SpecialCaseHandler = {
  cardId: "ol-poro",
  blocksSelfPlay: (ctx) => ctx.game.players[ctx.instance.controller].turnsTaken <= LAST_BLOCKED_TURN,
};
