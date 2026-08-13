import type { KeywordHandler } from "../types";

/**
 * Deflect: if targeted by a spell or ability, the targeting player must pay
 * or recycle extra Rune(s) as a cost; if unwilling/unable, the card is an
 * illegal target. `value` is the extra Rune amount (defaults to 1).
 */
export const deflectHandler: KeywordHandler = {
  name: "deflect",
  extraTargetingCost: (ctx) => ctx.keyword.value ?? 1,
};
