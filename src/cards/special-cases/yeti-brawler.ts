import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

const THRESHOLD = 3;
const TOKEN_COUNT = 2;

/** When I conquer, if you assigned 3 or more excess damage, play two Gold gear tokens exhausted. */
export const yetiBrawler: SpecialCaseHandler = {
  cardId: "yeti-brawler",
  onConquer: (ctx, excessDamage) => {
    if (excessDamage < THRESHOLD) return;
    for (let i = 0; i < TOKEN_COUNT; i += 1) {
      const token = playTokenToBase(ctx.game, "token-gold-gear", ctx.instance.controller);
      token.exhausted = true;
    }
  },
};
