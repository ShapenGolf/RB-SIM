import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { SpecialCaseEngine } from "./registry";
import { fireTemplatedEffect } from "../../game/templatedEffectEngine";

/** When you hold here, activate the conquer effects of units here. */
export const reckonersArena: SpecialCaseHandler = {
  cardId: "reckoners-arena",
  onBeginningWhileHeld: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    for (const instanceId of [...slot.units[ctx.instance.controller]]) {
      const instance = ctx.game.instances[instanceId];
      if (!instance) continue;
      const card = getCard(instance.cardId);
      fireTemplatedEffect(ctx.game, getCard, card, instance, "onConquer");
      SpecialCaseEngine.onConquer(ctx.game, card, instance, 0);
    }
  },
};
