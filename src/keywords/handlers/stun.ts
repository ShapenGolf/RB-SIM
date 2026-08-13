import type { KeywordHandler } from "../types";

/** Stun: the unit deals no combat damage this turn. Cleared by the game core at Awaken. */
export const stunHandler: KeywordHandler = {
  name: "stun",
  preventsCombatDamage: (ctx) => Boolean(ctx.instance.statuses.stunned),
};
