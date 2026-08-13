import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** Give a unit at a battlefield or a gear Temporary. */
export const fadingMemories: SpecialCaseHandler = {
  cardId: "fading-memories",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    const card = getCard(target.cardId);
    const isUnitAtBattlefield = (card.type === "unit" || card.type === "champion") && target.zone === "battlefield";
    if (!isUnitAtBattlefield && card.type !== "gear") return;
    target.statuses.temporary = true;
  },
};
