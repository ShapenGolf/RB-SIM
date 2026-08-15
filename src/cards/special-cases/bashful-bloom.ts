import { getCard } from "../db";
import { playTokenToBase } from "./token-helpers";
import type { SpecialCaseHandler } from "./types";

const BASE_COST = 4;

/**
 * 4 Energy, Exhaust: Play a ready 3 Might Sprite unit token with [Temporary]. This ability
 * costs 1 Energy less for each friendly unit with [Temporary].
 */
export const bashfulBloom: SpecialCaseHandler = {
  cardId: "bashful-bloom",
  activatedAbilityCost: (ctx) => {
    const temporaryCount = Object.values(ctx.game.instances).filter((i) => {
      if (i.controller !== ctx.instance.controller) return false;
      if (!i.statuses.temporary) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    }).length;
    return { energy: Math.max(0, BASE_COST - temporaryCount), exhaustSelf: true };
  },
  onActivate: (ctx) => {
    const token = playTokenToBase(ctx.game, "token-sprite-temporary", ctx.instance.controller);
    token.exhausted = false;
  },
};
