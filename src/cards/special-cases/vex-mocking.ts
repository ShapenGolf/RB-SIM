import type { SpecialCaseHandler } from "./types";

/**
 * [Shield] [Tank] When you [Stun] an enemy unit at a battlefield, you may move me to that
 * battlefield.
 *
 * Simplification: the "may" auto-resolves to taking the move, since it has no real downside
 * (same precedent as Zenith Blade — see docs/data-sourcing.md).
 */
export const vexMocking: SpecialCaseHandler = {
  cardId: "vex-mocking",
  onAllyStun: (ctx, stunnedInstance) => {
    if (stunnedInstance.zone !== "battlefield" || stunnedInstance.battlefieldIndex === null) return;
    const destination = stunnedInstance.battlefieldIndex;
    if (ctx.instance.zone === "battlefield" && ctx.instance.battlefieldIndex === destination) return;

    if (ctx.instance.zone === "battlefield" && ctx.instance.battlefieldIndex !== null) {
      const oldSlot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
      oldSlot.units[ctx.instance.controller] = oldSlot.units[ctx.instance.controller].filter(
        (id) => id !== ctx.instance.instanceId,
      );
    } else {
      const controller = ctx.game.players[ctx.instance.controller];
      controller.base = controller.base.filter((id) => id !== ctx.instance.instanceId);
    }
    ctx.instance.zone = "battlefield";
    ctx.instance.battlefieldIndex = destination;
    ctx.game.battlefields[destination].units[ctx.instance.controller].push(ctx.instance.instanceId);
  },
};
