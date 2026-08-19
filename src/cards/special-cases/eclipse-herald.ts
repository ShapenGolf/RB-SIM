import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";

/** When you stun an enemy unit, ready me and give me +1 Might this turn. */
export const eclipseHerald: SpecialCaseHandler = {
  cardId: "eclipse-herald",
  onAllyStun: (ctx) => {
    readyInstance(ctx.game, getCard, ctx.instance.instanceId);
    ctx.instance.tempMightBonus += 1;
  },
};
