import type { SpecialCaseHandler } from "./types";
import { SpecialCaseEngine } from "./registry";

/** When I attack, you may pay Fury Rune to give me [Assault] this turn. (+2 Might while I'm an attacker.) */
export const baccaiReaper: SpecialCaseHandler = {
  cardId: "baccai-reaper",
  onAttack: (ctx) => {
    if (ctx.game.pendingOptionalCost) return;
    SpecialCaseEngine.offerOptionalCost(
      ctx.game,
      ctx.instance.controller,
      "baccai-reaper",
      { energy: 0, runeDomain: "Fury" },
      ctx.instance.instanceId,
    );
  },
  onOptionalCostPaid: (game, _playerId, payload) => {
    const instance = payload ? game.instances[payload] : undefined;
    if (instance) instance.grantedThisTurn.push({ keyword: "assault", value: 2 });
  },
};
