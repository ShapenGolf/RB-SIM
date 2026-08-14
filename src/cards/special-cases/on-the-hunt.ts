import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** Ready your units. */
export const onTheHunt: SpecialCaseHandler = {
  cardId: "on-the-hunt",
  onPlay: (ctx) => {
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const type = getCard(instance.cardId).type;
      if (type === "unit" || type === "champion") instance.exhausted = false;
    }
  },
};
