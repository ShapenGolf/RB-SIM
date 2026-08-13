import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** Return a gear to its owner's hand. */
export const factoryRecall: SpecialCaseHandler = {
  cardId: "factory-recall",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || getCard(target.cardId).type !== "gear") return;

    if (target.zone === "battlefield" && target.battlefieldIndex !== null) {
      const slot = ctx.game.battlefields[target.battlefieldIndex];
      slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    } else {
      const owner = ctx.game.players[target.controller];
      owner.base = owner.base.filter((id) => id !== targetInstanceId);
    }
    delete ctx.game.instances[targetInstanceId];
    ctx.game.players[target.controller].hand.push(target.cardId);
  },
};
