import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { applyStun } from "./stun";

/**
 * Stun an enemy unit at a battlefield. You may move a friendly unit to that enemy unit's
 * battlefield.
 *
 * Simplification: no player choice of which friendly unit to move (see docs/data-sourcing.md)
 * — always moves the first friendly unit found in base, if any (the "may" auto-resolves to
 * taking the move, since it has no real downside here).
 */
export const zenithBlade: SpecialCaseHandler = {
  cardId: "zenith-blade",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    if (target.zone !== "battlefield" || target.battlefieldIndex === null) return;
    applyStun(ctx.game, getCard, target, ctx.instance.controller);

    const controller = ctx.game.players[ctx.instance.controller];
    const moverId = controller.base.find((id) => {
      if (id === ctx.instance.instanceId) return false;
      const type = getCard(ctx.game.instances[id]?.cardId ?? "").type;
      return type === "unit" || type === "champion";
    });
    if (!moverId) return;
    const mover = ctx.game.instances[moverId];
    if (!mover) return;
    controller.base = controller.base.filter((id) => id !== moverId);
    mover.zone = "battlefield";
    mover.battlefieldIndex = target.battlefieldIndex;
    ctx.game.battlefields[target.battlefieldIndex].units[ctx.instance.controller].push(moverId);
  },
};
