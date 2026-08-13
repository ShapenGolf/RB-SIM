import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] Give two friendly units each +2 Might this turn.
 *
 * Simplification: the play-target picker only supports a single target per play (see
 * docs/data-sourcing.md), so this buffs just the one chosen unit.
 */
export const backToBack: SpecialCaseHandler = {
  cardId: "back-to-back",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    target.tempMightBonus += 2;
  },
};
