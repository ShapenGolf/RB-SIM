import type { SpecialCaseHandler } from "./types";
import { createInstance } from "../../game/setup";

/**
 * Choose a unit. Play a ready Reflection unit token to your base. It becomes a copy of that unit.
 * Give it [Temporary].
 * Simplification: rather than a generic blank "Reflection" token that transforms, this directly
 * creates a fresh instance of the target's own card (matching name/Might/keywords exactly, the
 * practical meaning of "a copy") — it just doesn't carry over the original's accumulated damage,
 * buffs, or attached Equipment (see docs/data-sourcing.md).
 */
export const mirrorImage: SpecialCaseHandler = {
  cardId: "mirror-image",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    const controller = ctx.instance.controller;
    const token = createInstance(ctx.game, target.cardId, controller);
    token.exhausted = false;
    token.statuses.temporary = true;
    ctx.game.players[controller].base.push(token.instanceId);
  },
};
