import { protectStrongestUnit } from "./death-prevention-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] Choose a friendly unit. The next time it dies this turn, recall it exhausted
 * instead. (Send it to base. This isn't a move.)
 *
 * Uses `statuses.preventNextDeathThisTurn`, checked at the top of game/combat.ts destroyInstance
 * — the single chokepoint every death (combat, spell, or effect) goes through. Reaction timing
 * isn't modeled.
 */
export const highlander: SpecialCaseHandler = {
  cardId: "highlander",
  onPlay: (ctx) => protectStrongestUnit(ctx.game, ctx.instance.controller),
};
