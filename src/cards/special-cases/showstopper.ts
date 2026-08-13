import type { SpecialCaseHandler } from "./types";

/**
 * Buff a friendly unit in your base, then move it to a battlefield. (If it doesn't have a buff,
 * it gets a +1 Might buff.)
 *
 * Simplification: no separate battlefield-choice UI (see docs/data-sourcing.md) — always moves
 * to battlefield 0.
 */
export const showstopper: SpecialCaseHandler = {
  cardId: "showstopper",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller || target.zone !== "base") return;
    target.statuses.buffed = true;

    const controller = ctx.game.players[ctx.instance.controller];
    controller.base = controller.base.filter((id) => id !== targetInstanceId);
    target.zone = "battlefield";
    target.battlefieldIndex = 0;
    ctx.game.battlefields[0].units[ctx.instance.controller].push(targetInstanceId);
  },
};
