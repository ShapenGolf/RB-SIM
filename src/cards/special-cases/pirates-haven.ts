import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

const MIGHT_BONUS = 1;

/** When you ready a friendly unit, give it +1 Might this turn. */
export const piratesHaven: SpecialCaseHandler = {
  cardId: "pirates-haven",
  onAllyBecameReady: (_ctx, readiedInstance) => {
    const type = getCard(readiedInstance.cardId).type;
    if (type !== "unit" && type !== "champion") return;
    readiedInstance.tempMightBonus += MIGHT_BONUS;
  },
};
