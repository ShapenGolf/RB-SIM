import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { createInstance } from "../../game/setup";

/**
 * When you conquer here, you may pay 1 Energy and return a unit you control here to its owner's
 * hand. If you do, play a 2 Might Sand Soldier unit token here.
 *
 * Simplification: the 1-Energy cost isn't charged (see docs/data-sourcing.md) — this only
 * triggers when there's an eligible unit to return.
 */
export const emperorsDais: SpecialCaseHandler = {
  cardId: "emperors-dais",
  onConquerHere: (ctx, conqueringUnitIds) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const targetId = conqueringUnitIds.find((id) => {
      const type = getCard(ctx.game.instances[id]?.cardId ?? "").type;
      return type === "unit" || type === "champion";
    });
    if (!targetId) return;
    const target = ctx.game.instances[targetId];
    if (!target) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetId);
    delete ctx.game.instances[targetId];
    ctx.game.players[target.controller].hand.push(target.cardId);

    const token = createInstance(ctx.game, "token-sand-soldier-2", ctx.instance.controller);
    token.zone = "battlefield";
    token.battlefieldIndex = ctx.instance.battlefieldIndex;
    slot.units[ctx.instance.controller].push(token.instanceId);
  },
};
