import type { SpecialCaseHandler } from "./types";

/** I have [Assault] equal to the number of enemy units here. (+1 Might while I'm an attacker for each.) */
export const ancientWarmonger: SpecialCaseHandler = {
  cardId: "ancient-warmonger",
  attackingMightModifier: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return 0;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    return slot.units[opponentId].length;
  },
};
