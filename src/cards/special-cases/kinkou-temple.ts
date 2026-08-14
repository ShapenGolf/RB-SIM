import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { KeywordEngine } from "../../keywords/registry";

/** Units here with [Tank] have +1 Might. */
export const kinkouTemple: SpecialCaseHandler = {
  cardId: "kinkou-temple",
  staticMightModifierForUnitsHere: (_ctx, targetInstance) => {
    const isTank =
      KeywordEngine.hasKeyword(getCard(targetInstance.cardId), "tank") ||
      targetInstance.grantedThisTurn.some((k) => k.keyword === "tank");
    return isTank ? 1 : 0;
  },
};
