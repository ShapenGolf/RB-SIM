import type { SpecialCaseHandler } from "./types";

/** Your opponents' [Hidden] cards can't be revealed here. */
export const noxusSaboteur: SpecialCaseHandler = {
  cardId: "noxus-saboteur",
  blocksHiddenRevealHere: (ctx, revealingPlayer) => revealingPlayer !== ctx.instance.controller,
};
