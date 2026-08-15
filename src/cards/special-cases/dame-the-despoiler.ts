import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseContext, SpecialCaseHandler } from "./types";

const BONUS_AFTER_MATCH = 1;

/**
 * [Empower] 5 Energy Body Rune
 * [Empowered][>] When I attack or defend, choose a unit here. Increase my Might to its Might
 * this turn, then give me +1 Might this turn.
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — picks the
 * strongest other unit at the same battlefield, for the biggest possible boost.
 */
function boostToStrongestHere(ctx: SpecialCaseContext): void {
  if (!ctx.instance.statuses.empowered) return;
  if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
  const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
  const allIds = [...slot.units["0"], ...slot.units["1"]].filter((id) => id !== ctx.instance.instanceId);
  let best: CardInstance | undefined;
  for (const id of allIds) {
    const instance = ctx.game.instances[id];
    if (!instance) continue;
    if (!best || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, best, "none")) {
      best = instance;
    }
  }
  if (!best) return;
  const myMight = computeMight(ctx.game, getCard, ctx.instance, "none");
  const targetMight = computeMight(ctx.game, getCard, best, "none");
  if (targetMight > myMight) ctx.instance.tempMightBonus += targetMight - myMight;
  ctx.instance.tempMightBonus += BONUS_AFTER_MATCH;
}

export const dameTheDespoiler: SpecialCaseHandler = {
  cardId: "dame-the-despoiler",
  empowerCost: { energy: 5, runeDomain: "Body" },
  onAttack: (ctx) => boostToStrongestHere(ctx),
  onDefend: (ctx) => boostToStrongestHere(ctx),
};
