import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";

/** Ready a unit and give it [Assault 3] this turn. */
export const perfectExecution: SpecialCaseHandler = {
  cardId: "perfect-execution",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    readyInstance(ctx.game, getCard, target.instanceId);
    target.grantedThisTurn.push({ keyword: "assault", value: 3 });
  },
};
