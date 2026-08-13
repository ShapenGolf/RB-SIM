import type { KeywordHandler } from "../types";

/**
 * Ambush: "I may be played to a battlefield where you control Units" and
 * "I have Reaction as long as I'm being played to a battlefield where you
 * control Units."
 */
export const ambushHandler: KeywordHandler = {
  name: "ambush",
  allowsPlayToOccupiedBattlefield: () => true,
  grantsReactionTiming: (ctx) => Boolean(ctx.game.turnPhase === "main"),
};
