import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";
import { dealMutualMightDamage } from "./mutual-damage-helpers";

/**
 * Move an enemy unit. Then choose another enemy unit at its destination. They deal damage
 * equal to their Mights to each other.
 *
 * Assumption (see charm.ts): "Move" with no destination given means send to base. No player
 * choice of targets — moves the strongest enemy unit at a battlefield to base, then duels it
 * against the weakest OTHER enemy unit already in base (if one exists).
 */
export const dragonsRage: SpecialCaseHandler = {
  cardId: "dragons-rage",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let moveTarget: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId || instance.zone !== "battlefield") continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!moveTarget || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, moveTarget, "none")) {
        moveTarget = instance;
      }
    }
    if (!moveTarget || moveTarget.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[moveTarget.battlefieldIndex];
    slot.units[enemyId] = slot.units[enemyId].filter((id) => id !== moveTarget!.instanceId);
    moveTarget.zone = "base";
    moveTarget.battlefieldIndex = null;
    ctx.game.players[enemyId].base.push(moveTarget.instanceId);

    let duelTarget: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId || instance.zone !== "base") continue;
      if (instance.instanceId === moveTarget.instanceId) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!duelTarget || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, duelTarget, "none")) {
        duelTarget = instance;
      }
    }
    if (duelTarget) dealMutualMightDamage(ctx.game, moveTarget, duelTarget);
  },
};
