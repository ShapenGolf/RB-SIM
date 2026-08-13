import type { SpecialCaseHandler } from "./types";

/** When you stun an enemy unit, ready me and give me +1 Might this turn. */
export const eclipseHerald: SpecialCaseHandler = {
  cardId: "eclipse-herald",
  onAllyStun: (ctx) => {
    ctx.instance.exhausted = false;
    ctx.instance.tempMightBonus += 1;
  },
};
