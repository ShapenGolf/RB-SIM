import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";

/** Double a friendly unit's Might this turn. Give it Temporary. */
export const lastStand: SpecialCaseHandler = {
  cardId: "last-stand",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    target.tempMightBonus += computeMight(ctx.game, getCard, target, "none");
    target.statuses.temporary = true;
  },
};
