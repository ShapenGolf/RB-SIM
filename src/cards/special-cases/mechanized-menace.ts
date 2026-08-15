import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

/** Your Mechs have [Shield]. (+1 Might while they're defenders.) */
export const mechanizedMenace: SpecialCaseHandler = {
  cardId: "mechanized-menace",
  defendingMightBonusForAlly: (ctx, allyInstance) => {
    if (allyInstance.controller !== ctx.instance.controller) return 0;
    const allyCard = getCard(allyInstance.cardId);
    return (allyCard.tags ?? []).includes("Mech") ? 1 : 0;
  },
};
