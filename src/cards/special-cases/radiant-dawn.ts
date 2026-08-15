import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * When you stun one or more enemy units, buff a friendly unit.
 *
 * Simplification: no player choice of which unit to buff (see docs/data-sourcing.md) — picks
 * the controller's strongest unit without a buff already.
 */
export const radiantDawn: SpecialCaseHandler = {
  cardId: "radiant-dawn",
  onAllyStun: (ctx) => {
    let best: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      if (instance.statuses.buffed) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!best || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, best, "none")) {
        best = instance;
      }
    }
    if (best) best.statuses.buffed = true;
  },
};
