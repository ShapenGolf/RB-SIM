import type { SpecialCaseHandler } from "./types";

/** Ready a unit and give it [Assault 3] this turn. */
export const perfectExecution: SpecialCaseHandler = {
  cardId: "perfect-execution",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.exhausted = false;
    target.grantedThisTurn.push({ keyword: "assault", value: 3 });
  },
};
