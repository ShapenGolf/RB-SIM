import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 3;
const XP_ON_WIN = 2;

/** [Action] Give a friendly unit +3 Might this turn. When it wins a combat this turn, gain 2 XP. */
export const grimResolve: SpecialCaseHandler = {
  cardId: "grim-resolve",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    target.tempMightBonus += MIGHT_BONUS;
    target.pendingSurviveCombatXP = XP_ON_WIN;
  },
};
