import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";

/**
 * When I attack, ready another friendly unit.
 * No player choice among multiple eligible units (same simplification as other onAttack
 * "choose a unit" effects, e.g. Leona, Determined) — readies the first exhausted friendly
 * instance found, checking base first, then each Battlefield in order.
 */
export const twilightReveler: SpecialCaseHandler = {
  cardId: "twilight-reveler",
  onAttack: (ctx) => {
    const controller = ctx.instance.controller;
    const candidateIds = [
      ...ctx.game.players[controller].base,
      ...ctx.game.battlefields.flatMap((slot) => slot.units[controller]),
    ];
    for (const id of candidateIds) {
      if (id === ctx.instance.instanceId) continue;
      const candidate = ctx.game.instances[id];
      if (candidate?.exhausted) {
        readyInstance(ctx.game, getCard, candidate.instanceId);
        return;
      }
    }
  },
};
