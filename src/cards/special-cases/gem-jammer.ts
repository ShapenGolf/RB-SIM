import type { SpecialCaseHandler } from "./types";

/** When you play me, give a unit [Ganking] this turn. */
export const gemJammer: SpecialCaseHandler = {
  cardId: "gem-jammer",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    target.grantedThisTurn.push({ keyword: "ganking" });
  },
};
