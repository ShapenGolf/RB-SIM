import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { applyStun } from "./stun";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const LEVEL_THRESHOLD = 6;

/**
 * Move an enemy unit.
 * [Level 6][>] Stun an enemy unit. (While you have 6+ XP, get the effect.)
 *
 * Assumption (see charm.ts): "Move" with no destination given means send to base. No player
 * choice of target — moves the strongest enemy unit at a battlefield (best disruption), and
 * (while at Level 6+) stuns the strongest remaining enemy unit at a battlefield.
 */
export const skywardStrike: SpecialCaseHandler = {
  cardId: "skyward-strike",
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
    if (moveTarget && moveTarget.battlefieldIndex !== null) {
      const slot = ctx.game.battlefields[moveTarget.battlefieldIndex];
      slot.units[enemyId] = slot.units[enemyId].filter((id) => id !== moveTarget!.instanceId);
      moveTarget.zone = "base";
      moveTarget.battlefieldIndex = null;
      ctx.game.players[enemyId].base.push(moveTarget.instanceId);
    }

    if (ctx.game.players[ctx.instance.controller].xp < LEVEL_THRESHOLD) return;
    let stunTarget: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId || instance.zone !== "battlefield") continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!stunTarget || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, stunTarget, "none")) {
        stunTarget = instance;
      }
    }
    if (stunTarget) applyStun(ctx.game, getCard, stunTarget, ctx.instance.controller);
  },
};
