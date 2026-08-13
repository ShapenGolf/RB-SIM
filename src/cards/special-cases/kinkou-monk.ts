import type { SpecialCaseHandler } from "./types";

/**
 * When you play me, buff up to two other friendly units.
 *
 * Simplification: the play-target picker only supports a single target per play (see
 * docs/data-sourcing.md), so this buffs just the one chosen unit — a legal (if conservative)
 * real play of the card, since "up to two" already allows choosing only one.
 */
export const kinkouMonk: SpecialCaseHandler = {
  cardId: "kinkou-monk",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId || targetInstanceId === ctx.instance.instanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    target.statuses.buffed = true;
  },
};
