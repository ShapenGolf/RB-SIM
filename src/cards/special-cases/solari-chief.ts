import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";
import { applyStun } from "./stun";

/** When you play me, choose an enemy unit. If it is stunned, kill it. Otherwise, stun it. */
export const solariChief: SpecialCaseHandler = {
  cardId: "solari-chief",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;

    if (target.statuses.stunned) {
      destroyInstance(ctx.game, getCard, targetInstanceId);
    } else {
      applyStun(ctx.game, getCard, target, ctx.instance.controller);
    }
  },
};
