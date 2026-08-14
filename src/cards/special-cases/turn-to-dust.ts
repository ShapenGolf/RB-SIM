import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** Give a gear [Temporary]. */
export const turnToDust: SpecialCaseHandler = {
  cardId: "turn-to-dust",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || getCard(target.cardId).type !== "gear") return;
    target.statuses.temporary = true;
  },
};
