import type { SpecialCaseContext, SpecialCaseHandler } from "./types";

function opponentControlsStunnedUnit(ctx: SpecialCaseContext): boolean {
  const opponent = ctx.instance.controller === "0" ? "1" : "0";
  return Object.values(ctx.game.instances).some((i) => i.controller === opponent && i.statuses.stunned);
}

/** If an opponent controls a stunned unit, I cost 2 Energy less and enter ready. */
export const monch: SpecialCaseHandler = {
  cardId: "monch",
  costReduction: (ctx) => (opponentControlsStunnedUnit(ctx) ? 2 : 0),
  selfEntersReady: (ctx) => opponentControlsStunnedUnit(ctx),
};
