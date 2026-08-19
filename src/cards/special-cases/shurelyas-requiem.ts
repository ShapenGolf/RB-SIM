import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";

/** [Equip] Rune. When you play this, ready your units. */
export const shurelyasRequiem: SpecialCaseHandler = {
  cardId: "shurelyas-requiem",
  onPlay: (ctx) => {
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const type = getCard(instance.cardId).type;
      if (type === "unit" || type === "champion") readyInstance(ctx.game, getCard, instance.instanceId);
    }
  },
};
