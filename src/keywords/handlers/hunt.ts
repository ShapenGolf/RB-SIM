import type { KeywordHandler } from "../types";

/** Hunt: "When I Conquer or Hold, my controller gains X XP." */
export const huntHandler: KeywordHandler = {
  name: "hunt",
  xpOnConquerOrHold: (ctx) => ctx.keyword.value ?? 1,
};
