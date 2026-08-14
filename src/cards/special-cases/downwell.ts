import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { returnInstanceToHand } from "./bounce-helpers";

/** Return all units and gear to their owners' hands. */
export const downwell: SpecialCaseHandler = {
  cardId: "downwell",
  onPlay: (ctx) => {
    const targets = Object.values(ctx.game.instances).filter((i) => {
      if (i.instanceId === ctx.instance.instanceId) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion" || type === "gear";
    });
    for (const target of targets) returnInstanceToHand(ctx.game, target.instanceId);
  },
};
