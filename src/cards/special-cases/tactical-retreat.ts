import { protectStrongestUnit } from "./death-prevention-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] Choose a friendly unit. The next time it would die this turn, heal it, exhaust it,
 * and recall it instead. (Send it to base. This isn't a move.)
 *
 * Identical mechanical effect to highlander.ts: destroyInstance's `preventNextDeathThisTurn`
 * redirect already zeroes damage (heals) and exhausts the recalled unit.
 */
export const tacticalRetreat: SpecialCaseHandler = {
  cardId: "tactical-retreat",
  onPlay: (ctx) => protectStrongestUnit(ctx.game, ctx.instance.controller),
};
