import { getCard } from "../db";
import { moveInstanceToBase } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * When you hold here, you may move a unit at a battlefield to its base.
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — always moves
 * the strongest enemy unit found at any Battlefield (best disruption; no real downside since
 * it never targets the controller's own units).
 */
export const amateurRecital: SpecialCaseHandler = {
  cardId: "amateur-recital",
  onBeginningWhileHeld: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let strongest: string | undefined;
    let strongestMight = -Infinity;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId || instance.zone !== "battlefield") continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      const might = getCard(instance.cardId).might ?? 0;
      if (might > strongestMight) {
        strongestMight = might;
        strongest = instance.instanceId;
      }
    }
    if (strongest) moveInstanceToBase(ctx.game, getCard, strongest);
  },
};
