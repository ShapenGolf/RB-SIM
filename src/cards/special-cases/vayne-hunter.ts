import type { SpecialCaseHandler } from "./types";
import { SpecialCaseEngine } from "./registry";

/**
 * [Assault 3] If an opponent controls a battlefield, I enter ready. When I conquer, you may pay
 * 1 Energy to return me to my owner's hand.
 */
export const vayneHunter: SpecialCaseHandler = {
  cardId: "vayne-hunter",
  selfEntersReady: (ctx) =>
    ctx.game.battlefields.some(
      (b) => b.controller !== null && b.controller !== ctx.instance.controller,
    ),
  onConquer: (ctx) => {
    if (ctx.game.pendingOptionalCost) return;
    SpecialCaseEngine.offerOptionalCost(
      ctx.game,
      ctx.instance.controller,
      "vayne-hunter",
      { energy: 1 },
      ctx.instance.instanceId,
    );
  },
  onOptionalCostPaid: (game, _playerId, payload) => {
    if (!payload) return;
    const target = game.instances[payload];
    if (!target) return;
    if (target.zone === "battlefield" && target.battlefieldIndex !== null) {
      const slot = game.battlefields[target.battlefieldIndex];
      slot.units[target.controller] = slot.units[target.controller].filter(
        (id) => id !== payload,
      );
    } else {
      const owner = game.players[target.controller];
      owner.base = owner.base.filter((id) => id !== payload);
    }
    delete game.instances[payload];
    const owner = game.players[target.controller];
    owner.hand.push(target.cardId);
  },
};
