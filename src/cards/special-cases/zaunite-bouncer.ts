import type { SpecialCaseHandler } from "./types";

/** When you play me, return another unit at a battlefield to its owner's hand. */
export const zauniteBouncer: SpecialCaseHandler = {
  cardId: "zaunite-bouncer",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId || targetInstanceId === ctx.instance.instanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield" || target.battlefieldIndex === null) return;

    const slot = ctx.game.battlefields[target.battlefieldIndex];
    slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    delete ctx.game.instances[targetInstanceId];
    ctx.game.players[target.controller].hand.push(target.cardId);
  },
};
