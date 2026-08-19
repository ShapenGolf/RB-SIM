import type { SpecialCaseHandler } from "./types";
import { gainXP } from "../../game/templatedEffectEngine";

/** When another friendly unit dies, gain 1 XP. */
export const viciousSnapjaws: SpecialCaseHandler = {
  cardId: "vicious-snapjaws",
  onAllyUnitDied: (ctx) => {
    gainXP(ctx.game.players[ctx.instance.controller], 1);
  },
};
