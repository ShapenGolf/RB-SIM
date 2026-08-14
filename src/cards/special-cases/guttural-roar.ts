import type { SpecialCaseHandler } from "./types";

const NORMAL_BONUS = 2;
const EMPOWERED_BONUS = 4;

/** [Action] Give a unit +2 Might this turn. If it's [Empowered], give it +4 Might this turn instead. */
export const gutturalRoar: SpecialCaseHandler = {
  cardId: "guttural-roar",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.tempMightBonus += target.statuses.empowered ? EMPOWERED_BONUS : NORMAL_BONUS;
  },
};
