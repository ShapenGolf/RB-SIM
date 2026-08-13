import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** While you have another unit here, I have +1 Might. */
export const trustyRamhound: SpecialCaseHandler = {
  cardId: "trusty-ramhound",
  staticMightModifier: (ctx) => {
    const hasAnotherUnitHere = Object.values(ctx.game.instances).some((i) => {
      if (i.instanceId === ctx.instance.instanceId) return false;
      if (i.controller !== ctx.instance.controller || i.zone !== ctx.instance.zone) return false;
      if (i.zone === "battlefield" && i.battlefieldIndex !== ctx.instance.battlefieldIndex) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion";
    });
    return hasAnotherUnitHere ? 1 : 0;
  },
};
