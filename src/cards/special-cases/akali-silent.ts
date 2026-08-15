import type { SpecialCaseHandler } from "./types";

/**
 * I can't be chosen by enemy spells and abilities unless I'm in combat.
 * When I move to a battlefield, give me +2 Might this turn.
 *
 * Known gap: the target-immunity clause isn't modeled (no hook for "can't be chosen" outside
 * combat — see docs/data-sourcing.md). Only the onMove Might bonus is implemented.
 */
export const akaliSilent: SpecialCaseHandler = {
  cardId: "akali-silent",
  onMove: (ctx) => {
    ctx.instance.tempMightBonus += 2;
  },
};
