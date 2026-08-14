import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";

const MAX_MIGHT = 2;

/** When you play me, return all units with 2 Might or less to their owners' hands. */
export const anglerBeast: SpecialCaseHandler = {
  cardId: "angler-beast",
  onPlay: (ctx) => {
    const targets = Object.values(ctx.game.instances).filter((i) => {
      if (i.instanceId === ctx.instance.instanceId) return false;
      const type = getCard(i.cardId).type;
      if (type !== "unit" && type !== "champion") return false;
      return computeMight(ctx.game, getCard, i, "none") <= MAX_MIGHT;
    });
    for (const target of targets) {
      if (target.zone === "battlefield" && target.battlefieldIndex !== null) {
        const slot = ctx.game.battlefields[target.battlefieldIndex];
        slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== target.instanceId);
      } else {
        const owner = ctx.game.players[target.controller];
        owner.base = owner.base.filter((id) => id !== target.instanceId);
      }
      delete ctx.game.instances[target.instanceId];
      ctx.game.players[target.controller].hand.push(target.cardId);
    }
  },
};
