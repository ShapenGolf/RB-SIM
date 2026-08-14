import type { SpecialCaseContext, SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 2;
const XP_GAIN = 2;

/** [Ambush] When I attack or defend, if an enemy unit is alone here, give me +2 Might this turn and gain 2 XP. */
function checkAloneEnemy(ctx: SpecialCaseContext): void {
  if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
  const opponentId = ctx.instance.controller === "0" ? "1" : "0";
  const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
  if (slot.units[opponentId].length !== 1) return;
  ctx.instance.tempMightBonus += MIGHT_BONUS;
  ctx.game.players[ctx.instance.controller].xp += XP_GAIN;
}

export const khazixMutatingHorror: SpecialCaseHandler = {
  cardId: "khazix-mutating-horror",
  onAttack: (ctx) => checkAloneEnemy(ctx),
  onDefend: (ctx) => checkAloneEnemy(ctx),
};
