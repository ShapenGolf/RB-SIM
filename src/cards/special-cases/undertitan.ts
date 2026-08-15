import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

/**
 * When you play me, give your other units +2 Might this turn.
 * As I'm revealed from your deck, [Add] 2 Energy.
 * Known gap: "revealed from your deck" isn't a generically tracked trigger point in this
 * engine — only the onPlay bonus is implemented.
 */
export const undertitan: SpecialCaseHandler = {
  cardId: "undertitan",
  onPlay: (ctx) => {
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      if (instance.instanceId === ctx.instance.instanceId) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      instance.tempMightBonus += 2;
    }
  },
};
