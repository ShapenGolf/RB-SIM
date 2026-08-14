import type { SpecialCaseHandler } from "./types";

const NORMAL_BONUS = 1;
const LEVEL_BONUS = 3;
const LEVEL_THRESHOLD = 6;

/** [Reaction] Give a unit +1 Might this turn. [Level 6] Give it +3 Might this turn instead. */
export const combatExperience: SpecialCaseHandler = {
  cardId: "combat-experience",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    const leveled = ctx.game.players[ctx.instance.controller].xp >= LEVEL_THRESHOLD;
    target.tempMightBonus += leveled ? LEVEL_BONUS : NORMAL_BONUS;
  },
};
