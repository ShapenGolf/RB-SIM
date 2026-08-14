import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

const REDUCTION_PER_GEAR = 1;

/** I cost 1 Energy less for each gear you control. */
export const plazaGuardian: SpecialCaseHandler = {
  cardId: "plaza-guardian",
  costReduction: (ctx) => {
    const gearCount = Object.values(ctx.game.instances).filter(
      (i) => i.controller === ctx.instance.controller && getCard(i.cardId).type === "gear",
    ).length;
    return Math.min(gearCount * REDUCTION_PER_GEAR, ctx.card.energyCost ?? 0);
  },
};
