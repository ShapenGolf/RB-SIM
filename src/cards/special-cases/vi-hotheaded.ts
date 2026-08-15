import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";

/** [Deflect] 2 Energy+Fury Rune: Double my Might this turn. */
export const viHotheaded: SpecialCaseHandler = {
  cardId: "vi-hotheaded",
  activatedAbilityCost: { energy: 2, runeDomain: "Fury", exhaustSelf: false },
  onActivate: (ctx) => {
    const current = computeMight(ctx.game, getCard, ctx.instance, "none");
    ctx.instance.tempMightBonus += current;
  },
};
