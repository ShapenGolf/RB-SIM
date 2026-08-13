import type { SpecialCaseHandler } from "./types";
import { returnUnitFromTrashToHand } from "./trash-recursion";

/** Return a unit from your trash to your hand. */
export const morbidReturn: SpecialCaseHandler = {
  cardId: "morbid-return",
  onPlay: (ctx) => {
    returnUnitFromTrashToHand(ctx.game, ctx.instance.controller);
  },
};
