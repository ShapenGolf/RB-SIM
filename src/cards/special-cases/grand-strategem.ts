import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** Give friendly units +5 Might this turn. */
export const grandStrategem: SpecialCaseHandler = {
  cardId: "grand-strategem",
  onPlay: (ctx) => {
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const type = getCard(instance.cardId).type;
      if (type !== "unit" && type !== "champion") continue;
      instance.tempMightBonus += 5;
    }
  },
};
