import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * I have [Assault] equal to the number of gear you control.
 * The printed keyword list has a flat Assault 1 (presumably a placeholder from the importer,
 * since the real amount is dynamic) — cancel that and add the real count instead.
 */
export const repairSpecialist: SpecialCaseHandler = {
  cardId: "repair-specialist",
  attackingMightModifier: (ctx) => {
    const gearCount = Object.values(ctx.game.instances).filter(
      (i) => i.controller === ctx.instance.controller && getCard(i.cardId).type === "gear",
    ).length;
    return gearCount - 1;
  },
};
