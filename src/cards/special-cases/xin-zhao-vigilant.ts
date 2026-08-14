import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** [Tank] I enter ready if you have two or more other units in your base. */
export const xinZhaoVigilant: SpecialCaseHandler = {
  cardId: "xin-zhao-vigilant",
  selfEntersReady: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const count = controller.base.filter((id) => {
      if (id === ctx.instance.instanceId) return false;
      const instance = ctx.game.instances[id];
      if (!instance) return false;
      const type = getCard(instance.cardId).type;
      return type === "unit" || type === "champion";
    }).length;
    return count >= 2;
  },
};
