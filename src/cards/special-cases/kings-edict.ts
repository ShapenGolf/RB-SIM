import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * Starting with the next player, each other player chooses a unit you don't control that hasn't
 * been chosen for this spell. Kill those units.
 *
 * Simplification: in this 2-player engine there's exactly one other player, and the unit they
 * choose must be their own (the caster controls none of the eligible units) — modeled as the
 * opponent rationally sacrificing their weakest unit (see docs/data-sourcing.md).
 */
export const kingsEdict: SpecialCaseHandler = {
  cardId: "kings-edict",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let weakest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!weakest || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, weakest, "none")) {
        weakest = instance;
      }
    }
    if (weakest) destroyInstance(ctx.game, getCard, weakest.instanceId);
  },
};
