import type { SpecialCaseHandler } from "./types";
import { playCardIgnoringCost } from "../../game/playFree";

/**
 * [Reaction] Banish a friendly unit, then its owner plays it to any battlefield, ignoring its
 * cost.
 *
 * Simplification: no battlefield-choice UI (see docs/data-sourcing.md) — the replayed unit
 * enters base instead, same as the other "banish and replay ignoring cost" cards.
 */
export const thrillOfTheHunt: SpecialCaseHandler = {
  cardId: "thrill-of-the-hunt",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;

    if (target.zone === "battlefield" && target.battlefieldIndex !== null) {
      const slot = ctx.game.battlefields[target.battlefieldIndex];
      slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    } else {
      ctx.game.players[target.controller].base = ctx.game.players[target.controller].base.filter(
        (id) => id !== targetInstanceId,
      );
    }
    const owner = target.controller;
    const cardId = target.cardId;
    delete ctx.game.instances[targetInstanceId];
    ctx.game.players[owner].banishment.push(cardId);
    playCardIgnoringCost(ctx.game, owner, cardId);
  },
};
