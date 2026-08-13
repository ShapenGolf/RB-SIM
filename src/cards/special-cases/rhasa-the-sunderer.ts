import type { SpecialCaseHandler } from "./types";

/** I cost 1 Energy less for each card in your trash. */
export const rhasaTheSunderer: SpecialCaseHandler = {
  cardId: "rhasa-the-sunderer",
  costReduction: (ctx) => ctx.game.players[ctx.instance.controller].trash.length,
};
