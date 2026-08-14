import type { SpecialCaseHandler } from "./types";

/** [Assault] If a unit died this turn, I enter ready. */
export const toweringPairofant: SpecialCaseHandler = {
  cardId: "towering-pairofant",
  selfEntersReady: (ctx) => ctx.game.anyUnitDiedThisTurn,
};
