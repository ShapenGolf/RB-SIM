import type { SpecialCaseHandler } from "./types";
import { applyStun } from "./stun";
import { getCard } from "../db";

/** [Deflect] When an opponent plays a unit while I'm at a battlefield, [Stun] it. They can't move it this turn. */
export const vexApathetic: SpecialCaseHandler = {
  cardId: "vex-apathetic",
  onEnemyCardPlayed: (ctx, playedCard, playedInstance) => {
    if (playedCard.type !== "unit" && playedCard.type !== "champion") return;
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    applyStun(ctx.game, getCard, playedInstance, ctx.instance.controller);
    playedInstance.statuses.cantMoveThisTurn = true;
  },
};
