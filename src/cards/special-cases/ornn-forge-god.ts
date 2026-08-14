import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** [Deflect 2] [Weaponmaster] I have +1 Might for each friendly gear. */
export const ornnForgeGod: SpecialCaseHandler = {
  cardId: "ornn-forge-god",
  staticMightModifier: (ctx) => {
    let count = 0;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      if (getCard(instance.cardId).type !== "gear") continue;
      count += 1;
    }
    return count;
  },
};
