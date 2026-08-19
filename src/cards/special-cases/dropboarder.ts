import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";

/** When you play me, if you control two or more gear, ready me. */
export const dropboarder: SpecialCaseHandler = {
  cardId: "dropboarder",
  onPlay: (ctx) => {
    let count = 0;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      if (getCard(instance.cardId).type !== "gear") continue;
      count += 1;
    }
    if (count >= 2) readyInstance(ctx.game, getCard, ctx.instance.instanceId);
  },
};
